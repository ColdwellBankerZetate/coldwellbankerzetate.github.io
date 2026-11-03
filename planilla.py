#!/usr/bin/env python3
"""Arma planilla_disponibilidad.csv: una fila por casa de temporada + columna Ocupado vacía.

Uso: python3 planilla.py   (lee datos.json). Sirve para crear la planilla de Google la primera vez
o para ver qué casas nuevas de temporada hay que agregarle (copiar la fila tal cual).
En "Ocupado" van las fechas tomadas, ej. "26/12-10/1, 15/1 al 27/1"; "libre" = todo libre;
vacío = esa casa no muestra agenda. build.py toma el código entre paréntesis del nombre.
"""
import csv, json, os

AQUI = os.path.dirname(os.path.abspath(__file__))


def nombre(p):
    t = p["titulo"].split("–", 1)[-1].strip() if "–" in p["titulo"] else p["titulo"]
    return f"{p['barrio_nombre']} · {t} ({p['ref']})"


def main():
    d = json.load(open(os.path.join(AQUI, "datos.json"), encoding="utf-8"))
    casas = sorted((p for p in d["propiedades"] if any(o["tipo"] == "temporada" for o in p["ops"])),
                   key=lambda p: (p["barrio_nombre"], p["titulo"]))
    sal = os.path.join(AQUI, "planilla_disponibilidad.csv")
    with open(sal, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Propiedad", "Ocupado"])
        for p in casas:
            w.writerow([nombre(p), ""])
    print(f"{sal}: {len(casas)} casas")


if __name__ == "__main__":
    main()
