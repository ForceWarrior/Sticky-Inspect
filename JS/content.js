(function () {
  const STORAGE_PREFIX = "stickyInspectRules:";
  const THEME_STORAGE_KEY = "stickyInspectTheme";
  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:", "file:"]);
  const PANEL_HOST_ID = "sticky-inspect-host";
  const HIGHLIGHT_ID = "sticky-inspect-highlight";
  const INITIAL_CLOAK_ID = "sticky-inspect-initial-cloak";
  const RULE_CLOAK_ID = "sticky-inspect-rule-cloak";
  const RULE_READY_ATTRIBUTE = "data-sticky-inspect-ready";
  const PANEL_OPEN_SESSION_KEY = "stickyInspect:panelOpen";
  const PANEL_VIEW_SESSION_KEY = "stickyInspect:panelView";
  const PANEL_POSITION_SESSION_KEY = "stickyInspect:panelPosition";
  const PANEL_STATE_STORAGE_PREFIX = "stickyInspectPanelState:";
  const REAPPLY_DEBOUNCE_MS = 150;
  const INITIAL_APPLY_INTERVAL_MS = 16;
  const INITIAL_APPLY_WINDOW_MS = 5000;
  const INITIAL_CLOAK_MAX_MS = 5000;

  const pageKey = GetPageKey(window.location.href);
  const storageKey = pageKey ? `${STORAGE_PREFIX}${pageKey}` : null;
  const panelStateStorageKey = pageKey ? `${PANEL_STATE_STORAGE_PREFIX}${pageKey}` : null;

  const THEMES = [
    { id: "evergreen", name: "Evergreen", accent: "#10b981", bg: "#0f1f1a", surface: "#122b22", field: "#0a1612", border: "#1f3b30", text: "#ecfdf5", muted: "#6ee7b7", soft: "#a7f3d0", hint: "#5eead4", tagBg: "#042f1f", primaryText: "#052e1a", danger: "#fca5a5", dangerBorder: "#4c1d1d", shadow: "rgba(0, 0, 0, 0.45)" },
    { id: "midnight", name: "Midnight", accent: "#60a5fa", bg: "#0b1220", surface: "#111827", field: "#070d18", border: "#263248", text: "#eff6ff", muted: "#93c5fd", soft: "#bfdbfe", hint: "#67e8f9", tagBg: "#0b2545", primaryText: "#07111f", danger: "#fda4af", dangerBorder: "#4c1d2a", shadow: "rgba(0, 0, 0, 0.5)" },
    { id: "orchid", name: "Orchid", accent: "#c084fc", bg: "#1a1024", surface: "#24132f", field: "#120a1c", border: "#3b2450", text: "#faf5ff", muted: "#d8b4fe", soft: "#e9d5ff", hint: "#f0abfc", tagBg: "#2e1065", primaryText: "#1b0b2b", danger: "#fca5a5", dangerBorder: "#4c1d1d", shadow: "rgba(0, 0, 0, 0.48)" },
    { id: "ember", name: "Ember", accent: "#fb923c", bg: "#20130d", surface: "#2a190f", field: "#160c08", border: "#4a2b17", text: "#fff7ed", muted: "#fdba74", soft: "#fed7aa", hint: "#facc15", tagBg: "#431407", primaryText: "#221006", danger: "#fecaca", dangerBorder: "#5f1b1b", shadow: "rgba(0, 0, 0, 0.5)" },
    { id: "rose", name: "Rose", accent: "#fb7185", bg: "#241016", surface: "#2d121b", field: "#18090e", border: "#522333", text: "#fff1f2", muted: "#fda4af", soft: "#fecdd3", hint: "#f9a8d4", tagBg: "#4c0519", primaryText: "#2a0710", danger: "#fde68a", dangerBorder: "#713f12", shadow: "rgba(0, 0, 0, 0.48)" },
    { id: "slate", name: "Slate", accent: "#94a3b8", bg: "#111827", surface: "#1f2937", field: "#0f172a", border: "#334155", text: "#f8fafc", muted: "#cbd5e1", soft: "#e2e8f0", hint: "#a5b4fc", tagBg: "#1e293b", primaryText: "#0f172a", danger: "#fca5a5", dangerBorder: "#4c1d1d", shadow: "rgba(0, 0, 0, 0.5)" },
    { id: "sunrise", name: "Sunrise", accent: "#f59e0b", bg: "#1f1a0b", surface: "#2a220f", field: "#161207", border: "#4b3a16", text: "#fffbeb", muted: "#fcd34d", soft: "#fde68a", hint: "#86efac", tagBg: "#422006", primaryText: "#231400", danger: "#fca5a5", dangerBorder: "#4c1d1d", shadow: "rgba(0, 0, 0, 0.48)" },
    { id: "aqua", name: "Aqua", accent: "#22d3ee", bg: "#082025", surface: "#0d2d34", field: "#06161a", border: "#1d4c55", text: "#ecfeff", muted: "#67e8f9", soft: "#a5f3fc", hint: "#5eead4", tagBg: "#164e63", primaryText: "#05252c", danger: "#fca5a5", dangerBorder: "#4c1d1d", shadow: "rgba(0, 0, 0, 0.46)" },
    { id: "graphite", name: "Graphite", accent: "#e5e7eb", bg: "#121212", surface: "#1d1d1d", field: "#0b0b0b", border: "#333333", text: "#f5f5f5", muted: "#d4d4d4", soft: "#e5e5e5", hint: "#a3e635", tagBg: "#262626", primaryText: "#111111", danger: "#fca5a5", dangerBorder: "#4c1d1d", shadow: "rgba(0, 0, 0, 0.55)" },
    { id: "contrast", name: "Contrast", accent: "#f8fafc", bg: "#050505", surface: "#101010", field: "#000000", border: "#5b5b5b", text: "#ffffff", muted: "#ffffff", soft: "#f1f5f9", hint: "#fde047", tagBg: "#1a1a1a", primaryText: "#000000", danger: "#ffb4b4", dangerBorder: "#7f1d1d", shadow: "rgba(0, 0, 0, 0.65)" },
    { id: "paper", name: "Paper", accent: "#059669", bg: "#f8fafc", surface: "#ffffff", field: "#f1f5f9", border: "#cbd5e1", text: "#0f172a", muted: "#047857", soft: "#065f46", hint: "#0f766e", tagBg: "#dcfce7", primaryText: "#ecfdf5", danger: "#b91c1c", dangerBorder: "#fecaca", shadow: "rgba(15, 23, 42, 0.18)" },
    { id: "neon", name: "Neon", accent: "#22ff88", bg: "#0a0014", surface: "#140026", field: "#06000d", border: "#3d1166", text: "#f5d0fe", muted: "#ff7ad9", soft: "#fbcfe8", hint: "#22d3ee", tagBg: "#240046", primaryText: "#031f10", danger: "#ff6b6b", dangerBorder: "#7f1d1d", shadow: "rgba(34, 211, 238, 0.35)" },
  ];

  let activeRules = [];
  let observer = null;
  let applyScheduled = false;
  let isApplyingRules = false;

  let pickerActive = false;
  let selectedElement = null;
  let highlightedElement = null;
  let panelHost = null;
  let highlightBox = null;
  let panelElement = null;
  let initialPhaseActive = false;
  let initialCloakElement = null;
  let ruleCloakElement = null;
  let panelDragState = null;
  let activeThemeId = THEMES[0].id;
  let panelSessionState = { open: false, view: "menu", left: null, top: null };
  let skipNextPositionRestore = false;

  if (IsSupportedPage()) {
    InstallInitialCloak();
  }

  const initialLoadPromise = Initialize();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    HandleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return true;
  });

  window.addEventListener("beforeunload", SavePanelPosition, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      SavePanelPosition();
    }
  });

  async function Initialize() {
    if (!IsSupportedPage()) {
      RemoveInitialCloak();
      return false;
    }

    await WaitForDocumentElement();
    StartObserver();

    activeThemeId = await ReadThemeId();
    activeRules = await ReadRules();

    try {
      const sessionOpen = window.sessionStorage.getItem(PANEL_OPEN_SESSION_KEY) === "1";
      if (sessionOpen) {
        const storedPanelState = await ReadStoredPanelState();
        if (storedPanelState) {
          panelSessionState = { ...panelSessionState, ...storedPanelState, open: true };
        }
        EnsureOverlay();
        RestorePanelView(panelSessionState.view);
      }
    } catch (e) {}

    if (!activeRules.length) {
      RemoveInitialCloak();
      return true;
    }

    StartInitialApplyBurst();
    return true;
  }

  async function HandleMessage(message) {
    switch (message?.type) {
      case "stickyInspect:getStatus":
        await initialLoadPromise;
        return GetStatus();
      case "stickyInspect:openMenu":
        await initialLoadPromise;
        return OpenMenu(message.forceDefaultPosition === true);
      case "stickyInspect:startPicker":
        await initialLoadPromise;
        return StartPicker();
      case "stickyInspect:apply":
        await initialLoadPromise;
        return ApplyRulesNow();
      case "stickyInspect:clear":
        await initialLoadPromise;
        return ClearRules();
      default:
        return {
          ok: false,
          error: "Unknown message type.",
        };
    }
  }

  async function GetStatus() {
    activeRules = await ReadRules();

    return {
      ok: true,
      supported: IsSupportedPage(),
      pageKey,
      ruleCount: activeRules.length,
      pickerActive,
    };
  }

  async function StartPicker() {
    if (!IsSupportedPage()) {
      return {
        ok: false,
        error: "This page cannot be modified by the extension.",
      };
    }

    if (pickerActive) {
      return {
        ok: true,
        message: "Picker is already active on this tab.",
      };
    }

    EnsureOverlay();
    pickerActive = true;
    selectedElement = null;
    highlightedElement = null;

    RenderPickerPanel();
    AddPickerListeners();

    return {
      ok: true,
      message: "Picker started. Hover an element, then click it.",
    };
  }

  async function OpenMenu(forceDefaultPosition) {
    if (!IsSupportedPage()) {
      return {
        ok: false,
        error: "This page cannot be modified by the extension.",
      };
    }

    if (panelHost?.isConnected && panelElement && !forceDefaultPosition) {
      return { ok: true, alreadyOpen: true };
    }

    activeThemeId = await ReadThemeId();
    EnsureOverlay();
    skipNextPositionRestore = true;
    if (panelElement) {
      panelElement.style.left = "";
      panelElement.style.top = "";
      panelElement.style.right = "24px";
    }
    if (highlightBox) {
      highlightBox.style.display = "none";
    }
    activeRules = await ReadRules();
    panelSessionState = { open: true, view: "menu", left: null, top: null };
    if (panelStateStorageKey) {
      await chrome.storage.local.remove(panelStateStorageKey).catch(() => {});
    }
    try {
      window.sessionStorage.setItem(PANEL_OPEN_SESSION_KEY, "1");
      window.sessionStorage.removeItem(PANEL_POSITION_SESSION_KEY);
    } catch (e) {}
    RenderMenuPanel();
    if (panelElement) {
      panelElement.style.left = "";
      panelElement.style.top = "";
      panelElement.style.right = "24px";
    }

    return { ok: true };
  }

  async function ApplyRulesNow() {
    if (!IsSupportedPage()) {
      return {
        ok: false,
        error: "This page cannot be modified by the extension.",
      };
    }

    activeRules = await ReadRules();
    const appliedCount = ApplyAllRules();

    return {
      ok: true,
      ruleCount: activeRules.length,
      appliedCount,
    };
  }

  async function ClearRules() {
    if (!storageKey) {
      return {
        ok: false,
        error: "This page cannot be modified by the extension.",
      };
    }

    await chrome.storage.local.remove(storageKey);
    activeRules = [];
    RefreshRuleCloak();

    return {
      ok: true,
      ruleCount: 0,
    };
  }

  function StartObserver() {
    if (observer || !document.documentElement) {
      return;
    }

    observer = new MutationObserver(() => {
      if (isApplyingRules) {
        return;
      }

      ScheduleRuleApply();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  function StartInitialApplyBurst() {
    initialPhaseActive = true;
    const burstStartedAt = Date.now();
    let stableHits = 0;

    const AllSatisfied = () => activeRules.every(IsRuleSatisfied);

    const ApplyPass = () => {
      ApplyAllRules();
      if (AllSatisfied()) {
        stableHits += 1;
      } else {
        stableHits = 0;
      }
    };

    const StopBurst = () => {
      window.clearInterval(intervalId);
      initialPhaseActive = false;
      RemoveInitialCloak();
    };

    const intervalId = window.setInterval(() => {
      ApplyPass();

      const elapsed = Date.now() - burstStartedAt;
      const domReady = document.readyState !== "loading";
      if ((stableHits >= 3 && domReady) || elapsed >= INITIAL_APPLY_WINDOW_MS) {
        StopBurst();
      }
    }, INITIAL_APPLY_INTERVAL_MS);

    ApplyPass();

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        ApplyPass();
      },
      { once: true }
    );

    window.addEventListener(
      "load",
      () => {
        ApplyPass();
      },
      { once: true }
    );

    window.setTimeout(() => {
      StopBurst();
    }, INITIAL_CLOAK_MAX_MS);
  }

  function ScheduleRuleApply() {
    if (applyScheduled) {
      return;
    }

    applyScheduled = true;
    queueMicrotask(() => {
      applyScheduled = false;
      ApplyAllRules();
    });
  }

  function ApplyAllRules() {
    if (!activeRules.length) {
      RefreshRuleCloak();
      return 0;
    }

    let appliedCount = 0;
    isApplyingRules = true;

    try {
      RefreshRuleCloak();
      for (const rule of activeRules) {
        appliedCount += ApplyRule(rule);
      }
    } finally {
      isApplyingRules = false;
    }

    return appliedCount;
  }

  function ApplyRule(rule) {
    if (!rule?.action) {
      return 0;
    }

    if (rule.action === "injectCSS") {
      return ApplyInjectCSS(rule) ? 1 : 0;
    }

    if (!rule.selector) {
      return 0;
    }

    let elements;

    try {
      elements = document.querySelectorAll(rule.selector);
    } catch (error) {
      return 0;
    }

    let appliedCount = 0;

    for (const element of elements) {
      if (ApplyRuleToElement(rule, element)) {
        MarkRuleApplied(rule, element);
        appliedCount += 1;
      }
    }

    return appliedCount;
  }

  function ApplyInjectCSS(rule) {
    const id = `sticky-injected-css-${rule.savedAt || 0}`;
    let styleEl = document.getElementById(id);
    const css = rule.value || "";
    if (styleEl) {
      if (styleEl.textContent !== css) styleEl.textContent = css;
      return true;
    }
    styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.setAttribute("data-sticky-css", "");
    styleEl.textContent = css;
    (document.head || document.documentElement).appendChild(styleEl);
    return true;
  }

  function ApplyRuleToElement(rule, element) {
    switch (rule.action) {
      case "setText":
        if (element.textContent !== rule.value) {
          element.textContent = rule.value;
        }
        return true;
      case "setHTML":
        if (element.innerHTML !== rule.value) {
          element.innerHTML = rule.value;
        }
        return true;
      case "setValue":
        if ("value" in element && element.value !== rule.value) {
          element.value = rule.value;
          element.setAttribute("value", rule.value);
          return true;
        }
        return false;
      case "setAttribute":
        if (!rule.attributeName) {
          return false;
        }
        if (element.getAttribute(rule.attributeName) !== rule.value) {
          element.setAttribute(rule.attributeName, rule.value);
        }
        return true;
      case "insertHTML": {
        const marker = `data-sticky-injected-${rule.savedAt || 0}`;
        const pos = rule.position || "append";
        if (pos === "before" && element.previousElementSibling?.hasAttribute?.(marker)) return true;
        if (pos === "after" && element.nextElementSibling?.hasAttribute?.(marker)) return true;
        if (pos === "prepend" && element.firstElementChild?.hasAttribute?.(marker)) return true;
        if (pos === "append" && element.lastElementChild?.hasAttribute?.(marker)) return true;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = rule.value || "";
        const nodes = Array.from(wrapper.childNodes);
        const firstEl = nodes.find((n) => n.nodeType === 1);
        if (firstEl) firstEl.setAttribute(marker, "");

        if (pos === "before") nodes.forEach((n) => element.parentNode?.insertBefore(n, element));
        else if (pos === "after") nodes.reverse().forEach((n) => element.parentNode?.insertBefore(n, element.nextSibling));
        else if (pos === "prepend") nodes.reverse().forEach((n) => element.insertBefore(n, element.firstChild));
        else nodes.forEach((n) => element.appendChild(n));
        return true;
      }
      case "remove":
        if (element.isConnected) {
          element.remove();
        }
        return true;
      default:
        return false;
    }
  }

  function IsRuleSatisfied(rule) {
    if (!rule?.action) return true;

    if (rule.action === "injectCSS") {
      const styleEl = document.getElementById(`sticky-injected-css-${rule.savedAt || 0}`);
      return Boolean(styleEl && styleEl.textContent === (rule.value || ""));
    }

    if (!rule.selector) return true;
    let elements;
    try {
      elements = document.querySelectorAll(rule.selector);
    } catch (error) {
      return true;
    }

    if (rule.action === "remove") {
      return elements.length === 0;
    }

    if (rule.action === "insertHTML") {
      const marker = `data-sticky-injected-${rule.savedAt || 0}`;
      const pos = rule.position || "append";
      return elements.length > 0 && Array.from(elements).every((element) => {
        if (pos === "before") return element.previousElementSibling?.hasAttribute?.(marker);
        if (pos === "after") return element.nextElementSibling?.hasAttribute?.(marker);
        if (pos === "prepend") return element.firstElementChild?.hasAttribute?.(marker);
        return element.lastElementChild?.hasAttribute?.(marker);
      });
    }

    if (!elements.length) return false;

    return Array.from(elements).every((element) => {
      switch (rule.action) {
        case "setText": return element.textContent === rule.value;
        case "setHTML": return element.innerHTML === rule.value;
        case "setValue": return "value" in element ? element.value === rule.value : true;
        case "setAttribute":
          return rule.attributeName ? element.getAttribute(rule.attributeName) === rule.value : true;
        default: return true;
      }
    });
  }

  async function SaveRule(rule) {
    activeRules = UpsertRule(activeRules, rule);
    RefreshRuleCloak();

    await chrome.storage.local.set({
      [storageKey]: activeRules,
    });

    return activeRules.length;
  }

  function UpsertRule(existingRules, nextRule) {
    const filteredRules = existingRules.filter((rule) => {
      return GetRuleIdentity(rule) !== GetRuleIdentity(nextRule);
    });

    filteredRules.push(nextRule);
    return filteredRules;
  }

  function GetRuleIdentity(rule) {
    if (rule.action === "injectCSS") {
      return `injectCSS::${rule.savedAt || 0}`;
    }
    return [rule.selector, rule.action, rule.attributeName || ""].join("::");
  }

  async function ReadRules() {
    if (!storageKey) {
      return [];
    }

    const result = await chrome.storage.local.get(storageKey);
    return Array.isArray(result[storageKey]) ? result[storageKey] : [];
  }

  function RefreshRuleCloak() {
    const css = BuildRuleCloakCss(activeRules);
    if (!css) {
      if (ruleCloakElement?.isConnected) {
        ruleCloakElement.remove();
      }
      ruleCloakElement = null;
      return;
    }

    if (!ruleCloakElement) {
      ruleCloakElement = document.createElement("style");
      ruleCloakElement.id = RULE_CLOAK_ID;
      AppendToDocumentElement(ruleCloakElement);
    }
    if (ruleCloakElement.textContent !== css) {
      ruleCloakElement.textContent = css;
    }
  }

  function BuildRuleCloakCss(rules) {
    return rules
      .filter((rule) => rule?.selector && rule.action !== "injectCSS")
      .map((rule) => {
        const token = GetRuleReadyToken(rule);
        return `:where(${rule.selector}):not([${RULE_READY_ATTRIBUTE}~="${token}"]){visibility:hidden!important;}`;
      })
      .join("\n");
  }

  function MarkRuleApplied(rule, element) {
    if (!rule?.selector || rule.action === "injectCSS" || rule.action === "remove") {
      return;
    }
    const token = GetRuleReadyToken(rule);
    const existing = (element.getAttribute(RULE_READY_ATTRIBUTE) || "").split(/\s+/).filter(Boolean);
    if (!existing.includes(token)) {
      existing.push(token);
      element.setAttribute(RULE_READY_ATTRIBUTE, existing.join(" "));
    }
  }

  function GetRuleReadyToken(rule) {
    const source = rule.savedAt || GetRuleIdentity(rule);
    return `r${HashString(String(source))}`;
  }

  function HashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  async function ReadThemeId() {
    const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
    const stored = result[THEME_STORAGE_KEY];
    return THEMES.some((theme) => theme.id === stored) ? stored : THEMES[0].id;
  }

  async function SaveThemeId(themeId) {
    activeThemeId = THEMES.some((theme) => theme.id === themeId) ? themeId : THEMES[0].id;
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: activeThemeId });
    ApplyPanelTheme();
  }

  function GetActiveTheme() {
    return THEMES.find((theme) => theme.id === activeThemeId) || THEMES[0];
  }

  function ApplyPanelTheme() {
    if (!panelElement) return;
    const theme = GetActiveTheme();
    const targets = [panelElement, panelHost].filter(Boolean);
    for (const [key, value] of Object.entries(theme)) {
      if (key !== "id" && key !== "name") {
        targets.forEach((target) => target.style.setProperty(`--si-${key}`, value));
      }
    }
    panelElement.dataset.theme = theme.id;
  }

  function AddPickerListeners() {
    document.addEventListener("mousemove", HandlePickerMouseMove, true);
    document.addEventListener("mousedown", HandlePickerMouseDown, true);
    document.addEventListener("click", HandlePickerClick, true);
    document.addEventListener("keydown", HandlePickerKeyDown, true);
    window.addEventListener("scroll", SyncHighlightToSelectedElement, true);
    window.addEventListener("resize", SyncHighlightToSelectedElement, true);
  }

  function RemovePickerListeners() {
    document.removeEventListener("mousemove", HandlePickerMouseMove, true);
    document.removeEventListener("mousedown", HandlePickerMouseDown, true);
    document.removeEventListener("click", HandlePickerClick, true);
    document.removeEventListener("keydown", HandlePickerKeyDown, true);
    window.removeEventListener("scroll", SyncHighlightToSelectedElement, true);
    window.removeEventListener("resize", SyncHighlightToSelectedElement, true);
  }

  function HandlePickerMouseMove(event) {
    if (!pickerActive) {
      return;
    }

    const candidate = GetPickableElement(event.target);
    if (!candidate) {
      return;
    }

    highlightedElement = candidate;
    DrawHighlight(candidate);
  }

  function HandlePickerMouseDown(event) {
    if (!pickerActive) {
      return;
    }

    const candidate = GetPickableElement(event.target);
    if (!candidate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function HandlePickerClick(event) {
    if (!pickerActive) {
      return;
    }

    const candidate = GetPickableElement(event.target);
    if (!candidate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    selectedElement = candidate;
    highlightedElement = candidate;
    DrawHighlight(candidate);
    StopPickerKeepPanel();
    RenderEditorPanel(candidate);
  }

  function HandlePickerKeyDown(event) {
    if (!pickerActive) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      StopPickerKeepPanel();
      RenderMenuPanel();
    }
  }

  function SyncHighlightToSelectedElement() {
    if (selectedElement?.isConnected) {
      DrawHighlight(selectedElement);
      return;
    }

    if (highlightedElement?.isConnected) {
      DrawHighlight(highlightedElement);
    }
  }

  function GetPickableElement(target) {
    if (!(target instanceof Element)) {
      return null;
    }

    if (panelHost && panelHost.contains(target)) {
      return null;
    }

    if (target.id === HIGHLIGHT_ID) {
      return null;
    }

    if (target === document.documentElement || target === document.body) {
      return null;
    }

    return target;
  }

  function EnsureOverlay() {
    if (panelHost && highlightBox && panelElement) {
      return;
    }

    panelHost = document.createElement("div");
    panelHost.id = PANEL_HOST_ID;

    const shadowRoot = panelHost.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }

      #${HIGHLIGHT_ID} {
        position: fixed;
        z-index: 2147483646;
        border: 2px solid var(--si-accent, #34d399);
        background: color-mix(in srgb, var(--si-accent, #34d399) 22%, transparent);
        pointer-events: none;
        display: none;
        box-sizing: border-box;
        border-radius: 3px;
      }

      .panel {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483647;
        width: min(340px, calc(100vw - 24px));
        max-width: calc(100vw - 24px);
        background: var(--si-bg, #0f1f1a);
        color: var(--si-text, #ecfdf5);
        border: 1px solid var(--si-border, #1f3b30);
        border-radius: 12px;
        box-shadow: 0 18px 40px var(--si-shadow, rgba(0, 0, 0, 0.45));
        font: 13px/1.45 "Segoe UI", Tahoma, sans-serif;
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 14px;
        background: var(--si-surface, #122b22);
        border-bottom: 1px solid var(--si-border, #1f3b30);
        cursor: move;
        user-select: none;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .header-logo {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        flex: 0 0 auto;
        object-fit: contain;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .header-icon {
        background: transparent;
        color: var(--si-muted, #6ee7b7);
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 0;
        width: 22px;
        height: 22px;
        line-height: 1;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .header-icon:hover {
        background: var(--si-border, #1f3b30);
        color: var(--si-text, #ecfdf5);
      }
      .gear-btn { font-size: 14px; }
      .close-x { font-size: 16px; }

      .panel-body {
        padding: 14px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .title {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        color: var(--si-text, #ecfdf5);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .copy {
        margin: 0 0 10px;
        color: var(--si-soft, #a7f3d0);
      }
      .muted {
        color: var(--si-muted, #6ee7b7);
        font-size: 11px;
      }

      .selector {
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
        max-height: 80px;
        overflow: auto;
        background: var(--si-field, #0a1612);
        border: 1px solid var(--si-border, #1f3b30);
        border-radius: 6px;
        padding: 8px;
        color: var(--si-text, #d1fae5);
        margin: 0 0 10px;
        word-break: break-all;
      }

      .field {
        display: block;
        margin-bottom: 10px;
      }
      .label {
        display: block;
        font-size: 11px;
        color: var(--si-muted, #6ee7b7);
        margin-bottom: 4px;
        text-transform: lowercase;
      }
      .hint {
        margin: 4px 0 0;
        font-size: 11px;
        color: var(--si-hint, #5eead4);
        opacity: 0.85;
      }

      select, input, textarea, button {
        font: inherit;
      }
      select, input, textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 7px 9px;
        border-radius: 6px;
        border: 1px solid var(--si-border, #1f3b30);
        background: var(--si-field, #0a1612);
        color: var(--si-text, #ecfdf5);
        outline: none;
        transition: border-color 0.15s;
      }
      select:focus, input:focus, textarea:focus {
        border-color: var(--si-accent, #10b981);
      }
      textarea {
        min-height: 90px;
        resize: vertical;
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
      }

      .buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        margin-top: 12px;
      }
      .buttons.stack {
        grid-template-columns: 1fr;
      }
      button {
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: 500;
        transition: filter 0.15s, transform 0.05s;
      }
      button:hover:not(:disabled) { filter: brightness(1.1); }
      button:active:not(:disabled) { transform: translateY(1px); }
      button:disabled { opacity: 0.5; cursor: not-allowed; }

      .primary {
        background: var(--si-accent, #10b981);
        color: var(--si-primaryText, #052e1a);
      }
      .secondary {
        background: transparent;
        color: var(--si-soft, #a7f3d0);
        border-color: var(--si-border, #1f3b30);
      }
      .danger {
        background: transparent;
        color: var(--si-danger, #fca5a5);
        border-color: var(--si-dangerBorder, #4c1d1d);
      }
      .ghost {
        background: transparent;
        color: var(--si-muted, #6ee7b7);
        border-color: transparent;
        padding: 4px 8px;
        font-size: 11px;
      }

      .hidden { display: none; }

      .status {
        margin-top: 10px;
        min-height: 16px;
        font-size: 12px;
        color: var(--si-muted, #6ee7b7);
      }
      .status.error { color: var(--si-danger, #fca5a5); }

      .rules-list {
        list-style: none;
        padding: 0;
        margin: 0 0 10px;
        border: 1px solid var(--si-border, #1f3b30);
        border-radius: 6px;
        max-height: 180px;
        overflow-y: auto;
      }
      .rules-list li {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-bottom: 1px solid var(--si-border, #1f3b30);
        font-size: 12px;
      }
      .rules-list li:last-child { border-bottom: none; }
      .rules-list .rule-tag {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        background: var(--si-tagBg, #042f1f);
        color: var(--si-muted, #6ee7b7);
        border: 1px solid var(--si-border, #1f3b30);
        white-space: nowrap;
      }
      .rules-list .rule-sel {
        flex: 1;
        font-family: Consolas, "Courier New", monospace;
        color: var(--si-text, #d1fae5);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .rules-list .rule-del {
        background: transparent;
        color: var(--si-danger, #fca5a5);
        border: none;
        cursor: pointer;
        padding: 2px 6px;
        font-size: 14px;
        line-height: 1;
      }
      .rules-list .rule-edit {
        background: transparent;
        color: var(--si-muted, #6ee7b7);
        border: none;
        cursor: pointer;
        padding: 2px 6px;
        font-size: 13px;
        line-height: 1;
      }
      .rules-list .rule-edit:hover { color: var(--si-text, #ecfdf5); }
      .empty {
        padding: 10px;
        text-align: center;
        color: var(--si-muted, #6ee7b7);
        font-size: 12px;
      }

      .row {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .row > * { flex: 1; }
      .row .badge {
        flex: 0 0 auto;
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 10px;
        background: var(--si-tagBg, #042f1f);
        color: var(--si-muted, #6ee7b7);
        border: 1px solid var(--si-border, #1f3b30);
      }

      .theme-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .theme-card {
        position: relative;
        text-align: left;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid var(--si-border, #1f3b30);
        background: var(--preview-bg);
        color: var(--preview-text);
        min-height: 92px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 8px;
        cursor: pointer;
        overflow: hidden;
        isolation: isolate;
        transform: translateZ(0);
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 4px 10px rgba(0, 0, 0, 0.18);
      }
      .theme-card::before {
        content: "";
        position: absolute;
        inset: -40% -10% auto auto;
        width: 140%;
        height: 140%;
        background: radial-gradient(circle at top right, color-mix(in srgb, var(--preview-accent) 55%, transparent), transparent 60%);
        opacity: 0;
        transform: translate3d(20%, -20%, 0) scale(0.85);
        transition: opacity 220ms ease, transform 320ms ease;
        pointer-events: none;
        z-index: 0;
      }
      .theme-card::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--preview-accent), transparent);
        transform: scaleX(0);
        transform-origin: center;
        transition: transform 260ms ease;
        z-index: 1;
      }
      .theme-card > * { position: relative; z-index: 2; }
      .theme-card:hover {
        transform: translateY(-2px);
        border-color: var(--preview-accent);
        box-shadow: 0 10px 22px color-mix(in srgb, var(--preview-accent) 28%, rgba(0, 0, 0, 0.45));
      }
      .theme-card:hover::before { opacity: 0.85; transform: translate3d(0, 0, 0) scale(1); }
      .theme-card:hover::after { transform: scaleX(1); }
      .theme-card:hover .theme-dot { transform: rotate(12deg) scale(1.08); }
      .theme-card:hover .theme-line { opacity: 1; }
      .theme-card:active { transform: translateY(0); }
      .theme-card[aria-pressed="true"] {
        outline: 2px solid var(--preview-accent);
        outline-offset: 1px;
      }
      .theme-card[aria-pressed="true"]::after { transform: scaleX(1); }
      .theme-name {
        font-size: 12px;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .theme-preview {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        align-items: center;
      }
      .theme-lines {
        display: grid;
        gap: 5px;
      }
      .theme-line {
        height: 6px;
        border-radius: 999px;
        background: var(--preview-soft);
        opacity: 0.75;
        transition: opacity 220ms ease;
      }
      .theme-line.short { width: 60%; }
      .theme-line.tiny { width: 35%; height: 4px; }
      .theme-dot {
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: var(--preview-accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--preview-accent) 25%, transparent);
        transition: transform 260ms ease;
      }
      .theme-swatches {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }
      .theme-swatch {
        height: 7px;
        border-radius: 999px;
        transition: transform 200ms ease;
      }
      .theme-card:hover .theme-swatch { transform: scaleY(1.4); }
    `;

    highlightBox = document.createElement("div");
    highlightBox.id = HIGHLIGHT_ID;

    panelElement = document.createElement("section");
    panelElement.className = "panel";
    panelElement.addEventListener("click", (event) => {
      const themeBtn = event.target.closest?.('[data-action="open-themes"]');
      if (themeBtn) {
        event.preventDefault();
        event.stopPropagation();
        RenderThemePanel();
        return;
      }

      const closeBtn = event.target.closest?.('[data-action="close-x"]');
      if (closeBtn) {
        event.preventDefault();
        event.stopPropagation();
        StopPicker();
      }
    });
    ApplyPanelTheme();

    shadowRoot.append(style, highlightBox, panelElement);
    document.documentElement.appendChild(panelHost);
  }

  function PanelHeader(title) {
    const logoUrl = chrome.runtime.getURL("Assets/Icon.png");
    return `
      <div class="panel-header" data-drag-handle="true">
        <div class="header-title">
          <img class="header-logo" src="${EscapeHtml(logoUrl)}" alt="" aria-hidden="true">
          <h1 class="title">${EscapeHtml(title)}</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="header-icon gear-btn" data-action="open-themes" title="Themes" aria-label="Themes">&#9881;</button>
          <button type="button" class="header-icon close-x" data-action="close-x" title="Close" aria-label="Close">\u00d7</button>
        </div>
      </div>
    `;
  }

  async function ReadStoredPanelState() {
    if (!panelStateStorageKey) {
      return null;
    }

    try {
      const result = await chrome.storage.local.get(panelStateStorageKey);
      const state = result[panelStateStorageKey];
      if (!state || typeof state !== "object") {
        return null;
      }
      return {
        open: state.open === true,
        view: typeof state.view === "string" ? state.view : "menu",
        left: Number.isFinite(Number(state.left)) ? Number(state.left) : null,
        top: Number.isFinite(Number(state.top)) ? Number(state.top) : null,
      };
    } catch (e) {
      return null;
    }
  }

  function WriteStoredPanelState() {
    if (!panelStateStorageKey) {
      return;
    }

    chrome.storage.local.set({ [panelStateStorageKey]: panelSessionState }).catch(() => {});
  }

  function RestorePanelView(restoredView) {
    const view = restoredView || ReadPanelSessionValue(PANEL_VIEW_SESSION_KEY) || "menu";
    if (view === "themes") {
      RenderThemePanel();
      return;
    }
    if (view === "rules") {
      RenderRulesListPanel();
      return;
    }
    if (view === "manual") {
      RenderManualPanel();
      return;
    }
    if (view === "picker") {
      pickerActive = true;
      AddPickerListeners();
      RenderPickerPanel();
      return;
    }
    RenderMenuPanel();
  }

  function SetPanelView(view) {
    panelSessionState.open = true;
    panelSessionState.view = view;
    try {
      window.sessionStorage.setItem(PANEL_OPEN_SESSION_KEY, "1");
      window.sessionStorage.setItem(PANEL_VIEW_SESSION_KEY, view);
    } catch (e) {}
    WriteStoredPanelState();
  }

  function ReadPanelSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function SavePanelPosition() {
    if (!panelElement || !panelSessionState.open) {
      return;
    }

    const rect = panelElement.getBoundingClientRect();
    panelSessionState.open = true;
    panelSessionState.left = Math.round(rect.left);
    panelSessionState.top = Math.round(rect.top);
    try {
      window.sessionStorage.setItem(PANEL_POSITION_SESSION_KEY, JSON.stringify({
        left: panelSessionState.left,
        top: panelSessionState.top,
      }));
    } catch (e) {}
    WriteStoredPanelState();
  }

  function RestorePanelPosition() {
    if (!panelElement) {
      return;
    }

    const value = ReadPanelSessionValue(PANEL_POSITION_SESSION_KEY);
    let position = { left: panelSessionState.left, top: panelSessionState.top };
    if (value) {
      try {
        position = JSON.parse(value);
      } catch (e) {}
    }

    const left = Number(position?.left);
    const top = Number(position?.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      return;
    }

    const maxLeft = Math.max(8, window.innerWidth - panelElement.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - panelElement.offsetHeight - 8);
    panelElement.style.left = `${Clamp(left, 8, maxLeft)}px`;
    panelElement.style.top = `${Clamp(top, 8, maxTop)}px`;
    panelElement.style.right = "auto";
  }

  function RenderThemePanel() {
    if (!panelElement) {
      return;
    }

    SetPanelView("themes");

    const cards = THEMES.map((theme) => RenderThemeCard(theme)).join("");
    panelElement.innerHTML = `
      ${PanelHeader("Themes")}
      <div class="panel-body">
        <p class="muted">Theme is global. Rules still stay saved per site.</p>
        <div class="theme-grid">${cards}</div>
        <div class="buttons stack">
          <button type="button" class="secondary" data-action="themes-back">Back</button>
        </div>
      </div>
    `;

    BindPanelDragging();

    panelElement
      .querySelector('[data-action="themes-back"]')
      ?.addEventListener("click", () => RenderMenuPanel());

    panelElement.querySelectorAll(".theme-card").forEach((button) => {
      button.addEventListener("click", async () => {
        const themeId = button.getAttribute("data-theme-id");
        await SaveThemeId(themeId);
        RenderThemePanel();
      });
    });
  }

  function RenderThemeCard(theme) {
    const selected = theme.id === activeThemeId;
    const previewStyle = [
      `--preview-bg:${theme.bg}`,
      `--preview-text:${theme.text}`,
      `--preview-soft:${theme.soft}`,
      `--preview-accent:${theme.accent}`,
    ].join(";");

    return `
      <button type="button" class="theme-card" data-theme-id="${EscapeHtml(theme.id)}" aria-pressed="${selected ? "true" : "false"}" style="${previewStyle}">
        <span class="theme-name">${EscapeHtml(theme.name)}</span>
        <span class="theme-preview" aria-hidden="true">
          <span class="theme-lines">
            <span class="theme-line"></span>
            <span class="theme-line short"></span>
            <span class="theme-line tiny"></span>
          </span>
          <span class="theme-dot"></span>
        </span>
        <span class="theme-swatches" aria-hidden="true">
          <span class="theme-swatch" style="background:${theme.bg}"></span>
          <span class="theme-swatch" style="background:${theme.surface}"></span>
          <span class="theme-swatch" style="background:${theme.accent}"></span>
          <span class="theme-swatch" style="background:${theme.text}"></span>
        </span>
      </button>
    `;
  }

  function RenderPickerPanel(message) {
    if (!panelElement) {
      return;
    }

    SetPanelView("picker");

    panelElement.innerHTML = `
      ${PanelHeader("Pick an element")}
      <div class="panel-body">
        <p class="copy">${EscapeHtml(message || "Hover an element on the page, then click it.")}</p>
        <p class="muted">Press Esc to go back, or use the X to close.</p>
        <div class="buttons stack">
          <button type="button" class="secondary" data-action="back-to-menu">Back</button>
        </div>
      </div>
    `;

    BindPanelDragging();
    panelElement
      .querySelector('[data-action="back-to-menu"]')
      ?.addEventListener("click", () => {
        StopPickerKeepPanel();
        RenderMenuPanel();
      });
  }

  function RenderMenuPanel(statusText) {
    if (!panelElement) {
      return;
    }

    SetPanelView("menu");

    const ruleCount = activeRules.length;
    const defaultStatus = `${ruleCount} rule${ruleCount === 1 ? "" : "s"} on ${pageKey || "this page"}`;

    panelElement.innerHTML = `
      ${PanelHeader("Sticky Inspect")}
      <div class="panel-body">
        <p class="muted" data-role="menu-status">${EscapeHtml(statusText || defaultStatus)}</p>
        <div class="buttons">
          <button type="button" class="primary" data-action="menu-pick">Pick element</button>
          <button type="button" class="secondary" data-action="menu-manual">Add manually</button>
          <button type="button" class="secondary" data-action="menu-rules">Rules (${ruleCount})</button>
          <button type="button" class="secondary" data-action="menu-apply">Reapply</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindPanelDragging();

    const status = panelElement.querySelector(".status");
    const SetStatus = (text, isError) => {
      status.textContent = text || "";
      status.classList.toggle("error", Boolean(isError));
    };

    panelElement
      .querySelector('[data-action="menu-pick"]')
      ?.addEventListener("click", () => StartPicker());

    panelElement
      .querySelector('[data-action="menu-manual"]')
      ?.addEventListener("click", () => RenderManualPanel());

    panelElement
      .querySelector('[data-action="menu-rules"]')
      ?.addEventListener("click", () => RenderRulesListPanel());

    panelElement
      .querySelector('[data-action="menu-apply"]')
      ?.addEventListener("click", async () => {
        const result = await ApplyRulesNow();
        if (result.ok) {
          SetStatus(`Reapplied ${result.appliedCount} change${result.appliedCount === 1 ? "" : "s"}.`);
        } else {
          SetStatus(result.error || "Failed to reapply.", true);
        }
      });
  }

  function RenderRulesListPanel(statusText) {
    if (!panelElement) {
      return;
    }

    SetPanelView("rules");

    const ruleCount = activeRules.length;
    const rulesHtml = ruleCount
      ? `<ul class="rules-list">${activeRules
          .map((rule, idx) => `
            <li>
              <span class="rule-tag">${EscapeHtml(ActionLabel(rule.action))}</span>
              <span class="rule-sel" title="${EscapeHtml(rule.selector)}">${EscapeHtml(rule.selector)}</span>
              <button class="rule-edit" data-rule-index="${idx}" title="Edit rule" aria-label="Edit">\u270e</button>
              <button class="rule-del" data-rule-index="${idx}" title="Delete rule" aria-label="Delete">\u00d7</button>
            </li>
          `)
          .join("")}</ul>`
      : `<div class="empty">No saved rules yet.</div>`;

    panelElement.innerHTML = `
      ${PanelHeader(`Rules (${ruleCount})`)}
      <div class="panel-body">
        <p class="muted">${EscapeHtml(statusText || "Click a rule to edit, \u00d7 to delete.")}</p>
        ${rulesHtml}
        <div class="buttons">
          <button type="button" class="secondary" data-action="rules-back">Back</button>
          <button type="button" class="danger" data-action="rules-clear">Clear all</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindPanelDragging();

    panelElement
      .querySelector('[data-action="rules-back"]')
      ?.addEventListener("click", () => RenderMenuPanel());

    panelElement
      .querySelector('[data-action="rules-clear"]')
      ?.addEventListener("click", async () => {
        const result = await ClearRules();
        if (result.ok) {
          RenderRulesListPanel("All rules cleared.");
        }
      });

    panelElement.querySelectorAll(".rule-del").forEach((button) => {
      button.addEventListener("click", async () => {
        const idx = Number(button.getAttribute("data-rule-index"));
        if (Number.isInteger(idx)) {
          await DeleteRuleAt(idx);
          RenderRulesListPanel("Rule deleted.");
        }
      });
    });

    panelElement.querySelectorAll(".rule-edit").forEach((button) => {
      button.addEventListener("click", () => {
        const idx = Number(button.getAttribute("data-rule-index"));
        const rule = activeRules[idx];
        if (rule) {
          RenderManualPanel({
            selector: rule.selector,
            action: rule.action,
            value: rule.value,
            attributeName: rule.attributeName,
            position: rule.position,
            savedAt: rule.savedAt,
          });
        }
      });
    });
  }

  function RenderManualPanel(prefill) {
    if (!panelElement) {
      return;
    }

    SetPanelView("manual");

    panelElement.innerHTML = `
      ${PanelHeader("Add rule manually")}
      <div class="panel-body">
        <label class="field">
          <span class="label">What do you want to do?</span>
          <select data-field="action"></select>
          <p class="hint" data-role="action-hint"></p>
        </label>
        <label class="field" data-role="selector-wrapper">
          <span class="label" data-role="selector-label">CSS selector</span>
          <input data-field="selector" type="text" placeholder="#id, .class, or paste an HTML element" spellcheck="false">
          <p class="hint" data-role="selector-hint">Type a CSS selector or paste an HTML element (we'll convert it).</p>
        </label>
        <label class="field hidden" data-role="attribute-name-wrapper">
          <span class="label">Attribute name</span>
          <input data-field="attributeName" type="text" placeholder="style">
        </label>
        <label class="field hidden" data-role="position-wrapper">
          <span class="label">Position</span>
          <select data-field="position">
            <option value="append">Inside (at end)</option>
            <option value="prepend">Inside (at start)</option>
            <option value="before">Before element</option>
            <option value="after">After element</option>
          </select>
        </label>
        <label class="field" data-role="value-wrapper">
          <span class="label" data-role="value-label">Value</span>
          <textarea data-field="value" placeholder="<div>Hello</div>"></textarea>
        </label>
        <div class="buttons">
          <button type="button" class="primary" data-action="save-rule">Save rule</button>
          <button type="button" class="secondary" data-action="back-to-menu">Back</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindPanelDragging();

    const selectorInput = panelElement.querySelector('[data-field="selector"]');
    const actionSelect = panelElement.querySelector('[data-field="action"]');
    const attributeInput = panelElement.querySelector('[data-field="attributeName"]');
    const valueInput = panelElement.querySelector('[data-field="value"]');
    const positionSelect = panelElement.querySelector('[data-field="position"]');
    const selectorWrapper = panelElement.querySelector('[data-role="selector-wrapper"]');
    const attributeWrapper = panelElement.querySelector('[data-role="attribute-name-wrapper"]');
    const valueWrapper = panelElement.querySelector('[data-role="value-wrapper"]');
    const positionWrapper = panelElement.querySelector('[data-role="position-wrapper"]');
    const selectorHint = panelElement.querySelector('[data-role="selector-hint"]');
    const valueLabel = panelElement.querySelector('[data-role="value-label"]');
    const actionHint = panelElement.querySelector('[data-role="action-hint"]');
    const status = panelElement.querySelector(".status");

    actionSelect.innerHTML = window.__StickyInspectActions
      .DefaultActions()
      .map((a) => `<option value="${a.value}" data-hint="${EscapeHtml(a.hint || "")}">${EscapeHtml(a.label)}</option>`)
      .join("");

    if (prefill) {
      selectorInput.value = prefill.selector || "";
      attributeInput.value = prefill.attributeName || "";
      if (prefill.value !== undefined) valueInput.value = prefill.value;
      if (prefill.position) positionSelect.value = prefill.position;
      if (prefill.action) actionSelect.value = prefill.action;
    }

    function RefreshSelectorHint() {
      const action = actionSelect.value;
      if (action === "injectCSS") return;
      const value = selectorInput.value.trim();
      if (!value) {
        selectorHint.textContent = "Type a CSS selector or paste an HTML element (we'll convert it).";
        return;
      }
      let count = 0;
      let sample = null;
      try {
        const matches = document.querySelectorAll(value);
        count = matches.length;
        sample = matches[0];
      } catch (e) {
        selectorHint.textContent = "Invalid selector.";
        return;
      }
      if (!count) {
        selectorHint.textContent = "No matches on this page.";
      } else {
        selectorHint.textContent = `${count} match${count === 1 ? "" : "es"} on this page.`;
        if (sample) {
          DrawHighlight(sample);
          PrefillValueFromSample(sample);
        }
      }
    }

    let valueDirty = Boolean(prefill?.value);
    valueInput.addEventListener("input", () => {
      valueDirty = true;
    });

    function PrefillValueFromSample(sample) {
      if (valueDirty) return;
      const action = actionSelect.value;
      if (action === "setText") {
        valueInput.value = sample.textContent ?? "";
      } else if (action === "setHTML") {
        valueInput.value = sample.innerHTML ?? "";
      } else if (action === "setValue" && "value" in sample) {
        valueInput.value = sample.value ?? "";
      } else if (action === "setAttribute" && attributeInput.value) {
        valueInput.value = sample.getAttribute(attributeInput.value) ?? "";
      }
    }

    const VALUE_LABELS = {
      setText: "New text",
      setValue: "New form value",
      setHTML: "Replacement HTML",
      insertHTML: "HTML to insert",
      injectCSS: "CSS rules",
      setAttribute: "Attribute value",
    };
    const VALUE_PLACEHOLDERS = {
      setText: "Hello world",
      setValue: "new value",
      setHTML: "<span>Replaced</span>",
      insertHTML: "<div class='banner'>Hi</div>",
      injectCSS: ".ad, #banner { display: none !important; }\nbody { background: #111 !important; color: #eee !important; }",
      setAttribute: "color: red;",
    };

    function SyncFields() {
      const action = actionSelect.value;
      const isCSS = action === "injectCSS";
      const isRemove = action === "remove";

      selectorWrapper.classList.toggle("hidden", isCSS);
      attributeWrapper.classList.toggle("hidden", action !== "setAttribute");
      positionWrapper.classList.toggle("hidden", action !== "insertHTML");
      valueWrapper.classList.toggle("hidden", isRemove);

      const opt = actionSelect.selectedOptions[0];
      actionHint.textContent = opt?.dataset.hint || "";
      valueLabel.textContent = VALUE_LABELS[action] || "Value";
      valueInput.placeholder = VALUE_PLACEHOLDERS[action] || "";
      RefreshSelectorHint();
    }
    function HtmlToSelector(input) {
      const trimmed = (input || "").trim();
      if (!trimmed.startsWith("<")) return null;
      try {
        const tpl = document.createElement("template");
        tpl.innerHTML = trimmed;
        const el = tpl.content.firstElementChild;
        if (!el) return null;
        const tag = el.localName;
        if (el.id) {
          return `#${CSS.escape(el.id)}`;
        }
        const classes = (el.getAttribute("class") || "")
          .split(/\s+/)
          .filter(Boolean)
          .map((c) => `.${CSS.escape(c)}`)
          .join("");
        return `${tag}${classes}`;
      } catch (e) {
        return null;
      }
    }

    function FindExistingRuleIndex(selector, action, attributeName) {
      const probe = { selector, action, attributeName: attributeName || "" };
      const id = GetRuleIdentity(probe);
      return activeRules.findIndex((r) => GetRuleIdentity(r) === id);
    }

    function MaybeNormalizeSelector() {
      const value = selectorInput.value;
      const parsed = HtmlToSelector(value);
      if (parsed) {
        selectorInput.value = parsed;
        RefreshSelectorHint();
        status.classList.remove("error");
        status.textContent = `Detected pasted HTML, using selector ${parsed}.`;
        return true;
      }
      return false;
    }

    selectorInput.addEventListener("input", RefreshSelectorHint);
    selectorInput.addEventListener("blur", MaybeNormalizeSelector);
    selectorInput.addEventListener("paste", () => {
      window.setTimeout(MaybeNormalizeSelector, 0);
    });
    attributeInput.addEventListener("input", RefreshSelectorHint);
    actionSelect.addEventListener("change", SyncFields);

    panelElement
      .querySelector('[data-action="back-to-menu"]')
      ?.addEventListener("click", () => {
        if (highlightBox) highlightBox.style.display = "none";
        RenderMenuPanel();
      });

    panelElement
      .querySelector('[data-action="save-rule"]')
      ?.addEventListener("click", async () => {
        const action = actionSelect.value;
        const isCSS = action === "injectCSS";
        MaybeNormalizeSelector();
        const selector = selectorInput.value.trim();

        if (!isCSS) {
          if (!selector) {
            status.textContent = "Selector is required.";
            status.classList.add("error");
            return;
          }
          try {
            document.querySelector(selector);
          } catch (e) {
            status.textContent = "Invalid selector. Try pasting HTML or use a simpler selector like #id or .class.";
            status.classList.add("error");
            return;
          }

          const editingSavedAt = prefill?.savedAt;
          const dupeIndex = FindExistingRuleIndex(selector, action, attributeInput.value.trim());
          if (dupeIndex !== -1 && activeRules[dupeIndex].savedAt !== editingSavedAt) {
            const existing = activeRules[dupeIndex];
            RenderManualPanel({
              selector: existing.selector,
              action: existing.action,
              value: existing.value,
              attributeName: existing.attributeName,
              position: existing.position,
              savedAt: existing.savedAt,
            });
            return;
          }
        }

        const rule = {
          selector: isCSS ? "" : selector,
          action,
          value: valueInput.value,
          attributeName: attributeInput.value.trim(),
          position: positionSelect.value,
          savedAt: prefill?.savedAt || Date.now(),
        };

        if (action === "setAttribute" && !rule.attributeName) {
          status.textContent = "Attribute name is required.";
          status.classList.add("error");
          return;
        }
        if (action === "remove") {
          delete rule.value;
          delete rule.attributeName;
          delete rule.position;
        } else if (action === "insertHTML") {
          delete rule.attributeName;
        } else if (action === "injectCSS") {
          delete rule.attributeName;
          delete rule.position;
          delete rule.selector;
        } else if (action !== "setAttribute") {
          delete rule.attributeName;
          delete rule.position;
        } else {
          delete rule.position;
        }

        const newCount = await SaveRule(rule);
        ApplyRule(rule);
        status.classList.remove("error");
        status.textContent = `Saved. ${newCount} rule${newCount === 1 ? "" : "s"} total.`;
      });

    SyncFields();
  }

  function RenderEditorPanel(element) {
    if (!panelElement) {
      return;
    }

    SetPanelView("picker");

    const selector = BuildSelector(element);
    const currentText = element.textContent ?? "";
    const currentHTML = element.innerHTML ?? "";
    const currentValue = "value" in element ? element.value ?? "" : currentText;
    const available = window.__StickyInspectActions.GetApplicableActions(element);

    const actionOptions = available
      .map((a) => `<option value="${a.value}" data-hint="${EscapeHtml(a.hint || "")}">${EscapeHtml(a.label)}</option>`)
      .join("");

    panelElement.innerHTML = `
      ${PanelHeader("Edit element")}
      <div class="panel-body">
        <p class="muted">${EscapeHtml(`<${element.localName}>`)} \u2014 ${available.length} compatible action${available.length === 1 ? "" : "s"}</p>
        <div class="selector">${EscapeHtml(selector)}</div>
        <label class="field">
          <span class="label">Action</span>
          <select data-field="action">${actionOptions}</select>
          <p class="hint" data-role="action-hint"></p>
        </label>
        <label class="field hidden" data-role="attribute-name-wrapper">
          <span class="label">Attribute name</span>
          <input data-field="attributeName" type="text" placeholder="style">
        </label>
        <label class="field hidden" data-role="position-wrapper">
          <span class="label">Position</span>
          <select data-field="position">
            <option value="append">Inside (at end)</option>
            <option value="prepend">Inside (at start)</option>
            <option value="before">Before element</option>
            <option value="after">After element</option>
          </select>
        </label>
        <label class="field" data-role="value-wrapper">
          <span class="label">Value</span>
          <textarea data-field="value"></textarea>
        </label>
        <div class="buttons">
          <button type="button" class="primary" data-action="save-rule">Save rule</button>
          <button type="button" class="secondary" data-action="back-to-picker">Back</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindPanelDragging();
    const actionSelect = panelElement.querySelector('[data-field="action"]');
    const valueInput = panelElement.querySelector('[data-field="value"]');
    const attributeNameInput = panelElement.querySelector('[data-field="attributeName"]');
    const positionSelect = panelElement.querySelector('[data-field="position"]');
    const valueWrapper = panelElement.querySelector('[data-role="value-wrapper"]');
    const attributeWrapper = panelElement.querySelector('[data-role="attribute-name-wrapper"]');
    const positionWrapper = panelElement.querySelector('[data-role="position-wrapper"]');
    const actionHint = panelElement.querySelector('[data-role="action-hint"]');
    const statusElement = panelElement.querySelector(".status");

    function SyncFields() {
      const action = actionSelect.value;
      attributeWrapper.classList.toggle("hidden", action !== "setAttribute");
      positionWrapper.classList.toggle("hidden", action !== "insertHTML");
      valueWrapper.classList.toggle("hidden", action === "remove");
      const opt = actionSelect.selectedOptions[0];
      actionHint.textContent = opt?.dataset.hint || "";

      if (action === "setText") {
        valueInput.value = currentText;
      } else if (action === "setValue") {
        valueInput.value = currentValue;
      } else if (action === "setHTML") {
        valueInput.value = currentHTML;
      } else if (action === "insertHTML") {
        if (!valueInput.value) valueInput.value = "<div>Hello</div>";
      } else if (action === "setAttribute") {
        if (!attributeNameInput.value) {
          attributeNameInput.value = "style";
        }
        valueInput.value = element.getAttribute(attributeNameInput.value) ?? "";
      }
    }

    actionSelect.addEventListener("change", SyncFields);
    attributeNameInput.addEventListener("input", () => {
      if (actionSelect.value === "setAttribute") {
        valueInput.value = element.getAttribute(attributeNameInput.value) ?? "";
      }
    });

    SyncFields();

    panelElement
      .querySelector('[data-action="back-to-picker"]')
      ?.addEventListener("click", () => {
        selectedElement = null;
        if (!pickerActive) {
          pickerActive = true;
          AddPickerListeners();
        }
        RenderPickerPanel("Hover another element and click it.");
      });

    panelElement
      .querySelector('[data-action="save-rule"]')
      ?.addEventListener("click", async () => {
        const action = actionSelect.value;
        const rule = {
          selector,
          action,
          value: valueInput.value,
          attributeName: attributeNameInput.value.trim(),
          position: positionSelect.value,
          savedAt: Date.now(),
        };

        if (action === "setAttribute" && !rule.attributeName) {
          statusElement.textContent = "Attribute name is required.";
          statusElement.classList.add("error");
          return;
        }

        if (action === "remove") {
          delete rule.value;
          delete rule.attributeName;
          delete rule.position;
        } else if (action === "insertHTML") {
          delete rule.attributeName;
        } else if (action !== "setAttribute") {
          delete rule.attributeName;
          delete rule.position;
        } else {
          delete rule.position;
        }

        const newCount = await SaveRule(rule);
        ApplyRule(rule);
        statusElement.classList.remove("error");
        statusElement.textContent = `Saved. ${newCount} rule${newCount === 1 ? "" : "s"} total.`;
      });

    SyncFields();
  }

  function ActionLabel(action) {
    switch (action) {
      case "setText": return "text";
      case "setValue": return "value";
      case "setHTML": return "html";
      case "insertHTML": return "insert";
      case "injectCSS": return "css";
      case "setAttribute": return "attr";
      case "remove": return "remove";
      default: return action || "?";
    }
  }

  async function DeleteRuleAt(index) {
    if (!storageKey) return;
    if (index < 0 || index >= activeRules.length) return;
    activeRules.splice(index, 1);
    RefreshRuleCloak();
    await chrome.storage.local.set({ [storageKey]: activeRules });
  }

  function StopPicker() {
    pickerActive = false;
    selectedElement = null;
    highlightedElement = null;
    panelDragState = null;
    RemovePickerListeners();

    if (highlightBox) {
      highlightBox.style.display = "none";
    }

    if (panelHost?.isConnected) {
      panelHost.remove();
    }

    panelHost = null;
    highlightBox = null;
    panelElement = null;

    try {
      window.sessionStorage.removeItem(PANEL_OPEN_SESSION_KEY);
      window.sessionStorage.removeItem(PANEL_VIEW_SESSION_KEY);
      window.sessionStorage.removeItem(PANEL_POSITION_SESSION_KEY);
    } catch (e) {}
    panelSessionState = { open: false, view: "menu", left: null, top: null };
    if (panelStateStorageKey) {
      chrome.storage.local.remove(panelStateStorageKey).catch(() => {});
    }
  }

  function StopPickerKeepPanel() {
    pickerActive = false;
    selectedElement = null;
    highlightedElement = null;
    RemovePickerListeners();
    if (highlightBox) {
      highlightBox.style.display = "none";
    }
  }

  function BindPanelDragging() {
    const handle = panelElement?.querySelector('[data-drag-handle="true"]');
    if (!handle) {
      return;
    }

    handle.addEventListener("pointerdown", BeginPanelDrag);
    if (skipNextPositionRestore) {
      skipNextPositionRestore = false;
      panelElement.style.left = "";
      panelElement.style.top = "";
      panelElement.style.right = "24px";
      return;
    }
    RestorePanelPosition();
    requestAnimationFrame(() => RestorePanelPosition());
  }

  function BeginPanelDrag(event) {
    if (event.button !== 0 || !panelElement) {
      return;
    }
    if (event.target?.closest && event.target.closest("button, a, input, select, textarea")) {
      return;
    }

    const rect = panelElement.getBoundingClientRect();
    panelDragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
      handle: event.currentTarget,
    };

    panelElement.style.left = `${rect.left}px`;
    panelElement.style.top = `${rect.top}px`;
    panelElement.style.right = "auto";

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (e) {}

    document.addEventListener("pointermove", OnPanelDragMove, true);
    document.addEventListener("pointerup", EndPanelDrag, true);
    document.addEventListener("pointercancel", EndPanelDrag, true);
    event.currentTarget.addEventListener("lostpointercapture", EndPanelDrag, true);
    window.addEventListener("blur", EndPanelDrag, true);
    document.addEventListener("visibilitychange", OnDragVisibilityChange, true);
    event.preventDefault();
  }

  function OnPanelDragMove(event) {
    if (!panelDragState || !panelElement) {
      return;
    }
    if (panelDragState.pointerId !== undefined && event.pointerId !== panelDragState.pointerId) {
      return;
    }
    if (event.buttons !== undefined && event.buttons === 0) {
      EndPanelDrag();
      return;
    }

    const maxLeft = Math.max(8, window.innerWidth - panelElement.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - panelElement.offsetHeight - 8);
    const nextLeft = Clamp(event.clientX - panelDragState.offsetX, 8, maxLeft);
    const nextTop = Clamp(event.clientY - panelDragState.offsetY, 8, maxTop);

    panelElement.style.left = `${nextLeft}px`;
    panelElement.style.top = `${nextTop}px`;
    panelSessionState.open = true;
    panelSessionState.left = Math.round(nextLeft);
    panelSessionState.top = Math.round(nextTop);
    WriteStoredPanelState();
    try {
      window.sessionStorage.setItem(PANEL_POSITION_SESSION_KEY, JSON.stringify({
        left: panelSessionState.left,
        top: panelSessionState.top,
      }));
    } catch (e) {}
  }

  function OnDragVisibilityChange() {
    if (document.visibilityState === "hidden") {
      EndPanelDrag();
    }
  }

  function EndPanelDrag() {
    if (panelDragState?.handle && panelDragState.pointerId !== undefined) {
      try {
        panelDragState.handle.releasePointerCapture(panelDragState.pointerId);
      } catch (e) {}
      panelDragState.handle.removeEventListener("lostpointercapture", EndPanelDrag, true);
    }
    SavePanelPosition();
    panelDragState = null;
    document.removeEventListener("pointermove", OnPanelDragMove, true);
    document.removeEventListener("pointerup", EndPanelDrag, true);
    document.removeEventListener("pointercancel", EndPanelDrag, true);
    document.removeEventListener("visibilitychange", OnDragVisibilityChange, true);
    window.removeEventListener("blur", EndPanelDrag, true);
  }

  function DrawHighlight(element) {
    if (!highlightBox || !element?.isConnected) {
      return;
    }

    const rect = element.getBoundingClientRect();

    highlightBox.style.display = "block";
    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.left = `${rect.left}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
  }

  function BuildSelector(element) {
    if (element.id) {
      const idSelector = `#${CSS.escape(element.id)}`;
      if (IsUniqueSelector(idSelector)) {
        return idSelector;
      }
    }

    const segments = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let segment = current.localName;

      if (!segment) {
        break;
      }

      if (current.id) {
        const idSelector = `#${CSS.escape(current.id)}`;
        if (IsUniqueSelector(idSelector)) {
          segments.unshift(idSelector);
          return segments.join(" > ");
        }
      }

      const stableAttribute = GetStableAttributeSelector(current);
      if (stableAttribute) {
        segment += stableAttribute;
      } else {
        segment += GetClassSelector(current);
      }

      const parent = current.parentElement;
      if (parent) {
        const sameTagSiblings = Array.from(parent.children).filter((child) => {
          return child.localName === current.localName;
        });

        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          segment += `:nth-of-type(${index})`;
        }
      }

      segments.unshift(segment);

      const candidate = segments.join(" > ");
      if (IsUniqueSelector(candidate)) {
        return candidate;
      }

      current = parent;
    }

    return segments.join(" > ");
  }

  function GetStableAttributeSelector(element) {
    const attributeNames = ["data-testid", "data-test", "data-qa", "aria-label", "name"];

    for (const attributeName of attributeNames) {
      const value = element.getAttribute(attributeName);
      if (!value) {
        continue;
      }

      const selector = `[${attributeName}="${CSS.escape(value)}"]`;
      if (IsUniqueSelector(selector)) {
        return selector;
      }
    }

    return "";
  }

  function GetClassSelector(element) {
    const classNames = Array.from(element.classList)
      .filter((className) => /^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(className))
      .slice(0, 2);

    return classNames.length ? `.${classNames.map((name) => CSS.escape(name)).join(".")}` : "";
  }

  function IsUniqueSelector(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch (error) {
      return false;
    }
  }

  function IsSupportedPage() {
    return Boolean(pageKey) && SUPPORTED_PROTOCOLS.has(window.location.protocol);
  }

  function GetPageKey(href) {
    try {
      const url = new URL(href);
      if (!SUPPORTED_PROTOCOLS.has(url.protocol)) {
        return null;
      }

      if (url.protocol === "file:") {
        url.hash = "";
        url.search = "";
        return url.toString();
      }

      return GetRegistrableDomain(url.hostname);
    } catch (error) {
      return null;
    }
  }

  function GetRegistrableDomain(hostname) {
    const normalized = hostname.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    if (normalized === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
      return normalized;
    }

    const labels = normalized.split(".").filter(Boolean);
    if (labels.length <= 2) {
      return normalized;
    }

    const knownMultipartSuffixes = new Set([
      "co.uk",
      "org.uk",
      "gov.uk",
      "ac.uk",
      "co.jp",
      "com.au",
      "net.au",
      "org.au",
      "co.nz",
      "com.br",
    ]);

    const suffix = labels.slice(-2).join(".");
    if (knownMultipartSuffixes.has(suffix) && labels.length >= 3) {
      return labels.slice(-3).join(".");
    }

    return labels.slice(-2).join(".");
  }

  function InstallInitialCloak() {
    if (initialCloakElement) {
      return;
    }

    initialCloakElement = document.createElement("style");
    initialCloakElement.id = INITIAL_CLOAK_ID;
    initialCloakElement.textContent =
      "html{visibility:hidden !important;}";

    AppendToDocumentElement(initialCloakElement);
    if (document.documentElement) {
      document.documentElement.style.setProperty("visibility", "hidden", "important");
    }
  }

  function RemoveInitialCloak() {
    if (!initialCloakElement) {
      return;
    }

    if (initialCloakElement.isConnected) {
      initialCloakElement.remove();
    }

    if (document.documentElement) {
      document.documentElement.style.removeProperty("visibility");
    }

    initialCloakElement = null;
  }

  function AppendToDocumentElement(node) {
    if (document.documentElement) {
      document.documentElement.appendChild(node);
      return;
    }

    const rootObserver = new MutationObserver(() => {
      if (!document.documentElement) {
        return;
      }

      rootObserver.disconnect();
      document.documentElement.appendChild(node);
    });

    rootObserver.observe(document, {
      childList: true,
      subtree: true,
    });
  }

  function WaitForDocumentElement() {
    if (document.documentElement) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const rootObserver = new MutationObserver(() => {
        if (!document.documentElement) {
          return;
        }

        rootObserver.disconnect();
        resolve();
      });

      rootObserver.observe(document, {
        childList: true,
        subtree: true,
      });
    });
  }

  function EscapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function Clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();






