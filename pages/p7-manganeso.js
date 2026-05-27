/**
 * pages/p7-manganeso.js — Riesgo Precio Manganeso
 * Commodity principal · Mercado OTC limitado · Cobertura natural
 */

function renderManganeso() {
  const el = document.getElementById("manganeso-content");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

  el.innerHTML = `

    <div class="alert alert-warn mb-24">
      <span class="alert-icon">⛏</span>
      <span>
        ${isEn
          ? `Manganese is Autlán's primary commodity (~90% of revenues). Unlike gold or gas, <strong>there is no liquid and standardized derivatives market</strong> for manganese. OTC instruments exist but are costly and difficult to close. Current price: <strong>USD <span id="mn-precio-live">1,309</span>/MT</strong>`
          : `El manganeso es el commodity principal de Autlán (~90% ingresos). A diferencia del oro o gas, <strong>no existe un mercado de derivados líquido y estandarizado</strong> para manganeso. Los instrumentos OTC existen pero son costosos y difíciles de cerrar. Precio actual: <strong>USD <span id="mn-precio-live">1,309</span>/MT</strong>`}
      </span>
    </div>

    <!-- KPIs -->
    <div class="grid-4 mb-24" id="mn-kpis"></div>

    <!-- CONTEXTO DE MERCADO -->
    <div class="section-title">
      ${isEn ? "Manganese Market Context · 2026" : "Contexto del mercado de manganeso · 2026"}
    </div>
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-header">
          <div class="card-title">${isEn ? "Market Structure" : "Estructura del mercado"}</div>
          <span class="badge badge-warn">${isEn ? "Limited OTC Market" : "Mercado OTC limitado"}</span>
        </div>
        ${_mnMercadoEstructura()}
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">${isEn ? "Price Drivers" : "Drivers del precio"}</div>
          <span class="badge badge-accent">${isEn ? "1Q26 · 17-month High" : "Q1 2026 · Máximo 17 meses"}</span>
        </div>
        ${_mnDriversPrecio()}
      </div>
    </div>

    <!-- ANÁLISIS DE DERIVADOS OTC -->
    <div class="section-title">
      ${isEn ? "Analysis of Available Instruments · Why is the OTC Market Limited?" : "Análisis de instrumentos disponibles · ¿Por qué el mercado OTC es limitado?"}
    </div>
    <div class="card mb-24">
      <div id="mn-derivados-analisis"></div>
    </div>

    <!-- TABLA COMPARATIVA -->
    <div class="section-title">
      ${isEn ? "Financial Impact by Scenario · Without Formal Instrument" : "Impacto financiero por escenario · Sin instrumento formal"}
    </div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>${isEn ? "Variable / Strategy" : "Variable / Estrategia"}</th>
            <th class="esc-header-base">Base · $1,300/MT</th>
            <th class="esc-header-opt">${isEn ? "Optimistic · $1,600/MT" : "Optimista · $1,600/MT"}</th>
            <th class="esc-header-adv">${isEn ? "Adverse · $900/MT" : "Adverso · $900/MT"}</th>
          </tr>
        </thead>
        <tbody id="mn-tabla-comparativa"></tbody>
      </table>
    </div>

    <!-- CALCULADORA EXPOSICIÓN -->
    <div class="section-title">${isEn ? "Exposure Calculator · Manganese" : "Calculadora de exposición · Manganeso"}</div>
    <div class="card mb-24">
      <div class="grid-2">
        <div>
          <div class="section-title" style="margin-top:0;">
            ${isEn ? "Production Parameters" : "Parámetros de producción"}
          </div>
          <div class="field-group">
            <label>${isEn ? "Manganese spot price (USD/MT)" : "Precio spot manganeso (USD/MT)"}</label>
            <input type="number" id="mn-calc-precio" value="1309" step="10"
                   oninput="calcMnExposicion()" />
          </div>
          <div class="field-group">
            <label>${isEn ? "Estimated annual sales volume (MT)" : "Volumen ventas anual estimado (MT)"}</label>
            <input type="number" id="mn-calc-vol" value="55000" step="1000"
                   oninput="calcMnExposicion()" />
          </div>
          <div class="field-group">
            <label>${isEn ? "Break-even price / total cost (USD/MT)" : "Precio de equilibrio / costo total (USD/MT)"}</label>
            <input type="number" id="mn-calc-costo" value="900" step="10"
                   oninput="calcMnExposicion()" />
          </div>
          <div class="field-group">
            <label>${isEn ? "% Sales with fixed price (LP contracts)" : "% ventas con precio fijo (contratos LP)"}</label>
            <input type="number" id="mn-calc-fijo" value="30" min="0" max="100"
                   oninput="calcMnExposicion()" />
          </div>
          <div class="field-group">
            <label>${isEn ? "Contracted LP price (USD/MT)" : "Precio contrato LP pactado (USD/MT)"}</label>
            <input type="number" id="mn-calc-precio-lp" value="1250" step="10"
                   oninput="calcMnExposicion()" />
          </div>
        </div>
        <div id="mn-calc-result">
          <div class="alert alert-info">
            <span>${isEn ? "Adjust parameters to calculate exposure." : "Ajusta los parámetros para calcular la exposición."}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ESTRATEGIAS ALTERNATIVAS -->
    <div class="section-title">
      ${isEn ? "Available Hedging Strategies · Without Listed Derivatives" : "Estrategias de cobertura disponibles · Sin derivados listados"}
    </div>
    <div class="grid-2 mb-24" id="mn-estrategias"></div>

    <!-- OPORTUNIDADES ESTRUCTURALES -->
    <div class="section-title">
      ${isEn ? "Structural Opportunities · Long-term Catalysts" : "Oportunidades estructurales · Catalizadores de largo plazo"}
    </div>
    <div class="card mb-24" id="mn-oportunidades"></div>

    <!-- RECOMENDACIÓN -->
    <div class="section-title">${isEn ? "Analysis and Recommendation" : "Análisis y recomendación"}</div>
    <div class="card mb-24" id="mn-recomendacion"></div>

  `;

  _mnRenderKPIs();
  _mnRenderDerivadosAnalisis();
  _mnRenderTablaComparativa();
  _mnRenderEstrategias();
  _mnRenderOportunidades();
  _mnRenderRecomendacion();
  calcMnExposicion();

  Scenarios.on("var:precioMn", () => {
    _mnRenderKPIs();
    _mnRenderTablaComparativa();
    _mnRenderRecomendacion();
    calcMnExposicion();
  });
}

// ─────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────
function _mnRenderKPIs() {
  const el = document.getElementById("mn-kpis");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio  = Scenarios.getVar("precioMn");
  const base    = 1309;
  const volMT   = 55000;
  const ingr    = precio * volMT / 1000;
  const ingrBase = base * volMT / 1000;
  const delta   = ingr - ingrBase;
  const costo   = 900;
  const margen  = ((precio - costo) / precio * 100);

  document.getElementById("mn-precio-live") &&
    (document.getElementById("mn-precio-live").textContent =
      precio.toLocaleString());

  el.innerHTML = [
    {
      label: isEn ? "Current Mn Price" : "Precio Mn actual",
      value: `USD ${precio.toLocaleString()}/MT`,
      sub:   isEn ? `17-month high · 1Q26 · Base: $1,309` : `Máximo 17 meses · Q1 2026 · Base: $1,309`,
      tipo:  precio > 1400 ? "success"
           : precio > 1100 ? "warn" : "danger",
      delta: isEn ? `${delta >= 0 ? "+" : ""}USD ${(delta/1000).toFixed(1)}M vs base` : `${delta >= 0 ? "+" : ""}USD ${(delta/1000).toFixed(1)}M vs base`,
      dir:   delta >= 0 ? "up" : "down",
    },
    {
      label: isEn ? "Est. Ferroalloy Revenues" : "Ingresos ferroaleaciones est.",
      value: `USD ${(ingr/1000).toFixed(1)}M`,
      sub:   `~${volMT.toLocaleString()} MT/${isEn ? "year" : "año"} · ${isEn ? "current price" : "precio actual"}`,
      tipo:  "accent",
      delta: isEn ? `${margen.toFixed(1)}% margin over cost` : `${margen.toFixed(1)}% margen sobre costo`,
      dir:   margen > 30 ? "up" : "down",
    },
    {
      label: isEn ? "Available Hedging" : "Cobertura disponible",
      value: isEn ? "Limited" : "Limitada",
      sub:   isEn ? "No listed futures · OTC very costly" : "No hay futuros listados · OTC muy costoso",
      tipo:  "warn",
      delta: isEn ? "LP contracts as alternative" : "Contratos LP como alternativa",
      dir:   "down",
    },
    {
      label: isEn ? "Adverse Scenario Loss" : "Pérdida escenario adverso",
      value: `USD ${((base - 900) * volMT / 1e6).toFixed(1)}M`,
      sub:   isEn ? `If price falls to $900/MT (adverse scenario)` : `Si precio cae a $900/MT (escenario adverso)`,
      tipo:  "danger",
      delta: `$${base - 900}/MT × ${volMT.toLocaleString()} MT`,
      dir:   "down",
    },
  ].map(k => `
    <div class="kpi-card ${k.tipo}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="flex-between mt-4">
        <span class="kpi-sub">${k.sub}</span>
        <span class="kpi-delta ${k.dir}">${k.delta}</span>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// CONTEXTO DE MERCADO
// ─────────────────────────────────────────
function _mnMercadoEstructura() {
  const isEn = I18N.getLocale() === "en";
  const items = isEn ? [
    {
      titulo: "No Listed Futures",
      desc:   "There is no standardized futures contract for manganese ferroalloys on any global exchange (LME, COMEX, SHFE). Manganese ore also lacks a liquid contract.",
      tipo:   "danger",
    },
    {
      titulo: "OTC Exists but is Expensive",
      desc:   "OTC forwards with specialized banks (BNP, SocGen, Glencore Financial) exist but require: minimum volumes of 10,000 MT+, bid-ask spreads of 5-10%, and significant collateral.",
      tipo:   "warn",
    },
    {
      titulo: "Fragmented Reference Index",
      desc:   "CRU, Fastmarkets, and Metal Bulletin prices are the reference indices, but they are private and costly. No liquid public index = no standardized derivatives.",
      tipo:   "warn",
    },
    {
      titulo: "China Dominates (61% Global)",
      desc:   "Manganese prices move mainly due to Chinese decisions — port inventories in China, steel sector stimulus, and construction. Autlán cannot influence or predict these movements.",
      tipo:   "accent",
    },
  ] : [
    {
      titulo: "Sin futuros listados",
      desc:   "No existe un contrato de futuros estandarizado para ferroaleaciones de manganeso en ninguna bolsa global (LME, COMEX, SHFE). El ore de manganeso tampoco tiene contrato líquido.",
      tipo:   "danger",
    },
    {
      titulo: "OTC existe pero es caro",
      desc:   "Forwards OTC con bancos especializados (BNP, SocGen, Glencore Financial) existen pero requieren: volúmenes mínimos de 10,000 MT+, spread bid-ask de 5-10%, y colateral significativo.",
      tipo:   "warn",
    },
    {
      titulo: "Índice de referencia fragmentado",
      desc:   "Los precios CRU, Fastmarkets y Metal Bulletin son los índices de referencia, pero son de acceso privado y costoso. Sin índice público líquido = sin derivados estandarizados.",
      tipo:   "warn",
    },
    {
      titulo: "China domina (61% global)",
      desc:   "Los precios del manganeso se mueven principalmente por decisiones de China — inventarios en puertos chinos, estímulo al sector acero y construction. Autlán no puede influenciar ni predecir estos movimientos.",
      tipo:   "accent",
    },
  ];

  return items.map(i => `
    <div style="margin-bottom:12px; padding:10px 12px;
                background:var(--bg-raised); border-radius:var(--radius-md);
                border-left:3px solid var(--${i.tipo === "danger" ? "danger-mid"
                                            : i.tipo === "warn"   ? "warn-mid"
                                            : "accent-mid"});">
      <div style="font-size:12px; font-weight:600; margin-bottom:4px;">
        ${i.titulo}
      </div>
      <div style="font-size:11.5px; color:var(--text-secondary); line-height:1.5;">
        ${i.desc}
      </div>
    </div>
  `).join("");
}

function _mnDriversPrecio() {
  const isEn = I18N.getLocale() === "en";
  const drivers = isEn ? [
    { factor: "China restocking 1Q26",       impacto: "+15% QoQ",  dir: "up",   color: "var(--success-mid)" },
    { factor: "Africa logistical disruptions", impacto: "Support",   dir: "up",   color: "var(--success-mid)" },
    { factor: "India structural demand",      impacto: "+6.3% steel",dir: "up",  color: "var(--success-mid)" },
    { factor: "Australia reentry 2025",       impacto: "Down pressure",dir: "down",color: "var(--warn-mid)" },
    { factor: "China steel fragile (-1.7%)",  impacto: "Down risk",   dir: "down",color: "var(--warn-mid)" },
    { factor: "Asian dumping in Mexico",      impacto: "−Domestic price",dir:"down",color:"var(--danger-mid)"},
    { factor: "Gabon ban 2029",               impacto: "LT Catalyst",dir: "up", color: "var(--accent-mid)" },
  ] : [
    { factor: "China restocking Q1 2026",     impacto: "+15% QoQ",  dir: "up",   color: "var(--success-mid)" },
    { factor: "Disrupciones logísticas África", impacto: "Soporte",   dir: "up",   color: "var(--success-mid)" },
    { factor: "India demanda estructural",      impacto: "+6.3% acero",dir: "up",  color: "var(--success-mid)" },
    { factor: "Australia reentrada 2025",       impacto: "Presión baja",dir: "down",color: "var(--warn-mid)"    },
    { factor: "China acero frágil (-1.7%)",     impacto: "Riesgo bajo", dir: "down",color: "var(--warn-mid)"    },
    { factor: "Dumping asiático México",        impacto: "−Precio doméstico",dir:"down",color:"var(--danger-mid)"},
    { factor: "Gabon ban 2029",                 impacto: "Catalizador LP",dir: "up", color: "var(--accent-mid)" },
  ];

  return `
    ${drivers.map(d => `
      <div class="flex-between" style="padding:7px 0;
                  border-bottom:1px solid var(--border);">
        <span style="font-size:12px;">${d.factor}</span>
        <span style="font-size:11.5px; font-weight:600;
                     color:${d.color};">
          ${d.dir === "up" ? "▲" : "▼"} ${d.impacto}
        </span>
      </div>
    `).join("")}
    <div style="margin-top:10px; font-size:11px; color:var(--text-muted);">
      ${isEn ? "Source: IMARC Group 1Q26 · CANACERO · Autlán Annual 2025" : "Fuente: IMARC Group Q1 2026 · CANACERO · Autlán Annual 2025"}
    </div>
  `;
}

// ─────────────────────────────────────────
// ANÁLISIS DERIVADOS OTC
// ─────────────────────────────────────────
function _mnRenderDerivadosAnalisis() {
  const el = document.getElementById("mn-derivados-analisis");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio = Scenarios.getVar("precioMn");
  const vol    = 55000; // MT

  // Costo estimado de un forward OTC de manganeso
  const spreadBidAsk = 0.075; // 7.5% spread típico
  const costoForward = precio * spreadBidAsk * vol / 1000; // USD miles

  const items = isEn ? [
    {
      num: "1",
      titulo: "Prohibitive Bid-Ask Spread",
      desc: `The typical spread in manganese OTC forwards is 7-10% of the notional. On USD ${(precio*vol/1e6).toFixed(1)}M of annual revenues, that is an implicit cost of USD ${costoForward.toFixed(0)}K just to enter the position — before any price movement.`,
    },
    {
      num: "2",
      titulo: "Non-Standardized Reference Price",
      desc: `Settling a forward requires a public and liquid reference index. Manganese indices (CRU, Fastmarkets) are private and their methodologies are disputed — counterparties do not easily agree on the settlement price.`,
    },
    {
      num: "3",
      titulo: "Very High Minimum Volume",
      desc: `Banks offering manganese forwards (BNP Paribas, Standard Chartered) require minimum lots of 10,000-50,000 MT per trade. Autlán produces ~55,000 MT/year — hedging it would require a single transaction that concentrates all counterparty risk.`,
    },
    {
      num: "4",
      titulo: "Very High Basis Risk",
      desc: `The price Autlán receives from its clients (contract price) differs significantly from the spot reference index. Basis risk can be as high as the price risk intended to be hedged.`,
    },
  ] : [
    {
      num: "1",
      titulo: "Spread bid-ask prohibitivo",
      desc: `El spread típico en forwards OTC de manganeso es 7-10% del nocional. Sobre USD ${(precio*vol/1e6).toFixed(1)}M de ingresos anuales, eso es un costo implícito de USD ${costoForward.toFixed(0)}K solo por entrar en la posición — antes de cualquier movimiento de precio.`,
    },
    {
      num: "2",
      titulo: "Precio de referencia no estandarizado",
      desc: `El settlement de un forward necesita un índice de referencia público y líquido. Los índices de manganeso (CRU, Fastmarkets) son privados y sus metodologías son disputadas — las contrapartes no se ponen de acuerdo en el precio de liquidación.`,
    },
    {
      num: "3",
      titulo: "Volumen mínimo muy alto",
      desc: `Los bancos que ofrecen forwards de manganeso (BNP Paribas, Standard Chartered) requieren lotes mínimos de 10,000-50,000 MT por operación. Autlán produce ~55,000 MT/año — cubrirlo requeriría una sola operación que concentra todo el riesgo de contraparte.`,
    },
    {
      num: "4",
      titulo: "Riesgo de base muy alto",
      desc: `El precio que recibe Autlán de sus clientes (precio de contrato) difiere significativamente del índice spot de referencia. El basis risk puede ser tan alto como el riesgo de precio que se intenta cubrir.`,
    },
  ];

  const tableData = isEn ? [
    ["OTC Bank Forward", "Low — few issuers", `~7-10% notional (USD ${costoForward.toFixed(0)}K)`, "⚠ High Cost"],
    ["Exchange Futures", "Unavailable", "N/A — no contract exists", "✗ Not Applicable"],
    ["Manganese Options", "Virtually zero", "Spread + premium = prohibitive", "✗ Not Recommended"],
    ["Fixed Price LP Contract", "High — with clients", "2-5% discount vs spot", "✓ Core Strategy"],
    ["Natural Hedge (Costs)", "High — already partly active", "Capex in self-generation", "✓ Complementary"],
    ["Product Diversification", "High — EMD and Metallorum", "Capex in expansion", "✓ Structural"],
  ] : [
    ["Forward OTC banco", "Baja — pocos oferentes", `~7-10% nocional (USD ${costoForward.toFixed(0)}K)`, "⚠ Costo alto"],
    ["Futuros bolsa", "No disponible", "N/A — no existe contrato", "✗ No aplicable"],
    ["Opciones sobre Mn", "Prácticamente nula", "Spread + prima = prohibitivo", "✗ No recomendado"],
    ["Contrato LP precio fijo", "Alta — con clientes", "Descuento 2-5% vs spot", "✓ Estrategia principal"],
    ["Cobertura natural (costos)", "Alta — ya existe parcialmente", "Inversión capex autogeneración", "✓ Complementaria"],
    ["Diversificación productos", "Alta — EMD y Metallorum", "Capex en expansión", "✓ Estructural"],
  ];

  el.innerHTML = `
    <div class="grid-2" style="gap:24px;">

      <div>
        <div class="section-title" style="margin-top:0;">
          ${isEn ? "Why Does No One Use Manganese OTC Derivatives?" : "¿Por qué nadie cierra derivados OTC de manganeso?"}
        </div>

        <div style="margin-bottom:16px;">
          ${items.map(i => `
            <div style="display:flex; gap:10px; margin-bottom:12px;">
              <div style="width:22px; height:22px; border-radius:50%;
                          background:var(--accent); color:#fff;
                          display:flex; align-items:center;
                          justify-content:center; font-size:11px;
                          font-weight:700; flex-shrink:0; margin-top:1px;">
                ${i.num}
              </div>
              <div>
                <div style="font-size:12px; font-weight:600;
                            margin-bottom:3px;">${i.titulo}</div>
                <div style="font-size:11.5px; color:var(--text-secondary);
                            line-height:1.5;">${i.desc}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div>
        <div class="section-title" style="margin-top:0;">
          ${isEn ? "Comparison of Available Instruments" : "Comparación de instrumentos disponibles"}
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${isEn ? "Instrument" : "Instrumento"}</th>
                <th>${isEn ? "Availability" : "Disponibilidad"}</th>
                <th>${isEn ? "Implicit Cost" : "Costo implícito"}</th>
                <th>${isEn ? "Recommendation" : "Recomendación"}</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map(([inst, disp, costo, rec]) => `
                <tr>
                  <td style="font-size:11.5px; font-weight:500;">${inst}</td>
                  <td style="font-size:11px; color:var(--text-secondary);">${disp}</td>
                  <td style="font-size:11px;">${costo}</td>
                  <td style="font-size:11.5px; font-weight:600;
                      color:${rec.includes("✓") ? "var(--success)"
                             : rec.includes("⚠") ? "var(--warn)"
                             : "var(--danger)"};">
                    ${rec}
                  </td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="alert alert-info" style="margin-top:12px;">
          <span class="alert-icon">💡</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? `<strong>Conclusion:</strong> The implicit cost of the OTC forward (~USD ${costoForward.toFixed(0)}K) as a percentage of the operating margin makes natural hedging via long-term contracts with clients much more efficient.`
              : `<strong>Conclusión:</strong> El costo implícito del forward OTC (~USD ${costoForward.toFixed(0)}K) como porcentaje del margen operativo hace que la cobertura natural via contratos de largo plazo con clientes sea más eficiente.`}
          </span>
        </div>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// CALCULADORA DE EXPOSICIÓN
// ─────────────────────────────────────────
window.calcMnExposicion = function() {
  const isEn = I18N.getLocale() === "en";
  const precio   = parseFloat(
    document.getElementById("mn-calc-precio")?.value    || 1309);
  const vol      = parseFloat(
    document.getElementById("mn-calc-vol")?.value       || 55000);
  const costo    = parseFloat(
    document.getElementById("mn-calc-costo")?.value     || 900);
  const pctFijo  = parseFloat(
    document.getElementById("mn-calc-fijo")?.value      || 30) / 100;
  const precioLP = parseFloat(
    document.getElementById("mn-calc-precio-lp")?.value || 1250);

  const volSpot  = vol * (1 - pctFijo);
  const volLP    = vol * pctFijo;

  const ingrSpot = precio   * volSpot / 1000;
  const ingrLP   = precioLP * volLP   / 1000;
  const ingrTotal = ingrSpot + ingrLP;
  const costoTotal = costo * vol / 1000;
  const margenBruto = ingrTotal - costoTotal;
  const margenPct   = (margenBruto / ingrTotal * 100);

  // Escenario adverso
  const precioAdv  = 900;
  const ingrAdv    = precioAdv * volSpot / 1000 + precioLP * volLP / 1000;
  const margenAdv  = ingrAdv - costoTotal;

  // Protección del LP
  const proteccionLP = (precio - precioLP) < 0
    ? Math.abs((precio - precioLP) * volLP / 1000)
    : 0;

  const el = document.getElementById("mn-calc-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">
      ${isEn ? "Exposure Result" : "Resultado de exposición"}
    </div>

    ${_resultRow(isEn ? "Total volume" : "Volumen total", `${vol.toLocaleString()} MT/${isEn ? "year" : "año"}`)}
    ${_resultRow(isEn ? "Spot volume (exposed)" : "Volumen spot (expuesto)",
                  `${volSpot.toLocaleString()} MT (${((1-pctFijo)*100).toFixed(0)}%)`,
                  pctFijo < 0.3 ? "danger" : "warn")}
    ${_resultRow(isEn ? "LP volume (protected)" : "Volumen LP (protegido)",
                  `${volLP.toLocaleString()} MT (${(pctFijo*100).toFixed(0)}%)`,
                  "positive")}

    <div class="divider"></div>

    ${_resultRow(isEn ? "Spot revenue" : "Ingreso spot",
                  `USD ${(ingrSpot/1000).toFixed(1)}M`,
                  precio > costo ? "positive" : "danger")}
    ${_resultRow(isEn ? "LP revenue" : "Ingreso LP",
                  `USD ${(ingrLP/1000).toFixed(1)}M`, "positive")}
    ${_resultRow(isEn ? "Total revenue" : "Ingreso total",
                  `USD ${(ingrTotal/1000).toFixed(1)}M`, "positive")}
    ${_resultRow(isEn ? "Total cost" : "Costo total",
                  `USD ${(costoTotal/1000).toFixed(1)}M`)}
    ${_resultRow(isEn ? "Gross margin" : "Margen bruto",
                  `USD ${(margenBruto/1000).toFixed(1)}M (${margenPct.toFixed(1)}%)`,
                  margenPct > 20 ? "positive" : margenPct > 0 ? "warn" : "danger")}

    <div class="divider"></div>

    ${_resultRow(isEn ? "Adverse scenario margin ($900/MT)" : "Margen escenario adverso ($900/MT)",
                  `USD ${(margenAdv/1000).toFixed(1)}M`,
                  margenAdv > 0 ? "warn" : "danger")}
    ${_resultRow(isEn ? "LP protection in adverse" : "Protección LP en adverso",
                  `USD ${(proteccionLP > 0 ? proteccionLP/1000 : 0).toFixed(1)}M`,
                  "positive")}
    ${_resultRow(isEn ? "Break-even price" : "Break-even precio",
                  `USD ${costo.toFixed(0)}/MT`)}

    <div class="alert alert-${margenPct > 15 ? "success" : margenPct > 0 ? "warn" : "danger"}"
         style="margin-top:12px;">
      <span class="alert-icon">
        ${margenPct > 15 ? "✓" : margenPct > 0 ? "⚠" : "🚨"}
      </span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `With ${(pctFijo*100).toFixed(0)}% of sales in LP contracts at $${precioLP}/MT, the gross margin is ${margenPct.toFixed(1)}%. ${margenAdv > 0 ? "In the adverse scenario ($900/MT), the LP protects and the margin remains positive." : "In the adverse scenario ($900/MT), the margin is negative — the LP does not compensate sufficiently. Increase the % of LP contracts or reduce costs."}`
          : `Con ${(pctFijo*100).toFixed(0)}% de ventas en contratos LP a $${precioLP}/MT, el margen bruto es ${margenPct.toFixed(1)}%. ${margenAdv > 0 ? "En el escenario adverso ($900/MT), el LP protege y el margen sigue siendo positivo." : "En el escenario adverso ($900/MT), el margen es negativo — el LP no compensa suficientemente. Aumentar % de contratos LP o reducir costos."}`}
      </span>
    </div>
  `;
};

// ─────────────────────────────────────────
// TABLA COMPARATIVA
// ─────────────────────────────────────────
function _mnRenderTablaComparativa() {
  const el = document.getElementById("mn-tabla-comparativa");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const esc    = Scenarios.getState().escenarios;
  const vol    = 55000;
  const costo  = 900;
  const precLP = 1250;
  const pctLP  = 0.30;

  const precios = {
    base:      esc.base.precioMn,
    optimista: esc.optimista.precioMn,
    adverso:   esc.adverso.precioMn,
  };

  const ingrSinLP  = (p) => p * vol / 1000;
  const ingrConLP  = (p) => (p * vol*(1-pctLP) + precLP * vol*pctLP) / 1000;
  const margen     = (p, lp) =>
    (lp ? ingrConLP(p) : ingrSinLP(p)) - costo * vol / 1000;
  const protecLP   = (p) => Math.max(ingrConLP(p) - ingrSinLP(p), 0);

  const fmt = (v) => {
    const abs = Math.abs(v);
    const str = abs >= 1000
      ? `USD ${(v/1000).toFixed(1)}M`
      : `USD ${v.toFixed(0)}K`;
    return v < 0 ? `-${str.replace("USD ","")}` : str;
  };

  const filas = isEn ? [
    {
      label:     "Manganese price (USD/MT)",
      vals:      Object.values(precios).map(p => `$${p.toLocaleString()}`),
      highlight: false,
      mono:      true,
    },
    {
      label:     "Total revenues without LP",
      vals:      Object.values(precios).map(p => fmt(ingrSinLP(p))),
      highlight: false,
      mono:      true,
    },
    {
      label:     "Revenues with 30% LP at $1,250",
      vals:      Object.values(precios).map(p => fmt(ingrConLP(p))),
      highlight: false,
      mono:      true,
    },
    {
      label:     "Gross margin without LP",
      vals:      Object.values(precios).map(p => fmt(margen(p, false))),
      highlight: true,
      mono:      true,
      classes:   Object.values(precios).map(p =>
        margen(p, false) > 0 ? "positive" : "negative"),
    },
    {
      label:     "Gross margin with 30% LP",
      vals:      Object.values(precios).map(p => fmt(margen(p, true))),
      highlight: true,
      mono:      true,
      classes:   Object.values(precios).map(p =>
        margen(p, true) > 0 ? "positive" : "negative"),
    },
    {
      label:     "LP protection vs pure spot",
      vals:      Object.values(precios).map(p => fmt(protecLP(p))),
      highlight: false,
      mono:      true,
      classes:   Object.values(precios).map(() => "positive"),
    },
  ] : [
    {
      label:     "Precio manganeso (USD/MT)",
      vals:      Object.values(precios).map(p => `$${p.toLocaleString()}`),
      highlight: false,
      mono:      true,
    },
    {
      label:     "Ingresos totales sin LP",
      vals:      Object.values(precios).map(p => fmt(ingrSinLP(p))),
      highlight: false,
      mono:      true,
    },
    {
      label:     "Ingresos con 30% LP a $1,250",
      vals:      Object.values(precios).map(p => fmt(ingrConLP(p))),
      highlight: false,
      mono:      true,
    },
    {
      label:     "Margen bruto sin LP",
      vals:      Object.values(precios).map(p => fmt(margen(p, false))),
      highlight: true,
      mono:      true,
      classes:   Object.values(precios).map(p =>
        margen(p, false) > 0 ? "positive" : "negative"),
    },
    {
      label:     "Margen bruto con 30% LP",
      vals:      Object.values(precios).map(p => fmt(margen(p, true))),
      highlight: true,
      mono:      true,
      classes:   Object.values(precios).map(p =>
        margen(p, true) > 0 ? "positive" : "negative"),
    },
    {
      label:     "Protección LP vs spot puro",
      vals:      Object.values(precios).map(p => fmt(protecLP(p))),
      highlight: false,
      mono:      true,
      classes:   Object.values(precios).map(() => "positive"),
    },
  ];

  el.innerHTML = filas.map(f => `
    <tr class="${f.highlight ? "row-highlight" : ""}">
      <td style="font-weight:${f.highlight ? "700" : "400"};">
        ${f.label}
      </td>
      ${f.vals.map((v, i) => `
        <td class="${i===0?"esc-base":i===1?"esc-optimista":"esc-adverso"}
                   ${f.mono ? "mono" : ""}
                   ${f.classes ? f.classes[i] : ""}">
          ${v}
        </td>`).join("")}
    </tr>
  `).join("");
}

// ─────────────────────────────────────────
// ESTRATEGIAS ALTERNATIVAS
// ─────────────────────────────────────────
function _mnRenderEstrategias() {
  const el = document.getElementById("mn-estrategias");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const estrategias = isEn ? [
    {
      titulo:   "Long-Term (LP) Contracts with Clients",
      icono:    "📋",
      tipo:     "success",
      desc:     `The most effective available strategy. Autlán can offer 2-5% discounts over spot price in exchange for 12-36 month supply agreements with fixed or indexed pricing. This converts spot exposure into predictable cash flow.`,
      ventajas: [
        "No premium or collateral cost",
        "Reduces revenue volatility",
        "Strengthens commercial ties with key clients",
        "Top 6 clients = 61% of receivables — natural candidates",
      ],
      desventajas: [
        "Sacrifices upside if spot price rises significantly",
        "Concentrates credit risk on LP clients",
        "Requires commercial — not financial — negotiation",
      ],
      implementacion: "Immediate · Requires no financial intermediary",
    },
    {
      titulo:   "Natural Hedge via Cost Structure",
      icono:    "🏭",
      tipo:     "accent",
      desc:     `Autlán has vertical integration — it owns both the mines and the smelting plants. Its costs are relatively fixed in MXN. When Mn price drops, margins compress but costs do not rise proportionally. Self-generation of energy amplifies this natural protection.`,
      ventajas: [
        "Autlán has the lowest cost base in Latin America",
        "Vertical integration = lower net spot exposure",
        "Self-generation reduces energy cost component",
        "Requires no derivative instrument",
      ],
      desventajas: [
        "Does not eliminate revenue volatility",
        "In deep adverse scenarios (<$800/MT), natural hedge fails",
        "Requires continuous capex investment to maintain the edge",
      ],
      implementacion: "Already partly implemented · Expand self-generation",
    },
    {
      titulo:   "Product Portfolio Diversification",
      icono:    "⚡",
      tipo:     "accent",
      desc:     `EMD (electrolytic manganese dioxide) for batteries and Metallorum (gold) are the two segments that break correlation with the steel cycle. Metallorum's target (15% of revenues by 2028) acts as a natural hedge because gold rises in risk-off scenarios where manganese typically falls.`,
      ventajas: [
        "Gold and steel have negative correlation in risk-off",
        "EMD has structural battery demand — independent of steel",
        "Diversification increases Autlán's valuation multiple",
        "Already in progress — Metallorum active since 3Q25",
      ],
      desventajas: [
        "Metallorum is still <2% of revenues — limited impact today",
        "Requires years to reach the 15% target",
        "EMD requires technical validation by clients (underway)",
      ],
      implementacion: "In execution · Target 2028",
    },
    {
      titulo:   "Positioning for Gabon Ban 2029",
      icono:    "🌍",
      tipo:     "gold",
      desc:     `Gabon bans raw manganese ore exports starting January 2029. As an integrated producer with own mines, Autlán can position itself NOW to capture the structural price rise this will generate, securing long-term LP contracts with clients seeking supply security before the ban.`,
      ventajas: [
        "High certainty — ban legislated in Gabon",
        "Autlán has proximity advantage vs African producers",
        "LP contracts of 3-5 years signed now capture the upside",
        "Improves credit profile with rating agencies",
      ],
      desventajas: [
        "3-year horizon — no immediate benefit",
        "China may offset part with internal production",
        "Requires certainty on USMCA to expand capacity",
      ],
      implementacion: "Strategic · 2026-2029",
    },
  ] : [
    {
      titulo:   "Contratos de largo plazo (LP) con clientes",
      icono:    "📋",
      tipo:     "success",
      desc:     `La estrategia más efectiva disponible. Autlán puede ofrecer descuentos de 2-5% sobre el precio spot a cambio de contratos de suministro de 12-36 meses con precio fijo o indexado. Esto convierte la exposición al spot en ingresos predecibles.`,
      ventajas: [
        "Sin costo de prima ni colateral",
        "Reduce volatilidad de ingresos",
        "Fortalece relación comercial con clientes clave",
        "Top 6 clientes = 61% de receivables — candidatos naturales",
      ],
      desventajas: [
        "Sacrifica upside si precio sube significativamente",
        "Concentra riesgo de crédito en clientes LP",
        "Requiere negociación comercial — no financiera",
      ],
      implementacion: "Inmediata · No requiere intermediario financiero",
    },
    {
      titulo:   "Cobertura natural via estructura de costos",
      icono:    "🏭",
      tipo:     "accent",
      desc:     `Autlán tiene integración vertical — posee las minas y las plantas de fundición. Sus costos están relativamente fijos en MXN. Cuando el precio del Mn baja, el margen comprime pero los costos no suben proporcionalmente. La autogeneración de energía amplifica esta protección natural.`,
      ventajas: [
        "Autlán tiene la base de costo más baja de Latinoamérica",
        "Integración vertical = menor exposición neta al spot",
        "Autogeneración reduce componente energético del costo",
        "No requiere instrumento financiero derivado",
      ],
      desventajas: [
        "No elimina la volatilidad de ingresos",
        "En adverso profundo (<$800/MT) la cobertura natural falla",
        "Requiere inversión de capex continuo para mantener la ventaja",
      ],
      implementacion: "Ya implementada parcialmente · Ampliar autogeneración",
    },
    {
      titulo:   "Diversificación de cartera de productos",
      icono:    "⚡",
      tipo:     "accent",
      desc:     `EMD (electrolytic manganese dioxide) para baterías y Metallorum (oro) son los dos segmentos que rompen la correlación con el ciclo del acero. La meta de Metallorum (15% ingresos para 2028) actúa como cobertura natural porque el oro sube en escenarios de risk-off donde el manganeso típicamente cae.`,
      ventajas: [
        "Oro y acero tienen correlación negativa en risk-off",
        "EMD tiene demanda estructural de baterías — independiente del acero",
        "Diversificación aumenta el múltiplo de valuación de Autlán",
        "Ya en ejecución — Metallorum activo desde 3T25",
      ],
      desventajas: [
        "Metallorum aún es <2% de ingresos — impacto limitado hoy",
        "Requiere años para llegar al 15% objetivo",
        "EMD requiere validación técnica por clientes (ya en curso)",
      ],
      implementacion: "En ejecución · Meta 2028",
    },
    {
      titulo:   "Posicionamiento para Gabon ban 2029",
      icono:    "🌍",
      tipo:     "gold",
      desc:     `Gabon bana la exportación de mineral de manganeso crudo en enero 2029. Como productor integrado con minas propias, Autlán puede posicionarse AHORA para capturar el alza estructural de precios que esto generará, asegurando contratos LP de largo plazo con clientes que buscarán seguridad de suministro antes del ban.`,
      ventajas: [
        "Alta certeza — ban legislado en Gabon",
        "Autlán tiene ventaja de proximidad vs productores africanos",
        "Contratos LP de 3-5 años firmados ahora capturan el upside",
        "Mejora el perfil crediticio ante agencias de rating",
      ],
      desventajas: [
        "Horizonte de 3 años — beneficio no inmediato",
        "China puede compensar parte con producción interna",
        "Requiere certeza sobre USMCA para expandir capacidad",
      ],
      implementacion: "Estratégico · 2026-2029",
    },
  ];

  el.innerHTML = estrategias.map(e => `
    <div class="card">
      <div class="card-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">${e.icono}</span>
          <div>
            <div class="card-title">${e.titulo}</div>
            <div class="card-sub">${e.implementacion}</div>
          </div>
        </div>
        <span class="badge badge-${e.tipo}">${isEn ? (e.tipo === "gold" ? "STRATEGIC" : e.tipo.toUpperCase()) : e.tipo.toUpperCase()}</span>
      </div>

      <p style="font-size:12px; color:var(--text-secondary);
                line-height:1.6; margin-bottom:14px;">
        ${e.desc}
      </p>

      <div class="grid-2" style="gap:12px;">
        <div>
          <div style="font-size:10px; color:var(--success);
                      font-weight:700; margin-bottom:6px;">${isEn ? "ADVANTAGES" : "VENTAJAS"}</div>
          ${e.ventajas.map(v => `
            <div style="font-size:11px; color:var(--text-secondary);
                        margin-bottom:4px; display:flex; gap:6px;">
              <span style="color:var(--success); flex-shrink:0;">✓</span>
              <span>${v}</span>
            </div>`).join("")}
        </div>
        <div>
          <div style="font-size:10px; color:var(--danger);
                      font-weight:700; margin-bottom:6px;">${isEn ? "CONSIDERATIONS" : "CONSIDERACIONES"}</div>
          ${e.desventajas.map(d => `
            <div style="font-size:11px; color:var(--text-secondary);
                        margin-bottom:4px; display:flex; gap:6px;">
              <span style="color:var(--warn); flex-shrink:0;">▲</span>
              <span>${d}</span>
            </div>`).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// OPORTUNIDADES ESTRUCTURALES
// ─────────────────────────────────────────
function _mnRenderOportunidades() {
  const el = document.getElementById("mn-oportunidades");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio = Scenarios.getVar("precioMn");

  const cats = isEn ? [
    {
      titulo: "Gabon Ore Ban · January 2029",
      cert:   "High Certainty",
      color:  "var(--success-mid)",
      desc:   `Gabon represents ~25% of global high-grade ore supply. The ban forces buyers to look for alternatives — integrated producers like Autlán gain pricing power and contractual security. Estimated uplift is USD 50-100/MT for producers with captive ore from 2029.`,
      accion: "Sign 3-5 year LP contracts now with clients seeking pre-2029 supply security.",
    },
    {
      titulo: "India — Structural Steel Growth",
      cert:   "High Probability",
      color:  "var(--accent-mid)",
      desc:   `India grew +6.3% in steel production in 2024 and continues to expand. With installed capacity of 300 Mt by 2030, India will be the second largest consumer of manganese. Autlán has geographical export advantage via the Pacific.`,
      accion: "Develop commercial relationships with Indian steel producers — Tata Steel, JSW Steel, SAIL.",
    },
    {
      titulo: "LMFP Batteries — New Market",
      cert:   "Medium Probability · Long Term",
      color:  "var(--warn-mid)",
      desc:   `LFP (lithium-iron-phosphate) chemistry is evolving to LMFP (with manganese) to improve energy density. Autlán already has HPMSM capacity (high purity manganese sulfate) — key input for EV batteries. Quality validation by clients in 1Q25.`,
      accion: "Scale HPMSM production in EMD. Certify with EV OEMs for 2027+ contracts.",
    },
  ] : [
    {
      titulo: "Gabon ore ban · Enero 2029",
      cert:   "Alta certeza",
      color:  "var(--success-mid)",
      desc:   `Gabon representa ~25% del supply global de mineral de alta ley. El ban obliga a los compradores a buscar alternativas — productores integrados como Autlán ganan pricing power y seguridad contractual. El uplift estimado es USD 50-100/MT para productores con captive ore a partir de 2029.`,
      accion: "Firmar contratos LP de 3-5 años ahora con clientes que buscan seguridad de suministro pre-2029.",
    },
    {
      titulo: "India — crecimiento estructural de acero",
      cert:   "Alta probabilidad",
      color:  "var(--accent-mid)",
      desc:   `India creció +6.3% en producción de acero en 2024 y continúa expandiendo. Con capacidad instalada de 300 Mt para 2030, India será el segundo consumidor mundial de manganeso. Autlán tiene ventaja geográfica para exportar via Pacífico.`,
      accion: "Desarrollar relaciones comerciales con productores de acero indios — Tata Steel, JSW Steel, SAIL.",
    },
    {
      titulo: "Baterías LMFP — nuevo mercado",
      cert:   "Media probabilidad · Largo plazo",
      color:  "var(--warn-mid)",
      desc:   `La química LFP (litio-hierro-fosfato) está deparando a LMFP (con manganeso) para mejorar densidad energética. Autlán ya tiene capacidad de HPMSM (sulfato de manganeso de alta pureza) — el insumo clave para baterías de EV. Confirmación de calidad por clientes en Q1 2025.`,
      accion: "Escalar producción de HPMSM en EMD. Certificar con OEMs de EV para contratos 2027+.",
    },
  ];

  el.innerHTML = `
    <div class="grid-3" style="gap:16px;">
      ${cats.map(c => `
        <div style="padding:16px; background:var(--bg-raised);
                    border-radius:var(--radius-md);
                    border-top:3px solid ${c.color};">
          <div style="font-size:13px; font-weight:700; margin-bottom:4px;">
            ${c.titulo}
          </div>
          <div style="font-size:10px; color:#fff; background:${c.color};
                      padding:2px 8px; border-radius:4px;
                      display:inline-block; margin-bottom:10px;">
            ${c.cert}
          </div>
          <p style="font-size:11.5px; color:var(--text-secondary);
                    line-height:1.6; margin-bottom:10px;">
            ${c.desc}
          </p>
          <div style="font-size:11px; color:var(--text-primary);
                      background:var(--bg-surface); padding:8px 10px;
                      border-radius:var(--radius-sm);
                      border-left:2px solid ${c.color};">
            <strong>${isEn ? "Action:" : "Acción:"}</strong> ${c.accion}
          </div>
        </div>
      `).join("")}
    </div>

    <div class="alert alert-${precio > 1300 ? "success" : "warn"}"
         style="margin-top:16px;">
      <span class="alert-icon">
        ${precio > 1300 ? "📈" : "⚠"}
      </span>
      <span style="font-size:12px;">
        <strong>${isEn ? "Current stance:" : "Postura actual:"}</strong>
        ${isEn
          ? `With price at USD ${precio.toLocaleString()}/MT (17-month high), Autlán is in the optimal window to negotiate LP contracts with clients at favorable prices — locking in current levels before any correction.`
          : `Con precio en USD ${precio.toLocaleString()}/MT (máximo de 17 meses), Autlán está en el momento óptimo para negociar contratos LP con clientes a precios favorables — bloqueando el nivel actual antes de cualquier corrección.`}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// RECOMENDACIÓN
// ─────────────────────────────────────────
function _mnRenderRecomendacion() {
  const el = document.getElementById("mn-recomendacion");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio = Scenarios.getVar("precioMn");

  el.innerHTML = `
    <div class="card-title" style="margin-bottom:16px;">
      ${isEn ? `Stance Analysis · Manganese USD ${precio.toLocaleString()}/MT` : `Análisis de postura · Manganeso USD ${precio.toLocaleString()}/MT`}
    </div>

    <div class="grid-3" style="gap:16px; margin-bottom:16px;">
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--accent);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--accent); margin-bottom:6px;">
          ${isEn ? "WHAT RISK EXISTS" : "QUÉ RIESGO EXISTE"}
        </div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? "Manganese price drop driven by weak Chinese demand, Australian oversupply, or intensification of Asian dumping in Mexico. With ~90% of revenues in ferroalloys, Autlán has maximum concentration in a single commodity without formal financial hedging."
            : "Caída en precio del manganeso impulsada por debilidad de demanda china, oversupply australiano o intensificación del dumping asiático en México. Con ~90% de ingresos en ferroaleaciones, Autlán tiene concentración máxima en un solo commodity sin cobertura financiera formal."}
        </div>
      </div>
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--warn);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--warn); margin-bottom:6px;">
          ${isEn ? "WHY NO EFFICIENT DERIVATIVES EXIST" : "POR QUÉ NO HAY DERIVADOS EFICIENTES"}
        </div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? "The manganese OTC market exists but is inefficient: 7-10% bid-ask spread, very high minimum volumes, fragmented reference index, and elevated basis risk. The implicit cost makes financial hedging destroy more value than it protects."
            : "El mercado OTC de manganeso existe pero es ineficiente: spread bid-ask de 7-10%, volúmenes mínimos muy altos, índice de referencia fragmentado y basis risk elevado. El costo implícito hace que la cobertura financiera destruya más valor del que protege."}
        </div>
      </div>
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--success);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--success); margin-bottom:6px;">
          ${isEn ? "OPTIMAL STRATEGY" : "ESTRATEGIA ÓPTIMA"}
        </div>
        <div style="font-size:12px; line-height:1.6;">
          <strong>${isEn ? "Triple strategy:" : "Triple estrategia:"}</strong>
          ${isEn
            ? "(1) Fixed price LP contracts with top 6 clients for 30-40% of volume. (2) Early positioning for Gabon ban 2029. (3) Accelerate Metallorum towards 15% of revenues as anti-cyclical natural hedge."
            : "(1) Contratos LP precio fijo con top 6 clientes para 30-40% del volumen. (2) Posicionamiento anticipado para Gabon ban 2029. (3) Acelerar Metallorum hacia 15% de ingresos como cobertura natural anti-cíclica."}
        </div>
      </div>
    </div>

    <div class="alert alert-${precio > 1300 ? "success"
                             : precio > 1000 ? "warn" : "danger"}">
      <span class="alert-icon">
        ${precio > 1300 ? "✓" : precio > 1000 ? "⚠" : "🚨"}
      </span>
      <span style="font-size:12px;">
        <strong>${isEn ? "Current stance:" : "Postura actual:"}</strong>
        ${precio > 1300
          ? (isEn
              ? `Favorable price (USD ${precio.toLocaleString()}/MT). Optimal time to lock in LP contracts with clients before any correction. Natural hedging via vertical integration maintains positive margins even in the base scenario.`
              : `Precio favorable (USD ${precio.toLocaleString()}/MT). Momento óptimo para fijar contratos LP con clientes antes de cualquier corrección. La cobertura natural vía integración vertical mantiene márgenes positivos incluso en escenario base.`)
          : precio > 1000
          ? (isEn
              ? `Price in intermediate zone (USD ${precio.toLocaleString()}/MT). Positive but compressed margin. Prioritize LP contracts and reduce operating costs. Evaluate shifting sales mix to higher-margin markets (USA vs Mexico).`
              : `Precio en zona intermedia (USD ${precio.toLocaleString()}/MT). Margen positivo pero comprimido. Priorizar contratos LP y reducir costos operativos. Evaluar ajuste de mix de ventas hacia mercados con mejores márgenes (EEUU vs México).`)
          : (isEn
              ? `Price in critical zone (USD ${precio.toLocaleString()}/MT). Near production cost (~$900/MT), focus must be on cost reduction and drawdown of credit lines to cover the adverse cycle. Metallorum as critical alternative FCF source.`
              : `Precio en zona crítica (USD ${precio.toLocaleString()}/MT). Con precio cerca del costo de producción (~$900/MT), el foco debe ser reducción de costos y drawdown de líneas de crédito para cubrir el ciclo adverso. Metallorum como fuente crítica de FCF alternativo.`)}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// BIND & INIT
// ─────────────────────────────────────────
Scenarios.on("page:manganeso", () => {
  const el = document.getElementById("manganeso-content");
  if (el) renderManganeso();
});
