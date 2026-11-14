/* ===== Común a todas las páginas: idiomas, formato, pines, ventanita, WhatsApp, selección ===== */
const TXT = {
  es: {
    masterplan: "Masterplan", satelite: "Satélite", ayuda_mp: "Rueda del mouse o + / − para ampliar el plano", ayuda_mp_t: "Pellizcá para ampliar el plano",
    hectareas: "hectáreas", en_venta: "en venta", el_proyecto: "El proyecto", ventajas: "Por qué invertir", amenities: "Amenities", ubicacion: "Ubicación", linea_recta: "Distancias aproximadas en línea recta.", ver_en_mapa: "Ver en el mapa", lotes_venta: "Lotes en venta", otros_lotes: "Otros lotes", areas_comunes: "Áreas comunes", superficie_l: "Superficie", brochure_b: "Brochure", bajar_kmz: "Descargar plano (Google Earth)", plano: "Plano",
    desarrollos: "Desarrollos", desarrollo: "Desarrollo", edificio: "Edificio", edificios: "Edificios", barrio_dev: "Barrio en desarrollo", barrios_dev: "Barrios · lotes",
    unidades: "Unidades", unidad: "unidad", unidades_m: "unidades", lotes: "Lotes", lote_m: "lote", lotes_m: "lotes", entrega: "Entrega", todos: "Todos",
    desarrollos_b: "Edificios y barrios en desarrollo: unidades y lotes para invertir desde el inicio.", proximamente: "Próximamente",
    proximamente_b: "Estamos cargando los nuevos desarrollos. Escribinos y te avisamos primero.", consultar_dev: "Consultar por este desarrollo",
    ver_desarrollos: "Desarrollos", todos_desarrollos: "Todos los desarrollos", unidades_pronto: "Unidades disponibles a consultar.",
    ver_mas: "Ver más", ver_menos: "Ver menos", brochure: "Más información", deslizar: "Deslizá para ver desarrollos", msg_devs: "Hola, quiero recibir información de los nuevos desarrollos de Coldwell Banker Zetaté.",
    msg_dev: d => `Hola, me interesa el desarrollo ${d.nombre} (${d.zona}). ¿Me pasan información? ${location.origin}${raiz()}desarrollos/${d.slug}/`,
    consultar_precio: "Consultar precio", ver_disp: "Ver disponibilidad", ocultar_disp: "Ocultar disponibilidad", agenda: "Agenda", disponible: "Disponible", sin_tarifa: "Sin tarifa", libre_dias: "Libre", libre: "Libre", ocupado: "Ocupado", alquilada: "Alquilada", reservada: "Reservada", se_libera: "Se libera",
    libres_mes: "Libre", sin_libres: "Sin días libres este mes", todo_libre: "Todo el mes libre", dias_sem: "LMMJVSD",
    todas: "Todas", venta: "Venta", temporada: "Temporada", alquiler: "Alquiler", terrenos: "Terrenos",
    casa: "Casa", depto: "Departamento", terreno: "Terreno",
    dorm: "dorm.", dormitorios: "dormitorios", dormitorio: "dormitorio", bano: "baño", banos: "baños",
    huespedes: "huéspedes", desde: "desde", quincena: "quincena", mes: "mes", dia: "día", periodo: "período",
    lote: "Lote", vendido: "Vendido", reservado: "Reservado", interno: "Carpeta interna", drive_b: "Drive", brochure_en: "Otros idiomas", tarifas: "Tarifas de temporada", ver_tarifas: "Ver tarifas", ocultar_tarifas: "Ocultar tarifas",
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
    masterplan: "Masterplan", satelite: "Satellite", ayuda_mp: "Scroll or + / − to zoom into the plan", ayuda_mp_t: "Pinch to zoom into the plan",
    hectareas: "hectares", en_venta: "for sale", el_proyecto: "The project", ventajas: "Why invest", amenities: "Amenities", ubicacion: "Location", linea_recta: "Approximate straight-line distances.", ver_en_mapa: "See on the map", lotes_venta: "Lots for sale", otros_lotes: "Other lots", areas_comunes: "Common areas", superficie_l: "Size", brochure_b: "Brochure", bajar_kmz: "Download plan (Google Earth)", plano: "Plan",
    desarrollos: "Developments", desarrollo: "Development", edificio: "Building", edificios: "Buildings", barrio_dev: "Community in development", barrios_dev: "Communities · lots",
    unidades: "Units", unidad: "unit", unidades_m: "units", lotes: "Lots", lote_m: "lot", lotes_m: "lots", entrega: "Delivery", todos: "All",
    desarrollos_b: "Buildings and communities under development: units and lots to invest from day one.", proximamente: "Coming soon",
    proximamente_b: "We are loading the new developments. Message us and you'll hear first.", consultar_dev: "Ask about this development",
    ver_desarrollos: "Developments", todos_desarrollos: "All developments", unidades_pronto: "Units available on request.",
    ver_mas: "Read more", ver_menos: "Show less", brochure: "More information", deslizar: "Swipe to see developments", msg_devs: "Hi, I would like information about Coldwell Banker Zetaté's new developments.",
    msg_dev: d => `Hi, I'm interested in the ${d.nombre} development (${d.zona}). Could you send me information? ${location.origin}${raiz()}desarrollos/${d.slug}/`,
    consultar_precio: "Price on request", ver_disp: "See availability", ocultar_disp: "Hide availability", agenda: "Availability", disponible: "Available", sin_tarifa: "No rate", libre_dias: "Free", libre: "Available", ocupado: "Booked", alquilada: "Rented", reservada: "Reserved", se_libera: "Opens up",
    libres_mes: "Available", sin_libres: "Fully booked this month", todo_libre: "Available all month", dias_sem: "MTWTFSS",
    todas: "All", venta: "For sale", temporada: "Seasonal rent", alquiler: "Rent", terrenos: "Land",
    casa: "House", depto: "Apartment", terreno: "Land",
    dorm: "bd", dormitorios: "bedrooms", dormitorio: "bedroom", bano: "bath", banos: "baths",
    huespedes: "guests", desde: "from", quincena: "fortnight", mes: "month", dia: "day", periodo: "period",
    lote: "Lot", vendido: "Sold", reservado: "Reserved", interno: "Internal folder", drive_b: "Drive", brochure_en: "Other languages", tarifas: "Seasonal rates", ver_tarifas: "See rates", ocultar_tarifas: "Hide rates",
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
    masterplan: "Masterplan", satelite: "Satélite", ayuda_mp: "Use a roda do mouse ou + / − para ampliar a planta", ayuda_mp_t: "Faça pinça para ampliar a planta",
    hectareas: "hectares", en_venta: "à venda", el_proyecto: "O projeto", ventajas: "Por que investir", amenities: "Amenities", ubicacion: "Localização", linea_recta: "Distâncias aproximadas em linha reta.", ver_en_mapa: "Ver no mapa", lotes_venta: "Lotes à venda", otros_lotes: "Outros lotes", areas_comunes: "Áreas comuns", superficie_l: "Área", brochure_b: "Brochure", bajar_kmz: "Baixar planta (Google Earth)", plano: "Planta",
    desarrollos: "Empreendimentos", desarrollo: "Empreendimento", edificio: "Edifício", edificios: "Edifícios", barrio_dev: "Condomínio em desenvolvimento", barrios_dev: "Condomínios · lotes",
    unidades: "Unidades", unidad: "unidade", unidades_m: "unidades", lotes: "Lotes", lote_m: "lote", lotes_m: "lotes", entrega: "Entrega", todos: "Todos",
    desarrollos_b: "Edifícios e condomínios em desenvolvimento: unidades e lotes para investir desde o início.", proximamente: "Em breve",
    proximamente_b: "Estamos carregando os novos empreendimentos. Escreva para nós e avisamos primeiro.", consultar_dev: "Consultar este empreendimento",
    ver_desarrollos: "Empreendimentos", todos_desarrollos: "Todos os empreendimentos", unidades_pronto: "Unidades disponíveis sob consulta.",
    ver_mas: "Ver mais", ver_menos: "Ver menos", brochure: "Mais informações", deslizar: "Deslize para ver empreendimentos", msg_devs: "Olá, quero receber informações sobre os novos empreendimentos da Coldwell Banker Zetaté.",
    msg_dev: d => `Olá, tenho interesse no empreendimento ${d.nombre} (${d.zona}). Podem me enviar informações? ${location.origin}${raiz()}desarrollos/${d.slug}/`,
    consultar_precio: "Consultar preço", ver_disp: "Ver disponibilidade", ocultar_disp: "Ocultar disponibilidade", agenda: "Agenda", disponible: "Disponível", sin_tarifa: "Sem tarifa", libre_dias: "Livre", libre: "Livre", ocupado: "Ocupado", alquilada: "Alugada", reservada: "Reservada", se_libera: "Libera",
    libres_mes: "Livre", sin_libres: "Sem dias livres este mês", todo_libre: "Mês todo livre", dias_sem: "STQQSSD",
    todas: "Todas", venta: "Venda", temporada: "Temporada", alquiler: "Aluguel", terrenos: "Terrenos",
    casa: "Casa", depto: "Apartamento", terreno: "Terreno",
    dorm: "dorm.", dormitorios: "dormitórios", dormitorio: "dormitório", bano: "banheiro", banos: "banheiros",
    huespedes: "hóspedes", desde: "a partir de", quincena: "quinzena", mes: "mês", dia: "dia", periodo: "período",
    lote: "Lote", vendido: "Vendido", reservado: "Reservado", interno: "Pasta interna", drive_b: "Drive", brochure_en: "Outros idiomas", tarifas: "Tarifas de temporada", ver_tarifas: "Ver tarifas", ocultar_tarifas: "Ocultar tarifas",
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
  if (o.precio == null) return t("consultar_precio"); /* temporada marcada en la planilla, sin tarifa en Tokko */
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
  if (o.precio == null) return t("consultar_precio");
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
  if (!sitio.goatcounter || document.querySelector("script[data-goatcounter]")) return;
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
const ICONO_CAL = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4"/></svg>';
const tieneAgenda = p => p.ops.some(o => o.tipo === "temporada");
const htmlBotonAgenda = (clase = "") => `<button class="b-agenda ${clase}" type="button" aria-expanded="false">${ICONO_CAL}<span>${t("ver_disp")}</span></button>`;
/* botón Agenda: abre/cierra el calendario en `caja` (o "a confirmar" si la casa no tiene fechas en la planilla) */
function engancharAgenda(btn, caja, p, alCambiar) {
  if (!btn || !caja) return;
  btn.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    const abrir = caja.hidden;
    caja.hidden = !abrir; btn.setAttribute("aria-expanded", String(abrir));
    btn.querySelector("span").textContent = abrir ? t("ocultar_disp") : t("ver_disp");
    if (abrir) {
      armarAgenda(caja, p);
      track("disponibilidad/" + p.ref);
    }
    alCambiar && alCambiar(abrir);
  });
  caja.addEventListener("click", e => { if (!e.target.closest("a")) e.stopPropagation(); });
}
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
const raiz = () => (typeof DATOS !== "undefined" && DATOS && DATOS.raiz) ? new URL(DATOS.raiz, location.href).pathname
  : location.pathname.replace(/[^/]*\/[^/]*$/, "").replace(/\/?$/, "/");
function urlSeleccion(refs, para) {
  const u = new URL(location.origin + raiz() + "seleccion/");
  u.searchParams.set("p", refs.join(","));
  if (para) u.searchParams.set("para", para);
  if (LANG !== "es") u.searchParams.set("lang", LANG);
  return u.toString();
}

/* --- desarrollos --- */
const ICONO_EDIF = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M5 21V4.5L14 3v18M14 9l5 1.5V21M3 21h18M8 7.5h3M8 11h3M8 14.5h3M8 18h3M16.5 13h.5M16.5 16.5h.5"/></svg>';
const ICONO_LOTES = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M3.5 6.5 12 3l8.5 3.5v11L12 21l-8.5-3.5zM12 3v18M3.5 12l8.5 3.5 8.5-3.5"/></svg>';
const iconoDev = d => d.clase === "edificio" ? ICONO_EDIF : ICONO_LOTES;
const claseDev = d => d.clase === "edificio" ? t("edificio") : t("barrio_dev");
function resumenDev(d) { /* cifras del proyecto cargadas por nosotros (ej. "104 hectáreas · ≈240 lotes") */
  return (d.cifras || []).slice(0, 2).map(x => `${tl(x.valor) || x.valor} ${tl(x.nombre).split(" ")[0]}`).join(" · ");
}
const waDev = d => `https://wa.me/${d.wa || (DATOS.sitio || {}).whatsapp_general}?text=${encodeURIComponent(TXT[LANG].msg_dev(d))}`;

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
  const tarifas = temp && !tieneAgenda(p) ? `<details class="tarifas"><summary>${t("ver_tarifas")}</summary><table>${temp.periodos.map(x =>
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
      ${tieneAgenda(p) ? htmlBotonAgenda() + `<div class="agenda" hidden><div class="per"></div><div class="cal"></div></div>` : ""}
      ${tarifas}
      <div class="acciones">
        <a class="b-ficha" href="${esc(p.url)}" target="_blank" rel="noopener" data-ev="ficha">${t("ver_ficha")} ↗</a>
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
  const det = raizEl.querySelector(".tarifas:not(.agenda)");
  if (det) { det.addEventListener("toggle", () => det.querySelector("summary").textContent = det.open ? t("ocultar_tarifas") : t("ver_tarifas")); L.DomEvent.disableScrollPropagation(det); }
  const ag = raizEl.querySelector(".agenda");
  engancharAgenda(raizEl.querySelector(".b-agenda"), ag, p, abierta => {
    raizEl.querySelector(".prev")?.classList.toggle("con-agenda", abierta);
    raizEl.dispatchEvent(new CustomEvent("crece", { bubbles: true }));
  });
  if (ag) { L.DomEvent.disableScrollPropagation(ag); L.DomEvent.disableClickPropagation(ag); }
}

/* --- agenda de disponibilidad ---
   Por defecto la casa está libre en los períodos con precio en Tokko (1ra quincena de enero, Fin de año…).
   Lo que se carga en "Ocupado" de la planilla se tacha. Días sin tarifa = sin precio (gris). */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MESES_N = { diciembre: 11, enero: 0, febrero: 1, marzo: 2, abril: 3, noviembre: 10 };
function anioTemporada() { const h = new Date(); return h.getMonth() <= 3 ? h.getFullYear() - 1 : h.getFullYear(); } /* dic de este año → mar del que viene */
function pascua(y) { /* domingo de Pascua (algoritmo de Gauss/Meeus) */
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mes = Math.floor((h + l - 7 * m + 114) / 31);
  return new Date(y, mes - 1, ((h + l - 7 * m + 114) % 31) + 1, 12);
}
function rangoPeriodo(nombre) { /* [desde, hasta, prioridad] o null si no es un período de fechas (ej. "Por dia") */
  const t = nombre.toLowerCase(), Y = anioTemporada(), D = (m, d) => new Date(m === 11 || m === 10 ? Y : Y + 1, m, d, 12);
  if (t.includes("fin de a")) return [D(11, 26), D(0, 2), 3];
  if (t.includes("santa") || t.includes("turismo")) { const p = pascua(Y + 1); const lu = new Date(p); lu.setDate(p.getDate() - 6); return [lu, p, 3]; }
  const k = Object.keys(MESES_N).find(m => t.includes(m));
  if (k == null) return null;
  const m = MESES_N[k], fin = new Date(m === 11 || m === 10 ? Y : Y + 1, m + 1, 0).getDate();
  if (t.includes("1ra") || t.includes("primera")) return [D(m, 1), D(m, 15), 2];
  if (t.includes("2da") || t.includes("segunda")) return [D(m, 16), D(m, fin), 2];
  return [D(m, 1), D(m, fin), 1];
}
function diasOcupados(p) {
  const s = new Set();
  for (const [a, b] of p.ocupado || []) {
    const d = new Date(a + "T12:00"), fin = new Date(b + "T12:00");
    for (; d <= fin; d.setDate(d.getDate() + 1)) s.add(iso(d));
  }
  return s;
}
function datosAgenda(p) {
  if (p._ag) return p._ag;
  const temp = p.ops.find(o => o.tipo === "temporada");
  /* agenda propia (hoja "Agenda"): períodos, precios y estado salen de ahí; si la casa no tiene, Tokko + "Ocupado" */
  const fuente = p.agenda && p.agenda.length ? p.agenda : ((temp && temp.periodos) || [{ periodo: "", precio: temp.precio, moneda: temp.moneda }]);
  const per = fuente.map(x => ({ ...x, r: rangoPeriodo(x.periodo || "") }));
  const precioDia = new Map(); /* iso → período (gana el más específico: Fin de año > quincena > mes) */
  for (const x of per) {
    if (!x.r) continue;
    for (const d = new Date(x.r[0]); d <= x.r[1]; d.setDate(d.getDate() + 1)) {
      const k = iso(d), y = precioDia.get(k);
      if (!y || y.r[2] < x.r[2]) precioDia.set(k, x);
    }
  }
  const occ = diasOcupados(p), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const x of per) { /* alquilada / reservada = días ocupados, salvo los que la planilla marca como "libre" */
    if (!x.r || !x.estado || x.estado === "disponible") continue;
    for (const d = new Date(x.r[0]); d <= x.r[1]; d.setDate(d.getDate() + 1)) occ.add(iso(d));
  }
  for (const x of per) for (const [a, b] of x.libre || []) { /* solo dentro de su propio período */
    if (!x.r) continue;
    for (const d = new Date(a + "T12:00"), fin = new Date(b + "T12:00"); d <= fin; d.setDate(d.getDate() + 1))
      if (d >= x.r[0] && d <= x.r[1]) occ.delete(iso(d));
  }
  /* hoja "Ocupación" (la carga la página interna /agenda/): días exactos; "libre" libera días de un período tomado */
  const estDia = new Map();
  for (const z of p.ocupacion || []) for (const d = new Date(z.d + "T12:00"), fin = new Date(z.h + "T12:00"); d <= fin; d.setDate(d.getDate() + 1)) {
    const k = iso(d);
    if (z.e === "libre") { occ.delete(k); estDia.delete(k); } else { occ.add(k); estDia.set(k, z.e); }
  }
  for (const x of per) { /* período entero tomado día por día = se muestra como alquilado / reservado, con su precio */
    if (!x.r || (x.estado && x.estado !== "disponible") || !estDia.size) continue;
    let todo = true, res = false;
    for (const d = new Date(x.r[0]); d <= x.r[1]; d.setDate(d.getDate() + 1)) { const e = estDia.get(iso(d)); if (!e) { todo = false; break; } if (e === "reservada") res = true; }
    if (todo) x.estado = res ? "reservada" : "alquilada";
  }
  const conFechas = per.filter(x => x.r);
  /* meses a mostrar: de dic a mar de la temporada (o lo que cubran las tarifas / ocupados) */
  const Y = anioTemporada();
  let desde = new Date(Y, 11, 1), hasta = new Date(Y + 1, 2, 1);
  for (const x of conFechas) { if (x.r[0] < desde) desde = new Date(x.r[0].getFullYear(), x.r[0].getMonth(), 1); if (x.r[1] > hasta) hasta = new Date(x.r[1].getFullYear(), x.r[1].getMonth(), 1); }
  for (const [, b] of p.ocupado || []) { const f = new Date(b + "T12:00"); if (f > hasta) hasta = new Date(f.getFullYear(), f.getMonth(), 1); }
  for (const z of p.ocupacion || []) { const f = new Date(z.h + "T12:00"); if (f > hasta && z.e !== "libre") hasta = new Date(f.getFullYear(), f.getMonth(), 1); }
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (desde < primero) desde = primero;
  const meses = [];
  for (const d = new Date(desde); d <= hasta && meses.length < 18; d.setMonth(d.getMonth() + 1)) meses.push(new Date(d));
  if (!meses.length) meses.push(primero);
  return (p._ag = { per, precioDia, occ, sinTarifas: !conFechas.length, meses, hoy: iso(hoy) });
}
const dm = k => `${+k.slice(8)}/${+k.slice(5, 7)}`;
function rangosFechas(keys) { /* ["2027-01-01",…] → "1/1–8/1, 20/1–31/1" */
  const r = [];
  for (const k of keys) { const u = r[r.length - 1], prev = u && new Date(u[1] + "T12:00"); if (prev) prev.setDate(prev.getDate() + 1);
    if (u && iso(prev) === k) u[1] = k; else r.push([k, k]); }
  return r.map(([a, b]) => a === b ? dm(a) : `${dm(a)}–${dm(b)}`).join(", ");
}
function armarAgenda(caja, p) {
  const A = datosAgenda(p);
  const tomada = x => x.estado === "alquilada" || x.estado === "reservada";
  /* períodos ya pasados se ocultan, salvo los alquilados de la agenda propia: se ve a cuánto se alquiló */
  const filas = A.per.filter(x => !x.r || iso(x.r[1]) >= A.hoy || tomada(x)).map(x => {
    let estado = "", cls = "";
    if (x.r) {
      const pasado = iso(x.r[1]) < A.hoy;
      const dias = []; for (const d = new Date(x.r[0]); d <= x.r[1]; d.setDate(d.getDate() + 1)) { const k = iso(d); if (k >= A.hoy) dias.push(k); }
      const libres = dias.filter(k => !A.occ.has(k));
      if (pasado) { estado = t(x.estado); cls = "oc pas"; }
      else if (libres.length === dias.length) { estado = t("disponible"); cls = "li"; }
      else if (!libres.length) { estado = tomada(x) ? t(x.estado) : t("ocupado"); cls = "oc"; }
      else { estado = `${t(tomada(x) ? "se_libera" : "libre_dias")} ${rangosFechas(libres)}`; cls = "pa"; }
    }
    const precio = x.precio ? `${mon(x.moneda)} ${fmt(x.precio)}` : "";
    return x.periodo ? `<tr class="${cls}"><td>${esc(periodo(x.periodo))}</td><td>${precio}</td><td>${esc(estado)}</td></tr>` : "";
  }).join("");
  caja.querySelector(".per").innerHTML = filas ? `<table class="tabla-disp">${filas}</table>` : "";
  const cal = caja.querySelector(".cal");
  if (cal._k == null) { const i = A.meses.findIndex(d => [...A.precioDia.keys()].some(k => k.startsWith(iso(d).slice(0, 7)))); cal._k = Math.max(0, i); }
  armarCalendario(cal, p);
}
function armarCalendario(el, p) {
  const A = datosAgenda(p);
  const d0 = A.meses[el._k], y = d0.getFullYear(), m = d0.getMonth();
  const n = new Date(y, m + 1, 0).getDate(), hueco = (new Date(y, m, 1).getDay() + 6) % 7;
  let celdas = "", hayTarifa = false;
  for (let i = 0; i < hueco; i++) celdas += "<span></span>";
  for (let d = 1; d <= n; d++) {
    const k = iso(new Date(y, m, d)), pasado = k < A.hoy, oc = A.occ.has(k), x = A.precioDia.get(k);
    const conTarifa = A.sinTarifas || !!x; if (x) hayTarifa = true;
    const cls = oc ? "oc" : conTarifa ? "li" : "st";
    const tit = x ? `${periodo(x.periodo)}${x.precio ? ` · ${mon(x.moneda)} ${fmt(x.precio)}` : ""}` : "";
    celdas += `<span class="d ${cls}${pasado ? " pas" : ""}${k === A.hoy ? " hoy" : ""}"${tit ? ` title="${esc(tit)}"` : ""}>${d}</span>`;
  }
  const nombre = new Intl.DateTimeFormat(LANG === "en" ? "en-US" : LANG, { month: "long", year: "numeric" }).format(d0).replace(/^./, c => c.toUpperCase());
  el.innerHTML = `<div class="cal-cab">
      <button type="button" class="cal-ant" aria-label="‹" ${el._k === 0 ? "disabled" : ""}>‹</button>
      <span>${esc(nombre)}</span>
      <button type="button" class="cal-sig" aria-label="›" ${el._k === A.meses.length - 1 ? "disabled" : ""}>›</button></div>
    <div class="cal-grid">${[...t("dias_sem")].map(x => `<b>${x}</b>`).join("")}${celdas}</div>
    <div class="cal-pie"><span class="cal-ley"><i class="li"></i>${t("disponible")} <i class="oc"></i>${t("ocupado")}${!A.sinTarifas ? ` <i class="st"></i>${t("sin_tarifa")}` : ""}</span></div>`;
  el.querySelector(".cal-ant").addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); el._k--; armarCalendario(el, p); });
  el.querySelector(".cal-sig").addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); el._k++; armarCalendario(el, p); });
}

/* --- pin --- */
function htmlPin(p, filtroOp) {
  const o = opPrincipal(p, filtroOp);
  return `<a class="pin ${o.tipo}${p.tipo === "terreno" ? " es-terreno" : ""}" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="${esc(precioOp(o))}, ${esc(lineaSecundaria(p))}">
    <span class="dot"></span><span class="tag"><b>${esc(precioCorto(o))}</b><span>${esc(lineaSecundaria(p))}</span></span></a>`;
}

/* --- modo interno (solo equipo) ---
   Engranaje discreto en una esquina → contraseña → se habilitan funciones internas (ej. botón a la carpeta de Drive del desarrollo).
   Los datos internos viajan cifrados en interno.dat (AES-GCM, clave derivada de la contraseña con PBKDF2): sin la contraseña
   no hay forma de leerlos desde el código de la página. Se descifra en el navegador y queda en INTERNO.datos.
   Las páginas escuchan el evento "interno" para volver a dibujarse al entrar o salir. */
const INTERNO = {
  datos: null,
  activo() { return !!this.datos; },
  dev(slug) { return ((this.datos || {}).desarrollos || {})[slug] || {}; },
  token() { return (this.datos || {})._tk || ""; }, /* llave para la App web de la planilla (página /agenda/) */
};
(function () {
  const K = "cbz_interno";
  const sesion = { get: () => { try { return sessionStorage.getItem(K); } catch (_) { return null; } }, set: v => { try { sessionStorage.setItem(K, v); } catch (_) {} }, del: () => { try { sessionStorage.removeItem(K); } catch (_) {} } };
  try { INTERNO.datos = JSON.parse(sesion.get() || leer(K) || "null"); } catch (_) { INTERNO.datos = null; }
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const a64 = u => btoa(String.fromCharCode(...new Uint8Array(u)));
  const bajar = async () => { const r = await fetch(raiz() + "interno.dat", { cache: "no-cache" }); if (!r.ok) throw new Error("sin-archivo"); return r.json(); };
  const abrir = async (j, llave) => JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(j.n) }, llave, b64(j.c))));
  /* la llave derivada (no la contraseña) queda guardada junto a los datos (_k, con su sal _s): así, cuando el build publica
     un interno.dat nuevo (ej. precios actualizados), la página lo abre sola sin volver a pedir la contraseña */
  async function descifrar(clave) {
    const j = await bajar();
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveKey"]);
    const llave = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(j.s), iterations: j.it, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
    const d = await abrir(j, llave);
    return Object.assign(d, { _k: a64(await crypto.subtle.exportKey("raw", llave)), _s: j.s, _n: j.n });
  }
  const guardar = (d, recordar) => { const s = JSON.stringify(d); sesion.set(s); if (recordar) guardarLS(K, s); };
  async function refrescar() {
    const d = INTERNO.datos;
    if (!d || !d._k || !(window.crypto && crypto.subtle)) return;
    try {
      const j = await bajar();
      if (j.n === d._n || j.s !== d._s) return; /* sin cambios, o cambió la contraseña (hay que volver a entrar) */
      const llave = await crypto.subtle.importKey("raw", b64(d._k), "AES-GCM", false, ["decrypt"]);
      const nuevo = Object.assign(await abrir(j, llave), { _k: d._k, _s: d._s, _n: j.n, _tk: d._tk });
      INTERNO.datos = nuevo; guardar(nuevo, !!leer(K)); avisar();
    } catch (_) {}
  }
  const avisar = () => document.dispatchEvent(new CustomEvent("interno"));
  setTimeout(refrescar, 400);
  const css = document.createElement("style");
  css.textContent = `
  #cbz-int{position:fixed;left:max(10px,env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:5000;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(10,10,10,.72);color:#fff;opacity:.45;display:grid;place-items:center;padding:0;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:opacity .2s}
  #cbz-int:hover,#cbz-int:focus-visible{opacity:1}
  #cbz-int.on{opacity:1;color:#c8b28a;border-color:#c8b28a}
  #cbz-int-m{position:fixed;inset:0;z-index:5001;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:20px}
  #cbz-int-m form,#cbz-int-m .c{background:#111;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:22px 20px 18px;width:min(320px,100%);color:#f3f1ec;font:14px/1.4 "Hanken Grotesk",system-ui,sans-serif;box-sizing:border-box}
  #cbz-int-m h3{margin:0 0 4px;font:italic 500 22px "Bodoni Moda",Georgia,serif}
  #cbz-int-m p{margin:0 0 14px;color:#9b978f;font-size:12.5px}
  #cbz-int-m input[type=password]{width:100%;box-sizing:border-box;background:#000;border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;font:inherit;font-size:16px;padding:10px 12px}
  #cbz-int-m input[type=password]:focus{outline:none;border-color:#c8b28a}
  #cbz-int-m label{display:flex;gap:8px;align-items:center;margin:10px 0 0;color:#9b978f;font-size:12.5px}
  #cbz-int-m .err{color:#ff7b7b;font-size:12.5px;min-height:18px;margin:8px 0 0}
  #cbz-int-m .fila{display:flex;gap:8px;margin-top:10px}
  #cbz-int-m button{flex:1;font:600 13px "Hanken Grotesk",system-ui,sans-serif;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer}
  #cbz-int-m a.ag{display:block;text-align:center;margin:0 0 4px;padding:10px;border-radius:8px;border:1px solid #c8b28a;color:#c8b28a;font-weight:600;font-size:13px;text-decoration:none}
  #cbz-int-m button.pri{background:#c8b28a;border-color:#c8b28a;color:#111}`;
  document.head.appendChild(css);
  const eng = document.createElement("button");
  eng.id = "cbz-int"; eng.type = "button";
  eng.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM10.3 3h3.4l.5 2.4 1.7.7 2.1-1.3 2.4 2.4-1.3 2.1.7 1.7 2.4.5v3.4l-2.4.5-.7 1.7 1.3 2.1-2.4 2.4-2.1-1.3-1.7.7-.5 2.4h-3.4l-.5-2.4-1.7-.7-2.1 1.3-2.4-2.4 1.3-2.1-.7-1.7L3 13.7v-3.4l2.4-.5.7-1.7-1.3-2.1 2.4-2.4 2.1 1.3 1.7-.7z"/></svg>';
  const estado = () => { eng.classList.toggle("on", INTERNO.activo()); eng.setAttribute("aria-label", INTERNO.activo() ? "Modo interno activo" : "Acceso interno"); eng.title = eng.getAttribute("aria-label"); };
  estado();
  document.body.appendChild(eng);
  function cerrar() { const m = document.getElementById("cbz-int-m"); if (m) m.remove(); eng.focus(); }
  function modal(html) {
    cerrar();
    const m = document.createElement("div");
    m.id = "cbz-int-m"; m.innerHTML = html;
    m.addEventListener("click", e => { if (e.target === m) cerrar(); });
    m.addEventListener("keydown", e => { if (e.key === "Escape") cerrar(); });
    document.body.appendChild(m);
    return m;
  }
  eng.addEventListener("click", () => {
    if (INTERNO.activo()) {
      const m = modal('<div class="c" role="dialog" aria-modal="true"><h3>Modo interno</h3><p>Activo: ves las funciones solo para el equipo.</p><a class="ag" href="' + raiz() + 'agenda/">Agenda de temporada →</a><div class="fila"><button type="button" data-x>Cerrar</button><button type="button" class="pri" data-salir>Salir del modo interno</button></div></div>');
      m.querySelector("[data-x]").onclick = cerrar;
      m.querySelector("[data-salir]").onclick = () => { INTERNO.datos = null; sesion.del(); try { localStorage.removeItem(K); } catch (_) {} estado(); cerrar(); avisar(); };
      return;
    }
    const m = modal('<form role="dialog" aria-modal="true" autocomplete="off"><h3>Acceso interno</h3><p>Solo para el equipo de Coldwell Banker Zetaté.</p><input type="password" name="clave" placeholder="Contraseña" autocomplete="current-password" required><label><input type="checkbox" name="recordar"> Recordar en este equipo</label><div class="err" role="alert"></div><div class="fila"><button type="button" data-x>Cancelar</button><button type="submit" class="pri">Entrar</button></div></form>');
    const f = m.querySelector("form"), err = f.querySelector(".err"), inp = f.clave;
    inp.focus();
    m.querySelector("[data-x]").onclick = cerrar;
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const ok = f.querySelector(".pri"); ok.disabled = true; err.textContent = "";
      try {
        if (!(window.crypto && crypto.subtle)) throw new Error("sin-crypto");
        const datos = await descifrar(inp.value);
        const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cbz-agenda:" + inp.value));
        datos._tk = [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, "0")).join("");
        INTERNO.datos = datos;
        guardar(datos, f.recordar.checked);
        estado(); cerrar(); avisar();
      } catch (x) {
        err.textContent = x.message === "sin-archivo" ? "Todavía no hay datos internos publicados."
          : x.message === "sin-crypto" ? "Este navegador no permite el acceso (hace falta https)." : "Contraseña incorrecta.";
        ok.disabled = false; inp.select();
      }
    });
  });
})();

