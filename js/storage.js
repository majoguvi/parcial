/**
 * storage.js
 * Capa de persistencia en localStorage.
 * Toda la app comparte una única clave con un objeto JSON limpio:
 *
 * {
 *   perfil: { ingresoPrincipal: number, ingresoAdicional: number },
 *   gastosFijos: [
 *     { id, nombre, monto, compartido, tipoCompartido, valorCompartido, montoReal }
 *   ],
 *   gastosDiarios: [
 *     { id, concepto, monto, categoria, fecha }
 *   ]
 * }
 */

const STORAGE_KEY = "libroMayorApp";

const Storage = {
  /** Lee y parsea los datos guardados. Devuelve null si no existen. */
  cargar() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("No se pudo leer la información guardada:", err);
      return null;
    }
  },

  /** Guarda el objeto de datos completo. */
  guardar(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  /** Elimina toda la información (reset / reconfigurar). */
  limpiar() {
    localStorage.removeItem(STORAGE_KEY);
  },

  /** ¿Ya existe una caracterización previa? */
  tienePerfil() {
    const data = this.cargar();
    return !!(data && data.perfil);
  },

  /** Estructura vacía por defecto. */
  estructuraVacia() {
    return {
      perfil: { ingresoPrincipal: 0, ingresoAdicional: 0 },
      gastosFijos: [],
      gastosDiarios: []
    };
  }
};

/** Utilidades numéricas y de formato compartidas por wizard y dashboard. */
const Finanzas = {
  formatoMoneda(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    });
  },

  /** Calcula el valor real a pagar de un gasto fijo según si es compartido. */
  calcularMontoReal(gasto) {
    const monto = Number(gasto.monto) || 0;
    if (!gasto.compartido) return monto;

    const valor = Number(gasto.valorCompartido) || 0;
    if (gasto.tipoCompartido === "porcentaje") {
      return monto * (Math.min(Math.max(valor, 0), 100) / 100);
    }
    if (gasto.tipoCompartido === "personas") {
      return valor > 0 ? monto / valor : monto;
    }
    return monto;
  },

  totalIngresos(perfil) {
    return (Number(perfil.ingresoPrincipal) || 0) + (Number(perfil.ingresoAdicional) || 0);
  },

  totalGastosFijos(gastosFijos) {
    return gastosFijos.reduce((sum, g) => sum + this.calcularMontoReal(g), 0);
  },

  totalGastosDiarios(gastosDiarios) {
    return gastosDiarios.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  },

  generarId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};
