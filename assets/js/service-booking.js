document.addEventListener("DOMContentLoaded", function () {
  var root = document.getElementById("turnoService");
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var WA_NUMBER = "5493442473453";
  var STORE_KEY = "toyotaTurnosDemo:v1";
  var DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  var DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  var MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var parseISO = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var longDate = function (s) { var d = parseISO(s); return DAYS[d.getDay()].toLowerCase() + " " + d.getDate() + " de " + MONTHS[d.getMonth()]; };

  // ---------------------------------------------------------------------------
  // Adaptador de datos (DEMO). Todo el flujo de la UI pasa por estas 4 funciones,
  // que devuelven Promesas. Para conectar un backend real alcanza con definir
  // window.ToyotaBooking = { getSlots, create, list, cancel } ANTES de este script
  // (misma forma, con fetch) y la interfaz no cambia.
  // ---------------------------------------------------------------------------
  function readAll() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch (e) { return []; } }
  function writeAll(list) { try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function hoursFor(dateISO) { // horario real del concesionario: L-V 8-12 y 15-19, sábados 8-12
    var wd = parseISO(dateISO).getDay();
    if (wd === 0) return [];
    var am = ["08:00", "09:00", "10:00", "11:00"], pm = ["15:00", "16:00", "17:00", "18:00"];
    return wd === 6 ? am : am.concat(pm);
  }
  function sampleBusy(key) { var h = 0; for (var i = 0; i < key.length; i++) { h = (h * 31 + key.charCodeAt(i)) >>> 0; } return h % 4 === 0; } // ~25% ocupado, siempre igual para el mismo día/hora
  var demoAdapter = {
    getSlots: function (dateISO) {
      var mine = readAll().filter(function (b) { return b.date === dateISO; }).map(function (b) { return b.time; });
      return Promise.resolve(hoursFor(dateISO).map(function (t) { return { time: t, free: mine.indexOf(t) === -1 && !sampleBusy(dateISO + t) }; }));
    },
    create: function (b) {
      var all = readAll();
      if (all.some(function (x) { return x.date === b.date && x.time === b.time; })) return Promise.reject(new Error("slot-taken"));
      var rec = Object.assign({ id: "TS-" + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).slice(2, 4).toUpperCase(), createdAt: new Date().toISOString() }, b);
      all.push(rec);
      return writeAll(all) ? Promise.resolve(rec) : Promise.reject(new Error("storage"));
    },
    list: function () { return Promise.resolve(readAll().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); })); },
    cancel: function (id) { writeAll(readAll().filter(function (b) { return b.id !== id; })); return Promise.resolve(); }
  };
  var api = window.ToyotaBooking || demoAdapter;

  // ---- UI ----
  function h(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  var state = { date: null, time: null };
  var form = $("turnoForm"), daysBox = $("turnoDays"), slotsBox = $("turnoSlots"), status = $("turnoStatus"), confirmBox = $("turnoConfirm"), listBox = $("turnoList"), emptyMsg = $("turnoEmpty");

  function renderDays() {
    daysBox.textContent = "";
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var n = 0;
    while (n < 7) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      var v = iso(d), b = h("button", { type: "button", "class": "turno-day", "data-date": v, "aria-pressed": "false" });
      b.appendChild(h("span", { "class": "turno-day-name" }, DAYS_SHORT[d.getDay()]));
      b.appendChild(h("span", { "class": "turno-day-num" }, pad(d.getDate()) + "/" + pad(d.getMonth() + 1)));
      daysBox.appendChild(b); n++;
    }
  }
  function renderSlots() {
    slotsBox.textContent = "";
    if (!state.date) { slotsBox.appendChild(h("p", { "class": "turno-hint" }, "Elegí primero un día.")); return; }
    slotsBox.appendChild(h("p", { "class": "turno-hint" }, "Cargando horarios…"));
    var wanted = state.date;
    api.getSlots(wanted).then(function (slots) {
      if (wanted !== state.date) return;
      slotsBox.textContent = "";
      slots.forEach(function (s) {
        var b = h("button", { type: "button", "class": "turno-slot", "data-time": s.time, "aria-pressed": String(state.time === s.time) }, s.time);
        if (!s.free) { b.disabled = true; b.setAttribute("aria-label", s.time + ", ocupado"); }
        slotsBox.appendChild(b);
      });
    });
  }
  function press(box, btn) { Array.prototype.forEach.call(box.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", String(x === btn)); }); }
  daysBox.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-date]"); if (!b) return;
    state.date = b.getAttribute("data-date"); state.time = null; press(daysBox, b); renderSlots(); status.textContent = "";
  });
  slotsBox.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-time]"); if (!b || b.disabled) return;
    state.time = b.getAttribute("data-time"); press(slotsBox, b); status.textContent = "";
  });

  function fail(id, msg) { $(id).textContent = msg; }
  function validate() {
    var name = form.nombre.value.trim(), tel = form.telefono.value.replace(/\D/g, ""), ok = true, first = null;
    fail("tsNombreErr", ""); fail("tsTelErr", ""); form.nombre.removeAttribute("aria-invalid"); form.telefono.removeAttribute("aria-invalid");
    if (name.length < 2) { fail("tsNombreErr", "Escribí tu nombre y apellido."); form.nombre.setAttribute("aria-invalid", "true"); first = first || form.nombre; ok = false; }
    if (tel.length < 8 || tel.length > 15) { fail("tsTelErr", "Ingresá un teléfono válido (entre 8 y 15 números)."); form.telefono.setAttribute("aria-invalid", "true"); first = first || form.telefono; ok = false; }
    if (!state.date || !state.time) { status.textContent = "Elegí un día y un horario para continuar."; ok = false; first = first || (state.date ? slotsBox : daysBox).querySelector("button:not([disabled])"); }
    else status.textContent = "";
    if (first) first.focus();
    return ok;
  }

  function waLink(b) {
    var msg = "Hola! Quiero confirmar mi turno de service (código " + b.id + "): " + b.servicio.toLowerCase() + " para mi " + b.modelo + ", el " + longDate(b.date) + " a las " + b.time + ". Soy " + b.nombre + ".";
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
  }
  function icsFile(b) {
    var p = b.date.split("-"), t = b.time.split(":");
    var fmt = function (d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z"; };
    var start = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], +t[0] + 3, +t[1])); // Argentina: UTC-3 todo el año
    var end = new Date(start.getTime() + 3600000);
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Toyota Concepcion del Uruguay//Turno//ES", "BEGIN:VEVENT", "UID:" + b.id + "@toyota-concepcion-uruguay", "DTSTAMP:" + fmt(new Date()), "DTSTART:" + fmt(start), "DTEND:" + fmt(end),
      "SUMMARY:Turno de service Toyota (" + b.id + ")", "LOCATION:9 de Julio 1624\\, Concepción del Uruguay\\, Entre Ríos", "DESCRIPTION:" + b.servicio + " - " + b.modelo + ". Confirmar por WhatsApp con el taller.", "END:VEVENT", "END:VCALENDAR"];
    return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  }
  function download(b) {
    var url = URL.createObjectURL(icsFile(b)), a = h("a", { href: url, download: "turno-" + b.id + ".ics" });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function showConfirm(b) {
    confirmBox.textContent = "";
    confirmBox.appendChild(h("p", { "class": "turno-confirm-kicker" }, "Turno reservado (demostración)"));
    confirmBox.appendChild(h("p", { "class": "turno-confirm-title" }, longDate(b.date) + ", " + b.time + " h"));
    confirmBox.appendChild(h("p", { "class": "turno-confirm-meta" }, b.servicio + " · " + b.modelo + " · Código " + b.id));
    var row = h("div", { "class": "turno-confirm-actions" });
    row.appendChild(h("a", { "class": "btn primary", href: waLink(b), target: "_blank", rel: "noopener" }, "Confirmar por WhatsApp"));
    var ics = h("button", { type: "button", "class": "btn" }, "Agregar al calendario"); ics.addEventListener("click", function () { download(b); });
    row.appendChild(ics); confirmBox.appendChild(row);
    confirmBox.hidden = false; confirmBox.focus();
  }
  function renderList() {
    api.list().then(function (items) {
      listBox.textContent = ""; emptyMsg.hidden = items.length > 0;
      items.forEach(function (b) {
        var li = h("li", { "class": "turno-item" }), info = h("div");
        info.appendChild(h("strong", null, longDate(b.date) + ", " + b.time + " h"));
        info.appendChild(h("span", null, b.servicio + " · " + b.modelo));
        var del = h("button", { type: "button", "class": "turno-cancel", "aria-label": "Cancelar el turno del " + longDate(b.date) + " a las " + b.time }, "Cancelar");
        del.addEventListener("click", function () { api.cancel(b.id).then(function () { confirmBox.hidden = true; status.textContent = "Turno cancelado."; renderList(); if (state.date === b.date) renderSlots(); }); });
        li.appendChild(info); li.appendChild(del); listBox.appendChild(li);
      });
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var data = { date: state.date, time: state.time, nombre: form.nombre.value.trim(), telefono: form.telefono.value.trim(), modelo: form.modelo.value, servicio: form.servicio.value };
    api.create(data).then(function (rec) {
      showConfirm(rec); renderList(); state.time = null; renderSlots(); status.textContent = "";
    }).catch(function (err) {
      status.textContent = err && err.message === "slot-taken" ? "Ese horario ya no está disponible. Elegí otro." : "No pudimos guardar el turno en este navegador. Probá de nuevo o escribinos por WhatsApp.";
      if (err && err.message === "slot-taken") { state.time = null; renderSlots(); }
    });
  });

  renderDays(); renderList();
});
