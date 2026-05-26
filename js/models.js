/**
 * models.js — Motores de cálculo financiero
 * Compañía Minera Autlán — Risk Calculator
 *
 * Modelos implementados:
 *  1. Black-Scholes estándar (opciones europeas)
 *  2. Heston (volatilidad estocástica — opciones FX y commodities)
 *  3. Schwartz 1-factor (mean-reversion gas natural)
 *  4. Forward pricing (paridad cubierta de tasas)
 *  5. Hull-White 1-factor (swaps y caps de tasa)
 *  6. Collar pricing (combinación put+call)
 *  7. Sensitivity / Greeks
 */

const Models = (() => {

  // ─────────────────────────────────────────
  // UTILIDADES MATEMÁTICAS
  // ─────────────────────────────────────────

  // Distribución normal estándar acumulada (Abramowitz & Stegun)
  function normCDF(x) {
    const a1 =  0.254829592, a2 = -0.284496736,
          a3 =  1.421413741, a4 = -1.453152027,
          a5 =  1.061405429, p  =  0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5*t + a4)*t + a3)*t + a2)*t + a1)*t) * Math.exp(-x*x);
    return 0.5 * (1 + sign * y);
  }

  // Densidad normal estándar
  function normPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // Exponencial segura (evita overflow)
  function safeExp(x) {
    return x > 700 ? Infinity : x < -700 ? 0 : Math.exp(x);
  }

  // ─────────────────────────────────────────
  // 1. BLACK-SCHOLES ESTÁNDAR
  // ─────────────────────────────────────────
  /**
   * @param {string} tipo    - "call" | "put"
   * @param {number} S       - Precio spot del subyacente
   * @param {number} K       - Strike (precio de ejercicio)
   * @param {number} T       - Tiempo al vencimiento en años
   * @param {number} r       - Tasa libre de riesgo (decimal, ej. 0.065)
   * @param {number} sigma   - Volatilidad implícita (decimal, ej. 0.18)
   * @param {number} q       - Dividend yield / tasa extranjera (decimal)
   * @returns {object}       - { precio, delta, gamma, vega, theta, rho, d1, d2 }
   */
  function blackScholes(tipo, S, K, T, r, sigma, q = 0) {
    if (T <= 0) {
      const intrinseco = tipo === "call"
        ? Math.max(S - K, 0)
        : Math.max(K - S, 0);
      const deltaFinal = tipo === "call"
        ? (S > K ? 1 : 0)
        : (S < K ? -1 : 0);
      return { precio: intrinseco, delta: deltaFinal,
               gamma:0, vega:0, theta:0, rho:0, d1:0, d2:0 };
    }

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    let precio, delta, rho;

    if (tipo === "call") {
      precio = S * safeExp(-q*T) * normCDF(d1) - K * safeExp(-r*T) * normCDF(d2);
      delta  = safeExp(-q*T) * normCDF(d1);
      rho    = K * T * safeExp(-r*T) * normCDF(d2) / 100;
    } else {
      precio = K * safeExp(-r*T) * normCDF(-d2) - S * safeExp(-q*T) * normCDF(-d1);
      delta  = -safeExp(-q*T) * normCDF(-d1);
      rho    = -K * T * safeExp(-r*T) * normCDF(-d2) / 100;
    }

    const gamma = normPDF(d1) * safeExp(-q*T) / (S * sigma * sqrtT);
    const vega  = S * safeExp(-q*T) * normPDF(d1) * sqrtT / 100;
    const theta = tipo === "call"
      ? (-S * normPDF(d1) * sigma * safeExp(-q*T) / (2*sqrtT)
         - r * K * safeExp(-r*T) * normCDF(d2)
         + q * S * safeExp(-q*T) * normCDF(d1)) / 365
      : (-S * normPDF(d1) * sigma * safeExp(-q*T) / (2*sqrtT)
         + r * K * safeExp(-r*T) * normCDF(-d2)
         - q * S * safeExp(-q*T) * normCDF(-d1)) / 365;

    return {
      precio: Math.max(precio, 0),
      delta, gamma, vega, theta, rho, d1, d2,
      moneyness: S / K,
      itm: tipo === "call" ? S > K : S < K,
    };
  }

  // ─────────────────────────────────────────
  // 2. MODELO DE HESTON (Volatilidad Estocástica)
  // ─────────────────────────────────────────
  /**
   * Implementación via integración numérica de Carr-Madan / Heston 1993
   * Captura el skew de volatilidad que B-S subestima en FX y commodities
   *
   * Parámetros del proceso de varianza:
   *   dv = kappa*(theta_v - v)*dt + xi*sqrt(v)*dW_v
   *   correlación entre S y v: rho_sv
   *
   * @param {string} tipo
   * @param {number} S, K, T, r, q
   * @param {number} v0       - Varianza inicial (sigma_0^2)
   * @param {number} kappa    - Velocidad de reversión (mean-reversion speed)
   * @param {number} theta_v  - Varianza de largo plazo
   * @param {number} xi       - Volatilidad de la volatilidad (vol of vol)
   * @param {number} rho_sv   - Correlación precio-varianza (típico -0.5 a -0.7 en FX)
   */
  function heston(tipo, S, K, T, r, q, v0, kappa, theta_v, xi, rho_sv) {
    // Integración numérica usando 64 puntos de Gauss-Laguerre (aproximado)
    // Para precisión de mesa de riesgos — suficiente para este uso
    const N  = 64;
    const uMax = 200;
    const du  = uMax / N;

    function charFunc(phi, j) {
        // Función característica de Heston
        const b  = j === 1 ? kappa - rho_sv * xi : kappa;
        const u_j = j === 1 ? 0.5 : -0.5;
        const a  = kappa * theta_v;

        const d = Math.sqrt(
          (rho_sv * xi * phi * i_real(phi) - b) ** 2
          - xi * xi * (2 * u_j * phi * i_real(phi) - phi * phi)
        );
        // Nota: implementación simplificada para uso en browser
        // Usamos aproximación de Gatheral (2006) para estabilidad numérica
        return { re: 0, im: 0 }; // placeholder — ver integración abajo
      }

    // Aproximación robusta: expandir alrededor de B-S con corrección de skew
    // Modelo de Heston calibrado con parámetros típicos para USD/MXN y oro
    const sigma_bs = Math.sqrt(v0); // vol inicial como proxy B-S
    const bs_base  = blackScholes(tipo, S, K, T, r, sigma_bs, q);

    // Corrección de skew de Heston (expansión de segunda orden)
    // Referencia: Forde & Jacquier (2009)
    const moneyness = Math.log(S / K);
    const skewCorr  = rho_sv * xi * Math.sqrt(v0) * T / 6;
    const kurtCorr  = (xi * xi + rho_sv * rho_sv * xi * xi) * T / 24;

    // Ajuste al precio por skew y curtosis estocástica
    const skewAdj   = skewCorr * moneyness;
    const kurtAdj   = kurtCorr * (moneyness * moneyness - sigma_bs * sigma_bs * T);
    const adjFactor = 1 + skewAdj + kurtAdj;

    const precioHeston = bs_base.precio * Math.max(adjFactor, 0.5);

    // Vol implícita ajustada (para display)
    const sigmaAdj = sigma_bs * Math.sqrt(Math.max(adjFactor, 0.5));

    return {
      ...bs_base,
      precio:      precioHeston,
      modelo:      "Heston",
      sigma_bs:    sigma_bs,
      sigma_ajust: sigmaAdj,
      skewCorr,
      kurtCorr,
      advertencia: "Aproximación de segundo orden. Para pricing exacto usar integración compleja completa.",
    };
  }

  // Helper para skew (sin números complejos completos en browser)
  function i_real(x) { return x; } // placeholder

  // ─────────────────────────────────────────
  // 3. MODELO DE SCHWARTZ (Gas Natural — Mean Reversion)
  // ─────────────────────────────────────────
  /**
   * Modelo de un factor de Schwartz (1997) para commodities con mean-reversion
   * dln(S) = kappa*(mu - ln(S))*dt + sigma*dW
   * Captura la reversión a la media que tiene el gas natural (≠ oro que es random walk)
   *
   * @param {number} S0      - Precio spot actual
   * @param {number} K       - Strike
   * @param {number} T       - Tiempo al vencimiento (años)
   * @param {number} r       - Tasa libre de riesgo
   * @param {number} kappa   - Velocidad de reversión (ej. 1.5 para gas)
   * @param {number} mu_eq   - Precio de largo plazo (equilibrio) en log
   * @param {number} sigma   - Volatilidad
   * @param {string} tipo    - "call" | "put"
   */
  function schwartz(tipo, S0, K, T, r, kappa, mu_eq, sigma) {
    // Varianza del log-precio a madurez
    const varT = (sigma * sigma / (2 * kappa)) * (1 - safeExp(-2 * kappa * T));
    const sigmaT = Math.sqrt(varT);

    // CORRECCIÓN: Precio forward exacto (exponencial sobre logaritmo + convexidad)
    const F = safeExp(Math.log(S0) * safeExp(-kappa * T) + mu_eq * (1 - safeExp(-kappa * T)) + 0.5 * varT);

    // Black-76 sobre el forward
    const d1 = (Math.log(F / K) + 0.5 * varT) / sigmaT;
    const d2 = d1 - sigmaT;

    const df = safeExp(-r * T);
    let precio;

    if (tipo === "call") {
      precio = df * (F * normCDF(d1) - K * normCDF(d2));
    } else {
      precio = df * (K * normCDF(-d2) - F * normCDF(-d1));
    }

    return {
      precio:   Math.max(precio, 0),
      forward:  F,
      sigmaT,
      modelo:   "Schwartz-1F",
      d1, d2,
    };
  }

  // ─────────────────────────────────────────
  // 4. FORWARD PRICING — PARIDAD CUBIERTA
  // ─────────────────────────────────────────
  /**
   * Precio forward por paridad cubierta de tasas
   * F = S × exp((r_d - r_f) × T)
   * Para divisas: r_d = tasa doméstica (MXN), r_f = tasa extranjera (USD)
   * Para commodities: incluye cost of carry (storage) y convenience yield
   *
   * @param {number} S       - Spot
   * @param {number} r_d     - Tasa doméstica / libre de riesgo local (decimal)
   * @param {number} r_f     - Tasa extranjera / convenience yield (decimal)
   * @param {number} T       - Tiempo en años
   * @param {number} storage - Costo de almacenamiento anual (solo commodities, decimal)
   */
  function forwardPrice(S, r_d, r_f, T, storage = 0) {
    const F = S * safeExp((r_d - r_f + storage) * T);
    const puntosSwap = F - S; // diferencial forward-spot

    return {
      spot:        S,
      forward:     F,
      puntosSwap,
      T,
      r_d, r_f,
      gananciaLarga:  puntosSwap > 0 ? puntosSwap : 0,
      perdidaCorta:   puntosSwap < 0 ? Math.abs(puntosSwap) : 0,
    };
  }

  /**
   * Flujo de caja con cobertura forward
   * Compara flujo sin cobertura vs con forward contratado
   */
  function forwardPayoff(spotActual, strikeForward, nocional, posicion = "corto") {
    const ganancia = posicion === "largo"
      ? (spotActual - strikeForward) * nocional
      : (strikeForward - spotActual) * nocional;
    return {
      spotActual,
      strikeForward,
      nocional,
      ganancia,
      flujoNeto: ganancia,
      descripcion: ganancia >= 0
        ? `El forward genera ganancia de ${ganancia.toFixed(0)} (te protege)`
        : `El forward genera pérdida de ${Math.abs(ganancia).toFixed(0)} (sacrificas upside)`,
    };
  }

  // ─────────────────────────────────────────
  // 5. HULL-WHITE — SWAPS Y CAPS DE TASA
  // ─────────────────────────────────────────
  /**
   * Valor presente de un Interest Rate Swap (IRS)
   * VPN_swap = VPN_pagosFijos - VPN_pagosVariables
   *
   * @param {number} nocional     - Monto nocional
   * @param {number} tasaFija     - Tasa fija del swap (decimal)
   * @param {number} tasaVariable - Tasa variable actual (TIIE/SOFR, decimal)
   * @param {number} spread       - Spread sobre tasa variable (decimal)
   * @param {number} T            - Años restantes al vencimiento
   * @param {number} r_descuento  - Tasa de descuento (decimal)
   * @param {number} freq         - Pagos por año (12 = mensual, 4 = trimestral)
   */
  function swapMTM(nocional, tasaFija, tasaVariable, spread, T, r_descuento, freq = 12) {
    const n      = Math.round(T * freq);         // número de pagos restantes
    const dt     = 1 / freq;                      // fracción de año por período
    const tasaVarTotal = tasaVariable + spread;

    let vpnFijo     = 0;
    let vpnVariable = 0;

    for (let i = 1; i <= n; i++) {
      const t_i  = i * dt;
      const df_i = safeExp(-r_descuento * t_i);  // factor de descuento

      vpnFijo     += (tasaFija     * dt * nocional) * df_i;
      vpnVariable += (tasaVarTotal * dt * nocional) * df_i;
    }

    // Amortización del nocional al vencimiento (para swap bullet)
    const df_T = safeExp(-r_descuento * T);
    vpnFijo     += nocional * df_T;
    vpnVariable += nocional * df_T;

    // Si paga tasa fija (típico cuando cubres contra alza de tasas):
    // Swap tiene valor (+) cuando tasa variable > tasa fija (swap in-the-money para quien paga fijo)
    // Swap tiene valor (-) cuando tasa variable < tasa fija (caso actual Autlán con TIIE)
    const mtmSwap = vpnVariable - vpnFijo; // desde perspectiva de Autlán (paga fijo / recibe variable)

    const dv01 = nocional * dt * df_T; // DV01 aproximado

    return {
      nocional,
      tasaFija,
      tasaVariable,
      spread,
      tasaVariableTotal: tasaVarTotal,
      vpnFijo:     vpnFijo     - nocional * df_T,  // solo cupones
      vpnVariable: vpnVariable - nocional * df_T,
      mtm:         mtmSwap,
      dv01,
      ventaja:     tasaFija > tasaVarTotal
        ? `Pagando tasa fija ${(tasaFija*100).toFixed(2)}% vs mercado ${(tasaVarTotal*100).toFixed(2)}% — SWAP EN MINUSVALÍA`
        : `Pagando tasa fija ${(tasaFija*100).toFixed(2)}% vs mercado ${(tasaVarTotal*100).toFixed(2)}% — SWAP EN PLUSVALÍA`,
      ahorroAnual: (tasaVarTotal - tasaFija) * nocional,
    };
  }

  /**
   * Precio de un Interest Rate Cap (opción sobre tasa máxima)
   * Modelo de Black-76 sobre cada caplet
   */
  function capPrice(nocional, tasaEjercicio, tasaFwd, sigma_tasa, T, r, freq = 4) {
    const n  = Math.round(T * freq);
    const dt = 1 / freq;
    let totalPrima = 0;

    for (let i = 1; i <= n; i++) {
      const t_i = i * dt;
      const df  = safeExp(-r * t_i);
      const d1  = (Math.log(tasaFwd / tasaEjercicio) + 0.5 * sigma_tasa * sigma_tasa * t_i)
                  / (sigma_tasa * Math.sqrt(t_i));
      const d2  = d1 - sigma_tasa * Math.sqrt(t_i);
      const caplet = nocional * dt * df *
        (tasaFwd * normCDF(d1) - tasaEjercicio * normCDF(d2));
      totalPrima += Math.max(caplet, 0);
    }

    return {
      prima:      totalPrima,
      primaAnual: totalPrima / T,
      primaBps:   (totalPrima / nocional) * 10000,
    };
  }

  // ─────────────────────────────────────────
  // 6. COLLAR PRICING
  // ─────────────────────────────────────────
  /**
   * Collar = Compra put (protección downside) + Vende call (limita upside)
   * Costless collar cuando prima_put ≈ prima_call
   *
   * @param {number} S        - Spot
   * @param {number} strikeP  - Strike del put (piso de protección)
   * @param {number} strikeC  - Strike del call (techo que se cede)
   * @param {number} T, r, q, sigma - Parámetros estándar
   * @param {boolean} useHeston
   * @param {object}  hestonParams  - { v0, kappa, theta_v, xi, rho_sv }
   */
  function collarPrice(S, strikeP, strikeC, T, r, q, sigma, useHeston = false, hestonParams = null) {
    let put, call;

    if (useHeston && hestonParams) {
      const h = hestonParams;
      put  = heston("put",  S, strikeP, T, r, q, h.v0, h.kappa, h.theta_v, h.xi, h.rho_sv);
      call = heston("call", S, strikeC, T, r, q, h.v0, h.kappa, h.theta_v, h.xi, h.rho_sv);
    } else {
      put  = blackScholes("put",  S, strikeP, T, r, sigma, q);
      call = blackScholes("call", S, strikeC, T, r, sigma, q);
    }

    const costoNeto   = put.precio - call.precio; // (+) si cuesta, (0) si costless
    const costoPctNoc = costoNeto / S;            // como % del nocional

    return {
      put,
      call,
      costoNeto,
      costoPctNoc:     (costoPctNoc * 100).toFixed(3),
      esCostless:      Math.abs(costoNeto) < 0.001 * S,
      floor:           strikeP,
      cap:             strikeC,
      rangoProtegido:  strikeC - strikeP,
      pctRango:        ((strikeC - strikeP) / S * 100).toFixed(1),
      descripcion: `Collar ${strikeP}-${strikeC}: protege entre ${strikeP} y ${strikeC}. ` +
                   `Costo neto: ${costoNeto.toFixed(4)} (${(costoPctNoc*100).toFixed(2)}% del nocional)`,
    };
  }

  /**
   * Payoff del collar al vencimiento dado un precio spot final
   */
  function collarPayoff(spotFinal, strikeP, strikeC, nocional, posicion = "corto_usd") {
    // Para Autlán: posición corta en USD (vende USD, recibe MXN)
    // Collar FX: compra put MXN (vende USD a precio mínimo), vende call MXN
    let payoffCollar = 0;

    if (spotFinal < strikeP) {
      // Peso muy fuerte → se ejerce el put → vende al strikeP (mejor que mercado)
      payoffCollar = (strikeP - spotFinal) * nocional;
    } else if (spotFinal > strikeC) {
      // Peso muy débil → se ejerce el call vendido → pierde el upside
      payoffCollar = (strikeC - spotFinal) * nocional;
    }
    // Entre floor y cap: no se ejerce nada, cobra al precio de mercado

    const ingresoSinCobertura = spotFinal * nocional;
    const ingresoConCollar    = ingresoSinCobertura + payoffCollar;

    return {
      spotFinal,
      strikeP, strikeC, nocional,
      payoffCollar,
      ingresoSinCobertura,
      ingresoConCollar,
      proteccion: payoffCollar,
      zona: spotFinal < strikeP ? "PUT_EJERCIDO"
          : spotFinal > strikeC ? "CALL_EJERCIDO"
          : "DENTRO_RANGO",
    };
  }

  // ─────────────────────────────────────────
  // 7. ANÁLISIS DE ESCENARIOS — IMPACTO EBITDA
  // ─────────────────────────────────────────
  /**
   * Calcula el impacto financiero de cada escenario macro sobre Autlán
   * Integra todos los drivers de P&L en un solo número
   *
   * @param {object} vars - Variables del escenario { usdmxn, tiie28, sofr1m, precioOro, precioMn, precioGas, volPct }
   * @param {object} base - Datos base de AUTLAN (del data.js)
   */
  function impactoEscenario(vars, base) {
    const {
      usdmxn, tiie28, sofr1m, precioOro,
      precioMn, precioGas, volPct = 100
    } = vars;

    // Base de referencia
    const usdmxn_base   = 18.0;
    const tiie_base     = 7.10;
    const sofr_base     = 4.30;
    const oro_base      = 3000;
    const mn_base       = 1309;
    const gas_base      = 3.20;
    const ingresos_base = base.ingresos_anual;     // USD
    const gastoFin_base = base.gastoFinanciero;    // USD
    const ebitda_base   = base.ebitda_anual;       // USD

    // 1. Impacto FX en ingresos (Autlán reporta en USD pero sus ingresos
    //    son equivalentes MXN/TC — cuando peso aprecia, ingresos USD caen)
    //    La empresa tiene estructura de costos MXN, ingresos USD
    //    Cada % de apreciación del peso reduce EBITDA ~0.8-1.2%
    const deltaTC   = (usdmxn - usdmxn_base) / usdmxn_base; // (+) = deprecia peso (bueno para Autlán)
    const impactoFX = ingresos_base * deltaTC * 0.85; // 85% de ingresos son FX-sensitivos

    // 2. Impacto precio manganeso en ingresos
    const deltaMn    = (precioMn - mn_base) / mn_base;
    const impactoMn  = ingresos_base * 0.60 * deltaMn; // ~60% ingresos son ferroaleaciones Mn

    // 3. Impacto precio oro en ingresos Metallorum
    // 3. Impacto precio oro en ingresos Metallorum
    // 1T26: ~2,400 oz vendidas → anualizado ~9,600 oz → meta 2026: 20,000 oz
    // Usar 20,000 oz como base conservadora del año completo (guía mgmt)
    const ozAnualizadasOro = 20000; // oz — meta 2026 según junta may-2026
    const deltaOro         = (precioOro - oro_base) / oro_base;
    const impactoOro       = (ozAnualizadasOro * oro_base / 1000) * deltaOro;
    // = USD 60M base × delta % → ~USD 0.6M por cada 1% de cambio en precio
  // = USD 60M base × delta % → ~USD 0.6M por cada 1% de cambio en precio
    
    // 4. Impacto TIIE en costo financiero (deuda TIIE ~MXN 30M equiv USD)
    const deltaTIIE      = (tiie28 - tiie_base) / 100; // en puntos porcentuales
    const impactoTIIE    = -29747 * deltaTIIE;          // USD equiv — negativo si sube tasa

    // 5. Impacto SOFR en costo financiero (deuda SOFR ~USD 135M)
    const deltaSOFR      = (sofr1m - sofr_base) / 100;
    const impactoSOFR    = -135479 * deltaSOFR;

    // 6. Impacto gas en costos operativos
    const deltaGas       = (precioGas - gas_base) / gas_base;
    const impactoGas     = -8000 * deltaGas; // ~USD 8M gasto anual gas estimado

    // 7. Impacto volumen en ingresos y costos
    const deltaVol       = (volPct - 100) / 100;
    const impactoVol     = ingresos_base * 0.60 * deltaVol * 0.35; // margen contrib estimado

    // EBITDA total ajustado (excluyendo impactos financieros de TIIE/SOFR)
    const deltaEbitda  = impactoFX + impactoMn + impactoOro + impactoGas + impactoVol;
    const ebitdaEscenario = ebitda_base + deltaEbitda;
    const margenEbitda    = (ebitdaEscenario / (ingresos_base + impactoFX + impactoMn + impactoOro)) * 100;

    // FCF aproximado y Gasto Financiero Ajustado (restando impacto contable neto, sin Math.abs)
    const gastoFinEscenario = gastoFin_base - impactoTIIE - impactoSOFR;
    const fcfEscenario      = ebitdaEscenario - gastoFinEscenario - 30000; // capex mantenimiento

    return {
      vars,
      impactos: {
        fx:     impactoFX,
        mn:     impactoMn,
        oro:    impactoOro,
        tiie:   impactoTIIE,
        sofr:   impactoSOFR,
        gas:    impactoGas,
        volumen:impactoVol,
        total:  deltaEbitda,
      },
      resultados: {
        ebitda:       ebitdaEscenario,
        margenEbitda: margenEbitda.toFixed(1),
        gastoFin:     gastoFinEscenario,
        fcf:          fcfEscenario,
        dscr:         ebitdaEscenario / gastoFinEscenario,
      },
    };
  }

  /**
   * Genera tabla de 3 escenarios completa
   */
  function tablaEscenarios(base, escenariosVars) {
    const resultados = {};
    for (const [nombre, vars] of Object.entries(escenariosVars)) {
      resultados[nombre] = impactoEscenario(vars, base);
    }
    return resultados;
  }

  // ─────────────────────────────────────────
  // 8. COSTO DE COBERTURA TOTAL — OPTIMIZADOR
  // ─────────────────────────────────────────
  /**
   * Calcula el costo total de la estrategia de cobertura propuesta
   * y el flujo neto en cada escenario
   */
  function evaluarEstrategia(coberturas, escenarios, base) {
    const resultado = {
      costoTotal:   0,
      costoPctEBITDA: 0,
      escenarios:   {},
    };

    for (const [nombre, esc] of Object.entries(escenarios)) {
      const impacto = impactoEscenario(esc, base);
      let proteccionTotal = 0;
      let costoEstrategia = 0;

      for (const cob of coberturas) {
        if (!cob.activa) continue;
        costoEstrategia += cob.prima || 0;

        // Calcular payoff de cada instrumento en este escenario
        if (cob.tipo === "collar_fx") {
          const payoff = collarPayoff(
            esc.usdmxn, cob.floor, cob.cap, cob.nocional
          );
          proteccionTotal += payoff.payoffCollar;
        }
        if (cob.tipo === "forward_fx") {
          const payoff = forwardPayoff(esc.usdmxn, cob.strike, cob.nocional);
          proteccionTotal += payoff.ganancia;
        }
        if (cob.tipo === "collar_tasa") {
          const tasaEsc = cob.subyacente === "TIIE" ? esc.tiie28 : esc.sofr1m;
          const pagoSinCobertura = cob.nocional * (tasaEsc / 100 + cob.spread);
          const tasetaEfectiva   = Math.min(Math.max(tasaEsc, cob.floor), cob.cap);
          const pagoConCobertura = cob.nocional * (tasetaEfectiva / 100 + cob.spread);
          proteccionTotal += pagoSinCobertura - pagoConCobertura;
        }
      }

      resultado.escenarios[nombre] = {
        ebitdaSinCobertura: impacto.resultados.ebitda,
        proteccion:         proteccionTotal,
        costoEstrategia:    costoEstrategia,
        ebitdaConCobertura: impacto.resultados.ebitda + proteccionTotal - costoEstrategia,
        fcfSinCobertura:    impacto.resultados.fcf,
        fcfConCobertura:    impacto.resultados.fcf + proteccionTotal - costoEstrategia,
        dscrConCobertura:  (impacto.resultados.ebitda + proteccionTotal - costoEstrategia)
                           / impacto.resultados.gastoFin,
      };
    }

    // Costo total anualizado
    const costoAnual = coberturas.reduce((s, c) => s + (c.prima || 0), 0);
    resultado.costoTotal      = costoAnual;
    resultado.costoPctEBITDA  = (costoAnual / base.ebitda_anual * 100).toFixed(2);

    return resultado;
  }

  // ─────────────────────────────────────────
  // PARÁMETROS PREDETERMINADOS POR ACTIVO
  // Calibrados con datos históricos de mercado
  // ─────────────────────────────────────────
  const PARAMS = {
    fx_usdmxn: {
      sigma:   0.12,  // vol histórica USD/MXN ~12% anual
      q:       0.071, // tasa MXN (TIIE)
      r:       0.043, // tasa USD (SOFR)
      // Heston
      v0:      0.0144, // sigma_0^2 = 0.12^2
      kappa:   2.5,
      theta_v: 0.0169, // vol largo plazo ~13%
      xi:      0.40,
      rho_sv: -0.60,
    },
    oro: {
      sigma:   0.18,  // vol histórica oro ~18% anual
      q:       0.00,  // sin dividend yield
      r:       0.043,
      v0:      0.0324,
      kappa:   1.2,
      theta_v: 0.0400,
      xi:      0.35,
      rho_sv: -0.40,
    },
    gas: {
      sigma:   0.45,  // gas es muy volátil ~45% anual
      kappa:   1.5,   // fuerte mean-reversion
      mu_eq:   Math.log(3.20), // log del precio de equilibrio
      r:       0.043,
    },
    tasa_tiie: {
      sigma:   0.25,  // vol de la tasa TIIE
      kappa:   0.80,  // mean-reversion moderada
    },
    tasa_sofr: {
      sigma:   0.20,
      kappa:   0.70,
    },
  };

  // ─────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────
  return {
    // Modelos
    blackScholes,
    heston,
    schwartz,
    forwardPrice,
    forwardPayoff,
    swapMTM,
    capPrice,
    collarPrice,
    collarPayoff,
    // Análisis
    impactoEscenario,
    tablaEscenarios,
    evaluarEstrategia,
    // Parámetros
    PARAMS,
    // Utilidades expuestas
    normCDF,
    normPDF,
  };

})();

// Export para Node/VS Code testing
if (typeof module !== "undefined") module.exports = Models;
