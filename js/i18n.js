/**
 * js/i18n.js — Sistema de Traducción ES / EN
 * Autlán Risk Desk Dashboard
 *
 * Estrategia: Opción C — traducción via API de Claude en runtime.
 * Cuando el usuario cambia a EN, se traduce el innerHTML completo
 * de cada página activa con Claude Sonnet. El resultado se cachea
 * en memoria para no repetir llamadas en la misma sesión.
 *
 * Flujo:
 *   1. Usuario hace clic en EN
 *   2. Se guarda el HTML original de la página activa
 *   3. Se llama a la API con el HTML + prompt de traducción
 *   4. Se reemplaza el innerHTML con la traducción
 *   5. Si el usuario vuelve a ES, se restaura el HTML original
 *   6. Si navega a otra página en EN, se traduce esa página también
 *   7. Todo se cachea — cada página se traduce una sola vez por sesión
 */

window.I18N = (() => {

  const STORAGE_KEY = "autlan_lang";
  let activeLang = localStorage.getItem(STORAGE_KEY) || "es";

  // Cache de traducciones por página — clave: pageId, valor: { original, translated }
  const _cache = {};

  // Estado de traducción en curso (evita llamadas paralelas)
  const _inProgress = {};

  // ─────────────────────────────────────────
  // PROMPT DE SISTEMA PARA CLAUDE
  // ─────────────────────────────────────────
  const SYSTEM_PROMPT = `You are a professional financial translator specializing in derivatives, hedging, and mining industry terminology. You will receive HTML from a financial risk dashboard for a Mexican manganese mining company (Autlán).

RULES — follow exactly:
1. Translate ALL visible Spanish text to English.
2. Keep ALL HTML tags, attributes, classes, and inline styles EXACTLY as-is.
3. Keep ALL numbers, currency values, percentages, and dates EXACTLY as-is.
4. Keep ALL ticker symbols, proper nouns (Autlán, Metallorum, EMD, Santander, COMEX, BMV, XBRL, SOFR, TIIE, EURIBOR), and acronyms EXACTLY as-is.
5. Translate financial terms accurately: UAFIRDA→EBITDA, utilidad→profit, pérdida→loss, cobertura→hedge/hedging, collar→collar, vencimiento→maturity, tasa→rate, deuda→debt, apalancamiento→leverage.
6. Quarter notation: 1T26→1Q26, 4T25→4Q25, etc.
7. Return ONLY the translated HTML — no explanations, no markdown, no code blocks.
8. If a piece of text is already in English, leave it as-is.`;

  // ─────────────────────────────────────────
  // LLAMADA A LA API
  // ─────────────────────────────────────────
  async function translateWithAPI(html) {
    // Limpiar el HTML de scripts embebidos para no enviarlos
    const clean = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Translate this financial dashboard HTML to English:\n\n${clean}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    // Limpiar posibles backticks si Claude los incluyó
    return text.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();
  }

  // ─────────────────────────────────────────
  // TRADUCIR UNA PÁGINA
  // ─────────────────────────────────────────
  async function translatePage(pageId) {
    const container = document.getElementById(`${pageId}-content`);
    if (!container) return;

    // Si ya está en caché, aplicar directamente
    if (_cache[pageId]?.translated) {
      container.innerHTML = _cache[pageId].translated;
      return;
    }

    // Si ya hay una traducción en curso para esta página, esperar
    if (_inProgress[pageId]) return;

    // Guardar HTML original si no está guardado
    if (!_cache[pageId]) {
      _cache[pageId] = { original: container.innerHTML, translated: null };
    }

    // Si el contenido está vacío (página lazy no renderizada), esperar
    if (!container.innerHTML.trim()) return;

    _inProgress[pageId] = true;

    // Mostrar indicador de carga
    _showTranslatingBadge(pageId, true);

    try {
      const translated = await translateWithAPI(container.innerHTML);
      _cache[pageId].translated = translated;
      container.innerHTML = translated;
    } catch (err) {
      console.error(`[i18n] Error traduciendo ${pageId}:`, err);
      if (window.showToast) {
        showToast("Translation error — check API connection", "error");
      }
    } finally {
      _inProgress[pageId] = false;
      _showTranslatingBadge(pageId, false);
    }
  }

  // ─────────────────────────────────────────
  // RESTAURAR PÁGINA AL ESPAÑOL
  // ─────────────────────────────────────────
  function restorePage(pageId) {
    const container = document.getElementById(`${pageId}-content`);
    if (!container) return;

    if (_cache[pageId]?.original) {
      container.innerHTML = _cache[pageId].original;
    }
  }

  // ─────────────────────────────────────────
  // BADGE "TRANSLATING..."
  // ─────────────────────────────────────────
  function _showTranslatingBadge(pageId, show) {
    const badgeId = `translating-badge-${pageId}`;
    let badge = document.getElementById(badgeId);

    if (show) {
      if (badge) return;
      badge = document.createElement("div");
      badge.id = badgeId;
      badge.style.cssText = `
        position: fixed;
        top: 16px;
        right: 50%;
        transform: translateX(50%);
        background: var(--accent);
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        animation: fadeIn 0.2s ease;
      `;
      badge.innerHTML = `
        <span style="display:inline-block; width:8px; height:8px;
                     border-radius:50%; background:#fff;
                     animation: pulse 1s infinite;"></span>
        Translating...
      `;
      document.body.appendChild(badge);
    } else {
      if (badge) badge.remove();
    }
  }

  // ─────────────────────────────────────────
  // OBTENER PÁGINA ACTIVA
  // ─────────────────────────────────────────
  function _getActivePageId() {
    const activeNav = document.querySelector(".nav-item.active");
    return activeNav?.dataset?.page || null;
  }

  // ─────────────────────────────────────────
  // TOPBAR — sidebar items
  // ─────────────────────────────────────────
  const STATIC_LABELS = {
    es: {
      sidebar_title:    "Mesa de Riesgos",
      nav_general:      "GENERAL",
      nav_dashboard:    "Dashboard",
      nav_perfil:       "Perfil Autlán",
      nav_escenarios:   "Escenarios & Inputs",
      nav_coberturas:   "COBERTURAS",
      nav_fx:           "Tipo de Cambio",
      nav_oro:          "Precio del Oro",
      nav_gas:          "Gas Natural",
      nav_tasa:         "Tasa de Interés",
      nav_manganeso:    "Manganeso",
      nav_analisis:     "ANÁLISIS",
      nav_secundarios:  "Riesgos Secundarios",
      nav_estrategia:   "Estrategia Óptima",
      nav_docs:         "Documentación",
      pill_base:        "Base",
      pill_optimista:   "Optimista",
      pill_adverso:     "Adverso",
      label_ebitda:     "EBITDA proy.",
      label_tc:         "USD/MXN",
      breadcrumbs: {
        dashboard:   "Dashboard",
        perfil:      "Perfil Autlán",
        escenarios:  "Escenarios & Inputs",
        fx:          "Tipo de Cambio",
        oro:         "Precio del Oro",
        gas:         "Gas Natural",
        tasa:        "Tasa de Interés",
        manganeso:   "Manganeso",
        secundarios: "Riesgos Secundarios",
        estrategia:  "Estrategia Óptima",
        docs:        "Documentación del Modelo",
      }
    },
    en: {
      sidebar_title:    "Risk Desk",
      nav_general:      "GENERAL",
      nav_dashboard:    "Dashboard",
      nav_perfil:       "Autlán Profile",
      nav_escenarios:   "Scenarios & Inputs",
      nav_coberturas:   "HEDGING",
      nav_fx:           "Exchange Rate",
      nav_oro:          "Gold Price",
      nav_gas:          "Natural Gas",
      nav_tasa:         "Interest Rate",
      nav_manganeso:    "Manganese",
      nav_analisis:     "ANALYSIS",
      nav_secundarios:  "Secondary Risks",
      nav_estrategia:   "Optimal Strategy",
      nav_docs:         "Documentation",
      pill_base:        "Base",
      pill_optimista:   "Optimistic",
      pill_adverso:     "Adverse",
      label_ebitda:     "Proj. EBITDA",
      label_tc:         "USD/MXN",
      breadcrumbs: {
        dashboard:   "Dashboard",
        perfil:      "Autlán Profile",
        escenarios:  "Scenarios & Inputs",
        fx:          "Exchange Rate",
        oro:         "Gold Price",
        gas:         "Natural Gas",
        tasa:        "Interest Rate",
        manganeso:   "Manganese",
        secundarios: "Secondary Risks",
        estrategia:  "Optimal Strategy",
        docs:        "Model Documentation",
      }
    }
  };

  function _translateStaticUI(lang) {
    const L = STATIC_LABELS[lang];

    // Logo subtitle
    const logoSub = document.querySelector(".logo-sub");
    if (logoSub) logoSub.textContent = L.sidebar_title;

    // Nav section labels
    const sectionLabels = document.querySelectorAll(".nav-section-label");
    const sectionKeys = ["nav_general", "nav_coberturas", "nav_analisis"];
    sectionLabels.forEach((el, i) => {
      if (sectionKeys[i]) el.textContent = L[sectionKeys[i]];
    });

    // Nav items
    const navMap = {
      dashboard:   "nav_dashboard",
      perfil:      "nav_perfil",
      escenarios:  "nav_escenarios",
      fx:          "nav_fx",
      oro:         "nav_oro",
      gas:         "nav_gas",
      tasa:        "nav_tasa",
      manganeso:   "nav_manganeso",
      secundarios: "nav_secundarios",
      estrategia:  "nav_estrategia",
      docs:        "nav_docs",
    };

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
      const page = item.dataset.page;
      const key  = navMap[page];
      if (!key) return;
      const label = item.querySelector(".nav-label");
      if (label) label.textContent = L[key];
    });

    // Scenario pills
    document.querySelectorAll(".pill[data-esc]").forEach(pill => {
      const esc = pill.dataset.esc;
      if (esc === "base")      pill.textContent = L.pill_base;
      if (esc === "optimista") pill.textContent = L.pill_optimista;
      if (esc === "adverso")   pill.textContent = L.pill_adverso;
    });

    // Topbar labels
    const tcLabel = document.querySelector(".topbar-stat .stat-label");
    if (tcLabel) tcLabel.textContent = L.label_tc;
    const ebitdaLabels = document.querySelectorAll(".topbar-stat .stat-label");
    if (ebitdaLabels[1]) ebitdaLabels[1].textContent = L.label_ebitda;

    // Breadcrumb
    const bc = document.getElementById("breadcrumb");
    if (bc) {
      const pageId = _getActivePageId();
      if (pageId && L.breadcrumbs[pageId]) {
        bc.textContent = L.breadcrumbs[pageId];
      }
    }

    // Page headers (título y subtítulo de cada sección)
    const pageHeaderMap = {
      dashboard:   { en_title: "Executive Dashboard",     en_sub: "Real-time risk & hedging status · Autlán Q1 2026" },
      perfil:      { en_title: "Autlán Profile",          en_sub: "Audited data · XBRL 1Q26 BMV" },
      escenarios:  { en_title: "Scenarios & Inputs",      en_sub: "Macro variables · Adjust assumptions — feeds all pages" },
      fx:          { en_title: "Exchange Rate Risk",      en_sub: "USD / MXN · Exposure, hedges and payoffs" },
      oro:         { en_title: "Gold Price Risk",         en_sub: "Metallorum · No active hedge · Price at historic highs" },
      gas:         { en_title: "Natural Gas Risk",        en_sub: "Operating cost · No active hedge · Henry Hub" },
      tasa:        { en_title: "Interest Rate Risk",      en_sub: "TIIE · SOFR · Mark-to-market of existing collar" },
      manganeso:   { en_title: "Manganese Price Risk",    en_sub: "Core commodity · Limited OTC market · Hedging alternatives" },
      secundarios: { en_title: "Secondary Risks",         en_sub: "Counterparty · Basis · Liquidity · Regulatory · Operational" },
      estrategia:  { en_title: "Optimal Hedging Strategy",en_sub: "Recommended portfolio · 60% Policy · P&L by scenario" },
      docs:        { en_title: "Model Documentation",     en_sub: "How each page, model, calculation and optimal strategy works" },
    };

    document.querySelectorAll(".page").forEach(page => {
      const pageId = page.id.replace("page-", "");
      if (!pageHeaderMap[pageId]) return;
      const title = page.querySelector(".page-title");
      const sub   = page.querySelector(".page-sub");
      if (lang === "en") {
        if (title) title.textContent = pageHeaderMap[pageId].en_title;
        if (sub)   sub.textContent   = pageHeaderMap[pageId].en_sub;
      } else {
        // Restaurar español — no hacemos nada porque la página se re-renderiza
      }
    });

    // Sidebar footer
    const footerItems = document.querySelectorAll(".sidebar-footer .footer-item");
    if (footerItems[1]) {
      footerItems[1].textContent = lang === "en" ? "XBRL 1Q26 · BMV" : "XBRL 1T26 · BMV";
    }
  }

  // ─────────────────────────────────────────
  // CAMBIAR IDIOMA — función principal
  // ─────────────────────────────────────────
  async function setLanguage(lang) {
    if (lang === activeLang) return;

    const prevLang = activeLang;
    activeLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // Actualizar botones del selector
    const buttons = document.querySelectorAll(".lang-selector button");
    if (buttons.length === 2) {
      buttons[0].style.cssText = getSelectorBtnStyle(lang === "es");
      buttons[1].style.cssText = getSelectorBtnStyle(lang === "en");
    }

    // Traducir elementos estáticos (sidebar, pills, headers)
    _translateStaticUI(lang);

    // Obtener página activa
    const pageId = _getActivePageId();

    if (lang === "en" && pageId) {
      // Guardar HTML original antes de traducir
      const container = document.getElementById(`${pageId}-content`);
      if (container && container.innerHTML.trim()) {
        if (!_cache[pageId]) {
          _cache[pageId] = { original: container.innerHTML, translated: null };
        } else if (!_cache[pageId].original) {
          _cache[pageId].original = container.innerHTML;
        }
        await translatePage(pageId);
      }
    } else if (lang === "es" && pageId) {
      // Restaurar español: limpiar caché de traducción y re-renderizar
      // Re-renderizar fuerza el español original desde el JS
      _rerenderPage(pageId);
    }

    // Mostrar toast
    if (window.showToast) {
      const msg = lang === "es"
        ? "Idioma: Español"
        : "Language: English — translating with AI...";
      showToast(msg, "success");
    }
  }

  // ─────────────────────────────────────────
  // RE-RENDERIZAR PÁGINA (restaurar ES)
  // ─────────────────────────────────────────
  function _rerenderPage(pageId) {
    // Limpiar caché de traducción para que se re-traduzca si vuelve a EN
    if (_cache[pageId]) {
      _cache[pageId].translated = null;
    }

    // Re-renderizar la página para que vuelva al español original del JS
    const renderFns = {
      dashboard:   () => typeof renderDashboard   === "function" && renderDashboard(),
      perfil:      () => typeof renderPerfil      === "function" && renderPerfil(),
      escenarios:  () => typeof renderEscenarios  === "function" && renderEscenarios(),
      fx:          () => typeof renderFX          === "function" && renderFX(),
      oro:         () => typeof renderOro         === "function" && renderOro(),
      gas:         () => typeof renderGas         === "function" && renderGas(),
      tasa:        () => typeof renderTasa        === "function" && renderTasa(),
      manganeso:   () => typeof renderManganeso   === "function" && renderManganeso(),
      secundarios: () => typeof renderSecundarios === "function" && renderSecundarios(),
      estrategia:  () => typeof renderEstrategia  === "function" && renderEstrategia(),
      docs:        () => typeof renderDocs        === "function" && renderDocs(),
    };

    if (renderFns[pageId]) renderFns[pageId]();
  }

  // ─────────────────────────────────────────
  // INTERCEPTAR NAVEGACIÓN
  // Para traducir automáticamente al navegar entre páginas en EN
  // ─────────────────────────────────────────
  function _hookNavigation() {
    // Escuchar clicks en nav items
    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
      item.addEventListener("click", async () => {
        if (activeLang !== "en") return;

        const pageId = item.dataset.page;

        // Esperar a que la página se renderice (lazy render puede tomar un tick)
        setTimeout(async () => {
          const container = document.getElementById(`${pageId}-content`);
          if (!container || !container.innerHTML.trim()) return;

          // Guardar original si es la primera vez
          if (!_cache[pageId]) {
            _cache[pageId] = { original: container.innerHTML, translated: null };
          }

          // Traducir si no está en caché
          if (!_cache[pageId].translated) {
            await translatePage(pageId);
          } else {
            // Aplicar caché directamente
            container.innerHTML = _cache[pageId].translated;
          }

          // Actualizar breadcrumb
          const bc = document.getElementById("breadcrumb");
          const L  = STATIC_LABELS["en"];
          if (bc && L.breadcrumbs[pageId]) {
            bc.textContent = L.breadcrumbs[pageId];
          }
        }, 150);
      });
    });
  }

  // ─────────────────────────────────────────
  // INTERCEPTAR CANVAS (para labels de gráficos)
  // ─────────────────────────────────────────
  const _canvasTranslations = {
    "Sin cobertura":       "Unhedged",
    "Precio actual":       "Current price",
    "TC actual":           "Current FX",
    "Precio gas actual":   "Current gas price",
    "Precio Mn actual":    "Current Mn price",
    "Precio oro actual":   "Current gold price",
    "TIIE actual":         "Current TIIE",
    "Base":                "Base",
    "Optimista":           "Optimistic",
    "Adverso":             "Adverse",
  };

  function _initCanvasInterceptor() {
    const origFill   = CanvasRenderingContext2D.prototype.fillText;
    const origStroke = CanvasRenderingContext2D.prototype.strokeText;

    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
      const t = activeLang === "en"
        ? (_canvasTranslations[text] || text)
        : text;
      origFill.call(this, t, x, y, maxWidth);
    };

    CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
      const t = activeLang === "en"
        ? (_canvasTranslations[text] || text)
        : text;
      origStroke.call(this, t, x, y, maxWidth);
    };
  }

  // ─────────────────────────────────────────
  // SELECTOR DE IDIOMA EN TOPBAR
  // ─────────────────────────────────────────
  function _injectLanguageSelector() {
    const interval = setInterval(() => {
      const topbarRight = document.querySelector(".topbar-right");
      if (!topbarRight) return;
      clearInterval(interval);

      const langContainer = document.createElement("div");
      langContainer.className = "lang-selector";
      langContainer.style.cssText = `
        display: flex;
        align-items: center;
        background: rgba(255,255,255,0.03);
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
      topbarRight.insertBefore(langContainer, topbarRight.firstChild);
    }, 100);
  }

  function getSelectorBtnStyle(active) {
    return `
      font-size: 10.5px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      color: ${active ? "#ffffff" : "var(--text-muted)"};
      background: ${active ? "var(--accent)" : "transparent"};
      box-shadow: ${active ? "0 2px 8px rgba(27,79,138,0.4)" : "none"};
    `;
  }

  // ─────────────────────────────────────────
  // CSS — animaciones del badge
  // ─────────────────────────────────────────
  function _injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.3; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(50%) translateY(-8px); }
        to   { opacity: 1; transform: translateX(50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────
  function init() {
    _injectStyles();
    _initCanvasInterceptor();
    _injectLanguageSelector();

    // Esperar a que el DOM esté listo para hookear navegación
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", _hookNavigation);
    } else {
      setTimeout(_hookNavigation, 200);
    }

    // Si el usuario tenía EN guardado, traducir al cargar
    if (activeLang === "en") {
      setTimeout(async () => {
        _translateStaticUI("en");
        const pageId = _getActivePageId();
        if (pageId) await translatePage(pageId);
      }, 500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ─────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────
  return {
    getLocale:       () => activeLang,
    setLanguage,
    translatePage,
    clearCache:      (pageId) => {
      if (pageId) delete _cache[pageId];
      else        Object.keys(_cache).forEach(k => delete _cache[k]);
    },
  };

})();
