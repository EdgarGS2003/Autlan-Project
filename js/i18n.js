/**
 * js/i18n.js — Sistema de Traducción ES / EN
 * Autlán Risk Desk Dashboard
 *
 * ARQUITECTURA:
 *  - I18N.t(key)         → devuelve el string en el idioma activo
 *  - I18N.setLanguage()  → cambia idioma y re-renderiza la página activa
 *  - MutationObserver    → traduce sidebar, topbar, modal (HTML estático)
 *  - Canvas interceptor  → traduce labels de gráficos Chart.js
 */

window.I18N = (() => {
  const STORAGE_KEY = "autlan_lang";
  let activeLang = localStorage.getItem(STORAGE_KEY) || "es";

  // ─────────────────────────────────────────────────────────────────────────
  // DICCIONARIO DE STRINGS — ES / EN
  // Usado por I18N.t(key). Agrupa los strings por página para claridad.
  // ─────────────────────────────────────────────────────────────────────────
  const STRINGS = {

    // ── SIDEBAR / TOPBAR / CHROME
    "sidebar.title":           { es: "Mesa de Riesgos",            en: "Risk Desk" },
    "sidebar.brand":           { es: "Mesa de Riesgos & Coberturas",en: "Risk & Hedging Desk" },
    "nav.general":             { es: "GENERAL",                     en: "GENERAL" },
    "nav.dashboard":           { es: "Dashboard",                   en: "Dashboard" },
    "nav.perfil":              { es: "Perfil Autlán",               en: "Autlán Profile" },
    "nav.escenarios":          { es: "Escenarios & Inputs",         en: "Scenarios & Inputs" },
    "nav.coberturas":          { es: "COBERTURAS",                  en: "HEDGING" },
    "nav.fx":                  { es: "Tipo de Cambio",              en: "Exchange Rate" },
    "nav.oro":                 { es: "Precio del Oro",              en: "Gold Price" },
    "nav.gas":                 { es: "Gas Natural",                 en: "Natural Gas" },
    "nav.tasa":                { es: "Tasa de Interés",             en: "Interest Rate" },
    "nav.manganeso":           { es: "Manganeso",                   en: "Manganese" },
    "nav.analisis":            { es: "ANÁLISIS",                    en: "ANALYSIS" },
    "nav.secundarios":         { es: "Riesgos Secundarios",         en: "Secondary Risks" },
    "nav.estrategia":          { es: "Estrategia Óptima",           en: "Optimal Strategy" },
    "topbar.ebitda":           { es: "EBITDA proy.",                en: "Proj. EBITDA" },
    "topbar.base":             { es: "Base",                        en: "Base" },
    "topbar.optimista":        { es: "Optimista",                   en: "Optimistic" },
    "topbar.adverso":          { es: "Adverso",                     en: "Adverse" },
    "topbar.updating":         { es: "Actualizando...",             en: "Updating..." },

    // ── MODAL
    "modal.title":             { es: "⚠ Sobreescribir dato auditado", en: "⚠ Override Audited Data" },
    "modal.warning":           { es: "Este valor proviene de un reporte auditado (XBRL BMV). Modificarlo requiere una justificación documentada.", en: "This value comes from an audited report (XBRL BMV). Modifying it requires documented justification." },
    "modal.campo":             { es: "Campo",                       en: "Field" },
    "modal.original":          { es: "Valor original",             en: "Original Value" },
    "modal.nuevo":             { es: "Nuevo valor",                en: "New Value" },
    "modal.justif":            { es: "Justificación",              en: "Justification" },
    "modal.cancel":            { es: "Cancelar",                   en: "Cancel" },
    "modal.confirm":           { es: "Confirmar override",         en: "Confirm Override" },
    "modal.placeholder.val":   { es: "Ingresa el nuevo valor",     en: "Enter the new value" },
    "modal.placeholder.justif":{ es: "Ej: Guía de producción 2026 publicada en reporte anual, página 14...", en: "E.g.: 2026 production guidance published in annual report, page 14..." },

    // ── GENERAL LABELS
    "label.audited":           { es: "Auditado",                   en: "Audited" },
    "label.active":            { es: "Activa",                     en: "Active" },
    "label.description":       { es: "Descripción",                en: "Description" },
    "label.impact":            { es: "Impacto en Autlán",          en: "Impact on Autlán" },
    "label.mitigation":        { es: "Mitigación",                 en: "Mitigation" },
    "label.save":              { es: "Guardar",                    en: "Save" },
    "label.edit":              { es: "Editar",                     en: "Edit" },
    "label.cancel":            { es: "Cancelar",                   en: "Cancel" },
    "label.confirm":           { es: "Confirmar",                  en: "Confirm" },
    "label.restore":           { es: "↺ Restaurar valores base",   en: "↺ Reset to Base Values" },
    "label.export":            { es: "↓ Exportar supuestos CSV",   en: "↓ Export Assumptions CSV" },
    "label.clickEdit":         { es: "💡 Haz clic en cualquier valor para editarlo directamente.", en: "💡 Click any value to edit it directly." },
    "label.model":             { es: "Modelo",                     en: "Model" },
    "label.status":            { es: "Estado",                     en: "Status" },
    "label.horizon":           { es: "Horizonte (meses)",          en: "Horizon (months)" },
    "label.maturity":          { es: "Vencimiento (años)",         en: "Maturity (years)" },
    "label.total":             { es: "Total",                      en: "Total" },
    "label.anualizado":        { es: "Anualizado",                 en: "Annualized" },
    "label.recommended":       { es: "Instrumento recomendado",    en: "Recommended Instrument" },
    "label.activate":          { es: "Activar",                    en: "Activate" },
    "label.suggested":         { es: "Estrategia sugerida",        en: "Suggested Strategy" },

    // ── BADGE LABELS
    "badge.otm":               { es: "FUERA DEL DINERO",           en: "OUT OF THE MONEY" },
    "badge.unhedged":          { es: "SIN COBERTURA",              en: "UNHEDGED" },
    "badge.critical":          { es: "CRÍTICO",                    en: "CRITICAL" },
    "badge.negOutlook":        { es: "Outlook Negativo",           en: "Negative Outlook" },
    "badge.only3pct":          { es: "SOLO 3% CUBIERTO",           en: "ONLY 3% COVERED" },
    "badge.covered60":         { es: "Cobertura FX al 60% de política", en: "FX Hedging at 60% Policy" },
    "badge.variable":          { es: "variable",                   en: "variable" },

    // ── PAGE 0: DASHBOARD
    "p0.title":                { es: "Dashboard ejecutivo",         en: "Executive Dashboard" },
    "p0.sub":                  { es: "Estado de riesgo y cobertura en tiempo real · Autlán Q1 2026", en: "Real-time risk and hedging status · Autlán Q1 2026" },
    "p0.hedgingStatus":        { es: "Estado de cobertura · Al 31 mar 2026", en: "Hedging Status · As of March 31, 2026" },
    "p0.scenarioImpact":       { es: "Impacto financiero por escenario", en: "Financial Impact by Scenario" },
    "p0.varResult":            { es: "Variable / Resultado",         en: "Variable / Outcome" },
    "p0.debtStructure":        { es: "Estructura de deuda",          en: "Debt Structure" },
    "p0.debtSub":              { es: "USD 185.9M total · 1T26",      en: "USD 185.9M Total · 1Q26" },
    "p0.hedgingPolicy":        { es: "Política de cobertura",        en: "Hedging Policy" },
    "p0.policySub":            { es: "Límites formales documentados · XBRL 1T26", en: "Formal Documented Limits · XBRL 1Q26" },
    "p0.kpi.revenues":         { es: "Ingresos 1T26 (anualiz.)",     en: "1Q26 Revenues (annualized)" },
    "p0.kpi.ebitda":           { es: "EBITDA proyectado",            en: "Projected EBITDA" },
    "p0.kpi.debt":             { es: "Deuda neta",                   en: "Net Debt" },
    "p0.kpi.dscr":             { es: "DSCR proyectado",              en: "Projected DSCR" },
    "p0.kpi.dscr.sub":         { es: "Bajo 1.0x",                    en: "Below 1.0x" },
    "p0.kpi.totalDebt":        { es: "Total deuda",                  en: "Total Debt" },
    "p0.policy1":              { es: "Objetivo exclusivo de cobertura — no especulación.", en: "Hedging only — not for speculation." },
    "p0.policy2":              { es: "Contrapartes de alta calidad crediticia. Mercados OTC/extrabursátiles.", en: "High credit quality counterparties. OTC/over-the-counter markets." },
    "p0.policy3":              { es: "Tratamiento contable IFRS 9 — cobertura de flujo de efectivo.", en: "IFRS 9 accounting treatment — cash flow hedge accounting." },
    "p0.debtFixed":            { es: "tasa fija",                    en: "fixed rate" },
    "p0.debtVariable":         { es: "deuda a tasa variable · Solo", en: "variable rate debt · Only" },
    "p0.debtBadge":            { es: "Deuda/UAFIRDA 4.4x",          en: "Debt/EBITDA 4.4x" },

    // ── PAGE 1: PERFIL
    "p1.title":                { es: "Perfil Financiero Autlán",     en: "Autlán Financial Profile" },
    "p1.sub":                  { es: "Datos financieros auditados · XBRL 1T26 BMV", en: "Audited Financial Data · XBRL 1Q26 BMV" },
    "p1.alert":                { es: "Datos precargados desde <strong>XBRL 4T25 y 1T26 BMV</strong> — auditados bajo IFRS. Para sobreescribir un valor, haz clic en <strong>Editar</strong> e ingresa la justificación.", en: "Data preloaded from <strong>XBRL 4Q25 & 1Q26 BMV</strong> — audited under IFRS. To override a value, click <strong>Edit</strong> and enter the justification." },
    "p1.keyResults":           { es: "Resultados financieros clave", en: "Key Financial Results" },
    "p1.kpi.rev2025":          { es: "Ingresos 2025",               en: "Revenues 2025" },
    "p1.kpi.rev2025.sub":      { es: "+3.1% vs 2024 · USD 312.9M",  en: "+3.1% vs 2024 · USD 312.9M" },
    "p1.kpi.ebitda2025":       { es: "EBITDA 2025",                 en: "EBITDA 2025" },
    "p1.kpi.ebitda2025.sub":   { es: "Margen 9.7% · Pico 38% en 2022", en: "Margin 9.7% · Peak 38% in 2022" },
    "p1.kpi.netloss":          { es: "Pérdida neta 2025",           en: "Net Loss 2025" },
    "p1.kpi.netloss.sub":      { es: "Gasto financiero USD 42.5M",  en: "Financial expense USD 42.5M" },
    "p1.kpi.rev1q26":          { es: "Ingresos 1T26",               en: "Revenues 1Q26" },
    "p1.kpi.rev1q26.sub":      { es: "+23% vs 1T25 · Récord trimestral", en: "+23% vs 1Q25 · Quarterly Record" },
    "p1.incomeStatement":      { es: "Estado de resultados comparativo", en: "Comparative Income Statement" },
    "p1.concept":              { es: "Concepto (USD miles)",         en: "Concept (USD thousands)" },
    "p1.netRev":               { es: "Ingresos netos",              en: "Net Revenues" },
    "p1.cogs":                 { es: "Costo de ventas",             en: "Cost of Goods Sold" },
    "p1.grossProfit":          { es: "Utilidad bruta",              en: "Gross Profit" },
    "p1.sellExp":              { es: "Gastos de venta",             en: "Selling Expenses" },
    "p1.adminExp":             { es: "Gastos de administración",    en: "Administrative Expenses" },
    "p1.opProfit":             { es: "Utilidad (pérdida) operación", en: "Operating Profit (Loss)" },
    "p1.finExp":               { es: "Gastos financieros",          en: "Financial Expenses" },
    "p1.netLoss":              { es: "Pérdida neta",                en: "Net Loss" },
    "p1.balance":              { es: "Balance general · 31 mar 2026", en: "Balance Sheet · March 31, 2026" },
    "p1.balance.sub":          { es: "XBRL 1T26 · cifras en USD miles", en: "XBRL 1Q26 · figures in USD thousands" },
    "p1.assets":               { es: "Activos",                     en: "Assets" },
    "p1.cash":                 { es: "Efectivo y equivalentes",     en: "Cash and Equivalents" },
    "p1.ar":                   { es: "Cuentas por cobrar",          en: "Accounts Receivable" },
    "p1.inventory":            { es: "Inventarios",                 en: "Inventories" },
    "p1.otherCurrent":         { es: "Otros circulantes",           en: "Other Current Assets" },
    "p1.totalCurrent":         { es: "Total activo circulante",     en: "Total Current Assets" },
    "p1.ppe":                  { es: "Propiedades, planta y equipo", en: "Property, Plant & Equipment" },
    "p1.intangibles":          { es: "Intangibles y crédito mercantil", en: "Intangibles and Goodwill" },
    "p1.totalNonCurrent":      { es: "Total activo no circulante",  en: "Total Non-Current Assets" },
    "p1.totalAssets":          { es: "TOTAL ACTIVOS",               en: "TOTAL ASSETS" },
    "p1.liabilities":          { es: "Pasivos y capital",           en: "Liabilities & Equity" },
    "p1.currentLiab":          { es: "Pasivos circulantes",         en: "Current Liabilities" },
    "p1.ltDebt":               { es: "Deuda largo plazo",           en: "Long-Term Debt" },
    "p1.otherLt":              { es: "Otras provisiones LP",        en: "Other LT Provisions" },
    "p1.totalLiab":            { es: "Total pasivos",               en: "Total Liabilities" },
    "p1.equity":               { es: "Capital contable total",      en: "Total Equity" },
    "p1.creditMetrics":        { es: "Métricas de crédito",         en: "Credit Metrics" },
    "p1.leverage":             { es: "Leverage (Deuda/Activos)",    en: "Leverage (Debt/Assets)" },
    "p1.netDebt":              { es: "Deuda neta",                  en: "Net Debt" },
    "p1.dscr":                 { es: "DSCR proyectado 2026-28",     en: "Projected DSCR 2026-28" },
    "p1.finExpAnn":            { es: "Gasto financiero anual",      en: "Annual Financial Expense" },
    "p1.cashAvail":            { es: "Efectivo disponible",         en: "Available Cash" },
    "p1.debtEbitda":           { es: "Deuda / EBITDA",              en: "Debt / EBITDA" },
    "p1.ratings":              { es: "Calificaciones crediticias",  en: "Credit Ratings" },
    "p1.segments":             { es: "Segmentos de negocio · 2025", en: "Business Segments · 2025" },
    "p1.seg.ferro":            { es: "Ferroaleaciones & Mn",        en: "Ferroalloys & Mn" },
    "p1.seg.emd":              { es: "EMD (batería/industrial)",     en: "EMD (battery/industrial)" },
    "p1.seg.metallorum":       { es: "Metallorum (oro)",            en: "Metallorum (gold)" },
    "p1.seg.energy":           { es: "Energía (intra-segmento)",    en: "Energy (intra-segment)" },
    "p1.seg.alert":            { es: "Metallorum duplicó producción en 1T26. Meta: 15% de ingresos totales para 2028. Oro en USD 3,000+/oz — sin cobertura activa.", en: "Metallorum doubled production in 1Q26. Target: 15% of total revenues by 2028. Gold at USD 3,000+/oz — no active hedging." },
    "p1.debtDetail":           { es: "Estructura de deuda detallada · 1T26", en: "Detailed Debt Structure · 1Q26" },
    "p1.creditor":             { es: "Acreedor",                    en: "Creditor" },
    "p1.rate":                 { es: "Tasa",                        en: "Rate" },
    "p1.currency":             { es: "Moneda",                      en: "Currency" },
    "p1.maturity":             { es: "Vencimiento",                 en: "Maturity" },
    "p1.balance.col":          { es: "Saldo (USD K)",               en: "Balance (USD K)" },
    "p1.risk":                 { es: "Riesgo",                      en: "Risk" },
    "p1.totalDebt":            { es: "TOTAL DEUDA",                 en: "TOTAL DEBT" },
    "p1.derivatives":          { es: "Instrumentos derivados vigentes · 1T26", en: "Active Derivative Instruments · 1Q26" },
    "p1.collarTIIE":           { es: "Collar TIIE — Tasa de interés", en: "TIIE Collar — Interest Rate" },
    "p1.collarTIIE.sub":       { es: "CEM (subsidiaria) · Vence jun-2028", en: "CEM (subsidiary) · Matures Jun-2028" },
    "p1.collarFX":             { es: "Collares USD/MXN — Tipo de cambio", en: "USD/MXN Collars — Exchange Rate" },
    "p1.collarFX.sub":         { es: "4 collares · Vencen jun-2026", en: "4 collars · Mature Jun-2026" },
    "p1.instrument":           { es: "Instrumento",                 en: "Instrument" },
    "p1.underlying":           { es: "Subyacente",                  en: "Underlying" },
    "p1.notional":             { es: "Nocional",                    en: "Notional" },
    "p1.floor.cap":            { es: "Floor (cap largo)",           en: "Floor (long cap)" },
    "p1.cap.floor":            { es: "Cap (floor corto)",           en: "Cap (short floor)" },
    "p1.tiie.current":         { es: "TIIE actual",                 en: "Current TIIE" },
    "p1.tiie.current.val":     { es: "7.10% — debajo del floor",   en: "7.10% — below the floor" },
    "p1.maturityDate":         { es: "Vencimiento",                 en: "Maturity" },
    "p1.accumLoss":            { es: "Pérdida acumulada",           en: "Cumulative Loss" },
    "p1.q1loss":               { es: "Minusvalía 1T26",             en: "Impairment 1Q26" },
    "p1.collarAlert":          { es: "TIIE actual (7.10%) por debajo del floor (8.75%) — el collar no se ejerce. La empresa paga la tasa de mercado completa más prima sin beneficio activo.", en: "Current TIIE (7.10%) below floor (8.75%) — collar is not exercised. The company pays the full market rate plus premium without active benefit." },
    "p1.fxAlert":              { es: "Cobertura FX activa cubre solo ~3% de exposición vs 60% permitido por política. Con USD/MXN actual en 17.30, cada peso de apreciación reduce ingresos ~USD 18M.", en: "Active FX hedging covers only ~3% of exposure vs 60% allowed by policy. With current USD/MXN at 17.30, each peso of appreciation reduces revenues by ~USD 18M." },
    "p1.floorPut":             { es: "Floor (put)",                 en: "Floor (put)" },
    "p1.capCall":              { es: "Cap (call)",                  en: "Cap (call)" },
    "p1.notionalMonth":        { es: "Nocional/mes",                en: "Notional/month" },
    "p1.totalNotional":        { es: "Nocional total activo",       en: "Total Active Notional" },
    "p1.annualRev":            { es: "Ingresos anualizados",        en: "Annualized Revenues" },
    "p1.pctCovered":           { es: "% cubierto actualmente",      en: "% Currently Covered" },
    "p1.policyLimit":          { es: "Límite de política",          en: "Policy Limit" },
    "p1.gap":                  { es: "Gap sin protección",          en: "Unprotected Gap" },
    "p1.negativa":             { es: "Negativa",                    en: "Negative" },
    "p1.sources":              { es: "📋 Fuentes: XBRL 4T25 BMV (31-dic-2025) · XBRL 1T26 BMV (31-mar-2026) · HR Ratings Dic-2025 · Section 1 Analysis. Cifras en USD miles salvo indicación. Tipos de cambio según reportes originales IFRS.", en: "📋 Sources: XBRL 4Q25 BMV (31-Dec-2025) · XBRL 1Q26 BMV (31-Mar-2026) · HR Ratings Dec-2025 · Section 1 Analysis. Figures in USD thousands unless stated otherwise. Exchange rates per original IFRS reports." },

    // ── PAGE 2: ESCENARIOS
    "p2.title":                { es: "Escenarios & Inputs",         en: "Scenarios & Inputs" },
    "p2.sub":                  { es: "Variables macro · Ajusta los supuestos — alimenta todas las páginas", en: "Macro Variables · Adjust assumptions — feeds all pages" },
    "p2.alert":                { es: "Ajusta las variables independientes con los sliders. Las variables dependientes se calculan automáticamente. <strong>Todos los cambios se propagan en tiempo real</strong> a todas las páginas.", en: "Adjust independent variables with the sliders. Dependent variables are calculated automatically. <strong>All changes propagate in real time</strong> to all pages." },
    "p2.independent":          { es: "Variables independientes",    en: "Independent Variables" },
    "p2.perScenario":          { es: "Valores por escenario",       en: "Values per Scenario" },
    "p2.variable":             { es: "Variable",                    en: "Variable" },
    "p2.narrative":            { es: "Narrativa macro por escenario", en: "Macro Narrative per Scenario" },
    "p2.dependent":            { es: "Variables dependientes — calculadas en tiempo real", en: "Dependent Variables — Calculated in Real-Time" },
    "p2.ebitdaDecomp":         { es: "Descomposición del impacto sobre EBITDA", en: "EBITDA Impact Decomposition" },
    "p2.esc.base":             { es: "Escenario Base",              en: "Base Scenario" },
    "p2.esc.optimista":        { es: "Escenario Optimista",         en: "Optimistic Scenario" },
    "p2.esc.adverso":          { es: "Escenario Adverso",           en: "Adverse Scenario" },
    "p2.dep.revenues":         { es: "Ingresos estimados",          en: "Estimated Revenues" },
    "p2.dep.revenues.sub":     { es: "Sensible a FX + volumen",     en: "Sensitive to FX + volume" },
    "p2.dep.finexp":           { es: "Gasto financiero est.",       en: "Est. Financial Expense" },
    "p2.dep.finexp.sub":       { es: "SOFR + TIIE sobre deuda variable", en: "SOFR + TIIE on variable debt" },
    "p2.dep.ebitda":           { es: "EBITDA estimado",             en: "Estimated EBITDA" },
    "p2.dep.fcf":              { es: "FCF estimado",                en: "Estimated FCF" },
    "p2.dep.fcf.sub":          { es: "EBITDA − gasto fin − capex",  en: "EBITDA − fin. expense − capex" },
    "p2.dep.dscr":             { es: "DSCR estimado",               en: "Estimated DSCR" },
    "p2.dep.dscr.sub":         { es: "Cobertura servicio de deuda", en: "Debt service coverage" },
    "p2.dep.tiie":             { es: "TIIE efectiva proy.",         en: "Proj. Effective TIIE" },
    "p2.dep.tiie.sub":         { es: "Vs floor collar 8.75%",       en: "Vs collar floor 8.75%" },
    "p2.impact.total":         { es: "Impacto total sobre EBITDA",  en: "Total EBITDA Impact" },
    "p2.impact.sub":           { es: "Impacto sobre EBITDA base",   en: "Impact on base EBITDA" },
    "p2.impact.adj":           { es: "EBITDA ajustado estimado:",   en: "Estimated Adjusted EBITDA:" },
    "p2.impact.given":         { es: "dado el valor actual de cada slider vs base de referencia.", en: "given current slider values vs reference base." },
    "p2.driver.fx":            { es: "💱 Tipo de cambio (FX)",      en: "💱 Exchange Rate (FX)" },
    "p2.driver.mn":            { es: "⛏ Precio Manganeso",          en: "⛏ Manganese Price" },
    "p2.driver.oro":           { es: "🥇 Precio Oro",               en: "🥇 Gold Price" },
    "p2.driver.tiie":          { es: "📈 Tasa TIIE",                en: "📈 TIIE Rate" },
    "p2.driver.sofr":          { es: "🇺🇸 Tasa SOFR",               en: "🇺🇸 SOFR Rate" },
    "p2.driver.gas":           { es: "⚡ Gas Natural",               en: "⚡ Natural Gas" },
    "p2.driver.vol":           { es: "🏭 Volumen",                  en: "🏭 Volume" },
    "p2.resetConfirm":         { es: "¿Restaurar todos los valores a los supuestos base?", en: "Reset all values to base assumptions?" },
    "p2.saved":                { es: "Valores restaurados",         en: "Values Reset" },
    "p2.csvExported":          { es: "CSV exportado",              en: "CSV Exported" },
    "p2.invalidVal":           { es: "Valor inválido",              en: "Invalid Value" },

    // ── PAGE 3: FX
    "p3.title":                { es: "Riesgo Tipo de Cambio",       en: "Exchange Rate Risk" },
    "p3.sub":                  { es: "USD / MXN · Exposición, coberturas y payoffs", en: "USD / MXN · Exposure, hedging and payoffs" },
    "p3.activeCollars":        { es: "Collares USD/MXN vigentes · 1T26", en: "Active USD/MXN Collars · 1Q26" },
    "p3.evaluate":             { es: "Evaluar instrumentos de cobertura", en: "Evaluate Hedging Instruments" },
    "p3.flowComp":             { es: "Comparativo de flujos por escenario", en: "Flow Comparison by Scenario" },
    "p3.payoff":               { es: "Diagrama de payoff · USD/MXN", en: "Payoff Diagram · USD/MXN" },
    "p3.analysis":             { es: "Análisis y recomendación",    en: "Analysis & Recommendation" },
    "p3.currentRate":          { es: "USD/MXN actual",              en: "Current USD/MXN" },
    "p3.unitImpact":           { es: "Impacto por $1 MXN",          en: "Impact per $1 MXN" },
    "p3.covered":              { es: "Exposición cubierta",         en: "Covered Exposure" },
    "p3.uncovered":            { es: "Exposición sin cubrir",       en: "Uncovered Exposure" },
    "p3.inRevenues":           { es: "En ingresos anualizados",     en: "In Annualized Revenues" },
    "p3.perUnit":              { es: "Por movimiento unitario",     en: "Per Unit Movement" },
    "p3.farBelow60":           { es: "Muy por debajo del 60%",      en: "Far Below 60%" },
    "p3.unprotected":          { es: "desprotegido",                en: "unprotected" },
    "p3.gapPolicy":            { es: "Gap vs política",             en: "Gap vs Policy" },
    "p3.contractDate":         { es: "Fecha contrato",              en: "Contract Date" },
    "p3.floorPut":             { es: "Floor (put largo)",           en: "Floor (long put)" },
    "p3.capCall":              { es: "Cap (call corto)",            en: "Cap (short call)" },
    "p3.notionalMonth":        { es: "Nocional/mes",                en: "Notional/month" },
    "p3.fxStatus":             { es: "Estado TC actual",            en: "Current FX Status" },
    "p3.estimatedPayoff":      { es: "Payoff estimado",             en: "Estimated Payoff" },
    "p3.putProtects":          { es: "✓ Put protege",               en: "✓ Put protects" },
    "p3.callLimits":           { es: "✗ Call limita",               en: "✗ Call limits" },
    "p3.inRange":              { es: "◎ Dentro del rango",          en: "◎ Within range" },
    "p3.collarParams":         { es: "Parámetros del collar",       en: "Collar Parameters" },
    "p3.floorLong":            { es: "Floor — put largo (piso de protección)", en: "Floor — long put (protection floor)" },
    "p3.capShort":             { es: "Cap — call corto (techo que se cede)", en: "Cap — short call (yielded ceiling)" },
    "p3.notionalUsd":          { es: "Nocional (USD miles)",        en: "Notional (USD thousands)" },
    "p3.impliedVol":           { es: "Volatilidad implícita (%)",   en: "Implied Volatility (%)" },
    "p3.fwdParams":            { es: "Parámetros del forward",      en: "Forward Parameters" },
    "p3.spotRate":             { es: "Tipo de cambio spot (USD/MXN)", en: "Spot Exchange Rate (USD/MXN)" },
    "p3.mxnRate":              { es: "Tasa MXN — TIIE (% anual)",   en: "MXN Rate — TIIE (% annual)" },
    "p3.usdRate":              { es: "Tasa USD — SOFR (% anual)",   en: "USD Rate — SOFR (% annual)" },
    "p3.put":                  { es: "Put USD/MXN — opción de venta", en: "USD/MXN Put — Sell Option" },
    "p3.currentSpot":          { es: "Spot actual",                 en: "Current Spot" },
    "p3.strike":               { es: "Strike (precio de ejercicio)", en: "Strike (exercise price)" },
    "p3.pricingModel":         { es: "Modelo de pricing",           en: "Pricing Model" },
    "p3.bs":                   { es: "Black-Scholes estándar",      en: "Standard Black-Scholes" },
    "p3.heston":               { es: "Heston (volatilidad estocástica)", en: "Heston (stochastic volatility)" },
    "p3.swap":                 { es: "Cross-currency swap USD/MXN", en: "USD/MXN Cross-Currency Swap" },
    "p3.notionalUsdK":         { es: "Nocional en USD (miles)",     en: "Notional in USD (thousands)" },
    "p3.fixedMxnRate":         { es: "Tasa fija MXN que recibes (%)", en: "Fixed MXN Rate Received (%)" },
    "p3.currentTIIE":          { es: "TIIE actual (%)",             en: "Current TIIE (%)" },
    "p3.spreadTIIE":           { es: "Spread sobre TIIE (%)",       en: "Spread over TIIE (%)" },
    "p3.collarResult":         { es: "Resultado del collar",        en: "Collar Outcome" },
    "p3.putPremium":           { es: "Prima put",                   en: "Put premium" },
    "p3.callPremium":          { es: "Prima call",                  en: "Call premium" },
    "p3.netCost":              { es: "Costo neto collar",           en: "Net collar cost" },
    "p3.totalCost":            { es: "Costo total nocional",        en: "Total notional cost" },
    "p3.protectedRange":       { es: "Rango protegido",             en: "Protected range" },
    "p3.costless":             { es: "¿Costless collar?",           en: "Costless collar?" },
    "p3.costlessYes":          { es: "✓ Sí — prima cero",           en: "✓ Yes — zero premium" },
    "p3.costlessNo":           { es: "✗ No — tiene costo",          en: "✗ No — has cost" },
    "p3.fwdResult":            { es: "Resultado del forward",       en: "Forward Outcome" },
    "p3.fwdPrice":             { es: "Precio forward",              en: "Forward price" },
    "p3.swapPoints":           { es: "Puntos swap (fwd−spot)",      en: "Swap points (fwd-spot)" },
    "p3.rateDiff":             { es: "Diferencial tasas (TIIE−SOFR)", en: "Interest rate differential (TIIE-SOFR)" },
    "p3.oppCost":              { es: "Costo de oportunidad",        en: "Opportunity cost" },
    "p3.putResult":            { es: "Resultado de la put",         en: "Put Outcome" },
    "p3.totalPremium":         { es: "Prima total nocional",        en: "Total notional premium" },
    "p3.premiumPct":           { es: "Prima % nocional",            en: "Premium % of notional" },
    "p3.vega":                 { es: "Vega (por 1% vol)",           en: "Vega (per 1% vol)" },
    "p3.moneyness":            { es: "Moneyness",                   en: "Moneyness" },
    "p3.itm":                  { es: "ITM — en el dinero",          en: "ITM — in the money" },
    "p3.otm":                  { es: "OTM — fuera del dinero",      en: "OTM — out of the money" },
    "p3.swapResult":           { es: "Resultado del swap",          en: "Swap Outcome" },
    "p3.fixedRate":            { es: "Tasa fija pactada",           en: "Contracted fixed rate" },
    "p3.varRate":              { es: "Tasa variable actual",        en: "Current variable rate" },
    "p3.mtm":                  { es: "Mark-to-market",              en: "Mark-to-Market" },
    "p3.annualSaving":         { es: "Ahorro/costo anual",          en: "Annual saving/cost" },
    "p3.unhedged":             { es: "Sin cobertura",               en: "Unhedged" },
    "p3.payoffDesc":           { es: "Ganancia/pérdida del instrumento en función del tipo de cambio al vencimiento", en: "Gain/loss of the instrument as a function of the exchange rate at maturity" },
    "p3.currentFX":            { es: "TC actual",                   en: "Actual FX" },
    "p3.stance":               { es: "Análisis de postura · USD/MXN", en: "Stance Analysis · USD/MXN" },
    "p3.whatMitigates":        { es: "QUÉ RIESGO MITIGA",           en: "WHAT RISK IT MITIGATES" },
    "p3.whatAccepts":          { es: "QUÉ RIESGO ACEPTA",           en: "WHAT RISK IT ACCEPTS" },
    "p3.whatSacrifices":       { es: "QUÉ SACRIFICA",               en: "WHAT IT SACRIFICES" },
    "p3.currentStance":        { es: "Postura actual:",             en: "Current stance:" },

    // ── PAGE 4: ORO
    "p4.title":                { es: "Riesgo Precio del Oro",       en: "Gold Price Risk" },
    "p4.sub":                  { es: "Metallorum · Sin cobertura activa · Precio en máximos históricos", en: "Metallorum · No active hedging · Price at historic highs" },
    "p4.flowComp":             { es: "Flujo por escenario · Sin vs Con cobertura", en: "Cash Flow per Scenario · Unhedged vs Hedged" },
    "p4.payoff":               { es: "Diagrama de payoff · Precio del oro", en: "Payoff Diagram · Gold Price" },
    "p4.currentPrice":         { es: "Precio Oro actual",           en: "Current Gold Price" },
    "p4.production":           { es: "Producción proyectada",       en: "Projected Production" },
    "p4.sensitivity":          { es: "Sensibilidad (USD/oz)",       en: "Sensitivity (USD/oz)" },
    "p4.vol":                  { es: "Volatilidad anual oro",       en: "Annual Gold Vol." },
    "p4.for2026":              { es: "Para 2026 (anualizado)",      en: "For 2026 (annualized)" },
    "p4.per100":               { es: "Por cada USD 100/oz",         en: "Per USD 100/oz shift" },
    "p4.uncovered":            { es: "Exposición no cubierta",      en: "Uncovered Exposure" },
    "p4.highs":                { es: "En máximos de 10 años",       en: "At 10-year highs" },
    "p4.fwdParams":            { es: "Parámetros del forward oro",  en: "Gold Forward Parameters" },
    "p4.fwdPrice":             { es: "Precio forward oro (USD/oz)", en: "Gold Forward Price (USD/oz)" },
    "p4.put":                  { es: "Put sobre oro · Heston",      en: "Gold Put Option · Heston" },
    "p4.collar":               { es: "Costless collar sobre oro",   en: "Gold Costless Collar" },
    "p4.comex":                { es: "Futuros COMEX (GC)",          en: "COMEX Futures (GC)" },
    "p4.margin":               { es: "Margen inicial requerido",    en: "Required Initial Margin" },
    "p4.fwdResult":            { es: "Resultado del forward oro",   en: "Gold Forward Outcome" },
    "p4.comexResult":          { es: "Resultado futuros COMEX",     en: "COMEX Futures Outcome" },
    "p4.payoffDesc":           { es: "Ganancia/pérdida del instrumento en función del precio del oro al vencimiento", en: "Gain/loss of the instrument as a function of the gold price at maturity" },
    "p4.currentGold":          { es: "Precio oro actual",           en: "Current gold price" },

    // ── PAGE 5: GAS
    "p5.title":                { es: "Riesgo Gas Natural",          en: "Natural Gas Risk" },
    "p5.sub":                  { es: "Costo operativo · Sin cobertura activa · Henry Hub", en: "Operating cost · No active hedging · Henry Hub" },
    "p5.profile":              { es: "Perfil de consumo energético · Autlán", en: "Energy Consumption Profile · Autlán" },
    "p5.exposure":             { es: "Exposición al gas natural",   en: "Natural Gas Exposure" },
    "p5.costScenario":         { es: "Costo operativo gas por escenario", en: "Gas Operating Cost by Scenario" },
    "p5.payoff":               { es: "Diagrama de payoff · Gas natural", en: "Payoff Diagram · Natural Gas" },
    "p5.currentPrice":         { es: "Precio Gas actual",           en: "Current Gas Price" },
    "p5.consumption":          { es: "Consumo anualizado",          en: "Annualized Consumption" },
    "p5.sensitivity":          { es: "Sensibilidad (gas)",          en: "Sensitivity (Gas)" },
    "p5.projectedCost":        { es: "Costo gas proyectado",        en: "Projected Gas Cost" },
    "p5.per1":                 { es: "Por cada USD 1/MMBtu",        en: "Per USD 1/MMBtu shift" },
    "p5.unprotected":          { es: "Exposición desprotegida",     en: "Unprotected Exposure" },
    "p5.energySources":        { es: "Fuentes de energía",          en: "Energy Sources" },
    "p5.natGas":               { es: "Gas natural (Henry Hub)",     en: "Natural Gas (Henry Hub)" },
    "p5.electricity":          { es: "Energía eléctrica (CENACE)",  en: "Electricity (CENACE)" },
    "p5.diesel":               { es: "Diésel y otros combustibles", en: "Diesel & other fuels" },
    "p5.swapParams":           { es: "Parámetros del swap de gas",  en: "Gas Swap Parameters" },
    "p5.swapPrice":            { es: "Precio swap pactado (USD/MMBtu)", en: "Contracted Swap Price (USD/MMBtu)" },
    "p5.collar":               { es: "Collar de gas",               en: "Gas Collar" },
    "p5.putResult":            { es: "Resultado de la put de gas",  en: "Gas Put Outcome" },
    "p5.swapResult":           { es: "Resultado del swap de gas",   en: "Gas Swap Outcome" },
    "p5.payoffDesc":           { es: "Ganancia/pérdida en función del precio de Henry Hub al vencimiento", en: "Gain/loss as a function of Henry Hub price at maturity" },
    "p5.currentGas":           { es: "Precio gas actual",           en: "Current gas price" },

    // ── PAGE 6: TASA
    "p6.title":                { es: "Riesgo Tasa de Interés",      en: "Interest Rate Risk" },
    "p6.sub":                  { es: "TIIE · SOFR · Mark-to-market del collar existente", en: "TIIE · SOFR · Mark-to-market of existing collar" },
    "p6.collarExisting":       { es: "Collar de tasa existente",    en: "Existing Interest Rate Collar" },
    "p6.situation":            { es: "Análisis de situación actual", en: "Current Situation Analysis" },
    "p6.costScenario":         { es: "Costo de intereses por escenario", en: "Interest Expense by Scenario" },
    "p6.currentTIIE":          { es: "TIIE 28d actual",             en: "Current TIIE 28d" },
    "p6.currentSOFR":          { es: "SOFR 1m actual",              en: "Current SOFR 1m" },
    "p6.varDebt":              { es: "Deuda tasa variable",         en: "Variable Rate Debt" },
    "p6.projInterest":         { es: "Interés proyectado (anual)",  en: "Projected Interest (Annual)" },
    "p6.bankSpread":           { es: "Spread promedio bancario",    en: "Average Bank Spread" },
    "p6.collarNotional":       { es: "Nocional collar activo",      en: "Active Collar Notional" },
    "p6.pendingCoupons":       { es: "Cupones pendientes",          en: "Pending Coupons" },
    "p6.currentMtM":           { es: "Mark-to-Market actual",       en: "Current Mark-to-Market" },
    "p6.linkedCreditors":      { es: "Acreedores vinculados",       en: "Linked Creditors" },
    "p6.q1loss":               { es: "Pérdida en 1T26",             en: "Loss in 1Q26" },
    "p6.capParams":            { es: "Parámetros del cap de tasa",  en: "Interest Rate Cap Parameters" },
    "p6.capStrike":            { es: "Cap de tasa (strike)",        en: "Interest Rate Cap (Strike)" },
    "p6.swapParams":           { es: "Parámetros del swap de tasa", en: "Interest Rate Swap Parameters" },
    "p6.payFixed":             { es: "Pagar fija / recibir variable", en: "Pay Fixed / Receive Variable" },
    "p6.fixedRate":            { es: "Tasa fija a pagar (%)",       en: "Fixed Rate to Pay (%)" },
    "p6.fix100":               { es: "Fijar 100% de deuda variable", en: "Fix 100% of Variable Debt" },
    "p6.capResult":            { es: "Resultado del cap",           en: "Cap Outcome" },
    "p6.collarResult":         { es: "Resultado del collar de tasa", en: "Rate Collar Outcome" },
    "p6.swapResult":           { es: "Resultado del swap de tasa",  en: "Rate Swap Outcome" },
    "p6.payoffDesc":           { es: "Ganancia/pérdida del collar en función de la TIIE 28d al vencimiento", en: "Gain/loss of the collar as a function of TIIE 28d at maturity" },
    "p6.currentTIIEAxis":      { es: "TIIE actual",                 en: "Current TIIE" },

    // ── PAGE 7: MANGANESO
    "p7.title":                { es: "Riesgo Precio Manganeso",     en: "Manganese Price Risk" },
    "p7.sub":                  { es: "Commodity principal · Mercado OTC limitado · Alternativas de cobertura", en: "Primary Commodity · Limited OTC Market · Hedging Alternatives" },
    "p7.market":               { es: "Estructura del mercado",      en: "Market Structure" },
    "p7.drivers":              { es: "Drivers del precio",          en: "Price Drivers" },
    "p7.currentPrice":         { es: "Precio Mn actual",            en: "Current Mn Price" },
    "p7.production":           { es: "Producción anualizada",       en: "Annualized Production" },
    "p7.sensitivity":          { es: "Sensibilidad Mn",             en: "Mn Sensitivity" },
    "p7.projRev":              { es: "Ingresos Mn proyectados",     en: "Projected Mn Revenues" },
    "p7.per100t":              { es: "Por cada USD 100/t",          en: "Per USD 100/t shift" },
    "p7.nonMitigatable":       { es: "Exposición no mitigable",     en: "Non-mitigatable Exposure" },
    "p7.noOtc":                { es: "No existen derivados OTC fluidos", en: "Fluid OTC derivatives do not exist" },
    "p7.strategies":           { es: "Estrategias de mitigación operativa", en: "Operational Mitigation Strategies" },
    "p7.payoffEst":            { es: "Payoff estimado de cobertura comercial", en: "Estimated Payoff of Commercial Hedging" },
    "p7.payoffDesc":           { es: "Ganancia/pérdida comercial en función del precio del Manganeso al vencimiento", en: "Commercial gain/loss as a function of Manganese price at maturity" },
    "p7.currentMn":            { es: "Precio Mn actual",            en: "Current Mn price" },

    // ── PAGE 8: SECUNDARIOS
    "p8.title":                { es: "Riesgos Secundarios",         en: "Secondary Risks" },
    "p8.sub":                  { es: "Contraparte · Base · Liquidez · Regulatorio · Operativo", en: "Counterparty · Basis · Liquidity · Regulatory · Operational" },
    "p8.alert":                { es: "Los riesgos secundarios no se cubren con derivados financieros, pero <strong>afectan directamente la efectividad</strong> de cualquier estrategia de cobertura. Ignorarlos es el error más común en una mesa de riesgos real.", en: "Secondary risks are not covered with financial derivatives, but <strong>directly affect the effectiveness</strong> of any hedging strategy. Ignoring them is the most common mistake in a real risk desk." },
    "p8.matrix":               { es: "Matriz de riesgos · Probabilidad vs Impacto", en: "Risk Matrix · Probability vs Impact" },
    "p8.detail":               { es: "Análisis detallado por tipo de riesgo", en: "Detailed Analysis by Risk Type" },
    "p8.concentration":        { es: "Riesgo de concentración · Clientes y canales", en: "Concentration Risk · Clients and Channels" },
    "p8.regulatory":           { es: "Marco regulatorio · Derivados en México", en: "Regulatory Framework · Derivatives in Mexico" },
    "p8.mitigation":           { es: "Plan de mitigación integral",  en: "Comprehensive Mitigation Plan" },
    "p8.prob":                 { es: "PROBABILIDAD →",               en: "PROBABILITY →" },
    "p8.impact":               { es: "IMPACTO →",                    en: "IMPACT →" },
    "p8.low":                  { es: "Baja",                         en: "Low" },
    "p8.high":                 { es: "Alta",                         en: "High" },
    "p8.riskLevel":            { es: "Nivel de riesgo Autlán Q1 2026", en: "Autlán Risk Level Q1 2026" },
    "p8.r1.tipo":              { es: "Riesgo de contraparte",         en: "Counterparty Risk" },
    "p8.r1.nivel":             { es: "MEDIO",                         en: "MEDIUM" },
    "p8.r1.desc":              { es: "Cuando la contraparte de un IFD (banco o institución financiera) no cumple sus obligaciones. Autlán opera principalmente en mercados OTC con instituciones internacionales reconocidas (Santander, BBVA) — reduce pero no elimina el riesgo.", en: "When the counterparty of a derivative (bank or financial institution) fails to meet its obligations. Autlán operates mainly in OTC markets with recognized international institutions (Santander, BBVA) — reduces but does not eliminate the risk." },
    "p8.r1.impacto":           { es: "Si una contraparte falla, Autlán pierde el valor de mercado positivo del instrumento. Con MtM actuales pequeños (~USD 45K), el impacto inmediato es limitado. El riesgo crece si se agregan más instrumentos y el MtM acumula.", en: "If a counterparty fails, Autlán loses the positive market value of the instrument. With current small MtMs (~USD 45K), the immediate impact is limited. Risk grows if more instruments are added and MtM accumulates." },
    "p8.r1.mit1":              { es: "Operar solo con contrapartes investment grade", en: "Operate only with investment-grade counterparties" },
    "p8.r1.mit2":              { es: "Diversificar contrapartes — no concentrar en un banco", en: "Diversify counterparties — do not concentrate in one bank" },
    "p8.r1.mit3":              { es: "CSA (Credit Support Annex) para colateral bilateral", en: "CSA (Credit Support Annex) for bilateral collateral" },
    "p8.r1.mit4":              { es: "Límites de exposición por contraparte en política interna", en: "Counterparty exposure limits in internal policy" },
    "p8.r2.tipo":              { es: "Riesgo de base (Basis Risk)",   en: "Basis Risk" },
    "p8.r2.nivel":             { es: "MEDIO-ALTO",                    en: "MEDIUM-HIGH" },
    "p8.r2.desc":              { es: "El basis risk surge cuando el instrumento de cobertura no correlaciona perfectamente con la exposición que cubre. Para Autlán: el precio que recibe de sus clientes (precio de contrato) puede diferir del índice spot que usa el derivado como referencia.", en: "Basis risk arises when the hedging instrument does not perfectly correlate with the exposure it covers. For Autlán: the price received from clients (contract price) may differ from the spot index used by the derivative as reference." },
    "p8.r2.impacto":           { es: "Un forward de manganeso referenciado al CRU puede no compensar exactamente la caída del precio de contrato con el cliente. El basis puede ser de USD 50-100/MT — significativo sobre USD 289M de ingresos. En FX, el basis entre el tipo de cambio spot y el forward es pequeño pero existe.", en: "A manganese forward referenced to CRU may not exactly offset the drop in contract price with the client. The basis can be USD 50-100/MT — significant against USD 289M in revenues. For FX, the basis between spot exchange rate and forward is small but exists." },
    "p8.r2.mit1":              { es: "Elegir índice de referencia del derivado = índice del contrato cliente", en: "Choose derivative reference index = client contract index" },
    "p8.r2.mit2":              { es: "Documentar el basis histórico antes de contratar cobertura", en: "Document historical basis before contracting hedging" },
    "p8.r2.mit3":              { es: "Preferir cobertura natural (contratos LP) que elimina el basis", en: "Prefer natural hedging (LP contracts) which eliminates basis" },
    "p8.r2.mit4":              { es: "Monitorear efectividad de cobertura trimestralmente (IFRS 9)", en: "Monitor hedge effectiveness quarterly (IFRS 9)" },
    "p8.r3.tipo":              { es: "Riesgo de liquidez del instrumento", en: "Instrument Liquidity Risk" },
    "p8.r3.nivel":             { es: "MEDIO-ALTO",                    en: "MEDIUM-HIGH" },
    "p8.r3.desc":              { es: "El riesgo de no poder salir de una posición de IFD al precio de mercado justo, o de tener que pagar un spread muy alto para cerrar la posición anticipadamente. Más relevante en mercados OTC que en bolsas listadas.", en: "The risk of being unable to exit a derivative position at fair market price, or having to pay a very high spread to close the position early. More relevant in OTC markets than on listed exchanges." },
    "p8.r3.impacto":           { es: "Si Autlán necesita salir anticipadamente del collar TIIE o de un forward de manganeso, el costo de liquidación puede ser significativamente mayor que el MtM teórico. Con DSCR de 0.6x, la liquidez es crítica.", en: "If Autlán needs to exit the TIIE collar or a manganese forward early, the settlement cost can be significantly higher than the theoretical MtM. With DSCR of 0.6x, liquidity is critical." },
    "p8.r3.mit1":              { es: "Preferir instrumentos listados (futuros COMEX para oro)", en: "Prefer listed instruments (COMEX futures for gold)" },
    "p8.r3.mit2":              { es: "Negociar cláusulas de liquidación anticipada en contratos OTC", en: "Negotiate early termination clauses in OTC contracts" },
    "p8.r3.mit3":              { es: "Mantener cash buffer suficiente para margin calls potenciales", en: "Maintain sufficient cash buffer for potential margin calls" },
    "p8.r3.mit4":              { es: "Limitar horizonte de coberturas OTC a 12 meses (política actual)", en: "Limit OTC hedge horizon to 12 months (current policy)" },
    "p8.r4.tipo":              { es: "Riesgo regulatorio y contable", en: "Regulatory and Accounting Risk" },
    "p8.r4.nivel":             { es: "BAJO",                          en: "LOW" },
    "p8.r4.desc":              { es: "Riesgo de cambios en regulación que afecten el uso de IFDs o su tratamiento contable. En México: CNBV regula los intermediarios, Banxico supervisa el mercado de derivados. Bajo IFRS 9, las coberturas deben calificar para hedge accounting o el MtM va directo a resultados.", en: "Risk of regulatory changes affecting the use of derivatives or their accounting treatment. In Mexico: CNBV regulates intermediaries, Banxico supervises the derivatives market. Under IFRS 9, hedges must qualify for hedge accounting or MtM goes directly to earnings." },
    "p8.r4.impacto":           { es: "Si una cobertura pierde su designación IFRS 9 (por inefectividad), el MtM va a P&L — amplificando la volatilidad de utilidades en lugar de reducirla. Autlán confirma efectividad trimestralmente.", en: "If a hedge loses its IFRS 9 designation (due to ineffectiveness), MtM goes to P&L — amplifying earnings volatility instead of reducing it. Autlán confirms effectiveness quarterly." },
    "p8.r4.mit1":              { es: "Documentación de hedge accounting desde contratación", en: "Hedge accounting documentation from inception" },
    "p8.r4.mit2":              { es: "Pruebas de efectividad trimestrales (método compensación)", en: "Quarterly effectiveness tests (offset method)" },
    "p8.r4.mit3":              { es: "Asesoría legal especializada en derivados OTC en México", en: "Specialized legal advice on OTC derivatives in Mexico" },
    "p8.r4.mit4":              { es: "Cumplimiento EMIR/Dodd-Frank para operaciones cross-border", en: "EMIR/Dodd-Frank compliance for cross-border operations" },
    "p8.r5.tipo":              { es: "Riesgo operativo de la mesa de derivados", en: "Derivatives Desk Operational Risk" },
    "p8.r5.nivel":             { es: "MEDIO",                         en: "MEDIUM" },
    "p8.r5.desc":              { es: "Riesgo de errores en ejecución, valuación o reporte de posiciones de IFD. Include: errores en captura de parámetros, falta de segregación de funciones, ausencia de sistemas de valuación independiente.", en: "Risk of errors in execution, valuation or reporting of derivative positions. Includes: parameter capture errors, lack of segregation of duties, absence of independent valuation systems." },
    "p8.r5.impacto":           { es: "Un error en el nocional de un forward o en el strike de un collar puede resultar en una cobertura incorrecta o en pérdidas no anticipadas. Autlán usa valuación de contrapartes + verificación interna.", en: "An error in the notional of a forward or the strike of a collar can result in incorrect hedging or unanticipated losses. Autlán uses counterparty valuation + internal verification." },
    "p8.r5.mit1":              { es: "Segregación: quien contrata ≠ quien valúa ≠ quien reporta", en: "Segregation: who contracts ≠ who values ≠ who reports" },
    "p8.r5.mit2":              { es: "Reconciliación mensual de valuaciones con contrapartes", en: "Monthly reconciliation of valuations with counterparties" },
    "p8.r5.mit3":              { es: "Sistema de registro independiente (no solo el del banco)", en: "Independent recording system (not just the bank's)" },
    "p8.r5.mit4":              { es: "Capacitación continua del equipo de tesorería", en: "Continuous training of the treasury team" },
    "p8.conc.title":           { es: "Concentración de clientes · Autlán 2025", en: "Client Concentration · Autlán 2025" },
    "p8.conc.alert":           { es: "<strong>Top 6 clientes = 61% de receivables</strong> (XBRL Q4 2025). Todos los exports USA via <strong>CCMA LLC</strong> — una sola relación comercial concentra el canal de exportación más importante.", en: "<strong>Top 6 clients = 61% of receivables</strong> (XBRL Q4 2025). All USA exports via <strong>CCMA LLC</strong> — a single commercial relationship concentrates the most important export channel." },
    "p8.conc.ccma":            { es: "CCMA LLC (canal USA)",         en: "CCMA LLC (USA channel)" },
    "p8.conc.domestic":        { es: "Clientes domésticos top 3",    en: "Top 3 domestic clients" },
    "p8.conc.europe":          { es: "Clientes europeos top 2",      en: "Top 2 European clients" },
    "p8.conc.rest":            { es: "Resto de clientes",            en: "Other clients" },
    "p8.conc.nota1":           { es: "Single channel — todos exports USA", en: "Single channel — all USA exports" },
    "p8.conc.nota2":           { es: "Acereras mexicanas — ciclo bajo", en: "Mexican steel mills — low cycle" },
    "p8.conc.nota3":           { es: "Cuotas de importación EU",      en: "EU import quotas" },
    "p8.conc.nota4":           { es: "Diversificado",                 en: "Diversified" },
    "p8.impl.title":           { es: "Implicaciones para cobertura", en: "Implications for Hedging" },
    "p8.impl.ccma.t":          { es: "CCMA LLC — riesgo canal único", en: "CCMA LLC — single channel risk" },
    "p8.impl.ccma.d":          { es: "Si CCMA falla o renegocia términos, Autlán pierde acceso al mercado USA. La cobertura FX está diseñada para flujos que asumen la continuidad de CCMA. Una interrupción elimina la exposición que se cubre.", en: "If CCMA fails or renegotiates terms, Autlán loses access to the USA market. FX hedging is designed for flows that assume CCMA continuity. An interruption eliminates the exposure being hedged." },
    "p8.impl.basis.t":         { es: "Concentración amplifica el basis risk", en: "Concentration amplifies basis risk" },
    "p8.impl.basis.d":         { es: "Si el top 6 negocia precios que difieren significativamente del índice spot, el basis risk de cualquier derivado se amplifica. Las coberturas deben basarse en el precio de contrato real, no en el índice de referencia del mercado.", en: "If the top 6 negotiate prices that differ significantly from the spot index, the basis risk of any derivative is amplified. Hedges must be based on the actual contract price, not the market reference index." },
    "p8.impl.lp.t":            { es: "Contratos LP reducen el riesgo de concentración", en: "LP Contracts Reduce Concentration Risk" },
    "p8.impl.lp.d":            { es: "Irónicamente, los contratos LP con los top 6 clientes reducen simultáneamente el riesgo de precio (cobertura natural) y el riesgo de concentración (fidelizan la relación comercial). Son la solución más eficiente para ambos riesgos.", en: "Ironically, LP contracts with the top 6 clients simultaneously reduce price risk (natural hedge) and concentration risk (loyalty in commercial relationship). They are the most efficient solution for both risks." },
    "p8.reg.legal":            { es: "Marco legal · Derivados en México", en: "Legal Framework · Derivatives in Mexico" },
    "p8.reg.compliance":       { es: "Cumplimiento actual de Autlán", en: "Autlán's Current Compliance" },
    "p8.reg.alta":             { es: "Alta",                          en: "High" },
    "p8.reg.media":            { es: "Media",                         en: "Medium" },
    "p8.reg.baja":             { es: "Baja",                          en: "Low" },
    "p8.reg.bajause":          { es: "Baja (Autlán usa principalmente OTC)", en: "Low (Autlán primarily uses OTC)" },
    "p8.reg.altapl":           { es: "Alta — afecta P&L directamente", en: "High — directly affects P&L" },
    "p8.reg.c1":               { es: "Política formal de IFD documentada", en: "Formal IFD policy documented" },
    "p8.reg.c2":               { es: "Objetivo exclusivo de cobertura (no especul.)", en: "Hedging purpose only (no speculation)" },
    "p8.reg.c3":               { es: "Contrapartes de alta calidad crediticia", en: "High credit quality counterparties" },
    "p8.reg.c4":               { es: "Documentación IFRS 9 hedge accounting", en: "IFRS 9 hedge accounting documentation" },
    "p8.reg.c5":               { es: "Pruebas de efectividad trimestrales", en: "Quarterly effectiveness tests" },
    "p8.reg.c6":               { es: "Valuación independiente verificada", en: "Verified independent valuation" },
    "p8.reg.c7":               { es: "Revelación en XBRL BMV (transparencia)", en: "Disclosure in XBRL BMV (transparency)" },
    "p8.reg.c8":               { es: "Comité de riesgos activo", en: "Active risk committee" },
    "p8.reg.c9":               { es: "Sin llamadas de margen pendientes 1T26", en: "No pending margin calls 1Q26" },
    "p8.reg.c10":              { es: "Cobertura FX al 60% de política", en: "FX hedging at 60% policy" },
    "p8.reg.c10.nota":         { es: "Solo 3% cubierto actualmente", en: "Only 3% currently covered" },
    "p8.reg.compAlert":        { es: "Autlán cumple con todos los requisitos regulatorios y de governance para el uso de IFD. El único gap es el nivel de cobertura FX vs política interna.", en: "Autlán meets all regulatory and governance requirements for derivative use. The only gap is the FX hedging level vs internal policy." },
    "p8.mit.actions":          { es: "Acciones de mitigación · Prioridad y horizonte", en: "Mitigation Actions · Priority and Horizon" },
    "p8.mit.risk":             { es: "Riesgo",                        en: "Risk" },
    "p8.mit.action":           { es: "Acción de mitigación",          en: "Mitigation Action" },
    "p8.mit.responsible":      { es: "Responsable",                   en: "Responsible" },
    "p8.mit.horizon":          { es: "Horizonte",                     en: "Horizon" },
    "p8.mit.priority":         { es: "Prioridad",                     en: "Priority" },
    "p8.mit.cost":             { es: "Costo estimado",                en: "Estimated Cost" },
    "p8.mit.perspectiva":      { es: "<strong>Perspectiva de mesa de riesgos:</strong> Los riesgos secundarios no se eliminan — se gestionan. La diferencia entre una empresa que pierde en derivados y una que gana no es el instrumento elegido, sino la calidad de la documentación, el monitoreo continuo y la disciplina para actuar cuando los parámetros cambian.", en: "<strong>Risk desk perspective:</strong> Secondary risks are not eliminated — they are managed. The difference between a company that loses on derivatives and one that gains is not the instrument chosen, but the quality of documentation, continuous monitoring and the discipline to act when parameters change." },
    "p8.reg.banxico.rol":      { es: "Regula el mercado de derivados OTC en México", en: "Regulates the OTC derivatives market in Mexico" },
    "p8.reg.banxico.norma":    { es: "Circular 4/2012 — requisitos de operación con IFD", en: "Circular 4/2012 — operation requirements for derivatives" },
    "p8.reg.cnbv.rol":         { es: "Supervisa intermediarios financieros que ofrecen IFD", en: "Supervises financial intermediaries offering derivatives" },
    "p8.reg.cnbv.norma":       { es: "Disposiciones aplicables a casas de bolsa y bancos", en: "Regulations applicable to brokerages and banks" },
    "p8.reg.mexder.rol":       { es: "Mercado listado — futuros y opciones sobre TIIE, IPC", en: "Listed market — futures & options on TIIE, IPC" },
    "p8.reg.mexder.norma":     { es: "Reglamento interior MexDer", en: "MexDer Internal Regulations" },
    "p8.reg.ifrs.rol":         { es: "Tratamiento contable de coberturas", en: "Accounting treatment of hedging" },
    "p8.reg.ifrs.norma":       { es: "Hedge accounting — efectividad mínima 80-125%", en: "Hedge accounting — minimum effectiveness 80-125%" },
    "p8.reg.sat.rol":          { es: "Tratamiento fiscal de ganancias/pérdidas en IFD", en: "Tax treatment of derivative gains/losses" },
    "p8.reg.sat.norma":        { es: "Arts. 20-22 LISR — acumulación de ingresos por derivados", en: "Arts. 20-22 LISR — accumulation of income from derivatives" },
    "p8.mit.r1":               { es: "Concentración FX", en: "FX Concentration" },
    "p8.mit.a1":               { es: "Ampliar coberturas FX hasta 40-60% de ingresos USD", en: "Expand FX hedges up to 40-60% of USD revenues" },
    "p8.mit.resp1":            { es: "Tesorería", en: "Treasury" },
    "p8.mit.h1":               { es: "Inmediato (Q2 2026)", en: "Immediate (2Q26)" },
    "p8.mit.prio1":            { es: "CRÍTICA", en: "CRITICAL" },
    "p8.mit.cost1":            { es: "Prima collar ~0.1-0.3% nocional", en: "Collar premium ~0.1-0.3% of notional" },
    "p8.mit.r2":               { es: "Rollover deuda", en: "Debt Rollover" },
    "p8.mit.a2":               { es: "Refinanciar créditos SOFR que vencen 2027 antes de USMCA", en: "Refinance SOFR credits maturing in 2027 before USMCA" },
    "p8.mit.resp2":            { es: "CFO / Bancos", en: "CFO / Banks" },
    "p8.mit.h2":               { es: "Q2-Q3 2026", en: "2Q-3Q 2026" },
    "p8.mit.prio2":            { es: "ALTA", en: "HIGH" },
    "p8.mit.cost2":            { es: "Fee de refinanciamiento 0.5-1%", en: "Refinancing fee 0.5-1%" },
    "p8.mit.r3":               { es: "Concentración clientes", en: "Client Concentration" },
    "p8.mit.a3":               { es: "Diversificar canal USA — no solo CCMA LLC", en: "Diversify USA channel — not just CCMA LLC" },
    "p8.mit.resp3":            { es: "Dirección Comercial", en: "Commercial Division" },
    "p8.mit.h3":               { es: "12-18 meses", en: "12-18 months" },
    "p8.mit.prio3":            { es: "ALTA", en: "HIGH" },
    "p8.mit.cost3":            { es: "Costo de desarrollo comercial", en: "Commercial development cost" },
    "p8.mit.r4":               { es: "Collar TIIE OTM", en: "TIIE Collar OTM" },
    "p8.mit.a4":               { es: "Evaluar reestructura si TIIE < 7% por 2+ trimestres", en: "Evaluate restructure if TIIE < 7% for 2+ quarters" },
    "p8.mit.resp4":            { es: "Tesorería", en: "Treasury" },
    "p8.mit.h4":               { es: "Q3 2026", en: "3Q 2026" },
    "p8.mit.prio4":            { es: "MEDIA", en: "MEDIUM" },
    "p8.mit.cost4":            { es: "Costo de reestructura ~USD 20-40K", en: "Restructuring cost ~USD 20-40K" },
    "p8.mit.r5":               { es: "Exposición oro sin cubrir", en: "Unhedged Gold Exposure" },
    "p8.mit.a5":               { es: "Contratar costless collar $2,700-$3,300 sobre 50% producción", en: "Enter costless collar $2,700-$3,300 on 50% of production" },
    "p8.mit.resp5":            { es: "Tesorería", en: "Treasury" },
    "p8.mit.h5":               { es: "Inmediato", en: "Immediate" },
    "p8.mit.prio5":            { es: "ALTA", en: "HIGH" },
    "p8.mit.cost5":            { es: "Costless — prima neta ~0", en: "Costless — net premium ~0" },
    "p8.mit.r6":               { es: "Exposición gas sin cubrir", en: "Unhedged Gas Exposure" },
    "p8.mit.a6":               { es: "Swap precio fijo 12 meses sobre 50% consumo expuesto", en: "12-month fixed price swap on 50% of exposed consumption" },
    "p8.mit.resp6":            { es: "Operaciones / Tesorería", en: "Operations / Treasury" },
    "p8.mit.h6":               { es: "Q2 2026", en: "2Q 2026" },
    "p8.mit.prio6":            { es: "MEDIA", en: "MEDIUM" },
    "p8.mit.cost6":            { es: "Prima implícita ~USD 200-400K", en: "Implicit premium ~USD 200-400K" },
    "p8.mit.r7":               { es: "Basis risk manganeso", en: "Manganese Basis Risk" },
    "p8.mit.a7":               { es: "Asegurar índice de referencia = precio de contrato cliente", en: "Ensure reference index = client contract price" },
    "p8.mit.resp7":            { es: "Comercial / Tesorería", en: "Commercial / Treasury" },
    "p8.mit.h7":               { es: "Al contratar", en: "At contracting" },
    "p8.mit.prio7":            { es: "MEDIA", en: "MEDIUM" },
    "p8.mit.cost7":            { es: "Sin costo adicional", en: "No additional cost" },
    "p8.mit.r8":               { es: "Riesgo contraparte IFD", en: "Derivative Counterparty Risk" },
    "p8.mit.a8":               { es: "CSA bilateral y límites de exposición por contraparte", en: "Bilateral CSA and exposure limits by counterparty" },
    "p8.mit.resp8":            { es: "Tesorería / Legal", en: "Treasury / Legal" },
    "p8.mit.h8":               { es: "En próxima renovación", en: "At next renewal" },
    "p8.mit.prio8":            { es: "BAJA", en: "LOW" },
    "p8.mit.cost8":            { es: "Costo legal ~USD 10-20K", en: "Legal cost ~USD 10-20K" },
    "p8.mit.roll":             { es: "Rollover deuda", en: "Debt Rollover" },
    "p8.mit.dump":             { es: "Dumping asiático", en: "Asian Dumping" },

    // ── PAGE 9: ESTRATEGIA
    "p9.title":                { es: "Estrategia Óptima de Cobertura", en: "Optimal Hedging Strategy" },
    "p9.sub":                  { es: "Portafolio recomendado · Política 60% · P&L por escenario", en: "Recommended Portfolio · 60% Policy · P&L by Scenario" },
    "p9.portfolio":            { es: "Portafolio de cobertura recomendado", en: "Recommended Hedging Portfolio" },
    "p9.payoff":               { es: "Payoff consolidado del portafolio", en: "Consolidated Portfolio Payoff" },
    "p9.payoffSub":            { es: "Muestra la ganancia o pérdida neta combinada de todas las coberturas recomendadas", en: "Shows the combined net gain or loss of all recommended hedges" },
    "p9.composition":          { es: "Composición del portafolio recomendado", en: "Composition of the Recommended Portfolio" },
    "p9.ebitdaEffect":         { es: "Efecto de la estrategia óptima sobre EBITDA", en: "Effect of the Optimal Strategy on EBITDA" },
    "p9.consolidated":         { es: "Consolidado del portafolio",   en: "Portfolio Consolidated" },
    "p9.annualAmount":         { es: "Monto anualizado",             en: "Annualized Amount" },
    "p9.status":               { es: "Estado",                       en: "Status" },
    "p9.payoffDesc":           { es: "Payoff consolidado en función de las variables de mercado en escenario adverso", en: "Consolidated payoff as a function of market variables in adverse scenario" },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // I18N.t() — función principal de traducción
  // ─────────────────────────────────────────────────────────────────────────
  function t(key) {
    const entry = STRINGS[key];
    if (!entry) {
      // Fallback: mostrar key en desarrollo para detectar claves faltantes
      return key;
    }
    return entry[activeLang] || entry["es"] || key;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAPA DE PAGES → FUNCIONES DE RENDER (para re-render al cambiar idioma)
  // ─────────────────────────────────────────────────────────────────────────
  const PAGE_RENDER_FN = {
    "dashboard":   () => { if (typeof renderDashboard   === "function") { document.getElementById("dashboard-content").innerHTML = ""; renderDashboard(); } },
    "perfil":      () => { if (typeof renderPerfil      === "function") { document.getElementById("perfil-content").innerHTML = ""; renderPerfil(); } },
    "escenarios":  () => { if (typeof renderEscenarios  === "function") { document.getElementById("escenarios-content").innerHTML = ""; renderEscenarios(); } },
    "fx":          () => { if (typeof renderFX          === "function") { document.getElementById("fx-content").innerHTML = ""; renderFX(); } },
    "oro":         () => { if (typeof renderOro         === "function") { document.getElementById("oro-content").innerHTML = ""; renderOro(); } },
    "gas":         () => { if (typeof renderGas         === "function") { document.getElementById("gas-content").innerHTML = ""; renderGas(); } },
    "tasa":        () => { if (typeof renderTasa        === "function") { document.getElementById("tasa-content").innerHTML = ""; renderTasa(); } },
    "manganeso":   () => { if (typeof renderManganeso   === "function") { document.getElementById("manganeso-content").innerHTML = ""; renderManganeso(); } },
    "secundarios": () => { if (typeof renderSecundarios === "function") { document.getElementById("secundarios-content").innerHTML = ""; renderSecundarios(); } },
    "estrategia":  () => { if (typeof renderEstrategia  === "function") { document.getElementById("estrategia-content").innerHTML = ""; renderEstrategia(); } },
    "docs":        () => { if (typeof renderDocs        === "function") { document.getElementById("docs-content").innerHTML = ""; renderDocs(); } },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TRADUCCIÓN DOM ESTÁTICO (sidebar, topbar, modal) via MutationObserver
  // ─────────────────────────────────────────────────────────────────────────

  // Diccionario para DOM estático (textos del HTML)
  const STATIC_MAP = {
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
    "EBITDA proy.": "Proj. EBITDA",
    "Base": "Base",
    "Optimista": "Optimistic",
    "Adverso": "Adverse",
    "Cancelar": "Cancel",
    "Confirmar override": "Confirm Override",
    "⚠ Sobreescribir dato auditado": "⚠ Override Audited Data",
    "Campo": "Field",
    "Valor original": "Original Value",
    "Nuevo valor": "New Value",
    "Justificación": "Justification",
    "Este valor proviene de un reporte auditado (XBRL BMV). Modificarlo requeriere una justificación documentada.": "This value comes from an audited report (XBRL BMV). Modifying it requires documented justification.",
  };

  const STATIC_MAP_REVERSE = {};
  for (const [es, en] of Object.entries(STATIC_MAP)) {
    STATIC_MAP_REVERSE[en] = es;
  }

  function translateStaticNode(node) {
    if (activeLang === "es") {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.__origText !== undefined) node.textContent = node.__origText;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "SCRIPT" || node.tagName === "STYLE") return;
        if (node.__origHTML !== undefined) {
          node.innerHTML = node.__origHTML;
        } else {
          for (let c of node.childNodes) translateStaticNode(c);
        }
        if ((node.tagName === "INPUT" || node.tagName === "TEXTAREA") && node.__origPlaceholder !== undefined) {
          node.placeholder = node.__origPlaceholder;
        }
      }
      return;
    }

    // Inglés
    if (node.nodeType === Node.TEXT_NODE) {
      const orig = node.textContent;
      if (!orig || !orig.trim()) return;
      if (node.__origText === undefined) node.__origText = orig;
      const trans = STATIC_MAP[orig.trim()];
      if (trans) node.textContent = trans;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === "SCRIPT" || node.tagName === "STYLE") return;
      if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
        const ph = node.placeholder;
        if (ph && ph.trim()) {
          if (node.__origPlaceholder === undefined) node.__origPlaceholder = ph;
          const t = STATIC_MAP[ph.trim()];
          if (t) node.placeholder = t;
        }
      }
      if (node.__origHTML !== undefined) {
        // Restore original first, then translate
      }
      for (let c of node.childNodes) translateStaticNode(c);
    }
  }

  function translateStaticChrome() {
    const roots = ["sidebar", "overrideModal"];
    roots.forEach(id => {
      const el = document.getElementById(id);
      if (el) translateStaticNode(el);
    });

    // Translate topbar stat label separately
    const ebitdaLabel = document.querySelector(".topbar-stat .stat-label");
    if (ebitdaLabel) {
      if (activeLang === "en") {
        if (!ebitdaLabel.__origText) ebitdaLabel.__origText = ebitdaLabel.textContent;
        ebitdaLabel.textContent = STATIC_MAP[ebitdaLabel.textContent.trim()] || ebitdaLabel.textContent;
      } else if (ebitdaLabel.__origText) {
        ebitdaLabel.textContent = ebitdaLabel.__origText;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CANVAS INTERCEPTOR
  // ─────────────────────────────────────────────────────────────────────────
  function initCanvasInterceptor() {
    const orig = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
      let out = text;
      if (activeLang === "en" && text) {
        out = STATIC_MAP[String(text).trim()] || text;
      }
      orig.call(this, out, x, y, maxWidth);
    };

    const origS = CanvasRenderingContext2D.prototype.strokeText;
    CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
      let out = text;
      if (activeLang === "en" && text) {
        out = STATIC_MAP[String(text).trim()] || text;
      }
      origS.call(this, out, x, y, maxWidth);
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LANG SELECTOR
  // ─────────────────────────────────────────────────────────────────────────
  function getSelectorBtnStyle(active) {
    return `
      font-size: 10.5px; font-weight: 700; padding: 4px 10px;
      border-radius: 4px; cursor: pointer; border: none;
      transition: all 0.2s ease;
      color: ${active ? "#ffffff" : "var(--text-muted)"};
      background: ${active ? "var(--accent-bright)" : "transparent"};
      box-shadow: ${active ? "0 2px 8px rgba(75,33,96,0.4)" : "none"};
    `;
  }

  function injectLanguageSelector() {
    const interval = setInterval(() => {
      const topbarRight = document.querySelector(".topbar-right");
      if (topbarRight) {
        clearInterval(interval);
        const wrap = document.createElement("div");
        wrap.className = "lang-selector";
        wrap.style.cssText = `
          display:flex; align-items:center; gap:2px;
          background:rgba(255,255,255,0.04);
          border:1px solid var(--border);
          border-radius:6px; padding:3px; margin-right:8px;
        `;
        const btnES = document.createElement("button");
        btnES.id = "lang-btn-es";
        btnES.textContent = "ES";
        btnES.style.cssText = getSelectorBtnStyle(activeLang === "es");
        btnES.onclick = () => setLanguage("es");

        const btnEN = document.createElement("button");
        btnEN.id = "lang-btn-en";
        btnEN.textContent = "EN";
        btnEN.style.cssText = getSelectorBtnStyle(activeLang === "en");
        btnEN.onclick = () => setLanguage("en");

        wrap.appendChild(btnES);
        wrap.appendChild(btnEN);
        topbarRight.insertBefore(wrap, topbarRight.firstChild);
      }
    }, 100);
  }

  function updateSelectorStyles() {
    const btnES = document.getElementById("lang-btn-es");
    const btnEN = document.getElementById("lang-btn-en");
    if (btnES) btnES.style.cssText = getSelectorBtnStyle(activeLang === "es");
    if (btnEN) btnEN.style.cssText = getSelectorBtnStyle(activeLang === "en");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // setLanguage — cambio de idioma principal
  // ─────────────────────────────────────────────────────────────────────────
  function setLanguage(lang) {
    if (lang === activeLang) return;
    activeLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    updateSelectorStyles();

    // 1. Traducir sidebar, topbar, modal
    translateStaticChrome();

    // 2. Traducir breadcrumb
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) {
      const activeNav = document.querySelector(".nav-item.active");
      if (activeNav) {
        const pageId = activeNav.dataset.page;
        const PAGE_LABELS_ES = { dashboard:"Dashboard", perfil:"Perfil Autlán", escenarios:"Escenarios & Inputs", fx:"Tipo de Cambio", oro:"Precio del Oro", gas:"Gas Natural", tasa:"Tasa de Interés", manganeso:"Manganeso", secundarios:"Riesgos Secundarios", estrategia:"Estrategia Óptima", docs:"Documentación" };
        const PAGE_LABELS_EN = { dashboard:"Dashboard", perfil:"Autlán Profile", escenarios:"Scenarios & Inputs", fx:"Exchange Rate", oro:"Gold Price", gas:"Natural Gas", tasa:"Interest Rate", manganeso:"Manganese", secundarios:"Secondary Risks", estrategia:"Optimal Strategy", docs:"Documentation" };
        breadcrumb.textContent = lang === "en" ? (PAGE_LABELS_EN[pageId] || pageId) : (PAGE_LABELS_ES[pageId] || pageId);
      }
    }

    // 3. Translate page headers (static in HTML)
    const pageHeaderMap = {
      "dashboard": { es: "Dashboard ejecutivo", en: "Executive Dashboard" },
      "perfil":    { es: "Perfil Autlán",        en: "Autlán Profile" },
      "escenarios":{ es: "Escenarios & Inputs",  en: "Scenarios & Inputs" },
      "fx":        { es: "Riesgo Tipo de Cambio",en: "Exchange Rate Risk" },
      "oro":       { es: "Riesgo Precio del Oro", en: "Gold Price Risk" },
      "gas":       { es: "Riesgo Gas Natural",   en: "Natural Gas Risk" },
      "tasa":      { es: "Riesgo Tasa de Interés", en: "Interest Rate Risk" },
      "manganeso": { es: "Riesgo Precio Manganeso", en: "Manganese Price Risk" },
      "secundarios":{ es: "Riesgos Secundarios", en: "Secondary Risks" },
      "estrategia":{ es: "Estrategia Óptima de Cobertura", en: "Optimal Hedging Strategy" },
      "docs":      { es: "Documentación del Modelo", en: "Model Documentation" },
    };
    const subHeaderMap = {
      "dashboard": { es: "Estado de riesgo y cobertura en tiempo real · Autlán Q1 2026", en: "Real-time risk and hedging status · Autlán Q1 2026" },
      "perfil":    { es: "Datos financieros auditados · XBRL 1T26 BMV", en: "Audited Financial Data · XBRL 1Q26 BMV" },
      "escenarios":{ es: "Variables macro · Ajusta los supuestos — alimenta todas las páginas", en: "Macro Variables · Adjust assumptions — feeds all pages" },
      "fx":        { es: "USD / MXN · Exposición, coberturas y payoffs", en: "USD / MXN · Exposure, hedging and payoffs" },
      "oro":       { es: "Metallorum · Sin cobertura activa · Precio en máximos históricos", en: "Metallorum · No active hedging · Price at historic highs" },
      "gas":       { es: "Costo operativo · Sin cobertura activa · Henry Hub", en: "Operating cost · No active hedging · Henry Hub" },
      "tasa":      { es: "TIIE · SOFR · Mark-to-market del collar existente", en: "TIIE · SOFR · Mark-to-market of existing collar" },
      "manganeso": { es: "Commodity principal · Mercado OTC limitado · Alternativas de cobertura", en: "Primary Commodity · Limited OTC Market · Hedging Alternatives" },
      "secundarios":{ es: "Contraparte · Base · Liquidez · Regulatorio · Operativo", en: "Counterparty · Basis · Liquidity · Regulatory · Operational" },
      "estrategia":{ es: "Portafolio recomendado · Política 60% · P&L por escenario", en: "Recommended Portfolio · 60% Policy · P&L by Scenario" },
      "docs":      { es: "Cómo funciona cada página, modelo y cálculo", en: "How each page, model, and calculation works" },
    };

    document.querySelectorAll(".page").forEach(page => {
      const id = page.id.replace("page-", "");
      const titleEl = page.querySelector(".page-title");
      const subEl   = page.querySelector(".page-sub");
      if (titleEl && pageHeaderMap[id]) titleEl.textContent = pageHeaderMap[id][lang];
      if (subEl   && subHeaderMap[id])  subEl.textContent   = subHeaderMap[id][lang];
    });

    // 4. Re-renderizar la página activa (lo más importante)
    const activeNav = document.querySelector(".nav-item.active");
    if (activeNav) {
      const pageId = activeNav.dataset.page;
      const fn = PAGE_RENDER_FN[pageId];
      if (fn) {
        setTimeout(fn, 0); // Async para no bloquear UI
      }
    }

    // 5. Forzar re-render de charts emitiendo calc:update
    setTimeout(() => {
      if (window.Scenarios) {
        const cache = Scenarios.getCache();
        if (cache && cache.actual) {
          Scenarios.emit("calc:update", cache);
        }
      }
    }, 50);

    // Toast
    if (window.showToast) {
      const msg = lang === "es" ? "Idioma: Español" : "Language: English";
      showToast(msg, "success");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    initCanvasInterceptor();
    injectLanguageSelector();
    document.documentElement.lang = activeLang;

    if (activeLang === "en") {
      setTimeout(() => {
        translateStaticChrome();
        // Also translate page headers
        const fakeSetLang = activeLang;
        activeLang = "es";
        activeLang = fakeSetLang;
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav) {
          const fn = PAGE_RENDER_FN[activeNav.dataset.page];
          if (fn) fn();
        }
      }, 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    t,
    getLocale: () => activeLang,
    setLanguage,
  };

})();
