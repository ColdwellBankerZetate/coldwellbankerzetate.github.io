#!/usr/bin/env python3
"""Precios de los desarrollos (solo para el equipo): se suben al repo cifrados.

Las listas de precios, la financiación y los costos extra de cada desarrollo son internos: nunca van en claro al repo
(que es público). Se guardan en `desarrollos/<slug>.precios`, cifrados con la llave pública `interno.pub`:

  - cualquiera puede cifrar (no hace falta la contraseña del equipo: alcanza con interno.pub, que está en el repo);
  - solo quien tiene la contraseña (INTERNO_CLAVE: el build de GitHub) puede descifrar. La llave privada sale de la
    contraseña (PBKDF2), así que no hay otra llave que guardar. Si cambia la contraseña cambia interno.pub y hay que
    volver a cifrar los .precios (el build avisa en avisos.txt).

El build descifra cada .precios, lo cruza con los lotes del plano (m², vendidos, reservados) y lo publica dentro de
interno.dat (cifrado con la contraseña) → botón "Info" del modo interno en la página del desarrollo.

Uso:
    python3 cifrar.py precios/aura.json            → desarrollos/aura.precios  (slug = nombre del archivo)
    python3 cifrar.py lista.json aura              → slug explícito
    python3 cifrar.py --ver desarrollos/aura.precios   (necesita la contraseña: INTERNO_CLAVE o .interno_clave)

El JSON en claro (no se sube; guardarlo en Drive, carpeta "05 Precios" del desarrollo):
{
  "fuente": "Lista de precios oct-2026 (desarrollador)", "fecha": "2026-10", "moneda": "USD",
  "lista": "<link de Drive a la lista original>",
  "lotes": [{"n": "A7", "precio": 403650, "m2": 1035, "sector": "Golf calle",
             "estado": "disponible|reservado|vendido (opcional: si no, el del mapa)",
             "extra": {"Casa": "Colibrí IV", "Lote + casa": 873880}}],
  "planes": [{"nombre": "Etapa 1 · 2 años sin interés", "aplica": "^[A-M]\\\\d+$ (regex sobre el lote, opcional)",
              "pagos": [{"pct": 50, "txt": "Promesa"}, {"pct": 50, "cuotas": 24, "interes": 0, "txt": "Saldo en 24 cuotas"}]}],
  "costos": [{"nombre": "Alhajamiento", "pct": 4, "cuando": "…"}, {"nombre": "Fondo de reserva", "usd_m2": 3},
             {"nombre": "Expensas", "usd_m2_mes": 0.5}],
  "notas": ["…"]
}
Cuotas mensuales; "interes" = % anual (sistema francés). Los % de cada plan tienen que sumar 100.
"""
import base64, hashlib, json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
ITERACIONES = 200000
b64 = lambda b: base64.b64encode(b).decode()
d64 = base64.b64decode


def _x25519():
    from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
    return X25519PrivateKey, X25519PublicKey


def _crudo(llave):
    from cryptography.hazmat.primitives import serialization
    return llave.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)


def privada(clave):
    """Llave privada X25519 derivada de la contraseña del equipo (la misma de interno.dat)."""
    priv, _ = _x25519()
    semilla = hashlib.pbkdf2_hmac("sha256", clave.encode(), b"cbz-precios-x25519", ITERACIONES, 32)
    return priv.from_private_bytes(semilla)


def publica(clave):
    return b64(_crudo(privada(clave).public_key()))


def huella(pub_b64):
    return hashlib.sha256(pub_b64.encode()).hexdigest()[:10]


def _llave_aes(compartido, epub, rpub):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"cbz-precios" + epub + rpub).derive(compartido)


def cifrar(datos, pub_b64):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    priv, pub = _x25519()
    rpub = d64(pub_b64)
    efimera = priv.generate()
    epub = _crudo(efimera.public_key())
    llave = _llave_aes(efimera.exchange(pub.from_public_bytes(rpub)), epub, rpub)
    nonce = os.urandom(12)
    cuerpo = json.dumps(datos, ensure_ascii=False, separators=(",", ":")).encode()
    return {"v": 1, "k": huella(pub_b64), "e": b64(epub), "n": b64(nonce), "c": b64(AESGCM(llave).encrypt(nonce, cuerpo, None))}


def descifrar(obj, clave):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    priv = privada(clave)
    rpub = _crudo(priv.public_key())
    if obj.get("k") and obj["k"] != huella(b64(rpub)):
        raise ValueError("está cifrado con otra contraseña (volver a cifrarlo con el interno.pub de ahora)")
    epub = d64(obj["e"])
    _, pub = _x25519()
    llave = _llave_aes(priv.exchange(pub.from_public_bytes(epub)), epub, rpub)
    return json.loads(AESGCM(llave).decrypt(d64(obj["n"]), d64(obj["c"]), None))


def validar(d):
    """Lista de problemas del JSON de precios (vacía = ok)."""
    mal = []
    if not isinstance(d.get("lotes"), list) or not d["lotes"]:
        return ["falta la lista 'lotes'"]
    vistos = set()
    for k, l in enumerate(d["lotes"]):
        n = str(l.get("n", "")).strip()
        if not n:
            mal.append(f"lote #{k + 1} sin 'n'")
        elif n.lower() in vistos:
            mal.append(f"lote {n} repetido")
        vistos.add(n.lower())
        if l.get("precio") is not None and not isinstance(l["precio"], (int, float)):
            mal.append(f"lote {n}: precio no es un número")
        if l.get("estado") and l["estado"] not in ("disponible", "reservado", "vendido"):
            mal.append(f"lote {n}: estado '{l['estado']}' (usar disponible, reservado o vendido)")
    for p in d.get("planes") or []:
        suma = sum(x.get("pct", 0) for x in p.get("pagos") or [])
        if abs(suma - 100) > .01:
            mal.append(f"plan '{p.get('nombre')}': los pagos suman {suma} %")
        if p.get("aplica"):
            try:
                re.compile(p["aplica"])
            except re.error:
                mal.append(f"plan '{p.get('nombre')}': 'aplica' no es una expresión válida")
    return mal


def clave_local():
    k = os.environ.get("INTERNO_CLAVE", "").strip()
    ruta = os.path.join(AQUI, ".interno_clave")
    if not k and os.path.exists(ruta):
        k = open(ruta, encoding="utf-8").read().strip()
    return k


def main(args):
    if not args:
        sys.exit(__doc__)
    if args[0] == "--ver":
        clave = clave_local()
        if not clave:
            sys.exit("Falta la contraseña (INTERNO_CLAVE o .interno_clave).")
        print(json.dumps(descifrar(json.load(open(args[1])), clave), ensure_ascii=False, indent=1))
        return
    ruta = args[0]
    slug = args[1] if len(args) > 1 else re.sub(r"(-precios)?\.json$", "", os.path.basename(ruta))
    if not os.path.exists(os.path.join(AQUI, "desarrollos", slug + ".json")):
        sys.exit(f"No existe desarrollos/{slug}.json (¿slug mal escrito?)")
    rpub = os.path.join(AQUI, "interno.pub")
    if not os.path.exists(rpub):
        sys.exit("Falta interno.pub: lo escribe el build de GitHub (con la contraseña). Correr 'Run workflow' y hacer git pull.")
    pub = json.load(open(rpub))["x25519"]
    datos = json.load(open(ruta, encoding="utf-8"))
    mal = validar(datos)
    if mal:
        sys.exit("No cifro, hay problemas:\n  " + "\n  ".join(mal))
    destino = os.path.join(AQUI, "desarrollos", slug + ".precios")
    with open(destino, "w") as f:
        json.dump(cifrar(datos, pub), f, separators=(",", ":"))
        f.write("\n")
    precios = [l["precio"] for l in datos["lotes"] if l.get("precio")]
    print(f"ok {os.path.relpath(destino, AQUI)}: {len(datos['lotes'])} lotes, {len(precios)} con precio"
          + (f" (desde {datos.get('moneda', 'USD')} {min(precios):,.0f})" if precios else "")
          + f", {len(datos.get('planes') or [])} planes de pago")


if __name__ == "__main__":
    main(sys.argv[1:])
