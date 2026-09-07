/**
 * wizard.js
 * Módulo de Caracterización Inicial: navegación entre pasos,
 * filas dinámicas de gastos fijos y guardado en localStorage.
 */

const Wizard = {
  pasoActual: 1,
  totalPasos: 3,
  gastosFijosTemp: [],

  init() {
    this.gastosFijosTemp = [];
    this.pasoActual = 1;
    this.actualizarPaso();
    this.agregarGastoFijo(); // arranca con una fila lista para llenar

    document.querySelectorAll('[data-action="next"]').forEach(btn =>
      btn.addEventListener("click", () => this.irSiguiente())
    );
    document.querySelectorAll('[data-action="prev"]').forEach(btn =>
      btn.addEventListener("click", () => this.irAnterior())
    );

    document.getElementById("btn-add-gasto-fijo")
      .addEventListener("click", () => this.agregarGastoFijo());

    document.getElementById("wizard-form")
      .addEventListener("submit", (e) => this.guardarConfiguracion(e));
  },

  irSiguiente() {
    if (!this.validarPaso(this.pasoActual)) return;
    if (this.pasoActual === 2) this.leerGastosFijosDelDOM();
    if (this.pasoActual === this.totalPasos) return;
    this.pasoActual++;
    if (this.pasoActual === 3) this.renderResumenPrevio();
    this.actualizarPaso();
  },

  irAnterior() {
    if (this.pasoActual === 1) return;
    this.pasoActual--;
    this.actualizarPaso();
  },

  validarPaso(paso) {
    if (paso === 1) {
      const principal = document.getElementById("ingreso-principal");
      if (!principal.value || Number(principal.value) <= 0) {
        principal.reportValidity();
        return false;
      }
    }
    if (paso === 2) {
      const nombres = document.querySelectorAll(".gasto-fijo-card__nombre");
      for (const input of nombres) {
        if (!input.value.trim()) {
          input.reportValidity();
          return false;
        }
      }
    }
    return true;
  },

  actualizarPaso() {
    document.querySelectorAll(".wizard-step").forEach(panel => {
      panel.classList.toggle("is-active", Number(panel.dataset.stepPanel) === this.pasoActual);
    });
    document.querySelectorAll(".step-track__item").forEach(item => {
      const n = Number(item.dataset.step);
      item.classList.toggle("is-active", n === this.pasoActual);
      item.classList.toggle("is-done", n < this.pasoActual);
    });
  },

  /** Crea una tarjeta de gasto fijo en el DOM con su propio manejo de "compartido". */
  agregarGastoFijo() {
    const id = Finanzas.generarId();
    const lista = document.getElementById("gastos-fijos-list");

    const card = document.createElement("div");
    card.className = "gasto-fijo-card";
    card.dataset.id = id;
    card.innerHTML = `
      <div class="gasto-fijo-card__row">
        <div class="gasto-fijo-card__field">
          <label>Concepto</label>
          <input type="text" class="form-control gasto-fijo-card__nombre" placeholder="Ej. Arriendo" required>
        </div>
        <div class="gasto-fijo-card__field">
          <label>Monto total</label>
          <div class="money-input">
            <span>$</span>
            <input type="number" min="0" step="1000" class="form-control gasto-fijo-card__monto" placeholder="0" required>
          </div>
        </div>
        <button type="button" class="gasto-fijo-card__remove">Quitar</button>
      </div>

      <div class="shared-toggle form-check form-switch">
        <input class="form-check-input gasto-fijo-card__compartido" type="checkbox" role="switch" id="compartido-${id}">
        <label class="form-check-label" for="compartido-${id}">Es un gasto compartido</label>

        <div class="shared-fields__type">
          <label>
            <input type="radio" name="tipo-${id}" value="porcentaje" checked>
            <span>% de aporte</span>
          </label>

          <label>
            <input type="radio" name="tipo-${id}" value="personas">
            <span>Nº de personas</span>
          </label>
        </div>
          <div class="gasto-fijo-card__field">
            <label id="valor-label-${id}">Tu % de aporte</label>
            <input type="number" min="0" step="1" class="form-control gasto-fijo-card__valor-compartido" placeholder="Ej. 50">
          </div>
        </div>
        <p class="shared-real-amount"></p>
      </div>
    `;
    lista.appendChild(card);

    // Referencias
    const chkCompartido = card.querySelector(".gasto-fijo-card__compartido");
    const camposCompartido = card.querySelector(".shared-fields");
    const inputMonto = card.querySelector(".gasto-fijo-card__monto");
    const inputValor = card.querySelector(".gasto-fijo-card__valor-compartido");
    const radiosTipo = card.querySelectorAll(`input[name="tipo-${id}"]`);
    const labelValor = card.querySelector(`#valor-label-${id}`);
    const realAmountEl = card.querySelector(".shared-real-amount");
    const btnQuitar = card.querySelector(".gasto-fijo-card__remove");

    const actualizarCalculo = () => {
      const visible = chkCompartido.checked;

      camposCompartido.classList.toggle("is-visible", visible);
        if (!visible) {
          realAmountEl.textContent = "";
          return;
        }

      const tipo = card.querySelector(
        'input[name="tipo-${id}"]:checked'
      ).value;

      // Cambiar texto según el tipo de división
      if (tipo === "porcentaje") {
        labelValor.textContent = "Tu % de aporte";
        inputValor.placeholder = "Ej. 50";
        inputValor.min = "1";
        inputValor.max = "100";
        } else {
        labelValor.textContent = "Número de personas";
        inputValor.placeholder = "Ej. 2";
        inputValor.min = "2";
        inputValor.removeAttribute("max");
        }

      const valor = Number(inputValor.value);

      // Si todavía no hay valor, no calculamos
      if (!valor || valor <= 0) {
        realAmountEl.textContent = "";
        return;
      }

      const montoReal = Finanzas.calcularMontoReal({
        monto: inputMonto.value,
        compartido: true,
        tipoCompartido: tipo,
        valorCompartido: valor
      });

      // Mostrar claramente qué representa el valor
      if (tipo === "porcentaje") {
        realAmountEl.textContent =
          'Tu aporte: ${valor}% · Tu parte real: ${Finanzas.formatoMoneda(montoReal)} / mes';
      } else {
        realAmountEl.textContent =
          'Dividido entre ${valor} personas · Tu parte real: ${Finanzas.formatoMoneda(montoReal)} / mes';
      }
    };

    chkCompartido.addEventListener("change", actualizarCalculo);
    inputMonto.addEventListener("input", actualizarCalculo);
    inputValor.addEventListener("input", actualizarCalculo);
    radiosTipo.forEach(r => r.addEventListener("change", actualizarCalculo));

    btnQuitar.addEventListener("click", () => {
      card.remove();
      // nunca dejar la lista en cero filas
      if (!document.querySelectorAll(".gasto-fijo-card").length) this.agregarGastoFijo();
    });
  },

  /** Recolecta los datos de todas las tarjetas de gasto fijo del DOM. */
  leerGastosFijosDelDOM() {
    const tarjetas = document.querySelectorAll(".gasto-fijo-card");
    this.gastosFijosTemp = Array.from(tarjetas)
      .map(card => {
        const nombre = card.querySelector(".gasto-fijo-card__nombre").value.trim();
        const monto = Number(card.querySelector(".gasto-fijo-card__monto").value) || 0;
        const compartido = card.querySelector(".gasto-fijo-card__compartido").checked;
        const tipoCompartido = compartido
          ? card.querySelector(`input[name="tipo-${card.dataset.id}"]:checked`).value
          : null;
        const valorCompartido = compartido
          ? Number(card.querySelector(".gasto-fijo-card__valor-compartido").value) || 0
          : 0;

        const gasto = { id: card.dataset.id, nombre, monto, compartido, tipoCompartido, valorCompartido };
        gasto.montoReal = Finanzas.calcularMontoReal(gasto);
        return gasto;
      })
      .filter(g => g.nombre && g.monto > 0);
  },

  renderResumenPrevio() {
    const ingresoPrincipal = Number(document.getElementById("ingreso-principal").value) || 0;
    const ingresoAdicional = Number(document.getElementById("ingreso-adicional").value) || 0;
    const totalIngresos = ingresoPrincipal + ingresoAdicional;
    const totalGastosFijos = Finanzas.totalGastosFijos(this.gastosFijosTemp);
    const balance = totalIngresos - totalGastosFijos;

    const filas = this.gastosFijosTemp.map(g => `
      <div class="summary-preview__row">
        <span>${g.nombre}${g.compartido ? " · compartido" : ""}</span>
        <span class="summary-preview__value">${Finanzas.formatoMoneda(g.montoReal)}</span>
      </div>
    `).join("");

    document.getElementById("summary-preview").innerHTML = `
      <div class="summary-preview__row">
        <span>Ingresos totales</span>
        <span class="summary-preview__value">${Finanzas.formatoMoneda(totalIngresos)}</span>
      </div>
      ${filas || `<div class="summary-preview__row"><span>Sin gastos fijos registrados</span><span class="summary-preview__value">$0</span></div>`}
      <div class="summary-preview__row summary-preview__row--total">
        <span>Capacidad de ahorro estimada</span>
        <span class="summary-preview__value">${Finanzas.formatoMoneda(balance)}</span>
      </div>
    `;
  },

  guardarConfiguracion(event) {
    event.preventDefault();
    this.leerGastosFijosDelDOM();

    const data = Storage.estructuraVacia();
    data.perfil.ingresoPrincipal = Number(document.getElementById("ingreso-principal").value) || 0;
    data.perfil.ingresoAdicional = Number(document.getElementById("ingreso-adicional").value) || 0;
    data.gastosFijos = this.gastosFijosTemp;
    data.gastosDiarios = [];

    Storage.guardar(data);
    App.mostrarDashboard();
  }
};
