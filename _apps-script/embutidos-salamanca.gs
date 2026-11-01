/**
 * Embutidos Salamanca · Sistema de pedidos (Google Apps Script)
 * ---------------------------------------------------------------
 * - Guarda los pedidos de la web en la hoja "Pedidos Embutidos Salamanca" (pestaña Pedidos), ordenados por día de entrega.
 * - Pestaña "Resumen": lo que hay que confirmar, preparar y entregar, y las ventas de la semana.
 * - Flujo del pedido (así se cumple la ley de venta a distancia con precios al peso):
 *     1. El cliente envía la solicitud desde la web → "Por confirmar" (correo al cliente y aviso a la tienda).
 *     2. La tienda pesa las piezas y envía el importe final desde su correo o desde el menú → "Pendiente de aceptar".
 *     3. El cliente pulsa "Aceptar pedido" en su correo → "Aceptado" (aquí se cierra la compra).
 *     4. La tienda lo marca "Listo" (avisa al cliente) y después "Entregado".
 *   Cualquiera de los dos puede cancelar antes de la entrega; el otro recibe un correo.
 *
 * Puesta en marcha (una vez, con la cuenta thesqvare@gmail.com):
 *  1. Crea una hoja de cálculo vacía, copia su ID en sheetId y pega este código en Extensiones → Apps Script.
 *  2. Ejecuta la función "configurar" y acepta los permisos.
 *  3. Implementar → Nueva implementación → Aplicación web · Ejecutar como: Yo · Acceso: Cualquier usuario.
 *  4. Copia la URL que acaba en /exec y pégala en apiUrl (embutidos-salamanca-pedidos/index.html).
 */

const CFG = {
  sheetId: "PEGAR_AQUI_EL_ID_DE_LA_HOJA",
  negocio: "Embutidos Salamanca",
  avisoA: "thesqvare@gmail.com",            // PRUEBAS: al entregar, poner el correo de la tienda
  whatsapp: "34648515835",                  // PRUEBAS: al entregar, poner el WhatsApp de la tienda
  web: "https://thesqvare.com/embutidos-salamanca-pedidos/",
  recogida: "[Dirección de recogida]",      // PENDIENTE: la da el cliente
  prefijo: "ES",
  tz: "Europe/Madrid",
  diasMin: 1,      // primer día que se puede pedir (1 = mañana)
  diasMax: 14,     // hasta cuántos días vista
  // Lunes..Domingo: true si se entrega/recoge ese día (PENDIENTE de confirmar con la tienda; igual que en la web)
  dias: [true, true, true, true, true, true, false],
  franjas: ["Mañana", "Tarde"],
  // ref: [producto, formato, tipo, precio] · tipo: ud (precio por unidad), kg (al peso exacto), pieza (se pesa: €/kg)
  catalogo: {
    "0001": ["Jamón de cebo ibérico", "Pieza entera", "pieza", 19],
    "0001T": ["Jamón de cebo ibérico", "Trozo deshuesado", "kg", 33],
    "0002": ["Jamón de cebo ibérico", "Sobre 100 g (cortado a mano)", "ud", 5.5],
    "0003": ["Jamón de cebo de campo ibérico", "Pieza entera", "pieza", 22],
    "0004": ["Jamón de cebo de campo ibérico", "Sobre 100 g (cortado a mano)", "ud", 6],
    "0005": ["Jamón de bellota ibérico", "Pieza entera", "pieza", 28],
    "0006": ["Jamón de bellota ibérico", "Sobre 100 g (cortado a mano)", "ud", 7],
    "0007": ["Jamón de bellota 100 % ibérico", "Pieza entera", "pieza", 38],
    "0008": ["Jamón de bellota 100 % ibérico", "Sobre 100 g (cortado a mano)", "ud", 9],
    "0009": ["Jamón Gran Selección", "Pieza entera", "pieza", 21],
    "0010": ["Jamón Gran Selección", "Sobre 100 g (cortado a mano)", "ud", 6],
    "0011": ["Jamón Gran Reserva", "Pieza entera", "pieza", 31],
    "0012": ["Paleta de cebo ibérica", "Pieza entera", "pieza", 18],
    "0013": ["Paleta de cebo ibérica", "Deshuesada", "pieza", 39],
    "0014": ["Paleta de cebo ibérica", "Sobre 100 g (cortado a mano)", "ud", 6],
    "0021": ["Paleta de cebo ibérica", "Sobre 150 g (cortado a máquina)", "ud", 9],
    "0015": ["Paleta de cebo de campo ibérica", "Pieza entera", "pieza", 21],
    "0016": ["Paleta de cebo de campo ibérica", "Deshuesada", "pieza", 38],
    "0017": ["Paleta de cebo de campo ibérica", "Sobre 100 g (cortado a mano)", "ud", 7],
    "0018": ["Paleta de bellota ibérica", "Pieza entera", "pieza", 23],
    "0019": ["Paleta de bellota ibérica", "Deshuesada", "pieza", 47],
    "0020": ["Paleta de bellota ibérica", "Sobre 100 g (cortado a mano)", "ud", 8],
    "0022": ["Paleta de bellota 100 % ibérica", "Pieza entera", "pieza", 26],
    "0023": ["Paleta Gran Selección", "Pieza entera", "pieza", 22],
    "0024": ["Paleta Gran Selección", "Sobre 100 g (cortado a mano)", "ud", 6.5],
    "0025": ["Lomo de cebo ibérico", "Al peso", "kg", 38],
    "0026": ["Lomo de bellota ibérico", "Al peso", "kg", 42],
    "0027": ["Chorizo ibérico", "Al peso", "kg", 16],
    "0028": ["Salchichón ibérico", "Al peso", "kg", 16],
    "0030": ["Longaniza ibérica blanca", "Al peso", "kg", 14],
    "0031": ["Longaniza ibérica roja", "Al peso", "kg", 14],
    "0032": ["Sobrasada ibérica", "Al peso", "kg", 14],
    "0033": ["Morcón ibérico", "Al peso", "kg", 17],
    "0034": ["Queso curado de oveja", "Al peso", "kg", 18]

  }
};

const HOJA = "Pedidos", RES = "Resumen";
const COLS = ["Recibido","Estado","Para el día","Franja","Entrega","Cliente","Teléfono","Email","Productos","Importe","Notas del cliente","Dirección","Código","Día ISO","Líneas","Pesos","Envío","Nota de la tienda","Historial"];
const C = { recibido:1, estado:2, dia:3, franja:4, modo:5, nombre:6, tel:7, email:8, productos:9, importe:10, notas:11, dir:12, id:13, iso:14, lineas:15, pesos:16, envio:17, nota:18, hist:19 };
const E = { nuevo:"Por confirmar", pendiente:"Pendiente de aceptar", aceptado:"Aceptado", listo:"Listo", entregado:"Entregado", cancCli:"Cancelado por el cliente", cancTie:"Cancelado por la tienda" };
const ESTADOS = [E.nuevo, E.pendiente, E.aceptado, E.listo, E.entregado, E.cancCli, E.cancTie];
const COL = { piedra:"#D9BD86", clara:"#E8D5AA", papel:"#F6EEDC", vitor:"#9A2A1E", encina:"#1F2B22", tinta:"#231C14", gris:"#6E6656", blanco:"#FFFCF5" };

/* =================== PUESTA EN MARCHA =================== */
function configurar() {
  const ss = libro();
  ss.setSpreadsheetLocale("es_ES");
  ss.setSpreadsheetTimeZone(CFG.tz);
  const sh = ss.getSheetByName(HOJA) || ss.getSheets()[0].setName(HOJA);
  montarPedidos(sh);
  montarResumen(ss);
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("SECRETO")) p.setProperty("SECRETO", Utilities.getUuid());
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("alEditar").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("alAbrir").forSpreadsheet(ss).onOpen().create();
  MailApp.getRemainingDailyQuota(); // pide el permiso de correo
  return "Listo";
}

function montarPedidos(sh) {
  const max = Math.max(sh.getMaxRows(), 800);
  if (sh.getMaxRows() < max) sh.insertRowsAfter(sh.getMaxRows(), max - sh.getMaxRows());
  if (sh.getMaxColumns() > COLS.length) sh.deleteColumns(COLS.length + 1, sh.getMaxColumns() - COLS.length);
  if (sh.getMaxColumns() < COLS.length) sh.insertColumnsAfter(sh.getMaxColumns(), COLS.length - sh.getMaxColumns());
  sh.getRange(1, 1, max, COLS.length).setFontFamily("Archivo").setFontSize(11).setVerticalAlignment("middle")
    .setFontColor(COL.tinta).setBackground(COL.blanco).setNumberFormat("@");
  sh.getRange(2, C.dia, max - 1, 1).setNumberFormat("ddd d mmm");
  sh.getRange(2, C.importe, max - 1, 1).setNumberFormat('#,##0.00 "€"').setHorizontalAlignment("right").setFontWeight("bold");
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold").setBackground(COL.encina).setFontColor(COL.clara);
  sh.setRowHeight(1, 38);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  [110, 160, 110, 80, 90, 160, 115, 200, 360, 95, 220, 220, 130, 90, 60, 60, 60, 200, 380].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, C.productos, max - 1, 1).setWrap(true);
  sh.getRange(2, C.notas, max - 1, 1).setWrap(true);
  sh.getRange(2, C.dia, max - 1, 1).setFontWeight("bold");
  sh.getRange(2, C.estado, max - 1, 1).setHorizontalAlignment("center").setFontWeight("bold")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).setAllowInvalid(false).build());
  sh.getRange(1, C.id, max, COLS.length - C.id + 1).setFontColor(COL.gris).setFontSize(9);
  try { sh.getRange(1, C.iso, 1, C.envio - C.iso + 1).shiftColumnGroupDepth(1); sh.getColumnGroup(C.iso, 1).collapse(); } catch (_) {}
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, max, COLS.length).setBorder(null, null, true, null, null, true, COL.clara, SpreadsheetApp.BorderStyle.SOLID);
  const r = sh.getRange("A2:S"), est = sh.getRange("B2:B");
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(F('=LEFT($B2,9)="Cancelado"')).setFontColor("#9A2A1E").setStrikethrough(true).setBackground("#F6E2DC").setRanges([r]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(E.nuevo).setBackground("#F6D9B0").setFontColor("#6B3E0A").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(E.pendiente).setBackground("#F3E7B8").setFontColor("#5E4D0E").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(E.aceptado).setBackground("#D4E6C8").setFontColor("#2F4A26").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(E.listo).setBackground("#CFE0EC").setFontColor("#24405E").setRanges([est]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(E.entregado).setBackground("#E6E2DA").setFontColor("#5A564D").setRanges([est]).build()
  ]);
  sh.setTabColor(COL.vitor);
}

function montarResumen(ss) {
  let h = ss.getSheetByName(RES);
  if (!h) h = ss.insertSheet(RES, 0); else { h.getRange("A1:L80").breakApart(); h.clear(); }
  ss.setActiveSheet(h); ss.moveActiveSheet(1);
  h.setHiddenGridlines(true);
  h.getRange("A1:L80").setBackground(COL.papel).setFontFamily("Archivo").setFontColor(COL.tinta).setVerticalAlignment("middle");
  [24, 120, 110, 170, 130, 320, 30, 110, 90, 170, 320, 24].forEach((w, i) => h.setColumnWidth(i + 1, w));
  const D = 'ARRAYFORMULA(IFERROR(DATEVALUE(Pedidos!N2:N),Pedidos!N2:N))';
  const B = "Pedidos!B2:B", ini = "(TODAY()-WEEKDAY(TODAY(),3))", fin = "(TODAY()-WEEKDAY(TODAY(),3)+6)";
  const vendido = `((${B}="${E.aceptado}")+(${B}="${E.listo}")+(${B}="${E.entregado}"))`;
  h.setRowHeight(1, 18);
  h.getRange("B2:K2").merge().setFormula(F('="Embutidos Salamanca  ·  "&PROPER(TEXT(TODAY(),"dddd"))&" "&DAY(TODAY())&" de "&TEXT(TODAY(),"mmmm")'))
    .setFontFamily("Cinzel").setFontSize(26).setFontColor(COL.vitor).setFontWeight("bold");
  h.setRowHeight(2, 56);
  h.getRange("B3:K3").merge().setValue("Se actualiza solo. Para confirmar el importe, marcar listo o cancelar: pestaña Pedidos → selecciona la fila → menú 🧾 Pedidos.")
    .setFontColor(COL.gris).setFontSize(10);
  const tarjetas = [
    ["B", "C", "Por confirmar", `=COUNTIF(${B},"${E.nuevo}")`, "0"],
    ["D", "D", "Esperando al cliente", `=COUNTIF(${B},"${E.pendiente}")`, "0"],
    ["E", "E", "Para preparar", `=COUNTIF(${B},"${E.aceptado}")`, "0"],
    ["F", "F", "Vendido esta semana", `=SUMPRODUCT((${D}>=${ini})*(${D}<=${fin})*${vendido}*N(+Pedidos!J2:J))`, '#,##0.00 "€"'],
    ["H", "K", "Hoy", `=SUMPRODUCT((${D}=TODAY())*((${B}="${E.aceptado}")+(${B}="${E.listo}")))&" pedidos para entregar o recoger"`, "@"]
  ];
  tarjetas.forEach(([a, b, titulo, f, fmt]) => {
    h.getRange(`${a}5:${b}5`).merge().setValue(titulo).setFontSize(10).setFontColor(COL.gris).setBackground(COL.blanco).setVerticalAlignment("bottom");
    h.getRange(`${a}6:${b}6`).merge().setFormula(F(f)).setNumberFormat(fmt).setFontSize(a === "H" ? 15 : 24)
      .setFontWeight("bold").setFontColor(COL.encina).setBackground(COL.blanco).setHorizontalAlignment("left").setVerticalAlignment("top");
    h.getRange(`${a}5:${b}6`).setBorder(true, true, true, true, null, null, COL.clara, SpreadsheetApp.BorderStyle.SOLID);
  });
  h.setRowHeight(5, 26); h.setRowHeight(6, 48); h.setRowHeight(7, 22);
  h.getRange("B8:F8").merge().setValue("Por confirmar (pesar y enviar importe)").setFontFamily("Cinzel").setFontSize(16).setFontColor(COL.encina);
  h.getRange("B9:F9").setValues([["Código", "Para el día", "Cliente", "Teléfono", "Productos"]]);
  h.getRange("B10").setFormula(F(`=IFERROR(SORT(CHOOSECOLS(FILTER(Pedidos!A2:S,${B}="${E.nuevo}"),13,3,6,7,9),2,TRUE),"Nada pendiente")`));
  h.getRange("H8:K8").merge().setValue("Para preparar y entregar").setFontFamily("Cinzel").setFontSize(16).setFontColor(COL.encina);
  h.getRange("H9:K9").setValues([["Para el día", "Franja", "Cliente", "Productos"]]);
  h.getRange("H10").setFormula(F(`=IFERROR(SORT(CHOOSECOLS(FILTER(Pedidos!A2:S,(${B}="${E.aceptado}")+(${B}="${E.listo}")),3,4,6,9),1,TRUE),"Nada por preparar")`));
  [h.getRange("B9:F9"), h.getRange("H9:K9")].forEach(x => x.setBackground(COL.encina).setFontColor(COL.clara).setFontWeight("bold"));
  h.setRowHeight(8, 40); h.setRowHeight(9, 30);
  h.getRange("B10:F49").setBackground(COL.blanco).setWrap(true).setVerticalAlignment("top");
  h.getRange("H10:K49").setBackground(COL.blanco).setWrap(true).setVerticalAlignment("top");
  h.getRange("C10:C49").setNumberFormat("ddd d mmm"); h.getRange("H10:H49").setNumberFormat("ddd d mmm");
  h.setTabColor(COL.piedra);
}

/* =================== MENÚ EN LA HOJA =================== */
function alAbrir() {
  SpreadsheetApp.getUi().createMenu("🧾 Pedidos")
    .addItem("Confirmar el importe del pedido seleccionado", "menuConfirmar")
    .addItem("Marcar como listo (avisa al cliente)", "menuListo")
    .addItem("Marcar como entregado", "menuEntregado")
    .addItem("Cancelar el pedido seleccionado (avisa al cliente)", "menuCancelar")
    .addSeparator()
    .addItem("Abrir la web", "menuWeb")
    .addToUi();
}
function seleccionado_() {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== HOJA) throw new Error("Ve a la pestaña Pedidos y selecciona la fila del pedido.");
  const f = sh.getActiveRange().getRow();
  const id = f > 1 ? sh.getRange(f, C.id).getDisplayValue() : "";
  if (!id) throw new Error("Selecciona una fila con un pedido.");
  return buscar(id);
}
function menuConfirmar() {
  const ui = SpreadsheetApp.getUi();
  try {
    const o = seleccionado_();
    if (![E.nuevo, E.pendiente].includes(o.estado)) return ui.alert(`Este pedido está "${o.estado}".`);
    const url = enlace(o.id, "n");
    ui.showModalDialog(HtmlService.createHtmlOutput(
      `<div style="font-family:Arial,sans-serif;color:#231C14"><p style="margin:0 0 6px"><b>${esc(o.nombre)}</b> · ${o.id}</p>
       <p style="margin:0 0 16px;color:#6E6656">${esc(o.productos).replace(/\n/g, "<br>")}</p>
       <a href="${url}" target="_blank" onclick="setTimeout(()=>google.script.host.close(),400)" style="display:inline-block;background:#1F2B22;color:#E8D5AA;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Poner pesos y enviar importe</a>
       <p style="font-size:12px;color:#6E6656;margin-top:16px">Se abre la web con el pedido. Al enviarlo, el cliente recibe el importe final y un botón para aceptarlo.</p></div>`
    ).setWidth(440).setHeight(260), "Confirmar importe");
  } catch (e) { ui.alert(e.message); }
}
function menuListo() { menuEstado_(E.listo, "¿Marcar como listo? El cliente recibirá un correo."); }
function menuEntregado() { menuEstado_(E.entregado, "¿Marcar como entregado?"); }
function menuEstado_(nuevo, pregunta) {
  const ui = SpreadsheetApp.getUi();
  try {
    const o = seleccionado_();
    if (ui.alert(o.id, pregunta, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    const r = nuevo === E.listo ? listo({ id: o.id, t: token(o.id, "n") }) : entregado({ id: o.id, t: token(o.id, "n") });
    if (r.ok) SpreadsheetApp.getActive().toast("Hecho.", "🧾 Pedidos", 4);
  } catch (e) { ui.alert(e.message); }
}
function menuCancelar() {
  const ui = SpreadsheetApp.getUi();
  try {
    const o = seleccionado_();
    const r = ui.prompt("Cancelar pedido", `Pedido ${o.id} de ${o.nombre}. Escribe el motivo (le llegará por correo):`, ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    cancelar({ id: o.id, t: token(o.id, "n"), motivo: r.getResponseText() });
    SpreadsheetApp.getActive().toast("Pedido cancelado y cliente avisado.", "🧾 Pedidos", 5);
  } catch (e) { ui.alert(e.message); }
}
function menuWeb() {
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(`<a href="${CFG.web}" target="_blank" style="font-family:Arial">Abrir ${CFG.web}</a>`).setWidth(380).setHeight(80), "Web");
}

/* Cambios hechos a mano en la columna Estado */
function alEditar(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() !== HOJA || e.range.getColumn() !== C.estado || e.range.getNumRows() !== 1 || e.range.getRow() < 2) return;
    const nuevo = String(e.value || ""), antes = String(e.oldValue || "");
    const id = sh.getRange(e.range.getRow(), C.id).getDisplayValue();
    if (!id || nuevo === antes) return;
    const o = buscar(id);
    anotar(o, `Estado cambiado a mano: ${antes} → ${nuevo}`);
    if (nuevo === E.listo) { correoCliente(o, "listo"); SpreadsheetApp.getActive().toast(`Se ha avisado a ${o.nombre}.`, "🧾 Pedidos", 5); }
    if (nuevo === E.cancTie) { correoCliente(o, "cancelado-tienda"); SpreadsheetApp.getActive().toast(`Se ha avisado a ${o.nombre}.`, "🧾 Pedidos", 5); }
  } catch (err) { console.error(err); }
}

/* =================== API =================== */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.accion === "dias") return json({ ok: true, dias: diasDisponibles(), franjas: CFG.franjas });
    if (p.accion === "ver") {
      const o = buscar(p.id), rol = rolDe(p.id, p.t);
      if (!o || !rol) throw new Error("Este enlace no es válido.");
      return json({ ok: true, rol, pedido: publica(o, rol) });
    }
    return json({ ok: true, negocio: CFG.negocio });
  } catch (err) { return json({ ok: false, error: err.message }); }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    lock.waitLock(20000);
    const f = { pedir, confirmar, aceptar, cancelar, listo, entregado }[d.accion];
    if (!f) throw new Error("Acción no válida.");
    return json(f(d));
  } catch (err) {
    return json({ ok: false, error: err.message });
  } finally { try { lock.releaseLock(); } catch (_) {} }
}

function pedir(d) {
  const nombre = limpio(d.nombre, 60), tel = limpio(d.telefono, 20), email = limpio(d.email, 100).toLowerCase();
  const notas = limpio(d.notas, 400), modo = d.modo === "domicilio" ? "domicilio" : "recoger", dir = limpio(d.direccion, 200);
  if (!nombre) throw new Error("Escribe tu nombre.");
  if (tel.replace(/\D/g, "").length < 9) throw new Error("Escribe un teléfono válido.");
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw new Error("Escribe un correo válido.");
  if (modo === "domicilio" && dir.length < 6) throw new Error("Escribe la dirección de entrega.");
  if (!d.acepta) throw new Error("Acepta las condiciones de venta y la política de privacidad.");
  if (diasDisponibles().indexOf(d.dia) < 0) throw new Error("Ese día no está disponible. Elige otro.");
  if (CFG.franjas.indexOf(d.franja) < 0) throw new Error("Elige mañana o tarde.");
  const lineas = normalizarLineas(d.lineas);
  const id = CFG.prefijo + "-" + Utilities.formatDate(new Date(), CFG.tz, "yyMMdd") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const calc = calcular(lineas, {}, 0);
  const fila = [];
  fila[C.recibido - 1] = ahora(); fila[C.estado - 1] = E.nuevo; fila[C.dia - 1] = diaFecha(d.dia); fila[C.franja - 1] = d.franja;
  fila[C.modo - 1] = modo === "domicilio" ? "A domicilio" : "Recoger"; fila[C.nombre - 1] = nombre; fila[C.tel - 1] = tel; fila[C.email - 1] = email;
  fila[C.productos - 1] = textoLineas(lineas, {}); fila[C.importe - 1] = calc.subtotal; fila[C.notas - 1] = notas; fila[C.dir - 1] = modo === "domicilio" ? dir : "";
  fila[C.id - 1] = id; fila[C.iso - 1] = d.dia; fila[C.lineas - 1] = JSON.stringify(lineas); fila[C.pesos - 1] = "{}"; fila[C.envio - 1] = "0";
  fila[C.nota - 1] = ""; fila[C.hist - 1] = `${ahora()} · Solicitud recibida en la web`;
  escribirFila(hoja().getLastRow() + 1, fila);
  ordenar();
  const o = buscar(id);
  let enviado = true;
  try { correoCliente(o, "recibido"); } catch (_) { enviado = false; }
  try { correoTienda(o, "nuevo"); } catch (_) {}
  return { ok: true, id, emailEnviado: enviado, pedido: publica(o, "cliente") };
}

function confirmar(d) {
  const o = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!o || rol !== "tienda") throw new Error("Este enlace no es válido.");
  if (![E.nuevo, E.pendiente].includes(o.estado)) throw new Error(`Este pedido está "${o.estado}".`);
  const pesos = {};
  o.lineas.forEach((l, i) => {
    if (l.tipo !== "pieza") return;
    const kg = Number(String((d.pesos || {})[i] || "").replace(",", "."));
    if (!(kg > 0 && kg < 40 * l.q)) throw new Error(`Escribe el peso real de: ${l.producto}.`);
    pesos[i] = Math.round(kg * 1000) / 1000;
  });
  const envio = Math.max(0, Number(String(d.envio || 0).replace(",", ".")) || 0);
  const calc = calcular(o.lineas, pesos, envio);
  const sh = hoja();
  sh.getRange(o.fila, C.pesos).setValue(JSON.stringify(pesos));
  sh.getRange(o.fila, C.envio).setValue(String(envio));
  sh.getRange(o.fila, C.nota).setValue(limpio(d.nota, 300));
  sh.getRange(o.fila, C.productos).setValue(textoLineas(o.lineas, pesos));
  sh.getRange(o.fila, C.importe).setValue(calc.total);
  sh.getRange(o.fila, C.estado).setValue(E.pendiente);
  anotar(o, `Importe enviado al cliente: ${euro(calc.total)}`);
  const n = buscar(o.id);
  correoCliente(n, "importe");
  return { ok: true, rol, pedido: publica(n, rol) };
}

function aceptar(d) {
  const o = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!o || rol !== "cliente") throw new Error("Este enlace no es válido.");
  if (o.estado !== E.pendiente) throw new Error(o.estado === E.aceptado ? "Este pedido ya está aceptado." : `Este pedido está "${o.estado}".`);
  hoja().getRange(o.fila, C.estado).setValue(E.aceptado);
  anotar(o, "Aceptado por el cliente (compra cerrada)");
  const n = buscar(o.id);
  correoCliente(n, "aceptado");
  correoTienda(n, "aceptado");
  return { ok: true, rol, pedido: publica(n, rol) };
}

function cancelar(d) {
  const o = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!o || !rol) throw new Error("Este enlace no es válido.");
  if (o.estado.startsWith("Cancelado")) throw new Error("Este pedido ya estaba cancelado.");
  if (o.estado === E.entregado) throw new Error("Este pedido ya se entregó.");
  const motivo = limpio(d.motivo, 200);
  hoja().getRange(o.fila, C.estado).setValue(rol === "tienda" ? E.cancTie : E.cancCli);
  anotar(o, `Cancelado por ${rol === "tienda" ? "la tienda" : "el cliente"}${motivo ? " · " + motivo : ""}`);
  const n = buscar(o.id); n.motivo = motivo;
  if (rol === "cliente") { correoTienda(n, "cancelado-cliente"); correoCliente(n, "cancelado-cliente"); }
  else correoCliente(n, "cancelado-tienda");
  return { ok: true, rol, pedido: publica(n, rol) };
}

function listo(d) {
  const o = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!o || rol !== "tienda") throw new Error("Este enlace no es válido.");
  if (o.estado !== E.aceptado) throw new Error(`Solo se puede marcar listo un pedido aceptado (este está "${o.estado}").`);
  hoja().getRange(o.fila, C.estado).setValue(E.listo);
  anotar(o, "Marcado como listo");
  const n = buscar(o.id);
  correoCliente(n, "listo");
  return { ok: true, rol, pedido: publica(n, rol) };
}

function entregado(d) {
  const o = buscar(d.id), rol = rolDe(d.id, d.t);
  if (!o || rol !== "tienda") throw new Error("Este enlace no es válido.");
  if (![E.aceptado, E.listo].includes(o.estado)) throw new Error(`Este pedido está "${o.estado}".`);
  hoja().getRange(o.fila, C.estado).setValue(E.entregado);
  anotar(o, "Entregado");
  return { ok: true, rol, pedido: publica(buscar(o.id), rol) };
}

/* =================== CÁLCULOS =================== */
function normalizarLineas(lineas) {
  if (!Array.isArray(lineas) || !lineas.length) throw new Error("La cesta está vacía.");
  if (lineas.length > 40) throw new Error("Demasiados productos en un pedido.");
  return lineas.map(x => {
    const c = CFG.catalogo[String(x.ref)];
    if (!c) throw new Error("Hay un producto que ya no está disponible. Recarga la página.");
    const [producto, formato, tipo, precio] = c;
    let q = Number(x.q);
    if (tipo === "kg") { if (!(q >= 0.25 && q <= 20) || Math.abs(q * 4 - Math.round(q * 4)) > 1e-6) throw new Error(`Cantidad no válida: ${producto}.`); q = Math.round(q * 100) / 100; }
    else if (!(Number.isInteger(q) && q >= 1 && q <= 30)) throw new Error(`Cantidad no válida: ${producto}.`);
    return { ref: String(x.ref), producto, formato, tipo, precio, q, tabla: !!x.tabla };
  });
}
function importeLinea(l, pesos, i) {
  if (l.tipo === "ud") return l.precio * l.q;
  if (l.tipo === "kg") return l.precio * l.q;
  return pesos[i] != null ? l.precio * pesos[i] : null;
}
function calcular(lineas, pesos, envio) {
  let subtotal = 0, faltan = 0;
  lineas.forEach((l, i) => { const v = importeLinea(l, pesos, i); if (v == null) faltan++; else subtotal += v; });
  subtotal = Math.round(subtotal * 100) / 100;
  return { subtotal, faltan, envio, total: Math.round((subtotal + (envio || 0)) * 100) / 100 };
}
function cantidad(l) { return l.tipo === "kg" ? (l.q < 1 ? Math.round(l.q * 1000) + " g" : String(l.q).replace(".", ",") + " kg") : l.q + (l.tipo === "pieza" ? (l.q > 1 ? " piezas" : " pieza") : " ud"); }
function textoLineas(lineas, pesos) {
  return lineas.map((l, i) => `${cantidad(l)} · ${l.producto} · ${l.formato}` +
    (l.tipo === "pieza" ? (pesos[i] != null ? ` · ${String(pesos[i]).replace(".", ",")} kg = ${euro(l.precio * pesos[i])}` : ` · ${l.precio} €/kg (por pesar)`) : ` · ${euro(importeLinea(l, pesos, i))}`)).join("\n");
}
function diasDisponibles() {
  const out = [];
  for (let n = CFG.diasMin; n <= CFG.diasMax; n++) {
    const dt = new Date(Date.now() + n * 864e5);
    const f = Utilities.formatDate(dt, CFG.tz, "yyyy-MM-dd");
    const [y, m, dd] = f.split("-").map(Number);
    if (CFG.dias[(new Date(y, m - 1, dd).getDay() + 6) % 7]) out.push(f);
  }
  return out;
}

/* =================== DATOS =================== */
function libro() { return SpreadsheetApp.openById(CFG.sheetId); }
function hoja() { return libro().getSheetByName(HOJA); }
function pedidos() {
  const sh = hoja(), n = sh.getLastRow();
  if (n < 2) return [];
  const t = sh.getRange(2, 1, n - 1, COLS.length).getDisplayValues(), v = sh.getRange(2, C.importe, n - 1, 1).getValues();
  return t.map((r, i) => {
    const g = k => r[C[k] - 1];
    let lineas = [], pesos = {};
    try { lineas = JSON.parse(g("lineas") || "[]"); } catch (_) {}
    try { pesos = JSON.parse(g("pesos") || "{}"); } catch (_) {}
    return { fila: i + 2, recibido: g("recibido"), estado: g("estado"), dia: g("iso"), franja: g("franja"), modo: g("modo"), nombre: g("nombre"),
      tel: g("tel"), email: g("email"), productos: g("productos"), importe: Number(v[i][0]) || 0, notas: g("notas"), dir: g("dir"), id: g("id"),
      lineas, pesos, envio: Number(g("envio")) || 0, nota: g("nota") };
  }).filter(o => o.id);
}
function buscar(id) { return pedidos().find(o => o.id === String(id || "")); }
function publica(o, rol) {
  const calc = calcular(o.lineas, o.pesos, o.envio);
  const p = { id: o.id, estado: o.estado, dia: o.dia, diaTexto: fechaLarga(o.dia), franja: o.franja, modo: o.modo, nombre: o.nombre, direccion: o.dir,
    recogida: CFG.recogida, notas: o.notas, nota: o.nota, envio: o.envio, subtotal: calc.subtotal, total: calc.total, faltan: calc.faltan,
    lineas: o.lineas.map((l, i) => ({ producto: l.producto, formato: l.formato, tipo: l.tipo, precio: l.precio, q: l.q, cantidad: cantidad(l),
      peso: o.pesos[i] != null ? o.pesos[i] : null, importe: importeLinea(l, o.pesos, i) })) };
  if (rol === "tienda") { p.telefono = o.tel; p.email = o.email; }
  return p;
}
function escribirFila(n, v) {
  const sh = hoja();
  sh.getRange(n, 1, 1, COLS.length).setNumberFormat("@");
  sh.getRange(n, C.dia).setNumberFormat("ddd d mmm");
  sh.getRange(n, C.importe).setNumberFormat('#,##0.00 "€"');
  sh.getRange(n, 1, 1, COLS.length).setValues([v]);
}
function ordenar() {
  const sh = hoja(), n = sh.getLastRow();
  if (n > 2) sh.getRange(2, 1, n - 1, COLS.length).sort([{ column: C.iso, ascending: true }, { column: C.franja, ascending: true }]);
}
function anotar(o, texto) {
  const r = hoja().getRange(o.fila, C.hist), v = r.getDisplayValue();
  r.setValue((v ? v + "\n" : "") + `${ahora()} · ${texto}`);
}

/* =================== CORREOS =================== */
function filasPedido(o, conImporte) {
  const calc = calcular(o.lineas, o.pesos, o.envio);
  const f = o.lineas.map((l, i) => {
    const v = importeLinea(l, o.pesos, i);
    const det = l.tipo === "pieza" ? (o.pesos[i] != null ? `${String(o.pesos[i]).replace(".", ",")} kg × ${l.precio} €/kg` : `${l.precio} €/kg · se pesa`) : "";
    return [`${cantidad(l)} · ${esc(l.producto)}<br><span style="color:${COL.gris};font-size:12px">${esc(l.formato)}${det ? " · " + det : ""}</span>`, v == null ? "Según peso" : euro(v)];
  });
  if (o.envio) f.push(["Envío", euro(o.envio)]);
  f.push([`<b>${calc.faltan ? "Total (sin las piezas por pesar)" : "Total"}</b>`, `<b>${euro(calc.total)}</b>`]);
  f.push([o.modo === "A domicilio" ? "Entrega a domicilio" : "Recogida", `${fechaLarga(o.dia)} · ${esc(o.franja)}<br><span style="color:${COL.gris};font-size:12px">${esc(o.modo === "A domicilio" ? o.dir : CFG.recogida)}</span>`]);
  f.push(["Pedido", o.id]);
  return f;
}
function correoCliente(o, tipo) {
  if (!o.email) return;
  const url = enlace(o.id, "c");
  const T = {
    "recibido": ["Solicitud recibida", `¡Gracias, ${o.nombre}!`, "Hemos recibido tu pedido. Vamos a preparar y pesar las piezas y te enviaremos el importe final para que lo aceptes. Todavía no tienes que pagar nada.", [["Ver mi pedido", url, true]], `📦 Pedido recibido · ${o.id}`],
    "importe": ["Importe final", `${o.nombre}, tu pedido está listo para aceptar`, `Ya hemos pesado tus productos. Este es el importe final${o.envio ? " con el envío" : ""}. Si te parece bien, pulsa <b>Aceptar pedido</b>: con eso queda cerrada la compra.${o.nota ? `<br><br><i>${esc(o.nota)}</i>` : ""}`, [["Aceptar pedido", enlace(o.id, "c", "aceptar"), true], ["Ver o cancelar", url, false]], `Importe final de tu pedido · ${euro(o.importe)}`],
    "aceptado": ["Pedido aceptado", `¡Hecho, ${o.nombre}!`, "Has aceptado tu pedido. Este correo es tu justificante de compra; guárdalo. Te avisaremos cuando esté listo.", [["Ver mi pedido", url, true]], `✅ Pedido aceptado · ${o.id}`],
    "listo": ["Listo", `${o.nombre}, tu pedido está listo`, o.modo === "A domicilio" ? `Lo llevamos el ${fechaLarga(o.dia)} por la ${o.franja.toLowerCase()}.` : `Puedes recogerlo el ${fechaLarga(o.dia)} por la ${o.franja.toLowerCase()} en ${esc(CFG.recogida)}.`, [["Ver mi pedido", url, true]], `🔔 Tu pedido está listo · ${o.id}`],
    "cancelado-cliente": ["Cancelado", `Hola, ${o.nombre}`, "Has cancelado tu pedido. Cuando quieras, haz otro desde la web.", [["Ir a la tienda", CFG.web + "#tienda", true]], `Pedido cancelado · ${o.id}`],
    "cancelado-tienda": ["Cancelado", `Hola, ${o.nombre}`, `Lo sentimos: hemos tenido que cancelar tu pedido${o.motivo ? " (" + esc(o.motivo) + ")" : ""}. Si ya habías pagado algo, te lo devolvemos. Escríbenos si quieres buscar una alternativa.`, [["Ir a la tienda", CFG.web + "#tienda", true]], `Tu pedido ${o.id} se ha cancelado`]
  }[tipo];
  MailApp.sendEmail({
    to: o.email, subject: T[4], name: CFG.negocio, replyTo: CFG.avisoA,
    htmlBody: plantilla(T[0], T[1], T[2], filasPedido(o), T[3], tipo.startsWith("cancelado"),
      `¿Dudas? Responde a este correo o escribe por <a href="https://wa.me/${CFG.whatsapp}" style="color:${COL.vitor}">WhatsApp</a>.`),
    body: `${T[1]}\n${T[2].replace(/<[^>]+>/g, "")}\n\n${o.productos}\n\nPedido ${o.id}\n${url}`
  });
}
function correoTienda(o, tipo) {
  const T = {
    "nuevo": ["Nuevo pedido", `🧾 Nuevo pedido · ${o.nombre} · ${diaCorto(o.dia)}`, `${esc(o.nombre)} ha hecho un pedido en la web. Pesa las piezas y envíale el importe final.`],
    "aceptado": ["Pedido aceptado", `✅ Aceptado · ${o.nombre} · ${diaCorto(o.dia)} ${o.franja}`, `${esc(o.nombre)} ha aceptado el importe. Ya puedes prepararlo.`],
    "cancelado-cliente": ["Cancelado por el cliente", `❌ Cancelado · ${o.nombre} · ${o.id}`, `${esc(o.nombre)} ha cancelado su pedido${o.motivo ? " (" + esc(o.motivo) + ")" : ""}.`]
  }[tipo];
  const filas = filasPedido(o).concat([["Cliente", esc(o.nombre)], ["Teléfono", `<a href="tel:${esc(o.tel)}" style="color:${COL.vitor}">${esc(o.tel)}</a>`], ["Email", esc(o.email)]]);
  if (o.notas) filas.push(["Notas", esc(o.notas)]);
  const hojaUrl = `https://docs.google.com/spreadsheets/d/${CFG.sheetId}/edit`;
  const botones = tipo === "nuevo" ? [["Poner pesos y enviar importe", enlace(o.id, "n"), true], ["Abrir la hoja", hojaUrl, false]] : [["Abrir el pedido", enlace(o.id, "n"), true], ["Abrir la hoja", hojaUrl, false]];
  MailApp.sendEmail({
    to: CFG.avisoA, subject: T[1], name: CFG.negocio + " · pedidos", replyTo: o.email || CFG.avisoA,
    htmlBody: plantilla(T[0], T[0], T[2], filas, botones, tipo.startsWith("cancelado"), "Todo lo que hagas desde aquí avisa al cliente por correo automáticamente.")
  });
}
function plantilla(etiqueta, titulo, texto, filas, botones, alerta, pie) {
  const fila = ([k, v]) => `<tr><td style="padding:10px 0;color:${COL.tinta};font-size:14px;border-bottom:1px solid ${COL.clara};vertical-align:top">${k}</td><td style="padding:10px 0 10px 12px;text-align:right;font-size:14px;color:${COL.tinta};border-bottom:1px solid ${COL.clara};vertical-align:top;white-space:nowrap">${v}</td></tr>`;
  const boton = ([t, u, lleno]) => `<a href="${u}" style="display:inline-block;margin:4px 4px 4px 0;padding:12px 20px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:bold;${lleno ? `background:${COL.encina};color:${COL.clara}` : `border:1.5px solid ${COL.encina};color:${COL.encina}`}">${t}</a>`;
  return `<div style="background:${COL.piedra};padding:28px 12px;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:${COL.blanco};border-radius:10px;overflow:hidden">
    <div style="padding:20px 28px;background:${COL.encina}">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;letter-spacing:.06em;color:${COL.piedra}">EMBUTIDOS SALAMANCA</div>
      <div style="font-size:12px;color:${COL.clara};opacity:.8;margin-top:2px">Ibéricos · pedidos</div>
    </div>
    <div style="padding:26px 28px">
      <span style="display:inline-block;background:${alerta ? COL.vitor : COL.piedra};color:${alerta ? "#fff" : COL.encina};font-size:12px;font-weight:bold;padding:5px 12px;border-radius:999px">${etiqueta}</span>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;color:${COL.vitor};margin:16px 0 8px">${esc(titulo)}</h1>
      <p style="color:#4A4236;font-size:15px;line-height:1.55;margin:0 0 18px">${texto}</p>
      <table role="presentation" width="100%" style="border-collapse:collapse">${filas.map(fila).join("")}</table>
      <p style="margin:20px 0 0">${botones.map(boton).join("")}</p>
      <p style="color:${COL.gris};font-size:13px;line-height:1.5;margin:22px 0 0">${pie}</p>
    </div>
    <div style="padding:12px 28px;background:${COL.encina};color:${COL.clara};font-size:12px">${CFG.negocio} · Web creada por The Sqvare</div>
  </div></div>`;
}

/* =================== UTILIDADES =================== */
function diaFecha(f) { const [y, m, d] = f.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function F(f) { let q = false, out = ""; for (const ch of f) { if (ch === '"') q = !q; out += (!q && ch === ",") ? ";" : ch; } return out; }
function enlace(id, rol, accion) { return `${CFG.web}?pedido=${encodeURIComponent(id)}&t=${token(id, rol)}${accion ? "&accion=" + accion : ""}#gestionar`; }
function token(id, rol) {
  const s = PropertiesService.getScriptProperties().getProperty("SECRETO") || "es";
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rol + ":" + id + ":" + s).slice(0, 9).map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("");
}
function rolDe(id, t) {
  if (!id || !t) return null;
  if (t === token(id, "c")) return "cliente";
  if (t === token(id, "n")) return "tienda";
  return null;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function limpio(v, n) { return String(v || "").replace(/[<>]/g, "").trim().slice(0, n); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); }
function euro(n) { return Number(n).toFixed(2).replace(".", ",") + " €"; }
function ahora() { return Utilities.formatDate(new Date(), CFG.tz, "dd/MM HH:mm"); }
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function fechaLarga(f) { if (!/^\d{4}-\d{2}-\d{2}$/.test(f || "")) return f || ""; const [y, m, d] = f.split("-").map(Number); return `${DIAS[new Date(y, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`; }
function diaCorto(f) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f || "")) return f || "";
  const [y, m, d] = f.split("-").map(Number), w = DIAS[new Date(y, m - 1, d).getDay()];
  return `${w.charAt(0).toUpperCase() + w.slice(1, 3)} ${d} ${MESES[m - 1].slice(0, 3)}`;
}
