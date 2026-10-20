# Mapas de barrios — Coldwell Banker Zetaté

Mapas interactivos con las casas en venta de cada barrio, sobre imagen satelital.
Cada barrio vive en su propia carpeta y se publica en:

`https://coldwellbankerzetate.github.io/<barrio>/`

| Barrio | Link |
|---|---|
| Pueblo Mío | https://coldwellbankerzetate.github.io/pueblo-mio/ |

## Agregar o editar un barrio

1. Crear o editar `barrios/<barrio>.json` (copiá `barrios/pueblo-mio.json` como modelo).
   - Fichas de amaira: alcanza con `codigo`, `url`, `precio` y `dormitorios`.
     El script baja solo coordenadas, lote, fotos, baños y m².
   - Fichas de otras webs: cargar también `lat` y `lng` (y si querés `lote`, `banos`, `m2_cubiertos`, `foto`).
   - Para corregir un pin, poné `lat` y `lng` a mano: pisan lo que trae la ficha.
2. Correr `python3 build.py barrios/<barrio>.json` (necesita Python 3 y Pillow).
3. Subir los cambios a `main`. GitHub Pages lo publica en uno o dos minutos.

## Archivos

- `build.py` — arma la carpeta del barrio (satélite, fotos, página).
- `template.html` — diseño del mapa (compartido por todos los barrios).
- `assets/` — logos.
- `<barrio>/` — sitio publicado de cada barrio (generado, no editar a mano).

Imagen satelital: Esri, Maxar, Earthstar Geographics.
