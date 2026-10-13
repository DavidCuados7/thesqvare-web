/**
 * TheSqvare Barber · Sistema de reservas (Google Apps Script)
 * ----------------------------------------------------------
 * Guarda las citas en la hoja "Reservas TheSqvare Barber", bloquea los solapes
 * y envía un correo de confirmación al cliente (y un aviso a la barbería).
 *
 * Instalación (una sola vez, con la cuenta thesqvare@gmail.com):
 *  1. Abre la hoja "Reservas TheSqvare Barber" → Extensiones → Apps Script.
 *  2. Borra lo que haya y pega TODO este archivo. Guarda.
 *  3. Ejecuta la función "configurar" (botón ▶) y acepta los permisos.
 *  4. Implementar → Nueva implementación → Tipo: Aplicación web
 *       Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario → Implementar.
 *  5. Copia la URL que acaba en /exec y pégala en apiUrl dentro de thesqvare-barber/index.html.
 */

const CFG = {
  sheetId: "1B1U8kO1RuPgP1MMfX9zN8fqHYW3XvA5HUBt3vC3JLuc",
  negocio: "TheSqvare Barber",
  avisoA: "thesqvare@gmail.com",           // recibe un aviso de cada reserva
  direccion: "Barcelona",
  whatsapp: "34648515835",
  prefijo: "TSB",
  tz: "Europe/Madrid",
  paso: 15,          // minutos entre horas ofrecidas
  margen: 15,        // minutos mínimos de antelación para hoy
  diasMax: 30,
  // Lunes..Domingo: [abre, cierra, última cita] o null si cerrado (igual que la web)
  horario: [
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]],
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]],
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]],
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]],
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]],
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]],
    [["10:00","14:00","13:30"],["15:00","21:00","20:30"]]
  ],
  // Mismos nombres que en la web
  servicios: {
    "Corte de pelo": [10, 30],
    "Corte + lavado": [12, 30],
    "Corte diseño": [12, 30],
    "Corte + cejas": [12, 30],
    "Corte + barba": [16, 30],
    "Corte + barba + cejas": [18, 30],
    "Degradado de barba": [8, 30],
    "Cejas + bigote": [6, 15],
    "Limpieza facial": [20, 30],
    "Limpieza facial + corte": [25, 30],
    "Limpieza facial + corte + barba": [30, 60],
    "Pintar cabello": [10, 60]
  }
};

const COLS = ["ID","Fecha","Hora inicio","Hora fin","Servicio","Duración (min)","Precio (€)","Nombre","Teléfono","Estado","Creada","Email","Avisos"];

/* ---------- Puesta en marcha ---------- */
function configurar() {
  const sh = hoja();
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold").setBackground("#0C0E1A").setFontColor("#FFC83D");
  sh.setFrozenRows(1);
  sh.getRange("A:M").setNumberFormat("@");   // todo como texto: fechas y horas no se transforman
  sh.autoResizeColumns(1, COLS.length);
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("SECRETO")) p.setProperty("SECRETO", Utilities.getUuid());
  MailApp.getRemainingDailyQuota(); // fuerza el permiso de correo
  return "Listo";
}

/* ---------- API ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.accion === "huecos") return json({ ok: true, huecos: huecos(p.fecha, p.servicio) });
    if (p.accion === "cancelar") return cancelar(p.id, p.t);
    return json({ ok: true, negocio: CFG.negocio });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    const nombre = limpio(d.nombre, 60), tel = limpio(d.telefono, 20), email = limpio(d.email, 100).toLowerCase();
    if (!nombre) throw new Error("Escribe tu nombre.");
    if (tel.replace(/\D/g, "").length < 9) throw new Error("Escribe un teléfono válido.");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw new Error("Escribe un correo válido.");
    const svc = CFG.servicios[d.servicio];
    if (!svc) throw new Error("Servicio no válido.");

    lock.waitLock(20000);
    if (huecos(d.fecha, d.servicio).indexOf(d.hora) < 0) throw new Error("Esa hora se acaba de ocupar. Elige otra.");

    const ini = aMin(d.hora), fin = aH(ini + svc[1]);
    const id = CFG.prefijo + "-" + Utilities.formatDate(new Date(), CFG.tz, "yyMMddHHmmss") + "-" + Math.floor(100 + Math.random() * 900);
    const creada = Utilities.formatDate(new Date(), CFG.tz, "yyyy-MM-dd HH:mm");
    const sh = hoja();
    sh.appendRow([id, d.fecha, d.hora, fin, d.servicio, svc[1], svc[0], nombre, tel, "Confirmada", creada, email, ""]);
    const fila = sh.getLastRow();
    SpreadsheetApp.flush();
    lock.releaseLock();

    const cita = { id, fecha: d.fecha, hora: d.hora, fin, servicio: d.servicio, precio: svc[0], nombre, tel, email };
    let enviado = false;
    try { correoCliente(cita); enviado = true; } catch (_) {}
    try { correoNegocio(cita); } catch (_) {}
    sh.getRange(fila, 13).setValue(enviado ? "Email ✓" : "Email ✗");

    return json({ ok: true, id, hora: d.hora, fin, precio: svc[0], email: enviado, whatsapp: false });
  } catch (err) {
    try { lock.releaseLock(); } catch (_) {}
    return json({ ok: false, error: err.message });
  }
}

/* ---------- Disponibilidad ---------- */
function huecos(fecha, servicio) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) throw new Error("Fecha no válida.");
  const svc = CFG.servicios[servicio];
  if (!svc) throw new Error("Servicio no válido.");
  const hoy = Utilities.formatDate(new Date(), CFG.tz, "yyyy-MM-dd");
  const limite = Utilities.formatDate(new Date(Date.now() + CFG.diasMax * 864e5), CFG.tz, "yyyy-MM-dd");
  if (fecha < hoy || fecha > limite) return [];
  const [y, m, dd] = fecha.split("-").map(Number);
  const turnos = CFG.horario[(new Date(y, m - 1, dd).getDay() + 6) % 7];
  if (!turnos) return [];
  const minimo = fecha === hoy ? aMin(Utilities.formatDate(new Date(), CFG.tz, "HH:mm")) + CFG.margen : -1;
  const ocupadas = citas().filter(c => c.fecha === fecha && c.estado !== "Cancelada").map(c => [aMin(c.ini), aMin(c.fin)]);
  const dur = svc[1], out = [];
  turnos.forEach(([a, c, u]) => {
    for (let t = aMin(a); t <= aMin(u); t += CFG.paso) {
      if (t + dur > aMin(c) || t < minimo) continue;
      if (ocupadas.some(([s, f]) => t < f && t + dur > s)) continue;
      out.push(aH(t));
    }
  });
  return out;
}

function citas() {
  const v = hoja().getDataRange().getValues().slice(1);
  return v.filter(r => r[0]).map((r, i) => ({ fila: i + 2, id: String(r[0]), fecha: txtFecha(r[1]), ini: txtHora(r[2]), fin: txtHora(r[3]), servicio: r[4], nombre: r[7], estado: String(r[9]), email: r[11] }));
}

/* ---------- Cancelación desde el correo ---------- */
function cancelar(id, t) {
  const c = citas().find(x => x.id === id);
  let msg;
  if (!c || t !== token(id)) msg = "Este enlace de cancelación no es válido.";
  else if (c.estado === "Cancelada") msg = "Esta cita ya estaba cancelada.";
  else {
    hoja().getRange(c.fila, 10).setValue("Cancelada");
    try { MailApp.sendEmail({ to: CFG.avisoA, subject: "Cita cancelada · " + c.id, htmlBody: `${esc(c.nombre)} ha cancelado su cita de <b>${esc(c.servicio)}</b> del ${c.fecha} a las ${c.ini}.` }); } catch (_) {}
    msg = `Tu cita del ${fechaLarga(c.fecha)} a las ${c.ini} se ha cancelado. ¡Te esperamos otro día!`;
  }
  return HtmlService.createHtmlOutput(`<meta name="viewport" content="width=device-width,initial-scale=1">
    <div style="font-family:Arial,sans-serif;background:#0C0E1A;color:#F3F4FA;min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center">
    <div><div style="width:36px;height:36px;border:4px solid #F3F4FA;margin:0 auto 18px;position:relative"><span style="position:absolute;right:-4px;bottom:-4px;width:15px;height:15px;background:#FFC83D"></span></div>
    <h2 style="margin:0 0 10px">${CFG.negocio}</h2><p style="color:#9097B8;max-width:36ch">${msg}</p></div></div>`).setTitle(CFG.negocio);
}

/* ---------- Correos ---------- */
function correoCliente(c) {
  const url = ScriptApp.getService().getUrl();
  const cancelarUrl = url ? `${url}?accion=cancelar&id=${encodeURIComponent(c.id)}&t=${token(c.id)}` : "";
  const fila = (k, v) => `<tr><td style="padding:8px 0;color:#9097B8;font-size:14px">${k}</td><td style="padding:8px 0;text-align:right;font-weight:bold;font-size:14px">${v}</td></tr>`;
  const html = `<div style="background:#0C0E1A;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#161A2E;color:#F3F4FA;border:2px solid #F3F4FA">
    <div style="padding:22px 26px;border-bottom:1px solid #272C4A">
      <table role="presentation"><tr><td style="width:22px;height:22px;border:3px solid #F3F4FA;position:relative"></td><td style="padding-left:12px;font-weight:bold;letter-spacing:1px">THESQVARE <span style="color:#FFC83D;font-weight:normal">BARBER</span></td></tr></table>
    </div>
    <div style="padding:26px">
      <div style="display:inline-block;background:#FFC83D;color:#0C0E1A;font-size:11px;font-weight:bold;letter-spacing:2px;padding:5px 10px">CITA CONFIRMADA</div>
      <h1 style="font-size:24px;margin:16px 0 6px">¡Hola, ${esc(c.nombre)}!</h1>
      <p style="color:#9097B8;margin:0 0 18px">Tu cita está reservada. Aquí tienes los detalles:</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;border-top:1px solid #272C4A;border-bottom:1px solid #272C4A">
        ${fila("Servicio", esc(c.servicio))}${fila("Día", fechaLarga(c.fecha))}${fila("Hora", c.hora + " – " + c.fin)}${fila("Precio", c.precio + " €")}${fila("Código", c.id)}${fila("Dónde", esc(CFG.direccion))}
      </table>
      <p style="margin:22px 0 0"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.direccion)}" style="display:inline-block;background:#FFC83D;color:#0C0E1A;text-decoration:none;font-weight:bold;padding:12px 18px">Cómo llegar</a></p>
      <p style="color:#9097B8;font-size:13px;margin:22px 0 0">¿No puedes venir? ${cancelarUrl ? `<a href="${cancelarUrl}" style="color:#FFC83D">Cancela tu cita aquí</a> para liberar el hueco` : `Escríbenos para liberar el hueco`} o avísanos por <a href="https://wa.me/${CFG.whatsapp}" style="color:#FFC83D">WhatsApp</a>.</p>
    </div>
    <div style="padding:14px 26px;background:#2A35F0;font-size:12px;color:#F3F4FA">${CFG.negocio} · Web creada por The Sqvare</div>
  </div></div>`;
  MailApp.sendEmail({
    to: c.email,
    subject: `✂️ Cita confirmada · ${fechaLarga(c.fecha)} a las ${c.hora}`,
    name: CFG.negocio,
    replyTo: CFG.avisoA,
    htmlBody: html,
    body: `Hola ${c.nombre}, tu cita en ${CFG.negocio} está confirmada.\n${c.servicio} · ${fechaLarga(c.fecha)} · ${c.hora}-${c.fin} · ${c.precio} €\nCódigo: ${c.id}${cancelarUrl ? "\nCancelar: " + cancelarUrl : ""}`
  });
}

function correoNegocio(c) {
  MailApp.sendEmail({
    to: CFG.avisoA,
    subject: `Nueva cita · ${c.fecha} ${c.hora} · ${c.nombre}`,
    name: CFG.negocio + " (reservas)",
    replyTo: c.email,
    htmlBody: `<b>${esc(c.servicio)}</b> · ${fechaLarga(c.fecha)} · ${c.hora}–${c.fin} · ${c.precio} €<br>${esc(c.nombre)} · ${esc(c.tel)} · ${esc(c.email)}<br>Código: ${c.id}`
  });
}

/* ---------- Utilidades ---------- */
function hoja() { return SpreadsheetApp.openById(CFG.sheetId).getSheets()[0]; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function aMin(h) { const [a, b] = String(h).split(":").map(Number); return a * 60 + b; }
function aH(m) { return ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); }
function txtFecha(v) { return v instanceof Date ? Utilities.formatDate(v, CFG.tz, "yyyy-MM-dd") : String(v); }
function txtHora(v) { return v instanceof Date ? Utilities.formatDate(v, CFG.tz, "HH:mm") : String(v).slice(0, 5); }
function limpio(v, n) { return String(v || "").replace(/[<>]/g, "").trim().slice(0, n); }
function esc(s) { return String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); }
function token(id) {
  const s = PropertiesService.getScriptProperties().getProperty("SECRETO") || "tsb";
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, id + s).slice(0, 8).map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("");
}
function fechaLarga(f) {
  const [y, m, d] = f.split("-").map(Number);
  const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"], meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${dias[new Date(y, m - 1, d).getDay()]} ${d} de ${meses[m - 1]}`;
}
