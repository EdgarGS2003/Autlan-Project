/**
 * pages/p10-docs.js — Documentación del Modelo
 * Autlán Risk Calculator · Cómo funciona cada página, modelo y cálculo
 */

function renderDocs() {
  const el = document.getElementById("docs-content");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

  el.innerHTML = `

    <div class="alert alert-accent mb-24"
         style="background:var(--accent-light);
                border-color:rgba(27,79,138,0.2);
                color:var(--accent-dark);">
      <span class="alert-icon">📖</span>
      <span>
        ${isEn
          ? `This page documents the internal logic of the model — how the numbers are calculated, what each slider does, what formulas each page uses, and how the optimal strategy is determined.`
          : `Esta página documenta la lógica interna del modelo — cómo se calculan los números, qué hace cada slider, qué fórmulas usa cada página y cómo se llega a la estrategia óptima.`}
      </span>
    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 1 — ARQUITECTURA
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "1 · Model Architecture" : "1 · Arquitectura del modelo"}
    </div>
    <div class="card mb-24">

      <div style="font-size:13px; line-height:1.8; margin-bottom:20px;">
        ${isEn
          ? `The model has four layers that flow in a single direction: audited data is never modified, sliders only affect the in-memory state, and calculations are updated in real-time whenever any variable changes.`
          : `El modelo tiene cuatro capas que fluyen en un solo sentido: los datos auditados nunca se modifican, los sliders solo afectan el estado en memoria, y los cálculos se recalculan en tiempo real cada vez que cambia cualquier variable.`}
      </div>

      <div style="display:grid; grid-template-columns:repeat(4,1fr);
                  gap:12px; margin-bottom:24px;">
        ${[
          {
            num: "01",
            nombre: "data.js",
            rol: isEn ? "Database" : "Base de datos",
            desc: isEn 
              ? "Audited numbers from XBRL BMV (4Q25 & 1Q26) + key points from May-2026 meeting. Performs no calculations. Never modified in runtime."
              : "Números auditados del XBRL BMV (4T25 y 1T26) + key points junta may-2026. No calcula nada. No se modifica en runtime.",
            color: "var(--accent)",
            items: isEn 
              ? ["Audited 4Q25 XBRL", "Audited 1Q26 XBRL", "May-2026 Board Meeting", "Debt Structure", "Active Derivatives"]
              : ["XBRL 4T25 auditado", "XBRL 1T26 auditado", "Junta may-2026", "Estructura de deuda", "Derivados vigentes"],
          },
          {
            num: "02",
            nombre: "scenarios.js",
            rol: isEn ? "Global State" : "Estado global",
            desc: isEn
              ? "Central brain. Maintains the state of the 7 sliders. When one changes, it emits events that all pages listen to."
              : "Cerebro central. Mantiene el estado de los 7 sliders. Cuando uno cambia, emite eventos que todas las páginas escuchan.",
            color: "var(--warn)",
            items: isEn
              ? ["State of 7 sliders", "3 editable scenarios", "Pub/sub system", "Results cache", "UI formatters"]
              : ["Estado de 7 sliders", "3 escenarios editables", "Sistema pub/sub", "Cache de resultados", "Formatters UI"],
          },
          {
            num: "03",
            nombre: "models.js",
            rol: isEn ? "Mathematical Engine" : "Motor matemático",
            desc: isEn
              ? "Pure mathematical functions. Receives numbers, returns numbers. Does not touch the DOM. All pricing models live here."
              : "Funciones matemáticas puras. Recibe números, devuelve números. No toca el DOM. Todos los modelos de pricing viven aquí.",
            color: "var(--success)",
            items: ["Black-Scholes", "Heston (skew)", "Schwartz (gas)", "Forward pricing", "Hull-White (swaps)", "Collar payoffs"],
          },
          {
            num: "04",
            nombre: isEn ? "pages (p0-p9)" : "páginas (p0–p9)",
            rol: isEn ? "Visualization" : "Visualización",
            desc: isEn
              ? "Each page subscribes to the events it cares about and automatically re-renders when its variable changes."
              : "Cada página se suscribe a los eventos que le importan y se re-renderiza automáticamente cuando cambia su variable.",
            color: "var(--text-muted)",
            items: isEn
              ? ["Dashboard (p0)", "Profile (p1)", "Scenarios (p2)", "FX → Strategy", "Lazy render"]
              : ["Dashboard (p0)", "Perfil (p1)", "Escenarios (p2)", "FX → Estrategia", "Lazy render"],
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
          ${isEn ? "Flow of a slider change:" : "Flujo de un cambio de slider:"}
        </div>
        <div style="color:var(--accent);">
          ${isEn ? "User moves USD/MXN slider" : "Usuario mueve slider USD/MXN"}
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--warn);">onSliderChange()</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--success);">Scenarios.setVar()</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--success);">Models.impactoEscenario()</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--accent);">emit("calc:update")</span>
          <span style="color:var(--text-muted)"> → </span>
          <span style="color:var(--text-primary);">${isEn ? "Dashboard + Scenarios + FX page update" : "Dashboard + Escenarios + página FX se actualizan"}</span>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 2 — LOS 7 SLIDERS
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "2 · The 7 Sliders — what they calculate and where changes are visible" : "2 · Los 7 sliders — qué calculan y dónde se ve el cambio"}
    </div>
    <div class="card mb-24">

      <div style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
        ${isEn
          ? `Each slider modifies a macro variable. The impact is calculated as the percentage difference from a reference base value, multiplied by Autlán's real exposure to that factor.`
          : `Cada slider modifica una variable macro. El impacto se calcula como la diferencia porcentual respecto a un valor base de referencia, multiplicada por la exposición real de Autlán a ese factor.`}
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="border-bottom:2px solid var(--border);">
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                ${isEn ? "Slider" : "Slider"}
              </th>
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                ${isEn ? "Reference Base" : "Base de referencia"}
              </th>
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                ${isEn ? "Impact Formula" : "Fórmula del impacto"}
              </th>
              <th style="padding:10px 12px; text-align:left; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                ${isEn ? "Updated Pages" : "Páginas que se actualizan"}
              </th>
              <th style="padding:10px 12px; text-align:right; color:var(--text-muted);
                         font-weight:600; font-size:10.5px; text-transform:uppercase;">
                ${isEn ? "Impact per Unit" : "Impacto por unidad"}
              </th>
            </tr>
          </thead>
          <tbody>
            ${[
              {
                slider:  "💱 USD / MXN",
                base:    "$18.00",
                formula: isEn ? "Revenues × (FX−18)/18 × 0.85" : "Ingresos × (TC−18)/18 × 0.85",
                paginas: isEn ? "Dashboard, Scenarios, Exchange Rate, Strategy" : "Dashboard, Escenarios, Tipo de Cambio, Estrategia",
                impacto: isEn ? "~USD 15.2M per $1 MXN" : "~USD 15.2M por $1 MXN",
                color:   "var(--accent)",
              },
              {
                slider:  "⛏ " + (isEn ? "Manganese Price" : "Precio Manganeso"),
                base:    "USD 1,309/MT",
                formula: isEn ? "Revenues × 0.60 × (Mn−1,309)/1,309" : "Ingresos × 0.60 × (Mn−1,309)/1,309",
                paginas: isEn ? "Dashboard, Scenarios, Manganese" : "Dashboard, Escenarios, Manganeso",
                impacto: isEn ? "~USD 5–8M per $100/MT" : "~USD 5–8M por $100/MT",
                color:   "var(--text-primary)",
              },
              {
                slider:  "🥇 " + (isEn ? "Gold Price" : "Precio del Oro"),
                base:    "USD 3,000/oz",
                formula: "20,000 oz × $3,000 × (Gold−3,000)/3,000",
                paginas: isEn ? "Dashboard, Scenarios, Gold" : "Dashboard, Escenarios, Oro",
                impacto: isEn ? "~USD 0.6M per $100/oz" : "~USD 0.6M por $100/oz",
                color:   "var(--gold)",
              },
              {
                slider:  "📈 " + (isEn ? "TIIE 28 Days" : "TIIE 28 días"),
                base:    "7.10%",
                formula: "−$29,747M × (TIIE−7.10)/100",
                paginas: isEn ? "Dashboard, Scenarios, Interest Rate" : "Dashboard, Escenarios, Tasa de Interés",
                impacto: isEn ? "~USD 297K per 100bps" : "~USD 297K por 100bps",
                color:   "var(--warn)",
              },
              {
                slider:  "🇺🇸 " + (isEn ? "SOFR 1 Month" : "SOFR 1 mes"),
                base:    "4.30%",
                formula: "−$135,479M × (SOFR−4.30)/100",
                paginas: isEn ? "Dashboard, Scenarios, Interest Rate" : "Dashboard, Escenarios, Tasa de Interés",
                impacto: isEn ? "~USD 1.35M per 100bps" : "~USD 1.35M por 100bps",
                color:   "var(--warn)",
              },
              {
                slider:  "⚡ " + (isEn ? "Natural Gas" : "Gas Natural"),
                base:    "USD 3.20/MMBtu",
                formula: "−$8,000M × (Gas−3.20)/3.20",
                paginas: isEn ? "Dashboard, Scenarios, Natural Gas" : "Dashboard, Escenarios, Gas Natural",
                impacto: isEn ? "~USD 2.5M per $1/MMBtu" : "~USD 2.5M por $1/MMBtu",
                color:   "var(--success)",
              },
              {
                slider:  "🏭 " + (isEn ? "Production Volume" : "Volumen producción"),
                base:    isEn ? "100% of plan" : "100% del plan",
                formula: isEn ? "Revenues × 0.60 × (Vol−100)/100 × 0.35" : "Ingresos × 0.60 × (Vol−100)/100 × 0.35",
                paginas: isEn ? "Dashboard, Scenarios only" : "Dashboard, Escenarios únicamente",
                impacto: isEn ? "~USD 40M per ±15% vol" : "~USD 40M por ±15% vol",
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
          ${isEn
            ? `TIIE and SOFR impacts affect the <strong>financial expense</strong> (not EBITDA). Other sliders affect <strong>operating EBITDA</strong>. FCF = EBITDA − Financial Expense − Capex ($30M estimated).`
            : `Los impactos de TIIE y SOFR afectan el <strong>gasto financiero</strong> (no el EBITDA). Los demás sliders afectan el <strong>EBITDA operativo</strong>. El FCF = EBITDA − Gasto Financiero − Capex ($30M estimado).`}
        </span>
      </div>

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 3 — CÁLCULO CENTRAL
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "3 · Core Calculation — How Projected EBITDA is Built" : "3 · Cálculo central — cómo se construye el EBITDA proyectado"}
    </div>
    <div class="card mb-24" id="docs-calc-live">
      <!-- Se llena en _docsRenderCalcLive() -->
    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 4 — MODELOS MATEMÁTICOS
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "4 · Mathematical Models — When Each is Used" : "4 · Modelos matemáticos — cuándo usa cada uno"}
    </div>
    <div class="card mb-24">

      ${[
        {
          nombre:  "Black-Scholes (1973)",
          usado:   isEn ? "Put/Call options on gold and gas when the user selects 'B-S' in the model selector" : "Put/Call sobre oro y gas cuando el usuario selecciona 'B-S' en el selector de modelo",
          formula: "C = S·N(d₁) − K·e^(−rT)·N(d₂) &nbsp;|&nbsp; d₁ = [ln(S/K) + (r + σ²/2)T] / σ√T",
          supuesto: isEn ? "Constant volatility, log-normal distribution of the underlying asset" : "Volatilidad constante, distribución log-normal del subyacente",
          limitacion: isEn ? "Underestimates volatility skew — especially in FX and commodities" : "Subestima el skew de volatilidad — especialmente en FX y commodities",
          color:   "var(--accent)",
          paginas: "p4-oro.js, p5-gas.js",
        },
        {
          nombre:  "Heston (1993) — " + (isEn ? "second-order approximation" : "aproximación de segundo orden"),
          usado:   isEn ? "Put/Call options on gold (default model), FX collars. Captures the volatility smile." : "Put/Call sobre oro (modelo por defecto), collares FX. Captura el smile de volatilidad.",
          formula: "Heston_Price ≈ BS_Price × max(1 + skewCorr·ln(S/K) + kurtCorr·(...), 0.5)",
          supuesto: isEn ? "Stochastic variance: dv = κ(θ−v)dt + ξ√v·dWᵥ. Price-variance correlation ρ = -0.40 (gold) / -0.60 (FX)" : "Varianza estocástica: dv = κ(θ−v)dt + ξ√v·dWᵥ. Correlación precio-varianza ρ = −0.40 (oro) / −0.60 (FX)",
          limitacion: isEn ? "Implementation is Forde & Jacquier (2009) expansion — not exact complex integration" : "Implementación es expansión de Forde & Jacquier (2009) — no integración compleja exacta",
          color:   "var(--gold)",
          paginas: "p3-fx.js, p4-oro.js",
        },
        {
          nombre:  "Schwartz 1-Factor (1997) — Mean Reversion",
          usado:   isEn ? "Options on natural gas. Natural gas exhibits mean reversion, unlike gold." : "Opciones sobre gas natural. El gas tiene reversión a la media, a diferencia del oro.",
          formula: "dln(S) = κ(μ − ln(S))dt + σdW &nbsp;→&nbsp; F = exp(ln(S₀)·e^(−κT) + μ·(1−e^(−κT)) + ½σ²T)",
          supuesto: isEn ? "κ = 1.5 (reversion speed), μ = ln($3.20) (equilibrium price), σ = 45%" : "κ = 1.5 (velocidad reversión), μ = ln($3.20) (precio equilibrio), σ = 45%",
          limitacion: isEn ? "Single-factor model — does not capture complex natural gas term structure" : "Modelo de un solo factor — no captura estructura temporal compleja del gas",
          color:   "var(--success)",
          paginas: "p5-gas.js",
        },
        {
          nombre:  "Forward pricing — " + (isEn ? "Covered Interest Rate Parity" : "Paridad cubierta de tasas"),
          usado:   isEn ? "Theoretical price of FX forwards and commodities (gold, gas)" : "Precio teórico de forwards FX y sobre commodities (oro, gas)",
          formula: "F = S · e^((r_d − r_f + storage) × T) &nbsp;|&nbsp; FX: r_d = TIIE, r_f = SOFR",
          supuesto: isEn ? "Frictionless. Gold: storage = 0.15%/year. Gas: no explicit convenience yield." : "Sin fricciones. Oro: storage = 0.15%/año. Gas: sin convenience yield explícito.",
          limitacion: isEn ? "Does not reflect bid-ask spreads or OTC market liquidity" : "No refleja spread bid-ask ni liquidez del mercado OTC",
          color:   "var(--accent-mid)",
          paginas: "p3-fx.js, p4-oro.js, p5-gas.js",
        },
        {
          nombre:  "Swap MTM — " + (isEn ? "Simplified Hull-White" : "Hull-White simplificado"),
          usado:   isEn ? "Mark-to-market valuation of active TIIE collar and proposed interest rate swaps" : "Valoración mark-to-market del collar TIIE existente y de swaps de tasa propuestos",
          formula: "MTM = NPV(variable_payments) − NPV(fixed_payments) &nbsp;|&nbsp; discount_factor = e^(−r·t_i)",
          supuesto: isEn ? "Monthly payments (freq=12). Discount rate = current market rate." : "Pagos mensuales (freq=12). Tasa de descuento = tasa de mercado actual.",
          limitacion: isEn ? "Does not model the full yield curve — uses a flat rate proxy" : "No modela la curva de tasas completa — usa tasa flat como proxy",
          color:   "var(--warn)",
          paginas: "p6-tasa.js",
        },
        {
          nombre:  "Collar Payoff — " + (isEn ? "Exercise Rule" : "Regla de ejercicio"),
          usado:   isEn ? "Payoff of all collars at maturity (FX, gold, TIIE)" : "Payoff de todos los collares al vencimiento (FX, oro, TIIE)",
          formula: "Payoff = (floor − spot) × notional &nbsp;if spot < floor &nbsp;|&nbsp; (cap − spot) × notional &nbsp;if spot > cap &nbsp;|&nbsp; 0 &nbsp;if inside range",
          supuesto: isEn ? "European exercise (maturity only). Zero-cost: put premium ≈ call premium." : "Ejercicio europeo (solo al vencimiento). Zero-cost: prima_put ≈ prima_call.",
          limitacion: isEn ? "Does not model early exercise or intraday margin calls" : "No modela ejercicio anticipado ni ajustes de margen intraday",
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
            <span style="color:var(--text-muted); font-weight:600;">${isEn ? "Used in:" : "Usado en:"} </span>
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
              <span style="font-weight:600;">${isEn ? "Assumptions:" : "Supuestos:"} </span>${m.supuesto}
            </div>
            <div style="font-size:11px; color:var(--warn);">
              <span style="font-weight:600;">${isEn ? "Limitation:" : "Limitación:"} </span>${m.limitacion}
            </div>
          </div>
        </div>
      `).join("")}

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 5 — PÁGINA POR PÁGINA
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "5 · What Each Page Does" : "5 · Qué hace cada página"}
    </div>
    <div class="card mb-24">

      ${[
        {
          id: "p0",
          nombre: isEn ? "Executive Dashboard" : "Dashboard ejecutivo",
          resumen: isEn ? "Real-time control panel. Updates with any slider changes." : "Vista de mando en tiempo real. Se actualiza con cualquier cambio de slider.",
          inputs:  isEn ? "All sliders via calc:update" : "Todos los sliders via calc:update",
          outputs: isEn ? "Financial KPIs, hedging status, 3-scenario table, debt structure" : "KPIs financieros, estado de coberturas, tabla de 3 escenarios, estructura de deuda",
          logica:  isEn ? "Reads Scenarios.getCache().actual for current state values. Reads Scenarios.getCache().escenarios for the 3-column table." : "Lee Scenarios.getCache().actual para los valores del estado actual. Lee Scenarios.getCache().escenarios para la tabla de 3 columnas.",
          alerta:  null,
        },
        {
          id: "p1",
          nombre: isEn ? "Autlán Profile" : "Perfil Autlán",
          resumen: isEn ? "Static XBRL data. Does not react to sliders — displays audited values." : "Datos estáticos del XBRL. No reacciona a sliders — muestra los auditados.",
          inputs:  isEn ? "None (static data from data.js)" : "Ninguno (datos estáticos de data.js)",
          outputs: isEn ? "Income statement, balance sheet, debt structure, credit ratings, segments" : "Estado de resultados, balance, estructura de deuda, ratings, segmentos",
          logica:  isEn ? "Rendered only once at load time. No event subscriptions." : "Renderizado una sola vez al cargar. Sin suscripciones a eventos.",
          alerta:  null,
        },
        {
          id: "p2",
          nombre: isEn ? "Scenarios & Inputs" : "Escenarios & Inputs",
          resumen: isEn ? "Control center. Sliders that feed the entire model are adjusted here." : "Centro de control. Aquí se mueven los sliders que alimentan todo el modelo.",
          inputs:  isEn ? "Direct user input" : "Input directo del usuario",
          outputs: isEn ? "Calculated dependent variables (EBITDA, FCF, DSCR, financial expense), impact breakdown by driver, editable scenarios table" : "Variables dependientes calculadas (EBITDA, FCF, DSCR, gasto financiero), descomposición de impacto por driver, tabla editable de escenarios",
          logica:  isEn ? "Each slider calls onSliderChange(key, value) → Scenarios.setVar() → emit('calc:update') → everyone updates. The scenarios table is editable inline: clicking a cell opens an input, on blur it calls Scenarios.setEscenarioVar()." : "Cada slider llama onSliderChange(key, value) → Scenarios.setVar() → emit('calc:update') → todos se actualizan. La tabla de escenarios es editable inline: click en celda abre input, al salir llama Scenarios.setEscenarioVar().",
          alerta:  isEn ? "⚠ If you move a slider while on another page, the active page updates but the Scenarios page won't recalculate until you visit it." : "⚠ Si mueves un slider estando en otra página, la página activa se actualiza pero la de Escenarios no recalcula hasta que la visitas.",
        },
        {
          id: "p3",
          nombre: isEn ? "Exchange Rate Risk" : "Tipo de Cambio",
          resumen: isEn ? "Analyzes FX exposure and models hedging instruments: forward, collar, swap." : "Analiza la exposición FX y modela instrumentos de cobertura: forward, collar, swap.",
          inputs:  isEn ? "USD/MXN slider via var:usdmxn" : "Slider USD/MXN via var:usdmxn",
          outputs: isEn ? "Exposure KPIs, payoff comparison, payoff chart, real-time collar pricing" : "KPIs de exposición, comparativa payoffs, payoff chart, collar pricing en tiempo real",
          logica:  isEn ? "The payoff chart draws on Canvas the revenue vs FX rate curve for 4 instruments: unhedged (gray line), forward (flat line at strike), collar (kinked at floor/cap), and synthetic swap. Uses forwardPrice() for the theoretical price and collarPayoff() for the payoff at each point." : "El payoff chart dibuja en Canvas la curva de ingreso vs TC para 4 instrumentos: sin cobertura (línea gris), forward (línea plana al precio pactado), collar (kinked en floor y cap) y swap sintético. Usa forwardPrice() para el precio teórico y collarPayoff() para el payoff en cada punto.",
          alerta:  isEn ? "⚠ Only subscribes to var:usdmxn. If you change SOFR (which affects the forward price), the chart won't update automatically." : "⚠ Solo se suscribe a var:usdmxn. Si cambias SOFR (que afecta el precio del forward), el chart no se actualiza automáticamente.",
        },
        {
          id: "p4",
          nombre: isEn ? "Gold Price Risk" : "Precio del Oro",
          resumen: isEn ? "Analyzes Metallorum's exposure. 2026 Target: 20,000 oz with no active hedging." : "Analiza exposición de Metallorum. Meta 2026: 20,000 oz sin cobertura activa.",
          inputs:  isEn ? "Gold Price slider via var:precioOro" : "Slider Precio Oro via var:precioOro",
          outputs: isEn ? "Metallorum KPIs, 4 instruments (Forward, Put-Heston, Collar, COMEX Futures), scenario comparative table, payoff chart" : "KPIs de Metallorum, 4 instrumentos (Forward, Put-Heston, Collar, Futuros COMEX), tabla comparativa por escenario, payoff chart",
          logica:  isEn ? "KPIs use ozAnual = 20,000 (May-2026 mgmt target). The put uses Heston by default (captures gold volatility skew). The collar uses collarPrice() with gold Heston params: kappa=1.2, theta_v=0.04, xi=0.35, rho_sv=-0.40." : "Los KPIs usan ozAnual = 20,000 (meta junta may-2026). La put usa Heston por defecto (captura skew del oro). El collar usa collarPrice() con hestonParams del oro: kappa=1.2, theta_v=0.04, xi=0.35, rho_sv=−0.40.",
          alerta:  null,
        },
        {
          id: "p5",
          nombre: isEn ? "Natural Gas Risk" : "Gas Natural",
          resumen: isEn ? "Operating cost without hedging. Uses Schwartz 1-factor because of natural gas mean reversion." : "Costo operativo sin cobertura. Usa Schwartz 1-factor por la reversión a la media del gas.",
          inputs:  isEn ? "Natural Gas slider via var:precioGas" : "Slider Gas Natural via var:precioGas",
          outputs: isEn ? "Estimated exposure, swap and collar pricing with Schwartz model" : "Exposición estimada, pricing de swap y collar con modelo Schwartz",
          logica:  isEn ? "schwartz() calculates cumulative variance to maturity (varT) and the expected forward price (F). Uses Black-76 on that forward to price options. kappa=1.5 means gas reverts to its mean in ~8 months." : "schwartz() calcula la varianza acumulada hasta vencimiento (varT) y el precio forward esperado (F). Usa Black-76 sobre ese forward para valorar las opciones. kappa=1.5 significa que el gas revierte a su media en ~8 meses.",
          alerta:  null,
        },
        {
          id: "p6",
          nombre: isEn ? "Interest Rate Risk" : "Tasa de Interés",
          resumen: isEn ? "Analyzes the existing TIIE collar (no current benefit) and proposes SOFR hedging." : "Analiza el collar TIIE existente (sin beneficio actual) y propone cobertura SOFR.",
          inputs:  isEn ? "TIIE and SOFR sliders" : "Sliders TIIE y SOFR",
          outputs: isEn ? "Mark-to-market of the active TIIE collar, analysis of why it does not benefit (TIIE 7% < floor 8.75%), proposed SOFR IRS" : "MTM del collar TIIE existente, análisis de por qué no beneficia (TIIE 7% < floor 8.75%), propuesta de IRS sobre SOFR",
          logica:  isEn ? "swapMTM() calculates the NPV of all future collar flows discounted at the current rate. If TIIE < floor (current state), the collar is not exercised and Autlán pays full market rate — the impairment is the cost of the premium paid." : "swapMTM() calcula el VPN de todos los flujos futuros del collar descontados a la tasa actual. Si TIIE < floor (caso actual), el collar no se ejerce y Autlán paga tasa de mercado completa — la minusvalía es el costo de la prima pagada.",
          alerta:  isEn ? "⚠ The TIIE collar has an accumulated loss of USD 45.6K as of 4Q25. TIIE would have to rise to 8.75% for the instrument to start protecting." : "⚠ El collar TIIE tiene minusvalía acumulada de USD 45.6K al 4T25. TIIE tendría que subir a 8.75% para que el instrumento empiece a proteger.",
        },
        {
          id: "p7",
          nombre: isEn ? "Manganese Price Risk" : "Manganeso",
          resumen: isEn ? "Price risk of the main commodity. Limited OTC market in Mexico." : "Riesgo de precio del commodity principal. Mercado OTC limitado en México.",
          inputs:  isEn ? "Manganese Price slider" : "Slider Precio Manganeso",
          outputs: isEn ? "Revenue sensitivity, hedging alternatives (fixed swap, synthetic collar), market analysis" : "Sensibilidad de ingresos, alternativas de cobertura (swap fijo, collar sintético), análisis de mercado",
          logica:  isEn ? "Revenue impact = Base_Revenues × 0.60 × (Mn-1,309)/1,309. The 0.60 reflects that ~60% of revenues are manganese ferroalloys." : "El impacto en ingresos = Ingresos_base × 0.60 × (Mn−1,309)/1,309. El 0.60 refleja que ~60% de los ingresos son ferroaleaciones de manganeso.",
          alerta:  null,
        },
        {
          id: "p8",
          nombre: isEn ? "Secondary Risks" : "Riesgos Secundarios",
          resumen: isEn ? "Risks that do not have their own slider: counterparty, basis, liquidity, regulatory, operational." : "Riesgos que no tienen slider propio: contraparte, base, liquidez, regulatorio, operativo.",
          inputs:  isEn ? "None — qualitative analysis" : "Ninguno — análisis cualitativo",
          outputs: isEn ? "Risk map, heatmaps by category, recommended actions" : "Mapa de riesgos, semáforos por categoría, acciones recomendadas",
          logica:  isEn ? "Static. Scores are expert judgements based on XBRL and board meeting data. They do not update with sliders." : "Estático. Los scores son juicios de experto basados en los datos del XBRL y la junta. No se actualizan con los sliders.",
          alerta:  null,
        },
        {
          id: "p9",
          nombre: isEn ? "Optimal Strategy" : "Estrategia Óptima",
          resumen: isEn ? "Integrates all hedges into a single portfolio and displays P&L by scenario." : "Integra todas las coberturas en un portafolio y muestra el P&L por escenario.",
          inputs:  isEn ? "calc:update (all sliders) + escenarios:update" : "calc:update (todos los sliders) + escenarios:update",
          outputs: isEn ? "Portfolio of 5 hedges, EBITDA master table with/without strategy, explicit tradeoff, integrated payoff chart" : "Portafolio de 5 coberturas, tabla maestra de EBITDA con/sin estrategia, tradeoff explícito, payoff chart integrado",
          logica:  isEn ? "See section 6 below." : "Ver sección 6 abajo.",
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
              <span style="font-weight:600; color:var(--text-primary);">${isEn ? "Logic:" : "Lógica:"} </span>
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
    <div class="section-title">
      ${isEn ? "6 · How the Optimal Strategy is Built" : "6 · Cómo se construye la Estrategia Óptima"}
    </div>
    <div class="card mb-24">

      <div style="font-size:13px; line-height:1.8; margin-bottom:20px;">
        ${isEn
          ? `The strategy is not a mathematical optimization (there is no solver). It is a portfolio of business rules that respects Autlán's internal policy and maximizes protection without premium cost.`
          : `La estrategia no es una optimización matemática (no hay solver). Es un portafolio de reglas de negocio que respeta la política interna de Autlán y maximiza protección sin prima de costo.`}
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
        ${[
          {
            id: "COB-FX-01",
            instrumento: isEn ? "Additional USD/MXN Collar" : "Collar USD/MXN adicional",
            por_que: isEn 
              ? "The active collar covers only ~3% of revenues (expires Jun-2026). Policy allows 60%. Recommended 4 monthly collars of USD 4M/month to increase coverage to ~21%."
              : "El collar existente cubre solo 3% de ingresos (vence jun-2026). La política permite 60%. Se recomiendan 4 collares mensuales a USD 4M/mes para subir a ~21%.",
            como: isEn 
              ? "floor = $17.40, cap = $18.40. Costless because the TIIE-SOFR interest rate differential adds value to the put, financing the call."
              : "floor = $17.40, cap = $18.40. Costless porque la tasa diferencial TIIE−SOFR crea valor en el put que financia el call.",
            payoff: isEn 
              ? "If FX < $17.40 → receive (17.40-TC)×$4M/month. If FX > $18.40 → pay (TC-18.40)×$4M/month. If between $17.40 and $18.40 → zero."
              : "Si TC < $17.40 → recibe (17.40−TC)×$4M/mes. Si TC > $18.40 → paga (TC−18.40)×$4M/mes. Si entre $17.40 y $18.40 → cero.",
            color: "var(--accent)",
          },
          {
            id: "COB-ORO-01",
            instrumento: isEn ? "Metallorum Gold Collar" : "Collar oro Metallorum",
            por_que: isEn 
              ? "20,000 oz target in 2026 with no active hedging. Price at historic highs ($3,000+). Risk of drop to $2,400 = loss of USD 12M in revenues."
              : "Meta 20,000 oz en 2026 sin ninguna cobertura. Precio en máximos históricos ($3,000+). Riesgo de caída a $2,400 = pérdida de USD 12M en ingresos.",
            como: isEn 
              ? "Collar $2,700-$3,300 on 10,000 oz (~50% target). Costless: high gold volatility (18%) makes the $3,300 call finance the $2,700 put."
              : "Collar $2,700–$3,300 sobre 10,000 oz (~50% meta). Costless: la alta volatilidad del oro (18%) hace que el call $3,300 financie el put $2,700.",
            payoff: isEn 
              ? "If gold < $2,700 → receive ($2,700-gold)×10,000. If gold > $3,300 → pay (gold-$3,300)×10,000. Within range → zero."
              : "Si oro < $2,700 → recibe ($2,700−oro)×10,000. Si oro > $3,300 → paga (oro−$3,300)×10,000. Dentro del rango → cero.",
            color: "var(--gold)",
          },
          {
            id: "COB-GAS-01",
            instrumento: isEn ? "Natural Gas Fixed Swap" : "Swap precio fijo gas",
            por_que: isEn 
              ? "No active hedging. Gas can rise to $5/MMBtu in adverse scenario → additional cost of $2.8M. Swap locks in the purchase price."
              : "Sin cobertura activa. Gas puede subir a $5/MMBtu en escenario adverso → costo adicional de $2.8M. Swap fija el precio de compra.",
            como: isEn 
              ? "Fixed price = $3.35/MMBtu on 900K MMBtu (50% of estimated consumption). Counterparty pays difference if gas rises."
              : "Precio fijo = $3.35/MMBtu sobre 900K MMBtu (50% consumo estimado). La contraparte paga la diferencia si el gas sube.",
            payoff: isEn 
              ? "If gas rises to $5.00 → swap generates savings of ($5.00-$3.35)×900K = USD 1.49M. If gas falls to $2.50 → swap has cost of ($3.35-$2.50)×900K = USD 0.77M."
              : "Si gas sube a $5.00 → swap genera ahorro de ($5.00−$3.35)×900K = USD 1.49M. Si gas baja a $2.50 → swap tiene costo de ($3.35−$2.50)×900K = USD 0.77M.",
            color: "var(--success)",
          },
          {
            id: "COB-TASA-01",
            instrumento: isEn ? "SOFR IRS — Variable to Fixed" : "IRS SOFR — variable a fija",
            por_que: isEn 
              ? "USD 135M debt at SOFR+6%. If SOFR rises by 100bps → additional cost of USD 1.35M/year. An IRS converts 50% to fixed rate, eliminating uncertainty."
              : "USD 135M de deuda a SOFR+6%. Si SOFR sube 100bps → costo adicional $1.35M/año. Un IRS convierte 50% a tasa fija eliminando esa incertidumbre.",
            como: isEn 
              ? "Fixed rate = 4.50% on USD 67M notional. 3-year horizon. Counterparty pays variable SOFR and receives 4.50% fixed."
              : "Tasa fija = 4.50% sobre USD 67M nocional. 3 años de horizonte. La contraparte paga SOFR variable y recibe 4.50% fijo.",
            payoff: isEn 
              ? "If SOFR rises to 5.5% → swap generates savings of (5.5%-4.5%)×$67M = USD 670K/year. If SOFR drops to 3.5% → swap has cost of USD 670K/year."
              : "Si SOFR sube a 5.5% → swap genera ahorro de (5.5%−4.5%)×$67M = USD 670K/año. Si SOFR baja a 3.5% → swap tiene costo de USD 670K/año.",
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
                          text-transform:uppercase; margin-bottom:3px;">${isEn ? "Why" : "Por qué"}</div>
              <div style="font-size:11px; line-height:1.6;">${c.por_que}</div>
            </div>
            <div style="margin-bottom:8px;">
              <div style="font-size:10px; font-weight:700; color:${c.color};
                          text-transform:uppercase; margin-bottom:3px;">${isEn ? "How it works" : "Cómo funciona"}</div>
              <div style="font-size:11px; line-height:1.6;">${c.como}</div>
            </div>
            <div style="padding:8px; background:var(--bg-card);
                        border-radius:var(--radius-sm);">
              <div style="font-size:10px; font-weight:700; color:var(--text-muted);
                          text-transform:uppercase; margin-bottom:3px;">${isEn ? "Payoff at maturity" : "Payoff al vencimiento"}</div>
              <div style="font-size:11px; line-height:1.6;
                          font-family:var(--font-mono);">${c.payoff}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <div style="padding:14px; background:var(--bg-raised);
                  border-radius:var(--radius-md); font-size:12px;">
        <div style="font-weight:700; margin-bottom:8px;">
          ${isEn ? "How the Master Table of the Optimal Strategy is Calculated:" : "Cómo se calcula la tabla maestra de la Estrategia Óptima:"}
        </div>
        <ol style="margin:0; padding-left:18px; line-height:2.0;">
          ${isEn 
            ? `
            <li>For each scenario (base / optimistic / adverse), macro variables are retrieved from <code style="font-size:11px; background:var(--bg-card); padding:1px 4px; border-radius:3px;">Scenarios.getState().escenarios</code></li>
            <li>Unhedged EBITDA is calculated using <code style="font-size:11px; background:var(--bg-card); padding:1px 4px; border-radius:3px;">Models.impactoEscenario(vars, base)</code></li>
            <li>For each portfolio instrument, its <code style="font-size:11px; background:var(--bg-card); padding:1px 4px; border-radius:3px;">payoff(finalValue)</code> is evaluated using the scenario market value</li>
            <li>Total protection is added to unhedged EBITDA → EBITDA with strategy</li>
            <li>FCF = EBITDA with strategy − Adjusted financial expense − Capex $30M</li>
            <li>DSCR = EBITDA with strategy / Adjusted financial expense</li>
            `
            : `
            <li>Para cada escenario (base / optimista / adverso), se obtienen las variables macro de <code style="font-size:11px; background:var(--bg-card); padding:1px 4px; border-radius:3px;">Scenarios.getState().escenarios</code></li>
            <li>Se calcula el EBITDA sin cobertura con <code style="font-size:11px; background:var(--bg-card); padding:1px 4px; border-radius:3px;">Models.impactoEscenario(vars, base)</code></li>
            <li>Para cada instrumento del portafolio, se evalúa su función <code style="font-size:11px; background:var(--bg-card); padding:1px 4px; border-radius:3px;">payoff(valorFinal)</code> con el valor de mercado del escenario</li>
            <li>Se suma la protección total al EBITDA sin cobertura → EBITDA con estrategia</li>
            <li>FCF = EBITDA con estrategia − Gasto financiero ajustado − Capex $30M</li>
            <li>DSCR = EBITDA con estrategia / Gasto financiero ajustado</li>
            `
          }
        </ol>
      </div>

    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 7 — CALCULADORA EN VIVO
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "7 · Live Calculator — View the Model Step-by-Step" : "7 · Calculadora en vivo — ve el modelo paso a paso"}
    </div>
    <div class="card mb-24" id="docs-calculadora">
      <!-- Se llena en _docsRenderCalculadora() -->
    </div>

    <!-- ══════════════════════════════════════════
         SECCIÓN 8 — SUPUESTOS Y LIMITACIONES
    ══════════════════════════════════════════ -->
    <div class="section-title">
      ${isEn ? "8 · Key Assumptions and Model Limitations" : "8 · Supuestos clave y limitaciones del modelo"}
    </div>
    <div class="card mb-24">

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">

        <div>
          <div style="font-size:11px; font-weight:700; color:var(--danger);
                      text-transform:uppercase; letter-spacing:0.5px;
                      margin-bottom:12px;">${isEn ? "⚠ Important Limitations" : "⚠ Limitaciones importantes"}</div>
          ${(isEn ? [
            "Base EBITDA = 2025 audited ($31.5M). The 1Q26 annualized run-rate ($43.2M) is not used to prevent optimistic bias.",
            "Metallorum revenues are based on the 2026 target of 20,000 oz. If the target is missed, the model will overestimate this segment.",
            "The Heston model is a second-order approximation, not exact complex integration. Full integration should be used for trading desk pricing.",
            "The USD 8M/year natural gas expense is an estimate. There is no exact public figure for Autlán's gas consumption.",
            "Covenants for the Santander credit line are not public — the model cannot evaluate covenant breaches.",
            "All collars are assumed to be costless. In practice, minor premiums may apply depending on market conditions at execution.",
            "Metallorum's AISC is unknown — gold revenues are gross, and real operating margins may be lower.",
          ] : [
            "EBITDA base = 2025 auditado ($31.5M). El run-rate 1T26 ($43.2M anualizado) no se usa como ancla para no crear sesgo optimista.",
            "Los ingresos de Metallorum usan la meta 2026 de 20,000 oz como base. Si la meta no se alcanza, el modelo sobreestima ese segmento.",
            "El modelo de Heston es una aproximación de segundo orden, no integración compleja exacta. Para pricing de mesa usar integración completa.",
            "El gasto en gas de $8M/año es un estimado. No hay dato público exacto del consumo de gas de Autlán.",
            "Los covenants del crédito Santander no son públicos — el modelo no puede modelar breaches de covenant.",
            "Todos los collares se asumen costless. En la práctica puede haber pequeñas primas según condiciones de mercado al contratar.",
            "El AISC de Metallorum es desconocido — los ingresos de oro son brutos, el margen real puede ser menor.",
          ]).map(l => `
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
                      margin-bottom:12px;">${isEn ? "✓ What the Model Captures Accurately" : "✓ Lo que el modelo sí captura bien"}</div>
          ${(isEn ? [
            "All balance sheet, debt, and P&L figures are from audited BMV XBRL files — primary source.",
            "The MXN cost structure / USD revenue mechanism is the most critical driver of the model and is properly calibrated.",
            "The 4 active FX collars are modeled with exact strikes and notionals from the 1Q26 XBRL report.",
            "The active TIIE collar and its actual status (no benefit because TIIE < floor 8.75%) is accurately represented.",
            "May-2026 board meeting key points are integrated as a separate source and clearly marked as unaudited.",
            "Event propagation ensures any slider change instantly updates the Dashboard and Scenarios pages.",
            "The three macro scenarios are editable inline — they can be adjusted to reflect alternative analyst forecasts.",
          ] : [
            "Todos los números de balance, deuda y P&L vienen de XBRLs auditados de la BMV — fuente primaria.",
            "La estructura de costos MXN / ingresos USD es el driver más importante del modelo y está bien calibrada.",
            "Los 4 collares FX existentes están modelados con sus strikes y nocionales exactos del XBRL 1T26.",
            "El collar TIIE existente y su situación real (sin beneficio porque TIIE < floor 8.75%) está correctamente capturado.",
            "Los key points de la junta may-2026 están integrados como fuente separada y marcados como no auditados.",
            "La propagación de eventos permite que cualquier cambio de slider se refleje instantáneamente en Dashboard y Escenarios.",
            "Los tres escenarios son editables inline — se pueden ajustar para reflejar visiones alternativas del analista.",
          ]).map(l => `
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
}

// ─────────────────────────────────────────
// CÁLCULO EN VIVO — muestra los números reales del modelo
// ─────────────────────────────────────────
function _docsRenderCalcLive() {
  const el = document.getElementById("docs-calc-live");
  if (!el) return;

  const isEn = I18N.getLocale() === "en";

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
      ${isEn 
        ? "Construction of the projected EBITDA with the current slider values. Updates in real-time."
        : "Construcción del EBITDA proyectado con los valores actuales de los sliders. Actualiza en tiempo real."}
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">

      <!-- WATERFALL EBITDA -->
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--text-muted);
                    text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">
          ${isEn ? "EBITDA Construction" : "Construcción del EBITDA"}
        </div>
        ${[
          { label: isEn ? "Base 2025 EBITDA (audited)" : "EBITDA base 2025 (auditado)", val: ebitdaBase, tipo: "neutral" },
          { label: isEn ? "+ FX Impact (USD/MXN)" : "+ Impacto FX (USD/MXN)", val: imp.fx, tipo: imp.fx >= 0 ? "pos" : "neg" },
          { label: isEn ? "+ Manganese Impact" : "+ Impacto Manganeso", val: imp.mn, tipo: imp.mn >= 0 ? "pos" : "neg" },
          { label: isEn ? "+ Gold Impact (Metallorum)" : "+ Impacto Oro (Metallorum)", val: imp.oro, tipo: imp.oro >= 0 ? "pos" : "neg" },
          { label: isEn ? "+ Natural Gas Impact" : "+ Impacto Gas Natural", val: imp.gas, tipo: imp.gas >= 0 ? "pos" : "neg" },
          { label: isEn ? "+ Volume Impact" : "+ Impacto Volumen", val: imp.volumen, tipo: imp.volumen >= 0 ? "pos" : "neg" },
          { label: isEn ? "= Projected EBITDA" : "= EBITDA proyectado", val: ebitdaActual, tipo: ebitdaActual >= 0 ? "total-pos" : "total-neg" },
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
          ${isEn ? "From EBITDA to FCF" : "De EBITDA a FCF"}
        </div>
        ${[
          { label: isEn ? "Projected EBITDA" : "EBITDA proyectado", val: ebitdaActual, tipo: ebitdaActual >= 0 ? "pos" : "neg" },
          { label: isEn ? "− Adjusted interest expense" : "− Gasto financiero ajustado", val: -gastoFinActual, tipo: "neg" },
          { label: isEn ? "− Estimated Capex" : "− Capex estimado", val: -30000, tipo: "neg" },
          { label: isEn ? "= Estimated FCF" : "= FCF estimado", val: fcf, tipo: fcf >= 0 ? "total-pos" : "total-neg" },
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
            <span style="font-size:12px; font-weight:600;">${isEn ? "Estimated DSCR" : "DSCR estimado"}</span>
            <span style="font-family:var(--font-mono); font-size:18px; font-weight:700;
                         color:${res.dscr >= 1 ? "var(--success)" : res.dscr >= 0.6 ? "var(--warn)" : "var(--danger)"};">
              ${res.dscr.toFixed(2)}x
            </span>
          </div>
          <div style="font-size:10.5px; color:var(--text-muted); margin-top:4px;">
            ${isEn
              ? `EBITDA / Adjusted Interest Expense · ${res.dscr >= 1 ? "Covers debt service" : "Does not cover debt service — covenant risk"}`
              : `EBITDA / Gasto financiero ajustado · ${res.dscr >= 1 ? "Cubre servicio de deuda" : "No cubre servicio de deuda — riesgo covenant"}`}
          </div>
        </div>

        <div style="margin-top:10px; padding:12px; background:var(--bg-raised);
                    border-radius:var(--radius-md);">
          <div style="font-size:11px; font-weight:700; color:var(--text-muted);
                      margin-bottom:6px;">${isEn ? "Current slider values:" : "Variables actuales de los sliders:"}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
            ${Object.entries(vars).map(([k, v]) => {
              const cfg = Scenarios.SLIDER_CONFIG[k];
              const lbl = cfg ? (isEn && cfg.labelEn ? cfg.labelEn : cfg.label) : k;
              return `
                <div style="font-size:10.5px; display:flex; justify-content:space-between;
                            padding:3px 0; border-bottom:1px solid var(--border);">
                  <span style="color:var(--text-muted);">${lbl}</span>
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

  const isEn = I18N.getLocale() === "en";

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
      ${isEn 
        ? "Trace the 3 largest impacts step-by-step with the current values. Move the sliders in the Scenarios page and return here to see how the calculations change."
        : "Traza los 3 impactos más grandes paso a paso con los valores actuales. Mueve los sliders en la página de Escenarios y vuelve aquí para ver cómo cambian los cálculos."}
    </div>

    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">

      ${[
        {
          titulo:  isEn ? "💱 FX Calculation" : "💱 Cálculo FX",
          pasos: [
            { desc: isEn ? "Current FX" : "TC actual", val: fmt.fx(tc) },
            { desc: isEn ? "Reference base FX" : "TC base referencia", val: fmt.fx(tcBase) },
            { desc: isEn ? "Delta FX (%)" : "Delta TC (%)", val: `${(deltaTC*100).toFixed(2)}%` },
            { desc: isEn ? "Base revenues" : "Ingresos base", val: fmt.usd(ingBase) },
            { desc: isEn ? "× FX Factor (85%)" : "× Factor FX (85%)", val: "0.85" },
            { desc: isEn ? "= EBITDA Impact" : "= Impacto EBITDA", val: fmt.usd(impFX), bold: true,
              color: impFX >= 0 ? "var(--success)" : "var(--danger)" },
          ],
          formula: isEn ? "Revenues × (FX−18)/18 × 0.85" : "Ingresos × (TC−18)/18 × 0.85",
          color: "var(--accent)",
        },
        {
          titulo:  isEn ? "⛏ Manganese Calculation" : "⛏ Cálculo Manganeso",
          pasos: [
            { desc: isEn ? "Current Mn Price" : "Precio Mn actual", val: fmt.mn(mn) },
            { desc: isEn ? "Base price" : "Precio base", val: fmt.mn(mnBase) },
            { desc: isEn ? "Delta Mn (%)" : "Delta Mn (%)", val: `${(deltaMn*100).toFixed(2)}%` },
            { desc: isEn ? "Base revenues" : "Ingresos base", val: fmt.usd(ingBase) },
            { desc: isEn ? "× % ferroalloys" : "× % ferroaleaciones", val: "0.60" },
            { desc: isEn ? "= EBITDA Impact" : "= Impacto EBITDA", val: fmt.usd(impMn), bold: true,
              color: impMn >= 0 ? "var(--success)" : "var(--danger)" },
          ],
          formula: isEn ? "Revenues × 0.60 × (Mn−1,309)/1,309" : "Ingresos × 0.60 × (Mn−1,309)/1,309",
          color: "var(--text-primary)",
        },
        {
          titulo:  isEn ? "🥇 Gold Calculation" : "🥇 Cálculo Oro",
          pasos: [
            { desc: isEn ? "Current gold price" : "Precio oro actual", val: fmt.oro(oro) },
            { desc: isEn ? "Base price" : "Precio base", val: fmt.oro(oroBase) },
            { desc: isEn ? "Delta gold (%)" : "Delta oro (%)", val: `${(deltaOro*100).toFixed(2)}%` },
            { desc: isEn ? "20,000 oz Target" : "Meta oz 2026", val: "20,000 oz" },
            { desc: isEn ? "× USD Base ($3,000)" : "× Base USD ($3,000)", val: "USD 60M" },
            { desc: isEn ? "= EBITDA Impact" : "= Impacto EBITDA", val: fmt.usd(impOro), bold: true,
              color: impOro >= 0 ? "var(--success)" : "var(--danger)" },
          ],
          formula: "20,000 oz × $3,000 × (Gold−3,000)/3,000",
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
