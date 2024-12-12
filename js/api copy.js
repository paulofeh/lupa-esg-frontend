// js/api.js

console.log("API.js carregado");

const API_BASE_URL = "http://localhost:8000/api/v1";

async function fetchCompanyData(codCvm) {
  const url = `${API_BASE_URL}/companies/${codCvm}`;
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
}

// Em api.js, adicione esta nova função
async function updatePageMetadata(data) {
  // Atualiza o título da página
  document.title = `${data.razao_social} | Lupa(ESG)`;

  // Atualiza a meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    // Se não existe, cria
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = `Informações ESG de ${data.razao_social}. Setor: ${data.setor}. Análise de práticas ambientais, sociais e de governança baseada no Formulário de Referência.`;
    document.head.appendChild(meta);
  } else {
    // Se já existe, atualiza
    metaDescription.content = `Informações ESG de ${data.razao_social}. Setor: ${data.setor}. Análise de práticas ambientais, sociais e de governança baseada no Formulário de Referência.`;
  }
}

function updateESGReportAccordeon(esgData) {
  const reportSection = document.querySelector("#esg-report");
  const content = reportSection.querySelector(".esg-detail-content");

  // Obtém o status do relatório
  const reportStatus = esgData.divulgaInformacoesAsg?.divulga || false;

  if (reportStatus) {
    // Se há relatório, atualiza o conteúdo
    const reportData = esgData.divulgaInformacoesAsg;

    // Atualiza o documento principal (bloco destacado)
    let documentHTML = "";
    if (reportData.documento && reportData.documento.length > 0) {
      const mainDoc = reportData.documento[0];
      documentHTML = `
        <div class="esg-content-block esg-highlight-block">
          <div class="esg-document">
            <div class="esg-document-title">
              ${mainDoc.tipo || "Relatório ESG"}
            </div>
            <a href="${mainDoc.url}" class="esg-document-link" target="_blank">
              <i class="ph-bold ph-link"></i>
              Acessar documento
            </a>
          </div>
        </div>
      `;
    }

    // Atualiza os padrões considerados
    let standardsHTML = "";
    if (esgData.metodologias?.padroesConsiderados) {
      standardsHTML = `
        <div class="esg-content-block">
          <div class="esg-content-title">Padrões considerados</div>
          <div class="esg-tag-list">
            ${esgData.metodologias.padroesConsiderados
              .map((padrao) => `<span class="esg-tag">${padrao}</span>`)
              .join("")}
          </div>
        </div>
      `;
    }

    // Atualiza o resumo da prática
    const resumoHTML = `
      <div class="esg-content-block">
        <div class="esg-content-title">Resumo da prática</div>
        <p>${reportData.resumo || "Informações detalhadas não disponíveis."}</p>
      </div>
    `;

    // Atualiza todo o conteúdo
    content.innerHTML = `
      ${documentHTML}
      ${standardsHTML}
      ${resumoHTML}
    `;
  } else {
    // Se não há relatório, mostra justificativa ou mensagem padrão
    const justificativa =
      esgData.explicacoes ||
      "A empresa não forneceu justificativa para a não adoção desta prática.";

    content.innerHTML = `
      <div class="esg-content-block">
        <div class="esg-content-title">Justificativa</div>
        <p>${justificativa}</p>
      </div>
    `;
  }
}

function updateESGAuditAccordeon(esgData) {
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
}

function updateESGInventoryAccordeon(esgData) {
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
                <i class="ph-bold ${escopos.escopo1 ? "ph-check" : "ph-x"}"></i>
              </div>
              <div class="esg-scope-info">
                <div class="esg-scope-title">Escopo 1</div>
                <div class="esg-scope-description">Emissões diretas</div>
              </div>
            </div>

            <div class="esg-scope" data-active="${escopos.escopo2 || false}">
              <div class="esg-scope-icon">
                <i class="ph-bold ${escopos.escopo2 ? "ph-check" : "ph-x"}"></i>
              </div>
              <div class="esg-scope-info">
                <div class="esg-scope-title">Escopo 2</div>
                <div class="esg-scope-description">Emissões indiretas - energia</div>
              </div>
            </div>

            <div class="esg-scope" data-active="${escopos.escopo3 || false}">
              <div class="esg-scope-icon">
                <i class="ph-bold ${escopos.escopo3 ? "ph-check" : "ph-x"}"></i>
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
}

function updateESGMatrixAccordeon(esgData) {
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
}

function updateESGODSAccordeon(esgData) {
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
}

function updateESGTCFDAccordeon(esgData) {
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
}

function updateESGAccordeons(data) {
  const latestYear = Math.max(...Object.keys(data.dados_esg).map(Number));
  const latestData = data.dados_esg[latestYear];
  const esgData = latestData.dados_qualitativos.conteudo.info_asg;

  // Mapa de status para cada seção
  const statusMap = {
    "esg-report": esgData.divulgaInformacoesAsg?.divulga || false,
    "esg-audit": esgData.auditoria?.auditoriaRealizada || false,
    "esg-inventory": esgData.inventarioEmissoes?.realizaInventario || false,
    "esg-matrix": esgData.materialidade?.divulgaMatriz || false,
    "esg-ods":
      esgData.objetivosDesenvolvimentoSustentavel?.consideraODS || false,
    "esg-tcfd": esgData.recomendacoesTCFD?.consideraTCFD || false,
  };

  // Mapa de ícones originais para cada seção
  const iconMap = {
    "esg-report": "ph-file-text",
    "esg-audit": "ph-check-square",
    "esg-inventory": "ph-chart-line-up",
    "esg-matrix": "ph-chart-scatter",
    "esg-ods": "ph-globe-hemisphere-west",
    "esg-tcfd": "ph-thermometer",
  };

  // Atualiza o status de cada seção
  Object.entries(statusMap).forEach(([id, status]) => {
    const section = document.querySelector(`#${id}`);
    if (section) {
      section.dataset.status = status.toString();

      // Atualiza o ícone mantendo o tipo original, apenas alterando as cores via CSS
      const iconContainer = section.querySelector(".esg-badge-icon");
      const icon = iconContainer.querySelector("i");
      if (icon) {
        icon.className = `ph-bold ${iconMap[id]}`; // Mantém o ícone original
      }

      // Adiciona o badge de status se necessário
      if (!status) {
        const header = section.querySelector(".esg-detail-header");
        if (!header.querySelector(".esg-status-badge")) {
          const badge = document.createElement("div");
          badge.className = "esg-status-badge";
          badge.innerHTML = `
            <i class="ph-bold ph-info"></i>
            <span>Prática não adotada</span>
          `;
          header.appendChild(badge);
        }
      }
    }
  });
  // Atualiza o conteúdo dos acordeons
  updateESGReportAccordeon(esgData);
  updateESGAuditAccordeon(esgData);
  updateESGInventoryAccordeon(esgData);
  updateESGMatrixAccordeon(esgData);
  updateESGODSAccordeon(esgData); // Adicionada esta linha
  updateESGTCFDAccordeon(esgData); // Adicionada esta linha
}

async function updateCompanyContent(codCvm) {
  try {
    const data = await fetchCompanyData(codCvm);
    const latestYear = Math.max(...Object.keys(data.dados_esg).map(Number));
    const latestData = data.dados_esg[latestYear];

    // Atualiza o bloco "Quem é"
    const whoIsSection = document.querySelector(
      ".content-section:nth-child(1) .text-block"
    );
    whoIsSection.innerHTML = `
          <p>${latestData.dados_qualitativos.conteudo.atividades.resumo_geral}</p>
      `;

    // Atualiza o grid de atividades
    const activitiesGrid = document.querySelector(".activities-grid");
    activitiesGrid.innerHTML =
      latestData.dados_qualitativos.conteudo.atividades.atividades_principais
        .map(
          (activity) => `
              <div class="activity-card">
                  <div class="activity-icon">
                      <i class="ph-bold ph-puzzle-piece"></i>
                  </div>
                  <h4 class="activity-title">${activity.descricao}</h4>
              </div>
          `
        )
        .join("");

    // Atualiza a seção de histórico
    const historicSection = document.querySelector(
      ".content-section:nth-child(3) .text-block"
    );

    // Cria a lista de histórico
    const historicos =
      latestData.dados_qualitativos.conteudo.historico.marcos_historicos;
    if (historicos && historicos.length > 0) {
      historicSection.innerHTML = `
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
          `;
    } else {
      historicSection.innerHTML = `<p>Histórico não disponível.</p>`;
    }

    // Atualiza as badges de histórico
    const infoBadges = document.querySelector(".info-badges");
    const fundacao = latestData.dados_qualitativos.conteudo.historico.fundacao;

    // Verifica se tem dados de fundação
    if (fundacao && (fundacao.data || fundacao.local)) {
      // Array para armazenar as badges que serão exibidas
      const badges = [];

      // Adiciona badge de data se houver
      if (fundacao.data) {
        badges.push(`
                  <span class="info-badge">
                      <i class="ph-bold ph-calendar-check"></i>
                      Fundação: ${fundacao.data}
                  </span>
              `);
      }

      // Adiciona badge de local se houver
      if (fundacao.local) {
        badges.push(`
                  <span class="info-badge">
                      <i class="fa-solid fa-location-dot"></i>
                      ${fundacao.local}
                  </span>
              `);
      }

      // Atualiza o HTML apenas se houver badges para mostrar
      if (badges.length > 0) {
        infoBadges.innerHTML = badges.join("");
        infoBadges.style.display = "flex";
      } else {
        infoBadges.style.display = "none";
      }
    } else {
      // Se não houver dados de fundação, oculta o container
      infoBadges.style.display = "none";
    }
  } catch (error) {
    console.error("Erro ao atualizar conteúdo:", error);
  }
}

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

function updateDiversityHighlights(data) {
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
}

async function updateCompanyHeader(codCvm) {
  console.log("Iniciando updateCompanyHeader para codCvm:", codCvm);
  const heroContent = document.querySelector(".hero__content");
  heroContent.classList.add("loading");

  try {
    console.log("Buscando dados da empresa...");
    const data = await fetchCompanyData(codCvm);
    console.log("Dados recebidos em updateCompanyHeader:", data);

    // Atualiza os metadados da página
    updatePageMetadata(data);
    // Atualizar acordeons ESG
    updateESGAccordeons(data);

    updateDiversityHighlights(data);

    // Atualiza o título
    document.querySelector(".hero__title").textContent = data.razao_social;

    // Atualiza os badges setoriais
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

    // Atualiza metadados
    const metadataValues = document.querySelectorAll(".metadata-value");
    metadataValues[0].textContent = data.cod_cvm;
    metadataValues[1].textContent = data.cnpj;

    // Formata e atualiza as datas
    const dtRef = new Date(data.documento.dt_referencia);
    const dtRec = new Date(data.documento.dt_recebimento);
    const dtProc = new Date(data.documento.data_processamento);

    metadataValues[2].textContent = dtRef.toLocaleDateString("pt-BR");
    metadataValues[3].textContent = dtRec.toLocaleDateString("pt-BR");
    metadataValues[4].textContent = data.documento.versao;

    // Atualiza a data de última atualização
    document.querySelector(".update-date").textContent = dtProc.toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    await updateCompanyContent(codCvm);
    heroContent.classList.remove("loading");
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    heroContent.classList.remove("loading");
  }
}

// Em api.js, vamos organizar todas as funções relacionadas à busca em um objeto

const api = {
  API_BASE_URL: "http://localhost:8000/api/v1",

  // Função para busca de empresas
  async searchCompanies(query) {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/companies/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          mode: "cors",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro na busca:", error);
      throw error;
    }
  },

  // Função de debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Função para inicializar a busca
  initializeSearch() {
    const searchInput = document.querySelector("#company-search");
    const searchResults = document.querySelector("#search-results");

    // Função para renderizar resultados
    function renderResults(companies) {
      if (!companies.length) {
        searchResults.innerHTML = `
          <div class="search-no-results">
            <i class="ph ph-magnifying-glass"></i>
            <span>Nenhuma empresa encontrada</span>
          </div>
        `;
        return;
      }

      searchResults.innerHTML = companies
        .map(
          (company) => `
        <div class="search-result-item" data-cod-cvm="${company.cod_cvm}">
          <i class="ph ph-buildings"></i>
          <span class="company-name">${company.razao_social}</span>
        </div>
      `
        )
        .join("");
    }

    // Função para lidar com a busca
    const handleSearch = this.debounce(async (query) => {
      if (!query || query.length < 2) {
        searchResults.innerHTML = "";
        return;
      }

      try {
        const companies = await this.searchCompanies(query);
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
    }, 300); // 300ms de debounce

    // Event listeners
    searchInput.addEventListener("input", (e) => {
      handleSearch.call(this, e.target.value.trim());
    });

    // Fecha resultados ao clicar fora
    document.addEventListener("click", (e) => {
      if (
        !searchInput.contains(e.target) &&
        !searchResults.contains(e.target)
      ) {
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

    // Lidar com navegação por teclado
    searchInput.addEventListener("keydown", (e) => {
      const results = searchResults.querySelectorAll(".search-result-item");
      let currentIndex = Array.from(results).findIndex((item) =>
        item.classList.contains("selected")
      );

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();

        if (currentIndex >= 0) {
          results[currentIndex].classList.remove("selected");
        }

        if (e.key === "ArrowDown") {
          currentIndex =
            currentIndex < results.length - 1 ? currentIndex + 1 : 0;
        } else {
          currentIndex =
            currentIndex > 0 ? currentIndex - 1 : results.length - 1;
        }

        results[currentIndex].classList.add("selected");
        results[currentIndex].scrollIntoView({ block: "nearest" });
      }

      if (e.key === "Enter") {
        const selectedItem = searchResults.querySelector(
          ".search-result-item.selected"
        );
        if (selectedItem) {
          window.location.href = `/empresa.html?cod_cvm=${selectedItem.dataset.codCvm}`;
        }
      }
    });
  },
};

console.log("Definindo api no objeto window");
window.api = api;
console.log("API disponibilizada globalmente");

// Exporta as funções para uso em outros arquivos
window.api = {
  fetchCompanyData,
  updateCompanyHeader,
};
