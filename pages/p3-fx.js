/**
 * pages/p3-fx.js — Riesgo Tipo de Cambio USD/MXN
 * Modelos: Collar (Heston), Forward (paridad cubierta), Swap divisas
 */

function renderFX() {
  const el = document.getElementById("fx-content");
  if (!el) return;

  el.innerHTML = `

    <!-- EXPOSICIÓN ACTUAL -->
    <div class="alert alert-danger mb-24">
      <span class="alert-icon">⚠</span>
      <span>
        Cobertura FX activa: <strong>~3%</strong> de exposición cubierta vs
        <strong>60%</strong> permitido por política interna.
        Gap de <strong>~57 pp</strong> sin protección sobre
        ~USD 394M de ingresos anualizados.
        USD/MXN actual: <strong id="fx-tc-live">17.20</strong>
      </span>
    </div>

    <!-- KPIs DE EXPOSICIÓN -->
    <div class="grid-4 mb-24" id="fx-kpis"></div>

    <!-- COLLARES VIGENTES -->
    <div class="section-title">Collares USD/MXN vigentes · 1T26</div>
    <div class="card mb-24" id="fx-collares-vigentes"></div>

    <!-- TABS DE INSTRUMENTOS -->
    <div class="section-title">Evaluar instrumentos de cobertura</div>
    <div class="card mb-24">

      <!-- Tab headers -->
      <div style="display:flex; gap:4px; margin-bottom:20px;
                  border-bottom:2px solid var(--border); padding-bottom:0;">
        ${["Collar","Forward","Put Opción","Swap Divisas"].map((t,i) => `
          <button class="fx-tab ${i===0?"active":""}"
                  data-tab="${i}"
                  onclick="switchFXTab(${i})"
                  style="padding:8px 16px; font-size:12px; font-weight:500;
                         border:none; background:none; cursor:pointer;
                         border-bottom:2px solid ${i===0?"var(--accent)":"transparent"};
                         margin-bottom:-2px;
                         color:${i===0?"var(--accent)":"var(--text-muted)"};">
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
    <div class="section-title">Comparativo de flujos por escenario</div>
    <div class="scenario-table-wrap mb-24">
      <table class="scenario-table">
        <thead>
          <tr>
            <th>Instrumento / Escenario</th>
            <th class="esc-header-base">Base · $18.00</th>
            <th class="esc-header-opt">Optimista · $19.50</th>
            <th class="esc-header-adv">Adverso · $16.00</th>
          </tr>
        </thead>
        <tbody id="fx-tabla-comparativa"></tbody>
      </table>
    </div>

    <!-- PAYOFF CHART -->
    <div class="section-title">Diagrama de payoff · USD/MXN</div>
    <div class="card mb-24">
      <div class="chart-title">Ganancia/pérdida del instrumento en función del tipo de cambio al vencimiento</div>
      <canvas id="fx-payoff-chart" height="200"></canvas>
      <div id="fx-chart-leyenda"
           style="display:flex; gap:16px; margin-top:12px;
                  flex-wrap:wrap; font-size:11px;"></div>
    </div>

    <!-- ESTRATEGIA RECOMENDADA -->
    <div class="section-title">Análisis y recomendación</div>
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

  const tc     = Scenarios.getVar("usdmxn");
  const tcBase = 18.0;
  const ingresosUSD = 394000; // anualizado 1T26×4
  const impacto1peso = ingresosUSD * 0.85 / tcBase; // USD por 1 MXN de movimiento

  const exp    = AUTLAN.derivadosVigentes.exposicionVsCobertura;
  const nocCub = exp.coberturaFX_nocional.valor;
  const nocExp = ingresosUSD - nocCub;

  el.innerHTML = [
    {
      label: "USD/MXN actual",
      value: `$${tc.toFixed(2)}`,
      sub:   `Base referencia: $18.00`,
      tipo:  tc < 17.5 ? "danger" : tc > 18.5 ? "success" : "warn",
      delta: tc < 18 ? `Peso fuerte ${((18-tc)/18*100).toFixed(1)}%`
                     : `Peso débil +${((tc-18)/18*100).toFixed(1)}%`,
      dir:   tc < 18 ? "down" : "up",
    },
    {
      label: "Impacto por $1 MXN",
      value: `USD ${(impacto1peso/1000).toFixed(1)}M`,
      sub:   "En ingresos anualizados",
      tipo:  "warn",
      delta: "Por movimiento unitario",
      dir:   "down",
    },
    {
      label: "Exposición cubierta",
      value: `USD ${(nocCub/1000).toFixed(0)}M`,
      sub:   `${exp.pctCubierto_FX.valor}% del total — solo 3 meses`,
      tipo:  "danger",
      delta: "Muy por debajo del 60%",
      dir:   "down",
    },
    {
      label: "Exposición sin cubrir",
      value: `USD ${(nocExp/1000).toFixed(0)}M`,
      sub:   `${(100 - exp.pctCubierto_FX.valor).toFixed(0)}% desprotegido`,
      tipo:  "danger",
      delta: `Gap vs política: ${exp.gapCobertura_FX.valor} pp`,
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

  const tc      = Scenarios.getVar("usdmxn");
  const collares = AUTLAN.derivadosVigentes.collarsFX;

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha contrato</th>
            <th>Floor (put largo)</th>
            <th>Cap (call corto)</th>
            <th>Nocional/mes</th>
            <th>Vencimiento</th>
            <th>Estado TC actual</th>
            <th>Payoff estimado</th>
          </tr>
        </thead>
        <tbody>
          ${collares.map(c => {
            const payoff = Models.collarPayoff(tc, c.floorUSD, c.capUSD, c.nocionalUSD.valor);
            const zona   = payoff.zona;
            const zonaCls = zona === "PUT_EJERCIDO"  ? "positive"
                          : zona === "CALL_EJERCIDO" ? "negative"
                          : "warn";
            const zonaLbl = zona === "PUT_EJERCIDO"  ? "✓ Put protege"
                          : zona === "CALL_EJERCIDO" ? "✗ Call limita"
                          : "◎ Dentro del rango";
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
      Total nocional cubierto: USD ${(collares.length * 1000).toLocaleString()}K/mes ·
      Vencimiento jun-2026 · Política permite hasta USD ${(394000*0.6/12).toFixed(0)}K/mes adicionales
    </div>
  `;
}

// ─────────────────────────────────────────
// TABS — INSTRUMENTOS
// ─────────────────────────────────────────
function _fxTabCollar() {
  const tc = Scenarios.getVar("usdmxn") || 17.20;
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">Parámetros del collar</div>

        <div class="field-group">
          <label>Floor — put largo (piso de protección)</label>
          <input type="number" id="fx-collar-floor" value="17.50" step="0.05"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>Cap — call corto (techo que se cede)</label>
          <input type="number" id="fx-collar-cap" value="18.50" step="0.05"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>Nocional (USD miles)</label>
          <input type="number" id="fx-collar-noc" value="10000" step="1000"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>Horizonte (meses)</label>
          <input type="number" id="fx-collar-T" value="6" min="1" max="12"
                 oninput="calcFXCollar()" />
        </div>
        <div class="field-group">
          <label>Volatilidad implícita (%)</label>
          <input type="number" id="fx-collar-vol" value="12" step="0.5"
                 oninput="calcFXCollar()" />
        </div>
      </div>

      <div id="fx-collar-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular el collar.</span>
        </div>
      </div>
    </div>
  `;
}

function _fxTabForward() {
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">Parámetros del forward</div>
        <div class="field-group">
          <label>Tipo de cambio spot (USD/MXN)</label>
          <input type="number" id="fx-fwd-spot" value="17.20" step="0.05"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>Tasa MXN — TIIE (% anual)</label>
          <input type="number" id="fx-fwd-rmx" value="7.10" step="0.05"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>Tasa USD — SOFR (% anual)</label>
          <input type="number" id="fx-fwd-rusd" value="4.30" step="0.05"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>Horizonte (meses)</label>
          <input type="number" id="fx-fwd-T" value="6" min="1" max="12"
                 oninput="calcFXForward()" />
        </div>
        <div class="field-group">
          <label>Nocional (USD miles)</label>
          <input type="number" id="fx-fwd-noc" value="10000" step="1000"
                 oninput="calcFXForward()" />
        </div>
      </div>
      <div id="fx-fwd-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular el forward.</span>
        </div>
      </div>
    </div>
  `;
}

function _fxTabPut() {
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">Put USD/MXN — opción de venta</div>
        <div class="field-group">
          <label>Spot actual (USD/MXN)</label>
          <input type="number" id="fx-put-spot" value="17.20" step="0.05"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>Strike (precio de ejercicio)</label>
          <input type="number" id="fx-put-strike" value="17.00" step="0.05"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>Volatilidad implícita (%)</label>
          <input type="number" id="fx-put-vol" value="12" step="0.5"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>Horizonte (meses)</label>
          <input type="number" id="fx-put-T" value="6" min="1" max="12"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>Nocional (USD miles)</label>
          <input type="number" id="fx-put-noc" value="10000" step="1000"
                 oninput="calcFXPut()" />
        </div>
        <div class="field-group">
          <label>Modelo de pricing</label>
          <select id="fx-put-modelo" onchange="calcFXPut()">
            <option value="bs">Black-Scholes estándar</option>
            <option value="heston" selected>Heston (volatilidad estocástica)</option>
          </select>
        </div>
      </div>
      <div id="fx-put-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular la put.</span>
        </div>
      </div>
    </div>
  `;
}

function _fxTabSwap() {
  return `
    <div class="grid-2">
      <div>
        <div class="section-title" style="margin-top:0;">Cross-currency swap USD/MXN</div>
        <div class="field-group">
          <label>Nocional en USD (miles)</label>
          <input type="number" id="fx-swap-noc" value="20000" step="1000"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>Tasa fija MXN que recibes (%)</label>
          <input type="number" id="fx-swap-fija" value="10.50" step="0.05"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>TIIE actual (%)</label>
          <input type="number" id="fx-swap-tiie" value="7.10" step="0.05"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>Spread sobre TIIE (%)</label>
          <input type="number" id="fx-swap-spread" value="1.50" step="0.05"
                 oninput="calcFXSwap()" />
        </div>
        <div class="field-group">
          <label>Vencimiento (años)</label>
          <input type="number" id="fx-swap-T" value="1" step="0.25"
                 oninput="calcFXSwap()" />
        </div>
      </div>
      <div id="fx-swap-result">
        <div class="alert alert-info">
          <span>Ajusta los parámetros para calcular el swap.</span>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// CÁLCULOS POR INSTRUMENTO
// ─────────────────────────────────────────
window.switchFXTab = function(idx) {
  [0,1,2,3].forEach(i => {
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
    <div class="section-title" style="margin-top:0;">Resultado del collar</div>
    ${_resultRow("Spot actual", `$${S.toFixed(2)} MXN/USD`)}
    ${_resultRow("Floor (put largo)", `$${floor.toFixed(2)}`, "positive")}
    ${_resultRow("Cap (call corto)", `$${cap.toFixed(2)}`, "warn")}
    ${_resultRow("Prima put", `$${result.put.precio.toFixed(4)}/USD`)}
    ${_resultRow("Prima call", `$${result.call.precio.toFixed(4)}/USD`)}
    ${_resultRow("Costo neto collar", `$${result.costoNeto.toFixed(4)}/USD`,
                  result.esCostless ? "positive" : "warn")}
    ${_resultRow("Costo total nocional", `USD ${costoPesos.toFixed(1)}K`,
                  result.esCostless ? "positive" : "warn")}
    ${_resultRow("Rango protegido", `$${floor.toFixed(2)} — $${cap.toFixed(2)}`)}
    ${_resultRow("¿Costless collar?",
                  result.esCostless ? "✓ Sí — prima cero" : "✗ No — tiene costo",
                  result.esCostless ? "positive" : "warn")}
    ${_resultRow("Modelo", result.modelo || "Heston")}

    <div class="alert alert-${result.esCostless ? "success" : "info"}" style="margin-top:12px;">
      <span class="alert-icon">${result.esCostless ? "✓" : "ℹ"}</span>
      <span style="font-size:11.5px;">
        ${result.esCostless
          ? "Costless collar — la prima del call vendido financia el put comprado. Estrategia preferida por política Autlán."
          : `Collar con costo neto de $${result.costoNeto.toFixed(4)} por USD. ` +
            `Ajusta floor/cap para aproximar a costless.`}
      </span>
    </div>
  `;

  _fxRenderPayoffChart();
};

window.calcFXForward = function() {
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
    <div class="section-title" style="margin-top:0;">Resultado del forward</div>
    ${_resultRow("Spot actual", `$${spot.toFixed(4)}`)}
    ${_resultRow("Precio forward", `$${res.forward.toFixed(4)}`, "accent")}
    ${_resultRow("Puntos swap (fwd−spot)", `$${res.puntosSwap.toFixed(4)}`,
                  res.puntosSwap > 0 ? "warn" : "positive")}
    ${_resultRow("Diferencial tasas (TIIE−SOFR)",
                  `${((r_d-r_f)*100).toFixed(2)}% — explica el diferencial`)}
    ${_resultRow("Horizonte", `${meses} meses`)}
    ${_resultRow("Nocional", `USD ${noc.toLocaleString()}K`)}
    ${_resultRow("Costo de oportunidad", `USD ${costoCub.toFixed(1)}K`,
                  costoCub > 0 ? "warn" : "positive")}

    <div class="alert alert-warn" style="margin-top:12px;">
      <span class="alert-icon">⚠</span>
      <span style="font-size:11.5px;">
        El forward fija el TC en <strong>$${res.forward.toFixed(4)}</strong>.
        Si el peso se deprecia más, Autlán pierde el upside.
        Si se aprecia, el forward protege completamente.
        <br>Ventaja vs collar: cero prima. Desventaja: elimina upside.
      </span>
    </div>
  `;
};

window.calcFXPut = function() {
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
    <div class="section-title" style="margin-top:0;">Resultado de la put</div>
    ${_resultRow("Modelo", modelo === "heston" ? "Heston (vol. estocástica)" : "Black-Scholes")}
    ${_resultRow("Spot", `$${S.toFixed(2)}`)}
    ${_resultRow("Strike", `$${K.toFixed(2)}`)}
    ${_resultRow("Prima put", `$${res.precio.toFixed(4)} por USD`, "accent")}
    ${_resultRow("Prima total nocional", `USD ${primaNoc.toFixed(1)}K`, "warn")}
    ${_resultRow("Prima % nocional", `${(res.precio/S*100).toFixed(2)}%`)}
    ${_resultRow("Delta", res.delta.toFixed(4))}
    ${_resultRow("Gamma", res.gamma.toFixed(6))}
    ${_resultRow("Vega (por 1% vol)", res.vega.toFixed(4))}
    ${_resultRow("Moneyness", res.itm ? "ITM — en el dinero" : "OTM — fuera del dinero",
                  res.itm ? "positive" : "warn")}

    <div class="alert alert-info" style="margin-top:12px;">
      <span class="alert-icon">ℹ</span>
      <span style="font-size:11.5px;">
        La put protege el downside si USD/MXN cae bajo $${K.toFixed(2)}.
        Mantiene el upside si el peso se deprecia.
        Costo: USD ${primaNoc.toFixed(0)}K (prima pagada, pérdida máxima).
      </span>
    </div>
  `;
};

window.calcFXSwap = function() {
  const noc    = parseFloat(document.getElementById("fx-swap-noc")?.value    || 20000);
  const fija   = parseFloat(document.getElementById("fx-swap-fija")?.value   || 10.50) / 100;
  const tiie   = parseFloat(document.getElementById("fx-swap-tiie")?.value   || 7.10)  / 100;
  const spread = parseFloat(document.getElementById("fx-swap-spread")?.value || 1.50)  / 100;
  const T      = parseFloat(document.getElementById("fx-swap-T")?.value      || 1);

  const res = Models.swapMTM(noc, fija, tiie, spread, T, tiie + spread);
  const el  = document.getElementById("fx-swap-result");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">Resultado del swap</div>
    ${_resultRow("Tasa fija pactada", `${(fija*100).toFixed(2)}%`)}
    ${_resultRow("Tasa variable actual", `${((tiie+spread)*100).toFixed(2)}% (TIIE+spread)`)}
    ${_resultRow("Mark-to-market", `USD ${res.mtm.toFixed(1)}K`,
                  res.mtm >= 0 ? "positive" : "danger")}
    ${_resultRow("Ahorro/costo anual", `USD ${res.ahorroAnual.toFixed(1)}K`,
                  res.ahorroAnual >= 0 ? "positive" : "danger")}
    ${_resultRow("DV01", `USD ${res.dv01.toFixed(2)}K por 1bp`)}
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
    { label: "Sin cobertura",      fn: sinCob,   clase: "" },
    { label: "Forward $"+fwdPrice.toFixed(2), fn: conFwd, clase: "accent" },
    { label: "Collar $17.50-$18.50", fn: conCollar, clase: "success" },
    { label: "Put $17.00 (−prima)", fn: conPut,  clase: "warn" },
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
  const ctx  = canvas.getContext("2d");
  const w    = canvas.offsetWidth || 600;
  const h    = canvas.height || 200;
  canvas.width = w;

  const r   = Scenarios.getVar("tiie28") / 100;
  const q   = Scenarios.getVar("sofr1m") / 100;
  const S   = Scenarios.getVar("usdmxn");
  const noc = 10000;
  const T   = 0.5;

  const tcs = [];
  for (let tc = 13.0; tc <= 22.0; tc += 0.1) tcs.push(parseFloat(tc.toFixed(2)));

  const fwdP  = Models.forwardPrice(S, r, q, T).forward;
  const floor = S * 0.97, cap = S * 1.06;
  const koH   = S * 1.08, koK = S * 0.99;

  const putP = Models.heston("put", S, S*0.97, T, r, q,
    Models.PARAMS.fx_usdmxn.v0, Models.PARAMS.fx_usdmxn.kappa,
    Models.PARAMS.fx_usdmxn.theta_v, Models.PARAMS.fx_usdmxn.xi,
    Models.PARAMS.fx_usdmxn.rho_sv).precio;

  const sgRes = Models.seagull(S, floor, cap, S*0.90, T, r, q, 0.12, true, Models.PARAMS.fx_usdmxn);
  const stRes = Models.strangle(S, S*0.93, S*1.07, T, r, 0.12, q, true, Models.PARAMS.fx_usdmxn);

  const series = [
    {
      label: isEn ? "Unhedged" : "Sin cobertura",
      color: "#8A96A8", dash: [],
      vals:  tcs.map(tc => (tc - S) * noc),
    },
    {
      label: `Forward $${fwdP.toFixed(2)}`,
      color: "#5B2D8E", dash: [],
      vals:  tcs.map(tc => Models.forwardPayoff(tc, fwdP, noc).ganancia),
    },
    {
      label: `Collar $${floor.toFixed(2)}–$${cap.toFixed(2)}`,
      color: "#2D7D4E", dash: [],
      vals:  tcs.map(tc => Models.collarPayoff(tc, floor, cap, noc).payoffCollar),
    },
    {
      label: `Put $${(S*0.97).toFixed(2)}`,
      color: "#D4870F", dash: [],
      vals:  tcs.map(tc => Math.max(S*0.97 - tc, 0) * noc - putP * noc),
    },
    {
      label: `KO Fwd (H=$${koH.toFixed(2)})`,
      color: "#D43050", dash: [5,3],
      vals:  tcs.map(tc => tc >= koH ? 0 : (koK - tc) * noc),
    },
    {
      label: "Seagull",
      color: "#1B8FAA", dash: [3,3],
      vals:  tcs.map(tc => sgRes.payoff(tc) * noc - sgRes.costoNeto * noc),
    },
    {
      label: "Strangle",
      color: "#B8860B", dash: [7,3],
      vals:  tcs.map(tc => stRes.payoff(tc) * noc),
    },
  ];

  const allVals = series.flatMap(s => s.vals);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad  = 40;

  const xScale = (tc) => pad + (tc - 13.0) / (22.0 - 13.0) * (w - pad*2);
  const yScale = (v)  => pad + (1 - (v - minV) / (maxV - minV)) * (h - pad*2);

  ctx.clearRect(0, 0, w, h);

  // Línea cero
  ctx.strokeStyle = "#E2E6ED"; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(pad, yScale(0)); ctx.lineTo(w-pad, yScale(0)); ctx.stroke();
  ctx.setLineDash([]);

  // TC actual
  const tcAct = S;
  ctx.strokeStyle = "#C8CDD8"; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(xScale(tcAct), pad); ctx.lineTo(xScale(tcAct), h-pad); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8A96A8"; ctx.font = "10px Inter";
  ctx.fillText(`TC $${tcAct.toFixed(2)}`, xScale(tcAct)+4, pad+12);

  series.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = s.dash.length ? 1.5 : 2;
    ctx.setLineDash(s.dash);
    ctx.beginPath();
    tcs.forEach((tc, i) => {
      const x = xScale(tc), y = yScale(s.vals[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.fillStyle = "#8A96A8"; ctx.font = "10px Inter";
  [14,15,16,17,18,19,20,21].forEach(tc => {
    ctx.fillText(`$${tc}`, xScale(tc)-8, h-4);
  });

  const leyEl = document.getElementById("fx-chart-leyenda");
  if (leyEl) {
    leyEl.innerHTML = series.map(s => `
      <div style="display:flex; align-items:center; gap:5px;">
        <div style="width:20px; height:3px; background:${s.color}; border-radius:2px;
                    ${s.dash.length ? "opacity:0.7;" : ""}"></div>
        <span>${s.label}</span>
      </div>`).join("");
  }
}

// ─────────────────────────────────────────
// RECOMENDACIÓN
// ─────────────────────────────────────────
function _fxRenderRecomendacion() {
  const el = document.getElementById("fx-recomendacion");
  if (!el) return;

  const tc  = Scenarios.getVar("usdmxn");
  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;

  el.innerHTML = `
    <div class="card-title" style="margin-bottom:16px;">
      Análisis de postura · USD/MXN $${tc.toFixed(2)}
    </div>

    <div class="grid-3" style="gap:16px; margin-bottom:16px;">

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); border-left:3px solid var(--accent);">
        <div style="font-size:11px; font-weight:700; color:var(--accent);
                    margin-bottom:6px;">QUÉ RIESGO MITIGA</div>
        <div style="font-size:12px; line-height:1.6;">
          Apreciación del peso mexicano vs USD.
          Con ingresos en USD y costos en MXN, cada peso de fortaleza
          reduce el equivalente MXN de los ingresos sin mover los costos.
          Impacto: ~USD ${(322746*0.85/18).toFixed(0)}K por peso de apreciación.
        </div>
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); border-left:3px solid var(--warn);">
        <div style="font-size:11px; font-weight:700; color:var(--warn);
                    margin-bottom:6px;">QUÉ RIESGO ACEPTA</div>
        <div style="font-size:12px; line-height:1.6;">
          Con collar: se cede el upside si el peso se deprecia más allá del cap.
          Con forward: se elimina completamente la incertidumbre — bueno y malo.
          Con put: riesgo de perder la prima si el TC no se mueve a favor.
        </div>
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); border-left:3px solid var(--danger);">
        <div style="font-size:11px; font-weight:700; color:var(--danger);
                    margin-bottom:6px;">QUÉ SACRIFICA</div>
        <div style="font-size:12px; line-height:1.6;">
          Forward: todo el upside cambiario.
          Collar: upside por encima del cap.
          Put: la prima pagada reduce el ingreso neto incluso si no se ejerce.
          En todos los casos: la certidumbre tiene un costo económico.
        </div>
      </div>

    </div>

    <div class="alert alert-${tc < 17.0 ? "danger" : tc < 18.0 ? "warn" : "success"}">
      <span class="alert-icon">
        ${tc < 17.0 ? "🚨" : tc < 18.0 ? "⚠" : "✓"}
      </span>
      <span style="font-size:12px;">
        <strong>Postura actual:</strong>
        ${tc < 17.0
          ? `TC en zona de riesgo alto ($${tc.toFixed(2)}). Cada centavo adicional de apreciación 
             impacta los ingresos no cubiertos (~97%) directamente. 
             Prioridad: activar coberturas hasta el 60% de política inmediatamente.`
          : tc < 18.0
          ? `TC en zona de alerta ($${tc.toFixed(2)}). El gap de cobertura (${exp.gapCobertura_FX.valor} pp) 
             representa una exposición significativa. Collares costless son la estrategia 
             más eficiente en términos costo/protección bajo las condiciones actuales.`
          : `TC en zona favorable ($${tc.toFixed(2)}). El peso débil beneficia los ingresos. 
             Considerar reducir cobertura hacia el mínimo de política para capturar 
             el diferencial cambiario positivo.`}
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

// ─────────────────────────────────────────
// EXPORTAR EXCEL (CSV multi-hoja simulado)
// ─────────────────────────────────────────
window.exportarFXExcel = function() {
  const isEn = I18N.getLocale() === "en";
  const r    = Scenarios.getVar("tiie28") / 100;
  const q    = Scenarios.getVar("sofr1m") / 100;
  const S    = Scenarios.getVar("usdmxn");
  const T    = 0.5;
  const noc  = 10000;
  const esc  = Scenarios.getState().escenarios;

  // ── Hoja 1: Parámetros del modelo ──
  let csv = isEn ? "AUTLAN FX HEDGING CALCULATOR — MODEL EXPORT\n\n"
                 : "AUTLAN CALCULADORA FX — EXPORTACION DEL MODELO\n\n";
  
  csv += isEn ? "MODEL PARAMETERS
" : "PARÁMETROS DEL MODELO
";
  csv += isEn ? "Parameter,Value,Unit
" : "Parámetro,Valor,Unidad
";
  csv += `"USD/MXN Spot",${S.toFixed(4)},MXN/USD
`;
  csv += `"TIIE 28d",${(r*100).toFixed(2)},%
`;
  csv += `"SOFR 1m",${(q*100).toFixed(2)},%
`;
  csv += `"${isEn?"Horizon":"Horizonte"}",${T*12},${isEn?"months":"meses"}
`;
  csv += `"${isEn?"Reference Notional":"Nocional referencia"}",${noc},${isEn?"USD thousands":"USD miles"}
`;
  csv += `"${isEn?"Heston v0 (variance)":"Heston v0 (varianza)"}",${Models.PARAMS.fx_usdmxn.v0},—
`;
  csv += `"${isEn?"Heston kappa (mean reversion)":"Heston kappa (reversión media)"}",${Models.PARAMS.fx_usdmxn.kappa},—
`;
  csv += `"${isEn?"Heston xi (vol of vol)":"Heston xi (vol de vol)"}",${Models.PARAMS.fx_usdmxn.xi},—
`;
  csv += `"${isEn?"Heston rho (correlation)":"Heston rho (correlación)"}",${Models.PARAMS.fx_usdmxn.rho_sv},—

`;

  // ── Hoja 2: Resultados de cada instrumento ──
  csv += isEn ? "INSTRUMENT PRICING RESULTS
" : "RESULTADOS DE PRICING POR INSTRUMENTO
";

  // Collar
  const collarFloor = parseFloat(document.getElementById("fx-collar-floor")?.value || S*0.97);
  const collarCap   = parseFloat(document.getElementById("fx-collar-cap")?.value   || S*1.06);
  const collarVol   = parseFloat(document.getElementById("fx-collar-vol")?.value   || 12) / 100;
  const collarRes   = Models.collarPrice(S, collarFloor, collarCap, T, r, q, collarVol, true, Models.PARAMS.fx_usdmxn);

  csv += isEn ? "
COLLAR
" : "
COLLAR
";
  csv += isEn ? "Parameter,Value
" : "Parámetro,Valor
";
  csv += `"Spot",$${S.toFixed(4)}
`;
  csv += `"Floor",$${collarFloor.toFixed(4)}
`;
  csv += `"Cap",$${collarCap.toFixed(4)}
`;
  csv += `"${isEn?"Put Premium":"Prima put"}",$${collarRes.put.precio.toFixed(6)}/USD
`;
  csv += `"${isEn?"Call Premium":"Prima call"}",$${collarRes.call.precio.toFixed(6)}/USD
`;
  csv += `"${isEn?"Net Cost":"Costo neto"}",$${collarRes.costoNeto.toFixed(6)}/USD
`;
  csv += `"${isEn?"Costless?":"¿Costless?"}","${collarRes.esCostless ? "Yes/Sí" : "No"}"
`;
  csv += `"${isEn?"Total notional cost":"Costo total nocional"}",USD ${(collarRes.costoNeto*noc).toFixed(1)}K
`;
  csv += `"Model","Heston (2nd order approx.)"
`;

  // Forward
  const fwdRes = Models.forwardPrice(S, r, q, T);
  csv += isEn ? "
FORWARD
" : "
FORWARD
";
  csv += `"Spot",$${S.toFixed(4)}
`;
  csv += `"${isEn?"Forward Price":"Precio forward"}",$${fwdRes.forward.toFixed(4)}
`;
  csv += `"${isEn?"Swap Points":"Puntos swap"}",$${fwdRes.puntosSwap.toFixed(4)}
`;
  csv += `"${isEn?"Rate Differential (TIIE-SOFR)":"Diferencial tasas (TIIE-SOFR)"}","${((r-q)*100).toFixed(2)}%"
`;
  csv += `"${isEn?"Premium":"Prima"}","${isEn?"Zero":"Cero"}"
`;

  // Put
  const putStrike = parseFloat(document.getElementById("fx-put-strike")?.value || S*0.97);
  const putVol    = parseFloat(document.getElementById("fx-put-vol")?.value    || 12) / 100;
  const putRes    = Models.heston("put", S, putStrike, T, r, q,
    Models.PARAMS.fx_usdmxn.v0, Models.PARAMS.fx_usdmxn.kappa,
    Models.PARAMS.fx_usdmxn.theta_v, Models.PARAMS.fx_usdmxn.xi, Models.PARAMS.fx_usdmxn.rho_sv);
  csv += isEn ? "
PUT OPTION (HESTON)
" : "
OPCIÓN PUT (HESTON)
";
  csv += `"Spot",$${S.toFixed(4)}
`;
  csv += `"Strike",$${putStrike.toFixed(4)}
`;
  csv += `"${isEn?"Premium":"Prima"}","$${putRes.precio.toFixed(6)}/USD"
`;
  csv += `"${isEn?"Total Premium":"Prima total"}","USD ${(putRes.precio*noc).toFixed(1)}K"
`;
  csv += `"Delta","${putRes.delta.toFixed(6)}"
`;
  csv += `"Gamma","${putRes.gamma.toFixed(8)}"
`;
  csv += `"Vega (per 1% vol)","${putRes.vega.toFixed(6)}"
`;
  csv += `"${isEn?"Moneyness":"Moneyness"}","${putRes.itm ? "ITM" : "OTM"}"
`;

  // KO Forward
  const koS  = parseFloat(document.getElementById("fx-ko-spot")?.value    || S);
  const koK  = parseFloat(document.getElementById("fx-ko-strike")?.value  || S*0.99);
  const koH  = parseFloat(document.getElementById("fx-ko-barrera")?.value || S*1.08);
  const koVol = parseFloat(document.getElementById("fx-ko-vol")?.value    || 12) / 100;
  const vanilla = Models.forwardPrice(koS, r, q, T).forward;
  csv += isEn ? "
KNOCK-OUT FORWARD
" : "
FORWARD KNOCK-OUT
";
  csv += `"Spot",$${koS.toFixed(4)}
`;
  csv += `"Strike (KO)",$${koK.toFixed(4)}
`;
  csv += `"${isEn?"KO Barrier":"Barrera KO"}",$${koH.toFixed(4)}
`;
  csv += `"${isEn?"Plain Forward (ref)":"Forward normal (ref)"}",$${vanilla.toFixed(4)}
`;
  csv += `"${isEn?"Improvement vs Forward":"Mejora vs Forward"}","${((vanilla-koK)/vanilla*100).toFixed(2)}%"
`;
  csv += `"Model","Reiner-Rubinstein"
`;

  // Seagull
  const sgK1 = parseFloat(document.getElementById("fx-sg-K1")?.value || S*0.97);
  const sgK2 = parseFloat(document.getElementById("fx-sg-K2")?.value || S*1.06);
  const sgK3 = parseFloat(document.getElementById("fx-sg-K3")?.value || S*0.90);
  const sgV  = parseFloat(document.getElementById("fx-sg-vol")?.value || 12) / 100;
  const sgRes = Models.seagull(S, sgK1, sgK2, sgK3, T, r, q, sgV, true, Models.PARAMS.fx_usdmxn);
  csv += isEn ? "
SEAGULL
" : "
SEAGULL
";
  csv += `"Spot",$${S.toFixed(4)}
`;
  csv += `"K1 (floor put)",$${sgK1.toFixed(4)}
`;
  csv += `"K2 (cap call)",$${sgK2.toFixed(4)}
`;
  csv += `"K3 (sold put)",$${sgK3.toFixed(4)}
`;
  csv += `"${isEn?"Put K1 Premium":"Prima put K1"}","$${sgRes.putK1.precio.toFixed(6)}"
`;
  csv += `"${isEn?"Call K2 Premium (rcvd)":"Prima call K2 (recib.)"}","-$${sgRes.callK2.precio.toFixed(6)}"
`;
  csv += `"${isEn?"Put K3 Premium (rcvd)":"Prima put K3 (recib.)"}","-$${sgRes.putK3.precio.toFixed(6)}"
`;
  csv += `"${isEn?"Net Cost":"Costo neto"}","$${sgRes.costoNeto.toFixed(6)}/USD"
`;
  csv += `"${isEn?"Costless?":"¿Costless?"}","${sgRes.esCostless ? "Yes/Sí" : "No"}"
`;

  // Strangle
  const stKput  = parseFloat(document.getElementById("fx-st-Kput")?.value  || S*0.93);
  const stKcall = parseFloat(document.getElementById("fx-st-Kcall")?.value || S*1.07);
  const stVol   = parseFloat(document.getElementById("fx-st-vol")?.value   || 12) / 100;
  const stRes   = Models.strangle(S, stKput, stKcall, T, r, stVol, q, true, Models.PARAMS.fx_usdmxn);
  csv += isEn ? "
STRANGLE
" : "
STRANGLE
";
  csv += `"Spot",$${S.toFixed(4)}
`;
  csv += `"K put OTM",$${stKput.toFixed(4)}
`;
  csv += `"K call OTM",$${stKcall.toFixed(4)}
`;
  csv += `"${isEn?"Put Premium":"Prima put"}","$${stRes.put.precio.toFixed(6)}/USD"
`;
  csv += `"${isEn?"Call Premium":"Prima call"}","$${stRes.call.precio.toFixed(6)}/USD"
`;
  csv += `"${isEn?"Total Cost":"Costo total"}","$${stRes.costTotal.toFixed(6)}/USD"
`;
  csv += `"${isEn?"Break-even Down":"Break-even baja"}","$${stRes.bepAbajo.toFixed(4)}"
`;
  csv += `"${isEn?"Break-even Up":"Break-even alza"}","$${stRes.bepArriba.toFixed(4)}"
`;

  // ── Hoja 3: Payoff por escenario ──
  csv += isEn ? "

PAYOFF BY SCENARIO (USD thousands, notional = USD 10M)
"
              : "

PAYOFF POR ESCENARIO (USD miles, nocional = USD 10M)
";
  csv += isEn ? "Instrument,Base ($"+esc.base.usdmxn.toFixed(2)+"),Optimistic ($"+esc.optimista.usdmxn.toFixed(2)+"),Adverse ($"+esc.adverso.usdmxn.toFixed(2)+")
"
              : "Instrumento,Base ($"+esc.base.usdmxn.toFixed(2)+"),Optimista ($"+esc.optimista.usdmxn.toFixed(2)+"),Adverso ($"+esc.adverso.usdmxn.toFixed(2)+")
";

  const fmt2 = (v) => (v/1000).toFixed(2);
  const sinCobFn = (tc) => tc * noc;
  const fwdFn    = (tc) => sinCobFn(tc) + Models.forwardPayoff(tc, fwdRes.forward, noc).ganancia;
  const colFn    = (tc) => sinCobFn(tc) + Models.collarPayoff(tc, collarFloor, collarCap, noc).payoffCollar;
  const putFn    = (tc) => sinCobFn(tc) + Math.max(putStrike - tc, 0)*noc - putRes.precio*noc;
  const koFn     = (tc) => tc >= koH ? sinCobFn(tc) : sinCobFn(tc) + (koK - tc)*noc;
  const sgFn     = (tc) => sinCobFn(tc) + sgRes.payoff(tc)*noc - sgRes.costoNeto*noc;
  const stFn     = (tc) => sinCobFn(tc) + stRes.payoff(tc)*noc;

  const scenarios = [esc.base.usdmxn, esc.optimista.usdmxn, esc.adverso.usdmxn];
  const instruments = [
    { label: isEn?"Unhedged":"Sin cobertura",           fn: sinCobFn },
    { label: `Forward $${fwdRes.forward.toFixed(2)}`,   fn: fwdFn    },
    { label: `Collar $${collarFloor.toFixed(2)}-$${collarCap.toFixed(2)}`, fn: colFn },
    { label: `Put $${putStrike.toFixed(2)}`,            fn: putFn    },
    { label: `KO Fwd (barrera $${koH.toFixed(2)})`,    fn: koFn     },
    { label: "Seagull",                                  fn: sgFn     },
    { label: "Strangle",                                 fn: stFn     },
  ];

  instruments.forEach(ins => {
    csv += `"${ins.label}",${scenarios.map(tc => fmt2(ins.fn(tc))).join(",")}
`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `autlan-fx-hedging-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(isEn ? "FX model exported" : "Modelo FX exportado", "success");
};

// Lazy render
Scenarios.on("page:fx", () => {
  const el = document.getElementById("fx-content");
  if (el) renderFX();
});
