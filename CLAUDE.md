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

- **No salen de Tokko.** Es información propia: brochures y material que Mateo deja en Drive, textos que pasa por chat y ubicación a mano. El build solo lee `desarrollos/*.json` (los lotes de Tokko siguen apareciendo en los mapas de barrio, como cualquier propiedad).
- En la portada el título grande se desliza (dedo, mouse o pestañas) de "Propiedades en el mapa" a "Desarrollos"; link directo: `/#desarrollos`. Filtros Todos / Edificios / Barrios · lotes (si hay de los dos). Pin = rombo champagne con ícono.
- `desarrollos/<slug>.json`: `nombre`, `clase` ("edificio" o "barrio"), `zona`, `lat`, `lng` (obligatorios: sin ubicación no se publica y queda en `avisos.txt`), `estado` {es,en,pt}, `entrega`, `bajada` {es,en,pt}, `cifras` [{valor, nombre{es,en,pt}}] (las 2 primeras van en la tarjeta de la portada), `ventajas` [{es,en,pt}] ("Por qué invertir"), `amenities` [{es,en,pt}], `fotos` [urls] (si está vacío usa `desarrollos/<slug>/fotos/*`), `brochure` (URL), `masterplan`, `kmz`, `whatsapp`, `destacado`, `orden`, `ocultar`. Solo datos que salgan del brochure o de Mateo.
- Archivos junto al JSON: `desarrollos/<slug>-masterplan.jpg` (lo primero que se ve al entrar, con zoom), `desarrollos/<slug>.pdf` (botón Brochure), `desarrollos/<slug>.kmz` (plano sobre el satélite, opcional), `desarrollos/<slug>/fotos/01.jpg…` (galería). `desarrollos/<slug>/index.html` lo genera el build.
- Página `/desarrollos/<slug>/` (plantilla `plantillas/desarrollo.html`): presentación del proyecto, NO lista lotes en venta. Pestañas Masterplan · Satélite · Ubicación (distancias en línea recta a José Ignacio, Manantiales, La Barra, Punta del Este, Laguna Garzón y aeropuerto). Panel: galería, cifras, Brochure / WhatsApp / Descargar plano, El proyecto, Por qué invertir, Amenities, Ubicación. Celular: plano + hoja que se sube.
- **Cargar un desarrollo ("cargá X")**: Drive de Mateo → carpeta `Desarrollos/<nombre>` (brochure PDF, masterplan, fotos, doc con textos y link de Google Maps). Buscar con `mcp__Google_Drive__search_files`, bajar con `download_file_content` al scratchpad; del PDF sacar texto (cifras, ventajas, amenities, estado, entrega; traducir a en/pt) e imágenes para `fotos/` (lado mayor ~1600 px, JPEG ~80); copiar el PDF como `<slug>.pdf` (si pesa > ~20 MB, usar el link de Drive compartido en `brochure`); masterplan a `<slug>-masterplan.jpg` (si es foto, enderezarlo); ubicación del link de Maps. Capturas, commit, PR, merge y "Run workflow".
- **División de lotes**: si el desarrollador pasa KMZ/KML → `desarrollos/<slug>.kmz` (lotes "Lote 12" o carpeta "Lotes"; perímetro; áreas). Si solo hay masterplan en imagen → `python3 calcar.py <slug> grilla` (plano con grilla de píxeles) + puntos de control en el satélite (`verificar.py zona`) → `desarrollos/<slug>-calco.json` (`control` [{px,lat,lng}] ≥3; si las líneas entre lotes son finas: `cortes` [[x1,y1,x2,y2]] + `etiquetas` {"C5":[x,y]} (punto dentro de cada lote; varios puntos = juntar regiones); `numeros`, `excluir`, `areas`, `perimetro`, `lotes` a mano) → `python3 calcar.py <slug>` arma `desarrollos/<slug>.kml` y `verificacion/<slug>-lotes.jpg` / `-calco.jpg` para revisar. `lotes_m2` {"A1":1160} = m² reales (de la lista; el plano de un brochure no está a escala). `lotes_estado` {"12":"vendido","7":"reservado"} en el JSON: vendido = negro tachado, reservado = champagne. Nunca precios en el mapa.
- **Brochures por idioma**: `brochure` = URL (español) o {"es":url,"en":url,"de":url}; o archivos `desarrollos/<slug>.pdf` (es) y `<slug>-<idioma>.pdf`. El botón abre el del idioma de la página (si no, español); los otros van como chips.
- **Interno (nunca al repo)**: precios, comisiones y contactos viven solo en Drive, en la carpeta del desarrollo (ver "Crear la carpeta de Drive" abajo). En el JSON `drive` = link de esa carpeta → botón "Drive" solo en modo interno (ver "Modo interno").
- **Crear la carpeta de Drive de un desarrollo nuevo** ("creá la estructura / la carpeta de Drive para X", o "cargá X" cuando todavía no tiene carpeta):
  1. Carpeta madre: `Desarrollos` en Mi unidad de Mateo, id `1Mnu4BYmpPrZpU4Eg_TUR8E7v4G1fZEAJ` (si no aparece, buscarla con `search_files` por título). Ahí hay un doc "LEEME – cómo armar un desarrollo" con esta misma receta.
  2. Buscar antes que no exista ya `Desarrollos/<Nombre>` (`search_files` con `parentId`) para no duplicar.
  3. Crear con `mcp__Google_Drive__create_file` (`contentMimeType: "application/vnd.google-apps.folder"`, `parentId`) la carpeta `<Nombre>` y adentro: `01 Brochures` (uno por idioma) · `02 Masterplan y KMZ` · `03 Fotos desarrollador` · `04 Fotos propias` · `05 Precios` · `06 Comisiones` · `07 Contactos` · `08 Textos y ubicación` (doc con textos + link de Google Maps).
  4. Si el desarrollador compartió material (aparece en "Compartido conmigo"), copiarlo con `copy_file` a la subcarpeta que corresponda, renombrado claro (ej. "Colibrí III (180) - Interior.png").
  5. Pasarle a Mateo el link de la carpeta y qué tirar en cada una. Al cargar el desarrollo, poner ese link en `drive` del `desarrollos/<slug>.json`.
  - 05, 06 y 07 son internos: nunca van al repo ni a la web. Ejemplo armado: Pueblo Colibrí.
- Pueblo Colibrí (La Barra, Martín Gómez Arquitectos): carpeta https://drive.google.com/drive/folders/1fnz2i_3DwwGRUMMUoRByLeU05I0BnDb6. Publicado: brochures es/en/pt, 12 fotos, masterplan y 36 lotes calcados (`pueblo-colibri-calco.json` → `pueblo-colibri.kml`). Ubicado con el cruce Bartolomé Hidalgo × Camino de los Flamencos (OSM) y el camino de tierra del borde este; el plano es esquemático, el calce es aproximado (si llega el KMZ del desarrollador, reemplaza al calco). Reservados según lista nov-2026: D1, D2, E2, E6, F4. La lista de precios es interna (Drive `05 Precios`), nunca al repo.
- **Ubicar sin pin / sin satélite en la sesión**: `ubicar.py` + `.github/workflows/ubicar.yml` corren en GitHub Actions (que sí llega a OpenStreetMap y al satélite) cuando se pushea un `desarrollos/*-calco.json` a una rama `claude/**` (o con "Run workflow"). En el calco: `cruce` ["Hidalgo","Flamencos"] (dos calles del plano), `bbox`, `recorte` {norte, este, metros}. Deja `verificacion/` (cruce, satélite con grilla, `-calco.jpg`) en la rama `verificacion-ci`: `git fetch origin verificacion-ci` y mirar las imágenes.
- Agreste Punta Negra (`agreste`, Gómez Platero; en Tokko "Proyecto Agreste"): carpeta https://drive.google.com/drive/folders/1N9KM0gc8R2wuqxHIBJAn86c7r4t39_hn (copia del Drive del desarrollador https://drive.google.com/drive/folders/1K42rDeDwMXjT_ekXWdUt5BVNILY0XtJ7). Lotes del KMZ del desarrollador (líneas de CAD: MANZANAS_DEFINTIVAS + SOLARES → polígonos; números en SOLARES_CALCULADOS, manzanas en MANZANAS-NOMBRE) → `desarrollos/agreste.kml`, 182 de 183 (AJ3 no tiene polígono en el KMZ). Nombres como el brochure (AA, AB… AO); la planilla de precios del desarrollador los escribe al revés (BA = AB, OA = AO). `lotes_m2` y vendidos de esa planilla (nov-2026, solo Etapa 1: P…AO). Manzanas A…O sin estado (no están en la planilla).
- Desarrollos cargados: Pueblo Colibrí, Agreste Punta Negra (se cargan de a uno). Punta Polo viejo está en el historial de git (commit anterior a este) por si se quiere recuperar el masterplan enderezado.
- Sin ningún desarrollo cargado, la sección muestra "Próximamente" con WhatsApp.

## Modo interno (equipo)

- Engranaje discreto abajo a la izquierda en portada, barrios y desarrollos → contraseña → se habilitan funciones solo para el equipo (hoy: botón "Drive" con la carpeta interna de cada desarrollo). Tocarlo de nuevo = "Salir". "Recordar en este equipo" lo guarda en ese navegador; si no, dura la pestaña.
- Los datos internos NO van en las páginas: `build.py` los junta (hoy `drive` de `desarrollos/<slug>.json`) y los publica cifrados en `interno.dat` (PBKDF2-SHA256 + AES-GCM; el navegador descifra con la contraseña). La contraseña es el secreto de GitHub `INTERNO_CLAVE` (o `.interno_clave` local, gitignored); nunca al repo. Sin contraseña no se publica `interno.dat` y los botones internos no aparecen. El workflow hace `pip install cryptography`.
- `window.INTERNO` (en `comun.js`): `INTERNO.dev(slug).drive`, `INTERNO.activo()`; evento `interno` al entrar/salir (las páginas se vuelven a dibujar). Para sumar otra función interna: agregar el dato a `INTERNO` en `build.py` y leerlo en la plantilla.
- Ojo: el link de Drive sigue escrito en `desarrollos/<slug>.json` (repo público): lo que de verdad lo protege es el permiso de la carpeta en Drive (restringida, no "cualquiera con el link").

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
- No subir `.cache_tiles/`, `tokko_cache.json`, `.tokko_key`, `verificacion/`, `reel/trabajo/`, videos.

## Video para redes

`reel/preparar.py <slug>` + `reel/grabar.js` + ffmpeg arman un reel vertical 1080x1920 (~23 s) que recorre el satélite de pin en pin con foto, precio y datos (ver instrucciones en `reel/preparar.py`). Usa solo propiedades con ubicación verificada.
