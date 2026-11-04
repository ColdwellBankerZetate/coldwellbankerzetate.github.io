/**
 * Planilla de disponibilidad — mapas Coldwell Banker Zetaté
 *
 * Mantiene sola la lista de casas de temporada (las lee de los mapas, que se sincronizan con Tokko):
 * agrega las nuevas, ordena por barrio, pone el link a la ficha y conserva lo escrito en "Ocupado".
 * "Casa" = la dirección que figura en Tokko (nombre interno: casa, barrio y lote); "Difusión" = el título publicado.
 * Casas que salen de Tokko: si tenían fechas quedan abajo en gris; si no, se borran.
 *
 * Instalación (una sola vez): en la planilla, Extensiones → Apps Script, pegar este archivo,
 * poner la clave de Tokko en TOKKO_KEY (o en Configuración del proyecto → Propiedades del script),
 * guardar, elegir la función "instalar" y tocar Ejecutar (pide permiso la primera vez).
 * Después corre sola todos los días y también desde el menú "Mapas → Actualizar casas".
 *
 * La clave de Tokko NUNCA va en el repo (es público): en el repo queda vacía.
 */
const TOKKO_KEY = "";
const DATOS = "https://coldwellbankerzetate.github.io/datos.json";
const TOKKO = "https://www.tokkobroker.com/api/v1/property/";
const HOJA = "Disponibilidad";
const CAB = ["Barrio", "Casa", "Difusión", "Código", "Ocupado"];
const C_OC = CAB.indexOf("Ocupado") + 1, C_COD = CAB.indexOf("Código") + 1;

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Mapas").addItem("Actualizar casas", "actualizar").addToUi();
}

function instalar() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("actualizar").timeBased().everyDays(1).atHour(7).create();
  actualizar();
}

const norm = s => String(s).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** {reference_code: dirección de Tokko}. Si Tokko no responde, queda vacío y se usa lo que ya había. */
function direccionesTokko() {
  const key = PropertiesService.getScriptProperties().getProperty("TOKKO_KEY") || TOKKO_KEY;
  if (!key) return {};
  const out = {};
  try {
    for (let off = 0; ; off += 100) {
      const u = `${TOKKO}?key=${key}&format=json&lang=es_ar&limit=100&offset=${off}`;
      const d = JSON.parse(UrlFetchApp.fetch(u).getContentText());
      for (const p of d.objects) out[p.reference_code] = String(p.real_address || p.address || "").trim();
      if (!d.meta.next) break;
    }
  } catch (e) {
    console.warn("No pude leer Tokko: " + e);
  }
  return out;
}

function actualizar() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;
  try {
    const libro = SpreadsheetApp.getActive();
    const hoja = libro.getSheetByName(HOJA) || libro.getSheets()[0];
    hoja.setName(HOJA);

    // 1) Lo ya escrito, por código: "Ocupado" y la "Casa" anterior (por si Tokko no responde)
    const previo = {}, casaPrevia = {};
    const val = hoja.getDataRange().getDisplayValues();
    const cab = (val[0] || []).map(norm);
    const iCod = cab.indexOf("codigo"), iProp = cab.indexOf("propiedad"), iOc = cab.indexOf("ocupado"), iCasa = cab.indexOf("casa");
    for (const f of val.slice(1)) {
      let cod = iCod >= 0 ? f[iCod] : "";
      if (!cod && iProp >= 0) { const m = String(f[iProp]).match(/\(([A-Z]+\d+)\)\s*$/); cod = m ? m[1] : ""; }
      cod = String(cod).trim().toUpperCase();
      if (!cod) continue;
      if (iOc >= 0) previo[cod] = String(f[iOc]).trim();
      if (iCasa >= 0 && cab.includes("difusion")) casaPrevia[cod] = String(f[iCasa]).trim();
    }

    // 2) Casas de temporada de los mapas + dirección de Tokko
    const datos = JSON.parse(UrlFetchApp.fetch(DATOS + "?t=" + Date.now()).getContentText());
    const dir = direccionesTokko();
    const casas = datos.propiedades
      .filter(p => p.ops.some(o => o.tipo === "temporada"))
      .map(p => ({ barrio: p.barrio_nombre, casa: dir[p.ref] || casaPrevia[p.ref] || "", difusion: difusion(p), cod: p.ref, url: p.url }))
      .sort((a, b) => a.barrio.localeCompare(b.barrio, "es") ||
                      a.casa.localeCompare(b.casa, "es", { numeric: true }) || a.difusion.localeCompare(b.difusion, "es"));
    const activas = new Set(casas.map(c => c.cod));
    const viejas = Object.keys(previo).filter(c => !activas.has(c) && previo[c])
      .map(c => ({ barrio: "Ya no está en Tokko", casa: casaPrevia[c] || "", difusion: "", cod: c, url: "" }));
    const filas = casas.concat(viejas);

    // 3) Reescribir la hoja prolija
    hoja.clear(); hoja.clearConditionalFormatRules();
    hoja.getRange(1, 1, 1, CAB.length).setValues([CAB])
      .setFontWeight("bold").setFontColor("#ffffff").setBackground("#111111");
    if (filas.length) {
      const n = filas.length;
      hoja.getRange(2, C_OC, n, 1).setNumberFormat("@"); // texto: que Google no convierta "1/2" en fecha
      hoja.getRange(2, 1, n, CAB.length).setValues(filas.map(f => [f.barrio, f.casa, f.difusion, f.cod, previo[f.cod] || ""]));
      hoja.getRange(2, 2, n, 1).setRichTextValues(filas.map(f => [f.url && f.casa
        ? SpreadsheetApp.newRichTextValue().setText(f.casa).setLinkUrl(f.url).build()
        : SpreadsheetApp.newRichTextValue().setText(f.casa).build()]));
      // franjas por barrio para leer fácil
      let tono = false, ant = null;
      const fondos = filas.map(f => { if (f.barrio !== ant) { tono = !tono; ant = f.barrio; } return Array(CAB.length).fill(tono ? "#ffffff" : "#f4f2ee"); });
      hoja.getRange(2, 1, n, CAB.length).setBackgrounds(fondos).setVerticalAlignment("middle");
      hoja.getRange(2, 2, n, 1).setFontWeight("bold");
      hoja.getRange(2, 3, n, 2).setFontColor("#888888");
      hoja.getRange(2, C_OC, n, 1).setFontWeight("bold");
      if (viejas.length) hoja.getRange(casas.length + 2, 1, viejas.length, CAB.length).setFontColor("#999999");
    }
    hoja.setFrozenRows(1);
    [150, 260, 340, 110, 300].forEach((w, i) => hoja.setColumnWidth(i + 1, w));
    hoja.getRange(1, C_OC).setNote('Fechas ocupadas, ej: 26/12-10/1, 15/1 al 27/1\nVacío = disponible en los períodos con precio de Tokko');
    hoja.getRange(1, 2).setNote("Dirección cargada en Tokko (nombre interno). Para cambiarla, cambiala en Tokko.");
    const sinDir = casas.filter(c => !c.casa).length;
    libro.toast(`${casas.length} casas de temporada` + (sinDir ? ` · ${sinDir} sin dirección en Tokko` : ""), "Mapas", 6);
  } finally {
    lock.releaseLock();
  }
}

function difusion(p) {
  const t = p.titulo || "";
  const corto = t.includes("–") ? t.split("–").slice(1).join("–").trim() : t;
  const dorm = p.dormitorios ? ` · ${p.dormitorios} dorm.` : "";
  return (corto || p.tipo) + (corto.match(/dormitorio|suite/i) ? "" : dorm);
}
