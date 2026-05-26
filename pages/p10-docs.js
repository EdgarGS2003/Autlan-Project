/**
 * pages/p10-docs.js — Documentación del Modelo
 * Autlán Risk Calculator · Cómo funciona cada página, modelo y cálculo
 */

function renderDocs() {
  const el = document.getElementById("docs-content");
  if (!el) return;

  el.innerHTML = `

    <div class="alert alert-accent mb-24"
         style="background:var(--accent-light);
                border-color:rgba(27,79,138,0.2);
                color:var(--accent-dark);">
      <span class="alert-icon">📖</span>
      <span>
        Esta página documenta la lógica interna del modelo —
        cómo se calculan los números, qué hace cada slider,
        qué fórmulas usa cada página y cómo se llega a la estrategia óptima.
      </span>
    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 1 — ARQUITECTURA
    ══════════════════════════════════════════ -->
    <div class="section-title">1 · Arquitectura del modelo</div>
    <div class="card mb-24">

      <div style="font-size:13px; line-height:1.8; margin-bottom:20px;">
        El modelo tiene cuatro capas que fluyen en un solo sentido:
        los datos auditados nunca se modifican, los sliders solo afectan
        el estado en memoria, y los cálculos se recalculan en tiempo real
        cada vez que cambia cualquier variable.
      </div>

      <div style="display:grid; grid-template-columns:repeat(4,1fr);
                  gap:12px; margin-bottom:24px;">
        ${[
          {
            num: "01",
            nombre: "data.js",
            rol: "Base de datos",
            desc: "Números auditados del XBRL BMV (4T25 y 1T26) + key points junta may-2026. No calcula nada. No se modifica en runtime.",
            color: "var(--accent)",
            items: ["XBRL 4T25 auditado", "XBRL 1T26 auditado", "Junta may-2026", "Estructura de deuda", "Derivados vigentes"],
          },
          {
            num: "02",
            nombre: "scenarios.js",
            rol: "Estado global",
            desc: "Cerebro central. Mantiene el estado de los 7 sliders. Cuando uno cambia, emite eventos que todas las páginas escuchan.",
            color: "var(--warn)",
            items: ["Estado de 7 sliders", "3 escenarios editables", "Sistema pub/sub", "Cache de resultados", "Formatters UI"],
          },
          {
            num: "03",
            nombre: "models.js",
            rol: "Motor matemático",
            desc: "Funciones matemáticas puras. Recibe números, devuelve números. No toca el DOM. Todos los modelos de pricing viven aquí.",
            color: "var(--success)",
            items: ["Black-Scholes", "Heston (skew)", "Schwartz (gas)", "Forward pricing", "Hull-White (swaps)", "Collar payoffs"],
          },
          {
            num: "04",
            nombre: "páginas (p0–p9)",
            rol: "Visualización",
            desc: "Cada página se suscribe a los eventos que le importan y se re-renderiza automáticamente cuando cambia su variable.",
            color: "var(--text-muted)",
            items: ["Dashboard (p0)", "Perfil (p1)", "Escenarios (p2)", "FX → Estrategia", "Lazy render"],
          },
        ].map(c => `
          <div style="padding:16px; background:var(--bg-raised);
                      border-radius:var(--radius-md);
                      border-top:3px solid ${c.color};">
            <div style="font-size:10px; font-weight:700; color:${c.color};
                        letter-spacing:1px; margin-bottom:4px;">${c.num}</div>
            <div style="font-size:13px; font-weight:700; margin-bottom:2px;">
              ${c.nombre}
            </div>
            <div style="font-size:10.5px; color:var(--text-muted);
                        margin-bottom:10px;">${c.rol}</div>
            <div style="font-size:11px; line-height:1.6;
                        color:var(--text-secondary); margin-bottom:12px;">
              ${c.desc}
            </div>
            <ul style="margin:0; padding-left:14px; font-size:11px;
                       color:var(--text-muted); line-height:1.8;">
              ${c.items.map(i => `<li>${i}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md);
                  border-left:3px solid var(--accent);
                  font-size:12px; font-family:var(--font-mono);">
        <div style="color:var(--text-muted); margin-bottom:6px;">
          Flujo de un cambio de slider:
        </div>
        <div style="color:var(--accent);">
          Usuario mueve slider USD/MXN
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--warn);">onSliderChange()</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--success);">Scenarios.setVar()</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--success);">Models.impactoEscenario()</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--accent);">emit("calc:update")</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--text-primary);">Dashboard + Escenarios + página FX se actualizan</span>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 2 — LOS 7 SLIDERS
    ══════════════════════════════════════════ -->
    <div class="section-title">2 · Los 7 sliders — qué calculan y dónde se ve el cambio</div>
    <div class="card mb-24">

      <div style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
        Cada slider modifica una variable macro. El impacto se calcula como
        la diferencia porcentual respecto a un valor base de referencia,
        multiplicada por la exposición real de Autlán a ese factor.
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="border-bottom:2px solid var(--border);">
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                Slider
              </th>
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                Base de referencia
              </th>
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                Fórmula del impacto
              </th>
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                Páginas que se actualizan
              </th>
              <th style="padding:10px 12px; text-align:right; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                Impacto por unidad
              </th>
            </tr>
          </thead>
          <tbody>
            ${[
              {
                slider:  "💱 USD / MXN",
                base:    "$18.00",
                formula: "Ingresos × (TC−18)/18 × 0.85",
                paginas: "Dashboard, Escenarios, Tipo de Cambio, Estrategia",
                impacto: "~USD 15.2M por $1 MXN",
                color:   "var(--accent)",
              },
              {
                slider:  "⛏ Precio Manganeso",
                base:    "USD 1,309/MT",
                formula: "Ingresos × 0.60 × (Mn−1,309)/1,309",
                paginas: "Dashboard, Escenarios, Manganeso",
                impacto: "~USD 5–8M por $100/MT",
                color:   "var(--text-primary)",
              },
              {
                slider:  "🥇 Precio del Oro",
                base:    "USD 3,000/oz",
                formula: "20,000 oz × $3,000 × (Oro−3,000)/3,000",
                paginas: "Dashboard, Escenarios, Oro",
                impacto: "~USD 0.6M por $100/oz",
                color:   "var(--gold)",
              },
              {
                slider:  "📈 TIIE 28 días",
                base:    "7.10%",
                formula: "−$29,747M × (TIIE−7.10)/100",
                paginas: "Dashboard, Escenarios, Tasa de Interés",
                impacto: "~USD 297K por 100bps",
                color:   "var(--warn)",
              },
              {
                slider:  "🇺🇸 SOFR 1 mes",
                base:    "4.30%",
                formula: "−$135,479M × (SOFR−4.30)/100",
                paginas: "Dashboard, Escenarios, Tasa de Interés",
                impacto: "~USD 1.35M por 100bps",
                color:   "var(--warn)",
              },
              {
                slider:  "⚡ Gas Natural",
                base:    "USD 3.20/MMBtu",
                formula: "−$8,000M × (Gas−3.20)/3.20",
                paginas: "Dashboard, Escenarios, Gas Natural",
                impacto: "~USD 2.5M por $1/MMBtu",
                color:   "var(--success)",
              },
              {
                slider:  "🏭 Volumen producción",
                base:    "100% del plan",
                formula: "Ingresos × 0.60 × (Vol−100)/100 × 0.35",
                paginas: "Dashboard, Escenarios únicamente",
                impacto: "~USD 40M por ±15% vol",
                color:   "var(--text-muted)",
              },
            ].map((r, i) => `
              <tr style="border-bottom:1px solid var(--border);
                          background:${i%2===0?"transparent":"var(--bg-raised)"};">
                <td style="padding:10px 12px; font-weight:600; color:${r.color};">
                  ${r.slider}
                </td>
                <td style="padding:10px 12px; font-family:var(--font-mono);
                            font-size:11px;">
                  ${r.base}
                </td>
                <td style="padding:10px 12px; font-family:var(--font-mono);
                            font-size:10.5px; color:var(--text-muted);">
                  ${r.formula}
                </td>
                <td style="padding:10px 12px; font-size:11px;
                            color:var(--text-secondary);">
                  ${r.paginas}
                </td>
                <td style="padding:10px 12px; text-align:right;
                            font-weight:700; font-family:var(--font-mono);
                            font-size:11px; color:${r.color};">
                  ${r.impacto}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="alert alert-info" style="margin-top:16px;">
        <span class="alert-icon">💡</span>
        <span style="font-size:11.5px;">
          Los impactos de TIIE y SOFR afectan el
          <strong>gasto financiero</strong> (no el EBITDA).
          Los demás sliders afectan el <strong>EBITDA operativo</strong>.
          El FCF = EBITDA − Gasto Financiero − Capex ($30M estimado).
        </span>
      </div>

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 3 — CÁLCULO CENTRAL
    ══════════════════════════════════════════ -->
    <div class="section-title">3 · Cálculo central — cómo se construye el EBITDA proyectado</div>
    <div class="card mb-24" id="docs-calc-live">
      <!-- Se llena en _docsRenderCalcLive() -->
    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 4 — MODELOS MATEMÁTICOS
    ══════════════════════════════════════════ -->
    <div class="section-title">4 · Modelos matemáticos — cuándo usa cada uno</div>
    <div class="card mb-24">

      ${[
        {
          nombre:  "Black-Scholes (1973)",
          usado:   "Put/Call sobre oro y gas cuando el usuario selecciona 'B-S' en el selector de modelo",
          formula: "C = S·N(d₁) − K·e^(−rT)·N(d₂) &nbsp;|&nbsp; d₁ = [ln(S/K) + (r + σ²/2)T] / σ√T",
          supuesto:"Volatilidad constante, distribución log-normal del subyacente",
          limitacion: "Subestima el skew de volatilidad — especialmente en FX y commodities",
          color:   "var(--accent)",
          paginas: "p4-oro.js, p5-gas.js",
        },
        {
          nombre:  "Heston (1993) — aproximación de segundo orden",
          usado:   "Put/Call sobre oro (modelo por defecto), collares FX. Captura el smile de volatilidad.",
          formula: "Precio_Heston ≈ Precio_BS × max(1 + skewCorr·ln(S/K) + kurtCorr·(...), 0.5)",
          supuesto:"Varianza estocástica: dv = κ(θ−v)dt + ξ√v·dWᵥ. Correlación precio-varianza ρ = −0.40 (oro) / −0.60 (FX)",
          limitacion: "Implementación es expansión de Forde & Jacquier (2009) — no integración compleja exacta",
          color:   "var(--gold)",
          paginas: "p3-fx.js, p4-oro.js",
        },
        {
          nombre:  "Schwartz 1-Factor (1997) — Mean Reversion",
          usado:   "Opciones sobre gas natural. El gas tiene reversión a la media, a diferencia del oro.",
          formula: "dln(S) = κ(μ − ln(S))dt + σdW &nbsp;→&nbsp; F = exp(ln(S₀)·e^(−κT) + μ·(1−e^(−κT)) + ½σ²T)",
          supuesto:"κ = 1.5 (velocidad reversión), μ = ln($3.20) (precio equilibrio), σ = 45%",
          limitacion: "Modelo de un solo factor — no captura estructura temporal compleja del gas",
          color:   "var(--success)",
          paginas: "p5-gas.js",
        },
        {
          nombre:  "Forward pricing — Paridad cubierta de tasas",
          usado:   "Precio teórico de forwards FX y sobre commodities (oro, gas)",
          formula: "F = S · e^((r_d − r_f + storage) × T) &nbsp;|&nbsp; FX: r_d = TIIE, r_f = SOFR",
          supuesto:"Sin fricciones. Oro: storage = 0.15%/año. Gas: sin convenience yield explícito.",
          limitacion: "No refleja spread bid-ask ni liquidez del mercado OTC",
          color:   "var(--accent-mid)",
          paginas: "p3-fx.js, p4-oro.js, p5-gas.js",
        },
        {
          nombre:  "Swap MTM — Hull-White simplificado",
          usado:   "Valoración mark-to-market del collar TIIE existente y de swaps de tasa propuestos",
          formula: "MTM = VPN(pagos_variables) − VPN(pagos_fijos) &nbsp;|&nbsp; factor_descuento = e^(−r·t_i)",
          supuesto:"Pagos mensuales (freq=12). Tasa de descuento = tasa de mercado actual.",
          limitacion: "No modela la curva de tasas completa — usa tasa flat como proxy",
          color:   "var(--warn)",
          paginas: "p6-tasa.js",
        },
        {
          nombre:  "Collar Payoff — Regla de ejercicio",
          usado:   "Payoff de todos los collares al vencimiento (FX, oro, TIIE)",
          formula: "Payoff = (floor − spot) × nocional &nbsp;si spot < floor &nbsp;|&nbsp; (cap − spot) × nocional &nbsp;si spot > cap &nbsp;|&nbsp; 0 &nbsp;si dentro del rango",
          supuesto:"Ejercicio europeo (solo al vencimiento). Zero-cost: prima_put ≈ prima_call.",
          limitacion: "No modela ejercicio anticipado ni ajustes de margen intraday",
          color:   "var(--text-primary)",
          paginas: "p3-fx.js, p4-oro.js, p9-estrategia.js",
        },
      ].map(m => `
        <div style="margin-bottom:20px; padding:16px; background:var(--bg-raised);
                    border-radius:var(--radius-md);
                    border-left:4px solid ${m.color};">
          <div style="display:flex; justify-content:space-between;
                      align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
            <div style="font-size:13px; font-weight:700; color:${m.color};">
              ${m.nombre}
            </div>
            <div style="font-size:10px; color:var(--text-muted);
                        font-family:var(--font-mono); background:var(--bg-card);
                        padding:2px 8px; border-radius:4px;">
              ${m.paginas}
            </div>
          </div>
          <div style="font-size:11.5px; margin-bottom:8px;">
            <span style="color:var(--text-muted); font-weight:600;">Usado en: </span>
            ${m.usado}
          </div>
          <div style="font-family:var(--font-mono); font-size:11px;
                      background:var(--bg-card); padding:10px 12px;
                      border-radius:var(--radius-sm); margin-bottom:8px;
                      color:var(--accent); line-height:1.7;">
            ${m.formula}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div style="font-size:11px; color:var(--text-muted);">
              <span style="font-weight:600;">Supuestos: </span>${m.supuesto}
            </div>
            <div style="font-size:11px; color:var(--warn);">
              <span style="font-weight:600;">Limitación: </span>${m.limitacion}
            </div>
          </div>
        </div>
      `).join("")}

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 5 — PÁGINA POR PÁGINA
    ══════════════════════════════════════════ -->
    <div class="section-title">5 · Qué hace cada página</div>
    <div class="card mb-24">

      ${[
        {
          id: "p0",
          nombre: "Dashboard ejecutivo",
          resumen: "Vista de mando en tiempo real. Se actualiza con cualquier cambio de slider.",
          inputs:  "Todos los sliders via calc:update",
          outputs: "KPIs financieros, estado de coberturas, tabla de 3 escenarios, estructura de deuda",
          logica:  "Lee Scenarios.getCache().actual para los valores del estado actual. Lee Scenarios.getCache().escenarios para la tabla de 3 columnas.",
          alerta:  null,
        },
        {
          id: "p1",
          nombre: "Perfil Autlán",
          resumen: "Datos estáticos del XBRL. No reacciona a sliders — muestra los auditados.",
          inputs:  "Ninguno (datos estáticos de data.js)",
          outputs: "Estado de resultados, balance, estructura de deuda, ratings, segmentos",
          logica:  "Renderizado una sola vez al cargar. Sin suscripciones a eventos.",
          alerta:  null,
        },
        {
          id: "p2",
          nombre: "Escenarios & Inputs",
          resumen: "Centro de control. Aquí se mueven los sliders que alimentan todo el modelo.",
          inputs:  "Input directo del usuario",
          outputs: "Variables dependientes calculadas (EBITDA, FCF, DSCR, gasto financiero), descomposición de impacto por driver, tabla editable de escenarios",
          logica:  "Cada slider llama onSliderChange(key, value) → Scenarios.setVar() → emit('calc:update') → todos se actualizan. La tabla de escenarios es editable inline: click en celda abre input, al salir llama Scenarios.setEscenarioVar().",
          alerta:  "⚠ Si mueves un slider estando en otra página, la página activa se actualiza pero la de Escenarios no recalcula hasta que la visitas.",
        },
        {
          id: "p3",
          nombre: "Tipo de Cambio",
          resumen: "Analiza la exposición FX y modela instrumentos de cobertura: forward, collar, swap.",
          inputs:  "Slider USD/MXN via var:usdmxn",
          outputs: "KPIs de exposición, comparativa payoffs, payoff chart, collar pricing en tiempo real",
          logica:  "El payoff chart dibuja en Canvas la curva de ingreso vs TC para 4 instrumentos: sin cobertura (línea gris), forward (línea plana al precio pactado), collar (kinked en floor y cap) y swap sintético. Usa forwardPrice() para el precio teórico y collarPayoff() para el payoff en cada punto.",
          alerta:  "⚠ Solo se suscribe a var:usdmxn. Si cambias SOFR (que afecta el precio del forward), el chart no se actualiza automáticamente.",
        },
        {
          id: "p4",
          nombre: "Precio del Oro",
          resumen: "Analiza exposición de Metallorum. Meta 2026: 20,000 oz sin cobertura activa.",
          inputs:  "Slider Precio Oro via var:precioOro",
          outputs: "KPIs de Metallorum, 4 instrumentos (Forward, Put-Heston, Collar, Futuros COMEX), tabla comparativa por escenario, payoff chart",
          logica:  "Los KPIs usan ozAnual = 20,000 (meta junta may-2026). La put usa Heston por defecto (captura skew del oro). El collar usa collarPrice() con hestonParams del oro: kappa=1.2, theta_v=0.04, xi=0.35, rho_sv=−0.40.",
          alerta:  null,
        },
        {
          id: "p5",
          nombre: "Gas Natural",
          resumen: "Costo operativo sin cobertura. Usa Schwartz 1-factor por la reversión a la media del gas.",
          inputs:  "Slider Gas Natural via var:precioGas",
          outputs: "Exposición estimada, pricing de swap y collar con modelo Schwartz",
          logica:  "schwartz() calcula la varianza acumulada hasta vencimiento (varT) y el precio forward esperado (F). Usa Black-76 sobre ese forward para valorar las opciones. kappa=1.5 significa que el gas revierte a su media en ~8 meses.",
          alerta:  null,
        },
        {
          id: "p6",
          nombre: "Tasa de Interés",
          resumen: "Analiza el collar TIIE existente (sin beneficio actual) y propone cobertura SOFR.",
          inputs:  "Sliders TIIE y SOFR",
          outputs: "MTM del collar TIIE existente, análisis de por qué no beneficia (TIIE 7% < floor 8.75%), propuesta de IRS sobre SOFR",
          logica:  "swapMTM() calcula el VPN de todos los flujos futuros del collar descontados a la tasa actual. Si TIIE < floor (caso actual), el collar no se ejerce y Autlán paga tasa de mercado completa — la minusvalía es el costo de la prima pagada.",
          alerta:  "⚠ El collar TIIE tiene minusvalía acumulada de USD 45.6K al 4T25. TIIE tendría que subir a 8.75% para que el instrumento empiece a proteger.",
        },
        {
          id: "p7",
          nombre: "Manganeso",
          resumen: "Riesgo de precio del commodity principal. Mercado OTC limitado en México.",
          inputs:  "Slider Precio Manganeso",
          outputs: "Sensibilidad de ingresos, alternativas de cobertura (swap fijo, collar sintético), análisis de mercado",
          logica:  "El impacto en ingresos = Ingresos_base × 0.60 × (Mn−1,309)/1,309. El 0.60 refleja que ~60% de los ingresos son ferroaleaciones de manganeso.",
          alerta:  null,
        },
        {
          id: "p8",
          nombre: "Riesgos Secundarios",
          resumen: "Riesgos que no tienen slider propio: contraparte, base, liquidez, regulatorio, operativo.",
          inputs:  "Ninguno — análisis cualitativo",
          outputs: "Mapa de riesgos, semáforos por categoría, acciones recomendadas",
          logica:  "Estático. Los scores son juicios de experto basados en los datos del XBRL y la junta. No se actualizan con los sliders.",
          alerta:  null,
        },
        {
          id: "p9",
          nombre: "Estrategia Óptima",
          resumen: "Integra todas las coberturas en un portafolio y muestra el P&L por escenario.",
          inputs:  "calc:update (todos los sliders) + escenarios:update",
          outputs: "Portafolio de 5 coberturas, tabla maestra de EBITDA con/sin estrategia, tradeoff explícito, payoff chart integrado",
          logica:  "Ver sección 6 abajo.",
          alerta:  null,
        },
      ].map(p => `
        <div style="margin-bottom:16px; padding:16px; background:var(--bg-raised);
                    border-radius:var(--radius-md);">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <div style="font-size:10px; font-weight:700; color:var(--text-muted);
                        font-family:var(--font-mono); background:var(--bg-card);
                        padding:2px 8px; border-radius:4px;">${p.id}</div>
            <div style="font-size:13px; font-weight:700;">${p.nombre}</div>
          </div>
          <div style="font-size:12px; margin-bottom:10px;">${p.resumen}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;
                      margin-bottom:${p.logica ? "10px" : "0"};">
            <div style="font-size:11px;">
              <span style="color:var(--text-muted); font-weight:600;
                           text-transform:uppercase; font-size:10px;">Inputs: </span>
              <span style="color:var(--text-secondary);">${p.inputs}</span>
            </div>
            <div style="font-size:11px;">
              <span style="color:var(--text-muted); font-weight:600;
                           text-transform:uppercase; font-size:10px;">Outputs: </span>
              <span style="color:var(--text-secondary);">${p.outputs}</span>
            </div>
          </div>
          ${p.logica ? `
            <div style="font-size:11px; color:var(--text-secondary);
                        padding:10px; background:var(--bg-card);
                        border-radius:var(--radius-sm); margin-bottom:${p.alerta ? "8px" : "0"};">
              <span style="font-weight:600; color:var(--text-primary);">Lógica: </span>
              ${p.logica}
            </div>` : ""}
          ${p.alerta ? `
            <div style="font-size:11px; color:var(--warn); padding:8px 10px;
                        background:rgba(133,79,11,0.1); border-radius:var(--radius-sm);
                        border-left:3px solid var(--warn);">
              ${p.alerta}
            </div>` : ""}
        </div>
      `).join("")}

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 6 — ESTRATEGIA ÓPTIMA EN DETALLE
    ══════════════════════════════════════════ -->
    <div class="section-title">6 · Cómo se construye la Estrategia Óptima</div>
    <div class="card mb-24">

      <div style="font-size:13px; line-height:1.8; margin-bottom:20px;">
        La estrategia no es una optimización matemática (no hay solver).
        Es un portafolio de reglas de negocio que respeta la política interna
        de Autlán y maximiza protección sin prima de costo.
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
        ${[
          {
            id: "COB-FX-01",
            instrumento: "Collar USD/MXN adicional",
            por_que: "El collar existente cubre solo 3% de ingresos (vence jun-2026). La política permite 60%. Se recomiendan 4 collares mensuales a USD 4M/mes para subir a ~21%.",
            como: "floor = $17.40, cap = $18.40. Costless porque la tasa diferencial TIIE−SOFR crea valor en el put que financia el call.",
            payoff: "Si TC < $17.40 → recibe (17.40−TC)×$4M/mes. Si TC > $18.40 → paga (TC−18.40)×$4M/mes. Si entre $17.40 y $18.40 → cero.",
            color: "var(--accent)",
          },
          {
            id: "COB-ORO-01",
            instrumento: "Collar oro Metallorum",
            por_que: "Meta 20,000 oz en 2026 sin ninguna cobertura. Precio en máximos históricos ($3,000+). Riesgo de caída a $2,400 = pérdida de USD 12M en ingresos.",
            como: "Collar $2,700–$3,300 sobre 10,000 oz (~50% meta). Costless: la alta volatilidad del oro (18%) hace que el call $3,300 financie el put $2,700.",
            payoff: "Si oro < $2,700 → recibe ($2,700−oro)×10,000. Si oro > $3,300 → paga (oro−$3,300)×10,000. Dentro del rango → cero.",
            color: "var(--gold)",
          },
          {
            id: "COB-GAS-01",
            instrumento: "Swap precio fijo gas",
            por_que: "Sin cobertura activa. Gas puede subir a $5/MMBtu en escenario adverso → costo adicional de $2.8M. Swap fija el precio de compra.",
            como: "Precio fijo = $3.35/MMBtu sobre 900K MMBtu (50% consumo estimado). La contraparte paga la diferencia si el gas sube.",
            payoff: "Si gas sube a $5.00 → swap genera ahorro de ($5.00−$3.35)×900K = USD 1.49M. Si gas baja a $2.50 → swap tiene costo de ($3.35−$2.50)×900K = USD 0.77M.",
            color: "var(--success)",
          },
          {
            id: "COB-TASA-01",
            instrumento: "IRS SOFR — variable a fija",
            por_que: "USD 135M de deuda a SOFR+6%. Si SOFR sube 100bps → costo adicional $1.35M/año. Un IRS convierte 50% a tasa fija eliminando esa incertidumbre.",
            como: "Tasa fija = 4.50% sobre USD 67M nocional. 3 años de horizonte. La contraparte paga SOFR variable y recibe 4.50% fijo.",
            payoff: "Si SOFR sube a 5.5% → swap genera ahorro de (5.5%−4.5%)×$67M = USD 670K/año. Si SOFR baja a 3.5% → swap tiene costo de USD 670K/año.",
            color: "var(--warn)",
          },
        ].map(c => `
          <div style="padding:14px; background:var(--bg-raised);
                      border-radius:var(--radius-md);
                      border-top:3px solid ${c.color};">
            <div style="font-size:10px; font-family:var(--font-mono);
                        color:var(--text-muted); margin-bottom:4px;">${c.id}</div>
            <div style="font-size:12px; font-weight:700;
                        margin-bottom:10px;">${c.instrumento}</div>
            <div style="margin-bottom:8px;">
              <div style="font-size:10px; font-weight:700; color:var(--text-muted);
                          text-transform:uppercase; margin-bottom:3px;">Por qué</div>
              <div style="font-size:11px; line-height:1.6;">${c.por_que}</div>
            </div>
            <div style="margin-bottom:8px;">
              <div style="font-size:10px; font-weight:700; color:${c.color};
                          text-transform:uppercase; margin-bottom:3px;">Cómo funciona</div>
              <div style="font-size:11px; line-height:1.6;">${c.como}</div>
            </div>
            <div style="padding:8px; background:var(--bg-card);
                        border-radius:var(--radius-sm);">
              <div style="font-size:10px; font-weight:700; color:var(--text-muted);
                          text-transform:uppercase; margin-bottom:3px;">Payoff al vencimiento</div>
              <div style="font-size:11px; line-height:1.6;
                          font-family:var(--font-mono);">${c.payoff}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); font-size:12px;">
        <div style="font-weight:700; margin-bottom:8px;">
          Cómo se calcula la tabla maestra de la Estrategia Óptima:
        </div>
        <ol style="margin:0; padding-left:18px; line-height:2.0;">
          <li>Para cada escenario (base / optimista / adverso), se obtienen las variables macro
              de <code style="font-size:11px; background:var(--bg-card);
              padding:1px 4px; border-radius:3px;">Scenarios.getState().escenarios</code></li>
          <li>Se calcula el EBITDA sin cobertura con
              <code style="font-size:11px; background:var(--bg-card);
              padding:1px 4px; border-radius:3px;">Models.impactoEscenario(vars, base)</code></li>
          <li>Para cada instrumento del portafolio, se evalúa su función
              <code style="font-size:11px; background:var(--bg-card);
              padding:1px 4px; border-radius:3px;">payoff(valorFinal)</code>
              con el valor de mercado del escenario</li>
          <li>Se suma la protección total al EBITDA sin cobertura →
              EBITDA con estrategia</li>
          <li>FCF = EBITDA con estrategia − Gasto financiero ajustado − Capex $30M</li>
          <li>DSCR = EBITDA con estrategia / Gasto financiero ajustado</li>
        </ol>
      </div>

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 7 — CALCULADORA EN VIVO
    ══════════════════════════════════════════ -->
    <div class="section-title">7 · Calculadora en vivo — ve el modelo paso a paso</div>
    <div class="card mb-24" id="docs-calculadora">
      <!-- Se llena en _docsRenderCalculadora() -->
    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 8 — SUPUESTOS Y LIMITACIONES
    ══════════════════════════════════════════ -->
    <div class="section-title">8 · Supuestos clave y limitaciones del modelo</div>
    <div class="card mb-24">

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">

        <div>
          <div style="font-size:11px; font-weight:700; color:var(--danger);
                      text-transform:uppercase; letter-spacing:0.5px;
                      margin-bottom:12px;">⚠ Limitaciones importantes</div>
          ${[
            "EBITDA base = 2025 auditado ($31.5M). El run-rate 1T26 ($43.2M anualizado) no se usa como ancla para no crear sesgo optimista.",
            "Los ingresos de Metallorum usan la meta 2026 de 20,000 oz como base. Si la meta no se alcanza, el modelo sobreestima ese segmento.",
            "El modelo de Heston es una aproximación de segundo orden, no integración compleja exacta. Para pricing de mesa usar integración completa.",
            "El gasto en gas de $8M/año es un estimado. No hay dato público exacto del consumo de gas de Autlán.",
            "Los covenants del crédito Santander no son públicos — el modelo no puede modelar breaches de covenant.",
            "Todos los collares se asumen costless. En la práctica puede haber pequeñas primas según condiciones de mercado al contratar.",
            "El AISC de Metallorum es desconocido — los ingresos de oro son brutos, el margen real puede ser menor.",
          ].map(l => `
            <div style="display:flex; gap:8px; margin-bottom:8px; font-size:11.5px;
                        line-height:1.6;">
              <span style="color:var(--danger); flex-shrink:0; margin-top:2px;">✗</span>
              <span>${l}</span>
            </div>
          `).join("")}
        </div>

        <div>
          <div style="font-size:11px; font-weight:700; color:var(--success);
                      text-transform:uppercase; letter-spacing:0.5px;
                      margin-bottom:12px;">✓ Lo que el modelo sí captura bien</div>
          ${[
            "Todos los números de balance, deuda y P&L vienen de XBRLs auditados de la BMV — fuente primaria.",
            "La estructura de costos MXN / ingresos USD es el driver más importante del modelo y está bien calibrada.",
            "Los 4 collares FX existentes están modelados con sus strikes y nocionales exactos del XBRL 1T26.",
            "El collar TIIE existente y su situación real (sin beneficio porque TIIE < floor 8.75%) está correctamente capturado.",
            "Los key points de la junta may-2026 están integrados como fuente separada y marcados como no auditados.",
            "La propagación de eventos permite que cualquier cambio de slider se refleje instantáneamente en Dashboard y Escenarios.",
            "Los tres escenarios son editables inline — se pueden ajustar para reflejar visiones alternativas del analista.",
          ].map(l => `
            <div style="display:flex; gap:8px; margin-bottom:8px; font-size:11.5px;
                        line-height:1.6;">
              <span style="color:var(--success); flex-shrink:0; margin-top:2px;">✓</span>
              <span>${l}</span>
            </div>
          `).join("")}
        </div>

      </div>

    </div>

  `;

  _docsRenderCalcLive();
  _docsRenderCalculadora();

  Scenarios.on("calc:update", () => {
    _docsRenderCalcLive();
    _docsRenderCalculadora();
  });
}

// ─────────────────────────────────────────
// CÁLCULO EN VIVO — muestra los números reales del modelo
// ─────────────────────────────────────────
function _docsRenderCalcLive() {
  const el = document.getElementById("docs-calc-live");
  if (!el) return;

  const cache  = Scenarios.getCache();
  const actual = cache.actual;
  if (!actual) return;

  const imp  = actual.impactos;
  const res  = actual.resultados;
  const vars = Scenarios.getState().vars;
  const fmt  = Scenarios.fmt;

  const base = {
    ingresos: 322746,
    ebitda:    31470,
    gastoFin:  42493,
  };

  const ebitdaBase    = base.ebitda;
  const ebitdaActual  = res.ebitda;
  const deltaTotal    = imp.total;
  const gastoFinActual = res.gastoFin;
  const fcf           = res.fcf;

  el.innerHTML = `
    <div style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
      Construcción del EBITDA proyectado con los valores actuales de los sliders.
      Actualiza en tiempo real.
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">

      <!-- WATERFALL EBITDA -->
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--text-muted);
                    text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">
          Construcción del EBITDA
        </div>
        ${[
          { label: "EBITDA base 2025 (auditado)", val: ebitdaBase,        tipo: "neutral" },
          { label: "+ Impacto FX (USD/MXN)",       val: imp.fx,           tipo: imp.fx >= 0 ? "pos" : "neg" },
          { label: "+ Impacto Manganeso",            val: imp.mn,           tipo: imp.mn >= 0 ? "pos" : "neg" },
          { label: "+ Impacto Oro (Metallorum)",     val: imp.oro,          tipo: imp.oro >= 0 ? "pos" : "neg" },
          { label: "+ Impacto Gas Natural",          val: imp.gas,          tipo: imp.gas >= 0 ? "pos" : "neg" },
          { label: "+ Impacto Volumen",              val: imp.volumen,      tipo: imp.volumen >= 0 ? "pos" : "neg" },
          { label: "= EBITDA proyectado",            val: ebitdaActual,     tipo: ebitdaActual >= 0 ? "total-pos" : "total-neg" },
        ].map((r, i) => {
          const color = r.tipo === "neutral"    ? "var(--text-primary)"
                      : r.tipo === "pos"        ? "var(--success)"
                      : r.tipo === "neg"        ? "var(--danger)"
                      : r.tipo === "total-pos"  ? "var(--success)"
                      : "var(--danger)";
          const isSep = r.tipo.startsWith("total");
          return `
            <div style="display:flex; justify-content:space-between;
                        padding:7px 0;
                        border-top:${isSep ? "2px solid var(--border)" : "1px solid var(--border)"};
                        ${isSep ? "font-weight:700;" : ""}">
              <span style="font-size:11.5px; color:var(--text-secondary);">${r.label}</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:${color};">
                ${r.val >= 0 ? "+" : ""}${fmt.usd(r.val)}
              </span>
            </div>`;
        }).join("")}
      </div>

      <!-- FCF Y DSCR -->
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--text-muted);
                    text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">
          De EBITDA a FCF
        </div>
        ${[
          { label: "EBITDA proyectado",            val: ebitdaActual,                  tipo: ebitdaActual >= 0 ? "pos" : "neg" },
          { label: "− Gasto financiero ajustado",  val: -gastoFinActual,               tipo: "neg" },
          { label: "− Capex estimado",             val: -30000,                        tipo: "neg" },
          { label: "= FCF estimado",               val: fcf,                           tipo: fcf >= 0 ? "total-pos" : "total-neg" },
        ].map((r, i) => {
          const color = r.tipo === "pos"        ? "var(--success)"
                      : r.tipo === "neg"        ? "var(--danger)"
                      : r.tipo === "total-pos"  ? "var(--success)"
                      : "var(--danger)";
          const isSep = r.tipo.startsWith("total");
          return `
            <div style="display:flex; justify-content:space-between;
                        padding:7px 0;
                        border-top:${isSep ? "2px solid var(--border)" : "1px solid var(--border)"};
                        ${isSep ? "font-weight:700;" : ""}">
              <span style="font-size:11.5px; color:var(--text-secondary);">${r.label}</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:${color};">
                ${r.val >= 0 ? "+" : ""}${fmt.usd(r.val)}
              </span>
            </div>`;
        }).join("")}

        <div style="margin-top:16px; padding:12px; background:var(--bg-raised);
                    border-radius:var(--radius-md);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:600;">DSCR estimado</span>
            <span style="font-family:var(--font-mono); font-size:18px; font-weight:700;
                         color:${res.dscr >= 1 ? "var(--success)" : res.dscr >= 0.6 ? "var(--warn)" : "var(--danger)"};">
              ${res.dscr.toFixed(2)}x
            </span>
          </div>
          <div style="font-size:10.5px; color:var(--text-muted); margin-top:4px;">
            EBITDA / Gasto financiero ajustado ·
            ${res.dscr >= 1 ? "Cubre servicio de deuda" : "No cubre servicio de deuda — riesgo covenant"}
          </div>
        </div>

        <div style="margin-top:10px; padding:12px; background:var(--bg-raised);
                    border-radius:var(--radius-md);">
          <div style="font-size:11px; font-weight:700; color:var(--text-muted);
                      margin-bottom:6px;">Variables actuales de los sliders:</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
            ${Object.entries(vars).map(([k, v]) => {
              const cfg = Scenarios.SLIDER_CONFIG[k];
              return `
                <div style="font-size:10.5px; display:flex; justify-content:space-between;
                            padding:3px 0; border-bottom:1px solid var(--border);">
                  <span style="color:var(--text-muted);">${cfg ? cfg.label : k}</span>
                  <span style="font-family:var(--font-mono); font-weight:600;">
                    ${cfg ? cfg.formato(v) : v}
                  </span>
                </div>`;
            }).join("")}
          </div>
        </div>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// CALCULADORA — ejemplo paso a paso interactivo
// ─────────────────────────────────────────
function _docsRenderCalculadora() {
  const el = document.getElementById("docs-calculadora");
  if (!el) return;

  const tc  = Scenarios.getVar("usdmxn");
  const mn  = Scenarios.getVar("precioMn");
  const oro = Scenarios.getVar("precioOro");

  const tcBase  = 18.0;
  const mnBase  = 1309;
  const oroBase = 3000;
  const ingBase = 322746;

  const deltaTC  = (tc  - tcBase)  / tcBase;
  const deltaMn  = (mn  - mnBase)  / mnBase;
  const deltaOro = (oro - oroBase) / oroBase;

  const impFX  = ingBase * deltaTC  * 0.85;
  const impMn  = ingBase * 0.60     * deltaMn;
  const impOro = (20000  * oroBase  / 1000) * deltaOro;

  const fmt = Scenarios.fmt;

  el.innerHTML = `
    <div style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
      Traza los 3 impactos más grandes paso a paso con los valores actuales.
      Mueve los sliders en la página de Escenarios y vuelve aquí para ver cómo cambian los cálculos.
    </div>

    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">

      ${[
        {
          titulo:  "💱 Cálculo FX",
          pasos: [
            { desc: "TC actual",          val: fmt.fx(tc) },
            { desc: "TC base referencia", val: fmt.fx(tcBase) },
            { desc: "Delta TC (%)",        val: `${(deltaTC*100).toFixed(2)}%` },
            { desc: "Ingresos base",       val: fmt.usd(ingBase) },
            { desc: "× Factor FX (85%)",   val: "0.85" },
            { desc: "= Impacto EBITDA",    val: fmt.usd(impFX), bold: true,
              color: impFX >= 0 ? "var(--success)" : "var(--danger)" },
          ],
          formula: "Ingresos × (TC−18)/18 × 0.85",
          color: "var(--accent)",
        },
        {
          titulo:  "⛏ Cálculo Manganeso",
          pasos: [
            { desc: "Precio Mn actual",   val: fmt.mn(mn) },
            { desc: "Precio base",         val: fmt.mn(mnBase) },
            { desc: "Delta Mn (%)",         val: `${(deltaMn*100).toFixed(2)}%` },
            { desc: "Ingresos base",        val: fmt.usd(ingBase) },
            { desc: "× % ferroaleaciones",  val: "0.60" },
            { desc: "= Impacto EBITDA",     val: fmt.usd(impMn), bold: true,
              color: impMn >= 0 ? "var(--success)" : "var(--danger)" },
          ],
          formula: "Ingresos × 0.60 × (Mn−1,309)/1,309",
          color: "var(--text-primary)",
        },
        {
          titulo:  "🥇 Cálculo Oro",
          pasos: [
            { desc: "Precio oro actual",   val: fmt.oro(oro) },
            { desc: "Precio base",          val: fmt.oro(oroBase) },
            { desc: "Delta oro (%)",         val: `${(deltaOro*100).toFixed(2)}%` },
            { desc: "Meta oz 2026",          val: "20,000 oz" },
            { desc: "× Base USD ($3,000)",   val: "USD 60M" },
            { desc: "= Impacto EBITDA",      val: fmt.usd(impOro), bold: true,
              color: impOro >= 0 ? "var(--success)" : "var(--danger)" },
          ],
          formula: "20,000 oz × $3,000 × (Oro−3,000)/3,000",
          color: "var(--gold)",
        },
      ].map(c => `
        <div style="padding:14px; background:var(--bg-raised);
                    border-radius:var(--radius-md);
                    border-top:3px solid ${c.color};">
          <div style="font-size:12px; font-weight:700;
                      margin-bottom:12px;">${c.titulo}</div>
          ${c.pasos.map(p => `
            <div style="display:flex; justify-content:space-between;
                        padding:5px 0; border-bottom:1px solid var(--border);">
              <span style="font-size:10.5px; color:var(--text-muted);">${p.desc}</span>
              <span style="font-family:var(--font-mono); font-size:11px;
                           font-weight:${p.bold ? "700" : "400"};
                           color:${p.color || "var(--text-primary)"};">
                ${p.val}
              </span>
            </div>
          `).join("")}
          <div style="margin-top:10px; font-size:10px;
                      font-family:var(--font-mono);
                      color:var(--text-muted); line-height:1.5;">
            ${c.formula}
          </div>
        </div>
      `).join("")}

    </div>
  `;
}

// Lazy render
Scenarios.on("page:docs", () => {
  const el = document.getElementById("docs-content");
  if (el && !el.innerHTML.trim()) renderDocs();
});
