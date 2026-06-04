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
    icono: "💱",
    texto: `Cobertura FX activa: solo <strong>${exp.pctCubierto_FX.valor}%</strong> de exposición cubierta 
            vs límite de política de <strong>60%</strong>. 
            Gap de <strong>${exp.gapCobertura_FX.valor} pp</strong> sin protección 
            sobre ~USD ${(exp.ingresosFX_anualizado.valor/1000).toFixed(0)}M de ingresos anualizados.`,
  });

  // Alert 2 — oro sin cobertura en máximos
  alerts.push({
    tipo: "warn",
    icono: "🪙",
    texto: `Precio del oro en máximos históricos (~USD ${AUTLAN.mercado.precioOro.valor}/oz) 
            y <strong>sin cobertura activa</strong>. Metallorum duplicó producción en 1T26 — 
            exposición al downside sin protección.`,
  });

  // Alert 3 — collar TIIE fuera del dinero
  const collar = AUTLAN.derivadosVigentes.collarTasa;
  alerts.push({
    tipo: "warn",
    icono: "🏦",
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
      base: "Escenario base: el peso mexicano se mantiene estable, alrededor de $18 pesos por dólar. Banxico (el banco central de México) ha bajado sus tasas de interés 13 veces desde 2024, lo que estabiliza el tipo de cambio. Para Autlán esto es neutral: sus ingresos son en dólares pero sus costos son en pesos, así que un peso estable no les ayuda ni les perjudica.",
      opt:  "Escenario optimista: el peso se debilita y el dólar vale más pesos (ej. $19.50). Esto le conviene a Autlán porque sus ingresos en dólares 'valen más' cuando los convierte a pesos para pagar sus costos. Cada peso de depreciación equivale a aproximadamente USD 18M adicionales en ingresos para la empresa.",
      adv:  "Escenario adverso: el peso se fortalece y el dólar vale menos pesos (ej. $16.00). Esto perjudica a Autlán porque sus ingresos en dólares 'valen menos' al convertirlos, pero sus costos en pesos no bajan. El principal riesgo es la renegociación del tratado comercial USMCA en julio 2026, que podría causar una apreciación fuerte del peso.",
    },
    precioMn: {
      base: "Escenario base: el precio del manganeso se mantiene en recuperación moderada (~USD 1,300/tonelada). El manganeso es la materia prima principal de Autlán — lo minan, procesan y venden a fábricas de acero. China, el mayor comprador mundial, está reabasteciendo inventarios gradualmente, lo que sostiene el precio sin grandes subidas.",
      opt:  "Escenario optimista: el precio sube a más de USD 1,600/tonelada. Esto ocurriría si China lanza un gran estímulo económico, o si Gabón (uno de los mayores productores mundiales) adelanta su prohibición de exportar mineral sin procesar prevista para 2029. Un precio mayor significa más ingresos directos para Autlán por cada tonelada que vende.",
      adv:  "Escenario adverso: el precio colapsa a USD 850–1,100/tonelada. Esto pasaría si China reduce su producción de acero más de lo esperado, o si productores asiáticos venden manganeso a precios artificialmente bajos en México (dumping). Para Autlán significaría perder entre USD 25–40M en ingresos anuales.",
    },
    precioOro: {
      base: "Escenario base: el precio del oro baja moderadamente desde sus máximos históricos actuales (~USD 3,000/oz) hasta ~USD 2,900/oz. El oro está muy alto históricamente y suele corregir. Autlán produce oro a través de su división Metallorum, que duplicó su producción en el primer trimestre de 2026. Una corrección moderada no afecta gravemente sus ingresos.",
      opt:  "Escenario optimista: el oro sube a más de USD 3,300/oz. El oro sube cuando hay incertidumbre global — guerras, crisis financieras, o cuando el dólar se debilita. Lo interesante para Autlán es que este escenario suele ocurrir justo cuando el negocio de acero y manganeso va mal, así que el oro actúa como un 'seguro natural' que compensa las pérdidas del negocio principal.",
      adv:  "Escenario adverso: el oro baja a USD 2,200–2,500/oz. Esto ocurriría si la Reserva Federal de EE.UU. sube sus tasas de interés inesperadamente, fortaleciendo el dólar. Un dólar fuerte hace que el oro (que cotiza en dólares) sea más caro para compradores de otros países, reduciendo la demanda. Autlán perdería el beneficio de su división aurífera justo cuando más la necesita.",
    },
    tiie28: {
      base: "Escenario base: la TIIE (la tasa de interés de referencia en México, similar a lo que cobra un banco por prestar dinero) baja gradualmente de 7.10% a ~6.95%. Banxico ha estado bajando tasas consistentemente y se espera que continúe. Autlán tiene deuda en pesos ligada a esta tasa, así que tasas más bajas reducen lo que paga de intereses cada mes.",
      opt:  "Escenario optimista: la TIIE baja más rápido a ~6.50%. Si la inflación en México baja más rápido de lo esperado, Banxico puede acelerar los recortes. Para Autlán, cada 1% que baja la TIIE representa aproximadamente USD 440K menos de gasto financiero al año.",
      adv:  "Escenario adverso: la TIIE sube a ~7.75%. Si la inflación rebota por encima del 5%, Banxico tendría que subir tasas en lugar de bajarlas. Esto aumentaría los pagos de intereses de Autlán. El riesgo es mayor porque la empresa ya tiene un DSCR de 0.6x, lo que significa que sus ingresos operativos apenas cubren su deuda — cualquier incremento en costos financieros presiona aún más.",
    },
    sofr1m: {
      base: "Escenario base: el SOFR (la tasa de interés de referencia en EE.UU., equivalente a la TIIE pero en dólares) baja ligeramente a ~4.10%. La Reserva Federal se espera que haga 1 o 2 recortes en 2026. Autlán tiene USD 135M de deuda en dólares ligada a esta tasa — la más grande de su portafolio — así que esto impacta directamente su gasto financiero.",
      opt:  "Escenario optimista: el SOFR baja a ~3.50% si la economía de EE.UU. se desacelera y la Fed recorta agresivamente. Para Autlán, bajar el SOFR 1% significa pagar ~USD 1.35M menos de intereses al año sobre su deuda principal.",
      adv:  "Escenario adverso: el SOFR sube a ~4.80% si la inflación en EE.UU. no baja como se espera, en parte por los nuevos aranceles comerciales. Esto elevaría el gasto financiero de Autlán en USD 1.35M adicionales por cada 1% que suba. Combinado con un peso fuerte y manganeso barato, sería una presión triple simultánea sobre sus finanzas.",
    },
  };
  
  // ─────────────────────────────────────────────────────────────
  // JUSTIFICACIONES — resultados (dependientes, con fórmula)
  // ─────────────────────────────────────────────────────────────
  const JUST_RESULT = {
    ebitda: {
      formula: "FÓRMULA: EBITDA = Ingresos − Costos operativos. Representa cuánto genera la empresa con su operación antes de pagar deuda, impuestos y depreciación. Base de partida: USD 31.5M (resultado auditado 2025). Se ajusta sumando o restando el impacto de cada variable macro.",
      base: "Con las variables en niveles moderados, el EBITDA se mantiene en un rango de USD 30–35M. La empresa cubre su operación pero no genera suficiente para pagar toda su deuda sola — necesita apoyo de líneas de crédito bancarias. Margen de utilidad operativa de ~9–11%.",
      opt:  "Si el peso se debilita, el manganeso sube y el oro se mantiene fuerte, el EBITDA podría superar USD 50M. Sería la primera vez desde 2023 que la empresa genera suficiente flujo para cubrir autónomamente su deuda. El margen subiría por encima del 15%.",
      adv:  "Si el peso se fortalece, el manganeso cae y las tasas suben al mismo tiempo, el EBITDA podría caer por debajo de USD 10M o volverse negativo. La empresa entraría en zona de riesgo: no podría pagar su deuda sin vender activos o renegociar condiciones con los bancos.",
    },
    margen: {
      formula: "FÓRMULA: Margen EBITDA = EBITDA ÷ Ingresos totales × 100. Indica qué porcentaje de cada peso vendido queda como utilidad operativa. En 2022 llegó a 38% — hoy está en ~10%, lo que refleja la compresión por peso fuerte y precios bajos de manganeso.",
      base: "Margen de ~9–11%. La empresa opera con márgenes históricamente bajos. Los costos fijos de operar minas y plantas de fundición son muy altos y no bajan aunque caigan los ingresos, lo que limita la recuperación del margen.",
      opt:  "Margen podría subir a 15–18% si mejoran simultáneamente el tipo de cambio y el precio del manganeso. La recuperación del mercado doméstico de acero en México (+12% si AHMSA reinicia operaciones) también ayudaría a mejorar el margen al diluir los costos fijos.",
      adv:  "Margen podría caer por debajo del 5%. Cuando los ingresos caen pero los costos fijos se mantienen, el margen colapsa desproporcionadamente. Es el llamado 'efecto tijera': ingresos bajan, costos no.",
    },
    fcf: {
      formula: "FÓRMULA: FCF (Flujo de Caja Libre) = EBITDA − Intereses de deuda − Inversiones mínimas en activos (CAPEX). Representa el dinero real que queda disponible después de pagar deuda y mantener las operaciones. Si es negativo, la empresa necesita pedir prestado más dinero para sobrevivir.",
      base: "FCF negativo o en cero. La empresa necesita ~USD 42M para pagar intereses y ~USD 30M para mantener sus activos, pero su EBITDA base es de ~USD 31M. El déficit lo cubre con líneas de crédito bancarias ya contratadas.",
      opt:  "FCF ligeramente positivo si el EBITDA supera USD 72M. Sería la primera vez que Autlán genera efectivo libre desde 2023, permitiéndole empezar a reducir su deuda.",
      adv:  "FCF de entre –USD 40M y –USD 60M. La empresa tendría que usar todas sus líneas de crédito disponibles y probablemente diferir inversiones de mantenimiento, lo que deterioraría sus activos a mediano plazo.",
    },
    dscr: {
      formula: "FÓRMULA: DSCR = EBITDA ÷ Gasto financiero total. Mide cuántas veces los ingresos operativos cubren los pagos de deuda. Un DSCR de 1.0x significa que la empresa gana exactamente lo que necesita para pagar su deuda. Por debajo de 1.0x significa que no alcanza y necesita financiamiento externo. HR Ratings proyecta 0.6x para 2026–2028.",
      base: "DSCR de ~0.6–0.8x. La empresa genera solo el 60–80% de lo que necesita para pagar su deuda con su operación. Las tres calificadoras de riesgo (HR Ratings, Fitch, PCR Verum) mantienen calificación de grado de inversión pero con perspectiva negativa, lo que significa que podrían bajar la calificación si la situación no mejora.",
      opt:  "DSCR podría superar 1.0x, significando que la empresa por primera vez cubriría su deuda sin ayuda externa. Esto triggearía una revisión positiva de las calificadoras y mejoraría las condiciones de refinanciamiento.",
      adv:  "DSCR por debajo de 0.4x. La empresa estaría en riesgo de incumplir las condiciones de sus contratos de deuda (covenants), lo que podría obligar a los bancos a exigir el pago anticipado de los créditos. HR Ratings identificó este escenario como el principal riesgo en su reporte de diciembre 2025.",
    },
    impFX: {
      formula: "FÓRMULA: Impacto FX = Ingresos base × Cambio % en tipo de cambio × 0.85. El 0.85 refleja que el 85% de los ingresos de Autlán son sensibles al tipo de cambio (el 15% restante son ingresos en pesos que no se ven afectados). Tipo de cambio base de referencia: $18.00 pesos por dólar.",
      base:  "Con el dólar a ~$18 pesos, el impacto es casi neutro. Las coberturas actuales de Autlán (4 contratos de tipo collar que cubren solo el 3% de su exposición) prácticamente no mitigan este riesgo.",
      opt:   "Con el dólar a $19.50: impacto positivo de ~USD 15–25M. El peso débil hace que los ingresos en dólares 'valgan más' cuando se convierten a pesos para pagar costos locales. Es el principal driver del escenario optimista.",
      adv:   "Con el dólar a $16.00: impacto negativo de –USD 20–30M. El peso fuerte es el principal riesgo para Autlán. El gap de cobertura (57 puntos porcentuales sin protección) significa que la gran mayoría de esta pérdida no está cubierta con derivados.",
    },
    impMn: {
      formula: "FÓRMULA: Impacto Mn = Ingresos base × 0.60 × Cambio % en precio. El 0.60 refleja que aproximadamente el 60% de los ingresos provienen de la venta de ferroaleaciones de manganeso. Precio base de referencia: USD 1,309 por tonelada métrica.",
      base:  "Con el precio estable en ~USD 1,300/ton, el impacto es marginal. La recuperación reciente del precio ya está descontada en los números base.",
      opt:   "Con el precio en USD 1,600/ton: impacto positivo de ~USD 15–25M adicionales en ingresos. Equivale aproximadamente a la ganancia de vender las mismas toneladas pero a USD 291 más por cada una.",
      adv:   "Con el precio en USD 900/ton: impacto negativo de –USD 25–40M. Es el mayor riesgo individual de la empresa porque el manganeso representa ~90% de sus ingresos y no existe un mercado organizado de derivados para cubrirse contra esta caída de precio.",
    },
    impTasa: {
      formula: "FÓRMULA: Impacto TIIE = –USD 29.7M × (TIIE nueva − 7.10%) ÷ 100. Impacto SOFR = –USD 135.5M × (SOFR nuevo − 4.30%) ÷ 100. El signo negativo indica que cuando las tasas suben, el impacto es un costo mayor (negativo para la empresa). Deuda en pesos (TIIE): USD 29.7M equivalente. Deuda en dólares (SOFR): USD 135.5M.",
      base:  "Tasas bajando ligeramente: ahorro neto de ~USD 0.5–2M vs 2025. Sin embargo, el collar de tasa de interés que tiene Autlán (un contrato que debería protegerlos si la TIIE sube mucho) está 'fuera del dinero' porque la TIIE actual está por debajo del nivel mínimo del contrato. Esto significa que están pagando por una póliza de seguro que actualmente no les da beneficio.",
      opt:   "Banxico y la Fed recortan agresivamente: ahorro combinado de ~USD 2–4M al año. Reduce la presión sobre el flujo de caja aunque no resuelve el problema central de ingresos insuficientes.",
      adv:   "Tasas suben: costo adicional de ~USD 3–5M al año. Se suma a la presión de ingresos bajos. Es la 'triple presión': ingresos caen por FX y manganeso, y al mismo tiempo los pagos de deuda aumentan.",
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
      <div class="mono" style="font-size:12.5px; font-weight:400;">${val}</div>
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
