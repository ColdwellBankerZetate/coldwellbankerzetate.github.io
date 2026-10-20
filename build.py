#!/usr/bin/env python3
"""Arma el mapa interactivo de un barrio.

Uso:  python3 build.py barrios/pueblo-mio.json
Sale: <slug>/index.html + satelite.jpg + fotos/*.jpg (carpeta lista para publicar)

Cada propiedad del JSON lleva al menos "url", "precio" y "dormitorios".
- Si tiene "codigo" de amaira (ej. BPV8877), se bajan solas las
  coordenadas, el lote, la foto, los baños y los m².
- Si no (otra web), cargá a mano "lat", "lng" y opcionalmente
  "lote", "banos", "m2_cubiertos", "foto" (URL de imagen).
"""
import io, json, math, os, re, shutil, sys, urllib.parse, urllib.request
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
API = "https://xintelapi.com.ar/"
API_KEY = "4m17zq256jvsm24wOnqbev43y"
API_GLOBAL = "LU3AIKPR4F6ZSUY8GQODKWRO8"
TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
UA = {"User-Agent": "Mozilla/5.0 (mapa-barrios)"}
MAX_FOTOS = 8


def bajar(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


def ficha_amaira(codigo):
    m = re.match(r"([A-Za-z]+)(\d+)", codigo)
    suc, num = m.group(1).upper(), m.group(2)
    q = urllib.parse.urlencode({
        "json": "fichas.propiedades", "suc": suc, "global": API_GLOBAL,
        "emprendimiento": "True", "apiK": API_KEY, "id": num, "compartida": "true",
    })
    d = json.loads(bajar(API + "?" + q))["resultado"]
    f = d["ficha"][0]
    lat, lng = [float(x) for x in f["in_coo"].split(",")[:2]]
    nom = (f.get("in_nom") or "").strip()
    n = re.search(r"\d+", nom)
    terreno = None
    sup = d.get("superficie") or {}
    for t, v in zip(sup.get("title", []), sup.get("dato", [])):
        if t.lower().startswith("terreno"):
            terreno = float(v.replace("m2", "")) or None
    return {
        "lat": lat, "lng": lng,
        "lote": n.group(0) if n else nom,
        "banos": float(f.get("in_bao") or 0) or None,
        "m2_cubiertos": float(f.get("in_cub") or 0) or None,
        "m2_terreno": terreno,
        "fotos": (d.get("img") or [])[:MAX_FOTOS],
    }


def tile_xy(lat, lng, z):
    n = 2 ** z
    x = (lng + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def tile_latlng(x, y, z):
    n = 2 ** z
    lng = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lat, lng


def armar_satelite(props, z, margen, destino, cache):
    lats = [p["lat"] for p in props]
    lngs = [p["lng"] for p in props]
    dlat = margen / 111320
    dlng = margen / (111320 * math.cos(math.radians(sum(lats) / len(lats))))
    x0, y0 = tile_xy(max(lats) + dlat, min(lngs) - dlng, z)
    x1, y1 = tile_xy(min(lats) - dlat, max(lngs) + dlng, z)
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    img = Image.new("RGB", ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    os.makedirs(cache, exist_ok=True)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            ruta = os.path.join(cache, f"{z}_{x}_{y}.jpg")
            if not os.path.exists(ruta):
                open(ruta, "wb").write(bajar(TILES.format(z=z, x=x, y=y)))
            img.paste(Image.open(ruta), ((x - x0) * 256, (y - y0) * 256))
    img.save(destino, "JPEG", quality=74, optimize=True, progressive=True)
    norte, oeste = tile_latlng(x0, y0, z)
    sur, este = tile_latlng(x1 + 1, y1 + 1, z)
    return [[sur, oeste], [norte, este]], img.size


def main(cfg_path):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    out = os.path.join(AQUI, cfg["slug"])
    shutil.rmtree(os.path.join(out, "fotos"), ignore_errors=True)
    os.makedirs(os.path.join(out, "fotos"), exist_ok=True)

    props = []
    for i, p in enumerate(cfg["propiedades"]):
        p = dict(p)
        if p.get("codigo"):
            auto = ficha_amaira(p["codigo"])
            for k, v in auto.items():
                p.setdefault(k, v)
        if p.get("lat") is None:
            print(f"  ! sin ubicación, queda fuera del mapa: {p['url']}")
            continue
        origen = p.pop("fotos", None) or ([p["foto"]] if p.get("foto") else [])
        p["fotos"] = []
        for k, url in enumerate(origen[:MAX_FOTOS], 1):
            try:
                im = Image.open(io.BytesIO(bajar(url))).convert("RGB")
            except Exception as e:
                print(f"    foto salteada ({e})"); continue
            im.thumbnail((720, 720))
            nombre = f"fotos/{p.get('codigo') or i}-{k}.jpg".lower()
            im.save(os.path.join(out, nombre), "JPEG", quality=76, optimize=True, progressive=True)
            p["fotos"].append(nombre)
        p["foto"] = p["fotos"][0] if p["fotos"] else None
        props.append(p)
        print(f"  ok {p.get('codigo') or p['url']}: lote {p.get('lote')} {p['lat']:.5f},{p['lng']:.5f}")

    props.sort(key=lambda p: p["precio"])
    bounds, size = armar_satelite(props, cfg.get("zoom_imagen", 17), cfg.get("margen_metros", 400),
                                  os.path.join(out, "satelite.jpg"), os.path.join(AQUI, ".cache_tiles"))
    print(f"  satélite {size[0]}x{size[1]}px")

    datos = {
        "nombre": cfg["nombre"], "zona": cfg.get("zona", ""), "bajada": cfg.get("bajada", ""),
        "imagen": "satelite.jpg", "bounds": bounds, "propiedades": props,
    }
    tpl = open(os.path.join(AQUI, "template.html"), encoding="utf-8").read()
    css = open(os.path.join(AQUI, "leaflet.css"), encoding="utf-8").read()
    html = (tpl.replace("/*__LEAFLET_CSS__*/", css)
               .replace("/*__DATOS__*/null", json.dumps(datos, ensure_ascii=False))
               .replace("__NOMBRE__", cfg["nombre"]))
    # Documento completo: sin el viewport el celular dibuja la página a ancho de compu
    cabeza = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              '<meta name="theme-color" content="#0a0a0a">\n'
              '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n')
    corte = html.index('<div class="app">')
    html = cabeza + html[:corte] + "</head>\n<body>\n" + html[corte:] + "\n</body>\n</html>\n"
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    for logo in ("logo-apilado.png", "logo-horizontal.png"):
        shutil.copy(os.path.join(AQUI, "assets", logo), os.path.join(out, logo))
    print(f"listo: {out}/index.html")


if __name__ == "__main__":
    main(sys.argv[1])
