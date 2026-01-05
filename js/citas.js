(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaCitas tbody");
  const calendarEl = document.getElementById("calendar");
  const backdrop = document.getElementById("appointmentBackdrop");
  const form = document.getElementById("appointmentForm");
  const closeBtn = document.getElementById("appointmentClose");
  const cancelBtn = document.getElementById("appointmentCancel");
  const dateInput = document.getElementById("appointmentDate");
  const timeInput = document.getElementById("appointmentTime");
  const notesInput = document.getElementById("appointmentNotes");

  let calendar = null;
  let datePicker = null;
  let timePicker = null;

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

  function initPickers() {
    if (window.flatpickr && dateInput) {
      datePicker = window.flatpickr(dateInput, {
        dateFormat: "Y-m-d",
      });
    }
    if (window.flatpickr && timeInput) {
      timePicker = window.flatpickr(timeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
      });
    }
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
      const message = window.getErrorMessage(err, "No se pudieron cargar las citas");
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(message, "error");
      } else {
        alert(message);
      }
    }
  }

  function openModal() {
    if (!backdrop) return;
    if (datePicker) datePicker.setDate(new Date(), true);
    if (timePicker) timePicker.setDate(new Date(), true);
    if (notesInput) notesInput.value = "";
    backdrop.style.display = "flex";
  }

  function closeModal() {
    if (!backdrop) return;
    backdrop.style.display = "none";
  }

  async function handleCreate(event) {
    event?.preventDefault?.();

    const date = dateInput?.value?.trim();
    const time = timeInput?.value?.trim();
    const notes = notesInput?.value?.trim() || "";

    if (!date || !time) {
      const msg = "Completa los campos requeridos";
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(msg, "error");
      } else {
        alert(msg);
      }
      return;
    }

    try {
      await api.post("/appointments", {
        date,
        time,
        notes,
      });
      await loadAppointments();
      if (window.AppUI?.showToast) {
        window.AppUI.showToast("Cita creada");
      } else {
        alert("Cita creada");
      }
      closeModal();
    } catch (err) {
      if (err?.status === 409) {
        const msg = "Horario ocupado";
        if (window.AppUI?.showToast) {
          window.AppUI.showToast(msg, "error");
        } else {
          alert(msg);
        }
        return;
      }
      const message = window.getErrorMessage(err, "No se pudo crear la cita");
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(message, "error");
      } else {
        alert(message);
      }
    }
  }

  document.getElementById("btnNuevaCita")?.addEventListener("click", openModal);
  form?.addEventListener("submit", handleCreate);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });

  initCalendar();
  initPickers();
  loadAppointments();
})();
