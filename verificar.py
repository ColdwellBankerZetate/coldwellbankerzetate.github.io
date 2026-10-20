#!/usr/bin/env python3
"""Herramienta para revisar pines sobre el satélite (no se publica nada).

  python3 verificar.py <slug>                  -> verificacion/<slug>.jpg con un recorte por propiedad
  python3 verificar.py zona <lat> <lng> [m]    -> verificacion/zona.jpg con grilla cada 50 m y coordenadas

Para pasar un punto de la imagen 'zona' a coordenadas, usá la grilla impresa (lat/lng en los bordes).
"""
import io, json, math, os, sys, urllib.request
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
CACHE = os.path.join(AQUI, ".cache_tiles")


def tile_xy(lat, lng, z):
    n = 2 ** z
    return (lng + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


def xy_latlng(x, y, z):
    n = 2 ** z
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n)))), x / n * 360 - 180


def recorte(lat, lng, metros=120, z=18):
    """Imagen centrada en (lat,lng) de 'metros' de lado + función latlng->pixel."""
    cx, cy = tile_xy(lat, lng, z)
    mpp = 156543.03 * math.cos(math.radians(lat)) / 2 ** z
    half = metros / 2 / mpp / 256
    x0, y0, x1, y1 = int(cx - half), int(cy - half), int(cx + half), int(cy + half)
    img = Image.new("RGB", ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    os.makedirs(CACHE, exist_ok=True)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            ruta = os.path.join(CACHE, f"{z}_{x}_{y}.jpg")
            if not os.path.exists(ruta):
                req = urllib.request.Request(TILES.format(z=z, x=x, y=y), headers={"User-Agent": "Mozilla/5.0"})
                open(ruta, "wb").write(urllib.request.urlopen(req, timeout=30).read())
            img.paste(Image.open(ruta), ((x - x0) * 256, (y - y0) * 256))
    def px(la, ln):
        tx, ty = tile_xy(la, ln, z)
        return (tx - x0) * 256, (ty - y0) * 256
    def ll(px_, py_):
        return xy_latlng(x0 + px_ / 256, y0 + py_ / 256, z)
    a = px(lat, lng)
    caja = (int(a[0] - half * 256), int(a[1] - half * 256), int(a[0] + half * 256), int(a[1] + half * 256))
    img = img.crop(caja)
    return img, (lambda la, ln: (px(la, ln)[0] - caja[0], px(la, ln)[1] - caja[1])), (lambda u, v: ll(u + caja[0], v + caja[1]))


def main():
    os.makedirs(os.path.join(AQUI, "verificacion"), exist_ok=True)
    if sys.argv[1] == "zona":
        lat, lng = float(sys.argv[2]), float(sys.argv[3])
        metros = float(sys.argv[4]) if len(sys.argv) > 4 else 400
        z = 18 if metros <= 500 else (17 if metros <= 1200 else 16)
        img, px, ll = recorte(lat, lng, metros, z)
        d = ImageDraw.Draw(img)
        paso = 50 if metros <= 500 else (100 if metros <= 1200 else 250)
        mlat = paso / 111320
        mlng = paso / (111320 * math.cos(math.radians(lat)))
        for k in range(-40, 41):
            x, _ = px(lat, lng + k * mlng)
            _, y = px(lat + k * mlat, lng)
            if 0 <= x < img.width:
                d.line([(x, 0), (x, img.height)], fill=(255, 255, 0), width=1)
                d.text((x + 2, 2), f"{lng + k * mlng:.5f}", fill=(255, 255, 0))
            if 0 <= y < img.height:
                d.line([(0, y), (img.width, y)], fill=(255, 255, 0), width=1)
                d.text((2, y + 2), f"{lat + k * mlat:.5f}", fill=(255, 255, 0))
        out = os.path.join(AQUI, "verificacion", "zona.jpg")
        img.thumbnail((1400, 1400))
        img.save(out, quality=85)
        print(out)
        return
    slug = sys.argv[1]
    html = open(os.path.join(AQUI, slug, "index.html"), encoding="utf-8").read()
    i = html.index("const DATOS = ") + len("const DATOS = ")
    datos = json.JSONDecoder().raw_decode(html[i:])[0]
    tiles = []
    for p in datos["propiedades"]:
        img, px, _ = recorte(p["lat"], p["lng"], 110, 18)
        img = img.resize((300, 300))
        d = ImageDraw.Draw(img)
        d.ellipse([142, 142, 158, 158], outline="red", width=3)
        d.rectangle([0, 0, 300, 16], fill=(0, 0, 0))
        d.text((4, 2), f"{p['ref']} {'APROX' if p.get('aprox') else ''}", fill=(255, 255, 0))
        tiles.append(img)
    cols = 5
    hoja = Image.new("RGB", (300 * cols, 300 * ((len(tiles) + cols - 1) // cols)))
    for k, im in enumerate(tiles):
        hoja.paste(im, ((k % cols) * 300, (k // cols) * 300))
    out = os.path.join(AQUI, "verificacion", f"{slug}.jpg")
    hoja.save(out, quality=82)
    print(out)


if __name__ == "__main__":
    main()
