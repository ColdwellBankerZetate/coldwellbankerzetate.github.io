#!/usr/bin/env python3
"""Ubicar desarrollos sin pin: busca un cruce de calles en OpenStreetMap y arma recortes del satélite.

Lo corre GitHub Actions (.github/workflows/ubicar.yml) porque necesita internet a OpenStreetMap y al satélite.
Para cada desarrollos/<slug>-calco.json que tenga:
    "cruce": ["Hidalgo", "Flamencos"],          # dos calles que se cruzan en el plano (texto que aparece en el nombre)
    "bbox": [sur, oeste, norte, este],          # zona donde buscar (ej. La Barra)
    "recorte": {"norte": 250, "este": 150, "metros": 800}   # opcional: hacia dónde queda el predio desde el cruce
escribe en verificacion/:
    <slug>-ubicacion.json   cruce encontrado + geometría de las dos calles
    <slug>-sat.jpg          satélite con las calles de OSM dibujadas y grilla de coordenadas
    <slug>-sat-limpio.jpg   el mismo recorte sin grilla
y si el calco ya tiene "control", corre calcar.py (KML + <slug>-calco.jpg).
"""
import glob, json, math, os, subprocess, sys, time, urllib.parse, urllib.request
from PIL import ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from verificar import recorte  # noqa: E402

OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.private.coffee/api/interpreter"]


def calles(patron, bbox):
    s, w, n, e = bbox
    q = f'[out:json][timeout:60];way["highway"]["name"~"{patron}",i]({s},{w},{n},{e});out geom;'
    d, ultimo = None, None
    for intento in range(6):
        url = OVERPASS[intento % len(OVERPASS)]
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": "cbz-mapas/1.0"})
            with urllib.request.urlopen(req, timeout=90) as r:
                d = json.load(r)
            break
        except Exception as e:
            ultimo = e
            print(f"  {url}: {e}; reintento")
            time.sleep(5 * (intento + 1))
    if d is None:
        raise ultimo
    return [{"id": w["id"], "nombre": w["tags"].get("name"), "c": [[p["lat"], p["lon"]] for p in w["geometry"]]}
            for w in d["elements"] if w.get("geometry")]


def dist_m(a, b):
    return math.hypot((a[0] - b[0]) * 110540, (a[1] - b[1]) * 111320 * math.cos(math.radians(a[0])))


def cruce(ca, cb):
    """Punto más cercano entre las dos calles (vértices): el cruce, o la esquina si no llegan a tocarse."""
    mejor = None
    for a in ca:
        for b in cb:
            for p in a["c"]:
                for q in b["c"]:
                    d = dist_m(p, q)
                    if mejor is None or d < mejor[0]:
                        mejor = (d, p, q, a["nombre"], b["nombre"])
    d, p, q, na, nb = mejor
    return {"lat": round((p[0] + q[0]) / 2, 7), "lng": round((p[1] + q[1]) / 2, 7), "separacion_m": round(d, 1),
            "calles": [na, nb]}


def main():
    os.makedirs(os.path.join(AQUI, "verificacion"), exist_ok=True)
    for f in sorted(glob.glob(os.path.join(AQUI, "desarrollos", "*-calco.json"))):
        slug = os.path.basename(f)[:-len("-calco.json")]
        cfg = json.load(open(f, encoding="utf-8"))
        if cfg.get("cruce"):
            bbox = cfg.get("bbox") or [-34.93, -54.90, -34.85, -54.75]
            ca, cb = calles(cfg["cruce"][0], bbox), calles(cfg["cruce"][1], bbox)
            print(f"{slug}: {len(ca)} tramos '{cfg['cruce'][0]}', {len(cb)} tramos '{cfg['cruce'][1]}'")
            if not ca or not cb:
                print("  no encontré alguna de las dos calles en OpenStreetMap")
                continue
            c = cruce(ca, cb)
            print(f"  cruce: {c}")
            json.dump({"cruce": c, "a": ca, "b": cb}, open(os.path.join(AQUI, "verificacion", f"{slug}-ubicacion.json"), "w"),
                      ensure_ascii=False)
            rc = cfg.get("recorte") or {}
            lat = c["lat"] + rc.get("norte", 250) / 110540
            lng = c["lng"] + rc.get("este", 150) / (111320 * math.cos(math.radians(c["lat"])))
            metros = rc.get("metros", 800)
            img, px, _ = recorte(lat, lng, metros, 18 if metros <= 600 else 17)
            img.save(os.path.join(AQUI, "verificacion", f"{slug}-sat-limpio.jpg"), quality=88)
            d = ImageDraw.Draw(img)
            for w, col in [(x, (255, 80, 80)) for x in ca] + [(x, (80, 200, 255)) for x in cb]:
                d.line([px(*p) for p in w["c"]], fill=col, width=2)
            x, y = px(c["lat"], c["lng"])
            d.ellipse([x - 7, y - 7, x + 7, y + 7], outline=(255, 255, 0), width=3)
            paso = 50
            mlat, mlng = paso / 110540, paso / (111320 * math.cos(math.radians(lat)))
            for k in range(-30, 31):
                gx, _ = px(lat, lng + k * mlng)
                _, gy = px(lat + k * mlat, lng)
                if 0 <= gx < img.width:
                    d.line([(gx, 0), (gx, img.height)], fill=(255, 255, 0, 120), width=1)
                    d.text((gx + 2, 2 + (k % 2) * 12), f"{lng + k * mlng:.5f}", fill=(255, 255, 0))
                if 0 <= gy < img.height:
                    d.line([(0, gy), (img.width, gy)], fill=(255, 255, 0, 120), width=1)
                    d.text((2, gy + 2), f"{lat + k * mlat:.5f}", fill=(255, 255, 0))
            img.save(os.path.join(AQUI, "verificacion", f"{slug}-sat.jpg"), quality=85)
            print(f"  recorte: verificacion/{slug}-sat.jpg ({img.width}x{img.height}, {metros} m de lado)")
        if cfg.get("control"):
            subprocess.run([sys.executable, os.path.join(AQUI, "calcar.py"), slug], check=False)


if __name__ == "__main__":
    main()
