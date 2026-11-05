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

Disponibilidad (agenda de temporada): planilla de Google con una fila por casa (la arma planilla.py)
y columna Ocupado con las fechas tomadas, ej. "26/12-10/1, 15/1 al 27/1" (inclusive; sin año = la
temporada que viene). Vacío = esa casa no muestra agenda; "libre" = todo libre. Se configura en sitio.json,
"disponibilidad": id de la planilla (compartida "cualquiera con el link puede ver") o URL de un CSV.

Desarrollos (edificios y barrios que se venden por lotes): salen solos de los emprendimientos de
Tokko (con sus unidades) y cada uno tiene su JSON en desarrollos/<slug>.json para textos, estado,
entrega, fotos o ubicación a mano. Un desarrollo que todavía no está en Tokko se agrega creando ese JSON.
Se ven en la portada deslizando el título a "Desarrollos" y cada uno en /desarrollos/<slug>/.

Para corregir un pin: en el JSON del barrio, "ajustes": {"<referencia>": {"lat":..,"lng":..}}.
Las referencias son el reference_code de Tokko (ej. CHO8077066) o el código de amaira.
"""
import csv, datetime, io, zipfile, xml.etree.ElementTree as ET, json, math, os, re, statistics, sys, unicodedata, urllib.parse, urllib.request

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
        **({"dev_id": (p.get("development") or {}).get("id")} if (p.get("development") or {}).get("id") else {}),
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
        **({"aprox": True} if p.get("aprox") else {}),
    }


# ---------------------------------------------------------------- desarrollos
def tokko_desarrollos(offline):
    """Emprendimientos de Tokko (edificios, barrios, loteos). Si falla, sigue con los que vienen dentro de las propiedades."""
    cache = os.path.join(AQUI, "tokko_desarrollos_cache.json")
    if offline or not TOKKO_KEY:
        return json.load(open(cache, encoding="utf-8")) if os.path.exists(cache) else []
    out, off = [], 0
    try:
        while True:
            q = urllib.parse.urlencode({"key": TOKKO_KEY, "format": "json", "lang": "es_ar", "limit": 50, "offset": off})
            d = bajar_json(f"{TOKKO}development/?{q}")
            out += d["objects"]
            off += 50
            if not d["meta"].get("next"):
                break
    except Exception as e:
        print(f"  ! no pude bajar los emprendimientos de Tokko ({e}); uso la última copia")
        return json.load(open(cache, encoding="utf-8")) if os.path.exists(cache) else []
    json.dump(out, open(cache, "w", encoding="utf-8"), ensure_ascii=False)
    return out


def texto_es(v):
    """'texto' o {"es":..,"en":..,"pt":..} → dict por idioma (o vacío)."""
    if not v:
        return {}
    return v if isinstance(v, dict) else {"es": str(v)}


def limpiar_html(t):
    t = re.sub(r"(?i)<br\s*/?>|</p>", "\n", t or "")
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


EDIFICIO = re.compile(r"(?i)edific|torre|condomin|complejo|apart|residenc|hotel|tower")
LOTEO = re.compile(r"(?i)barrio|loteo|lote|country|chacra|club|pueblo|urbaniz|terreno|parcel")


def clase_desarrollo(tipo, unidades):
    if EDIFICIO.search(tipo or ""):
        return "edificio"
    if LOTEO.search(tipo or ""):
        return "barrio"
    if unidades and sum(u["tipo"] == "terreno" for u in unidades) * 2 >= len(unidades):
        return "barrio"
    return "edificio" if unidades and all(u["tipo"] == "depto" for u in unidades) else "barrio"


# Lugares de referencia para "Ubicación" de los desarrollos (distancia en línea recta, redondeada)
LUGARES = [
    {"nombre": {"es": "José Ignacio", "en": "José Ignacio", "pt": "José Ignacio"}, "lat": -34.8458, "lng": -54.6331},
    {"nombre": {"es": "Manantiales", "en": "Manantiales", "pt": "Manantiales"}, "lat": -34.8990, "lng": -54.8260},
    {"nombre": {"es": "La Barra", "en": "La Barra", "pt": "La Barra"}, "lat": -34.9117, "lng": -54.8593},
    {"nombre": {"es": "Punta del Este", "en": "Punta del Este", "pt": "Punta del Este"}, "lat": -34.9600, "lng": -54.9465},
    {"nombre": {"es": "Laguna Garzón", "en": "Laguna Garzón", "pt": "Lagoa Garzón"}, "lat": -34.8017, "lng": -54.5718},
    {"nombre": {"es": "Aeropuerto de Punta del Este", "en": "Punta del Este airport", "pt": "Aeroporto de Punta del Este"},
     "lat": -34.8551, "lng": -55.0943, "siempre": True},
]


def cercanias(lat, lng):
    ds = sorted(({**l, "km": round(km(lat, lng, l["lat"], l["lng"]), 1)} for l in LUGARES), key=lambda l: l["km"])
    out = [l for l in ds if not l.get("siempre")][:4] + [l for l in ds if l.get("siempre")]
    return [{k: v for k, v in l.items() if k != "siempre"} for l in out if l["km"] >= 0.5]


def area_m2(anillo):
    """Superficie aproximada de un polígono [[lat,lng],...] en m²."""
    if len(anillo) < 3:
        return 0
    lat0 = math.radians(sum(p[0] for p in anillo) / len(anillo))
    xy = [(p[1] * 111320 * math.cos(lat0), p[0] * 110540) for p in anillo]
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(xy, xy[1:] + xy[:1]))) / 2


def dentro(lat, lng, anillo):
    c = False
    for (y1, x1), (y2, x2) in zip(anillo, anillo[1:] + anillo[:1]):
        if (y1 > lat) != (y2 > lat) and lng < (x2 - x1) * (lat - y1) / (y2 - y1 + 1e-15) + x1:
            c = not c
    return c


LOTE_RE = re.compile(r"(?i)^\s*(?:lote|lot|l)?\s*[-nº°#.]*\s*(\d+[a-z]?)\s*$")


def leer_kmz(ruta):
    """KMZ/KML de Google Earth → plano: perímetro, lotes, áreas, líneas y puntos (amenities)."""
    if ruta.startswith("http"):
        with urllib.request.urlopen(urllib.request.Request(ruta, headers=UA), timeout=60) as r:
            crudo = r.read()
    else:
        crudo = open(ruta, "rb").read()
    if crudo[:2] == b"PK":
        z = zipfile.ZipFile(io.BytesIO(crudo))
        nombre = next((n for n in z.namelist() if n.lower().endswith(".kml")), None)
        crudo = z.read(nombre)
    raiz = ET.fromstring(crudo)
    sin_ns = lambda e: e.tag.split("}")[-1]
    coords = lambda txt: [[round(float(p.split(",")[1]), 6), round(float(p.split(",")[0]), 6)]
                          for p in (txt or "").split() if p.count(",") >= 1]
    plano = {"poligonos": [], "lineas": [], "puntos": []}

    def recorrer(e, carpeta):
        for h in e:
            tag = sin_ns(h)
            if tag in ("Folder", "Document"):
                n = next((x.text for x in h if sin_ns(x) == "name"), "") or ""
                recorrer(h, n.strip() or carpeta)
            elif tag == "Placemark":
                n = (next((x.text for x in h if sin_ns(x) == "name"), "") or "").strip()
                for g in h.iter():
                    gt = sin_ns(g)
                    cs = next((x.text for x in g.iter() if sin_ns(x) == "coordinates"), None)
                    if gt == "Polygon":
                        ob = next((x for x in g.iter() if sin_ns(x) == "outerBoundaryIs"), g)
                        cs = next((x.text for x in ob.iter() if sin_ns(x) == "coordinates"), None)
                        anillo = coords(cs)
                        if len(anillo) > 1 and anillo[0] == anillo[-1]:
                            anillo = anillo[:-1]
                        if len(anillo) >= 3:
                            plano["poligonos"].append({"nombre": n, "carpeta": carpeta, "c": anillo})
                    elif gt == "LineString":
                        plano["lineas"].append({"nombre": n, "c": coords(cs)})
                    elif gt == "Point" and cs:
                        p = coords(cs)
                        if p:
                            plano["puntos"].append({"nombre": n, "carpeta": carpeta, "lat": p[0][0], "lng": p[0][1]})
    recorrer(raiz, "")
    # clasificar: lotes (nombre "12", "Lote 12" o carpeta de lotes), perímetro (el más grande o así llamado), áreas
    polis = plano["poligonos"]
    for p in polis:
        p["m2"] = round(area_m2(p["c"]))
    per = next((p for p in polis if re.search(r"(?i)per[ií]metro|l[ií]mite|predio|master", p["nombre"] + " " + p["carpeta"])), None)
    if not per and polis:
        grande = max(polis, key=lambda p: p["m2"])
        if grande["m2"] > 4 * sorted(p["m2"] for p in polis)[len(polis) // 2]:
            per = grande
    lotes, areas = [], []
    for p in polis:
        if p is per:
            continue
        m = LOTE_RE.match(p["nombre"])
        if m or re.search(r"(?i)lote|lots?\b|parcela", p["carpeta"]):
            lotes.append({"n": m.group(1) if m else p["nombre"], "c": p["c"], "m2": p["m2"]})
        else:
            areas.append({"nombre": p["nombre"], "c": p["c"], "m2": p["m2"]})
    return {"perimetro": per["c"] if per else None, "ha": round(per["m2"] / 10000) if per else None,
            "lotes": lotes, "areas": areas, "lineas": [l for l in plano["lineas"] if len(l["c"]) > 1],
            "puntos": [p for p in plano["puntos"] if p["nombre"] and not LOTE_RE.match(p["nombre"])]}


def archivo_dev(c, slug, clave, exts):
    """Archivo del desarrollo: URL o nombre en el JSON, o desarrollos/<slug>.<ext> en el repo."""
    v = c.get(clave)
    if v:
        return v if v.startswith("http") else os.path.join(AQUI, "desarrollos", v)
    for e in exts:
        r = os.path.join(AQUI, "desarrollos", slug + e)
        if os.path.exists(r):
            return r
    return None


def armar_desarrollos(tokko, todas, sitio, wa_general, avisos):
    """Desarrollos de Tokko + los que se cargan a mano en desarrollos/*.json. Devuelve el resumen para la portada."""
    carpeta = os.path.join(AQUI, "desarrollos")
    os.makedirs(carpeta, exist_ok=True)
    devs = {}
    for p in tokko:  # los que vienen dentro de las propiedades (por si falla el endpoint)
        d = p.get("development") or {}
        if d.get("id"):
            devs.setdefault(d["id"], d)
    for d in tokko_desarrollos("--offline" in sys.argv):
        if d.get("id"):
            devs[d["id"]] = {**devs.get(d["id"], {}), **d}
    configs = {}
    for f in sorted(os.listdir(carpeta)):
        if f.endswith(".json"):
            c = json.load(open(os.path.join(carpeta, f), encoding="utf-8"))
            c.setdefault("slug", f[:-5])
            configs[c["slug"]] = c
    por_id = {c.get("tokko_id"): c for c in configs.values() if c.get("tokko_id")}
    for i, d in devs.items():
        if d.get("display_on_web") is False and i not in por_id:
            continue
        if i not in por_id:
            nombre = (d.get("name") or "").strip()
            if not nombre:
                continue
            slug = slugify(nombre)
            while slug in configs:
                slug += "-" + str(i)
            c = {"slug": slug, "tokko_id": i, "nombre": nombre, "clase": "", "estado": {}, "entrega": "",
                 "bajada": {}, "datos": [], "puntos": []}
            json.dump(c, open(os.path.join(carpeta, slug + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            configs[slug] = por_id[i] = c
            print(f"  + desarrollo nuevo desde Tokko: {nombre}")
    unidades_de = {}
    for p in todas:
        if p.get("dev_id"):
            unidades_de.setdefault(p["dev_id"], []).append(p)
    for d in devs.values():
        extra = {k: (len(v) if isinstance(v, list) else v) for k, v in d.items() if k in ("files", "videos", "tags", "type", "construction_status", "construction_date")}
        print(f"  tokko emprendimiento {d.get('name')}: campos {sorted(d)} {json.dumps(extra, ensure_ascii=False)[:300]}")
    resumen = []
    for slug, c in sorted(configs.items()):
        if c.get("ocultar"):
            continue
        d = devs.get(c.get("tokko_id")) or {}
        uni = [dict(u) for u in unidades_de.get(c.get("tokko_id"), [])]
        for u in uni:
            u.pop("dev_id", None)
        try:
            lat = float(c["lat"]) if "lat" in c else float(d.get("geo_lat"))
            lng = float(c["lng"]) if "lng" in c else float(d.get("geo_long"))
            if not (lat and lng):
                raise ValueError
        except (TypeError, ValueError, KeyError):
            cerca = uni or []
            if not cerca:
                avisos.append(f"Desarrollo {c.get('nombre', slug)}: sin ubicación (cargala en Tokko o lat/lng en desarrollos/{slug}.json)")
                continue
            lat = statistics.median(u["lat"] for u in cerca)
            lng = statistics.median(u["lng"] for u in cerca)
        fotos_d = sorted(d.get("photos") or [], key=lambda f: (not f.get("is_front_cover"), f.get("order", 0)))
        fotos = c.get("fotos") or [f["image"] for f in fotos_d if not f.get("is_blueprint") and f.get("image")][:MAX_FOTOS * 2]
        if not fotos:
            fotos = [f for u in uni for f in u["fotos"][:1]][:MAX_FOTOS]
        planos = [f["image"] for f in fotos_d if f.get("is_blueprint") and f.get("image")]
        tipo_t = ((d.get("type") or {}).get("name") or "") if isinstance(d.get("type"), dict) else str(d.get("type") or "")
        clase = c.get("clase") or clase_desarrollo(tipo_t, uni)
        loc = d.get("location") if isinstance(d.get("location"), dict) else {}
        partes = [x.strip() for x in (loc.get("full_location") or "").split("|") if x.strip()]
        zona = c.get("zona") or (" · ".join(partes[-2:][::-1]) if len(partes) >= 2 else (loc.get("name") or "Maldonado"))
        # descripción de Tokko (es) + traducciones o reemplazos del JSON
        bajada = {**texto_es(limpiar_html(d.get("description") or d.get("publication_title") or "")), **texto_es(c.get("bajada"))}
        estado = texto_es(c.get("estado"))
        if not estado and isinstance(d.get("construction_status"), str) and d["construction_status"].strip():
            estado = {"es": d["construction_status"].strip()}
        entrega = c.get("entrega") or (d.get("construction_date") if isinstance(d.get("construction_date"), str) else "") or ""
        for u in uni:
            u["barrio"], u["barrio_nombre"] = "desarrollos/" + slug, c.get("nombre") or d.get("name")
        uni.sort(key=lambda p: (p["ops"][0]["tipo"] != "venta", p["ops"][0]["precio"] or 0))
        ventas = [u["ops"][0]["precio"] for u in uni if u["ops"][0]["tipo"] == "venta" and u["ops"][0]["precio"]]
        info = {"slug": slug, "nombre": c.get("nombre") or d.get("name"), "clase": clase, "zona": zona,
                "lat": lat, "lng": lng, "estado": estado, "entrega": entrega, "fotos": fotos, "planos": planos,
                "url": c.get("url") or d.get("web_url") or d.get("public_url") or "",
                "unidades": len(uni), "lotes": sum(u["tipo"] == "terreno" for u in uni),
                "desde_venta": min(ventas) if ventas else None, "destacado": bool(c.get("destacado")),
                "orden": c.get("orden", 100)}
        # plano del KMZ (Google Earth): lotes, perímetro, áreas comunes y amenities
        plano = None
        r_kmz = archivo_dev(c, slug, "kmz", [".kmz", ".kml"])
        if r_kmz:
            try:
                plano = leer_kmz(r_kmz)
                print(f"    plano: {len(plano['lotes'])} lotes, {len(plano['areas'])} áreas, {len(plano['puntos'])} puntos")
            except Exception as e:
                avisos.append(f"Desarrollo {info['nombre']}: no pude leer el KMZ ({e})")
        # lotes en venta de Tokko → polígono del plano (por número de lote o porque el pin cae adentro)
        for u in uni:
            if plano:
                lt = next((l for l in plano["lotes"] if u.get("lote") and str(l["n"]).lower() == str(u["lote"]).lower()), None) \
                     or next((l for l in plano["lotes"] if dentro(u["lat"], u["lng"], l["c"])), None)
                if lt:
                    lt["ref"] = u["ref"]
                    u["lote_plano"] = lt["n"]
        brochure = c.get("brochure") or ""
        r_pdf = archivo_dev(c, slug, "brochure_pdf", [".pdf"])
        if not brochure and r_pdf:
            brochure = r_pdf if r_pdf.startswith("http") else "../" + os.path.basename(r_pdf)
        for f in d.get("files") or []:  # archivos adjuntos del emprendimiento en Tokko
            u_f = f.get("file") or f.get("url") if isinstance(f, dict) else None
            if not brochure and u_f and ".pdf" in u_f.lower():
                brochure = u_f
        kmz_url = ("../" + os.path.basename(r_kmz)) if r_kmz and not r_kmz.startswith("http") else (r_kmz or "")
        m2s = [u["m2_terreno"] for u in uni if u.get("m2_terreno")]
        datos = {"modo": "desarrollo", "slug": slug, "nombre": info["nombre"], "zona": zona, "raiz": "../../",
                 "bajada": bajada, "amenities": c.get("amenities") or c.get("datos") or [],
                 "ventajas": c.get("ventajas") or [], "cifras": c.get("cifras") or [],
                 "puntos": c.get("puntos") or [], "cerca": cercanias(lat, lng),
                 "lotes": [{k: u.get(k) for k in ("ref", "url", "lote", "lote_plano", "m2_terreno", "m2_cubiertos",
                                                   "dormitorios", "tipo", "lat", "lng", "titulo", "agente")}
                           | {"precio": u["ops"][0]["precio"], "op": u["ops"][0]["tipo"], "moneda": u["ops"][0]["moneda"],
                              "foto": (u["fotos"] or [None])[0]} for u in uni],
                 "plano": plano, "brochure": brochure, "kmz": kmz_url, "planos": planos, "video": c.get("video") or "",
                 "m2_rango": [min(m2s), max(m2s)] if m2s else None,
                 "sitio": sitio, "desarrollo": {**info, "wa": c.get("whatsapp") or wa_general}}
        if plano and plano.get("ha"):
            info["ha"] = plano["ha"]
        if plano and plano["lotes"]:
            info["lotes_plano"] = len(plano["lotes"])
        desc = f"{info['nombre']}: {'edificio' if clase == 'edificio' else 'barrio en desarrollo'} de Coldwell Banker Zetaté en {zona}."
        escribir(os.path.join(AQUI, "desarrollos", slug, "index.html"),
                 pagina("desarrollo.html", f"{info['nombre']} · Desarrollos · Coldwell Banker Zetaté", datos, desc))
        resumen.append({k: v for k, v in info.items() if k != "planos"} | {"foto": fotos[0] if fotos else None, "fotos": fotos[:6]})
        print(f"  ok desarrollo {info['nombre']} ({clase}): {len(uni)} unidades")
    resumen.sort(key=lambda b: (not b["destacado"], b["orden"], -b["unidades"], b["nombre"]))
    return resumen


# ---------------------------------------------------------------- disponibilidad
def fecha(texto, hoy):
    """dd/mm/aaaa, dd/mm/aa, aaaa-mm-dd o dd/mm (sin año = la temporada que viene)."""
    t = texto.strip()
    m = re.fullmatch(r"(\d{4})-(\d{1,2})-(\d{1,2})", t)
    if m:
        return datetime.date(int(m[1]), int(m[2]), int(m[3]))
    m = re.fullmatch(r"(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?", t)
    if not m:
        raise ValueError(f"fecha que no entiendo: {texto!r}")
    d, mes = int(m[1]), int(m[2])
    if m[3]:
        a = int(m[3]) + (2000 if len(m[3]) == 2 else 0)
    else:  # temporada de julio a junio
        inicio = hoy.year if hoy.month >= 7 else hoy.year - 1
        a = inicio if mes >= 7 else inicio + 1
    return datetime.date(a, mes, d)


def leer_disponibilidad(sitio, offline, avisos):
    """{referencia: [[desde, hasta], ...]} con los días ocupados (inclusive)."""
    fuente = (sitio.get("disponibilidad") or "").strip()
    cache = os.path.join(AQUI, "disponibilidad_cache.csv")  # puede tener notas internas: no se sube
    texto = None
    if fuente and not offline:
        # por nombre de hoja: "export?format=csv" sin gid baja la PRIMERA hoja, que puede no ser "Disponibilidad"
        url = fuente if fuente.startswith("http") else \
            f"https://docs.google.com/spreadsheets/d/{fuente}/gviz/tq?tqx=out:csv&sheet=Disponibilidad"
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                texto = r.read().decode("utf-8-sig")
            if texto.lstrip().startswith("<"):
                raise ValueError("la planilla no está compartida con 'cualquiera con el link'")
            open(cache, "w", encoding="utf-8").write(texto)
        except Exception as e:
            print(f"  ! no pude leer la planilla de disponibilidad ({e}); uso la última copia")
            texto = None
    if texto is None and os.path.exists(cache):
        texto = open(cache, encoding="utf-8").read()
    if not texto:
        return {}
    hoy = datetime.date.today()
    filas = list(csv.reader(io.StringIO(texto)))
    cab = [slugify(c) for c in filas[0]] if filas else []
    col = lambda *ns: next((cab.index(n) for n in ns if n in cab), None)
    ic = col("codigo", "referencia", "ref", "propiedad")
    io_ = col("ocupado", "ocupada", "reservas")
    id_, ih = col("desde", "entrada"), col("hasta", "salida")
    if ic is None or (io_ is None and id_ is None):
        avisos.append("Disponibilidad: la planilla tiene que tener columnas Propiedad y Ocupado")
        return {}
    out = {}
    for n, f in enumerate(filas[1:], start=2):
        f += [""] * (len(cab) - len(f))
        celda = f[ic].strip().upper()
        m = re.search(r"\(([A-Z]+\d+)\)\s*$", celda)  # "Pinar del Faro · 5 suites (CHO8560119)"
        ref = m.group(1) if m else celda
        if not ref:
            continue
        if io_ is not None:  # "26/12-10/1, 15/1 al 27/1" · "libre" · vacío = no se muestra agenda
            texto_oc = f[io_].strip()
            if not texto_oc:
                continue
            tramos = [] if re.fullmatch(r"(?i)\s*(todo\s+)?libre\s*", texto_oc) else \
                [re.split(r"\s*(?:-|–|al|a|hasta)\s+|\s*[-–]\s*", x.strip(), maxsplit=1)
                 for x in re.split(r"[,;\n]+|\s+y\s+", texto_oc) if x.strip()]
        else:
            tramos = [[f[id_].strip(), f[ih].strip() if ih is not None else ""]]
            tramos = [] if not any(tramos[0]) else tramos
        if ref in out and out[ref] is None:
            continue
        rangos = out.setdefault(ref, [])
        for tr in tramos:
            try:
                d, h = (tr + [""])[:2]
                a = fecha(d or h, hoy)
                b = fecha(h, hoy) if h else a
                if b < a:
                    a, b = b, a
                if b >= hoy - datetime.timedelta(days=31):
                    rangos.append([a.isoformat(), b.isoformat()])
            except ValueError as e:  # fecha mal escrita: mejor no mostrar agenda que mostrarla mal
                avisos.append(f"Disponibilidad, fila {n} ({ref}): {e} — no se muestra su agenda")
                out[ref] = None
                break
    out = {k: sorted(v) for k, v in out.items() if v is not None}
    print(f"  disponibilidad: {len(filas) - 1} filas en la planilla, {len(out)} casas con fechas")
    return out


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
            .replace("__RAIZ__", datos.get("raiz") or "../")
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
    disp = leer_disponibilidad(sitio, offline, avisos)
    sitio = {k: v for k, v in sitio.items() if k != "disponibilidad"}
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
            if p["ref"].upper() in disp:
                p["ocupado"] = disp[p["ref"].upper()]
                # casa sin "Alquiler temporario" en Tokko (solo venta, o mal cargada como alquiler) pero con
                # algo en "Ocupado" de la planilla: se alquila por temporada, precio a consultar
                if p["tipo"] != "terreno" and not any(o["tipo"] == "temporada" for o in p["ops"]):
                    p["ops"].append({"tipo": "temporada", "precio": None, "moneda": "USD", "unidad": None,
                                     "periodos": [], "consultar": True})
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
        props.sort(key=lambda p: (p["ops"][0]["tipo"] != "venta", p["ops"][0]["precio"] or 0))
        datos = {"modo": "barrio", "slug": slug, "raiz": "../", "nombre": c["nombre"], "zona": c.get("zona", ""),
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

    desarrollos = armar_desarrollos(tokko, todo, sitio, wa_general, avisos)
    # Datos de todo el sitio (los usa la página de selección)
    escribir(os.path.join(AQUI, "datos.json"),
             json.dumps({"propiedades": todo, "barrios": resumen, "desarrollos": desarrollos},
                        ensure_ascii=False, separators=(",", ":")))
    # Portada
    resumen.sort(key=lambda b: -b["total"])
    escribir(os.path.join(AQUI, "index.html"),
             pagina("portada.html", "Mapas · Coldwell Banker Zetaté",
                    {"modo": "portada", "barrios": resumen, "desarrollos": desarrollos, "sitio": sitio, "total": len(todo)},
                    f"{len(todo)} propiedades de Coldwell Banker Zetaté en {len(resumen)} barrios de Punta del Este y José Ignacio."))
    # Selección para clientes
    escribir(os.path.join(AQUI, "seleccion", "index.html"),
             pagina("barrio.html", "Selección · Coldwell Banker Zetaté",
                    {"modo": "seleccion", "nombre": "", "zona": "", "bajada": {}, "datos": [], "puntos": [], "raiz": "../",
                     "propiedades": [], "sitio": sitio},
                    "Selección de propiedades de Coldwell Banker Zetaté."))
    refs = {p["ref"].upper() for p in todo}
    avisos += [f"Disponibilidad: el código {r} de la planilla no está en ningún mapa" for r in disp if r not in refs]
    escribir(os.path.join(AQUI, "avisos.txt"), "\n".join(avisos) + "\n")
    print(f"listo: {len(resumen)} barrios, {len(todo)} propiedades, {len(avisos)} pines aproximados (ver avisos.txt)")


if __name__ == "__main__":
    main()
