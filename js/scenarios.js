/**
 * scenarios.js — Motor de escenarios y estado global
 * Compañía Minera Autlán — Risk Calculator
 *
 * Responsabilidades:
 *  1. Mantener el estado global de todas las variables
 *  2. Propagar cambios de sliders a todos los módulos
 *  3. Calcular los 3 escenarios en tiempo real
 *  4. Gestionar overrides de datos auditados
 *  5. Emitir eventos para que cada página se actualice sola
 */

const Scenarios = (() => {

  // ─────────────────────────────────────────
  // 1. ESTADO GLOBAL — single source of truth
  // ─────────────────────────────────────────
  let _state = {
    // Variables macro activas (editables por el usuario)
    vars: {
      usdmxn:    17.36,
      tiie28:     6.74,
      sofr1m:     4.30,
      precioOro:  4513.62,
      precioMn:   1300,
      precioGas:  3.25,
      volPct:    100,
    },

    // Escenarios — valores por variable
    escenarios: {
      base: {
        usdmxn:    17.36,
        tiie28:     6.74,
        sofr1m:     3.62,
        precioOro:  4513.62,
        precioMn:   1300,//TONELADA MÉTRICA MT
        precioGas:  3.25,
        volPct:    100,
        narrativa: {
          usdmxn:    "Peso estable post-USMCA. Banxico completa 1-2 recortes. DXY moderado 95-102.",
          tiie28:    "Banxico lleva tasa terminal a 6.50% fin de año. Inflación dentro de banda 2-4%.",
          sofr1m:    "Fed realiza 1-2 recortes en 2026. Economía USA modera sin recesión.",
          precioOro: "Corrección moderada desde máximos. Demanda banco central sostiene piso.",
          precioMn:  "Recuperación frágil. China restocking moderado. India compensa parcialmente.",
          precioGas: "Mercado equilibrado. Sin disrupciones en oferta. CFE estable.",
          volPct:    "Volumen alineado con guía 2026. Exportaciones USA sostenidas. Doméstico +5%.",
        },
      },
     optimista: {
      usdmxn:    19.50,
      tiie28:     6.40,
      sofr1m:     3.25,
      precioOro:  5500,
      precioMn:   1600,
      precioGas:  2.50,
      volPct:    115,
      narrativa: {
        usdmxn:    "Peso se deprecia ante Fed hawkish o shock geopolítico. DXY sube a 103+. Cada $1 MXN de depreciación equivale a ~USD 18M adicionales en ingresos para Autlán.",
        tiie28:    "Banxico acelera recortes (3-4 adicionales). Inflación converge a 3.5%. Ahorro ~USD 440K por cada 100bps de baja en deuda MXN.",
        sofr1m:    "Fed recorta agresivamente ante desaceleración USA. SOFR cae a 3.25%. Reduce costo deuda principal Autlán ~USD 1.35-2M anuales.",
        precioOro: "Risk-off global intensifica. Bancos centrales aceleran compras. JP Morgan proyecta USD 6,300/oz a fin de 2026. Metallorum — segmento contra-cíclico — captura upside.",
        precioMn:  "China lanza estímulo fiscal fuerte. Ban Gabón 2029 adelanta efectos. India acero supera +8%. Precio >USD 1,600/MT abre margen operativo significativo.",
        precioGas: "Oferta USA aumenta. Invierno suave en Europa. Precios mínimos. Reduce costo de smelting ~USD 2-3M vs base.",
        volPct:    "Doméstico +12% con AHMSA partial restart. Exportaciones USA crecen amparadas en exención arancelaria. Autlán gana participación de mercado.",
      },
    },
    adverso: {
      usdmxn:    16.00,
      tiie28:     7.75,
      sofr1m:     4.80,
      precioOro:  3200,
      precioMn:    900,
      precioGas:   5.00,
      volPct:     80,
      narrativa: {
        usdmxn:    "Apreciación fuerte del peso. Nearshoring acelera flujos USD→MXN. Resultado adverso USMCA julio 2026 detona volatilidad. TC <$16.0 comprime EBITDA ~8-12%. Gap de cobertura FX (57pp) deja sin protección la mayoría de la exposición.",
        tiie28:    "IPC rebota >5% por shocks externos (energía, tarifas). Banxico pausa o sube. TIIE sube a 7.4-7.9%. Costo financiero MXN aumenta ~USD 440K por cada 100bps adicionales. Riesgo de covenant breach si se combina con caída en ingresos.",
        sofr1m:    "Inflación USA persistente por aranceles Trump. Fed mantiene tasas altas. SOFR 4.6-5.2%. Aumenta costo financiero USD ~USD 1.35M por +100bps. Doble presión sobre DSCR ya en 0.6x.",
        precioOro: "Fortaleza USD (DXY >105). Fed hawkish sorpresa. ETFs de oro liquidan posiciones masivamente. Oro cae a USD 3,200. Metallorum pierde su rol de cobertura natural justo cuando el negocio de ferroaleaciones está en su peor momento.",
        precioMn:  "China decepciona demanda + oversupply australiano + dumping asiático en México. Precio colapsa a USD 900/MT. Impacto directo: -USD 25-40M en ingresos Autlán. FCF profundamente negativo. AHMSA sigue inactiva. Mayor riesgo individual de la empresa.",
        precioGas: "Tensiones Medio Oriente escalan (conflicto Irán-Israel activo a jun-2026). Invierno frío en Europa. Henry Hub sube a USD 5/MMBtu. Costo de smelting aumenta USD 3-5M vs base. Se suma a compresión de márgenes por FX y Mn.",
        volPct:    "Doméstico contrae -8%. Tariff shock post-USMCA. Dumping asiático gana mercado en México. Exportaciones USA en riesgo si se revoca exención arancelaria de ferroaleaciones. Autlán forzado a competir en volumen sacrificando margen.",
      },
    },
    },

    // Coberturas activas — se actualiza desde cada página de riesgo
    coberturas: [],

    // Overrides de datos auditados con justificación
    overrides: {},

    // Cache de resultados para evitar recálculos innecesarios
    _cache: {},
    _dirty: true,
  };

  // ─────────────────────────────────────────
  // 2. SISTEMA DE EVENTOS (pub/sub simple)
  // ─────────────────────────────────────────
  const _listeners = {};

  function on(evento, callback) {
    if (!_listeners[evento]) _listeners[evento] = [];
    _listeners[evento].push(callback);
    return () => off(evento, callback); // retorna función para desuscribirse
  }

  function off(evento, callback) {
    if (!_listeners[evento]) return;
    _listeners[evento] = _listeners[evento].filter(cb => cb !== callback);
  }

  function emit(evento, data) {
    if (!_listeners[evento]) return;
    _listeners[evento].forEach(cb => {
      try { cb(data); }
      catch(e) { console.error(`Error en listener de ${evento}:`, e); }
    });
  }

  // ─────────────────────────────────────────
  // 3. GETTERS Y SETTERS DEL ESTADO
  // ─────────────────────────────────────────

  function getState() {
    return JSON.parse(JSON.stringify(_state)); // deep copy — no mutar directamente
  }

  function getVar(nombre) {
    return _state.vars[nombre];
  }

  function getEscenario(nombre) {
    return _state.escenarios[nombre];
  }

  /**
   * Actualiza una variable macro y propaga el cambio a toda la app
   * @param {string} nombre   - Nombre de la variable (ej. "usdmxn")
   * @param {number} valor    - Nuevo valor
   * @param {string} fuente   - "slider" | "input" | "escenario"
   */
  function setVar(nombre, valor, fuente = "slider") {
    const valorAnterior = _state.vars[nombre];
    _state.vars[nombre] = valor;
    _state._dirty = true;
    _state._cache = {};

    emit("var:change", { nombre, valor, valorAnterior, fuente });
    emit(`var:${nombre}`, { valor, valorAnterior, fuente });

    // Recalcular y emitir resultados
    _recalcular();
  }

  /**
   * Actualiza el valor de un escenario específico
   */
  function setEscenarioVar(escenario, variable, valor) {
    _state.escenarios[escenario][variable] = valor;
    _state._dirty = true;
    _state._cache = {};
    emit("escenario:change", { escenario, variable, valor });
    _recalcularEscenarios();
  }

  /**
   * Actualiza la narrativa de un escenario
   */
  function setNarrativa(escenario, variable, texto) {
    _state.escenarios[escenario].narrativa[variable] = texto;
    emit("narrativa:change", { escenario, variable, texto });
  }

  /**
   * Registra un override de dato auditado
   */
  function setOverride(campo, valor, justificacion) {
    _state.overrides[campo] = {
      valorOriginal:  _getValorOriginal(campo),
      valorOverride:  valor,
      justificacion,
      fecha:          new Date().toISOString(),
    };
    _state._dirty = true;
    emit("override:change", { campo, valor, justificacion });
    _recalcular();
  }

  function _getValorOriginal(campo) {
    // Navega el objeto AUTLAN para obtener el valor original
    const partes = campo.split(".");
    let obj = AUTLAN;
    for (const p of partes) {
      obj = obj?.[p];
    }
    return obj?.valor ?? obj;
  }

  // ─────────────────────────────────────────
  // 4. MOTOR DE CÁLCULO EN TIEMPO REAL
  // ─────────────────────────────────────────

  const _baseFinanciera = {
    ingresos_anual:   322746,  // 2025 auditado (XBRL 4T25)
    // Run-rate 1T26: UAFIRDA $10.8M × 4 = $43.2M — mejora significativa vs 2025
    // Usamos 2025 auditado como ancla conservadora; el modelo mostrará upside
    ebitda_anual:      31470,  // 2025 CALC — ancla conservadora
    ebitda_1T26_rr:    43200,  // run-rate 1T26 × 4 (junta may-2026) — para referencia
    gastoFinanciero:   42493,  // 2025 auditado
    gastoFin_1T26_rr:  29272,  // run-rate 1T26 ($7,318 × 4) — para referencia
    capex_anual:       30000,  // estimado mantenimiento
    // TC promedio para conversiones
    tcPromedio2025:    17.00,
    tc1T26:            18.07,
  };

  function _recalcular() {
    if (!_state._dirty) return;

    // Calcular impacto del estado actual (punto del slider)
    const impactoActual = Models.impactoEscenario(_state.vars, _baseFinanciera);

    _state._cache.actual = impactoActual;
    _state._dirty = false;

    emit("calc:update", {
      actual: impactoActual,
      escenarios: _recalcularEscenarios(),
    });
  }

  function _recalcularEscenarios() {
    const resultados = {};

    for (const [nombre, vars] of Object.entries(_state.escenarios)) {
      // Filtrar solo las variables numéricas (excluir "narrativa")
      const varsNum = {};
      for (const [k, v] of Object.entries(vars)) {
        if (k !== "narrativa" && typeof v === "number") {
          varsNum[k] = v;
        }
      }
      resultados[nombre] = Models.impactoEscenario(varsNum, _baseFinanciera);
    }

    _state._cache.escenarios = resultados;
    emit("escenarios:update", resultados);
    return resultados;
  }

  // ─────────────────────────────────────────
  // 5. GESTIÓN DE COBERTURAS
  // ─────────────────────────────────────────

  /**
   * Agrega o actualiza una cobertura en el estado global
   */
  function setCobertura(id, config) {
    const idx = _state.coberturas.findIndex(c => c.id === id);
    if (idx >= 0) {
      _state.coberturas[idx] = { ...config, id };
    } else {
      _state.coberturas.push({ ...config, id });
    }
    emit("coberturas:change", { id, config, coberturas: _state.coberturas });
    _evaluarEstrategiaTotal();
  }

  function removeCobertura(id) {
    _state.coberturas = _state.coberturas.filter(c => c.id !== id);
    emit("coberturas:change", { id, removed: true, coberturas: _state.coberturas });
    _evaluarEstrategiaTotal();
  }

  function getCoberturas() {
    return [..._state.coberturas];
  }

  function _evaluarEstrategiaTotal() {
    if (!_state.coberturas.length) return;

    const escenariosVars = {};
    for (const [nombre, vars] of Object.entries(_state.escenarios)) {
      const varsNum = {};
      for (const [k, v] of Object.entries(vars)) {
        if (k !== "narrativa" && typeof v === "number") varsNum[k] = v;
      }
      escenariosVars[nombre] = varsNum;
    }

    const resultado = Models.evaluarEstrategia(
      _state.coberturas,
      escenariosVars,
      _baseFinanciera
    );

    _state._cache.estrategia = resultado;
    emit("estrategia:update", resultado);
  }

  // ─────────────────────────────────────────
  // 6. HELPERS DE FORMATO PARA LA UI
  // ─────────────────────────────────────────

  const fmt = {
    usd: (v, decimals = 0) => {
      if (Math.abs(v) >= 1e6) return `USD ${(v/1e3).toFixed(decimals)}M`;
      if (Math.abs(v) >= 1e3) return `USD ${v.toFixed(decimals)}K`;
      return `USD ${v.toFixed(decimals)}`;
    },
    pct: (v, decimals = 1) => `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`,
    fx:  (v) => `$${v.toFixed(2)}`,
    tasa:(v) => `${v.toFixed(2)}%`,
    mn:  (v) => `USD ${v.toFixed(0)}/MT`,
    oro: (v) => `USD ${v.toFixed(0)}/oz`,
    gas: (v) => `USD ${v.toFixed(2)}/MMBtu`,
    semaforo: (v, umbralBajo = 0, umbralMedio = 15000) => {
      if (v < umbralBajo)   return { color: "#A32D2D", label: "CRÍTICO" };
      if (v < umbralMedio)  return { color: "#854F0B", label: "ALERTA"  };
      return                       { color: "#3B6D11", label: "OK"      };
    },
  };

  // ─────────────────────────────────────────
  // 7. CONFIGURACIÓN DE SLIDERS
  // Define rangos, pasos y etiquetas de cada variable
  // ─────────────────────────────────────────
  const SLIDER_CONFIG = {
    usdmxn: {
      label:   "USD / MXN",
      min:     14.0,
      max:     23.0,
      step:    0.05,
      unidad:  "MXN/USD",
      formato: fmt.fx,
      color:   "#185FA5",
      icono:   "💱",
      sensibilidad: "Cada $1 MXN de apreciación reduce ingresos ~USD 18M",
    },
    tiie28: {
      label:   "TIIE 28 días",
      min:     4.0,
      max:     14.0,
      step:    0.05,
      unidad:  "% anual",
      formato: fmt.tasa,
      color:   "#854F0B",
      icono:   "📈",
      sensibilidad: "Cada 100bps sube costo financiero MXN ~USD 440K",
    },
    sofr1m: {
      label:   "SOFR 1 mes",
      min:     1.5,
      max:     7.0,
      step:    0.05,
      unidad:  "% anual",
      formato: fmt.tasa,
      color:   "#854F0B",
      icono:   "🇺🇸",
      sensibilidad: "Cada 100bps sube costo financiero USD ~USD 1.35M",
    },
    precioOro: {
      label:   "Precio del Oro",
      min:     1500,
      max:     4000,
      step:    10,
      unidad:  "USD/oz",
      formato: fmt.oro,
      color:   "#B8860B",
      icono:   "🥇",
      sensibilidad: "Cada USD 100/oz impacta ingresos Metallorum ~USD 1.5-2M",
    },
    precioMn: {
      label:   "Precio Manganeso",
      min:     500,
      max:     2500,
      step:    10,
      unidad:  "USD/MT",
      formato: fmt.mn,
      color:   "#5C4033",
      icono:   "⛏️",
      sensibilidad: "Cada USD 100/MT impacta ingresos ferroaleaciones ~USD 5-8M",
    },
    precioGas: {
      label:   "Gas Natural",
      min:     1.0,
      max:     9.0,
      step:    0.05,
      unidad:  "USD/MMBtu",
      formato: fmt.gas,
      color:   "#2E7D32",
      icono:   "⚡",
      sensibilidad: "Cada USD 1/MMBtu sube costos operativos ~USD 2-3M",
    },
    volPct: {
      label:   "Volumen producción",
      min:     50,
      max:     140,
      step:    1,
      unidad:  "% del plan",
      formato: (v) => `${v}%`,
      color:   "#37474F",
      icono:   "🏭",
      sensibilidad: "Variación de ±15% sobre plan base de ingresos",
    },
  };

  // ─────────────────────────────────────────
  // 8. INICIALIZACIÓN
  // ─────────────────────────────────────────
  function init() {
    // Calcular escenarios con valores iniciales
    _recalcular();
    _recalcularEscenarios();

    console.log("[Scenarios] Inicializado correctamente");
    console.log("[Scenarios] Escenarios calculados:", Object.keys(_state.escenarios));
    emit("init:complete", { state: _state });
  }

  // ─────────────────────────────────────────
  // 9. EXPORTAR SUPUESTOS (para la presentación)
  // ─────────────────────────────────────────
  function exportarSupuestos() {
    const supuestos = [];
    const esc = _state.escenarios;

    for (const [variable, config] of Object.entries(SLIDER_CONFIG)) {
      supuestos.push({
        variable:  config.label,
        actual:    config.formato(_state.vars[variable]),
        base:      config.formato(esc.base[variable]),
        optimista: config.formato(esc.optimista[variable]),
        adverso:   config.formato(esc.adverso[variable]),
        unidad:    config.unidad,
      });
    }

    // Overrides documentados
    const overridesList = Object.entries(_state.overrides).map(([campo, data]) => ({
      campo,
      original:      data.valorOriginal,
      override:      data.valorOverride,
      justificacion: data.justificacion,
      fecha:         data.fecha,
    }));

    return { supuestos, overrides: overridesList };
  }

  // ─────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────
  return {
    // Estado
    getState,
    getVar,
    getEscenario,
    // Setters
    setVar,
    setEscenarioVar,
    setNarrativa,
    setOverride,
    // Coberturas
    setCobertura,
    removeCobertura,
    getCoberturas,
    // Eventos
    on,
    off,
    emit,
    // Config
    SLIDER_CONFIG,
    // Utilidades
    fmt,
    // Acciones
    init,
    exportarSupuestos,
    // Cache (read-only)
    getCache: () => JSON.parse(JSON.stringify(_state._cache)),
  };

})();

// Export para Node/testing
if (typeof module !== "undefined") module.exports = Scenarios;
