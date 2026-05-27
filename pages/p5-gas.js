/**
 * pages/p5-gas.js — Riesgo Gas Natural
 * Costo operativo · Sin cobertura activa · Schwartz mean-reversion
 */

function renderGas() {
  const el = document.getElementById("gas-content");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

  el.innerHTML = `

    <div class="alert alert-warn mb-24">
      <span class="alert-icon">⚡</span>
      <span>
        ${isEn
          ? `Natural gas <strong>no active hedging</strong> in 1Q26. Smelting is energy-intensive — each <strong>USD 1/MMBtu shift</strong> in gas price increases operating costs by <strong>~USD 2-3M annually</strong>. Current price: <strong>USD <span id="gas-precio-live">3.20</span>/MMBtu</strong>`
          : `Gas natural <strong>sin cobertura activa</strong> al 1T26. Smelting es energía-intensivo — cada <strong>USD 1/MMBtu de alza</strong> en el precio del gas incrementa costos operativos <strong>~USD 2-3M anuales</strong>. Precio actual: <strong>USD <span id="gas-precio-live">3.20</span>/MMBtu</strong>`}
      </span>
    </div>

    <!-- KPIs -->
    <div class="grid-4 mb-24" id="gas-kpis"></div>

    <!-- CONTEXTO DE CONSUMO -->
    <div class="section-title">${isEn ? "Energy Consumption Profile · Autlán" : "Perfil de consumo energético · Autlán"}</div>
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-header">
          <div class="card-title">${isEn ? "Energy Sources" : "Fuentes de energía"}</div>
          <span class="badge badge-success">${isEn ? "25-30% self-generated" : "25-30% autogenerado"}</span>
        </div>
        ${_gasEnergyProfile()}
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">${isEn ? "Natural Gas Exposure" : "Exposición al gas natural"}</div>
          <span class="badge badge-warn">${isEn ? "Unhedged" : "Sin cobertura"}</span>
        </div>
        ${_gasExposureProfile()}
      </div>
    </div>

    <!-- TABS INSTRUMENTOS -->
    <div class="section-title">${isEn ? "Evaluate Hedging Instruments" : "Evaluar instrumentos de cobertura"}</div>
    <div class="card mb-24">
      <div style="display:flex; gap:4px; margin-bottom:20px;
                  border-bottom:2px solid var(--border); padding-bottom:0;">
        ${[isEn ? "Fixed Price Swap" : "Swap Precio Fijo", isEn ? "Call Option" : "Call Opción", isEn ? "Gas Collar" : "Collar Gas", isEn ? "Self-Generation" : "Autogeneración"].map((t, i) => `
          <button class="gas-tab ${i === 0 ? "active" : ""}"
                  data-tab="${i}"
                  onclick="switchGasTab(${i})"
                  style="padding:8px 16px; font-size:12px; font-weight:500;
                         border:none; background:none; cursor:pointer;
                         border-bottom:2px solid ${i === 0 ? "var(--gas-green)" : "transparent"};
                         margin-bottom:-2px;
                         color:${i === 0 ? "var(--gas-green)" : "var(--text-muted)"};">
            ${t}
          </button>`).join("")}
      </div>
      <div id="gas-tab-0">${_gasTabSwap()}</div>
      <div id="gas-tab-1" style="display:none;">${_gasTabCall()}</div>
      <div id="gas-tab-2" style="display:none;">${_gasTabCollar()}</div>
      <div id="gas-tab-3" style="display:none;">${_gasTabAutogen()}</div>
    </div>

    <!-- TABLA COMPARATIVA -->
    <div class="section-title">${isEn ? "Gas Operating Cost by Scenario" : "Costo operativo gas por escenario"}</div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>${isEn ? "Instrument" : "Instrumento"}</th>
            <th class="esc-header-base">Base · $3.20</th>
            <th class="esc-header-opt">${isEn ? "Optimistic · $2.50" : "Optimista · $2.50"}</th>
            <th class="esc-header-adv">${isEn ? "Adverse · $5.00" : "Adverso · $5.00"}</th>
          </tr>
        </thead>
        <tbody id="gas-tabla-comparativa"></tbody>
      </table>
    </div>

    <!-- PAYOFF CHART -->
    <div class="section-title">${isEn ? "Payoff Diagram · Natural Gas" : "Diagrama de payoff · Gas natural"}</div>
    <div class="card mb-24">
      <div class="chart-title">
        ${isEn
          ? "Net gas cost as a function of the spot price at maturity (Schwartz mean-reversion model)"
          : "Costo neto de gas en función del precio spot al vencimiento (modelo Schwartz mean-reversion)"}
      </div>
      <canvas id="gas-payoff-chart" height="200"></canvas>
      <div id="gas-chart-leyenda"
           style="display:flex; gap:16px; margin-top:12px;
                  flex-wrap:wrap; font-size:11px;"></div>
    </div>

    <!-- RECOMENDACIÓN -->
    <div class="section-title">${isEn ? "Analysis and Recommendation" : "Análisis y recomendación"}</div>
    <div class="card mb-24" id="gas-recomendacion"></div>

  `;

  _gasRenderKPIs();
  _gasRenderTablaComparativa();
  _gasRenderPayoffChart();
  _gasRenderRecomendacion();
  _gasBindCalcs();

  Scenarios.on("var:precioGas", () => {
    _gasRenderKPIs();
    _gasRenderTablaComparativa();
    _gasRenderPayoffChart();
    _gasRenderRecomendacion();
  });
}

// ─────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────
function _gasRenderKPIs() {
  const el = document.getElementById("gas-kpis");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio  = Scenarios.getVar("precioGas");
  const base    = 3.20;
  const consumo = 2500000; // MMBtu anuales estimados
  const costoAn = precio * consumo / 1000; // USD miles
  const costoBase = base * consumo / 1000;
  const delta   = costoAn - costoBase;
  const autogen = 0.275; // 27.5% autogenerado

  document.getElementById("gas-precio-live") &&
    (document.getElementById("gas-precio-live").textContent = precio.toFixed(2));

  el.innerHTML = [
    {
      label: isEn ? "Current Gas Price" : "Precio gas actual",
      value: `USD ${precio.toFixed(2)}/MMBtu`,
      sub:   isEn ? "Henry Hub ref. · Base: $3.20/MMBtu" : `Henry Hub ref. · Base: $3.20/MMBtu`,
      tipo:  precio < 2.5 ? "success" : precio < 4.0 ? "warn" : "danger",
      delta: isEn ? `${delta >= 0 ? "+" : ""}USD ${(delta/1000).toFixed(1)}M vs base` : `${delta >= 0 ? "+" : ""}USD ${(delta/1000).toFixed(1)}M vs base`,
      dir:   delta <= 0 ? "up" : "down",
    },
    {
      label: isEn ? "Est. Annual Gas Cost" : "Costo gas anual est.",
      value: `USD ${(costoAn/1000).toFixed(1)}M`,
      sub:   isEn ? `~${(consumo/1e6).toFixed(1)}M MMBtu/yr · without self-generation` : `~${(consumo/1e6).toFixed(1)}M MMBtu/año · sin autogeneración`,
      tipo:  "warn",
      delta: isEn ? `${(autogen*100).toFixed(0)}% covered by self-gen` : `${(autogen*100).toFixed(0)}% cubierto por autogen`,
      dir:   "up",
    },
    {
      label: isEn ? "Self-Generation Savings" : "Ahorro autogeneración",
      value: `USD ${(2800/1000).toFixed(1)}M/${isEn ? "qtr" : "trim"}`,
      sub:   isEn ? "25-30% self-sufficiency · Atexcaco + solar" : `25-30% autosuficiencia · Atexcaco + solar`,
      tipo:  "success",
      delta: isEn ? "~USD 11.2M annually" : "~USD 11.2M anuales",
      dir:   "up",
    },
    {
      label: isEn ? "Uncovered Exposure" : "Exposición sin cubrir",
      value: `USD ${(costoAn*(1-autogen)/1000).toFixed(1)}M`,
      sub:   isEn ? "Gas purchased on market · 0% hedged" : `Gas comprado en mercado · 0% cubierto`,
      tipo:  "danger",
      delta: isEn ? "Policy allows forwards" : "Política permite forwards",
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
// PERFIL ENERGÉTICO
// ─────────────────────────────────────────
function _gasEnergyProfile() {
  const isEn = I18N.getLocale() === "en";
  const fuentes = [
    {
      nombre: isEn ? "Natural gas (purchased)" : "Gas natural (comprado)",
      pct: 45,
      color: "var(--warn-mid)",
      nota: isEn ? "Primary input smelting" : "Principal insumo smelting"
    },
    {
      nombre: isEn ? "Self-Generation (Atexcaco + solar)" : "Autogeneración (Atexcaco + solar)",
      pct: 27.5,
      color: "var(--success-mid)",
      nota: isEn ? "~USD 2.8M savings/qtr" : "~USD 2.8M ahorro/trim"
    },
    {
      nombre: isEn ? "CFE (grid electricity)" : "CFE (red eléctrica)",
      pct: 20,
      color: "var(--accent-mid)",
      nota: isEn ? "Regulated tariff" : "Tarifa regulada"
    },
    {
      nombre: isEn ? "Cogeneration" : "Cogeneración",
      pct: 7.5,
      color: "var(--gas-green)",
      nota: isEn ? "Waste heat recovery" : "Calor residual"
    },
  ];

  return fuentes.map(f => `
    <div style="margin-bottom:12px;">
      <div class="flex-between" style="margin-bottom:5px;">
        <span style="font-size:12px;">${f.nombre}</span>
        <span class="mono" style="font-size:12px;">${f.pct}%</span>
      </div>
      <div style="height:7px; background:var(--bg-raised);
                  border-radius:4px; overflow:hidden;">
        <div style="width:${f.pct}%; height:100%;
                    background:${f.color}; border-radius:4px;"></div>
      </div>
      <div style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">
        ${f.nota}
      </div>
    </div>
  `).join("");
}

function _gasExposureProfile() {
  const isEn = I18N.getLocale() === "en";
  const precio  = Scenarios.getVar("precioGas");
  const consumo = 2500000;
  const autogen = 0.275;
  const expuesto = consumo * (1 - autogen);

  return `
    ${_resultRow(isEn ? "Estimated Total Consumption" : "Consumo total estimado", isEn ? "~2.5M MMBtu/year" : "~2.5M MMBtu/año")}
    ${_resultRow(isEn ? "Covered by Self-Generation" : "Cubierto por autogeneración", `${(autogen*100).toFixed(0)}% — ~688K MMBtu`)}
    ${_resultRow(isEn ? "Exposed to Market Price" : "Expuesto a precio mercado", isEn ? `~${(expuesto/1e6).toFixed(2)}M MMBtu/year` : `~${(expuesto/1e6).toFixed(2)}M MMBtu/año`)}
    ${_resultRow(isEn ? "Exposed Cost at Current Price" : "Costo expuesto a precio actual",
                  `USD ${(precio * expuesto / 1e6).toFixed(1)}M/${isEn ? "year" : "año"}`,
                  precio > 4 ? "danger" : "warn")}
    ${_resultRow(isEn ? "Impact per $1 rise in gas" : "Impacto por $1 alza en gas",
                  `USD ${(expuesto / 1e6).toFixed(2)}M/${isEn ? "year" : "año"}`, "warn")}
    ${_resultRow(isEn ? "Active Gas Hedging" : "Cobertura gas activa", isEn ? "0% — No instrument" : "0% — Sin instrumento", "danger")}
    ${_resultRow(isEn ? "Policy Allows" : "Política permite", isEn ? "Price forwards" : "Forwards de precio")}

    <div class="alert alert-warn" style="margin-top:12px;">
      <span class="alert-icon">⚠</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? "Self-generation covers ~27.5% of total consumption. The remaining 72.5% is fully exposed to market prices without any hedging instrument."
          : "La autogeneración cubre ~27.5% del consumo total. El 72.5% restante está completamente expuesto a precios de mercado sin ningún instrumento de cobertura."}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// TABS
// ─────────────────────────────────────────
function _gasTabSwap() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">
          ${isEn ? "Natural Gas Fixed Price Swap" : "Swap de precio fijo · Gas natural"}
        </div>
        <div class="alert alert-info" style="margin-bottom:14px;">
          <span class="alert-icon">ℹ</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? "The swap converts variable gas cost into a fixed cost. Autlán pays a fixed price and receives a floating price. If gas rises, the swap compensates the difference."
              : "El swap convierte el costo variable de gas en un costo fijo. Autlán paga precio fijo y recibe precio flotante. Si el gas sube, el swap compensa la diferencia."}
          </span>
        </div>
        <div class="field-group">
          <label>${isEn ? "Natural Gas Spot Price (USD/MMBtu)" : "Precio spot gas (USD/MMBtu)"}</label>
          <input type="number" id="gas-swap-spot" value="3.20" step="0.05"
                 oninput="calcGasSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Contracted Fixed Price (USD/MMBtu)" : "Precio fijo pactado (USD/MMBtu)"}</label>
          <input type="number" id="gas-swap-fijo" value="3.35" step="0.05"
                 oninput="calcGasSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Volume to Hedging (MMBtu/month)" : "Volumen a cubrir (MMBtu/mes)"}</label>
          <input type="number" id="gas-swap-vol" value="150000" step="10000"
                 oninput="calcGasSwap()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="gas-swap-T" value="12" min="1" max="24"
                 oninput="calcGasSwap()" />
        </div>
      </div>
      <div id="gas-swap-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate swap." : "Ajusta los parámetros para calcular el swap."}</span>
        </div>
      </div>
    </div>`;
}

function _gasTabCall() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">
          ${isEn ? "Gold Call Option · Maximum Price" : "Call sobre gas · Precio máximo"}
        </div>
        <div class="alert alert-info" style="margin-bottom:14px;">
          <span class="alert-icon">ℹ</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? "Call purchase = sets the maximum price Autlán pays. If gas rises above strike, the call compensates. Retains benefit if gas falls. Schwartz model (mean-reversion)."
              : "Compra de call = fija el precio máximo que paga Autlán. Si el gas sube sobre el strike, el call compensa. Mantiene el beneficio si el gas baja. Modelo Schwartz (mean-reversion)."}
          </span>
        </div>
        <div class="field-group">
          <label>${isEn ? "Spot Price (USD/MMBtu)" : "Precio spot (USD/MMBtu)"}</label>
          <input type="number" id="gas-call-spot" value="3.20" step="0.05"
                 oninput="calcGasCall()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Strike — Maximum Price (USD/MMBtu)" : "Strike — precio máximo (USD/MMBtu)"}</label>
          <input type="number" id="gas-call-strike" value="4.00" step="0.05"
                 oninput="calcGasCall()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Implied Volatility (%)" : "Volatilidad implícita (%)"}</label>
          <input type="number" id="gas-call-vol" value="45" step="1"
                 oninput="calcGasCall()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="gas-call-T" value="12" min="1" max="24"
                 oninput="calcGasCall()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Volume (MMBtu/month)" : "Volumen (MMBtu/mes)"}</label>
          <input type="number" id="gas-call-vol-mmb" value="150000" step="10000"
                 oninput="calcGasCall()" />
        </div>
      </div>
      <div id="gas-call-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate call option." : "Ajusta los parámetros para calcular la call."}</span>
        </div>
      </div>
    </div>`;
}

function _gasTabCollar() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">${isEn ? "Natural Gas Collar" : "Collar de gas"}</div>
        <div class="alert alert-info" style="margin-bottom:14px;">
          <span class="alert-icon">ℹ</span>
          <span style="font-size:11.5px;">
            ${isEn
              ? "Buy call (max price) + Sell put (min price). Autlán pays between the floor and the cap regardless of market. If put is financed by call → costless collar."
              : "Compra call (precio máximo) + Vende put (precio mínimo). Autlán paga entre el floor y el cap sin importar el mercado. Si la put se financia con la call → costless collar."}
          </span>
        </div>
        <div class="field-group">
          <label>${isEn ? "Spot Price (USD/MMBtu)" : "Precio spot (USD/MMBtu)"}</label>
          <input type="number" id="gas-col-spot" value="3.20" step="0.05"
                 oninput="calcGasCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Floor — short put (min price)" : "Floor — put corto (precio mínimo)"}</label>
          <input type="number" id="gas-col-floor" value="2.50" step="0.05"
                 oninput="calcGasCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Cap — long call (max price)" : "Cap — call largo (precio máximo)"}</label>
          <input type="number" id="gas-col-cap" value="4.50" step="0.05"
                 oninput="calcGasCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Implied Volatility (%)" : "Volatilidad implícita (%)"}</label>
          <input type="number" id="gas-col-vol" value="45" step="1"
                 oninput="calcGasCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Horizon (months)" : "Horizonte (meses)"}</label>
          <input type="number" id="gas-col-T" value="12" min="1" max="24"
                 oninput="calcGasCollar()" />
        </div>
        <div class="field-group">
          <label>${isEn ? "Volume (MMBtu/month)" : "Volumen (MMBtu/mes)"}</label>
          <input type="number" id="gas-col-vol-mmb" value="150000" step="10000"
                 oninput="calcGasCollar()" />
        </div>
      </div>
      <div id="gas-col-result">
        <div class="alert alert-info">
          <span>${isEn ? "Adjust parameters to calculate collar." : "Ajusta los parámetros para calcular el collar."}</span>
        </div>
      </div>
    </div>`;
}

function _gasTabAutogen() {
  const isEn = I18N.getLocale() === "en";
  return `
    <div class="card" style="background:var(--bg-raised);">
      <div class="card-title" style="margin-bottom:16px;">
        ${isEn ? "Self-Generation as a Natural Hedge" : "Autogeneración como cobertura natural"}
      </div>

      <div class="grid-2" style="gap:16px;">
        <div>
          <div class="section-title" style="margin-top:0;">
            ${isEn ? "Self-Generation Assets · Autlán Energía" : "Activos de autogeneración · Autlán Energía"}
          </div>
          ${[
            [isEn ? "Atexcaco Hydroelectric Plant (Puebla)" : "Central Hidroeléctrica Atexcaco (Puebla)", isEn ? "Primary renewable source" : "Principal fuente renovable", "var(--success-mid)"],
            [isEn ? "Solar panels (smelting plants)" : "Paneles solares (plantas smelting)", isEn ? "Daytime complement" : "Complemento diurno", "var(--gold)"],
            [isEn ? "Cogeneration (waste heat)" : "Cogeneración (calor residual)", isEn ? "Process energy usage" : "Aprovechamiento de proceso", "var(--gas-green)"],
          ].map(([nombre, desc, color]) => `
            <div style="display:flex; gap:10px; margin-bottom:12px;
                        padding:10px; background:var(--bg-surface);
                        border-radius:var(--radius-md);
                        border-left:3px solid ${color};">
              <div>
                <div style="font-size:12px; font-weight:600;">${nombre}</div>
                <div style="font-size:11px; color:var(--text-muted);">${desc}</div>
              </div>
            </div>`).join("")}
        </div>

        <div>
          <div class="section-title" style="margin-top:0;">
            ${isEn ? "Financial Impact" : "Impacto financiero"}
          </div>
          ${_resultRow(isEn ? "Current Self-Sufficiency" : "Autosuficiencia actual", "25-30%")}
          ${_resultRow(isEn ? "Quarterly Savings" : "Ahorro trimestral", "USD 2.8M", "success")}
          ${_resultRow(isEn ? "Estimated Annual Savings" : "Ahorro anual estimado", "USD 11.2M", "success")}
          ${_resultRow(isEn ? "Equivalent MMBtu Covered" : "MMBtu equivalentes cubiertos", "~688K MMBtu/year", "success")}
          ${_resultRow(isEn ? "Gas Exposure Reduction" : "Reducción exposición gas", "~27.5% of total consumption", "success")}
          ${_resultRow(isEn ? "CBAM Advantage (EU)" : "Ventaja CBAM (EU)", isEn ? "Lower carbon footprint vs competitors" : "Menor huella de carbono vs competidores", "accent")}

          <div class="alert alert-success" style="margin-top:12px;">
            <span class="alert-icon">✓</span>
            <span style="font-size:11.5px;">
              ${isEn
                ? "Self-generation is the most efficient natural hedge. Each additional % of self-sufficiency permanently reduces gas price exposure. Suggested target: 35-40% by 2027."
                : "La autogeneración es la cobertura natural más eficiente. Cada % adicional de autosuficiencia reduce la exposición al precio del gas permanentemente. Meta sugerida: 35-40% para 2027."}
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// CÁLCULOS
// ─────────────────────────────────────────
window.switchGasTab = function(idx) {
  [0, 1, 2, 3].forEach(i => {
    const tab = document.getElementById(`gas-tab-${i}`);
    const btn = document.querySelector(`.gas-tab[data-tab="${i}"]`);
    if (!tab || !btn) return;
    const active = i === idx;
    tab.style.display      = active ? "block" : "none";
    btn.style.color        = active ? "var(--gas-green)" : "var(--text-muted)";
    btn.style.borderBottom = active
      ? "2px solid var(--gas-green)" : "2px solid transparent";
  });
};

window.calcGasSwap = function() {
  const isEn  = I18N.getLocale() === "en";
  const spot  = parseFloat(document.getElementById("gas-swap-spot")?.value  || 3.20);
  const fijo  = parseFloat(document.getElementById("gas-swap-fijo")?.value  || 3.35);
  const vol   = parseFloat(document.getElementById("gas-swap-vol")?.value   || 150000);
  const meses = parseFloat(document.getElementById("gas-swap-T")?.value     || 12);

  const nocAnual      = vol * meses;
  const costoSinSwap  = spot * nocAnual / 1000;
  const costoConSwap  = fijo * nocAnual / 1000;
  const diferencia    = costoSinSwap - costoConSwap;
  const costoFijo12m  = fijo * 12 * vol / 1000;

  const el = document.getElementById("gas-swap-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Swap Outcome" : "Resultado del swap"}</div>
    ${_resultRow(isEn ? "Current Spot Price" : "Precio spot actual", `USD ${spot.toFixed(2)}/MMBtu`)}
    ${_resultRow(isEn ? "Contracted Fixed Price" : "Precio fijo pactado", `USD ${fijo.toFixed(2)}/MMBtu`,
                  fijo <= spot ? "positive" : "warn")}
    ${_resultRow(isEn ? "Monthly Volume" : "Volumen mensual", `${vol.toLocaleString()} MMBtu`)}
    ${_resultRow(isEn ? "Horizon" : "Horizonte", isEn ? `${meses} months` : `${meses} meses`)}
    ${_resultRow(isEn ? "Cost without Swap (spot)" : "Costo sin swap (spot)", `USD ${costoSinSwap.toFixed(1)}M`)}
    ${_resultRow(isEn ? "Cost with Swap (fixed)" : "Costo con swap (fijo)", `USD ${costoConSwap.toFixed(1)}M`,
                  fijo <= spot ? "positive" : "warn")}
    ${_resultRow(isEn ? "Savings / Additional Cost" : "Ahorro / costo adicional",
                  `USD ${Math.abs(diferencia).toFixed(1)}M ${diferencia >= 0 ? (isEn ? "savings" : "ahorro") : (isEn ? "cost" : "costo")}`,
                  diferencia >= 0 ? "positive" : "danger")}
    ${_resultRow(isEn ? "Annualized Fixed Cost" : "Costo fijo anualizado", `USD ${costoFijo12m.toFixed(1)}M/${isEn ? "year" : "año"}`)}

    <div class="alert alert-${fijo <= spot * 1.1 ? "success" : "warn"}"
         style="margin-top:12px;">
      <span class="alert-icon">${fijo <= spot * 1.1 ? "✓" : "⚠"}</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `The swap locks in the cost at USD ${fijo.toFixed(2)}/MMBtu. ${fijo <= spot ? "Below current spot — swap in positive mark-to-market." : `Premium of USD ${(fijo - spot).toFixed(2)}/MMBtu over spot — justified if gas is expected to rise to USD ${(fijo*1.2).toFixed(2)}+.`} Principal advantage: cost certainty for EBITDA.`
          : `El swap fija el costo en USD ${fijo.toFixed(2)}/MMBtu. ${fijo <= spot ? "Por debajo del spot actual — swap en plusvalía." : `Prima de USD ${(fijo - spot).toFixed(2)}/MMBtu sobre spot — justificada si se espera que el gas suba a USD ${(fijo*1.2).toFixed(2)}+.`} Ventaja principal: certidumbre en costos para EBITDA.`}
      </span>
    </div>
  `;
};

window.calcGasCall = function() {
  const isEn   = I18N.getLocale() === "en";
  const spot   = parseFloat(document.getElementById("gas-call-spot")?.value    || 3.20);
  const strike = parseFloat(document.getElementById("gas-call-strike")?.value  || 4.00);
  const volPct = parseFloat(document.getElementById("gas-call-vol")?.value     || 45) / 100;
  const meses  = parseFloat(document.getElementById("gas-call-T")?.value       || 12);
  const volMMB = parseFloat(document.getElementById("gas-call-vol-mmb")?.value || 150000);
  const T      = meses / 12;
  const r      = Scenarios.getVar("sofr1m") / 100;

  const kappa  = Models.PARAMS.gas.kappa;
  const mu_eq  = Models.PARAMS.gas.mu_eq;
  const res    = Models.schwartz("call", spot, strike, T, r, kappa, mu_eq, volPct);

  const primaTot = res.precio * volMMB * meses / 1000;

  const el = document.getElementById("gas-call-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">
      ${isEn ? "Call Outcome · Schwartz Mean-Reversion" : "Resultado call · Schwartz mean-reversion"}
    </div>
    ${_resultRow(isEn ? "Model" : "Modelo", "Schwartz 1-Factor (mean-reversion)")}
    ${_resultRow("Spot", `USD ${spot.toFixed(2)}/MMBtu`)}
    ${_resultRow(isEn ? "Strike (maximum price)" : "Strike (precio máximo)", `USD ${strike.toFixed(2)}/MMBtu`)}
    ${_resultRow(isEn ? "Implicit Forward" : "Forward implícito", `USD ${res.forward.toFixed(2)}/MMBtu`, "accent")}
    ${_resultRow(isEn ? "Call Premium" : "Prima call", `USD ${res.precio.toFixed(4)}/MMBtu`, "warn")}
    ${_resultRow(isEn ? "Total Premium" : "Prima total", `USD ${primaTot.toFixed(1)}M`, "warn")}
    ${_resultRow(isEn ? "Premium % of Spot" : "Prima % del spot", `${(res.precio/spot*100).toFixed(2)}%`)}
    ${_resultRow("Kappa (mean-reversion)", kappa.toFixed(2))}
    ${_resultRow(isEn ? "Long-Term Eq. Price" : "Precio eq. largo plazo", `USD ${Math.exp(mu_eq).toFixed(2)}/MMBtu`)}

    <div class="alert alert-info" style="margin-top:12px;">
      <span class="alert-icon">ℹ</span>
      <span style="font-size:11.5px;">
        ${isEn
          ? `The Schwartz model captures gas mean-reversion (kappa=${kappa}) — gas tends to return to USD ${Math.exp(mu_eq).toFixed(2)}/MMBtu in the long term. This reduces call price vs standard Black-Scholes. If gas goes above USD ${strike.toFixed(2)}, the call fully compensates.`
          : `El modelo Schwartz captura la reversión a la media del gas (kappa=${kappa}) — el gas tiende a volver a USD ${Math.exp(mu_eq).toFixed(2)}/MMBtu en el largo plazo. Esto reduce el precio de la call vs Black-Scholes simple. Si el gas supera USD ${strike.toFixed(2)}, la call compensa completamente.`}
      </span>
    </div>
  `;
};

window.calcGasCollar = function() {
  const isEn   = I18N.getLocale() === "en";
  const spot   = parseFloat(document.getElementById("gas-col-spot")?.value    || 3.20);
  const floor  = parseFloat(document.getElementById("gas-col-floor")?.value   || 2.50);
  const cap    = parseFloat(document.getElementById("gas-col-cap")?.value     || 4.50);
  const volPct = parseFloat(document.getElementById("gas-col-vol")?.value     || 45) / 100;
  const meses  = parseFloat(document.getElementById("gas-col-T")?.value       || 12);
  const volMMB = parseFloat(document.getElementById("gas-col-vol-mmb")?.value || 150000);
  const T      = meses / 12;
  const r      = Scenarios.getVar("sofr1m") / 100;

  const call   = Models.schwartz("call", spot, cap,   T, r,
                   Models.PARAMS.gas.kappa, Models.PARAMS.gas.mu_eq, volPct);
  const put    = Models.schwartz("put",  spot, floor, T, r,
                   Models.PARAMS.gas.kappa, Models.PARAMS.gas.mu_eq, volPct);

  const costoNeto = call.precio - put.precio;
  const esCostless = Math.abs(costoNeto) < 0.01;
  const costoTot  = costoNeto * volMMB * meses / 1000;

  const el = document.getElementById("gas-col-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">${isEn ? "Gas Collar Outcome" : "Resultado del collar de gas"}</div>
    ${_resultRow("Spot", `USD ${spot.toFixed(2)}/MMBtu`)}
    ${_resultRow(isEn ? "Floor (short put)" : "Floor (put vendida)", `USD ${floor.toFixed(2)}/MMBtu`, "positive")}
    ${_resultRow(isEn ? "Cap (long call)" : "Cap (call comprada)", `USD ${cap.toFixed(2)}/MMBtu`, "warn")}
    ${_resultRow(isEn ? "Call Premium (cap)" : "Prima call (cap)", `USD ${call.precio.toFixed(4)}/MMBtu`)}
    ${_resultRow(isEn ? "Put Premium (floor)" : "Prima put (floor)", `USD ${put.precio.toFixed(4)}/MMBtu`)}
    ${_resultRow(isEn ? "Net Collar Cost" : "Costo neto collar",
                  `USD ${costoNeto.toFixed(4)}/MMBtu`,
                  esCostless ? "positive" : costoNeto < 0 ? "positive" : "warn")}
    ${_resultRow(isEn ? "Total Cost" : "Costo total",
                  `USD ${costoTot.toFixed(1)}M`,
                  esCostless ? "positive" : costoNeto < 0 ? "positive" : "warn")}
    ${_resultRow(isEn ? "Costless?" : "¿Costless?",
                  esCostless ? (isEn ? "✓ Yes" : "✓ Sí") : costoNeto < 0 ? (isEn ? "✓ Net premium received" : "✓ Prima neta recibida") : (isEn ? "✗ No — adjust strikes" : "✗ No — ajustar strikes"),
                  esCostless || costoNeto < 0 ? "positive" : "warn")}
    ${_resultRow(isEn ? "Effective Price Range" : "Rango precio efectivo",
                  `USD ${floor.toFixed(2)} — ${cap.toFixed(2)}/MMBtu`)}

    <div class="alert alert-${esCostless || costoNeto <= 0 ? "success" : "info"}"
         style="margin-top:12px;">
      <span class="alert-icon">${esCostless || costoNeto <= 0 ? "✓" : "💡"}</span>
      <span style="font-size:11.5px;">
        ${esCostless
          ? (isEn ? `Costless collar achieved. Autlán pays between $${floor} and $${cap}/MMBtu always.` : `Costless collar logrado. Autlán paga entre $${floor} y $${cap}/MMBtu siempre.`)
          : (costoNeto < 0
            ? (isEn ? `Net premium received of USD ${Math.abs(costoTot).toFixed(1)}M — the sold put finances more than the purchased call.` : `Prima neta recibida de USD ${Math.abs(costoTot).toFixed(1)}M — la put vendida financia más que la call comprada.`)
            : (isEn ? "Adjust floor upwards or cap downwards to approximate costless." : "Ajusta el floor hacia arriba o el cap hacia abajo para aproximar a costless."))}
      </span>
    </div>
  `;
};

// ─────────────────────────────────────────
// TABLA COMPARATIVA
// ─────────────────────────────────────────
function _gasRenderTablaComparativa() {
  const el = document.getElementById("gas-tabla-comparativa");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const esc    = Scenarios.getState().escenarios;
  const volMMB = 1800000;
  const fijo   = 3.35;
  const capG   = 4.50;
  const r      = Scenarios.getVar("sofr1m") / 100;
  const T      = 1.0;

  const callP  = Models.schwartz("call", 3.20, capG, T, r,
    Models.PARAMS.gas.kappa, Models.PARAMS.gas.mu_eq, 0.45).precio;

  const precios = {
    base:      esc.base.precioGas,
    optimista: esc.optimista.precioGas,
    adverso:   esc.adverso.precioGas,
  };

  const fmt = (v) => `USD ${(v/1000).toFixed(1)}M`;

  const filas = [
    {
      label: isEn ? "Unhedged (gas cost)" : "Sin cobertura (costo gas)",
      fn:    (p) => -(p * volMMB / 1000),
    },
    {
      label: `Swap fixed price $${fijo}/MMBtu`,
      fn:    ()  => -(fijo * volMMB / 1000),
    },
    {
      label: `Call cap $${capG} (${isEn ? "-premium" : "−prima"})`,
      fn:    (p) => -(Math.min(p, capG) * volMMB / 1000
                     + callP * volMMB / 1000),
    },
    {
      label: isEn ? "Self-Generation 27.5% (savings)" : "Autogeneración 27.5% (ahorro)",
      fn:    ()  => 11200,
    },
  ];

  el.innerHTML = filas.map((f, i) => {
    const vB = f.fn(precios.base);
    const vO = f.fn(precios.optimista);
    const vA = f.fn(precios.adverso);

    const clsB = vB >= 0 ? "positive" : "negative";
    const clsO = vO >= 0 ? "positive" : "negative";
    const clsA = vA >= 0 ? "positive" : "negative";

    return `
      <tr class="${i === 0 ? "row-highlight" : ""}">
        <td>${i === 0 ? "<strong>" : ""}${f.label}${i === 0 ? "</strong>" : ""}</td>
        <td class="esc-base mono ${clsB}">${fmt(vB)}</td>
        <td class="esc-optimista mono ${clsO}">${fmt(vO)}</td>
        <td class="esc-adverso mono ${clsA}">${fmt(vA)}</td>
      </tr>`;
  }).join("");
}

// ─────────────────────────────────────────
// PAYOFF CHART
// ─────────────────────────────────────────
function _gasRenderPayoffChart() {
  const canvas = document.getElementById("gas-payoff-chart");
  if (!canvas) return;

  const isEn = I18N.getLocale() === "en";
  const ctx = canvas.getContext("2d");
  const w   = canvas.offsetWidth || 600;
  const h   = canvas.height      || 200;
  canvas.width = w;

  const r    = Scenarios.getVar("sofr1m") / 100;
  const T    = 1.0;
  const vol  = 1000000;

  const precios = [];
  for (let p = 1.0; p <= 8.0; p += 0.1) precios.push(parseFloat(p.toFixed(2)));

  const fijo  = 3.35;
  const capG  = 4.50;
  const floor = 2.50;

  const callP = Models.schwartz("call", 3.20, capG,   T, r,
    Models.PARAMS.gas.kappa, Models.PARAMS.gas.mu_eq, 0.45).precio;
  const putP  = Models.schwartz("put",  3.20, floor,  T, r,
    Models.PARAMS.gas.kappa, Models.PARAMS.gas.mu_eq, 0.45).precio;

  const series = [
    {
      label: isEn ? "Unhedged" : "Sin cobertura",
      color: "#8A96A8",
      vals:  precios.map(p => -p * vol / 1000),
    },
    {
      label: `Swap fixed $${fijo}`,
      color: "#1B4F8A",
      vals:  precios.map(() => -fijo * vol / 1000),
    },
    {
      label: `Call cap $${capG}`,
      color: "#D4870F",
      vals:  precios.map(p =>
        -(Math.min(p, capG) * vol / 1000 + callP * vol / 1000)),
    },
    {
      label: `Collar $${floor}–$${capG}`,
      color: "#2D7D4E",
      vals:  precios.map(p => {
        const ef = Math.min(Math.max(p, floor), capG);
        return -(ef * vol / 1000 + (callP - putP) * vol / 1000);
      }),
    },
  ];

  const allVals = series.flatMap(s => s.vals);
  const minV    = Math.min(...allVals);
  const maxV    = Math.max(...allVals);
  const pad     = 40;

  const xScale = (p) => pad + (p - 1.0) / (8.0 - 1.0) * (w - pad*2);
  const yScale = (v) => pad + (1-(v-minV)/(maxV-minV)) * (h - pad*2);

  ctx.clearRect(0, 0, w, h);

  // Precio actual
  const precioAct = Scenarios.getVar("precioGas");
  ctx.strokeStyle = "#C8CDD8";
  ctx.lineWidth   = 1;
  ctx.setLineDash([3,3]);
  ctx.beginPath();
  ctx.moveTo(xScale(precioAct), pad);
  ctx.lineTo(xScale(precioAct), h - pad);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  ctx.fillText(isEn ? `Current price $${precioAct.toFixed(2)}` : `Precio actual $${precioAct.toFixed(2)}`, xScale(precioAct)+4, pad+12);

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

  ctx.fillStyle = "#8A96A8";
  ctx.font      = "10px Inter";
  [2, 3, 4, 5, 6, 7].forEach(p => {
    ctx.fillText(`$${p}`, xScale(p)-6, h-4);
  });

  const leyEl = document.getElementById("gas-chart-leyenda");
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
function _gasRenderRecomendacion() {
  const el = document.getElementById("gas-recomendacion");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";
  const precio   = Scenarios.getVar("precioGas");
  const expuesto = 1800000; // MMBtu

  el.innerHTML = `
    <div class="card-title" style="margin-bottom:16px;">
      ${isEn ? `Hedging Posture Analysis · Gas USD ${precio.toFixed(2)}/MMBtu` : `Análisis de postura · Gas USD ${precio.toFixed(2)}/MMBtu`}
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
            ? `Rise in the natural gas price. With ~1.8M MMBtu annual market exposure, each USD 1/MMBtu rise costs <strong>an additional USD ${(expuesto/1e6).toFixed(1)}M</strong> in operating expenses — straight to EBITDA.`
            : `Alza en el precio del gas natural. Con ~1.8M MMBtu anuales expuestos a mercado, cada USD 1/MMBtu de alza cuesta <strong>USD ${(expuesto/1e6).toFixed(1)}M adicionales</strong> en costos operativos — directamente al EBITDA.`}
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
            ? "Swap: loses benefit if gas drops. Call: maintains savings if gas drops but pays premium. Collar: fixed price range — loses upside if price falls significantly. Self-generation: capital expenditure with long-term return."
            : "Swap: pierde el beneficio si el gas baja. Call: mantiene el ahorro si baja pero paga prima. Collar: rango de precio fijo — pierde upside si baja mucho. Autogeneración: inversión de capital con retorno de largo plazo."}
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
            ? `<strong>12-month fixed price swap</strong> on 50-60% of exposed consumption (~900K-1.1M MMBtu). Simple, zero premium, cost certainty. Complement with self-generation expansion to 35% by 2027.`
            : `<strong>Swap precio fijo 12 meses</strong> sobre 50-60% del consumo expuesto (~900K-1.1M MMBtu). Simple, sin prima, certidumbre en costos. Complementar con expansión de autogeneración hacia 35% para 2027.`}
        </div>
      </div>
    </div>

    <div class="alert alert-${precio > 4.0 ? "danger"
                             : precio > 3.5 ? "warn" : "info"}">
      <span class="alert-icon">
        ${precio > 4.0 ? "🚨" : precio > 3.5 ? "⚠" : "ℹ"}
      </span>
      <span style="font-size:12px;">
        <strong>${isEn ? "Current posture:" : "Postura actual:"}</strong>
        ${isEn
          ? (precio > 4.0
            ? `Gas in high risk zone (USD ${precio.toFixed(2)}/MMBtu). Impact on operating costs vs base: +USD ${((precio-3.20)*expuesto/1e6).toFixed(1)}M. Contract swap urgently to lock in the price.`
            : (precio > 3.5
              ? `Gas elevated (USD ${precio.toFixed(2)}/MMBtu). Fixed swap at ~$${(precio*1.05).toFixed(2)} gives certainty at a reasonable cost over the current base.`
              : `Gas at favorable levels (USD ${precio.toFixed(2)}/MMBtu). Good time to enter low fixed price swap — lock in current levels for the next year.`))
          : (precio > 4.0
            ? `Gas en zona de riesgo alto (USD ${precio.toFixed(2)}/MMBtu). Impacto en costos operativos vs base: +USD ${((precio-3.20)*expuesto/1e6).toFixed(1)}M. Contratar swap urgentemente para fijar el precio.`
            : (precio > 3.5
              ? `Gas elevado (USD ${precio.toFixed(2)}/MMBtu). El swap fijo a ~$${(precio*1.05).toFixed(2)} da certidumbre a un costo razonable sobre la base actual.`
              : `Gas en niveles favorables (USD ${precio.toFixed(2)}/MMBtu). Buen momento para contratar swap a precio fijo bajo — asegurar el nivel actual para el próximo año.`))}
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

// ─────────────────────────────────────────
// BIND & INIT
// ─────────────────────────────────────────
function _gasBindCalcs() {
  calcGasSwap();
  calcGasCall();
  calcGasCollar();
}

Scenarios.on("page:gas", () => {
  const el = document.getElementById("gas-content");
  if (el) renderGas();
});