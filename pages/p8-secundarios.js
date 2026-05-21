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
        Los riesgos secundarios no se cubren con derivados financieros,
        pero <strong>afectan directamente la efectividad</strong> de
        cualquier estrategia de cobertura. Ignorarlos es el error
        más común en una mesa de riesgos real.
      </span>
    </div>

    <!-- MATRIZ DE RIESGOS -->
    <div class="section-title">Matriz de riesgos · Probabilidad vs Impacto</div>
    <div class="card mb-24">
      <canvas id="sec-matriz-chart" height="280"></canvas>
    </div>

    <!-- RIESGOS DETALLADOS -->
    <div class="section-title">Análisis detallado por tipo de riesgo</div>
    <div id="sec-riesgos-detalle" class="mb-24"></div>

    <!-- CONCENTRACIÓN DE CLIENTES -->
    <div class="section-title">Riesgo de concentración · Clientes y canales</div>
    <div class="card mb-24" id="sec-concentracion"></div>

    <!-- MARCO REGULATORIO -->
    <div class="section-title">Marco regulatorio · Derivados en México</div>
    <div class="card mb-24" id="sec-regulatorio"></div>

    <!-- PLAN DE MITIGACIÓN -->
    <div class="section-title">Plan de mitigación integral</div>
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
    { x: 0,   y: 0.5, w: 0.5, h: 0.5, color: "rgba(234,243,222,0.6)", label: "Baja" },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5, color: "rgba(250,238,218,0.6)", label: "Media" },
    { x: 0,   y: 0,   w: 0.5, h: 0.5, color: "rgba(250,238,218,0.6)", label: "Media" },
    { x: 0.5, y: 0,   w: 0.5, h: 0.5, color: "rgba(252,237,240,0.7)", label: "Alta"  },
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
  ctx.fillText("PROBABILIDAD →", pad + cw/2, h - 8);

  ctx.save();
  ctx.translate(14, pad + ch/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText("IMPACTO →", 0, 0);
  ctx.restore();

  // Labels de escala
  ["Baja", "Alta"].forEach((l, i) => {
    ctx.fillStyle = "#8A96A8";
    ctx.font      = "10px Inter";
    ctx.textAlign = "center";
    ctx.fillText(l, pad + (i === 0 ? cw*0.25 : cw*0.75), h - 20);
  });

  // Puntos de riesgo
  const riesgos = [
    { label: "Contraparte",      prob: 0.20, imp: 0.60, color: "#D4870F" },
    { label: "Base risk",        prob: 0.50, imp: 0.55, color: "#D4870F" },
    { label: "Liquidez IFD",     prob: 0.30, imp: 0.70, color: "#D43050" },
    { label: "Regulatorio",      prob: 0.25, imp: 0.40, color: "#2E6EBE" },
    { label: "Operativo",        prob: 0.40, imp: 0.50, color: "#D4870F" },
    { label: "Concentración Cl.",prob: 0.55, imp: 0.80, color: "#D43050" },
    { label: "USMCA",            prob: 0.45, imp: 0.90, color: "#9B2335" },
    { label: "Rollover deuda",   prob: 0.35, imp: 0.85, color: "#9B2335" },
    { label: "Dumping asiático", prob: 0.70, imp: 0.65, color: "#9B2335" },
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
      tipo:     "Riesgo de contraparte",
      icono:    "🤝",
      nivel:    "MEDIO",
      clase:    "warn",
      desc:     `Cuando la contraparte de un IFD (banco o institución financiera)
                 no cumple sus obligaciones. Autlán opera principalmente en
                 mercados OTC con instituciones internacionales reconocidas
                 (Santander, BBVA) — reduce pero no elimina el riesgo.`,
      impacto:  `Si una contraparte falla, Autlán pierde el valor de mercado
                 positivo del instrumento. Con MtM actuales pequeños (~USD 45K),
                 el impacto inmediato es limitado. El riesgo crece si se agregan
                 más instrumentos y el MtM acumula.`,
      mitigacion: [
        "Operar solo con contrapartes investment grade",
        "Diversificar contrapartes — no concentrar en un banco",
        "CSA (Credit Support Annex) para colateral bilateral",
        "Límites de exposición por contraparte en política interna",
      ],
    },
    {
      tipo:     "Riesgo de base (Basis Risk)",
      icono:    "📐",
      nivel:    "MEDIO-ALTO",
      clase:    "warn",
      desc:     `El basis risk surge cuando el instrumento de cobertura
                 no correlaciona perfectamente con la exposición que cubre.
                 Para Autlán: el precio que recibe de sus clientes (precio
                 de contrato) puede diferir del índice spot que usa el
                 derivado como referencia.`,
      impacto:  `Un forward de manganeso referenciado al CRU puede no
                 compensar exactamente la caída del precio de contrato con
                 el cliente. El basis puede ser de USD 50-100/MT — significativo
                 sobre USD 289M de ingresos. En FX, el basis entre el
                 tipo de cambio spot y el forward es pequeño pero existe.`,
      mitigacion: [
        "Elegir índice de referencia del derivado = índice del contrato cliente",
        "Documentar el basis histórico antes de contratar cobertura",
        "Preferir cobertura natural (contratos LP) que elimina el basis",
        "Monitorear efectividad de cobertura trimestralmente (IFRS 9)",
      ],
    },
    {
      tipo:     "Riesgo de liquidez del instrumento",
      icono:    "💧",
      nivel:    "MEDIO-ALTO",
      clase:    "warn",
      desc:     `El riesgo de no poder salir de una posición de IFD al precio
                 de mercado justo, o de tener que pagar un spread muy alto
                 para cerrar la posición anticipadamente. Más relevante
                 en mercados OTC que en bolsas listadas.`,
      impacto:  `Si Autlán necesita salir anticipadamente del collar TIIE
                 o de un forward de manganeso, el costo de liquidación
                 puede ser significativamente mayor que el MtM teórico.
                 Con DSCR de 0.6x, la liquidez es crítica.`,
      mitigacion: [
        "Preferir instrumentos listados (futuros COMEX para oro)",
        "Negociar cláusulas de liquidación anticipada en contratos OTC",
        "Mantener cash buffer suficiente para margin calls potenciales",
        "Limitar horizonte de coberturas OTC a 12 meses (política actual)",
      ],
    },
    {
      tipo:     "Riesgo regulatorio y contable",
      icono:    "⚖",
      nivel:    "BAJO",
      clase:    "accent",
      desc:     `Riesgo de cambios en regulación que afecten el uso de IFDs
                 o su tratamiento contable. En México: CNBV regula los
                 intermediarios, Banxico supervisa el mercado de derivados.
                 Bajo IFRS 9, las coberturas deben calificar para hedge
                 accounting o el MtM va directo a resultados.`,
      impacto:  `Si una cobertura pierde su designación IFRS 9 (por
                 inefectividad), el MtM va a P&L — amplificando la
                 volatilidad de utilidades en lugar de reducirla.
                 Autlán confirma efectividad trimestralmente.`,
      mitigacion: [
        "Documentación de hedge accounting desde contratación",
        "Pruebas de efectividad trimestrales (método compensación)",
        "Asesoría legal especializada en derivados OTC en México",
        "Cumplimiento EMIR/Dodd-Frank para operaciones cross-border",
      ],
    },
    {
      tipo:     "Riesgo operativo de la mesa de derivados",
      icono:    "⚙",
      nivel:    "MEDIO",
      clase:    "warn",
      desc:     `Riesgo de errores en ejecución, valuación o reporte de
                 posiciones de IFD. Include: errores en captura de parámetros,
                 falta de segregación de funciones, ausencia de sistemas
                 de valuación independiente.`,
      impacto:  `Un error en el nocional de un forward o en el strike de
                 un collar puede resultar en una cobertura incorrecta o
                 en pérdidas no anticipadas. Autlán usa valuación de
                 contrapartes + verificación interna.`,
      mitigacion: [
        "Segregación: quien contrata ≠ quien valúa ≠ quien reporta",
        "Reconciliación mensual de valuaciones con contrapartes",
        "Sistema de registro independiente (no solo el del banco)",
        "Capacitación continua del equipo de tesorería",
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
              Nivel de riesgo Autlán Q1 2026
            </div>
          </div>
        </div>
        <span class="badge badge-${r.clase}">${r.nivel}</span>
      </div>

      <div class="grid-3" style="gap:16px;">
        <div>
          <div class="section-title" style="margin-top:0;">Descripción</div>
          <p style="font-size:12px; color:var(--text-secondary);
                    line-height:1.6;">
            ${r.desc}
          </p>
        </div>
        <div>
          <div class="section-title" style="margin-top:0;">
            Impacto en Autlán
          </div>
          <p style="font-size:12px; color:var(--text-secondary);
                    line-height:1.6;">
            ${r.impacto}
          </p>
        </div>
        <div>
          <div class="section-title" style="margin-top:0;">Mitigación</div>
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
          Concentración de clientes · Autlán 2025
        </div>

        <div class="alert alert-danger" style="margin-bottom:14px;">
          <span class="alert-icon">⚠</span>
          <span style="font-size:11.5px;">
            <strong>Top 6 clientes = 61% de receivables</strong> (XBRL Q4 2025).
            Todos los exports USA via <strong>CCMA LLC</strong> —
            una sola relación comercial concentra el canal de exportación
            más importante.
          </span>
        </div>

        ${[
          { cliente: "CCMA LLC (canal USA)", pct: 35, nota: "Single channel — todos exports USA" },
          { cliente: "Clientes domésticos top 3", pct: 18, nota: "Acereras mexicanas — ciclo bajo" },
          { cliente: "Clientes europeos top 2", pct: 8,  nota: "Cuotas de importación EU" },
          { cliente: "Resto de clientes",      pct: 39, nota: "Diversificado" },
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
          Implicaciones para cobertura
        </div>

        ${[
          {
            titulo: "CCMA LLC — riesgo canal único",
            desc:   `Si CCMA falla o renegocia términos, Autlán pierde
                     acceso al mercado USA. La cobertura FX está diseñada
                     para flujos que asumen la continuidad de CCMA.
                     Una interrupción elimina la exposición que se cubre.`,
            tipo:   "danger",
          },
          {
            titulo: "Concentración amplifica el basis risk",
            desc:   `Si el top 6 negocia precios que difieren
                     significativamente del índice spot, el basis risk
                     de cualquier derivado se amplifica. Las coberturas
                     deben basarse en el precio de contrato real,
                     no en el índice de referencia del mercado.`,
            tipo:   "warn",
          },
          {
            titulo: "Contratos LP reducen el riesgo de concentración",
            desc:   `Irónicamente, los contratos LP con los top 6 clientes
                     reducen simultáneamente el riesgo de precio (cobertura
                     natural) y el riesgo de concentración (fidelizan la
                     relación comercial). Son la solución más eficiente
                     para ambos riesgos.`,
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
          Marco legal · Derivados en México
        </div>

        ${[
          {
            org:   "Banxico",
            rol:   "Regula el mercado de derivados OTC en México",
            norma: "Circular 4/2012 — requisitos de operación con IFD",
            imp:   "Media",
          },
          {
            org:   "CNBV",
            rol:   "Supervisa intermediarios financieros que ofrecen IFD",
            norma: "Disposiciones aplicables a casas de bolsa y bancos",
            imp:   "Media",
          },
          {
            org:   "BMV / MexDer",
            rol:   "Mercado listado — futuros y opciones sobre TIIE, IPC",
            norma: "Reglamento interior MexDer",
            imp:   "Baja (Autlán usa principalmente OTC)",
          },
          {
            org:   "IFRS 9",
            rol:   "Tratamiento contable de coberturas",
            norma: "Hedge accounting — efectividad mínima 80-125%",
            imp:   "Alta — afecta P&L directamente",
          },
          {
            org:   "SAT / ISR",
            rol:   "Tratamiento fiscal de ganancias/pérdidas en IFD",
            norma: "Arts. 20-22 LISR — acumulación de ingresos por derivados",
            imp:   "Media",
          },
        ].map(r => `
          <div style="padding:10px; border-bottom:1px solid var(--border);">
            <div class="flex-between" style="margin-bottom:4px;">
              <span style="font-size:12px; font-weight:700;
                           color:var(--accent);">${r.org}</span>
              <span class="badge ${
                r.imp === "Alta" ? "badge-danger"
                : r.imp === "Media" ? "badge-warn"
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
          Cumplimiento actual de Autlán
        </div>

        ${[
          ["Política formal de IFD documentada",         "✓", "positive"],
          ["Objetivo exclusivo de cobertura (no especul.)", "✓", "positive"],
          ["Contrapartes de alta calidad crediticia",    "✓", "positive"],
          ["Documentación IFRS 9 hedge accounting",      "✓", "positive"],
          ["Pruebas de efectividad trimestrales",        "✓", "positive"],
          ["Valuación independiente verificada",         "✓", "positive"],
          ["Revelación en XBRL BMV (transparencia)",     "✓", "positive"],
          ["Comité de riesgos activo",                   "✓", "positive"],
          ["Sin llamadas de margen pendientes 1T26",     "✓", "positive"],
          ["Cobertura FX al 60% de política",            "✗", "danger",
           "Solo 3% cubierto actualmente"],
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
            Autlán cumple con todos los requisitos regulatorios y
            de governance para el uso de IFD. El único gap es
            el nivel de cobertura FX vs política interna.
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
      Acciones de mitigación · Prioridad y horizonte
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Riesgo</th>
            <th>Acción de mitigación</th>
            <th>Responsable</th>
            <th>Horizonte</th>
            <th>Prioridad</th>
            <th>Costo estimado</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ["Concentración FX",
             "Ampliar coberturas FX hasta 40-60% de ingresos USD",
             "Tesorería",
             "Inmediato (Q2 2026)",
             "CRÍTICA",
             "Prima collar ~0.1-0.3% nocional"],
            ["Rollover deuda",
             "Refinanciar créditos SOFR que vencen 2027 antes de USMCA",
             "CFO / Bancos",
             "Q2-Q3 2026",
             "ALTA",
             "Fee de refinanciamiento 0.5-1%"],
            ["Concentración clientes",
             "Diversificar canal USA — no solo CCMA LLC",
             "Dirección Comercial",
             "12-18 meses",
             "ALTA",
             "Costo de desarrollo comercial"],
            ["Collar TIIE OTM",
             "Evaluar reestructura si TIIE < 7% por 2+ trimestres",
             "Tesorería",
             "Q3 2026",
             "MEDIA",
             "Costo de reestructura ~USD 20-40K"],
            ["Exposición oro sin cubrir",
             "Contratar costless collar $2,700-$3,300 sobre 50% producción",
             "Tesorería",
             "Inmediato",
             "ALTA",
             "Costless — prima neta ~0"],
            ["Exposición gas sin cubrir",
             "Swap precio fijo 12 meses sobre 50% consumo expuesto",
             "Operaciones / Tesorería",
             "Q2 2026",
             "MEDIA",
             "Prima implícita ~USD 200-400K"],
            ["Basis risk manganeso",
             "Asegurar índice de referencia = precio de contrato cliente",
             "Comercial / Tesorería",
             "Al contratar",
             "MEDIA",
             "Sin costo adicional"],
            ["Riesgo contraparte IFD",
             "CSA bilateral y límites de exposición por contraparte",
             "Tesorería / Legal",
             "En próxima renovación",
             "BAJA",
             "Costo legal ~USD 10-20K"],
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
                  prio === "CRÍTICA" ? "badge-danger"
                  : prio === "ALTA"  ? "badge-warn"
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
        <strong>Perspectiva de mesa de riesgos:</strong>
        Los riesgos secundarios no se eliminan — se gestionan.
        La diferencia entre una empresa que pierde en derivados y una que
        gana no es el instrumento elegido, sino la calidad de la
        documentación, el monitoreo continuo y la disciplina para
        actuar cuando los parámetros cambian.
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