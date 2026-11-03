/**
 * Planilla de disponibilidad — mapas Coldwell Banker Zetaté
 *
 * Mantiene sola la lista de casas de temporada (las lee de los mapas, que se sincronizan con Tokko):
 * agrega las nuevas, ordena por barrio, pone el link a la ficha y conserva lo escrito en "Ocupado".
 * Casas que salen de Tokko: si tenían fechas quedan abajo en gris; si no, se borran.
 *
 * Instalación (una sola vez): en la planilla, Extensiones → Apps Script, pegar este archivo,
 * guardar, elegir la función "instalar" y tocar Ejecutar (pide permiso la primera vez).
 * Después corre sola todos los días y también desde el menú "Mapas → Actualizar casas".
 */
const DATOS = "https://coldwellbankerzetate.github.io/datos.json";
const HOJA = "Disponibilidad";
const CAB = ["Barrio", "Casa", "Código", "Ocupado"];

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Mapas").addItem("Actualizar casas", "actualizar").addToUi();
}

function instalar() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("actualizar").timeBased().everyDays(1).atHour(7).create();
  actualizar();
}

function actualizar() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;
  try {
    const libro = SpreadsheetApp.getActive();
    const hoja = libro.getSheetByName(HOJA) || libro.getSheets()[0];
    hoja.setName(HOJA);

    // 1) Lo que ya está escrito en "Ocupado", por código (sirve también para la planilla vieja "Propiedad | Ocupado")
    const previo = {};
    const val = hoja.getDataRange().getDisplayValues();
    const cab = (val[0] || []).map(c => String(c).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
    const iCod = cab.indexOf("codigo"), iProp = cab.indexOf("propiedad"), iOc = cab.indexOf("ocupado");
    for (const f of val.slice(1)) {
      let cod = iCod >= 0 ? f[iCod] : "";
      if (!cod && iProp >= 0) { const m = String(f[iProp]).match(/\(([A-Z]+\d+)\)\s*$/); cod = m ? m[1] : ""; }
      cod = String(cod).trim().toUpperCase();
      if (cod && iOc >= 0) previo[cod] = String(f[iOc]).trim();
    }

    // 2) Casas de temporada de los mapas
    const datos = JSON.parse(UrlFetchApp.fetch(DATOS + "?t=" + Date.now()).getContentText());
    const casas = datos.propiedades
      .filter(p => p.ops.some(o => o.tipo === "temporada"))
      .map(p => ({ barrio: p.barrio_nombre, casa: nombre(p), cod: p.ref, url: p.url }))
      .sort((a, b) => a.barrio.localeCompare(b.barrio, "es") || a.casa.localeCompare(b.casa, "es"));
    const activas = new Set(casas.map(c => c.cod));
    const viejas = Object.keys(previo).filter(c => !activas.has(c) && previo[c])
      .map(c => ({ barrio: "Ya no está en Tokko", casa: "", cod: c, url: "" }));
    const filas = casas.concat(viejas);

    // 3) Reescribir la hoja prolija
    hoja.clear(); hoja.clearConditionalFormatRules();
    hoja.getRange(1, 1, 1, CAB.length).setValues([CAB])
      .setFontWeight("bold").setFontColor("#ffffff").setBackground("#111111");
    if (filas.length) {
      const n = filas.length;
      hoja.getRange(2, 4, n, 1).setNumberFormat("@"); // texto: que Google no convierta "1/2" en fecha
      hoja.getRange(2, 1, n, CAB.length).setValues(filas.map(f => [f.barrio, f.casa, f.cod, previo[f.cod] || ""]));
      hoja.getRange(2, 2, n, 1).setRichTextValues(filas.map(f => [f.url
        ? SpreadsheetApp.newRichTextValue().setText(f.casa).setLinkUrl(f.url).build()
        : SpreadsheetApp.newRichTextValue().setText(f.casa).build()]));
      // franjas por barrio para leer fácil
      let tono = false, ant = null;
      const fondos = filas.map(f => { if (f.barrio !== ant) { tono = !tono; ant = f.barrio; } return Array(CAB.length).fill(tono ? "#ffffff" : "#f4f2ee"); });
      hoja.getRange(2, 1, n, CAB.length).setBackgrounds(fondos).setVerticalAlignment("middle");
      if (viejas.length) hoja.getRange(casas.length + 2, 1, viejas.length, CAB.length).setFontColor("#999999");
      hoja.getRange(2, 3, n, 1).setFontColor("#888888");
      hoja.getRange(2, 4, n, 1).setFontWeight("bold");
    }
    hoja.setFrozenRows(1);
    hoja.setColumnWidth(1, 150); hoja.setColumnWidth(2, 420); hoja.setColumnWidth(3, 110); hoja.setColumnWidth(4, 320);
    hoja.getRange(1, 4).setNote('Fechas ocupadas, ej: 26/12-10/1, 15/1 al 27/1\n"libre" = todo libre\nVacío = no se muestra agenda');
    libro.toast(`${casas.length} casas de temporada`, "Mapas", 4);
  } finally {
    lock.releaseLock();
  }
}

function nombre(p) {
  const t = p.titulo || "";
  const corto = t.includes("–") ? t.split("–").slice(1).join("–").trim() : t;
  const dorm = p.dormitorios ? ` · ${p.dormitorios} dorm.` : "";
  return (corto || p.tipo) + (corto.match(/dormitorio|suite/i) ? "" : dorm);
}
