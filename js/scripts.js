// =======================================
// Utilitários
// =======================================

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const codCvm = params.get("cod_cvm");
  console.log("Parâmetros da URL:", { codCvm });
  return { codCvm };
}

console.log("Scripts.js carregado");

function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.replace(/\/$/, "").split("/").pop();

  console.log("Path atual:", path);
  console.log("Página identificada:", page);

  if (page === "" || page === "index.html") {
    return "home";
  } else if (page === "empresa.html") {
    return "company";
  }

  return "unknown";
}

// =======================================
// Carregamento de Dados
// =======================================

async function loadCompanyDetails() {
  const { codCvm } = getUrlParams();

  if (!codCvm) {
    console.log("Código CVM não fornecido - redirecionando para home");
    window.location.href = "/";
    return;
  }

  try {
    console.log("Carregando dados da empresa:", codCvm);
    await window.api.updateCompanyHeader(Number(codCvm));
    console.log("Dados da empresa carregados com sucesso");
  } catch (error) {
    console.error("Erro ao carregar dados da empresa:", error);
  }
}

// =======================================
// Componentes da UI
// =======================================
const uiComponents = {
  initializeAlerts: function () {
    const alertHeader = document.querySelector(".alert-header");
    const alertContent = document.querySelector(".alert-content");
    const expandIcon = document.querySelector(".expand-icon");

    if (alertHeader && alertContent && expandIcon) {
      alertHeader.addEventListener("click", function () {
        alertContent.classList.toggle("expanded");
        expandIcon.classList.toggle("rotated");
      });
    }
  },
};

const esgDetails = {
  initialize: function () {
    // Remover qualquer handler anterior
    document.removeEventListener("click", this.handleAccordionClick);

    // Adicionar novo handler
    document.addEventListener("click", this.handleAccordionClick);
  },

  handleAccordionClick: function (event) {
    const header = event.target.closest(".esg-detail-header");
    if (!header) return; // Se não clicou em um header, ignore

    const content = header.nextElementSibling;
    if (!content || !content.classList.contains("esg-detail-content")) return;

    // Fecha todos os outros acordeons primeiro
    document.querySelectorAll(".esg-detail-content").forEach((item) => {
      if (item !== content && item.classList.contains("active")) {
        item.classList.remove("active");
        // Reseta o ícone do acordeon que está sendo fechado
        const previousHeader = item.previousElementSibling;
        const previousIcon = previousHeader.querySelector(".ph-caret-down");
        if (previousIcon) {
          previousIcon.style.transform = "rotate(0)";
        }
      }
    });

    // Toggle do conteúdo clicado
    content.classList.toggle("active");

    // Atualiza o ícone
    const expandIcon = header.querySelector(".ph-caret-down");
    if (expandIcon) {
      expandIcon.style.transform = content.classList.contains("active")
        ? "rotate(180deg)"
        : "rotate(0)";
    }
  },
};

// =======================================
// Gráficos e Visualizações
// =======================================
const diversityCharts = {
  // Remove a propriedade data que tinha os dados mockados

  initialize: function (genderData = null) {
    if (genderData) {
      // Se recebeu dados, usa eles
      createGenderChart(genderData.admin, "#admin-gender-chart");
      createGenderChart(genderData.leadership, "#leadership-gender-chart");
      createGenderChart(genderData.others, "#others-gender-chart");
    }
  },
};

// =======================================
// Inicialização
// =======================================
document.addEventListener("DOMContentLoaded", async function () {
  const currentPage = getCurrentPage();
  const isHomePage = currentPage === "home";

  // Manipulação de scroll suave para links com js-scroll-link
  document.querySelectorAll(".js-scroll-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Se estamos na home, fazemos scroll suave
      if (isHomePage && href.includes("#")) {
        e.preventDefault();
        const targetId = href.split("#")[1];
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
      // Se não estamos na home, deixa o comportamento padrão do link
    });
  });

  // Verifica se há um hash na URL após carregar a página
  if (isHomePage && window.location.hash === "#search-section") {
    const target = document.getElementById("search-section");
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }

  // Scroll suave para o CTA da hero section
  const ctaButton = document.querySelector(".hero-main__cta");
  if (ctaButton) {
    ctaButton.addEventListener("click", function (e) {
      e.preventDefault();
      const searchSection = document.querySelector(this.getAttribute("href"));
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  try {
    switch (currentPage) {
      case "home":
        console.log("Inicializando página inicial");
        api.initializeSearch();
        api.fetchHomeStats(); // Adicione esta linha
        window.api.initializeFilters();
        break;

      case "company":
        console.log("Inicializando página da empresa");
        await loadCompanyDetails();
        // Inicializa componentes específicos da página da empresa
        uiComponents.initializeAlerts();
        esgDetails.initialize();
        diversityCharts.initialize();
        break;

      default:
        console.log("Página não reconhecida");
        break;
    }

    console.log("Inicialização concluída");
  } catch (error) {
    console.error("Erro na inicialização:", error);
  }
});
