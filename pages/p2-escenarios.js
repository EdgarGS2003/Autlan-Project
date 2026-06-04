/**
 * pages/p2-escenarios.js — Escenarios & Inputs
 * Motor de supuestos macro · Alimenta todas las páginas
 * v2 — Sin sliders, tabla como única fuente de control
 */

function getSliderLabel(key, defaultLabel) {
  const keys = {
    usdmxn:    I18N.getLocale() === "en" ? "Exchange Rate (USD/MXN)" : "Tipo de cambio (USD/MXN)",
    precioMn:  I18N.t("p2.driver.mn"),
    precioOro: I18N.t("p2.driver.oro"),
    tiie28:    "TIIE 28d",
    sofr1m:    "SOFR 1m",
    precioGas: I18N.t("p2.driver.gas"),
    volPct:    I18N.getLocale() === "en" ? "Volume (%)" : "Volumen (%)",
  };
  return keys[key] || defaultLabel;
}

function getSliderSensitivity(key) {
  const sens = {
    usdmxn:    { es: "Cada $1 MXN de apreciación reduce ingresos ~USD 18M",           en: "Each $1 MXN appreciation reduces revenues ~USD 18M" },
    tiie28:    { es: "Cada 100bps sube costo financiero MXN ~USD 440K",               en: "Each 100bps rise increases MXN financial cost ~USD 440K" },
    sofr1m:    { es: "Cada 100bps sube costo financiero USD ~USD 1.35M",              en: "Each 100bps rise increases USD financial cost ~USD 1.35M" },
    precioOro: { es: "Cada USD 100/oz impacta ingresos Metallorum ~USD 0.7M",         en: "Each USD 100/oz impacts Metallorum revenues ~USD 0.7M" },
    precioMn:  { es: "Cada USD 100/MT impacta ingresos ferroaleaciones ~USD 5-8M",    en: "Each USD 100/MT impacts ferroalloy revenues ~USD 5-8M" },
    precioGas: { es: "Cada USD 1/MMBtu sube costos operativos ~USD 2-3M",             en: "Each USD 1/MMBtu rise increases operating costs ~USD 2-3M" },
    volPct:    { es: "Variación de ±15% sobre plan base de ingresos",                 en: "Variation of ±15% on base revenue plan" },
  };
  const loc = I18N.getLocale();
  return sens[key] ? sens[key][loc] : "";
}

// ─────────────────────────────────────────
// RENDER PRINCIPAL
// ─────────────────────────────────────────
function renderEscenarios() {
  const el = document.getElementById("escenarios-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-info mb-24">
      <span class="alert-icon">⚙</span>
      <span>${I18N.t("p2.alert")}</span>
    </div>

    <!-- TABLA DE ESCENARIOS — única fuente de control -->
    <div class="section-title">${I18N.t("p2.perScenario")}</div>
    <div class="card mb-24">
      <div class="table-wrap">
        <table id="esc-table">
          <thead>
            <tr>
              <th style="min-width:200px;">${I18N.t("p2.variable")}</th>
              <th class="esc-header-base" style="text-align:center;">${I18N.t("topbar.base")}</th>
              <th class="esc-header-opt"  style="text-align:center;">${I18N.t("topbar.optimista")}</th>
              <th class="esc-header-adv"  style="text-align:center;">${I18N.t("topbar.adverso")}</th>
              <th style="font-size:10px; color:var(--text-muted); font-weight:500; min-width:180px;">
                ${I18N.getLocale() === "en" ? "Sensitivity" : "Sensibilidad"}
              </th>
            </tr>
          </thead>
          <tbody id="esc-table-body"></tbody>
        </table>
      </div>

      <!-- Controles debajo de la tabla -->
      <div style="margin-top:14px; display:flex; align-items:center;
                  justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <span style="font-size:11px; color:var(--text-muted);">
          ${I18N.t("label.clickEdit")}
        </span>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="aplicarEscenario('base')"
                  style="color:var(--accent); border-color:var(--accent);">
            ◎ ${I18N.getLocale() === "en" ? "Apply Base to model" : "Aplicar Base al modelo"}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="aplicarEscenario('optimista')"
                  style="color:var(--success); border-color:var(--success);">
            ▲ ${I18N.getLocale() === "en" ? "Apply Optimistic" : "Aplicar Optimista"}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="aplicarEscenario('adverso')"
                  style="color:var(--danger); border-color:var(--danger);">
            ▼ ${I18N.getLocale() === "en" ? "Apply Adverse" : "Aplicar Adverso"}
          </button>
        </div>
      </div>
    </div>

    <!-- NARRATIVA POR ESCENARIO -->
    <div class="section-title">${I18N.t("p2.narrative")}</div>
    <div class="grid-3 mb-24" id="narrativa-container"></div>

    <!-- VARIABLES DEPENDIENTES -->
    <div class="section-title">${I18N.t("p2.dependent")}</div>
    <div class="card mb-24">
      <div class="grid-3" id="vars-dependientes"></div>
    </div>

    <!-- IMPACTO POR DRIVER -->
    <div class="section-title">${I18N.t("p2.ebitdaDecomp")}</div>
    <div class="card mb-24">
      <div id="impacto-drivers"></div>
    </div>

    <!-- BOTONES -->
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="resetEscenarios()">
        ${I18N.t("label.restore")}
      </button>
      <button class="btn btn-ghost" onclick="exportarSupuestosCSV()">
        ${I18N.t("label.export")}
      </button>
    </div>

  `;

  _renderEscTable();
  _renderNarrativa();
  _renderVarsDependientes();
  _renderImpactoDrivers();
  _escEnsureSubscribed();
}

// ─────────────────────────────────────────
// TABLA DE ESCENARIOS EDITABLE
// ─────────────────────────────────────────
function _renderEscTable() {
  const el = document.getElementById("esc-table-body");
  if (!el) return;

  const cfg   = Scenarios.SLIDER_CONFIG;
  const state = Scenarios.getState();

  el.innerHTML = Object.entries(cfg).map(([key, c]) => {
    const b    = state.escenarios.base[key];
    const o    = state.escenarios.optimista[key];
    const a    = state.escenarios.adverso[key];
    const label = getSliderLabel(key, c.label);
    const sens  = getSliderSensitivity(key);

    // Indicador visual de dirección optimista vs adverso
    const dirOpt = o > b ? "▲" : o < b ? "▼" : "—";
    const dirAdv = a > b ? "▲" : a < b ? "▼" : "—";

    return `
      <tr>
        <td style="font-size:12px; font-weight:500;">
          <span style="margin-right:6px;">${c.icono}</span>${label}
        </td>

        <td class="esc-base" style="text-align:center;">
          <span class="editable-val mono"
                onclick="editEscenarioVal('base','${key}','${c.unidad}')"
                title="${I18N.getLocale() === "en" ? "Click to edit" : "Clic para editar"}"
                style="cursor:pointer; padding:3px 10px; border-radius:4px;
                       display:inline-block; color:var(--accent);
                       background:rgba(91,45,142,0.06);
                       transition:background 0.15s;">
            ${c.formato(b)}
          </span>
        </td>

        <td class="esc-optimista" style="text-align:center;">
          <span class="editable-val mono"
                onclick="editEscenarioVal('optimista','${key}','${c.unidad}')"
                title="${I18N.getLocale() === "en" ? "Click to edit" : "Clic para editar"}"
                style="cursor:pointer; padding:3px 10px; border-radius:4px;
                       display:inline-block; color:var(--success);
                       background:rgba(45,125,78,0.06);
                       transition:background 0.15s;">
            ${dirOpt} ${c.formato(o)}
          </span>
        </td>

        <td class="esc-adverso" style="text-align:center;">
          <span class="editable-val mono"
                onclick="editEscenarioVal('adverso','${key}','${c.unidad}')"
                title="${I18N.getLocale() === "en" ? "Click to edit" : "Clic para editar"}"
                style="cursor:pointer; padding:3px 10px; border-radius:4px;
                       display:inline-block; color:var(--danger);
                       background:rgba(155,35,53,0.06);
                       transition:background 0.15s;">
            ${dirAdv} ${c.formato(a)}
          </span>
        </td>

        <td style="font-size:10.5px; color:var(--text-muted); line-height:1.4;">
          ${sens}
        </td>
      </tr>`;
  }).join("");
}

// Edición inline
window.editEscenarioVal = function(escenario, variable, unidad) {
  const state  = Scenarios.getState();
  const valAct = state.escenarios[escenario][variable];
  const cfg    = Scenarios.SLIDER_CONFIG[variable];
  const label  = getSliderLabel(variable, cfg.label);
  const isEn   = I18N.getLocale() === "en";

  const nuevo = prompt(
    `${escenario.toUpperCase()} · ${label}\n` +
    `${isEn ? "Unit" : "Unidad"}: ${unidad}\n` +
    `${isEn ? "Current value" : "Valor actual"}: ${cfg.formato(valAct)}\n\n` +
    `${isEn ? "Enter new value:" : "Ingresa el nuevo valor:"}`,
    valAct
  );

  if (nuevo === null || nuevo === "") return;
  const num = parseFloat(nuevo);
  if (isNaN(num)) { showToast(I18N.t("p2.invalidVal"), "error"); return; }

  Scenarios.setEscenarioVar(escenario, variable, num);
  _renderEscTable();
  _renderNarrativa();
  showToast(`${escenario} · ${label} → ${cfg.formato(num)}`, "success");
};

// ─────────────────────────────────────────
// APLICAR ESCENARIO AL MODELO
// ─────────────────────────────────────────
window.aplicarEscenario = function(escenario) {
  const esc = Scenarios.getState().escenarios[escenario];
  const cfg = Scenarios.SLIDER_CONFIG;
  for (const key of Object.keys(cfg)) {
    if (typeof esc[key] === "number") {
      Scenarios.setVar(key, esc[key], "escenario");
    }
  }
  const isEn = I18N.getLocale() === "en";
  showToast(
    isEn
      ? `Scenario "${escenario}" applied — dependent variables updated`
      : `Escenario "${escenario}" aplicado — variables dependientes actualizadas`,
    "success"
  );
};

// ─────────────────────────────────────────
// NARRATIVA
// ─────────────────────────────────────────
function _renderNarrativa() {
  const el = document.getElementById("narrativa-container");
  if (!el) return;

  const esc = Scenarios.getState().escenarios;
  const isEn = I18N.getLocale() === "en";

  const escenarios = [
    { key: "base",      label: I18N.t("p2.esc.base"),      color: "var(--accent)",  icon: "◎" },
    { key: "optimista", label: I18N.t("p2.esc.optimista"),  color: "var(--success)", icon: "▲" },
    { key: "adverso",   label: I18N.t("p2.esc.adverso"),    color: "var(--danger)",  icon: "▼" },
  ];

  el.innerHTML = escenarios.map(e => {
    const narrativa = esc[e.key].narrativa;
    const vars = Object.entries(Scenarios.SLIDER_CONFIG);

    return `
      <div class="card">
        <div class="card-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px; color:${e.color};">${e.icon}</span>
            <div class="card-title" style="color:${e.color};">${e.label}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="editNarrativa('${e.key}')">
            ${I18N.t("label.edit")}
          </button>
        </div>

        <div id="narrativa-${e.key}">
          ${vars.map(([key, cfg]) => {
            const vLabel = getSliderLabel(key, cfg.label);
            return `
              <div style="margin-bottom:10px; padding-bottom:10px;
                          border-bottom:1px solid var(--border);">
                <div style="font-size:10.5px; font-weight:600;
                            color:var(--text-muted); margin-bottom:3px;
                            text-transform:uppercase; letter-spacing:0.4px;">
                  ${cfg.icono} ${vLabel}
                </div>
                <div style="font-size:12px; color:var(--text-primary); line-height:1.5;">
                  ${narrativa[key] || "—"}
                </div>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");
}

window.editNarrativa = function(escenario) {
  const state = Scenarios.getState();
  const cfg   = Scenarios.SLIDER_CONFIG;
  const narr  = state.escenarios[escenario].narrativa;
  const isEn  = I18N.getLocale() === "en";

  for (const [key, c] of Object.entries(cfg)) {
    const actual = narr[key] || "";
    const label  = getSliderLabel(key, c.label);
    const nuevo  = prompt(
      isEn
        ? `${escenario.toUpperCase()} · Narrative: ${label}\n\nCurrent:\n${actual}\n\nNew text (Enter to keep):`
        : `${escenario.toUpperCase()} · Narrativa: ${label}\n\nActual:\n${actual}\n\nNueva narrativa (Enter para mantener):`,
      actual
    );
    if (nuevo !== null && nuevo !== actual) {
      Scenarios.setNarrativa(escenario, key, nuevo);
    }
  }

  _renderNarrativa();
  showToast(
    isEn ? `Narrative for "${escenario}" updated` : `Narrativa "${escenario}" actualizada`,
    "success"
  );
};

// ─────────────────────────────────────────
// VARIABLES DEPENDIENTES
// ─────────────────────────────────────────
function _renderVarsDependientes() {
  const el = document.getElementById("vars-dependientes");
  if (!el) return;

  const cache  = Scenarios.getCache();
  const actual = cache.actual;
  if (!actual) return;

  const vars = Scenarios.getState().vars;
  const fmt  = Scenarios.fmt;

  // Ingresos: usar impactos del modelo para consistencia
  const ingresosEst = 322746
    + (actual.impactos.fx  || 0)
    + (actual.impactos.mn  || 0)
    + (actual.impactos.oro || 0);
  const costoFinEst = actual.resultados.gastoFin;
  const ebitdaEst   = actual.resultados.ebitda;
  const fcfEst      = actual.resultados.fcf;
  const dscrEst     = actual.resultados.dscr;
  const margenEst   = parseFloat(actual.resultados.margenEbitda);
  const isEn        = I18N.getLocale() === "en";

  const items = [
    {
      label: I18N.t("p2.dep.revenues"),
      val:   fmt.usd(ingresosEst),
      sub:   I18N.t("p2.dep.revenues.sub"),
      tipo:  ingresosEst > 322746 ? "success" : "warn",
    },
    {
      label: I18N.t("p2.dep.finexp"),
      val:   fmt.usd(costoFinEst),
      sub:   I18N.t("p2.dep.finexp.sub"),
      tipo:  costoFinEst > 42493 ? "danger" : "success",
    },
    {
      label: I18N.t("p2.dep.ebitda"),
      val:   fmt.usd(ebitdaEst),
      sub:   `${isEn ? "Margin" : "Margen"} ${margenEst}%`,
      tipo:  ebitdaEst > 30000 ? "success" : ebitdaEst > 0 ? "warn" : "danger",
    },
    {
      label: I18N.t("p2.dep.fcf"),
      val:   fmt.usd(fcfEst),
      sub:   I18N.t("p2.dep.fcf.sub"),
      tipo:  fcfEst > 0 ? "success" : "danger",
    },
    {
      label: I18N.t("p2.dep.dscr"),
      val:   `${dscrEst.toFixed(2)}x`,
      sub:   I18N.t("p2.dep.dscr.sub"),
      tipo:  dscrEst >= 1 ? "success" : dscrEst >= 0.6 ? "warn" : "danger",
    },
    {
      label: I18N.t("p2.dep.tiie"),
      val:   fmt.tasa(vars.tiie28),
      sub:   I18N.t("p2.dep.tiie.sub"),
      tipo:  vars.tiie28 < 8.75 ? "warn" : "success",
    },
  ];

  el.innerHTML = items.map(i => `
    <div style="padding:14px; border-right:1px solid var(--border);
                border-bottom:1px solid var(--border);">
      <div style="font-size:10.5px; font-weight:600; color:var(--text-muted);
                  text-transform:uppercase; letter-spacing:0.4px; margin-bottom:6px;">
        ${i.label}
      </div>
      <div style="font-size:18px; font-weight:700; font-family:var(--font-mono);
                  color:${i.tipo === "success" ? "var(--success)"
                        : i.tipo === "danger"  ? "var(--danger)"
                        : i.tipo === "warn"    ? "var(--warn)"
                        : "var(--text-primary)"};">
        ${i.val}
      </div>
      <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
        ${i.sub}
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// DESCOMPOSICIÓN DE IMPACTO
// ─────────────────────────────────────────
function _renderImpactoDrivers() {
  const el = document.getElementById("impacto-drivers");
  if (!el) return;

  const cache  = Scenarios.getCache();
  const actual = cache.actual;
  if (!actual) return;

  const imp     = actual.impactos;
  const fmt     = Scenarios.fmt;
  const ebitda  = actual.resultados.ebitda;
  const isEn    = I18N.getLocale() === "en";

  const drivers = [
    { label: I18N.t("p2.driver.fx"),   val: imp.fx,      key: "fx"  },
    { label: I18N.t("p2.driver.mn"),   val: imp.mn,      key: "mn"  },
    { label: I18N.t("p2.driver.oro"),  val: imp.oro,     key: "oro" },
    { label: I18N.t("p2.driver.tiie"), val: imp.tiie,    key: "tiie"},
    { label: I18N.t("p2.driver.sofr"), val: imp.sofr,    key: "sofr"},
    { label: I18N.t("p2.driver.gas"),  val: imp.gas,     key: "gas" },
    { label: I18N.t("p2.driver.vol"),  val: imp.volumen, key: "vol" },
  ];

  const maxAbs = Math.max(...drivers.map(d => Math.abs(d.val)), 1);

  el.innerHTML = `
    <div style="margin-bottom:8px; font-size:11.5px; color:var(--text-muted);">
      ${I18N.t("p2.impact.sub")} (${fmt.usd(ebitda)})
      ${I18N.t("p2.impact.given")}
    </div>

    ${drivers.map(d => {
      const pct      = Math.abs(d.val) / maxAbs * 100;
      const positivo = d.val >= 0;
      const color    = positivo ? "var(--success-mid)" : "var(--danger-mid)";
      const label    = positivo ? `+${fmt.usd(d.val)}` : fmt.usd(d.val);

      return `
        <div style="margin-bottom:10px;">
          <div class="flex-between" style="margin-bottom:4px;">
            <span style="font-size:12px;">${d.label}</span>
            <span class="mono" style="font-size:12px; font-weight:600; color:${color};">
              ${label}
            </span>
          </div>
          <div style="height:8px; background:var(--bg-raised); border-radius:4px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${color};
                        border-radius:4px; transition:width 0.3s ease;"></div>
          </div>
        </div>`;
    }).join("")}

    <div class="divider"></div>
    <div class="flex-between">
      <span style="font-size:12.5px; font-weight:700;">
        ${I18N.t("p2.impact.total")}
      </span>
      <span class="mono" style="font-size:14px; font-weight:700;
            color:${imp.total >= 0 ? "var(--success)" : "var(--danger)"};">
        ${imp.total >= 0 ? "+" : ""}${fmt.usd(imp.total)}
      </span>
    </div>
    <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
      ${I18N.t("p2.impact.adj")}
      <strong>${fmt.usd(ebitda)}</strong>
    </div>
  `;
}

// ─────────────────────────────────────────
// ACCIONES
// ─────────────────────────────────────────
window.resetEscenarios = function() {
  if (!confirm(I18N.t("p2.resetConfirm"))) return;

  // Usar valores base del escenario como referencia
  const defaults = Scenarios.getState().escenarios.base;
  for (const [key, val] of Object.entries(defaults)) {
    if (typeof val === "number" && Scenarios.SLIDER_CONFIG[key]) {
      Scenarios.setVar(key, val, "reset");
    }
  }

  showToast(I18N.t("p2.saved"), "success");
};

window.exportarSupuestosCSV = function() {
  const data = Scenarios.exportarSupuestos();
  const isEn = I18N.getLocale() === "en";

  const headers = isEn
    ? "Variable,Unit,Base,Optimistic,Adverse\n"
    : "Variable,Unidad,Base,Optimista,Adverso\n";

  let csv = headers;
  data.supuestos.forEach(s => {
    csv += `"${s.variable}","${s.unidad}","${s.base}","${s.optimista}","${s.adverso}"\n`;
  });

  if (data.overrides?.length) {
    csv += isEn ? "\nAudited Data Overrides\n" : "\nOverrides de datos auditados\n";
    csv += isEn
      ? "Field,Original,Override,Justification,Date\n"
      : "Campo,Original,Override,Justificación,Fecha\n";
    data.overrides.forEach(o => {
      csv += `"${o.campo}","${o.original}","${o.override}","${o.justificacion}","${o.fecha}"\n`;
    });
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `autlan-supuestos-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(I18N.t("p2.csvExported"), "success");
};

// ─────────────────────────────────────────
// SUSCRIPCIONES — una sola vez
// ─────────────────────────────────────────
let _escSubscribed = false;
function _escEnsureSubscribed() {
  if (_escSubscribed) return;
  _escSubscribed = true;
  Scenarios.on("calc:update",       _renderVarsDependientes);
  Scenarios.on("calc:update",       _renderImpactoDrivers);
  Scenarios.on("escenarios:update", _renderEscTable);
  Scenarios.on("escenarios:update", _renderNarrativa);
}

// Lazy render
Scenarios.on("page:escenarios", () => {
  const el = document.getElementById("escenarios-content");
  if (el && !el.innerHTML.trim()) renderEscenarios();
});
