/**
 * pages/p2-escenarios.js — Escenarios & Inputs
 * Motor de supuestos macro · Alimenta todas las páginas
 */

function renderEscenarios() {
  const el = document.getElementById("escenarios-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-info mb-24">
      <span class="alert-icon">⚙</span>
      <span>
        Ajusta las variables independientes con los sliders.
        Las variables dependientes se calculan automáticamente.
        <strong>Todos los cambios se propagan en tiempo real</strong> a todas las páginas.
      </span>
    </div>

    <!-- VARIABLES INDEPENDIENTES — SLIDERS -->
    <div class="grid-2 mb-24">

      <!-- COLUMNA IZQ: Sliders -->
      <div>
        <div class="section-title">Variables independientes</div>
        <div class="card" id="sliders-container"></div>
      </div>

      <!-- COLUMNA DER: Tabla de escenarios editable -->
      <div>
        <div class="section-title">Valores por escenario</div>
        <div class="card">
          <div class="table-wrap">
            <table id="esc-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th class="esc-header-base">Base</th>
                  <th class="esc-header-opt">Optimista</th>
                  <th class="esc-header-adv">Adverso</th>
                </tr>
              </thead>
              <tbody id="esc-table-body"></tbody>
            </table>
          </div>
          <div style="margin-top:12px; font-size:11px; color:var(--text-muted);">
            💡 Haz clic en cualquier valor para editarlo directamente.
          </div>
        </div>
      </div>

    </div>

    <!-- NARRATIVA POR ESCENARIO -->
    <div class="section-title">Narrativa macro por escenario</div>
    <div class="grid-3 mb-24" id="narrativa-container"></div>

    <!-- VARIABLES DEPENDIENTES -->
    <div class="section-title">Variables dependientes — calculadas en tiempo real</div>
    <div class="card mb-24">
      <div class="grid-3" id="vars-dependientes"></div>
    </div>

    <!-- IMPACTO POR DRIVER -->
    <div class="section-title">Descomposición del impacto sobre EBITDA</div>
    <div class="card mb-24">
      <div id="impacto-drivers"></div>
    </div>

    <!-- BOTONES -->
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="resetEscenarios()">
        ↺ Restaurar valores base
      </button>
      <button class="btn btn-ghost" onclick="exportarSupuestosCSV()">
        ↓ Exportar supuestos CSV
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

    return `
      <div class="slider-group" id="sg-${key}">
        <div class="slider-header">
          <div class="slider-label">
            <span>${c.icono}</span>
            <span>${c.label}</span>
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

        <div class="slider-sensitivity">${c.sensibilidad}</div>
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

    return `
      <tr>
        <td style="font-size:11.5px;">
          <span>${c.icono}</span> ${c.label}
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

  const nuevo = prompt(
    `${escenario.toUpperCase()} · ${cfg.label}\n` +
    `Unidad: ${unidad}\n` +
    `Valor actual: ${cfg.formato(valAct)}\n\n` +
    `Ingresa el nuevo valor:`,
    valAct
  );

  if (nuevo === null || nuevo === "") return;
  const num = parseFloat(nuevo);
  if (isNaN(num)) { showToast("Valor inválido", "error"); return; }

  Scenarios.setEscenarioVar(escenario, variable, num);
  _renderEscTable();
  showToast(`${escenario} · ${cfg.label} → ${cfg.formato(num)}`, "success");
};

// ─────────────────────────────────────────
// NARRATIVA
// ─────────────────────────────────────────
function _renderNarrativa() {
  const el  = document.getElementById("narrativa-container");
  if (!el) return;

  const esc = Scenarios.getState().escenarios;

  const escenarios = [
    { key: "base",      label: "Escenario Base",      color: "var(--accent)",  icon: "◎" },
    { key: "optimista", label: "Escenario Optimista",  color: "var(--success)", icon: "▲" },
    { key: "adverso",   label: "Escenario Adverso",    color: "var(--danger)",  icon: "▼" },
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
            Editar
          </button>
        </div>

        <div id="narrativa-${e.key}">
          ${vars.map(([key, cfg]) => `
            <div style="margin-bottom:10px; padding-bottom:10px;
                        border-bottom:1px solid var(--border);">
              <div style="font-size:10.5px; font-weight:600;
                          color:var(--text-muted); margin-bottom:3px;
                          text-transform:uppercase; letter-spacing:0.4px;">
                ${cfg.icono} ${cfg.label}
              </div>
              <div style="font-size:12px; color:var(--text-primary); line-height:1.5;">
                ${narrativa[key] || "—"}
              </div>
            </div>
          `).join("")}
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
    const nuevo  = prompt(
      `${escenario.toUpperCase()} · Narrativa: ${c.label}\n\nTexto actual:\n${actual}\n\nNueva narrativa (Enter para mantener):`,
      actual
    );
    if (nuevo !== null && nuevo !== actual) {
      Scenarios.setNarrativa(escenario, key, nuevo);
    }
  }

  _renderNarrativa();
  showToast(`Narrativa ${escenario} actualizada`, "success");
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
      label: "Ingresos estimados",
      val:   fmt.usd(ingresosEst),
      sub:   "Sensible a FX + volumen",
      tipo:  ingresosEst > 322746 ? "success" : "warn",
    },
    {
      label: "Gasto financiero est.",
      val:   fmt.usd(costoFinEst),
      sub:   "SOFR + TIIE sobre deuda variable",
      tipo:  costoFinEst > 42493 ? "danger" : "success",
    },
    {
      label: "EBITDA estimado",
      val:   fmt.usd(ebitdaEst),
      sub:   `Margen ${margenEst}%`,
      tipo:  ebitdaEst > 30000 ? "success" : ebitdaEst > 0 ? "warn" : "danger",
    },
    {
      label: "FCF estimado",
      val:   fmt.usd(fcfEst),
      sub:   "EBITDA − gasto fin − capex",
      tipo:  fcfEst > 0 ? "success" : "danger",
    },
    {
      label: "DSCR estimado",
      val:   `${dscrEst.toFixed(2)}x`,
      sub:   "Cobertura servicio de deuda",
      tipo:  dscrEst >= 1 ? "success" : dscrEst >= 0.6 ? "warn" : "danger",
    },
    {
      label: "TIIE efectiva proy.",
      val:   fmt.tasa(vars.tiie28),
      sub:   `Vs floor collar 8.75%`,
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
    { label: "💱 Tipo de cambio (FX)", val: imp.fx,     key: "fx"  },
    { label: "⛏ Precio Manganeso",    val: imp.mn,     key: "mn"  },
    { label: "🥇 Precio Oro",          val: imp.oro,    key: "oro" },
    { label: "📈 Tasa TIIE",           val: imp.tiie,   key: "tiie"},
    { label: "🇺🇸 Tasa SOFR",          val: imp.sofr,   key: "sofr"},
    { label: "⚡ Gas Natural",          val: imp.gas,    key: "gas" },
    { label: "🏭 Volumen",             val: imp.volumen,key: "vol" },
  ];

  const maxAbs = Math.max(...drivers.map(d => Math.abs(d.val)), 1);

  el.innerHTML = `
    <div style="margin-bottom:8px; font-size:11.5px; color:var(--text-muted);">
      Impacto sobre EBITDA base (USD ${(31470/1000).toFixed(1)}M) 
      dado el valor actual de cada slider vs base de referencia.
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
        Impacto total sobre EBITDA
      </span>
      <span class="mono" style="font-size:14px; font-weight:700;
            color:${imp.total >= 0 ? "var(--success)" : "var(--danger)"};">
        ${imp.total >= 0 ? "+" : ""}${fmt.usd(imp.total)}
      </span>
    </div>
    <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
      EBITDA ajustado estimado:
      <strong>${fmt.usd(31470 + imp.total)}</strong>
    </div>
  `;
}

// ─────────────────────────────────────────
// ACCIONES
// ─────────────────────────────────────────
window.resetEscenarios = function() {
  if (!confirm("¿Restaurar todos los valores a los supuestos base?")) return;

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

  showToast("Valores restaurados", "success");
};

window.exportarSupuestosCSV = function() {
  const data = Scenarios.exportarSupuestos();
  const cfg  = Scenarios.SLIDER_CONFIG;

  let csv = "Variable,Unidad,Actual,Base,Optimista,Adverso\n";
  data.supuestos.forEach(s => {
    csv += `"${s.variable}","${s.unidad}","${s.actual}","${s.base}","${s.optimista}","${s.adverso}"\n`;
  });

  if (data.overrides.length) {
    csv += "\nOverrides de datos auditados\n";
    csv += "Campo,Original,Override,Justificación,Fecha\n";
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

  showToast("CSV exportado", "success");
};

// Lazy render
Scenarios.on("page:escenarios", () => {
  const el = document.getElementById("escenarios-content");
  if (el && !el.innerHTML.trim()) renderEscenarios();
});