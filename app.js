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

const symptoms = [
  { id: "cramps" },
  { id: "fatigue" },
  { id: "bloating" },
  { id: "cravings" },
  { id: "low_mood" },
  { id: "high_energy" },
];

const FETCH_TIMEOUT_MS = 12000;
const MAX_EXERCISE_RESULTS = 5;

const state = {
  mealType: "all",
  grocery: loadGrocery(),
  mealSource: "TheMealDB",
  exerciseCache: null,
  femaleMediaCache: new Map(),
  exerciseCacheKey: "",
  currentExercises: [],
  selectedExerciseId: "",
  selectedExerciseDuration: 15,
  countdownTimer: null,
  countdownPaused: false,
  countdownRemaining: 0,
  countdownTotal: 0,
  shuffleSeed: 0,
  renderToken: 0,
  exerciseRenderToken: 0,
  careRenderToken: 0,
  viewCache: { key: "", normalizedMeals: null, ranked: null },
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
    label.innerHTML = `<input type="checkbox" value="${symptom.id}" /><span>${escapeHtml(translateSymptom(symptom.id))}</span>`;
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
  const saved = storageGet(LAST_PERIOD_KEY);
  if (saved) {
    document.querySelector("#last-period").value = saved;
    return;
  }

  const today = new Date();
  document.querySelector("#last-period").valueAsDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4);
}

function saveLastPeriod() {
  const value = document.querySelector("#last-period").value;
  if (value) storageSet(LAST_PERIOD_KEY, value);
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
  document.querySelector("#last-period").addEventListener("input", saveLastPeriod);
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
  document.querySelector("#profile-trigger")?.addEventListener("click", openProfilePanel);
  document.querySelector("#profile-close")?.addEventListener("click", closeProfilePanel);
  document.querySelector("#profile-scrim")?.addEventListener("click", closeProfilePanel);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProfilePanel();
  });
  document.querySelector("#clear-grocery").addEventListener("click", () => {
    state.grocery = [];
    saveGrocery();
    renderGrocery();
  });
  document.querySelector("#surprise-button").addEventListener("click", () => {
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
  document.querySelector("#move-refresh")?.addEventListener("click", () => {
    state.exerciseCache = null;
    state.exerciseCacheKey = "";
    state.selectedExerciseId = "";
    resetMoveCountdown(state.selectedExerciseDuration);
    renderExerciseRecommendations();
  });
  document.querySelector("#move-prev")?.addEventListener("click", () => selectExerciseByOffset(-1));
  document.querySelector("#move-next")?.addEventListener("click", () => selectExerciseByOffset(1));
  bindMovementSwipe();
  document.querySelector("#move-start-button")?.addEventListener("click", () => {
    toggleMoveCountdown();
  });
  const moveProgress = document.querySelector('[data-view="move-api"] .movement-progress');
  const moveStartButton = document.querySelector("#move-start-button");
  if (moveProgress && moveStartButton) {
    moveProgress.insertAdjacentElement("afterend", moveStartButton);
  }
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

function getViewFromHash() {
  const view = window.location.hash.replace("#", "");
  if (view === "move") return "move-api";
  return ["today", "food", "move-api", "care"].includes(view) ? view : "today";
}

function setActiveView(view, options = {}) {
  if (view === "move") view = "move-api";
  if (!["today", "food", "move-api", "care"].includes(view)) view = "today";
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
  if (view === "move-api") renderExerciseRecommendations();
  if (view === "care") renderCarePlan();
}

function updatePhaseBand(phase, day) {
  const phaseCopy = getPhaseCopy(phase);
  document.querySelector("#phase-title").textContent = phaseCopy.title;
  document.querySelector("#phase-description").textContent = phaseCopy.description;
  const dayText = day ? t("status.day", { day }) : t("status.manual");
  document.querySelector("#day-pill").textContent = dayText;
  const summary = document.querySelector("#today-cycle-summary");
  if (summary) summary.textContent = `${phaseCopy.title} · ${dayText}`;

  [1, 2, 3].forEach((number, index) => {
    document.querySelector(`#focus-${word(number)}`).textContent = phaseCopy.focus[index][0];
    document.querySelector(`#focus-${word(number)}-copy`).textContent = phaseCopy.focus[index][1];
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

function refreshLocale() {
  const inputs = getInputs();
  const { phase, day } = estimatePhase(inputs);
  updatePhaseBand(phase, day);
  renderCycleCalendar(inputs);
  document.querySelector("#cook-time-output").textContent = formatMinutes(document.querySelector("#cook-time").value);
  if (document.querySelector('[data-view="care"]')?.classList.contains("active")) {
    renderCarePlan();
  }
  if (document.querySelector('[data-view="move-api"]')?.classList.contains("active")) {
    if (state.currentExercises.length) {
      renderExercisePanel(state.currentExercises, phase, { resetCountdown: false });
    } else {
      renderExerciseRecommendations();
    }
  }

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
    cookTime: Number(document.querySelector("#cook-time").value),
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
  for (let index = 0; index < firstOfMonth.getDay(); index += 1) {
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
  renderCycleCalendar(inputs);
  if (document.querySelector('[data-view="move-api"]')?.classList.contains("active")) {
    renderExerciseRecommendations();
  }
  if (document.querySelector('[data-view="care"]')?.classList.contains("active")) {
    renderCarePlan();
  }

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
    pantry: inputs.pantry.join(","),
  });
  const data = await fetchJson(`/api/meals?${params.toString()}`);
  const meals = (data.meals || []).map(normalizeBackendMeal);
  state.mealSource = data.source || "TheMealDB";
  return meals;
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
    summary: meal.summary || buildFallbackSummary(normalizedMeal),
    ingredients: meal.ingredients || [],
    steps: meal.steps || [t("recipe.followSource")],
    tags,
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
  return score + pseudoRandom(meal.id, state.shuffleSeed);
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
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

  ranked.forEach(({ meal }) => {
    const node = template.content.firstElementChild.cloneNode(true);
    localizeMealCard(node);
    node.querySelector(".meal-type").textContent = translateMealType(meal.type);
    node.querySelector(".meal-time").textContent = formatMinutes(meal.time);
    node.querySelector("h3").textContent = meal.name;
    node.querySelector(".meal-summary").textContent = meal.summary;
    node.querySelector(".tag-row").innerHTML = meal.tags
      .slice(0, 5)
      .map((tag) => `<span class="tag">${escapeHtml(translateTag(tag))}</span>`)
      .join("");
    node.querySelector(".ingredient-list").innerHTML = meal.ingredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join("");
    node.querySelector(".step-list").innerHTML = meal.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    node.querySelector(".add-button").addEventListener("click", () => addGroceries(meal.ingredients));
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
  bestPickButton.onclick = () => addGroceries(best.ingredients);
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
    plan.recipeCopy += t("care.pantrySuffix", { items: context.pantry.slice(0, 2).join(i18n()?.getLocale() === "zh" ? "、" : ", ") });
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

function renderMoveProgress() {
  const minutes = state.selectedExerciseDuration || 15;
  const total = document.querySelector("#move-total-minutes");
  const fill = document.querySelector("#move-progress-fill");
  const label = total?.closest(".movement-progress")?.querySelector("h3");
  if (label) label.textContent = t("movement.recent");
  if (total) total.textContent = formatMinutes(minutes);
  if (fill) fill.style.width = `${Math.min(100, Math.round((minutes / 25) * 100))}%`;
  const countdownLabel = document.querySelector(".countdown-row span");
  if (countdownLabel) countdownLabel.textContent = t("movement.countdown");
}

function resetMoveCountdown(minutes = state.selectedExerciseDuration || 15) {
  if (state.countdownTimer) {
    window.clearInterval(state.countdownTimer);
    state.countdownTimer = null;
  }
  state.countdownTotal = Math.max(1, Math.round(minutes * 60));
  state.countdownRemaining = state.countdownTotal;
  const button = document.querySelector("#move-start-button");
  if (button) button.disabled = false;
  state.countdownPaused = false;
  updateCountdownDisplay();
}

function toggleMoveCountdown() {
  if (state.countdownTimer) {
    pauseMoveCountdown();
    return;
  }
  startMoveCountdown();
}

function pauseMoveCountdown() {
  if (!state.countdownTimer) return;
  window.clearInterval(state.countdownTimer);
  state.countdownTimer = null;
  state.countdownPaused = true;
  updateCountdownDisplay();
}

function startMoveCountdown() {
  if (state.countdownTimer) return;

  const minutes = state.selectedExerciseDuration || 15;
  if (!state.countdownRemaining || state.countdownRemaining <= 0 || state.countdownRemaining > minutes * 60) {
    resetMoveCountdown(minutes);
  }

  state.countdownPaused = false;

  state.countdownTimer = window.setInterval(() => {
    state.countdownRemaining = Math.max(0, state.countdownRemaining - 1);
    updateCountdownDisplay();

    if (state.countdownRemaining <= 0) {
      window.clearInterval(state.countdownTimer);
      state.countdownTimer = null;
      state.countdownPaused = false;
      const completed = Number(storageGet("lunaPlateMoveMinutes") || 0) + minutes;
      storageSet("lunaPlateMoveMinutes", String(completed));
      updateCountdownDisplay();
    }
  }, 1000);
  updateCountdownDisplay();
}

function updateCountdownDisplay() {
  const time = document.querySelector("#move-countdown-time");
  const fill = document.querySelector("#move-countdown-fill");
  const button = document.querySelector("#move-start-button");
  const total = state.countdownTotal || Math.max(1, (state.selectedExerciseDuration || 15) * 60);
  const remaining = state.countdownTotal ? Math.max(0, state.countdownRemaining) : total;

  if (time) time.textContent = formatCountdown(remaining);
  if (fill) fill.style.width = `${Math.round((remaining / total) * 100)}%`;
  if (!button) return;
  button.disabled = false;
  if (state.countdownTimer) {
    button.textContent = t("movement.pause", { time: formatCountdown(remaining) });
  } else if (remaining > 0 && remaining < total) {
    button.textContent = t("movement.resume", { time: formatCountdown(remaining) });
  } else if (remaining <= 0) {
    button.textContent = t("movement.completed");
  } else {
    button.textContent = t("movement.start", { n: state.selectedExerciseDuration || 15 });
  }
}

function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function renderExerciseRecommendations() {
  const title = document.querySelector("#move-title");
  const results = document.querySelector("#move-results");
  if (!title || !results) return;

  const token = (state.exerciseRenderToken += 1);
  const inputs = getInputs();
  const { phase } = estimatePhase(inputs);
  renderMoveProgress();
  renderExerciseLoading();

  try {
    const exercises = await fetchExerciseRecommendations(phase, inputs);
    if (token !== state.exerciseRenderToken) return;
    renderExercisePanel(exercises.slice(0, MAX_EXERCISE_RESULTS), phase);
  } catch (error) {
    if (token !== state.exerciseRenderToken) return;
    console.warn("Female movement API unavailable:", error);
    renderExerciseError(error);
  }
}

function renderExerciseLoading() {
  document.querySelector("#move-source").textContent = t("movement.sourceApi");
  document.querySelector("#move-title").textContent = t("movement.loadingTitle");
  document.querySelector("#move-summary").textContent = t("movement.loadingSummary");
  document.querySelector("#move-steps").innerHTML = `<li>${escapeHtml(t("movement.loadingStep"))}</li>`;
  document.querySelector("#move-results").innerHTML = "";
  document.querySelector("#move-count").textContent = t("results.loading");
}

function renderExerciseError(error) {
  document.querySelector("#move-source").textContent = t("movement.sourceApi");
  document.querySelector("#move-title").textContent = t("movement.unavailableTitle");
  document.querySelector("#move-summary").textContent = t("movement.unavailableNote");
  document.querySelector("#move-steps").innerHTML = `<li>${escapeHtml(t("movement.unavailableStep"))}</li>`;
  document.querySelector("#move-results").innerHTML = "";
  document.querySelector("#move-count").textContent = t("movement.count", { n: 0 });
  document.querySelector("#move-note").textContent = t("movement.unavailableNote");
}

async function fetchExerciseRecommendations(phase, inputs) {
  const cacheKey = buildFemaleExerciseCacheKey(phase, inputs);
  if (state.exerciseCache && state.exerciseCacheKey === cacheKey) {
    return state.exerciseCache;
  }

  const exercises = await fetchFemaleExerciseRecommendations(phase, inputs);
  if (!exercises.length) throw new Error("Female movement API returned no exercises");
  state.exerciseCache = exercises;
  state.exerciseCacheKey = cacheKey;
  return exercises;
}

function buildFemaleExerciseCacheKey(phase, inputs) {
  return JSON.stringify({
    phase,
    symptoms: inputs.symptoms,
  });
}

async function fetchFemaleExerciseRecommendations(phase, inputs) {
  if (window.LunaPlateFemaleExercises?.search) {
    return normalizeFemaleExerciseCollection(await window.LunaPlateFemaleExercises.search(buildFemaleExerciseContext(phase, inputs)));
  }

  const endpoint = window.LunaPlateConfig?.femaleExerciseEndpoint || "/api/female-exercises";
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("gender", "female");
  url.searchParams.set("phase", phase);
  url.searchParams.set("symptoms", inputs.symptoms.join(","));
  url.searchParams.set("limit", "80");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Female movement API returned ${response.status}`);
  return normalizeFemaleExerciseCollection(await response.json());
}

function buildFemaleExerciseContext(phase, inputs) {
  return {
    gender: "female",
    phase,
    symptoms: inputs.symptoms,
    goal: "cycle-aware gentle movement",
    preferredIntensity: phase === "menstrual" ? "low" : "low-to-moderate",
  };
}

function normalizeFemaleExerciseCollection(payload) {
  const list = Array.isArray(payload)
    ? payload
    : payload?.exercises || payload?.results || payload?.data || payload?.items || [];
  return list.map(normalizeFemaleExercise).filter((exercise) => exercise.name);
}

function normalizeFemaleExercise(exercise) {
  const media = normalizeExerciseMedia(
    exercise.media ||
      exercise.video ||
      exercise.image ||
      {
        url: exercise.videoUrl || exercise.video_url || exercise.gifUrl || exercise.gif_url || exercise.imageUrl || exercise.image_url,
        poster: exercise.poster || exercise.posterUrl || exercise.thumbnailUrl,
        source: exercise.source || exercise.provider,
      },
  );
  const instructions = normalizeExerciseInstructions(exercise.instructions || exercise.steps || exercise.cues || exercise.description);

  return {
    id: String(exercise.id || exercise.exerciseId || exercise.exercise_id || exercise.slug || exercise.name || cryptoRandomId()),
    name: exercise.name || exercise.title || exercise.exerciseName || "exercise",
    gifUrl: "",
    media,
    bodyParts: normalizeStringList(exercise.bodyParts || exercise.body_parts || exercise.bodyPart || exercise.category || exercise.categories),
    equipments: normalizeStringList(exercise.equipments || exercise.equipment || exercise.equipmentTypes || exercise.equipment_type),
    targetMuscles: normalizeStringList(exercise.targetMuscles || exercise.target_muscles || exercise.primaryMuscles || exercise.muscles || exercise.muscleGroups),
    instructions,
    duration: Number(exercise.duration || exercise.minutes || exercise.time || 0),
    summary: exercise.summary || "",
    focus: exercise.focus || "",
    safety: exercise.safety || "",
    visualType: exercise.visualType || exercise.visual_type || "",
    source: exercise.source || exercise.provider || "Female movement API",
  };
}

function normalizeStringList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase()).filter(Boolean);
  return String(value)
    .split(/[,/|]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeExerciseInstructions(value) {
  if (Array.isArray(value)) return value.map((step) => String(step).replace(/^Step:\d+\s*/i, "")).filter(Boolean);
  if (!value) return ["Move slowly, keep the range comfortable, and stop if anything feels painful."];
  return String(value)
    .split(/(?:\.\s+|\n+)/)
    .map((step) => step.trim())
    .filter((step) => step.length > 12)
    .slice(0, 5)
    .map((step) => (step.endsWith(".") ? step : `${step}.`));
}

function cryptoRandomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `female-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function exerciseText(exercise) {
  return `${exercise.name} ${exercise.bodyParts.join(" ")} ${exercise.equipments.join(" ")} ${exercise.targetMuscles.join(" ")} ${exercise.instructions.join(" ")}`.toLowerCase();
}

function renderExercisePanel(exercises, phase, options = {}) {
  const uniqueExercises = uniqueExercisesForDisplay(exercises);
  state.currentExercises = uniqueExercises;
  const best = uniqueExercises.find((exercise) => exercise.id === state.selectedExerciseId) || uniqueExercises[0];
  if (!best) {
    renderExerciseError(new Error("Female movement API returned no exercises"));
    return;
  }
  state.selectedExerciseId = best.id;

  document.querySelector("#move-source").textContent = localizeExerciseSource(best.source);
  renderSelectedExercise(best, phase, options);

  const shown = uniqueExercises.filter((exercise) => exercise.id !== best.id).slice(0, 4);
  document.querySelector("#move-count").textContent = t("movement.count", { n: shown.length + 1 });
  document.querySelector("#move-note").textContent = t("movement.note");
  document.querySelector("#move-results").innerHTML = shown.map((exercise) => renderExerciseCard(exercise, best.id)).join("");
  bindExerciseCards(phase);
  updateMovementNavControls();
}

function uniqueExercisesForDisplay(exercises) {
  const seen = new Set();
  return (exercises || []).filter((exercise) => {
    const key = getMovementType(exercise);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectExerciseByOffset(offset) {
  const exercises = state.currentExercises || [];
  if (exercises.length < 2) return;
  const currentIndex = Math.max(0, exercises.findIndex((exercise) => exercise.id === state.selectedExerciseId));
  const nextIndex = (currentIndex + offset + exercises.length) % exercises.length;
  state.selectedExerciseId = exercises[nextIndex].id;
  const inputs = getInputs();
  const { phase } = estimatePhase(inputs);
  renderExercisePanel(exercises, phase);
}

function updateMovementNavControls() {
  const disabled = state.currentExercises.length < 2;
  document.querySelectorAll("#move-prev, #move-next").forEach((button) => {
    button.disabled = disabled;
  });
}

function bindMovementSwipe() {
  const media = document.querySelector(".movement-media");
  const hero = document.querySelector(".movement-hero");
  if (!media || !hero) return;

  hero.tabIndex = 0;
  hero.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectExerciseByOffset(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectExerciseByOffset(1);
    }
  });

  let startX = 0;
  let startY = 0;
  let active = false;

  media.addEventListener("pointerdown", (event) => {
    active = true;
    startX = event.clientX;
    startY = event.clientY;
    media.setPointerCapture?.(event.pointerId);
  });

  media.addEventListener("pointerup", (event) => {
    if (!active) return;
    active = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    selectExerciseByOffset(dx < 0 ? 1 : -1);
  });

  media.addEventListener("pointercancel", () => {
    active = false;
  });
}

function renderSelectedExercise(best, phase, options = {}) {
  const duration = estimateExerciseDuration(best, phase);
  const guide = getExerciseGuide(best);
  const title = guide.title || titleCase(best.name);
  state.selectedExerciseDuration = duration;

  document.querySelector("#move-best-title").textContent = title;
  document.querySelector("#move-best-meta").textContent = t("movement.defaultMeta", { n: duration });
  document.querySelector("#move-title").textContent = title;
  document.querySelector("#move-summary").textContent = buildSelectedExerciseSummary(best, phase, guide);
  document.querySelector("#move-focus").textContent = guide.cues?.join(" · ") || t("movement.defaultFocus");
  const safety = document.querySelector("#move-safety");
  if (safety) safety.textContent = guide.safety || t("movement.defaultSafety");
  document.querySelector("#move-step-title").textContent = title;
  document.querySelector("#move-steps").innerHTML = buildExerciseSteps(best, guide)
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");

  renderExerciseMedia(best);

  renderMoveProgress();
  if (options.resetCountdown === false) {
    updateCountdownDisplay();
  } else {
    resetMoveCountdown(duration);
  }
}

async function renderExerciseMedia(exercise) {
  const media = await resolveExerciseMedia(exercise);
  if (state.selectedExerciseId !== exercise.id) return;
  presentExerciseMedia(exercise, media);
}

async function resolveExerciseMedia(exercise) {
  const cacheKey = exercise.id || exercise.name;
  if (state.femaleMediaCache.has(cacheKey)) return state.femaleMediaCache.get(cacheKey);

  const femaleMedia = await fetchFemaleExerciseMedia(exercise);
  const media = femaleMedia || getGeneratedMovementMedia(exercise);
  state.femaleMediaCache.set(cacheKey, media);
  return media;
}

function getGeneratedMovementMedia(exercise) {
  const visualType = getMovementVisualType(exercise);
  const available = {
    "cat-cow": "cat-cow.webp",
    "child-pose": "child-pose.webp",
    "neck-release": "neck-release.webp",
    "hip-rock": "hip-rock.webp",
    twist: "twist.webp",
    breath: "breath.webp",
    "side-stretch": "side-stretch.webp",
    "forward-fold": "forward-fold.webp",
    butterfly: "butterfly.webp",
    "legs-wall": "legs-wall.webp",
    "shoulder-rolls": "shoulder-rolls.webp",
    "mindful-walk": "mindful-walk.webp",
  };
  if (!available[visualType]) {
    return {
      type: "vector",
      url: "",
      sourceKey: "movement.sourceVector",
    };
  }
  return {
    type: "image",
    url: `assets/movement/${available[visualType]}`,
    sourceKey: "movement.sourceVector",
  };
}

async function fetchFemaleExerciseMedia(exercise) {
  try {
    if (exercise.media?.url) return exercise.media;

    if (window.LunaPlateFemaleMedia?.resolve) {
      return normalizeExerciseMedia(await window.LunaPlateFemaleMedia.resolve(exercise));
    }

    const endpoint = window.LunaPlateConfig?.femaleExerciseMediaEndpoint || "/api/female-exercise-media";
    if (!window.LunaPlateConfig?.femaleExerciseMediaEndpoint) return null;

    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("name", exercise.name);
    url.searchParams.set("gender", "female");
    url.searchParams.set("bodyParts", exercise.bodyParts.join(","));
    url.searchParams.set("targetMuscles", exercise.targetMuscles.join(","));
    url.searchParams.set("equipment", exercise.equipments.join(","));

    const response = await fetch(url);
    if (!response.ok) return null;
    return normalizeExerciseMedia(await response.json());
  } catch (error) {
    console.warn("Female exercise media fallback:", error);
    return null;
  }
}

function normalizeExerciseMedia(media) {
  if (!media || typeof media !== "object" || !media.url) return null;
  const type = media.type === "video" || /\.(mp4|webm|mov)(?:\?|$)/i.test(media.url) ? "video" : "image";
  return {
    type,
    url: String(media.url),
    poster: media.poster ? String(media.poster) : "",
    source: media.source ? String(media.source) : "Female movement library",
  };
}

function presentExerciseMedia(exercise, media) {
  const gif = document.querySelector("#move-gif");
  const video = document.querySelector("#move-video");
  const placeholder = document.querySelector("#move-placeholder");
  if (!gif || !video || !placeholder) return;

  gif.hidden = true;
  video.hidden = true;
  placeholder.hidden = true;
  gif.removeAttribute("src");
  video.removeAttribute("src");
  video.removeAttribute("poster");

  if (media.type !== "vector") {
    document.querySelector("#move-source").textContent = media.sourceKey ? t(media.sourceKey) : localizeExerciseSource(media.source);
  }

  if (media.type === "video" && media.url) {
    video.src = media.url;
    if (media.poster) video.poster = media.poster;
    video.hidden = false;
    video.load();
    video.play().catch(() => {
      // controls stay available if autoplay is blocked
    });
    return;
  }

  if (media.url) {
    gif.alt = getExerciseGuide(exercise).title || titleCase(exercise.name);
    gif.onerror = () => {
      gif.hidden = true;
      renderExerciseGuidePlaceholder(placeholder, exercise);
    };
    gif.src = media.url;
    gif.hidden = false;
    return;
  }

  renderExerciseGuidePlaceholder(placeholder, exercise);
}

function renderExerciseGuidePlaceholder(placeholder, exercise) {
  placeholder.hidden = false;
  document.querySelector("#move-source").textContent = t("movement.sourceVector");
  placeholder.innerHTML = buildExerciseGuideMarkup(exercise);
}

function localizeExerciseSource(source) {
  if (!source) return t("movement.sourceApi");
  const normalized = String(source).toLowerCase();
  if (normalized.includes("female movement")) return t("movement.sourceApi");
  return normalized.includes("local") || normalized.includes("generated") || normalized.includes("vector")
    ? t("movement.sourceVector")
    : source;
}

function buildExerciseGuideMarkup(exercise) {
  const guide = getExerciseGuide(exercise);
  const visualType = getMovementVisualType(exercise);
  return `
    <div class="movement-guide-figure ${visualType}" aria-hidden="true">
      ${buildMovementVector(visualType)}
    </div>
    <div class="movement-guide-copy">
      <strong>${escapeHtml(guide.title)}</strong>
      <span>${escapeHtml(guide.breath)}</span>
      <small>${guide.cues.map((cue) => escapeHtml(cue)).join(" · ")}</small>
    </div>
  `;
}

function getMovementVisualType(exercise) {
  return getMovementType(exercise);
}

function getMovementType(exercise) {
  if (exercise.visualType) return exercise.visualType;
  const text = exerciseText(exercise);
  if (containsAny(text, ["side stretch", "side-body", "side body"])) return "side-stretch";
  if (containsAny(text, ["forward fold", "hamstring"])) return "forward-fold";
  if (containsAny(text, ["butterfly", "inner thighs"])) return "butterfly";
  if (containsAny(text, ["legs up", "wall"])) return "legs-wall";
  if (containsAny(text, ["shoulder roll"])) return "shoulder-rolls";
  if (containsAny(text, ["walk", "mindful"])) return "mindful-walk";
  if (containsAny(text, ["cat", "cow", "spine", "back"])) return "cat-cow";
  if (containsAny(text, ["child", "pose", "breathing"])) return "child-pose";
  if (containsAny(text, ["neck", "shoulder"])) return "neck-release";
  if (containsAny(text, ["hip", "upper legs", "glute", "pelvic"])) return "hip-rock";
  if (containsAny(text, ["rotation", "twist", "waist"])) return "twist";
  return "breath";
}

function getMovementGuideKey(type) {
  return {
    "cat-cow": "catCow",
    "child-pose": "childPose",
    "neck-release": "neckRelease",
    "hip-rock": "hipRock",
    twist: "twist",
    breath: "breath",
    "side-stretch": "sideStretch",
    "forward-fold": "forwardFold",
    butterfly: "butterfly",
    "legs-wall": "legsWall",
    "shoulder-rolls": "shoulderRolls",
    "mindful-walk": "mindfulWalk",
  }[type] || "default";
}

function buildMovementVector(type) {
  const sharedStart = `
    <svg class="movement-vector" viewBox="0 0 220 148" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="mv-soft" x1="0" x2="1">
          <stop offset="0" stop-color="#8f6aa4" />
          <stop offset="1" stop-color="#d7828f" />
        </linearGradient>
      </defs>
      <ellipse class="mv-shadow" cx="110" cy="128" rx="72" ry="10" />
  `;
  const sharedEnd = "</svg>";
  const shapes = {
    "cat-cow": `
      <path class="mv-back mv-breathe" d="M52 78 C82 52, 128 52, 161 78" />
      <circle class="mv-head mv-breathe" cx="174" cy="69" r="13" />
      <path class="mv-limb" d="M70 80 L62 118" />
      <path class="mv-limb" d="M142 80 L151 118" />
      <path class="mv-limb" d="M88 74 L92 118" />
      <path class="mv-limb" d="M125 74 L121 118" />
      <path class="mv-breath-line" d="M35 48 C50 35, 70 35, 85 48" />
    `,
    "child-pose": `
      <circle class="mv-head mv-sway" cx="78" cy="90" r="13" />
      <path class="mv-back mv-sway" d="M92 88 C112 70, 145 72, 168 95" />
      <path class="mv-limb" d="M76 101 C96 111, 132 113, 174 106" />
      <path class="mv-limb" d="M102 100 C86 117, 66 122, 46 116" />
      <path class="mv-limb" d="M135 100 C124 118, 102 124, 80 119" />
      <path class="mv-breath-line" d="M54 57 C70 45, 92 45, 108 57" />
    `,
    "neck-release": `
      <path class="mv-body" d="M108 82 L108 123" />
      <circle class="mv-head mv-tilt" cx="110" cy="58" r="17" />
      <path class="mv-limb" d="M79 91 C98 82, 122 82, 141 91" />
      <path class="mv-limb" d="M83 105 L65 124" />
      <path class="mv-limb" d="M137 105 L154 124" />
      <path class="mv-breath-line" d="M141 50 C158 42, 172 45, 181 57" />
    `,
    "hip-rock": `
      <circle class="mv-head" cx="58" cy="91" r="13" />
      <path class="mv-body" d="M72 94 C99 100, 127 100, 154 94" />
      <path class="mv-limb" d="M98 99 C108 78, 128 78, 138 100" />
      <path class="mv-limb mv-rock" d="M138 100 C153 95, 171 101, 180 116" />
      <path class="mv-limb mv-rock" d="M101 100 C87 96, 71 103, 63 118" />
      <path class="mv-breath-line" d="M92 60 C110 48, 136 48, 154 60" />
    `,
    twist: `
      <circle class="mv-head mv-sway" cx="112" cy="45" r="15" />
      <path class="mv-body mv-sway" d="M110 62 C103 84, 104 106, 113 125" />
      <path class="mv-limb" d="M75 84 C99 78, 128 78, 153 86" />
      <path class="mv-limb" d="M98 124 C83 118, 70 110, 61 98" />
      <path class="mv-limb" d="M118 124 C137 119, 153 110, 162 96" />
      <path class="mv-breath-line" d="M147 60 C165 55, 178 60, 184 73" />
    `,
    breath: `
      <circle class="mv-head mv-breathe" cx="110" cy="50" r="16" />
      <path class="mv-body mv-breathe" d="M110 66 L110 122" />
      <path class="mv-limb mv-breathe" d="M76 84 C96 75, 124 75, 144 84" />
      <path class="mv-limb" d="M96 122 C86 116, 78 109, 70 99" />
      <path class="mv-limb" d="M120 122 C134 116, 145 108, 153 98" />
      <circle class="mv-breath-circle" cx="110" cy="84" r="34" />
    `,
  };
  return `${sharedStart}${shapes[type] || shapes.breath}${sharedEnd}`;
}

function getExerciseGuide(exercise) {
  return t(`movement.guide.${getMovementGuideKey(getMovementType(exercise))}`);
}

function renderExerciseCard(exercise, selectedId = "") {
  const guide = getExerciseGuide(exercise);
  const title = guide.title || titleCase(exercise.name);
  const summary = buildExerciseSummary(exercise, "", guide);
  const focus = guide.cues?.join(" · ") || t("movement.defaultFocus");
  const meta = (guide.cues || []).slice(0, 3);
  const duration = Number(exercise.duration) || "";
  return `
    <button type="button" class="exercise-card${exercise.id === selectedId ? " active" : ""}" data-exercise-id="${escapeHtml(exercise.id)}">
      <div class="exercise-card-heading">
        <h3>${escapeHtml(title)}</h3>
        ${duration ? `<span>${escapeHtml(formatMinutes(duration))}</span>` : ""}
      </div>
      <p>${escapeHtml(summary)}</p>
      <p class="exercise-focus">${escapeHtml(focus)}</p>
      <div class="exercise-meta">
        ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </button>
  `;
}

function bindExerciseCards(phase) {
  document.querySelectorAll("#move-results [data-exercise-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const exercise = state.currentExercises.find((item) => item.id === card.dataset.exerciseId);
      if (!exercise) return;
      state.selectedExerciseId = exercise.id;
      renderExercisePanel(state.currentExercises, phase);
    });
  });
}

function estimateExerciseDuration(exercise, phase) {
  if (Number(exercise.duration) > 0) return Number(exercise.duration);
  const text = `${exercise.name} ${exercise.bodyParts.join(" ")} ${exercise.equipments.join(" ")} ${exercise.targetMuscles.join(" ")}`.toLowerCase();
  const baseByPhase = {
    menstrual: 10,
    follicular: 18,
    ovulation: 20,
    luteal: 15,
  };
  let minutes = baseByPhase[phase] || 15;
  if (text.includes("stretch") || text.includes("pose") || text.includes("dog") || text.includes("spine")) minutes -= 2;
  if (text.includes("raise") || text.includes("curl") || text.includes("rotation")) minutes += 2;
  if (text.includes("dip") || text.includes("pull") || text.includes("push") || text.includes("barbell")) minutes += 4;
  if (exercise.equipments.some((item) => item.includes("body weight"))) minutes -= 1;
  return Math.max(8, Math.min(25, Math.round(minutes / 5) * 5));
}

function buildExerciseSummary(exercise, phase = "", guide = getExerciseGuide(exercise)) {
  const body = humanList(exercise.bodyParts);
  const target = humanList(exercise.targetMuscles);
  const phaseCopy = phase ? `${getPhaseCopy(phase).title} · ` : "";
  if (guide?.breath) return formatGuideSummary(phaseCopy, guide);
  if (exercise.summary) return `${phaseCopy}${exercise.summary}`;
  return `${phaseCopy}${body || "gentle movement"} for ${target || "mobility"}, using ${humanList(exercise.equipments) || "simple setup"}.`;
}

function buildSelectedExerciseSummary(exercise, phase = "", guide = getExerciseGuide(exercise)) {
  const phaseCopy = phase ? `${getPhaseCopy(phase).title} · ` : "";
  if (guide?.breath) return formatGuideSummary(phaseCopy, guide);
  if (exercise.summary) return `${phaseCopy}${exercise.summary}`;
  return buildExerciseSummary(exercise, phase, guide);
}

function formatGuideSummary(prefix, guide) {
  const end = i18n()?.getLocale() === "zh" ? "。" : ".";
  const gap = i18n()?.getLocale() === "zh" ? "" : " ";
  return `${prefix}${guide.breath}${end}${gap}${guide.cues.join(" · ")}${end}`;
}

function buildExerciseSteps(exercise, guide = getExerciseGuide(exercise)) {
  if (guide?.cues?.length) return [guide.breath, ...guide.cues].filter(Boolean);
  return exercise.instructions.slice(0, 4);
}

function humanList(items) {
  return [...new Set((items || []).filter(Boolean))].slice(0, 3).join(", ");
}

function titleCase(value) {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function addGroceries(items) {
  state.grocery = [...new Set([...state.grocery, ...items])].sort();
  saveGrocery();
  renderGrocery();
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
  if (!state.grocery.length) {
    groceryList.innerHTML = `<li>${escapeHtml(t("grocery.empty"))}</li>`;
    return;
  }
  groceryList.innerHTML = state.grocery.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
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
