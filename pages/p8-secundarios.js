/**
 * pages/p8-secundarios.js — Riesgos Secundarios
 * Contraparte · Base · Liquidez · Regulatorio · Operativo
 */

function renderSecundarios() {
  const el = document.getElementById("secundarios-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-info mb-24">
      <span class="alert-icon">🛡</span>
      <span>
        ${I18N.t("p8.alert")}
      </span>
    </div>

    <!-- MATRIZ DE RIESGOS -->
    <div class="section-title">${I18N.t("p8.matrix")}</div>
    <div class="card mb-24">
      <canvas id="sec-matriz-chart" height="280"></canvas>
    </div>

    <!-- RIESGOS DETALLADOS -->
    <div class="section-title">${I18N.t("p8.detail")}</div>
    <div id="sec-riesgos-detalle" class="mb-24"></div>

    <!-- CONCENTRACIÓN DE CLIENTES -->
    <div class="section-title">${I18N.t("p8.concentration")}</div>
    <div class="card mb-24" id="sec-concentracion"></div>

    <!-- MARCO REGULATORIO -->
    <div class="section-title">${I18N.t("p8.regulatory")}</div>
    <div class="card mb-24" id="sec-regulatorio"></div>

    <!-- PLAN DE MITIGACIÓN -->
    <div class="section-title">${I18N.t("p8.mitigation")}</div>
    <div class="card mb-24" id="sec-mitigacion"></div>

  `;

  _secRenderMatriz();
  _secRenderRiesgos();
  _secRenderConcentracion();
  _secRenderRegulatorio();
  _secRenderMitigacion();
}

// ─────────────────────────────────────────
// MATRIZ DE RIESGOS
// ─────────────────────────────────────────
function _secRenderMatriz() {
  const canvas = document.getElementById("sec-matriz-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w   = canvas.offsetWidth || 600;
  const h   = canvas.height      || 280;
  canvas.width = w;

  // Fondo de la matriz (zonas de color)
  const pad  = 50;
  const cw   = w - pad * 2;
  const ch   = h - pad * 2;

  // Zonas
  const zonas = [
    { x: 0,   y: 0.5, w: 0.5, h: 0.5, color: "rgba(234,243,222,0.6)", label: I18N.t("p8.low") },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5, color: "rgba(250,238,218,0.6)", label: I18N.t("p8.reg.media") },
    { x: 0,   y: 0,   w: 0.5, h: 0.5, color: "rgba(250,238,218,0.6)", label: I18N.t("p8.reg.media") },
    { x: 0.5, y: 0,   w: 0.5, h: 0.5, color: "rgba(252,237,240,0.7)", label: I18N.t("p8.high")  },
  ];

  zonas.forEach(z => {
    ctx.fillStyle = z.color;
    ctx.fillRect(
      pad + z.x * cw,
      pad + z.y * ch,
      z.w * cw,
      z.h * ch
    );
  });

  // Líneas de cuadrícula
  ctx.strokeStyle = "rgba(200,205,216,0.4)";
  ctx.lineWidth   = 1;
  ctx.strokeRect(pad, pad, cw, ch);
  ctx.beginPath();
  ctx.moveTo(pad + cw/2, pad);
  ctx.lineTo(pad + cw/2, pad + ch);
  ctx.moveTo(pad, pad + ch/2);
  ctx.lineTo(pad + cw, pad + ch/2);
  ctx.stroke();

  // Labels de ejes
  ctx.fillStyle = "#8A96A8";
  ctx.font      = "11px Inter";
  ctx.textAlign = "center";
  ctx.fillText(I18N.t("p8.prob"), pad + cw/2, h - 8);

  ctx.save();
  ctx.translate(14, pad + ch/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText(I18N.t("p8.impact"), 0, 0);
  ctx.restore();

  // Labels de escala
  [I18N.t("p8.low"), I18N.t("p8.high")].forEach((l, i) => {
    ctx.fillStyle = "#8A96A8";
    ctx.font      = "10px Inter";
    ctx.textAlign = "center";
    ctx.fillText(l, pad + (i === 0 ? cw*0.25 : cw*0.75), h - 20);
  });

  // Puntos de riesgo
  const riesgos = [
    { label: I18N.t("p8.r1.tipo"),      prob: 0.20, imp: 0.60, color: "#D4870F" },
    { label: "Base risk",        prob: 0.50, imp: 0.55, color: "#D4870F" },
    { label: I18N.t("p8.r3.tipo"),     prob: 0.30, imp: 0.70, color: "#D43050" },
    { label: I18N.t("p8.r4.tipo"),      prob: 0.25, imp: 0.40, color: "#2E6EBE" },
    { label: I18N.t("p8.r5.tipo"),        prob: 0.40, imp: 0.50, color: "#D4870F" },
    { label: I18N.t("p8.concentration"),prob: 0.55, imp: 0.80, color: "#D43050" },
    { label: "USMCA",            prob: 0.45, imp: 0.90, color: "#9B2335" },
    { label: I18N.t("p8.mit.roll"),   prob: 0.35, imp: 0.85, color: "#9B2335" },
    { label: I18N.t("p8.mit.dump"), prob: 0.70, imp: 0.65, color: "#9B2335" },
  ];

  riesgos.forEach(r => {
    const x = pad + r.prob * cw;
    const y = pad + (1 - r.imp) * ch;

    // Círculo
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle   = r.color + "33";
    ctx.fill();
    ctx.strokeStyle = r.color;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle  = r.color;
    ctx.font       = "9.5px Inter";
    ctx.textAlign  = "left";
    ctx.fillText(r.label, x + 10, y + 4);
  });
}

// ─────────────────────────────────────────
// RIESGOS DETALLADOS
// ─────────────────────────────────────────
function _secRenderRiesgos() {
  const el = document.getElementById("sec-riesgos-detalle");
  if (!el) return;

  const riesgos = [
    {
      tipo:     I18N.t("p8.r1.tipo"),
      icono:    "🤝",
      nivel:    I18N.t("p8.r1.nivel"),
      clase:    "warn",
      desc:     I18N.t("p8.r1.desc"),
      impacto:  I18N.t("p8.r1.impacto"),
      mitigacion: [
        I18N.t("p8.r1.mit1"),
        I18N.t("p8.r1.mit2"),
        I18N.t("p8.r1.mit3"),
        I18N.t("p8.r1.mit4"),
      ],
    },
    {
      tipo:     I18N.t("p8.r2.tipo"),
      icono:    "📐",
      nivel:    I18N.t("p8.r2.nivel"),
      clase:    "warn",
      desc:     I18N.t("p8.r2.desc"),
      impacto:  I18N.t("p8.r2.impacto"),
      mitigacion: [
        I18N.t("p8.r2.mit1"),
        I18N.t("p8.r2.mit2"),
        I18N.t("p8.r2.mit3"),
        I18N.t("p8.r2.mit4"),
      ],
    },
    {
      tipo:     I18N.t("p8.r3.tipo"),
      icono:    "💧",
      nivel:    I18N.t("p8.r3.nivel"),
      clase:    "warn",
      desc:     I18N.t("p8.r3.desc"),
      impacto:  I18N.t("p8.r3.impacto"),
      mitigacion: [
        I18N.t("p8.r3.mit1"),
        I18N.t("p8.r3.mit2"),
        I18N.t("p8.r3.mit3"),
        I18N.t("p8.r3.mit4"),
      ],
    },
    {
      tipo:     I18N.t("p8.r4.tipo"),
      icono:    "⚖",
      nivel:    I18N.t("p8.r4.nivel"),
      clase:    "accent",
      desc:     I18N.t("p8.r4.desc"),
      impacto:  I18N.t("p8.r4.impacto"),
      mitigacion: [
        I18N.t("p8.r4.mit1"),
        I18N.t("p8.r4.mit2"),
        I18N.t("p8.r4.mit3"),
        I18N.t("p8.r4.mit4"),
      ],
    },
    {
      tipo:     I18N.t("p8.r5.tipo"),
      icono:    "⚙",
      nivel:    I18N.t("p8.r5.nivel"),
      clase:    "warn",
      desc:     I18N.t("p8.r5.desc"),
      impacto:  I18N.t("p8.r5.impacto"),
      mitigacion: [
        I18N.t("p8.r5.mit1"),
        I18N.t("p8.r5.mit2"),
        I18N.t("p8.r5.mit3"),
        I18N.t("p8.r5.mit4"),
      ],
    },
  ];

  el.innerHTML = riesgos.map(r => `
    <div class="card mb-16" style="margin-bottom:12px;">
      <div class="card-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:22px;">${r.icono}</span>
          <div>
            <div class="card-title">${r.tipo}</div>
            <div class="card-sub">
              ${I18N.t("p8.riskLevel")}
            </div>
          </div>
        </div>
        <span class="badge badge-${r.clase}">${r.nivel}</span>
      </div>

      <div class="grid-3" style="gap:16px;">
        <div>
          <div class="section-title" style="margin-top:0;">${I18N.t("label.description")}</div>
          <p style="font-size:12px; color:var(--text-secondary);
                    line-height:1.6;">
            ${r.desc}
          </p>
        </div>
        <div>
          <div class="section-title" style="margin-top:0;">
            ${I18N.t("label.impact")}
          </div>
          <p style="font-size:12px; color:var(--text-secondary);
                    line-height:1.6;">
            ${r.impacto}
          </p>
        </div>
        <div>
          <div class="section-title" style="margin-top:0;">${I18N.t("label.mitigation")}</div>
          ${r.mitigacion.map(m => `
            <div style="font-size:11.5px; color:var(--text-secondary);
                        margin-bottom:5px; display:flex; gap:6px;">
              <span style="color:var(--success); flex-shrink:0;">✓</span>
              <span>${m}</span>
            </div>`).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────
// CONCENTRACIÓN DE CLIENTES
// ─────────────────────────────────────────
function _secRenderConcentracion() {
  const el = document.getElementById("sec-concentracion");
  if (!el) return;

  el.innerHTML = `
    <div class="grid-2" style="gap:24px;">

      <div>
        <div class="section-title" style="margin-top:0;">
          ${I18N.t("p8.conc.title")}
        </div>

        <div class="alert alert-danger" style="margin-bottom:14px;">
          <span class="alert-icon">⚠</span>
          <span style="font-size:11.5px;">
            ${I18N.t("p8.conc.alert")}
          </span>
        </div>

        ${[
          { cliente: I18N.t("p8.conc.ccma"), pct: 35, nota: I18N.t("p8.conc.nota1") },
          { cliente: I18N.t("p8.conc.domestic"), pct: 18, nota: I18N.t("p8.conc.nota2") },
          { cliente: I18N.t("p8.conc.europe"), pct: 8,  nota: I18N.t("p8.conc.nota3") },
          { cliente: I18N.t("p8.conc.rest"),      pct: 39, nota: I18N.t("p8.conc.nota4") },
        ].map(c => `
          <div style="margin-bottom:12px;">
            <div class="flex-between" style="margin-bottom:5px;">
              <span style="font-size:12px; font-weight:500;">${c.cliente}</span>
              <span class="mono" style="font-size:12px;">${c.pct}%</span>
            </div>
            <div style="height:7px; background:var(--bg-raised);
                        border-radius:4px; overflow:hidden;">
              <div style="width:${c.pct}%; height:100%;
                          background:${c.pct > 30 ? "var(--danger-mid)"
                                      : c.pct > 15 ? "var(--warn-mid)"
                                      : "var(--accent-mid)"};
                          border-radius:4px;"></div>
            </div>
            <div style="font-size:10.5px; color:var(--text-muted);">
              ${c.nota}
            </div>
          </div>
        `).join("")}
      </div>

      <div>
        <div class="section-title" style="margin-top:0;">
          ${I18N.t("p8.impl.title")}
        </div>

        ${[
          {
            titulo: I18N.t("p8.impl.ccma.t"),
            desc:   I18N.t("p8.impl.ccma.d"),
            tipo:   "danger",
          },
          {
            titulo: I18N.t("p8.impl.basis.t"),
            desc:   I18N.t("p8.impl.basis.d"),
            tipo:   "warn",
          },
          {
            titulo: I18N.t("p8.impl.lp.t"),
            desc:   I18N.t("p8.impl.lp.d"),
            tipo:   "success",
          },
        ].map(i => `
          <div style="padding:12px; background:var(--bg-raised);
                      border-radius:var(--radius-md);
                      border-left:3px solid var(--${i.tipo}-mid);
                      margin-bottom:10px;">
            <div style="font-size:12px; font-weight:600;
                        margin-bottom:5px;">${i.titulo}</div>
            <div style="font-size:11.5px; color:var(--text-secondary);
                        line-height:1.5;">${i.desc}</div>
          </div>
        `).join("")}
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// MARCO REGULATORIO
// ─────────────────────────────────────────
function _secRenderRegulatorio() {
  const el = document.getElementById("sec-regulatorio");
  if (!el) return;

  el.innerHTML = `
    <div class="grid-2" style="gap:24px;">

      <div>
        <div class="section-title" style="margin-top:0;">
          ${I18N.t("p8.reg.legal")}
        </div>

        ${[
          {
            org:   "Banxico",
            rol:   I18N.t("p8.reg.banxico.rol"),
            norma: I18N.t("p8.reg.banxico.norma"),
            imp:   I18N.t("p8.reg.media"),
          },
          {
            org:   "CNBV",
            rol:   I18N.t("p8.reg.cnbv.rol"),
            norma: I18N.t("p8.reg.cnbv.norma"),
            imp:   I18N.t("p8.reg.media"),
          },
          {
            org:   "BMV / MexDer",
            rol:   I18N.t("p8.reg.mexder.rol"),
            norma: I18N.t("p8.reg.mexder.norma"),
            imp:   I18N.t("p8.reg.bajause"),
          },
          {
            org:   "IFRS 9",
            rol:   I18N.t("p8.reg.ifrs.rol"),
            norma: I18N.t("p8.reg.ifrs.norma"),
            imp:   I18N.t("p8.reg.altapl"),
          },
          {
            org:   "SAT / ISR",
            rol:   I18N.t("p8.reg.sat.rol"),
            norma: I18N.t("p8.reg.sat.norma"),
            imp:   I18N.t("p8.reg.media"),
          },
        ].map(r => `
          <div style="padding:10px; border-bottom:1px solid var(--border);">
            <div class="flex-between" style="margin-bottom:4px;">
              <span style="font-size:12px; font-weight:700;
                           color:var(--accent);">${r.org}</span>
              <span class="badge ${
                r.imp.includes("Alta") || r.imp.includes("High") ? "badge-danger"
                : r.imp.includes("Media") || r.imp.includes("Medium") ? "badge-warn"
                : "badge-neutral"}">
                ${r.imp}
              </span>
            </div>
            <div style="font-size:11.5px; color:var(--text-secondary);">
              ${r.rol}
            </div>
            <div style="font-size:10.5px; color:var(--text-muted);
                        margin-top:2px;">${r.norma}</div>
          </div>
        `).join("")}
      </div>

      <div>
        <div class="section-title" style="margin-top:0;">
          ${I18N.t("p8.reg.compliance")}
        </div>

        ${[
          [I18N.t("p8.reg.c1"),         "✓", "positive"],
          [I18N.t("p8.reg.c2"), "✓", "positive"],
          [I18N.t("p8.reg.c3"),    "✓", "positive"],
          [I18N.t("p8.reg.c4"),      "✓", "positive"],
          [I18N.t("p8.reg.c5"),        "✓", "positive"],
          [I18N.t("p8.reg.c6"),         "✓", "positive"],
          [I18N.t("p8.reg.c7"),     "✓", "positive"],
          [I18N.t("p8.reg.c8"),                   "✓", "positive"],
          [I18N.t("p8.reg.c9"),     "✓", "positive"],
          [I18N.t("p8.reg.c10"),            "✗", "danger",
           I18N.t("p8.reg.c10.nota")],
        ].map(([item, estado, tipo, nota]) => `
          <div class="flex-between"
               style="padding:7px 0; border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:12px;">${item}</div>
              ${nota ? `<div style="font-size:10.5px;
                             color:var(--danger);">${nota}</div>` : ""}
            </div>
            <span style="font-size:14px; font-weight:700;
                         color:var(--${tipo});">${estado}</span>
          </div>
        `).join("")}

        <div class="alert alert-success" style="margin-top:12px;">
          <span class="alert-icon">✓</span>
          <span style="font-size:11.5px;">
            ${I18N.t("p8.reg.compAlert")}
          </span>
        </div>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// PLAN DE MITIGACIÓN
// ─────────────────────────────────────────
function _secRenderMitigacion() {
  const el = document.getElementById("sec-mitigacion");
  if (!el) return;

  el.innerHTML = `
    <div class="section-title" style="margin-top:0;">
      ${I18N.t("p8.mit.actions")}
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>${I18N.t("p8.mit.risk")}</th>
            <th>${I18N.t("p8.mit.action")}</th>
            <th>${I18N.t("p8.mit.responsible")}</th>
            <th>${I18N.t("p8.mit.horizon")}</th>
            <th>${I18N.t("p8.mit.priority")}</th>
            <th>${I18N.t("p8.mit.cost")}</th>
          </tr>
        </thead>
        <tbody>
          ${[
            [I18N.t("p8.mit.r1"),
             I18N.t("p8.mit.a1"),
             I18N.t("p8.mit.resp1"),
             I18N.t("p8.mit.h1"),
             I18N.t("p8.mit.prio1"),
             I18N.t("p8.mit.cost1")],
            [I18N.t("p8.mit.r2"),
             I18N.t("p8.mit.a2"),
             I18N.t("p8.mit.resp2"),
             I18N.t("p8.mit.h2"),
             I18N.t("p8.mit.prio2"),
             I18N.t("p8.mit.cost2")],
            [I18N.t("p8.mit.r3"),
             I18N.t("p8.mit.a3"),
             I18N.t("p8.mit.resp3"),
             I18N.t("p8.mit.h3"),
             I18N.t("p8.mit.prio3"),
             I18N.t("p8.mit.cost3")],
            [I18N.t("p8.mit.r4"),
             I18N.t("p8.mit.a4"),
             I18N.t("p8.mit.resp4"),
             I18N.t("p8.mit.h4"),
             I18N.t("p8.mit.prio4"),
             I18N.t("p8.mit.cost4")],
            [I18N.t("p8.mit.r5"),
             I18N.t("p8.mit.a5"),
             I18N.t("p8.mit.resp5"),
             I18N.t("p8.mit.h5"),
             I18N.t("p8.mit.prio5"),
             I18N.t("p8.mit.cost5")],
            [I18N.t("p8.mit.r6"),
             I18N.t("p8.mit.a6"),
             I18N.t("p8.mit.resp6"),
             I18N.t("p8.mit.h6"),
             I18N.t("p8.mit.prio6"),
             I18N.t("p8.mit.cost6")],
            [I18N.t("p8.mit.r7"),
             I18N.t("p8.mit.a7"),
             I18N.t("p8.mit.resp7"),
             I18N.t("p8.mit.h7"),
             I18N.t("p8.mit.prio7"),
             I18N.t("p8.mit.cost7")],
            [I18N.t("p8.mit.r8"),
             I18N.t("p8.mit.a8"),
             I18N.t("p8.mit.resp8"),
             I18N.t("p8.mit.h8"),
             I18N.t("p8.mit.prio8"),
             I18N.t("p8.mit.cost8")],
          ].map(([riesgo, accion, resp, horizonte, prio, costo]) => `
            <tr>
              <td style="font-size:12px; font-weight:500;">${riesgo}</td>
              <td style="font-size:11.5px; color:var(--text-secondary);">
                ${accion}
              </td>
              <td style="font-size:11.5px;">${resp}</td>
              <td style="font-size:11.5px;" class="mono">${horizonte}</td>
              <td>
                <span class="badge ${
                  prio === "CRÍTICA" || prio === "CRITICAL" ? "badge-danger"
                  : prio === "ALTA" || prio === "HIGH"  ? "badge-warn"
                  : "badge-neutral"}">
                  ${prio}
                </span>
              </td>
              <td style="font-size:11px; color:var(--text-muted);">
                ${costo}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="alert alert-accent" style="margin-top:16px;
         background:var(--accent-light); border-color:rgba(27,79,138,0.2);
         color:var(--accent-dark);">
      <span class="alert-icon">💡</span>
      <span style="font-size:12px;">
        ${I18N.t("p8.mit.perspectiva")}
      </span>
    </div>
  `;
}

// ─────────────────────────────────────────
// BIND & INIT
// ─────────────────────────────────────────
Scenarios.on("page:secundarios", () => {
  const el = document.getElementById("secundarios-content");
  if (el) renderSecundarios();
});