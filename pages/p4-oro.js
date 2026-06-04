/**
 * pages/p4-oro.js — Riesgo Precio del Oro
 * Metallorum · Sin cobertura activa · Modelos: Heston, Forward, Collar
 */

function renderOro() {
  const el = document.getElementById("oro-content");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

  el.innerHTML = `
    <div class="alert alert-danger mb-24">
      <span class="alert-icon">🥇</span>
      <span>
        ${isEn
          ? `Gold price at historical highs (<strong>USD <span id="oro-precio-live">4,500</span>/oz</strong>) and <strong>no active hedging</strong>. Metallorum sold ~<strong>2,400 oz in 1Q26</strong> with a target of <strong>20,000 oz in 2026</strong> and +100,000 oz in subsequent years. Downside exposure completely unprotected.`
          : `Precio del oro en máximos históricos (<strong>USD <span id="oro-precio-live">4,500</span>/oz</strong>) y <strong>sin cobertura activa</strong>. Metallorum vendió ~<strong>2,400 oz en 1T26</strong> con meta de <strong>20,000 oz en 2026</strong> y +100,000 oz en años siguientes. Exposición al downside completamente desprotegida.`}
      </span>
    </div>

    <!-- KPIs -->
    <div class="grid-4 mb-24" id="oro-kpis"></div>

    <!-- TABS INSTRUMENTOS -->
    <div class="section-title">${isEn ? "Evaluate Hedging Instruments" : "Evaluar instrumentos de cobertura"}</div>
    <div class="card mb-24">
      <div style="display:flex; gap:4px; margin-bottom:20px;
                  border-bottom:2px solid var(--border); padding-bottom:0;">
        ${[isEn ? "OTC Forward" : "Forward OTC", isEn ? "Put Option" : "Put Opción", "Costless Collar", isEn ? "COMEX Futures" : "Futuros COMEX"].map((t, i) => `
          <button class="oro-tab ${i === 0 ? "active" : ""}"
                  data-tab="${i}"
                  onclick="switchOroTab(${i})"
                  style="padding:8px 16px; font-size:12px; font-weight:500;
                         border:none; background:none; cursor:pointer;
                         border-bottom:2px solid ${i === 0 ? "var(--gold)" : "transparent"};
                         margin-bottom:-2px;
                         color:${i === 0 ? "var(--gold)" : "var(--text-muted)"};">
            ${t}
          </button>`).join("")}
      </div>
      <div id="oro-tab-0">${_oroTabForward()}</div>
      <div id="oro-tab-1" style="display:none;">${_oroTabPut()}</div>
      <div id="oro-tab-2" style="display:none;">${_oroTabCollar()}</div>
      <div id="oro-tab-3" style="display:none;">${_oroTabFuturos()}</div>
    </div>

    <!-- TABLA COMPARATIVA -->
    <div class="section-title">${isEn ? "Flow Comparison · Unhedged vs Hedged" : "Flujo por escenario · Sin vs Con cobertura"}</div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>${isEn ? "Instrument" : "Instrumento"}</th>
            <th class="esc-header-base">Base · $4,500/oz</th>
            <th class="esc-header-opt">${isEn ? "Optimistic · $5,200/oz" : "Optimista · $5,200/oz"}</th>
            <th class="esc-header-adv">${isEn ? "Adverse · $3,800/oz" : "Adverso · $3,800/oz"}</th>
          </tr>
        </thead>
        <tbody id="oro-tabla-comparativa"></tbody>
      </table>
    </div>

    <!-- PAYOFF CHART -->
    <div class="section-title">${isEn ? "Payoff Diagram · Gold Price" : "Diagrama de payoff · Precio del oro"}</div>
    <div class="card mb-24">
      <div class="chart-title">
        ${isEn ? "Metallorum net revenue as a function of the gold price at maturity" : "Ingreso neto Metallorum en función del precio del oro al vencimiento"}
      </div>
      <canvas id="oro-payoff-chart" height="200"></canvas>
      <div id="oro-chart-leyenda"
           style="display:flex; gap:16px; margin-top:12px;
                  flex-wrap:wrap; font-size:11px;"></div>
    </div>

    <!-- ANÁLISIS -->
    <div class="section-title">${isEn ? "Analysis and Recommendation" : "Análisis y recomendación"}</div>
    <div class="card mb-24" id="oro-recomendacion"></div>

  `;

  _oroRenderKPIs();
  _oroRenderTablaComparativa();
  _oroRenderPayoffChart();
  _oroRenderRecomendacion();
  _oroBindCalcs();

  Scenarios.on("var:precioOro", () => {
    _oroRenderKPIs();
    _oroRenderTablaComparativa();
    _oroRenderPayoffChart();
    _oroRenderRecomendacion();
  });
}

// ─────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────
function _oroRenderKPIs() {
  const el = document.getElementById("oro-kpis");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio   = Scenarios.getVar("precioOro");
  const ozAnual  = 20000; // oz/año — meta mgmt 2026
  const ingresos = precio * ozAnual / 1000; // USD miles
  const base     = 4500;
  const delta    = precio - base;
  const impacto  = delta * ozAnual / 1000;

  document.getElementById("oro-precio-live") &&
    (document.getElementById("oro-precio-live").textContent =
      precio.toLocaleString());

  const items = [
    {
      label: isEn ? "Current Gold Price" : "Precio oro actual",
      value: `USD ${precio.toLocaleString()}/oz`,
      sub:   isEn ? "Historical Highs · Reference Base: $4,500" : `Máximos históricos · Base referencia: $4,500`,
      tipo:  precio > 4500 ? "success" : precio > 3800 ? "warn" : "danger",
      delta: isEn ? `${delta >= 0 ? "+" : ""}${delta.toFixed(0)} vs base` : `${delta >= 0 ? "+" : ""}${delta.toFixed(0)} vs base`,
      dir:   delta >= 0 ? "up" : "down",
    },
    {
      label: isEn ? "Est. Metallorum Revenues" : "Ingresos Metallorum est.",
      value: `USD ${(ingresos/1000).toFixed(1)}M`,
      sub:   isEn ? `~${(ozAnual/1000).toFixed(0)}K oz annualized · current price` : `~${(ozAnual/1000).toFixed(0)}K oz anualizadas · precio actual`,
      tipo:  "gold",
      delta: isEn
        ? (impacto >= 0 ? `+USD ${(impacto/1000).toFixed(1)}M vs base` : `-USD ${(Math.abs(impacto)/1000).toFixed(1)}M vs base`)
        : (impacto >= 0 ? `+USD ${(impacto/1000).toFixed(1)}M vs base` : `-USD ${(Math.abs(impacto)/1000).toFixed(1)}M vs base`),
      dir:   impacto >= 0 ? "up" : "down",
    },
    {
      label: isEn ? "Active Hedging" : "Cobertura activa",
      value: "0%",
      sub:   isEn ? "No active instrument in 1Q26 · Total exposure" : "Sin instrumento al 1T26 · Exposición total",
      tipo:  "danger",
      delta: isEn ? "Policy allows up to 60%" : "Política permite hasta 60%",
      dir:   "down",
    },
    {
      label: isEn ? "Max Loss in Adverse Scenario" : "Pérdida máx. escenario adverso",
      value: `USD ${((base - 3800) * ozAnual / 1e6).toFixed(1)}M`,
      sub:   isEn ? "If price drops to $3,800/oz without hedging" : `Si precio cae a $3,800/oz sin cobertura`,
      tipo:  "danger",
      delta: `$${base - 3800}/oz × ${(ozAnual/1000).toFixed(0)}K oz`,
      dir:   "down",
    },
  ];

  const cards = document.getElementById("oro-kpis");
  if (!cards) return;
  cards.innerHTML = items.map(k => `
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
// TABS
// ─────────────────────────────────────────
function _oroTabForward() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "OTC Gold Forward" : "Forward OTC sobre oro"}</div>
        <div class="field-group">
          <label>${isEn ? "Gold Spot Price (USD/oz)" : "Precio spot oro (USD/oz)"}</label>
          <input type="number" id="oro-fwd-spot" value="4513" step="10"
                 oninput="calcOroForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Contract Forward Price (USD/oz)" : "Precio forward pactado (USD/oz)"}</label>
          <input type="number" id="oro-fwd-strike" value="4480" step="10"
                 oninput="calcOroForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Volume to Hedging (oz)" : "Volumen a cubrir (oz)"}</label>
          <input type="number" id="oro-fwd-oz" value="12000" step="1000"
                 oninput="calcOroForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="oro-fwd-T" value="6" min="1" max="12"
                 oninput="calcOroForward()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "USD Risk-Free Rate (%)" : "Tasa libre de riesgo USD (%)"}</label>
          <input type="number" id="oro-fwd-r" value="4.30" step="0.05"
                 oninput="calcOroForward()" />
        </div>
      </div>
      <div id="oro-fwd-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate forward." : "Ajusta los parámetros para calcular el forward."}</span>
        </div>
      </div>
    </div>`;
}

function _oroTabPut() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "Gold Put Option · Heston" : "Put sobre oro · Heston"}</div>
        <div class="field-group">
          <label>${isEn ? "Spot Price (USD/oz)" : "Precio spot (USD/oz)"}</label>
          <input type="number" id="oro-put-spot" value="4513" step="10"
                 oninput="calcOroPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Strike (USD/oz)" : "Strike (USD/oz)"}</label>
          <input type="number" id="oro-put-strike" value="4400" step="10"
                 oninput="calcOroPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Implied Volatility (%)" : "Volatilidad implícita (%)"}</label>
          <input type="number" id="oro-put-vol" value="24.49" step="0.5"
                 oninput="calcOroPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="oro-put-T" value="6" min="1" max="12"
                 oninput="calcOroPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Volume to Hedging (oz)" : "Volumen a cubrir (oz)"}</label>
          <input type="number" id="oro-put-oz" value="12000" step="1000"
                 oninput="calcOroPut()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Model" : "Modelo"}</label>
          <select id="oro-put-modelo" onchange="calcOroPut()">
            <option value="heston" selected>${isEn ? "Heston (recommended)" : "Heston (recomendado)"}</option>
            <option value="bs">Black-Scholes</option>
          </select>
        </div>
      </div>
      <div id="oro-put-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate put option." : "Ajusta los parámetros para calcular la put."}</span>
        </div>
      </div>
    </div>`;
}

function _oroTabCollar() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "Costless Gold Collar" : "Costless collar sobre oro"}</div>
        <div class="alert alert-info" style="margin-bottom:14px;">
          <span class="alert-icon">ℹ</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? "Preferred strategy under Autlán policy. Purchases put (floor) + sells call (cap). Net premium ≈ 0 if strikes are set correctly."
              : "Estrategia preferida en política Autlán. Compra put (piso) + vende call (techo). Prima neta ≈ 0 si los strikes son correctos."}
          </span>
        </div>
        <div class="field-group">
          <label>${isEn ? "Spot Price (USD/oz)" : "Precio spot (USD/oz)"}</label>
          <input type="number" id="oro-col-spot" value="4513" step="10"
                 oninput="calcOroCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Floor — long put (USD/oz)" : "Floor — put largo (USD/oz)"}</label>
          <input type="number" id="oro-col-floor" value="4400" step="10"
                 oninput="calcOroCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Cap — short call (USD/oz)" : "Cap — call corto (USD/oz)"}</label>
          <input type="number" id="oro-col-cap" value="4569" step="10"
                 oninput="calcOroCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Implied Volatility (%)" : "Volatilidad implícita (%)"}</label>
          <input type="number" id="oro-col-vol" value="24.49" step="0.5"
                 oninput="calcOroCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="oro-col-T" value="6" min="1" max="12"
                 oninput="calcOroCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Volume to Hedging (oz)" : "Volumen a cubrir (oz)"}</label>
          <input type="number" id="oro-col-oz" value="12000" step="1000"
                 oninput="calcOroCollar()" />
        </div>
      </div>
      <div id="oro-col-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate collar." : "Ajusta los parámetros para calcular el collar."}</span>
        </div>
      </div>
    </div>`;
}

function _oroTabFuturos() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "COMEX Gold Futures (GC)" : "Futuros COMEX (GC)"}</div>
        <div class="alert alert-warn" style="margin-bottom:14px;">
          <span class="alert-icon">⚠</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? "COMEX futures are standard 100 oz/contract. Require initial margin deposits (~5-10% of notional). Basis risk exists between COMEX and the OTC spot price Autlán receives from clients."
              : "Los futuros COMEX son estándar de 100 oz/contrato. Requieren depósito de margen inicial (~5-10% nocional). Existe basis risk entre precio COMEX y precio spot OTC que Autlán recibe de sus clientes."}
          </span>
        </div>
        <div class="field-group">
          <label>${isEn ? "Gold Spot Price (USD/oz)" : "Precio spot oro (USD/oz)"}</label>
          <input type="number" id="oro-fut-spot" value="4513" step="10"
                 oninput="calcOroFuturos()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Number of Contracts (100 oz each)" : "Número de contratos (100 oz c/u)"}</label>
          <input type="number" id="oro-fut-contratos" value="120" step="10"
                 oninput="calcOroFuturos()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="oro-fut-T" value="6" min="1" max="12"
                 oninput="calcOroFuturos()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "USD Rate (%)" : "Tasa USD (%)"}</label>
          <input type="number" id="oro-fut-r" value="4.30" step="0.05"
                 oninput="calcOroFuturos()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Margin Required (%)" : "Margen requerido (%)"}</label>
          <input type="number" id="oro-fut-margen" value="7" step="0.5"
                 oninput="calcOroFuturos()" />
        </div>
      </div>
      <div id="oro-fut-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate futures." : "Ajusta los parámetros para calcular los futuros."}</span>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// CÁLCULOS
// ─────────────────────────────────────────
window.switchOroTab = function(idx) {
  [0, 1, 2, 3].forEach(i => {
    const tab = document.getElementById(`oro-tab-${i}`);
    const btn = document.querySelector(`.oro-tab[data-tab="${i}"]`);
    if (!tab || !btn) return;
    const active = i === idx;
    tab.style.display      = active ? "block" : "none";
    btn.style.color        = active ? "var(--gold)" : "var(--text-muted)";
    btn.style.borderBottom = active
      ? "2px solid var(--gold)" : "2px solid transparent";
  });
};

window.calcOroForward = function() {
  const isEn   = I18N.getLocale() === "en";
  const spot   = parseFloat(document.getElementById("oro-fwd-spot")?.value   || 4513);
  const strike = parseFloat(document.getElementById("oro-fwd-strike")?.value || 4480);
  const oz     = parseFloat(document.getElementById("oro-fwd-oz")?.value     || 12000);
  const meses  = parseFloat(document.getElementById("oro-fwd-T")?.value      || 6);
  const r      = parseFloat(document.getElementById("oro-fwd-r")?.value      || 4.30) / 100;
  const T      = meses / 12;

  // Precio forward teórico
  const fwdTeorico = Models.forwardPrice(spot, r, 0, T, 0.0015).forward;
  const ingSin     = spot   * oz / 1000;
  const ingCon     = strike * oz / 1000;
  const proteccion = (strike - spot) * oz / 1000;

  const el = document.getElementById("oro-fwd-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Forward Outcome" : "Resultado del forward"}</div>
    ${_resultRow(isEn ? "Current Spot" : "Spot actual", `USD ${spot.toLocaleString()}/oz`)}
    ${_resultRow(isEn ? "Theoretical Forward (parity)" : "Forward teórico (paridad)", `USD ${fwdTeorico.toFixed(0)}/oz`, "accent")}
    ${_resultRow(isEn ? "Pacted Price (strike)" : "Precio pactado (strike)", `USD ${strike.toLocaleString()}/oz`,
                  strike >= fwdTeorico ? "positive" : "warn")}
    ${_resultRow(isEn ? "Covered Volume" : "Volumen cubierto", `${oz.toLocaleString()} oz`)}
    ${_resultRow(isEn ? "Unhedged Revenue" : "Ingreso sin cobertura", `USD ${ingSin.toFixed(1)}M`)}
    ${_resultRow(isEn ? "Revenue with Forward" : "Ingreso con forward", `USD ${ingCon.toFixed(1)}M`,
                  ingCon >= ingSin ? "positive" : "warn")}
    ${_resultRow(isEn ? "Protection / Opportunity Cost" : "Protección / Costo oportun.", `USD ${proteccion.toFixed(1)}M`,
                  proteccion >= 0 ? "positive" : "warn")}
    ${_resultRow(isEn ? "Discount vs Spot" : "Descuento vs spot", `${((strike/spot-1)*100).toFixed(1)}%`,
                  strike >= spot ? "positive" : "warn")}

    <div class="alert alert-warn" style="margin-top:12px;">
      <span class="alert-icon">⚠</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `The forward locks in the sale price at USD ${strike.toLocaleString()}/oz. If gold rises further, Autlán loses that upside. If it falls below strike, the forward protects fully. <strong>No premium — zero cost.</strong>`
          : `El forward fija el precio de venta en USD ${strike.toLocaleString()}/oz. Si el oro sube más, Autlán pierde ese upside. Si cae por debajo del strike, el forward protege completamente. <strong>Sin prima — costo cero.</strong>`}
      </span>
    </div>
  `;
};

window.calcOroPut = function() {
  const isEn   = I18N.getLocale() === "en";
  const spot   = parseFloat(document.getElementById("oro-put-spot")?.value   || 4513);
  const strike = parseFloat(document.getElementById("oro-put-strike")?.value || 4400);
  const vol    = parseFloat(document.getElementById("oro-put-vol")?.value    || 24.49) / 100;
  const meses  = parseFloat(document.getElementById("oro-put-T")?.value      || 6);
  const oz     = parseFloat(document.getElementById("oro-put-oz")?.value     || 12000);
  const modelo = document.getElementById("oro-put-modelo")?.value || "heston";
  const r      = Scenarios.getVar("sofr1m") / 100;
  const T      = meses / 12;

  let res;
  const p = Models.PARAMS.oro;
  if (modelo === "heston") {
    res = Models.heston("put", spot, strike, T, r, 0,
          p.v0, p.kappa, p.theta_v, p.xi, p.rho_sv);
  } else {
    res = Models.blackScholes("put", spot, strike, T, r, vol, 0);
  }

  const primaTot  = res.precio * oz / 1000;
  const primaPct  = (res.precio / spot * 100).toFixed(2);

  const el = document.getElementById("oro-put-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Put Outcome" : "Resultado de la put"}</div>
    ${_resultRow(isEn ? "Model" : "Modelo", modelo === "heston" ? "Heston" : "Black-Scholes")}
    ${_resultRow("Spot", `USD ${spot.toLocaleString()}/oz`)}
    ${_resultRow("Strike", `USD ${strike.toLocaleString()}/oz`)}
    ${_resultRow(isEn ? "Premium per oz" : "Prima por oz", `USD ${res.precio.toFixed(2)}/oz`, "warn")}
    ${_resultRow(isEn ? "Total Premium" : "Prima total", `USD ${primaTot.toFixed(1)}M`, "warn")}
    ${_resultRow(isEn ? "Premium % of Spot" : "Prima % del spot", `${primaPct}%`)}
    ${_resultRow("Delta", res.delta.toFixed(4))}
    ${_resultRow("Vega (1% vol)", res.vega.toFixed(4))}
    ${_resultRow("Break-even", `USD ${(strike - res.precio).toFixed(0)}/oz`)}
    ${_resultRow("Moneyness",
                  strike < spot ? (isEn ? `OTM — ${((1-strike/spot)*100).toFixed(1)}% out` : `OTM — ${((1-strike/spot)*100).toFixed(1)}% fuera`) : (isEn ? `ITM — In the Money` : `ITM — en el dinero`),
                  strike < spot ? "warn" : "positive")}

    <div class="alert alert-info" style="margin-top:12px;">
      <span class="alert-icon">ℹ</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `The put protects if gold falls below USD ${strike.toLocaleString()}/oz. Maintains unlimited upside if price rises. Total cost: <strong>USD ${primaTot.toFixed(1)}M</strong> — maximum loss if unexercised.`
          : `La put protege si el oro cae bajo USD ${strike.toLocaleString()}/oz. Mantiene upside ilimitado si el precio sube. Costo total: <strong>USD ${primaTot.toFixed(1)}M</strong> — pérdida máxima si no se ejerce.`}
      </span>
    </div>
  `;
};

window.calcOroCollar = function() {
  const isEn  = I18N.getLocale() === "en";
  const spot  = parseFloat(document.getElementById("oro-col-spot")?.value  || 4513);
  const floor = parseFloat(document.getElementById("oro-col-floor")?.value || 4400);
  const cap   = parseFloat(document.getElementById("oro-col-cap")?.value   || 4569);
  const vol   = parseFloat(document.getElementById("oro-col-vol")?.value   || 24.49) / 100;
  const meses = parseFloat(document.getElementById("oro-col-T")?.value     || 6);
  const oz    = parseFloat(document.getElementById("oro-col-oz")?.value    || 12000);
  const r     = Scenarios.getVar("sofr1m") / 100;
  const T     = meses / 12;

  const res       = Models.collarPrice(spot, floor, cap, T, r, 0, vol,
                    true, Models.PARAMS.oro);
  const costoTot  = res.costoNeto * oz / 1000;

  const el = document.getElementById("oro-col-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Collar Outcome" : "Resultado del collar"}</div>
    ${_resultRow("Spot", `USD ${spot.toLocaleString()}/oz`)}
    ${_resultRow(isEn ? "Floor (long put)" : "Floor (put largo)", `USD ${floor.toLocaleString()}/oz`, "positive")}
    ${_resultRow(isEn ? "Cap (short call)" : "Cap (call corto)", `USD ${cap.toLocaleString()}/oz`, "warn")}
    ${_resultRow(isEn ? "Protected Range" : "Rango protegido", `USD ${floor.toLocaleString()}–${cap.toLocaleString()}`)}
    ${_resultRow(isEn ? "Put Premium" : "Prima put", `USD ${res.put.precio.toFixed(2)}/oz`)}
    ${_resultRow(isEn ? "Call Premium" : "Prima call", `USD ${res.call.precio.toFixed(2)}/oz`)}
    ${_resultRow(isEn ? "Net Cost" : "Costo neto", `USD ${res.costoNeto.toFixed(2)}/oz`,
                  res.esCostless ? "positive" : "warn")}
    ${_resultRow(isEn ? "Total Notional Cost" : "Costo total nocional", `USD ${costoTot.toFixed(1)}M`,
                  res.esCostless ? "positive" : "warn")}
    ${_resultRow(isEn ? "Costless?" : "¿Costless?",
                  res.esCostless ? (isEn ? "✓ Yes" : "✓ Sí") : (isEn ? "✗ No — adjust strikes" : "✗ No — ajustar strikes"),
                  res.esCostless ? "positive" : "warn")}

    <div class="alert alert-${res.esCostless ? "success" : "info"}"
         style="margin-top:12px;">
      <span class="alert-icon">${res.esCostless ? "✓" : "💡"}</span>
      <span style="font-size:11.5px;">
        ${res.esCostless
          ? (isEn ? `Costless collar achieved. Protects between $${floor} and $${cap} without premium cost. Optimal strategy under Autlán policy.` : "Costless collar logrado. Protege entre $" + floor + " y $" + cap + " sin costo de prima. Estrategia óptima bajo política Autlán.")
          : (isEn ? "Adjust cap upwards or floor downwards to reduce net cost towards zero (costless collar)." : "Ajusta el cap hacia arriba o el floor hacia abajo para reducir el costo neto hacia cero (costless collar).")}
      </span>
    </div>
  `;
};

window.calcOroFuturos = function() {
  const isEn      = I18N.getLocale() === "en";
  const spot      = parseFloat(document.getElementById("oro-fut-spot")?.value      || 4513);
  const contratos = parseFloat(document.getElementById("oro-fut-contratos")?.value || 120);
  const meses     = parseFloat(document.getElementById("oro-fut-T")?.value         || 6);
  const r         = parseFloat(document.getElementById("oro-fut-r")?.value         || 4.30) / 100;
  const margenPct = parseFloat(document.getElementById("oro-fut-margen")?.value    || 7) / 100;
  const T         = meses / 12;

  const ozTotal    = contratos * 100;
  const fwdPrice   = Models.forwardPrice(spot, r, 0, T, 0.0015).forward;
  const nocional   = fwdPrice * ozTotal / 1000;
  const margenReq  = nocional * margenPct;
  const costoOport = (r * margenReq * T);

  const el = document.getElementById("oro-fut-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "COMEX Futures Outcome" : "Resultado futuros COMEX"}</div>
    ${_resultRow(isEn ? "Spot Price" : "Precio spot", `USD ${spot.toLocaleString()}/oz`)}
    ${_resultRow(isEn ? "Theoretical Future Price" : "Precio futuro teórico", `USD ${fwdPrice.toFixed(0)}/oz`, "accent")}
    ${_resultRow(isEn ? "Contracts (100 oz each)" : "Contratos (100 oz c/u)", contratos.toLocaleString())}
    ${_resultRow(isEn ? "Total Covered Ounces" : "Onzas totales cubiertas", `${ozTotal.toLocaleString()} oz`)}
    ${_resultRow(isEn ? "Total Notional" : "Nocional total", `USD ${nocional.toFixed(1)}M`)}
    ${_resultRow(isEn ? "Initial Margin Required" : "Margen inicial requerido",
                  `USD ${margenReq.toFixed(1)}M (${(margenPct*100).toFixed(0)}%)`,
                  "warn")}
    ${_resultRow(isEn ? "Financial Cost of Margin" : "Costo financiero del margen",
                  `USD ${costoOport.toFixed(0)}K/${isEn ? "period" : "período"}`, "warn")}
    ${_resultRow(isEn ? "Basis Risk" : "Basis risk",
                  isEn ? "COMEX spot vs client contract price difference" : "Diferencia COMEX spot vs precio cliente", "warn")}

    <div class="alert alert-warn" style="margin-top:12px;">
      <span class="alert-icon">⚠</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `Futures require an initial margin of <strong>USD ${margenReq.toFixed(1)}M</strong> — locked-in capital. With a DSCR of 0.6x, this can strain Autlán's liquidity. OTC forward or collar is preferable given the current liquidity profile.`
          : `Los futuros requieren margen inicial de <strong>USD ${margenReq.toFixed(1)}M</strong> — capital inmovilizado. Con DSCR de 0.6x, esto puede presionar la liquidez de Autlán. El OTC forward o collar es preferible dado el perfil de liquidez actual.`}
      </span>
    </div>
  `;
};

// ─────────────────────────────────────────
// TABLA COMPARATIVA
// ─────────────────────────────────────────
function _oroRenderTablaComparativa() {
  const el = document.getElementById("oro-tabla-comparativa");
  if (!el) return;

  const isEn  = I18N.getLocale() === "en";
  const esc   = Scenarios.getState().escenarios;
  const oz    = 20000;
  const r     = Scenarios.getVar("sofr1m") / 100;
  const T     = 0.5;
  const floor = 4400;
  const cap   = 4569;
  const fwdK  = 4480;

  const putP  = Models.heston("put", 4513, floor, T, r, 0,
    Models.PARAMS.oro.v0, Models.PARAMS.oro.kappa,
    Models.PARAMS.oro.theta_v, Models.PARAMS.oro.xi,
    Models.PARAMS.oro.rho_sv).precio;

  const fmt = (v) => `USD ${(v/1e6).toFixed(1)}M`;

  const precios = {
    base:      esc.base.precioOro,
    optimista: esc.optimista.precioOro,
    adverso:   esc.adverso.precioOro,
  };

  const filas = [
    {
      label: isEn ? "Unhedged" : "Sin cobertura",
      fn: (p) => p * oz / 1000,
    },
    {
      label: `Forward OTC $${fwdK}/oz`,
      fn: (p) => fwdK * oz / 1000,
    },
    {
      label: `Put $${floor}/oz (${isEn ? "-premium" : "−prima"})`,
      fn: (p) => (Math.max(p, floor) * oz - putP * oz) / 1000,
    },
    {
      label: `Collar $${floor}–$${cap}/oz`,
      fn: (p) => {
        const pay = Models.collarPayoff(p, floor, cap, oz/1000);
        return p * oz / 1000 + pay.payoffCollar;
      },
    },
  ];

  el.innerHTML = filas.map((f, i) => `
    <tr class="${i === 0 ? "row-highlight" : ""}">
      <td>${i === 0 ? "<strong>" : ""}${f.label}${i === 0 ? "</strong>" : ""}</td>
      <td class="esc-base mono" style="color:var(--accent);">
        ${fmt(f.fn(precios.base))}
      </td>
      <td class="esc-optimista mono" style="color:var(--success);">
        ${fmt(f.fn(precios.optimista))}
      </td>
      <td class="esc-adverso mono" style="color:var(--danger);">
        ${fmt(f.fn(precios.adverso))}
      </td>
    </tr>
  `).join("");
}

// ─────────────────────────────────────────
// PAYOFF CHART
// ─────────────────────────────────────────
function _oroRenderPayoffChart() {
  const canvas = document.getElementById("oro-payoff-chart");
  if (!canvas) return;

  const isEn = I18N.getLocale() === "en";
  const ctx = canvas.getContext("2d");
  const w   = canvas.offsetWidth || 600;
  const h   = canvas.height      || 200;
  canvas.width = w;

  const r   = Scenarios.getVar("sofr1m") / 100;
  const T   = 0.5;
  const oz  = 1000;

  const precios = [];
  for (let p = 3000; p <= 5800; p += 20) precios.push(p);

  const fwdK  = 4480;
  const floor = 4400;
  const cap   = 4569;
  const putP  = Models.heston("put", 4513, floor, T, r, 0,
    Models.PARAMS.oro.v0, Models.PARAMS.oro.kappa,
    Models.PARAMS.oro.theta_v, Models.PARAMS.oro.xi,
    Models.PARAMS.oro.rho_sv).precio;

  const series = [
    {
      label: isEn ? "Unhedged" : "Sin cobertura",
      color: "#8A96A8",
      vals:  precios.map(p => p * oz / 1000),
    },
    {
      label: `Forward $${fwdK}`,
      color: "#1B4F8A",
      vals:  precios.map(() => fwdK * oz / 1000),
    },
    {
      label: `Put $${floor} (${isEn ? "-premium" : "−prima"})`,
      color: "#D4870F",
      vals:  precios.map(p => (Math.max(p, floor) * oz - putP * oz) / 1000),
    },
    {
      label: `Collar $${floor}–$${cap}`,
      color: "#2D7D4E",
      vals:  precios.map(p => {
        const efectivo = Math.min(Math.max(p, floor), cap);
        return efectivo * oz / 1000;
      }),
    },
  ];

  const allVals = series.flatMap(s => s.vals);
  const minV    = Math.min(...allVals);
  const maxV    = Math.max(...allVals);
  const pad     = 40;

  const xScale = (p) => pad + (p - 3000) / (5800 - 3000) * (w - pad * 2);
  const yScale = (v) => pad + (1 - (v - minV) / (maxV - minV)) * (h - pad * 2);

  ctx.clearRect(0, 0, w, h);

  // Precio actual
  const precioAct = Scenarios.getVar("precioOro");
  ctx.strokeStyle = "#C8CDD8";
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xScale(precioAct), pad);
  ctx.lineTo(xScale(precioAct), h - pad);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  ctx.fillText(isEn ? `Current price $${precioAct.toLocaleString()}` : `Precio actual $${precioAct.toLocaleString()}`, xScale(precioAct) + 4, pad + 12);

  // Series
  series.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    precios.forEach((p, i) => {
      const x = xScale(p);
      const y = yScale(s.vals[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Eje X
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  [3000, 3700, 4400, 5100, 5800].forEach(p => {
    ctx.fillText(`$${p.toLocaleString()}`, xScale(p) - 12, h - 4);
  });

  // Leyenda
  const leyEl = document.getElementById("oro-chart-leyenda");
  if (leyEl) {
    leyEl.innerHTML = series.map(s => `
      <div style="display:flex; align-items:center; gap:5px;">
        <div style="width:20px; height:3px; background:${s.color};
                    border-radius:2px;"></div>
        <span>${s.label}</span>
      </div>`).join("");
  }
}

// ─────────────────────────────────────────
// RECOMENDACIÓN
// ─────────────────────────────────────────
function _oroRenderRecomendacion() {
  const el = document.getElementById("oro-recomendacion");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio = Scenarios.getVar("precioOro");
  const oz     = 20000;

  el.innerHTML = `
    <div class="card-title" style="margin-bottom:16px;">
      ${isEn ? `Hedging Posture Analysis · Gold USD ${precio.toLocaleString()}/oz` : `Análisis de postura · Oro USD ${precio.toLocaleString()}/oz`}
    </div>

    <div class="grid-3" style="gap:16px; margin-bottom:16px;">
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--accent);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--accent); margin-bottom:6px;">
          ${isEn ? "RISK MITIGATED" : "QUÉ RIESGO MITIGA"}
        </div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? `Drop in the gold price. With Metallorum generating increasing revenues at historic high prices (USD 4,500+/oz), a fallback to USD 3,800/oz without hedging directly impacts <strong>USD ${((precio - 3800) * oz / 1e6).toFixed(1)}M</strong> of revenues.`
            : `Caída en el precio del oro. Con Metallorum generando ingresos crecientes a precios históricos (USD 4,500+/oz), un retroceso a USD 3,800/oz sin cobertura impacta \u003cstrong\u003eUSD ${((precio - 3800) * oz / 1e6).toFixed(1)}M\u003c/strong\u003e de ingresos directamente.`}
        </div>
      </div>
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--warn);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--warn); margin-bottom:6px;">
          ${isEn ? "RISK ACCEPTED / COST" : "QUÉ ACEPTA / SACRIFICA"}
        </div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? "Forward: loses upside if gold continues to rise. Collar: limits gain above cap but fully protects below floor. Put: maintains upside but pays premium (~2-3% of notional)."
            : "Con forward: se cede el upside si el oro sigue subiendo. Con collar: se limita la ganancia por encima del cap pero se protege completamente abajo del floor. Con put: mantiene el upside pero paga prima (~2-3% del nocional)."}
        </div>
      </div>
      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--success);">
        <div style="font-size:11px; font-weight:700;
                    color:var(--success); margin-bottom:6px;">
          ${isEn ? "SUGGESTED STRATEGY" : "ESTRATEGIA SUGERIDA"}
        </div>
        <div style="font-size:12px; line-height:1.6;">
          ${isEn
            ? `<strong>Costless collar $4,400–$4,569</strong> on 50-60% of annualized production (~20K oz). Aligned with internal policy. Zero premium cost. Protects critical downside without sacrificing moderate upside.`
            : `<strong>Costless collar $4,400–$4,569</strong> sobre 50-60% de producción anualizada (~20K oz). Alineado con política interna. Sin costo de prima. Protege el downside crítico sin sacrificar upside moderado.`}
        </div>
      </div>
    </div>

    <div class="alert alert-${precio > 3800 ? "warn" : "danger"}">
      <span class="alert-icon">${precio > 3800 ? "⚠" : "🚨"}</span>
      <span style="font-size:12px;">
        <strong>${isEn ? "Current posture:" : "Postura actual:"}</strong>
        ${isEn
          ? (precio > 4500
            ? `Price at highs (USD ${precio.toLocaleString()}/oz). Optimum time to contract forwards or collars — strike price stays high and premium cost as % of notional is very low. Every month without hedging is unrewarded risk.`
            : (precio > 3800
              ? `Price in intermediate zone (USD ${precio.toLocaleString()}/oz). Contract hedging now with forward or collar to lock in revenues at a minimum of USD 3,800-4,000/oz.`
              : `Price in high risk zone (USD ${precio.toLocaleString()}/oz). Impact on Metallorum is significant. Put OTM to limit loss without sacrificing recovery.`))
          : (precio > 4500
            ? `Precio en máximos (USD ${precio.toLocaleString()}/oz). Es el momento óptimo para contratar forwards o collars — el precio de ejercicio queda alto y el costo de la prima es bajo como % del nocional. Cada mes sin cobertura es riesgo gratuito.`
            : (precio > 3800
              ? `Precio en zona intermedia (USD ${precio.toLocaleString()}/oz). Contratar cobertura ahora con forward o collar para asegurar ingresos sobre la base de USD 3,800-4,000/oz mínimo.`
              : `Precio en zona de riesgo alto (USD ${precio.toLocaleString()}/oz). El impacto sobre Metallorum es significativo. Put OTM para limitar pérdida sin sacrificar recuperación.`))}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// BIND & INIT
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

function _oroBindCalcs() {
  calcOroForward();
  calcOroPut();
  calcOroCollar();
  calcOroFuturos();
}

// Lazy render
Scenarios.on("page:oro", () => {
  const el = document.getElementById("oro-content");
  if (el && !el.innerHTML.trim()) renderOro();
});
