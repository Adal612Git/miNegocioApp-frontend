(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaCitas tbody");
  const calendarEl = document.getElementById("calendar");

  let calendar = null;

  function formatDate(date) {
    return date.toLocaleDateString("es-MX");
  }

  function getDatePart(value) {
    if (!value) return null;
    if (typeof value === "string") return value.slice(0, 10);
    return new Date(value).toISOString().slice(0, 10);
  }

  function buildEvents(list) {
    return list
      .map((item) => {
        const datePart = getDatePart(
          item.date || item.start_date || item.startDate || item.start
        );
        if (!datePart) return null;
        const timePart = item.time || item.start_time || "00:00";
        const title = item.title || item.notes || "Cita";
        return {
          id: item._id || item.id || undefined,
          title,
          start: `${datePart}T${timePart}`,
          allDay: !item.time,
        };
      })
      .filter(Boolean);
  }

  function initCalendar() {
    if (!calendarEl || !window.FullCalendar) return;
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "timeGridWeek",
      locale: "es",
      height: 520,
      events: [],
    });
    calendar.render();
  }

  function updateCalendar(list) {
    if (!calendar) return;
    calendar.removeAllEvents();
    calendar.addEventSource(buildEvents(list));
  }

  function renderAppointments(list) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    list.forEach((item) => {
      const tr = document.createElement("tr");
      const date = item.date ? new Date(item.date) : null;
      const time = item.time || "";
      const status = item.status || "scheduled";

      tr.innerHTML = `
        <td>${date ? formatDate(date) : "-"}</td>
        <td>${time}</td>
        <td>${item.title || item.notes || ""}</td>
        <td>${item.notes || "-"}</td>
        <td>${status}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  async function loadAppointments() {
    try {
      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const start = startDate.toISOString().slice(0, 10);
      const end = endDate.toISOString().slice(0, 10);

      const data = await api.get(
        `/appointments?start_date=${start}&end_date=${end}`
      );

      const list = Array.isArray(data) ? data : [];
      renderAppointments(list);
      updateCalendar(list);
    } catch (err) {
      alert(window.getErrorMessage(err, "No se pudieron cargar las citas"));
    }
  }

  async function handleCreate(event) {
    event?.preventDefault?.();

    const date = prompt("Fecha (YYYY-MM-DD)");
    const time = prompt("Hora (HH:mm)");
    const notes = prompt("Notas (opcional)") || "";

    if (!date || !time) {
      alert("Completa los campos requeridos");
      return;
    }

    try {
      await api.post("/appointments", {
        date: date.trim(),
        time: time.trim(),
        notes,
      });
      await loadAppointments();
      alert("Cita creada");
    } catch (err) {
      if (err?.status === 409) {
        alert("Horario ocupado");
        return;
      }
      alert(window.getErrorMessage(err, "No se pudo crear la cita"));
    }
  }

  document.getElementById("btnNuevaCita")?.addEventListener("click", handleCreate);

  initCalendar();
  loadAppointments();
})();
