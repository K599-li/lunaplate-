(function () {
  const STORAGE_KEY = "lunaplate.cycles.v1";
  const LEGACY_LAST_PERIOD_KEY = "lunaPlateLastPeriod";
  const SCHEMA_VERSION = 1;
  const DEFAULT_SETTINGS = {
    avgCycleLength: 28,
    avgPeriodLength: 5,
    manualOverride: null,
  };

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isValidDateString(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function clampInteger(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.round(number)));
  }

  function normalizeManualOverride(value) {
    return ["menstrual", "follicular", "ovulation", "luteal"].includes(value) ? value : null;
  }

  function normalizeSettings(settings) {
    const source = isPlainObject(settings) ? settings : {};
    return {
      avgCycleLength: clampInteger(source.avgCycleLength, DEFAULT_SETTINGS.avgCycleLength, 21, 45),
      avgPeriodLength: clampInteger(source.avgPeriodLength, DEFAULT_SETTINGS.avgPeriodLength, 2, 10),
      manualOverride: normalizeManualOverride(source.manualOverride),
    };
  }

  function normalizeCycle(cycle) {
    if (!isPlainObject(cycle) || !isValidDateString(cycle.startDate)) return null;
    const endDate = cycle.endDate || null;
    if (endDate !== null && !isValidDateString(endDate)) return null;
    if (endDate !== null && endDate < cycle.startDate) return null;
    return {
      startDate: cycle.startDate,
      endDate,
    };
  }

  function normalizeCycles(cycles) {
    const byStartDate = new Map();
    (Array.isArray(cycles) ? cycles : []).forEach((cycle) => {
      const normalized = normalizeCycle(cycle);
      if (normalized) byStartDate.set(normalized.startDate, normalized);
    });
    return [...byStartDate.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      cycles: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  function migrateLegacyState() {
    const legacyStartDate = storageGet(LEGACY_LAST_PERIOD_KEY);
    const state = emptyState();
    if (isValidDateString(legacyStartDate)) {
      state.cycles = [{ startDate: legacyStartDate, endDate: null }];
    }
    return state;
  }

  function parseSavedState() {
    const raw = storageGet(STORAGE_KEY);
    if (!raw) return migrateLegacyState();
    try {
      return JSON.parse(raw);
    } catch {
      return migrateLegacyState();
    }
  }

  function normalizeState(state) {
    return {
      schemaVersion: SCHEMA_VERSION,
      cycles: normalizeCycles(state?.cycles),
      settings: normalizeSettings(state?.settings),
    };
  }

  function save(state) {
    const normalized = normalizeState(state);
    storageSet(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function load() {
    return save(parseSavedState());
  }

  function latestCycle(state = load()) {
    return state.cycles[state.cycles.length - 1] || null;
  }

  function replaceCycles(cycles) {
    const state = load();
    state.cycles = cycles;
    return save(state);
  }

  function addCycle(cycle) {
    const state = load();
    const normalized = normalizeCycle(cycle);
    if (!normalized) return state;
    state.cycles = normalizeCycles([...state.cycles, normalized]);
    return save(state);
  }

  function updateCycle(index, patch) {
    const state = load();
    if (!Number.isInteger(index) || index < 0 || index >= state.cycles.length) return state;
    const nextCycle = normalizeCycle({ ...state.cycles[index], ...patch });
    if (!nextCycle) return state;
    state.cycles[index] = nextCycle;
    return save(state);
  }

  function deleteCycle(index) {
    const state = load();
    if (!Number.isInteger(index) || index < 0 || index >= state.cycles.length) return state;
    state.cycles.splice(index, 1);
    return save(state);
  }

  function upsertCycleByStartDate(cycle) {
    const normalized = normalizeCycle(cycle);
    const state = load();
    if (!normalized) return state;
    const index = state.cycles.findIndex((item) => item.startDate === normalized.startDate);
    if (index >= 0) {
      state.cycles[index] = normalized;
    } else {
      state.cycles.push(normalized);
    }
    return save(state);
  }

  function updateSettings(patch) {
    const state = load();
    state.settings = normalizeSettings({ ...state.settings, ...patch });
    return save(state);
  }

  window.CycleStore = {
    STORAGE_KEY,
    LEGACY_LAST_PERIOD_KEY,
    SCHEMA_VERSION,
    DEFAULT_SETTINGS,
    load,
    save,
    replaceCycles,
    addCycle,
    updateCycle,
    deleteCycle,
    upsertCycleByStartDate,
    updateSettings,
    latestCycle,
  };
})();
