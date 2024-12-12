// charts.js

// Paleta de cores baseada na cor principal da seção
const genderColors = {
  Feminino: "#4a0c32", // Cor principal
  Masculino: "#6c3a58", // Um pouco mais clara
  "Não-binário": "#8f6581", // Ainda mais clara
  "Não respondeu": "#b292aa", // A mais clara
};

// Função principal para criar gráfico de gênero
function createGenderChart(data, containerId) {
  // Verifica se o container existe
  const container = document.querySelector(containerId);
  if (!container) {
    console.error(`Container ${containerId} não encontrado`);
    return;
  }

  try {
    const margin = { top: 20, right: 10, bottom: 60, left: 15 };
    const width = container.offsetWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    // Limpar container
    d3.select(containerId).html("");

    // Criar tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "gender-chart-tooltip")
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

    // Criar SVG
    const svg = d3
      .select(containerId)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleBand().range([0, width]).padding(0.2);
    const y = d3.scaleLinear().range([height, 0]);

    // Domínios
    x.domain(data.map((d) => d.gender));
    y.domain([0, 100]);

    // Barras com interação
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.gender))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => genderColors[d.gender])
      .attr("rx", 1)
      .attr("ry", 1)
      .style("cursor", "pointer")
      .on("mousemove", function (event, d) {
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        tooltip
          .style("opacity", 1)
          .html(
            `
            <div style="font-weight: 500">${d.gender}</div>
            <div style="margin: 4px 0">
              <span style="opacity: 0.7">Total:</span> 
              <span style="font-weight: 500">${
                d.absoluteValue?.toLocaleString("pt-BR") || 0
              }</span>
            </div>          
            `
          )
          .style("left", mouseX + 10 + "px")
          .style("top", mouseY - 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Valores percentuais
    svg
      .selectAll(".percent")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "percent")
      .attr("x", (d) => x(d.gender) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "var(--color-diversity-text)")
      .text((d) => d.value + "%");

    // Eixo X com legendas
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "12px")
      .style("fill", "var(--color-diversity-text)")
      .call(wrap, 80);
  } catch (error) {
    console.error("Erro ao criar gráfico:", error);
  }
}

// Função auxiliar para quebrar texto longo
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em");

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}

// Exportamos a função createGenderChart para uso em outros arquivos
window.charts = {
  createGenderChart,
};

// O evento de resize continua o mesmo
window.addEventListener(
  "resize",
  _.debounce(() => {
    // Podemos pegar os dados atuais dos gráficos e redesenhá-los
    const data = window.currentGenderData;
    if (data) {
      createGenderChart(data.admin, "#admin-gender-chart");
      createGenderChart(data.leadership, "#leadership-gender-chart");
      createGenderChart(data.others, "#others-gender-chart");
    }
  }, 250)
);
