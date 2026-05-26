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

  function normPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  function safeExp(x) {
    return x > 700 ? Infinity : x < -700 ? 0 : Math.exp(x);
  }

  // ─────────────────────────────────────────
  // 1. BLACK-SCHOLES ESTÁNDAR
  // ─────────────────────────────────────────
  function blackScholes(tipo, S, K, T, r, sigma, q = 0) {
    if (T <= 0) {
      const intrinseco = tipo === "call"
        ? Math.max(S - K, 0)
        : Math.max(K - S, 0);
      const deltaFinal = tipo === "call"
        ? (S > K ? 1 : 0)
        : (S < K ? -1 : 0);
      return { precio: intrinseco, delta: deltaFinal,
               gamma: 0, vega: 0, theta: 0, rho: 0, d1: 0, d2: 0 };
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
  function heston(tipo, S, K, T, r, q, v0, kappa, theta_v, xi, rho_sv) {
    const sigma_bs = Math.sqrt(v0);
    const bs_base  = blackScholes(tipo, S, K, T, r, sigma_bs, q);

    const moneyness = Math.log(S / K);
    const skewCorr  = rho_sv * xi * Math.sqrt(v0) * T / 6;
    const kurtCorr  = (xi * xi + rho_sv * rho_sv * xi * xi) * T / 24;

    const skewAdj   = skewCorr * moneyness;
    const kurtAdj   = kurtCorr * (moneyness * moneyness - sigma_bs * sigma_bs * T);
    const adjFactor = 1 + skewAdj + kurtAdj;

    const precioHeston = bs_base.precio * Math.max(adjFactor, 0.5);
    const sigmaAdj     = sigma_bs * Math.sqrt(Math.max(adjFactor, 0.5));

    return {
      ...bs_base,
      precio:      precioHeston,
      modelo:      "Heston",
      sigma_bs,
      sigma_ajust: sigmaAdj,
      skewCorr,
      kurtCorr,
      advertencia: "Aproximación de segundo orden. Para pricing exacto usar integración compleja completa.",
    };
  }

  function i_real(x) { return x; }

  // ─────────────────────────────────────────
  // 3. MODELO DE SCHWARTZ (Gas Natural — Mean Reversion)
  // ─────────────────────────────────────────
  function schwartz(tipo, S0, K, T, r, kappa, mu_eq, sigma) {
    const varT   = (sigma * sigma / (2 * kappa)) * (1 - safeExp(-2 * kappa * T));
    const sigmaT = Math.sqrt(varT);
    const F      = safeExp(
      Math.log(S0) * safeExp(-kappa * T) +
      mu_eq * (1 - safeExp(-kappa * T)) +
      0.5 * varT
    );

    const d1 = (Math.log(F / K) + 0.5 * varT) / sigmaT;
    const d2 = d1 - sigmaT;
    const df = safeExp(-r * T);

    const precio = tipo === "call"
      ? df * (F * normCDF(d1) - K * normCDF(d2))
      : df * (K * normCDF(-d2) - F * normCDF(-d1));

    return {
      precio: Math.max(precio, 0),
      forward: F,
      sigmaT,
      modelo: "Schwartz-1F",
      d1, d2,
    };
  }

  // ─────────────────────────────────────────
  // 4. FORWARD PRICING — PARIDAD CUBIERTA
  // ─────────────────────────────────────────
  function forwardPrice(S, r_d, r_f, T, storage = 0) {
    const F          = S * safeExp((r_d - r_f + storage) * T);
    const puntosSwap = F - S;
    return {
      spot: S,
      forward: F,
      puntosSwap,
      T, r_d, r_f,
      gananciaLarga: puntosSwap > 0 ? puntosSwap : 0,
      perdidaCorta:  puntosSwap < 0 ? Math.abs(puntosSwap) : 0,
    };
  }

  function forwardPayoff(spotActual, strikeForward, nocional, posicion = "corto") {
    const ganancia = posicion === "largo"
      ? (spotActual - strikeForward) * nocional
      : (strikeForward - spotActual) * nocional;
    return {
      spotActual, strikeForward, nocional, ganancia,
      flujoNeto: ganancia,
      descripcion: ganancia >= 0
        ? `El forward genera ganancia de ${ganancia.toFixed(0)} (te protege)`
        : `El forward genera pérdida de ${Math.abs(ganancia).toFixed(0)} (sacrificas upside)`,
    };
  }

  // ─────────────────────────────────────────
  // 5. HULL-WHITE — SWAPS Y CAPS DE TASA
  // ─────────────────────────────────────────
  function swapMTM(nocional, tasaFija, tasaVariable, spread, T, r_descuento, freq = 12) {
    const n            = Math.round(T * freq);
    const dt           = 1 / freq;
    const tasaVarTotal = tasaVariable + spread;

    let vpnFijo = 0, vpnVariable = 0;

    for (let i = 1; i <= n; i++) {
      const t_i  = i * dt;
      const df_i = safeExp(-r_descuento * t_i);
      vpnFijo     += (tasaFija     * dt * nocional) * df_i;
      vpnVariable += (tasaVarTotal * dt * nocional) * df_i;
    }

    const df_T = safeExp(-r_descuento * T);
    vpnFijo     += nocional * df_T;
    vpnVariable += nocional * df_T;

    const mtmSwap = vpnVariable - vpnFijo;
    const dv01    = nocional * dt * df_T;

    return {
      nocional, tasaFija, tasaVariable, spread,
      tasaVariableTotal: tasaVarTotal,
      vpnFijo:     vpnFijo     - nocional * df_T,
      vpnVariable: vpnVariable - nocional * df_T,
      mtm:         mtmSwap,
      dv01,
      ventaja: tasaFija > tasaVarTotal
        ? `Pagando tasa fija ${(tasaFija*100).toFixed(2)}% vs mercado ${(tasaVarTotal*100).toFixed(2)}% — SWAP EN MINUSVALÍA`
        : `Pagando tasa fija ${(tasaFija*100).toFixed(2)}% vs mercado ${(tasaVarTotal*100).toFixed(2)}% — SWAP EN PLUSVALÍA`,
      ahorroAnual: (tasaVarTotal - tasaFija) * nocional,
    };
  }

  function capPrice(nocional, tasaEjercicio, tasaFwd, sigma_tasa, T, r, freq = 4) {
    const n  = Math.round(T * freq);
    const dt = 1 / freq;
    let totalPrima = 0;

    for (let i = 1; i <= n; i++) {
      const t_i   = i * dt;
      const df    = safeExp(-r * t_i);
      const d1    = (Math.log(tasaFwd / tasaEjercicio) + 0.5 * sigma_tasa * sigma_tasa * t_i)
                    / (sigma_tasa * Math.sqrt(t_i));
      const d2    = d1 - sigma_tasa * Math.sqrt(t_i);
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

    const costoNeto   = put.precio - call.precio;
    const costoPctNoc = costoNeto / S;

    return {
      put, call,
      costoNeto,
      costoPctNoc:    (costoPctNoc * 100).toFixed(3),
      esCostless:     Math.abs(costoNeto) < 0.001 * S,
      floor:          strikeP,
      cap:            strikeC,
      rangoProtegido: strikeC - strikeP,
      pctRango:       ((strikeC - strikeP) / S * 100).toFixed(1),
      descripcion: `Collar ${strikeP}-${strikeC}: protege entre ${strikeP} y ${strikeC}. ` +
                   `Costo neto: ${costoNeto.toFixed(4)} (${(costoPctNoc*100).toFixed(2)}% del nocional)`,
    };
  }

  function collarPayoff(spotFinal, strikeP, strikeC, nocional) {
    let payoffCollar = 0;

    if (spotFinal < strikeP) {
      payoffCollar = (strikeP - spotFinal) * nocional;
    } else if (spotFinal > strikeC) {
      payoffCollar = (strikeC - spotFinal) * nocional;
    }

    const ingresoSinCobertura = spotFinal * nocional;
    const ingresoConCollar    = ingresoSinCobertura + payoffCollar;

    return {
      spotFinal, strikeP, strikeC, nocional,
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
  function impactoEscenario(vars, base) {
    const {
      usdmxn, tiie28, sofr1m, precioOro,
      precioMn, precioGas, volPct = 100
    } = vars;

    // Bases de referencia
    const usdmxn_base   = 18.0;
    const tiie_base     = 7.10;
    const sofr_base     = 4.30;
    const oro_base      = 3000;
    const mn_base       = 1309;
    const gas_base      = 3.20;
    const ingresos_base = base.ingresos_anual;
    const gastoFin_base = base.gastoFinanciero;
    const ebitda_base   = base.ebitda_anual;

    // 1. Impacto FX
    // Ingresos 100% USD, ~60% costos en MXN → depreciación del peso mejora EBITDA
    const deltaTC   = (usdmxn - usdmxn_base) / usdmxn_base;
    const impactoFX = ingresos_base * deltaTC * 0.85;

    // 2. Impacto precio manganeso
    const deltaMn   = (precioMn - mn_base) / mn_base;
    const impactoMn = ingresos_base * 0.60 * deltaMn;

    // 3. Impacto precio oro — Metallorum
    // Meta 2026: 20,000 oz (junta may-2026). Base: $3,000/oz → USD 60M ingresos base
    const ozAnualizadasOro = 20000;
    const deltaOro         = (precioOro - oro_base) / oro_base;
    const impactoOro       = (ozAnualizadasOro * oro_base / 1000) * deltaOro;

    // 4. Impacto TIIE en costo financiero (deuda TIIE ~MXN 29.7M equiv USD)
    const deltaTIIE   = (tiie28 - tiie_base) / 100;
    const impactoTIIE = -29747 * deltaTIIE;

    // 5. Impacto SOFR en costo financiero (deuda SOFR ~USD 135.5M)
    const deltaSOFR   = (sofr1m - sofr_base) / 100;
    const impactoSOFR = -135479 * deltaSOFR;

    // 6. Impacto gas en costos operativos
    const deltaGas   = (precioGas - gas_base) / gas_base;
    const impactoGas = -8000 * deltaGas;

    // 7. Impacto volumen
    const deltaVol   = (volPct - 100) / 100;
    const impactoVol = ingresos_base * 0.60 * deltaVol * 0.35;

    // EBITDA ajustado
    const deltaEbitda     = impactoFX + impactoMn + impactoOro + impactoGas + impactoVol;
    const ebitdaEscenario = ebitda_base + deltaEbitda;
    const margenEbitda    = (ebitdaEscenario /
      (ingresos_base + impactoFX + impactoMn + impactoOro)) * 100;

    // FCF y gasto financiero ajustado
    const gastoFinEscenario = gastoFin_base - impactoTIIE - impactoSOFR;
    const fcfEscenario      = ebitdaEscenario - gastoFinEscenario - 30000;

    return {
      vars,
      impactos: {
        fx:      impactoFX,
        mn:      impactoMn,
        oro:     impactoOro,
        tiie:    impactoTIIE,
        sofr:    impactoSOFR,
        gas:     impactoGas,
        volumen: impactoVol,
        total:   deltaEbitda,
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

  function tablaEscenarios(base, escenariosVars) {
    const resultados = {};
    for (const [nombre, vars] of Object.entries(escenariosVars)) {
      resultados[nombre] = impactoEscenario(vars, base);
    }
    return resultados;
  }

  // ─────────────────────────────────────────
  // 8. EVALUADOR DE ESTRATEGIA DE COBERTURA
  // ─────────────────────────────────────────
  function evaluarEstrategia(coberturas, escenarios, base) {
    const resultado = {
      costoTotal:     0,
      costoPctEBITDA: 0,
      escenarios:     {},
    };

    for (const [nombre, esc] of Object.entries(escenarios)) {
      const impacto = impactoEscenario(esc, base);
      let proteccionTotal = 0;
      let costoEstrategia = 0;

      for (const cob of coberturas) {
        if (!cob.activa) continue;
        costoEstrategia += cob.prima || 0;

        if (cob.tipo === "collar_fx") {
          const payoff = collarPayoff(esc.usdmxn, cob.floor, cob.cap, cob.nocional);
          proteccionTotal += payoff.payoffCollar;
        }
        if (cob.tipo === "forward_fx") {
          const payoff = forwardPayoff(esc.usdmxn, cob.strike, cob.nocional);
          proteccionTotal += payoff.ganancia;
        }
        if (cob.tipo === "collar_tasa") {
          const tasaEsc          = cob.subyacente === "TIIE" ? esc.tiie28 : esc.sofr1m;
          const pagoSinCobertura = cob.nocional * (tasaEsc / 100 + cob.spread);
          const tasaEfectiva     = Math.min(Math.max(tasaEsc, cob.floor), cob.cap);
          const pagoConCobertura = cob.nocional * (tasaEfectiva / 100 + cob.spread);
          proteccionTotal += pagoSinCobertura - pagoConCobertura;
        }
      }

      resultado.escenarios[nombre] = {
        ebitdaSinCobertura: impacto.resultados.ebitda,
        proteccion:         proteccionTotal,
        costoEstrategia,
        ebitdaConCobertura: impacto.resultados.ebitda + proteccionTotal - costoEstrategia,
        fcfSinCobertura:    impacto.resultados.fcf,
        fcfConCobertura:    impacto.resultados.fcf + proteccionTotal - costoEstrategia,
        dscrConCobertura:  (impacto.resultados.ebitda + proteccionTotal - costoEstrategia)
                           / impacto.resultados.gastoFin,
      };
    }

    const costoAnual          = coberturas.reduce((s, c) => s + (c.prima || 0), 0);
    resultado.costoTotal      = costoAnual;
    resultado.costoPctEBITDA  = (costoAnual / base.ebitda_anual * 100).toFixed(2);

    return resultado;
  }

  // ─────────────────────────────────────────
  // PARÁMETROS POR ACTIVO
  // ─────────────────────────────────────────
  const PARAMS = {
    fx_usdmxn: {
      sigma:   0.12,
      q:       0.071,
      r:       0.043,
      v0:      0.0144,
      kappa:   2.5,
      theta_v: 0.0169,
      xi:      0.40,
      rho_sv: -0.60,
    },
    oro: {
      sigma:   0.18,
      q:       0.00,
      r:       0.043,
      v0:      0.0324,
      kappa:   1.2,
      theta_v: 0.0400,
      xi:      0.35,
      rho_sv: -0.40,
    },
    gas: {
      sigma:   0.45,
      kappa:   1.5,
      mu_eq:   Math.log(3.20),
      r:       0.043,
    },
    tasa_tiie: {
      sigma:   0.25,
      kappa:   0.80,
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
    blackScholes,
    heston,
    schwartz,
    forwardPrice,
    forwardPayoff,
    swapMTM,
    capPrice,
    collarPrice,
    collarPayoff,
    impactoEscenario,
    tablaEscenarios,
    evaluarEstrategia,
    PARAMS,
    normCDF,
    normPDF,
  };

})();

if (typeof module !== "undefined") module.exports = Models;
