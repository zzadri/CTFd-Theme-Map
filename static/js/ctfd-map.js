const config = window.CTFD_MAP_CONFIG || {};
const root = document.querySelector(".ctfd-map-root");
const themeSettings = window.init?.themeSettings || {};
const MODAL_SIZE_CLASSES = ["modal-sm", "modal-lg", "modal-xl"];

const DIFFICULTY_META = [
  { key: "intro", label: "Intro", matches: ["intro"], tone: "is-intro" },
  { key: "very-easy", label: "Tres Facile", matches: ["tres facile", "tres-facile"], tone: "is-very-easy" },
  { key: "easy", label: "Facile", matches: ["facile"], tone: "is-easy" },
  { key: "medium", label: "Moyen", matches: ["moyen"], tone: "is-medium" },
  { key: "hard", label: "Difficile", matches: ["difficile"], tone: "is-hard" },
  { key: "very-hard", label: "Tres Difficile", matches: ["tres difficile", "tres-difficile"], tone: "is-very-hard" },
];

if (root) {
  function normalizeNumber(value, fallback, min, max) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function normalizePercent(value, fallback, min, max) {
    return normalizeNumber(value, fallback, min, max) / 100;
  }

  function normalizeChoice(value, allowed, fallback) {
    const normalized = String(value || "").trim().toLowerCase();
    return allowed.includes(normalized) ? normalized : fallback;
  }

  function getMapScope() {
    return normalizeChoice(config.mapScope || themeSettings.map_scope, ["europe", "world"], "europe");
  }

  function getMapTexture() {
    return normalizeChoice(config.mapTexture || themeSettings.map_texture, ["off", "soft", "detailed"], "detailed");
  }

  function getMapMotion() {
    return normalizeChoice(config.mapMotion || themeSettings.map_motion, ["off", "on"], "off");
  }

  function getChallengeModalSize() {
    return normalizeChoice(
      config.challengeModalSize || themeSettings.challenge_modal_size,
      ["md", "lg", "xl"],
      "md"
    );
  }

  function getPanelVisibleRows() {
    const raw = config.panelVisibleRows ?? themeSettings.panel_visible_rows ?? 5;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      return 5;
    }
    return Math.max(3, Math.min(10, parsed));
  }

  function getTextureDarkIntensity() {
    return normalizePercent(
      config.textureDarkIntensity ?? themeSettings.texture_dark_intensity,
      100,
      0,
      500
    );
  }

  function getTextureLightIntensity() {
    return normalizePercent(
      config.textureLightIntensity ?? themeSettings.texture_light_intensity,
      135,
      0,
      220
    );
  }

  function getGlowDarkIntensity() {
    return normalizePercent(
      config.glowDarkIntensity ?? themeSettings.glow_dark_intensity,
      100,
      0,
      220
    );
  }

  function getGlowLightIntensity() {
    return normalizePercent(
      config.glowLightIntensity ?? themeSettings.glow_light_intensity,
      115,
      0,
      220
    );
  }

  function getVignetteIntensity() {
    return normalizePercent(
      config.vignetteIntensity ?? themeSettings.vignette_intensity,
      100,
      0,
      180
    );
  }

  function getCountryGlowIntensity() {
    return normalizePercent(
      config.countryGlowIntensity ?? themeSettings.country_glow_intensity,
      100,
      50,
      220
    );
  }

  function getDesktopPanelWidth() {
    return Math.round(
      normalizeNumber(
        config.desktopPanelWidth ?? themeSettings.desktop_panel_width,
        540,
        380,
        720
      )
    );
  }

  function getChallengeRowDensity() {
    return normalizeChoice(
      config.challengeRowDensity || themeSettings.challenge_row_density,
      ["compact", "comfortable", "spacious"],
      "comfortable"
    );
  }

  function formatCssNumber(value) {
    return String(Math.round(value * 1000) / 1000);
  }

  const state = {
    activeCountry: null,
    challenges: [],
    challengesById: new Map(),
    loadError: "",
    mapNodes: new Map(),
    filters: {
      difficulty: "",
      category: "",
    },
  };

  const elements = {
    experience: document.getElementById("ctfd-map-experience"),
    panel: document.getElementById("ctfd-map-panel"),
    panelClose: document.getElementById("ctfd-map-panel-close"),
    countryCode: document.getElementById("ctfd-country-code"),
    countryName: document.getElementById("ctfd-country-name"),
    countrySummary: document.getElementById("ctfd-country-summary"),
    countryStatus: document.getElementById("ctfd-country-status"),
    countryListMeta: document.getElementById("ctfd-country-list-meta"),
    challengeList: document.getElementById("ctfd-country-challenges"),
    filterDifficulty: document.getElementById("ctfd-filter-difficulty"),
    filterCategory: document.getElementById("ctfd-filter-category"),
    filterReset: document.getElementById("ctfd-filter-reset"),
    mapViewport: document.getElementById("ctfd-map-viewport"),
    challengeWindow: document.getElementById("challenge-window"),
  };

  document.body.classList.add("ctfd-map-body");

  boot().catch(error => {
    console.error("Unable to initialize CTFd-Theme-Map", error);
    if (elements.countryStatus) {
      elements.countryStatus.textContent =
        "La carte n'a pas pu etre chargee correctement. Verifiez les assets du theme.";
      elements.countryStatus.className = "ctfd-map-panel-status is-danger";
    }
  });

  async function boot() {
    applyThemeSettings();
    await loadMap();
    bindMapCountries();
    bindUiEvents();
    syncPanelMode();
    await refreshChallenges();
    requestAnimationFrame(() => {
      applyDirectLightModeColors();
    });
  }

  function isMobilePanelMode() {
    return window.matchMedia("(max-width: 992px)").matches;
  }

  function applyThemeSettings() {
    root.dataset.mapScope = getMapScope();
    root.dataset.mapTexture = getMapTexture();
    root.dataset.mapMotion = getMapMotion();
    root.dataset.rowDensity = getChallengeRowDensity();
    root.style.setProperty("--ctfd-texture-intensity-dark", formatCssNumber(getTextureDarkIntensity()));
    root.style.setProperty("--ctfd-texture-intensity-light", formatCssNumber(getTextureLightIntensity()));
    root.style.setProperty("--ctfd-glow-intensity-dark", formatCssNumber(getGlowDarkIntensity()));
    root.style.setProperty("--ctfd-glow-intensity-light", formatCssNumber(getGlowLightIntensity()));
    root.style.setProperty("--ctfd-vignette-intensity", formatCssNumber(getVignetteIntensity()));
    root.style.setProperty("--ctfd-country-glow-intensity", formatCssNumber(getCountryGlowIntensity()));
    root.style.setProperty("--ctfd-desktop-panel-width", `${getDesktopPanelWidth()}px`);
    elements.challengeList?.style.setProperty("--ctfd-visible-rows", String(getPanelVisibleRows()));
    applyChallengeModalSize();
  }

  function applyChallengeModalSize() {
    const dialog = elements.challengeWindow?.querySelector(".modal-dialog");
    if (!dialog) {
      return;
    }

    dialog.classList.remove(...MODAL_SIZE_CLASSES);
    const size = getChallengeModalSize();
    if (size !== "md") {
      dialog.classList.add(`modal-${size}`);
    }
  }

  function syncPanelMode() {
    if (!elements.panel || !elements.experience) {
      return;
    }

    if (state.activeCountry) {
      elements.experience.classList.add("is-panel-open");
      elements.panel.setAttribute("aria-hidden", "false");
    } else {
      elements.experience.classList.remove("is-panel-open");
      elements.panel.setAttribute("aria-hidden", "true");
    }
  }

  function isLightTheme() {
    return document.documentElement.getAttribute("data-bs-theme") === "light";
  }

  function removeModalRuntimeStylesheet() {
    document.getElementById("ctfd-modal-light-runtime")?.remove();
  }

  function ensureModalRuntimeStylesheet() {
    const existing = document.getElementById("ctfd-modal-light-runtime");
    if (existing) {
      return;
    }

    const style = document.createElement("style");
    style.id = "ctfd-modal-light-runtime";
    style.textContent = [
      "html[data-bs-theme='light'] .modal-backdrop.show {",
      "  background-color: rgba(16, 53, 67, 0.18) !important;",
      "  opacity: 1 !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .modal-content {",
      "  border-color: rgba(50, 108, 126, 0.2) !important;",
      "  background: linear-gradient(180deg, rgba(251, 254, 255, 0.96), rgba(236, 246, 250, 0.92)), rgba(244, 250, 253, 0.98) !important;",
      "  box-shadow: 0 18px 54px rgba(33, 96, 114, 0.18) !important;",
      "  border-radius: 18px !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .modal-header,",
      "html[data-bs-theme='light'] #challenge-window .modal-body,",
      "html[data-bs-theme='light'] #challenge-window .modal-footer {",
      "  background: transparent !important;",
      "  color: #123440 !important;",
      "  border-color: rgba(50, 108, 126, 0.18) !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .nav-tabs {",
      "  border-bottom-color: rgba(50, 108, 126, 0.2) !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .nav-link,",
      "html[data-bs-theme='light'] #challenge-window .challenge-name,",
      "html[data-bs-theme='light'] #challenge-window .challenge-value,",
      "html[data-bs-theme='light'] #challenge-window .challenge-attribution,",
      "html[data-bs-theme='light'] #challenge-window .challenge-desc,",
      "html[data-bs-theme='light'] #challenge-window .table,",
      "html[data-bs-theme='light'] #challenge-window code {",
      "  color: #123440 !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .nav-link.active,",
      "html[data-bs-theme='light'] #challenge-window .btn-info,",
      "html[data-bs-theme='light'] #challenge-window .badge-info,",
      "html[data-bs-theme='light'] #challenge-window .challenge-tag {",
      "  background-color: rgba(30, 115, 136, 0.16) !important;",
      "  border-color: rgba(30, 115, 136, 0.28) !important;",
      "  color: #123440 !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .form-control,",
      "html[data-bs-theme='light'] #challenge-window textarea {",
      "  background: rgba(255, 255, 255, 0.98) !important;",
      "  border-color: rgba(50, 108, 126, 0.24) !important;",
      "  color: #123440 !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .form-control:focus,",
      "html[data-bs-theme='light'] #challenge-window textarea:focus {",
      "  border-color: rgba(30, 115, 136, 0.4) !important;",
      "  box-shadow: 0 0 0 0.2rem rgba(30, 115, 136, 0.12) !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window .table-striped > tbody > tr:nth-of-type(odd) > * {",
      "  background: rgba(30, 115, 136, 0.08) !important;",
      "  color: #123440 !important;",
      "}",
      "html[data-bs-theme='light'] #challenge-window code {",
      "  border: 1px solid rgba(50, 108, 126, 0.2) !important;",
      "  border-radius: 8px !important;",
      "  background: rgba(232, 245, 250, 0.9) !important;",
      "}",
    ].join("\n");

    document.head.appendChild(style);
  }

  function applyChallengeModalThemeOverrides() {
    if (!elements.challengeWindow) {
      return;
    }

    if (!isLightTheme()) {
      removeModalRuntimeStylesheet();
      applyChallengeModalSize();
      return;
    }

    ensureModalRuntimeStylesheet();
    applyChallengeModalSize();
  }

  function bindUiEvents() {
    window.addEventListener("load-challenges", async () => {
      await refreshChallenges();
      rerenderActiveCountry();
    });

    window.addEventListener("resize", syncPanelMode);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && isMobilePanelMode()) {
        closePanel();
      }
    });

    elements.mapViewport?.addEventListener("click", event => {
      const clickedNode = event.target.closest?.(".country-node");
      if (!clickedNode) {
        closePanel();
      }
    });

    elements.panelClose?.addEventListener("click", () => {
      closePanel();
    });

    elements.filterDifficulty?.addEventListener("change", event => {
      state.filters.difficulty = String(event.target.value || "");
      rerenderActiveCountry();
    });

    elements.filterCategory?.addEventListener("change", event => {
      state.filters.category = String(event.target.value || "");
      rerenderActiveCountry();
    });

    elements.filterReset?.addEventListener("click", () => {
      state.filters.difficulty = "";
      state.filters.category = "";
      syncFilterInputs();
      rerenderActiveCountry();
    });

    elements.challengeWindow?.addEventListener("show.bs.modal", () => {
      document.body.classList.add("is-challenge-modal-open");
      if (isMobilePanelMode()) {
        closePanel();
      }

      requestAnimationFrame(() => {
        applyChallengeModalThemeOverrides();
        setTimeout(applyChallengeModalThemeOverrides, 50);
      });
    });

    elements.challengeWindow?.addEventListener("hidden.bs.modal", () => {
      document.body.classList.remove("is-challenge-modal-open");
      if (!isLightTheme()) {
        removeModalRuntimeStylesheet();
      }
    });

    const modalMutationObserver = new MutationObserver(() => {
      if (elements.challengeWindow?.classList.contains("show")) {
        applyChallengeModalThemeOverrides();
      }
      applyChallengeModalSize();
    });

    if (elements.challengeWindow) {
      modalMutationObserver.observe(elements.challengeWindow, {
        childList: true,
        subtree: true,
      });
    }

    const themeMutationObserver = new MutationObserver(() => {
      if (elements.challengeWindow?.classList.contains("show")) {
        applyChallengeModalThemeOverrides();
      }
      // Apply colors when theme changes
      requestAnimationFrame(() => {
        applyDirectLightModeColors();
      });
    });

    themeMutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
  }

  function rerenderActiveCountry() {
    if (state.activeCountry && hasCountryEntries(state.activeCountry)) {
      renderCountry(state.activeCountry);
      requestAnimationFrame(() => {
        applyDirectLightModeColors();
      });
      return;
    }

    if (state.activeCountry) {
      closePanel();
    }
  }

  async function loadMap() {
    const mapAsset = config.mapAsset || elements.mapViewport?.dataset.mapSrc;
    if (!mapAsset) {
      throw new Error("Missing map asset");
    }

    const response = await fetch(mapAsset, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`Unable to fetch world map: ${response.status}`);
    }

    const svgMarkup = await response.text();
    elements.mapViewport.innerHTML = svgMarkup;

    const svg = elements.mapViewport.querySelector("svg");
    if (svg) {
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      hideNonConfiguredCountries(svg);
      fitMapToConfiguredCountries(svg);
    }
  }

  function hideNonConfiguredCountries(svg) {
    const allowedCountryCodes = new Set(
      Object.keys(config.countries || {}).map(countryCode => String(countryCode).toLowerCase())
    );
    if (!allowedCountryCodes.size) {
      return;
    }

    svg.querySelectorAll("[id]").forEach(node => {
      const rawId = String(node.id || "").toLowerCase();
      if (!/^[a-z]{2}$/.test(rawId)) {
        return;
      }

      if (!allowedCountryCodes.has(rawId)) {
        node.style.display = "none";
      }
    });
  }

  function fitMapToConfiguredCountries(svg) {
    const countryCodes = Object.keys(config.countries || {});
    if (!countryCodes.length || typeof svg.getBBox !== "function") {
      return;
    }

    const boxes = [];

    countryCodes.forEach(countryCode => {
      const countryNode = svg.querySelector(`#${countryCode}`);
      if (!countryNode || typeof countryNode.getBBox !== "function") {
        return;
      }

      const box = countryNode.getBBox();
      if (!Number.isFinite(box.x) || !Number.isFinite(box.y)) {
        return;
      }

      if (box.width <= 0 || box.height <= 0) {
        return;
      }

      boxes.push({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        centerX: box.x + box.width / 2,
        centerY: box.y + box.height / 2,
      });
    });

    if (!boxes.length) {
      return;
    }

    const centeredBoxes = filterOutlierBoxes(boxes);
    const targetBoxes = centeredBoxes.length >= Math.max(8, Math.ceil(boxes.length * 0.45))
      ? centeredBoxes
      : boxes;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    targetBoxes.forEach(box => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) {
      return;
    }

    const horizontalPadding = width * 0.12;
    const verticalPadding = height * 0.16;
    const viewBox = [
      minX - horizontalPadding,
      minY - verticalPadding,
      width + horizontalPadding * 2,
      height + verticalPadding * 2,
    ];

    svg.setAttribute("viewBox", viewBox.join(" "));
  }

  function filterOutlierBoxes(boxes) {
    if (boxes.length < 6) {
      return boxes;
    }

    const medianX = median(boxes.map(box => box.centerX));
    const medianY = median(boxes.map(box => box.centerY));
    const devX = boxes.map(box => Math.abs(box.centerX - medianX));
    const devY = boxes.map(box => Math.abs(box.centerY - medianY));

    const madX = Math.max(median(devX), 1);
    const madY = Math.max(median(devY), 1);
    const maxDx = Math.max(madX * 6, 120);
    const maxDy = Math.max(madY * 6, 95);

    return boxes.filter(box => {
      return Math.abs(box.centerX - medianX) <= maxDx && Math.abs(box.centerY - medianY) <= maxDy;
    });
  }

  function median(values) {
    if (!values.length) {
      return 0;
    }

    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  function bindMapCountries() {
    Object.entries(config.countries || {}).forEach(([countryCode, country]) => {
      const node = elements.mapViewport.querySelector(`#${countryCode}`);
      if (!node) {
        console.warn(`Country code "${countryCode}" was not found in the SVG map`);
        return;
      }

      node.classList.add("country-node");
      node.dataset.countryCode = countryCode;
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-label", `Open challenges for ${country.label}`);
      node.addEventListener("click", event => {
        event.stopPropagation();
        toggleCountry(countryCode);
      });
      node.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleCountry(countryCode);
        }
      });

      state.mapNodes.set(countryCode, node);
    });
  }

  async function refreshChallenges() {
    state.loadError = "";

    try {
      const challenges = await fetchChallenges();
      state.challenges = Array.isArray(challenges) ? challenges : [];
      state.challengesById = new Map(
        state.challenges.map(challenge => [Number(challenge.id), challenge])
      );
    } catch (error) {
      console.warn("Unable to load challenge list", error);
      state.challenges = [];
      state.challengesById = new Map();
      state.loadError =
        "Les challenges ne sont pas accessibles depuis cette page pour le moment. Connectez-vous ou verifiez la visibilite CTFd.";
    }

    updateMapAvailability();
  }

  async function fetchChallenges() {
    const urlRoot = window.init?.urlRoot || "";
    const apiUrl = new URL(`${urlRoot}/api/v1/challenges`, window.location.origin);

    if (config.isAdmin) {
      apiUrl.searchParams.set("view", "admin");
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Challenge API responded with status ${response.status}`);
    }

    const payload = await response.json();
    if (!payload?.success || !Array.isArray(payload.data)) {
      throw new Error("Challenge API returned an unexpected payload");
    }

    return payload.data;
  }

  function updateMapAvailability() {
    state.mapNodes.forEach((node, countryCode) => {
      const hasEntries = hasCountryEntries(countryCode);
      node.classList.toggle("has-challenges", hasEntries);
      node.classList.toggle("is-dormant", !hasEntries);
      node.setAttribute("aria-disabled", String(!hasEntries));
      node.setAttribute("tabindex", hasEntries ? "0" : "-1");
    });
  }

  function hasCountryEntries(countryCode) {
    return getCountryEntries(countryCode).length > 0;
  }

  function toggleCountry(countryCode) {
    if (!hasCountryEntries(countryCode)) {
      return;
    }

    if (state.activeCountry === countryCode && elements.experience.classList.contains("is-panel-open")) {
      closePanel();
      return;
    }

    state.activeCountry = countryCode;
    updateActiveCountry();
    renderCountry(countryCode);
    openPanel();
  }

  function updateActiveCountry() {
    state.mapNodes.forEach((node, nodeCode) => {
      node.classList.toggle("is-active", nodeCode === state.activeCountry);
    });
  }

  function openPanel() {
    syncPanelMode();
  }

  function closePanel() {
    state.activeCountry = null;
    updateActiveCountry();
    syncPanelMode();
  }

  function renderCountry(countryCode) {
    const country = config.countries?.[countryCode];
    if (!country) {
      return;
    }

    const entries = getCountryEntries(countryCode);
    const solvedEntries = entries.filter(entry => entry.challenge?.solved_by_me).length;

    updateFilterControls(entries);
    syncFilterInputs();

    const filteredEntries = sortEntriesForDisplay(applyFilters(entries));
    const challengeLabel = formatChallengeCount(entries.length);

    elements.countryCode.textContent = countryCode.toUpperCase();
    elements.countryName.textContent = country.label;

    if (elements.countrySummary) {
      const summary = country.description || "";
      elements.countrySummary.textContent = summary;
      elements.countrySummary.hidden = !summary;
    }

    if (elements.countryStatus) {
      elements.countryStatus.textContent = state.loadError
        ? state.loadError
        : solvedEntries > 0
          ? `${challengeLabel} - ${formatSolvedCount(solvedEntries)}`
          : `${challengeLabel} disponibles`;
      elements.countryStatus.className = state.loadError
        ? "ctfd-map-panel-status is-warning"
        : "ctfd-map-panel-status";
    }

    renderCountryChallenges(filteredEntries, entries.length);
    updateResetVisibility();
  }

  function updateFilterControls(entries) {
    const difficultyOptions = [];
    const categoryOptions = [];
    const seenDifficulty = new Set();
    const seenCategory = new Set();

    entries.forEach(entry => {
      const difficulty = getDifficultyMeta(entry);
      if (difficulty && !seenDifficulty.has(difficulty.key)) {
        seenDifficulty.add(difficulty.key);
        difficultyOptions.push({ value: difficulty.key, label: difficulty.label });
      }

      const categoryLabel = getCategoryLabel(entry);
      const categoryKey = normalizeLabel(categoryLabel);
      if (categoryLabel && categoryKey && !seenCategory.has(categoryKey)) {
        seenCategory.add(categoryKey);
        categoryOptions.push({ value: categoryKey, label: categoryLabel });
      }
    });

    difficultyOptions.sort((left, right) => left.label.localeCompare(right.label));
    categoryOptions.sort((left, right) => left.label.localeCompare(right.label));

    populateSelect(elements.filterDifficulty, difficultyOptions, "Toutes");
    populateSelect(elements.filterCategory, categoryOptions, "Toutes");

    if (!difficultyOptions.some(option => option.value === state.filters.difficulty)) {
      state.filters.difficulty = "";
    }

    if (!categoryOptions.some(option => option.value === state.filters.category)) {
      state.filters.category = "";
    }
  }

  function populateSelect(select, options, allLabel) {
    if (!select) {
      return;
    }

    const currentValue = select.value;
    const markup = [
      `<option value="">${escapeHtml(allLabel)}</option>`,
      ...options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`),
    ].join("");

    select.innerHTML = markup;
    if (options.some(option => option.value === currentValue)) {
      select.value = currentValue;
    }
  }

  function syncFilterInputs() {
    if (elements.filterDifficulty) {
      elements.filterDifficulty.value = state.filters.difficulty;
    }

    if (elements.filterCategory) {
      elements.filterCategory.value = state.filters.category;
    }
  }

  function updateResetVisibility() {
    if (!elements.filterReset) {
      return;
    }

    elements.filterReset.hidden = !(state.filters.difficulty || state.filters.category);
  }

  function applyFilters(entries) {
    return entries.filter(entry => {
      if (state.filters.category) {
        const categoryKey = normalizeLabel(getCategoryLabel(entry));
        if (categoryKey !== state.filters.category) {
          return false;
        }
      }

      if (state.filters.difficulty) {
        const difficulty = getDifficultyMeta(entry);
        if (!difficulty || difficulty.key !== state.filters.difficulty) {
          return false;
        }
      }

      return true;
    });
  }

  function renderCountryChallenges(entries, totalCount) {
    elements.challengeList.innerHTML = "";
    elements.challengeList.scrollTop = 0;

    if (!entries.length) {
      elements.challengeList.innerHTML = [
        '<div class="ctfd-map-empty">',
        totalCount > 0
          ? "Aucun challenge ne correspond aux filtres selectionnes."
          : "Aucun challenge disponible dans cette zone.",
        "</div>",
      ].join("");
      return;
    }

    entries.forEach((entry, index) => {
      const row = document.createElement("button");
      const solved = Boolean(entry.challenge?.solved_by_me);
      const missing = Boolean(entry.missing);
      const heading = entry.challenge?.name || `Challenge #${entry.id}`;
      const categoryLabel = getCategoryLabel(entry) || "Sans categorie";
      const pointsLabel = entry.challenge?.value !== undefined ? `${entry.challenge.value} pts` : "--";
      const difficulty = getDifficultyMeta(entry);
      const visibleTags = getVisibleTags(entry);
      const ordinal = String(index + 1).padStart(2, "0");

      row.type = "button";
      row.className = `ctfd-map-challenge-row${solved ? " is-solved" : ""}${missing ? " is-missing" : ""}`;
      row.disabled = missing;
      row.setAttribute("aria-label", `${missing ? "Indisponible" : "Ouvrir"} ${heading}`);
      row.innerHTML = `
        <span class="ctfd-map-challenge-index">${ordinal}</span>
        <div class="ctfd-map-challenge-main">
          <p class="ctfd-map-challenge-name">${escapeHtml(heading)}</p>
          <div class="ctfd-map-challenge-tags">
            <span class="ctfd-map-tag ctfd-map-tag-category">${escapeHtml(categoryLabel)}</span>
            ${renderTags(visibleTags)}
          </div>
        </div>
        <div class="ctfd-map-challenge-side">
          <span class="ctfd-map-challenge-points">${escapeHtml(pointsLabel)}</span>
          <span
            class="ctfd-map-challenge-difficulty ${difficulty ? difficulty.tone : "is-unknown"}"
            title="${escapeHtml(difficulty ? difficulty.label : "Sans difficulte")}" 
            aria-label="${escapeHtml(difficulty ? difficulty.label : "Sans difficulte")}" 
          ></span>
        </div>
      `;

      if (!missing) {
        row.addEventListener("click", () => {
          window.dispatchEvent(new CustomEvent("load-challenge", { detail: entry.id }));
        });
      }

      elements.challengeList.appendChild(row);
    });

    requestAnimationFrame(() => {
      applyDirectLightModeColors();
    });
  }

  function renderTags(tags) {
    return tags.map(tag => `<span class="ctfd-map-tag">${escapeHtml(tag)}</span>`).join("");
  }

  function applyDirectLightModeColors() {
    const titleEl = document.getElementById("ctfd-country-name");
    const clearInlineStyles = (selector, properties) => {
      document.querySelectorAll(selector).forEach(el => {
        properties.forEach(property => el.style.removeProperty(property));
      });
    };

    if (!isLightTheme()) {
      if (titleEl) {
        titleEl.style.removeProperty("color");
      }

      clearInlineStyles(".ctfd-map-challenge-index", [
        "background-color",
        "background",
        "border-color",
        "color",
        "border-width",
        "border-style",
        "box-shadow",
      ]);
      clearInlineStyles(".ctfd-map-tag.ctfd-map-tag-category", [
        "color",
        "border-color",
        "background-color",
        "background",
        "border-width",
        "border-style",
        "box-shadow",
      ]);
      clearInlineStyles(".ctfd-map-challenge-points", [
        "border-color",
        "background",
        "color",
        "border-width",
        "border-style",
        "box-shadow",
      ]);
      clearInlineStyles(".ctfd-map-challenge-difficulty", [
        "border-width",
        "border-style",
        "box-shadow",
        "width",
        "height",
        "background",
        "border-color",
      ]);
      return;
    }

    // Apply colors directly via inline styles for the most conflict-prone elements.
    
    // 1. Title (ctfd-country-name)
    if (titleEl) {
      titleEl.style.color = "#103848";
    }

    // 2. Challenge indices (.ctfd-map-challenge-index)
    document.querySelectorAll(".ctfd-map-challenge-index").forEach(el => {
      el.style.background = "linear-gradient(180deg, rgba(252, 255, 255, 0.98), rgba(230, 242, 247, 0.98))";
      el.style.borderColor = "rgba(35, 107, 127, 0.22)";
      el.style.color = "#175467";
      el.style.borderWidth = "1px";
      el.style.borderStyle = "solid";
      el.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 6px 14px rgba(33, 96, 114, 0.08)";
    });

    // 3. Category tags (.ctfd-map-tag.ctfd-map-tag-category)
    document.querySelectorAll(".ctfd-map-tag.ctfd-map-tag-category").forEach(el => {
      el.style.color = "#1b6074";
      el.style.borderColor = "rgba(35, 107, 127, 0.2)";
      el.style.background = "linear-gradient(180deg, rgba(248, 253, 255, 0.98), rgba(233, 245, 250, 0.98))";
      el.style.borderWidth = "1px";
      el.style.borderStyle = "solid";
      el.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 6px 14px rgba(33, 96, 114, 0.06)";
    });

    // 4. Points (.ctfd-map-challenge-points)
    document.querySelectorAll(".ctfd-map-challenge-points").forEach(el => {
      el.style.borderColor = "rgba(35, 107, 127, 0.26)";
      el.style.background = "linear-gradient(180deg, rgba(252, 255, 255, 0.98), rgba(231, 243, 248, 0.98))";
      el.style.color = "#123440";
      el.style.borderWidth = "1px";
      el.style.borderStyle = "solid";
      el.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.74), 0 8px 18px rgba(33, 96, 114, 0.1)";
    });

    // 4b. Solved challenge badges in light mode
    document.querySelectorAll(".ctfd-map-challenge-row.is-solved .ctfd-map-challenge-index").forEach(el => {
      el.style.background = "linear-gradient(180deg, rgba(248, 255, 251, 0.98), rgba(228, 243, 234, 0.98))";
      el.style.borderColor = "rgba(72, 149, 105, 0.24)";
      el.style.color = "#256748";
      el.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.78), 0 6px 14px rgba(41, 117, 79, 0.08)";
    });

    document.querySelectorAll(".ctfd-map-challenge-row.is-solved .ctfd-map-tag.ctfd-map-tag-category").forEach(el => {
      el.style.color = "#2c6c4a";
      el.style.borderColor = "rgba(72, 149, 105, 0.22)";
      el.style.background = "linear-gradient(180deg, rgba(249, 255, 251, 0.98), rgba(233, 246, 238, 0.98))";
      el.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 6px 14px rgba(41, 117, 79, 0.06)";
    });

    document.querySelectorAll(".ctfd-map-challenge-row.is-solved .ctfd-map-challenge-points").forEach(el => {
      el.style.borderColor = "rgba(72, 149, 105, 0.24)";
      el.style.background = "linear-gradient(180deg, rgba(248, 255, 251, 0.98), rgba(229, 243, 235, 0.98))";
      el.style.color = "#215c40";
      el.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.78), 0 8px 18px rgba(41, 117, 79, 0.08)";
    });

    // 5. Difficulty dots (.ctfd-map-challenge-difficulty)
    document.querySelectorAll(".ctfd-map-challenge-difficulty").forEach(el => {
      el.style.borderWidth = "1.5px";
      el.style.borderStyle = "solid";
      el.style.boxShadow = "0 0 0 4px rgba(103, 192, 211, 0.18), 0 4px 12px rgba(22, 81, 98, 0.12)";
    });

    document.querySelectorAll(".ctfd-map-challenge-difficulty.is-unknown").forEach(el => {
      el.style.width = "1.05rem";
      el.style.height = "1.05rem";
      el.style.background = "radial-gradient(circle at 30% 30%, #f4fdff 0%, #8be0ed 30%, #3c99ae 58%, #184e60 100%)";
      el.style.borderColor = "rgba(19, 79, 95, 0.72)";
      el.style.boxShadow = "0 0 0 4px rgba(103, 192, 211, 0.30), 0 6px 16px rgba(22, 81, 98, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.48)";
    });
  }

  function sortEntriesForDisplay(entries) {
    return [...entries].sort((left, right) => {
      const leftSolved = Boolean(left.challenge?.solved_by_me);
      const rightSolved = Boolean(right.challenge?.solved_by_me);
      if (leftSolved !== rightSolved) {
        return leftSolved ? 1 : -1;
      }

      const leftMissing = Boolean(left.missing);
      const rightMissing = Boolean(right.missing);
      if (leftMissing !== rightMissing) {
        return leftMissing ? 1 : -1;
      }

      return Number(left.id) - Number(right.id);
    });
  }

  function getCountryEntries(countryCode) {
    const country = config.countries?.[countryCode] || {};
    const entries = [];
    const seenIds = new Set();

    state.challenges.forEach(challenge => {
      if (challengeBelongsToCountry(challenge, countryCode)) {
        const challengeId = Number(challenge.id);
        entries.push({
          id: challengeId,
          challenge,
          missing: false,
          source: "tag",
        });
        seenIds.add(challengeId);
      }
    });

    (country.challengeIds || []).forEach(rawId => {
      const challengeId = Number(rawId);
      if (seenIds.has(challengeId)) {
        return;
      }

      const challenge = state.challengesById.get(challengeId);
      entries.push({
        id: challengeId,
        challenge,
        missing: !challenge,
        source: "manual",
      });
      seenIds.add(challengeId);
    });

    return entries.sort((left, right) => Number(left.id) - Number(right.id));
  }

  function challengeBelongsToCountry(challenge, countryCode) {
    const country = config.countries?.[countryCode] || {};
    const aliases = getCountryTagAliases(countryCode, country);
    const challengeTags = getChallengeTags(challenge).map(normalizeLabel);

    return aliases.some(alias => challengeTags.includes(alias));
  }

  function getCountryTagAliases(countryCode, country) {
    const configured = Array.isArray(country.tags) ? country.tags : [];
    const aliases = new Set(
      [
        `map:${countryCode}`,
        `country:${countryCode}`,
        `geo:${countryCode}`,
        ...configured,
      ].map(value => normalizeLabel(value))
    );

    return Array.from(aliases);
  }

  function getChallengeTags(challenge) {
    return (challenge?.tags || [])
      .map(tag => String(tag.value || "").trim())
      .filter(Boolean);
  }

  function getVisibleTags(entry) {
    return getChallengeTags(entry.challenge).filter(tag => {
      return !normalizeLabel(tag).startsWith("map:");
    });
  }

  function getCategoryLabel(entry) {
    return String(entry.challenge?.category || "").trim();
  }

  function getDifficultyMeta(entry) {
    const tags = getVisibleTags(entry).map(normalizeLabel);
    return DIFFICULTY_META.find(meta => {
      return meta.matches.some(match => tags.includes(normalizeLabel(match)));
    }) || null;
  }

  function formatChallengeCount(count) {
    return `${count} challenge${count > 1 ? "s" : ""}`;
  }

  function formatSolvedCount(count) {
    return `${count} resolu${count > 1 ? "s" : ""}`;
  }

  function normalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
