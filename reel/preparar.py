#!/usr/bin/env python3
"""Prepara el video de un barrio: satélite, fotos y recorrido.

  python3 reel/preparar.py <slug> [solo-venta]
  (desde la raíz del repo) python3 -m http.server 8777 &   y después   node reel/grabar.js   (PORT=xxxx si usás otro puerto)
  ffmpeg -framerate 30 -i reel/trabajo/cuadros/%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart reel/<slug>.mp4

Máximo 6 propiedades (las primeras de venta, más caras primero si hay muchas). Necesita Pillow.
"""
import json, math, os, sys, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
from verificar import recorte

slug = sys.argv[1]
d = json.load(open(os.path.join(AQUI, "..", "datos.json"), encoding="utf-8"))
P = [p for p in d["propiedades"] if p["barrio"] == slug and not p.get("aprox") and p["fotos"]]
ventas = [p for p in P if p["ops"][0]["tipo"] == "venta"]
P = (ventas or P)[:6]
nombre = P[0]["barrio_nombre"]
lat = (max(p["lat"] for p in P) + min(p["lat"] for p in P)) / 2
lng = (max(p["lng"] for p in P) + min(p["lng"] for p in P)) / 2
span = max((max(p["lat"] for p in P) - min(p["lat"] for p in P)) * 111320,
           (max(p["lng"] for p in P) - min(p["lng"] for p in P)) * 111320 * math.cos(math.radians(lat)))
trab = os.path.join(AQUI, "trabajo"); os.makedirs(os.path.join(trab, "fotos"), exist_ok=True)
img, px, _ = recorte(lat, lng, max(900, span * 1.35), 17)
img.save(os.path.join(trab, "satelite.jpg"), quality=88)
props = []
for i, p in enumerate(P):
    x, y = px(p["lat"], p["lng"])
    f = f"fotos/{i}.jpg"
    open(os.path.join(trab, f), "wb").write(urllib.request.urlopen(urllib.request.Request(p["fotos"][0], headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read())
    props.append({"x": x, "y": y, "precio": p["ops"][0]["precio"], "dorm": p["dormitorios"], "banos": p["banos"],
                  "m2": p["m2_cubiertos"], "lote": p["lote"], "tipo": p["tipo"].capitalize(), "foto": f})
# recorrido: ordenar de este a oeste para que la cámara no salte
props.sort(key=lambda q: (-q["x"]))
n = len(props)
tipo = "casas en venta" if ventas else "propiedades"
json.dump({"w": img.width, "h": img.height, "props": props, "nombre": nombre, "sub": f"{n} {tipo}",
           "url": f"coldwellbankerzetate.github.io/{slug}"}, open(os.path.join(trab, "datos.json"), "w"), ensure_ascii=False)
print(f"listo: {n} propiedades, satélite {img.size}")
