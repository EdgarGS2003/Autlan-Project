/**
 * data.js — Compañía Minera Autlán, S.A.B. de C.V.
 * Base de datos precargada desde XBRLs auditados BMV
 * Fuentes: XBRL 4T25 (31-dic-2025) y XBRL 1T26 (31-mar-2026)
 *          + Key Points Junta may-2026
 *
 * Convención de moneda: USD miles (000s) salvo indicación
 * Flag "source": "XBRL_4T25" | "XBRL_1T26" | "CALC" | "ASSUMPTION" | "JUNTA_MAY26"
 * Flag "audited": true = dato auditado, no editar sin justificación
 */

const AUTLAN = {

  // ─────────────────────────────────────────────
  // 1. METADATOS DE EMPRESA
  // ─────────────────────────────────────────────
  meta: {
    nombre:    "Compañía Minera Autlán, S.A.B. de C.V.",
    ticker:    "AUTLAN B",
    bolsa:     "BMV",
    pais:      "México",
    sector:    "Minería / Ferroaleaciones",
    monedaBase:"USD",
    ultimoXBRL:"2026-03-31",
    ratings: {
      hrRatings: { calificacion: "A-",      perspectiva: "Negativa", fuente: "HR Ratings Dic-2025" },
      fitch:     { calificacion: "BBB+/mex", perspectiva: "Negativa", fuente: "Fitch 2025"          },
      pcrVerum:  { calificacion: "A-/M",     perspectiva: "Negativa", fuente: "PCR Verum 2025"      },
    },
    dscr_proyectado: { valor: 0.6, periodo: "2026-2028", fuente: "HR Ratings Dic-2025", audited: true },
  },

  // ─────────────────────────────────────────────
  // 2. ESTADO DE RESULTADOS
  // ─────────────────────────────────────────────
  resultados: {
    // Anual 2025 — fuente XBRL 4T25
    anual2025: {
      ingresos:          { valor: 322746, source: "XBRL_4T25", audited: true },
      costoVentas:       { valor: 271309, source: "XBRL_4T25", audited: true },
      utilidadBruta:     { valor:  51437, source: "XBRL_4T25", audited: true },
      gastosVenta:       { valor:  15912, source: "XBRL_4T25", audited: true },
      gastosAdmin:       { valor:  37714, source: "XBRL_4T25", audited: true },
      otrosGastos:       { valor:   1905, source: "XBRL_4T25", audited: true },
      utilidadOperacion: { valor:  -4094, source: "XBRL_4T25", audited: true },
      ingresosFinancieros:{ valor:  2822, source: "XBRL_4T25", audited: true },
      gastosFinancieros:  { valor: 42493, source: "XBRL_4T25", audited: true },
      perdidaAnteImpuestos:{ valor:-43765,source: "XBRL_4T25", audited: true },
      impuestos:          { valor: -5992, source: "XBRL_4T25", audited: true },
      perdidaNeta:        { valor:-37773, source: "XBRL_4T25", audited: true },
      // Métricas derivadas
      margenBruto:       { valor: 15.9,  source: "CALC", audited: false },
      ebitda:            { valor: 31470, source: "CALC", audited: false }, // utilidad op + D&A (35,564)
      margenEbitda:      { valor:  9.7,  source: "CALC", audited: false },
      depreciacion:      { valor: 35564, source: "XBRL_4T25", audited: true },
    },
    // 1T26 — fuente XBRL 1T26 + confirmado en junta may-2026
    t1_2026: {
      ingresos:           { valor:  98386, source: "XBRL_1T26", audited: true },
      costoVentas:        { valor:  83463, source: "XBRL_1T26", audited: true },
      utilidadBruta:      { valor:  14923, source: "XBRL_1T26", audited: true },
      gastosVenta:        { valor:   5905, source: "XBRL_1T26", audited: true },
      gastosAdmin:        { valor:  10656, source: "XBRL_1T26", audited: true },
      otrosGastos:        { valor:  -1808, source: "XBRL_1T26", audited: true },
      utilidadOperacion:  { valor:    170, source: "XBRL_1T26", audited: true,
                            nota: "Primer trimestre positivo en más de un año — confirmado junta may-2026" },
      ingresosFinancieros:{ valor:   1486, source: "XBRL_1T26", audited: true },
      gastosFinancieros:  { valor:   7318, source: "XBRL_1T26", audited: true },
      perdidaAnteImpuestos:{ valor: -5662, source: "XBRL_1T26", audited: true },
      impuestos:          { valor:    314, source: "XBRL_1T26", audited: true },
      perdidaNeta:        { valor:  -5976, source: "XBRL_1T26", audited: true,
                            nota: "Arrastrada por costo financiero $7.3 MD — junta may-2026" },
      // UAFIRDA confirmada en junta (puede diferir de EBITDA IFRS por ajustes)
      uafirda:            { valor:  10800, source: "JUNTA_MAY26", audited: false,
                            nota: "+44% vs 1T25, margen 11% — dato confirmado en junta may-2026" },
      margenUafirda:      { valor:   11.0, source: "JUNTA_MAY26", audited: false },
      // vs 1T25
      ingresos_1T25:      { valor:  80135, source: "XBRL_1T26", audited: true },
      variacion_yoy:      { valor:  22.8,  source: "CALC",      audited: false },
      uafirda_1T25:       { valor:   7500, source: "JUNTA_MAY26", audited: false,
                            nota: "Implícito: +44% YoY desde $7.5M aprox" },
    },
    // 1T25 para referencia
    t1_2025: {
      ingresos:    { valor: 80135, source: "XBRL_1T26", audited: true },
      perdidaNeta: { valor: -7632, source: "XBRL_1T26", audited: true },
    },
    // Run-rate 1T26 × 4 — para proyecciones (no auditado)
    runRate2026: {
      ingresos:       { valor: 393544, source: "CALC", audited: false, nota: "1T26 × 4" },
      uafirda:        { valor:  43200, source: "CALC", audited: false, nota: "UAFIRDA 1T26 × 4" },
      gastoFinanciero:{ valor:  29272, source: "CALC", audited: false, nota: "Gasto fin 1T26 × 4" },
    },
  },

  // ─────────────────────────────────────────────
  // 3. BALANCE GENERAL
  // ─────────────────────────────────────────────
  balance: {
    fecha: "2026-03-31",
    activos: {
      efectivo:             { valor:  21801, source: "XBRL_1T26", audited: true,
                              nota: "Piso de liquidez a monitorear — junta may-2026" },
      cuentasCobrar:        { valor:  52387, source: "XBRL_1T26", audited: true },
      inventarios:          { valor:  88033, source: "XBRL_1T26", audited: true },
      otrosCirculantes:     { valor:  55390, source: "XBRL_1T26", audited: true },
      totalCirculante:      { valor: 217611, source: "XBRL_1T26", audited: true },
      propiedadPlantaEquipo:{ valor: 235302, source: "XBRL_1T26", audited: true },
      creditoMercantil:     { valor:  21868, source: "XBRL_1T26", audited: true },
      intangibles:          { valor:  57840, source: "XBRL_1T26", audited: true },
      totalNoCirculante:    { valor: 410253, source: "XBRL_1T26", audited: true },
      totalActivos:         { valor: 627864, source: "XBRL_1T26", audited: true },
    },
    pasivos: {
      proveedoresCortoPlazo:{ valor: 118997, source: "XBRL_1T26", audited: true },
      otrosPasivosCp:       { valor:  17705, source: "XBRL_1T26", audited: true },
      arrendamientosCp:     { valor:   3099, source: "XBRL_1T26", audited: true },
      totalPasivosCirculantes:{ valor:158053,source: "XBRL_1T26", audited: true },
      deudalargoPlazo:      { valor: 168227, source: "XBRL_1T26", audited: true },
      arrendamientosLp:     { valor:   1604, source: "XBRL_1T26", audited: true },
      provisionesLp:        { valor:  30099, source: "XBRL_1T26", audited: true },
      impuestosDiferidosLp: { valor:  37610, source: "XBRL_1T26", audited: true },
      totalPasivosLargoPlazo:{ valor:237540, source: "XBRL_1T26", audited: true },
      totalPasivos:         { valor: 395593, source: "XBRL_1T26", audited: true },
    },
    capital: {
      capitalSocial:        { valor:  72805, source: "XBRL_1T26", audited: true },
      primaEmision:         { valor:  32993, source: "XBRL_1T26", audited: true },
      utilidadesAcumuladas: { valor: 137974, source: "XBRL_1T26", audited: true },
      oriAcumulados:        { valor: -15674, source: "XBRL_1T26", audited: true },
      totalControladora:    { valor: 228098, source: "XBRL_1T26", audited: true,
                              nota: "Capital contable $228.1 MD — junta may-2026" },
      participacionNc:      { valor:   4173, source: "XBRL_1T26", audited: true },
      totalCapital:         { valor: 232271, source: "XBRL_1T26", audited: true },
    },
    metricas: {
      leverage:    { valor: 63.0, source: "CALC", audited: false, nota: "Deuda total / Activos totales %" },
      deudaTotal:  { valor: 190600, source: "JUNTA_MAY26", audited: false,
                     nota: "Deuda total confirmada en junta: $190.6 MD (-$7.2 MD vs dic-2025)" },
      deudaNeta:   { valor: 168799, source: "CALC", audited: false,
                     nota: "Deuda total $190.6M - Efectivo $21.8M" },
      deudaUafirdaLTM: { valor: 4.4, source: "JUNTA_MAY26", audited: false,
                          nota: "~4.4x — nivel a vigilar vs covenants no revelados públicamente" },
      covenants:   { source: "PENDIENTE",
                     nota: "ABIERTO: Leverage máximo y cobertura de intereses mínima del crédito Santander no revelados" },
    },
  },

  // ─────────────────────────────────────────────
  // 4. ESTRUCTURA DE DEUDA DETALLADA
  // ─────────────────────────────────────────────
  deuda: {
    fecha: "2026-03-31",
    totalConfirmado: { valor: 190600, source: "JUNTA_MAY26", audited: false,
                       nota: "Confirmado en junta may-2026. XBRL registra 185,932 (diferencia por arrendamientos / ajuste)" },
    creditos: [
      {
        id: 1,
        acreedor:    "Banco Santander México",
        tipo:        "Banca comercial — crédito principal sindicado",
        extranjero:  false,
        fechaFirma:  "2024-11-05",
        vencimiento: "2031-10-05",
        tasa:        "SOFR + 6.00%",
        tasaBase:    "SOFR",
        spread:      6.00,
        moneda:      "USD",
        saldoTotal:  { valor: 119470, source: "XBRL_1T26", audited: true },
        saldoJunta:  { valor: 120000, source: "JUNTA_MAY26", audited: false,
                       nota: "~$120 MD confirmado en junta may-2026" },
        vencimientos:{ cp: 1079, a1: 3237, a2: 15184, a3: 21632, a4: 28184, a5mas: 50234 },
        notas: "Crédito sindicado principal. Mayor exposición SOFR. Covenants no revelados.",
      },
      {
        id: 2,
        acreedor:    "Banco Santander México",
        tipo:        "Banca comercial — tramo adicional",
        extranjero:  false,
        fechaFirma:  "2024-11-05",
        vencimiento: "2027-11-05",
        tasa:        "SOFR + 5.50%",
        tasaBase:    "SOFR",
        spread:      5.50,
        moneda:      "USD",
        saldoTotal:  { valor: 16009, source: "XBRL_1T26", audited: true },
        vencimientos:{ cp: 0, a1: 0, a2: 16009, a3: 0, a4: 0, a5mas: 0 },
        notas: "Tramo adicional Santander SOFR+5.5%, vence 2027 — confirmado junta may-2026.",
      },
      {
        id: 3,
        acreedor:    "Banco Santander México",
        tipo:        "Banca comercial — tramo MXN",
        extranjero:  false,
        fechaFirma:  "2024-11-05",
        vencimiento: "2027-11-05",
        tasa:        "TIIE 28 + 5.50%",
        tasaBase:    "TIIE28",
        spread:      5.50,
        moneda:      "MXN",
        saldoTotal:  { valor: 14887, source: "XBRL_1T26", audited: true },
        vencimientos:{ cp: 0, a1: 0, a2: 14887, a3: 0, a4: 0, a5mas: 0 },
      },
      {
        id: 4,
        acreedor:    "BanBajío / NAFIN",
        tipo:        "Banca desarrollo",
        extranjero:  false,
        fechaFirma:  "2016-11-06",
        vencimiento: "2031-11-23",
        tasa:        "TIIE 28 + 4.00%",
        tasaBase:    "TIIE28",
        spread:      4.00,
        moneda:      "MXN",
        saldoTotal:  { valor: 11392, source: "XBRL_1T26", audited: true },
        saldoJunta:  { valor: 14000, source: "JUNTA_MAY26", audited: false,
                       nota: "~$14 MD equiv. confirmado en junta may-2026" },
        vencimientos:{ cp: 2680, a1: 0, a2: 2354, a3: 2378, a4: 2476, a5mas: 4504 },
        notas: "Subsidiaria CEM. Cubierto parcialmente con collar TIIE. Vence 2031.",
      },
      {
        id: 5,
        acreedor:    "Fideicomiso Fomento Minero",
        tipo:        "Banca desarrollo",
        extranjero:  false,
        fechaFirma:  "2025-12-04",
        vencimiento: "2030-12-04",
        tasa:        "TIIE + 4.6464%",
        tasaBase:    "TIIE28",
        spread:      4.65,
        moneda:      "MXN",
        saldoTotal:  { valor: 3468, source: "XBRL_1T26", audited: true },
        vencimientos:{ cp: 0, a1: 289, a2: 1156, a3: 1156, a4: 1156, a5mas: 867 },
      },
      {
        id: 6,
        acreedor:    "Banco Santander (España)",
        tipo:        "Banca internacional — EMD",
        extranjero:  true,
        fechaFirma:  "2025-05-16",
        vencimiento: "2028-05-31",
        tasa:        "EURIBOR + 0.40%",
        tasaBase:    "EURIBOR",
        spread:      0.40,
        moneda:      "EUR",
        saldoTotal:  { valor: 3401, source: "XBRL_1T26", audited: true },
        notas: "Deuda EMD (España). Varios bancos en euros, tasas fijas bajas — junta may-2026.",
      },
      {
        id: 7,
        acreedor:    "Caterpillar Crédito",
        tipo:        "Arrendamiento financiero",
        extranjero:  false,
        fechaFirma:  "2025-01-01",
        vencimiento: "2028-12-01",
        tasa:        "7.90% Fija",
        tasaBase:    "FIJA",
        spread:      0,
        tasaFija:    7.90,
        moneda:      "USD",
        saldoTotal:  { valor: 2000, source: "XBRL_1T26", audited: true },
      },
    ],
    resumenTasa: {
      sofr_usd:    { saldo: 135479, pct: 72.9, source: "CALC" },
      tiie_mxn:    { saldo:  29747, pct: 16.0, source: "CALC" },
      euribor_eur: { saldo:   3401, pct:  1.8, source: "CALC" },
      fija:        { saldo:   2000, pct:  1.1, source: "CALC" },
      arrendamientos:{ saldo: 4703, pct:  2.5, source: "CALC" },
      total:       { saldo: 185932, source: "CALC" },
    },
    certificadosBursatiles: {
      programa:    { valor: 3500000, moneda: "MXN miles", nota: "Programa renovado hasta $3,500 MP" },
      emisionesActivas: { valor: 0, nota: "Sin certificados bursátiles vigentes al 1T26 — junta may-2026" },
    },
  },

  // ─────────────────────────────────────────────
  // 5. INSTRUMENTOS DERIVADOS VIGENTES
  // ─────────────────────────────────────────────
  derivadosVigentes: {
    fecha: "2026-03-31",
    fuente: "XBRL_1T26",

    // Gobernanza — tres niveles (confirmado junta may-2026)
    gobernanza: {
      nivel1: { nombre: "Consejo de Administración", rol: "Política general de coberturas" },
      nivel2: { nombre: "Comité de Auditoría", rol: "Supervisión, revisión trimestral" },
      nivel3: { nombre: "Comité interno ejecutivo", rol: "Decide tipo de cobertura y timing, revisa mensualmente" },
      valuador: { nombre: "Irvin", rol: "Tercero independiente — entrega valuaciones trimestrales" },
      modeloPropietario: false,
      nota: "La empresa mide riesgos internamente pero no tiene modelo propietario — junta may-2026",
    },

    // Filosofía de cobertura (junta may-2026)
    filosofia: {
      prioridad:      "Preservación de liquidez",
      instrumentos:   "Preferencia por collares sin costo (zero-cost) — no desembolsan prima, aceptan limitar upside",
      limiteMaximo:   "Cubren hasta 60% de ingresos presupuestados en moneda extranjera",
      decisiones:     "Muy dependientes de condiciones de mercado para decidir cuándo y cuánto cubrir",
      collarTIIE:     "TIIE actualmente ~7%, por debajo del piso del collar (8.75%) — collar de tasa sin beneficio actual",
    },

    // COLLAR DE TASA DE INTERÉS — TIIE
    collarTasa: {
      id:           "IFD-TASA-01",
      tipo:         "Collar de tasa de interés (Cap + Floor)",
      subyacente:   "TIIEF (TIIE 28 días)",
      entidad:      "Compañía de Energía Mexicana (CEM) — subsidiaria",
      fechaContrato:"2025-02-07",
      vencimiento:  "2028-06-23",
      nocionalMXN:  { valor: 157584, source: "XBRL_4T25", audited: true },
      nocionalPct:  50,
      cap:          11.00,
      floor:        8.75,
      tiieActual:   6.74,
      estadoActual: "SIN_EJERCICIO",
      nota:         "TIIE ~7% < floor 8.75% → collar sin beneficio actual — confirmado junta may-2026",
      mtm: {
        minusvalia1T26: { valor: 31.5, moneda: "USD", source: "XBRL_1T26", audited: true },
        perdidaAcum:    { valor: 45.6, moneda: "USD", source: "XBRL_4T25", audited: true,
                          nota: "Pérdida acumulada desde contratación (11 cupones ejercidos al 4T25)" },
      },
      costoEfectivo: {
        tasa:  6.74 + 4.00,
        nota:  "Pagando tasa de mercado completa sin beneficio del cap porque TIIE < floor",
      },
      vencimientosMensuales: "Día 23 de cada mes",
      audited: true,
    },

    // COLLARES USD/MXN — 4 collares vigentes al 1T26
    // Nocional total: $19.8 MD — rangos $17.30–$18.2761 — vencen jun-dic 2026
    collarsFX: [
      {
        id:          "IFD-FX-01",
        tipo:        "Collar de opciones USD/MXN",
        fechaContrato:"2026-02-04",
        vencimiento: "2026-06-30",
        nocionalUSD: { valor: 1000, moneda: "USD", source: "XBRL_1T26", audited: true },
        floorUSD:    17.30,
        capUSD:      18.2761,
        nota:        "Protege apreciación del peso (floor $17.30). Con TC actual ~$17.20 cerca del floor.",
        ejercidos:   0,
        audited:     true,
      },
      {
        id:          "IFD-FX-02",
        tipo:        "Collar de opciones USD/MXN",
        fechaContrato:"2026-03-04",
        vencimiento: "2026-06-30",
        nocionalUSD: { valor: 1000, moneda: "USD", source: "XBRL_1T26", audited: true },
        floorUSD:    17.40,
        capUSD:      18.30,
        ejercidos:   0,
        audited:     true,
      },
      {
        id:          "IFD-FX-03",
        tipo:        "Collar de opciones USD/MXN",
        fechaContrato:"2026-03-13",
        vencimiento: "2026-06-30",
        nocionalUSD: { valor: 1000, moneda: "USD", source: "XBRL_1T26", audited: true },
        floorUSD:    17.60,
        capUSD:      18.40,
        ejercidos:   0,
        audited:     true,
      },
      {
        id:          "IFD-FX-04",
        tipo:        "Collar de opciones USD/MXN",
        fechaContrato:"2026-03-20",
        vencimiento: "2026-06-30",
        nocionalUSD: { valor: 1000, moneda: "USD", source: "XBRL_1T26", audited: true },
        floorUSD:    17.70,
        capUSD:      18.2761,
        ejercidos:   0,
        audited:     true,
      },
    ],

    exposicionVsCobertura: {
      // FX
      ingresosFX_anualizado:  { valor: 393544, nota: "1T26 × 4, proxy ingresos anualizados USD" },
      coberturaFX_nocional:   { valor:  12000, nota: "4 collares × USD 1M/mes × 3 meses" },
      pctCubierto_FX:         { valor:    3.0, nota: "12M / 393M — CRÍTICO: muy por debajo del 60% permitido" },
      limitePolítica_FX:      { valor:   60.0, nota: "Política interna Autlán — junta may-2026" },
      gapCobertura_FX:        { valor:   57.0, nota: "% exposición adicional que se puede cubrir" },
      // Tasa
      deudaVariableTotal:     { valor: 165226, nota: "SOFR+TIIE total USD equiv (créditos 1-5)" },
      coberturaTasa_nocional: { valor:   8700, nota: "Collar TIIE (MXN 157.6M ÷ TC 18.1 aprox)" },
      pctCubierto_tasa:       { valor:    5.3, nota: "% de deuda variable cubierta con collar TIIE" },
      // Oro — sin cobertura confirmado
      coberturaOro:           { valor:      0, nota: "SIN COBERTURA — confirmado junta may-2026. Precio en máximos USD 3,000+/oz" },
      // Gas — sin cobertura confirmado
      coberturaGas:           { valor:      0, nota: "SIN COBERTURA — confirmado junta may-2026" },
    },
  },

  // ─────────────────────────────────────────────
  // 6. SEGMENTOS Y PRODUCCIÓN
  // ─────────────────────────────────────────────
  segmentos: {
    ferroaleaciones: {
      ingresos2025:    { valor: 289000, source: "XBRL_4T25", audited: true },
      pctTotal:        { valor: 89.6,   source: "CALC" },
      monedaVentas:    "USD (exportaciones) + MXN (doméstico)",
      mercados:        { mexico: 30, eeuu: 45, europa: 20, otros: 5 },
      volumenYoy:      { valor: 7.0, nota: "Crecimiento volumen 2025 vs 2024 %" },
      precioMnActual:  { valor: 1309, moneda: "USD/MT", fecha: "Q1 2026", source: "IMARC" },
      // Ventaja competitiva estructural — confirmada junta may-2026
      aranceles232: {
        exento:       true,
        mercados:     ["EUA", "Europa"],
        nota:         "Exento de aranceles Sección 232 en EUA y Europa — ventaja competitiva estructural vs competidores asiáticos",
        implicacion:  "Ingresos 100% USD protegidos de disrupciones arancelarias. Empresa confía en renegociación favorable T-MEC.",
        riesgo:       "Supuesto T-MEC favorable a estresar en modelo — junta may-2026",
      },
    },
    emd: {
      ingresos2025:    { valor: 28000, source: "XBRL_4T25", audited: false, nota: "~9% estimado" },
      pctTotal:        { valor: 8.7,  source: "CALC" },
      monedaVentas:    "USD",
      costos:          "EUR (País Vasco)",
      mercados:        { global: 100 },
      desempenio:      { nota: "Mejor nivel de UAFIRDA desde su adquisición — junta may-2026" },
    },
    metallorum: {
      // Oro — segmento estratégico, reactivado en 2025
      ingresos2025:    { valor: 5000,  source: "XBRL_4T25", audited: false, nota: "Inicial, < 2%" },
      pctTotal:        { valor: 1.5,   source: "CALC" },
      monedaVentas:    "USD",
      // 1T26 — datos confirmados en junta may-2026
      ozVendidas1T26:  { valor: 2400,  source: "JUNTA_MAY26", audited: false,
                         nota: "~2.4 kOz vendidas en 1T26. kOz = miles de onzas troy (oz troy estándar)." },
      // Metas de producción — junta may-2026
      meta2026:        { valor: 20000, source: "JUNTA_MAY26", audited: false,
                         nota: "Meta ~20,000 oz para el año completo 2026" },
      metaLargoPlazo:  { valor: 100000, source: "JUNTA_MAY26", audited: false,
                         nota: "Objetivo +100,000 oz/año en años siguientes. Requiere capex no revelado." },
      coberturaOro:    { valor: 0, nota: "Sin coberturas de precio de oro actualmente — junta may-2026" },
      // Certificación y escalamiento
      certificacionSRK:{ estado: "En proceso",
                         nota:   "SRK en proceso — proyecta triplicar onzas vendibles una vez certificado" },
      // Preguntas abiertas del modelo — junta may-2026
      aisc:            { source: "PENDIENTE",
                         nota:   "ABIERTO: Costo cash por onza (AISC) no revelado públicamente" },
      precioRealizadoNeto: { source: "PENDIENTE",
                              nota: "ABIERTO: Precio realizado neto por oz y unidad exacta de las kOz reportadas" },
      capexEscalamiento:  { source: "PENDIENTE",
                             nota:  "ABIERTO: Capex requerido para escalar a 20,000 oz y luego a 100,000 oz/año" },
      precioOroActual:  { valor: 4513, moneda: "USD/oz", nota: "Precio de mercado may-2026 (aprox)" },
      meta2028:         { valor: 15.0, nota: "Target % de ingresos totales" },
    },
    energia: {
      // Actualizado con datos confirmados junta may-2026
      ahorro1T26:      { valor: 1400,  moneda: "USD trimestral", source: "JUNTA_MAY26", audited: false,
                         nota:  "Ahorro $1.4 MD en 1T26 — hidroeléctrica Atexcaco" },
      ahorro2025:      { valor: 2800,  moneda: "USD trimestral", source: "XBRL_4T25" },
      autosuficiencia: { valor: 26,    nota: "~26% del consumo energético total cubierto con generación propia — junta may-2026" },
      energiaLimpia:   { valor: 90,    nota: "90% de energía de fuentes limpias — junta may-2026" },
      fuentes:         ["Hidroeléctrica Atexcaco", "Solar", "Cogeneración"],
    },
  },

  // ─────────────────────────────────────────────
  // 7. VARIABLES DE MERCADO — PUNTO DE PARTIDA
  // ─────────────────────────────────────────────
  mercado: {
    fecha: "2026-05-14",
    usdmxn:     { valor: 17.20, source: "TradingEconomics May-2026" },
    // TC histórico para contexto del modelo
    tcPromedio2025: { valor: 17.00, source: "JUNTA_MAY26", nota: "Promedio USD/MXN 2025" },
    tc1T26:         { valor: 18.07, source: "JUNTA_MAY26", nota: "Promedio 1T26 — ya reflejado en mejora de márgenes" },
    banxico:    { valor:  6.75, source: "Banxico Q1-2026" },
    tiie28:     { valor:  6.74, source: "Banxico Mar-2026" },
    sofr1m:     { valor:  4.30, source: "CALC/Estimado May-2026", audited: false },
    inflacion:  { valor:  4.45, source: "INEGI Abr-2026" },
    dxy:        { valor: 99.0,  source: "Bloomberg Abr-2026" },
    precioOro:  { valor: 4513.0,  moneda: "USD/oz", source: "Mercado May-2026" },
    precioMn:   { valor: 1309,  moneda: "USD/MT", source: "IMARC Q1-2026" },
    precioGas:  { valor:  3.20, moneda: "USD/MMBtu", source: "Henry Hub estimado" },
    euribor6m:  { valor:  2.40, source: "BCE estimado May-2026" },
  },

  // ─────────────────────────────────────────────
  // 8. ESCENARIOS MACRO — PRE-CARGADOS Y EDITABLES
  // ─────────────────────────────────────────────
  escenarios: {
    variables: {
      usdmxn: {
        label:  "USD / MXN",
        unidad: "pesos por dólar",
        base:     { valor: 18.0,  narrativa: "TC ~$18 consistente con promedio 1T26 ($18.07). Peso estable post-USMCA. Riesgo soberano por baja de calificadoras puede presionar peso adicional." },
        optimista:{ valor: 19.5,  narrativa: "Depreciación moderada del peso. Fed mantiene tasas altas; DXY 103+. Favorable para ingresos Autlán — estructura 100% USD ingresos / 60% costos en pesos." },
        adverso:  { valor: 16.0,  narrativa: "Apreciación fuerte del peso. Collar FX actual (floor $17.30) protege parcialmente. EBITDA comprime ~8-12%. Collar se ejerce bajo $17.30." },
        actual:   17.20,
        min:      14.0,
        max:      23.0,
        sensibilidad: "Cada $1 de apreciación del peso reduce EBITDA ~USD 18M sobre base ingresos USD 322M (estructura 100% USD ingresos / ~60% costos MXN)",
      },
      tiie28: {
        label:  "TIIE 28 días",
        unidad: "% anual",
        base:     { valor: 6.95,  narrativa: "Banxico completa 1-2 recortes adicionales. Tasa terminal ~6.50% fin de año. Inflación dentro de banda. Collar TIIE sigue sin beneficio (floor 8.75%)." },
        optimista:{ valor: 6.50,  narrativa: "3-4 recortes adicionales. Inflación converge a 3.5%. Crecimiento apoya expansión monetaria. Deuda TIIE más barata." },
        adverso:  { valor: 7.75,  narrativa: "Inflación rebota >5%. Banxico pausa o sube. Costo deuda TIIE de Autlán aumenta ~USD 1-2M por 100bps. Collar TIIE aún inútil (floor 8.75% lejano)." },
        actual:   6.74,
        min:      5.0,
        max:      12.0,
        sensibilidad: "Cada 100bps de alza en TIIE incrementa costo financiero Autlán ~USD 440K (sobre MXN 29.7M deuda TIIE equiv.)",
      },
      sofr1m: {
        label:  "SOFR 1 mes",
        unidad: "% anual",
        base:     { valor: 4.10,  narrativa: "Fed realiza 1-2 recortes en 2026. Economía USA moderándose sin recesión." },
        optimista:{ valor: 3.50,  narrativa: "Fed recorta agresivamente ante desaceleración USA. Reduce costo deuda principal Autlán (~USD 135M a SOFR+6%)." },
        adverso:  { valor: 4.80,  narrativa: "Fed mantiene tasas altas por inflación persistente. Costo deuda SOFR de Autlán (USD 135M) aumenta ~USD 1.35M por 100bps." },
        actual:   4.30,
        min:      2.0,
        max:      7.0,
        sensibilidad: "Cada 100bps de alza en SOFR incrementa gasto financiero ~USD 1.35M (sobre USD 135M deuda SOFR)",
      },
      precioOro: {
        label:  "Precio del Oro",
        unidad: "USD / oz",
        base:     { valor: 2900,  narrativa: "Corrección moderada desde máximos. Demanda banco central sostiene piso. DXY moderado. Metallorum: meta 20,000 oz 2026 afectada moderadamente." },
        optimista:{ valor: 3300,  narrativa: "Risk-off global. Tensiones geopolíticas. Bancos centrales aceleran compras. USD débil. Metallorum sin cobertura captura upside total." },
        adverso:  { valor: 2400,  narrativa: "Fortaleza USD (DXY >105). Fed hawkish. Salida de ETFs. Metallorum sin cobertura impactado ~USD 12M sobre meta 20K oz." },
        actual:   4513,
        min:      1800,
        max:      4000,
        sensibilidad: "Cada USD 100/oz impacta ingresos Metallorum ~USD 2M anualizados (base: meta 20,000 oz 2026 — junta may-2026)",
      },
      precioMn: {
        label:  "Precio Manganeso",
        unidad: "USD / MT",
        base:     { valor: 1300,  narrativa: "Recuperación frágil. China restocking moderado. India compensa caída China parcialmente." },
        optimista:{ valor: 1600,  narrativa: "China stimulus fuerte. Gabon ban cataliza (anticipo 2029). India acelera. Oferta australiana limitada." },
        adverso:  { valor:  900,  narrativa: "China demanda decepciona. Dumping asiático en México. Acero global contrae. Autlán: -USD 30-50M ingresos. Exención Sección 232 no protege vs precios bajos." },
        actual:   1309,
        min:       600,
        max:      2200,
        sensibilidad: "Cada USD 100/MT de caída en Mn impacta ingresos Autlán ~USD 5-8M (estimado ~55K MT ventas anuales ferroaleaciones)",
      },
      precioGas: {
        label:  "Precio Gas Natural",
        unidad: "USD / MMBtu",
        base:     { valor: 3.20,  narrativa: "Mercado equilibrado. Sin disrupciones mayores en oferta. CFE mantiene tarifas estables." },
        optimista:{ valor: 2.50,  narrativa: "Oferta USA aumenta. Invierno suave. Precios a mínimos. Reduce costo operativo Autlán." },
        adverso:  { valor: 5.00,  narrativa: "Tensiones Medio Oriente. Invierno frío. Alta demanda LNG Europa. Costo smelting sube USD 3-5M. Sin cobertura activa." },
        actual:   3.20,
        min:      1.5,
        max:      8.0,
        sensibilidad: "Cada USD 1/MMBtu de alza en gas incrementa costo operativo Autlán ~USD 2-3M (plantas de fundición intensivas en gas)",
      },
      volumenFerroaleaciones: {
        label:  "Volumen Ferroaleaciones",
        unidad: "% vs plan base",
        base:     { valor: 100,   narrativa: "Volumen alineado con guía 2026. Exportaciones USA sostenidas gracias a exención Sección 232. Doméstico +5%." },
        optimista:{ valor: 115,   narrativa: "Doméstico +12%. AHMSA partial restart. USA crece. Autlán gana share vs dumping asiático (ventaja 232)." },
        adverso:  { valor:  80,   narrativa: "Doméstico contrae -8%. Tariff shock general. Dumping asiático presiona. Autlán exporta más a menor margen." },
        actual:   100,
        min:      60,
        max:      130,
      },
    },
    resultadosBase: {
      ingresos_anual:    322746,
      costoFijo_anual:   200000,
      costoVariable_pct: 62.0,
      ebitda_anual:       31470,
      gastoFinanciero:    42493,
      capex_anual:        30000,
    },
  },

  // ─────────────────────────────────────────────
  // 9. POLÍTICA DE COBERTURA
  // ─────────────────────────────────────────────
  politicaCobertura: {
    fuente: "XBRL 1T26 + XBRL 4T25 + Junta may-2026",
    fx: {
      instrumentos:  ["Collares zero-cost (preferidos)", "Forwards", "Swaps", "Opciones"],
      limiteNocional:{ valor: 60, unidad: "% de ingresos presupuestados en USD", audited: true },
      horizonteMax:  { valor: 12, unidad: "meses", audited: true },
      objetivo:      "Cubrir riesgo de apreciación del peso vs USD",
      estadoActual:  "CRÍTICO: ~3% cubierto vs límite 60% — collares vencen jun-2026",
    },
    tasa: {
      instrumentos:  ["Swaps de tasa", "Opciones TIIE (caps/floors/collars)"],
      limiteNocional:{ valor: 50, unidad: "% del saldo de deuda variable (práctica observada)", audited: false },
      objetivo:      "Limitar exposición al alza en TIIE y SOFR",
      estadoActual:  "Collar TIIE activo pero sin beneficio (TIIE 7% < floor 8.75%)",
    },
    oro: {
      instrumentos:  ["Forwards OTC", "Costless collars (preferidos)"],
      limiteNocional:{ valor: 60, unidad: "% producción vendible", audited: false },
      objetivo:      "Proteger contra caída en precio del oro",
      estadoActual:  "SIN COBERTURA al 1T26 — confirmado junta may-2026",
      oportunidad:   "Precio en máximos USD 3,000+/oz — momento óptimo para contratar collar zero-cost",
    },
    gas: {
      instrumentos:  ["Forwards de precio"],
      limiteNocional:{ valor: 60, unidad: "% consumo presupuestado (estimado)", audited: false },
      objetivo:      "Fijar precio máximo de compra de gas natural",
      estadoActual:  "SIN COBERTURA al 1T26 — confirmado junta may-2026",
    },
    principios: [
      "Exclusivamente con fines de cobertura — no especulación",
      "Solo con contrapartes de alta calidad crediticia reconocida",
      "Principalmente mercados OTC / extrabursátiles",
      "Tratamiento contable: cobertura de flujo de efectivo (IFRS 9)",
      "Valuación trimestral por tercero independiente (Irvin) + verificación interna",
      "Prioridad absoluta: preservación de liquidez — junta may-2026",
    ],
  },

  // ─────────────────────────────────────────────
  // 10. KEY POINTS JUNTA MAY-2026
  // Información cualitativa y cuantitativa confirmada en junta
  // Source: "JUNTA_MAY26" — no auditada, sujeta a verificación con reporte oficial
  // ─────────────────────────────────────────────
  juntaMay2026: {
    fecha: "2026-05-25",

    // Financieros clave 1T26 — confirmados en junta
    financieros1T26: {
      ventasNetas:      { valor:  98400, moneda: "USD miles", nota: "+23% vs 1T25" },
      uafirda:          { valor:  10800, moneda: "USD miles", nota: "+44% vs 1T25, margen 11%" },
      utilidadOperativa:{ valor:    170, moneda: "USD miles", nota: "Primer trimestre positivo en más de un año" },
      perdidaNeta:      { valor:  -6200, moneda: "USD miles", nota: "Arrastrada por costo financiero $7.3 MD" },
      costoFinanciero:  { valor:   7300, moneda: "USD miles", nota: "Principal driver de pérdida neta" },
      caja:             { valor:  21800, moneda: "USD miles", nota: "Número a monitorear como piso de liquidez" },
      deuda:            { valor: 190600, moneda: "USD miles", nota: "-$7.2 MD vs diciembre 2025" },
      capitalContable:  { valor: 228100, moneda: "USD miles" },
    },

    // Riesgo cambiario — el central para el modelo
    riesgoCambiario: {
      estructuraFavorable: "Ingresos 100% USD, ~60% costos en pesos → peso depreciado favorece operativamente",
      impactoObservado:    "Peso depreciado de $17 (promedio 2025) a $18.07 (1T26) ya reflejado en mejora de márgenes",
      riesgoSoberano:      "Calificadoras bajaron calificación México → posible presión adicional al peso",
      tmec:                "Empresa confía en renegociación favorable del T-MEC — supuesto a estresar en el modelo",
      collarsFX:           "Collares actuales protegen apreciación del peso (floor $17.30) — posición correcta para el entorno actual",
    },

    // Proyectos de largo plazo — no modelables aún
    proyectosLargoPlazo: {
      manganEV: {
        nombre:      "ManganEV / HPMSM",
        descripcion: "Sulfato de manganeso alta pureza para baterías EV",
        estado:      "Fase de barrenación para Estudio de Pre-Factibilidad",
        capex:       "Sin definir públicamente",
        fechas:      "Sin definir públicamente",
        nota:        "No modelable aún — monitorear PFS",
      },
      metallorumEscalamiento: {
        nombre:      "Metallorum — escalamiento",
        descripcion: "Salto a 100,000 oz/año requiere capex no revelado",
        estado:      "Certificación SRK en proceso — proyecta triplicar onzas vendibles",
        capex:       "No revelado",
        hitos:       ["Certificación SRK", "20,000 oz 2026", "100,000 oz años siguientes"],
      },
    },

    // Preguntas que quedaron abiertas — para seguimiento
    preguntasAbiertas: [
      {
        id: 1,
        pregunta: "Covenants específicos del crédito Santander",
        detalle:  "Leverage máximo y cobertura de intereses mínima — no revelados públicamente",
        impacto:  "ALTO — determina margen de maniobra financiero real",
      },
      {
        id: 2,
        pregunta: "Costo cash por onza (AISC) en Metallorum",
        detalle:  "Sin dato público — necesario para calcular margen real de la operación de oro",
        impacto:  "MEDIO — afecta rentabilidad proyectada de Metallorum",
      },
      {
        id: 3,
        pregunta: "Unidad exacta de las kOz y precio realizado neto",
        detalle:  "Confirmar si kOz = miles de oz troy y cuál es el precio neto recibido",
        impacto:  "MEDIO — afecta calibración del modelo de ingresos oro",
      },
      {
        id: 4,
        pregunta: "Capex para escalar Metallorum a 20,000 oz y 100,000 oz",
        detalle:  "Sin revelar — necesario para modelar FCF y necesidades de financiamiento",
        impacto:  "ALTO — cambia tesis de valoración si capex es significativo",
      },
      {
        id: 5,
        pregunta: "Resultados del PFS de ManganEV y capex estimado de planta comercial",
        detalle:  "En fase de Pre-Factibilidad — sin datos públicos",
        impacto:  "BAJO en corto plazo, ALTO en largo plazo para la tesis EV",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 11. HELPER — ESTADO DE OVERRIDES DEL USUARIO
  // ─────────────────────────────────────────────
  overrides: {},

  // ─────────────────────────────────────────────
  // 12. VERSIÓN Y METADATOS DEL ARCHIVO
  // ─────────────────────────────────────────────
  _version:   "1.1.0",
  _creado:    "2026-05-14",
  _actualizado: "2026-05-25",
  _fuentes:   [
    "XBRL 4T25 BMV",
    "XBRL 1T26 BMV",
    "Section 1 Analysis",
    "HR Ratings Dic-2025",
    "Junta Autlán may-2026",
  ],
};

// Exportar para uso en módulos (Node) o acceso global (browser)
if (typeof module !== "undefined") module.exports = AUTLAN;
