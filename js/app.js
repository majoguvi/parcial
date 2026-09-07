/**
 * app.js
 * Punto de entrada. Al cargar el DOM decide si mostrar el wizard
 * de caracterización o el dashboard, según lo que haya en localStorage.
 */

const App = {
  mostrarWizard() {
    document.getElementById("dashboard-view").classList.remove("is-visible");
    document.getElementById("wizard-view").classList.add("is-visible");
    Wizard.init();
  },

  mostrarDashboard() {
    document.getElementById("wizard-view").classList.remove("is-visible");
    document.getElementById("dashboard-view").classList.add("is-visible");
    Dashboard.init();
  },

  init() {
    if (Storage.tienePerfil()) {
      this.mostrarDashboard();
    } else {
      this.mostrarWizard();
    }
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
