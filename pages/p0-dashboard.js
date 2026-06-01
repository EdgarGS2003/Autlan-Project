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
  <div class="flex-between mb-8" style="align-items:flex-end;">
    <div class="section-title" style="margin-bottom:0;">Impacto financiero por escenario</div>
    <div style="font-size:10px; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
      <span>Metodología probabilidades:</span>
      <span class="dash-tooltip-wrap">
        <span class="dash-tooltip-icon">ⓘ</span>
        <span class="dash-tooltip-box" style="right:0; left:auto; width:320px;">
          <strong>Matriz de riesgo — Construcción de probabilidades</strong><br><br>
          Distribución general: Base 55% · Optimista 20% · Adverso 25%<br><br>
          Sesgo adverso justificado por: (1) DSCR proyectado 0.6x (HR Ratings, dic-2025), (2) USMCA riesgo binario julio 2026, (3) gap de cobertura FX 57pp sin protección.<br><br>
          Ajustes por variable:<br>
          • FX: mayor prob. adversa (30%) por riesgo USMCA + nearshoring<br>
          • Oro: mayor prob. optimista (35%) por rol contra-cíclico y bancos centrales compradores<br>
          • TIIE: mayor prob. base (55%) por ciclo Banxico bien comunicado<br><br>
          Fuente: Análisis Macro Autlán · Tec de Monterrey, Adm. Financiera Internacional, may-2026.
        </span>
      </span>
    </div>
  </div>
  <div class="scenario-table-wrap mb-24">
    <table class="scenario-table">
      <thead>
        <tr>
          <th style="min-width:160px;">Variable / Resultado <span style="font-weight:400; font-size:10px; opacity:0.7;">· ⓘ = justificación</span></th>
          <th class="esc-header-base">Base<br><span style="font-weight:400; font-size:10px;">~55% prob.</span></th>
          <th class="esc-header-opt">Optimista<br><span style="font-weight:400; font-size:10px;">~20% prob.</span></th>
          <th class="esc-header-adv">Adverso<br><span style="font-weight:400; font-size:10px;">~25% prob.</span></th>
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
        <span class="badge badge-warn">DSCR 0.6x</span>
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

  const esc = Scenarios.getState().escenarios;
  const fmt = Scenarios.fmt;

  // ─────────────────────────────────────────────────────────────
  // MATRIZ DE RIESGO / PROBABILIDAD
  // Metodología: probabilidades subjetivas calibradas con:
  //   (1) Ciclo monetario Banxico (13 recortes desde 2024, terminal 6.50%)
  //   (2) Precio Mn en máximo 17 meses (Q1 2026) — recuperación frágil
  //   (3) DXY ~99 debilitándose — soporte parcial para peso
  //   (4) Análisis macro Tec de Monterrey (May 2026) — grupo 302
  // Distribución: base=55%, optimista=20%, adverso=25% (sesgada por DSCR 0.6x y USMCA jul-2026)
  // ─────────────────────────────────────────────────────────────
  const PROB = {
    usdmxn:   { base: { p: 50, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 30, lbl: "Media-Alta" } },
    precioMn:  { base: { p: 55, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 25, lbl: "Media" }     },
    precioOro: { base: { p: 45, lbl: "Media" },  opt: { p: 35, lbl: "Media" },  adv: { p: 20, lbl: "Baja" }      },
    tiie28:    { base: { p: 55, lbl: "Alta" },   opt: { p: 25, lbl: "Media" },  adv: { p: 20, lbl: "Baja" }      },
    sofr1m:    { base: { p: 50, lbl: "Media" },  opt: { p: 25, lbl: "Media" },  adv: { p: 25, lbl: "Media" }     },
    // Resultados — probabilidad heredada de la combinación de drivers
    ebitda:    { base: { p: 55, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 25, lbl: "Media" }     },
    fcf:       { base: { p: 50, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 30, lbl: "Media-Alta" } },
    dscr:      { base: { p: 55, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 25, lbl: "Media" }     },
    impFX:     { base: { p: 50, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 30, lbl: "Media-Alta" } },
    impMn:     { base: { p: 55, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 25, lbl: "Media" }     },
    impTasa:   { base: { p: 55, lbl: "Alta" },   opt: { p: 25, lbl: "Media" },  adv: { p: 20, lbl: "Baja" }      },
    margen:    { base: { p: 55, lbl: "Media" },  opt: { p: 20, lbl: "Baja" },   adv: { p: 25, lbl: "Media" }     },
  };

  // ─────────────────────────────────────────────────────────────
  // JUSTIFICACIONES — variables independientes (macro)
  // Fuente: Análisis Macro Autlán · Tec de Monterrey · May 2026
  // ─────────────────────────────────────────────────────────────
  const JUST_MACRO = {
    usdmxn: {
      base: "Peso estable post-ciclo de recortes Banxico. DXY ~99 con tendencia bajista modera apreciación. Nearshoring sostiene flujos. Rango macro: $17.5–18.5 (análisis macro, may-2026). Probabilidad base elevada por ancla institucional de Banxico y diferencial TIIE–SOFR positivo (~2.8pp).",
      opt:  "Peso se deprecia por Fed hawkish o shock geopolítico. DXY sube a 103+, capital sale de EM. Beneficia ingresos Autlán: cada $1 MXN de depreciación = ~+USD 18M en ingresos equivalentes. Prob. baja (20%) pues consenso espera estabilidad en 2026.",
      adv:  "Apreciación fuerte del peso. Nearshoring acelera flujos USD→MXN. DXY cae a 90. Caso adverso: peso <$16.5 comprime EBITDA ~8–12% por estructura de costos MXN vs ingresos USD. DSCR <0.5x. Mayor riesgo binario: resultado USMCA julio 2026.",
    },
    precioMn: {
      base: "Precio Mn en máximo 17 meses en Q1 2026 (~USD 1,309/MT). Recuperación frágil: China restocking moderado + India +6.3% acero. Rango base USD 1,200–1,400/MT (Análisis macro, IMARC 2026). Probabilidad mayor al promedio por soporte de inventarios bajos.",
      opt:  "China stimulus fiscal fuerte o ban Gabón adelanta efectos (2029). Australia retrasa producción. India acero supera +8%. Precio >USD 1,450/MT abre margen operativo significativo. Prob. baja (20%): requiere catalizador chino que no está en el escenario base.",
      adv:  "China decepción de demanda + oversupply australiano + dumping asiático en México. Precio colapsa a USD 850–1,100/MT. Impacto directo: –USD 30–50M en ingresos Autlán. FCF profundamente negativo. Acero global contrae. AHMSA sigue inactiva.",
    },
    precioOro: {
      base: "Oro en máximos históricos (~USD 3,000/oz) en may-2026. Corrección moderada esperada por DXY recuperación parcial. Demanda bancos centrales sostiene piso. Metallorum duplicó producción 1T26. Rango base USD 2,750–3,100. Prob. media pues oro en zona de máximos históricos tiende a corregir.",
      opt:  "Risk-off global intensifica (USMCA breakdown, tensiones geopolíticas). Bancos centrales aceleran compras. Fed dovish debilita USD. Oro >USD 3,300 amplifica ingresos Metallorum — segmento contra-cíclico al acero. Prob. media-alta (35%): correlación negativa con escenario adverso de ferroaleaciones.",
      adv:  "Fortaleza USD (DXY >105). Fed hawkish sorpresa. ETFs de oro liquidan posiciones. Precio cae a USD 2,200–2,500. Segmento Metallorum pierde su rol de cobertura natural. Prob. baja (20%): requiere reversión simultánea de múltiples soportes estructurales del oro.",
    },
    tiie28: {
      base: "Banxico completó 13 recortes desde 2024; tasa terminal 6.50% para fin de 2026 (Banxico, Q1 2026). TIIE 28d ~7.10% en mar-2026 y en trayectoria bajista. Inflación 4.45% dentro de banda 2–4%. Rango base: 6.90–7.10%. Prob. alta (55%): ciclo de recortes bien comunicado por Banxico.",
      opt:  "Inflación converge a 3.5%, Banxico acelera recortes (3–4 adicionales). TIIE llega a 6.4–6.6% a fin de año. Reduce costo deuda MXN Autlán (~USD 440K por cada –100bps). Prob. media (25%): requiere inflación por debajo del objetivo sostenidamente.",
      adv:  "IPC rebota >5%, Banxico pausa o sube. Shocks externos (FX, energía). TIIE sube a 7.4–7.9%. Aumenta costo financiero MXN ~USD 440K por 100bps adicionales. Riesgo: covenant breach si se combina con caída en ingresos. Prob. baja (20%) pero con impacto alto.",
    },
    sofr1m: {
      base: "Fed con 1–2 recortes en 2026 según consenso de mercado (may-2026). SOFR 1m ~4.30%. Economía USA modera sin recesión. Rango base: 4.0–4.5%. Cada 100bps en SOFR impacta gasto financiero Autlán ~USD 1.35M (sobre USD 135M deuda SOFR). Prob. media (50%).",
      opt:  "Fed recorta agresivamente ante desaceleración USA. Inflación baja rápido. SOFR cae a 3.25–3.75%. Reduce costo deuda principal Autlán ~USD 1.35–2M/año. Positivo para todas las empresas con deuda USD flotante. Prob. media (25%): sujeto a datos de empleo USA.",
      adv:  "Inflación USA persistente (tariff-driven). Fed mantiene o sube. SOFR 4.6–5.2%. Aumenta costo financiero USD ~USD 1.35M por +100bps. Combinado con FX adverso: doble presión sobre DSCR ya en 0.6x. Prob. media (25%): mercados futuros descuentan 1–2 recortes pero hay incertidumbre.",
    },
  };

  // ─────────────────────────────────────────────────────────────
  // JUSTIFICACIONES — resultados (dependientes, con fórmula)
  // ─────────────────────────────────────────────────────────────
  const JUST_RESULT = {
    ebitda: {
      formula: "FÓRMULA: EBITDA = EBITDA_base(USD 31.5M) + ΔFX + ΔMn + ΔOro + ΔTIIE + ΔSOFR + ΔGas + ΔVol",
      base: "Con variables en rango base: FX neutral (+/- USD 5M), Mn recuperación parcial (+USD 2M), tasas ligeramente menores (–USD 0.5M). EBITDA ~USD 30–35M. Margen ~9–11%. Deuda serviceable con apoyo de líneas de crédito.",
      opt:  "FX favorable (+USD 15–20M por depreciación peso) + Mn alcista (+USD 8–12M) + Oro fuerte (+USD 2M). EBITDA puede superar USD 50M. Margen >15%. FCF positivo. DSCR podría superar 1.0x por primera vez desde 2023.",
      adv:  "FX adverso (–USD 25–30M) + Mn colapsa (–USD 30–50M) + tasas suben (–USD 3M). EBITDA <USD 10M o negativo. Margen <5%. FCF profundamente negativo. DSCR <0.4x. Riesgo de covenant breach según HR Ratings (dic-2025).",
    },
    margen: {
      formula: "FÓRMULA: Margen EBITDA = EBITDA_escenario / Ingresos_escenario × 100. Ingresos ajustados por variación en precio Mn (60% base), FX (85% sensible), y Oro.",
      base: "Margen comprimido vs pico histórico ~38% (2022). 2025 cerró en ~9.7% (auditado). Estructura de costos fijos alta en minería/fundición limita recuperación rápida de margen aunque mejore el precio.",
      opt:  "Mejora de precio Mn + depreciación peso expanden margen. Operativo favorable. Economías de escala si volumen doméstico se recupera (+12% con AHMSA partial restart).",
      adv:  "Margen puede colapsar por debajo de 5%. Costos fijos de minería son irrecuperables (sunk). Empresa obligada a exportar más a precios menores para cubrir fijos. Efecto tijera: ingresos caen, costos MXN se mantienen en USD.",
    },
    fcf: {
      formula: "FÓRMULA: FCF = EBITDA_escenario – Gasto_financiero_escenario – CAPEX_mantenimiento(USD 30M). Gasto financiero ajustado por cambios en TIIE y SOFR vs base.",
      base: "FCF negativo o breakeven. Gasto financiero 2025: USD 42.5M (auditado). CAPEX mínimo ~USD 30M. Se requiere EBITDA >USD 72M para FCF positivo — actualmente no alcanzado. Líneas de crédito cubren el gap.",
      opt:  "EBITDA >USD 70M en escenario optimista permite FCF ligeramente positivo. Reducción de deuda inicia. Mejora perfil crediticio para 2027.",
      adv:  "FCF profundamente negativo (–USD 40–60M estimado). Empresa forzada a usar líneas de crédito y diferir CAPEX. Riesgo de aceleración de covenants si ratio deuda/EBITDA supera umbrales del crédito Santander.",
    },
    dscr: {
      formula: "FÓRMULA: DSCR = EBITDA_escenario / Gasto_financiero_escenario. Referencia auditada: HR Ratings proyecta 0.6x para 2026–2028. Un DSCR <1.0x significa que el flujo operativo NO cubre autónomamente el servicio de deuda.",
      base: "DSCR ~0.6–0.8x. Consistente con proyección HR Ratings (dic-2025). Empresa en rating watch negativo (HR A-, Fitch BBB+/mex, PCR A-/M). No hay covenant breach inmediato pero hay presión estructural.",
      opt:  "DSCR podría superar 1.0x si EBITDA >USD 42M y gasto financiero se reduce por recortes de SOFR/TIIE. Trigger para revisión positiva de outlook por calificadoras.",
      adv:  "DSCR <0.4x en escenario adverso combinado. Riesgo de breach en covenants de ratio de apalancamiento. Posible downgrade a grado especulativo. HR Ratings señaló este escenario como riesgo crítico en reporte dic-2025.",
    },
    impFX: {
      formula: "FÓRMULA: ΔFX = Ingresos_base × ΔTC/TC_base × 0.85. Donde 0.85 = 85% de ingresos sensibles a FX; ΔTC = (TC_escenario – 18.0) / 18.0 (base USD/MXN = $18.0).",
      base:  "TC ~$18.0: impacto FX neutro vs base de cálculo. El 85% de ingresos USD son sensibles a FX (costos en MXN). Coberturas actuales (4 collares, ~3% de exposición) no mitigan significativamente.",
      opt:   "TC >$19.5: depreciación del peso genera impacto FX positivo de ~+USD 15–25M. Refleja mayor valor MXN de costos relativos a ingresos USD. Principal driver del escenario optimista.",
      adv:   "TC <$16.0: apreciación del peso genera impacto FX negativo de –USD 20–30M. Principal driver del escenario adverso. Gap de cobertura FX (57pp) deja desprotegida la mayor parte de esta exposición.",
    },
    impMn: {
      formula: "FÓRMULA: ΔMn = Ingresos_base × 0.60 × ΔPrecio/Precio_base. Donde 0.60 = ~60% de ingresos provienen de ferroaleaciones manganeso; precio base = USD 1,309/MT.",
      base:  "Precio Mn ~USD 1,300/MT: impacto marginal vs base. Recuperación frágil ya descontada. Sin upside significativo pero tampoco caída adicional en este escenario.",
      opt:   "Precio Mn >USD 1,600/MT: impacto positivo ~+USD 15–25M en ingresos. Requiere China stimulus o reducción de oferta global. Ban Gabón (2029) podría anticipar efectos.",
      adv:   "Precio Mn <USD 900/MT: impacto negativo –USD 25–40M. Dumping asiático + débil demanda china + AHMSA inactiva = peor combinación para Autlán. Mayor riesgo individual de la empresa.",
    },
    impTasa: {
      formula: "FÓRMULA: ΔTIIE = –USD 29.7M × (TIIE_esc – 7.10%)/100 | ΔSOFR = –USD 135.5M × (SOFR_esc – 4.30%)/100. Impacto total = ΔTIIE + ΔSOFR. Deuda TIIE: USD 29.7M equiv. | Deuda SOFR: USD 135.5M.",
      base:  "Tasas ligeramente a la baja: ahorro neto ~USD 0.5–2M vs 2025. Collar TIIE (floor 8.75%/cap 11%) fuera del dinero (TIIE ~7.1%) — empresa paga tasa de mercado sin beneficio del instrumento. Pérdida acumulada USD 45.6K.",
      opt:   "Banxico + Fed recortan agresivamente: ahorro financiero ~USD 2–4M anuales. Reduce presión sobre DSCR. Parcialmente compensado por collar TIIE OTM que no genera beneficio incluso con recortes adicionales.",
      adv:   "Tasas suben: costo adicional ~USD 3–5M anuales (combinado TIIE+SOFR). Se suma a compresión de ingresos por FX y Mn. Triple presión: ingresos bajan + costos MXN suben + gasto financiero crece.",
    },
  };

  // ─────────────────────────────────────────────────────────────
  // Helper: render pill de probabilidad
  // ─────────────────────────────────────────────────────────────
  function probPill(key, esc) {
    const map = PROB[key];
    if (!map) return "";
    const d = map[esc];
    if (!d) return "";
    const colorMap = {
      "Alta":        { bg: "rgba(45,125,78,0.15)",   color: "var(--success)" },
      "Media-Alta":  { bg: "rgba(212,135,15,0.15)",  color: "var(--warn)"    },
      "Media":       { bg: "rgba(27,79,138,0.15)",   color: "var(--accent)"  },
      "Baja":        { bg: "rgba(155,35,53,0.15)",   color: "var(--danger)"  },
    };
    const c = colorMap[d.lbl] || colorMap["Media"];
    return `<span style="
      display:inline-block; font-size:9.5px; font-weight:700; padding:2px 6px;
      border-radius:10px; margin-top:3px; letter-spacing:0.3px;
      background:${c.bg}; color:${c.color}; white-space:nowrap;">
      ${d.lbl} · ${d.p}%
    </span>`;
  }

  // ─────────────────────────────────────────────────────────────
  // Helper: render tooltip ⓘ
  // ─────────────────────────────────────────────────────────────
  function tooltip(text) {
    const safe = text.replace(/"/g, "&quot;").replace(/
/g, " ");
    return `<span class="dash-tooltip-wrap">
      <span class="dash-tooltip-icon">ⓘ</span>
      <span class="dash-tooltip-box">${text}</span>
    </span>`;
  }

  // ─────────────────────────────────────────────────────────────
  // Helper: celda de escenario con prob + valor
  // ─────────────────────────────────────────────────────────────
  function cell(val, cls, probKey, escName) {
    return `<td class="${cls}" style="vertical-align:top; padding:8px 10px;">
      <div class="mono" style="font-size:12.5px; font-weight:600;">${val}</div>
      ${probPill(probKey, escName)}
    </td>`;
  }

  // ─────────────────────────────────────────────────────────────
  // Helper: celda primera columna con label + tooltip
  // ─────────────────────────────────────────────────────────────
  function labelCell(label, just, highlight) {
    const fw = highlight ? "700" : "500";
    const justHtml = just
      ? `<div style="display:flex; gap:6px; align-items:center; margin-top:2px;">
           <span style="font-size:10px; color:var(--text-muted); line-height:1.3;">Justificación</span>
           ${tooltip(just.base + " | BASE · " + just.opt + " | OPT · " + just.adv + " | ADV")}
         </div>`
      : "";
    // Actually give each scenario its own tooltip inline — better UX
    return null; // use labelCellFull instead
  }

  // ─────────────────────────────────────────────────────────────
  // Row builder
  // ─────────────────────────────────────────────────────────────
  function row(f) {
    if (f.divider) return `
      <tr>
        <td colspan="4" style="padding:4px 0; background:var(--bg-raised);">
          <div style="height:1px; background:var(--border);"></div>
        </td>
      </tr>`;

    if (f.sectionLabel) return `
      <tr>
        <td colspan="4" style="padding:6px 12px 2px;
            background:var(--bg-raised); font-size:10px; font-weight:700;
            color:var(--text-muted); letter-spacing:0.8px; text-transform:uppercase;">
          ${f.sectionLabel}
        </td>
      </tr>`;

    const fw = f.highlight ? "700" : "500";
    const just = f.just;

    // Label cell — shows tooltips per escenario
    const labelCol = `<td style="font-weight:${fw}; vertical-align:top; padding:8px 12px; min-width:160px;">
      <div>${f.label}</div>
      ${just ? `
      <div style="display:flex; gap:8px; margin-top:4px; flex-wrap:wrap;">
        <span class="dash-tooltip-wrap">
          <span class="dash-tooltip-icon" style="color:var(--accent);">ⓘ Base</span>
          <span class="dash-tooltip-box dash-tt-base">${just.formula ? "<strong>"+just.formula+"</strong><br><br>" : ""}${just.base}</span>
        </span>
        <span class="dash-tooltip-wrap">
          <span class="dash-tooltip-icon" style="color:var(--success);">ⓘ Opt</span>
          <span class="dash-tooltip-box dash-tt-opt">${just.formula ? "<strong>"+just.formula+"</strong><br><br>" : ""}${just.opt}</span>
        </span>
        <span class="dash-tooltip-wrap">
          <span class="dash-tooltip-icon" style="color:var(--danger);">ⓘ Adv</span>
          <span class="dash-tooltip-box dash-tt-adv">${just.formula ? "<strong>"+just.formula+"</strong><br><br>" : ""}${just.adv}</span>
        </span>
      </div>` : ""}
    </td>`;

    const baseCell  = cell(f.base, `esc-base   ${f.mono?"mono":""} ${f.baseClass||""}`, f.probKey, "base");
    const optCell   = cell(f.opt,  `esc-optimista ${f.mono?"mono":""} ${f.optClass||""}`, f.probKey, "opt");
    const advCell   = cell(f.adv,  `esc-adverso ${f.mono?"mono":""} ${f.advClass||""}`, f.probKey, "adv");

    return `<tr class="${f.highlight ? "row-highlight" : ""}">${labelCol}${baseCell}${optCell}${advCell}</tr>`;
  }

  // ─────────────────────────────────────────────────────────────
  // FILAS
  // ─────────────────────────────────────────────────────────────
  const filas = [

    { sectionLabel: "Variables Macro · Inputs independientes" },

    { label:"USD / MXN",      probKey:"usdmxn",
      base: fmt.fx(esc.base.usdmxn),  opt: fmt.fx(esc.optimista.usdmxn),  adv: fmt.fx(esc.adverso.usdmxn),
      mono:true, just: JUST_MACRO.usdmxn },

    { label:"Precio Manganeso", probKey:"precioMn",
      base: fmt.mn(esc.base.precioMn), opt: fmt.mn(esc.optimista.precioMn), adv: fmt.mn(esc.adverso.precioMn),
      mono:true, just: JUST_MACRO.precioMn },

    { label:"Precio Oro",      probKey:"precioOro",
      base: fmt.oro(esc.base.precioOro), opt: fmt.oro(esc.optimista.precioOro), adv: fmt.oro(esc.adverso.precioOro),
      mono:true, just: JUST_MACRO.precioOro },

    { label:"TIIE 28d",        probKey:"tiie28",
      base: fmt.tasa(esc.base.tiie28),  opt: fmt.tasa(esc.optimista.tiie28),  adv: fmt.tasa(esc.adverso.tiie28),
      mono:true, just: JUST_MACRO.tiie28 },

    { label:"SOFR 1m",         probKey:"sofr1m",
      base: fmt.tasa(esc.base.sofr1m),  opt: fmt.tasa(esc.optimista.sofr1m),  adv: fmt.tasa(esc.adverso.sofr1m),
      mono:true, just: JUST_MACRO.sofr1m },

    { divider: true },
    { sectionLabel: "Resultados Financieros · Outputs calculados" },

    { label:"EBITDA proyectado", probKey:"ebitda", highlight:true,
      base: fmt.usd(B.resultados.ebitda), opt: fmt.usd(O.resultados.ebitda), adv: fmt.usd(A.resultados.ebitda),
      mono:true,
      baseClass: B.resultados.ebitda > 0 ? "positive" : "negative",
      optClass:  O.resultados.ebitda > 0 ? "positive" : "negative",
      advClass:  A.resultados.ebitda > 0 ? "positive" : "negative",
      just: JUST_RESULT.ebitda },

    { label:"Margen EBITDA",    probKey:"margen",
      base: `${B.resultados.margenEbitda}%`, opt: `${O.resultados.margenEbitda}%`, adv: `${A.resultados.margenEbitda}%`,
      mono:true, just: JUST_RESULT.margen },

    { label:"FCF proyectado",   probKey:"fcf", highlight:true,
      base: fmt.usd(B.resultados.fcf), opt: fmt.usd(O.resultados.fcf), adv: fmt.usd(A.resultados.fcf),
      mono:true,
      baseClass: B.resultados.fcf > 0 ? "positive" : "negative",
      optClass:  O.resultados.fcf > 0 ? "positive" : "negative",
      advClass:  A.resultados.fcf > 0 ? "positive" : "negative",
      just: JUST_RESULT.fcf },

    { label:"DSCR estimado",    probKey:"dscr",
      base: B.resultados.dscr.toFixed(2)+"x", opt: O.resultados.dscr.toFixed(2)+"x", adv: A.resultados.dscr.toFixed(2)+"x",
      mono:true,
      baseClass: B.resultados.dscr >= 1 ? "positive" : "negative",
      optClass:  O.resultados.dscr >= 1 ? "positive" : "negative",
      advClass:  A.resultados.dscr >= 1 ? "positive" : "negative",
      just: JUST_RESULT.dscr },

    { divider: true },
    { sectionLabel: "Impactos por Driver · Descomposición del EBITDA" },

    { label:"Impacto FX",       probKey:"impFX",
      base: fmt.usd(B.impactos.fx), opt: fmt.usd(O.impactos.fx), adv: fmt.usd(A.impactos.fx),
      mono:true,
      baseClass: B.impactos.fx >= 0 ? "positive":"negative",
      optClass:  O.impactos.fx >= 0 ? "positive":"negative",
      advClass:  A.impactos.fx >= 0 ? "positive":"negative",
      just: JUST_RESULT.impFX },

    { label:"Impacto Manganeso", probKey:"impMn",
      base: fmt.usd(B.impactos.mn), opt: fmt.usd(O.impactos.mn), adv: fmt.usd(A.impactos.mn),
      mono:true,
      baseClass: B.impactos.mn >= 0 ? "positive":"negative",
      optClass:  O.impactos.mn >= 0 ? "positive":"negative",
      advClass:  A.impactos.mn >= 0 ? "positive":"negative",
      just: JUST_RESULT.impMn },

    { label:"Impacto Tasa (TIIE+SOFR)", probKey:"impTasa",
      base: fmt.usd(B.impactos.tiie+B.impactos.sofr),
      opt:  fmt.usd(O.impactos.tiie+O.impactos.sofr),
      adv:  fmt.usd(A.impactos.tiie+A.impactos.sofr),
      mono:true,
      baseClass: (B.impactos.tiie+B.impactos.sofr) >= 0 ? "positive":"negative",
      optClass:  (O.impactos.tiie+O.impactos.sofr) >= 0 ? "positive":"negative",
      advClass:  (A.impactos.tiie+A.impactos.sofr) >= 0 ? "positive":"negative",
      just: JUST_RESULT.impTasa },
  ];

  el.innerHTML = filas.map(row).join("");
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
