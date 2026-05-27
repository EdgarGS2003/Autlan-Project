/**
 * pages/p2-escenarios.js — Escenarios & Inputs
 * Motor de supuestos macro · Alimenta todas las páginas
 */

function getSliderLabel(key, defaultLabel) {
  const keys = {
    usdmxn: I18N.getLocale() === "en" ? "Exchange rate (USD/MXN)" : "Tipo de cambio (USD/MXN)",
    precioMn: I18N.t("p2.driver.mn"),
    precioOro: I18N.t("p2.driver.oro"),
    tiie28: "TIIE 28d",
    sofr1m: "SOFR 1m",
    precioGas: I18N.t("p2.driver.gas"),
    volPct: I18N.getLocale() === "en" ? "Volume" : "Volumen",
  };
  return keys[key] || defaultLabel;
}

function getSliderSensitivity(key, defaultSens) {
  const sens = {
    usdmxn: {
      es: "Cada $1 MXN de apreciación reduce ingresos ~USD 18M",
      en: "Each $1 MXN appreciation reduces revenues by ~USD 18M",
    },
    tiie28: {
      es: "Cada 100bps sube costo financiero MXN ~USD 440K",
      en: "Each 100bps rise increases MXN financial cost by ~USD 440K",
    },
    sofr1m: {
      es: "Cada 100bps sube costo financiero USD ~USD 1.35M",
      en: "Each 100bps rise increases USD financial cost by ~USD 1.35M",
    },
    precioOro: {
      es: "Cada USD 100/oz impacta ingresos Metallorum ~USD 1.5-2M",
      en: "Each USD 100/oz shift impacts Metallorum revenues by ~USD 1.5-2M",
    },
    precioMn: {
      es: "Cada USD 100/MT impacta ingresos ferroaleaciones ~USD 5-8M",
      en: "Each USD 100/MT shift impacts ferroalloy revenues by ~USD 5-8M",
    },
    precioGas: {
      es: "Cada USD 1/MMBtu sube costos operativos ~USD 2-3M",
      en: "Each USD 1/MMBtu rise increases operating costs by ~USD 2-3M",
    },
    volPct: {
      es: "Variación de ±15% sobre plan base de ingresos",
      en: "Variation of ±15% on the base revenue plan",
    },
  };
  return sens[key] ? sens[key][I18N.getLocale()] : defaultSens;
}

function renderEscenarios() {
  const el = document.getElementById("escenarios-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-info mb-24">
      <span class="alert-icon">⚙</span>
      <span>
        ${I18N.t("p2.alert")}
      </span>
    </div>

    <!-- VARIABLES INDEPENDIENTES — SLIDERS -->
    <div class="grid-2 mb-24">

      <!-- COLUMNA IZQ: Sliders -->
      <div>
        <div class="section-title">${I18N.t("p2.independent")}</div>
        <div class="card" id="sliders-container"></div>
      </div>

      <!-- COLUMNA DER: Tabla de escenarios editable -->
      <div>
        <div class="section-title">${I18N.t("p2.perScenario")}</div>
        <div class="card">
          <div class="table-wrap">
            <table id="esc-table">
              <thead>
                <tr>
                  <th>${I18N.t("p2.variable")}</th>
                  <th class="esc-header-base">${I18N.t("topbar.base")}</th>
                  <th class="esc-header-opt">${I18N.t("topbar.optimista")}</th>
                  <th class="esc-header-adv">${I18N.t("topbar.adverso")}</th>
                </tr>
              </thead>
              <tbody id="esc-table-body"></tbody>
            </table>
          </div>
          <div style="margin-top:12px; font-size:11px; color:var(--text-muted);">
            ${I18N.t("label.clickEdit")}
          </div>
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

  _renderSliders();
  _renderEscTable();
  _renderNarrativa();
  _renderVarsDependientes();
  _renderImpactoDrivers();

  // Suscripciones
  Scenarios.on("calc:update",       _renderVarsDependientes);
  Scenarios.on("calc:update",       _renderImpactoDrivers);
  Scenarios.on("escenarios:update", _renderEscTable);
}

// ─────────────────────────────────────────
// SLIDERS
// ─────────────────────────────────────────
function _renderSliders() {
  const el = document.getElementById("sliders-container");
  if (!el) return;

  const cfg   = Scenarios.SLIDER_CONFIG;
  const state = Scenarios.getState();

  el.innerHTML = Object.entries(cfg).map(([key, c]) => {
    const val    = state.vars[key];
    const pct    = ((val - c.min) / (c.max - c.min) * 100).toFixed(1);
    const label  = getSliderLabel(key, c.label);
    const sens   = getSliderSensitivity(key, c.sensibilidad);

    return `
      <div class="slider-group" id="sg-${key}">
        <div class="slider-header">
          <div class="slider-label">
            <span>${c.icono}</span>
            <span>${label}</span>
          </div>
          <div class="slider-value" id="sv-${key}">${c.formato(val)}</div>
        </div>

        <div style="position:relative;">
          <div class="slider-track">
            <div class="slider-fill" id="sf-${key}"
                 style="width:${pct}%; background:${c.color};"></div>
          </div>
          <input type="range"
            id="slider-${key}"
            min="${c.min}" max="${c.max}" step="${c.step}"
            value="${val}"
            style="position:absolute; top:-2px; left:0;
                   width:100%; opacity:0; height:10px; cursor:pointer;"
            oninput="onSliderChange('${key}', this.value)"
          />
        </div>

        <div class="slider-range">
          <span>${c.formato(c.min)}</span>
          <span>${c.formato(c.max)}</span>
        </div>

        <!-- Marcadores de escenarios -->
        <div style="position:relative; height:16px; margin-top:2px;">
          ${_escenarioMarkers(key, c)}
        </div>

        <div class="slider-sensitivity">${sens}</div>
      </div>
    `;
  }).join("<div class='divider'></div>");
}

function _escenarioMarkers(key, c) {
  const esc = Scenarios.getState().escenarios;
  const markers = [
    { nombre: "B", val: esc.base[key],      color: "var(--accent)"   },
    { nombre: "O", val: esc.optimista[key], color: "var(--success)"  },
    { nombre: "A", val: esc.adverso[key],   color: "var(--danger)"   },
  ];

  return markers.map(m => {
    if (typeof m.val !== "number") return "";
    const pct = ((m.val - c.min) / (c.max - c.min) * 100);
    const clamped = Math.min(Math.max(pct, 2), 96);
    return `
      <div style="position:absolute; left:${clamped}%;
                  transform:translateX(-50%);
                  font-size:9px; font-weight:700;
                  color:${m.color}; line-height:1;">
        ${m.nombre}
      </div>`;
  }).join("");
}

// Callback del slider
window.onSliderChange = function(key, val) {
  const cfg   = Scenarios.SLIDER_CONFIG[key];
  const num   = parseFloat(val);

  // Actualizar visual
  const pct = ((num - cfg.min) / (cfg.max - cfg.min) * 100).toFixed(1);
  const svEl = document.getElementById(`sv-${key}`);
  const sfEl = document.getElementById(`sf-${key}`);
  if (svEl) svEl.textContent = cfg.formato(num);
  if (sfEl) sfEl.style.width = `${pct}%`;

  // Propagar al estado global
  Scenarios.setVar(key, num, "slider");

  // Actualizar topbar
  if (key === "usdmxn") {
    const el = document.getElementById("tc-live");
    if (el) el.textContent = `$${num.toFixed(2)}`;
  }
};

// ─────────────────────────────────────────
// TABLA DE ESCENARIOS EDITABLE
// ─────────────────────────────────────────
function _renderEscTable() {
  const el = document.getElementById("esc-table-body");
  if (!el) return;

  const cfg   = Scenarios.SLIDER_CONFIG;
  const state = Scenarios.getState();

  el.innerHTML = Object.entries(cfg).map(([key, c]) => {
    const b = state.escenarios.base[key];
    const o = state.escenarios.optimista[key];
    const a = state.escenarios.adverso[key];
    const label = getSliderLabel(key, c.label);

    return `
      <tr>
        <td style="font-size:11.5px;">
          <span>${c.icono}</span> ${label}
        </td>
        <td class="esc-base">
          <span class="editable-val mono"
                onclick="editEscenarioVal('base','${key}','${c.unidad}')"
                title="Clic para editar"
                style="cursor:pointer; padding:2px 6px;
                       border-radius:4px; display:inline-block;
                       color:var(--accent);">
            ${c.formato(b)}
          </span>
        </td>
        <td class="esc-optimista">
          <span class="editable-val mono"
                onclick="editEscenarioVal('optimista','${key}','${c.unidad}')"
                title="Clic para editar"
                style="cursor:pointer; padding:2px 6px;
                       border-radius:4px; display:inline-block;
                       color:var(--success);">
            ${c.formato(o)}
          </span>
        </td>
        <td class="esc-adverso">
          <span class="editable-val mono"
                onclick="editEscenarioVal('adverso','${key}','${c.unidad}')"
                title="Clic para editar"
                style="cursor:pointer; padding:2px 6px;
                       border-radius:4px; display:inline-block;
                       color:var(--danger);">
            ${c.formato(a)}
          </span>
        </td>
      </tr>`;
  }).join("");
}

// Edición inline de valores de escenario
window.editEscenarioVal = function(escenario, variable, unidad) {
  const state   = Scenarios.getState();
  const valAct  = state.escenarios[escenario][variable];
  const cfg     = Scenarios.SLIDER_CONFIG[variable];
  const label   = getSliderLabel(variable, cfg.label);

  const nuevo = prompt(
    `${escenario.toUpperCase()} · ${label}\n` +
    `${I18N.getLocale() === "en" ? "Unit" : "Unidad"}: ${unidad}\n` +
    `${I18N.getLocale() === "en" ? "Current value" : "Valor actual"}: ${cfg.formato(valAct)}\n\n` +
    `${I18N.getLocale() === "en" ? "Enter the new value:" : "Ingresa el nuevo valor:"}`,
    valAct
  );

  if (nuevo === null || nuevo === "") return;
  const num = parseFloat(nuevo);
  if (isNaN(num)) { showToast(I18N.t("p2.invalidVal"), "error"); return; }

  Scenarios.setEscenarioVar(escenario, variable, num);
  _renderEscTable();
  showToast(`${escenario} · ${label} → ${cfg.formato(num)}`, "success");
};

// ─────────────────────────────────────────
// NARRATIVA
// ─────────────────────────────────────────
function _renderNarrativa() {
  const el  = document.getElementById("narrativa-container");
  if (!el) return;

  const esc = Scenarios.getState().escenarios;

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
          <button class="btn btn-ghost btn-sm"
                  onclick="editNarrativa('${e.key}')">
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
              </div>
            `;
          }).join("")}
        </div>
      </div>`;
  }).join("");
}

window.editNarrativa = function(escenario) {
  const state = Scenarios.getState();
  const cfg   = Scenarios.SLIDER_CONFIG;
  const narr  = state.escenarios[escenario].narrativa;

  // Editar variable por variable
  for (const [key, c] of Object.entries(cfg)) {
    const actual = narr[key] || "";
    const label = getSliderLabel(key, c.label);
    const nuevo  = prompt(
      I18N.getLocale() === "en"
        ? `${escenario.toUpperCase()} · Narrative: ${label}\n\nCurrent text:\n${actual}\n\nNew narrative (Enter to keep):`
        : `${escenario.toUpperCase()} · Narrativa: ${label}\n\nTexto actual:\n${actual}\n\nNueva narrativa (Enter para mantener):`,
      actual
    );
    if (nuevo !== null && nuevo !== actual) {
      Scenarios.setNarrativa(escenario, key, nuevo);
    }
  }

  _renderNarrativa();
  showToast(I18N.getLocale() === "en" ? `Narrative for ${escenario} updated` : `Narrativa ${escenario} actualizada`, "success");
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

  const vars   = Scenarios.getState().vars;
  const fmt    = Scenarios.fmt;

  // Calcular variables dependientes
  const ingresosEst   = 322746 * (1 + (vars.usdmxn - 18.0) / 18.0 * 0.85)
                               * (vars.volPct / 100);
  const costoFinEst   = 42493  + (vars.sofr1m - 4.30) / 100 * 135479
                               + (vars.tiie28 - 7.10) / 100 * 29747;
  const ebitdaEst     = actual.resultados.ebitda;
  const fcfEst        = actual.resultados.fcf;
  const dscrEst       = actual.resultados.dscr;
  const margenEst     = parseFloat(actual.resultados.margenEbitda);

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
      sub:   `${I18N.getLocale() === "en" ? "Margin" : "Margen"} ${margenEst}%`,
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
                  color:var(--text-${i.tipo === "success" ? "primary" : i.tipo});">
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

  const imp = actual.impactos;
  const fmt = Scenarios.fmt;

  const drivers = [
    { label: I18N.t("p2.driver.fx"), val: imp.fx,     key: "fx"  },
    { label: I18N.t("p2.driver.mn"),    val: imp.mn,     key: "mn"  },
    { label: I18N.t("p2.driver.oro"),          val: imp.oro,    key: "oro" },
    { label: I18N.t("p2.driver.tiie"),           val: imp.tiie,   key: "tiie"},
    { label: I18N.t("p2.driver.sofr"),          val: imp.sofr,   key: "sofr"},
    { label: I18N.t("p2.driver.gas"),          val: imp.gas,    key: "gas" },
    { label: I18N.t("p2.driver.vol"),             val: imp.volumen,key: "vol" },
  ];

  const maxAbs = Math.max(...drivers.map(d => Math.abs(d.val)), 1);

  el.innerHTML = `
    <div style="margin-bottom:8px; font-size:11.5px; color:var(--text-muted);">
      ${I18N.t("p2.impact.sub")} (USD ${(31470/1000).toFixed(1)}M) 
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
            <span class="mono" style="font-size:12px; font-weight:600;
                  color:${color};">
              ${label}
            </span>
          </div>
          <div style="height:8px; background:var(--bg-raised);
                      border-radius:4px; overflow:hidden;">
            <div style="width:${pct}%; height:100%;
                        background:${color}; border-radius:4px;
                        transition:width 0.3s ease;">
            </div>
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
      <strong>${fmt.usd(31470 + imp.total)}</strong>
    </div>
  `;
}

// ─────────────────────────────────────────
// ACCIONES
// ─────────────────────────────────────────
window.resetEscenarios = function() {
  if (!confirm(I18N.t("p2.resetConfirm"))) return;

  // Restaurar variables actuales
  const defaults = {
    usdmxn: 17.20, tiie28: 7.10, sofr1m: 4.30,
    precioOro: 3000, precioMn: 1309, precioGas: 3.20, volPct: 100,
  };

  for (const [key, val] of Object.entries(defaults)) {
    Scenarios.setVar(key, val, "reset");
    const sliderEl = document.getElementById(`slider-${key}`);
    if (sliderEl) sliderEl.value = val;
    const cfg = Scenarios.SLIDER_CONFIG[key];
    const svEl = document.getElementById(`sv-${key}`);
    const sfEl = document.getElementById(`sf-${key}`);
    const pct  = ((val - cfg.min) / (cfg.max - cfg.min) * 100).toFixed(1);
    if (svEl) svEl.textContent = cfg.formato(val);
    if (sfEl) sfEl.style.width = `${pct}%`;
  }

  showToast(I18N.t("p2.saved"), "success");
};

window.exportarSupuestosCSV = function() {
  const data = Scenarios.exportarSupuestos();
  const cfg  = Scenarios.SLIDER_CONFIG;

  const headers = I18N.getLocale() === "en"
    ? "Variable,Unit,Actual,Base,Optimistic,Adverse\n"
    : "Variable,Unidad,Actual,Base,Optimista,Adverso\n";

  let csv = headers;
  data.supuestos.forEach(s => {
    csv += `"${s.variable}","${s.unidad}","${s.actual}","${s.base}","${s.optimista}","${s.adverso}"\n`;
  });

  if (data.overrides.length) {
    csv += I18N.getLocale() === "en" ? "\nAudited Data Overrides\n" : "\nOverrides de datos auditados\n";
    csv += I18N.getLocale() === "en" ? "Field,Original,Override,Justification,Date\n" : "Campo,Original,Override,Justificación,Fecha\n";
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

// Lazy render
Scenarios.on("page:escenarios", () => {
  const el = document.getElementById("escenarios-content");
  if (el && !el.innerHTML.trim()) renderEscenarios();
});