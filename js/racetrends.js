class RaceTrendVisualization {
  constructor(data) {
    console.log("Construtor RaceTrendVisualization iniciado com dados:", data);
    if (!data) {
      console.error("Dados não fornecidos para RaceTrendVisualization");
      return;
    }

    this.data = data;
    this.initialize();
  }

  initialize() {
    this.initializeTabs();
    this.createViews();
    this.drawAllVisualizations();

    const activeTab = document.querySelector(".race-trend-tab.active");
    if (activeTab) {
      this.switchTab(activeTab);
    }
  }

  initializeTabs() {
    const tabs = document.querySelectorAll(".race-trend-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab));
    });
  }

  switchTab(selectedTab) {
    document
      .querySelectorAll(".race-trend-tab")
      .forEach((tab) => tab.classList.remove("active"));
    document
      .querySelectorAll(".race-trend-view")
      .forEach((view) => view.classList.remove("active"));

    selectedTab.classList.add("active");
    const segment = selectedTab.dataset.segment;
    document.querySelector(`#race-${segment}-trend`)?.classList.add("active");
  }

  createViews() {
    const container = document.querySelector(".race-trend-views");
    if (!container) {
      console.error("Container .race-trend-views não encontrado");
      return;
    }

    // Limpa o container
    container.innerHTML = "";

    Object.keys(this.data).forEach((segment) => {
      const view = this.createTrendView(segment);
      container.appendChild(view);
    });
  }

  createTrendView(segment) {
    const view = document.createElement("div");
    view.className = "race-trend-view";
    view.id = `race-${segment}-trend`;

    const visualizationDiv = document.createElement("div");
    visualizationDiv.className = "race-trend-visualization";

    const description = document.createElement("p");
    description.className = "race-trend-description";
    description.textContent = this.data[segment].description;

    view.appendChild(visualizationDiv);
    view.appendChild(description);

    if (segment === "admin") {
      view.classList.add("active");
    }

    return view;
  }

  drawAllVisualizations() {
    document.querySelectorAll(".race-trend-view").forEach((view) => {
      view.style.display = "block";
    });

    Object.keys(this.data).forEach((segment) => {
      const container = document.querySelector(
        `#race-${segment}-trend .race-trend-visualization`
      );
      if (container) {
        container.innerHTML = "";
        const svg = this.createSVG(segment, container);
        container.appendChild(svg);
      }
    });

    document.querySelectorAll(".race-trend-view").forEach((view) => {
      view.style.display = null;
    });
  }

  createSVG(segment, container) {
    const data = this.data[segment];
    const width = container.offsetWidth || 800;
    const height = 320;

    const padding = {
      top: 20,
      right: 0,
      left: 0,
      bottom: 20,
    };

    // Cálculos de proporção
    const baseFontSize = 64;
    const diff = data[2024] - data[2023];
    const absDiff = Math.abs(diff);
    const maxDiff = 20;
    const scale = Math.min(absDiff / maxDiff, 1);

    const endFontSize =
      diff > 0
        ? baseFontSize * (1 + scale * 0.5)
        : baseFontSize * (1 - scale * 0.3);

    const startX = padding.left;
    const endX = width - padding.right;
    const centerY = height / 2;

    const maxSlope = 15;
    const slopeScale = (diff / maxDiff) * maxSlope;
    const angle = Math.min(Math.max(slopeScale, -maxSlope), maxSlope);
    const verticalOffset =
      (-Math.tan((angle * Math.PI) / 180) * (endX - startX)) / 3;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.overflow = "visible";

    // Grupo para a linha
    const lineGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startX + baseFontSize * 2.2);
    line.setAttribute("y1", centerY - verticalOffset);
    line.setAttribute("x2", endX - endFontSize * 2.2);
    line.setAttribute("y2", centerY + verticalOffset);
    line.setAttribute("stroke", "#6b3552");
    line.setAttribute("stroke-width", "2");
    lineGroup.appendChild(line);
    svg.appendChild(lineGroup);

    // Grupo para os textos
    const textGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

    // Função para criar texto
    const createText = (x, y, value, fontSize, anchor) => {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x);
      text.setAttribute("y", y);
      text.setAttribute("font-family", "Karla, sans-serif");
      text.setAttribute("font-size", `${fontSize}px`);
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", "#6b3552");
      text.setAttribute("text-anchor", anchor);
      text.setAttribute("dominant-baseline", "middle");
      text.textContent = `${value}%`;
      return text;
    };

    // Função para criar ano
    const createYear = (x, y, year, fontSize, anchor) => {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x);
      text.setAttribute("y", y + fontSize / 2 + 10);
      text.setAttribute("font-family", "Karla, sans-serif");
      text.setAttribute("font-size", "16px");
      text.setAttribute("fill", "#6b3552");
      text.setAttribute("text-anchor", anchor);
      text.setAttribute("opacity", "0.7");
      text.textContent = year;
      return text;
    };

    // Adicionar textos
    const startText = createText(
      startX,
      centerY - verticalOffset,
      Math.round(data[2023]),
      baseFontSize,
      "start"
    );
    const endText = createText(
      endX,
      centerY + verticalOffset,
      Math.round(data[2024]),
      endFontSize,
      "end"
    );

    // Adicionar anos
    const yearStart = createYear(
      startX,
      centerY - verticalOffset,
      "2023",
      baseFontSize,
      "start"
    );
    const yearEnd = createYear(
      endX,
      centerY + verticalOffset,
      "2024",
      endFontSize,
      "end"
    );

    textGroup.appendChild(startText);
    textGroup.appendChild(endText);
    textGroup.appendChild(yearStart);
    textGroup.appendChild(yearEnd);

    svg.appendChild(textGroup);

    return svg;
  }
}

// Não inicializar automaticamente mais
// A inicialização será feita quando os dados estiverem disponíveis
window.RaceTrendVisualization = RaceTrendVisualization;
