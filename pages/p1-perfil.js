/**
 * pages/p1-perfil.js — Perfil Financiero Autlán
 * Datos auditados XBRL 4T25 y 1T26 · BMV
 */

function renderPerfil() {
  const el = document.getElementById("perfil-content");
  if (!el) return;

  el.innerHTML = `

    <!-- ALERTA DATOS AUDITADOS -->
    <div class="alert alert-info mb-24">
      <span class="alert-icon">🔒</span>
      <span>Datos precargados desde <strong>XBRL 4T25 y 1T26 BMV</strong> — auditados bajo IFRS.
      Para sobreescribir un valor, haz clic en <strong>Editar</strong> e ingresa la justificación.</span>
    </div>

    <!-- KPIs PRINCIPALES -->
    <div class="section-title">Resultados financieros clave</div>
    <div class="grid-4 mb-24">

      <div class="kpi-card accent">
        <div class="kpi-label">Ingresos 2025</div>
        <div class="kpi-value">USD 322.7M</div>
        <div class="kpi-sub">+3.1% vs 2024 · USD 312.9M</div>
      </div>

      <div class="kpi-card warn">
        <div class="kpi-label">EBITDA 2025</div>
        <div class="kpi-value">USD 31.5M</div>
        <div class="kpi-sub">Margen 9.7% · Pico 38% en 2022</div>
      </div>

      <div class="kpi-card danger">
        <div class="kpi-label">Pérdida neta 2025</div>
        <div class="kpi-value" style="color:var(--danger);">-USD 37.8M</div>
        <div class="kpi-sub">Gasto financiero USD 42.5M</div>
      </div>

      <div class="kpi-card success">
        <div class="kpi-label">Ingresos 1T26</div>
        <div class="kpi-value">USD 98.4M</div>
        <div class="kpi-sub">+23% vs 1T25 · Récord trimestral</div>
      </div>

    </div>

    <!-- ESTADO DE RESULTADOS COMPARATIVO -->
    <div class="section-title">Estado de resultados comparativo</div>
    <div class="table-wrap mb-24">
      <table>
        <thead>
          <tr>
            <th>Concepto (USD miles)</th>
            <th style="text-align:right;">2024</th>
            <th style="text-align:right;">2025 Anual</th>
            <th style="text-align:right;">1T25</th>
            <th style="text-align:right;">1T26</th>
            <th style="text-align:right;">Var YoY</th>
          </tr>
        </thead>
        <tbody>
          ${_filaResultados("Ingresos netos", 312872, 322746, 80135, 98386, true)}
          ${_filaResultados("Costo de ventas", 252213, 271309, 67449, 83463, false, true)}
          ${_filaResultados("Utilidad bruta", 60659, 51437, 12686, 14923, true)}
          ${_filaResultados("Gastos de venta", 12649, 15912, 3101, 5905, false, true)}
          ${_filaResultados("Gastos de administración", 36523, 37714, 9301, 10656, false, true)}
          ${_filaResultados("Utilidad (pérdida) operación", 5262, -4094, -1084, 170, true)}
          ${_filaResultados("Gastos financieros", 31881, 42493, 7654, 7318, false, true)}
          ${_filaResultados("Pérdida neta", -12025, -37773, -7632, -5976, true)}
        </tbody>
      </table>
    </div>

    <!-- BALANCE Y DEUDA -->
    <div class="grid-2 mb-24">

      <!-- Balance resumido -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Balance general · 31 mar 2026</div>
            <div class="card-sub">XBRL 1T26 · cifras en USD miles</div>
          </div>
          <span class="badge badge-accent">Auditado</span>
        </div>

        <div class="section-title" style="margin-top:0;">Activos</div>
        ${_filaBalance("Efectivo y equivalentes", 21801, "success")}
        ${_filaBalance("Cuentas por cobrar", 52387)}
        ${_filaBalance("Inventarios", 88033)}
        ${_filaBalance("Otros circulantes", 55390)}
        ${_filaBalance("Total activo circulante", 217611, "accent", true)}
        ${_filaBalance("Propiedades, planta y equipo", 235302)}
        ${_filaBalance("Intangibles y crédito mercantil", 79708)}
        ${_filaBalance("Total activo no circulante", 410253, "accent", true)}
        ${_filaBalance("TOTAL ACTIVOS", 627864, "accent", true, true)}

        <div class="divider"></div>
        <div class="section-title">Pasivos y capital</div>
        ${_filaBalance("Pasivos circulantes", 158053, "danger")}
        ${_filaBalance("Deuda largo plazo", 168227, "danger")}
        ${_filaBalance("Otras provisiones LP", 69349)}
        ${_filaBalance("Total pasivos", 395593, "danger", true)}
        ${_filaBalance("Capital contable total", 232271, "success", true, true)}
      </div>

      <!-- Métricas y ratings -->
      <div>
        <div class="card mb-16">
          <div class="card-header">
            <div class="card-title">Métricas de crédito</div>
            <span class="badge badge-warn">Outlook Negativo</span>
          </div>

          ${_filaMetrica("Leverage (Deuda/Activos)", "63.0%", "danger")}
          ${_filaMetrica("Deuda neta", "USD 164.1M", "warn")}
          ${_filaMetrica("DSCR proyectado 2026-28", "0.6x", "danger")}
          ${_filaMetrica("Gasto financiero anual", "USD 42.5M", "warn")}
          ${_filaMetrica("Efectivo disponible", "USD 21.8M", "warn")}
          ${_filaMetrica("Deuda / EBITDA", "5.9x", "danger")}

          <div class="divider"></div>
          <div class="section-title">Calificaciones crediticias</div>
          <div class="grid-3" style="gap:8px; margin-top:8px;">
            ${_ratingCard("HR Ratings", "A-", "Negativa")}
            ${_ratingCard("Fitch", "BBB+", "Negativa")}
            ${_ratingCard("PCR Verum", "A-/M", "Negativa")}
          </div>
        </div>

        <!-- Segmentos -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Segmentos de negocio · 2025</div>
            <span class="badge badge-accent">USD 322.7M total</span>
          </div>

          ${_filaSegmento("Ferroaleaciones & Mn", 289000, 89.6, "var(--mn-brown)")}
          ${_filaSegmento("EMD (batería/industrial)", 28000, 8.7, "var(--accent-mid)")}
          ${_filaSegmento("Metallorum (oro)", 5000, 1.5, "var(--gold)")}
          ${_filaSegmento("Energía (intra-segmento)", 2800, 0.9, "var(--success-mid)")}

          <div class="alert alert-info mt-12" style="margin-top:12px;">
            <span class="alert-icon">📈</span>
            <span style="font-size:11.5px;">
              Metallorum duplicó producción en 1T26. Meta: 15% de ingresos totales para 2028.
              Oro en USD 3,000+/oz — sin cobertura activa.
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- DEUDA DETALLADA -->
    <div class="section-title">Estructura de deuda detallada · 1T26</div>
    <div class="table-wrap mb-24">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Acreedor</th>
            <th>Tasa</th>
            <th>Moneda</th>
            <th style="text-align:right;">Vencimiento</th>
            <th style="text-align:right;">Saldo (USD K)</th>
            <th>Riesgo</th>
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
            <td colspan="5" style="font-size:12px;">TOTAL DEUDA</td>
            <td class="mono" style="text-align:right;">
              ${AUTLAN.deuda.resumenTasa.total.saldo.toLocaleString()}
            </td>
            <td>
              <span class="badge badge-warn">
                ${(AUTLAN.deuda.resumenTasa.sofr_usd.pct +
                   AUTLAN.deuda.resumenTasa.tiie_mxn.pct +
                   AUTLAN.deuda.resumenTasa.euribor_eur.pct).toFixed(0)}% variable
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- DERIVADOS VIGENTES -->
    <div class="section-title">Instrumentos derivados vigentes · 1T26</div>
    <div class="grid-2 mb-24">

      <!-- Collar TIIE -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Collar TIIE — Tasa de interés</div>
            <div class="card-sub">CEM (subsidiaria) · Vence jun-2028</div>
          </div>
          <span class="badge badge-warn">FUERA DEL DINERO</span>
        </div>

        ${_filaMetrica("Instrumento", "Collar sin costo (cap + floor)")}
        ${_filaMetrica("Subyacente", "TIIEF (TIIE 28 días)")}
        ${_filaMetrica("Nocional", "MXN 157.6M (50% deuda TIIE CEM)")}
        ${_filaMetrica("Floor (cap largo)", "8.75% — compra opción")}
        ${_filaMetrica("Cap (floor corto)", "11.00% — vende opción")}
        ${_filaMetrica("TIIE actual", "7.10% — debajo del floor", "danger")}
        ${_filaMetrica("Vencimiento", "23-jun-2028 · mensual")}
        ${_filaMetrica("Pérdida acumulada", "USD 45.6K (11 cupones)", "danger")}
        ${_filaMetrica("Minusvalía 1T26", "USD 31.5K", "warn")}

        <div class="alert alert-warn" style="margin-top:12px;">
          <span class="alert-icon">⚠</span>
          <span style="font-size:11.5px;">
            TIIE actual (7.10%) por debajo del floor (8.75%) — el collar no se ejerce.
            La empresa paga la tasa de mercado completa más prima sin beneficio activo.
          </span>
        </div>
      </div>

      <!-- Collares FX -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Collares USD/MXN — Tipo de cambio</div>
            <div class="card-sub">4 collares · Vencen jun-2026</div>
          </div>
          <span class="badge badge-danger">SOLO 3% CUBIERTO</span>
        </div>

        <div class="table-wrap" style="margin-bottom:12px;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Floor (put)</th>
                <th>Cap (call)</th>
                <th>Nocional/mes</th>
                <th>Vencimiento</th>
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

        ${_filaMetrica("Nocional total activo", "USD 12M (4 meses × USD 1M/mes × 3)")}
        ${_filaMetrica("Ingresos anualizados", "~USD 394M")}
        ${_filaMetrica("% cubierto actualmente", "~3% — CRÍTICO", "danger")}
        ${_filaMetrica("Límite de política", "60% de ingresos USD")}
        ${_filaMetrica("Gap sin protección", "~57 pp disponibles de política", "warn")}

        <div class="alert alert-danger" style="margin-top:12px;">
          <span class="alert-icon">🚨</span>
          <span style="font-size:11.5px;">
            Cobertura FX activa cubre solo ~3% de exposición vs 60% permitido por política.
            Con USD/MXN actual en 17.20, cada peso de apreciación reduce ingresos ~USD 18M.
          </span>
        </div>
      </div>

    </div>

    <!-- NOTA DE DATOS -->
    <div style="font-size:11px; color:var(--text-muted); padding:12px 16px;
                background:var(--bg-raised); border-radius:var(--radius-md);">
      📋 Fuentes: XBRL 4T25 BMV (31-dic-2025) · XBRL 1T26 BMV (31-mar-2026) ·
      HR Ratings Dic-2025 · Section 1 Analysis.
      Cifras en USD miles salvo indicación. Tipos de cambio según reportes originales IFRS.
    </div>
  `;
}

// ─────────────────────────────────────────
// HELPERS DE RENDERIZADO
// ─────────────────────────────────────────

function _filaResultados(label, v2024, v2025, v1t25, v1t26, highlight = false, costoDir = false) {
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

  return `
    <tr style="${highlight ? "font-weight:700; background:var(--bg-raised);" : ""}">
      <td style="font-size:12.5px;">${label}</td>
      <td class="mono" style="text-align:right; color:var(--text-secondary);">
        ${fmt(v2024)}
      </td>
      <td class="mono" style="text-align:right; ${v2025 < 0 ? "color:var(--danger);" : ""}">
        ${fmt(v2025)}
      </td>
      <td class="mono" style="text-align:right; color:var(--text-secondary);">
        ${fmt(v1t25)}
      </td>
      <td class="mono" style="text-align:right; ${v1t26 < 0 ? "color:var(--danger);" : ""}">
        ${fmt(v1t26)}
      </td>
      <td class="mono ${claseVar}" style="text-align:right;">
        ${signVar}${varYoy.toFixed(1)}%
      </td>
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

function _filaMetrica(label, valor, tipo = "") {
  const colorMap = {
    success: "var(--success)",
    danger:  "var(--danger)",
    warn:    "var(--warn)",
    "":      "var(--text-primary)",
  };

  return `
    <div class="flex-between" style="padding:5px 0;
                border-bottom:1px solid var(--border);">
      <span style="font-size:11.5px; color:var(--text-secondary);">${label}</span>
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