#!/usr/bin/env python3
"""Arma todo el sitio de mapas de Coldwell Banker Zetaté.

Uso:
  python3 build.py            # sincroniza Tokko y arma todos los barrios + portada + selección
  python3 build.py --offline  # usa la última copia de Tokko guardada (tokko_cache.json)

Fuentes de propiedades:
  - Tokko (inventario propio de Coldwell): cada barrio con "tokko_location" trae solas
    todas las propiedades publicadas en esa localidad.
  - Fichas de amaira (otras inmobiliarias): en "propiedades" con "codigo", "url",
    "precio", "dormitorios". El script baja coordenadas, lote, fotos, baños y m².
  - Cualquier otra web: en "propiedades" con "lat" y "lng" a mano.

Para corregir un pin: en el JSON del barrio, "ajustes": {"<referencia>": {"lat":..,"lng":..}}.
Las referencias son el reference_code de Tokko (ej. CHO8077066) o el código de amaira.
"""
import json, math, os, re, statistics, sys, unicodedata, urllib.parse, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (mapas-barrios)"}
MAX_FOTOS = 10

TOKKO = "https://www.tokkobroker.com/api/v1/"
# La clave de Tokko NUNCA va en el repo (es público y la clave da acceso a contactos de clientes).
# Se lee de la variable TOKKO_KEY (secreto de GitHub Actions) o del archivo local .tokko_key (ignorado por git).
TOKKO_KEY = os.environ.get("TOKKO_KEY") or (open(os.path.join(AQUI, ".tokko_key")).read().strip()
                                             if os.path.exists(os.path.join(AQUI, ".tokko_key")) else None)
XINTEL = "https://xintelapi.com.ar/"
XINTEL_KEY = "4m17zq256jvsm24wOnqbev43y"
XINTEL_GLOBAL = "LU3AIKPR4F6ZSUY8GQODKWRO8"


# ---------------------------------------------------------------- utilidades
def bajar_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.loads(r.read())


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def num(x):
    try:
        v = float(x)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


def km(lat1, lng1, lat2, lng2):
    return math.hypot((lat1 - lat2) * 111.32, (lng1 - lng2) * 111.32 * math.cos(math.radians(lat1)))


def whatsapp(*numeros):
    """Primer número que sirva para WhatsApp (celular UY 5989… o AR 549…)."""
    for n in numeros:
        d = re.sub(r"\D", "", n or "")
        if re.fullmatch(r"5989\d{7}", d) or re.fullmatch(r"549\d{10}", d):
            return d
    return None


# ---------------------------------------------------------------- Tokko
def tokko_todo(offline):
    cache = os.path.join(AQUI, "tokko_cache.json")
    if offline and os.path.exists(cache):
        return json.load(open(cache, encoding="utf-8"))
    if not TOKKO_KEY:
        sys.exit("Falta la clave de Tokko: definí TOKKO_KEY o creá el archivo .tokko_key")
    out, off = [], 0
    while True:
        q = urllib.parse.urlencode({"key": TOKKO_KEY, "format": "json", "lang": "es_ar", "limit": 100, "offset": off})
        d = bajar_json(f"{TOKKO}property/?{q}")
        out += d["objects"]
        off += 100
        if not d["meta"]["next"]:
            break
    json.dump(out, open(cache, "w", encoding="utf-8"), ensure_ascii=False)
    return out


def ubicacion_tokko(p):
    lat, lng = float(p["geo_lat"]), float(p["geo_long"])
    dev = p.get("development") or {}
    try:
        dlat, dlng = float(dev.get("geo_lat")), float(dev.get("geo_long"))
    except (TypeError, ValueError):
        return {"lat": lat, "lng": lng}
    if km(lat, lng, dlat, dlng) > 3:
        return {"lat": dlat, "lng": dlng, "aprox": True, "corregido": f"ubicación del emprendimiento {dev.get('name')}"}
    return {"lat": lat, "lng": lng}


TIPO_OP = {"Venta": "venta", "Alquiler temporario": "temporada", "Alquiler": "alquiler"}


def tokko_a_prop(p, wa_general):
    ops = []
    for o in p.get("operations", []):
        tipo = TIPO_OP.get(o["operation_type"])
        if not tipo:
            continue
        precios = [x for x in o.get("prices", []) if x.get("price")]
        if not precios:
            continue
        if tipo == "temporada":
            periodos = [{"periodo": x.get("period") or "", "precio": x["price"], "moneda": x.get("currency", "USD"),
                         "n": x.get("period_number") or 0} for x in precios]
            usd = [x for x in periodos if x["moneda"] == "USD"]
            quinc = [x for x in usd if "quincena" in x["periodo"].lower()]
            base = quinc or usd or periodos
            m = min(base, key=lambda x: x["precio"])
            unidad = "quincena" if quinc else ("mes" if m["periodo"] in MESES else "periodo")
            if m["periodo"].lower() == "por dia":
                unidad = "dia"
            ops.append({"tipo": "temporada", "precio": m["precio"], "moneda": m["moneda"], "unidad": unidad,
                        "periodos": sorted(periodos, key=orden_periodo)})
        else:
            x = precios[0]
            ops.append({"tipo": tipo, "precio": x["price"], "moneda": x.get("currency", "USD"),
                        "unidad": "mes" if tipo == "alquiler" else None})
    orden = {"venta": 0, "temporada": 1, "alquiler": 2}
    ops.sort(key=lambda o: orden[o["tipo"]])
    fotos = sorted(p.get("photos", []), key=lambda f: (not f.get("is_front_cover"), f.get("order", 0)))
    fotos = [f["image"] for f in fotos if not f.get("is_blueprint")][:MAX_FOTOS]
    prod = p.get("producer") or {}
    tipo = p["type"]["name"]
    return {
        "ref": p["reference_code"], "fuente": "tokko",
        "tipo": {"Casa": "casa", "Departamento": "depto", "PH": "depto", "Terreno": "terreno"}.get(tipo, "casa"),
        "titulo": (p.get("publication_title") or "").strip(),
        "url": p["public_url"],
        **ubicacion_tokko(p),
        "lote": (p.get("lot_number") or "").strip() or None,
        "dormitorios": p.get("suite_amount") or None,
        "banos": p.get("bathroom_amount") or None,
        "m2_cubiertos": num(p.get("roofed_surface")) if tipo != "Terreno" else None,
        "m2_terreno": num(p.get("surface")),
        "huespedes": p.get("guests_amount") or None,
        "ops": ops,
        "fotos": fotos,
        "agente": {"nombre": prod.get("name") or "Coldwell Banker Zetaté",
                   "wa": whatsapp(prod.get("cellphone"), prod.get("phone")) or wa_general},
    }


MESES = ["Diciembre", "Enero", "Febrero", "Marzo"]


def orden_periodo(x):
    t = x["periodo"].lower()
    mes = next((i for i, m in enumerate(["diciembre", "fin de año", "enero", "febrero", "marzo", "semana santa"]) if m in t), 9)
    sub = 0 if "1ra" in t else (1 if "2da" in t else 2)
    return (mes, sub)


# ---------------------------------------------------------------- amaira
def ficha_amaira(codigo):
    m = re.match(r"([A-Za-z]+)(\d+)", codigo)
    suc, n = m.group(1).upper(), m.group(2)
    q = urllib.parse.urlencode({"json": "fichas.propiedades", "suc": suc, "global": XINTEL_GLOBAL,
                                "emprendimiento": "True", "apiK": XINTEL_KEY, "id": n, "compartida": "true"})
    d = bajar_json(XINTEL + "?" + q)["resultado"]
    f = d["ficha"][0]
    lat, lng = [float(x) for x in f["in_coo"].split(",")[:2]]
    nom = (f.get("in_nom") or "").strip()
    lote = re.search(r"\d+", nom)
    terreno = None
    sup = d.get("superficie") or {}
    for t, v in zip(sup.get("title", []), sup.get("dato", [])):
        if t.lower().startswith("terreno"):
            terreno = num(v.replace("m2", ""))
    return {"lat": lat, "lng": lng, "lote": lote.group(0) if lote else (nom or None),
            "banos": num(f.get("in_bao")), "m2_cubiertos": num(f.get("in_cub")), "m2_terreno": terreno,
            "fotos": [u.split("?")[0] for u in (d.get("img") or [])][:MAX_FOTOS]}


def manual_a_prop(p, wa_general):
    p = dict(p)
    if p.get("codigo") and "lat" not in p:
        auto = ficha_amaira(p["codigo"])
    elif p.get("codigo"):
        auto = ficha_amaira(p["codigo"])
        auto.pop("lat"), auto.pop("lng")
    else:
        auto = {}
    for k, v in auto.items():
        p.setdefault(k, v)
    if p.get("foto") and not p.get("fotos"):
        p["fotos"] = [p["foto"]]
    op = p.get("operacion", "venta")
    return {
        "ref": p.get("codigo") or p.get("ref") or slugify(p["url"])[-24:], "fuente": "ficha",
        "tipo": p.get("tipo", "casa"), "titulo": p.get("titulo", ""), "url": p["url"],
        "lat": p["lat"], "lng": p["lng"], "lote": p.get("lote"),
        "dormitorios": p.get("dormitorios"), "banos": p.get("banos"),
        "m2_cubiertos": p.get("m2_cubiertos"), "m2_terreno": p.get("m2_terreno"), "huespedes": None,
        "ops": [{"tipo": op, "precio": p["precio"], "moneda": "USD", "unidad": "mes" if op == "alquiler" else None}],
        "fotos": p.get("fotos", []),
        "agente": {"nombre": "Coldwell Banker Zetaté", "wa": wa_general},
    }


# ---------------------------------------------------------------- armado
def leer_plantilla(nombre):
    return open(os.path.join(AQUI, "plantillas", nombre), encoding="utf-8").read()


def pagina(plantilla, titulo, datos, descripcion):
    gc = (datos.get("sitio") or {}).get("goatcounter")
    stats = (f'<script data-goatcounter="https://{gc}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>\n'
             if gc else "")
    css = open(os.path.join(AQUI, "plantillas", "leaflet.css"), encoding="utf-8").read()
    comun = leer_plantilla("comun.js")
    html = (leer_plantilla(plantilla)
            .replace("/*__LEAFLET_CSS__*/", css)
            .replace("/*__COMUN__*/", comun)
            .replace("/*__DATOS__*/null", json.dumps(datos, ensure_ascii=False, separators=(",", ":")))
            .replace("__TITULO__", titulo)
            .replace("__DESCRIPCION__", descripcion))
    cabeza = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              '<meta name="theme-color" content="#0a0a0a">\n'
              f'<meta name="description" content="{descripcion}">\n'
              f'<meta property="og:title" content="{titulo}">\n'
              f'<meta property="og:description" content="{descripcion}">\n'
              '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n' + stats)
    corte = html.index("<!--CUERPO-->")
    return cabeza + html[:corte] + "</head>\n<body>\n" + html[corte:] + "\n</body>\n</html>\n"


def escribir(ruta, texto):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    open(ruta, "w", encoding="utf-8").write(texto)


def main():
    offline = "--offline" in sys.argv
    sitio = json.load(open(os.path.join(AQUI, "sitio.json"), encoding="utf-8"))
    wa_general = sitio["whatsapp_general"]

    tokko = tokko_todo(offline)
    por_loc = {}
    for p in tokko:
        por_loc.setdefault(p["location"]["name"].strip(), []).append(p)

    # Barrio nuevo en Tokko sin config → se crea solo
    configs = {}
    for f in sorted(os.listdir(os.path.join(AQUI, "barrios"))):
        if f.endswith(".json"):
            c = json.load(open(os.path.join(AQUI, "barrios", f), encoding="utf-8"))
            configs[c["slug"]] = c
    tomadas = {c.get("tokko_location") for c in configs.values()}
    for loc in por_loc:
        if loc not in tomadas:
            partes = [x.strip() for x in por_loc[loc][0]["location"]["full_location"].split("|")]
            zona = f"{partes[-2]} · Maldonado" if len(partes) >= 4 else "Maldonado · Uruguay"
            c = {"slug": slugify(loc), "nombre": loc, "zona": zona, "tokko_location": loc,
                 "bajada": {}, "datos": [], "puntos": [], "ajustes": {}}
            json.dump(c, open(os.path.join(AQUI, "barrios", c["slug"] + ".json"), "w", encoding="utf-8"),
                      ensure_ascii=False, indent=2)
            configs[c["slug"]] = c
            print(f"  + barrio nuevo desde Tokko: {loc}")

    todo, resumen, avisos = [], [], []
    for slug, c in sorted(configs.items()):
        props = [tokko_a_prop(p, wa_general) for p in por_loc.get(c.get("tokko_location"), [])]
        props += [manual_a_prop(p, wa_general) for p in c.get("propiedades", [])]
        if not props:
            print(f"  - {c['nombre']}: sin propiedades, no se publica")
            continue
        for p in props:
            aj = (c.get("ajustes") or {}).get(p["ref"])
            if aj:
                p["lat"], p["lng"] = aj["lat"], aj["lng"]
                p["verificado"] = True
            p["barrio"] = slug
            p["barrio_nombre"] = c["nombre"]
        # fuera de zona: a más de 5 km de la mediana del barrio (probable error de carga en Tokko)
        mlat = statistics.median(p["lat"] for p in props)
        mlng = statistics.median(p["lng"] for p in props)
        for p in props:
            d = km(p["lat"], p["lng"], mlat, mlng)
            if d > 5 and not p.get("verificado"):
                p["lejos"] = round(d, 1)
                avisos.append(f"{c['nombre']}: {p['ref']} está a {d:.0f} km del resto del barrio — {p['titulo'][:60]}")
            if p.get("corregido"):
                avisos.append(f"{c['nombre']}: {p['ref']} estaba lejos de su emprendimiento; se usó la {p['corregido']}")
        # pines que comparten coordenadas exactas = ubicación aproximada (centro del barrio)
        cuenta = {}
        for p in props:
            cuenta.setdefault((round(p["lat"], 5), round(p["lng"], 5)), []).append(p)
        for grupo in cuenta.values():
            if len(grupo) > 1:
                for p in grupo:
                    if not p.get("verificado"):
                        p["aprox"] = True
                        avisos.append(f"{c['nombre']}: {p['ref']} comparte ubicación con {len(grupo) - 1} más")
        props.sort(key=lambda p: (p["ops"][0]["tipo"] != "venta", p["ops"][0]["precio"]))
        datos = {"modo": "barrio", "slug": slug, "nombre": c["nombre"], "zona": c.get("zona", ""),
                 "bajada": c.get("bajada") or {}, "datos": c.get("datos") or [], "puntos": c.get("puntos") or [],
                 "propiedades": props, "sitio": sitio}
        desc = f"{len(props)} propiedades de Coldwell Banker Zetaté en {c['nombre']}, sobre mapa satelital."
        escribir(os.path.join(AQUI, slug, "index.html"),
                 pagina("barrio.html", f"{c['nombre']} · Coldwell Banker Zetaté", datos, desc))
        cerca = [p for p in props if not p.get("lejos")] or props
        lat = statistics.median(p["lat"] for p in cerca)
        lng = statistics.median(p["lng"] for p in cerca)
        ventas = [p["ops"][0]["precio"] for p in props if p["ops"][0]["tipo"] == "venta"]
        resumen.append({"slug": slug, "nombre": c["nombre"], "zona": c.get("zona", ""), "lat": lat, "lng": lng,
                        "total": len(props), "foto": next((p["fotos"][0] for p in props if p["fotos"]), None),
                        "ops": [o for o in ("venta", "temporada", "alquiler") if any(x["tipo"] == o for p in props for x in p["ops"])],
                        "desde_venta": min(ventas) if ventas else None})
        todo += props
        print(f"  ok {c['nombre']}: {len(props)} propiedades")

    # Datos de todo el sitio (los usa la página de selección)
    escribir(os.path.join(AQUI, "datos.json"),
             json.dumps({"propiedades": todo, "barrios": resumen}, ensure_ascii=False, separators=(",", ":")))
    # Portada
    resumen.sort(key=lambda b: -b["total"])
    escribir(os.path.join(AQUI, "index.html"),
             pagina("portada.html", "Mapas · Coldwell Banker Zetaté",
                    {"modo": "portada", "barrios": resumen, "sitio": sitio, "total": len(todo)},
                    f"{len(todo)} propiedades de Coldwell Banker Zetaté en {len(resumen)} barrios de Punta del Este y José Ignacio."))
    # Selección para clientes
    escribir(os.path.join(AQUI, "seleccion", "index.html"),
             pagina("barrio.html", "Selección · Coldwell Banker Zetaté",
                    {"modo": "seleccion", "nombre": "", "zona": "", "bajada": {}, "datos": [], "puntos": [],
                     "propiedades": [], "sitio": sitio},
                    "Selección de propiedades de Coldwell Banker Zetaté."))
    escribir(os.path.join(AQUI, "avisos.txt"), "\n".join(avisos) + "\n")
    print(f"listo: {len(resumen)} barrios, {len(todo)} propiedades, {len(avisos)} pines aproximados (ver avisos.txt)")


if __name__ == "__main__":
    main()
