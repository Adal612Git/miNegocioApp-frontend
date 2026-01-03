(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaCitas tbody");

  function formatDate(date) {
    return date.toLocaleDateString("es-MX");
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

      renderAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("No se pudieron cargar las citas");
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
      alert("No se pudo crear la cita");
    }
  }

  document.getElementById("btnNuevaCita")?.addEventListener("click", handleCreate);

  loadAppointments();
})();
