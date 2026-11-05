#!/usr/bin/env python3
"""Calcar un masterplan (imagen) sobre el satélite y armar el KML de lotes del desarrollo.

Para desarrollos que no tienen KMZ: el plano de lotes llega como imagen o PDF. Este script
lo ubica sobre el satélite con puntos de control y pasa cada lote a coordenadas, en el mismo
formato que lee build.py (leer_kmz). No publica nada por sí solo: escribe desarrollos/<slug>.kml.

Pasos:
  1. python3 calcar.py <slug> grilla
       -> verificacion/<slug>-grilla.jpg: el masterplan con grilla de píxeles (para leer coordenadas en el plano).
     Para las mismas esquinas en el satélite: python3 verificar.py zona <lat> <lng> <metros>.
  2. Escribir desarrollos/<slug>-calco.json:
       {"control": [{"px": [x, y], "lat": .., "lng": ..}, ...],   # 3 o más (esquinas del predio, cruces de caminos)
        "umbral": 170,           # opcional: gris por debajo del cual es línea (0-255)
        "min_m2": 300, "max_m2": 20000,   # opcional: tamaño de lote aceptado
        "excluir": [ids], "numeros": {"<id>": "<n° de lote>"},   # después de mirar el paso 3
        "areas": {"<id>": "Área verde"},    # regiones que no son lotes, con nombre
        "perimetro": [[x, y], ...],         # opcional, en píxeles del plano
        "lotes": [{"n": "12", "px": [[x, y], ...]}]}   # opcional: lotes dibujados a mano (píxeles)
  3. python3 calcar.py <slug>
       -> desarrollos/<slug>.kml
       -> verificacion/<slug>-lotes.jpg (masterplan con el id de cada región detectada)
       -> verificacion/<slug>-calco.jpg (lotes dibujados sobre el satélite, para revisar que calce)
     Corregir "numeros"/"excluir"/"areas" mirando <slug>-lotes.jpg y repetir.

El masterplan se busca como desarrollos/<slug>-masterplan.(jpg|png|webp); un PDF se pasa antes a imagen con pdftoppm.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
DEV = os.path.join(AQUI, "desarrollos")
VER = os.path.join(AQUI, "verificacion")
ANCHO_TRABAJO = 2000  # el plano se achica a este lado mayor para detectar


def fuente(t):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, t)
    return ImageFont.load_default()


def masterplan(slug):
    for e in (".jpg", ".png", ".webp", ".jpeg"):
        r = os.path.join(DEV, f"{slug}-masterplan{e}")
        if os.path.exists(r):
            return Image.open(r).convert("RGB")
    sys.exit(f"No encuentro desarrollos/{slug}-masterplan.jpg|png|webp")


# ---------- georreferencia: píxel del plano -> lat/lng (afín por mínimos cuadrados) ----------
def ajustar(control):
    if len(control) < 3:
        sys.exit("Hacen falta 3 o más puntos de control")
    lat0 = sum(c["lat"] for c in control) / len(control)
    lng0 = sum(c["lng"] for c in control) / len(control)
    kx, ky = 111320 * math.cos(math.radians(lat0)), 110540
    A = np.array([[c["px"][0], c["px"][1], 1] for c in control], float)
    E = np.array([(c["lng"] - lng0) * kx for c in control])
    N = np.array([(c["lat"] - lat0) * ky for c in control])
    ce, *_ = np.linalg.lstsq(A, E, rcond=None)
    cn, *_ = np.linalg.lstsq(A, N, rcond=None)
    err = np.hypot(A @ ce - E, A @ cn - N)

    def a_ll(x, y):
        return [round(lat0 + (cn[0] * x + cn[1] * y + cn[2]) / ky, 7), round(lng0 + (ce[0] * x + ce[1] * y + ce[2]) / kx, 7)]
    escala = math.sqrt(abs(ce[0] * cn[1] - ce[1] * cn[0]))  # metros por píxel del plano original
    return a_ll, escala, err


# ---------- detección de lotes: regiones claras encerradas por líneas ----------
def regiones(img, umbral, escala_px_m2, min_m2, max_m2):
    """Devuelve [(id, [(x,y) contorno convexo en píxeles del original], m2)] ordenadas de arriba-izquierda a abajo-derecha."""
    f = min(1.0, ANCHO_TRABAJO / max(img.size))
    chico = img.resize((round(img.width * f), round(img.height * f))) if f < 1 else img
    gris = np.asarray(chico.convert("L"))
    marca = np.where(gris < umbral, -1, 0).astype(np.int32)
    lab = Image.fromarray(marca, mode="I")
    out, k = [], 0
    m2_px = escala_px_m2 / (f * f)
    while True:
        arr = np.asarray(lab)
        libres = np.flatnonzero(arr == 0)
        if not libres.size:
            break
        y, x = divmod(int(libres[0]), arr.shape[1])
        k += 1
        ImageDraw.floodfill(lab, (x, y), k)
        if k % 200 == 0:
            print(f"  … {k} regiones")
    arr = np.asarray(lab)
    for i in range(1, k + 1):
        ys, xs = np.nonzero(arr == i)
        m2 = len(xs) * m2_px
        if m2 < min_m2 or m2 > max_m2:
            continue
        if xs.min() == 0 or ys.min() == 0 or xs.max() == arr.shape[1] - 1 or ys.max() == arr.shape[0] - 1:
            continue  # toca el borde: es el fondo
        casco = envolvente(list(zip(xs.tolist(), ys.tolist())))
        out.append((casco, m2, (xs.mean() / f, ys.mean() / f)))
    out = [([(x / f, y / f) for x, y in c], m2, cen) for c, m2, cen in out]
    out.sort(key=lambda r: (round(r[2][1] / 60), r[2][0]))
    return [(str(n + 1), c, m2, cen) for n, (c, m2, cen) in enumerate(out)]


def envolvente(pts):
    """Casco convexo (cadena monótona) simplificado."""
    pts = sorted(set(pts))
    if len(pts) < 3:
        return pts
    cruz = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    inf, sup = [], []
    for p in pts:
        while len(inf) >= 2 and cruz(inf[-2], inf[-1], p) <= 0:
            inf.pop()
        inf.append(p)
    for p in reversed(pts):
        while len(sup) >= 2 and cruz(sup[-2], sup[-1], p) <= 0:
            sup.pop()
        sup.append(p)
    return simplificar(inf[:-1] + sup[:-1], 1.5)


def simplificar(anillo, tol):
    """Douglas-Peucker sobre un anillo cerrado."""
    def dp(p):
        if len(p) < 3:
            return p
        a, b = np.array(p[0], float), np.array(p[-1], float)
        d = b - a
        nd = np.hypot(*d) or 1
        dist = [abs(d[0] * (q[1] - a[1]) - d[1] * (q[0] - a[0])) / nd for q in p[1:-1]]
        i = int(np.argmax(dist)) + 1
        return dp(p[:i + 1])[:-1] + dp(p[i:]) if dist[i - 1] > tol else [p[0], p[-1]]
    if len(anillo) < 5:
        return anillo
    lejos = max(range(len(anillo)), key=lambda i: (anillo[i][0] - anillo[0][0]) ** 2 + (anillo[i][1] - anillo[0][1]) ** 2)
    return dp(anillo[:lejos + 1])[:-1] + dp(anillo[lejos:] + [anillo[0]])[:-1]


# ---------- salida ----------
def kml(nombre, lotes, areas, perimetro):
    def pm(n, c):
        cs = " ".join(f"{lng},{lat},0" for lat, lng in c + c[:1])
        return f"<Placemark><name>{n}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>{cs}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>"
    partes = ['<?xml version="1.0" encoding="UTF-8"?>', '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>', f"<name>{nombre}</name>"]
    if perimetro:
        partes.append(f"<Folder><name>Perímetro</name>{pm('Perímetro', perimetro)}</Folder>")
    partes.append("<Folder><name>Lotes</name>" + "".join(pm(f"Lote {n}", c) for n, c in lotes) + "</Folder>")
    if areas:
        partes.append("<Folder><name>Áreas</name>" + "".join(pm(n, c) for n, c in areas) + "</Folder>")
    partes.append("</Document></kml>")
    return "\n".join(partes)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    slug = sys.argv[1]
    os.makedirs(VER, exist_ok=True)
    img = masterplan(slug)

    if len(sys.argv) > 2 and sys.argv[2] == "grilla":
        g = img.copy()
        d = ImageDraw.Draw(g)
        paso = 100 if max(img.size) <= 3000 else 200
        ft = fuente(max(12, max(img.size) // 120))
        for x in range(0, img.width, paso):
            d.line([(x, 0), (x, img.height)], fill=(255, 0, 0) if x % (paso * 5) == 0 else (255, 140, 140), width=1)
            d.text((x + 2, 2), str(x), fill=(255, 0, 0), font=ft)
        for y in range(0, img.height, paso):
            d.line([(0, y), (img.width, y)], fill=(255, 0, 0) if y % (paso * 5) == 0 else (255, 140, 140), width=1)
            d.text((2, y + 2), str(y), fill=(255, 0, 0), font=ft)
        r = os.path.join(VER, f"{slug}-grilla.jpg")
        g.save(r, quality=85)
        print(f"listo: {r} ({img.width}x{img.height} px)")
        return

    cfg_r = os.path.join(DEV, f"{slug}-calco.json")
    if not os.path.exists(cfg_r):
        sys.exit(f"Falta {cfg_r} con los puntos de control (ver ayuda: python3 calcar.py)")
    cfg = json.load(open(cfg_r, encoding="utf-8"))
    a_ll, escala, err = ajustar(cfg["control"])
    print(f"escala {escala:.3f} m/px · error en los puntos de control: " + ", ".join(f"{e:.1f} m" for e in err))
    if err.max() > 8:
        print("  ¡ojo! algún punto de control queda a más de 8 m: revisarlo")

    excluir = {str(x) for x in cfg.get("excluir", [])}
    numeros = {str(k): str(v) for k, v in cfg.get("numeros", {}).items()}
    areas_cfg = {str(k): v for k, v in cfg.get("areas", {}).items()}
    regs = [] if cfg.get("solo_manual") else regiones(img, cfg.get("umbral", 170), escala * escala, cfg.get("min_m2", 300), cfg.get("max_m2", 20000))

    # vista de control con los ids detectados
    v = img.copy()
    d = ImageDraw.Draw(v, "RGBA")
    ft = fuente(max(14, max(img.size) // 90))
    for i, c, m2, cen in regs:
        col = (120, 120, 120, 90) if i in excluir else ((60, 160, 60, 90) if i in areas_cfg else (227, 20, 30, 70))
        d.polygon(c, outline=col[:3] + (255,), fill=col)
        etiqueta = f"{i}" + (f"→{numeros[i]}" if i in numeros else "")
        d.text(cen, etiqueta, fill=(0, 0, 0), font=ft, anchor="mm", stroke_width=3, stroke_fill=(255, 255, 255))
    v.save(os.path.join(VER, f"{slug}-lotes.jpg"), quality=85)

    lotes, areas = [], []
    for i, c, m2, cen in regs:
        if i in excluir:
            continue
        ll = [a_ll(x, y) for x, y in c]
        if i in areas_cfg:
            areas.append((areas_cfg[i], ll))
        else:
            lotes.append((numeros.get(i, i), ll))
    for lt in cfg.get("lotes", []):
        lotes.append((str(lt["n"]), [a_ll(x, y) for x, y in lt["px"]]))
    per = [a_ll(x, y) for x, y in cfg["perimetro"]] if cfg.get("perimetro") else None
    nombre = json.load(open(os.path.join(DEV, f"{slug}.json"), encoding="utf-8")).get("nombre", slug) if os.path.exists(os.path.join(DEV, f"{slug}.json")) else slug
    open(os.path.join(DEV, f"{slug}.kml"), "w", encoding="utf-8").write(kml(nombre, lotes, areas, per))
    print(f"listo: desarrollos/{slug}.kml · {len(lotes)} lotes, {len(areas)} áreas · revisar verificacion/{slug}-lotes.jpg")

    # sobre el satélite
    sys.path.insert(0, AQUI)
    from verificar import recorte
    todos = [p for _, c in lotes + areas for p in c] + (per or [])
    if not todos:
        return
    la = [p[0] for p in todos]; ln = [p[1] for p in todos]
    clat, clng = (min(la) + max(la)) / 2, (min(ln) + max(ln)) / 2
    lado = max((max(la) - min(la)) * 110540, (max(ln) - min(ln)) * 111320 * math.cos(math.radians(clat))) * 1.25 + 60
    z = 18 if lado <= 500 else (17 if lado <= 1200 else 16)
    try:
        sat, px, _ = recorte(clat, clng, lado, z)
    except Exception as e:
        print(f"  no pude bajar el satélite ({e}); el KML quedó igual — revisarlo en el mapa del build")
        return
    d = ImageDraw.Draw(sat, "RGBA")
    ft = fuente(13)
    if per:
        d.polygon([px(*p) for p in per], outline=(200, 178, 138, 255), width=3)
    for n, c in areas:
        d.polygon([px(*p) for p in c], outline=(170, 210, 170, 255), fill=(111, 165, 111, 70))
    for n, c in lotes:
        pts = [px(*p) for p in c]
        d.polygon(pts, outline=(255, 255, 255, 230), fill=(255, 255, 255, 25))
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        d.text((cx, cy), n, fill=(255, 255, 255), font=ft, anchor="mm", stroke_width=2, stroke_fill=(0, 0, 0))
    for c in cfg["control"]:
        x, y = px(c["lat"], c["lng"])
        d.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(227, 20, 30, 255), width=2)
    r = os.path.join(VER, f"{slug}-calco.jpg")
    sat.save(r, quality=85)
    print(f"listo: {r}")


if __name__ == "__main__":
    main()
