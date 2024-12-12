// Paleta de cores para raça/cor
// Paleta de cores para raça/cor
const raceColors = {
  Amarelo: "#a9c483", // Amarelo âmbar
  Branco: "#e88572", // Coral
  Indígena: "#7a6c89", // Roxo
  Pardo: "#ddae5f", // Marrom
  Preto: "#377da1", // Azul
  "N/D": "#dfdfd8", // Cinza claro neutro
};

// Configurações do grid
const GRID_SIZE = 10;
const TOTAL_UNITS = GRID_SIZE * GRID_SIZE;

function createUnitChart(data, containerId) {
  // Verifica se o container existe
  const container = document.querySelector(containerId);
  if (!container) {
    console.error(`Container ${containerId} não encontrado`);
    return;
  }

  try {
    // Limpar container
    d3.select(containerId).html("");

    // Criar tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "race-chart-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("color", "var(--color-diversity-text)")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
      .style("pointer-events", "none")
      .style("white-space", "nowrap")
      .style("z-index", "1000");

    // Calcular dimensões
    const margin = { top: 20, right: 10, bottom: 20, left: 10 };
    const width = container.offsetWidth - margin.left - margin.right;
    const gridHeight = width; // Altura do grid mantém proporção quadrada
    const legendHeight = 50; // Reduzido para apenas cores e labels
    const height = gridHeight + legendHeight;
    const unitSize = Math.floor(width / GRID_SIZE);

    // Calcular total e decidir se usa valores absolutos ou percentuais
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const useAbsolute = total <= TOTAL_UNITS;

    // Preparar dados para o grid
    let gridData = [];
    let currentIndex = 0;

    if (useAbsolute) {
      data.forEach((d) => {
        for (let i = 0; i < d.value && currentIndex < TOTAL_UNITS; i++) {
          gridData.push({
            race: d.race,
            index: currentIndex++,
            originalData: d, // Mantém referência aos dados originais
          });
        }
      });
    } else {
      data.forEach((d) => {
        const units = Math.round((d.value / total) * TOTAL_UNITS);
        for (let i = 0; i < units && currentIndex < TOTAL_UNITS; i++) {
          gridData.push({
            race: d.race,
            index: currentIndex++,
            originalData: d,
          });
        }
      });
    }

    // Criar SVG
    const svg = d3
      .select(containerId)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Criar grid de unidades com interatividade
    svg
      .selectAll("rect")
      .data(gridData)
      .enter()
      .append("rect")
      .attr("x", (d) => (d.index % GRID_SIZE) * unitSize)
      .attr("y", (d) => Math.floor(d.index / GRID_SIZE) * unitSize)
      .attr("width", unitSize - 2)
      .attr("height", unitSize - 2)
      .attr("fill", (d) => raceColors[d.race])
      .attr("rx", 2)
      .attr("ry", 2)
      .style("cursor", "pointer")
      .on("mousemove", function (event, d) {
        const percentage = ((d.originalData.value / total) * 100).toFixed(1);
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        tooltip
          .style("opacity", 1)
          .html(
            `
            <div style="font-weight: 500">${d.race}</div>
            <div style="margin: 4px 0">
              <span style="opacity: 0.7">Total:</span> 
              <span style="font-weight: 500">${d.originalData.value.toLocaleString(
                "pt-BR"
              )}</span>
            </div>
            <div>
              <span style="opacity: 0.7">Proporção:</span> 
              <span style="font-weight: 500">${percentage}%</span>
            </div>
          `
          )
          .style("left", mouseX + 10 + "px")
          .style("top", mouseY - 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Legenda simplificada
    const legend = svg
      .append("g")
      .attr("transform", `translate(0, ${gridHeight + 20})`);

    // Calcular layout da legenda
    const itemsPerRow = 3; // Número de itens por linha
    const itemWidth = width / itemsPerRow;

    data.forEach((d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      const legendItem = legend
        .append("g")
        .attr("transform", `translate(${col * itemWidth}, ${row * 25})`);

      legendItem
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", raceColors[d.race])
        .attr("rx", 2)
        .attr("ry", 2);

      legendItem
        .append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("font-size", "12px")
        .attr("fill", "var(--color-text)")
        .text(d.race);
    });
  } catch (error) {
    console.error("Erro ao criar gráfico:", error);
  }
}

// Função para inicializar todos os gráficos
function initializeRaceCharts() {
  createUnitChart(raceData.admin, "#admin-race-chart");
  createUnitChart(raceData.leadership, "#leadership-race-chart");
  createUnitChart(raceData.others, "#others-race-chart");
}

// Handler de resize
window.addEventListener(
  "resize",
  _.debounce(() => {
    // Chama createUnitChart para os dados atuais se existirem
    const currentRaceData = window.currentRaceData;
    if (currentRaceData) {
      createUnitChart(currentRaceData.admin, "#admin-race-chart");
      createUnitChart(currentRaceData.leadership, "#leadership-race-chart");
      createUnitChart(currentRaceData.others, "#others-race-chart");
    }
  }, 250)
);
