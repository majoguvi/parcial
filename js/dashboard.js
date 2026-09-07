/**
 * dashboard.js
 * Panel principal: tarjetas de resumen, formulario rápido de gasto
 * diario y tabla dinámica con eliminación individual.
 */

const CATEGORIA_ICONO = {
  Comida: "🍽",
  Ocio: "🎬",
  Transporte: "🚌",
  Varios: "•"
};

const Dashboard = {
  init() {
    this.render();

    document.getElementById("gasto-diario-form")
      .addEventListener("submit", (e) => this.agregarGastoDiario(e));

    document.getElementById("btn-confirm-reset")
      .addEventListener("click", () => this.resetear());
  },

  render() {
    const data = Storage.cargar() || Storage.estructuraVacia();
    this.renderResumen(data);
    this.renderTabla(data.gastosDiarios);
  },

  renderResumen(data) {
    const totalIngresos = Finanzas.totalIngresos(data.perfil);
    const totalGastosFijos = Finanzas.totalGastosFijos(data.gastosFijos);
    const totalGastosDiarios = Finanzas.totalGastosDiarios(data.gastosDiarios);
    const balanceInicial = totalIngresos - totalGastosFijos;
    const balanceReal = balanceInicial - totalGastosDiarios;

    document.getElementById("stat-ingresos").textContent = Finanzas.formatoMoneda(totalIngresos);
    document.getElementById("stat-gastos-fijos").textContent = Finanzas.formatoMoneda(totalGastosFijos);
    document.getElementById("stat-gastos-variables").textContent = Finanzas.formatoMoneda(totalGastosDiarios);

    const balanceEl = document.getElementById("stat-balance");
    balanceEl.textContent = Finanzas.formatoMoneda(balanceReal);
    balanceEl.classList.toggle("summary-cell__value--negative", balanceReal < 0);

    document.getElementById("stat-balance-sub").textContent =
      `de ${Finanzas.formatoMoneda(balanceInicial)} disponibles, tras gastos variables`;
  },

  renderTabla(gastosDiarios) {
    const tbody = document.getElementById("gastos-diarios-body");
    const emptyState = document.getElementById("empty-state");

    if (!gastosDiarios.length) {
      tbody.innerHTML = "";
      emptyState.classList.add("is-visible");
      return;
    }
    emptyState.classList.remove("is-visible");

    const ordenados = [...gastosDiarios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tbody.innerHTML = ordenados.map(g => `
      <tr data-id="${g.id}">
        <td>${this.formatoFecha(g.fecha)}</td>
        <td>${this.escapar(g.concepto)}</td>
        <td><span class="category-pill">${CATEGORIA_ICONO[g.categoria] || "•"} ${g.categoria}</span></td>
        <td class="text-end cell-monto">${Finanzas.formatoMoneda(g.monto)}</td>
        <td class="text-end">
          <button type="button" class="btn-delete-row" data-id="${g.id}">Eliminar</button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".btn-delete-row").forEach(btn =>
      btn.addEventListener("click", () => this.eliminarGastoDiario(btn.dataset.id))
    );
  },

  agregarGastoDiario(event) {
    event.preventDefault();

    const concepto = document.getElementById("gd-concepto").value.trim();
    const monto = Number(document.getElementById("gd-monto").value);
    const categoria = document.getElementById("gd-categoria").value;
    if (!concepto || !monto || monto <= 0) return;

    const data = Storage.cargar() || Storage.estructuraVacia();
    data.gastosDiarios.push({
      id: Finanzas.generarId(),
      concepto,
      monto,
      categoria,
      fecha: new Date().toISOString()
    });
    Storage.guardar(data);

    event.target.reset();
    document.getElementById("gd-categoria").value = "Comida";
    this.render();
  },

  eliminarGastoDiario(id) {
    const data = Storage.cargar();
    if (!data) return;
    data.gastosDiarios = data.gastosDiarios.filter(g => g.id !== id);
    Storage.guardar(data);
    this.render();
  },

  resetear() {
    Storage.limpiar();
    const modalEl = document.getElementById("reset-modal");
    bootstrap.Modal.getInstance(modalEl)?.hide();
    App.mostrarWizard();
  },

  formatoFecha(iso) {
    return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  },

  escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }
};
