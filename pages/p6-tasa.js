/**
 * pages/p6-tasa.js — Riesgo Tasa de Interés
 * TIIE + SOFR · Mark-to-market collar existente · Hull-White
 */

function renderTasa() {
  const el = document.getElementById("tasa-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-warn mb-24">
      <span class="alert-icon">📈</span>
      <span>
        Collar TIIE vigente (<strong>floor 8.75% / cap 11%</strong>)
        está <strong>fuera del dinero</strong> — TIIE actual
        <strong><span id="tasa-tiie-live">7.10</span>%</strong>
        por debajo del floor. La empresa paga la tasa de mercado completa
        sin beneficio del instrumento.
        Pérdida acumulada: <strong>USD 45.6K</strong>.
      </span>
    </div>

    <!-- KPIs -->
    <div class="grid-4 mb-24" id="tasa-kpis"></div>

    <!-- MARK-TO-MARKET DEL COLLAR EXISTENTE -->
    <div class="section-title">
      Mark-to-market · Collar TIIE vigente · 31 mar 2026
    </div>
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Collar de tasa existente</div>
            <div class="card-sub">
              CEM subsidiaria · Contratado 7-feb-2025 · Vence 23-jun-2028
            </div>
          </div>
          <span class="badge badge-warn">FUERA DEL DINERO</span>
        </div>
        <div id="tasa-collar-mtm"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Análisis de situación actual</div>
            <div class="card-sub">
              ¿Cuánto cuesta salirse? ¿Qué opciones hay?
            </div>
          </div>
        </div>
        <div id="tasa-collar-opciones"></div>
      </div>
    </div>

    <!-- ESTRUCTURA DE DEUDA POR TASA -->
    <div class="section-title">Estructura de deuda · Exposición por tipo de tasa</div>
    <div class="card mb-24" id="tasa-estructura"></div>

    <!-- TABS INSTRUMENTOS -->
    <div class="section-title">Evaluar instrumentos adicionales</div>
    <div class="card mb-24">
      <div style="display:flex; gap:4px; margin-bottom:20px;
                  border-bottom:2px solid var(--border); padding-bottom:0;">
        ${["Swap TIIE","Cap de tasa","Swap SOFR","Swaption"].map((t,i) => `
          <button class="tasa-tab ${i===0?"active":""}"
                  data-tab="${i}"
                  onclick="switchTasaTab(${i})"
                  style="padding:8px 16px; font-size:12px; font-weight:500;
                         border:none; background:none; cursor:pointer;
                         border-bottom:2px solid ${i===0
                           ?"var(--accent)":"transparent"};
                         margin-bottom:-2px;
                         color:${i===0
                           ?"var(--accent)":"var(--text-muted)"};">
            ${t}
          </button>`).join("")}
      </div>
      <div id="tasa-tab-0">${_tasaTabSwapTIIE()}</div>
      <div id="tasa-tab-1" style="display:none;">${_tasaTabCap()}</div>
      <div id="tasa-tab-2" style="display:none;">${_tasaTabSwapSOFR()}</div>
      <div id="tasa-tab-3" style="display:none;">${_tasaTabSwaption()}</div>
    </div>

    <!-- TABLA COMPARATIVA -->
    <div class="section-title">Costo financiero por escenario de tasas</div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>Instrumento / Deuda</th>
            <th class="esc-header-base">Base · TIIE 6.95%</th>
            <th class="esc-header-opt">Optimista · TIIE 6.50%</th>
            <th class="esc-header-adv">Adverso · TIIE 7.75%</th>
          </tr>
        </thead>
        <tbody id="tasa-tabla-comparativa"></tbody>
      </table>
    </div>

    <!-- SENSIBILIDAD DV01 -->
    <div class="section-title">Análisis de sensibilidad · DV01</div>
    <div class="card mb-24" id="tasa-dv01"></div>

    <!-- RECOMENDACIÓN -->
    <div class="section-title">Análisis y recomendación</div>
    <div class="card mb-24" id="tasa-recomendacion"></div>

  `;

  _tasaRenderKPIs();
  _tasaRenderCollarMTM();
  _tasaRenderCollarOpciones();
  _tasaRenderEstructura();
  _tasaRenderTablaComparativa();
  _tasaRenderDV01();
  _tasaRenderRecomendacion();
  _tasaBindCalcs();

  Scenarios.on("var:tiie28", () => {
    _tasaRenderKPIs();
    _tasaRenderCollarMTM();
    _tasaRenderCollarOpciones();
    _tasaRenderTablaComparativa();
    _tasaRenderDV01();
    _tasaRenderRecomendacion();
  });

  Scenarios.on("var:sofr1m", () => {
    _tasaRenderKPIs();
    _tasaRenderTablaComparativa();
    _tasaRenderDV01();
  });
}

// ─────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────
function _tasaRenderKPIs() {
  const el = document.getElementById("tasa-kpis");
  if (!el) return;

  const tiie   = Scenarios.getVar("tiie28");
  const sofr   = Scenarios.getVar("sofr1m");
  const collar = AUTLAN.derivadosVigentes.collarTasa;

  // Costo financiero estimado
  const costoSOFR = 135479 * (sofr + 5.75) / 100; // spread promedio SOFR
  const costoTIIE = 29747  * (tiie + 4.75) / 100; // spread promedio TIIE
  const costoTotal = costoSOFR + costoTIIE;

  document.getElementById("tasa-tiie-live") &&
    (document.getElementById("tasa-tiie-live").textContent = tiie.toFixed(2));

  el.innerHTML = [
    {
      label: "TIIE 28d actual",
      value: `${tiie.toFixed(2)}%`,
      sub:   `Floor collar: ${collar.floor}% — ${tiie < collar.floor
               ? "DEBAJO del floor" : "SOBRE el floor"}`,
      tipo:  tiie < collar.floor ? "danger" : "success",
      delta: tiie < collar.floor
        ? `${(collar.floor - tiie).toFixed(2)}pp bajo floor`
        : `${(tiie - collar.floor).toFixed(2)}pp sobre floor`,
      dir:   tiie < collar.floor ? "down" : "up",
    },
    {
      label: "SOFR 1m actual",
      value: `${sofr.toFixed(2)}%`,
      sub:   `Deuda SOFR: USD 135.5M · Spread +5.5-6%`,
      tipo:  sofr > 4.5 ? "danger" : sofr > 4.0 ? "warn" : "success",
      delta: `Costo total SOFR: USD ${(costoSOFR/1000).toFixed(1)}M/año`,
      dir:   sofr > 4.5 ? "down" : "up",
    },
    {
      label: "Gasto financiero est.",
      value: `USD ${(costoTotal/1000).toFixed(1)}M/año`,
      sub:   `SOFR ${(costoSOFR/1000).toFixed(1)}M + TIIE ${(costoTIIE/1000).toFixed(1)}M`,
      tipo:  costoTotal > 42493 ? "danger" : "warn",
      delta: costoTotal > 42493
        ? `+USD ${((costoTotal-42493)/1000).toFixed(1)}M vs 2025`
        : `-USD ${((42493-costoTotal)/1000).toFixed(1)}M vs 2025`,
      dir:   costoTotal > 42493 ? "down" : "up",
    },
    {
      label: "Collar TIIE — estado",
      value: tiie < collar.floor ? "FUERA DINERO" : "EN DINERO",
      sub:   `Nocional MXN ${(collar.nocionalMXN.valor/1000).toFixed(1)}M · 50% deuda CEM`,
      tipo:  tiie < collar.floor ? "danger" : "success",
      delta: `Pérdida acum: USD ${collar.mtm.perdidaAcum.valor}K`,
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
// MARK-TO-MARKET DEL COLLAR EXISTENTE
// ─────────────────────────────────────────
function _tasaRenderCollarMTM() {
  const el = document.getElementById("tasa-collar-mtm");
  if (!el) return;

  const tiie   = Scenarios.getVar("tiie28");
  const collar = AUTLAN.derivadosVigentes.collarTasa;
  const nocMXN = collar.nocionalMXN.valor; // MXN miles
  const tc     = Scenarios.getVar("usdmxn");
  const nocUSD = nocMXN / tc; // USD miles

  // MtM del collar usando Hull-White
  const T       = 2.25; // años restantes a jun-2028
  const r_desc  = tiie / 100;
  const spread  = 4.0 / 100; // spread del crédito CEM

  // Valor del cap (posición larga) — call sobre TIIE
  const capMTM  = Models.capPrice(
    nocUSD, collar.cap / 100, tiie / 100,
    Models.PARAMS.tasa_tiie.sigma, T, r_desc, 12
  );

  // Valor del floor vendido — put sobre TIIE (posición corta = negativo)
  const floorMTM = Models.capPrice(
    nocUSD, collar.floor / 100, tiie / 100,
    Models.PARAMS.tasa_tiie.sigma, T, r_desc, 12
  );

  const mtmNeto = capMTM.prima - floorMTM.prima; // cap comprado - floor vendido
  const tiieEfectiva = Math.min(Math.max(tiie, collar.floor), collar.cap);
  const ahorroPotencial = (tiie - tiieEfectiva) * nocUSD / 100;

  el.innerHTML = `
    ${_resultRow("Instrumento", "Collar sin costo (Cap + Floor)")}
    ${_resultRow("Subyacente", "TIIEF (TIIE 28 días)")}
    ${_resultRow("Nocional MXN", `MXN ${nocMXN.toLocaleString()}K`)}
    ${_resultRow("Nocional USD equiv.", `USD ${nocUSD.toFixed(0)}K`)}
    ${_resultRow("50% deuda TIIE CEM", "Crédito BanBajío TIIE+4%")}
    ${_resultRow("Floor (cap comprado)", `${collar.floor}% — posición larga`, "positive")}
    ${_resultRow("Cap (floor vendido)", `${collar.cap}% — posición corta`, "warn")}
    ${_resultRow("TIIE actual", `${tiie.toFixed(2)}%`,
                  tiie < collar.floor ? "danger" : "success")}
    ${_resultRow("Estado", tiie < collar.floor
                  ? `Fuera del dinero — ${(collar.floor-tiie).toFixed(2)}pp bajo floor`
                  : `En el dinero — ${(tiie-collar.floor).toFixed(2)}pp sobre floor`,
                  tiie < collar.floor ? "danger" : "success")}

    <div class="divider"></div>

    ${_resultRow("MtM cap (posición larga)",
                  `USD ${capMTM.prima.toFixed(1)}K`, "positive")}
    ${_resultRow("MtM floor vendido",
                  `-USD ${floorMTM.prima.toFixed(1)}K`, "danger")}
    ${_resultRow("MtM neto collar",
                  `USD ${mtmNeto.toFixed(1)}K`,
                  mtmNeto >= 0 ? "positive" : "danger")}
    ${_resultRow("Pérdida acumulada real",
                  `USD ${collar.mtm.perdidaAcum.valor}K`, "danger")}
    ${_resultRow("Minusvalía 1T26",
                  `USD ${collar.mtm.minusvalia1T26.valor}K`, "danger")}

    <div class="divider"></div>

    ${_resultRow("TIIE efectiva con collar",
                  `${tiieEfectiva.toFixed(2)}%`,
                  tiie < collar.floor ? "warn" : "success")}
    ${_resultRow("Ahorro/(costo) vs sin collar",
                  `USD ${ahorroPotencial.toFixed(1)}K/año`,
                  ahorroPotencial >= 0 ? "positive" : "danger")}
    ${_resultRow("Vencimiento", "23 junio 2028 · mensual")}

    <div class="alert alert-${tiie < collar.floor ? "danger" : "success"}"
         style="margin-top:12px;">
      <span class="alert-icon">${tiie < collar.floor ? "⚠" : "✓"}</span>
      <span style="font-size:11.5px;">
        ${tiie < collar.floor
          ? `TIIE (${tiie.toFixed(2)}%) debajo del floor (${collar.floor}%).
             El collar no se ejerce — Autlán paga tasa de mercado completa
             más la prima del instrumento. Situación de minusvalía activa.`
          : `TIIE (${tiie.toFixed(2)}%) dentro del rango. El cap actúa
             como límite superior — Autlán no paga más del ${collar.cap}%.`}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// OPCIONES PARA EL COLLAR EXISTENTE
// ─────────────────────────────────────────
function _tasaRenderCollarOpciones() {
  const el = document.getElementById("tasa-collar-opciones");
  if (!el) return;

  const tiie   = Scenarios.getVar("tiie28");
  const collar = AUTLAN.derivadosVigentes.collarTasa;
  const tc     = Scenarios.getVar("usdmxn");
  const nocUSD = collar.nocionalMXN.valor / tc;
  const T      = 2.25;

  // Costo estimado de salida (liquidación anticipada)
  const costoSalida = Math.abs(
    Models.capPrice(nocUSD, collar.cap/100, tiie/100,
      Models.PARAMS.tasa_tiie.sigma, T, tiie/100, 12).prima
    - Models.capPrice(nocUSD, collar.floor/100, tiie/100,
      Models.PARAMS.tasa_tiie.sigma, T, tiie/100, 12).prima
  );

  const opciones = [
    {
      titulo:  "Mantener el collar",
      pros:    ["Sin costo de salida", "Protege si TIIE sube sobre 8.75%",
                "Vigente hasta 2028 — cubre ciclo de posible alza"],
      contras: ["Minusvalía activa mientras TIIE < 8.75%",
                "Prima pagada sin beneficio corriente"],
      recom:   tiie < 7.5 ? "neutral" : "recomendado",
    },
    {
      titulo:  "Liquidar anticipadamente",
      pros:    ["Elimina la minusvalía corriente",
                "Libera la prima del floor vendido"],
      contras: [`Costo de salida estimado ~USD ${costoSalida.toFixed(0)}K`,
                "Queda expuesto si TIIE sube después"],
      recom:   tiie < 6.5 ? "recomendado" : "neutral",
    },
    {
      titulo:  "Reestructurar el collar",
      pros:    ["Baja el floor a nivel actual de TIIE",
                "Mantiene protección con strikes relevantes"],
      contras: ["Requiere nueva negociación con contraparte",
                "Posible costo de reestructura"],
      recom:   "alternativa",
    },
  ];

  el.innerHTML = opciones.map(o => `
    <div style="margin-bottom:14px; padding:12px;
                background:var(--bg-raised); border-radius:var(--radius-md);
                border-left:3px solid ${
                  o.recom === "recomendado" ? "var(--success)"
                  : o.recom === "neutral"   ? "var(--accent)"
                  : "var(--warn)"};">
      <div class="flex-between" style="margin-bottom:8px;">
        <span style="font-size:12.5px; font-weight:700;">${o.titulo}</span>
        <span class="badge ${
          o.recom === "recomendado" ? "badge-success"
          : o.recom === "neutral"   ? "badge-accent"
          : "badge-warn"}">
          ${o.recom.toUpperCase()}
        </span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div>
          <div style="font-size:10px; color:var(--success);
                      font-weight:700; margin-bottom:4px;">PROS</div>
          ${o.pros.map(p => `
            <div style="font-size:11px; color:var(--text-secondary);
                        margin-bottom:3px;">✓ ${p}</div>`).join("")}
        </div>
        <div>
          <div style="font-size:10px; color:var(--danger);
                      font-weight:700; margin-bottom:4px;">CONTRAS</div>
          ${o.contras.map(c => `
            <div style="font-size:11px; color:var(--text-secondary);
                        margin-bottom:3px;">✗ ${c}</div>`).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// ESTRUCTURA DE DEUDA
// ─────────────────────────────────────────
function _tasaRenderEstructura() {
  const el = document.getElementById("tasa-estructura");
  if (!el) return;

  const tiie = Scenarios.getVar("tiie28");
  const sofr = Scenarios.getVar("sofr1m");

  const creditos = AUTLAN.deuda.creditos.map(c => {
    const tasaBase = c.tasaBase === "SOFR"   ? sofr
                   : c.tasaBase === "TIIE28" ? tiie
                   : c.tasaBase === "FIJA"   ? c.tasaFija || 0
                   : 2.4; // EURIBOR estimado
    const tasaTotal = c.tasaBase === "FIJA"
      ? (c.tasaFija || 0)
      : tasaBase + c.spread;
    const costoAnual = c.saldoTotal.valor * tasaTotal / 100;

    return { ...c, tasaBase: tasaBase, tasaTotal, costoAnual };
  });

  const costoTotalAnual = creditos.reduce((s, c) => s + c.costoAnual, 0);

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Acreedor</th>
            <th>Tasa base actual</th>
            <th>Spread</th>
            <th>Tasa total</th>
            <th style="text-align:right;">Saldo (USD K)</th>
            <th style="text-align:right;">Costo anual (USD K)</th>
            <th>Cubierto</th>
          </tr>
        </thead>
        <tbody>
          ${creditos.map(c => `
            <tr>
              <td style="font-size:11.5px; font-weight:500;">
                ${c.acreedor.split(" ").slice(0,3).join(" ")}
              </td>
              <td class="mono" style="font-size:11.5px;">
                ${c.tasaBase === "FIJA" ? "Fija"
                  : `${c.tasaBase.toFixed ? c.tasaBase.toFixed(2) : c.tasaBase}%`}
              </td>
              <td class="mono" style="font-size:11.5px;">
                +${c.spread.toFixed(2)}%
              </td>
              <td class="mono" style="font-size:12px; font-weight:600;
                  color:${c.tasaTotal > 10 ? "var(--danger)"
                         : c.tasaTotal > 8 ? "var(--warn)"
                         : "var(--text-primary)"};">
                ${c.tasaTotal.toFixed(2)}%
              </td>
              <td class="mono" style="text-align:right;">
                ${c.saldoTotal.valor.toLocaleString()}
              </td>
              <td class="mono" style="text-align:right; font-weight:600;
                  color:var(--danger);">
                ${c.costoAnual.toFixed(0)}
              </td>
              <td>
                <span class="badge ${
                  c.id === 4 ? "badge-warn" : "badge-danger"}">
                  ${c.id === 4 ? "50% collar" : "No"}
                </span>
              </td>
            </tr>
          `).join("")}
          <tr style="background:var(--bg-raised); font-weight:700;">
            <td colspan="4">TOTAL</td>
            <td class="mono" style="text-align:right;">
              ${creditos.reduce((s,c) => s+c.saldoTotal.valor,0).toLocaleString()}
            </td>
            <td class="mono" style="text-align:right; color:var(--danger);">
              ${costoTotalAnual.toFixed(0)}
            </td>
            <td>
              <span class="badge badge-danger">
                ~5% cubierto
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top:12px; font-size:11.5px; color:var(--text-muted);">
      Costo financiero total estimado: <strong>USD ${(costoTotalAnual/1000).toFixed(1)}M/año</strong>
      · ${((AUTLAN.deuda.resumenTasa.sofr_usd.pct +
            AUTLAN.deuda.resumenTasa.tiie_mxn.pct +
            AUTLAN.deuda.resumenTasa.euribor_eur.pct).toFixed(0))}%
      deuda a tasa variable · Solo
      ${AUTLAN.deuda.resumenTasa.fija.pct.toFixed(1)}% a tasa fija
    </div>
  `;
}

// ─────────────────────────────────────────
// TABS
// ─────────────────────────────────────────
function _tasaTabSwapTIIE() {
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">
          IRS — Swap TIIE variable a fija
        </div>
        <div class="alert alert-info" style="margin-bottom:14px;">
          <span class="alert-icon">ℹ</span>
          <span style="font-size:11.5px;">
            Autlán paga tasa fija y recibe TIIE flotante.
            Si TIIE sube, el swap genera una ganancia que
            compensa el mayor costo de la deuda.
          </span>
        </div>
        <div class="field-group">
          <label>Nocional (USD miles)</label>
          <input type="number" id="tasa-swap-noc" value="15000" step="1000"
                 oninput="calcTasaSwapTIIE()" />
        </div>
        <div class="field-group">
          <label>Tasa fija a pagar (%)</label>
          <input type="number" id="tasa-swap-fija" value="8.00" step="0.05"
                 oninput="calcTasaSwapTIIE()" />
        </div>
        <div class="field-group">
          <label>TIIE actual (%)</label>
          <input type="number" id="tasa-swap-tiie" value="7.10" step="0.05"
                 oninput="calcTasaSwapTIIE()" />
        </div>
        <div class="field-group">
          <label>Spread sobre TIIE (%)</label>
          <input type="number" id="tasa-swap-spread" value="4.00" step="0.05"
                 oninput="calcTasaSwapTIIE()" />
        </div>
        <div class="field-group">
          <label>Vencimiento (años)</label>
          <input type="number" id="tasa-swap-T" value="3" step="0.5"
                 oninput="calcTasaSwapTIIE()" />
        </div>
      </div>
      <div id="tasa-swap-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular el swap.</span>
        </div>
      </div>
    </div>`;
}

function _tasaTabCap() {
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">
          Cap de tasa de interés
        </div>
        <div class="alert alert-info" style="margin-bottom:14px;">
          <span class="alert-icon">ℹ</span>
          <span style="font-size:11.5px;">
            El cap limita la tasa máxima que paga Autlán.
            Si TIIE sube sobre el strike, el cap compensa.
            Similar al collar existente pero solo el cap
            (sin floor vendido).
          </span>
        </div>
        <div class="field-group">
          <label>Nocional (USD miles)</label>
          <input type="number" id="tasa-cap-noc" value="15000" step="1000"
                 oninput="calcTasaCap()" />
        </div>
        <div class="field-group">
          <label>Strike del cap (%)</label>
          <input type="number" id="tasa-cap-strike" value="9.00" step="0.05"
                 oninput="calcTasaCap()" />
        </div>
        <div class="field-group">
          <label>TIIE forward (%)</label>
          <input type="number" id="tasa-cap-fwd" value="7.10" step="0.05"
                 oninput="calcTasaCap()" />
        </div>
        <div class="field-group">
          <label>Volatilidad TIIE (%)</label>
          <input type="number" id="tasa-cap-vol" value="25" step="1"
                 oninput="calcTasaCap()" />
        </div>
        <div class="field-group">
          <label>Vencimiento (años)</label>
          <input type="number" id="tasa-cap-T" value="3" step="0.5"
                 oninput="calcTasaCap()" />
        </div>
      </div>
      <div id="tasa-cap-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular el cap.</span>
        </div>
      </div>
    </div>`;
}

function _tasaTabSwapSOFR() {
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">
          IRS — Swap SOFR variable a fija
        </div>
        <div class="alert alert-warn" style="margin-bottom:14px;">
          <span class="alert-icon">⚠</span>
          <span style="font-size:11.5px;">
            La deuda SOFR (USD 135.5M) es la mayor exposición
            de Autlán a tasas. Cada 100bps de alza en SOFR
            cuesta ~USD 1.35M adicionales anuales.
          </span>
        </div>
        <div class="field-group">
          <label>Nocional SOFR a cubrir (USD miles)</label>
          <input type="number" id="tasa-sofr-noc" value="67000" step="5000"
                 oninput="calcTasaSwapSOFR()" />
        </div>
        <div class="field-group">
          <label>Tasa fija SOFR a pagar (%)</label>
          <input type="number" id="tasa-sofr-fija" value="4.50" step="0.05"
                 oninput="calcTasaSwapSOFR()" />
        </div>
        <div class="field-group">
          <label>SOFR actual (%)</label>
          <input type="number" id="tasa-sofr-actual" value="4.30" step="0.05"
                 oninput="calcTasaSwapSOFR()" />
        </div>
        <div class="field-group">
          <label>Spread SOFR (%)</label>
          <input type="number" id="tasa-sofr-spread" value="5.75" step="0.05"
                 oninput="calcTasaSwapSOFR()" />
        </div>
        <div class="field-group">
          <label>Vencimiento (años)</label>
          <input type="number" id="tasa-sofr-T" value="3" step="0.5"
                 oninput="calcTasaSwapSOFR()" />
        </div>
      </div>
      <div id="tasa-sofr-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular el swap SOFR.</span>
        </div>
      </div>
    </div>`;
}

function _tasaTabSwaption() {
  return `
    <div class="card" style="background:var(--bg-raised);">
      <div class="card-title" style="margin-bottom:12px;">
        Swaption — Opción sobre swap de tasa
      </div>
      <div class="alert alert-info" style="margin-bottom:16px;">
        <span class="alert-icon">ℹ</span>
        <span style="font-size:11.5px;">
          Una swaption da el <em>derecho</em> (no la obligación)
          de entrar en un swap a una tasa fija determinada en el futuro.
          Útil para Autlán si espera que las tasas suban pero
          no quiere comprometerse hoy.
        </span>
      </div>

      <div class="grid-2" style="gap:16px;">
        <div>
          ${_resultRow("Tipo sugerido",
                        "Payer swaption (derecho a pagar fija)")}
          ${_resultRow("Cuándo usar",
                        "Si Banxico revierte y TIIE sube sobre 9%")}
          ${_resultRow("Strike sugerido", "8.50% — entre floor actual y nivel de alerta")}
          ${_resultRow("Horizonte opción", "6 meses (antes de revisión USMCA jul-2026)")}
          ${_resultRow("Horizonte swap subyacente", "3 años")}
          ${_resultRow("Ventaja vs swap directo",
                        "Solo se ejerce si conviene — prima es la pérdida máxima")}
        </div>
        <div>
          <div class="alert alert-success">
            <span class="alert-icon">✓</span>
            <span style="font-size:11.5px;">
              <strong>Escenario ideal para swaption:</strong>
              Autlán cree que la TIIE puede subir si el USMCA falla en julio-2026
              (escenario adverso: TIIE 7.75%+).
              La swaption permite protegerse contra ese tail risk
              pagando una prima hoy y ejerciendo solo si se materializa.
            </span>
          </div>
          <div class="alert alert-warn" style="margin-top:12px;">
            <span class="alert-icon">⚠</span>
            <span style="font-size:11.5px;">
              Con DSCR de 0.6x, pagar la prima de la swaption
              presiona la liquidez. Evaluar si el swap directo
              (sin prima, certidumbre inmediata) es más apropiado
              dado el perfil de liquidez actual de Autlán.
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// CÁLCULOS
// ─────────────────────────────────────────
window.switchTasaTab = function(idx) {
  [0,1,2,3].forEach(i => {
    const tab = document.getElementById(`tasa-tab-${i}`);
    const btn = document.querySelector(`.tasa-tab[data-tab="${i}"]`);
    if (!tab || !btn) return;
    const active = i === idx;
    tab.style.display      = active ? "block" : "none";
    btn.style.color        = active ? "var(--accent)" : "var(--text-muted)";
    btn.style.borderBottom = active
      ? "2px solid var(--accent)" : "2px solid transparent";
  });
};

window.calcTasaSwapTIIE = function() {
  const noc    = parseFloat(document.getElementById("tasa-swap-noc")?.value    || 15000);
  const fija   = parseFloat(document.getElementById("tasa-swap-fija")?.value   || 8.00) / 100;
  const tiie   = parseFloat(document.getElementById("tasa-swap-tiie")?.value   || 7.10) / 100;
  const spread = parseFloat(document.getElementById("tasa-swap-spread")?.value || 4.00) / 100;
  const T      = parseFloat(document.getElementById("tasa-swap-T")?.value      || 3);

  const res = Models.swapMTM(noc, fija, tiie, spread, T, tiie + spread);
  const el  = document.getElementById("tasa-swap-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">Resultado IRS TIIE</div>
    ${_resultRow("Tasa fija a pagar", `${(fija*100).toFixed(2)}%`)}
    ${_resultRow("TIIE + spread actual", `${((tiie+spread)*100).toFixed(2)}%`)}
    ${_resultRow("Mark-to-market",
                  `USD ${res.mtm.toFixed(1)}K`,
                  res.mtm >= 0 ? "positive" : "danger")}
    ${_resultRow("Ahorro/(costo) anual",
                  `USD ${res.ahorroAnual.toFixed(1)}K`,
                  res.ahorroAnual >= 0 ? "positive" : "danger")}
    ${_resultRow("DV01", `USD ${res.dv01.toFixed(2)}K / 1bp`)}
    ${_resultRow("VPN flujos fijos",
                  `USD ${res.vpnFijo.toFixed(1)}K`)}
    ${_resultRow("VPN flujos variables",
                  `USD ${res.vpnVariable.toFixed(1)}K`)}

    <div class="alert alert-${res.mtm >= 0 ? "success" : "warn"}"
         style="margin-top:12px;">
      <span class="alert-icon">${res.mtm >= 0 ? "✓" : "⚠"}</span>
      <span style="font-size:11.5px;">${res.ventaja}</span>
    </div>
  `;
};

window.calcTasaCap = function() {
  const noc    = parseFloat(document.getElementById("tasa-cap-noc")?.value    || 15000);
  const strike = parseFloat(document.getElementById("tasa-cap-strike")?.value || 9.00) / 100;
  const fwd    = parseFloat(document.getElementById("tasa-cap-fwd")?.value    || 7.10) / 100;
  const vol    = parseFloat(document.getElementById("tasa-cap-vol")?.value    || 25)   / 100;
  const T      = parseFloat(document.getElementById("tasa-cap-T")?.value      || 3);
  const r      = Scenarios.getVar("tiie28") / 100;

  const res = Models.capPrice(noc, strike, fwd, vol, T, r, 12);
  const el  = document.getElementById("tasa-cap-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">Resultado del cap</div>
    ${_resultRow("Strike (tasa máxima)", `${(strike*100).toFixed(2)}%`)}
    ${_resultRow("TIIE forward", `${(fwd*100).toFixed(2)}%`)}
    ${_resultRow("Prima total cap", `USD ${res.prima.toFixed(1)}K`, "warn")}
    ${_resultRow("Prima anualizada", `USD ${res.primaAnual.toFixed(1)}K/año`)}
    ${_resultRow("Prima en bps", `${res.primaBps.toFixed(1)} bps del nocional`)}
    ${_resultRow("Protección a partir de", `TIIE > ${(strike*100).toFixed(2)}%`)}

    <div class="alert alert-info" style="margin-top:12px;">
      <span class="alert-icon">ℹ</span>
      <span style="font-size:11.5px;">
        El cap protege si TIIE supera ${(strike*100).toFixed(2)}%.
        Con TIIE actual en ${(fwd*100).toFixed(2)}%, el cap está
        ${fwd < strike ? `OTM por ${((strike-fwd)*100).toFixed(2)}pp — prima baja.`
                       : `ITM — prima más alta pero protección inmediata.`}
      </span>
    </div>
  `;
};

window.calcTasaSwapSOFR = function() {
  const noc    = parseFloat(document.getElementById("tasa-sofr-noc")?.value    || 67000);
  const fija   = parseFloat(document.getElementById("tasa-sofr-fija")?.value   || 4.50) / 100;
  const sofr   = parseFloat(document.getElementById("tasa-sofr-actual")?.value || 4.30) / 100;
  const spread = parseFloat(document.getElementById("tasa-sofr-spread")?.value || 5.75) / 100;
  const T      = parseFloat(document.getElementById("tasa-sofr-T")?.value      || 3);

  const res = Models.swapMTM(noc, fija, sofr, spread, T, sofr + spread);
  const el  = document.getElementById("tasa-sofr-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">Resultado swap SOFR</div>
    ${_resultRow("Nocional cubierto",
                  `USD ${noc.toLocaleString()}K (${(noc/135479*100).toFixed(0)}% deuda SOFR)`)}
    ${_resultRow("Tasa fija SOFR", `${(fija*100).toFixed(2)}%`)}
    ${_resultRow("SOFR + spread actual",
                  `${((sofr+spread)*100).toFixed(2)}%`)}
    ${_resultRow("Mark-to-market",
                  `USD ${res.mtm.toFixed(1)}K`,
                  res.mtm >= 0 ? "positive" : "danger")}
    ${_resultRow("Ahorro/(costo) anual",
                  `USD ${res.ahorroAnual.toFixed(1)}K`,
                  res.ahorroAnual >= 0 ? "positive" : "danger")}
    ${_resultRow("DV01 SOFR",
                  `USD ${res.dv01.toFixed(2)}K / 1bp`)}
    ${_resultRow("Sensibilidad 100bps",
                  `USD ${(res.dv01*100).toFixed(1)}K`)}

    <div class="alert alert-warn" style="margin-top:12px;">
      <span class="alert-icon">⚠</span>
      <span style="font-size:11.5px;">
        La deuda SOFR (USD 135.5M) es la mayor exposición de Autlán.
        Cubrir 50% (USD ${(135479*0.5/1000).toFixed(0)}M) reduce el DV01
        total a la mitad. Recomendado dado el DSCR de 0.6x.
      </span>
    </div>
  `;
};

// ─────────────────────────────────────────
// TABLA COMPARATIVA
// ─────────────────────────────────────────
function _tasaRenderTablaComparativa() {
  const el = document.getElementById("tasa-tabla-comparativa");
  if (!el) return;

  const esc  = Scenarios.getState().escenarios;
  const sofr = Scenarios.getVar("sofr1m");

  const tasas = {
    base:      { tiie: esc.base.tiie28,      sofr: esc.base.sofr1m      },
    optimista: { tiie: esc.optimista.tiie28, sofr: esc.optimista.sofr1m },
    adverso:   { tiie: esc.adverso.tiie28,   sofr: esc.adverso.sofr1m   },
  };

  const costoDeuda = (tiie, sofr) => {
    const sofr_usd  = 135479 * (sofr + 5.75) / 100;
    const tiie_mxn  = 29747  * (tiie + 4.75) / 100;
    const fijo      = 2000   * 7.90  / 100;
    const eur       = 3401   * (2.40 + 1.0) / 100;
    return sofr_usd + tiie_mxn + fijo + eur;
  };

  const collar = AUTLAN.derivadosVigentes.collarTasa;
  const costoConCollar = (tiie, sofr) => {
    const tiieEf = Math.min(Math.max(tiie, collar.floor), collar.cap);
    const nocUSD = collar.nocionalMXN.valor / Scenarios.getVar("usdmxn");
    const ahorro = (tiie - tiieEf) * nocUSD / 100;
    return costoDeuda(tiie, sofr) - ahorro;
  };

  const swapFija = 8.0;
  const nocSwap  = 15000;
  const costoConSwap = (tiie, sofr) => {
    const base = costoDeuda(tiie, sofr);
    const ahorro = (tiie + 4.0 - swapFija) * nocSwap / 100;
    return base - Math.max(ahorro, 0);
  };

  const fmt = (v) => `USD ${(v/1000).toFixed(1)}M`;

  const filas = [
    { label: "Sin cobertura (deuda variable total)",
      fn: (t) => costoDeuda(t.tiie, t.sofr) },
    { label: `Collar TIIE vigente (floor ${collar.floor}%/cap ${collar.cap}%)`,
      fn: (t) => costoConCollar(t.tiie, t.sofr) },
    { label: `IRS TIIE fija ${swapFija}% (USD ${nocSwap/1000}M)`,
      fn: (t) => costoConSwap(t.tiie, t.sofr) },
    { label: "Solo autogeneración (reduce CFE, no tasa)",
      fn: (t) => costoDeuda(t.tiie, t.sofr) - 11200 },
  ];

  el.innerHTML = filas.map((f, i) => {
    const vB = f.fn(tasas.base);
    const vO = f.fn(tasas.optimista);
    const vA = f.fn(tasas.adverso);

    return `
      <tr class="${i === 0 ? "row-highlight" : ""}">
        <td>${i === 0 ? "<strong>" : ""}${f.label}${i === 0 ? "</strong>" : ""}</td>
        <td class="esc-base mono negative">${fmt(vB)}</td>
        <td class="esc-optimista mono negative">${fmt(vO)}</td>
        <td class="esc-adverso mono negative">${fmt(vA)}</td>
      </tr>`;
  }).join("");
}

// ─────────────────────────────────────────
// DV01
// ─────────────────────────────────────────
function _tasaRenderDV01() {
  const el = document.getElementById("tasa-dv01");
  if (!el) return;

  const tiie = Scenarios.getVar("tiie28");
  const sofr = Scenarios.getVar("sofr1m");

  const dv01TIIE  = 29747  / 10000; // USD K por 1bp
  const dv01SOFR  = 135479 / 10000;
  const dv01Total = dv01TIIE + dv01SOFR;

  const shocks = [25, 50, 100, 200];

  el.innerHTML = `
    <div class="grid-2" style="gap:24px;">
      <div>
        <div class="section-title" style="margin-top:0;">
          DV01 — Sensibilidad por 1 basis point
        </div>
        ${_resultRow("DV01 deuda TIIE (USD 29.7M)",
                      `USD ${dv01TIIE.toFixed(1)}K / bp`)}
        ${_resultRow("DV01 deuda SOFR (USD 135.5M)",
                      `USD ${dv01SOFR.toFixed(1)}K / bp`)}
        ${_resultRow("DV01 total deuda variable",
                      `USD ${dv01Total.toFixed(1)}K / bp`, "danger")}
        ${_resultRow("DV01 post-collar TIIE (50% cubierto)",
                      `USD ${(dv01TIIE*0.5 + dv01SOFR).toFixed(1)}K / bp`, "warn")}
      </div>

      <div>
        <div class="section-title" style="margin-top:0;">
          Impacto por shock de tasas (USD miles)
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shock</th>
                <th>TIIE</th>
                <th>SOFR</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${shocks.map(s => `
                <tr>
                  <td class="mono">+${s}bps</td>
                  <td class="mono negative">
                    -${(dv01TIIE * s).toFixed(0)}K
                  </td>
                  <td class="mono negative">
                    -${(dv01SOFR * s).toFixed(0)}K
                  </td>
                  <td class="mono negative" style="font-weight:700;">
                    -USD ${(dv01Total * s / 1000).toFixed(2)}M
                  </td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// RECOMENDACIÓN
// ─────────────────────────────────────────
function _tasaRenderRecomendacion() {
  const el = document.getElementById("tasa-recomendacion");
  if (!el) return;

  const tiie = Scenarios.getVar("tiie28");
  const sofr = Scenarios.getVar("sofr1m");

  el.innerHTML = `
    <div class="card-title" style="margin-bottom:16px;">
      Análisis de postura · TIIE ${tiie.toFixed(2)}% · SOFR ${sofr.toFixed(2)}%
    </div>

    <div class="grid-3" style="gap:16px; margin-bottom:16px;">
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--accent);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--accent); margin-bottom:6px;">
          QUÉ RIESGO MITIGA
        </div>
        <div style="font-size:12px; line-height:1.6;">
          Alza en TIIE y SOFR que incrementa el costo de servicio
          de la deuda variable (${(AUTLAN.deuda.resumenTasa.sofr_usd.pct +
            AUTLAN.deuda.resumenTasa.tiie_mxn.pct).toFixed(0)}% del total).
          Con DSCR de 0.6x, cada 100bps adicionales presiona
          aún más la cobertura del servicio de deuda.
        </div>
      </div>
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--warn);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--warn); margin-bottom:6px;">
          SITUACIÓN COLLAR EXISTENTE
        </div>
        <div style="font-size:12px; line-height:1.6;">
          El collar vigente (floor 8.75% / cap 11%) está fuera del dinero
          porque la TIIE cayó más de lo esperado al contratarlo.
          La empresa está en un ciclo de recortes — el collar
          fue diseñado para un escenario de TIIE alta que no se materializó.
        </div>
      </div>
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--success);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--success); margin-bottom:6px;">
          ESTRATEGIA SUGERIDA
        </div>
        <div style="font-size:12px; line-height:1.6;">
          <strong>Mantener el collar TIIE</strong> como protección
          de tail risk (USMCA adverso → Banxico sube).
          Agregar <strong>IRS SOFR</strong> sobre 50% de la deuda
          principal (USD ~67M) para fijar el mayor componente
          del gasto financiero.
        </div>
      </div>
    </div>

    <div class="alert alert-${tiie < 7.0 ? "info"
                             : tiie < 8.0 ? "warn" : "danger"}">
      <span class="alert-icon">
        ${tiie < 7.0 ? "ℹ" : tiie < 8.0 ? "⚠" : "🚨"}
      </span>
      <span style="font-size:12px;">
        <strong>Postura actual:</strong>
        ${tiie < 7.0
          ? `Ciclo de recortes activo (TIIE ${tiie.toFixed(2)}%).
             El gasto financiero MXN está mejorando.
             Mantener collar como protección de tail risk (Banxico reversal).
             Priorizar cobertura SOFR que es la exposición mayor.`
          : tiie < 8.0
          ? `TIIE acercándose al floor del collar (${tiie.toFixed(2)}% vs 8.75%).
             Si TIIE sube 65bps más, el collar entra en el dinero.
             Buena relación riesgo/retorno para mantenerlo.`
          : `TIIE sobre el floor — collar en el dinero (${tiie.toFixed(2)}%).
             El cap está protegiendo activamente. Evaluar extender
             el collar o agregar IRS para fijar la tasa completamente.`}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// BIND & INIT
// ─────────────────────────────────────────
function _tasaBindCalcs() {
  calcTasaSwapTIIE();
  calcTasaCap();
  calcTasaSwapSOFR();
}

Scenarios.on("page:tasa", () => {
  const el = document.getElementById("tasa-content");
  if (el) renderTasa();
});