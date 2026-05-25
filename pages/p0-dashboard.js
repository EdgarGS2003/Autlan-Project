/**
 * pages/p0-dashboard.js — Dashboard Ejecutivo
 * Autlán Risk Calculator
 *
 * Muestra en tiempo real:
 *  - KPIs financieros clave
 *  - Estado de cobertura por riesgo
 *  - Tabla de escenarios base/optimista/adverso
 *  - Alertas críticas de exposición
 */

function renderDashboard() {
  const el = document.getElementById("dashboard-content");
  if (!el) return;

  el.innerHTML = _dashboardHTML();
  _dashboardBindEvents();
  _dashboardUpdate();

  // Suscribirse a cambios en tiempo real
  Scenarios.on("calc:update",       _dashboardUpdate);
  Scenarios.on("escenarios:update", _dashboardUpdateEscenarios);
  Scenarios.on("coberturas:change", _dashboardUpdateCobertura);
}

// ─────────────────────────────────────────
// HTML ESTÁTICO (estructura)
// ─────────────────────────────────────────
function _dashboardHTML() {
  return `

  <!-- ALERTAS CRÍTICAS -->
  <div id="dash-alerts"></div>

  <!-- KPIs FILA 1 — Financieros -->
  <div class="grid-4 mb-24" id="dash-kpis-fin"></div>

  <!-- KPIs FILA 2 — Estado de cobertura -->
  <div class="section-title">Estado de cobertura · Al 31 mar 2026</div>
  <div class="grid-4 mb-24" id="dash-kpis-cob"></div>

  <!-- TABLA DE ESCENARIOS -->
  <div class="section-title">Impacto financiero por escenario</div>
  <div class="scenario-table-wrap mb-24">
    <table class="scenario-table">
      <thead>
        <tr>
          <th>Variable / Resultado</th>
          <th class="esc-header-base">Base</th>
          <th class="esc-header-opt">Optimista</th>
          <th class="esc-header-adv">Adverso</th>
        </tr>
      </thead>
      <tbody id="dash-scenario-body"></tbody>
    </table>
  </div>

  <!-- FILA INFERIOR — Deuda + Política -->
  <div class="grid-2">

    <!-- Estructura de deuda -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Estructura de deuda</div>
          <div class="card-sub">USD 185.9M total · 1T26</div>
        </div>
        <span class="badge badge-warn">Deuda/UAFIRDA 4.4x</span>
      </div>
      <div id="dash-deuda"></div>
    </div>

    <!-- Política de cobertura -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Política de cobertura</div>
          <div class="card-sub">Límites formales documentados · XBRL 1T26</div>
        </div>
        <span class="badge badge-accent">Activa</span>
      </div>
      <div id="dash-politica"></div>
    </div>

  </div>
  `;
}

// ─────────────────────────────────────────
// ACTUALIZACIÓN EN TIEMPO REAL
// ─────────────────────────────────────────
function _dashboardUpdate() {
  _renderAlerts();
  _renderKPIsFinancieros();
  _renderKPIsCobertura();
  _renderEscenarios();
  _renderDeuda();
  _renderPolitica();
}

function _dashboardUpdateEscenarios() {
  _renderEscenarios();
}

function _dashboardUpdateCobertura() {
  _renderKPIsCobertura();
  _renderAlerts();
}

// ─────────────────────────────────────────
// ALERTAS CRÍTICAS
// ─────────────────────────────────────────
function _renderAlerts() {
  const el = document.getElementById("dash-alerts");
  if (!el) return;

  const alerts = [];
  const exp    = AUTLAN.derivadosVigentes.exposicionVsCobertura;

  // Alert 1 — gap FX crítico
  alerts.push({
    tipo: "danger",
    icono: "⚠",
    texto: `Cobertura FX activa: solo <strong>${exp.pctCubierto_FX.valor}%</strong> de exposición cubierta 
            vs límite de política de <strong>60%</strong>. 
            Gap de <strong>${exp.gapCobertura_FX.valor} pp</strong> sin protección 
            sobre ~USD ${(exp.ingresosFX_anualizado.valor/1000).toFixed(0)}M de ingresos anualizados.`,
  });

  // Alert 2 — oro sin cobertura en máximos
  alerts.push({
    tipo: "warn",
    icono: "🥇",
    texto: `Precio del oro en máximos históricos (~USD ${AUTLAN.mercado.precioOro.valor}/oz) 
            y <strong>sin cobertura activa</strong>. Metallorum duplicó producción en 1T26 — 
            exposición al downside sin protección.`,
  });

  // Alert 3 — collar TIIE fuera del dinero
  const collar = AUTLAN.derivadosVigentes.collarTasa;
  alerts.push({
    tipo: "warn",
    icono: "📈",
    texto: `Collar TIIE (floor ${collar.floor}% / cap ${collar.cap}%) fuera del dinero — 
            TIIE actual <strong>${collar.tiieActual}%</strong> está por debajo del floor. 
            Empresa paga prima sin beneficio. Pérdida acumulada: 
            <strong>USD ${collar.mtm.perdidaAcum.valor}K</strong>.`,
  });

  // Alert 4 — gas sin cobertura
  alerts.push({
    tipo: "info",
    icono: "⚡",
    texto: `Gas natural <strong>sin cobertura activa</strong>. 
            Smelting es energía-intensivo — cada USD 1/MMBtu de alza 
            impacta costos operativos ~USD 2-3M.`,
  });

  el.innerHTML = alerts.map(a => `
    <div class="alert alert-${a.tipo} mb-16" style="margin-bottom:10px;">
      <span class="alert-icon">${a.icono}</span>
      <span>${a.texto}</span>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// KPIs FINANCIEROS
// ─────────────────────────────────────────
function _renderKPIsFinancieros() {
  const el = document.getElementById("dash-kpis-fin");
  if (!el) return;

  const r    = AUTLAN.resultados;
  const b    = AUTLAN.balance;
  const cache = Scenarios.getCache();
  const actual = cache.actual;

  // EBITDA proyectado con variables actuales
  const ebitdaProyectado = actual
    ? actual.resultados.ebitda
    : AUTLAN.resultados.anual2025.ebitda.valor;

  const margen = actual
    ? parseFloat(actual.resultados.margenEbitda)
    : AUTLAN.resultados.anual2025.margenEbitda.valor;

  const kpis = [
    {
      label:   "Ingresos 1T26 (anualiz.)",
      value:   `USD ${(r.t1_2026.ingresos.valor * 4 / 1000).toFixed(0)}M`,
      sub:     `1T26: USD ${(r.t1_2026.ingresos.valor/1000).toFixed(1)}M · +${r.t1_2026.variacion_yoy.valor.toFixed(1)}% YoY`,
      tipo:    "success",
      delta:   "+23% vs 1T25",
      deltaDir: "up",
    },
    {
      label:   "EBITDA proyectado",
      value:   `USD ${(ebitdaProyectado/1000).toFixed(1)}M`,
      sub:     `Margen: ${margen}% · Base: USD 31.5M (2025)`,
      tipo:    ebitdaProyectado > 25000 ? "success"
             : ebitdaProyectado > 0    ? "warn"
             : "danger",
      delta:   `${margen}% margen`,
      deltaDir: margen > 10 ? "up" : "down",
    },
    {
      label:   "Deuda neta",
      value:   `USD ${(b.metricas.deudaNeta.valor/1000).toFixed(1)}M`,
      sub:     `Total: USD ${(b.metricas.deudaTotal.valor/1000).toFixed(1)}M · Efect: USD ${(b.activos.efectivo.valor/1000).toFixed(1)}M`,
      tipo:    "warn",
      delta:   `Leverage ${b.metricas.leverage.valor.toFixed(0)}%`,
      deltaDir: "down",
    },
    {
      label:   "DSCR proyectado",
      value:   `${AUTLAN.meta.dscr_proyectado.valor}x`,
      sub:     `HR Ratings · Proyección 2026-2028`,
      tipo:    "danger",
      delta:   "Bajo 1.0x",
      deltaDir: "down",
    },
  ];

  el.innerHTML = kpis.map(k => `
    <div class="kpi-card ${k.tipo}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="flex-between mt-4">
        <span class="kpi-sub">${k.sub}</span>
        <span class="kpi-delta ${k.deltaDir}">${k.delta}</span>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// KPIs DE COBERTURA
// ─────────────────────────────────────────
function _renderKPIsCobertura() {
  const el  = document.getElementById("dash-kpis-cob");
  if (!el) return;

  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;
  const col = AUTLAN.derivadosVigentes.collarTasa;

  const items = [
    {
      label:    "Cobertura FX",
      value:    `${exp.pctCubierto_FX.valor}%`,
      sub:      `de ${exp.limitePolítica_FX.valor}% permitido · 4 collares activos`,
      tipo:     "danger",
      tag:      "CRÍTICO",
      tagClass: "badge-danger",
      nav:      "fx",
    },
    {
      label:    "Cobertura Oro",
      value:    "0%",
      sub:      "Sin instrumento activo · Precio USD 3,000+/oz",
      tipo:     "danger",
      tag:      "SIN COBERTURA",
      tagClass: "badge-danger",
      nav:      "oro",
    },
    {
      label:    "Cobertura Gas",
      value:    "0%",
      sub:      "Sin instrumento activo · Exposición total",
      tipo:     "danger",
      tag:      "SIN COBERTURA",
      tagClass: "badge-danger",
      nav:      "gas",
    },
    {
      label:    "Collar TIIE",
      value:    `${col.nocionalPct}%`,
      sub:      `Floor ${col.floor}% / Cap ${col.cap}% · Vence jun-2028`,
      tipo:     "warn",
      tag:      "FUERA DINERO",
      tagClass: "badge-warn",
      nav:      "tasa",
    },
  ];

  el.innerHTML = items.map(k => `
    <div class="kpi-card ${k.tipo}" style="cursor:pointer;"
         onclick="document.querySelector('[data-page=${k.nav}]').click()">
      <div class="flex-between mb-16">
        <div class="kpi-label">${k.label}</div>
        <span class="badge ${k.tagClass}">${k.tag}</span>
      </div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub mt-4">${k.sub}</div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// TABLA DE ESCENARIOS
// ─────────────────────────────────────────
function _renderEscenarios() {
  const el = document.getElementById("dash-scenario-body");
  if (!el) return;

  const cache = Scenarios.getCache();
  if (!cache.escenarios) return;

  const B = cache.escenarios.base;
  const O = cache.escenarios.optimista;
  const A = cache.escenarios.adverso;

  const vars = Scenarios.SLIDER_CONFIG;
  const esc  = Scenarios.getState().escenarios;
  const fmt  = Scenarios.fmt;

  const filas = [
    // Variables macro
    {
      label: "USD / MXN",
      base:  fmt.fx(esc.base.usdmxn),
      opt:   fmt.fx(esc.optimista.usdmxn),
      adv:   fmt.fx(esc.adverso.usdmxn),
      mono:  true,
    },
    {
      label: "Precio Manganeso",
      base:  fmt.mn(esc.base.precioMn),
      opt:   fmt.mn(esc.optimista.precioMn),
      adv:   fmt.mn(esc.adverso.precioMn),
      mono:  true,
    },
    {
      label: "Precio Oro",
      base:  fmt.oro(esc.base.precioOro),
      opt:   fmt.oro(esc.optimista.precioOro),
      adv:   fmt.oro(esc.adverso.precioOro),
      mono:  true,
    },
    {
      label: "TIIE 28d",
      base:  fmt.tasa(esc.base.tiie28),
      opt:   fmt.tasa(esc.optimista.tiie28),
      adv:   fmt.tasa(esc.adverso.tiie28),
      mono:  true,
    },
    {
      label: "SOFR 1m",
      base:  fmt.tasa(esc.base.sofr1m),
      opt:   fmt.tasa(esc.optimista.sofr1m),
      adv:   fmt.tasa(esc.adverso.sofr1m),
      mono:  true,
    },
    { divider: true },
    // Resultados financieros
    {
      label:     "EBITDA proyectado",
      base:      fmt.usd(B.resultados.ebitda),
      opt:       fmt.usd(O.resultados.ebitda),
      adv:       fmt.usd(A.resultados.ebitda),
      highlight: true,
      mono:      true,
      baseClass: B.resultados.ebitda > 0 ? "positive" : "negative",
      optClass:  O.resultados.ebitda > 0 ? "positive" : "negative",
      advClass:  A.resultados.ebitda > 0 ? "positive" : "negative",
    },
    {
      label:    "Margen EBITDA",
      base:     `${B.resultados.margenEbitda}%`,
      opt:      `${O.resultados.margenEbitda}%`,
      adv:      `${A.resultados.margenEbitda}%`,
      mono:     true,
    },
    {
      label:     "FCF proyectado",
      base:      fmt.usd(B.resultados.fcf),
      opt:       fmt.usd(O.resultados.fcf),
      adv:       fmt.usd(A.resultados.fcf),
      highlight: true,
      mono:      true,
      baseClass: B.resultados.fcf > 0 ? "positive" : "negative",
      optClass:  O.resultados.fcf > 0 ? "positive" : "negative",
      advClass:  A.resultados.fcf > 0 ? "positive" : "negative",
    },
    {
      label:    "DSCR estimado",
      base:     B.resultados.dscr.toFixed(2) + "x",
      opt:      O.resultados.dscr.toFixed(2) + "x",
      adv:      A.resultados.dscr.toFixed(2) + "x",
      mono:     true,
      baseClass: B.resultados.dscr >= 1 ? "positive" : "negative",
      optClass:  O.resultados.dscr >= 1 ? "positive" : "negative",
      advClass:  A.resultados.dscr >= 1 ? "positive" : "negative",
    },
    { divider: true },
    // Impactos por driver
    {
      label: "Impacto FX",
      base:  fmt.usd(B.impactos.fx),
      opt:   fmt.usd(O.impactos.fx),
      adv:   fmt.usd(A.impactos.fx),
      mono:  true,
      baseClass: B.impactos.fx >= 0 ? "positive" : "negative",
      optClass:  O.impactos.fx >= 0 ? "positive" : "negative",
      advClass:  A.impactos.fx >= 0 ? "positive" : "negative",
    },
    {
      label: "Impacto Manganeso",
      base:  fmt.usd(B.impactos.mn),
      opt:   fmt.usd(O.impactos.mn),
      adv:   fmt.usd(A.impactos.mn),
      mono:  true,
      baseClass: B.impactos.mn >= 0 ? "positive" : "negative",
      optClass:  O.impactos.mn >= 0 ? "positive" : "negative",
      advClass:  A.impactos.mn >= 0 ? "positive" : "negative",
    },
    {
      label: "Impacto Tasa (TIIE+SOFR)",
      base:  fmt.usd(B.impactos.tiie + B.impactos.sofr),
      opt:   fmt.usd(O.impactos.tiie + O.impactos.sofr),
      adv:   fmt.usd(A.impactos.tiie + A.impactos.sofr),
      mono:  true,
      baseClass: (B.impactos.tiie + B.impactos.sofr) >= 0 ? "positive" : "negative",
      optClass:  (O.impactos.tiie + O.impactos.sofr) >= 0 ? "positive" : "negative",
      advClass:  (A.impactos.tiie + A.impactos.sofr) >= 0 ? "positive" : "negative",
    },
  ];

  el.innerHTML = filas.map(f => {
    if (f.divider) return `
      <tr>
        <td colspan="4" style="padding:4px 0; background:var(--bg-raised);">
          <div style="height:1px; background:var(--border);"></div>
        </td>
      </tr>`;

    return `
      <tr class="${f.highlight ? "row-highlight" : ""}">
        <td style="font-weight:${f.highlight ? "700" : "400"};">
          ${f.label}
        </td>
        <td class="esc-base  ${f.mono ? "mono" : ""} ${f.baseClass || ""}">
          ${f.base}
        </td>
        <td class="esc-optimista ${f.mono ? "mono" : ""} ${f.optClass || ""}">
          ${f.opt}
        </td>
        <td class="esc-adverso ${f.mono ? "mono" : ""} ${f.advClass || ""}">
          ${f.adv}
        </td>
      </tr>`;
  }).join("");
}

// ─────────────────────────────────────────
// DEUDA
// ─────────────────────────────────────────
function _renderDeuda() {
  const el = document.getElementById("dash-deuda");
  if (!el) return;

  const resumen = AUTLAN.deuda.resumenTasa;
  const total   = resumen.total.saldo;

  const barras = [
    { label: "SOFR + spread (USD)",  saldo: resumen.sofr_usd.saldo,
      pct: resumen.sofr_usd.pct,    color: "var(--danger-mid)",
      nota: "SOFR + 5.5-6.0%" },
    { label: "TIIE + spread (MXN)",  saldo: resumen.tiie_mxn.saldo,
      pct: resumen.tiie_mxn.pct,    color: "var(--warn-mid)",
      nota: "TIIE + 4.0-5.5%" },
    { label: "EURIBOR (EUR)",        saldo: resumen.euribor_eur.saldo,
      pct: resumen.euribor_eur.pct,  color: "var(--accent-mid)",
      nota: "EURIBOR + 0.4-1.9%" },
    { label: "Tasa fija",            saldo: resumen.fija.saldo,
      pct: resumen.fija.pct,        color: "var(--success-mid)",
      nota: "7.9% fija" },
    { label: "Arrendamientos",       saldo: resumen.arrendamientos.saldo,
      pct: resumen.arrendamientos.pct, color: "var(--text-muted)",
      nota: "Leasing" },
  ];

  el.innerHTML = `
    <!-- Barra de composición -->
    <div style="height:10px; border-radius:5px; overflow:hidden;
                display:flex; margin-bottom:16px; gap:2px;">
      ${barras.map(b => `
        <div style="width:${b.pct}%; background:${b.color};
                    border-radius:3px;" title="${b.label}: ${b.pct}%">
        </div>`).join("")}
    </div>

    <!-- Detalle -->
    ${barras.map(b => `
      <div class="flex-between" style="margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:10px; height:10px; border-radius:2px;
                      background:${b.color}; flex-shrink:0;"></div>
          <div>
            <div style="font-size:12px; font-weight:500;">${b.label}</div>
            <div style="font-size:10.5px; color:var(--text-muted);">${b.nota}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="text-mono" style="font-size:12px; font-weight:600;">
            USD ${(b.saldo/1000).toFixed(1)}M
          </div>
          <div style="font-size:10px; color:var(--text-muted);">
            ${b.pct.toFixed(1)}%
          </div>
        </div>
      </div>`).join("")}

    <div class="divider"></div>
    <div class="flex-between">
      <span style="font-size:12px; font-weight:600;">Total deuda</span>
      <span class="text-mono" style="font-size:13px; font-weight:700;">
        USD ${(total/1000).toFixed(1)}M
      </span>
    </div>
    <div style="font-size:10.5px; color:var(--text-muted); margin-top:4px;">
      ${(resumen.sofr_usd.pct + resumen.tiie_mxn.pct + resumen.euribor_eur.pct).toFixed(1)}% 
      deuda a tasa variable · Solo ${(resumen.fija.pct).toFixed(1)}% tasa fija
    </div>
  `;
}

// ─────────────────────────────────────────
// POLÍTICA DE COBERTURA
// ─────────────────────────────────────────
function _renderPolitica() {
  const el = document.getElementById("dash-politica");
  if (!el) return;

  const pol = AUTLAN.politicaCobertura;
  const exp = AUTLAN.derivadosVigentes.exposicionVsCobertura;

  const items = [
    {
      riesgo:    "Tipo de cambio (FX)",
      limite:    `Hasta ${pol.fx.limiteNocional.valor}% ingresos USD`,
      horizonte: `Máx ${pol.fx.horizonteMax.valor} meses`,
      actual:    `${exp.pctCubierto_FX.valor}% cubierto`,
      clase:     "danger",
      instrum:   pol.fx.instrumentos.join(", "),
    },
    {
      riesgo:    "Tasa de interés",
      limite:    "50% deuda variable (práctica)",
      horizonte: "Largo plazo",
      actual:    `${exp.pctCubierto_tasa.valor.toFixed(1)}% cubierto`,
      clase:     "warn",
      instrum:   pol.tasa.instrumentos.join(", "),
    },
    {
      riesgo:    "Precio del Oro",
      limite:    `Hasta ${pol.oro.limiteNocional.valor}% producción`,
      horizonte: "Flexible",
      actual:    "0% — Sin cobertura",
      clase:     "danger",
      instrum:   pol.oro.instrumentos.join(", "),
    },
    {
      riesgo:    "Gas natural",
      limite:    `Hasta ${pol.gas.limiteNocional.valor}% consumo`,
      horizonte: "Corto plazo",
      actual:    "0% — Sin cobertura",
      clase:     "danger",
      instrum:   pol.gas.instrumentos.join(", "),
    },
  ];

  el.innerHTML = `
    ${items.map(i => `
      <div style="margin-bottom:14px; padding-bottom:14px;
                  border-bottom:1px solid var(--border);">
        <div class="flex-between mb-16" style="margin-bottom:6px;">
          <span style="font-size:12.5px; font-weight:600;">${i.riesgo}</span>
          <span class="badge badge-${i.clase}">${i.actual}</span>
        </div>
        <div style="font-size:11px; color:var(--text-muted);">
          Límite: ${i.limite} · ${i.horizonte}
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
          Instrumentos: ${i.instrum}
        </div>
      </div>`).join("")}

    <div style="font-size:11px; color:var(--text-muted);
                padding:10px; background:var(--bg-raised);
                border-radius:var(--radius-md);">
      ⚖ Objetivo exclusivo de cobertura — no especulación.
      Contrapartes de alta calidad crediticia. Mercados OTC/extrabursátiles.
      Tratamiento contable IFRS 9 — cobertura de flujo de efectivo.
    </div>
  `;
}

// ─────────────────────────────────────────
// BIND EVENTS
// ─────────────────────────────────────────
function _dashboardBindEvents() {
  // Navegación desde pills de escenario
  Scenarios.on("escenario:seleccionado", ({ nombre }) => {
    _renderEscenarios();
  });
}
