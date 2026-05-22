/**
 * js/i18n.js — Sistema de Traducción Internacionalización (ES / EN)
 * Autlán Risk Desk Dashboard
 *
 * Implementa una traducción dinámica y no invasiva utilizando:
 * 1. Un MutationObserver que detecta cambios en el DOM y traduce dinámicamente.
 * 2. Un proxy / interceptor para CanvasRenderingContext2D para traducir texto de los payoffs.
 * 3. Selector estético de lenguaje inyectado en el topbar.
 */

window.I18N = (() => {
  const STORAGE_KEY = "autlan_lang";
  let activeLang = localStorage.getItem(STORAGE_KEY) || "es";

  // Diccionario completo de traducción (Español -> Inglés)
  const DICTIONARY = {
    // ── SIDEBAR
    "Mesa de Riesgos": "Risk Desk",
    "Mesa de Riesgos & Coberturas": "Risk & Hedging Desk",
    "GENERAL": "GENERAL",
    "Dashboard": "Dashboard",
    "Perfil Autlán": "Autlán Profile",
    "Escenarios & Inputs": "Scenarios & Inputs",
    "COBERTURAS": "HEDGING",
    "Tipo de Cambio": "Exchange Rate",
    "Precio del Oro": "Gold Price",
    "Gas Natural": "Natural Gas",
    "Tasa de Interés": "Interest Rate",
    "Manganeso": "Manganese",
    "ANÁLISIS": "ANALYSIS",
    "Riesgos Secundarios": "Secondary Risks",
    "Estrategia Óptima": "Optimal Strategy",
    "Actualizando...": "Updating...",
    "XBRL 1T26 · BMV": "XBRL 1Q26 · BMV",

    // ── TOPBAR
    "Base": "Base",
    "Optimista": "Optimistic",
    "Adverso": "Adverse",
    "EBITDA proy.": "Proj. EBITDA",

    // ── GENERAL BUTTONS & ALERTS
    "Guardado": "Saved",
    "Cancelar": "Cancel",
    "Confirmar": "Confirm",
    "Editar": "Edit",
    "Guardar": "Save",
    "Actualizar": "Update",
    "Cargando...": "Loading...",
    "Activa": "Active",
    "Auditado": "Audited",
    "Outlook Negativo": "Negative Outlook",
    "CRÍTICO": "CRITICAL",
    "SIN COBERTURA": "UNHEDGED",
    "FUERA DINERO": "OTM",
    "FUERA DEL DINERO": "OUT OF THE MONEY",
    "En el dinero": "In the money",
    "Fuera del dinero": "Out of the money",

    // ── PÁGINA 0: DASHBOARD
    "Dashboard ejecutivo": "Executive Dashboard",
    "Estado de riesgo y cobertura en tiempo real · Autlán Q1 2026": "Real-time risk and hedging status · Autlán Q1 2026",
    "Estado de cobertura · Al 31 mar 2026": "Hedging Status · As of March 31, 2026",
    "Impacto financiero por escenario": "Financial Impact by Scenario",
    "Variable / Resultado": "Variable / Outcome",
    "Estructura de deuda": "Debt Structure",
    "USD 185.9M total · 1T26": "USD 185.9M Total · 1Q26",
    "Política de cobertura": "Hedging Policy",
    "Límites formales documentados · XBRL 1T26": "Formal Documented Limits · XBRL 1Q26",
    "Ingresos 1T26 (anualiz.)": "1Q26 Revenues (annualized)",
    "EBITDA proyectado": "Projected EBITDA",
    "Deuda neta": "Net Debt",
    "DSCR proyectado": "Projected DSCR",
    "Bajo 1.0x": "Below 1.0x",
    "Total deuda": "Total Debt",
    "deuda a tasa variable · Solo": "variable rate debt · Only",
    "tasa fija": "fixed rate",
    "Objetivo exclusivo de cobertura — no especulación.": "Hedging only — not for speculation.",
    "Contrapartes de alta calidad crediticia. Mercados OTC/extrabursátiles.": "High credit quality counterparties. OTC/over-the-counter markets.",
    "Tratamiento contable IFRS 9 — cobertura de flujo de efectivo.": "IFRS 9 accounting treatment — cash flow hedge accounting.",
    "Bajo 1.0x": "Below 1.0x",

    // ── PÁGINA 1: PERFIL
    "Perfil Financiero Autlán": "Autlán Financial Profile",
    "Datos auditados XBRL 4T25 y 1T26 · BMV": "Audited Data XBRL 4Q25 & 1Q26 · BMV",
    "Resultados financieros clave": "Key Financial Results",
    "Ingresos 2025": "Revenues 2025",
    "EBITDA 2025": "EBITDA 2025",
    "Pérdida neta 2025": "Net Loss 2025",
    "Ingresos 1T26": "Revenues 1Q26",
    "Pico 38% en 2022": "Peak 38% in 2022",
    "Gasto financiero": "Financial expense",
    "Récord trimestral": "Quarterly record",
    "Estado de resultados comparativo": "Comparative Income Statement",
    "Concepto (USD miles)": "Concept (USD thousands)",
    "Ingresos netos": "Net revenues",
    "Costo de ventas": "Cost of goods sold",
    "Utilidad bruta": "Gross profit",
    "Gastos de venta": "Selling expenses",
    "Gastos de administración": "Administrative expenses",
    "Utilidad (pérdida) operación": "Operating profit (loss)",
    "Gastos financieros": "Financial expenses",
    "Pérdida neta": "Net loss",
    "Balance general · 31 mar 2026": "Balance Sheet · March 31, 2026",
    "XBRL 1T26 · cifras en USD miles": "XBRL 1Q26 · figures in USD thousands",
    "Activos": "Assets",
    "Efectivo y equivalentes": "Cash and equivalents",
    "Cuentas por cobrar": "Accounts receivable",
    "Inventarios": "Inventories",
    "Otros circulantes": "Other current assets",
    "Total activo circulante": "Total current assets",
    "Propiedades, planta y equipo": "Property, plant and equipment",
    "Intangibles y crédito mercantil": "Intangibles and goodwill",
    "Total activo no circulante": "Total non-current assets",
    "TOTAL ACTIVOS": "TOTAL ASSETS",
    "Pasivos y capital": "Liabilities & Equity",
    "Pasivos circulantes": "Current liabilities",
    "Deuda largo plazo": "Long-term debt",
    "Otras provisiones LP": "Other LT provisions",
    "Total pasivos": "Total liabilities",
    "Capital contable total": "Total equity",
    "Métricas de crédito": "Credit Metrics",
    "Leverage (Deuda/Activos)": "Leverage (Debt/Assets)",
    "Gasto financiero anual": "Annual financial expense",
    "Efectivo disponible": "Available cash",
    "Deuda / EBITDA": "Debt / EBITDA",
    "Calificaciones crediticias": "Credit Ratings",
    "Segmentos de negocio · 2025": "Business Segments · 2025",
    "Ferroaleaciones & Mn": "Ferroalloys & Mn",
    "EMD (batería/industrial)": "EMD (battery/industrial)",
    "Metallorum (oro)": "Metallorum (gold)",
    "Energía (intra-segmento)": "Energy (intra-segment)",
    "Estructura de deuda detallada · 1T26": "Detailed Debt Structure · 1Q26",
    "Acreedor": "Creditor",
    "Tasa": "Rate",
    "Moneda": "Currency",
    "Vencimiento": "Maturity",
    "Saldo (USD K)": "Balance (USD K)",
    "Riesgo": "Risk",
    "TOTAL DEUDA": "TOTAL DEBT",
    "Instrumentos derivados vigentes · 1T26": "Active Derivative Instruments · 1Q26",
    "Collar TIIE — Tasa de interés": "TIIE Collar — Interest Rate",
    "Floor (cap largo)": "Floor (long cap)",
    "Cap (floor corto)": "Cap (short floor)",
    "Collares USD/MXN — Tipo de cambio": "USD/MXN Collars — Exchange Rate",
    "Nocional total activo": "Total Active Notional",
    "Ingresos anualizados": "Annualized Revenues",
    "% cubierto actualmente": "% Currently Covered",
    "Límite de política": "Policy Limit",
    "Gap sin protección": "Unprotected Gap",

    // ── PÁGINA 2: ESCENARIOS & INPUTS
    "Variables independientes": "Independent Variables",
    "Valores por escenario": "Values per Scenario",
    "Narrativa macro por escenario": "Macro Narrative per Scenario",
    "Variables dependientes — calculadas en tiempo real": "Dependent Variables — Calculated in Real-Time",
    "Descomposición del impacto sobre EBITDA": "EBITDA Impact Decomposition",
    "Muestra cómo las variables macro afectan el EBITDA vs. Año Base 2025": "Shows how macro variables affect EBITDA vs. Base Year 2025",
    "Restablecer valores": "Reset Values",
    "Guardar escenario": "Save Scenario",
    "Nombre del escenario": "Scenario Name",
    "Guardar como nuevo": "Save as New",
    "Tipo de cambio (USD/MXN)": "Exchange Rate (USD/MXN)",
    "Precio del Manganeso (USD/t)": "Manganese Price (USD/t)",
    "Precio del Oro (USD/oz)": "Gold Price (USD/oz)",
    "Tasa TIIE 28d (% anual)": "TIIE 28d Rate (% annual)",
    "Tasa SOFR 1m (% anual)": "SOFR 1m Rate (% annual)",
    "Costo Gas Natural (USD/MMBtu)": "Natural Gas Cost (USD/MMBtu)",
    "Ingresos Mn Proyectados": "Projected Mn Revenues",
    "Ingresos Oro Proyectados": "Projected Gold Revenues",
    "Costo Energía (Smelting)": "Energy Cost (Smelting)",
    "Margen EBITDA proyectado": "Projected EBITDA Margin",
    "FCF proyectado (anual)": "Projected FCF (Annual)",
    "DSCR final proyectado": "Projected Final DSCR",
    "Impacto Manganeso": "Manganese Impact",
    "Impacto Oro (Metallorum)": "Gold Impact (Metallorum)",
    "Impacto Gas Natural": "Natural Gas Impact",
    "Impacto Tasas de Interés": "Interest Rate Impact",
    "Impacto Tipo de Cambio": "Exchange Rate Impact",
    "EBITDA Proyectado Final": "Final Projected EBITDA",

    // ── PÁGINA 3: TIPO DE CAMBIO
    "Collares USD/MXN vigentes · 1T26": "Active USD/MXN Collars · 1Q26",
    "Evaluar instrumentos de cobertura": "Evaluate Hedging Instruments",
    "Comparativo de flujos por escenario": "Flow Comparison by Scenario",
    "Diagrama de payoff · USD/MXN": "Payoff Diagram · USD/MXN",
    "Análisis y recomendación": "Analysis & Recommendation",
    "USD/MXN actual": "Current USD/MXN",
    "Impacto por $1 MXN": "Impact per $1 MXN",
    "Exposición cubierta": "Covered Exposure",
    "Exposición sin cubrir": "Uncovered Exposure",
    "En ingresos anualizados": "In Annualized Revenues",
    "Por movimiento unitario": "Per Unit Movement",
    "Muy por debajo del 60%": "Far Below 60%",
    "desprotegido": "unprotected",
    "Gap vs política": "Gap vs Policy",
    "Fecha contrato": "Contract Date",
    "Floor (put largo)": "Floor (long put)",
    "Cap (call corto)": "Cap (short call)",
    "Nocional/mes": "Notional/month",
    "Estado TC actual": "Current FX Status",
    "Payoff estimado": "Estimated Payoff",
    "✓ Put protege": "✓ Put protects",
    "✗ Call limita": "✗ Call limits",
    "◎ Dentro del rango": "◎ Within range",
    "Parámetros del collar": "Collar Parameters",
    "Floor — put largo (piso de protección)": "Floor — long put (protection floor)",
    "Cap — call corto (techo que se cede)": "Cap — short call (yielded ceiling)",
    "Nocional (USD miles)": "Notional (USD thousands)",
    "Horizonte (meses)": "Horizon (months)",
    "Volatilidad implícita (%)": "Implied Volatility (%)",
    "Parámetros del forward": "Forward Parameters",
    "Tipo de cambio spot (USD/MXN)": "Spot Exchange Rate (USD/MXN)",
    "Tasa MXN — TIIE (% anual)": "MXN Rate — TIIE (% annual)",
    "Tasa USD — SOFR (% anual)": "USD Rate — SOFR (% annual)",
    "Put USD/MXN — opción de venta": "USD/MXN Put — Sell Option",
    "Spot actual": "Current Spot",
    "Strike (precio de ejercicio)": "Strike (exercise price)",
    "Modelo de pricing": "Pricing Model",
    "Black-Scholes estándar": "Standard Black-Scholes",
    "Heston (volatilidad estocástica)": "Heston (stochastic volatility)",
    "Cross-currency swap USD/MXN": "USD/MXN Cross-Currency Swap",
    "Nocional en USD (miles)": "Notional in USD (thousands)",
    "Tasa fija MXN que recibes (%)": "Fixed MXN Rate Received (%)",
    "TIIE actual (%)": "Current TIIE (%)",
    "Spread sobre TIIE (%)": "Spread over TIIE (%)",
    "Vencimiento (años)": "Maturity (years)",
    "Resultado del collar": "Collar Outcome",
    "Prima put": "Put premium",
    "Prima call": "Call premium",
    "Costo neto collar": "Net collar cost",
    "Costo total nocional": "Total notional cost",
    "Rango protegido": "Protected range",
    "¿Costless collar?": "Costless collar?",
    "✓ Sí — prima cero": "✓ Yes — zero premium",
    "✗ No — tiene costo": "✗ No — has cost",
    "Modelo": "Model",
    "Resultado del forward": "Forward Outcome",
    "Precio forward": "Forward price",
    "Puntos swap (fwd−spot)": "Swap points (fwd-spot)",
    "Diferencial tasas (TIIE−SOFR)": "Interest rate differential (TIIE-SOFR)",
    "Costo de oportunidad": "Opportunity cost",
    "Resultado de la put": "Put Outcome",
    "Prima total nocional": "Total notional premium",
    "Prima % nocional": "Premium % of notional",
    "Delta": "Delta",
    "Gamma": "Gamma",
    "Vega (por 1% vol)": "Vega (per 1% vol)",
    "Moneyness": "Moneyness",
    "ITM — en el dinero": "ITM — in the money",
    "OTM — fuera del dinero": "OTM — out of the money",
    "Resultado del swap": "Swap Outcome",
    "Tasa fija pactada": "Contracted fixed rate",
    "Tasa variable actual": "Current variable rate",
    "Mark-to-market": "Mark-to-Market",
    "Ahorro/costo anual": "Annual saving/cost",
    "DV01": "DV01",
    "Sin cobertura": "Unhedged",
    "Ganancia/pérdida del instrumento en función del tipo de cambio al vencimiento": "Gain/loss of the instrument as a function of the exchange rate at maturity",
    "TC actual": "Actual FX",
    "Análisis de postura · USD/MXN": "Stance Analysis · USD/MXN",
    "QUÉ RIESGO MITIGA": "WHAT RISK IT MITIGATES",
    "QUÉ RIESGO ACEPTA": "WHAT RISK IT ACCEPTS",
    "QUÉ SACRIFICA": "WHAT IT SACRIFICES",
    "Postura actual:": "Current stance:",

    // ── PÁGINA 4: ORO
    "Flujo por escenario · Sin vs Con cobertura": "Cash Flow per Scenario · Unhedged vs Hedged",
    "Diagrama de payoff · Precio del oro": "Payoff Diagram · Gold Price",
    "Precio Oro actual": "Current Gold Price",
    "Producción proyectada": "Projected Production",
    "Sensibilidad (USD/oz)": "Sensitivity (USD/oz)",
    "Volatilidad anual oro": "Annual Gold Vol.",
    "Para 2026 (anualizado)": "For 2026 (annualized)",
    "Por cada USD 100/oz": "Per USD 100/oz shift",
    "Exposición no cubierta": "Uncovered Exposure",
    "En máximos de 10 años": "At 10-year highs",
    "Parámetros del forward oro": "Gold Forward Parameters",
    "Precio forward oro (USD/oz)": "Gold Forward Price (USD/oz)",
    "Put sobre oro · Heston": "Gold Put Option · Heston",
    "Costless collar sobre oro": "Gold Costless Collar",
    "Futuros COMEX (GC)": "COMEX Futures (GC)",
    "Margen inicial requerido": "Required Initial Margin",
    "Resultado del forward oro": "Gold Forward Outcome",
    "Resultado futuros COMEX": "COMEX Futures Outcome",
    "Ganancia/pérdida del instrumento en función del precio del oro al vencimiento": "Gain/loss of the instrument as a function of the gold price at maturity",
    "Precio oro actual": "Current gold price",

    // ── PÁGINA 5: GAS NATURAL
    "Perfil de consumo energético · Autlán": "Energy Consumption Profile · Autlán",
    "Exposición al gas natural": "Natural Gas Exposure",
    "Costo operativo gas por escenario": "Gas Operating Cost by Scenario",
    "Diagrama de payoff · Gas natural": "Payoff Diagram · Natural Gas",
    "Precio Gas actual": "Current Gas Price",
    "Consumo anualizado": "Annualized Consumption",
    "Sensibilidad (gas)": "Sensitivity (Gas)",
    "Costo gas proyectado": "Projected Gas Cost",
    "Por cada USD 1/MMBtu": "Per USD 1/MMBtu shift",
    "Exposición desprotegida": "Unprotected Exposure",
    "Fuentes de energía": "Energy Sources",
    "Gas natural (Henry Hub)": "Natural Gas (Henry Hub)",
    "Energía eléctrica (CENACE)": "Electricity (CENACE)",
    "Diésel y otros combustibles": "Diesel & other fuels",
    "Parámetros del swap de gas": "Gas Swap Parameters",
    "Precio swap pactado (USD/MMBtu)": "Contracted Swap Price (USD/MMBtu)",
    "Collar de gas": "Gas Collar",
    "Resultado de la put de gas": "Gas Put Outcome",
    "Resultado del swap de gas": "Gas Swap Outcome",
    "Ganancia/pérdida en función del precio de Henry Hub al vencimiento": "Gain/loss as a function of Henry Hub price at maturity",
    "Precio gas actual": "Current gas price",

    // ── PÁGINA 6: TASA DE INTERÉS
    "Collar de tasa existente": "Existing Interest Rate Collar",
    "Análisis de situación actual": "Current Situation Analysis",
    "Costo de intereses por escenario": "Interest Expense by Scenario",
    "TIIE 28d actual": "Current TIIE 28d",
    "SOFR 1m actual": "Current SOFR 1m",
    "Deuda tasa variable": "Variable Rate Debt",
    "Interés proyectado (anual)": "Projected Interest (Annual)",
    "Spread promedio bancario": "Average Bank Spread",
    "Nocional collar activo": "Active Collar Notional",
    "Cupones pendientes": "Pending Coupons",
    "Mark-to-Market actual": "Current Mark-to-Market",
    "Acreedores vinculados": "Linked Creditors",
    "Pérdida en 1T26": "Loss in 1Q26",
    "Parámetros del cap de tasa": "Interest Rate Cap Parameters",
    "Cap de tasa (strike)": "Interest Rate Cap (Strike)",
    "Parámetros del swap de tasa": "Interest Rate Swap Parameters",
    "Pagar fija / recibir variable": "Pay Fixed / Receive Variable",
    "Tasa fija a pagar (%)": "Fixed Rate to Pay (%)",
    "Fijar 100% de deuda variable": "Fix 100% of Variable Debt",
    "Resultado del cap": "Cap Outcome",
    "Resultado del collar de tasa": "Rate Collar Outcome",
    "Resultado del swap de tasa": "Rate Swap Outcome",
    "Ganancia/pérdida del collar en función de la TIIE 28d al vencimiento": "Gain/loss of the collar as a function of TIIE 28d at maturity",
    "TIIE actual": "Current TIIE",

    // ── PÁGINA 7: MANGANESO
    "Estructura del mercado": "Market Structure",
    "Drivers del precio": "Price Drivers",
    "Precio Mn actual": "Current Mn Price",
    "Producción anualizada": "Annualized Production",
    "Sensibilidad Mn": "Mn Sensitivity",
    "Ingresos Mn proyectados": "Projected Mn Revenues",
    "Por cada USD 100/t": "Per USD 100/t shift",
    "Exposición no mitigable": "Non-mitigatable Exposure",
    "No existen derivados OTC fluidos": "Fluid OTC derivatives do not exist",
    "Estrategias de mitigación operativa": "Operational Mitigation Strategies",
    "Payoff estimado de cobertura comercial": "Estimated Payoff of Commercial Hedging",
    "Ganancia/pérdida comercial en función del precio del Manganeso al vencimiento": "Commercial gain/loss as a function of Manganese price at maturity",
    "Precio Mn actual": "Current Mn price",

    // ── PÁGINA 8: RIESGOS SECUNDARIOS
    "Matriz de riesgos secundarios": "Secondary Risk Matrix",
    "Detalle de riesgos identificados": "Detail of Identified Risks",
    "Clasificación": "Classification",
    "Mitigación activa": "Active Mitigation",
    "Severidad": "Severity",
    "Probabilidad": "Probability",

    // ── PÁGINA 9: ESTRATEGIA ÓPTIMA
    "Portafolio de cobertura recomendado": "Recommended Hedging Portfolio",
    "Payoff consolidado del portafolio": "Consolidated Portfolio Payoff",
    "Muestra la ganancia o pérdida neta combinada de todas las coberturas recomendadas": "Shows the combined net gain or loss of all recommended hedges",
    "Composición del portafolio recomendado": "Composition of the Recommended Portfolio",
    "Efecto de la estrategia óptima sobre EBITDA": "Effect of the Optimal Strategy on EBITDA",
    "Consolidado del portafolio": "Portfolio Consolidated",
    "Monto anualizado": "Annualized Amount",
    "Estado": "Status",
    "Instrumento recomendado": "Recommended Instrument",
    "Activar": "Activate",
    "Estrategia sugerida": "Suggested Strategy",
    "Anualizado": "Annualized",
    "Payoff consolidado en función de las variables de mercado en escenario adverso": "Consolidated payoff as a function of market variables in adverse scenario"
  };

  // Reemplazos dinámicos más avanzados (Regex o patrones dinámicos)
  const DYNAMIC_PATTERNS = [
    {
      // Cobertura FX activa
      es: /Cobertura FX activa:\s*solo\s*<strong>([\d.]+)%<\/strong>\s*de exposición cubierta/i,
      en: (m) => `Active FX Hedging: only <strong>${m[1]}%</strong> of exposure covered`
    },
    {
      es: /vs límite de política de\s*<strong>([\d.]+)%<\/strong>/i,
      en: (m) => `vs policy limit of <strong>${m[1]}%</strong>`
    },
    {
      es: /Gap de\s*<strong>([\d.]+)\s*pp<\/strong>\s*sin protección/i,
      en: (m) => `Gap of <strong>${m[1]} pp</strong> unprotected`
    },
    {
      es: /sobre ~USD\s*<strong>([\d.]+)(M|K)<\/strong>\s*de ingresos anualizados\./i,
      en: (m) => `over ~USD <strong>${m[1]}${m[2]}</strong> of annualized revenues.`
    },
    {
      // Precio del oro
      es: /Precio del oro en máximos históricos\s*\(~USD\s*([\d,.]+)\/oz\)\s*y\s*<strong>sin cobertura activa<\/strong>/i,
      en: (m) => `Gold price at historic highs (~USD ${m[1]}/oz) and <strong>no active hedging</strong>`
    },
    {
      es: /Metallorum duplicó producción en 1T26\s*—\s*exposición al downside sin protección\./i,
      en: "Metallorum doubled production in 1Q26 — unprotected exposure to the downside."
    },
    {
      // TIIE Collar
      es: /Collar TIIE\s*\(floor\s*([\d.]+)%\s*\/\s*cap\s*([\d.]+)%\)\s*fuera del dinero/i,
      en: (m) => `TIIE Collar (floor ${m[1]}% / cap ${m[2]}%) out of the money`
    },
    {
      es: /TIIE actual\s*<strong>([\d.]+)%<\/strong>\s*está por debajo del floor/i,
      en: (m) => `current TIIE <strong>${m[1]}%</strong> is below the floor`
    },
    {
      es: /Empresa paga prima sin beneficio\.\s*Pérdida acumulada:\s*<strong>USD\s*([\d,.]+)(K|M)<\/strong>/i,
      en: (m) => `Company pays premium without benefit. Cumulative loss: <strong>USD ${m[1]}${m[2]}</strong>`
    },
    {
      // Gas
      es: /Gas natural\s*<strong>sin cobertura activa<\/strong>/i,
      en: "Natural gas <strong>no active hedging</strong>"
    },
    {
      es: /Smelting es energía-intensivo\s*—\s*cada USD 1\/MMBtu de alza impacta costos operativos ~USD 2-3M\./i,
      en: "Smelting is energy-intensive — each USD 1/MMBtu increase impacts operating costs by ~USD 2-3M."
    },
    {
      // Balance auditado alert
      es: /Datos precargados desde\s*<strong>XBRL 4T25 y 1T26 BMV<\/strong>\s*—\s*auditados bajo IFRS\./i,
      en: "Preloaded data from <strong>XBRL 4Q25 & 1Q26 BMV</strong> — audited under IFRS."
    },
    {
      es: /Para sobreescribir un valor,\s*haz clic en\s*<strong>Editar<\/strong>\s*e ingresa la justificación\./i,
      en: "To override a value, click <strong>Edit</strong> and enter the justification."
    },
    {
      // Segmento alert
      es: /Metallorum duplicó producción en 1T26\.\s*Meta:\s*15% de ingresos totales para 2028\./i,
      en: "Metallorum doubled production in 1Q26. Target: 15% of total revenues by 2028."
    },
    {
      es: /Oro en USD 3,000\+\/oz\s*—\s*sin cobertura activa\./i,
      en: "Gold at USD 3,000+/oz — no active hedging."
    },
    {
      // Collar TIIE alert
      es: /TIIE actual\s*\(([\d.]+)%\)\s*por debajo del floor\s*\(([\d.]+)%\)\s*—\s*el collar no se ejerce\./i,
      en: (m) => `Current TIIE (${m[1]}%) below floor (${m[2]}%) — collar is not exercised.`
    },
    {
      es: /La empresa paga la tasa de mercado completa más prima sin beneficio activo\./i,
      en: "The company pays the full market rate plus premium without active benefit."
    },
    {
      // Collares FX alert
      es: /Cobertura FX activa cubre solo\s*~([\d.]+)%\s*de exposición\s*vs\s*([\d.]+)%\s*permitido por política\./i,
      en: (m) => `Active FX coverage covers only ~${m[1]}% of exposure vs ${m[2]}% allowed by policy.`
    },
    {
      es: /Con USD\/MXN actual en\s*([\d.]+),\s*cada peso de apreciación reduce ingresos ~USD\s*([\d.]+)M\./i,
      en: (m) => `With current USD/MXN at ${m[1]}, each peso of appreciation reduces revenues by ~USD ${m[2]}M.`
    },
    {
      // Postura alerts
      es: /TC en zona de riesgo alto\s*\(\$([\d.]+)\)\./i,
      en: (m) => `FX in high risk zone ($${m[1]}).`
    },
    {
      es: /Cada centavo adicional de apreciación impacta los ingresos no cubiertos\s*\(~([\d.]+)%\)\s*directamente\./i,
      en: (m) => `Each additional cent of appreciation directly impacts uncovered revenues (~${m[1]}%).`
    },
    {
      es: /Prioridad:\s*activar coberturas hasta el 60% de política inmediatamente\./i,
      en: "Priority: activate hedging up to 60% policy limit immediately."
    },
    {
      es: /TC en zona de alerta\s*\(\$([\d.]+)\)\./i,
      en: (m) => `FX in alert zone ($${m[1]}).`
    },
    {
      es: /El gap de cobertura\s*\(([\d.]+)\s*pp\)\s*representa una exposición significativa\./i,
      en: (m) => `The hedging gap (${m[1]} pp) represents a significant exposure.`
    },
    {
      es: /Collares costless son la estrategia más eficiente en términos costo\/protección bajo las condiciones actuales\./i,
      en: "Costless collars are the most efficient cost/protection strategy under current conditions."
    },
    {
      es: /TC en zona favorable\s*\(\$([\d.]+)\)\./i,
      en: (m) => `FX in favorable zone ($${m[1]}).`
    },
    {
      es: /El peso débil beneficia los ingresos\./i,
      en: "The weak peso benefits revenues."
    },
    {
      es: /Considerar reducir cobertura hacia el mínimo de política para capturar el diferencial cambiario positivo\./i,
      en: "Consider reducing hedging toward the policy minimum to capture the positive exchange differential."
    }
  ];

  // Traduce una cadena de texto individual (Español -> Inglés)
  function translateText(text) {
    if (!text) return text;
    const trimmed = text.trim();

    // 1. Intentar correspondencia exacta
    if (DICTIONARY[trimmed]) {
      return DICTIONARY[trimmed];
    }

    // 2. Probar correspondencia con claves insensibles a mayúsculas/espacios
    for (let key in DICTIONARY) {
      if (key.toLowerCase() === trimmed.toLowerCase()) {
        return DICTIONARY[key];
      }
    }

    // 3. Probar correspondencia parcial y reemplazar sub-cadenas clave
    let translated = text;

    // Intenta patrones dinámicos
    let matchedAny = false;
    for (let pat of DYNAMIC_PATTERNS) {
      if (pat.es.test(translated)) {
        if (typeof pat.en === "function") {
          translated = translated.replace(pat.es, pat.en);
        } else {
          translated = translated.replace(pat.es, pat.en);
        }
        matchedAny = true;
      }
    }

    if (matchedAny) {
      return translated;
    }

    // Traducir palabras recurrentes de tablas
    const wordReplacements = {
      "Ingresos": "Revenues",
      "ingresos": "revenues",
      "Costo": "Cost",
      "costo": "cost",
      "Utilidad": "Profit",
      "pérdida": "loss",
      "Pérdida": "Loss",
      "Deuda": "Debt",
      "deuda": "debt",
      "Total": "Total",
      "total": "total",
      "activo": "asset",
      "Activo": "Asset",
      "pasivo": "liability",
      "Pasivo": "Liability",
      "Capital": "Equity",
      "capital": "equity",
      "tasa": "rate",
      "Tasa": "Rate",
      "fija": "fixed",
      "Fija": "Fixed",
      "variable": "variable",
      "Variable": "Variable",
      "cubierto": "covered",
      "cobertura": "hedging",
      "Cobertura": "Hedging",
      "exposición": "exposure",
      "Exposición": "Exposure",
      "actual": "current",
      "proyectado": "projected",
      "Proyectado": "Projected",
      "anual": "annual",
      "Anual": "Annual",
      "meses": "months",
      "años": "years"
    };

    for (let esWord in wordReplacements) {
      // Reemplaza sólo palabras enteras para no romper strings más grandes
      const regex = new RegExp(`\\b${esWord}\\b`, 'g');
      translated = translated.replace(regex, wordReplacements[esWord]);
    }

    return translated;
  }

  // Realiza traducción recursiva en un nodo del DOM
  function translateNode(node) {
    if (activeLang === "es") {
      // Restaurar original si existe en caché
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.__originalText !== undefined) {
          node.textContent = node.__originalText;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip script / style
        if (node.tagName === "SCRIPT" || node.tagName === "STYLE") return;

        if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
          if (node.__originalPlaceholder !== undefined) {
            node.placeholder = node.__originalPlaceholder;
          }
        }

        if (node.__originalHTML !== undefined) {
          node.innerHTML = node.__originalHTML;
        } else {
          // Seguir con los hijos
          for (let child of node.childNodes) {
            translateNode(child);
          }
        }
      }
      return;
    }

    // LENGUAJE === "en"
    if (node.nodeType === Node.TEXT_NODE) {
      const orig = node.textContent;
      if (orig && orig.trim().length > 0) {
        // Si no está cacheado, guardarlo
        if (node.__originalText === undefined) {
          node.__originalText = orig;
        }
        const trans = translateText(orig);
        if (trans !== orig) {
          node.textContent = trans;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === "SCRIPT" || node.tagName === "STYLE") return;

      // Traducir inputs placeholder
      if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
        const ph = node.placeholder;
        if (ph && ph.trim().length > 0) {
          if (node.__originalPlaceholder === undefined) {
            node.__originalPlaceholder = ph;
          }
          const transPh = translateText(ph);
          if (transPh !== ph) {
            node.placeholder = transPh;
          }
        }
      }

      // Si el elemento contiene tags internos como strong o b, traducimos su innerHTML directamente para mantener gramática
      const classList = node.classList;
      const shouldTranslateHTMLDirectly = 
        classList.contains("alert") || 
        classList.contains("kpi-sub") || 
        classList.contains("card-sub") ||
        classList.contains("modal-warning") ||
        node.tagName === "TH" || 
        node.tagName === "TD";

      if (shouldTranslateHTMLDirectly) {
        const origHTML = node.innerHTML;
        if (origHTML && origHTML.trim().length > 0 && !origHTML.includes("class=")) {
          if (node.__originalHTML === undefined) {
            node.__originalHTML = origHTML;
          }
          const transHTML = translateText(origHTML);
          if (transHTML !== origHTML) {
            node.innerHTML = transHTML;
            return; // Detener recursión ya que reemplazamos los hijos
          }
        }
      }

      // Recursión para hijos
      for (let child of node.childNodes) {
        translateNode(child);
      }
    }
  }

  // Función para traducir la interfaz completa
  function translateInterface() {
    // Traducir sidebar, página activa y modals
    const rootElements = [
      document.getElementById("sidebar"),
      document.getElementById("main"),
      document.getElementById("overrideModal")
    ];

    rootElements.forEach(el => {
      if (el) {
        translateNode(el);
      }
    });

    // Actualizar labels dinámicos en breadcrumb
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb && activeLang === "en") {
      breadcrumb.textContent = translateText(breadcrumb.textContent);
    }
  }

  // MutationObserver para traducir contenido cargado dinámicamente en tiempo real
  let observer = null;
  function initObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      // Desactivar temporalmente para evitar bucles infinitos al modificar texto
      observer.disconnect();

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          translateNode(node);
        });
        if (mutation.type === "characterData") {
          translateNode(mutation.target);
        }
      });

      // Reconectar observer
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Interceptar texto en canvas de gráficos payoffs
  function initCanvasInterceptor() {
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
      let t = text;
      if (activeLang === "en") {
        t = translateText(text);
      }
      originalFillText.call(this, t, x, y, maxWidth);
    };

    const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
    CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
      let t = text;
      if (activeLang === "en") {
        t = translateText(text);
      }
      originalStrokeText.call(this, t, x, y, maxWidth);
    };
  }

  // Inyectar el botón selector de lenguaje en el topbar de forma estética
  function injectLanguageSelector() {
    // Esperar a que el topbar esté renderizado
    const interval = setInterval(() => {
      const topbarRight = document.querySelector(".topbar-right");
      if (topbarRight) {
        clearInterval(interval);

        // Crear selector de lenguaje estético y moderno
        const langContainer = document.createElement("div");
        langContainer.className = "lang-selector";
        langContainer.style.cssText = `
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 3px;
          gap: 2px;
          margin-right: 8px;
        `;

        const btnES = document.createElement("button");
        btnES.textContent = "ES";
        btnES.style.cssText = getSelectorBtnStyle(activeLang === "es");
        btnES.onclick = () => setLanguage("es");

        const btnEN = document.createElement("button");
        btnEN.textContent = "EN";
        btnEN.style.cssText = getSelectorBtnStyle(activeLang === "en");
        btnEN.onclick = () => setLanguage("en");

        langContainer.appendChild(btnES);
        langContainer.appendChild(btnEN);

        // Insertar al inicio del topbarRight (antes de los scenario pills)
        topbarRight.insertBefore(langContainer, topbarRight.firstChild);
      }
    }, 100);
  }

  function getSelectorBtnStyle(active) {
    return `
      font-size: 10.5px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all var(--transition);
      color: ${active ? "#ffffff" : "var(--text-muted)"};
      background: ${active ? "var(--accent-bright)" : "transparent"};
      box-shadow: ${active ? "0 2px 8px rgba(124, 58, 173, 0.3)" : "none"};
    `;
  }

  function setLanguage(lang) {
    if (lang === activeLang) return;
    activeLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // Actualizar estilos del botón
    const buttons = document.querySelectorAll(".lang-selector button");
    if (buttons.length === 2) {
      buttons[0].style.cssText = getSelectorBtnStyle(lang === "es");
      buttons[1].style.cssText = getSelectorBtnStyle(lang === "en");
    }

    // Traducir interfaz
    translateInterface();

    // Forzar redibujo de los canvas payoffs si Scenarios está listo
    if (window.Scenarios) {
      // Emitir cambio de escenario para forzar re-render de la página activa
      const currentActiveNav = document.querySelector(".nav-item.active");
      if (currentActiveNav) {
        const pageId = currentActiveNav.dataset.page;
        Scenarios.emit(`page:${pageId}`, {});
        // También emitir calc:update para actualizar KPIs
        const cache = Scenarios.getCache();
        if (cache && cache.actual) {
          Scenarios.emit("calc:update", cache);
        }
      }
    }

    // Mostrar toast de éxito
    if (window.showToast) {
      const msg = lang === "es" ? "Idioma cambiado a Español" : "Language changed to English";
      showToast(msg, "success");
    }
  }

  // Inicialización
  function init() {
    initCanvasInterceptor();
    injectLanguageSelector();
    initObserver();

    // Ejecutar traducción inicial si no es español
    if (activeLang === "en") {
      // Esperar un momento a que los scripts de renderizado inicial terminen
      setTimeout(() => {
        translateInterface();
      }, 300);
    }
  }

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    getLocale: () => activeLang,
    translate: translateText,
    setLanguage: setLanguage
  };
})();
