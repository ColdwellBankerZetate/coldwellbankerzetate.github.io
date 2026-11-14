#!/usr/bin/env python3
"""Bajar la web de un desarrollo (textos, imágenes, logos, tipografías) para armar un brochure con su branding.

Lo corre GitHub Actions (.github/workflows/bajar-web.yml), porque la sesión de Claude no siempre llega a la web
del desarrollador. Lee desarrollos/<slug>-web.json:
    {"url": "https://www.elnido.uy/", "max_paginas": 15}
y deja en web/<slug>/ (rama "verificacion-web"):
    paginas.json          por página: url, título, texto visible, links, colores y fuentes que usa el CSS
    <n>-pagina.html       HTML ya dibujado por el navegador
    <n>-captura.jpg       captura de la página entera (para copiar el diseño)
    recursos/             imágenes, SVG, tipografías y CSS que cargó la página (nombre = hash + extensión)
    recursos.json         url original → archivo, tipo y tamaño
"""
import hashlib, json, os, re, sys, urllib.parse
from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
TOPE = 15 * 1024 * 1024  # no guardar videos enormes
EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/svg+xml": ".svg", "image/gif": ".gif",
       "image/avif": ".avif", "font/woff2": ".woff2", "font/woff": ".woff", "font/ttf": ".ttf", "font/otf": ".otf",
       "application/font-woff2": ".woff2", "application/font-woff": ".woff", "text/css": ".css", "video/mp4": ".mp4"}


def bajar(slug, cfg):
    out = os.path.join(AQUI, "web", slug)
    os.makedirs(os.path.join(out, "recursos"), exist_ok=True)
    inicio = cfg["url"]
    dominio = urllib.parse.urlparse(inicio).netloc.replace("www.", "")
    recursos, paginas = {}, []

    def guardar(resp):
        try:
            url = resp.url
            if url in recursos or url.startswith("data:"):
                return
            tipo = (resp.headers.get("content-type") or "").split(";")[0].strip().lower()
            if not (tipo.startswith(("image/", "font/", "video/")) or tipo in EXT or "font" in tipo):
                return
            cuerpo = resp.body()
            if not cuerpo or len(cuerpo) > TOPE:
                return
            ext = EXT.get(tipo) or os.path.splitext(urllib.parse.urlparse(url).path)[1][:6] or ".bin"
            nombre = hashlib.sha1(url.encode()).hexdigest()[:12] + ext
            open(os.path.join(out, "recursos", nombre), "wb").write(cuerpo)
            recursos[url] = {"archivo": nombre, "tipo": tipo, "bytes": len(cuerpo)}
        except Exception:
            pass

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1440, "height": 900}, locale="es-UY",
                            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36")
        pend, vistas = [inicio], set()
        while pend and len(paginas) < cfg.get("max_paginas", 15):
            url = pend.pop(0).split("#")[0]
            if url in vistas:
                continue
            vistas.add(url)
            pg = ctx.new_page()
            pg.on("response", guardar)
            try:
                pg.goto(url, wait_until="networkidle", timeout=60000)
            except Exception as e:
                print(f"  {url}: {e}")
            # bajar despacio para que carguen las imágenes diferidas
            for _ in range(40):
                pg.mouse.wheel(0, 900)
                pg.wait_for_timeout(250)
            pg.wait_for_timeout(1500)
            n = len(paginas) + 1
            info = pg.evaluate("""() => {
                const cols = new Set(), fuentes = new Set();
                for (const el of document.querySelectorAll('*')) {
                    const s = getComputedStyle(el);
                    cols.add(s.color); cols.add(s.backgroundColor); fuentes.add(s.fontFamily);
                }
                const imgs = [...document.querySelectorAll('img')].map(i => ({src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight}));
                const fondos = [...document.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).filter(x => x && x !== 'none');
                return {titulo: document.title, texto: document.body.innerText,
                        links: [...document.querySelectorAll('a[href]')].map(a => a.href),
                        colores: [...cols].filter(c => c && c !== 'rgba(0, 0, 0, 0)'), fuentes: [...fuentes], imagenes: imgs, fondos: [...new Set(fondos)]};
            }""")
            open(os.path.join(out, f"{n:02d}-pagina.html"), "w", encoding="utf-8").write(pg.content())
            try:
                pg.screenshot(path=os.path.join(out, f"{n:02d}-captura.jpg"), full_page=True, quality=70, type="jpeg")
            except Exception as e:
                print(f"  captura {url}: {e}")
            info["url"] = url
            paginas.append(info)
            print(f"{slug}: {n:02d} {url} — {info['titulo']} ({len(info['texto'])} caracteres)")
            for l in info["links"]:
                u = urllib.parse.urlparse(l)
                if u.netloc.replace("www.", "") == dominio and not re.search(r"\.(pdf|jpg|png|zip|mp4)$", u.path, re.I):
                    limpio = l.split("#")[0]
                    if limpio not in vistas and limpio not in pend:
                        pend.append(limpio)
            pg.close()
        b.close()
    json.dump(paginas, open(os.path.join(out, "paginas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(recursos, open(os.path.join(out, "recursos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{slug}: {len(paginas)} páginas, {len(recursos)} recursos")


def main():
    solo = [s for s in os.environ.get("SOLO", "").replace(",", " ").split() if s]
    for f in sorted(os.listdir(os.path.join(AQUI, "desarrollos"))):
        if not f.endswith("-web.json"):
            continue
        slug = f[:-len("-web.json")]
        if solo and slug not in solo:
            continue
        try:
            bajar(slug, json.load(open(os.path.join(AQUI, "desarrollos", f), encoding="utf-8")))
        except Exception as e:
            print(f"{slug}: falló ({e})")


if __name__ == "__main__":
    main()
