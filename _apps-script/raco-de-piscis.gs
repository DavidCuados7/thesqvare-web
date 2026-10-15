/**
 * El Racó de Piscis · Sistema de reservas (Google Apps Script)
 * ---------------------------------------------------------------
 * - Guarda las citas en la hoja "Reservas El Racó de Piscis" (pestaña Agenda), siempre en orden cronológico.
 * - Pestaña "Hoy": resumen visual del día y de los próximos 7 días.
 * - Correos de confirmación a la clienta y de aviso al centro.
 * - La clienta puede cambiar o cancelar desde el correo (se actualiza la hoja y avisa al centro).
 * - El centro puede cambiar o cancelar desde su correo, desde el menú "📅 Citas" de la hoja
 *   o poniendo el Estado en "Cancelada por el centro" (se avisa a la clienta por correo).
 *
 * Puesta en marcha (una vez, con la cuenta thesqvare@gmail.com):
 *  1. Ejecuta la función "configurar" y acepta los permisos.
 *  2. Implementar → Nueva implementación → Aplicación web · Ejecutar como: Yo · Acceso: Cualquier usuario.
 *  3. Copia la URL que acaba en /exec y pégala en apiUrl (raco-de-piscis/index.html).
 */

const CFG = {
  sheetId: "1x1YV1wNvUy1Qav9K8Xu6u0qwHEnpHflIRAw5YyM5kbI",
  negocio: "El Racó de Piscis",
  profesional: "Andrea",
  avisoA: "thesqvare@gmail.com",            // PRUEBAS: al entregar, poner el correo de Andrea
  whatsapp: "34648515835",                  // PRUEBAS: al entregar, poner el WhatsApp de Andrea
  web: "https://thesqvare.com/raco-de-piscis/",
  direccion: "Carrer de la Cultura, 44 · Santa Coloma de Gramenet (la cabina está dentro de Mimat)",
  mapa: "Carrer de la Cultura 44, 08922 Santa Coloma de Gramenet",
  prefijo: "RDP",
  tz: "Europe/Madrid",
  paso: 30,        // minutos entre horas ofrecidas
  margen: 60,      // antelación mínima para reservar hoy (min)
  diasMax: 30,     // cuántos días hacia delante se puede reservar
  // Lunes..Domingo: [abre, cierra] o null (igual que la web)
  horario: [null, ["10:00","20:00"], ["10:00","20:00"], ["10:00","20:00"], ["17:00","20:00"], null, null],
  // id: [nombre, minutos, precio] · mismos ids que la web
  servicios: {
    "kobido": ["Kobido", 75, 55],
    "madero-facial": ["Maderoterapia facial", 60, 45],
    "cupping": ["Cupping facial con masaje de pecho, hombros y cabeza", 80, 50],
    "higiene-us": ["Higiene facial · Con peeling ultrasónico", 60, 40],
    "higiene-md": ["Higiene facial · Con microdermoabrasión de punta de diamante", 80, 50],
    "luminosidad": ["Ritual Luminosidad", 70, 60],
    "hidratacion": ["Ritual Hidratación Profunda", 60, 55],
    "rf-bruxismo": ["Ritual facial · Bruxismo y ATM", 90, 60],
    "rf-personalizado": ["Ritual facial · Personalizado", 90, 60],
    "rf-remodelante": ["Ritual facial · Remodelante", 90, 65],
    "rf-premium": ["Ritual facial · Premium", 90, 75],
    "vt-piernas": ["Volver a ti · Piernas ligeras", 60, 60],
    "vt-espalda": ["Volver a ti · Espalda en calma", 60, 60],
    "vt-descanso": ["Volver a ti · Descanso · ideal embarazo y postparto", 60, 60],
    "vt-abdomen": ["Volver a ti · Abdomen en equilibrio", 60, 60],
    "vt-respirar": ["Volver a ti · Respirar", 90, 60],
    "luna": ["Luna en Calma", 60, 45],
    "relajante30": ["Masaje relajante · 30 minutos", 30, 30],
    "relajante60": ["Masaje relajante · 1 hora", 60, 45],
    "piedras": ["Piedras calientes · Piedras calientes", 65, 50],
    "piedras-facial": ["Piedras calientes · Con masaje facial relajante", 90, 60],
    "deportivo": ["Masaje deportivo", 60, 47],
    "terapeutico": ["Masaje terapéutico", 80, 55],
    "reflexo": ["Reflexología · Reflexología podal", 60, 40],
    "reflexo-completa": ["Reflexología · Pies, manos y presoterapia ocular", 90, 55],
    "mc1": ["Maderoterapia corporal · 1 zona", 45, 40],
    "mc2": ["Maderoterapia corporal · 2 zonas", 60, 60],
    "mc-completo": ["Maderoterapia corporal · Cuerpo completo", 90, 67.5],
    "drenaje1": ["Drenaje linfático · 1 zona", 40, 45],
    "drenaje-completo": ["Drenaje linfático · Completo", 60, 55],
    "chocolate": ["Chocolaterapia", 75, 55],
    "oro": ["Envoltura de oro", 75, 55],
    "espalda": ["Higiene de espalda · Higiene de espalda", 60, 40.5],
    "espalda-masaje": ["Higiene de espalda · Con masaje de espalda", 90, 57],
    "labio": ["Cejas y rostro · Labio superior", 5, 6],
    "cejas": ["Cejas y rostro · Cejas hilo/cera", 20, 8],
    "cejas-diseno": ["Cejas y rostro · Diseño de cejas", 30, 12],
    "cejas-tinte": ["Cejas y rostro · Diseño con tinte", 35, 15],
    "facial-completa": ["Cejas y rostro · Facial completa", 40, 28],
    "axilas": ["Cuerpo · Axilas", 25, 8],
    "medias-piernas": ["Cuerpo · Medias piernas", 25, 10],
    "piernas": ["Cuerpo · Piernas completas", 35, 18],
    "medios-brazos": ["Cuerpo · Medios brazos", 25, 10],
    "brazos": ["Cuerpo · Brazos completos", 30, 15],
    "abdomen": ["Cuerpo · Abdomen", 25, 10],
    "lumbar": ["Cuerpo · Zona lumbar", 25, 8],
    "gluteos": ["Cuerpo · Glúteos", 15, 8],
    "ingles": ["Ingles · Ingles básicas", 25, 8],
    "ingles-br": ["Ingles · Ingles brasileñas", 30, 14],
    "ingles-comp": ["Ingles · Ingles completas", 30, 16],
    "pubis": ["Ingles · Pubis completo", 30, 18],
    "perineal": ["Ingles · Zona perineal", 15, 8],
    "h-axilas": ["Depilación hombre · Axilas", 15, 10],
    "h-hombros": ["Depilación hombre · Hombros", 15, 10],
    "h-espalda-baja": ["Depilación hombre · Espalda baja", 15, 12],
    "h-espalda": ["Depilación hombre · Espalda completa", 30, 22],
    "h-abdomen": ["Depilación hombre · Abdomen", 30, 13],
    "h-pecho": ["Depilación hombre · Pecho", 30, 15],
    "h-medios-brazos": ["Depilación hombre · Medios brazos", 20, 12],
    "h-brazos": ["Depilación hombre · Brazos completos", 30, 18],
    "h-medias-piernas": ["Depilación hombre · Medias piernas", 20, 18],
    "h-piernas": ["Depilación hombre · Piernas completas", 30, 28],
    "bono": ["Bono Tiempo de Cambio · primera sesión", 80, 180]
  }
};

const HOJA = "Agenda", HOY = "Hoy";
const COLS = ["Día","Hora","Tratamiento","Clienta","Teléfono","Email","Precio","Estado","Notas","Fecha","Inicio","Fin","Min","Código","Servicio","Historial"];
const C = { dia:1, hora:2, trat:3, nombre:4, tel:5, email:6, precio:7, estado:8, notas:9, fecha:10, ini:11, fin:12, min:13, id:14, svc:15, hist:16 };
const ESTADOS = ["Confirmada","Cambiada","Completada","No vino","Cancelada por la clienta","Cancelada por el centro"];
const COL = { lino:"#F4EFE6", arena:"#E8DDCB", salvia:"#8E9C80", oliva:"#3F4B3A", rosa:"#C4877D", tinta:"#2E2B26", gris:"#6C6A61", blanco:"#FFFDF9" };

/* =================== PUESTA EN MARCHA =================== */
function configurar() {
  const ss = libro();
  ss.setSpreadsheetLocale("es_ES");
  ss.setSpreadsheetTimeZone(CFG.tz);
  let sh = ss.getSheetByName(HOJA) || ss.getSheets()[0].setName(HOJA);
  montarAgenda(sh);
  normalizar();
  montarHoy(ss);
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("SECRETO")) p.setProperty("SECRETO", Utilities.getUuid());
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("alEditar").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("alAbrir").forSpreadsheet(ss).onOpen().create();
  MailApp.getRemainingDailyQuota(); // pide el permiso de correo
  return "Listo";
}

function montarAgenda(sh) {
  const max = Math.max(sh.getMaxRows(), 600);
  if (sh.getMaxRows() < max) sh.insertRowsAfter(sh.getMaxRows(), max - sh.getMaxRows());
  if (sh.getMaxColumns() > COLS.length) sh.deleteColumns(COLS.length + 1, sh.getMaxColumns() - COLS.length);
  if (sh.getMaxColumns() < COLS.length) sh.insertColumnsAfter(sh.getMaxColumns(), COLS.length - sh.getMaxColumns());
  const todo = sh.getRange(1, 1, max, COLS.length);
  todo.setFontFamily("Lato").setFontSize(11).setVerticalAlignment("middle").setFontColor(COL.tinta).setBackground(COL.blanco);
  sh.getRange(1, 1, max, COLS.length).setNumberFormat("@");
  sh.getRange(2, C.precio, max - 1, 1).setNumberFormat('#,##0.00 "€"');
  sh.getRange(2, C.dia, max - 1, 1).setNumberFormat("ddd d mmm");
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold").setBackground(COL.oliva)
    .setFontColor(COL.lino).setFontSize(11).setVerticalAlignment("middle");
  sh.setRowHeight(1, 38);
  sh.setRowHeights(2, max - 1, 34);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  const anchos = [120, 112, 290, 170, 120, 210, 80, 190, 260, 92, 60, 60, 50, 150, 120, 380];
  anchos.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, C.dia, max - 1, 2).setFontWeight("bold");
  sh.getRange(2, C.notas, max - 1, 1).setWrap(true);
  sh.getRange(1, C.fecha, max, COLS.length - C.fecha + 1).setFontColor(COL.gris).setFontSize(9);
  sh.getRange(1, C.fecha, 1, COLS.length - C.fecha + 1).setFontColor(COL.arena);
  sh.getRange(2, C.precio, max - 1, 1).setHorizontalAlignment("right");
  sh.getRange(2, C.estado, max - 1, 1).setHorizontalAlignment("center").setFontWeight("bold")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).setAllowInvalid(false).build());
  // Columnas técnicas agrupadas y plegadas para que la vista sea limpia
  try { sh.getRange(1, C.fecha, 1, COLS.length - C.fecha + 1).shiftColumnGroupDepth(1); sh.getColumnGroup(C.fecha, 1).collapse(); } catch (_) {}
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, max, COLS.length).setBorder(null, null, true, null, null, true, "#E8DDCB", SpreadsheetApp.BorderStyle.SOLID);

  const r = sh.getRange("A2:P"), est = sh.getRange("H2:H"), dia = 'IFERROR(DATEVALUE($J2),$J2)';
  const reglas = [
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(F('=LEFT($H2,9)="Cancelada"')).setFontColor("#A64B3F").setStrikethrough(true).setBackground("#F7E7E3").setRanges([r]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Confirmada").setBackground("#D4E6C8").setFontColor("#2F4A26").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Cambiada").setBackground("#F6E3B4").setFontColor("#6B4E12").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Completada").setBackground("#D8E3EF").setFontColor("#24405E").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("No vino").setBackground("#E6E2DA").setFontColor("#5A564D").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(F(`=AND($J2<>"",${dia}=TODAY())`)).setBackground("#E3EBD9").setFontColor(COL.oliva).setRanges([r]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(F(`=AND($J2<>"",${dia}<TODAY())`)).setFontColor("#A9A396").setRanges([r]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(F(`=AND($J2<>"",ISODD(${dia}))`)).setBackground("#F7F2E9").setRanges([r]).build()
  ];
  sh.setConditionalFormatRules(reglas);
  sh.setTabColor(COL.salvia);
}

function montarHoy(ss) {
  let h = ss.getSheetByName(HOY);
  if (!h) h = ss.insertSheet(HOY, 0); else { h.getRange("A1:L80").breakApart(); h.clear(); }
  ss.setActiveSheet(h); ss.moveActiveSheet(1);
  h.setHiddenGridlines(true);
  h.getRange("A1:L80").setBackground(COL.lino).setFontFamily("Lato").setFontColor(COL.tinta).setVerticalAlignment("middle");
  [24, 150, 240, 170, 130, 200, 30, 120, 100, 230, 170, 24].forEach((w, i) => h.setColumnWidth(i + 1, w));
  // D = día de la cita como número y T = hora, sea cual sea el formato en que Sheets haya guardado la celda
  const D = 'ARRAYFORMULA(IFERROR(DATEVALUE(Agenda!J2:J),Agenda!J2:J))';
  const T = 'ARRAYFORMULA(IFERROR(TIMEVALUE(Agenda!K2:K),Agenda!K2:K))';
  const activa = '(LEFT(Agenda!H2:H,9)<>"Cancelada")*(Agenda!J2:J<>"")';
  const ini = "(TODAY()-WEEKDAY(TODAY(),3))", fin = "(TODAY()-WEEKDAY(TODAY(),3)+6)";

  h.setRowHeight(1, 18);
  h.getRange("B2:K2").merge().setFormula(F('="El Racó de Piscis  ·  "&PROPER(TEXT(TODAY(),"dddd"))&" "&DAY(TODAY())&" de "&TEXT(TODAY(),"mmmm")'))
    .setFontFamily("Cormorant Garamond").setFontSize(30).setFontColor(COL.oliva);
  h.setRowHeight(2, 58);
  h.getRange("B3:K3").merge().setValue("Este resumen se actualiza solo. Para cambiar o cancelar una cita: pestaña Agenda → selecciona la fila → menú 📅 Citas.")
    .setFontColor(COL.gris).setFontSize(10);
  h.setRowHeight(4, 14);

  // Tarjetas
  const tarjetas = [
    ["B5:B6", "Citas hoy", `=SUMPRODUCT((${D}=TODAY())*${activa})`, "0"],
    ["C5:C6", "Esta semana", `=SUMPRODUCT((${D}>=${ini})*(${D}<=${fin})*${activa})`, "0"],
    ["D5:E6", "Previsto esta semana", `=SUMPRODUCT((${D}>=${ini})*(${D}<=${fin})*${activa}*N(+Agenda!G2:G))`, '#,##0 "€"'],
    ["F5:K6", "Próxima cita", `=ARRAYFORMULA(IFERROR(LET(d,${D},t,${T},k,ARRAYFORMULA(IFERROR(d+t,0)),c,(k>=NOW())*${activa},s,SORT(FILTER(Agenda!A2:K,c),FILTER(k,c),TRUE),PROPER(TEXT(INT(MIN(FILTER(k,c))),"ddd d mmm"))&"  ·  "&LEFT(INDEX(s,1,2),5)&"  ·  "&INDEX(s,1,3)&"  ·  "&INDEX(s,1,4)),"Sin citas próximas"))`, "@"]
  ];
  tarjetas.forEach(([a1, titulo, f, fmt]) => {
    const [arriba, abajo] = a1.split(":").map(x => x.replace(/\d+/, m => m));
    const col1 = arriba.replace(/\d/g, ""), col2 = abajo.replace(/\d/g, "");
    h.getRange(`${col1}5:${col2}5`).merge().setValue(titulo).setFontSize(10).setFontColor(COL.gris).setBackground(COL.blanco).setVerticalAlignment("bottom");
    h.getRange(`${col1}6:${col2}6`).merge().setFormula(F(f)).setNumberFormat(fmt).setFontSize(col1 === "F" ? 15 : 26)
      .setFontWeight("bold").setFontColor(COL.oliva).setBackground(COL.blanco).setHorizontalAlignment("left").setVerticalAlignment("top");
    h.getRange(`${col1}5:${col2}6`).setBorder(true, true, true, true, null, null, COL.arena, SpreadsheetApp.BorderStyle.SOLID);
  });
  h.setRowHeight(5, 26); h.setRowHeight(6, 50); h.setRowHeight(7, 22);

  // Hoy
  h.getRange("B8:F8").merge().setValue("Agenda de hoy").setFontFamily("Cormorant Garamond").setFontSize(20).setFontColor(COL.oliva);
  h.getRange("B9:F9").setValues([["Hora","Tratamiento","Clienta","Teléfono","Notas"]]);
  h.getRange("B10").setFormula(F(`=ARRAYFORMULA(IFERROR(LET(d,${D},t,${T},c,(d=TODAY())*${activa},CHOOSECOLS(SORT(FILTER(Agenda!A2:K,c),FILTER(t,c),TRUE),2,3,4,5,9)),"Hoy no hay citas 🌿"))`));
  // Próximos 7 días
  h.getRange("H8:K8").merge().setValue("Próximos 7 días").setFontFamily("Cormorant Garamond").setFontSize(20).setFontColor(COL.oliva);
  h.getRange("H9:K9").setValues([["Día","Hora","Tratamiento","Clienta"]]);
  h.getRange("H10").setFormula(F(`=ARRAYFORMULA(IFERROR(LET(d,${D},t,${T},c,(d>TODAY())*(d<=TODAY()+7)*${activa},CHOOSECOLS(SORT(FILTER(Agenda!A2:K,c),FILTER(d,c),TRUE,FILTER(t,c),TRUE),1,2,3,4)),"Nada en los próximos días"))`));
  [h.getRange("B9:F9"), h.getRange("H9:K9")].forEach(x => x.setBackground(COL.oliva).setFontColor(COL.lino).setFontWeight("bold"));
  h.setRowHeight(8, 40); h.setRowHeight(9, 30);
  h.setRowHeights(10, 40, 32);
  h.getRange("B10:F49").setBackground(COL.blanco).setWrap(true).setBorder(null, null, true, null, null, true, COL.arena, SpreadsheetApp.BorderStyle.SOLID);
  h.getRange("H10:K49").setBackground(COL.blanco).setWrap(true).setBorder(null, null, true, null, null, true, COL.arena, SpreadsheetApp.BorderStyle.SOLID);
  h.getRange("B10:B49").setFontWeight("bold").setFontColor(COL.oliva);
  h.getRange("H10:I49").setFontWeight("bold").setFontColor(COL.oliva);
  h.getRange("H10:H49").setNumberFormat("ddd d mmm");
  h.setFrozenRows(0);
  h.setTabColor(COL.rosa);
}

/* =================== MENÚ EN LA HOJA =================== */
function alAbrir() {
  SpreadsheetApp.getUi().createMenu("📅 Citas")
    .addItem("Cambiar la cita seleccionada", "menuCambiar")
    .addItem("Cancelar la cita seleccionada (avisa a la clienta)", "menuCancelar")
    .addSeparator()
    .addItem("Ordenar la agenda", "ordenar")
    .addItem("Abrir la web", "menuWeb")
    .addToUi();
}
function filaSeleccionada_() {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== HOJA) throw new Error("Ve a la pestaña Agenda y selecciona la fila de la cita.");
  const f = sh.getActiveRange().getRow();
  const id = f > 1 ? sh.getRange(f, C.id).getDisplayValue() : "";
  if (!id) throw new Error("Selecciona una fila con una cita.");
  return buscar(id);
}
function menuCambiar() {
  const ui = SpreadsheetApp.getUi();
  try {
    const c = filaSeleccionada_();
    if (!activa(c)) return ui.alert("Esta cita está cancelada.");
    const url = enlace(c.id, "n", "cambiar");
    ui.showModalDialog(HtmlService.createHtmlOutput(
      `<div style="font-family:Arial,sans-serif;color:#2E2B26"><p style="margin:0 0 6px"><b>${esc(c.nombre)}</b> · ${esc(c.trat)}</p>
       <p style="margin:0 0 16px;color:#6C6A61">${fechaLarga(c.fecha)} · ${c.ini}–${c.fin}</p>
       <a href="${url}" target="_blank" onclick="setTimeout(()=>google.script.host.close(),400)" style="display:inline-block;background:#3F4B3A;color:#F4EFE6;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Elegir nuevo día y hora</a>
       <p style="font-size:12px;color:#6C6A61;margin-top:16px">Se abre la web con los huecos libres. Al guardar, la clienta recibe un correo con el nuevo horario.</p></div>`
    ).setWidth(420).setHeight(220), "Cambiar cita");
  } catch (e) { ui.alert(e.message); }
}
function menuCancelar() {
  const ui = SpreadsheetApp.getUi();
  try {
    const c = filaSeleccionada_();
    if (!activa(c)) return ui.alert("Esta cita ya estaba cancelada.");
    const r = ui.alert("Cancelar cita", `¿Cancelar la cita de ${c.nombre} (${fechaLarga(c.fecha)}, ${c.ini})?\nLe llegará un correo avisándola.`, ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
    cancelarCita_(c, "centro");
    SpreadsheetApp.getActive().toast("Cita cancelada y clienta avisada por correo.", "📅 Citas", 5);
  } catch (e) { ui.alert(e.message); }
}
function menuWeb() {
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(`<a href="${CFG.web}" target="_blank" style="font-family:Arial">Abrir ${CFG.web}</a>`).setWidth(360).setHeight(80), "Web");
}

/* Cambios hechos a mano en la columna Estado */
function alEditar(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() !== HOJA || e.range.getColumn() !== C.estado || e.range.getNumRows() !== 1 || e.range.getRow() < 2) return;
    const nuevo = String(e.value || ""), antes = String(e.oldValue || "");
    const id = sh.getRange(e.range.getRow(), C.id).getDisplayValue();
    if (!id) return;
    const c = buscar(id);
    if (nuevo === "Cancelada por el centro" && !antes.startsWith("Cancelada")) {
      anotar(c, "Cancelada por el centro desde la hoja");
      if (c.email) correoCliente(c, "cancelada-centro");
      SpreadsheetApp.getActive().toast(`Se ha avisado a ${c.nombre} por correo.`, "📅 Citas", 5);
    } else if (antes.startsWith("Cancelada") && (nuevo === "Confirmada" || nuevo === "Cambiada")) {
      anotar(c, "Reactivada desde la hoja");
      if (c.email) correoCliente(c, "confirmada");
      SpreadsheetApp.getActive().toast(`Cita reactivada. ${c.nombre} ha recibido la confirmación.`, "📅 Citas", 5);
    }
  } catch (err) { console.error(err); }
}

/* =================== API =================== */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.accion === "disponibilidad") return json({ ok: true, dias: disponibilidad(p.servicio, p.excluir || "") });
    if (p.accion === "huecos") return json({ ok: true, huecos: huecos(p.fecha, p.servicio, p.excluir || "") });
    if (p.accion === "ver") {
      const c = buscar(p.id), rol = rolDe(p.id, p.t);
      if (!c || !rol) throw new Error("Este enlace no es válido.");
      return json({ ok: true, rol, cita: publica(c) });
    }
    return json({ ok: true, negocio: CFG.negocio });
  } catch (err) { return json({ ok: false, error: err.message }); }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    lock.waitLock(20000);
    let r;
    if (d.accion === "cambiar") r = cambiar(d);
    else if (d.accion === "cancelar") r = cancelar(d);
    else r = reservar(d);
    return json(r);
  } catch (err) {
    return json({ ok: false, error: err.message });
  } finally { try { lock.releaseLock(); } catch (_) {} }
}

function reservar(d) {
  const nombre = limpio(d.nombre, 60), tel = limpio(d.telefono, 20), email = limpio(d.email, 100).toLowerCase(), notas = limpio(d.notas, 300);
  if (!nombre) throw new Error("Escribe tu nombre.");
  if (tel.replace(/\D/g, "").length < 9) throw new Error("Escribe un teléfono válido.");
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw new Error("Escribe un correo válido.");
  const s = CFG.servicios[d.servicio];
  if (!s) throw new Error("Elige un tratamiento.");
  if (huecos(d.fecha, d.servicio, "").indexOf(d.hora) < 0) throw new Error("Esa hora se acaba de ocupar. Elige otra.");
  const fin = aH(aMin(d.hora) + s[1]);
  const id = CFG.prefijo + "-" + Utilities.formatDate(new Date(), CFG.tz, "yyMMdd") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const fila = [diaFecha(d.fecha), `${d.hora} – ${fin}`, s[0], nombre, tel, email, s[2], "Confirmada", notas, d.fecha, d.hora, fin, String(s[1]), id, d.servicio, `${ahora()} · Reservada en la web`];
  escribirFila(hoja().getLastRow() + 1, fila);
  ordenar();
  const c = buscar(id);
  let enviado = true;
  try { correoCliente(c, "confirmada"); } catch (_) { enviado = false; }
  try { correoNegocio(c, "nueva"); } catch (_) {}
  return { ok: true, id, emailEnviado: enviado, cita: publica(c) };
}

function cambiar(d) {
  const c = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!c || !rol) throw new Error("Este enlace no es válido.");
  if (!activa(c)) throw new Error("Esta cita está cancelada. Puedes reservar una nueva.");
  if (pasada(c)) throw new Error("Esta cita ya ha pasado.");
  const svcId = CFG.servicios[d.servicio] ? d.servicio : c.svc;
  const s = CFG.servicios[svcId];
  if (huecos(d.fecha, svcId, c.id).indexOf(d.hora) < 0) throw new Error("Esa hora ya no está libre. Elige otra.");
  const antes = `${diaCorto(c.fecha)} ${c.ini}${svcId !== c.svc ? " · " + c.trat : ""}`;
  const fin = aH(aMin(d.hora) + s[1]);
  const sh = hoja();
  const v = sh.getRange(c.fila, 1, 1, COLS.length).getValues()[0];
  v[C.dia - 1] = diaFecha(d.fecha); v[C.hora - 1] = `${d.hora} – ${fin}`; v[C.trat - 1] = s[0]; v[C.precio - 1] = s[2];
  v[C.estado - 1] = "Cambiada"; v[C.fecha - 1] = d.fecha; v[C.ini - 1] = d.hora; v[C.fin - 1] = fin; v[C.min - 1] = String(s[1]); v[C.svc - 1] = svcId;
  v[C.hist - 1] = (v[C.hist - 1] ? v[C.hist - 1] + "\n" : "") + `${ahora()} · Cambiada por ${rol === "centro" ? "el centro" : "la clienta"} (antes: ${antes})`;
  escribirFila(c.fila, v);
  ordenar();
  const n = buscar(c.id); n.antes = antes;
  if (rol === "cliente") { correoNegocio(n, "cambiada-clienta"); correoCliente(n, "cambiada"); }
  else { correoCliente(n, "cambiada-centro"); correoNegocio(n, "cambiada-centro"); }
  return { ok: true, rol, cita: publica(n) };
}

function cancelar(d) {
  const c = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!c || !rol) throw new Error("Este enlace no es válido.");
  if (!activa(c)) throw new Error("Esta cita ya estaba cancelada.");
  if (pasada(c)) throw new Error("Esta cita ya ha pasado.");
  cancelarCita_(c, rol, limpio(d.motivo, 200));
  return { ok: true, rol, cita: publica(buscar(c.id)) };
}

function cancelarCita_(c, rol, motivo) {
  const sh = hoja();
  sh.getRange(c.fila, C.estado).setValue(rol === "centro" ? "Cancelada por el centro" : "Cancelada por la clienta");
  anotar(c, `Cancelada por ${rol === "centro" ? "el centro" : "la clienta"}${motivo ? " · " + motivo : ""}`);
  c.motivo = motivo || "";
  if (rol === "cliente") { correoNegocio(c, "cancelada-clienta"); correoCliente(c, "cancelada-clienta"); }
  else { if (c.email) correoCliente(c, "cancelada-centro"); correoNegocio(c, "cancelada-centro"); }
}

/* =================== DISPONIBILIDAD =================== */
function huecos(fecha, servicio, excluir, ocupadasDia) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) throw new Error("Fecha no válida.");
  const s = CFG.servicios[servicio];
  if (!s) throw new Error("Tratamiento no válido.");
  const hoyTxt = Utilities.formatDate(new Date(), CFG.tz, "yyyy-MM-dd");
  const limite = Utilities.formatDate(new Date(Date.now() + CFG.diasMax * 864e5), CFG.tz, "yyyy-MM-dd");
  if (fecha < hoyTxt || fecha > limite) return [];
  const [y, m, dd] = fecha.split("-").map(Number);
  const h = CFG.horario[(new Date(y, m - 1, dd).getDay() + 6) % 7];
  if (!h) return [];
  const minimo = fecha === hoyTxt ? aMin(Utilities.formatDate(new Date(), CFG.tz, "HH:mm")) + CFG.margen : -1;
  const ocupadas = ocupadasDia || citas().filter(c => c.fecha === fecha && activa(c) && c.id !== excluir).map(c => [aMin(c.ini), aMin(c.fin)]);
  const out = [];
  for (let t = aMin(h[0]); t + s[1] <= aMin(h[1]); t += CFG.paso) {
    if (t < minimo) continue;
    if (ocupadas.some(([a, b]) => t < b && t + s[1] > a)) continue;
    out.push(aH(t));
  }
  return out;
}
function disponibilidad(servicio, excluir) {
  if (!CFG.servicios[servicio]) throw new Error("Tratamiento no válido.");
  const todas = citas().filter(c => activa(c) && c.id !== excluir), out = {};
  for (let n = 0; n <= CFG.diasMax; n++) {
    const f = Utilities.formatDate(new Date(Date.now() + n * 864e5), CFG.tz, "yyyy-MM-dd");
    const hs = huecos(f, servicio, excluir, todas.filter(c => c.fecha === f).map(c => [aMin(c.ini), aMin(c.fin)]));
    if (hs.length) out[f] = hs;
  }
  return out;
}

/* =================== DATOS =================== */
function libro() { return SpreadsheetApp.openById(CFG.sheetId); }
function hoja() { return libro().getSheetByName(HOJA); }
function citas() {
  const sh = hoja(), n = sh.getLastRow();
  if (n < 2) return [];
  const t = sh.getRange(2, 1, n - 1, COLS.length).getDisplayValues(), v = sh.getRange(2, C.precio, n - 1, 1).getValues();
  return t.map((r, i) => ({
    fila: i + 2, dia: r[0], trat: r[2], nombre: r[3], tel: r[4], email: r[5], precio: Number(v[i][0]) || 0, estado: r[7], notas: r[8],
    fecha: normFecha(r[9]), ini: String(r[10]).slice(0, 5), fin: String(r[11]).slice(0, 5), min: Number(r[12]) || 0, id: r[13], svc: r[14]
  })).filter(c => c.id);
}
function buscar(id) { return citas().find(c => c.id === String(id || "")); }
function activa(c) { return c && !String(c.estado).startsWith("Cancelada"); }
function pasada(c) { return `${c.fecha} ${c.ini}` < Utilities.formatDate(new Date(), CFG.tz, "yyyy-MM-dd HH:mm"); }
function publica(c) {
  return { id: c.id, servicio: c.svc, tratamiento: c.trat, fecha: c.fecha, hora: c.ini, fin: c.fin, min: c.min, precio: c.precio,
    nombre: c.nombre, estado: c.estado, activa: activa(c), pasada: pasada(c) };
}
// Escribe una fila guardando fecha, horas y código como texto (Sheets no los convierte)
function escribirFila(n, v) {
  const sh = hoja();
  sh.getRange(n, 1, 1, COLS.length).setNumberFormat("@");
  sh.getRange(n, C.dia).setNumberFormat("ddd d mmm");
  sh.getRange(n, C.precio).setNumberFormat('#,##0.00 "€"');
  sh.getRange(n, 1, 1, COLS.length).setValues([v]);
}
// Repara filas antiguas en las que Sheets convirtió la fecha o la hora
function normalizar() {
  const sh = hoja(), n = sh.getLastRow();
  if (n < 2) return;
  const filas = sh.getRange(2, 1, n - 1, COLS.length).getValues();
  filas.forEach((v, i) => {
    if (!v[C.id - 1]) return;
    const f = v[C.fecha - 1] instanceof Date ? Utilities.formatDate(v[C.fecha - 1], CFG.tz, "yyyy-MM-dd") : normFecha(String(v[C.fecha - 1]));
    const h = x => x instanceof Date ? Utilities.formatDate(x, CFG.tz, "HH:mm") : String(x).slice(0, 5);
    v[C.fecha - 1] = f; v[C.ini - 1] = h(v[C.ini - 1]); v[C.fin - 1] = h(v[C.fin - 1]);
    v[C.min - 1] = String(v[C.min - 1]); v[C.dia - 1] = diaFecha(f);
    escribirFila(i + 2, v);
  });
  ordenar();
}
function ordenar() {
  const sh = hoja(), n = sh.getLastRow();
  if (n > 2) sh.getRange(2, 1, n - 1, COLS.length).sort([{ column: C.fecha, ascending: true }, { column: C.ini, ascending: true }]);
}
function anotar(c, texto) {
  const r = hoja().getRange(c.fila, C.hist), v = r.getDisplayValue();
  r.setValue((v ? v + "\n" : "") + `${ahora()} · ${texto}`);
}

/* =================== CORREOS =================== */
function correoCliente(c, tipo) {
  const cambiar = enlace(c.id, "c", "cambiar"), cancelar = enlace(c.id, "c", "cancelar");
  const reservar = CFG.web + "#reservar";
  const T = {
    "confirmada": ["Cita confirmada", `¡Hola, ${c.nombre}!`, `Tu cita en ${CFG.negocio} está reservada. Te espero para dedicarte este rato. 🌿`, true],
    "cambiada": ["Cita cambiada", `¡Hecho, ${c.nombre}!`, `Tu cita se ha cambiado. Estos son los nuevos datos (antes: ${c.antes}).`, true],
    "cambiada-centro": ["Tu cita ha cambiado", `Hola, ${c.nombre}`, `${CFG.profesional} ha tenido que mover tu cita (antes: ${c.antes}). Este es el nuevo horario. Si no te va bien, puedes cambiarla o cancelarla aquí abajo.`, true],
    "cancelada-clienta": ["Cita cancelada", `Hola, ${c.nombre}`, `Tu cita del ${fechaLarga(c.fecha)} a las ${c.ini} se ha cancelado. Cuando quieras, reserva otra en un minuto.`, false],
    "cancelada-centro": ["Cita cancelada", `Hola, ${c.nombre}`, `Lo siento mucho: ${CFG.profesional} ha tenido que cancelar tu cita del ${fechaLarga(c.fecha)} a las ${c.ini}${c.motivo ? " (" + c.motivo + ")" : ""}. Puedes reservar otro día cuando quieras.`, false]
  }[tipo];
  const filas = [["Tratamiento", esc(c.trat)], ["Día", fechaLarga(c.fecha)], ["Hora", `${c.ini} – ${c.fin}`], ["Precio", euro(c.precio)], ["Dónde", esc(CFG.direccion)], ["Código", c.id]];
  const botones = T[3]
    ? [[["Añadir a mi calendario", calendario(c), true], ["Cómo llegar", "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CFG.mapa), false]],
       [["Cambiar cita", cambiar, false], ["Cancelar cita", cancelar, false]]]
    : [[["Reservar otra cita", reservar, true]]];
  const asunto = {
    "confirmada": `🌿 Cita confirmada · ${fechaLarga(c.fecha)} a las ${c.ini}`,
    "cambiada": `🌿 Cita cambiada · ${fechaLarga(c.fecha)} a las ${c.ini}`,
    "cambiada-centro": `Tu cita ha cambiado · ahora ${fechaLarga(c.fecha)} a las ${c.ini}`,
    "cancelada-clienta": `Cita cancelada · ${fechaLarga(c.fecha)}`,
    "cancelada-centro": `Tu cita del ${fechaLarga(c.fecha)} ha sido cancelada`
  }[tipo];
  MailApp.sendEmail({
    to: c.email, subject: asunto, name: CFG.negocio, replyTo: CFG.avisoA,
    htmlBody: plantilla(T[0], T[1], T[2], filas, botones, tipo.startsWith("cancelada") ? "rosa" : "oliva",
      `¿Dudas? Responde a este correo o escribe por <a href="https://wa.me/${CFG.whatsapp}" style="color:${COL.oliva}">WhatsApp</a>.`),
    body: `${T[1]}\n${T[2]}\n\n${c.trat}\n${fechaLarga(c.fecha)} · ${c.ini}–${c.fin}\n${CFG.direccion}\nCódigo: ${c.id}` + (T[3] ? `\n\nCambiar: ${cambiar}\nCancelar: ${cancelar}` : `\n\nReservar: ${reservar}`)
  });
}

function correoNegocio(c, tipo) {
  const T = {
    "nueva": ["Nueva cita", `🌿 Nueva cita · ${diaCorto(c.fecha)} ${c.ini} · ${c.nombre}`, `${esc(c.nombre)} ha reservado desde la web.`],
    "cambiada-clienta": ["La clienta ha cambiado su cita", `🔁 Cita cambiada · ${c.nombre} · ahora ${diaCorto(c.fecha)} ${c.ini}`, `${esc(c.nombre)} ha cambiado su cita. Antes: <b>${esc(c.antes)}</b>.`],
    "cambiada-centro": ["Has cambiado una cita", `🔁 Has cambiado la cita de ${c.nombre} · ${diaCorto(c.fecha)} ${c.ini}`, `Hemos avisado a ${esc(c.nombre)} por correo del nuevo horario. Antes: <b>${esc(c.antes)}</b>.`],
    "cancelada-clienta": ["La clienta ha cancelado", `❌ Cancelada · ${diaCorto(c.fecha)} ${c.ini} · ${c.nombre}`, `${esc(c.nombre)} ha cancelado su cita. El hueco ya vuelve a estar libre en la web.`],
    "cancelada-centro": ["Has cancelado una cita", `❌ Has cancelado la cita de ${c.nombre} · ${diaCorto(c.fecha)} ${c.ini}`, `Hemos avisado a ${esc(c.nombre)} por correo. El hueco vuelve a estar libre en la web.`]
  }[tipo];
  const filas = [["Tratamiento", esc(c.trat)], ["Día", fechaLarga(c.fecha)], ["Hora", `${c.ini} – ${c.fin}`], ["Precio", euro(c.precio)],
    ["Clienta", esc(c.nombre)], ["Teléfono", `<a href="tel:${esc(c.tel)}" style="color:${COL.oliva}">${esc(c.tel)}</a>`], ["Email", esc(c.email)]];
  if (c.notas) filas.push(["Notas", esc(c.notas)]);
  filas.push(["Código", c.id]);
  const hojaUrl = `https://docs.google.com/spreadsheets/d/${CFG.sheetId}/edit`;
  const botones = tipo.startsWith("cancelada")
    ? [[["Abrir la agenda", hojaUrl, true]]]
    : [[["Abrir la agenda", hojaUrl, true]], [["Cambiar esta cita", enlace(c.id, "n", "cambiar"), false], ["Cancelar esta cita", enlace(c.id, "n", "cancelar"), false]]];
  MailApp.sendEmail({
    to: CFG.avisoA, subject: T[1], name: CFG.negocio + " · reservas", replyTo: c.email || CFG.avisoA,
    htmlBody: plantilla(T[0], T[0], T[2], filas, botones, tipo.startsWith("cancelada") ? "rosa" : "oliva",
      "Si cambias o cancelas desde aquí, la clienta recibe un correo automáticamente.")
  });
}

function plantilla(etiqueta, titulo, texto, filas, botones, tono, pie) {
  const acento = tono === "rosa" ? COL.rosa : COL.salvia;
  const fila = ([k, v]) => `<tr><td style="padding:10px 0;color:${COL.gris};font-size:14px;border-bottom:1px solid ${COL.arena};vertical-align:top">${k}</td><td style="padding:10px 0;text-align:right;font-size:14px;color:${COL.tinta};border-bottom:1px solid ${COL.arena}">${v}</td></tr>`;
  const boton = ([t, u, lleno]) => `<a href="${u}" style="display:inline-block;margin:4px 4px 4px 0;padding:12px 20px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:bold;${lleno ? `background:${COL.oliva};color:${COL.lino}` : `border:1.5px solid ${COL.oliva};color:${COL.oliva}`}">${t}</a>`;
  return `<div style="background:${COL.lino};padding:28px 12px;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:540px;margin:0 auto;background:${COL.blanco};border-radius:18px;overflow:hidden;border:1px solid ${COL.arena}">
    <div style="padding:22px 28px;border-bottom:1px solid ${COL.arena}">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COL.oliva}">El Racó de Piscis</div>
      <div style="font-size:12px;color:${COL.gris};margin-top:2px">${CFG.profesional} · estética y bienestar</div>
    </div>
    <div style="padding:26px 28px">
      <span style="display:inline-block;background:${acento};color:#fff;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:999px">${etiqueta}</span>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;color:${COL.oliva};margin:16px 0 8px">${esc(titulo)}</h1>
      <p style="color:#4A4740;font-size:15px;line-height:1.55;margin:0 0 18px">${texto}</p>
      <table role="presentation" width="100%" style="border-collapse:collapse">${filas.map(fila).join("")}</table>
      ${botones.map(g => `<p style="margin:18px 0 0">${g.map(boton).join("")}</p>`).join("")}
      <p style="color:${COL.gris};font-size:13px;line-height:1.5;margin:22px 0 0">${pie}</p>
    </div>
    <div style="padding:12px 28px;background:${COL.oliva};color:${COL.lino};font-size:12px">${CFG.negocio} · Web creada por The Sqvare</div>
  </div></div>`;
}

/* =================== UTILIDADES =================== */
// La hoja está en español: las fórmulas usan ";" como separador (las comas dentro de textos no se tocan)
function iso(d) { return `(YEAR(${d})&"-"&TEXT(MONTH(${d}),"00")&"-"&TEXT(DAY(${d}),"00"))`; }
function diaFecha(f) { const [y, m, d] = f.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function normFecha(v) { const t = String(v), m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}` : t; }
function F(f) { let q = false, out = ""; for (const ch of f) { if (ch === '"') q = !q; out += (!q && ch === ",") ? ";" : ch; } return out; }
function enlace(id, rol, modo) { return `${CFG.web}?cita=${encodeURIComponent(id)}&t=${token(id, rol)}&modo=${modo}#gestionar`; }
function token(id, rol) {
  const s = PropertiesService.getScriptProperties().getProperty("SECRETO") || "rdp";
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rol + ":" + id + ":" + s).slice(0, 9).map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("");
}
function rolDe(id, t) {
  if (!id || !t) return null;
  if (t === token(id, "c")) return "cliente";
  if (t === token(id, "n")) return "centro";
  return null;
}
function calendario(c) {
  const f = c.fecha.replace(/-/g, ""), a = c.ini.replace(":", "") + "00", b = c.fin.replace(":", "") + "00";
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(`${c.trat} · ${CFG.negocio}`) +
    `&dates=${f}T${a}/${f}T${b}&ctz=${encodeURIComponent(CFG.tz)}&location=${encodeURIComponent(CFG.mapa)}&details=` + encodeURIComponent("Código: " + c.id);
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function aMin(h) { const [a, b] = String(h).split(":").map(Number); return a * 60 + b; }
function aH(m) { return ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); }
function limpio(v, n) { return String(v || "").replace(/[<>]/g, "").trim().slice(0, n); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); }
function euro(n) { return (Number(n) % 1 ? Number(n).toFixed(2).replace(".", ",") : String(Number(n))) + " €"; }
function ahora() { return Utilities.formatDate(new Date(), CFG.tz, "dd/MM HH:mm"); }
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function fechaLarga(f) { const [y, m, d] = f.split("-").map(Number); return `${DIAS[new Date(y, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`; }
function diaCorto(f) {
  const [y, m, d] = f.split("-").map(Number), w = DIAS[new Date(y, m - 1, d).getDay()];
  return `${w.charAt(0).toUpperCase() + w.slice(1, 3)} ${d} ${MESES[m - 1].slice(0, 3)}`;
}
