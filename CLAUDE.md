# Instrucciones para Claude — mapas de Coldwell Banker Zetaté

Repo: `ColdwellBankerZetate/coldwellbankerzetate.github.io` (GitHub Pages, rama `main`, raíz).
Sitio: `https://coldwellbankerzetate.github.io/` — portada con todos los barrios; cada barrio en `/<slug>/`; selección para clientes en `/seleccion/?p=REF1,REF2&para=Nombre`.
El usuario es Mateo (Coldwell Banker Zetaté, Punta del Este). Habla español rioplatense, quiere respuestas cortas y directas.

## Cómo se arma

- `python3 build.py` baja el inventario de Tokko y arma TODO: un mapa por barrio, `desarrollos/`, `index.html` (portada), `seleccion/` y `datos.json`.
- `python3 build.py --offline` usa la última copia local de Tokko (`tokko_cache.json`, no se sube).
- Clave de Tokko: variable `TOKKO_KEY` o archivo local `.tokko_key`. **Nunca** commitearla: el repo es público y la clave da acceso a los contactos de clientes. En GitHub está como secreto `TOKKO_KEY`.
- `.github/workflows/sincronizar.yml` corre el build cada hora y publica si cambió algo en Tokko o en la planilla de disponibilidad (también con "Run workflow").
- Plantillas en `plantillas/` (`barrio.html`, `portada.html`, `comun.js` con idiomas/pines/WhatsApp/selección). Logos en `assets/`.
- `sitio.json`: WhatsApp general (para propiedades sin agente con celular) y código de GoatCounter para estadísticas.

## Barrios

- Cada barrio es `barrios/<slug>.json`. Los de Tokko tienen `tokko_location` y traen solas sus propiedades; si aparece una localidad nueva en Tokko, el build crea el JSON solo.
- Barrio con fichas de otras inmobiliarias (ej. Pueblo Mío, de amaira): lista `propiedades` con `codigo`, `url`, `precio`, `dormitorios`; el build baja fotos, lote, baños, m² y coordenadas desde la API de xintel. Fichas de otras webs: `lat`/`lng` a mano.
- Textos por idioma: `bajada` {es,en,pt}, `datos` (chips con amenities, solo datos que salgan de una fuente), `puntos` (amenities en el mapa con lat/lng verificados en el satélite).
- Corregir un pin: lo ideal es corregirlo en Tokko (se arregla solo al sincronizar). Si no, `ajustes`: {"<reference_code>": {"lat":..,"lng":..}} en el JSON del barrio.
- `avisos.txt` lista los pines que comparten coordenadas (ubicación aproximada). En el mapa se muestran separados en un círculo y la ventanita dice "Ubicación aproximada".

## Desarrollos (edificios y barrios que se venden por lotes)

- En la portada el título grande se desliza (dedo, mouse o pestañas) de "Propiedades en el mapa" a "Desarrollos"; link directo: `/#desarrollos`. Filtros Todos / Edificios / Barrios · lotes. Pin = rombo champagne con ícono (edificio o lotes).
- Salen solos de los **emprendimientos de Tokko** (`development/` de la API; copia local `tokko_desarrollos_cache.json`, no se sube). Unidades = propiedades de Tokko asignadas a ese emprendimiento (lotes en barrios, unidades en edificios).
- Cada desarrollo tiene `desarrollos/<slug>.json` (el build lo crea solo): `tokko_id`, `nombre`, `clase` ("edificio" o "barrio"; vacío = se deduce del tipo de Tokko o de las unidades), `zona`, `estado` {es,en,pt} (ej. Preventa / En construcción), `entrega` (ej. "2028"), `cifras` [{valor, nombre{es,en,pt}}] (ej. 104 hectáreas), `ventajas` [{es,en,pt}] ("Por qué invertir"), `amenities` [{es,en,pt}], `bajada` {en,pt} (traducción; el español sale de la descripción de Tokko), y opcionales `lat`/`lng`, `fotos` [urls], `brochure` (URL), `kmz` (nombre o URL), `whatsapp`, `destacado` (va primero), `orden`, `ocultar`. Solo datos que salgan de Tokko, del brochure o de Mateo.
- **Plano**: poner el KMZ/KML de Google Earth en `desarrollos/<slug>.kmz` (o `kmz` en el JSON). El build dibuja perímetro (polígono llamado perímetro/límite, o el más grande), lotes (polígonos "12" / "Lote 12" o dentro de una carpeta "Lotes"), áreas comunes (otros polígonos), calles (líneas) y amenities (puntos). Los lotes en venta de Tokko se pintan champagne (por número de lote o porque el pin cae adentro). Brochure: `desarrollos/<slug>.pdf` o URL en `brochure`.
- Desarrollo que no está en Tokko: crear el JSON a mano con `nombre`, `clase`, `lat`, `lng`, `fotos`.
- Página propia en `/desarrollos/<slug>/` (plantilla `plantillas/desarrollo.html`): presentación del proyecto, no un listado de casas. Galería, cifras, Brochure / WhatsApp / Descargar plano, El proyecto, Por qué invertir, Amenities, Ubicación (distancias en línea recta a José Ignacio, Manantiales, La Barra, Punta del Este, Laguna Garzón y aeropuerto, con vista "Ubicación" en el mapa) y tabla de lotes en venta. Celular: mapa con el plano + hoja que se sube.
- Sin ningún desarrollo cargado, la sección muestra "Próximamente" con WhatsApp.

## Disponibilidad (agenda de temporada)

- Planilla de Google "Disponibilidad temporada" (la carga solo Mateo), hoja `Disponibilidad`: `Barrio | Casa | Difusión | En Tokko | Código | Ocupado`, con todas las casas y apartamentos de Tokko (sin terrenos). "Casa" = dirección de Tokko (nombre interno: casa, barrio, lote); "Difusión" = título publicado; "En Tokko" = Temporada / Venta / Alquiler.
- Casa sin "Alquiler temporario" en Tokko (solo venta, o mal cargada como alquiler) con algo en "Ocupado" (fechas o `libre`): el build le suma temporada "Consultar precio" y agenda con toda la temporada disponible menos lo ocupado.
- La lista de casas la mantiene sola el script `planilla/Codigo.gs` (pegado en Extensiones → Apps Script de la planilla, función `instalar` una vez): todos los días lee `datos.json` del sitio y las direcciones de Tokko (clave guardada solo en el script de la planilla, nunca en el repo), agrega casas nuevas, ordena por barrio, linkea la ficha y conserva "Ocupado". Casas que salen de Tokko con fechas cargadas quedan abajo en gris.
- Por defecto la casa está **disponible** en los períodos con precio en Tokko (1ra/2da quincena, mes, Fin de año = 26/12–2/1, Semana santa = lunes a domingo de Pascua). Días sin tarifa = gris.
- `Ocupado` = fechas tomadas, ej. `26/12-10/1, 15/1 al 27/1` (inclusive; sin año = temporada que viene): se tachan. Vacío o `libre` = todo disponible. Fecha mal escrita = no se tacha nada de esa casa y queda en `avisos.txt`.
- Si Mateo pasa "casa + fechas" por el chat, no hay herramienta para editar la planilla: decirle qué escribir en qué fila.
- En `sitio.json`, `"disponibilidad"`: id de la planilla (compartida "cualquiera con el link puede ver") o URL de un CSV.
- Botón dorado "Ver disponibilidad" (ventanita y tarjeta) en toda casa de temporada: tabla período · precio · Disponible / Ocupado / "Libre 16/12–19/12", y calendario por mes (disponible / ocupado tachado / sin tarifa). Reemplaza "Ver tarifas".
- La copia local `disponibilidad_cache.csv` no se sube.

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
- No subir `.cache_tiles/`, `tokko_cache.json`, `tokko_desarrollos_cache.json`, `.tokko_key`, `verificacion/`, `reel/trabajo/`, videos.

## Video para redes

`reel/preparar.py <slug>` + `reel/grabar.js` + ffmpeg arman un reel vertical 1080x1920 (~23 s) que recorre el satélite de pin en pin con foto, precio y datos (ver instrucciones en `reel/preparar.py`). Usa solo propiedades con ubicación verificada.
