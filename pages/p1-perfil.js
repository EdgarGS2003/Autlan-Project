/**
 * pages/p1-perfil.js — Perfil Financiero Autlán
 * Datos auditados XBRL 4T25 y 1T26 · BMV
 */

function renderPerfil() {
  const el = document.getElementById("perfil-content");
  if (!el) return;

  const collar = AUTLAN.derivadosVigentes.collarTasa;

  el.innerHTML = `

    <!-- ALERTA DATOS AUDITADOS -->
    <div class="alert alert-info mb-24">
      <span class="alert-icon">🔒</span>
      <span>${I18N.t("p1.alert")}</span>
    </div>

    <!-- KPIs PRINCIPALES -->
    <div class="section-title">${I18N.t("p1.keyResults")}</div>
    <div class="grid-4 mb-24">

      <div class="kpi-card accent">
        <div class="kpi-label">${I18N.t("p1.kpi.rev2025")}</div>
        <div class="kpi-value">USD 322.7M</div>
        <div class="kpi-sub">${I18N.t("p1.kpi.rev2025.sub")}</div>
      </div>

      <div class="kpi-card warn">
        <div class="kpi-label">${I18N.t("p1.kpi.ebitda2025")}</div>
        <div class="kpi-value">USD 31.5M</div>
        <div class="kpi-sub">${I18N.t("p1.kpi.ebitda2025.sub")}</div>
      </div>

      <div class="kpi-card danger">
        <div class="kpi-label">${I18N.t("p1.kpi.netloss")}</div>
        <div class="kpi-value" style="color:var(--danger);">-USD 37.8M</div>
        <div class="kpi-sub">${I18N.t("p1.kpi.netloss.sub")}</div>
      </div>

      <div class="kpi-card success">
        <div class="kpi-label">${I18N.t("p1.kpi.rev1q26")}</div>
        <div class="kpi-value">USD 98.4M</div>
        <div class="kpi-sub">${I18N.t("p1.kpi.rev1q26.sub")}</div>
      </div>

    </div>

    <!-- ESTADO DE RESULTADOS COMPARATIVO -->
    <div class="section-title">${I18N.t("p1.incomeStatement")}</div>
    <div class="table-wrap mb-24">
      <table>
        <thead>
          <tr>
            <th>${I18N.t("p1.concept")}</th>
            <th style="text-align:right;">2024</th>
            <th style="text-align:right;">2025 Anual</th>
            <th style="text-align:right;">1T25</th>
            <th style="text-align:right;">1T26</th>
            <th style="text-align:right;">Var YoY</th>
          </tr>
        </thead>
        <tbody>
          ${_filaResultados(I18N.t("p1.netRev"), 312872, 322746, 80135, 98386, true)}
          ${_filaResultados(I18N.t("p1.cogs"), 252213, 271309, 67449, 83463, false, true)}
          ${_filaResultados(I18N.t("p1.grossProfit"), 60659, 51437, 12686, 14923, true)}
          ${_filaResultados(I18N.t("p1.sellExp"), 12649, 15912, 3101, 5905, false, true)}
          ${_filaResultados(I18N.t("p1.adminExp"), 36523, 37714, 9301, 10656, false, true)}
          ${_filaResultados(I18N.t("p1.opProfit"), 5262, -4094, -1084, 170, true, false,
            "Utilidad / pérdida operativa = Ingresos − Costo de ventas − Gastos de venta − Gastos de administración. El resultado negativo en 2025 (−USD 4.1M) se explica por: (1) apreciación del peso que redujo el valor MXN de ingresos USD sin mover costos fijos, (2) caída en precio del manganeso desde máximos 2022, (3) debilidad del mercado de acero en México (mínimo 30 años). Mejora notable en 1T26: +USD 170K — señal de recuperación incipiente.")}
          ${_filaResultados(I18N.t("p1.finExp"), 31881, 42493, 7654, 7318, false, true,
            "Gasto financiero = intereses sobre deuda bancaria (SOFR + spread y TIIE + spread) + pérdida por instrumentos derivados fuera del dinero (collar TIIE OTM) + efecto cambiario en deuda USD. El salto de USD 31.9M (2024) a USD 42.5M (2025) se debe a: (1) mayor saldo de deuda, (2) tasas SOFR elevadas durante 2025, (3) minusvalía del collar TIIE. En 1T26 baja a USD 7.3M (-4.4% YoY) por inicio del ciclo de recortes Banxico.")}
          ${_filaResultados(I18N.t("p1.netLoss"), -12025, -37773, -7632, -5976, true, false,
            "Pérdida neta = Utilidad operativa − Gasto financiero − Impuestos − Otros. La pérdida de USD 37.8M en 2025 NO implica que la empresa esté quebrando — es una pérdida contable. La empresa sigue generando EBITDA positivo (USD 31.5M) y tiene activos de USD 627M. Las pérdidas se explican principalmente por el gasto financiero (USD 42.5M) que supera la utilidad operativa, más efectos no monetarios de derivados. En 1T26 la pérdida se reduce a USD 6.0M (+21.7% mejora YoY).")}
        </tbody>
      </table>
    </div>

    <!-- BALANCE Y DEUDA -->
    <div class="grid-2 mb-24">

      <!-- Balance resumido -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${I18N.t("p1.balance")}</div>
            <div class="card-sub">${I18N.t("p1.balance.sub")}</div>
          </div>
          <span class="badge badge-accent">${I18N.t("label.audited")}</span>
        </div>

        <div class="section-title" style="margin-top:0;">${I18N.t("p1.assets")}</div>
        ${_filaBalance(I18N.t("p1.cash"), 21801, "success")}
        ${_filaBalance(I18N.t("p1.ar"), 52387)}
        ${_filaBalance(I18N.t("p1.inventory"), 88033)}
        ${_filaBalance(I18N.t("p1.otherCurrent"), 55390)}
        ${_filaBalance(I18N.t("p1.totalCurrent"), 217611, "accent", true)}
        ${_filaBalance(I18N.t("p1.ppe"), 235302)}
        ${_filaBalance(I18N.t("p1.intangibles"), 79708)}
        ${_filaBalance(I18N.t("p1.totalNonCurrent"), 410253, "accent", true)}
        ${_filaBalance(I18N.t("p1.totalAssets"), 627864, "accent", true, true)}

        <div class="divider"></div>
        <div class="section-title">${I18N.t("p1.liabilities")}</div>
        ${_filaBalance(I18N.t("p1.currentLiab"), 158053, "danger")}
        ${_filaBalance(I18N.t("p1.ltDebt"), 168227, "danger")}
        ${_filaBalance(I18N.t("p1.otherLt"), 69349)}
        ${_filaBalance(I18N.t("p1.totalLiab"), 395593, "danger", true)}
        ${_filaBalance(I18N.t("p1.equity"), 232271, "success", true, true)}
      </div>

      <!-- Métricas y ratings -->
      <div>
        <div class="card mb-16">
          <div class="card-header">
            <div class="card-title">${I18N.t("p1.creditMetrics")}</div>
            <span class="badge badge-warn">${I18N.t("badge.negOutlook")}</span>
          </div>

          ${_filaMetrica(I18N.t("p1.leverage"), "63.0%", "danger",
            "Leverage = Deuda total / Activos totales = USD 395.6M / USD 627.9M = 63%. Fuente: XBRL 1T26 BMV auditado. Un leverage >50% se considera alto en el sector minero. El umbral crítico es ~70% donde los covenants bancarios típicamente se activan.")}
          ${_filaMetrica(I18N.t("p1.netDebt"), "USD 164.1M", "warn",
            "Deuda neta = Deuda total − Efectivo = USD 185.9M − USD 21.8M = USD 164.1M. Fuente: XBRL 1T26. Mide la deuda 'real' descontando el efectivo disponible para pagarla. A mayor deuda neta, mayor presión sobre el flujo de caja libre.")}
          ${_filaMetrica(I18N.t("p1.dscr"), "0.6x", "danger",
            "DSCR (Debt Service Coverage Ratio) = EBITDA / Gasto financiero total = USD 25.4M / USD 42.5M ≈ 0.6x. Proyección HR Ratings dic-2025 para 2026-2028. Un DSCR < 1.0x significa que el flujo operativo NO cubre autónomamente el servicio de deuda — la empresa necesita líneas de crédito o refinanciamiento. Threshold crítico de covenants: típicamente 1.0-1.25x.")}
          ${_filaMetrica(I18N.t("p1.finExpAnn"), "USD 42.5M", "warn",
            "Gasto financiero anualizado 2025 (auditado). Compuesto por: ~USD 28M intereses SOFR (USD 135.5M × ~10.75%), ~USD 5.5M intereses TIIE (USD 29.7M equiv × ~11.75%), ~USD 4M EURIBOR, ~USD 2.5M tasa fija, + minusvalías derivados. Fuente: XBRL 4T25 estado de resultados.")}
          ${_filaMetrica(I18N.t("p1.cashAvail"), "USD 21.8M", "warn",
            "Efectivo y equivalentes al 31-mar-2026. Fuente: XBRL 1T26 balance auditado. Con gasto financiero mensual de ~USD 3.5M y CAPEX mínimo de ~USD 2.5M/mes, el runway de caja es de ~3-4 meses sin líneas de crédito adicionales. Las líneas de crédito comprometidas no utilizadas proveen buffer adicional.")}
          ${_filaMetrica(I18N.t("p1.debtEbitda"), "5.9x", "danger",
            "Deuda neta / EBITDA = USD 164.1M / USD 27.8M (EBITDA últimos 12 meses) ≈ 5.9x. El sector minero típicamente opera en rangos de 2-3x en ciclo normal. >4x se considera zona de estrés financiero. >6x activa típicamente covenants de ratio de apalancamiento. La meta de Autlán para 2027-2028 es reducirlo a <4x vía crecimiento de EBITDA.")}

          <div class="divider"></div>
          <div class="section-title">${I18N.t("p1.ratings")}</div>
          <div class="grid-3" style="gap:8px; margin-top:8px;">
            ${_ratingCard("HR Ratings", "A-", I18N.t("p1.negativa"))}
            ${_ratingCard("Fitch", "BBB+", I18N.t("p1.negativa"))}
            ${_ratingCard("PCR Verum", "A-/M", I18N.t("p1.negativa"))}
          </div>
        </div>

        <!-- Segmentos -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">${I18N.t("p1.segments")}</div>
            <span class="badge badge-accent">USD 322.7M total</span>
          </div>

          ${_filaSegmento(I18N.t("p1.seg.ferro"), 289000, 89.6, "var(--mn-brown)")}
          ${_filaSegmento(I18N.t("p1.seg.emd"), 28000, 8.7, "var(--accent-mid)")}
          ${_filaSegmento(I18N.t("p1.seg.metallorum"), 5000, 1.5, "var(--gold)")}
          ${_filaSegmento(I18N.t("p1.seg.energy"), 2800, 0.9, "var(--success-mid)")}

          <div class="alert alert-info mt-12" style="margin-top:12px;">
            <span class="alert-icon">📈</span>
            <span style="font-size:11.5px;">
              ${I18N.t("p1.seg.alert")}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- DEUDA DETALLADA -->
    <div class="section-title">${I18N.t("p1.debtDetail")}</div>
    <div class="table-wrap mb-24">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${I18N.t("p1.creditor")}</th>
            <th>${I18N.t("p1.rate")}</th>
            <th>${I18N.t("p1.currency")}</th>
            <th style="text-align:right;">${I18N.t("p1.maturity")}</th>
            <th style="text-align:right;">${I18N.t("p1.balance.col")}</th>
            <th>${I18N.t("p1.risk")}</th>
          </tr>
        </thead>
        <tbody>
          ${AUTLAN.deuda.creditos.map((c, i) => `
            <tr>
              <td class="text-muted">${i + 1}</td>
              <td style="font-weight:500; font-size:12px;">${c.acreedor}</td>
              <td class="mono" style="font-size:11.5px;">${c.tasa}</td>
              <td>
                <span class="badge ${c.moneda === 'USD' ? 'badge-accent'
                                    : c.moneda === 'MXN' ? 'badge-warn'
                                    : 'badge-neutral'}">
                  ${c.moneda}
                </span>
              </td>
              <td class="mono" style="text-align:right; font-size:11.5px;">
                ${c.vencimiento}
              </td>
              <td class="mono" style="text-align:right; font-weight:600;">
                ${c.saldoTotal.valor.toLocaleString()}
              </td>
              <td>
                <span class="badge ${c.tasaBase === 'SOFR'   ? 'badge-danger'
                                    : c.tasaBase === 'TIIE28' ? 'badge-warn'
                                    : c.tasaBase === 'FIJA'   ? 'badge-success'
                                    : 'badge-neutral'}">
                  ${c.tasaBase}
                </span>
              </td>
            </tr>
          `).join("")}
          <tr style="background:var(--bg-raised); font-weight:700;">
            <td colspan="5" style="font-size:12px;">${I18N.t("p1.totalDebt")}</td>
            <td class="mono" style="text-align:right;">
              ${AUTLAN.deuda.resumenTasa.total.saldo.toLocaleString()}
            </td>
            <td>
              <span class="badge badge-warn">
                ${(AUTLAN.deuda.resumenTasa.sofr_usd.pct +
                   AUTLAN.deuda.resumenTasa.tiie_mxn.pct +
                   AUTLAN.deuda.resumenTasa.euribor_eur.pct).toFixed(0)}% ${I18N.getLocale() === "en" ? "variable" : "variable"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- DERIVADOS VIGENTES -->
    <div class="section-title">${I18N.t("p1.derivatives")}</div>
    <div class="grid-2 mb-24">

      <!-- Collar TIIE -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${I18N.t("p1.collarTIIE")}</div>
            <div class="card-sub">${I18N.t("p1.collarTIIE.sub")}</div>
          </div>
          <span class="badge badge-warn">${I18N.t("badge.otm")}</span>
        </div>

        ${_filaMetrica(I18N.t("p1.instrument"), I18N.getLocale() === "en" ? "Costless collar (cap + floor)" : "Collar sin costo (cap + floor)")}
        ${_filaMetrica(I18N.t("p1.underlying"), "TIIEF (TIIE 28 días)")}
        ${_filaMetrica(I18N.t("p1.notional"), I18N.getLocale() === "en" ? "MXN 157.6M (50% of CEM TIIE debt)" : "MXN 157.6M (50% deuda TIIE CEM)")}
        ${_filaMetrica(I18N.t("p1.floor.cap"), I18N.getLocale() === "en" ? "8.75% — option buy" : "8.75% — compra opción")}
        ${_filaMetrica(I18N.t("p1.cap.floor"), I18N.getLocale() === "en" ? "11.00% — option sale" : "11.00% — vende opción")}
        ${_filaMetrica(I18N.t("p1.tiie.current"), `${collar.tiieActual}% — ${I18N.getLocale() === "en" ? "below floor" : "debajo del floor"}`, "danger")}
        ${_filaMetrica(I18N.t("p1.maturityDate"), I18N.getLocale() === "en" ? "23-Jun-2028 · monthly" : "23-jun-2028 · mensual")}
        ${_filaMetrica(I18N.t("p1.accumLoss"), `USD ${collar.mtm.perdidaAcum.valor}K ${I18N.getLocale() === "en" ? "(11 coupons)" : "(11 cupones)"}`, "danger")}
        ${_filaMetrica(I18N.t("p1.q1loss"), "USD 31.5K", "warn")}

        <div class="alert alert-warn" style="margin-top:12px;">
          <span class="alert-icon">⚠</span>
          <span style="font-size:11.5px;">
            ${I18N.t("p1.collarAlert")}
          </span>
        </div>
      </div>

      <!-- Collares FX -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${I18N.t("p1.collarFX")}</div>
            <div class="card-sub">${I18N.t("p1.collarFX.sub")}</div>
          </div>
          <span class="badge badge-danger">${I18N.t("badge.only3pct")}</span>
        </div>

        <div class="table-wrap" style="margin-bottom:12px;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>${I18N.t("p1.floorPut")}</th>
                <th>${I18N.t("p1.capCall")}</th>
                <th>${I18N.t("p1.notionalMonth")}</th>
                <th>${I18N.t("p1.maturityDate")}</th>
              </tr>
            </thead>
            <tbody>
              ${AUTLAN.derivadosVigentes.collarsFX.map(c => `
                <tr>
                  <td class="text-muted">${c.id.replace("IFD-FX-0","FX-")}</td>
                  <td class="mono positive">$${c.floorUSD.toFixed(2)}</td>
                  <td class="mono warn">$${c.capUSD.toFixed(4)}</td>
                  <td class="mono">USD ${c.nocionalUSD.valor.toLocaleString()}K</td>
                  <td class="mono" style="font-size:11px;">${c.vencimiento}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        ${_filaMetrica(I18N.t("p1.totalNotional"), I18N.getLocale() === "en" ? "USD 12M (4 months × USD 1M/month × 3)" : "USD 12M (4 meses × USD 1M/mes × 3)")}
        ${_filaMetrica(I18N.t("p1.annualRev"), "~USD 394M")}
        ${_filaMetrica(I18N.t("p1.pctCovered"), `~3% — ${I18N.getLocale() === "en" ? "CRITICAL" : "CRÍTICO"}`, "danger")}
        ${_filaMetrica(I18N.t("p1.policyLimit"), I18N.getLocale() === "en" ? "60% of USD revenues" : "60% de ingresos USD")}
        ${_filaMetrica(I18N.t("p1.gap"), I18N.getLocale() === "en" ? "~57 pp available under policy" : "~57 pp disponibles de política", "warn")}

        <div class="alert alert-danger" style="margin-top:12px;">
          <span class="alert-icon">🚨</span>
          <span style="font-size:11.5px;">
            ${I18N.t("p1.fxAlert")}
          </span>
        </div>
      </div>

    </div>

    <!-- NOTA DE DATOS -->
    <div style="font-size:11px; color:var(--text-muted); padding:12px 16px;
                background:var(--bg-raised); border-radius:var(--radius-md);">
      ${I18N.t("p1.sources")}
    </div>
  `;
}

// ─────────────────────────────────────────
// HELPERS DE RENDERIZADO
// ─────────────────────────────────────────
function _filaResultados(label, v2024, v2025, v1t25, v1t26, highlight = false, costoDir = false, explicacion = null) {
  const varYoy = ((v1t26 - v1t25) / Math.abs(v1t25) * 100);
  const esPositivo = costoDir ? varYoy < 0 : varYoy > 0;
  const claseVar   = esPositivo ? "positive" : "negative";
  const signVar    = varYoy >= 0 ? "+" : "";

  const fmt = (v) => {
    const abs = Math.abs(v);
    const str = abs >= 1000
      ? (abs / 1000).toFixed(1) + "M"
      : abs.toFixed(0) + "K";
    return v < 0 ? `-${str}` : str;
  };

  const tooltipHtml = explicacion ? `
    <span class="dash-tooltip-wrap" style="margin-left:5px;">
      <span class="dash-tooltip-icon" style="font-size:9px; padding:1px 4px;">ⓘ</span>
      <span class="dash-tooltip-box" style="width:280px; font-weight:400; font-size:11px; line-height:1.6;">
        ${explicacion}
      </span>
    </span>` : "";

  return `
    <tr style="${highlight ? "font-weight:700; background:var(--bg-raised);" : ""}">
      <td style="font-size:12.5px;">
        <span style="display:inline-flex; align-items:center;">
          ${label}${tooltipHtml}
        </span>
      </td>
      <td class="mono" style="text-align:right; color:var(--text-secondary);">${fmt(v2024)}</td>
      <td class="mono" style="text-align:right; ${v2025 < 0 ? "color:var(--danger);" : ""}">${fmt(v2025)}</td>
      <td class="mono" style="text-align:right; color:var(--text-secondary);">${fmt(v1t25)}</td>
      <td class="mono" style="text-align:right; ${v1t26 < 0 ? "color:var(--danger);" : ""}">${fmt(v1t26)}</td>
      <td class="mono ${claseVar}" style="text-align:right;">${signVar}${varYoy.toFixed(1)}%</td>
    </tr>`;
}

function _filaBalance(label, valor, tipo = "", bold = false, grande = false) {
  const colorMap = {
    success: "var(--success)",
    danger:  "var(--danger)",
    accent:  "var(--accent)",
    warn:    "var(--warn)",
    "":      "var(--text-primary)",
  };

  return `
    <div class="flex-between" style="padding:6px 0;
      border-bottom:1px solid var(--border);
      ${bold ? "font-weight:700;" : ""}
      ${grande ? "padding:8px 0;" : ""}">
      <span style="font-size:12px; color:var(--text-secondary);">${label}</span>
      <span class="text-mono" style="font-size:${grande ? "13" : "12"}px;
            color:${colorMap[tipo] || colorMap[""]};">
        ${valor < 0 ? "-" : ""}USD ${Math.abs(valor).toLocaleString()}K
      </span>
    </div>`;
}

function _filaMetrica(label, valor, tipo = "", explicacion = null) {
  const colorMap = {
    success: "var(--success)",
    danger:  "var(--danger)",
    warn:    "var(--warn)",
    "":      "var(--text-primary)",
  };

  const tooltipHtml = explicacion ? `
    <span class="dash-tooltip-wrap" style="margin-left:5px;">
      <span class="dash-tooltip-icon" style="font-size:9px; padding:1px 4px;">ⓘ</span>
      <span class="dash-tooltip-box" style="width:280px; font-weight:400; font-size:11px; line-height:1.6;">
        ${explicacion}
      </span>
    </span>` : "";

  return `
    <div class="flex-between" style="padding:5px 0; border-bottom:1px solid var(--border);">
      <span style="font-size:11.5px; color:var(--text-secondary); display:inline-flex; align-items:center;">
        ${label}${tooltipHtml}
      </span>
      <span class="text-mono" style="font-size:12px; font-weight:600;
            color:${colorMap[tipo] || colorMap[""]};">
        ${valor}
      </span>
    </div>`;
}

function _ratingCard(agencia, calificacion, perspectiva) {
  return `
    <div style="background:var(--bg-raised); border:1px solid var(--border);
                border-radius:var(--radius-md); padding:10px; text-align:center;">
      <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px;">
        ${agencia}
      </div>
      <div style="font-size:16px; font-weight:700; font-family:var(--font-mono);
                  color:var(--accent);">
        ${calificacion}
      </div>
      <div style="font-size:10px; color:var(--warn); margin-top:2px;">
        ${perspectiva}
      </div>
    </div>`;
}

function _filaSegmento(nombre, ingresos, pct, color) {
  return `
    <div style="margin-bottom:12px;">
      <div class="flex-between" style="margin-bottom:5px;">
        <span style="font-size:12px; font-weight:500;">${nombre}</span>
        <span class="text-mono" style="font-size:12px;">
          USD ${(ingresos/1000).toFixed(0)}M · ${pct}%
        </span>
      </div>
      <div style="height:6px; background:var(--bg-raised);
                  border-radius:3px; overflow:hidden;">
        <div style="width:${pct}%; height:100%; background:${color};
                    border-radius:3px;"></div>
      </div>
    </div>`;
}

// Escuchar navegación lazy
Scenarios.on("page:perfil", () => {
  const el = document.getElementById("perfil-content");
  if (el && !el.innerHTML.trim()) renderPerfil();
});
