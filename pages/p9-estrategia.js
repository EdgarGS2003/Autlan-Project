/**
 * pages/p9-estrategia.js — Estrategia Óptima de Cobertura
 * Portafolio recomendado · Política 60% · P&L por escenario
 */

function renderEstrategia() {
  const el = document.getElementById("estrategia-content");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

  el.innerHTML = `

    <div class="alert alert-accent mb-24"
         style="background:var(--accent-light);
                border-color:rgba(27,79,138,0.2);
                color:var(--accent-dark);">
      <span class="alert-icon">★</span>
      <span>
        ${isEn
          ? `This page integrates all analyzed risks and hedges into an <strong>optimal hedging portfolio</strong> for Autlán. It respects internal policy (60% maximum), quantifies the total cost, and shows the P&L under each scenario. <strong>This is the final recommendation of the risk desk.</strong>`
          : `Esta página integra todos los riesgos y coberturas analizados en un <strong>portafolio de cobertura óptimo</strong> para Autlán. Respeta la política interna (60% máximo), cuantifica el costo total y muestra el P&L en cada escenario. <strong>Esta es la recomendación final de la mesa de riesgos.</strong>`}
      </span>
    </div>

    <!-- RESUMEN EJECUTIVO -->
    <div class="section-title">
      ${isEn ? "Executive Summary · Current vs Recommended Position" : "Resumen ejecutivo · Posición actual vs recomendada"}
    </div>
    <div class="card mb-24" id="est-resumen"></div>

    <!-- PORTAFOLIO DE COBERTURAS -->
    <div class="section-title">
      ${isEn ? "Recommended Hedging Portfolio" : "Portafolio de coberturas recomendado"}
    </div>
    <div class="card mb-24" id="est-portafolio"></div>

    <!-- TABLA MAESTRA DE ESCENARIOS -->
    <div class="section-title">
      ${isEn ? "Master Table · Unhedged Cash Flow vs Complete Strategy" : "Tabla maestra · Flujo sin cobertura vs con estrategia completa"}
    </div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>${isEn ? "Concept" : "Concepto"}</th>
            <th class="esc-header-base">${isEn ? "Base" : "Base"}</th>
            <th class="esc-header-opt">${isEn ? "Optimistic" : "Optimista"}</th>
            <th class="esc-header-adv">${isEn ? "Adverse" : "Adverso"}</th>
          </tr>
        </thead>
        <tbody id="est-tabla-maestra"></tbody>
      </table>
    </div>

    <!-- COSTO DE LA ESTRATEGIA -->
    <div class="section-title">
      ${isEn ? "Total Cost of the Strategy" : "Costo total de la estrategia"}
    </div>
    <div class="card mb-24" id="est-costo"></div>

    <!-- TRADEOFF EXPLÍCITO -->
    <div class="section-title">
      ${isEn ? "Explicit Tradeoff · What I Eliminated · What I Accepted · What I Sacrificed" : "Tradeoff explícito · Qué eliminé · Qué acepté · Qué sacrifiqué"}
    </div>
    <div class="card mb-24" id="est-tradeoff"></div>

    <!-- PAYOFF INTEGRADO -->
    <div class="section-title">
      ${isEn ? "Integrated Payoff · EBITDA With and Without Hedging Strategy" : "Payoff integrado · EBITDA con y sin estrategia de cobertura"}
    </div>
    <div class="card mb-24">
      <div class="chart-title">
        ${isEn
          ? "Impact on projected EBITDA under different USD/MXN levels — with and without complete hedging portfolio"
          : "Impacto en EBITDA proyectado bajo diferentes niveles de USD/MXN — con y sin portafolio de cobertura completo"}
      </div>
      <canvas id="est-payoff-chart" height="220"></canvas>
      <div id="est-chart-leyenda"
           style="display:flex; gap:16px; margin-top:12px;
                  flex-wrap:wrap; font-size:11px;"></div>
    </div>

    <!-- CONCLUSIÓN FINAL -->
    <div class="section-title">
      ${isEn ? "Risk Desk Conclusion" : "Conclusión de la mesa de riesgos"}
    </div>
    <div class="card mb-24" id="est-conclusion"></div>

    <!-- BOTÓN EXPORTAR -->
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="exportarEstrategia()">
        ${isEn ? "↓ Export Complete Strategy (CSV)" : "↓ Exportar estrategia completa (CSV)"}
      </button>
      <button class="btn btn-ghost" onclick="window.print()">
        ${isEn ? "🖨 Print / PDF" : "🖨 Imprimir / PDF"}
      </button>
    </div>

  `;

  _estRenderResumen();
  _estRenderPortafolio();
  _estRenderTablaMaestra();
  _estRenderCosto();
  _estRenderTradeoff();
  _estRenderPayoffChart();
  _estRenderConclusion();

  Scenarios.on("calc:update",       _estRenderTablaMaestra);
  Scenarios.on("escenarios:update", _estRenderTablaMaestra);
  Scenarios.on("var:usdmxn",        _estRenderPayoffChart);
}

// ─────────────────────────────────────────
// PORTAFOLIO RECOMENDADO — definición central
// ─────────────────────────────────────────
function _getPortafolio() {
  const isEn = I18N.getLocale() === "en";
  const tc   = Scenarios.getVar("usdmxn");
  const tiie = Scenarios.getVar("tiie28");
  const sofr = Scenarios.getVar("sofr1m");
  const oro  = Scenarios.getVar("precioOro");
  const gas  = Scenarios.getVar("precioGas");

  return [
    {
      id:          "COB-FX-01",
      riesgo:      isEn ? "Exchange rate" : "Tipo de cambio",
      instrumento: isEn ? "USD/MXN Collar (costless)" : "Collar USD/MXN (costless)",
      descripcion: isEn ? "4 additional monthly collars · USD 4M/month" : "4 collares mensuales adicionales · USD 4M/mes",
      floor:       17.40,
      cap:         18.40,
      nocional:    48000,   // USD miles — 12 meses × USD 4M/mes
      pctExposicion: 14.5, // % de ingresos anualizados
      costoNeto:   0,       // costless
      horizonte:   isEn ? "12 months" : "12 meses",
      mercado:     "OTC",
      estado:      isEn ? "RECOMMENDED" : "RECOMENDADO",
      color:       "var(--accent)",
      payoff: (tcFinal) => {
        // Collar: protege si TC < floor, limita si TC > cap
        const payoffMes = tcFinal < 17.40
          ? (17.40 - tcFinal) * 4000
          : tcFinal > 18.40
          ? (18.40 - tcFinal) * 4000
          : 0;
        return payoffMes * 12; // anualizado
      },
    },
    {
      id:          "COB-FX-02",
      riesgo:      isEn ? "Exchange rate" : "Tipo de cambio",
      instrumento: isEn ? "Complementary USD/MXN Forward" : "Forward USD/MXN complementario",
      descripcion: isEn ? "Forward for months 7-12 · USD 2M/month" : "Forward para meses 7-12 · USD 2M/mes",
      strikeForward: Models.forwardPrice(tc, tiie/100, sofr/100, 0.75).forward,
      nocional:    24000,   // USD 2M × 12 meses
      pctExposicion: 7.3,
      costoNeto:   0,
      horizonte:   isEn ? "6-12 months" : "6-12 meses",
      mercado:     "OTC",
      estado:      isEn ? "RECOMMENDED" : "RECOMENDADO",
      color:       "var(--accent-mid)",
      payoff: (tcFinal) => {
        const fwd = Models.forwardPrice(tc, tiie/100, sofr/100, 0.75).forward;
        return (fwd - tcFinal) * 24000;
      },
    },
    {
      id:          "COB-ORO-01",
      riesgo:      isEn ? "Gold Price" : "Precio del Oro",
      instrumento: isEn ? "Gold Costless Collar" : "Costless Collar oro",
      descripcion: isEn ? "Collar $2,700–$3,300/oz · 260K oz (~50% prod.)" : "Collar $2,700–$3,300/oz · 260K oz (~50% prod.)",
      floor:       2700,
      cap:         3300,
      nocional:    260000,  // oz
      nocionalUSD: 260000 * oro / 1000, // USD miles
      pctExposicion: 50,
      costoNeto:   0,
      horizonte:   isEn ? "12 months" : "12 meses",
      mercado:     "OTC",
      estado:      isEn ? "RECOMMENDED" : "RECOMENDADO",
      color:       "var(--gold)",
      payoff: (oroFinal) => {
        const ef = Math.min(Math.max(oroFinal, 2700), 3300);
        return (ef - oroFinal) * 260; // USD miles
      },
    },
    {
      id:          "COB-TASA-01",
      riesgo:      isEn ? "Interest rate (SOFR)" : "Tasa de interés (SOFR)",
      instrumento: isEn ? "IRS SOFR — variable to fixed" : "IRS SOFR — variable a fija",
      descripcion: isEn ? "Swap 50% SOFR debt · USD 67M · fixed 4.50%" : "Swap 50% deuda SOFR · USD 67M · fija 4.50%",
      tasaFija:    4.50,
      nocional:    67000,  // USD miles
      pctExposicion: 49.4, // % deuda SOFR cubierta
      costoNeto:   (sofr - 4.50) * 67000 / 100, // positivo si SOFR > fija
      horizonte:   isEn ? "3 years" : "3 años",
      mercado:     "OTC",
      estado:      isEn ? "RECOMMENDED" : "RECOMENDADO",
      color:       "var(--warn-mid)",
      payoff: (sofrFinal) => (sofrFinal - 4.50) * 67000 / 100,
    },
    {
      id:          "COB-TASA-02",
      riesgo:      isEn ? "Interest rate (TIIE)" : "Tasa de interés (TIIE)",
      instrumento: isEn ? "Active TIIE Collar (maintain)" : "Collar TIIE existente (mantener)",
      descripcion: isEn ? "Collar 8.75%–11% · MXN 157.6M · Matures 2028" : "Collar 8.75%–11% · MXN 157.6M · Vence 2028",
      floor:       8.75,
      cap:         11.00,
      nocionalMXN: 157584,
      nocionalUSD: 157584 / tc,
      pctExposicion: 50,
      costoNeto:   -AUTLAN.derivadosVigentes.collarTasa.mtm.minusvalia1T26.valor,
      horizonte:   isEn ? "Until Jun 2028" : "Hasta jun-2028",
      mercado:     "OTC",
      estado:      isEn ? "EXISTING — MAINTAIN" : "EXISTENTE — MANTENER",
      color:       "var(--warn)",
      payoff: (tiieFinal) => {
        const ef     = Math.min(Math.max(tiieFinal, 8.75), 11.0);
        const nocUSD = 157584 / tc;
        return (tiieFinal - ef) * nocUSD / 100;
      },
    },
  ];
}

// ─────────────────────────────────────────
// RESUMEN EJECUTIVO
// ─────────────────────────────────────────
function _estRenderResumen() {
  const el = document.getElementById("est-resumen");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;
  const port = _getPortafolio();

  const nocFX = port
    .filter(p => p.riesgo === (isEn ? "Exchange rate" : "Tipo de cambio"))
    .reduce((s, p) => s + p.nocional, 0);
  const pctFXTotal = (exp.coberturaFX_nocional.valor + nocFX) /
                     exp.ingresosFX_anualizado.valor * 100;

  el.innerHTML = `
    <div class="grid-3" style="gap:16px; margin-bottom:20px;">
      ${[
        {
          label: isEn ? "Current FX Hedging" : "Cobertura FX actual",
          value: `${exp.pctCubierto_FX.valor}%`,
          nuevo: `${Math.min(pctFXTotal, 60).toFixed(0)}%`,
          tipo:  "danger",
        },
        {
          label: isEn ? "Gold Hedging" : "Cobertura Oro",
          value: "0%",
          nuevo: "50%",
          tipo:  "danger",
        },
        {
          label: isEn ? "SOFR Hedging" : "Cobertura SOFR",
          value: "0%",
          nuevo: "49%",
          tipo:  "warn",
        },
      ].map(k => `
        <div class="kpi-card ${k.tipo}">
          <div class="kpi-label">${k.label}</div>
          <div style="display:flex; align-items:center;
                      gap:8px; margin:8px 0;">
            <span style="font-size:18px; font-family:var(--font-mono);
                         font-weight:700; color:var(--danger);">
              ${k.value}
            </span>
            <span style="font-size:16px; color:var(--text-muted);">→</span>
            <span style="font-size:18px; font-family:var(--font-mono);
                         font-weight:700; color:var(--success);">
              ${k.nuevo}
            </span>
          </div>
          <div class="kpi-sub">${isEn ? "Current → With Strategy" : "Actual → Con estrategia"}</div>
        </div>
      `).join("")}
    </div>

    <div class="grid-3" style="gap:16px;">
      ${[
        {
          titulo: isEn ? "Strategy Objective" : "Objetivo de la estrategia",
          items: isEn ? [
            "Protect cash flows in adverse scenarios",
            "Respect internal policy (60% max per risk)",
            "Minimize total hedging cost",
            "Maintain moderate upside in optimistic scenarios",
          ] : [
            "Proteger flujos de caja en escenario adverso",
            "Respetar política interna (máx 60% por riesgo)",
            "Minimizar costo total de cobertura",
            "Mantener upside moderado en escenario optimista",
          ],
          color: "var(--accent)",
        },
        {
          titulo: isEn ? "Design Principles" : "Principios de diseño",
          items: isEn ? [
            "Prioritize costless collars — zero premium",
            "Horizons aligned with business cycles",
            "Only investment grade counterparties",
            "IFRS 9 hedge accounting from inception",
          ] : [
            "Priorizar costless collars — prima cero",
            "Horizontes alineados con ciclo de negocio",
            "Solo contrapartes investment grade",
            "Tratamiento contable IFRS 9 desde contratación",
          ],
          color: "var(--success)",
        },
        {
          titulo: isEn ? "Respected Constraints" : "Restricciones respetadas",
          items: isEn ? [
            "FX: max 60% USD revenues (formal policy)",
            "Horizon: max 12 months in FX (formal policy)",
            "Only permitted instruments in policy",
            "DSCR 0.6x — no significant liquidity impact",
          ] : [
            "FX: máx 60% ingresos USD (política formal)",
            "Horizonte máx 12 meses en FX (política formal)",
            "Solo instrumentos permitidos en política",
            "DSCR 0.6x — sin impacto de liquidez significativo",
          ],
          color: "var(--warn)",
        },
      ].map(s => `
        <div style="padding:14px; background:var(--bg-raised);
                    border-radius:var(--radius-md);
                    border-top:3px solid ${s.color};">
          <div style="font-size:12px; font-weight:700;
                      margin-bottom:10px;">${s.titulo}</div>
          ${s.items.map(i => `
            <div style="font-size:11.5px; color:var(--text-secondary);
                        margin-bottom:5px; display:flex; gap:6px;">
              <span style="color:${s.color}; flex-shrink:0;">${isEn ? "•" : "◎"}</span>
              <span>${i}</span>
            </div>`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

// ─────────────────────────────────────────
// PORTAFOLIO DETALLADO
// ─────────────────────────────────────────
function _estRenderPortafolio() {
  const el = document.getElementById("est-portafolio");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const port = _getPortafolio();
  const tc   = Scenarios.getVar("usdmxn");

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>${isEn ? "Risk" : "Riesgo"}</th>
            <th>${isEn ? "Instrument" : "Instrumento"}</th>
            <th>${isEn ? "Description" : "Descripción"}</th>
            <th style="text-align:right;">${isEn ? "Notional (USD M)" : "Nocional (USD M)"}</th>
            <th style="text-align:right;">${isEn ? "% Exposure" : "% Exposición"}</th>
            <th style="text-align:right;">${isEn ? "Net cost" : "Costo neto"}</th>
            <th>${isEn ? "Horizon" : "Horizonte"}</th>
            <th>${isEn ? "Status" : "Estado"}</th>
          </tr>
        </thead>
        <tbody>
          ${port.map(p => {
            const noc = p.nocionalUSD
              ? p.nocionalUSD / 1000
              : p.nocionalMXN
              ? (p.nocionalMXN / tc) / 1000
              : p.nocional / 1000;
            const costo = p.costoNeto || 0;

            let netCostStr = "Costless";
            if (costo !== 0) {
              netCostStr = isEn
                ? `USD ${Math.abs(costo/1000).toFixed(1)}M ${costo > 0 ? "saving" : "premium"}`
                : `USD ${Math.abs(costo/1000).toFixed(1)}M ${costo > 0 ? "ahorro" : "prima"}`;
            }

            return `
              <tr>
                <td class="mono text-muted" style="font-size:10.5px;">
                  ${p.id}
                </td>
                <td>
                  <span style="display:inline-block; width:8px; height:8px;
                                border-radius:50%; background:${p.color};
                                margin-right:6px;"></span>
                  ${p.riesgo}
                </td>
                <td style="font-size:12px; font-weight:500;">
                  ${p.instrumento}
                </td>
                <td style="font-size:11px; color:var(--text-secondary);">
                  ${p.descripcion}
                </td>
                <td class="mono" style="text-align:right;">
                  ${noc.toFixed(1)}M
                </td>
                <td class="mono" style="text-align:right;">
                  ${p.pctExposicion.toFixed(1)}%
                </td>
                <td class="mono ${costo >= 0 ? "positive" : "warn"}"
                    style="text-align:right;">
                  ${netCostStr}
                </td>
                <td style="font-size:11.5px;">${p.horizonte}</td>
                <td>
                  <span class="badge ${
                    p.estado.includes("EXISTENTE") || p.estado.includes("EXISTING") ? "badge-warn"
                    : "badge-success"}">
                    ${p.estado.includes("EXISTENTE") || p.estado.includes("EXISTING") ? (isEn ? "EXISTING" : "EXISTENTE") : (isEn ? "NEW" : "NUEVO")}
                  </span>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>

    <div style="margin-top:12px; font-size:11px; color:var(--text-muted);">
      ${isEn
        ? `* Notionals in USD equivalent at current exchange rate ($${tc.toFixed(2)}). Costless collars have no premium cost — the premium of the sold call finances the purchased put.`
        : `* Nocionales en USD equivalente al tipo de cambio actual ($${tc.toFixed(2)}). Los costless collars no tienen costo de prima — la prima del call vendido financia el put comprado.`}
    </div>
  `;
}

// ─────────────────────────────────────────
// TABLA MAESTRA DE ESCENARIOS
// ─────────────────────────────────────────
function _estRenderTablaMaestra() {
  const el = document.getElementById("est-tabla-maestra");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const cache = Scenarios.getCache();
  if (!cache.escenarios) return;

  const B  = cache.escenarios.base;
  const O  = cache.escenarios.optimista;
  const A  = cache.escenarios.adverso;
  const esc = Scenarios.getState().escenarios;
  const port = _getPortafolio();
  const fmt  = Scenarios.fmt;

  // Calcular protección total por escenario
  const calcProteccion = (escVars) => {
    let total = 0;
    for (const p of port) {
      if (p.payoff) {
        if (p.riesgo === (isEn ? "Exchange rate" : "Tipo de cambio")) {
          total += p.payoff(escVars.usdmxn);
        } else if (p.riesgo === (isEn ? "Gold Price" : "Precio del Oro")) {
          total += p.payoff(escVars.precioOro);
        } else if (p.riesgo === (isEn ? "Natural Gas" : "Gas Natural")) {
          total += p.payoff(escVars.precioGas);
        } else if (p.riesgo.includes("SOFR")) {
          total += p.payoff(escVars.sofr1m);
        } else if (p.riesgo.includes("TIIE")) {
          total += p.payoff(escVars.tiie28);
        }
      }
    }
    return total;
  };

  const costoTotal = port.reduce((s, p) =>
    s + Math.min(p.costoNeto || 0, 0), 0);

  const protB = calcProteccion(esc.base);
  const protO = calcProteccion(esc.optimista);
  const protA = calcProteccion(esc.adverso);

  const ebitdaConB = B.resultados.ebitda + protB + costoTotal;
  const ebitdaConO = O.resultados.ebitda + protO + costoTotal;
  const ebitdaConA = A.resultados.ebitda + protA + costoTotal;

  const fcfConB = B.resultados.fcf + protB + costoTotal;
  const fcfConO = O.resultados.fcf + protO + costoTotal;
  const fcfConA = A.resultados.fcf + protA + costoTotal;

  const row = (label, vB, vO, vA, highlight, clsB, clsO, clsA) => `
    <tr class="${highlight ? "row-highlight" : ""}">
      <td style="font-weight:${highlight ? "700" : "400"};">${label}</td>
      <td class="esc-base mono ${clsB || ""}">${vB}</td>
      <td class="esc-optimista mono ${clsO || ""}">${vO}</td>
      <td class="esc-adverso mono ${clsA || ""}">${vA}</td>
    </tr>`;

  const divider = () => `
    <tr>
      <td colspan="4" style="padding:3px 0;
          background:var(--bg-raised);">
        <div style="height:1px; background:var(--border);"></div>
      </td>
    </tr>`;

  const cls = (v) => v >= 0 ? "positive" : "negative";

  el.innerHTML = [
    row("USD / MXN",
      fmt.fx(esc.base.usdmxn),
      fmt.fx(esc.optimista.usdmxn),
      fmt.fx(esc.adverso.usdmxn)),
    row(isEn ? "Manganese price" : "Precio manganeso",
      fmt.mn(esc.base.precioMn),
      fmt.mn(esc.optimista.precioMn),
      fmt.mn(esc.adverso.precioMn)),
    row(isEn ? "Gold price" : "Precio oro",
      fmt.oro(esc.base.precioOro),
      fmt.oro(esc.optimista.precioOro),
      fmt.oro(esc.adverso.precioOro)),
    row("TIIE 28d",
      fmt.tasa(esc.base.tiie28),
      fmt.tasa(esc.optimista.tiie28),
      fmt.tasa(esc.adverso.tiie28)),
    divider(),
    row(isEn ? "EBITDA without hedging" : "EBITDA sin cobertura",
      fmt.usd(B.resultados.ebitda),
      fmt.usd(O.resultados.ebitda),
      fmt.usd(A.resultados.ebitda),
      true,
      cls(B.resultados.ebitda),
      cls(O.resultados.ebitda),
      cls(A.resultados.ebitda)),
    row(isEn ? "Hedging protection" : "Protección coberturas",
      fmt.usd(protB),
      fmt.usd(protO),
      fmt.usd(protA),
      false,
      cls(protB), cls(protO), cls(protA)),
    row(isEn ? "Strategy cost" : "Costo estrategia",
      fmt.usd(costoTotal),
      fmt.usd(costoTotal),
      fmt.usd(costoTotal),
      false, "warn", "warn", "warn"),
    row(isEn ? "EBITDA with strategy" : "EBITDA con estrategia",
      fmt.usd(ebitdaConB),
      fmt.usd(ebitdaConO),
      fmt.usd(ebitdaConA),
      true,
      cls(ebitdaConB), cls(ebitdaConO), cls(ebitdaConA)),
    divider(),
    row(isEn ? "FCF without hedging" : "FCF sin cobertura",
      fmt.usd(B.resultados.fcf),
      fmt.usd(O.resultados.fcf),
      fmt.usd(A.resultados.fcf),
      false,
      cls(B.resultados.fcf),
      cls(O.resultados.fcf),
      cls(A.resultados.fcf)),
    row(isEn ? "FCF with strategy" : "FCF con estrategia",
      fmt.usd(fcfConB),
      fmt.usd(fcfConO),
      fmt.usd(fcfConA),
      true,
      cls(fcfConB), cls(fcfConO), cls(fcfConA)),
    divider(),
    row(isEn ? "DSCR without hedging" : "DSCR sin cobertura",
      B.resultados.dscr.toFixed(2) + "x",
      O.resultados.dscr.toFixed(2) + "x",
      A.resultados.dscr.toFixed(2) + "x",
      false,
      B.resultados.dscr >= 1 ? "positive" : "negative",
      O.resultados.dscr >= 1 ? "positive" : "negative",
      A.resultados.dscr >= 1 ? "positive" : "negative"),
    row(isEn ? "DSCR with strategy" : "DSCR con estrategia",
      (ebitdaConB / B.resultados.gastoFin).toFixed(2) + "x",
      (ebitdaConO / O.resultados.gastoFin).toFixed(2) + "x",
      (ebitdaConA / A.resultados.gastoFin).toFixed(2) + "x",
      true,
      ebitdaConB / B.resultados.gastoFin >= 1 ? "positive" : "negative",
      ebitdaConO / O.resultados.gastoFin >= 1 ? "positive" : "negative",
      ebitdaConA / A.resultados.gastoFin >= 1 ? "positive" : "negative"),
  ].join("");
}

// ─────────────────────────────────────────
// COSTO TOTAL
// ─────────────────────────────────────────
function _estRenderCosto() {
  const el = document.getElementById("est-costo");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const port     = _getPortafolio();
  const ebitda   = 31470; // USD K base
  const tc       = Scenarios.getVar("usdmxn");

  const items = port.map(p => {
    const noc = p.nocionalUSD
      ? p.nocionalUSD / 1000
      : p.nocionalMXN
      ? (p.nocionalMXN / tc) / 1000
      : p.nocional / 1000;
    const costo = p.costoNeto || 0;
    return { ...p, nocM: noc, costo };
  });

  const costoTotal = items.reduce((s, i) =>
    s + Math.min(i.costo, 0), 0);
  const ahorroTotal = items.reduce((s, i) =>
    s + Math.max(i.costo, 0), 0);
  const costoNeto  = costoTotal + ahorroTotal;
  const pctEBITDA  = (Math.abs(costoTotal) / ebitda * 100).toFixed(1);

  el.innerHTML = `
    <div class="grid-2" style="gap:24px;">

      <div>
        <div class="section-title" style="margin-top:0;">
          ${isEn ? "Cost Breakdown by Instrument" : "Desglose de costos por instrumento"}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${isEn ? "Instrument" : "Instrumento"}</th>
                <th style="text-align:right;">${isEn ? "Notional" : "Nocional"}</th>
                <th style="text-align:right;">${isEn ? "Annual Cost / Saving" : "Costo / Ahorro anual"}</th>
                <th style="text-align:right;">% EBITDA</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(i => {
                let instCostStr = "Costless";
                if (i.costo !== 0) {
                  instCostStr = isEn
                    ? `${i.costo > 0 ? "+" : ""}USD ${(i.costo/1000).toFixed(1)}M`
                    : `${i.costo > 0 ? "+" : ""}USD ${(i.costo/1000).toFixed(1)}M`;
                }

                return `
                  <tr>
                    <td style="font-size:12px;">${i.instrumento}</td>
                    <td class="mono" style="text-align:right;">
                      USD ${i.nocM.toFixed(1)}M
                    </td>
                    <td class="mono ${i.costo >= 0 ? "positive" : "warn"}"
                        style="text-align:right;">
                      ${instCostStr}
                    </td>
                    <td class="mono" style="text-align:right;
                        color:var(--text-muted);">
                      ${i.costo === 0
                        ? "0%"
                        : `${(Math.abs(i.costo)/ebitda*100).toFixed(1)}%`}
                    </td>
                  </tr>
                `;
              }).join("")}
              <tr style="background:var(--bg-raised); font-weight:700;">
                <td>${isEn ? "TOTAL STRATEGY" : "TOTAL ESTRATEGIA"}</td>
                <td class="mono" style="text-align:right;">—</td>
                <td class="mono ${costoNeto >= 0 ? "positive" : "warn"}"
                    style="text-align:right;">
                  ${costoNeto >= 0
                    ? `+USD ${(costoNeto/1000).toFixed(1)}M ${isEn ? "saving" : "ahorro"}`
                    : `USD ${(Math.abs(costoNeto)/1000).toFixed(1)}M ${isEn ? "cost" : "costo"}`}
                </td>
                <td class="mono" style="text-align:right;">
                  ${pctEBITDA}% EBITDA
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="section-title" style="margin-top:0;">
          ${isEn ? "Cost Summary" : "Resumen de costo"}
        </div>

        ${_resultRow(isEn ? "Costless instruments" : "Instrumentos costless", isEn ? `${items.filter(i => i.costo === 0).length} of ${items.length}` : `${items.filter(i => i.costo === 0).length} de ${items.length}`)}
        ${_resultRow(isEn ? "Paid premium costs" : "Costo de primas pagadas",
                      `USD ${(Math.abs(costoTotal)/1000).toFixed(1)}M`,
                      Math.abs(costoTotal) > 5000 ? "danger" : "warn")}
        ${_resultRow(isEn ? "Savings from ITM positions" : "Ahorro por posiciones en dinero",
                      `+USD ${(ahorroTotal/1000).toFixed(1)}M`, "positive")}
        ${_resultRow(isEn ? "Total net cost" : "Costo neto total",
                      costoNeto >= 0
                        ? `+USD ${(costoNeto/1000).toFixed(1)}M (${isEn ? "net saving" : "ahorro neto"})`
                        : `USD ${(Math.abs(costoNeto)/1000).toFixed(1)}M`,
                      costoNeto >= 0 ? "positive" : "warn")}
        ${_resultRow(isEn ? "As % of base EBITDA" : "Como % del EBITDA base",
                      `${pctEBITDA}% — ${isEn ? "acceptable threshold < 5%" : "umbrial aceptable < 5%"}`,
                      parseFloat(pctEBITDA) < 5 ? "positive" : "warn")}

        <div class="alert alert-success" style="margin-top:14px;">
          <span class="alert-icon">✓</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? "The strategy prioritizes costless instruments (premium-free collars). The net cost is minimal as a % of EBITDA and well within the acceptable threshold for a corporate hedging policy."
              : "La estrategia prioriza instrumentos costless (collares sin prima). El costo neto es mínimo como % del EBITDA y dentro del umbral aceptable para una política de cobertura corporativa."}
          </span>
        </div>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// TRADEOFF EXPLÍCITO
// ─────────────────────────────────────────
function _estRenderTradeoff() {
  const el = document.getElementById("est-tradeoff");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

  const data = isEn ? {
    elim: {
      title: "✓ WHAT RISK I ELIMINATED",
      items: [
        "USD/MXN drop < $17.40 — FX collar protects completely",
        "Gold price drop < $2,700/oz — gold collar triggers",
        "Natural gas spike > $3.35/MMBtu — swap locks in the cost",
        "SOFR rise > 4.50% — IRS locks rate on USD 67M debt",
        "TIIE rise > 11% — active collar cap limits the ceiling",
        "Extreme EBITDA volatility in the adverse scenario",
      ]
    },
    accept: {
      title: "⚠ WHAT RISK I ACCEPT",
      items: [
        "Manganese without formal financial hedging — inefficient OTC market",
        "40-50% of FX revenues still unhedged (up to policy limit)",
        "OTC counterparty risk — mitigated with IG banks",
        "Basis risk between derivative index and actual client price",
        "TIIE between 8.75% and floor — collar OTM until rate rises",
        "July 2026 USMCA risk — not covered with derivatives (political tail risk)",
      ]
    },
    sacr: {
      title: "✗ WHAT UPSIDE I SACRIFICE",
      items: [
        "USD/MXN > $18.40 — FX collar limits additional revenues",
        "Gold > $3,300/oz — gold collar yields extra gain",
        "Natural gas < $3.35/MMBtu — swap pays fixed even if spot is lower",
        "SOFR < 4.50% — IRS pays fixed rate even if SOFR drops",
        "Full benefit of a weaker peso in the optimistic scenario",
        "Implicit premium paid in gas swap (~USD 0.15/MMBtu over spot)",
      ]
    }
  } : {
    elim: {
      title: "✓ QUÉ RIESGO ELIMINÉ",
      items: [
        "Caída de USD/MXN < $17.40 — collar FX protege completamente",
        "Caída del oro < $2,700/oz — collar oro actúa",
        "Alza de gas > $3.35/MMBtu — swap fija el costo",
        "Alza SOFR > 4.50% — IRS fija la tasa de USD 67M",
        "TIIE > 11% — cap del collar existente limita el techo",
        "Volatilidad extrema de EBITDA en escenario adverso",
      ]
    },
    accept: {
      title: "⚠ QUÉ RIESGO ACEPTO",
      items: [
        "Manganeso sin cobertura financiera formal — mercado OTC ineficiente",
        "40-50% de ingresos FX aún sin cubrir (hasta límite de política)",
        "Riesgo de contraparte OTC — mitigado con bancos IG",
        "Basis risk entre índice del derivado y precio real de cliente",
        "TIIE entre 8.75% y floor — collar OTM hasta que suba la tasa",
        "Riesgo USMCA julio 2026 — no cubierto con derivado (tail risk político)",
      ]
    },
    sacr: {
      title: "✗ QUÉ UPSIDE SACRIFICO",
      items: [
        "USD/MXN > $18.40 — collar FX limita el ingreso adicional",
        "Oro > $3,300/oz — collar oro cede la ganancia extra",
        "Gas < $3.35/MMBtu — swap paga el precio fijo aunque mercado esté más bajo",
        "SOFR < 4.50% — IRS paga tasa fija aunque SOFR baje",
        "Beneficio total de un peso más débil en escenario optimista",
        "Prima pagada en swap gas (~USD 0.15/MMBtu sobre spot)",
      ]
    }
  };

  el.innerHTML = `
    <div class="grid-3" style="gap:16px;">

      <div style="padding:18px; background:var(--success-light);
                  border-radius:var(--radius-lg);
                  border:1px solid rgba(45,125,78,0.2);">
        <div style="font-size:13px; font-weight:700;
                    color:var(--success); margin-bottom:12px;">
          ${data.elim.title}
        </div>
        ${data.elim.items.map(i => `
          <div style="font-size:11.5px; color:var(--success);
                      margin-bottom:6px; display:flex; gap:6px;">
            <span style="flex-shrink:0;">◎</span>
            <span>${i}</span>
          </div>`).join("")}
      </div>

      <div style="padding:18px; background:var(--warn-light);
                  border-radius:var(--radius-lg);
                  border:1px solid rgba(139,94,10,0.2);">
        <div style="font-size:13px; font-weight:700;
                    color:var(--warn); margin-bottom:12px;">
          ${data.accept.title}
        </div>
        ${data.accept.items.map(i => `
          <div style="font-size:11.5px; color:var(--warn);
                      margin-bottom:6px; display:flex; gap:6px;">
            <span style="flex-shrink:0;">△</span>
            <span>${i}</span>
          </div>`).join("")}
      </div>

      <div style="padding:18px; background:var(--danger-light);
                  border-radius:var(--radius-lg);
                  border:1px solid rgba(155,35,53,0.2);">
        <div style="font-size:13px; font-weight:700;
                    color:var(--danger); margin-bottom:12px;">
          ${data.sacr.title}
        </div>
        ${data.sacr.items.map(i => `
          <div style="font-size:11.5px; color:var(--danger);
                      margin-bottom:6px; display:flex; gap:6px;">
            <span style="flex-shrink:0;">✗</span>
            <span>${i}</span>
          </div>`).join("")}
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// PAYOFF INTEGRADO
// ─────────────────────────────────────────
function _estRenderPayoffChart() {
  const canvas = document.getElementById("est-payoff-chart");
  if (!canvas) return;

  const isEn = I18N.getLocale() === "en";
  const ctx = canvas.getContext("2d");
  const w   = canvas.offsetWidth || 600;
  const h   = canvas.height      || 220;
  canvas.width = w;

  const port    = _getPortafolio();
  const base    = 31470; // EBITDA base USD K
  const tiie    = Scenarios.getVar("tiie28");
  const sofr    = Scenarios.getVar("sofr1m");
  const oro     = Scenarios.getVar("precioOro");
  const gas     = Scenarios.getVar("precioGas");

  const tcs = [];
  for (let tc = 14.0; tc <= 22.0; tc += 0.1)
    tcs.push(parseFloat(tc.toFixed(2)));

  // EBITDA sin cobertura — función del TC
  const ebitdaSin = (tc) => {
    const deltaTC = (tc - 18.0) / 18.0;
    return base + base * deltaTC * 0.85 * 0.6;
  };

  // Protección del portafolio en función del TC
  // (solo los instrumentos FX son función del TC en este chart)
  const protFX = (tc) => {
    let total = 0;
    for (const p of port) {
      if (p.riesgo === (isEn ? "Exchange rate" : "Tipo de cambio") && p.payoff) {
        total += p.payoff(tc);
      }
    }
    return total;
  };

  // Protección de otros instrumentos (fija en el chart de TC)
  const protOtros = (() => {
    let total = 0;
    for (const p of port) {
      if (p.riesgo !== (isEn ? "Exchange rate" : "Tipo de cambio") && p.payoff) {
        if (p.riesgo === (isEn ? "Gold Price" : "Precio del Oro")) total += p.payoff(oro);
        if (p.riesgo === (isEn ? "Natural Gas" : "Gas Natural"))    total += p.payoff(gas);
        if (p.riesgo.includes("SOFR"))     total += p.payoff(sofr);
        if (p.riesgo.includes("TIIE"))     total += p.payoff(tiie);
      }
    }
    return total;
  })();

  const costoTotal = port.reduce((s, p) =>
    s + Math.min(p.costoNeto || 0, 0), 0);

  const series = [
    {
      label: isEn ? "EBITDA without hedging" : "EBITDA sin cobertura",
      color: "#8A96A8",
      dash:  [5, 3],
      vals:  tcs.map(tc => ebitdaSin(tc)),
    },
    {
      label: isEn ? "EBITDA with complete strategy" : "EBITDA con estrategia completa",
      color: "#1B4F8A",
      dash:  [],
      vals:  tcs.map(tc =>
        ebitdaSin(tc) + protFX(tc) + protOtros + costoTotal),
    },
    {
      label: isEn ? "Target zone (EBITDA > 0)" : "Zona objetivo (EBITDA > 0)",
      color: "#2D7D4E",
      dash:  [2, 4],
      vals:  tcs.map(() => 0),
    },
  ];

  const allVals = series.flatMap(s => s.vals);
  const minV    = Math.min(...allVals) * 1.1;
  const maxV    = Math.max(...allVals) * 1.1;
  const pad     = 45;

  const xScale = (tc) => pad + (tc - 14.0) / (22.0 - 14.0) * (w - pad*2);
  const yScale = (v)  => pad + (1-(v-minV)/(maxV-minV)) * (h - pad*2);

  ctx.clearRect(0, 0, w, h);

  // Zona positiva (relleno verde claro)
  const y0 = yScale(0);
  ctx.fillStyle = "rgba(45,125,78,0.04)";
  ctx.fillRect(pad, pad, w - pad*2, y0 - pad);

  // Zona negativa (relleno rojo claro)
  ctx.fillStyle = "rgba(155,35,53,0.04)";
  ctx.fillRect(pad, y0, w - pad*2, h - pad - y0);

  // Línea cero
  ctx.strokeStyle = "rgba(200,205,216,0.6)";
  ctx.lineWidth   = 1;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  ctx.moveTo(pad, y0);
  ctx.lineTo(w - pad, y0);
  ctx.stroke();
  ctx.setLineDash([]);

  // TC actual
  const tcAct = Scenarios.getVar("usdmxn");
  ctx.strokeStyle = "#C8CDD8";
  ctx.lineWidth   = 1;
  ctx.setLineDash([3,3]);
  ctx.beginPath();
  ctx.moveTo(xScale(tcAct), pad);
  ctx.lineTo(xScale(tcAct), h - pad);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "9.5px Inter";
  ctx.textAlign = "left";
  ctx.fillText(isEn ? `Current FX $${tcAct.toFixed(2)}` : `TC actual $${tcAct.toFixed(2)}`, xScale(tcAct) + 4, pad + 14);

  // Series
  series.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = s.dash.length ? 1.5 : 2.5;
    ctx.setLineDash(s.dash);
    ctx.beginPath();
    tcs.forEach((tc, i) => {
      const x = xScale(tc);
      const y = yScale(s.vals[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Eje X labels
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  ctx.textAlign = "center";
  [15, 16, 17, 18, 19, 20, 21].forEach(tc => {
    ctx.fillText(`$${tc}`, xScale(tc), h - 5);
  });

  // Label eje Y
  ctx.save();
  ctx.translate(12, h/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText("EBITDA (USD K)", 0, 0);
  ctx.restore();

  // Leyenda
  const leyEl = document.getElementById("est-chart-leyenda");
  if (leyEl) {
    leyEl.innerHTML = series.map(s => `
      <div style="display:flex; align-items:center; gap:5px;">
        <div style="width:20px; height:3px; background:${s.color};
                    border-radius:2px;
                    ${s.dash.length ? "border-top: 2px dashed "+s.color+"; background:none;" : ""}">
        </div>
        <span>${s.label}</span>
      </div>`).join("");
  }
}

// ─────────────────────────────────────────
// CONCLUSIÓN FINAL
// ─────────────────────────────────────────
function _estRenderConclusion() {
  const el = document.getElementById("est-conclusion");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const tiie = Scenarios.getVar("tiie28");
  const tc   = Scenarios.getVar("usdmxn");
  const oro  = Scenarios.getVar("precioOro");

  const decs = isEn ? [
    {
      dec: "Costless collars in FX and gold (no forwards)",
      just: `With USD/MXN at $${tc.toFixed(2)} and gold at USD ${oro.toLocaleString()}/oz, the company is in a range where keeping moderate upside makes sense. A forward would eliminate benefits if the peso continues to weaken or gold rises further. The collar protects without sacrificing all upside.`,
    },
    {
      dec: "Fixed-price swap for natural gas (no collar)",
      just: `With a DSCR of 0.6x, certainty in operating costs is more valuable than keeping the upside of a gas price drop. The fixed swap guarantees that EBITDA is not eroded by a gas spike — especially in the adverse scenario where all drivers press simultaneously.`,
    },
    {
      dec: "IRS SOFR on 50% (not 100%)",
      just: `The Fed's cycle suggests SOFR might decrease. Hedging 100% at the current fixed rate would sacrifice those potential future savings. The 50% hedges balance certainty with the possibility of capturing future cuts on the unhedged half.`,
    },
    {
      dec: "Maintain TIIE collar (no unwinding)",
      just: `Although it is out of the money today (TIIE ${tiie.toFixed(2)}% vs floor 8.75%), the exit cost does not justify unwinding. The collar serves as tail risk protection if USMCA fails and Banxico reverses the rate-cut cycle. It is cheap insurance for a real risk.`,
    },
  ] : [
    {
      dec: "Collares costless en FX y oro (no forwards)",
      just: `Con USD/MXN en $${tc.toFixed(2)} y oro en USD ${oro.toLocaleString()}/oz, la empresa está en un rango donde tiene sentido mantener el upside moderado. Un forward eliminaría el beneficio si el peso sigue depreciándose o si el oro sube más. El collar da protección sin sacrificar todo el upside.`,
    },
    {
      dec: "Swap fijo para gas (no collar)",
      just: `Con DSCR de 0.6x, la certidumbre en costos operativos es más valiosa que mantener el upside de una baja de gas. El swap fijo garantiza que el EBITDA no se vea erosionado por un spike de gas — especialmente en el escenario adverso donde todos los drivers presionan al mismo tiempo.`,
    },
    {
      dec: "IRS SOFR sobre 50% (no 100%)",
      just: `El ciclo de la Fed sugiere que SOFR podría bajar. Cubrir el 100% a la tasa fija actual sacrificaría ese potencial ahorro. El 50% balancea la certidumbre con la posibilidad de capturar recortes futuros en la mitad no cubierta.`,
    },
    {
      dec: "Mantener collar TIIE (no liquidar)",
      just: `Aunque está fuera del dinero hoy (TIIE ${tiie.toFixed(2)}% vs floor 8.75%), el costo de salida no justifica la liquidación. El collar sirve como protección de tail risk si el USMCA falla y Banxico revierte el ciclo de recortes. Es un seguro barato para un riesgo real.`,
    },
  ];

  const conds = isEn ? [
    {
      cond: "USD/MXN drops < $16.50",
      accion: "Expand FX coverage to policy maximum (60%) — very strong peso erodes EBITDA rapidly.",
      urgencia: "IMMEDIATE",
    },
    {
      cond: "USMCA fails in July 2026",
      accion: "Activate TIIE swaption — Banxico could reverse cutting cycle. Extend FX hedging horizons.",
      urgencia: "IMMEDIATE",
    },
    {
      cond: "Gold drops below $2,700/oz",
      accion: "Verify that the collar is exercising. Evaluate additional put if the trend is prolonged.",
      urgencia: "HIGH",
    },
    {
      cond: "SOFR drops below 3.50%",
      accion: "Evaluate canceling the SOFR IRS — opportunity cost exceeds the benefit of certainty.",
      urgencia: "MEDIUM",
    },
    {
      cond: "TIIE rises above 8.75%",
      accion: "TIIE collar enters the money — monitor that execution is carrying out correctly.",
      urgencia: "MONITORING",
    },
  ] : [
    {
      cond: "USD/MXN cae a < $16.50",
      accion: "Ampliar cobertura FX al máximo de política (60%) — peso muy fuerte erosiona EBITDA aceleradamente.",
      urgencia: "INMEDIATA",
    },
    {
      cond: "USMCA falla en julio 2026",
      accion: "Activar swaption TIIE — Banxico puede revertir ciclo. Ampliar horizontes de cobertura FX.",
      urgencia: "INMEDIATA",
    },
    {
      cond: "Oro baja de $2,700/oz",
      accion: "Verificar que el collar esté ejerciéndose. Evaluar put adicional si la tendencia es prolongada.",
      urgencia: "ALTA",
    },
    {
      cond: "SOFR baja de 3.50%",
      accion: "Evaluar cancelar el IRS SOFR — el costo de oportunidad supera el beneficio de certidumbre.",
      urgencia: "MEDIA",
    },
    {
      cond: "TIIE sube sobre 8.75%",
      accion: "Collar TIIE entra en el dinero — monitorear que se esté ejecutando correctamente.",
      urgencia: "MONITOREO",
    },
  ];

  el.innerHTML = `
    <div style="max-width:800px;">

      <div style="font-size:15px; font-weight:700; color:var(--text-primary);
                  margin-bottom:16px; line-height:1.4;">
        ${isEn
          ? `"Under the modeled scenarios, this strategy maximizes Autlán's expected cash flows and significantly reduces EBITDA volatility in the adverse scenario — at a net cost close to zero."`
          : `"Bajo los escenarios modelados, esta estrategia maximiza el valor esperado de los flujos de Autlán y reduce la volatilidad del EBITDA en el escenario adverso de forma significativa — a un costo neto cercano a cero."`}
      </div>

      <div class="grid-2" style="gap:20px; margin-bottom:20px;">
        <div>
          <div class="section-title" style="margin-top:0;">
            ${isEn ? "Rationale for Each Decision" : "Justificación de cada decisión"}
          </div>
          ${decs.map(d => `
            <div style="margin-bottom:14px; padding:10px 12px;
                        background:var(--bg-raised);
                        border-radius:var(--radius-md);
                        border-left:3px solid var(--accent);">
              <div style="font-size:12px; font-weight:600;
                          margin-bottom:4px; color:var(--accent);">
                ${d.dec}
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary);
                          line-height:1.5;">
                ${d.just}
              </div>
            </div>
          `).join("")}
        </div>

        <div>
          <div class="section-title" style="margin-top:0;">
            ${isEn ? "Conditions to Review the Strategy" : "Condiciones para revisar la estrategia"}
          </div>
          ${conds.map(c => {
            let badgeClass = "badge-neutral";
            if (c.urgencia === "IMMEDIATE" || c.urgencia === "INMEDIATA") badgeClass = "badge-danger";
            else if (c.urgencia === "HIGH" || c.urgencia === "ALTA") badgeClass = "badge-warn";
            else if (c.urgencia === "MEDIUM" || c.urgencia === "MEDIA") badgeClass = "badge-accent";

            return `
              <div style="margin-bottom:10px; padding:10px 12px;
                          background:var(--bg-raised);
                          border-radius:var(--radius-md);">
                <div class="flex-between" style="margin-bottom:4px;">
                  <span style="font-size:12px; font-weight:600;">
                    ${isEn ? "If:" : "Si:"} ${c.cond}
                  </span>
                  <span class="badge ${badgeClass}">
                    ${c.urgencia}
                  </span>
                </div>
                <div style="font-size:11.5px; color:var(--text-secondary);
                            line-height:1.5;">
                  → ${c.accion}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="alert alert-accent"
           style="background:var(--accent-light);
                  border-color:rgba(27,79,138,0.2);
                  color:var(--accent-dark);">
        <span class="alert-icon">★</span>
        <span style="font-size:12.5px; line-height:1.6;">
          ${isEn
            ? `<strong>Final verdict of the risk desk:</strong> Autlán enters 2026 with significant exposures in FX, gold, and gas completely unhedged, and a TIIE rate collar out of the money. The proposed strategy corrects these gaps at a net cost close to zero via costless collars. The real cost of <em>not hedging</em> in the adverse scenario — additional EBITDA loss vs the hedged strategy — more than justifies the implementation cost. <strong>Hedging is not a cost — it is an investment in financial certainty.</strong>`
            : `<strong>Veredicto final de la mesa de riesgos:</strong> Autlán enfrenta 2026 con exposiciones significativas en FX, oro y gas completamente descubiertas, y un collar de tasa fuera del dinero. La estrategia propuesta corrige estos gaps a un costo cercano a cero vía costless collares. El costo real de <em>no cubrir</em> en el escenario adverso — pérdida adicional de EBITDA vs estrategia cubierta — justifica con creces el costo de implementación. <strong>La cobertura no es un costo — es una inversión en certidumbre financiera.</strong>`}
        </span>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// EXPORTAR
// ─────────────────────────────────────────
window.exportarEstrategia = function() {
  const isEn = I18N.getLocale() === "en";
  const port  = _getPortafolio();
  const cache = Scenarios.getCache();
  const esc   = Scenarios.getState().escenarios;
  const fmt   = Scenarios.fmt;

  let csv = isEn ? "OPTIMAL HEDGING STRATEGY — AUTLÁN\n" : "ESTRATEGIA ÓPTIMA DE COBERTURA — AUTLÁN\n";
  csv    += `${isEn ? "Generated" : "Generado"}: ${new Date().toLocaleString(isEn ? "en-US" : "es-MX")}\n\n`;

  csv += isEn ? "HEDGING PORTFOLIO\n" : "PORTAFOLIO DE COBERTURAS\n";
  csv += isEn
    ? "ID,Risk,Instrument,Description,Notional USD M,% Exposure,Net Cost,Horizon\n"
    : "ID,Riesgo,Instrumento,Descripción,Nocional USD M,% Exposición,Costo Neto,Horizonte\n";

  const tc = Scenarios.getVar("usdmxn");
  port.forEach(p => {
    const noc = p.nocionalUSD ? p.nocionalUSD/1000
              : p.nocionalMXN ? (p.nocionalMXN/tc)/1000
              : p.nocional/1000;
    
    let costText = "Costless";
    if ((p.costoNeto||0) !== 0) {
      costText = isEn
        ? `${Math.abs(p.costoNeto/1000).toFixed(1)}M ${p.costoNeto > 0 ? "saving" : "premium"}`
        : `${Math.abs(p.costoNeto/1000).toFixed(1)}M ${p.costoNeto > 0 ? "ahorro" : "prima"}`;
    }

    csv += `"${p.id}","${p.riesgo}","${p.instrumento}","${p.descripcion}",`;
    csv += `${noc.toFixed(1)},${p.pctExposicion.toFixed(1)},`;
    csv += `"${costText}","${p.horizonte}"\n`;
  });

  csv += isEn ? "\nSCENARIOS\n" : "\nESCENARIOS\n";
  csv += isEn ? "Variable,Base,Optimistic,Adverse\n" : "Variable,Base,Optimista,Adverso\n";
  const vars = Scenarios.SLIDER_CONFIG;
  Object.entries(vars).forEach(([k, c]) => {
    const label = isEn ? (I18N.t(`p2.driver.${k}`) || c.label) : c.label;
    csv += `"${label}",${esc.base[k]},${esc.optimista[k]},${esc.adverso[k]}\n`;
  });

  if (cache.escenarios) {
    csv += isEn ? "\nFINANCIAL OUTCOMES\n" : "\nRESULTADOS FINANCIEROS\n";
    csv += isEn ? "Metric,Base,Optimistic,Adverse\n" : "Métrica,Base,Optimista,Adverso\n";
    const B = cache.escenarios.base;
    const O = cache.escenarios.optimista;
    const A = cache.escenarios.adverso;
    
    csv += `"${isEn ? "EBITDA without hedging" : "EBITDA sin cobertura"}",${(B.resultados.ebitda/1000).toFixed(1)},`;
    csv += `${(O.resultados.ebitda/1000).toFixed(1)},${(A.resultados.ebitda/1000).toFixed(1)}\n`;
    csv += `"${isEn ? "FCF without hedging" : "FCF sin cobertura"}",${(B.resultados.fcf/1000).toFixed(1)},`;
    csv += `${(O.resultados.fcf/1000).toFixed(1)},${(A.resultados.fcf/1000).toFixed(1)}\n`;
    csv += `"${isEn ? "DSCR without hedging" : "DSCR sin cobertura"}",${B.resultados.dscr.toFixed(2)},`;
    csv += `${O.resultados.dscr.toFixed(2)},${A.resultados.dscr.toFixed(2)}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `autlan-${isEn ? "strategy" : "estrategia"}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  if (window.showToast) {
    showToast(isEn ? "Strategy exported" : "Estrategia exportada", "success");
  }
};

// ─────────────────────────────────────────
// BIND & INIT
// ─────────────────────────────────────────
Scenarios.on("page:estrategia", () => {
  const el = document.getElementById("estrategia-content");
  if (el) renderEstrategia();
});
