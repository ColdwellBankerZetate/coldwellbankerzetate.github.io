/**
 * Planilla "Agenda" — mapas Coldwell Banker Zetaté
 *
 * Una fila por casa o apartamento (sin terrenos), una columna por período de temporada. La lista sale sola de Tokko
 * (cada hora): al cargar una casa en Tokko aparece acá con la fila vacía, resaltada en amarillo ("falta cargar agenda").
 * Lo que se escribe en los períodos NUNCA lo pisa Tokko ni este script.
 *
 * Lo normal es cargar todo desde la página interna del sitio /agenda/ (calendario por día + precios): guarda los días en
 * la hoja "Ocupación" y los precios acá. Ver la sección "Página interna" al final para conectarla.
 * A mano, cada celda de período:
 *   vacía               → ese período no se ofrece
 *   8500                → disponible a USD 8.500
 *   A 8500 / R 8500     → (formato viejo) período entero alquilado / reservado; al guardar la casa desde /agenda/
 *                         se pasa solo a días en "Ocupación" y acá queda solo el precio
 *
 * Columna "Mapa": vacía = la casa ya está publicada en el mapa. Si no, dice por qué (sin coordenadas en Tokko, sin precio…)
 * o "esperando sincronización" (el mapa se actualiza cada hora).
 *
 * Instalación (una sola vez): Extensiones → Apps Script, pegar este archivo, poner la clave de Tokko en
 * Configuración del proyecto → Propiedades del script (TOKKO_KEY), guardar, elegir la función "instalar" y Ejecutar
 * (pide permiso la primera vez). Después corre sola cada hora y también desde el menú "Mapas → Actualizar casas".
 *
 * La clave de Tokko NUNCA va en el repo (es público): en el repo queda vacía.
 * La hoja vieja "Disponibilidad" ya no se toca: el sitio solo la usa para casas sin nada cargado en "Agenda".
 */
const TOKKO_KEY = "";
const DATOS = "https://coldwellbankerzetate.github.io/datos.json";
const TOKKO = "https://www.tokkobroker.com/api/v1/property/";
const HOJA = "Agenda";
const PERIODOS = ["1ra Dic", "2da Dic", "Fin de año", "1ra Ene", "2da Ene", "1ra Feb", "2da Feb", "1ra Mar", "2da Mar", "Semana santa"];
const CAB = ["Barrio", "Casa"].concat(PERIODOS, ["Mapa", "Código"]);
const C_PER = 3, C_MAPA = C_PER + PERIODOS.length, C_COD = C_MAPA + 1;

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Mapas").addItem("Actualizar casas", "actualizar").addToUi();
}

function instalar() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("actualizar").timeBased().everyHours(1).create();
  actualizar();
}

const norm = s => String(s).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

let ERROR_TOKKO = "";

/** Casas y apartamentos de Tokko: [{cod, barrio, casa, url}]. Vacío si Tokko no responde. */
function casasTokko() {
  const key = PropertiesService.getScriptProperties().getProperty("TOKKO_KEY") || TOKKO_KEY;
  if (!key) { ERROR_TOKKO = "falta TOKKO_KEY en Propiedades del script"; return []; }
  const out = [];
  try {
    for (let off = 0; ; off += 100) {
      const u = `${TOKKO}?key=${key}&format=json&lang=es_ar&limit=100&offset=${off}`;
      const d = JSON.parse(UrlFetchApp.fetch(u).getContentText());
      for (const p of d.objects) {
        if (!p.reference_code || (p.type && p.type.name === "Terreno")) continue;
        out.push({ cod: p.reference_code, barrio: String((p.location && p.location.name) || "").trim(),
                   casa: String(p.real_address || p.address || "").trim(), url: p.public_url || "" });
      }
      if (!d.meta.next) break;
    }
  } catch (e) {
    console.warn("No pude leer Tokko: " + e);
    ERROR_TOKKO = String(e).split(key).join("…").slice(0, 120);
    return [];
  }
  return out;
}

/** datos.json del sitio: refs publicadas en el mapa y casas que quedaron afuera (con motivo). */
function estadoMapa() {
  try {
    const d = JSON.parse(UrlFetchApp.fetch(DATOS + "?t=" + Date.now()).getContentText());
    const enMapa = {}, fuera = {};
    for (const p of d.propiedades) enMapa[p.ref] = p;
    for (const x of d.fuera_del_mapa || []) fuera[x.ref] = x.motivo;
    return { ok: true, enMapa, fuera, datos: d };
  } catch (e) {
    console.warn("No pude leer datos.json: " + e);
    return { ok: false, enMapa: {}, fuera: {}, datos: null };
  }
}

/** {código: nombre interno} de la hoja vieja "Disponibilidad" (Barrio | Casa | Difusión | … | Código). */
function nombresInternos(libro) {
  const out = {};
  const h = libro.getSheetByName("Disponibilidad");
  if (!h) return out;
  const v = h.getDataRange().getDisplayValues();
  const cab = (v[0] || []).map(norm);
  const iCod = cab.indexOf("codigo"), iCasa = cab.indexOf("casa");
  if (iCod < 0 || iCasa < 0) return out;
  for (const f of v.slice(1)) {
    const cod = String(f[iCod]).trim(), casa = String(f[iCasa]).trim();
    if (cod && casa) out[cod] = casa;
  }
  return out;
}

function actualizar() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;
  try {
    // 1) Lo de afuera primero (lento): Tokko y el estado del mapa
    let casas = casasTokko();
    const mapa = estadoMapa();
    if (!casas.length && mapa.datos) { // sin Tokko: al menos las casas que ya están en el sitio
      casas = mapa.datos.propiedades.filter(p => p.tipo !== "terreno" && p.fuente === "tokko")
        .map(p => ({ cod: p.ref, barrio: p.barrio_nombre, casa: "", url: p.url }))
        .concat((mapa.datos.fuera_del_mapa || []).filter(x => x.ref && x.tipo !== "terreno")
          .map(x => ({ cod: x.ref, barrio: x.barrio || "", casa: x.casa || "", url: "" })));
    }
    if (!casas.length) return; // sin datos no tocamos la hoja

    // 2) Recién ahora leer la hoja (así se achica la ventana en la que podría pisar algo que estás escribiendo)
    const libro = SpreadsheetApp.getActive();
    let hoja = libro.getSheetByName(HOJA);
    if (!hoja) hoja = libro.insertSheet(HOJA, 0);
    const val = hoja.getDataRange().getDisplayValues();
    const cab = (val[0] || []).map(norm);
    const iCod = cab.indexOf("codigo"), iCasa = cab.indexOf("casa"), iBarrio = cab.indexOf("barrio");
    const iPer = PERIODOS.map(p => cab.indexOf(norm(p)));
    const previo = {};
    if (iCod >= 0) {
      for (const f of val.slice(1)) {
        const cod = String(f[iCod]).trim();
        if (!cod) continue;
        previo[cod] = { per: iPer.map(i => (i >= 0 ? String(f[i]).trim() : "")),
                        casa: iCasa >= 0 ? f[iCasa] : "", barrio: iBarrio >= 0 ? f[iBarrio] : "" };
      }
    }

    // Nombre interno sin Tokko: 1) hoja vieja "Disponibilidad" (columna Casa = dirección de Tokko), 2) lo que ya
    // estaba en esta hoja, salvo que sea el título de difusión del sitio, 3) el código.
    const interno = nombresInternos(libro);
    const difusion = {};
    if (mapa.datos) for (const p of mapa.datos.propiedades) difusion[p.ref] = String(p.titulo || "").trim();
    for (const c of casas) {
      if (c.casa) continue;
      const ant = previo[c.cod] ? String(previo[c.cod].casa).trim() : "";
      c.casa = interno[c.cod] || (ant && ant !== difusion[c.cod] ? ant : "") || c.cod;
    }

    // 3) Filas: casas de Tokko + (abajo, en gris) las que salieron de Tokko pero tenían períodos cargados
    casas.sort((a, b) => a.barrio.localeCompare(b.barrio, "es") || a.casa.localeCompare(b.casa, "es", { numeric: true }));
    const activas = new Set(casas.map(c => c.cod));
    const viejas = Object.keys(previo).filter(c => !activas.has(c) && previo[c].per.some(x => x))
      .map(c => ({ cod: c, barrio: "Ya no está en Tokko", casa: previo[c].casa, url: "" }));
    const filas = casas.concat(viejas);
    const motivo = c => {
      if (!mapa.ok || c.barrio === "Ya no está en Tokko") return "";
      if (mapa.enMapa[c.cod]) return "";
      return mapa.fuera[c.cod] || "esperando sincronización";
    };

    // 4) Escribir la hoja prolija
    hoja.clear(); hoja.clearConditionalFormatRules();
    hoja.getRange(1, 1, 1, CAB.length).setValues([CAB])
      .setFontWeight("bold").setFontColor("#ffffff").setBackground("#111111").setHorizontalAlignment("center").setVerticalAlignment("middle");
    hoja.getRange(1, 1, 1, 2).setHorizontalAlignment("left");
    const n = filas.length;
    hoja.getRange(2, C_PER, n, PERIODOS.length).setNumberFormat("@"); // texto: que Google no convierta "8500" ni fechas
    hoja.getRange(2, 1, n, CAB.length).setValues(filas.map(f =>
      [f.barrio, f.casa].concat((previo[f.cod] ? previo[f.cod].per : PERIODOS.map(() => "")), [motivo(f), f.cod])));
    hoja.getRange(2, 2, n, 1).setRichTextValues(filas.map(f => [f.url && f.casa
      ? SpreadsheetApp.newRichTextValue().setText(f.casa).setLinkUrl(f.url).build()
      : SpreadsheetApp.newRichTextValue().setText(f.casa).build()]));
    // franjas por barrio, fáciles de leer
    let tono = false, ant = null;
    const fondos = filas.map(f => { if (f.barrio !== ant) { tono = !tono; ant = f.barrio; } return Array(CAB.length).fill(tono ? "#ffffff" : "#f4f2ee"); });
    hoja.getRange(2, 1, n, CAB.length).setBackgrounds(fondos).setVerticalAlignment("middle");
    hoja.getRange(2, C_PER, n, PERIODOS.length).setHorizontalAlignment("center");
    hoja.getRange(2, 2, n, 1).setFontWeight("bold");
    hoja.getRange(2, 1, n, 1).setFontColor("#888888");
    hoja.getRange(2, C_MAPA, n, 1).setFontColor("#c0392b").setFontSize(9);
    hoja.getRange(2, C_COD, n, 1).setFontColor("#aaaaaa").setFontSize(8);
    if (viejas.length) hoja.getRange(casas.length + 2, 1, viejas.length, CAB.length).setFontColor("#999999");

    // 5) Colores por estado (se ven de un vistazo) y aviso de casas sin cargar
    const per = hoja.getRange(2, C_PER, Math.max(n, 1), PERIODOS.length);
    const tl = per.getA1Notation().split(":")[0];
    const regla = (formula, fondo, texto, tachado) => {
      const r = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setBackground(fondo).setFontColor(texto);
      return (tachado ? r.setStrikethrough(true) : r).setRanges([per]).build();
    };
    const reglas = [
      regla(`=REGEXMATCH(${tl},"(?i)^\\s*(a|alq)")`, "#e4e4e4", "#999999", true),      // alquilada
      regla(`=REGEXMATCH(${tl},"(?i)^\\s*(r|res)")`, "#f3e7c9", "#6b5320", false),     // reservada
      regla(`=REGEXMATCH(${tl},"^\\s*[0-9uU$]")`, "#e6f2e6", "#1f5a2a", false),        // disponible
    ];
    const sinCargar = hoja.getRange(2, 2, Math.max(n, 1), 1);
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=AND($${String.fromCharCode(64 + C_COD)}2<>"",$A2<>"Ya no está en Tokko",COUNTA($C2:$${String.fromCharCode(64 + C_MAPA - 1)}2)=0)`)
      .setBackground("#fff1cc").setRanges([sinCargar]).build());
    hoja.setConditionalFormatRules(reglas);

    hoja.setFrozenRows(1); hoja.setFrozenColumns(2);
    hoja.setColumnWidth(1, 130); hoja.setColumnWidth(2, 260);
    for (let i = 0; i < PERIODOS.length; i++) hoja.setColumnWidth(C_PER + i, 92);
    hoja.setColumnWidth(C_MAPA, 170); hoja.setColumnWidth(C_COD, 90);
    hoja.hideColumns(C_COD);
    hoja.getRange(1, C_PER).setNote(
      'Vacío = no se ofrece.\n8500 = disponible\nA 8500 = alquilada (a ese precio)\nR 8500 = reservada\n' +
      'Si se liberan días: A 8500 libre 16/1-19/1');
    hoja.getRange(1, 2).setNote("Dirección cargada en Tokko (nombre interno). Para cambiarla, cambiala en Tokko. Amarillo = falta cargar la agenda.");
    hoja.getRange(1, C_MAPA).setNote("Vacío = ya está en el mapa. Si no, dice por qué.");

    const sinCargarN = casas.filter(c => !(previo[c.cod] && previo[c.cod].per.some(x => x))).length;
    const fueraN = casas.filter(c => motivo(c) && motivo(c) !== "esperando sincronización").length;
    if (ERROR_TOKKO) libro.toast("No pude leer Tokko (" + ERROR_TOKKO + "). Nombres internos tomados de la hoja Disponibilidad; las casas nuevas salen con el código.", "Mapas", 15);
    else libro.toast(`${casas.length} casas` + (sinCargarN ? ` · ${sinCargarN} sin agenda` : "") + (fueraN ? ` · ${fueraN} fuera del mapa` : ""), "Mapas", 6);
  } finally {
    lock.releaseLock();
  }
}

/* ======================================================================================================
 * Página interna /agenda/ del sitio (calendario por casa). La página habla con este script publicado como
 * "App web" y guarda acá: los días en la hoja "Ocupación" (una fila por tramo) y los precios en "Agenda".
 *
 * Instalación (una vez): Propiedades del script → CLAVE = la misma contraseña del modo interno del sitio.
 * Implementar → Nueva implementación → tipo "App web" · Ejecutar como: yo · Quién tiene acceso: cualquier usuario.
 * La URL que termina en /exec va en sitio.json → "agenda_app". Al pegar una versión nueva de este archivo:
 * Implementar → Gestionar implementaciones → editar (lápiz) → Versión: nueva → Implementar (la URL no cambia).
 * Sin la contraseña la App web no devuelve ni guarda nada.
 * ==================================================================================================== */
const HOJA_OCU = "Ocupación";
const CAB_OCU = ["Código", "Casa", "Desde", "Hasta", "Estado"];
const ESTADOS = ["alquilada", "reservada", "libre"];

function hojaOcupacion(libro) {
  let h = libro.getSheetByName(HOJA_OCU);
  if (!h) {
    h = libro.insertSheet(HOJA_OCU);
    h.getRange(1, 1, 1, CAB_OCU.length).setValues([CAB_OCU]).setFontWeight("bold").setFontColor("#ffffff").setBackground("#111111");
    h.setFrozenRows(1); h.setColumnWidth(2, 260);
    h.getRange(1, 1).setNote("La carga la página interna /agenda/ del sitio (calendario). Se puede corregir a mano: " +
      "fechas dd/mm/aaaa, estado alquilada / reservada / libre (libre = días que se liberan dentro de un período alquilado).");
  }
  return h;
}

function tokenOk(tk) {
  const clave = PropertiesService.getScriptProperties().getProperty("CLAVE");
  if (!clave || !tk) return false;
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, "cbz-agenda:" + clave, Utilities.Charset.UTF_8);
  const hex = b.map(x => ((x + 256) % 256).toString(16).padStart(2, "0")).join("");
  return hex === String(tk);
}

const ddmm = s => { const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
const isoDe = s => {
  const t = String(s).trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
};

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return responder({ ok: true, app: "agenda" }); }

function doPost(e) {
  let q;
  try { q = JSON.parse(e.postData.contents); } catch (_) { return responder({ error: "pedido inválido" }); }
  if (!tokenOk(q.tk)) return responder({ error: "clave" });
  const libro = SpreadsheetApp.getActive();
  if (q.accion === "casas") return responder(leerTodo(libro));
  if (q.accion === "guardar") {
    const lock = LockService.getDocumentLock();
    if (!lock.tryLock(20000)) return responder({ error: "La planilla está ocupada, probá de nuevo en un rato." });
    try { return responder(guardarCasa(libro, q)); } finally { lock.releaseLock(); }
  }
  return responder({ error: "acción desconocida" });
}

function leerTodo(libro) {
  const h = libro.getSheetByName(HOJA);
  const v = h ? h.getDataRange().getDisplayValues() : [];
  const cab = (v[0] || []).map(norm);
  const iCod = cab.indexOf("codigo"), iCasa = cab.indexOf("casa"), iBarrio = cab.indexOf("barrio");
  const iPer = PERIODOS.map(p => cab.indexOf(norm(p)));
  const casas = [];
  for (const f of v.slice(1)) {
    const cod = String(f[iCod] || "").trim();
    if (!cod) continue;
    const per = {};
    PERIODOS.forEach((p, k) => { per[p] = iPer[k] >= 0 ? String(f[iPer[k]]).trim() : ""; });
    casas.push({ cod, casa: String(f[iCasa] || "").trim(), barrio: String(f[iBarrio] || "").trim(), per, dias: [] });
  }
  const porCod = {};
  casas.forEach(c => { porCod[c.cod] = c; });
  const o = hojaOcupacion(libro).getDataRange().getDisplayValues();
  for (const f of o.slice(1)) {
    const c = porCod[String(f[0]).trim()], d = isoDe(f[2]), hh = isoDe(f[3]) || d, est = norm(f[4]);
    if (c && d && ESTADOS.includes(est)) c.dias.push({ d, h: hh, e: est });
  }
  return { ok: true, periodos: PERIODOS, casas };
}

function guardarCasa(libro, q) {
  const cod = String(q.cod || "").trim();
  if (!cod) return { error: "falta el código" };
  const rangos = (q.dias || []).map(r => ({ d: isoDe(r.d), h: isoDe(r.h || r.d), e: norm(r.e) }))
    .filter(r => r.d && r.h && ESTADOS.includes(r.e));
  // 1) Precios en "Agenda" (solo las celdas que manda la página)
  const h = libro.getSheetByName(HOJA);
  const v = h.getDataRange().getDisplayValues();
  const cab = (v[0] || []).map(norm);
  const iCod = cab.indexOf("codigo"), iCasa = cab.indexOf("casa");
  const fila = v.findIndex((f, i) => i > 0 && String(f[iCod]).trim() === cod);
  if (fila < 0) return { error: "esa casa ya no está en la hoja Agenda" };
  const casa = String(v[fila][iCasa] || "").trim();
  for (const p of Object.keys(q.per || {})) {
    const i = cab.indexOf(norm(p));
    if (i < 0) continue;
    const val = String(q.per[p] == null ? "" : q.per[p]).trim();
    if (val && !/^\d+$/.test(val)) return { error: `precio que no entiendo en ${p}: ${val}` };
    h.getRange(fila + 1, i + 1).setNumberFormat("@").setValue(val);
  }
  // 2) Días en "Ocupación": se reemplazan todos los tramos de esa casa
  const o = hojaOcupacion(libro);
  const ov = o.getDataRange().getDisplayValues();
  const resto = ov.slice(1).filter(f => String(f[0]).trim() && String(f[0]).trim() !== cod);
  const nuevas = rangos.sort((a, b) => a.d < b.d ? -1 : 1).map(r => [cod, casa, ddmm(r.d), ddmm(r.h), r.e]);
  const todas = resto.concat(nuevas);
  if (o.getLastRow() > 1) o.getRange(2, 1, o.getLastRow() - 1, CAB_OCU.length).clearContent();
  if (todas.length) o.getRange(2, 1, todas.length, CAB_OCU.length).setNumberFormat("@").setValues(todas);
  return { ok: true, guardado: new Date().toISOString() };
}
