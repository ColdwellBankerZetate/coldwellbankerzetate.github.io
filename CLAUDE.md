# Instrucciones para Claude — mapas de barrios

Repo: `ColdwellBankerZetate/coldwellbankerzetate.github.io` (GitHub Pages, rama `main`, raíz).
Cada barrio se publica en `https://coldwellbankerzetate.github.io/<slug>/`.
El usuario es Mateo (Coldwell Banker Zetaté, Punta del Este). Habla español rioplatense, quiere respuestas cortas y directas.

## Flujo para un barrio nuevo

1. Mateo pasa los links de las fichas, con precio y dormitorios de cada una.
2. Crear `barrios/<slug>.json` copiando `barrios/pueblo-mio.json`: `slug`, `nombre`, `zona`, `bajada` (1 frase sobre el barrio) y la lista `propiedades`.
   - Ficha de amaira (`ficha.amaira.com.ar/...ficha=BPV1234`): poner `codigo` (ej. `BPV1234`), `url`, `precio`, `dormitorios`. `build.py` baja solo coordenadas, lote, hasta 8 fotos, baños y m² desde la API de xintel.
   - Ficha de otra web (ej. inmobiliaria.link bloquea la lectura automática): pedirle a Mateo un pin de Google Maps y cargar `lat`/`lng` a mano, más `lote`, `banos`, `m2_cubiertos` si los tiene.
   - Precio y dormitorios: usar los que diga Mateo. Si no coinciden con la ficha, preguntarle.
3. `python3 build.py barrios/<slug>.json` → genera `<slug>/` (index.html, satelite.jpg, fotos/, logos).
4. **Revisar cada pin antes de publicar**: recortar `satelite.jpg` alrededor de cada coordenada y mirar que caiga sobre una casa. Los pines de las fichas de amaira muchas veces caen en la entrada del barrio, en un camino o en un terreno vacío. Si hay dudas, mostrarle a Mateo cuál está mal y pedirle captura.
5. Para corregir un pin: poner `lat`/`lng` en el JSON y volver a correr el build.
   - Al pasar de píxeles a coordenadas, usar el tamaño REAL de `satelite.jpg` (`Image.open(...).size`) y los `bounds` del `index.html` generado. El recorte cambia cada vez que se mueve un pin.
   - Después de mover un pin, siempre se regenera `satelite.jpg`: hay que subirlo junto con el `index.html`, porque si no el satélite queda corrido respecto de todos los pines.
6. Agregar el barrio a la tabla del `README.md`, commit y push a `main`. Esperar a que el link sirva la versión nueva antes de avisarle a Mateo.

## Diseño (no cambiar sin que Mateo lo pida)

- Todo negro, pines rojos en gota con punto negro, etiqueta con precio y dormitorios.
- Compu: panel negro a la izquierda con el logo centrado, el nombre del barrio en cursiva (Bodoni Moda), stats, filtros por dormitorios y tarjetas con foto. Al pasar el mouse por un pin aparece una ventanita con carrusel de fotos; el click en el pin abre la ficha.
- Celular: solo el mapa. Arriba, el nombre en cursiva centrado, una línea fina y los filtros sin fondo (el elegido en blanco con un punto rojo). Tocar un pin abre la ficha; mantenerlo apretado abre la ventanita con fotos.
- Logos en `assets/` (versiones blancas de Coldwell Banker Global Luxury Zetaté).
- `build.py` envuelve la página en un documento completo con `<meta name="viewport">`: sin eso el celular la muestra como compu.

## Git

- Commits con `user.name "Claude"` y `user.email noreply@anthropic.com`.
- No subir `.cache_tiles/`.
