# Instrucciones para Claude — mapas de Coldwell Banker Zetaté

Repo: `ColdwellBankerZetate/coldwellbankerzetate.github.io` (GitHub Pages, rama `main`, raíz).
Sitio: `https://coldwellbankerzetate.github.io/` — portada con todos los barrios; cada barrio en `/<slug>/`; selección para clientes en `/seleccion/?p=REF1,REF2&para=Nombre`.
El usuario es Mateo (Coldwell Banker Zetaté, Punta del Este). Habla español rioplatense, quiere respuestas cortas y directas.

## Cómo se arma

- `python3 build.py` baja el inventario de Tokko y arma TODO: un mapa por barrio, `index.html` (portada), `seleccion/` y `datos.json`.
- `python3 build.py --offline` usa la última copia local de Tokko (`tokko_cache.json`, no se sube).
- Clave de Tokko: variable `TOKKO_KEY` o archivo local `.tokko_key`. **Nunca** commitearla: el repo es público y la clave da acceso a los contactos de clientes. En GitHub está como secreto `TOKKO_KEY`.
- `.github/workflows/sincronizar.yml` corre el build todos los días y publica si cambió algo en Tokko (también con "Run workflow").
- Plantillas en `plantillas/` (`barrio.html`, `portada.html`, `comun.js` con idiomas/pines/WhatsApp/selección). Logos en `assets/`.
- `sitio.json`: WhatsApp general (para propiedades sin agente con celular) y código de GoatCounter para estadísticas.

## Barrios

- Cada barrio es `barrios/<slug>.json`. Los de Tokko tienen `tokko_location` y traen solas sus propiedades; si aparece una localidad nueva en Tokko, el build crea el JSON solo.
- Barrio con fichas de otras inmobiliarias (ej. Pueblo Mío, de amaira): lista `propiedades` con `codigo`, `url`, `precio`, `dormitorios`; el build baja fotos, lote, baños, m² y coordenadas desde la API de xintel. Fichas de otras webs: `lat`/`lng` a mano.
- Textos por idioma: `bajada` {es,en,pt}, `datos` (chips con amenities, solo datos que salgan de una fuente), `puntos` (amenities en el mapa con lat/lng verificados en el satélite).
- Corregir un pin: lo ideal es corregirlo en Tokko (se arregla solo al sincronizar). Si no, `ajustes`: {"<reference_code>": {"lat":..,"lng":..}} en el JSON del barrio.
- `avisos.txt` lista los pines que comparten coordenadas (ubicación aproximada). En el mapa se muestran separados en un círculo y la ventanita dice "Ubicación aproximada".

## Revisar pines

- `python3 verificar.py <slug>` arma `verificacion/<slug>.jpg` con un recorte del satélite por propiedad.
- `python3 verificar.py zona <lat> <lng> <metros>` arma un recorte con grilla de coordenadas para ubicar casas o amenities.
- Muchas ubicaciones de Tokko son aproximadas (esquinas, calles, centro del barrio). Avisarle a Mateo cuáles están mal; no inventar ubicaciones.

## Diseño (no cambiar sin que Mateo lo pida)

- Todo negro. Pines en gota: rojo = venta, champagne = temporada, blanco = alquiler; terreno = gota con aro. Etiqueta con precio y dormitorios; las etiquetas que se superponen se esconden hasta hacer zoom.
- Compu: panel a la izquierda (logo centrado, nombre en cursiva Bodoni Moda, datos, filtros, tarjetas). Mouse sobre el pin = ventanita con carrusel, precios, tarifas de temporada, Ver ficha, WhatsApp y corazón; click = abre la ficha.
- Celular: solo el mapa; arriba nombre en cursiva centrado, línea fina y filtros sin fondo (elegido en blanco con punto). Tocar pin = ficha; mantener apretado = ventanita.
- Idiomas ES/EN/PT (detecta el del navegador; `?lang=en` fuerza uno).
- WhatsApp: al agente de la propiedad en Tokko (celular UY 5989… o AR 549…); si no tiene, al general de `sitio.json`.
- `build.py` envuelve cada página en un documento completo con `<meta name="viewport">`: sin eso el celular la muestra como compu.

## Git

- Commits con `user.name "Claude"` y `user.email noreply@anthropic.com`.
- No subir `.cache_tiles/`, `tokko_cache.json`, `.tokko_key`, `verificacion/`, `reel/trabajo/`, videos.

## Video para redes

`reel/preparar.py <slug>` + `reel/grabar.js` + ffmpeg arman un reel vertical 1080x1920 (~23 s) que recorre el satélite de pin en pin con foto, precio y datos (ver instrucciones en `reel/preparar.py`). Usa solo propiedades con ubicación verificada.
