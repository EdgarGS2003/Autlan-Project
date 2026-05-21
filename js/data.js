/**
 * data.js — Compañía Minera Autlán, S.A.B. de C.V.
 * Base de datos precargada desde XBRLs auditados BMV
 * Fuentes: XBRL 4T25 (31-dic-2025) y XBRL 1T26 (31-mar-2026)
 *
 * Convención de moneda: USD miles (000s) salvo indicación
 * Flag "source": "XBRL_4T25" | "XBRL_1T26" | "CALC" | "ASSUMPTION"
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
      margenBruto:       { valor: 15.9,  source: "CALC", audited: false }, // %
      ebitda:            { valor: 31470, source: "CALC", audited: false }, // utilidad op + D&A (35,564)
      margenEbitda:      { valor:  9.7,  source: "CALC", audited: false }, // %
      depreciacion:      { valor: 35564, source: "XBRL_4T25", audited: true },
    },
    // 1T26 — fuente XBRL 1T26
    t1_2026: {
      ingresos:           { valor:  98386, source: "XBRL_1T26", audited: true },
      costoVentas:        { valor:  83463, source: "XBRL_1T26", audited: true },
      utilidadBruta:      { valor:  14923, source: "XBRL_1T26", audited: true },
      gastosVenta:        { valor:   5905, source: "XBRL_1T26", audited: true },
      gastosAdmin:        { valor:  10656, source: "XBRL_1T26", audited: true },
      otrosGastos:        { valor:  -1808, source: "XBRL_1T26", audited: true },
      utilidadOperacion:  { valor:    170, source: "XBRL_1T26", audited: true },
      ingresosFinancieros:{ valor:   1486, source: "XBRL_1T26", audited: true },
      gastosFinancieros:  { valor:   7318, source: "XBRL_1T26", audited: true },
      perdidaAnteImpuestos:{ valor: -5662, source: "XBRL_1T26", audited: true },
      impuestos:          { valor:    314, source: "XBRL_1T26", audited: true },
      perdidaNeta:        { valor:  -5976, source: "XBRL_1T26", audited: true },
      // vs 1T25
      ingresos_1T25:      { valor:  80135, source: "XBRL_1T26", audited: true },
      variacion_yoy:      { valor:  22.8,  source: "CALC",      audited: false }, // %
    },
    // 1T25 para referencia
    t1_2025: {
      ingresos:    { valor: 80135, source: "XBRL_1T26", audited: true },
      perdidaNeta: { valor: -7632, source: "XBRL_1T26", audited: true },
    },
  },

  // ─────────────────────────────────────────────
  // 3. BALANCE GENERAL
  // ─────────────────────────────────────────────
  balance: {
    // Al 31-mar-2026 — fuente XBRL 1T26
    fecha: "2026-03-31",
    activos: {
      efectivo:             { valor:  21801, source: "XBRL_1T26", audited: true },
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
      totalControladora:    { valor: 228098, source: "XBRL_1T26", audited: true },
      participacionNc:      { valor:   4173, source: "XBRL_1T26", audited: true },
      totalCapital:         { valor: 232271, source: "XBRL_1T26", audited: true },
    },
    // Métricas de apalancamiento
    metricas: {
      leverage:    { valor: 63.0, source: "CALC", audited: false, nota: "Deuda total / Activos totales %" },
      deudaTotal:  { valor: 185932, source: "CALC", audited: false, nota: "Deuda CP + LP (sin arrendamientos)" },
      deudaNeta:   { valor: 164131, source: "CALC", audited: false, nota: "Deuda total - Efectivo" },
    },
  },

  // ─────────────────────────────────────────────
  // 4. ESTRUCTURA DE DEUDA DETALLADA
  // ─────────────────────────────────────────────
  deuda: {
    fecha: "2026-03-31",
    creditos: [
      {
        id: 1,
        acreedor:    "Banco Santander México",
        tipo:        "Banca comercial",
        extranjero:  false,
        fechaFirma:  "2024-11-05",
        vencimiento: "2031-10-05",
        tasa:        "SOFR + 6.00%",
        tasaBase:    "SOFR",
        spread:      6.00,
        moneda:      "USD",
        saldoTotal:  { valor: 119470, source: "XBRL_1T26", audited: true },
        // Desglose por vencimiento (USD miles)
        vencimientos:{ cp: 1079, a1: 3237, a2: 15184, a3: 21632, a4: 28184, a5mas: 50234 },
        notas: "Crédito sindicado principal. Mayor exposición SOFR.",
      },
      {
        id: 2,
        acreedor:    "Banco Santander México",
        tipo:        "Banca comercial",
        extranjero:  false,
        fechaFirma:  "2024-11-05",
        vencimiento: "2027-11-05",
        tasa:        "SOFR + 5.50%",
        tasaBase:    "SOFR",
        spread:      5.50,
        moneda:      "USD",
        saldoTotal:  { valor: 16009, source: "XBRL_1T26", audited: true },
        vencimientos:{ cp: 0, a1: 0, a2: 16009, a3: 0, a4: 0, a5mas: 0 },
      },
      {
        id: 3,
        acreedor:    "Banco Santander México",
        tipo:        "Banca comercial",
        extranjero:  false,
        fechaFirma:  "2024-11-05",
        vencimiento: "2027-11-05",
        tasa:        "TIIE 28 + 5.50%",
        tasaBase:    "TIIE28",
        spread:      5.50,
        moneda:      "MXN",
        saldoTotal:  { valor: 14887, source: "XBRL_1T26", audited: true }, // USD equiv
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
        saldoTotal:  { valor: 11392, source: "XBRL_1T26", audited: true }, // USD equiv
        vencimientos:{ cp: 2680, a1: 0, a2: 2354, a3: 2378, a4: 2476, a5mas: 4504 },
        notas: "Subsidiaria CEM. Cubierto parcialmente con collar TIIE.",
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
        tipo:        "Banca internacional",
        extranjero:  true,
        fechaFirma:  "2025-05-16",
        vencimiento: "2028-05-31",
        tasa:        "EURIBOR + 0.40%",
        tasaBase:    "EURIBOR",
        spread:      0.40,
        moneda:      "EUR",
        saldoTotal:  { valor: 3401, source: "XBRL_1T26", audited: true },
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
    // Resumen por tipo de tasa (para el modelo de swap)
    resumenTasa: {
      sofr_usd:    { saldo: 135479, pct: 72.9, source: "CALC" }, // Créditos 1+2
      tiie_mxn:    { saldo:  29747, pct: 16.0, source: "CALC" }, // Créditos 3+4+5
      euribor_eur: { saldo:   3401, pct:  1.8, source: "CALC" },
      fija:        { saldo:   2000, pct:  1.1, source: "CALC" },
      arrendamientos:{ saldo: 4703, pct:  2.5, source: "CALC" },
      total:       { saldo: 185932, source: "CALC" },
    },
  },

  // ─────────────────────────────────────────────
  // 5. INSTRUMENTOS DERIVADOS VIGENTES
  // ─────────────────────────────────────────────
  derivadosVigentes: {
    fecha: "2026-03-31",
    fuente: "XBRL_1T26",

    // COLLAR DE TASA DE INTERÉS — TIIE (único instrumento de tasa activo)
    collarTasa: {
      id:           "IFD-TASA-01",
      tipo:         "Collar de tasa de interés (Cap + Floor)",
      subyacente:   "TIIEF (TIIE 28 días)",
      entidad:      "Compañía de Energía Mexicana (CEM) — subsidiaria",
      fechaContrato:"2025-02-07",
      vencimiento:  "2028-06-23",
      nocionalMXN:  { valor: 157584, source: "XBRL_4T25", audited: true }, // MXN miles
      nocionalPct:  50, // % del saldo de deuda TIIE de CEM cubierto
      cap:          11.00,  // % — floor corto (vende call)
      floor:        8.75,   // % — cap largo (compra put)
      // Situación actual: TIIE actual ~7.10% → DEBAJO del floor 8.75%
      // → El collar NO está siendo ejercido → pérdida de prima sin beneficio
      tiieActual:   7.10,
      estadoActual: "SIN_EJERCICIO", // TIIE < floor → instrumento fuera del dinero
      mtm: {
        // Al 1T26 el collar representa un ACTIVO (la empresa es acreedora del valor)
        // pero genera minusvalía porque TIIE cayó por debajo del floor
        minusvalia1T26: { valor: 31.5, moneda: "USD", source: "XBRL_1T26", audited: true },
        perdidaAcum:    { valor: 45.6, moneda: "USD", source: "XBRL_4T25", audited: true,
                          nota: "Pérdida acumulada desde contratación (11 cupones ejercidos al 4T25)" },
      },
      // Costo real: empresa paga TIIE de mercado (7.1%) + spread sin beneficio del collar
      costoEfectivo: {
        tasa:  7.10 + 4.00, // TIIE + spread promedio TIIE del crédito CEM = ~11.1%
        nota:  "Pagando tasa de mercado completa sin beneficio del cap porque TIIE < floor"
      },
      vencimientosMensuales: "Día 23 de cada mes",
      audited: true,
    },

    // COLLARES USD/MXN — los 4 collares de FX contratados en 1T26
    collarsFX: [
      {
        id:          "IFD-FX-01",
        tipo:        "Collar de opciones USD/MXN",
        fechaContrato:"2026-02-04",  // collar previo al trimestre reportado
        vencimiento: "2026-06-30",
        nocionalUSD: { valor: 1000, moneda: "USD", source: "XBRL_1T26", audited: true }, // USD miles/mes
        floorUSD:    17.30,   // put largo (protege vs apreciación peso)
        capUSD:      18.2761, // call corto (limita upside si peso se deprecia)
        vencimientosMensuales: "Fin de cada mes (abr-jun 2026)",
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
        vencimientosMensuales: "Fin de cada mes (abr-jun 2026)",
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
        vencimientosMensuales: "Fin de cada mes (abr-jun 2026)",
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
        vencimientosMensuales: "Fin de cada mes (abr-jun 2026)",
        ejercidos:   0,
        audited:     true,
      },
    ],

    // RESUMEN DE EXPOSICIÓN VS COBERTURA ACTIVA
    exposicionVsCobertura: {
      // FX
      ingresosFX_anualizado:  { valor: 393544, nota: "1T26 × 4, proxy ingresos anualizados USD" },
      coberturaFX_nocional:   { valor:  12000, nota: "4 collares × USD 1M/mes × 3 meses" },
      pctCubierto_FX:         { valor:    3.0, nota: "12M / 393M — CRÍTICO: muy por debajo del 60% permitido" },
      limitePolítica_FX:      { valor:   60.0, nota: "Política interna Autlán" },
      gapCobertura_FX:        { valor:   57.0, nota: "% exposición adicional que se puede cubrir" },
      // Tasa
      deudaVariableTotal:     { valor: 165226, nota: "SOFR+TIIE total USD equiv (créditos 1-5)" },
      coberturaTasa_nocional: { valor:   8700, nota: "Collar TIIE (MXN 157.6M ÷ TC 18.1 aprox)" },
      pctCubierto_tasa:       { valor:    5.3, nota: "% de deuda variable cubierta con collar TIIE" },
      // Oro
      coberturaOro:           { valor:      0, nota: "SIN COBERTURA — precio en máximos históricos USD 3,000+/oz" },
      // Gas
      coberturaGas:           { valor:      0, nota: "SIN COBERTURA — exposición total a precio de mercado" },
    },
  },

  // ─────────────────────────────────────────────
  // 6. SEGMENTOS Y PRODUCCIÓN
  // ─────────────────────────────────────────────
  segmentos: {
    ferroaleaciones: {
      ingresos2025:    { valor: 289000, source: "XBRL_4T25", audited: true }, // ~90% aprox
      pctTotal:        { valor: 89.6,   source: "CALC" },
      monedaVentas:    "USD (exportaciones) + MXN (doméstico)",
      mercados:        { mexico: 30, eeuu: 45, europa: 20, otros: 5 }, // % estimado
      volumenYoy:      { valor: 7.0, nota: "Crecimiento volumen 2025 vs 2024 %" },
      // Precio manganeso referencia
      precioMnActual:  { valor: 1309, moneda: "USD/MT", fecha: "Q1 2026", source: "IMARC" },
    },
    emd: {
      ingresos2025:    { valor: 28000, source: "XBRL_4T25", audited: false, nota: "~9% estimado" },
      pctTotal:        { valor: 8.7,  source: "CALC" },
      monedaVentas:    "USD",
      mercados:        { global: 100 },
    },
    metallorum: {
      // Oro — segmento estratégico en crecimiento
      ingresos2025:    { valor: 5000,  source: "XBRL_4T25", audited: false, nota: "Inicial, < 2%" },
      pctTotal:        { valor: 1.5,   source: "CALC" },
      monedaVentas:    "USD",
      onzasVendidas9M25:{ valor: 390000, source: "XBRL_4T25", audited: false, nota: "oz acum a 9M25" },
      precioOroActual: { valor: 3000,  moneda: "USD/oz", nota: "Precio de mercado may-2026 (aprox)" },
      meta2028:        { valor: 15.0,  nota: "Target % de ingresos totales" },
      // 1T26: duplicaron producción y ventas de oro
      produccion1T26:  { nota: "Duplicó vs 1T25 — dato cualitativo XBRL 1T26" },
    },
    energia: {
      ahorro2025:      { valor: 2800,  moneda: "USD trimestral", source: "XBRL_4T25" },
      autosuficiencia: { valor: 25,    nota: "% consumo eléctrico autogenerado" },
      fuentes:         ["Hidroeléctrica Atexcaco", "Solar", "Cogeneración"],
    },
  },

  // ─────────────────────────────────────────────
  // 7. VARIABLES DE MERCADO — PUNTO DE PARTIDA
  // ─────────────────────────────────────────────
  mercado: {
    fecha: "2026-05-14", // Fecha de los datos de mercado
    usdmxn:     { valor: 17.20, source: "TradingEconomics May-2026" },
    banxico:    { valor:  6.75, source: "Banxico Q1-2026" },
    tiie28:     { valor:  7.10, source: "Banxico Mar-2026" },
    sofr1m:     { valor:  4.30, source: "CALC/Estimado May-2026", audited: false },
    inflacion:  { valor:  4.45, source: "INEGI Abr-2026" },
    dxy:        { valor: 99.0,  source: "Bloomberg Abr-2026" },
    precioOro:  { valor: 3000,  moneda: "USD/oz", source: "Mercado May-2026" },
    precioMn:   { valor: 1309,  moneda: "USD/MT", source: "IMARC Q1-2026" },
    precioGas:  { valor:  3.20, moneda: "USD/MMBtu", source: "Henry Hub estimado" },
    euribor6m:  { valor:  2.40, source: "BCE estimado May-2026" },
  },

  // ─────────────────────────────────────────────
  // 8. ESCENARIOS MACRO — PRE-CARGADOS Y EDITABLES
  // ─────────────────────────────────────────────
  escenarios: {
    // Fuente base: Section 1 análisis macro + XBRL data
    variables: {
      usdmxn: {
        label:  "USD / MXN",
        unidad: "pesos por dólar",
        base:     { valor: 18.0,  narrativa: "Peso estable post-USMCA; Banxico continúa ciclo de baja. DXY moderado 95-102." },
        optimista:{ valor: 19.5,  narrativa: "Depreciación moderada del peso. Fed mantiene tasas altas; DXY 103+. Favorable para ingresos Autlán." },
        adverso:  { valor: 16.0,  narrativa: "Apreciación fuerte del peso. Nearshoring acelera flujos USD→MXN. EBITDA comprime ~8-12%." },
        actual:   17.20,
        min:      14.0,
        max:      23.0,
        sensibilidad: "Cada $1 de apreciación del peso reduce ingresos MXN-equiv en ~USD 18M sobre base de ingresos USD 322M",
      },
      tiie28: {
        label:  "TIIE 28 días",
        unidad: "% anual",
        base:     { valor: 6.95,  narrativa: "Banxico completa 1-2 recortes adicionales. Tasa terminal ~6.50% fin de año. Inflación dentro de banda." },
        optimista:{ valor: 6.50,  narrativa: "3-4 recortes adicionales. Inflación converge a 3.5%. Crecimiento apoya expansión monetaria." },
        adverso:  { valor: 7.75,  narrativa: "Inflación rebota >5%. Banxico pausa o sube. Costo deuda TIIE de Autlán aumenta ~USD 1-2M por 100bps." },
        actual:   7.10,
        min:      5.0,
        max:      12.0,
        sensibilidad: "Cada 100bps de alza en TIIE incrementa costo financiero Autlán ~USD 440K (sobre MXN 29.7M deuda TIIE a ~1.5% equivalencia)",
      },
      sofr1m: {
        label:  "SOFR 1 mes",
        unidad: "% anual",
        base:     { valor: 4.10,  narrativa: "Fed realiza 1-2 recortes en 2026. Economía USA moderándose sin recesión." },
        optimista:{ valor: 3.50,  narrativa: "Fed recorta agresivamente ante desaceleración USA. Reduce costo deuda principal Autlán." },
        adverso:  { valor: 4.80,  narrativa: "Fed mantiene tasas altas por inflación persistente. Costo deuda SOFR de Autlán (USD 135M) aumenta." },
        actual:   4.30,
        min:      2.0,
        max:      7.0,
        sensibilidad: "Cada 100bps de alza en SOFR incrementa gasto financiero ~USD 1.35M (sobre USD 135M deuda SOFR)",
      },
      precioOro: {
        label:  "Precio del Oro",
        unidad: "USD / oz",
        base:     { valor: 2900,  narrativa: "Corrección moderada desde máximos. Demanda banco central sostiene piso. DXY moderado." },
        optimista:{ valor: 3300,  narrativa: "Risk-off global. Tensiones geopolíticas. Bancos centrales aceleran compras. USD débil." },
        adverso:  { valor: 2400,  narrativa: "Fortaleza USD (DXY >105). Fed hawkish. Apetito de riesgo mejora. Salida de ETFs de oro." },
        actual:   3000,
        min:      1800,
        max:      4000,
        sensibilidad: "Cada USD 100/oz de variación en precio oro impacta ingresos Metallorum ~USD 1.5-2M anualizados (estimado 390K oz/año)",
      },
      precioMn: {
        label:  "Precio Manganeso",
        unidad: "USD / MT",
        base:     { valor: 1300,  narrativa: "Recuperación frágil. China restocking moderado. India compensa caída China parcialmente." },
        optimista:{ valor: 1600,  narrativa: "China stimulus fuerte. Gabon ban cataliza (anticipo 2029). India accelera. Oferta australiana limitada." },
        adverso:  { valor:  900,  narrativa: "China demanda decepciona. Dumping asiático en México. Acero global contrae. Autlán: -USD 30-50M ingresos." },
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
        adverso:  { valor: 5.00,  narrativa: "Tensiones Medio Oriente. Invierno frío. Alta demanda LNG Europa. Costo smelting sube USD 3-5M." },
        actual:   3.20,
        min:      1.5,
        max:      8.0,
        sensibilidad: "Cada USD 1/MMBtu de alza en gas incrementa costo operativo Autlán ~USD 2-3M (plantas de fundición intensivas en gas)",
      },
      volumenFerroaleaciones: {
        label:  "Volumen Ferroaleaciones",
        unidad: "% vs plan base",
        base:     { valor: 100,   narrativa: "Volumen alineado con guía 2026. Exportaciones USA sostenidas. Doméstico +5% recuperación parcial." },
        optimista:{ valor: 115,   narrativa: "Doméstico se recupera +12%. AHMSA parcial restart. USA crece. Autlán gana share vs dumping asiático." },
        adverso:  { valor:  80,   narrativa: "Doméstico contrae -8%. Tariff shock. Dumping asiático gana mercado. Autlán exporta más a menor margen." },
        actual:   100,
        min:      60,
        max:      130,
      },
    },

    // Resultados financieros por escenario — se recalculan en tiempo real
    // Estos son los valores base que models.js actualiza
    resultadosBase: {
      ingresos_anual:    322746, // 2025 auditado
      costoFijo_anual:   200000, // estimado (costos que no varían con volumen/precio)
      costoVariable_pct: 62.0,   // % de ingresos (sensible a FX, gas, insumos)
      ebitda_anual:       31470, // 2025 calculado
      gastoFinanciero:    42493, // 2025 auditado
      capex_anual:        30000, // estimado mantenimiento
    },
  },

  // ─────────────────────────────────────────────
  // 9. POLÍTICA DE COBERTURA
  // ─────────────────────────────────────────────
  politicaCobertura: {
    fuente:         "XBRL 1T26 + XBRL 4T25 — política formal documentada",
    fx: {
      instrumentos:  ["Collares", "Forwards", "Swaps", "Opciones"],
      limiteNocional:{ valor: 60, unidad: "% de ingresos presupuestados en USD", audited: true },
      horizonteMax:  { valor: 12, unidad: "meses", audited: true },
      objetivo:      "Cubrir riesgo de apreciación del peso vs USD",
    },
    tasa: {
      instrumentos:  ["Swaps de tasa", "Opciones TIIE (caps/floors/collars)"],
      limiteNocional:{ valor: 50, unidad: "% del saldo de deuda variable (práctica observada)", audited: false },
      objetivo:      "Limitar exposición al alza en TIIE y SOFR",
    },
    oro: {
      instrumentos:  ["Forwards", "Costless collars"],
      limiteNocional:{ valor: 60, unidad: "% producción vendible (estimado por política general)", audited: false },
      objetivo:      "Proteger contra caída en precio del oro",
      estadoActual:  "SIN COBERTURA al 1T26",
    },
    gas: {
      instrumentos:  ["Forwards de precio"],
      limiteNocional:{ valor: 60, unidad: "% consumo presupuestado (estimado)", audited: false },
      objetivo:      "Fijar precio máximo de compra de gas natural",
      estadoActual:  "SIN COBERTURA al 1T26",
    },
    principios: [
      "Exclusivamente con fines de cobertura — no especulación",
      "Solo con contrapartes de alta calidad crediticia reconocida",
      "Principalmente mercados OTC / extrabursátiles",
      "Tratamiento contable: cobertura de flujo de efectivo (IFRS 9)",
      "Valuación trimestral por contrapartes + verificación interna",
    ],
  },

  // ─────────────────────────────────────────────
  // 10. HELPER — ESTADO DE OVERRIDES DEL USUARIO
  // (se llena en runtime cuando el usuario sobreescribe datos auditados)
  // ─────────────────────────────────────────────
  overrides: {},

  // ─────────────────────────────────────────────
  // 11. VERSIÓN Y METADATOS DEL ARCHIVO
  // ─────────────────────────────────────────────
  _version:   "1.0.0",
  _creado:    "2026-05-14",
  _fuentes:   ["XBRL 4T25 BMV", "XBRL 1T26 BMV", "Section 1 Analysis", "HR Ratings Dic-2025"],
};

// Exportar para uso en módulos (Node) o acceso global (browser)
if (typeof module !== "undefined") module.exports = AUTLAN;
