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
      usdmxn:    17.20,
      tiie28:     7.10,
      sofr1m:     4.30,
      precioOro:  3000,
      precioMn:   1309,
      precioGas:  3.20,
      volPct:    100,
    },

    // Escenarios — valores por variable
    escenarios: {
      base: {
        usdmxn:    18.0,
        tiie28:     6.95,
        sofr1m:     4.10,
        precioOro:  2900,
        precioMn:   1300,
        precioGas:  3.20,
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
        usdmxn:    19.5,
        tiie28:     6.50,
        sofr1m:     3.50,
        precioOro:  3300,
        precioMn:   1600,
        precioGas:  2.50,
        volPct:    115,
        narrativa: {
          usdmxn:    "Depreciación del peso. Fed hawkish. DXY 103+. Favorable para ingresos Autlán.",
          tiie28:    "3-4 recortes adicionales. Inflación converge a 3.5%. Expansión monetaria.",
          sofr1m:    "Fed recorta agresivamente ante desaceleración USA. Reduce costo deuda principal.",
          precioOro: "Risk-off global. Tensiones geopolíticas. Bancos centrales aceleran compras.",
          precioMn:  "China stimulus fuerte. Gabon ban cataliza. India acelera. Oferta limitada.",
          precioGas: "Oferta USA aumenta. Invierno suave. Precios mínimos. Reduce costo operativo.",
          volPct:    "Doméstico +12%. AHMSA partial restart. USA crece. Autlán gana share.",
        },
      },
      adverso: {
        usdmxn:    16.0,
        tiie28:     7.75,
        sofr1m:     4.80,
        precioOro:  2400,
        precioMn:    900,
        precioGas:   5.0,
        volPct:     80,
        narrativa: {
          usdmxn:    "Apreciación fuerte del peso. Nearshoring acelera flujos. EBITDA comprime 8-12%.",
          tiie28:    "Inflación rebota >5%. Banxico pausa o sube. Costo deuda MXN aumenta USD 1-2M/100bps.",
          sofr1m:    "Fed mantiene tasas altas. Inflación USA persistente. Costo deuda SOFR sube.",
          precioOro: "Fortaleza USD (DXY >105). Fed hawkish. Salida de ETFs de oro.",
          precioMn:  "China decepciona. Dumping asiático. Acero global contrae. Autlán -USD 30-50M.",
          precioGas: "Tensiones Medio Oriente. Invierno frío. Costo smelting sube USD 3-5M.",
          volPct:    "Doméstico contrae -8%. Tariff shock. Dumping asiático gana mercado.",
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
    ingresos_anual:   322746,
    ebitda_anual:      31470,
    gastoFinanciero:   42493,
    capex_anual:       30000,
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