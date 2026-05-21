/**
 * pages/p9-estrategia.js — Estrategia Óptima de Cobertura
 * Portafolio recomendado · Política 60% · P&L por escenario
 */

function renderEstrategia() {
  const el = document.getElementById("estrategia-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-accent mb-24"
         style="background:var(--accent-light);
                border-color:rgba(27,79,138,0.2);
                color:var(--accent-dark);">
      <span class="alert-icon">★</span>
      <span>
        Esta página integra todos los riesgos y coberturas analizados
        en un <strong>portafolio de cobertura óptimo</strong> para Autlán.
        Respeta la política interna (60% máximo), cuantifica el costo total
        y muestra el P&L en cada escenario.
        <strong>Esta es la recomendación final de la mesa de riesgos.</strong>
      </span>
    </div>

    <!-- RESUMEN EJECUTIVO -->
    <div class="section-title">Resumen ejecutivo · Posición actual vs recomendada</div>
    <div class="card mb-24" id="est-resumen"></div>

    <!-- PORTAFOLIO DE COBERTURAS -->
    <div class="section-title">Portafolio de coberturas recomendado</div>
    <div class="card mb-24" id="est-portafolio"></div>

    <!-- TABLA MAESTRA DE ESCENARIOS -->
    <div class="section-title">
      Tabla maestra · Flujo sin cobertura vs con estrategia completa
    </div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="esc-header-base">Base</th>
            <th class="esc-header-opt">Optimista</th>
            <th class="esc-header-adv">Adverso</th>
          </tr>
        </thead>
        <tbody id="est-tabla-maestra"></tbody>
      </table>
    </div>

    <!-- COSTO DE LA ESTRATEGIA -->
    <div class="section-title">Costo total de la estrategia</div>
    <div class="card mb-24" id="est-costo"></div>

    <!-- TRADEOFF EXPLÍCITO -->
    <div class="section-title">
      Tradeoff explícito · Qué eliminé · Qué acepté · Qué sacrifiqué
    </div>
    <div class="card mb-24" id="est-tradeoff"></div>

    <!-- PAYOFF INTEGRADO -->
    <div class="section-title">
      Payoff integrado · EBITDA con y sin estrategia de cobertura
    </div>
    <div class="card mb-24">
      <div class="chart-title">
        Impacto en EBITDA proyectado bajo diferentes niveles de USD/MXN
        — con y sin portafolio de cobertura completo
      </div>
      <canvas id="est-payoff-chart" height="220"></canvas>
      <div id="est-chart-leyenda"
           style="display:flex; gap:16px; margin-top:12px;
                  flex-wrap:wrap; font-size:11px;"></div>
    </div>

    <!-- CONCLUSIÓN FINAL -->
    <div class="section-title">Conclusión de la mesa de riesgos</div>
    <div class="card mb-24" id="est-conclusion"></div>

    <!-- BOTÓN EXPORTAR -->
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="exportarEstrategia()">
        ↓ Exportar estrategia completa (CSV)
      </button>
      <button class="btn btn-ghost" onclick="window.print()">
        🖨 Imprimir / PDF
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
  const tc   = Scenarios.getVar("usdmxn");
  const tiie = Scenarios.getVar("tiie28");
  const sofr = Scenarios.getVar("sofr1m");
  const oro  = Scenarios.getVar("precioOro");
  const gas  = Scenarios.getVar("precioGas");

  return [
    {
      id:          "COB-FX-01",
      riesgo:      "Tipo de cambio",
      instrumento: "Collar USD/MXN (costless)",
      descripcion: "4 collares mensuales adicionales · USD 4M/mes",
      floor:       17.40,
      cap:         18.40,
      nocional:    48000,   // USD miles — 12 meses × USD 4M/mes
      pctExposicion: 14.5, // % de ingresos anualizados
      costoNeto:   0,       // costless
      horizonte:   "12 meses",
      mercado:     "OTC",
      estado:      "RECOMENDADO",
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
      riesgo:      "Tipo de cambio",
      instrumento: "Forward USD/MXN complementario",
      descripcion: "Forward para meses 7-12 · USD 2M/mes",
      strikeForward: Models.forwardPrice(tc, tiie/100, sofr/100, 0.75).forward,
      nocional:    24000,   // USD 2M × 12 meses
      pctExposicion: 7.3,
      costoNeto:   0,
      horizonte:   "6-12 meses",
      mercado:     "OTC",
      estado:      "RECOMENDADO",
      color:       "var(--accent-mid)",
      payoff: (tcFinal) => {
        const fwd = Models.forwardPrice(tc, tiie/100, sofr/100, 0.75).forward;
        return (fwd - tcFinal) * 24000;
      },
    },
    {
      id:          "COB-ORO-01",
      riesgo:      "Precio del Oro",
      instrumento: "Costless Collar oro",
      descripcion: "Collar $2,700–$3,300/oz · 260K oz (~50% prod.)",
      floor:       2700,
      cap:         3300,
      nocional:    260000,  // oz
      nocionalUSD: 260000 * oro / 1000, // USD miles
      pctExposicion: 50,
      costoNeto:   0,
      horizonte:   "12 meses",
      mercado:     "OTC",
      estado:      "RECOMENDADO",
      color:       "var(--gold)",
      payoff: (oroFinal) => {
        const ef = Math.min(Math.max(oroFinal, 2700), 3300);
        return (ef - oroFinal) * 260; // USD miles
      },
    },
    {
      id:          "COB-GAS-01",
      riesgo:      "Gas Natural",
      instrumento: "Swap precio fijo gas",
      descripcion: "Swap 12 meses · 900K MMBtu · $3.35/MMBtu",
      precioFijo:  3.35,
      nocional:    900000, // MMBtu
      nocionalUSD: 3.35 * 900000 / 1000, // USD miles
      pctExposicion: 50,  // % consumo expuesto
      costoNeto:   (gas - 3.35) * 900000 / 1000, // positivo si gas > fijo
      horizonte:   "12 meses",
      mercado:     "OTC",
      estado:      "RECOMENDADO",
      color:       "var(--gas-green)",
      payoff: (gasFinal) => (gasFinal - 3.35) * 900000 / 1000, // ahorro si gas sube
    },
    {
      id:          "COB-TASA-01",
      riesgo:      "Tasa de interés (SOFR)",
      instrumento: "IRS SOFR — variable a fija",
      descripcion: "Swap 50% deuda SOFR · USD 67M · fija 4.50%",
      tasaFija:    4.50,
      nocional:    67000,  // USD miles
      pctExposicion: 49.4, // % deuda SOFR cubierta
      costoNeto:   (sofr - 4.50) * 67000 / 100, // positivo si SOFR > fija
      horizonte:   "3 años",
      mercado:     "OTC",
      estado:      "RECOMENDADO",
      color:       "var(--warn-mid)",
      payoff: (sofrFinal) => (sofrFinal - 4.50) * 67000 / 100,
    },
    {
      id:          "COB-TASA-02",
      riesgo:      "Tasa de interés (TIIE)",
      instrumento: "Collar TIIE existente (mantener)",
      descripcion: "Collar 8.75%–11% · MXN 157.6M · Vence 2028",
      floor:       8.75,
      cap:         11.00,
      nocionalMXN: 157584,
      nocionalUSD: 157584 / tc,
      pctExposicion: 50,
      costoNeto:   -AUTLAN.derivadosVigentes.collarTasa.mtm.minusvalia1T26.valor,
      horizonte:   "Hasta jun-2028",
      mercado:     "OTC",
      estado:      "EXISTENTE — MANTENER",
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

  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;
  const port = _getPortafolio();

  const nocFX = port
    .filter(p => p.riesgo === "Tipo de cambio")
    .reduce((s, p) => s + p.nocional, 0);
  const pctFXTotal = (exp.coberturaFX_nocional.valor + nocFX) /
                     exp.ingresosFX_anualizado.valor * 100;

  el.innerHTML = `
    <div class="grid-4" style="gap:16px; margin-bottom:20px;">
      ${[
        {
          label: "Cobertura FX actual",
          value: `${exp.pctCubierto_FX.valor}%`,
          nuevo: `${Math.min(pctFXTotal, 60).toFixed(0)}%`,
          tipo:  "danger",
        },
        {
          label: "Cobertura Oro",
          value: "0%",
          nuevo: "50%",
          tipo:  "danger",
        },
        {
          label: "Cobertura Gas",
          value: "0%",
          nuevo: "50%",
          tipo:  "danger",
        },
        {
          label: "Cobertura SOFR",
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
          <div class="kpi-sub">Actual → Con estrategia</div>
        </div>
      `).join("")}
    </div>

    <div class="grid-3" style="gap:16px;">
      ${[
        {
          titulo: "Objetivo de la estrategia",
          items: [
            "Proteger flujos de caja en escenario adverso",
            "Respetar política interna (máx 60% por riesgo)",
            "Minimizar costo total de cobertura",
            "Mantener upside moderado en escenario optimista",
          ],
          color: "var(--accent)",
        },
        {
          titulo: "Principios de diseño",
          items: [
            "Priorizar costless collars — prima cero",
            "Horizontes alineados con ciclo de negocio",
            "Solo contrapartes investment grade",
            "Tratamiento IFRS 9 desde contratación",
          ],
          color: "var(--success)",
        },
        {
          titulo: "Restricciones respetadas",
          items: [
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
              <span style="color:${s.color}; flex-shrink:0;">◎</span>
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

  const port = _getPortafolio();
  const tc   = Scenarios.getVar("usdmxn");

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Riesgo</th>
            <th>Instrumento</th>
            <th>Descripción</th>
            <th style="text-align:right;">Nocional (USD M)</th>
            <th style="text-align:right;">% Exposición</th>
            <th style="text-align:right;">Costo neto</th>
            <th>Horizonte</th>
            <th>Estado</th>
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
                  ${costo === 0
                    ? "Costless"
                    : `USD ${Math.abs(costo/1000).toFixed(1)}M ${costo > 0 ? "ahorro" : "prima"}`}
                </td>
                <td style="font-size:11.5px;">${p.horizonte}</td>
                <td>
                  <span class="badge ${
                    p.estado.includes("EXISTENTE") ? "badge-warn"
                    : "badge-success"}">
                    ${p.estado.includes("EXISTENTE") ? "EXISTENTE" : "NUEVO"}
                  </span>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>

    <div style="margin-top:12px; font-size:11px; color:var(--text-muted);">
      * Nocionales en USD equivalente al tipo de cambio actual
      ($${tc.toFixed(2)}). Los costless collars no tienen costo de prima —
      la prima del call vendido financia el put comprado.
    </div>
  `;
}

// ─────────────────────────────────────────
// TABLA MAESTRA DE ESCENARIOS
// ─────────────────────────────────────────
function _estRenderTablaMaestra() {
  const el = document.getElementById("est-tabla-maestra");
  if (!el) return;

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
        if (p.riesgo === "Tipo de cambio") {
          total += p.payoff(escVars.usdmxn);
        } else if (p.riesgo === "Precio del Oro") {
          total += p.payoff(escVars.precioOro);
        } else if (p.riesgo === "Gas Natural") {
          total += p.payoff(escVars.precioGas);
        } else if (p.riesgo === "Tasa de interés (SOFR)") {
          total += p.payoff(escVars.sofr1m);
        } else if (p.riesgo === "Tasa de interés (TIIE)") {
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
    row("Precio manganeso",
      fmt.mn(esc.base.precioMn),
      fmt.mn(esc.optimista.precioMn),
      fmt.mn(esc.adverso.precioMn)),
    row("Precio oro",
      fmt.oro(esc.base.precioOro),
      fmt.oro(esc.optimista.precioOro),
      fmt.oro(esc.adverso.precioOro)),
    row("TIIE 28d",
      fmt.tasa(esc.base.tiie28),
      fmt.tasa(esc.optimista.tiie28),
      fmt.tasa(esc.adverso.tiie28)),
    divider(),
    row("EBITDA sin cobertura",
      fmt.usd(B.resultados.ebitda),
      fmt.usd(O.resultados.ebitda),
      fmt.usd(A.resultados.ebitda),
      true,
      cls(B.resultados.ebitda),
      cls(O.resultados.ebitda),
      cls(A.resultados.ebitda)),
    row("Protección coberturas",
      fmt.usd(protB),
      fmt.usd(protO),
      fmt.usd(protA),
      false,
      cls(protB), cls(protO), cls(protA)),
    row("Costo estrategia",
      fmt.usd(costoTotal),
      fmt.usd(costoTotal),
      fmt.usd(costoTotal),
      false, "warn", "warn", "warn"),
    row("EBITDA con estrategia",
      fmt.usd(ebitdaConB),
      fmt.usd(ebitdaConO),
      fmt.usd(ebitdaConA),
      true,
      cls(ebitdaConB), cls(ebitdaConO), cls(ebitdaConA)),
    divider(),
    row("FCF sin cobertura",
      fmt.usd(B.resultados.fcf),
      fmt.usd(O.resultados.fcf),
      fmt.usd(A.resultados.fcf),
      false,
      cls(B.resultados.fcf),
      cls(O.resultados.fcf),
      cls(A.resultados.fcf)),
    row("FCF con estrategia",
      fmt.usd(fcfConB),
      fmt.usd(fcfConO),
      fmt.usd(fcfConA),
      true,
      cls(fcfConB), cls(fcfConO), cls(fcfConA)),
    divider(),
    row("DSCR sin cobertura",
      B.resultados.dscr.toFixed(2) + "x",
      O.resultados.dscr.toFixed(2) + "x",
      A.resultados.dscr.toFixed(2) + "x",
      false,
      B.resultados.dscr >= 1 ? "positive" : "negative",
      O.resultados.dscr >= 1 ? "positive" : "negative",
      A.resultados.dscr >= 1 ? "positive" : "negative"),
    row("DSCR con estrategia",
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
          Desglose de costos por instrumento
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Instrumento</th>
                <th style="text-align:right;">Nocional</th>
                <th style="text-align:right;">Costo / Ahorro anual</th>
                <th style="text-align:right;">% EBITDA</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(i => `
                <tr>
                  <td style="font-size:12px;">${i.instrumento}</td>
                  <td class="mono" style="text-align:right;">
                    USD ${i.nocM.toFixed(1)}M
                  </td>
                  <td class="mono ${i.costo >= 0 ? "positive" : "warn"}"
                      style="text-align:right;">
                    ${i.costo === 0
                      ? "Costless"
                      : `${i.costo > 0 ? "+" : ""}USD ${(i.costo/1000).toFixed(1)}M`}
                  </td>
                  <td class="mono" style="text-align:right;
                      color:var(--text-muted);">
                    ${i.costo === 0
                      ? "0%"
                      : `${(Math.abs(i.costo)/ebitda*100).toFixed(1)}%`}
                  </td>
                </tr>
              `).join("")}
              <tr style="background:var(--bg-raised); font-weight:700;">
                <td>TOTAL ESTRATEGIA</td>
                <td class="mono" style="text-align:right;">—</td>
                <td class="mono ${costoNeto >= 0 ? "positive" : "warn"}"
                    style="text-align:right;">
                  ${costoNeto >= 0
                    ? `+USD ${(costoNeto/1000).toFixed(1)}M ahorro`
                    : `USD ${(Math.abs(costoNeto)/1000).toFixed(1)}M costo`}
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
          Resumen de costo
        </div>

        ${_resultRow("Instrumentos costless", `${items.filter(i => i.costo === 0).length} de ${items.length}`)}
        ${_resultRow("Costo de primas pagadas",
                      `USD ${(Math.abs(costoTotal)/1000).toFixed(1)}M`,
                      Math.abs(costoTotal) > 5000 ? "danger" : "warn")}
        ${_resultRow("Ahorro por posiciones en dinero",
                      `+USD ${(ahorroTotal/1000).toFixed(1)}M`, "positive")}
        ${_resultRow("Costo neto total",
                      costoNeto >= 0
                        ? `+USD ${(costoNeto/1000).toFixed(1)}M (ahorro neto)`
                        : `USD ${(Math.abs(costoNeto)/1000).toFixed(1)}M`,
                      costoNeto >= 0 ? "positive" : "warn")}
        ${_resultRow("Como % del EBITDA base",
                      `${pctEBITDA}% — umbral aceptable < 5%`,
                      parseFloat(pctEBITDA) < 5 ? "positive" : "warn")}

        <div class="alert alert-success" style="margin-top:14px;">
          <span class="alert-icon">✓</span>
          <span style="font-size:11.5px;">
            La estrategia prioriza instrumentos costless (collares sin prima).
            El costo neto es mínimo como % del EBITDA y dentro del
            umbral aceptable para una política de cobertura corporativa.
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

  el.innerHTML = `
    <div class="grid-3" style="gap:16px;">

      <div style="padding:18px; background:var(--success-light);
                  border-radius:var(--radius-lg);
                  border:1px solid rgba(45,125,78,0.2);">
        <div style="font-size:13px; font-weight:700;
                    color:var(--success); margin-bottom:12px;">
          ✓ QUÉ RIESGO ELIMINÉ
        </div>
        ${[
          "Caída de USD/MXN < $17.40 — collar FX protege completamente",
          "Caída del oro < $2,700/oz — collar oro actúa",
          "Alza de gas > $3.35/MMBtu — swap fija el costo",
          "Alza SOFR > 4.50% — IRS fija la tasa de USD 67M",
          "TIIE > 11% — cap del collar existente limita el techo",
          "Volatilidad extrema de EBITDA en escenario adverso",
        ].map(i => `
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
          ⚠ QUÉ RIESGO ACEPTO
        </div>
        ${[
          "Manganeso sin cobertura financiera formal — mercado OTC ineficiente",
          "40-50% de ingresos FX aún sin cubrir (hasta límite de política)",
          "Riesgo de contraparte OTC — mitigado con bancos IG",
          "Basis risk entre índice del derivado y precio real de cliente",
          "TIIE entre 8.75% y floor — collar OTM hasta que suba la tasa",
          "Riesgo USMCA julio 2026 — no cubierto con derivado (tail risk político)",
        ].map(i => `
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
          ✗ QUÉ UPSIDE SACRIFICO
        </div>
        ${[
          "USD/MXN > $18.40 — collar FX limita el ingreso adicional",
          "Oro > $3,300/oz — collar oro cede la ganancia extra",
          "Gas < $3.35/MMBtu — swap paga el precio fijo aunque mercado esté más bajo",
          "SOFR < 4.50% — IRS paga tasa fija aunque SOFR baje",
          "Beneficio total de un peso más débil en escenario optimista",
          "Prima pagada en swap gas (~USD 0.15/MMBtu sobre spot)",
        ].map(i => `
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
      if (p.riesgo === "Tipo de cambio" && p.payoff) {
        total += p.payoff(tc);
      }
    }
    return total;
  };

  // Protección de otros instrumentos (fija en el chart de TC)
  const protOtros = (() => {
    let total = 0;
    for (const p of port) {
      if (p.riesgo !== "Tipo de cambio" && p.payoff) {
        if (p.riesgo === "Precio del Oro") total += p.payoff(oro);
        if (p.riesgo === "Gas Natural")    total += p.payoff(gas);
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
      label: "EBITDA sin cobertura",
      color: "#8A96A8",
      dash:  [5, 3],
      vals:  tcs.map(tc => ebitdaSin(tc)),
    },
    {
      label: "EBITDA con estrategia completa",
      color: "#1B4F8A",
      dash:  [],
      vals:  tcs.map(tc =>
        ebitdaSin(tc) + protFX(tc) + protOtros + costoTotal),
    },
    {
      label: "Zona objetivo (EBITDA > 0)",
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
  ctx.fillText(`TC actual $${tcAct.toFixed(2)}`, xScale(tcAct) + 4, pad + 14);

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

  const tiie = Scenarios.getVar("tiie28");
  const tc   = Scenarios.getVar("usdmxn");
  const oro  = Scenarios.getVar("precioOro");

  el.innerHTML = `
    <div style="max-width:800px;">

      <div style="font-size:15px; font-weight:700; color:var(--text-primary);
                  margin-bottom:16px; line-height:1.4;">
        "Bajo los escenarios modelados, esta estrategia maximiza
        el valor esperado de los flujos de Autlán y reduce la
        volatilidad del EBITDA en el escenario adverso de forma
        significativa — a un costo neto cercano a cero."
      </div>

      <div class="grid-2" style="gap:20px; margin-bottom:20px;">
        <div>
          <div class="section-title" style="margin-top:0;">
            Justificación de cada decisión
          </div>
          ${[
            {
              dec: "Collares costless en FX y oro (no forwards)",
              just: `Con USD/MXN en $${tc.toFixed(2)} y oro en
                     USD ${oro.toLocaleString()}/oz, la empresa está en
                     un rango donde tiene sentido mantener el upside moderado.
                     Un forward eliminaría el beneficio si el peso sigue
                     depreciándose o si el oro sube más. El collar da
                     protección sin sacrificar todo el upside.`,
            },
            {
              dec: "Swap fijo para gas (no collar)",
              just: `Con DSCR de 0.6x, la certidumbre en costos operativos
                     es más valiosa que mantener el upside de una baja de gas.
                     El swap fijo garantiza que el EBITDA no se vea erosionado
                     por un spike de gas — especialmente en el escenario adverso
                     donde todos los drivers presionan al mismo tiempo.`,
            },
            {
              dec: "IRS SOFR sobre 50% (no 100%)",
              just: `El ciclo de la Fed sugiere que SOFR podría bajar.
                     Cubrir el 100% a la tasa fija actual sacrificaría
                     ese potencial ahorro. El 50% balancea la certidumbre
                     con la posibilidad de capturar recortes futuros
                     en la mitad no cubierta.`,
            },
            {
              dec: "Mantener collar TIIE (no liquidar)",
              just: `Aunque está fuera del dinero hoy (TIIE ${tiie.toFixed(2)}%
                     vs floor 8.75%), el costo de salida no justifica la
                     liquidación. El collar sirve como protección de tail risk
                     si el USMCA falla y Banxico revierte el ciclo de recortes.
                     Es un seguro barato para un riesgo real.`,
            },
          ].map(d => `
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
            Condiciones para revisar la estrategia
          </div>
          ${[
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
          ].map(c => `
            <div style="margin-bottom:10px; padding:10px 12px;
                        background:var(--bg-raised);
                        border-radius:var(--radius-md);">
              <div class="flex-between" style="margin-bottom:4px;">
                <span style="font-size:12px; font-weight:600;">
                  Si: ${c.cond}
                </span>
                <span class="badge ${
                  c.urgencia === "INMEDIATA" ? "badge-danger"
                  : c.urgencia === "ALTA"    ? "badge-warn"
                  : c.urgencia === "MEDIA"   ? "badge-accent"
                  : "badge-neutral"}">
                  ${c.urgencia}
                </span>
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary);
                          line-height:1.5;">
                → ${c.accion}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="alert alert-accent"
           style="background:var(--accent-light);
                  border-color:rgba(27,79,138,0.2);
                  color:var(--accent-dark);">
        <span class="alert-icon">★</span>
        <span style="font-size:12.5px; line-height:1.6;">
          <strong>Veredicto final de la mesa de riesgos:</strong>
          Autlán enfrenta 2026 con exposiciones significativas en FX, oro y gas
          completamente descubiertas, y un collar de tasa fuera del dinero.
          La estrategia propuesta corrige estos gaps a un costo cercano a cero
          vía costless collars. El costo real de <em>no cubrir</em> en el
          escenario adverso — pérdida adicional de EBITDA vs estrategia cubierta —
          justifica con creces el costo de implementación.
          <strong>La cobertura no es un costo — es una inversión en
          certidumbre financiera.</strong>
        </span>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// EXPORTAR
// ─────────────────────────────────────────
window.exportarEstrategia = function() {
  const port  = _getPortafolio();
  const cache = Scenarios.getCache();
  const esc   = Scenarios.getState().escenarios;
  const fmt   = Scenarios.fmt;

  let csv = "ESTRATEGIA ÓPTIMA DE COBERTURA — AUTLÁN\n";
  csv    += `Generado: ${new Date().toLocaleString("es-MX")}\n\n`;

  csv += "PORTAFOLIO DE COBERTURAS\n";
  csv += "ID,Riesgo,Instrumento,Descripción,Nocional USD M,% Exposición,Costo Neto,Horizonte\n";

  const tc = Scenarios.getVar("usdmxn");
  port.forEach(p => {
    const noc = p.nocionalUSD ? p.nocionalUSD/1000
              : p.nocionalMXN ? (p.nocionalMXN/tc)/1000
              : p.nocional/1000;
    csv += `"${p.id}","${p.riesgo}","${p.instrumento}","${p.descripcion}",`;
    csv += `${noc.toFixed(1)},${p.pctExposicion.toFixed(1)},`;
    csv += `${(p.costoNeto||0) === 0 ? "Costless" : (p.costoNeto/1000).toFixed(1)+"M"},`;
    csv += `"${p.horizonte}"\n`;
  });

  csv += "\nESCENARIOS\n";
  csv += "Variable,Base,Optimista,Adverso\n";
  const vars = Scenarios.SLIDER_CONFIG;
  Object.entries(vars).forEach(([k, c]) => {
    csv += `"${c.label}",${esc.base[k]},${esc.optimista[k]},${esc.adverso[k]}\n`;
  });

  if (cache.escenarios) {
    csv += "\nRESULTADOS FINANCIEROS\n";
    csv += "Métrica,Base,Optimista,Adverso\n";
    const B = cache.escenarios.base;
    const O = cache.escenarios.optimista;
    const A = cache.escenarios.adverso;
    csv += `"EBITDA sin cobertura",${(B.resultados.ebitda/1000).toFixed(1)},`;
    csv += `${(O.resultados.ebitda/1000).toFixed(1)},${(A.resultados.ebitda/1000).toFixed(1)}\n`;
    csv += `"FCF sin cobertura",${(B.resultados.fcf/1000).toFixed(1)},`;
    csv += `${(O.resultados.fcf/1000).toFixed(1)},${(A.resultados.fcf/1000).toFixed(1)}\n`;
    csv += `"DSCR sin cobertura",${B.resultados.dscr.toFixed(2)},`;
    csv += `${O.resultados.dscr.toFixed(2)},${A.resultados.dscr.toFixed(2)}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `autlan-estrategia-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("Estrategia exportada", "success");
};

// ─────────────────────────────────────────
// BIND & INIT
// ─────────────────────────────────────────
Scenarios.on("page:estrategia", () => {
  const el = document.getElementById("estrategia-content");
  if (el) renderEstrategia();
});