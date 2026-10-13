/**
 * TheSqvare Bar · Reservas de mesa (Google Apps Script)
 * -----------------------------------------------------
 * Guarda las reservas en la hoja "Reservas TheSqvare Bar", controla el aforo
 * por franja y envía un correo de confirmación al cliente (y un aviso al bar).
 *
 * Instalación (una sola vez, en una ventana de incógnito solo con thesqvare@gmail.com):
 *  1. script.new → borra lo que haya, pega TODO este archivo y guarda (Ctrl+S).
 *  2. Elige la función "configurar" y pulsa ▶ Ejecutar → acepta los permisos.
 *  3. Implementar → Nueva implementación → Aplicación web
 *       Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario → Implementar.
 *  4. Copia la URL que acaba en /exec.
 */

const CFG = {
  sheetId: "14StSPEELmoMqkV0Bzz7mnIau_Uk0dty8x52ECA-4zWM",
  negocio: "TheSqvare Bar",
  avisoA: "thesqvare@gmail.com",
  direccion: "Barcelona",
  whatsapp: "34648515835",
  prefijo: "TSBAR",
  tz: "Europe/Madrid",
  paso: 30,          // minutos entre horas ofrecidas
  margen: 30,        // antelación mínima para reservar hoy
  diasMax: 30,
  duracion: 90,      // minutos que se ocupa una mesa
  aforo: 32,         // comensales que se pueden reservar a la vez (deja sitio para gente sin reserva)
  maxPersonas: 8,
  // Lunes..Domingo: [abre, cierra, última reserva] o null si cerrado (igual que la web)
  horario: [
    null,
    [["13:00","16:00","15:00"],["20:00","23:30","22:30"]],
    [["13:00","16:00","15:00"],["20:00","23:30","22:30"]],
    [["13:00","16:00","15:00"],["20:00","23:30","22:30"]],
    [["13:00","16:00","15:00"],["20:00","00:00","23:00"]],
    [["13:00","16:30","15:30"],["20:00","00:00","23:00"]],
    [["13:00","16:30","15:30"]]
  ]
};

const COLS = ["ID","Fecha","Hora","Hora fin","Personas","Nombre","Teléfono","Estado","Creada","Email","Avisos"];

/* ---------- Puesta en marcha ---------- */
function configurar() {
  const sh = hoja();
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold").setBackground("#0C0E1A").setFontColor("#FFC83D");
  sh.setFrozenRows(1);
  sh.getRange("A:K").setNumberFormat("@");
  sh.autoResizeColumns(1, COLS.length);
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("SECRETO")) p.setProperty("SECRETO", Utilities.getUuid());
  MailApp.getRemainingDailyQuota();
  return "Listo";
}

/* ---------- API ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.accion === "huecos") return json({ ok: true, huecos: huecos(p.fecha, Number(p.personas)) });
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
    const pax = Number(d.personas);
    if (!nombre) throw new Error("Escribe tu nombre.");
    if (tel.replace(/\D/g, "").length < 9) throw new Error("Escribe un teléfono válido.");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw new Error("Escribe un correo válido.");
    if (!(pax >= 1 && pax <= CFG.maxPersonas)) throw new Error("Número de personas no válido.");

    lock.waitLock(20000);
    if (huecos(d.fecha, pax).indexOf(d.hora) < 0) throw new Error("Esa hora se acaba de llenar. Elige otra.");

    const fin = aH(Math.min(aMin(d.hora) + CFG.duracion, cierreDe(d.fecha, d.hora)));
    const id = CFG.prefijo + "-" + Utilities.formatDate(new Date(), CFG.tz, "yyMMddHHmmss") + "-" + Math.floor(100 + Math.random() * 900);
    const creada = Utilities.formatDate(new Date(), CFG.tz, "yyyy-MM-dd HH:mm");
    const sh = hoja();
    sh.appendRow([id, d.fecha, d.hora, fin, String(pax), nombre, tel, "Confirmada", creada, email, ""]);
    const fila = sh.getLastRow();
    SpreadsheetApp.flush();
    lock.releaseLock();

    const r = { id, fecha: d.fecha, hora: d.hora, fin, pax, nombre, tel, email };
    let enviado = false;
    try { correoCliente(r); enviado = true; } catch (_) {}
    try { correoNegocio(r); } catch (_) {}
    sh.getRange(fila, 11).setValue(enviado ? "Email ✓" : "Email ✗");

    return json({ ok: true, id, hora: d.hora, fin, personas: pax, email: enviado });
  } catch (err) {
    try { lock.releaseLock(); } catch (_) {}
    return json({ ok: false, error: err.message });
  }
}

/* ---------- Disponibilidad por aforo ---------- */
function turnosDe(fecha) {
  const [y, m, dd] = fecha.split("-").map(Number);
  return CFG.horario[(new Date(y, m - 1, dd).getDay() + 6) % 7];
}
function cierreDe(fecha, hora) {
  const t = (turnosDe(fecha) || []).find(([a, , u]) => aMin(hora) >= aMin(a) && aMin(hora) <= aMin(u));
  return t ? (t[1] === "00:00" ? 1440 : aMin(t[1])) : aMin(hora) + CFG.duracion;
}

function huecos(fecha, pax) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) throw new Error("Fecha no válida.");
  if (!(pax >= 1 && pax <= CFG.maxPersonas)) throw new Error("Número de personas no válido.");
  const hoy = Utilities.formatDate(new Date(), CFG.tz, "yyyy-MM-dd");
  const limite = Utilities.formatDate(new Date(Date.now() + CFG.diasMax * 864e5), CFG.tz, "yyyy-MM-dd");
  if (fecha < hoy || fecha > limite) return [];
  const turnos = turnosDe(fecha);
  if (!turnos) return [];
  const minimo = fecha === hoy ? aMin(Utilities.formatDate(new Date(), CFG.tz, "HH:mm")) + CFG.margen : -1;
  const ocupadas = reservas().filter(r => r.fecha === fecha && r.estado !== "Cancelada").map(r => [aMin(r.hora), aMin(r.fin) || aMin(r.hora) + CFG.duracion, r.pax]);
  const out = [];
  turnos.forEach(([a, c, u]) => {
    const cierre = c === "00:00" ? 1440 : aMin(c);
    for (let t = aMin(a); t <= aMin(u); t += CFG.paso) {
      if (t < minimo) continue;
      const f = Math.min(t + CFG.duracion, cierre);
      // comprueba el aforo en cada tramo de 15 min que ocuparía la mesa
      let cabe = true;
      for (let x = t; x < f && cabe; x += 15) {
        const usados = ocupadas.filter(([s, e]) => x >= s && x < e).reduce((n, o) => n + o[2], 0);
        if (usados + pax > CFG.aforo) cabe = false;
      }
      if (cabe) out.push(aH(t));
    }
  });
  return out;
}

function reservas() {
  const v = hoja().getDataRange().getValues().slice(1);
  return v.filter(r => r[0]).map((r, i) => ({ fila: i + 2, id: String(r[0]), fecha: txtFecha(r[1]), hora: txtHora(r[2]), fin: txtHora(r[3]), pax: Number(r[4]) || 0, nombre: r[5], estado: String(r[7]), email: r[9] }));
}

/* ---------- Cancelación desde el correo ---------- */
function cancelar(id, t) {
  const r = reservas().find(x => x.id === id);
  let msg;
  if (!r || t !== token(id)) msg = "Este enlace de cancelación no es válido.";
  else if (r.estado === "Cancelada") msg = "Esta reserva ya estaba cancelada.";
  else {
    hoja().getRange(r.fila, 8).setValue("Cancelada");
    try { MailApp.sendEmail({ to: CFG.avisoA, subject: "Reserva cancelada · " + r.id, htmlBody: `${esc(r.nombre)} ha cancelado su mesa para ${r.pax} del ${r.fecha} a las ${r.hora}.` }); } catch (_) {}
    msg = `Tu reserva del ${fechaLarga(r.fecha)} a las ${r.hora} se ha cancelado. ¡Te esperamos otro día!`;
  }
  return HtmlService.createHtmlOutput(`<meta name="viewport" content="width=device-width,initial-scale=1">
    <div style="font-family:Arial,sans-serif;background:#0C0E1A;color:#F3F4FA;min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center">
    <div><div style="width:36px;height:36px;border:4px solid #F3F4FA;margin:0 auto 18px;position:relative"><span style="position:absolute;right:-4px;bottom:-4px;width:15px;height:15px;background:#FFC83D"></span></div>
    <h2 style="margin:0 0 10px">${CFG.negocio}</h2><p style="color:#9097B8;max-width:36ch">${msg}</p></div></div>`).setTitle(CFG.negocio);
}

/* ---------- Correos ---------- */
function correoCliente(r) {
  const url = ScriptApp.getService().getUrl();
  const cancelarUrl = url ? `${url}?accion=cancelar&id=${encodeURIComponent(r.id)}&t=${token(r.id)}` : "";
  const paxTxt = r.pax + (r.pax === 1 ? " persona" : " personas");
  const fila = (k, v) => `<tr><td style="padding:8px 0;color:#9097B8;font-size:14px">${k}</td><td style="padding:8px 0;text-align:right;font-weight:bold;font-size:14px">${v}</td></tr>`;
  const html = `<div style="background:#0C0E1A;padding:28px 12px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#161A2E;color:#F3F4FA;border:2px solid #F3F4FA">
    <div style="padding:22px 26px;border-bottom:1px solid #272C4A">
      <table role="presentation"><tr><td style="width:22px;height:22px;border:3px solid #F3F4FA"></td><td style="padding-left:12px;font-weight:bold;letter-spacing:1px">THESQVARE <span style="color:#FFC83D;font-weight:normal">BAR</span></td></tr></table>
    </div>
    <div style="padding:26px">
      <div style="display:inline-block;background:#FFC83D;color:#0C0E1A;font-size:11px;font-weight:bold;letter-spacing:2px;padding:5px 10px">MESA CONFIRMADA</div>
      <h1 style="font-size:24px;margin:16px 0 6px">¡Hola, ${esc(r.nombre)}!</h1>
      <p style="color:#9097B8;margin:0 0 18px">Tu mesa está reservada. Aquí tienes los detalles:</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;border-top:1px solid #272C4A;border-bottom:1px solid #272C4A">
        ${fila("Mesa", paxTxt)}${fila("Día", fechaLarga(r.fecha))}${fila("Hora", r.hora)}${fila("Código", r.id)}${fila("Dónde", esc(CFG.direccion))}
      </table>
      <p style="color:#9097B8;font-size:13px;margin:16px 0 0">Te guardamos la mesa 15 minutos. Si llegáis más tarde, avísanos.</p>
      <p style="margin:22px 0 0"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.direccion)}" style="display:inline-block;background:#FFC83D;color:#0C0E1A;text-decoration:none;font-weight:bold;padding:12px 18px">Cómo llegar</a></p>
      <p style="color:#9097B8;font-size:13px;margin:22px 0 0">¿Cambio de planes? ${cancelarUrl ? `<a href="${cancelarUrl}" style="color:#FFC83D">Cancela tu reserva aquí</a> para liberar la mesa` : `Escríbenos para liberar la mesa`} o avísanos por <a href="https://wa.me/${CFG.whatsapp}" style="color:#FFC83D">WhatsApp</a>.</p>
    </div>
    <div style="padding:14px 26px;background:#2A35F0;font-size:12px;color:#F3F4FA">${CFG.negocio} · Web creada por The Sqvare</div>
  </div></div>`;
  MailApp.sendEmail({
    to: r.email,
    subject: `🍽️ Mesa confirmada · ${fechaLarga(r.fecha)} a las ${r.hora}`,
    name: CFG.negocio,
    replyTo: CFG.avisoA,
    htmlBody: html,
    body: `Hola ${r.nombre}, tu mesa en ${CFG.negocio} está confirmada.\n${paxTxt} · ${fechaLarga(r.fecha)} · ${r.hora}\nCódigo: ${r.id}${cancelarUrl ? "\nCancelar: " + cancelarUrl : ""}`
  });
}

function correoNegocio(r) {
  MailApp.sendEmail({
    to: CFG.avisoA,
    subject: `Nueva reserva · ${r.fecha} ${r.hora} · ${r.pax} pax · ${r.nombre}`,
    name: CFG.negocio + " (reservas)",
    replyTo: r.email,
    htmlBody: `<b>Mesa para ${r.pax}</b> · ${fechaLarga(r.fecha)} · ${r.hora}<br>${esc(r.nombre)} · ${esc(r.tel)} · ${esc(r.email)}<br>Código: ${r.id}`
  });
}

/* ---------- Utilidades ---------- */
function hoja() { return SpreadsheetApp.openById(CFG.sheetId).getSheets()[0]; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function aMin(h) { if (!h) return 0; const [a, b] = String(h).split(":").map(Number); return a * 60 + b; }
function aH(m) { return ("0" + Math.floor(m / 60) % 24).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); }
function txtFecha(v) { return v instanceof Date ? Utilities.formatDate(v, CFG.tz, "yyyy-MM-dd") : String(v); }
function txtHora(v) { return v instanceof Date ? Utilities.formatDate(v, CFG.tz, "HH:mm") : String(v).slice(0, 5); }
function limpio(v, n) { return String(v || "").replace(/[<>]/g, "").trim().slice(0, n); }
function esc(s) { return String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); }
function token(id) {
  const s = PropertiesService.getScriptProperties().getProperty("SECRETO") || "tsbar";
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, id + s).slice(0, 8).map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("");
}
function fechaLarga(f) {
  const [y, m, d] = f.split("-").map(Number);
  const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"], meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${dias[new Date(y, m - 1, d).getDay()]} ${d} de ${meses[m - 1]}`;
}
