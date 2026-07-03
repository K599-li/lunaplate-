const LAST_PERIOD_KEY = "lunaPlateLastPeriod";

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function cycleStore() {
  return window.CycleStore;
}

function loadCycleState() {
  const store = cycleStore();
  if (store) return store.load();
  return {
    schemaVersion: 1,
    cycles: [],
    settings: { avgCycleLength: 28, avgPeriodLength: 5, manualOverride: null },
  };
}

function loadGrocery() {
  try {
    return JSON.parse(storageGet("lunaPlateGrocery") || "[]");
  } catch {
    return [];
  }
}

function i18n() {
  return window.I18n;
}

function t(key, vars) {
  return i18n()?.t(key, vars) ?? key;
}

function getPhaseCopy(phase) {
  return i18n().getPhaseCopy(phase);
}

function translateTag(tag) {
  return i18n().translateTag(tag);
}

function translateMealType(type) {
  return i18n().translateMealType(type);
}

function translateSymptom(id) {
  return i18n().translateSymptom(id);
}

function todayDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayPlanStorageKey() {
  return `lunaPlateTodayPlan:${todayDateKey()}`;
}

function loadTodayPlanState() {
  const fallback = { date: todayDateKey(), supplementDone: false, movementDone: false, waterMl: 800, loggedMeals: [] };
  try {
    const saved = { ...fallback, ...JSON.parse(storageGet(todayPlanStorageKey()) || "{}") };
    if (!Array.isArray(saved.loggedMeals)) saved.loggedMeals = [];
    return saved;
  } catch {
    return fallback;
  }
}

function saveTodayPlanState() {
  state.todayPlan.date = todayDateKey();
  storageSet(todayPlanStorageKey(), JSON.stringify(state.todayPlan));
}

function clampWater(value) {
  return Math.max(0, Math.min(2500, Math.round(Number(value || 0) / 50) * 50));
}

const symptoms = [
  { id: "cramps" },
  { id: "fatigue" },
  { id: "bloating" },
  { id: "cravings" },
  { id: "low_mood" },
  { id: "high_energy" },
];

const symptomIcons = {
  cramps: "⌁",
  fatigue: "◐",
  bloating: "≈",
  cravings: "♡",
  low_mood: "☾",
  high_energy: "✦",
};

const FETCH_TIMEOUT_MS = 12000;
const WATER_GOAL_ML = 2000;
const BASE_KCAL_GOAL = 2000;
const PHASE_KCAL_ADJUST = { menstrual: 50, follicular: 0, ovulation: 0, luteal: 150 };
const MACRO_GOAL_SPLIT = { protein: 0.2, carbs: 0.5, fat: 0.3 };
const MACRO_MEAL_SPLITS = {
  breakfast: { protein: 0.18, carbs: 0.55, fat: 0.27 },
  lunch: { protein: 0.24, carbs: 0.48, fat: 0.28 },
  dinner: { protein: 0.28, carbs: 0.44, fat: 0.28 },
  snack: { protein: 0.14, carbs: 0.56, fat: 0.3 },
};
const state = {
  mealType: "all",
  grocery: loadGrocery(),
  mealSource: "TheMealDB",
  shuffleSeed: 0,
  renderToken: 0,
  careRenderToken: 0,
  viewCache: { key: "", normalizedMeals: null, ranked: null },
  todayMealToken: 0,
  todayMealCache: { key: "", meal: null, mealType: "", phase: "" },
  todayPlan: { date: "", supplementDone: false, movementDone: false, waterMl: 800, loggedMeals: [] },
};

const form = document.querySelector("#meal-form");
const symptomList = document.querySelector("#symptom-list");
const mealResults = document.querySelector("#meal-results");
const groceryList = document.querySelector("#grocery-list");
const template = document.querySelector("#meal-card-template");
const bestPickButton = document.querySelector("#best-pick-grocery");

function formatMinutes(value) {
  return t("form.min", { n: value });
}

function buildSymptomList() {
  const selected = new Set([...document.querySelectorAll("#symptom-list input:checked")].map((input) => input.value));
  symptomList.innerHTML = "";
  symptoms.forEach((symptom) => {
    const label = document.createElement("label");
    label.className = "chip";
    label.innerHTML = `<input type="checkbox" value="${symptom.id}" /><i aria-hidden="true">${symptomIcons[symptom.id] || "•"}</i><span>${escapeHtml(translateSymptom(symptom.id))}</span>`;
    if (selected.has(symptom.id)) label.querySelector("input").checked = true;
    symptomList.appendChild(label);
  });
}

function localizeMealCard(node) {
  node.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

function setDefaultCycleStart() {
  const cycleState = loadCycleState();
  const latestCycle = cycleStore()?.latestCycle(cycleState);
  const cycleLengthInput = document.querySelector("#cycle-length");
  const manualPhase = cycleState.settings.manualOverride || "auto";
  const manualPhaseInput = document.querySelector(`input[name='phase'][value='${manualPhase}']`);

  if (cycleLengthInput) cycleLengthInput.value = cycleState.settings.avgCycleLength || 28;
  if (manualPhaseInput) manualPhaseInput.checked = true;

  if (latestCycle?.startDate) {
    document.querySelector("#last-period").value = latestCycle.startDate;
    return;
  }

  const today = new Date();
  document.querySelector("#last-period").valueAsDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4);
}

function saveLastPeriod() {
  const value = document.querySelector("#last-period").value;
  if (!value) return;
  const store = cycleStore();
  if (store) {
    const cycleState = store.load();
    if (cycleState.cycles.length) {
      store.updateCycle(cycleState.cycles.length - 1, { startDate: value, endDate: null });
    } else {
      store.addCycle({ startDate: value, endDate: null });
    }
  }
  saveCycleSettingsFromForm();
}

function saveCycleSettingsFromForm() {
  const manualPhase = document.querySelector("input[name='phase']:checked")?.value || "auto";
  cycleStore()?.updateSettings({
    avgCycleLength: Number(document.querySelector("#cycle-length")?.value || 28),
    manualOverride: manualPhase === "auto" ? null : manualPhase,
  });
}

function init() {
  if (!i18n()) {
    showBootError("i18n.js did not load. Check that i18n.js and app.js are in the same folder.");
    return;
  }
  if (!form || !symptomList || !mealResults) {
    showBootError("Page markup is incomplete. Make sure you open index.html from the project folder.");
    return;
  }

  setDefaultCycleStart();

  buildSymptomList();
  i18n().onLocaleChange(() => {
    buildSymptomList();
    refreshLocale();
  });

  const debouncedRender = debounce(render, 350);
  form.addEventListener("input", debouncedRender);
  ["input", "change"].forEach((eventName) => {
    document.querySelector("#last-period").addEventListener(eventName, saveLastPeriod);
    document.querySelector("#cycle-length").addEventListener(eventName, saveCycleSettingsFromForm);
  });
  document.querySelectorAll("input[name='phase']").forEach((input) => {
    input.addEventListener("change", saveCycleSettingsFromForm);
  });
  document.querySelector("#cook-time-output").textContent = formatMinutes(document.querySelector("#cook-time").value);
  document.querySelector("#cook-time").addEventListener("input", (event) => {
    document.querySelector("#cook-time-output").textContent = formatMinutes(event.target.value);
    debouncedRender();
  });
  document.querySelector("#pantry").addEventListener("input", debouncedRender);
  document.querySelector("#vegan").addEventListener("input", (event) => {
    if (event.target.checked) {
      document.querySelector("#vegetarian").checked = true;
      document.querySelector("#dairy-free").checked = true;
    }
  });
  document.querySelector("#reset-button").addEventListener("click", reset);
  document.querySelectorAll(".profile-trigger").forEach((trigger) => trigger.addEventListener("click", openProfilePanel));
  document.querySelector("#profile-close")?.addEventListener("click", closeProfilePanel);
  document.querySelector("#profile-scrim")?.addEventListener("click", closeProfilePanel);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProfilePanel();
      closeCartPanel();
    }
  });
  document.querySelector("#clear-grocery").addEventListener("click", () => {
    state.grocery = [];
    saveGrocery();
    renderGrocery();
  });
  document.querySelector("#cart-trigger")?.addEventListener("click", openCartPanel);
  document.querySelector("#cart-close")?.addEventListener("click", closeCartPanel);
  document.querySelector("#cart-scrim")?.addEventListener("click", closeCartPanel);
  document.querySelector("#cart-add-custom")?.addEventListener("click", addCustomGrocery);
  document.querySelector("#cart-custom-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addCustomGrocery();
  });
  document.querySelector("#cart-generate")?.addEventListener("click", closeCartPanel);
  document.querySelectorAll("[data-plan-check]").forEach((button) => {
    button.addEventListener("click", () => toggleTodayPlanDone(button.dataset.planCheck));
  });
  document.querySelector("#today-recipe-log")?.addEventListener("click", () => {
    if (state.todayMealCache.meal) toggleMealLogged(state.todayMealCache.meal);
  });
  document.querySelector("#today-water-range")?.addEventListener("input", (event) => {
    setWaterAmount(Number(event.target.value));
  });
  document.querySelectorAll("[data-water-step]").forEach((button) => {
    button.addEventListener("click", () => setWaterAmount(state.todayPlan.waterMl + Number(button.dataset.waterStep || 0)));
  });
  document.querySelector("#recipe-search")?.addEventListener("input", debouncedRender);
  document.querySelectorAll(".time-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".time-chip").forEach((item) => item.classList.toggle("active", item === chip));
      document.querySelector("#cook-time").value = chip.dataset.timeFilter || "60";
      document.querySelector("#cook-time-output").textContent = formatMinutes(document.querySelector("#cook-time").value);
      debouncedRender();
    });
  });
  document.querySelector("#surprise-button")?.addEventListener("click", () => {
    state.shuffleSeed += 1;
    render();
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.mealType = tab.dataset.mealType;
      document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      render();
    });
  });

  document.querySelectorAll(".bottom-nav a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveView(link.dataset.viewTarget || "today");
    });
  });
  document.querySelectorAll("[data-open-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.openView));
  });
  window.addEventListener("hashchange", () => setActiveView(getViewFromHash(), { updateHash: false }));

  render();
  setActiveView(getViewFromHash(), { updateHash: false });
}

function openProfilePanel() {
  const panel = document.querySelector("#intake-panel");
  const scrim = document.querySelector("#profile-scrim");
  const trigger = document.querySelector("#profile-trigger");
  if (!panel || !scrim) return;
  panel.classList.add("open");
  scrim.hidden = false;
  trigger?.setAttribute("aria-expanded", "true");
  document.body.classList.add("profile-open");
  window.setTimeout(() => {
    panel.querySelector("input, button, textarea")?.focus();
  }, 0);
}

function closeProfilePanel() {
  const panel = document.querySelector("#intake-panel");
  const scrim = document.querySelector("#profile-scrim");
  const trigger = document.querySelector("#profile-trigger");
  if (!panel || !scrim || !panel.classList.contains("open")) return;
  panel.classList.remove("open");
  scrim.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("profile-open");
  trigger?.focus();
}

function openCartPanel() {
  const panel = document.querySelector("#cart-panel");
  const scrim = document.querySelector("#cart-scrim");
  if (!panel || !scrim) return;
  renderGrocery();
  panel.classList.add("open");
  scrim.hidden = false;
  document.body.classList.add("cart-open");
}

function closeCartPanel() {
  const panel = document.querySelector("#cart-panel");
  const scrim = document.querySelector("#cart-scrim");
  if (!panel || !scrim || !panel.classList.contains("open")) return;
  panel.classList.remove("open");
  scrim.hidden = true;
  document.body.classList.remove("cart-open");
}

function getViewFromHash() {
  const view = window.location.hash.replace("#", "");
  if (view === "care") return "insights";
  if (view === "move") return "move-api";
  return ["today", "insights", "food", "move-api"].includes(view) ? view : "today";
}

function setActiveView(view, options = {}) {
  if (view === "care") view = "insights";
  if (view === "move") view = "move-api";
  if (!["today", "insights", "food", "move-api"].includes(view)) view = "today";
  document.querySelectorAll(".app-view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.view === view);
  });
  document.querySelectorAll(".bottom-nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.viewTarget === view);
  });
  if (options.updateHash !== false && window.location.hash !== `#${view}`) {
    window.location.hash = view;
  }
  const workspace = document.querySelector(".workspace");
  if (workspace) workspace.scrollTop = 0;
  if (view === "insights") renderInsights();
}

function updatePhaseBand(phase, day) {
  const phaseCopy = getPhaseCopy(phase);
  document.querySelector("#phase-title").textContent = t("today.heroTitle");
  document.querySelector("#phase-description").textContent = t("today.heroCopy");
  const dayText = day ? t("status.day", { day }) : t("status.manual");
  const ringDayText = day && i18n()?.getLocale() === "zh" ? `第${day}天` : dayText;
  document.querySelector("#day-pill").textContent = ringDayText;
  const ringPhase = document.querySelector("#today-ring-phase");
  if (ringPhase) ringPhase.textContent = phaseCopy.title;
  const ring = document.querySelector(".today-ring");
  if (ring) {
    const cycleLength = Number(document.querySelector("#cycle-length")?.value) || DEFAULT_INPUTS.cycleLength;
    const progress = day ? Math.min(0.96, Math.max(0.08, day / cycleLength)) : 0.18;
    ring.style.setProperty("--cycle-progress", `${Math.round(progress * 360)}deg`);
  }
  const recipePhase = document.querySelector("#today-recipe-phase");
  if (recipePhase) recipePhase.textContent = phaseCopy.title;
  const summary = document.querySelector("#today-cycle-summary");
  if (summary) summary.textContent = `${phaseCopy.title} · ${dayText}`;
  renderTodayPlan(phase);

  const insightDay = document.querySelector("#insight-cycle-day");
  if (insightDay) insightDay.textContent = t("insights.currentCycle", { day: day || "--" });

  [1, 2, 3].forEach((number, index) => {
    const title = document.querySelector(`#focus-${word(number)}`);
    const copy = document.querySelector(`#focus-${word(number)}-copy`);
    if (title) title.textContent = phaseCopy.focus[index][0];
    if (copy) copy.textContent = phaseCopy.focus[index][1];
  });
}

function relocalizeMeal(meal) {
  return { ...meal, summary: buildFallbackSummary(meal) };
}

function buildFallbackSummary(meal) {
  const focus = meal.tags
    .slice(0, 3)
    .map((tag) => translateTag(tag))
    .join(", ");
  return t("recipe.summary", {
    category: translateMealType(meal.type || "recipe"),
    focus: focus || t("recipe.todaysPreferences"),
  });
}

function todayPlanCopy(phase) {
  const copy = t(`todayPlan.phases.${phase}`);
  return typeof copy === "object" ? copy : t("todayPlan.phases.luteal");
}

function renderTodayPlan(phase) {
  if (!state.todayPlan.date || state.todayPlan.date !== todayDateKey()) {
    state.todayPlan = loadTodayPlanState();
  }
  const copy = todayPlanCopy(phase);
  const supplementTitle = document.querySelector("#today-supplement-title");
  const supplementCopy = document.querySelector("#today-supplement-copy");
  const movementTitle = document.querySelector("#today-movement-title");
  const movementCopy = document.querySelector("#today-movement-copy");
  const hydrationTitle = document.querySelector("#today-hydration-title");
  if (supplementTitle) supplementTitle.textContent = copy.supplementTitle;
  if (supplementCopy) supplementCopy.textContent = copy.supplementCopy;
  if (movementTitle) movementTitle.textContent = copy.movementTitle;
  if (movementCopy) movementCopy.textContent = copy.movementCopy;
  if (hydrationTitle) hydrationTitle.textContent = t("todayPlan.hydrationTitle");
  renderTodayPlanChecks();
  renderHydrationControl(copy);
  renderNutritionOverview(phase);
}

function renderTodayPlanChecks() {
  ["supplement", "movement"].forEach((item) => {
    const done = Boolean(state.todayPlan[`${item}Done`]);
    const row = document.querySelector(`[data-plan-item="${item}"]`);
    const button = document.querySelector(`[data-plan-check="${item}"]`);
    row?.classList.toggle("done", done);
    if (button) {
      button.classList.toggle("done", done);
      button.setAttribute("aria-pressed", String(done));
      button.setAttribute("aria-label", done ? t("todayPlan.markUndone") : t("todayPlan.markDone"));
    }
  });
}

function renderHydrationControl(copy = todayPlanCopy(estimatePhase(getInputs()).phase)) {
  const waterMl = clampWater(state.todayPlan.waterMl);
  const range = document.querySelector("#today-water-range");
  const output = document.querySelector("#today-water-output");
  const hydrationCopy = document.querySelector("#today-hydration-copy");
  const row = document.querySelector('[data-plan-item="hydration"]');
  const progress = Math.min(100, Math.round((waterMl / WATER_GOAL_ML) * 100));
  state.todayPlan.waterMl = waterMl;
  if (range) {
    range.value = String(waterMl);
    range.style.setProperty("--water-progress", `${Math.min(100, (waterMl / Number(range.max || 2500)) * 100)}%`);
  }
  if (output) output.textContent = `${waterMl}ml`;
  if (hydrationCopy) {
    hydrationCopy.textContent = t("todayPlan.hydrationCopy", {
      goal: WATER_GOAL_ML,
      current: waterMl,
      percent: progress,
      cue: copy.hydrationCue,
    });
  }
  row?.classList.toggle("done", waterMl >= WATER_GOAL_ML);
}

function toggleTodayPlanDone(item) {
  if (!["supplement", "movement"].includes(item)) return;
  state.todayPlan[`${item}Done`] = !state.todayPlan[`${item}Done`];
  saveTodayPlanState();
  renderTodayPlanChecks();
}

function setWaterAmount(value) {
  state.todayPlan.waterMl = clampWater(value);
  saveTodayPlanState();
  renderHydrationControl();
}

function getNutritionGoal(phase) {
  const kcal = BASE_KCAL_GOAL + (PHASE_KCAL_ADJUST[phase] || 0);
  return {
    kcal,
    protein: Math.round((kcal * MACRO_GOAL_SPLIT.protein) / 4),
    carbs: Math.round((kcal * MACRO_GOAL_SPLIT.carbs) / 4),
    fat: Math.round((kcal * MACRO_GOAL_SPLIT.fat) / 9),
  };
}

function estimateMealMacros(meal) {
  if (meal.macros && Number(meal.macros.protein) >= 0) {
    return {
      protein: Number(meal.macros.protein) || 0,
      carbs: Number(meal.macros.carbs) || 0,
      fat: Number(meal.macros.fat) || 0,
    };
  }
  const calories = Number(meal.calories) || 0;
  const split = MACRO_MEAL_SPLITS[meal.type] || { protein: 0.22, carbs: 0.5, fat: 0.28 };
  return {
    protein: Math.round((calories * split.protein) / 4),
    carbs: Math.round((calories * split.carbs) / 4),
    fat: Math.round((calories * split.fat) / 9),
  };
}

function isMealLogged(mealId) {
  return state.todayPlan.loggedMeals.some((entry) => entry.id === mealId);
}

function toggleMealLogged(meal) {
  if (!meal || !meal.id) return;
  if (state.todayPlan.date !== todayDateKey()) {
    state.todayPlan = loadTodayPlanState();
  }
  if (isMealLogged(meal.id)) {
    state.todayPlan.loggedMeals = state.todayPlan.loggedMeals.filter((entry) => entry.id !== meal.id);
  } else {
    state.todayPlan.loggedMeals.push({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: Number(meal.calories) || 0,
      macros: estimateMealMacros(meal),
    });
  }
  saveTodayPlanState();
  renderNutritionOverview();
  updateLogButtons();
}

function getLoggedTotals() {
  return state.todayPlan.loggedMeals.reduce(
    (totals, entry) => {
      const macros = entry.macros || {};
      totals.kcal += Number(entry.calories) || 0;
      totals.protein += Number(macros.protein) || 0;
      totals.carbs += Number(macros.carbs) || 0;
      totals.fat += Number(macros.fat) || 0;
      return totals;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function renderNutritionOverview(phase = estimatePhase(getInputs()).phase) {
  if (!state.todayPlan.date || state.todayPlan.date !== todayDateKey()) {
    state.todayPlan = loadTodayPlanState();
  }
  const goal = getNutritionGoal(phase);
  const totals = getLoggedTotals();
  const kcalValue = document.querySelector("#nutrition-kcal");
  const kcalLeft = document.querySelector("#nutrition-kcal-left");
  if (kcalValue) kcalValue.textContent = totals.kcal.toLocaleString();
  if (kcalLeft) {
    const remaining = goal.kcal - totals.kcal;
    kcalLeft.textContent =
      remaining >= 0 ? t("today.kcalLeft", { n: remaining }) : t("today.kcalOver", { n: Math.abs(remaining) });
    kcalLeft.classList.toggle("over-goal", remaining < 0);
  }
  ["protein", "carbs", "fat"].forEach((macro) => {
    const label = document.querySelector(`#nutrition-${macro}-label`);
    const bar = document.querySelector(`#nutrition-${macro}-bar`);
    const percentEl = document.querySelector(`#nutrition-${macro}-percent`);
    const percent = goal[macro] ? Math.round((totals[macro] / goal[macro]) * 100) : 0;
    if (label) label.textContent = t(`today.${macro}`, { n: totals[macro] });
    if (bar) bar.style.setProperty("--macro-progress", `${Math.min(100, percent)}%`);
    if (percentEl) percentEl.textContent = `${percent}%`;
  });
}

function updateLogButtons() {
  document.querySelectorAll("[data-log-meal-id]").forEach((button) => {
    const logged = isMealLogged(button.dataset.logMealId);
    button.classList.toggle("logged", logged);
    button.textContent = logged ? t("today.loggedMeal") : t("today.logMeal");
    button.setAttribute("aria-pressed", String(logged));
  });
  const todayButton = document.querySelector("#today-recipe-log");
  if (todayButton) {
    const meal = state.todayMealCache.meal;
    todayButton.hidden = !meal;
    if (meal) {
      const logged = isMealLogged(meal.id);
      todayButton.classList.toggle("logged", logged);
      todayButton.textContent = logged
        ? t("today.loggedMeal")
        : `${t("today.logMeal")} · ${t("recipe.kcal", { n: meal.calories || 0 })}`;
      todayButton.setAttribute("aria-pressed", String(logged));
    }
  }
}

function getCurrentMealTypeByTime() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 10) return "breakfast";
  if (hour >= 11 && hour <= 14) return "lunch";
  if (hour >= 15 && hour <= 17) return "snack";
  return "dinner";
}

function buildTodayMealCacheKey(inputs, phase) {
  return JSON.stringify({
    phase,
    mealType: getCurrentMealTypeByTime(),
    symptoms: inputs.symptoms,
    vegetarian: inputs.vegetarian,
    vegan: inputs.vegan,
    glutenFree: inputs.glutenFree,
    dairyFree: inputs.dairyFree,
    cuisineStyle: inputs.cuisineStyle,
    pantry: inputs.pantry,
  });
}

function updateTodayRecipeCard(meal, phase, mealType) {
  const phaseLabel = document.querySelector("#today-recipe-phase");
  const title = document.querySelector("#today-recipe-name");
  const meta = document.querySelector("#today-recipe-meta");
  const image = document.querySelector("#today-recipe-image");
  if (!title || !meta || !image) return;

  const displayMealType = meal.type || mealType || getCurrentMealTypeByTime();
  const tagSeparator = i18n()?.getLocale() === "zh" ? "、" : ", ";
  const translatedTags = (meal.tags || [])
    .slice(0, 2)
    .map((tag) => translateTag(tag))
    .join(tagSeparator);

  if (phaseLabel) phaseLabel.textContent = `${getPhaseCopy(phase).title} · ${translateMealType(displayMealType)}`;
  title.textContent = meal.name || t("today.recipeName");
  meta.textContent = `${formatMinutes(meal.time || 20)} · ${translatedTags || buildFallbackSummary(meal)}`;
  if (meal.image) {
    image.src = meal.image;
    image.alt = meal.name || "";
  }
  updateLogButtons();
}

function setTodayRecipePending(phase) {
  const mealType = getCurrentMealTypeByTime();
  const phaseLabel = document.querySelector("#today-recipe-phase");
  const title = document.querySelector("#today-recipe-name");
  const meta = document.querySelector("#today-recipe-meta");
  if (phaseLabel) phaseLabel.textContent = `${getPhaseCopy(phase).title} · ${translateMealType(mealType)}`;
  if (title) title.textContent = t("empty.findingTitle");
  if (meta) meta.textContent = t("results.fetching");
  const logButton = document.querySelector("#today-recipe-log");
  if (logButton) logButton.hidden = true;
}

async function renderTodayMeal(inputs, phase) {
  const cacheKey = buildTodayMealCacheKey(inputs, phase);
  if (state.todayMealCache.key === cacheKey && state.todayMealCache.meal) {
    updateTodayRecipeCard(state.todayMealCache.meal, phase, state.todayMealCache.mealType);
    return;
  }

  const token = (state.todayMealToken += 1);
  setTodayRecipePending(phase);

  try {
    const data = await fetchTodayMeal(inputs, phase);
    if (token !== state.todayMealToken) return;
    const meal = data.meal ? normalizeBackendMeal(data.meal) : null;
    if (!meal) return;
    state.todayMealCache = {
      key: cacheKey,
      meal,
      mealType: data.mealType || meal.type || getCurrentMealTypeByTime(),
      phase,
    };
    updateTodayRecipeCard(meal, phase, state.todayMealCache.mealType);
  } catch {
    if (state.todayMealCache.meal) {
      updateTodayRecipeCard(state.todayMealCache.meal, phase, state.todayMealCache.mealType);
    }
  }
}

function refreshLocale() {
  const inputs = getInputs();
  const { phase, day } = estimatePhase(inputs);
  updatePhaseBand(phase, day);
  updateProfileOverview(inputs, phase, day);
  if (state.todayMealCache.meal) {
    updateTodayRecipeCard(state.todayMealCache.meal, phase, state.todayMealCache.mealType);
  }
  renderCycleCalendar(inputs);
  renderInsights();
  document.querySelector("#cook-time-output").textContent = formatMinutes(document.querySelector("#cook-time").value);
  if (!state.viewCache.ranked) {
    renderGrocery();
    return;
  }

  const ranked = state.viewCache.ranked.map(({ meal, score }) => ({
    meal: relocalizeMeal(meal),
    score,
  }));
  state.viewCache.ranked = ranked;

  document.querySelector("#results-count").textContent =
    ranked.length === 1 ? t("results.idea", { n: ranked.length }) : t("results.ideas", { n: ranked.length });
  document.querySelector("#match-note").textContent = buildMatchNote(inputs, phase, getMealSourceLabel());
  renderBestPick(ranked, inputs, phase);
  renderMeals(ranked);
  renderGrocery();
}

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), wait);
  };
}

function getInputs() {
  const activeTimeChip = document.querySelector(".time-chip.active");
  return {
    lastPeriod: document.querySelector("#last-period").value,
    cycleLength: Number(document.querySelector("#cycle-length").value || 28),
    manualPhase: document.querySelector("input[name='phase']:checked").value,
    symptoms: [...document.querySelectorAll("#symptom-list input:checked")].map((input) => input.value),
    vegetarian: document.querySelector("#vegetarian").checked,
    vegan: document.querySelector("#vegan").checked,
    glutenFree: document.querySelector("#gluten-free").checked,
    dairyFree: document.querySelector("#dairy-free").checked,
    cuisineStyle: document.querySelector("input[name='cuisine-style']:checked")?.value || "balanced",
    cookTime: Number(activeTimeChip?.dataset.timeFilter || document.querySelector("#cook-time").value || 60),
    cookTimeMin: Number(activeTimeChip?.dataset.timeMin || 0),
    recipeQuery: (document.querySelector("#recipe-search")?.value || "").trim(),
    pantry: document.querySelector("#pantry").value
      .toLowerCase()
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function estimatePhase(inputs) {
  if (inputs.manualPhase !== "auto") {
    return { phase: inputs.manualPhase, day: null };
  }

  const cycleInfo = getCycleInfoForDate(new Date(), inputs);
  if (!cycleInfo) {
    return { phase: "luteal", day: null };
  }

  return { phase: cycleInfo.phase, day: cycleInfo.cycleDay };
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function daysBetween(start, end) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((stripTime(end) - stripTime(start)) / dayMs);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getPhaseForCycleDay(cycleDay, cycleLength) {
  const ovulationDay = Math.max(11, cycleLength - 14);

  if (cycleDay <= 5) return "menstrual";
  if (cycleDay < ovulationDay - 1) return "follicular";
  if (cycleDay <= ovulationDay + 2) return "ovulation";
  return "luteal";
}

function getCycleInfoForDate(date, inputs) {
  const start = parseLocalDate(inputs.lastPeriod);
  const cycleLength = Math.max(21, Math.min(45, Number(inputs.cycleLength) || 28));
  if (!start) return null;

  const rawDay = daysBetween(start, date) + 1;
  const cycleDay = positiveModulo(rawDay - 1, cycleLength) + 1;
  return {
    cycleDay,
    phase: getPhaseForCycleDay(cycleDay, cycleLength),
  };
}

function renderCycleCalendar(inputs) {
  const grid = document.querySelector("#cycle-calendar-grid");
  const monthLabel = document.querySelector("#calendar-month");
  if (!grid || !monthLabel) return;

  const today = stripTime(new Date());
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const formatterLocale = i18n()?.getLocale() === "zh" ? "zh-CN" : i18n()?.getLocale() || "en";

  monthLabel.textContent = new Intl.DateTimeFormat(formatterLocale, {
    month: "long",
    year: "numeric",
  }).format(firstOfMonth);

  const cells = [];
  const firstDayIndex = (firstOfMonth.getDay() + 6) % 7;
  for (let index = 0; index < firstDayIndex; index += 1) {
    cells.push('<span class="calendar-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const cycleInfo = getCycleInfoForDate(date, inputs);
    const isToday = stripTime(date).getTime() === today.getTime();
    const classes = ["calendar-day"];
    const labelParts = [String(day)];

    if (cycleInfo) {
      classes.push("phase", cycleInfo.phase);
      labelParts.push(`${getPhaseCopy(cycleInfo.phase).title}, ${t("status.day", { day: cycleInfo.cycleDay })}`);
    }
    if (isToday) {
      classes.push("today");
      labelParts.push("Today");
    }

    cells.push(`<span class="${classes.join(" ")}" aria-label="${escapeHtml(labelParts.join(", "))}">${day}</span>`);
  }

  grid.innerHTML = cells.join("");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatShortDate(date) {
  const locale = i18n()?.getLocale() === "zh" ? "zh-CN" : i18n()?.getLocale() || "en";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}

function formatMonthLabel(date) {
  const locale = i18n()?.getLocale() === "zh" ? "zh-CN" : i18n()?.getLocale() || "en";
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

function formatProfileDate(value) {
  const date = parseLocalDate(value);
  if (!date) return "--";
  const locale = i18n()?.getLocale() === "zh" ? "zh-CN" : i18n()?.getLocale() || "en";
  return new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric" }).format(date);
}

function updateProfileOverview(inputs, phase, day) {
  const status = document.querySelector("#profile-cycle-status");
  const cycleLength = document.querySelector("#profile-cycle-length");
  const lastPeriod = document.querySelector("#profile-last-period");
  const periodDay = document.querySelector("#profile-period-day");
  const cycleDay = document.querySelector("#profile-cycle-day");
  if (status) {
    const dayText = day ? t("status.day", { day }) : t("status.manual");
    status.textContent = `${getPhaseCopy(phase).title} · ${dayText}`;
  }
  if (cycleLength) cycleLength.textContent = `${inputs.cycleLength || 28}`;
  if (lastPeriod) lastPeriod.textContent = formatProfileDate(inputs.lastPeriod);
  if (periodDay) {
    const shownDay = String(Math.min(5, Math.max(1, Number(day) || 3))).padStart(2, "0");
    periodDay.textContent = `${shownDay} / 05`;
  }
  if (cycleDay) cycleDay.textContent = String(Number(day) || "--").padStart(Number(day) ? 2 : 0, "0");
}

function renderInsights() {
  const view = document.querySelector('[data-view="insights"]');
  if (!view) return;

  const inputs = getInputs();
  const { phase, day } = estimatePhase(inputs);
  const phaseCopy = getPhaseCopy(phase);
  const insightDay = document.querySelector("#insight-cycle-day");
  if (insightDay) insightDay.textContent = t("insights.currentCycle", { day: day || "--" });
  renderCycleCalendar(inputs);

  const energyTitle = document.querySelector("#insight-energy-title");
  const energyCopy = document.querySelector("#insight-energy-copy");
  const socialTitle = document.querySelector("#insight-social-title");
  const socialCopy = document.querySelector("#insight-social-copy");
  if (energyTitle) energyTitle.textContent = phaseCopy.focus?.[0]?.[0] || t("insights.energyTitle");
  if (energyCopy) energyCopy.textContent = phaseCopy.focus?.[0]?.[1] || t("insights.energyCopy");
  if (socialTitle) socialTitle.textContent = phaseCopy.focus?.[1]?.[0] || t("insights.socialTitle");
  if (socialCopy) socialCopy.textContent = phaseCopy.focus?.[1]?.[1] || t("insights.socialCopy");

  const start = parseLocalDate(inputs.lastPeriod);
  if (!start) return;
  const cycleLength = Math.max(21, Math.min(45, Number(inputs.cycleLength) || 28));
  const ovulationOffset = Math.max(11, cycleLength - 14) - 1;
  const today = stripTime(new Date());
  const elapsedCycles = Math.max(0, Math.floor(daysBetween(start, today) / cycleLength) + 1);

  [1, 2, 3].forEach((slot, index) => {
    const periodDate = addDays(start, (elapsedCycles + index) * cycleLength);
    const ovulationDate = addDays(periodDate, ovulationOffset);
    const wordSlot = word(slot);
    const month = document.querySelector(`#prediction-month-${wordSlot}`);
    const period = document.querySelector(`#prediction-period-${wordSlot}`);
    const ovulation = document.querySelector(`#prediction-ovulation-${wordSlot}`);
    if (month) month.textContent = formatMonthLabel(periodDate);
    if (period) period.textContent = formatShortDate(periodDate);
    if (ovulation) ovulation.textContent = formatShortDate(ovulationDate);
  });
}

function buildInputCacheKey(inputs, phase) {
  return JSON.stringify({
    phase,
    lastPeriod: inputs.lastPeriod,
    cycleLength: inputs.cycleLength,
    manualPhase: inputs.manualPhase,
    symptoms: inputs.symptoms,
    vegetarian: inputs.vegetarian,
    vegan: inputs.vegan,
    glutenFree: inputs.glutenFree,
    dairyFree: inputs.dairyFree,
    cuisineStyle: inputs.cuisineStyle,
    cookTime: inputs.cookTime,
    cookTimeMin: inputs.cookTimeMin,
    recipeQuery: inputs.recipeQuery,
    pantry: inputs.pantry,
  });
}

function rankMeals(apiMeals) {
  return apiMeals
    .map((meal) => ({ meal, score: scoreMeal(meal) }))
    .filter((item) => item.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function presentRanked(ranked, inputs, phase) {
  state.viewCache.ranked = ranked;
  document.querySelector("#results-count").textContent =
    ranked.length === 1 ? t("results.idea", { n: ranked.length }) : t("results.ideas", { n: ranked.length });
  document.querySelector("#match-note").textContent = buildMatchNote(inputs, phase, getMealSourceLabel());
  renderBestPick(ranked, inputs, phase);
  renderMeals(ranked);
}

async function render() {
  const token = (state.renderToken += 1);
  const inputs = getInputs();
  const { phase, day } = estimatePhase(inputs);
  const cacheKey = buildInputCacheKey(inputs, phase);
  updatePhaseBand(phase, day);
  updateProfileOverview(inputs, phase, day);
  renderTodayMeal(inputs, phase);
  renderCycleCalendar(inputs);
  renderInsights();
  if (state.viewCache.key === cacheKey && state.viewCache.normalizedMeals) {
    presentRanked(rankMeals(state.viewCache.normalizedMeals), inputs, phase);
    renderGrocery();
    return;
  }

  if (state.viewCache.ranked) {
    document.querySelector("#match-note").textContent = t("results.fetching");
  } else {
    renderLoading();
  }

  try {
    const apiMeals = await fetchExternalMeals(inputs, phase);
    if (token !== state.renderToken) return;

    state.viewCache.key = cacheKey;
    state.viewCache.normalizedMeals = apiMeals;
    presentRanked(rankMeals(apiMeals), inputs, phase);
  } catch (error) {
    if (token !== state.renderToken) return;
    state.viewCache.key = "";
    state.viewCache.normalizedMeals = null;
    state.viewCache.ranked = null;
    renderApiError(error);
  }

  renderGrocery();
}

async function fetchExternalMeals(inputs, phase) {
  const apiPromise = fetchBackendMeals(inputs, phase);
  const timeoutPromise = new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(t("recipe.apiTimeout"))), 15000);
  });

  const meals = await Promise.race([apiPromise, timeoutPromise]);
  return meals;
}

async function fetchBackendMeals(inputs, phase) {
  const params = new URLSearchParams({
    phase,
    symptoms: inputs.symptoms.join(","),
    cuisineStyle: inputs.cuisineStyle,
    vegetarian: String(inputs.vegetarian),
    vegan: String(inputs.vegan),
    glutenFree: String(inputs.glutenFree),
    dairyFree: String(inputs.dairyFree),
    cookTime: String(inputs.cookTime),
    cookTimeMin: String(inputs.cookTimeMin || 0),
    search: inputs.recipeQuery || "",
    pantry: inputs.pantry.join(","),
  });
  const data = await fetchJson(`/api/meals?${params.toString()}`);
  const meals = (data.meals || []).map(normalizeBackendMeal);
  state.mealSource = data.source || "TheMealDB";
  return meals;
}

async function fetchTodayMeal(inputs, phase) {
  const params = new URLSearchParams({
    phase,
    hour: String(new Date().getHours()),
    mealType: getCurrentMealTypeByTime(),
    symptoms: inputs.symptoms.join(","),
    cuisineStyle: inputs.cuisineStyle,
    vegetarian: String(inputs.vegetarian),
    vegan: String(inputs.vegan),
    glutenFree: String(inputs.glutenFree),
    dairyFree: String(inputs.dairyFree),
    cookTime: String(inputs.cookTime),
    cookTimeMin: String(inputs.cookTimeMin || 0),
    search: inputs.recipeQuery || "",
    pantry: inputs.pantry.join(","),
  });
  return fetchJson(`/api/today-meal?${params.toString()}`);
}

function normalizeBackendMeal(meal) {
  const tags = meal.tags || [];
  const normalizedMeal = {
    ...meal,
    tags,
  };
  return {
    id: meal.id,
    name: meal.name,
    type: meal.type || "dinner",
    time: Number(meal.time || 20),
    calories: Number(meal.calories || 0),
    summary: meal.summary || buildFallbackSummary(normalizedMeal),
    ingredients: meal.ingredients || [],
    steps: meal.steps || [t("recipe.followSource")],
    tags,
    macros: meal.macros || null,
    image: meal.image || null,
    source: meal.source || "TheMealDB",
    backendScore: Number(meal.backendScore ?? meal.score ?? 0),
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Recipe API returned ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(t("recipe.apiTimeout"));
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function scoreMeal(meal) {
  let score = Number.isFinite(meal.backendScore) ? meal.backendScore : 0;
  if (state.mealType !== "all" && meal.type !== state.mealType) score -= 45;
  return score + pseudoRandom(meal.id, state.shuffleSeed) * (state.shuffleSeed ? 32 : 1);
}


function cleanIngredient(ingredient) {
  return ingredient.replace(/^[\d/.\s]+/, "").trim();
}

function pseudoRandom(id, seed) {
  let value = seed + 17;
  for (const char of id) value = (value * 31 + char.charCodeAt(0)) % 997;
  return value / 997;
}

function getMealSourceLabel() {
  return state.mealSource || "TheMealDB";
}

function word(number) {
  return ["", "one", "two", "three"][number];
}

function buildMatchNote(inputs, phase, source) {
  const bits = [source, getPhaseCopy(phase).title];
  if (inputs.symptoms.length) {
    bits.push(
      inputs.symptoms.length === 1
        ? t("results.symptomSignal", { n: inputs.symptoms.length })
        : t("results.symptomSignals", { n: inputs.symptoms.length }),
    );
  }
  if (inputs.pantry.length) {
    bits.push(
      inputs.pantry.length === 1
        ? t("results.pantryItem", { n: inputs.pantry.length })
        : t("results.pantryItems", { n: inputs.pantry.length }),
    );
  }
  if (inputs.cuisineStyle && inputs.cuisineStyle !== "balanced") {
    bits.push(t(`cuisineStyles.${inputs.cuisineStyle}`));
  }
  return t("results.ranked", { details: bits.join(", ") });
}

function renderLoading() {
  document.querySelector("#results-count").textContent = t("results.loading");
  document.querySelector("#match-note").textContent = t("results.fetching");
  mealResults.innerHTML = `<div class="empty-state"><h3>${escapeHtml(t("empty.findingTitle"))}</h3><p>${escapeHtml(t("empty.findingCopy"))}</p></div>`;
  document.querySelector("#best-pick-title").textContent = t("best.analyzing");
  document.querySelector("#best-pick-reason").textContent = t("best.analyzingCopy");
  document.querySelector("#best-pick-tags").innerHTML = "";
  document.querySelector("#best-pick-meta").textContent = t("best.apiMatch");
  bestPickButton.disabled = true;
}

function renderApiError(error) {
  document.querySelector("#results-count").textContent = t("results.ideas", { n: 0 });
  document.querySelector("#match-note").textContent = t("results.apiUnavailable");
  mealResults.innerHTML = `<div class="empty-state"><h3>${escapeHtml(t("empty.apiErrorTitle"))}</h3><p>${escapeHtml(t("empty.apiErrorCopy", { message: error.message }))}</p></div>`;
  document.querySelector("#best-pick-title").textContent = t("best.noExternal");
  document.querySelector("#best-pick-reason").textContent = t("best.apiFailed");
  document.querySelector("#best-pick-tags").innerHTML = "";
  document.querySelector("#best-pick-meta").textContent = t("best.tryAgain");
  bestPickButton.disabled = true;
}

function renderMeals(ranked) {
  mealResults.innerHTML = "";

  if (!ranked.length) {
    mealResults.innerHTML = `<div class="empty-state"><h3>${escapeHtml(t("empty.noMatchesTitle"))}</h3><p>${escapeHtml(t("empty.noMatchesCopy"))}</p></div>`;
    return;
  }

  const { phase } = estimatePhase(getInputs());
  const phaseTitle = getPhaseCopy(phase).title;
  ranked.forEach(({ meal }) => {
    const node = template.content.firstElementChild.cloneNode(true);
    localizeMealCard(node);
    node.querySelector(".meal-phase-badge").textContent = phaseTitle;
    node.querySelector(".meal-time").textContent = formatMinutes(meal.time);
    node.querySelector(".meal-kcal").textContent = meal.calories ? t("recipe.kcal", { n: meal.calories }) : "";
    node.querySelector("h3").textContent = meal.name;
    node.querySelector(".meal-summary").textContent = meal.summary;
    node.dataset.searchText = [meal.name, meal.summary, meal.ingredients.join(" "), meal.tags.join(" ")].join(" ").toLowerCase();
    const primaryTag = meal.tags.find((tag) => !["vegetarian", "vegan", "dairy-free", "gluten-free"].includes(tag)) || meal.tags[0];
    node.querySelector(".tag-row").innerHTML = primaryTag ? `<span class="tag">${escapeHtml(translateTag(primaryTag))}</span>` : "";
    node.querySelector(".ingredient-list").innerHTML = meal.ingredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join("");
    node.querySelector(".step-list").innerHTML = meal.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    node.querySelector(".add-button").addEventListener("click", () => addGroceries(meal.ingredients, meal.name));
    const logButton = node.querySelector(".log-button");
    if (logButton) {
      logButton.dataset.logMealId = meal.id;
      logButton.addEventListener("click", () => toggleMealLogged(meal));
    }
    node.querySelector(".swap-button").addEventListener("click", () => {
      state.shuffleSeed += 1;
      render();
    });
    const art = node.querySelector(".meal-art");
    const image = node.querySelector(".meal-image");
    art.style.background = artForMeal(meal);
    if (meal.image) {
      image.src = meal.image;
      image.alt = meal.name;
    } else {
      image.hidden = true;
    }
    mealResults.appendChild(node);
  });
  filterVisibleMeals();
  updateLogButtons();
}

function filterVisibleMeals() {
  const query = (document.querySelector("#recipe-search")?.value || "").trim().toLowerCase();
  document.querySelectorAll("#meal-results .meal-card").forEach((card) => {
    const matches = !query || card.dataset.searchText?.includes(query);
    card.hidden = !matches;
  });
}

function renderBestPick(ranked, inputs, phase) {
  const best = ranked[0]?.meal;
  const bestArt = document.querySelector("#best-pick-art");
  const bestImage = document.querySelector("#best-pick-image");
  bestPickButton.onclick = null;

  if (!best) {
    document.querySelector("#best-pick-title").textContent = t("best.noMatch");
    document.querySelector("#best-pick-reason").textContent = t("best.noMatchCopy");
    document.querySelector("#best-pick-tags").innerHTML = "";
    document.querySelector("#best-pick-meta").textContent = "--";
    bestArt.style.background = "var(--surface-soft)";
    bestImage.hidden = true;
    bestImage.removeAttribute("src");
    bestPickButton.disabled = true;
    bestPickButton.textContent = t("best.addGroceries");
    return;
  }

  bestPickButton.disabled = false;
  bestPickButton.textContent = t("best.addGroceries");
  document.querySelector("#best-pick-title").textContent = best.name;
  document.querySelector("#best-pick-reason").textContent = buildBestReason(best, inputs, phase);
  document.querySelector("#best-pick-tags").innerHTML = best.tags
    .slice(0, 4)
    .map((tag) => `<span class="tag">${escapeHtml(translateTag(tag))}</span>`)
    .join("");
  document.querySelector("#best-pick-meta").textContent = `${translateMealType(best.type)} · ${formatMinutes(best.time)}`;
  if (best.image) {
    bestArt.style.background = "var(--surface)";
    bestImage.alt = best.name;
    bestImage.onerror = () => {
      bestImage.hidden = true;
      bestImage.removeAttribute("src");
      bestArt.style.background = artForMeal(best);
    };
    bestImage.src = best.image;
    bestImage.hidden = false;
  } else {
    bestArt.style.background = artForMeal(best);
    bestImage.hidden = true;
    bestImage.removeAttribute("src");
  }
  bestPickButton.onclick = () => addGroceries(best.ingredients, best.name);
}

function buildBestReason(meal, inputs, phase) {
  const phaseTitle = getPhaseCopy(phase).title;
  const tagPair = meal.tags
    .slice(0, 2)
    .map((tag) => translateTag(tag))
    .join(t("recipe.and"));
  const pantryMatch = inputs.pantry.some((item) =>
    meal.ingredients.some((ingredient) => ingredient.includes(item) || item.includes(cleanIngredient(ingredient))),
  );
  return t("recipe.bestReason", {
    phase: phaseTitle,
    symptoms: inputs.symptoms.length ? t("recipe.bestSymptoms") : "",
    tags: tagPair,
    pantry: pantryMatch ? t("recipe.pantryUses") : "",
  });
}

function artForMeal(meal) {
  const palettes = {
    breakfast: ["#fff7df", "#a67815"],
    lunch: ["#edf7f2", "#2f7d5a"],
    dinner: ["#eee1f4", "#8f6aa4"],
    snack: ["#fff0ec", "#c85f4b"],
  };
  const [soft, accent] = palettes[meal.type] || palettes.dinner;
  return `linear-gradient(90deg, ${accent} 0 5px, transparent 5px), linear-gradient(180deg, ${soft}, #ffffff)`;
}

async function renderCarePlan() {
  const view = document.querySelector('[data-view="care"]');
  if (!view) return;

  ensureCareLayout(view);
  const token = (state.careRenderToken += 1);
  const inputs = getInputs();
  const { phase, day } = estimatePhase(inputs);
  const context = buildCareContext(inputs, phase, day);

  document.querySelector("#care-source").textContent = t("care.generating");
  document.querySelector("#care-title").textContent = t("care.generatingTitle", { phase: getPhaseCopy(phase).title });
  document.querySelector("#care-actions").innerHTML = `<li>${escapeHtml(t("care.generatingAction"))}</li>`;

  const llmPlan = await requestLLMCarePlan(context);
  if (token !== state.careRenderToken) return;

  renderCarePlanContent(llmPlan || buildLocalCarePlan(context), Boolean(llmPlan));
}

function ensureCareLayout(view) {
  if (view.querySelector("#care-actions")) return;
  const heading = view.querySelector(".screen-heading")?.outerHTML || "";
  view.innerHTML = `
    ${heading}
    <section class="care-summary">
      <div class="section-heading">
        <div>
          <p class="eyebrow" id="care-source">${escapeHtml(t("care.sourceToday"))}</p>
          <h2 id="care-title">${escapeHtml(t("care.title"))}</h2>
        </div>
      </div>
      <ul id="care-actions"></ul>
    </section>
    <section class="care-card">
      <p class="eyebrow">${escapeHtml(t("care.recipeEyebrow"))}</p>
      <h2 id="care-recipe-title">--</h2>
      <p id="care-recipe-copy">--</p>
    </section>
    <section class="care-card">
      <p class="eyebrow">${escapeHtml(t("care.noteEyebrow"))}</p>
      <p id="care-note">--</p>
    </section>
    <section class="care-card">
      <p class="eyebrow">${escapeHtml(t("care.massageEyebrow"))}</p>
      <p id="care-massage">--</p>
    </section>
  `;
}

function buildCareContext(inputs, phase, day) {
  return {
    phase,
    phaseTitle: getPhaseCopy(phase).title,
    day,
    symptoms: inputs.symptoms.map((id) => ({ id, label: translateSymptom(id) })),
    cuisineStyle: inputs.cuisineStyle,
    pantry: inputs.pantry,
    dietary: {
      vegetarian: inputs.vegetarian,
      vegan: inputs.vegan,
      glutenFree: inputs.glutenFree,
      dairyFree: inputs.dairyFree,
    },
  };
}

async function requestLLMCarePlan(context) {
  try {
    if (window.LunaPlateLLM?.generateCarePlan) {
      return normalizeCarePlan(await window.LunaPlateLLM.generateCarePlan(context));
    }

    const endpoint = window.LunaPlateConfig?.carePlanEndpoint;
    if (!endpoint) return null;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context,
        prompt: buildCarePrompt(context),
      }),
    });
    if (!response.ok) return null;
    return normalizeCarePlan(await response.json());
  } catch (error) {
    console.warn("Care plan LLM fallback:", error);
    return null;
  }
}

function buildCarePrompt(context) {
  return [
    "Generate a concise wellness care plan for a menstrual-cycle app.",
    "Return JSON only with: title, actions array of 4-5 short items, recipeTitle, recipeCopy, note, massage.",
    "Keep it supportive, non-diagnostic, and avoid medical claims.",
    `Context: ${JSON.stringify(context)}`,
  ].join("\n");
}

function normalizeCarePlan(plan) {
  if (!plan || typeof plan !== "object") return null;
  const actions = Array.isArray(plan.actions) ? plan.actions.map(String).filter(Boolean).slice(0, 5) : [];
  if (!actions.length) return null;
  return {
    title: String(plan.title || t("care.defaultTitle")),
    actions,
    recipeTitle: String(plan.recipeTitle || t("care.defaultRecipeTitle")),
    recipeCopy: String(plan.recipeCopy || t("care.defaultRecipeCopy")),
    note: String(plan.note || t("care.defaultNote")),
    massage: String(plan.massage || t("care.defaultMassage")),
  };
}

function buildLocalCarePlan(context) {
  const plans = t("care.plans");
  const symptomActions = t("care.symptomActions");
  const basePlan = plans?.[context.phase] || plans?.luteal;
  const plan = {
    ...basePlan,
    actions: [...(basePlan?.actions || [])],
  };

  context.symptoms.forEach((symptom) => {
    if (symptomActions?.[symptom.id]) plan.actions.push(symptomActions[symptom.id]);
  });
  if (context.pantry.length) {
    plan.recipeCopy += t("care.pantrySuffix", { items: context.pantry.slice(0, 2).join(i18n()?.getLocale() === "zh" ? "ã€" : ", ") });
  }
  plan.actions = [...new Set(plan.actions)].slice(0, 5);
  plan.note = t("care.finalNote");
  return normalizeCarePlan(plan);
}

function renderCarePlanContent(plan, fromLLM) {
  document.querySelector("#care-source").textContent = fromLLM ? t("care.sourceLLM") : t("care.sourceLocal");
  document.querySelector("#care-title").textContent = plan.title;
  document.querySelector("#care-actions").innerHTML = plan.actions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  document.querySelector("#care-recipe-title").textContent = plan.recipeTitle;
  document.querySelector("#care-recipe-copy").textContent = plan.recipeCopy;
  document.querySelector("#care-note").textContent = plan.note;
  document.querySelector("#care-massage").textContent = plan.massage;
}

function titleCase(value) {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function addGroceries(items, source = "") {
  state.grocery = [...new Set([...state.grocery, ...items])].sort();
  saveGrocery();
  renderGrocery();
  const trigger = document.querySelector("#cart-trigger");
  if (trigger) {
    trigger.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], {
      duration: 260,
      easing: "ease-out",
    });
  }
  if (source) {
    const count = document.querySelector("#cart-count");
    if (count) count.title = source;
  }
}

function saveGrocery() {
  storageSet("lunaPlateGrocery", JSON.stringify(state.grocery));
}

function showBootError(message) {
  const banner = document.createElement("div");
  banner.className = "boot-error";
  banner.textContent = message;
  document.body.prepend(banner);
}

function renderGrocery() {
  const cartCount = document.querySelector("#cart-count");
  const selectedCount = document.querySelector("#cart-selected-count");
  const totalCount = document.querySelector("#cart-total-count");
  if (cartCount) cartCount.textContent = String(state.grocery.length);
  if (totalCount) totalCount.textContent = String(state.grocery.length);

  if (!state.grocery.length) {
    if (selectedCount) selectedCount.textContent = "0";
    groceryList.innerHTML = `<div class="cart-empty">${escapeHtml(t("grocery.empty"))}</div>`;
    return;
  }
  groceryList.innerHTML = `
    <section class="grocery-group">
      <div class="grocery-group-heading">
        <h3>${escapeHtml(t("grocery.generatedGroup"))}</h3>
        <span>${escapeHtml(t("grocery.itemCount", { n: state.grocery.length }))}</span>
      </div>
      <div class="grocery-item-list">
        ${state.grocery.map((item, index) => renderGroceryItem(item, index)).join("")}
      </div>
    </section>
  `;
  groceryList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", updateGrocerySelectedCount);
  });
  updateGrocerySelectedCount();
}

function renderGroceryItem(item, index) {
  const id = `grocery-${index}`;
  return `
    <label class="grocery-item" for="${id}">
      <input id="${id}" type="checkbox" ${index === 0 ? "checked" : ""} />
      <span class="grocery-checkbox" aria-hidden="true"></span>
      <span class="grocery-thumb">
        <img src="${escapeHtml(ingredientImageUrl(item))}" alt="" loading="lazy" onerror="this.hidden=true" />
      </span>
      <span class="grocery-copy">
        <strong>${escapeHtml(titleCase(displayIngredientName(item)))}</strong>
        <small>${escapeHtml(defaultIngredientAmount(item))}</small>
      </span>
    </label>
  `;
}

function ingredientImageUrl(item) {
  const clean = displayIngredientName(item).split(/\s+/).slice(-2).join(" ");
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(clean || item)}.png`;
}

function displayIngredientName(item) {
  return String(item)
    .replace(/\([^)]*\)/g, "")
    .replace(/\b\d+\/?\d*\s*(g|kg|ml|l|cup|cups|tbsp|tsp|oz|slice|slices|piece|pieces)?\b/gi, "")
    .replace(/\b(large|small|medium|chopped|sliced|peeled|crushed|fresh|ground|to taste|pinch|dash|bunch|clove|cloves|cup|cups|topping)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || String(item);
}

function defaultIngredientAmount(item) {
  const value = String(item).match(/\b\d+\/?\d*\s*(g|kg|ml|l|cup|cups|tbsp|tsp|oz|slice|slices|piece|pieces)?\b/i);
  return value ? value[0] : t("grocery.asNeeded");
}

function updateGrocerySelectedCount() {
  const selectedCount = document.querySelector("#cart-selected-count");
  if (!selectedCount) return;
  selectedCount.textContent = String(document.querySelectorAll("#grocery-list input[type='checkbox']:checked").length);
}

function addCustomGrocery() {
  const input = document.querySelector("#cart-custom-input");
  const value = input?.value.trim();
  if (!value) return;
  state.grocery = [...new Set([...state.grocery, value])].sort();
  input.value = "";
  saveGrocery();
  renderGrocery();
}

function reset() {
  form.reset();
  setDefaultCycleStart();
  document.querySelector("#cycle-length").value = 28;
  document.querySelector("input[name='cuisine-style'][value='balanced']").checked = true;
  document.querySelector("#cook-time").value = 35;
  document.querySelector("#cook-time-output").textContent = formatMinutes(35);
  document.querySelector("#pantry").value = "";
  state.mealType = "all";
  state.viewCache = { key: "", normalizedMeals: null, ranked: null };
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mealType === "all"));
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function boot() {
  init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
