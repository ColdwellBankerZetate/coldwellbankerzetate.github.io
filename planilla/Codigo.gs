/**
 * Planilla "Agenda" — mapas Coldwell Banker Zetaté
 *
 * Una fila por casa o apartamento (sin terrenos), agrupadas bajo una franja por barrio (CLUB DE MAR…) y en orden natural
 * (Club del Mar 5 antes que Club del Mar 56); una columna por período de temporada. La lista sale sola de Tokko
 * (cada hora): al cargar una casa en Tokko aparece acá con la fila vacía, resaltada en amarillo ("falta cargar agenda").
 * Lo que se escribe en los períodos NUNCA lo pisa Tokko ni este script.
 *
 * Cómo se carga cada celda:
 *   vacía               → ese período no se ofrece
 *   8500                → disponible a USD 8.500
 *   A 8500              → alquilada (a USD 8.500): se ve tachada en el mapa, con su precio
 *   R 8500              → reservada
 *   A 8500 libre 16/1-19/1  → alquilada, pero se liberan esos días (se pueden separar con coma)
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

/** Casas y apartamentos de Tokko: [{cod, barrio, casa, url}]. Vacío si Tokko no responde. */
function casasTokko() {
  const key = PropertiesService.getScriptProperties().getProperty("TOKKO_KEY") || TOKKO_KEY;
  if (!key) return [];
  const out = [];
  try {
    for (let off = 0; ; off += 100) {
      const u = `${TOKKO}?key=${key}&format=json&lang=es_ar&limit=100&offset=${off}`;
      const d = JSON.parse(UrlFetchApp.fetch(u).getContentText());
      for (const p of d.objects) {
        if (!p.reference_code || (p.type && p.type.name === "Terreno")) continue;
        out.push({ cod: p.reference_code, barrio: String((p.location && p.location.name) || "").trim(),
                   casa: String(p.real_address || p.address || p.publication_title || "").trim(), url: p.public_url || "" });
      }
      if (!d.meta.next) break;
    }
  } catch (e) {
    console.warn("No pude leer Tokko: " + e);
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

function actualizar() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;
  try {
    // 1) Lo de afuera primero (lento): Tokko y el estado del mapa
    let casas = casasTokko();
    const mapa = estadoMapa();
    if (!casas.length && mapa.datos) { // sin Tokko: al menos las casas que ya están en el sitio
      casas = mapa.datos.propiedades.filter(p => p.tipo !== "terreno" && p.fuente === "tokko")
        .map(p => ({ cod: p.ref, barrio: p.barrio_nombre, casa: "", url: p.url }));
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

    // 3) Filas: casas de Tokko + (abajo, en gris) las que salieron de Tokko pero tenían períodos cargados
    casas.sort((a, b) => a.barrio.localeCompare(b.barrio, "es") || a.casa.localeCompare(b.casa, "es", { numeric: true, sensitivity: "base" }) || a.cod.localeCompare(b.cod, "es", { numeric: true }));
    const activas = new Set(casas.map(c => c.cod));
    const viejas = Object.keys(previo).filter(c => !activas.has(c) && previo[c].per.some(x => x))
      .map(c => ({ cod: c, barrio: "Ya no está en Tokko", casa: previo[c].casa, url: "" }));
    const motivo = c => {
      if (!mapa.ok || c.barrio === "Ya no está en Tokko") return "";
      if (mapa.enMapa[c.cod]) return "";
      return mapa.fuera[c.cod] || "esperando sincronización";
    };
    // Una franja horizontal por barrio (ej. CLUB DE MAR) y adentro las casas en orden natural (Club del Mar 5 antes que 56)
    const filas = [];
    let ant = null;
    for (const c of casas.concat(viejas)) {
      if (c.barrio !== ant) { filas.push({ banda: true, barrio: c.barrio }); ant = c.barrio; }
      filas.push(c);
    }

    // 4) Escribir la hoja prolija
    hoja.clear(); hoja.clearConditionalFormatRules();
    hoja.getRange(1, 1, 1, CAB.length).setValues([CAB])
      .setFontWeight("bold").setFontColor("#ffffff").setBackground("#111111").setHorizontalAlignment("center").setVerticalAlignment("middle");
    hoja.getRange(1, 1, 1, 2).setHorizontalAlignment("left");
    const n = filas.length;
    hoja.getRange(2, C_PER, n, PERIODOS.length).setNumberFormat("@"); // texto: que Google no convierta "8500" ni fechas
    hoja.getRange(2, 1, n, CAB.length).setValues(filas.map(f => f.banda
      ? [f.barrio.toUpperCase()].concat(Array(CAB.length - 1).fill(""))
      : [f.barrio, f.casa].concat((previo[f.cod] ? previo[f.cod].per : PERIODOS.map(() => "")), [motivo(f), f.cod])));
    hoja.getRange(2, 2, n, 1).setRichTextValues(filas.map(f => [!f.banda && f.url && f.casa
      ? SpreadsheetApp.newRichTextValue().setText(f.casa).setLinkUrl(f.url).build()
      : SpreadsheetApp.newRichTextValue().setText(f.banda ? "" : f.casa).build()]));
    hoja.getRange(2, 1, n, CAB.length).setBackground("#ffffff").setVerticalAlignment("middle");
    hoja.getRange(2, C_PER, n, PERIODOS.length).setHorizontalAlignment("center");
    hoja.getRange(2, 2, n, 1).setFontWeight("bold");
    hoja.getRange(2, 1, n, 1).setFontColor("#bbbbbb").setFontSize(8); // columna Barrio: chica, la franja ya lo dice
    hoja.getRange(2, C_MAPA, n, 1).setFontColor("#c0392b").setFontSize(9);
    hoja.getRange(2, C_COD, n, 1).setFontColor("#aaaaaa").setFontSize(8);
    filas.forEach((f, i) => {
      const r = i + 2;
      if (f.banda) {
        hoja.getRange(r, 1, 1, CAB.length).merge().setBackground("#e9e2d0").setFontColor("#4a3d1a")
          .setFontWeight("bold").setFontSize(11).setHorizontalAlignment("left").setValue(f.barrio.toUpperCase());
        hoja.setRowHeight(r, 28);
      } else if (f.barrio === "Ya no está en Tokko") {
        hoja.getRange(r, 1, 1, CAB.length).setFontColor("#999999");
      }
    });

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
    libro.toast(`${casas.length} casas` + (sinCargarN ? ` · ${sinCargarN} sin agenda` : "") + (fueraN ? ` · ${fueraN} fuera del mapa` : ""), "Mapas", 6);
  } finally {
    lock.releaseLock();
  }
}
