/* ===== Común a todas las páginas: idiomas, formato, pines, ventanita, WhatsApp, selección ===== */
const TXT = {
  es: {
    todas: "Todas", venta: "Venta", temporada: "Temporada", alquiler: "Alquiler", terrenos: "Terrenos",
    casa: "Casa", depto: "Departamento", terreno: "Terreno",
    dorm: "dorm.", dormitorios: "dormitorios", dormitorio: "dormitorio", bano: "baño", banos: "baños",
    huespedes: "huéspedes", desde: "desde", quincena: "quincena", mes: "mes", dia: "día", periodo: "período",
    lote: "Lote", tarifas: "Tarifas de temporada", ver_tarifas: "Ver tarifas", ocultar_tarifas: "Ocultar tarifas",
    ver_ficha: "Ver ficha", consultar: "Consultar", guardar: "Guardar", guardada: "Guardada",
    aprox: "Ubicación aproximada", propiedades: "Propiedades", propiedad: "propiedad", propiedades_m: "propiedades",
    rango: "Venta desde", mantener: "Mantené apretado un pin para ver fotos",
    mi_seleccion: "Mi selección", seleccion: "Selección", seleccion_para: "Selección para",
    comparar: "Comparar", cerrar: "Cerrar", compartir: "Compartir", copiar: "Copiar link", copiado: "Link copiado",
    enviar_wa: "Enviar por WhatsApp", para: "Para quién es (opcional)", para_ph: "Ej. Familia Pérez",
    vacio: "Todavía no hay propiedades en la selección. Tocá el corazón en una propiedad para guardarla.",
    quitar: "Quitar", todos_barrios: "Todos los barrios", ver_mapa: "Ver mapa", barrios: "Barrios",
    precio: "Precio", superficie: "Superficie", terreno_m2: "Terreno", barrio: "Barrio", agente: "Agente",
    pie: "Precios en dólares estadounidenses. Imagen satelital: Esri, Maxar, Earthstar Geographics.",
    hover: "Pasá el mouse por un pin para ver fotos; click para abrir la ficha.",
    portada_t: "Propiedades en el mapa", portada_b: "Elegí un barrio para ver cada propiedad sobre el satélite.",
    msg: (a, p) => `Hola ${a}, me interesa esta propiedad en ${p.barrio_nombre}: ${p.titulo || TXT.es[p.tipo]} (ref. ${p.ref}). ${p.url}`,
    msg_sel: (para, url) => `${para ? "Selección para " + para : "Te comparto una selección de propiedades"} — Coldwell Banker Zetaté: ${url}`,
  },
  en: {
    todas: "All", venta: "For sale", temporada: "Seasonal rent", alquiler: "Rent", terrenos: "Land",
    casa: "House", depto: "Apartment", terreno: "Land",
    dorm: "bd", dormitorios: "bedrooms", dormitorio: "bedroom", bano: "bath", banos: "baths",
    huespedes: "guests", desde: "from", quincena: "fortnight", mes: "month", dia: "day", periodo: "period",
    lote: "Lot", tarifas: "Seasonal rates", ver_tarifas: "See rates", ocultar_tarifas: "Hide rates",
    ver_ficha: "View listing", consultar: "Ask", guardar: "Save", guardada: "Saved",
    aprox: "Approximate location", propiedades: "Properties", propiedad: "property", propiedades_m: "properties",
    rango: "For sale from", mantener: "Press and hold a pin to see photos",
    mi_seleccion: "My shortlist", seleccion: "Shortlist", seleccion_para: "Shortlist for",
    comparar: "Compare", cerrar: "Close", compartir: "Share", copiar: "Copy link", copiado: "Link copied",
    enviar_wa: "Send via WhatsApp", para: "Who is it for (optional)", para_ph: "e.g. Smith family",
    vacio: "Your shortlist is empty. Tap the heart on a property to save it.",
    quitar: "Remove", todos_barrios: "All neighborhoods", ver_mapa: "View map", barrios: "Neighborhoods",
    precio: "Price", superficie: "Built area", terreno_m2: "Lot", barrio: "Neighborhood", agente: "Agent",
    pie: "Prices in US dollars. Satellite imagery: Esri, Maxar, Earthstar Geographics.",
    hover: "Hover a pin to see photos; click to open the listing.",
    portada_t: "Properties on the map", portada_b: "Pick a neighborhood to see every property on the satellite map.",
    msg: (a, p) => `Hi ${a}, I'm interested in this property in ${p.barrio_nombre}: ${p.titulo || TXT.en[p.tipo]} (ref. ${p.ref}). ${p.url}`,
    msg_sel: (para, url) => `${para ? "Shortlist for " + para : "Here is a shortlist of properties"} — Coldwell Banker Zetaté: ${url}`,
  },
  pt: {
    todas: "Todas", venta: "Venda", temporada: "Temporada", alquiler: "Aluguel", terrenos: "Terrenos",
    casa: "Casa", depto: "Apartamento", terreno: "Terreno",
    dorm: "dorm.", dormitorios: "dormitórios", dormitorio: "dormitório", bano: "banheiro", banos: "banheiros",
    huespedes: "hóspedes", desde: "a partir de", quincena: "quinzena", mes: "mês", dia: "dia", periodo: "período",
    lote: "Lote", tarifas: "Tarifas de temporada", ver_tarifas: "Ver tarifas", ocultar_tarifas: "Ocultar tarifas",
    ver_ficha: "Ver ficha", consultar: "Consultar", guardar: "Salvar", guardada: "Salva",
    aprox: "Localização aproximada", propiedades: "Imóveis", propiedad: "imóvel", propiedades_m: "imóveis",
    rango: "Venda a partir de", mantener: "Segure um pin para ver as fotos",
    mi_seleccion: "Minha seleção", seleccion: "Seleção", seleccion_para: "Seleção para",
    comparar: "Comparar", cerrar: "Fechar", compartir: "Compartilhar", copiar: "Copiar link", copiado: "Link copiado",
    enviar_wa: "Enviar por WhatsApp", para: "Para quem é (opcional)", para_ph: "Ex. Família Silva",
    vacio: "Sua seleção está vazia. Toque no coração de um imóvel para salvá-lo.",
    quitar: "Remover", todos_barrios: "Todos os bairros", ver_mapa: "Ver mapa", barrios: "Bairros",
    precio: "Preço", superficie: "Área construída", terreno_m2: "Terreno", barrio: "Bairro", agente: "Corretor",
    pie: "Preços em dólares americanos. Imagem de satélite: Esri, Maxar, Earthstar Geographics.",
    hover: "Passe o mouse sobre um pin para ver fotos; clique para abrir a ficha.",
    portada_t: "Imóveis no mapa", portada_b: "Escolha um bairro para ver cada imóvel no mapa de satélite.",
    msg: (a, p) => `Olá ${a}, tenho interesse neste imóvel em ${p.barrio_nombre}: ${p.titulo || TXT.pt[p.tipo]} (ref. ${p.ref}). ${p.url}`,
    msg_sel: (para, url) => `${para ? "Seleção para " + para : "Compartilho uma seleção de imóveis"} — Coldwell Banker Zetaté: ${url}`,
  },
};
const PERIODOS = {
  en: { "1ra quincena de diciembre": "Dec 1–15", "2da quincena de diciembre": "Dec 16–31", "Fin de año": "New Year's",
        "1ra quincena de enero": "Jan 1–15", "2da quincena de enero": "Jan 16–31", "1ra quincena de febrero": "Feb 1–15",
        "2da quincena de febrero": "Feb 16–28", "1ra quincena de marzo": "Mar 1–15", "2da quincena de marzo": "Mar 16–31",
        "Diciembre": "December", "Enero": "January", "Febrero": "February", "Marzo": "March", "Semana santa": "Easter week", "Por dia": "Per day" },
  pt: { "1ra quincena de diciembre": "1ª quinzena de dezembro", "2da quincena de diciembre": "2ª quinzena de dezembro", "Fin de año": "Réveillon",
        "1ra quincena de enero": "1ª quinzena de janeiro", "2da quincena de enero": "2ª quinzena de janeiro", "1ra quincena de febrero": "1ª quinzena de fevereiro",
        "2da quincena de febrero": "2ª quinzena de fevereiro", "1ra quincena de marzo": "1ª quinzena de março", "2da quincena de marzo": "2ª quinzena de março",
        "Diciembre": "Dezembro", "Enero": "Janeiro", "Febrero": "Fevereiro", "Marzo": "Março", "Semana santa": "Semana Santa", "Por dia": "Por dia" },
};

/* --- idioma --- */
const leer = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const guardarLS = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
let LANG = (() => {
  const q = new URLSearchParams(location.search).get("lang");
  if (q && TXT[q]) return q;
  const g = leer("cbz_lang"); if (g && TXT[g]) return g;
  const n = (navigator.language || "es").slice(0, 2);
  return TXT[n] ? n : "es";
})();
const t = k => TXT[LANG][k] ?? TXT.es[k] ?? k;
const tl = obj => (obj && (obj[LANG] || obj.es)) || "";
const periodo = s => (PERIODOS[LANG] || {})[s] || s;
document.documentElement.lang = LANG;
function armarIdiomas(cont, alCambiar) {
  cont.innerHTML = ["es", "en", "pt"].map(l => `<button type="button" data-l="${l}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join("");
  cont.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    LANG = b.dataset.l; guardarLS("cbz_lang", LANG); document.documentElement.lang = LANG;
    document.querySelectorAll(".idiomas button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.l === LANG)));
    track("idioma/" + LANG); alCambiar();
  }));
}

/* --- formato --- */
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => Math.round(n).toLocaleString(LANG === "en" ? "en-US" : (LANG === "pt" ? "pt-BR" : "es-UY"));
const mon = m => m === "UYU" ? "$U" : "U$S";
const corto = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace(/\.?0+$/, "").replace(".", LANG === "en" ? "." : ",") + "M" : Math.round(n / 1e3) + "K";
const mitad = b => b == null ? null : (b % 1 ? Math.floor(b) + "½" : b);
function precioOp(o, conDesde = true) {
  const base = `${mon(o.moneda)} ${fmt(o.precio)}`;
  if (o.tipo === "venta") return base;
  const u = o.unidad ? ` / ${t(o.unidad)}` : "";
  return (o.tipo === "temporada" && conDesde ? t("desde") + " " : "") + base + u;
}
const UNI_CORTA = {
  es: { quincena: "quinc.", mes: "mes", dia: "día", periodo: "per." },
  en: { quincena: "2 wks", mes: "mo", dia: "day", periodo: "per." },
  pt: { quincena: "quinz.", mes: "mês", dia: "dia", periodo: "per." },
};
function precioCorto(o) {
  const b = `${mon(o.moneda)} ${fmt(o.precio)}`;
  return o.tipo === "venta" ? b : `${b} / ${UNI_CORTA[LANG][o.unidad || "mes"]}`;
}
function lineaSecundaria(p) {
  if (p.tipo === "terreno") return `${t("terreno")}${p.m2_terreno ? " · " + fmt(p.m2_terreno) + " m²" : ""}`;
  if (p.dormitorios) return `${p.dormitorios} ${p.dormitorios === 1 ? t("dormitorio") : t("dormitorios")}`;
  return t(p.tipo);
}
function specs(p) {
  const s = [];
  if (p.tipo !== "terreno" && p.dormitorios) s.push(`${p.dormitorios} ${t("dorm")}`);
  if (p.banos) s.push(`${mitad(p.banos)} ${p.banos === 1 ? t("bano") : t("banos")}`);
  if (p.m2_cubiertos) s.push(`${fmt(p.m2_cubiertos)} m²`);
  if (p.m2_terreno && (p.tipo === "terreno" || p.m2_terreno > 400)) s.push(`${t("terreno_m2")} ${fmt(p.m2_terreno)} m²`);
  if (p.huespedes && p.ops.some(o => o.tipo === "temporada")) s.push(`${p.huespedes} ${t("huespedes")}`);
  return s.map(x => `<span>${esc(x)}</span>`).join("");
}
function opPrincipal(p, filtroOp) {
  return (filtroOp && p.ops.find(o => o.tipo === filtroOp)) || p.ops[0];
}

/* --- estadísticas (GoatCounter, si está configurado) --- */
function track(evento) {
  try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: evento, title: evento, event: true }); } catch (_) {}
}
function cargarEstadisticas(sitio) {
  if (!sitio.goatcounter) return;
  const s = document.createElement("script");
  s.async = true; s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${sitio.goatcounter}.goatcounter.com/count`;
  document.head.appendChild(s);
}

/* --- WhatsApp --- */
function linkWA(p) {
  const nombre = (p.agente?.nombre || "").split(" ")[0];
  const a = /coldwell/i.test(nombre) ? "" : nombre;
  return `https://wa.me/${p.agente.wa}?text=${encodeURIComponent(TXT[LANG].msg(a, p).replace(/^(Hola|Hi|Olá) ,/, "$1,"))}`;
}
const ICONO_WA = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>';
const ICONO_CORAZON = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2 0 3.5 1.1 4.3 2.4.8-1.3 2.3-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z"/></svg>';

/* --- selección (favoritos, guardados en este navegador) --- */
const FAV = {
  lista() { try { return JSON.parse(leer("cbz_fav") || "[]"); } catch (_) { return []; } },
  tiene(ref) { return this.lista().includes(ref); },
  alternar(ref) {
    const l = this.lista(); const i = l.indexOf(ref);
    if (i >= 0) l.splice(i, 1); else l.push(ref);
    guardarLS("cbz_fav", JSON.stringify(l)); track((i >= 0 ? "quitar/" : "guardar/") + ref);
    document.dispatchEvent(new CustomEvent("fav")); return i < 0;
  },
  quitar(ref) { const l = this.lista().filter(x => x !== ref); guardarLS("cbz_fav", JSON.stringify(l)); document.dispatchEvent(new CustomEvent("fav")); },
};
const raiz = () => location.pathname.replace(/[^/]*\/[^/]*$/, "").replace(/\/?$/, "/");
function urlSeleccion(refs, para) {
  const u = new URL(location.origin + raiz() + "seleccion/");
  u.searchParams.set("p", refs.join(","));
  if (para) u.searchParams.set("para", para);
  if (LANG !== "es") u.searchParams.set("lang", LANG);
  return u.toString();
}

/* --- mapa base --- */
function mapaBase(id) {
  const mapa = L.map(id, { zoomSnap: 0.25, zoomControl: false, attributionControl: true, maxZoom: 19 });
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxNativeZoom: 18, maxZoom: 19, attribution: "Esri, Maxar, Earthstar Geographics",
  }).addTo(mapa);
  mapa.attributionControl.setPrefix(false);
  mapa.setView([-34.86, -54.75], 11); /* vista inicial: sin esto los pines no existen hasta encuadrar */
  L.control.zoom({ position: "bottomright" }).addTo(mapa);
  return mapa;
}
const tactil = window.matchMedia("(hover: none)").matches;
const movil = () => window.matchMedia("(max-width:899px)").matches;

/* --- etiquetas sin superponerse --- */
function acomodarEtiquetas(items, prioridad) {
  const vis = items.filter(it => it.visible && it.pinEl());
  vis.forEach(it => it.pinEl().classList.remove("sin-tag"));
  const medidas = vis.map(it => ({ it, r: it.pinEl().querySelector(".tag").getBoundingClientRect() }));
  medidas.sort((a, b) => prioridad(b.it) - prioridad(a.it));
  const puestas = [];
  for (const m of medidas) {
    const r = m.r, pad = 3;
    const choca = puestas.some(q => !(r.right + pad < q.left || r.left - pad > q.right || r.bottom + pad < q.top || r.top - pad > q.bottom));
    if (choca) m.it.pinEl().classList.add("sin-tag"); else puestas.push(r);
  }
}

/* --- ventanita con carrusel --- */
function htmlVista(p, filtroOp) {
  const f = p.fotos || [];
  const ops = p.ops.map(o => `<div class="op op-${o.tipo}"><span class="op-n">${t(o.tipo)}</span><span class="precio">${esc(precioOp(o))}</span></div>`).join("");
  const temp = p.ops.find(o => o.tipo === "temporada" && o.periodos && o.periodos.length > 1);
  const tarifas = temp ? `<details class="tarifas"><summary>${t("ver_tarifas")}</summary><table>${temp.periodos.map(x =>
    `<tr><td>${esc(periodo(x.periodo))}</td><td>${mon(x.moneda)} ${fmt(x.precio)}</td></tr>`).join("")}</table></details>` : "";
  const fav = FAV.tiene(p.ref);
  return `<div class="prev">
    ${f.length ? `<div class="carr">
      <div class="pista-f" tabindex="0" aria-label="Fotos">${f.map((s, k) =>
        `<img src="${esc(s)}" alt="" ${k > 1 ? 'loading="lazy"' : ""} draggable="false">`).join("")}</div>
      ${f.length > 1 ? `<button class="flecha ant" type="button" aria-label="‹" disabled>‹</button>
      <button class="flecha sig" type="button" aria-label="›">›</button>
      <span class="cont">1 / ${f.length}</span>` : ""}
      <span class="chip-tipo">${esc(p.lote ? t("lote") + " " + p.lote : t(p.tipo))}</span>
    </div>` : ""}
    <div class="cuerpo">
      ${ops}
      <span class="specs">${specs(p)}</span>
      ${p.aprox ? `<span class="aprox">${t("aprox")}</span>` : ""}
      ${tarifas}
      <div class="acciones">
        <a class="b-ficha" href="${esc(p.url)}" target="_blank" rel="noopener" data-ev="ficha">${t("ver_ficha")} ↗</a>
        <a class="b-wa" href="${esc(linkWA(p))}" target="_blank" rel="noopener" data-ev="whatsapp">${ICONO_WA}${t("consultar")}</a>
        <button class="b-fav" type="button" aria-pressed="${fav}" aria-label="${fav ? t("guardada") : t("guardar")}" title="${fav ? t("guardada") : t("guardar")}">${ICONO_CORAZON}</button>
      </div>
    </div></div>`;
}
function armarVista(raizEl, p) {
  const pista = raizEl.querySelector(".pista-f");
  if (pista) {
    const n = pista.children.length;
    const ant = raizEl.querySelector(".ant"), sig = raizEl.querySelector(".sig"), cont = raizEl.querySelector(".cont");
    const idx = () => Math.round(pista.scrollLeft / pista.clientWidth);
    const pintar = () => { const k = idx(); if (cont) cont.textContent = `${k + 1} / ${n}`; if (ant) ant.disabled = k === 0; if (sig) sig.disabled = k === n - 1; };
    const ir = d => pista.scrollTo({ left: (idx() + d) * pista.clientWidth, behavior: "smooth" });
    ant?.addEventListener("click", e => { e.stopPropagation(); ir(-1); });
    sig?.addEventListener("click", e => { e.stopPropagation(); ir(1); });
    pista.addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true });
    pista.addEventListener("keydown", e => { if (e.key === "ArrowRight") ir(1); if (e.key === "ArrowLeft") ir(-1); });
    L.DomEvent.disableScrollPropagation(pista);
  }
  raizEl.querySelectorAll("[data-ev]").forEach(a => a.addEventListener("click", () => track(a.dataset.ev + "/" + p.ref)));
  const bf = raizEl.querySelector(".b-fav");
  bf?.addEventListener("click", e => {
    e.stopPropagation();
    const on = FAV.alternar(p.ref);
    bf.setAttribute("aria-pressed", String(on)); bf.title = on ? t("guardada") : t("guardar");
  });
  const det = raizEl.querySelector(".tarifas");
  if (det) { det.addEventListener("toggle", () => det.querySelector("summary").textContent = det.open ? t("ocultar_tarifas") : t("ver_tarifas")); L.DomEvent.disableScrollPropagation(det); }
}

/* --- pin --- */
function htmlPin(p, filtroOp) {
  const o = opPrincipal(p, filtroOp);
  return `<a class="pin ${o.tipo}${p.tipo === "terreno" ? " es-terreno" : ""}" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="${esc(precioOp(o))}, ${esc(lineaSecundaria(p))}">
    <span class="dot"></span><span class="tag"><b>${esc(precioCorto(o))}</b><span>${esc(lineaSecundaria(p))}</span></span></a>`;
}
