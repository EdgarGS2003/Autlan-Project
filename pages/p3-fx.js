/**
 * pages/p3-fx.js — Riesgo Tipo de Cambio USD/MXN
 * Modelos: Collar (Heston), Forward (paridad cubierta), Swap divisas
 */

function renderFX() {
  const el = document.getElementById("fx-content");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;

  el.innerHTML = `

    <!-- EXPOSICIÓN ACTUAL -->
    <div class="alert alert-danger mb-24">
      <span class="alert-icon">⚠</span>
      <span>
        ${isEn
          ? `Active FX hedging: <strong>~3%</strong> of exposure covered vs <strong>60%</strong> allowed by internal policy. Gap of <strong>~57 pp</strong> without protection on ~USD 394M of annualized revenues. Current USD/MXN: <strong id="fx-tc-live">17.20</strong>`
          : `Cobertura FX activa: <strong>~3%</strong> de exposición cubierta vs <strong>60%</strong> permitido por política interna. Gap de <strong>~57 pp</strong> sin protección sobre ~USD 394M de ingresos anualizados. USD/MXN actual: <strong id="fx-tc-live">17.20</strong>`}
      </span>
    </div>

    <!-- KPIs DE EXPOSICIÓN -->
    <div class="grid-4 mb-24" id="fx-kpis"></div>

    <!-- COLLARES VIGENTES -->
    <div class="section-title">${isEn ? "Active USD/MXN Collars · 1Q26" : "Collares USD/MXN vigentes · 1T26"}</div>
    <div class="card mb-24" id="fx-collares-vigentes"></div>

    <!-- TABS DE INSTRUMENTOS -->
    <div class="section-title">${isEn ? "Evaluate Hedging Instruments" : "Evaluar instrumentos de cobertura"}</div>
    <div class="card mb-24">

      <!-- Tab headers -->
      <div style="display:flex; gap:4px; margin-bottom:20px;
                  border-bottom:2px solid var(--border); padding-bottom:0;">
        ${["Collar", "Forward", isEn ? "Put Option" : "Put Opción", isEn ? "Currency Swap" : "Swap Divisas"].map((t, i) => `
          <button class="fx-tab ${i === 0 ? "active" : ""}"
                  data-tab="${i}"
                  onclick="switchFXTab(${i})"
                  style="padding:8px 16px; font-size:12px; font-weight:500;
                         border:none; background:none; cursor:pointer;
                         border-bottom:2px solid ${i === 0 ? "var(--accent)" : "transparent"};
                         margin-bottom:-2px;
                         color:${i === 0 ? "var(--accent)" : "var(--text-muted)"};">
            ${t}
          </button>`).join("")}
      </div>

      <!-- Tab contents -->
      <div id="fx-tab-0">${_fxTabCollar()}</div>
      <div id="fx-tab-1" style="display:none;">${_fxTabForward()}</div>
      <div id="fx-tab-2" style="display:none;">${_fxTabPut()}</div>
      <div id="fx-tab-3" style="display:none;">${_fxTabSwap()}</div>

    </div>

    <!-- TABLA COMPARATIVA — flujo sin vs con cobertura -->
    <div class="section-title">${isEn ? "Flow Comparison by Scenario" : "Comparativo de flujos por escenario"}</div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>${isEn ? "Instrument / Scenario" : "Instrumento / Escenario"}</th>
            <th class="esc-header-base">Base · $18.00</th>
            <th class="esc-header-opt">${isEn ? "Optimistic · $19.50" : "Optimista · $19.50"}</th>
            <th class="esc-header-adv">${isEn ? "Adverse · $16.00" : "Adverso · $16.00"}</th>
          </tr>
        </thead>
        <tbody id="fx-tabla-comparativa"></tbody>
      </table>
    </div>

    <!-- PAYOFF CHART -->
    <div class="section-title">${isEn ? "Payoff Diagram · USD/MXN" : "Diagrama de payoff · USD/MXN"}</div>
    <div class="card mb-24">
      <div class="chart-title">${isEn ? "Instrument gain/loss as a function of the exchange rate at maturity" : "Ganancia/pérdida del instrumento en función del tipo de cambio al vencimiento"}</div>
      <canvas id="fx-payoff-chart" height="200"></canvas>
      <div id="fx-chart-leyenda"
           style="display:flex; gap:16px; margin-top:12px;
                  flex-wrap:wrap; font-size:11px;"></div>
    </div>

    <!-- ESTRATEGIA RECOMENDADA -->
    <div class="section-title">${isEn ? "Analysis and Recommendation" : "Análisis y recomendación"}</div>
    <div class="card mb-24" id="fx-recomendacion"></div>

  `;

  _fxRenderKPIs();
  _fxRenderCollaresVigentes();
  _fxRenderTablaComparativa();
  _fxRenderPayoffChart();
  _fxRenderRecomendacion();
  _fxBindCalcs();

  Scenarios.on("var:usdmxn", () => {
    _fxRenderKPIs();
    _fxRenderTablaComparativa();
    _fxRenderPayoffChart();
  });
}

// ─────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────
function _fxRenderKPIs() {
  const el = document.getElementById("fx-kpis");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const tc     = Scenarios.getVar("usdmxn");
  const tcBase = 18.0;
  const ingresosUSD = 394000; // anualizado 1T26×4
  const impacto1peso = ingresosUSD * 0.85 / tcBase; // USD por 1 MXN de movimiento

  const exp    = AUTLAN.derivadosVigentes.exposicionVsCobertura;
  const nocCub = exp.coberturaFX_nocional.valor;
  const nocExp = ingresosUSD - nocCub;

  el.innerHTML = [
    {
      label: isEn ? "Current USD/MXN" : "USD/MXN actual",
      value: `$${tc.toFixed(2)}`,
      sub:   isEn ? "Base Reference: $18.00" : `Base referencia: $18.00`,
      tipo:  tc < 17.5 ? "danger" : tc > 18.5 ? "success" : "warn",
      delta: isEn
        ? (tc < 18 ? `Strong Peso ${((18-tc)/18*100).toFixed(1)}%` : `Weak Peso +${((tc-18)/18*100).toFixed(1)}%`)
        : (tc < 18 ? `Peso fuerte ${((18-tc)/18*100).toFixed(1)}%` : `Peso débil +${((tc-18)/18*100).toFixed(1)}%`),
      dir:   tc < 18 ? "down" : "up",
    },
    {
      label: isEn ? "Impact per $1 MXN" : "Impacto por $1 MXN",
      value: `USD ${(impacto1peso/1000).toFixed(1)}M`,
      sub:   isEn ? "In Annualized Revenues" : "En ingresos anualizados",
      tipo:  "warn",
      delta: isEn ? "Per Unit Movement" : "Por movimiento unitario",
      dir:   "down",
    },
    {
      label: isEn ? "Covered Exposure" : "Exposición cubierta",
      value: `USD ${(nocCub/1000).toFixed(0)}M`,
      sub:   isEn ? `${exp.pctCubierto_FX.valor}% of total — only 3 months` : `${exp.pctCubierto_FX.valor}% del total — solo 3 meses`,
      tipo:  "danger",
      delta: isEn ? "Far Below 60%" : "Muy por debajo del 60%",
      dir:   "down",
    },
    {
      label: isEn ? "Uncovered Exposure" : "Exposición sin cubrir",
      value: `USD ${(nocExp/1000).toFixed(0)}M`,
      sub:   isEn ? `${(100 - exp.pctCubierto_FX.valor).toFixed(0)}% unprotected` : `${(100 - exp.pctCubierto_FX.valor).toFixed(0)}% desprotegido`,
      tipo:  "danger",
      delta: isEn ? `Gap vs Policy: ${exp.gapCobertura_FX.valor} pp` : `Gap vs política: ${exp.gapCobertura_FX.valor} pp`,
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

  // Actualizar live
  const liveEl = document.getElementById("fx-tc-live");
  if (liveEl) liveEl.textContent = tc.toFixed(2);
}

// ─────────────────────────────────────────
// COLLARES VIGENTES
// ─────────────────────────────────────────
function _fxRenderCollaresVigentes() {
  const el = document.getElementById("fx-collares-vigentes");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const tc      = Scenarios.getVar("usdmxn");
  const collares = AUTLAN.derivadosVigentes.collarsFX;

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>${isEn ? "Contract Date" : "Fecha contrato"}</th>
            <th>${isEn ? "Floor (long put)" : "Floor (put largo)"}</th>
            <th>${isEn ? "Cap (short call)" : "Cap (call corto)"}</th>
            <th>${isEn ? "Notional/month" : "Nocional/mes"}</th>
            <th>${isEn ? "Maturity" : "Vencimiento"}</th>
            <th>${isEn ? "Current FX Status" : "Estado TC actual"}</th>
            <th>${isEn ? "Estimated Payoff" : "Payoff estimado"}</th>
          </tr>
        </thead>
        <tbody>
          ${collares.map(c => {
            const payoff = Models.collarPayoff(tc, c.floorUSD, c.capUSD, c.nocionalUSD.valor);
            const zona   = payoff.zona;
            const zonaCls = zona === "PUT_EJERCIDO"  ? "positive"
                          : zona === "CALL_EJERCIDO" ? "negative"
                          : "warn";
            const zonaLbl = isEn
              ? (zona === "PUT_EJERCIDO" ? "✓ Put protects" : (zona === "CALL_EJERCIDO" ? "✗ Call limits" : "◎ Within range"))
              : (zona === "PUT_EJERCIDO" ? "✓ Put protege" : (zona === "CALL_EJERCIDO" ? "✗ Call limita" : "◎ Dentro del rango"));
            return `
              <tr>
                <td class="text-muted">${c.id.replace("IFD-","")}</td>
                <td class="mono" style="font-size:11px;">${c.fechaContrato}</td>
                <td class="mono positive">$${c.floorUSD.toFixed(2)}</td>
                <td class="mono warn">$${c.capUSD.toFixed(4)}</td>
                <td class="mono">USD ${c.nocionalUSD.valor.toLocaleString()}K</td>
                <td class="mono" style="font-size:11px;">${c.vencimiento}</td>
                <td class="${zonaCls}">${zonaLbl}</td>
                <td class="mono ${payoff.payoffCollar >= 0 ? "positive" : "negative"}">
                  ${payoff.payoffCollar >= 0 ? "+" : ""}
                  USD ${payoff.payoffCollar.toFixed(1)}K
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
    <div style="margin-top:12px; font-size:11px; color:var(--text-muted);">
      ${isEn
        ? `Total covered notional: USD ${(collares.length * 1000).toLocaleString()}K/month · Maturity Jun-2026 · Policy allows up to USD ${(394000*0.6/12).toFixed(0)}K/month additional`
        : `Total nocional cubierto: USD ${(collares.length * 1000).toLocaleString()}K/mes · Vencimiento jun-2026 · Política permite hasta USD ${(394000*0.6/12).toFixed(0)}K/mes adicionales`}
    </div>
  `;
}

// ─────────────────────────────────────────
// TABS — INSTRUMENTOS
// ─────────────────────────────────────────
function _fxTabCollar() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "Collar Parameters" : "Parámetros del collar"}</div>

        <div class="field-group">
          <label>${isEn ? "Floor — long put (protection floor)" : "Floor — put largo (piso de protección)"}</label>
          <input type="number" id="fx-collar-floor" value="17.50" step="0.05"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Cap — short call (yielded ceiling)" : "Cap — call corto (techo que se cede)"}</label>
          <input type="number" id="fx-collar-cap" value="18.50" step="0.05"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Notional (USD thousands)" : "Nocional (USD miles)"}</label>
          <input type="number" id="fx-collar-noc" value="10000" step="1000"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="fx-collar-T" value="6" min="1" max="12"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Implied Volatility (%)" : "Volatilidad implícita (%)"}</label>
          <input type="number" id="fx-collar-vol" value="12" step="0.5"
                 oninput="calcFXCollar()" />
        </div>
      </div>

      <div id="fx-collar-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate collar." : "Ajusta los parámetros para calcular el collar."}</span>
        </div>
      </div>
    </div>
  `;
}

function _fxTabForward() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "Forward Parameters" : "Parámetros del forward"}</div>
        <div class="field-group">
          <label>${isEn ? "Spot Exchange Rate (USD/MXN)" : "Tipo de cambio spot (USD/MXN)"}</label>
          <input type="number" id="fx-fwd-spot" value="17.20" step="0.05"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "MXN Rate — TIIE (% annual)" : "Tasa MXN — TIIE (% anual)"}</label>
          <input type="number" id="fx-fwd-rmx" value="7.10" step="0.05"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "USD Rate — SOFR (% annual)" : "Tasa USD — SOFR (% anual)"}</label>
          <input type="number" id="fx-fwd-rusd" value="4.30" step="0.05"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="fx-fwd-T" value="6" min="1" max="12"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Notional (USD thousands)" : "Nocional (USD miles)"}</label>
          <input type="number" id="fx-fwd-noc" value="10000" step="1000"
                 oninput="calcFXForward()" />
        </div>
      </div>
      <div id="fx-fwd-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate forward." : "Ajusta los parámetros para calcular el forward."}</span>
        </div>
      </div>
    </div>
  `;
}

function _fxTabPut() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "USD/MXN Put — Sell Option" : "Put USD/MXN — opción de venta"}</div>
        <div class="field-group">
          <label>${isEn ? "Current Spot (USD/MXN)" : "Spot actual (USD/MXN)"}</label>
          <input type="number" id="fx-put-spot" value="17.20" step="0.05"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Strike (exercise price)" : "Strike (precio de ejercicio)"}</label>
          <input type="number" id="fx-put-strike" value="17.00" step="0.05"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Implied Volatility (%)" : "Volatilidad implícita (%)"}</label>
          <input type="number" id="fx-put-vol" value="12" step="0.5"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="fx-put-T" value="6" min="1" max="12"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Notional (USD thousands)" : "Nocional (USD miles)"}</label>
          <input type="number" id="fx-put-noc" value="10000" step="1000"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Pricing Model" : "Modelo de pricing"}</label>
          <select id="fx-put-modelo" onchange="calcFXPut()">
            <option value="bs">${isEn ? "Standard Black-Scholes" : "Black-Scholes estándar"}</option>
            <option value="heston" selected>${isEn ? "Heston (stochastic volatility)" : "Heston (volatilidad estocástica)"}</option>
          </select>
        </div>
      </div>
      <div id="fx-put-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate put option." : "Ajusta los parámetros para calcular la put."}</span>
        </div>
      </div>
    </div>
  `;
}

function _fxTabSwap() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "USD/MXN Cross-Currency Swap" : "Cross-currency swap USD/MXN"}</div>
        <div class="field-group">
          <label>${isEn ? "Notional in USD (thousands)" : "Nocional en USD (miles)"}</label>
          <input type="number" id="fx-swap-noc" value="20000" step="1000"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Fixed MXN Rate Received (%)" : "Tasa fija MXN que recibes (%)"}</label>
          <input type="number" id="fx-swap-fija" value="10.50" step="0.05"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Current TIIE (%)" : "TIIE actual (%)"}</label>
          <input type="number" id="fx-swap-tiie" value="7.10" step="0.05"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Spread over TIIE (%)" : "Spread sobre TIIE (%)"}</label>
          <input type="number" id="fx-swap-spread" value="1.50" step="0.05"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Maturity (years)" : "Vencimiento (años)"}</label>
          <input type="number" id="fx-swap-T" value="1" step="0.25"
                 oninput="calcFXSwap()" />
        </div>
      </div>
      <div id="fx-swap-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate currency swap." : "Ajusta los parámetros para calcular el swap."}</span>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// CÁLCULOS POR INSTRUMENTO
// ─────────────────────────────────────────
window.switchFXTab = function(idx) {
  [0, 1, 2, 3].forEach(i => {
    const tab     = document.getElementById(`fx-tab-${i}`);
    const btn     = document.querySelector(`.fx-tab[data-tab="${i}"]`);
    if (!tab || !btn) return;
    const active  = i === idx;
    tab.style.display       = active ? "block" : "none";
    btn.style.color         = active ? "var(--accent)" : "var(--text-muted)";
    btn.style.borderBottom  = active ? "2px solid var(--accent)" : "2px solid transparent";
  });
};

window.calcFXCollar = function() {
  const isEn   = I18N.getLocale() === "en";
  const S      = Scenarios.getVar("usdmxn");
  const floor  = parseFloat(document.getElementById("fx-collar-floor")?.value  || 17.5);
  const cap    = parseFloat(document.getElementById("fx-collar-cap")?.value    || 18.5);
  const noc    = parseFloat(document.getElementById("fx-collar-noc")?.value    || 10000);
  const meses  = parseFloat(document.getElementById("fx-collar-T")?.value      || 6);
  const volPct = parseFloat(document.getElementById("fx-collar-vol")?.value    || 12);

  const T      = meses / 12;
  const r_d    = Scenarios.getVar("tiie28") / 100;
  const r_f    = Scenarios.getVar("sofr1m") / 100;
  const sigma  = volPct / 100;

  const result = Models.collarPrice(S, floor, cap, T, r_d, r_f, sigma, true,
    Models.PARAMS.fx_usdmxn);

  const el = document.getElementById("fx-collar-result");
  if (!el) return;

  const costoPesos = result.costoNeto * noc;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Collar Outcome" : "Resultado del collar"}</div>
    ${_resultRow(isEn ? "Current Spot" : "Spot actual", `$${S.toFixed(2)} MXN/USD`)}
    ${_resultRow(isEn ? "Floor (long put)" : "Floor (put largo)", `$${floor.toFixed(2)}`, "positive")}
    ${_resultRow(isEn ? "Cap (short call)" : "Cap (call corto)", `$${cap.toFixed(2)}`, "warn")}
    ${_resultRow(isEn ? "Put Premium" : "Prima put", `$${result.put.precio.toFixed(4)}/USD`)}
    ${_resultRow(isEn ? "Call Premium" : "Prima call", `$${result.call.precio.toFixed(4)}/USD`)}
    ${_resultRow(isEn ? "Net Collar Cost" : "Costo neto collar", `$${result.costoNeto.toFixed(4)}/USD`,
                  result.esCostless ? "positive" : "warn")}
    ${_resultRow(isEn ? "Total Notional Cost" : "Costo total nocional", `USD ${costoPesos.toFixed(1)}K`,
                  result.esCostless ? "positive" : "warn")}
    ${_resultRow(isEn ? "Protected Range" : "Rango protegido", `$${floor.toFixed(2)} — $${cap.toFixed(2)}`)}
    ${_resultRow(isEn ? "Costless Collar?" : "¿Costless collar?",
                  result.esCostless ? (isEn ? "✓ Yes — zero premium" : "✓ Sí — prima cero") : (isEn ? "✗ No — has cost" : "✗ No — tiene costo"),
                  result.esCostless ? "positive" : "warn")}
    ${_resultRow(isEn ? "Model" : "Modelo", result.modelo || "Heston")}

    <div class="alert alert-${result.esCostless ? "success" : "info"}" style="margin-top:12px;">
      <span class="alert-icon">${result.esCostless ? "✓" : "ℹ"}</span>
      <span style="font-size:11.5px;">
        ${result.esCostless
          ? (isEn ? "Costless collar — the premium of the sold call finances the purchased put. Preferred strategy under Autlán policy." : "Costless collar — la prima del call vendido financia el put comprado. Estrategia preferida por política Autlán.")
          : (isEn ? `Collar with net cost of $${result.costoNeto.toFixed(4)} per USD. Adjust floor/cap to approximate costless.` : `Collar con costo neto de $${result.costoNeto.toFixed(4)} por USD. Ajusta floor/cap para aproximar a costless.`)}
      </span>
    </div>
  `;

  _fxRenderPayoffChart();
};

window.calcFXForward = function() {
  const isEn  = I18N.getLocale() === "en";
  const spot  = parseFloat(document.getElementById("fx-fwd-spot")?.value   || 17.20);
  const r_d   = parseFloat(document.getElementById("fx-fwd-rmx")?.value    || 7.10) / 100;
  const r_f   = parseFloat(document.getElementById("fx-fwd-rusd")?.value   || 4.30) / 100;
  const meses = parseFloat(document.getElementById("fx-fwd-T")?.value      || 6);
  const noc   = parseFloat(document.getElementById("fx-fwd-noc")?.value    || 10000);
  const T     = meses / 12;

  const res   = Models.forwardPrice(spot, r_d, r_f, T);
  const costoCub = (res.forward - spot) * noc; // costo de oportunidad

  const el = document.getElementById("fx-fwd-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Forward Outcome" : "Resultado del forward"}</div>
    ${_resultRow(isEn ? "Current Spot" : "Spot actual", `$${spot.toFixed(4)}`)}
    ${_resultRow(isEn ? "Forward Price" : "Precio forward", `$${res.forward.toFixed(4)}`, "accent")}
    ${_resultRow(isEn ? "Swap Points (fwd-spot)" : "Puntos swap (fwd−spot)", `$${res.puntosSwap.toFixed(4)}`,
                  res.puntosSwap > 0 ? "warn" : "positive")}
    ${_resultRow(isEn ? "Rate Differential (TIIE-SOFR)" : "Diferencial tasas (TIIE−SOFR)",
                  `${((r_d-r_f)*100).toFixed(2)}% — ${isEn ? "explains differential" : "explica el diferencial"}`)}
    ${_resultRow(isEn ? "Horizon" : "Horizonte", isEn ? `${meses} months` : `${meses} meses`)}
    ${_resultRow(isEn ? "Notional" : "Nocional", `USD ${noc.toLocaleString()}K`)}
    ${_resultRow(isEn ? "Opportunity Cost" : "Costo de oportunidad", `USD ${costoCub.toFixed(1)}K`,
                  costoCub > 0 ? "warn" : "positive")}

    <div class="alert alert-warn" style="margin-top:12px;">
      <span class="alert-icon">⚠</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `The forward locks in the exchange rate at <strong>$${res.forward.toFixed(4)}</strong>. If the peso depreciates further, Autlán loses upside. If it appreciates, forward protects fully. Advantage vs collar: zero premium. Disadvantage: eliminates upside.`
          : `El forward fija el TC en <strong>$${res.forward.toFixed(4)}</strong>. Si el peso se deprecia más, Autlán pierde el upside. Si se aprecia, el forward protege completamente. Ventaja vs collar: cero prima. Desventaja: elimina upside.`}
      </span>
    </div>
  `;
};

window.calcFXPut = function() {
  const isEn   = I18N.getLocale() === "en";
  const S      = parseFloat(document.getElementById("fx-put-spot")?.value   || 17.20);
  const K      = parseFloat(document.getElementById("fx-put-strike")?.value || 17.00);
  const volPct = parseFloat(document.getElementById("fx-put-vol")?.value    || 12);
  const meses  = parseFloat(document.getElementById("fx-put-T")?.value      || 6);
  const noc    = parseFloat(document.getElementById("fx-put-noc")?.value    || 10000);
  const modelo = document.getElementById("fx-put-modelo")?.value || "heston";
  const T      = meses / 12;
  const r      = Scenarios.getVar("tiie28") / 100;
  const q      = Scenarios.getVar("sofr1m") / 100;
  const sigma  = volPct / 100;

  let res;
  if (modelo === "heston") {
    const p = Models.PARAMS.fx_usdmxn;
    res = Models.heston("put", S, K, T, r, q,
          p.v0, p.kappa, p.theta_v, p.xi, p.rho_sv);
  } else {
    res = Models.blackScholes("put", S, K, T, r, sigma, q);
  }

  const primaNoc = res.precio * noc;
  const el = document.getElementById("fx-put-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Put Outcome" : "Resultado de la put"}</div>
    ${_resultRow(isEn ? "Model" : "Modelo", modelo === "heston" ? (isEn ? "Heston (stoch. vol)" : "Heston (vol. estocástica)") : "Black-Scholes")}
    ${_resultRow("Spot", `$${S.toFixed(2)}`)}
    ${_resultRow("Strike", `$${K.toFixed(2)}`)}
    ${_resultRow(isEn ? "Put Premium" : "Prima put", isEn ? `$${res.precio.toFixed(4)} per USD` : `$${res.precio.toFixed(4)} por USD`, "accent")}
    ${_resultRow(isEn ? "Total Notional Premium" : "Prima total nocional", `USD ${primaNoc.toFixed(1)}K`, "warn")}
    ${_resultRow(isEn ? "Premium % of Notional" : "Prima % nocional", `${(res.precio/S*100).toFixed(2)}%`)}
    ${_resultRow("Delta", res.delta.toFixed(4))}
    ${_resultRow("Gamma", res.gamma.toFixed(6))}
    ${_resultRow("Vega (per 1% vol)", res.vega.toFixed(4))}
    ${_resultRow("Moneyness", res.itm ? (isEn ? "ITM — In the Money" : "ITM — en el dinero") : (isEn ? "OTM — Out of the Money" : "OTM — fuera del dinero"),
                  res.itm ? "positive" : "warn")}

    <div class="alert alert-info" style="margin-top:12px;">
      <span class="alert-icon">ℹ</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `The put option protects downside if USD/MXN falls below $${K.toFixed(2)}. It maintains upside if the peso depreciates. Cost: USD ${primaNoc.toFixed(0)}K (premium paid, maximum loss).`
          : `La put protege el downside si USD/MXN cae bajo $${K.toFixed(2)}. Mantiene el upside si el peso se deprecia. Costo: USD ${primaNoc.toFixed(0)}K (prima pagada, pérdida máxima).`}
      </span>
    </div>
  `;
};

window.calcFXSwap = function() {
  const isEn   = I18N.getLocale() === "en";
  const noc    = parseFloat(document.getElementById("fx-swap-noc")?.value    || 20000);
  const fija   = parseFloat(document.getElementById("fx-swap-fija")?.value   || 10.50) / 100;
  const tiie   = parseFloat(document.getElementById("fx-swap-tiie")?.value   || 7.10)  / 100;
  const spread = parseFloat(document.getElementById("fx-swap-spread")?.value || 1.50)  / 100;
  const T      = parseFloat(document.getElementById("fx-swap-T")?.value      || 1);

  const res = Models.swapMTM(noc, fija, tiie, spread, T, tiie + spread);
  const el  = document.getElementById("fx-swap-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Swap Outcome" : "Resultado del swap"}</div>
    ${_resultRow(isEn ? "Contracted Fixed Rate" : "Tasa fija pactada", `${(fija*100).toFixed(2)}%`)}
    ${_resultRow(isEn ? "Current Variable Rate" : "Tasa variable actual", `${((tiie+spread)*100).toFixed(2)}% (TIIE+spread)`)}
    ${_resultRow("Mark-to-market", `USD ${res.mtm.toFixed(1)}K`,
                  res.mtm >= 0 ? "positive" : "danger")}
    ${_resultRow(isEn ? "Annual Savings/Cost" : "Ahorro/costo anual", `USD ${res.ahorroAnual.toFixed(1)}K`,
                  res.ahorroAnual >= 0 ? "positive" : "danger")}
    ${_resultRow("DV01", `USD ${res.dv01.toFixed(2)}K ${isEn ? "per 1bp" : "por 1bp"}`)}
    <div class="alert alert-${res.mtm >= 0 ? "success" : "warn"}" style="margin-top:12px;">
      <span class="alert-icon">${res.mtm >= 0 ? "✓" : "⚠"}</span>
      <span style="font-size:11.5px;">${res.ventaja}</span>
    </div>
  `;
};

// ─────────────────────────────────────────
// TABLA COMPARATIVA
// ─────────────────────────────────────────
function _fxRenderTablaComparativa() {
  const el = document.getElementById("fx-tabla-comparativa");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const escVars = Scenarios.getState().escenarios;
  const noc     = 10000; // USD 10M como referencia
  const T       = 0.5;   // 6 meses
  const r       = Scenarios.getVar("tiie28") / 100;
  const q       = Scenarios.getVar("sofr1m") / 100;

  const tcB = escVars.base.usdmxn;
  const tcO = escVars.optimista.usdmxn;
  const tcA = escVars.adverso.usdmxn;

  // Sin cobertura: ingreso = TC × noc
  const sinCob = (tc) => tc * noc;

  // Forward a 18.20 aprox (paridad)
  const fwdPrice = Models.forwardPrice(17.20, r, q, T).forward;
  const conFwd   = (tc) => {
    const pay = Models.forwardPayoff(tc, fwdPrice, noc);
    return sinCob(tc) + pay.ganancia;
  };

  // Collar 17.50 - 18.50
  const conCollar = (tc) => {
    const pay = Models.collarPayoff(tc, 17.50, 18.50, noc);
    return sinCob(tc) + pay.payoffCollar;
  };

  // Put 17.00
  const put = Models.heston("put", 17.20, 17.00, T, r, q,
    Models.PARAMS.fx_usdmxn.v0, Models.PARAMS.fx_usdmxn.kappa,
    Models.PARAMS.fx_usdmxn.theta_v, Models.PARAMS.fx_usdmxn.xi,
    Models.PARAMS.fx_usdmxn.rho_sv);
  const conPut = (tc) => sinCob(tc) + Math.max(17.00 - tc, 0) * noc - put.precio * noc;

  const filas = [
    { label: isEn ? "Unhedged" : "Sin cobertura",      fn: sinCob,   clase: "" },
    { label: "Forward $"+fwdPrice.toFixed(2), fn: conFwd, clase: "accent" },
    { label: "Collar $17.50-$18.50", fn: conCollar, clase: "success" },
    { label: `Put $17.00 (${isEn ? "-premium" : "−prima"})`, fn: conPut,  clase: "warn" },
  ];

  const fmt = (v) => `USD ${(v/1000).toFixed(1)}M`;

  el.innerHTML = filas.map((f, i) => `
    <tr class="${i === 0 ? "row-highlight" : ""}">
      <td>${i === 0 ? "<strong>" : ""}${f.label}${i === 0 ? "</strong>" : ""}</td>
      <td class="esc-base mono"  style="color:var(--accent);">${fmt(f.fn(tcB))}</td>
      <td class="esc-optimista mono" style="color:var(--success);">${fmt(f.fn(tcO))}</td>
      <td class="esc-adverso mono"  style="color:var(--danger);">${fmt(f.fn(tcA))}</td>
    </tr>
  `).join("");
}

// ─────────────────────────────────────────
// PAYOFF CHART
// ─────────────────────────────────────────
function _fxRenderPayoffChart() {
  const canvas = document.getElementById("fx-payoff-chart");
  if (!canvas) return;

  const isEn = I18N.getLocale() === "en";
  const ctx    = canvas.getContext("2d");
  const w      = canvas.offsetWidth || 600;
  const h      = canvas.height      || 200;
  canvas.width = w;

  const r   = Scenarios.getVar("tiie28") / 100;
  const q   = Scenarios.getVar("sofr1m") / 100;
  const noc = 10000;
  const T   = 0.5;

  // Rango de TC
  const tcs    = [];
  for (let tc = 14.0; tc <= 22.0; tc += 0.1) tcs.push(parseFloat(tc.toFixed(2)));

  const fwdP   = Models.forwardPrice(17.20, r, q, T).forward;
  const putP   = Models.heston("put", 17.20, 17.00, T, r, q,
    Models.PARAMS.fx_usdmxn.v0, Models.PARAMS.fx_usdmxn.kappa,
    Models.PARAMS.fx_usdmxn.theta_v, Models.PARAMS.fx_usdmxn.xi,
    Models.PARAMS.fx_usdmxn.rho_sv).precio;

  const series = [
    {
      label:  isEn ? "Unhedged" : "Sin cobertura",
      color:  "#8A96A8",
      vals:   tcs.map(tc => (tc - 17.20) * noc),
    },
    {
      label:  `Forward $${fwdP.toFixed(2)}`,
      color:  "#1B4F8A",
      vals:   tcs.map(tc => Models.forwardPayoff(tc, fwdP, noc).ganancia),
    },
    {
      label:  "Collar $17.50-$18.50",
      color:  "#2D7D4E",
      vals:   tcs.map(tc => Models.collarPayoff(tc, 17.50, 18.50, noc).payoffCollar),
    },
    {
      label:  "Put $17.00",
      color:  "#D4870F",
      vals:   tcs.map(tc => Math.max(17.00 - tc, 0) * noc - putP * noc),
    },
  ];

  // Escala
  const allVals = series.flatMap(s => s.vals);
  const minV    = Math.min(...allVals);
  const maxV    = Math.max(...allVals);
  const pad     = 30;

  const xScale = (tc) => pad + (tc - 14.0) / (22.0 - 14.0) * (w - pad * 2);
  const yScale = (v)  => pad + (1 - (v - minV) / (maxV - minV)) * (h - pad * 2);

  ctx.clearRect(0, 0, w, h);

  // Línea cero
  ctx.strokeStyle = "#E2E6ED";
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, yScale(0));
  ctx.lineTo(w - pad, yScale(0));
  ctx.stroke();
  ctx.setLineDash([]);

  // TC actual
  const tcAct = Scenarios.getVar("usdmxn");
  ctx.strokeStyle = "#C8CDD8";
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xScale(tcAct), pad);
  ctx.lineTo(xScale(tcAct), h - pad);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  ctx.fillText(isEn ? `Current FX $${tcAct.toFixed(2)}` : `TC actual $${tcAct.toFixed(2)}`, xScale(tcAct) + 4, pad + 12);

  // Series
  series.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    tcs.forEach((tc, i) => {
      const x = xScale(tc);
      const y = yScale(s.vals[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Eje X labels
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  [15, 16, 17, 18, 19, 20, 21].forEach(tc => {
    ctx.fillText(`$${tc}`, xScale(tc) - 8, h - 4);
  });

  // Leyenda
  const leyEl = document.getElementById("fx-chart-leyenda");
  if (leyEl) {
    leyEl.innerHTML = series.map(s => `
      <div style="display:flex; align-items:center; gap:5px;">
        <div style="width:20px; height:3px; background:${s.color};
                    border-radius:2px;"></div>
        <span>${s.label}</span>
      </div>
    `).join("");
  }
}

// ─────────────────────────────────────────
// RECOMENDACIÓN
// ─────────────────────────────────────────
function _fxRenderRecomendacion() {
  const el = document.getElementById("fx-recomendacion");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const tc  = Scenarios.getVar("usdmxn");
  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;

  el.innerHTML = `
    <div class="card-title" style="margin-bottom:16px;">
      ${isEn ? `Hedging Posture Analysis · USD/MXN $${tc.toFixed(2)}` : `Análisis de postura · USD/MXN $${tc.toFixed(2)}`}
    </div>

    <div class="grid-3" style="gap:16px; margin-bottom:16px;">

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); border-left:3px solid var(--accent);">
        <div style="font-size:11px; font-weight:700; color:var(--accent);
                    margin-bottom:6px;">${isEn ? "RISK MITIGATED" : "QUÉ RIESGO MITIGA"}</div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? `Appreciation of the Mexican Peso vs USD. With revenues in USD and costs in MXN, each peso of strength reduces the MXN equivalent of revenues without moving costs. Impact: ~USD ${(322746*0.85/18).toFixed(0)}K per peso of appreciation.`
            : `Apreciación del peso mexicano vs USD. Con ingresos en USD y costos en MXN, cada peso de fortaleza reduce el equivalente MXN de los ingresos sin mover los costos. Impacto: ~USD ${(322746*0.85/18).toFixed(0)}K por peso de apreciación.`}
        </div>
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); border-left:3px solid var(--warn);">
        <div style="font-size:11px; font-weight:700; color:var(--warn);
                    margin-bottom:6px;">${isEn ? "RISK ACCEPTED" : "QUÉ RIESGO ACEPTA"}</div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? "With collar: upside is yielded if the peso depreciates beyond the cap. With forward: uncertainty is fully eliminated — both the good and the bad. With put: risk of losing the premium if exchange rate does not move favorably."
            : "Con collar: se cede el upside si el peso se deprecia más allá del cap. Con forward: se elimina completamente la incertidumbre — bueno y malo. Con put: riesgo de perder la prima si el TC no se mueve a favor."}
        </div>
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); border-left:3px solid var(--danger);">
        <div style="font-size:11px; font-weight:700; color:var(--danger);
                    margin-bottom:6px;">${isEn ? "COST / SACRIFICE" : "QUÉ SACRIFICA"}</div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? "Forward: all FX upside. Collar: upside above the cap. Put: the paid premium reduces net revenues even if not exercised. In all cases, certainty has an economic cost."
            : "Forward: todo el upside cambiario. Collar: upside por encima del cap. Put: la prima pagada reduce el ingreso neto incluso si no se ejerce. En todos los casos: la certidumbre tiene un costo económico."}
        </div>
      </div>

    </div>

    <div class="alert alert-${tc < 17.0 ? "danger" : tc < 18.0 ? "warn" : "success"}">
      <span class="alert-icon">
        ${tc < 17.0 ? "🚨" : tc < 18.0 ? "⚠" : "✓"}
      </span>
      <span style="font-size:12px;">
        <strong>${isEn ? "Current posture:" : "Postura actual:"}</strong>
        ${isEn
          ? (tc < 17.0
            ? `Exchange rate in high-risk zone ($${tc.toFixed(2)}). Each additional cent of appreciation directly impacts unhedged revenues (~97%). Priority: activate hedges up to 60% policy limit immediately.`
            : (tc < 18.0
              ? `Exchange rate in warning zone ($${tc.toFixed(2)}). The hedging gap (${exp.gapCobertura_FX.valor} pp) represents a significant exposure. Costless collars are the most efficient strategy in terms of cost/protection under current conditions.`
              : `Exchange rate in favorable zone ($${tc.toFixed(2)}). The weak peso benefits revenues. Consider reducing hedging towards policy minimum to capture positive FX differential.`))
          : (tc < 17.0
            ? `TC en zona de riesgo alto ($${tc.toFixed(2)}). Cada centavo adicional de apreciación impacta los ingresos no cubiertos (~97%) directamente. Prioridad: activar coberturas hasta el 60% de política inmediatamente.`
            : (tc < 18.0
              ? `TC en zona de alerta ($${tc.toFixed(2)}). El gap de cobertura (${exp.gapCobertura_FX.valor} pp) representa una exposición significativa. Collares costless son la estrategia más eficiente en términos costo/protección bajo las condiciones actuales.`
              : `TC en zona favorable ($${tc.toFixed(2)}). El peso débil beneficia los ingresos. Considerar reducir cobertura hacia el mínimo de política para capturar el diferencial cambiario positivo.`))}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────
function _resultRow(label, val, tipo = "") {
  const colorMap = {
    positive: "var(--success)",
    accent:   "var(--accent)",
    warn:     "var(--warn)",
    danger:   "var(--danger)",
    "":       "var(--text-primary)",
  };
  return `
    <div class="flex-between" style="padding:5px 0;
                border-bottom:1px solid var(--border);">
      <span style="font-size:11.5px; color:var(--text-secondary);">${label}</span>
      <span class="mono" style="font-size:12px; font-weight:600;
            color:${colorMap[tipo] || colorMap[""]};">
        ${val}
      </span>
    </div>`;
}

function _fxBindCalcs() {
  // Trigger cálculos iniciales
  calcFXCollar();
  calcFXForward();
}

// Lazy render
Scenarios.on("page:fx", () => {
  const el = document.getElementById("fx-content");
  if (el) renderFX();
});