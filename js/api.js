// js/api.js

// Função auxiliar para somar valores de um objeto
function sumObjectValues(obj) {
  if (!obj) return 0;
  return Object.values(obj).reduce(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0
  );
}

// Função auxiliar para formatar valores monetários
function formatCurrency(value) {
  if (!value || isNaN(value) || value <= 0) return "-";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Função para validar dados de remuneração
function isValidRemunerationData(data) {
  if (!data) return false;

  const { maior, mediana, razao } = data;

  // Verifica se todos os valores necessários existem e são válidos
  if (!maior || !mediana || !razao) return false;
  if (isNaN(maior) || isNaN(mediana) || isNaN(razao)) return false;
  if (maior <= 0 || mediana <= 0 || razao <= 1) return false;

  // Verifica se a maior remuneração é realmente maior que a mediana
  if (maior <= mediana) return false;

  return true;
}

function transformGenderData(diversityData) {
  const genderLabels = {
    masculino: "Masculino",
    feminino: "Feminino",
    nao_binario: "Não-binário",
    nao_informado: "Não respondeu",
  };

  // Função auxiliar para converter dados de um grupo
  function convertGroup(genderData) {
    if (!genderData) return [];

    const validLabels = new Set(Object.keys(genderLabels));

    return Object.entries(genderData)
      .filter(([key]) => validLabels.has(key)) // Filtra apenas as chaves válidas
      .map(([key, value]) => ({
        gender: genderLabels[key],
        value: calculatePercentage(value, sumObjectValues(genderData)),
        absoluteValue: value, // Adiciona o valor absoluto
      }));
  }

  function calculatePercentage(value, total) {
    if (!total) return 0;
    return Number(((value / total) * 100).toFixed(1));
  }

  // Processa dados dos órgãos administrativos
  const adminData = [];
  diversityData.diversidade_admin.diversidade.forEach((org) => {
    if (org.genero) {
      const converted = convertGroup(org.genero);
      converted.forEach((item) => {
        const existing = adminData.find((d) => d.gender === item.gender);
        if (existing) {
          existing.value += item.value;
          existing.absoluteValue =
            (existing.absoluteValue || 0) + item.absoluteValue;
        } else {
          adminData.push(item);
        }
      });
    }
  });

  // Normaliza as porcentagens do admin
  const adminTotal = adminData.reduce((sum, item) => sum + item.value, 0);
  if (adminTotal > 0) {
    adminData.forEach((item) => {
      item.value = Number(((item.value * 100) / adminTotal).toFixed(1));
    });
  }

  const result = {
    admin: adminData,
    leadership: convertGroup(
      diversityData.recursos_humanos.diversidade.genero.lideranca
    ),
    others: convertGroup(
      diversityData.recursos_humanos.diversidade.genero.nao_lideranca
    ),
  };

  return result;
}

function transformGenderTrendData(data) {
  // Obtém os anos disponíveis
  const years = Object.keys(data.dados_esg).map(Number).sort();

  // Se não tivermos pelo menos dois anos de dados, retorna null
  if (years.length < 2) return null;

  // Função auxiliar para calcular porcentagem feminina
  function calculateFemalePercentage(genderData) {
    if (!genderData) return 0;

    // Calculamos o total excluindo não respondentes
    const respondentTotal = Object.entries(genderData)
      .filter(([key]) => key !== "nao_informado")
      .reduce((sum, [_, val]) => sum + val, 0);

    // Se não houver respondentes, retorna 0
    if (respondentTotal === 0) return 0;

    // Calcula a porcentagem em relação apenas aos respondentes
    const femalePercentage = (genderData.feminino / respondentTotal) * 100;

    return Number(femalePercentage.toFixed(1));
  }

  // Função para processar dados administrativos
  function processAdminData(yearData) {
    let totalFemale = 0;
    let totalAll = 0;

    yearData.dados_quantitativos.conteudo.diversidade_admin.diversidade.forEach(
      (org) => {
        if (org.genero) {
          totalFemale += org.genero.feminino || 0;
          totalAll += Object.values(org.genero).reduce(
            (sum, val) => sum + val,
            0
          );
        }
      }
    );

    return totalAll > 0
      ? Number(((totalFemale / totalAll) * 100).toFixed(1))
      : 0;
  }

  const result = {
    admin: {
      2023: processAdminData(data.dados_esg[2023]),
      2024: processAdminData(data.dados_esg[2024]),
    },
    leadership: {
      2023: calculateFemalePercentage(
        data.dados_esg[2023].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.genero.lideranca
      ),
      2024: calculateFemalePercentage(
        data.dados_esg[2024].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.genero.lideranca
      ),
    },
    others: {
      2023: calculateFemalePercentage(
        data.dados_esg[2023].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.genero.nao_lideranca
      ),
      2024: calculateFemalePercentage(
        data.dados_esg[2024].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.genero.nao_lideranca
      ),
    },
  };

  // Verifica se temos dados válidos em todas as categorias
  const hasValidData = Object.values(result).every(
    (category) => !isNaN(category[2023]) && !isNaN(category[2024])
  );

  return hasValidData ? result : null;
}

function transformRaceData(diversityData) {
  // Labels para padronizar os nomes
  const raceLabels = {
    amarelo: "Amarelo",
    branco: "Branco",
    indigena: "Indígena",
    pardo: "Pardo",
    preto: "Preto",
    nao_informado: "N/D",
    outros: "N/D", // Unificando com não informado
  };

  // Função auxiliar para converter dados de um grupo
  function convertGroup(raceData) {
    if (!raceData) return [];

    // Objeto temporário para acumular valores
    const aggregated = {};

    Object.entries(raceData).forEach(([key, value]) => {
      const label = raceLabels[key];
      if (!label) return; // Ignora chaves desconhecidas

      if (!aggregated[label]) {
        aggregated[label] = 0;
      }
      aggregated[label] += value;
    });

    // Converte para array de objetos
    return Object.entries(aggregated)
      .map(([race, value]) => ({
        race,
        value,
      }))
      .filter((item) => item.value > 0) // Remove itens com valor 0
      .sort((a, b) => b.value - a.value); // Ordena por valor decrescente
  }

  // Processa dados dos órgãos administrativos
  const adminData = [];
  diversityData.diversidade_admin.diversidade.forEach((org) => {
    if (org.cor_raca) {
      const converted = convertGroup(org.cor_raca);
      converted.forEach((item) => {
        const existing = adminData.find((d) => d.race === item.race);
        if (existing) {
          existing.value += item.value;
        } else {
          adminData.push(item);
        }
      });
    }
  });

  const result = {
    admin: adminData.sort((a, b) => b.value - a.value), // Ordena por valor decrescente
    leadership: convertGroup(
      diversityData.recursos_humanos.diversidade.cor_raca.lideranca
    ),
    others: convertGroup(
      diversityData.recursos_humanos.diversidade.cor_raca.nao_lideranca
    ),
  };

  return result;
}

function transformRaceTrendData(data) {
  // Obtém os anos disponíveis
  const years = Object.keys(data.dados_esg).map(Number).sort();

  // Se não tivermos pelo menos dois anos de dados, retorna null
  if (years.length < 2) return null;

  // Função auxiliar para calcular porcentagem de não-brancos
  function calculateNonWhitePercentage(raceData) {
    if (!raceData) return 0;

    // Total excluindo não informados
    const respondentTotal = Object.entries(raceData)
      .filter(([key]) => key !== "nao_informado")
      .reduce((sum, [_, val]) => sum + val, 0);

    if (respondentTotal === 0) return 0;

    // Total de não-brancos (todos exceto brancos e não informados)
    const nonWhiteTotal = Object.entries(raceData)
      .filter(([key]) => key !== "branco" && key !== "nao_informado")
      .reduce((sum, [_, val]) => sum + val, 0);

    return Number(((nonWhiteTotal / respondentTotal) * 100).toFixed(1));
  }

  // Função para processar dados administrativos
  function processAdminData(yearData) {
    let totalNonWhite = 0;
    let totalRespondents = 0;

    yearData.dados_quantitativos.conteudo.diversidade_admin.diversidade.forEach(
      (org) => {
        if (org.cor_raca) {
          Object.entries(org.cor_raca).forEach(([key, value]) => {
            if (key !== "nao_informado") {
              totalRespondents += value;
              if (key !== "branco") {
                totalNonWhite += value;
              }
            }
          });
        }
      }
    );

    return totalRespondents > 0
      ? Number(((totalNonWhite / totalRespondents) * 100).toFixed(1))
      : 0;
  }

  const result = {
    admin: {
      2023: processAdminData(data.dados_esg[2023]),
      2024: processAdminData(data.dados_esg[2024]),
    },
    leadership: {
      2023: calculateNonWhitePercentage(
        data.dados_esg[2023].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.cor_raca.lideranca
      ),
      2024: calculateNonWhitePercentage(
        data.dados_esg[2024].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.cor_raca.nao_lideranca
      ),
    },
    others: {
      2023: calculateNonWhitePercentage(
        data.dados_esg[2023].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.cor_raca.nao_lideranca
      ),
      2024: calculateNonWhitePercentage(
        data.dados_esg[2024].dados_quantitativos.conteudo.recursos_humanos
          .diversidade.cor_raca.nao_lideranca
      ),
    },
  };

  // Verifica se temos dados válidos em todas as categorias
  const hasValidData = Object.values(result).every(
    (category) => !isNaN(category[2023]) && !isNaN(category[2024])
  );

  return hasValidData ? result : null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Funções auxiliares para os ícones e labels das práticas
function getPraticaIcon(pratica) {
  const icons = {
    relatorio: "ph-file-text",
    materialidade: "ph-chart-scatter",
    ods: "ph-globe-hemisphere-west",
    tcfd: "ph-thermometer",
    gee: "ph-chart-line-up",
  };
  return icons[pratica] || "ph-info";
}

function getPraticaLabel(pratica) {
  const labels = {
    relatorio: "Relatório ESG",
    materialidade: "Matriz de Materialidade",
    ods: "Objetivos de Desenvolvimento Sustentável",
    tcfd: "TCFD",
    gee: "Inventário GEE",
  };
  return labels[pratica] || pratica;
}

// Função auxiliar para obter o dado mais recente disponível
function getLatestAvailableData(data, path) {
  const years = Object.keys(data.dados_esg)
    .map(Number)
    .sort((a, b) => b - a);

  let bestData = null;
  let bestYear = null;
  const currentYear = new Date().getFullYear();

  for (const year of years) {
    try {
      let current = data.dados_esg[year];

      // Se o path inclui info_asg, verifica se há erro
      if (path.includes("info_asg")) {
        const infoAsg = current?.dados_qualitativos?.conteudo?.info_asg;
        if (infoAsg?.erro) {
          // Se for erro total, pula para o próximo ano
          if (infoAsg.erro.includes("Falha na extração")) continue;
          // Se for erro parcial, marca como melhor opção se ainda não tivermos nenhuma
          if (!bestData) {
            bestData = infoAsg;
            bestYear = year;
          }
          continue;
        }
      }

      // Navega através do path
      for (const key of path) {
        if (!current) break;
        current = current[key];
      }

      // Se encontrou dados válidos
      if (current && current !== "") {
        return {
          data: current,
          year: year,
          needsYearBadge: year < currentYear,
        };
      }
    } catch (error) {
      console.debug(`Erro ao acessar dados do ano ${year}:`, error);
      continue;
    }
  }

  // Retorna os melhores dados encontrados ou null
  return bestData
    ? { data: bestData, year: bestYear, needsYearBadge: true }
    : null;
}

function createYearBadge(year) {
  return `
      <span class="year-badge" title="Dados referentes a ${year}">
          <i class="ph-bold ph-calendar"></i>
          ${year}
      </span>
  `;
}

function getESGPracticeStatus(data, practice) {
  // Se não temos dados, retorna status indeterminado
  if (!data)
    return {
      status: "indeterminate",
      icon: "ph-question",
      label: "Dados não disponíveis",
      className: "status-indeterminate",
    };

  // Mapeamento completo de práticas ESG
  const practiceMap = {
    "esg-report": {
      path: "divulgaInformacoesAsg.divulga",
      trueLabel: "Publica relatório ESG",
      falseLabel: "Não publica relatório ESG",
    },
    "esg-audit": {
      path: "auditoria.auditoriaRealizada",
      trueLabel: "Realiza auditoria externa",
      falseLabel: "Não realiza auditoria externa",
    },
    "esg-inventory": {
      path: "inventarioEmissoes.realizaInventario",
      trueLabel: "Realiza inventário GEE",
      falseLabel: "Não realiza inventário GEE",
    },
    "esg-matrix": {
      path: "materialidade.divulgaMatriz",
      trueLabel: "Possui matriz de materialidade",
      falseLabel: "Não possui matriz de materialidade",
    },
    "esg-ods": {
      path: "objetivosDesenvolvimentoSustentavel.consideraODS",
      trueLabel: "Considera ODS",
      falseLabel: "Não considera ODS",
    },
    "esg-tcfd": {
      path: "recomendacoesTCFD.consideraTCFD",
      trueLabel: "Considera TCFD",
      falseLabel: "Não considera TCFD",
    },
  };

  const practiceConfig = practiceMap[practice];
  if (!practiceConfig) return null;

  try {
    // Navega até o valor usando o path
    const value = practiceConfig.path.split(".").reduce((obj, key) => {
      if (obj === undefined || obj === null) return undefined;
      return obj[key];
    }, data);

    // Determina o status com base no valor encontrado
    if (value === true) {
      return {
        status: "active",
        icon: "ph-check",
        label: practiceConfig.trueLabel,
        className: "status-active",
      };
    } else if (value === false) {
      return {
        status: "inactive",
        icon: "ph-x",
        label: practiceConfig.falseLabel,
        className: "status-inactive",
      };
    }

    // Se o valor não é nem true nem false, consideramos indeterminado
    return {
      status: "indeterminate",
      icon: "ph-question",
      label: "Dados não disponíveis",
      className: "status-indeterminate",
    };
  } catch (error) {
    console.debug(`Erro ao acessar status da prática ${practice}:`, error);
    return {
      status: "indeterminate",
      icon: "ph-question",
      label: "Dados não disponíveis",
      className: "status-indeterminate",
    };
  }
}

const api = {
  API_BASE_URL: "https://lupa-esg-api-f29b520daaca.herokuapp.com/api/v1",

  // Busca dados detalhados de uma empresa
  async fetchCompanyData(codCvm) {
    const url = `${this.API_BASE_URL}/companies/${codCvm}`;
    console.log("Tentando fetch em:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      });

      console.log("Status da resposta:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);
      return data;
    } catch (error) {
      console.error("Erro completo:", error);
      throw error;
    }
  },

  // Atualiza metadados da página
  async updatePageMetadata(data) {
    document.title = `${data.razao_social} | Lupa(ESG)`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = `Informações ESG de ${data.razao_social}. Setor: ${data.setor}. Análise de práticas ambientais, sociais e de governança baseada no Formulário de Referência.`;
      document.head.appendChild(meta);
    } else {
      metaDescription.content = `Informações ESG de ${data.razao_social}. Setor: ${data.setor}. Análise de práticas ambientais, sociais e de governança baseada no Formulário de Referência.`;
    }
  },

  updateESGReportAccordeon(esgData, dataYear) {
    const reportSection = document.querySelector("#esg-report");
    const content = reportSection.querySelector(".esg-detail-content");

    // Checa se temos os dados necessários
    if (!esgData?.divulgaInformacoesAsg) {
      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Dados não disponíveis</div>
          <p>Não foi possível recuperar as informações sobre o relatório ESG.</p>
        </div>
      `;
      return;
    }

    // Obtém o status do relatório
    const reportStatus = esgData.divulgaInformacoesAsg.divulga || false;

    if (reportStatus) {
      const reportData = esgData.divulgaInformacoesAsg;
      let contentBlocks = [];

      // Bloco do documento principal (se disponível)
      if (reportData.documento?.[0]) {
        const doc = reportData.documento[0];
        contentBlocks.push(`
          <div class="esg-content-block esg-highlight-block">
            <div class="esg-document">
              <div class="esg-document-title">
                ${doc.tipo || "Relatório ESG"}
              </div>
              ${
                doc.url
                  ? `
                <a href="${doc.url}" class="esg-document-link" target="_blank">
                  <i class="ph-bold ph-link"></i>
                  Acessar documento
                </a>
              `
                  : ""
              }
            </div>
          </div>
        `);
      }

      // Bloco de metodologias (agora usando o caminho correto)
      if (esgData.metodologias?.padroesConsiderados?.length > 0) {
        contentBlocks.push(`
          <div class="esg-content-block">
            <div class="esg-content-title">
              Padrões considerados
              ${
                dataYear < new Date().getFullYear()
                  ? createYearBadge(dataYear)
                  : ""
              }
            </div>
            <div class="esg-tag-list">
              ${esgData.metodologias.padroesConsiderados
                .map((padrao) => `<span class="esg-tag">${padrao}</span>`)
                .join("")}
            </div>
          </div>
        `);
      }

      // Bloco de resumo (sempre presente quando status é true)
      contentBlocks.push(`
        <div class="esg-content-block">
          <div class="esg-content-title">Resumo da prática</div>
          <p>${
            reportData.resumo ||
            "A empresa publica relatório ESG, mas não forneceu detalhes adicionais sobre o processo."
          }</p>
        </div>
      `);

      content.innerHTML = contentBlocks.join("");
    } else {
      // Caso onde a empresa explicitamente não adota a prática
      const justificativa =
        esgData.explicacoes && esgData.explicacoes !== "null"
          ? esgData.explicacoes
          : "A empresa não forneceu justificativa para a não publicação do relatório ESG.";

      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Justificativa</div>
          <p>${justificativa}</p>
        </div>
      `;
    }
  },

  updateESGAuditAccordeon(esgData) {
    const auditSection = document.querySelector("#esg-audit");
    const content = auditSection.querySelector(".esg-detail-content");

    // Obtém o status da auditoria
    const auditStatus = esgData.auditoria?.auditoriaRealizada || false;

    if (auditStatus) {
      // Se há auditoria, atualiza o conteúdo
      const auditData = esgData.auditoria;

      // Cria o bloco com a entidade responsável
      let entityHTML = "";
      if (auditData.entidadeResponsavel) {
        entityHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">Responsável pela auditoria</div>
            <p>${auditData.entidadeResponsavel}</p>
          </div>
        `;
      }

      // Se houver documento de auditoria
      let documentHTML = "";
      if (auditData.documento) {
        documentHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">Documentação</div>
            <div class="esg-document">
              <div class="esg-document-title">
                Parecer dos auditores independentes
              </div>
              <a href="${auditData.documento}" class="esg-document-link" target="_blank">
                <i class="ph-bold ph-link"></i>
                Acessar documento
              </a>
            </div>
          </div>
        `;
      }

      // Atualiza o resumo da prática
      const resumoHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Resumo da prática</div>
          <p>${
            auditData.resumo ||
            "A empresa realiza auditoria externa de suas informações ESG, mas não forneceu detalhes adicionais sobre o processo."
          }</p>
        </div>
      `;

      // Atualiza todo o conteúdo
      content.innerHTML = `
        ${entityHTML}
        ${documentHTML}
        ${resumoHTML}
      `;
    } else {
      // Se não há auditoria, mostra justificativa ou mensagem padrão
      const justificativa =
        esgData.explicacoes ||
        "A empresa não forneceu justificativa para a não realização de auditoria externa das informações ESG.";

      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Justificativa</div>
          <p>${justificativa}</p>
        </div>
      `;
    }
  },

  updateESGInventoryAccordeon(esgData) {
    const inventorySection = document.querySelector("#esg-inventory");
    const content = inventorySection.querySelector(".esg-detail-content");

    // Obtém o status do inventário
    const inventoryStatus =
      esgData.inventarioEmissoes?.realizaInventario || false;

    if (inventoryStatus) {
      const inventoryData = esgData.inventarioEmissoes;

      // Documento do inventário
      let documentHTML = "";
      if (inventoryData.urlInventario) {
        documentHTML = `
          <div class="esg-content-block esg-highlight-block">
            <div class="esg-document">
              <div class="esg-document-title">
                Inventário de emissões GEE
              </div>
              <a href="${inventoryData.urlInventario}" class="esg-document-link" target="_blank">
                <i class="ph-bold ph-link"></i>
                Acessar inventário completo
              </a>
            </div>
          </div>
        `;
      }

      // Escopos considerados
      let scopesHTML = "";
      if (inventoryData.escopos) {
        const escopos = inventoryData.escopos;
        scopesHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">Escopos considerados</div>
            <div class="esg-scopes">
              <div class="esg-scope" data-active="${escopos.escopo1 || false}">
                <div class="esg-scope-icon">
                  <i class="ph-bold ${
                    escopos.escopo1 ? "ph-check" : "ph-x"
                  }"></i>
                </div>
                <div class="esg-scope-info">
                  <div class="esg-scope-title">Escopo 1</div>
                  <div class="esg-scope-description">Emissões diretas</div>
                </div>
              </div>
  
              <div class="esg-scope" data-active="${escopos.escopo2 || false}">
                <div class="esg-scope-icon">
                  <i class="ph-bold ${
                    escopos.escopo2 ? "ph-check" : "ph-x"
                  }"></i>
                </div>
                <div class="esg-scope-info">
                  <div class="esg-scope-title">Escopo 2</div>
                  <div class="esg-scope-description">Emissões indiretas - energia</div>
                </div>
              </div>
  
              <div class="esg-scope" data-active="${escopos.escopo3 || false}">
                <div class="esg-scope-icon">
                  <i class="ph-bold ${
                    escopos.escopo3 ? "ph-check" : "ph-x"
                  }"></i>
                </div>
                <div class="esg-scope-info">
                  <div class="esg-scope-title">Escopo 3</div>
                  <div class="esg-scope-description">Outras emissões indiretas</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Metodologias utilizadas
      let methodsHTML = "";
      if (
        inventoryData.metodologiasUtilizadas &&
        inventoryData.metodologiasUtilizadas.length > 0
      ) {
        methodsHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">Metodologias utilizadas</div>
            <div class="esg-tag-list">
              ${inventoryData.metodologiasUtilizadas
                .map(
                  (metodologia) => `<span class="esg-tag">${metodologia}</span>`
                )
                .join("")}
            </div>
          </div>
        `;
      }

      // Resumo da prática
      const resumoHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Resumo da prática</div>
          <p>${
            inventoryData.resumo ||
            "A empresa realiza inventário de emissões de gases de efeito estufa, mas não forneceu detalhes adicionais sobre o processo."
          }</p>
        </div>
      `;

      // Atualiza todo o conteúdo
      content.innerHTML = `
        ${documentHTML}
        ${scopesHTML}
        ${methodsHTML}
        ${resumoHTML}
      `;
    } else {
      // Se não há inventário, mostra justificativa ou mensagem padrão
      const justificativa =
        esgData.explicacoes ||
        "A empresa não forneceu justificativa para a não realização do inventário de emissões.";

      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Justificativa</div>
          <p>${justificativa}</p>
        </div>
      `;
    }
  },

  updateESGMatrixAccordeon(esgData) {
    const matrixSection = document.querySelector("#esg-matrix");
    const content = matrixSection.querySelector(".esg-detail-content");

    const matrixStatus = esgData.materialidade?.divulgaMatriz || false;

    if (matrixStatus) {
      const matrixData = esgData.materialidade;

      const resumoHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Resumo da prática</div>
          <p>${
            matrixData.resumo ||
            "A empresa realiza análise de materialidade, mas não forneceu detalhes adicionais sobre o processo."
          }</p>
        </div>
      `;

      let themesHTML = "";
      if (matrixData.temasMateriais && matrixData.temasMateriais.length > 0) {
        // Função simplificada para determinar o pilar
        const getPillar = (theme) => {
          const theme_lower = theme.toLowerCase();
          if (
            theme_lower.includes("ambiente") ||
            theme_lower.includes("clima") ||
            theme_lower.includes("energia") ||
            theme_lower.includes("água") ||
            theme_lower.includes("biodiversidade") ||
            theme_lower.includes("emissões") ||
            theme_lower.includes("resíduo") ||
            theme_lower.includes("sustentável") ||
            theme_lower.includes("carbono") ||
            theme_lower.includes("poluição") ||
            theme_lower.includes("reciclagem") ||
            theme_lower.includes("conservação") ||
            theme_lower.includes("ecossistema") ||
            theme_lower.includes("desmatamento") ||
            theme_lower.includes("ambiental") ||
            theme_lower.includes("sustentáveis") ||
            theme_lower.includes("renováveis") ||
            theme_lower.includes("climática") ||
            theme_lower.includes("sustentabilidade") ||
            theme_lower.includes("qualidade do ar") ||
            theme_lower.includes("hídrico") ||
            theme_lower.includes("naturais")
          ) {
            return "E";
          } else if (
            theme_lower.includes("social") ||
            theme_lower.includes("diversidade") ||
            theme_lower.includes("humano") ||
            theme_lower.includes("comunidade") ||
            theme_lower.includes("cliente") ||
            theme_lower.includes("talento") ||
            theme_lower.includes("social") ||
            theme_lower.includes("diversidade") ||
            theme_lower.includes("trabalhador") ||
            theme_lower.includes("comunidade") ||
            theme_lower.includes("talento") ||
            theme_lower.includes("equidade") ||
            theme_lower.includes("inclusão")
          ) {
            return "S";
          } else {
            return "G";
          }
        };

        // Função simplificada que retorna ícone baseado apenas no pilar
        const getIconByPillar = (pillar) => {
          const icons = {
            E: "ph-leaf",
            S: "ph-users-three",
            G: "ph-scales",
          };
          return icons[pillar];
        };

        themesHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">Temas materiais</div>
            <div class="esg-material-themes">
              ${matrixData.temasMateriais
                .map((tema) => {
                  const pillar = getPillar(tema);
                  return `
                      <div class="esg-material-theme">
                        <div class="esg-theme-icon" data-pillar="${pillar}">
                          <i class="ph-bold ${getIconByPillar(pillar)}"></i>
                        </div>
                        <div class="esg-theme-content">
                          <div class="esg-theme-title">${tema}</div>
                        </div>
                      </div>
                    `;
                })
                .join("")}
            </div>
          </div>
        `;
      }

      content.innerHTML = `
        ${resumoHTML}
        ${themesHTML}
      `;
    } else {
      const justificativa =
        esgData.explicacoes ||
        "A empresa não forneceu justificativa para a não realização da análise de materialidade.";

      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Justificativa</div>
          <p>${justificativa}</p>
        </div>
      `;
    }
  },

  updateESGODSAccordeon(esgData) {
    const odsSection = document.querySelector("#esg-ods");
    const content = odsSection.querySelector(".esg-detail-content");

    const odsStatus =
      esgData.objetivosDesenvolvimentoSustentavel?.consideraODS || false;

    if (odsStatus) {
      const odsData = esgData.objetivosDesenvolvimentoSustentavel;

      // Mapa de ODS com títulos
      const odsMap = {
        1: "Erradicação da pobreza",
        2: "Fome zero",
        3: "Boa saúde e bem-estar",
        4: "Educação de qualidade",
        5: "Igualdade de gênero",
        6: "Água limpa e saneamento",
        7: "Energia acessível e limpa",
        8: "Trabalho decente e crescimento econômico",
        9: "Indústria, inovação e Infraestrutura",
        10: "Redução das desigualdades",
        11: "Cidades e comunidades sustentáveis",
        12: "Consumo e produção responsáveis",
        13: "Ação contra a mudança global do clima",
        14: "Vida na água",
        15: "Vida terrestre",
        16: "Paz, justiça e instituições eficazes",
        17: "Parcerias e meios de implementação",
      };

      const resumoHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Resumo da prática</div>
          <p>${
            odsData.resumo ||
            "A empresa considera os ODS em sua estratégia de sustentabilidade, mas não forneceu detalhes adicionais sobre o processo."
          }</p>
        </div>
      `;

      let odsHTML = "";
      if (odsData.objetivosMateriais && odsData.objetivosMateriais.length > 0) {
        // Ordenamos os ODS antes de gerar o HTML
        const sortedODS = [...odsData.objetivosMateriais].sort((a, b) => a - b);

        odsHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">ODS priorizados</div>
            <div class="esg-sdg-grid">
              ${sortedODS
                .map(
                  (ods) => `
                <div class="esg-sdg-item">
                  <img
                    src="/assets/sdg_icons/SDG-${ods}.svg"
                    alt="ODS ${ods}: ${odsMap[ods]}"
                    class="esg-sdg-icon"
                    title="ODS ${ods}: ${odsMap[ods]}"
                  />
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      content.innerHTML = `
        ${resumoHTML}
        ${odsHTML}
      `;
    } else {
      const justificativa =
        esgData.explicacoes ||
        "A empresa não forneceu justificativa para a não consideração dos ODS.";

      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Justificativa</div>
          <p>${justificativa}</p>
        </div>
      `;
    }
  },

  updateESGTCFDAccordeon(esgData) {
    const tcfdSection = document.querySelector("#esg-tcfd");
    const content = tcfdSection.querySelector(".esg-detail-content");

    // Obtém o status do TCFD
    const tcfdStatus = esgData.recomendacoesTCFD?.consideraTCFD || false;

    if (tcfdStatus) {
      // Se considera TCFD, mostra o resumo
      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Resumo da prática</div>
          <p>${
            esgData.recomendacoesTCFD.resumo ||
            "A empresa segue as recomendações TCFD, mas não forneceu detalhes adicionais sobre o processo."
          }</p>
        </div>
      `;
    } else {
      // Se não considera TCFD, usa o resumo específico do TCFD se existir,
      // caso contrário usa a explicação genérica ou mensagem padrão
      const justificativa =
        esgData.recomendacoesTCFD && esgData.recomendacoesTCFD.resumo
          ? esgData.recomendacoesTCFD.resumo
          : esgData.explicacoes ||
            "A empresa não forneceu justificativa para a não adoção das recomendações TCFD.";

      content.innerHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Justificativa</div>
          <p>${justificativa}</p>
        </div>
      `;
    }
  },

  updateESGAccordeons(data) {
    // Obtém os dados ESG mais recentes disponíveis
    const esgData = getLatestAvailableData(data, [
      "dados_qualitativos",
      "conteudo",
      "info_asg",
    ]);

    const accordeons = document.querySelectorAll(".esg-detail");

    // Se não encontrou nenhum dado ESG
    if (!esgData) {
      accordeons.forEach((accordeon) => {
        const content = accordeon.querySelector(".esg-detail-content");
        const header = accordeon.querySelector(".esg-detail-header");

        // Atualiza o status no header
        if (header && !header.querySelector(".esg-status-badge")) {
          header.insertAdjacentHTML(
            "beforeend",
            `
            <div class="esg-status-badge status-indeterminate">
              <i class="ph-bold ph-question"></i>
              <span>Dados não disponíveis</span>
            </div>
          `
          );
        }

        // Atualiza o conteúdo
        if (content) {
          content.innerHTML = `
            <div class="esg-content-block">
              <div class="esg-content-title">Informação indisponível</div>
              <p>Não foi possível recuperar os dados desta seção.</p>
            </div>
          `;
        }
      });
      return;
    }

    // Atualiza cada acordeon individualmente
    accordeons.forEach((accordeon) => {
      const id = accordeon.id;
      const header = accordeon.querySelector(".esg-detail-header");
      const content = accordeon.querySelector(".esg-detail-content");

      // Obtém o status da prática
      const status = getESGPracticeStatus(esgData.data, id);

      // Atualiza o badge de status no header
      const existingBadge = header.querySelector(".esg-status-badge");
      const statusBadge = `
        <div class="esg-status-badge ${status.className}">
          <i class="ph-bold ${status.icon}"></i>
          <span>${status.label}</span>
          ${esgData.needsYearBadge ? createYearBadge(esgData.year) : ""}
        </div>
      `;

      if (existingBadge) {
        existingBadge.outerHTML = statusBadge;
      } else {
        header.insertAdjacentHTML("beforeend", statusBadge);
      }

      // Atualiza o conteúdo baseado no status
      if (status.status === "indeterminate") {
        content.innerHTML = `
          <div class="esg-content-block">
            <div class="esg-content-title">Informação indisponível</div>
            <p>Os dados desta prática não estão disponíveis no momento.</p>
          </div>
        `;
        return;
      }

      // Atualiza o conteúdo específico de cada acordeon
      switch (id) {
        case "esg-report":
          this.updateESGReportAccordeon(esgData.data, esgData.year);
          break;
        case "esg-audit":
          this.updateESGAuditAccordeon(esgData.data);
          break;
        case "esg-inventory":
          this.updateESGInventoryAccordeon(esgData.data);
          break;
        case "esg-matrix":
          this.updateESGMatrixAccordeon(esgData.data);
          break;
        case "esg-ods":
          this.updateESGODSAccordeon(esgData.data);
          break;
        case "esg-tcfd":
          this.updateESGTCFDAccordeon(esgData.data);
          break;
      }
    });
  },

  // Função para a seção "Quem é"
  updateWhoIsSection(data) {
    const resumoData = getLatestAvailableData(data, [
      "dados_qualitativos",
      "conteudo",
      "atividades",
      "resumo_geral",
    ]);

    const whoIsSection = document.querySelector(
      ".content-section:nth-child(1) .text-block"
    );

    if (resumoData) {
      whoIsSection.innerHTML = `
        <p>${resumoData.data}</p>
        ${resumoData.needsYearBadge ? createYearBadge(resumoData.year) : ""}
      `;
    } else {
      whoIsSection.innerHTML = `<p>Resumo não disponível.</p>`;
    }
  },

  // Função para a seção de atividades
  updateActivitiesSection(data) {
    const activitiesData = getLatestAvailableData(data, [
      "dados_qualitativos",
      "conteudo",
      "atividades",
      "atividades_principais",
    ]);

    const activitiesGrid = document.querySelector(".activities-grid");

    if (activitiesData && activitiesData.data.length > 0) {
      activitiesGrid.innerHTML = `
        ${
          activitiesData.needsYearBadge
            ? createYearBadge(activitiesData.year)
            : ""
        }
        <div class="activities-list">
          ${activitiesData.data
            .map(
              (activity) => `
                <div class="activity-card">
                  <div class="activity-icon">
                    <i class="ph ph-gear-fine"></i>
                  </div>
                  <h4 class="activity-title">${activity.descricao}</h4>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    } else {
      activitiesGrid.innerHTML = `
        <div class="activity-card">
          <div class="activity-icon">
            <i class="ph ph-info"></i>
          </div>
          <h4 class="activity-title">Atividades não disponíveis</h4>
        </div>
      `;
    }
  },

  // Função para a seção de histórico
  updateHistorySection(data) {
    const historicData = getLatestAvailableData(data, [
      "dados_qualitativos",
      "conteudo",
      "historico",
      "marcos_historicos",
    ]);

    const historicSection = document.querySelector(
      ".content-section:nth-child(3) .text-block"
    );

    if (historicData && historicData.data.length > 0) {
      historicSection.innerHTML = `
        <div class="history-header">
          ${
            historicData.needsYearBadge
              ? createYearBadge(historicData.year)
              : ""
          }
        </div>
        <ul class="history-list">
          ${historicData.data
            .map(
              (item) => `
              <li>
                <i class="ph-bold ph-calendar-check"></i>
                <span>${item}</span>
              </li>
            `
            )
            .join("")}
        </ul>
      `;
    } else {
      historicSection.innerHTML = `<p>Histórico não disponível.</p>`;
    }
  },

  // Função para as informações de fundação
  updateFoundationInfo(data) {
    const foundationData = getLatestAvailableData(data, [
      "dados_qualitativos",
      "conteudo",
      "historico",
      "fundacao",
    ]);

    const infoBadges = document.querySelector(".info-badges");

    if (
      foundationData &&
      foundationData.data &&
      (foundationData.data.data || foundationData.data.local)
    ) {
      const badges = [];
      const yearBadge =
        foundationData.year <
        Math.max(...Object.keys(data.dados_esg).map(Number))
          ? createYearBadge(foundationData.year)
          : "";

      if (foundationData.data.data) {
        badges.push(`
          <span class="info-badge">
            <i class="ph-bold ph-calendar-check"></i>
            Fundação: ${foundationData.data.data}
          </span>
        `);
      }

      if (foundationData.data.local) {
        badges.push(`
          <span class="info-badge">
            <i class="fa-solid fa-location-dot"></i>
            ${foundationData.data.local}
          </span>
        `);
      }

      if (badges.length > 0) {
        infoBadges.innerHTML = `
          ${badges.join("")}
          ${yearBadge}
        `;
        infoBadges.style.display = "flex";
      } else {
        infoBadges.style.display = "none";
      }
    } else {
      infoBadges.style.display = "none";
    }
  },

  updateDiversityHighlights(data) {
    console.log("Iniciando updateDiversityHighlights com dados:", data);

    const latestYear = Math.max(...Object.keys(data.dados_esg).map(Number));
    console.log("Ano mais recente:", latestYear);

    const latestData = data.dados_esg[latestYear];
    console.log("Dados mais recentes:", latestData);

    const diversityData = latestData.dados_quantitativos.conteudo;
    console.log("Dados de diversidade:", diversityData);

    // Calcula total dos órgãos administrativos
    const adminTotal = diversityData.diversidade_admin.diversidade.reduce(
      (sum, org) => {
        if (!org.genero) return sum;
        return sum + sumObjectValues(org.genero);
      },
      0
    );

    // Soma totais de liderança e não-liderança
    const leadershipTotal = sumObjectValues(
      diversityData.recursos_humanos.diversidade.genero.lideranca
    );
    const nonLeadershipTotal = sumObjectValues(
      diversityData.recursos_humanos.diversidade.genero.nao_lideranca
    );

    // Total geral
    const totalEmployees = adminTotal + leadershipTotal + nonLeadershipTotal;

    // Atualiza o card de colaboradores
    const employeesCard = document.querySelector(".diversity-card:first-child");
    if (employeesCard) {
      if (totalEmployees > 0) {
        employeesCard.querySelector(".diversity-card-value").textContent =
          totalEmployees.toLocaleString("pt-BR");

        const breakdownHTML = `
          <div class="breakdown-item">
            <span class="breakdown-label">Órgãos administrativos</span>
            <span class="breakdown-value">${adminTotal.toLocaleString(
              "pt-BR"
            )}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Liderança</span>
            <span class="breakdown-value">${leadershipTotal.toLocaleString(
              "pt-BR"
            )}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Demais posições</span>
            <span class="breakdown-value">${nonLeadershipTotal.toLocaleString(
              "pt-BR"
            )}</span>
          </div>
        `;

        employeesCard.querySelector(".diversity-card-breakdown").innerHTML =
          breakdownHTML;
      } else {
        employeesCard.querySelector(".diversity-card-value").textContent = "-";
        employeesCard.querySelector(".diversity-card-breakdown").innerHTML = `
          <div class="diversity-card-message">
            Dados de colaboradores não disponíveis
          </div>
        `;
      }
    }

    // Atualiza o card de remuneração
    const remunerationData = diversityData.recursos_humanos.remuneracao;
    const remunerationCard = document.querySelector(
      ".diversity-card:nth-child(2)"
    );

    if (remunerationCard) {
      if (isValidRemunerationData(remunerationData)) {
        // Dados válidos - mostra as informações completas
        const cardHTML = `
          <div class="diversity-card-icon">
            <i class="ph-bold ph-currency-circle-dollar"></i>
          </div>
          <div class="diversity-card-content">
            <div class="diversity-card-value">${remunerationData.razao.toFixed(
              2
            )}x</div>
            <div class="diversity-card-label">
              É a razão entre a maior remuneração individual e a mediana da companhia
            </div>
            <div class="diversity-card-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">Maior remuneração</span>
                <span class="breakdown-value">${formatCurrency(
                  remunerationData.maior
                )}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Mediana (exclui a maior)</span>
                <span class="breakdown-value">${formatCurrency(
                  remunerationData.mediana
                )}</span>
              </div>
            </div>
          </div>
        `;

        remunerationCard.innerHTML = cardHTML;
      } else {
        // Dados inválidos - mostra apenas o ícone e a mensagem
        const cardHTML = `
                <div class="diversity-card-icon">
            <i class="ph-bold ph-currency-circle-dollar"></i>
          </div>
          <div class="diversity-card-content">
            <div class="diversity-card-value">-</div>
            <div class="diversity-card-label">Dados de remuneração não fornecidos ou incompletos</div>
            </div>
          </div>
        `;

        remunerationCard.innerHTML = cardHTML;
      }
    }
    // Atualiza os gráficos de gênero
    const transformedGenderData = transformGenderData(diversityData);
    try {
      createGenderChart(transformedGenderData.admin, "#admin-gender-chart");
      createGenderChart(
        transformedGenderData.leadership,
        "#leadership-gender-chart"
      );
      createGenderChart(transformedGenderData.others, "#others-gender-chart");
    } catch (error) {
      console.error("Erro ao criar gráficos:", error);
    }

    // Atualiza os gráficos de evolução temporal de gênero
    const genderTrendData = transformGenderTrendData(data);
    if (genderTrendData) {
      console.log("Iniciando visualização de tendência de gênero");
      document.querySelector(".diversity-trend").style.display = "block";
      try {
        window.genderTrendViz = new GenderTrendVisualization(genderTrendData);
        console.log("Visualização de tendência de gênero criada com sucesso");
      } catch (error) {
        console.error(
          "Erro ao criar visualização de tendência de gênero:",
          error
        );
      }
    } else {
      console.log("Sem dados suficientes para tendência de gênero");
      document.querySelector(".diversity-trend").style.display = "none";
    }

    // Atualiza os gráficos de raça
    const transformedRaceData = transformRaceData(diversityData);
    try {
      createUnitChart(transformedRaceData.admin, "#admin-race-chart");
      createUnitChart(transformedRaceData.leadership, "#leadership-race-chart");
      createUnitChart(transformedRaceData.others, "#others-race-chart");
    } catch (error) {
      console.error("Erro ao criar gráficos de raça:", error);
    }

    // Atualiza os gráficos de evolução temporal de raça
    const raceTrendData = transformRaceTrendData(data);
    console.log("Dados processados para tendência racial:", raceTrendData);

    if (raceTrendData) {
      console.log("Iniciando visualização de tendência racial");
      document.querySelector(".diversity-race-trend").style.display = "block";
      try {
        window.raceTrendViz = new RaceTrendVisualization(raceTrendData);
        console.log("Visualização de tendência racial criada com sucesso");
      } catch (error) {
        console.error("Erro ao criar visualização de tendência racial:", error);
      }
    } else {
      console.log("Sem dados suficientes para tendência racial");
      document.querySelector(".diversity-race-trend").style.display = "none";
    }
  },

  // Atualiza cabeçalho da empresa
  async updateCompanyHeader(codCvm) {
    console.log("Iniciando updateCompanyHeader para codCvm:", codCvm);
    const heroContent = document.querySelector(".hero__content");
    heroContent.classList.add("loading");

    try {
      const data = await this.fetchCompanyData(codCvm);
      console.log("Dados recebidos em updateCompanyHeader:", data);

      // Validações iniciais
      if (!data) {
        throw new Error("Dados não encontrados");
      }

      // Atualiza título e metadados básicos
      document.querySelector(".hero__title").textContent =
        data.razao_social || "Nome não disponível";

      // Atualiza os metadados (badges)
      const metadata = document.querySelector(".company-metadata");
      metadata.innerHTML = `
        <div class="metadata-item">
          <span class="metadata-label">Código CVM:</span>
          <span class="metadata-value">${data.cod_cvm}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">CNPJ:</span>
          <span class="metadata-value">${data.cnpj}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Data de referência:</span>
          <span class="metadata-value">${new Date(
            data.documento.dt_referencia
          ).toLocaleDateString("pt-BR")}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Data de recebimento:</span>
          <span class="metadata-value">${new Date(
            data.documento.dt_recebimento
          ).toLocaleDateString("pt-BR")}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Versão:</span>
          <span class="metadata-value">${data.documento.versao}</span>
        </div>
      `;

      // Atualiza badges setoriais
      document.querySelector(".badge--sector").innerHTML = `
        <i class="fa-solid fa-industry"></i>
        <strong>Setor:</strong> ${data.setor || "Não informado"}
      `;
      document.querySelector(".badge--subsector").innerHTML = `
        <i class="fa-solid fa-tags"></i>
        <strong>Subsetor:</strong> ${data.subsetor || "Não informado"}
      `;
      document.querySelector(".badge--segment").innerHTML = `
        <i class="fa-solid fa-tag"></i>
        <strong>Segmento:</strong> ${data.segmento || "Não informado"}
      `;

      // Obter o ano mais recente dos dados com validação
      if (!data.dados_esg || Object.keys(data.dados_esg).length === 0) {
        throw new Error("Dados ESG não encontrados");
      }

      const latestYear = Math.max(...Object.keys(data.dados_esg).map(Number));
      const latestData = data.dados_esg[latestYear];

      if (!latestData || !latestData.dados_qualitativos) {
        throw new Error("Dados qualitativos não encontrados");
      }

      // Atualiza seção "Quem é" com validação
      const whoIsSection = document.querySelector(
        ".content-section:nth-child(1) .text-block"
      );
      const resumoAtividades =
        latestData.dados_qualitativos.conteudo?.atividades?.resumo_geral;
      whoIsSection.innerHTML = resumoAtividades
        ? `<p>${resumoAtividades}</p>`
        : `<p>Resumo não disponível.</p>`;

      // Atualiza segmentos de atuação com validação
      const activitiesGrid = document.querySelector(".activities-grid");
      const atividades =
        latestData.dados_qualitativos.conteudo?.atividades
          ?.atividades_principais || [];

      if (atividades.length > 0) {
        activitiesGrid.innerHTML = atividades
          .map(
            (activity) => `
                  <div class="activity-card">
                      <div class="activity-icon">
                          <i class="ph ph-gear-fine"></i>
                      </div>
                      <h4 class="activity-title">${activity.descricao}</h4>
                  </div>
              `
          )
          .join("");
      } else {
        activitiesGrid.innerHTML = `
              <div class="activity-card">
                  <div class="activity-icon">
                      <i class="ph ph-info"></i>
                  </div>
                  <h4 class="activity-title">Atividades não disponíveis</h4>
              </div>
          `;
      }

      // Atualiza histórico com validação
      const historicSection = document.querySelector(
        ".content-section:nth-child(3) .text-block"
      );
      const historicos =
        latestData.dados_qualitativos.conteudo?.historico?.marcos_historicos ||
        [];

      historicSection.innerHTML =
        historicos.length > 0
          ? `
              <ul class="history-list">
                  ${historicos
                    .map(
                      (item) => `
                      <li>
                          <i class="ph-bold ph-calendar-check"></i>
                          <span>${item}</span>
                      </li>
                  `
                    )
                    .join("")}
              </ul>
          `
          : `<p>Histórico não disponível.</p>`;

      // Atualiza informações de fundação com validação
      const infoBadges = document.querySelector(".info-badges");
      const fundacao =
        latestData.dados_qualitativos.conteudo?.historico?.fundacao;

      if (fundacao && (fundacao.data || fundacao.local)) {
        const badges = [];
        if (fundacao.data) {
          badges.push(`
                  <span class="info-badge">
                      <i class="fa-regular fa-calendar"></i>
                      Fundação: ${fundacao.data}
                  </span>
              `);
        }
        if (fundacao.local) {
          badges.push(`
                  <span class="info-badge">
                      <i class="fa-solid fa-location-dot"></i>
                      ${fundacao.local}
                  </span>
              `);
        }
        infoBadges.innerHTML = badges.join("");
        infoBadges.style.display = "flex";
      } else {
        infoBadges.style.display = "none";
      }

      // Resto do código com validações similares...
      this.updatePageMetadata(data);
      this.updateESGAccordeons(data);
      this.updateDiversityHighlights(data);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      // Mostra mensagem amigável para o usuário
      heroContent.innerHTML = `
          <div class="error-message">
              <i class="ph ph-warning"></i>
              <p>Não foi possível carregar os dados completos desta empresa.</p>
              <small>Por favor, tente novamente mais tarde.</small>
          </div>
      `;
    } finally {
      heroContent.classList.remove("loading");
    }
  },

  // Novas funções de busca
  async searchCompanies(query = "", params = null) {
    try {
      let url = `${this.API_BASE_URL}/companies/search`;
      const urlParams = new URLSearchParams();

      // Adiciona query apenas se não estiver vazia
      if (query && query.trim()) {
        urlParams.append("q", query.trim());
      }

      // Adiciona outros parâmetros se existirem
      if (params) {
        for (const [key, value] of params.entries()) {
          urlParams.append(key, value);
        }
      }

      // Adiciona os parâmetros à URL apenas se houver algum
      const queryString = urlParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log("Fazendo busca em:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);
      return data;
    } catch (error) {
      console.error("Erro na busca:", error);
      throw error;
    }
  },

  initializeSearch() {
    console.log("Inicializando busca...");
    const searchInput = document.querySelector("#company-search");
    const searchResults = document.querySelector("#search-results");

    if (!searchInput || !searchResults) {
      console.error("Elementos de busca não encontrados");
      return;
    }
    console.log("Elementos de busca encontrados");

    // Função para renderizar resultados
    const renderResults = (companies) => {
      console.log("Renderizando resultados:", companies);

      const htmlContent = companies.length
        ? companies
            .map(
              (company) => `
            <div class="search-result-item" data-cod-cvm="${company.cod_cvm}">
              <i class="ph ph-buildings"></i>
              <span class="company-name">${company.razao_social}</span>
            </div>
          `
            )
            .join("")
        : `
            <div class="search-no-results">
              <i class="ph ph-magnifying-glass"></i>
              <span>Nenhuma empresa encontrada</span>
            </div>
          `;

      searchResults.innerHTML = htmlContent;

      // Adiciona classe para mostrar os resultados com animação
      requestAnimationFrame(() => {
        searchResults.classList.add("search-results--active");
      });
    };

    // Função para lidar com a busca
    const handleSearch = debounce(async (query) => {
      console.log("Handling search for:", query);
      if (!query || query.length < 2) {
        searchResults.classList.remove("search-results--active");
        searchResults.innerHTML = "";
        return;
      }

      try {
        const companies = await this.searchCompanies(query);
        console.log("Empresas encontradas:", companies);
        renderResults(companies);
      } catch (error) {
        console.error("Erro na busca:", error);
        searchResults.innerHTML = `
          <div class="search-error">
            <i class="ph ph-warning"></i>
            <span>Erro ao realizar a busca</span>
          </div>
        `;
      }
    }, 300);

    // Event listeners com bind correto do this
    const boundHandleSearch = handleSearch.bind(this);
    searchInput.addEventListener("input", (e) =>
      boundHandleSearch(e.target.value.trim())
    );

    // Fecha resultados ao clicar fora
    document.addEventListener("click", (e) => {
      if (
        !searchInput.contains(e.target) &&
        !searchResults.contains(e.target)
      ) {
        searchResults.classList.remove("search-results--active");
        searchResults.innerHTML = "";
      }
    });

    // Lidar com clique nos resultados
    searchResults.addEventListener("click", (e) => {
      const resultItem = e.target.closest(".search-result-item");
      if (resultItem) {
        const codCvm = resultItem.dataset.codCvm;
        window.location.href = `/empresa.html?cod_cvm=${codCvm}`;
      }
    });

    console.log("Busca inicializada com sucesso");
  },

  // Adicionar ao objeto api em api.js
  async fetchSectors() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/companies/sectors`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar setores:", error);
      throw error;
    }
  },

  initializeFilters() {
    console.log("Iniciando configuração dos filtros");

    // Elementos DOM
    const setorSelect = document.querySelector("#setor");
    const subsetorSelect = document.querySelector("#subsetor");
    const segmentoSelect = document.querySelector("#segmento");
    const filterPills = document.querySelectorAll(".filter-pill");
    const exploreButton = document.querySelector("#explore-button");

    // Adicione esta função dentro de initializeFilters
    function clearAllFilters() {
      // Limpa os selects
      setorSelect.value = "";
      subsetorSelect.value = "";
      segmentoSelect.value = "";

      // Desabilita os selects dependentes
      subsetorSelect.disabled = true;
      segmentoSelect.disabled = true;

      // Remove classe active de todas as pills
      filterPills.forEach((pill) => {
        pill.classList.remove("active");
      });

      // Limpa o Set de práticas
      selectedFilters.setor = "";
      selectedFilters.subsetor = "";
      selectedFilters.segmento = "";
      selectedFilters.praticas.clear();

      // Limpa os resultados
      const resultsGrid = document.querySelector(".results-grid");
      resultsGrid.innerHTML = "";
      document.querySelector(".results-count").textContent = "0";
      updateClearButtonVisibility();
    }

    function updateClearButtonVisibility() {
      const clearButton = document.querySelector("#clear-filters-button");
      if (!clearButton) return;

      // Verifica se há algum filtro selecionado
      const hasFilters =
        selectedFilters.setor !== "" ||
        selectedFilters.subsetor !== "" ||
        selectedFilters.segmento !== "" ||
        selectedFilters.praticas.size > 0;

      // Atualiza visibilidade do botão
      clearButton.classList.toggle("visible", hasFilters);
    }

    if (!exploreButton) {
      console.error("Botão explorar não encontrado!");
      return;
    }

    console.log("Elementos dos filtros encontrados");

    // Estado dos filtros
    let sectorsData = null;
    const selectedFilters = {
      setor: "",
      subsetor: "",
      segmento: "",
      praticas: new Set(),
    };

    // Carregar dados dos setores
    this.fetchSectors()
      .then((data) => {
        sectorsData = data;
        updateSetorSelect();
      })
      .catch((error) => console.error("Erro ao carregar setores:", error));

    // Atualiza select de setores
    function updateSetorSelect() {
      setorSelect.innerHTML = '<option value="">Todos os setores</option>';
      sectorsData.forEach((item) => {
        if (item.setor) {
          setorSelect.innerHTML += `<option value="${item.setor}">${item.setor}</option>`;
        }
      });
    }

    // Atualiza select de subsetores
    function updateSubsetorSelect(setor) {
      subsetorSelect.innerHTML =
        '<option value="">Todos os subsetores</option>';
      subsetorSelect.disabled = !setor;

      if (setor) {
        const setorData = sectorsData.find((item) => item.setor === setor);
        if (setorData) {
          setorData.subsetores
            .filter((sub) => sub.subsetor)
            .forEach((sub) => {
              subsetorSelect.innerHTML += `<option value="${sub.subsetor}">${sub.subsetor}</option>`;
            });
        }
      }

      // Reset segmento
      segmentoSelect.innerHTML =
        '<option value="">Selecione um subsetor primeiro</option>';
      segmentoSelect.disabled = true;
    }

    // Atualiza select de segmentos
    function updateSegmentoSelect(setor, subsetor) {
      segmentoSelect.innerHTML = '<option value="">Todos os segmentos</option>';
      segmentoSelect.disabled = !subsetor;

      if (setor && subsetor) {
        const setorData = sectorsData.find((item) => item.setor === setor);
        if (setorData) {
          const subsetorData = setorData.subsetores.find(
            (sub) => sub.subsetor === subsetor
          );
          if (subsetorData && subsetorData.segmentos) {
            segmentoSelect.innerHTML += `<option value="${subsetorData.segmentos}">${subsetorData.segmentos}</option>`;
          }
        }
      }
    }

    // Event Listeners
    const clearFiltersButton = document.querySelector("#clear-filters-button");
    if (clearFiltersButton) {
      clearFiltersButton.addEventListener("click", clearAllFilters);
    }

    setorSelect.addEventListener("change", (e) => {
      selectedFilters.setor = e.target.value;
      selectedFilters.subsetor = "";
      selectedFilters.segmento = "";
      updateSubsetorSelect(e.target.value);
      updateClearButtonVisibility();
    });

    subsetorSelect.addEventListener("change", (e) => {
      selectedFilters.subsetor = e.target.value;
      selectedFilters.segmento = "";
      updateSegmentoSelect(selectedFilters.setor, e.target.value);
      updateClearButtonVisibility();
    });

    segmentoSelect.addEventListener("change", (e) => {
      selectedFilters.segmento = e.target.value;
      updateClearButtonVisibility();
    });

    // Toggle de práticas ESG
    filterPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const pratica = pill.dataset.filter;
        if (selectedFilters.praticas.has(pratica)) {
          selectedFilters.praticas.delete(pratica);
          pill.classList.remove("active");
        } else {
          selectedFilters.praticas.add(pratica);
          pill.classList.add("active");
        }
        updateClearButtonVisibility();
      });
    });

    // Botão de explorar
    exploreButton.addEventListener("click", async () => {
      try {
        exploreButton.classList.add("loading");
        exploreButton.disabled = true;

        const params = new URLSearchParams();

        if (selectedFilters.setor)
          params.append("setor", selectedFilters.setor);
        if (selectedFilters.subsetor)
          params.append("subsetor", selectedFilters.subsetor);
        if (selectedFilters.segmento)
          params.append("segmento", selectedFilters.segmento);
        selectedFilters.praticas.forEach((pratica) => {
          params.append("praticas_esg", pratica);
        });

        console.log("Parâmetros da busca:", params.toString());

        const companies = await this.searchCompanies("", params);
        this.renderSearchResults(companies);

        // Após renderizar os resultados, rola suavemente até a seção
        const resultsSection = document.querySelector(".results-section");
        if (resultsSection) {
          resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar empresas:", error);
        document.querySelector(".results-grid").innerHTML = `
        <div class="search-error">
          <i class="ph-bold ph-warning"></i>
          <p>Ocorreu um erro ao buscar as empresas. Tente novamente.</p>
        </div>
      `;
      } finally {
        exploreButton.classList.remove("loading");
        exploreButton.disabled = false;
      }
    });
  },

  renderSearchResults(companies) {
    const resultsGrid = document.querySelector(".results-grid");
    const resultsCount = document.querySelector(".results-count");

    // Atualiza o contador
    resultsCount.textContent = companies.length;

    // Se não houver resultados
    if (companies.length === 0) {
      resultsGrid.innerHTML = `
        <div class="no-results">
          <i class="ph-bold ph-magnifying-glass"></i>
          <p>Nenhuma empresa encontrada com os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    // Renderiza os cards das empresas
    resultsGrid.innerHTML = companies
      .map(
        (company) => `
      <div class="company-card">
        <div class="company-card__header">
          <h3 class="company-card__title">${company.razao_social}</h3>
          ${
            company.setor
              ? `
            <div class="company-card__sector">
              <i class="ph-bold ph-buildings"></i>
              ${company.setor}
            </div>
          `
              : ""
          }
        </div>
        
        <div class="company-card__practices">
          ${
            company.praticas_esg
              ? `
            <div class="practices-grid">
              ${Object.entries(company.praticas_esg)
                .map(
                  ([pratica, status]) => `
                <div class="practice-badge ${
                  status ? "active" : ""
                }" title="${getPraticaLabel(pratica)}">
                  <i class="ph-bold ${getPraticaIcon(pratica)}"></i>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
        
        <a href="/empresa.html?cod_cvm=${
          company.cod_cvm
        }" class="company-card__link">
          Ver detalhes
          <i class="ph-bold ph-arrow-right"></i>
        </a>
      </div>
    `
      )
      .join("");
  },

  async fetchHomeStats() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/companies/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const { dados } = await response.json();

      // Função auxiliar para animar números
      function animateValue(element, start, end, duration) {
        const startTimestamp = performance.now();
        const isPercentage = element.textContent.includes("%");

        const animate = (currentTimestamp) => {
          const elapsed = currentTimestamp - startTimestamp;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function para movimento mais suave
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(start + (end - start) * easeOutQuart);

          element.textContent = isPercentage
            ? `${current}%`
            : current.toLocaleString("pt-BR");

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }

      // Atualiza os elementos com animação
      const elements = {
        empresasTotal: document.querySelector(
          ".hero-stat-group--esg .hero-stat-item:nth-child(1) .hero-stat-value"
        ),
        empresasLabel: document.querySelector(
          ".hero-stat-group--esg .hero-stat-item:nth-child(1) .hero-stat-label"
        ),

        relatorioTotal: document.querySelector(
          ".hero-stat-group--esg .hero-stat-item:nth-child(2) .hero-stat-value"
        ),
        relatorioLabel: document.querySelector(
          ".hero-stat-group--esg .hero-stat-item:nth-child(2) .hero-stat-label"
        ),

        geeTotal: document.querySelector(
          ".hero-stat-group--esg .hero-stat-item:nth-child(3) .hero-stat-value"
        ),
        geeLabel: document.querySelector(
          ".hero-stat-group--esg .hero-stat-item:nth-child(3) .hero-stat-label"
        ),

        generoValue: document.querySelector(
          ".hero-stat-group--diversity .hero-stat-item:nth-child(1) .hero-stat-value"
        ),
        generoLabel: document.querySelector(
          ".hero-stat-group--diversity .hero-stat-item:nth-child(1) .hero-stat-label"
        ),

        racaValue: document.querySelector(
          ".hero-stat-group--diversity .hero-stat-item:nth-child(2) .hero-stat-value"
        ),
        racaLabel: document.querySelector(
          ".hero-stat-group--diversity .hero-stat-item:nth-child(2) .hero-stat-label"
        ),
      };

      // Atualiza estatísticas ESG
      if (elements.empresasTotal) {
        elements.empresasLabel.innerHTML = `
          empresas analisadas
        `;
        animateValue(elements.empresasTotal, 0, dados.empresas.total, 1500);
      }

      if (elements.relatorioTotal) {
        elements.relatorioLabel.innerHTML = `
          <span class="hero-stat-absolute">${dados.praticas_esg.relatorio.total.toLocaleString(
            "pt-BR"
          )} empresas</span>
          publicam relatório ESG
        `;
        animateValue(
          elements.relatorioTotal,
          0,
          Math.round(dados.praticas_esg.relatorio.percentual),
          1500
        );
      }

      if (elements.geeTotal) {
        elements.geeLabel.innerHTML = `
          <span class="hero-stat-absolute">${dados.praticas_esg.inventario_gee.total.toLocaleString(
            "pt-BR"
          )} empresas</span>
          divulgam inventário GEE
        `;
        animateValue(
          elements.geeTotal,
          0,
          Math.round(dados.praticas_esg.inventario_gee.percentual),
          1500
        );
      }

      // Atualiza estatísticas de diversidade
      if (elements.generoValue) {
        animateValue(
          elements.generoValue,
          0,
          Math.round(dados.diversidade.representatividade_feminina.percentual),
          1500
        );
      }

      if (elements.racaValue) {
        animateValue(
          elements.racaValue,
          0,
          Math.round(dados.diversidade.representatividade_racial.percentual),
          1500
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  },
};

// Exporta o objeto api para uso global
window.api = api;
