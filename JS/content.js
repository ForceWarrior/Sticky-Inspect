(function () {
  const STORAGE_PREFIX = "stickyInspectRules:";
  const THEME_STORAGE_KEY = "stickyInspectTheme";
  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:", "file:"]);
  const PANEL_HOST_ID = "sticky-inspect-host";
  const PANEL_HOST_TAG = "sticky-inspect-root";
  const HIGHLIGHT_ID = "sticky-inspect-highlight";
  const INITIAL_CLOAK_ID = "sticky-inspect-initial-cloak";
  const RULE_CLOAK_ID = "sticky-inspect-rule-cloak";
  const RULE_READY_ATTRIBUTE = "data-sticky-inspect-ready";
  const INSERTED_ATTRIBUTE = "data-sticky-inserted";
  const INSTANCE_EVENT = "sticky-inspect:instance-started";
  const PANEL_SESSION_KEY = "stickyInspect:panelState";
  const LEGACY_PANEL_SESSION_KEYS = ["stickyInspect:panelOpen", "stickyInspect:panelView", "stickyInspect:panelPosition"];
  const INITIAL_CLOAK_MAX_MS = 1500;
  const MAX_CHAINED_DIRTY_APPLIES = 20;
  const DIRTY_APPLY_WINDOW_MS = 1000;
  const MAX_DIRTY_APPLIES_PER_WINDOW = 120;
  const BUSY_APPLY_DELAY_MS = 250;
  const PANEL_MARGIN = 8;
  const CLEAR_CONFIRM_MS = 3000;
  const PICKER_BLOCKED_EVENTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "auxclick"];
  const PANEL_KEY_EVENTS = ["keydown", "keyup", "keypress"];

  const HOST_STYLE = [
    "all: initial",
    "display: block",
    "position: fixed",
    "inset: 0 auto auto 0",
    "width: 0",
    "height: 0",
    "margin: 0",
    "padding: 0",
    "border: 0",
    "overflow: visible",
    "background: transparent",
    "visibility: visible",
    "opacity: 1",
    "transform: none",
    "filter: none",
    "pointer-events: none",
    "z-index: 2147483647",
  ].map((declaration) => `${declaration} !important`).join("; ");

  const LEGACY_MULTIPART_SUFFIXES = new Set([
    "co.uk", "org.uk", "gov.uk", "ac.uk", "co.jp", "com.au", "net.au", "org.au", "co.nz", "com.br",
  ]);
  const MULTIPART_SUFFIXES = new Set([
    ...LEGACY_MULTIPART_SUFFIXES,
    "me.uk", "ltd.uk", "plc.uk", "net.uk", "sch.uk", "nhs.uk", "police.uk",
    "ne.jp", "or.jp", "ac.jp", "go.jp", "ed.jp", "gr.jp",
    "edu.au", "gov.au", "asn.au", "id.au",
    "net.nz", "org.nz", "govt.nz", "ac.nz", "school.nz",
    "net.br", "org.br", "gov.br", "edu.br",
    "co.in", "net.in", "org.in", "gov.in", "ac.in", "edu.in", "firm.in", "gen.in", "ind.in",
    "com.cn", "net.cn", "org.cn", "gov.cn", "edu.cn",
    "com.hk", "org.hk", "edu.hk", "gov.hk", "com.tw", "org.tw", "edu.tw", "gov.tw",
    "com.sg", "edu.sg", "gov.sg", "com.my", "gov.my", "edu.my",
    "com.mx", "org.mx", "gob.mx", "edu.mx", "com.ar", "gob.ar", "com.co", "gov.co",
    "com.pe", "gob.pe", "com.ve", "com.ec", "com.uy", "com.py", "com.bo",
    "com.tr", "gov.tr", "edu.tr", "org.tr", "co.za", "org.za", "gov.za", "ac.za",
    "co.kr", "or.kr", "go.kr", "ac.kr", "co.il", "org.il", "gov.il", "ac.il",
    "co.id", "or.id", "go.id", "ac.id", "co.th", "or.th", "go.th", "ac.th", "in.th",
    "com.ph", "gov.ph", "edu.ph", "com.vn", "gov.vn", "edu.vn", "com.pk", "gov.pk", "edu.pk",
    "com.bd", "gov.bd", "com.eg", "gov.eg", "com.sa", "gov.sa", "com.ng", "gov.ng",
    "co.ke", "or.ke", "go.ke", "com.ua", "gov.ua", "com.pl", "gov.pl", "com.ru", "gov.ru",
    "github.io", "gitlab.io", "vercel.app", "netlify.app", "pages.dev", "workers.dev",
    "web.app", "firebaseapp.com", "herokuapp.com", "appspot.com", "blogspot.com",
    "wordpress.com", "azurewebsites.net", "cloudfront.net", "onrender.com", "glitch.me",
    "neocities.org", "myshopify.com", "wixsite.com", "weebly.com", "tumblr.com",
    "surge.sh", "fly.dev", "deno.dev", "ngrok.io", "ngrok-free.app", "replit.app", "repl.co",
  ]);

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

  const pageKey = GetPageKey(window.location.href, MULTIPART_SUFFIXES);
  const legacyPageKey = GetPageKey(window.location.href, LEGACY_MULTIPART_SUFFIXES);
  const storageKey = pageKey ? `${STORAGE_PREFIX}${pageKey}` : null;
  const legacyStorageKey = legacyPageKey && legacyPageKey !== pageKey ? `${STORAGE_PREFIX}${legacyPageKey}` : null;
  const logoUrl = GetExtensionUrl("Assets/Icon.png");

  let activeRules = [];
  let activeReadyTokens = new Set();
  let observer = null;
  let applyScheduled = false;
  let chainedDirtyApplies = 0;
  let chainResetPending = false;
  let dirtyWindowStartedAt = 0;
  let dirtyAppliesInWindow = 0;
  let disposed = false;
  const elementRuleState = new WeakMap();

  let pickerActive = false;
  let highlightedElement = null;
  let highlightFrame = 0;
  let panelHost = null;
  let highlightBox = null;
  let panelElement = null;
  let panelResizeObserver = null;
  let initialCloakElement = null;
  let initialCloakTimer = 0;
  let ruleCloakElement = null;
  let panelDragState = null;
  let activeThemeId = THEMES[0].id;
  let panelState = { open: false, view: "menu", left: null, top: null };

  document.dispatchEvent(new CustomEvent(INSTANCE_EVENT));
  document.addEventListener(INSTANCE_EVENT, Dispose);
  RemoveStaleNodes();

  if (IsSupportedPage() && document.readyState === "loading") {
    InstallInitialCloak();
  }

  const initialLoadPromise = Initialize().catch(() => false);

  chrome.runtime.onMessage.addListener(HandleRuntimeMessage);
  chrome.storage.onChanged.addListener(HandleStorageChange);
  window.addEventListener("pagehide", WritePanelSession, true);
  window.addEventListener("pageshow", HandlePageShow, true);
  for (const type of PANEL_KEY_EVENTS) {
    window.addEventListener(type, IsolatePanelKeyEvent, true);
  }

  async function Initialize() {
    if (!IsSupportedPage()) {
      RemoveInitialCloak();
      return false;
    }

    try {
      await WaitForDocumentElement();
      const stored = await ReadStoredState();
      if (disposed) {
        return false;
      }
      activeThemeId = stored.themeId;
      SetActiveRules(stored.rules);
    } finally {
      RemoveInitialCloak();
    }

    RestorePanelFromSession();

    document.addEventListener("DOMContentLoaded", ScheduleRuleApply, { once: true });
    window.addEventListener("load", ScheduleRuleApply, { once: true });
    return true;
  }

  function HandleRuntimeMessage(message, sender, sendResponse) {
    if (disposed) {
      return false;
    }

    HandleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: DescribeError(error),
        });
      });

    return true;
  }

  async function HandleMessage(message) {
    await initialLoadPromise;

    switch (message?.type) {
      case "stickyInspect:getStatus":
        return GetStatus();
      case "stickyInspect:togglePanel":
        return TogglePanel();
      case "stickyInspect:openMenu":
        return OpenMenu();
      case "stickyInspect:startPicker":
        return StartPicker();
      case "stickyInspect:apply":
        return ApplyRulesNow();
      case "stickyInspect:clear":
        return ClearRules();
      default:
        return {
          ok: false,
          error: "Unknown message type.",
        };
    }
  }

  function UnsupportedResult() {
    return {
      ok: false,
      error: "This page cannot be modified by the extension.",
    };
  }

  async function GetStatus() {
    return {
      ok: true,
      supported: IsSupportedPage(),
      pageKey,
      ruleCount: activeRules.length,
      pickerActive,
      panelOpen: IsPanelVisible(),
    };
  }

  async function StartPicker() {
    if (!IsSupportedPage()) {
      return UnsupportedResult();
    }

    EnsureOverlay();
    panelState.open = true;
    UpdateObserver();
    RenderPickerPanel();

    return {
      ok: true,
      message: "Picker started. Hover an element, then click it.",
    };
  }

  async function TogglePanel() {
    if (IsPanelVisible()) {
      ClosePanel();
      return { ok: true, open: false };
    }

    const result = await OpenMenu();
    return { ...result, open: result.ok };
  }

  async function OpenMenu() {
    if (!IsSupportedPage()) {
      return UnsupportedResult();
    }

    await RefreshRulesFromStorage();
    EnsureOverlay();
    panelState = { open: true, view: "menu", left: null, top: null };
    UpdateObserver();
    RenderMenuPanel();

    return { ok: true };
  }

  async function ApplyRulesNow() {
    if (!IsSupportedPage()) {
      return UnsupportedResult();
    }

    await RefreshRulesFromStorage();
    const stats = ApplyAllRules();

    return {
      ok: true,
      ruleCount: activeRules.length,
      appliedCount: stats.matched,
    };
  }

  async function ClearRules() {
    if (!storageKey) {
      return UnsupportedResult();
    }

    await chrome.storage.local.set({ [storageKey]: [] });
    SetActiveRules([]);

    return {
      ok: true,
      ruleCount: 0,
    };
  }

  function Dispose() {
    if (disposed) {
      return;
    }

    disposed = true;
    StopObserver();
    RemoveOverlay();
    RemoveInitialCloak();
    if (ruleCloakElement?.isConnected) {
      ruleCloakElement.remove();
    }
    ruleCloakElement = null;

    document.removeEventListener(INSTANCE_EVENT, Dispose);
    window.removeEventListener("pagehide", WritePanelSession, true);
    window.removeEventListener("pageshow", HandlePageShow, true);
    for (const type of PANEL_KEY_EVENTS) {
      window.removeEventListener(type, IsolatePanelKeyEvent, true);
    }
    try {
      chrome.runtime.onMessage.removeListener(HandleRuntimeMessage);
      chrome.storage.onChanged.removeListener(HandleStorageChange);
    } catch (error) {}
  }

  function RemoveStaleNodes() {
    document.getElementById(PANEL_HOST_ID)?.remove();
    document.getElementById(RULE_CLOAK_ID)?.remove();
    const staleCloak = document.getElementById(INITIAL_CLOAK_ID);
    if (staleCloak) {
      staleCloak.remove();
      document.documentElement?.style.removeProperty("visibility");
    }
  }

  function HandlePageShow(event) {
    if (event.persisted) {
      RefreshRulesFromStorage().catch(() => {});
    }
  }

  function HandleStorageChange(changes, areaName) {
    if (disposed || areaName !== "local") {
      return;
    }

    if (storageKey && changes[storageKey]) {
      const nextRules = NormalizeRules(changes[storageKey].newValue);
      if (!SameRules(nextRules, activeRules)) {
        SetActiveRules(nextRules);
        if (panelElement && (panelState.view === "menu" || panelState.view === "rules")) {
          RestorePanelView(panelState.view);
        }
      }
    }

    if (changes[THEME_STORAGE_KEY]) {
      const themeId = NormalizeThemeId(changes[THEME_STORAGE_KEY].newValue);
      if (themeId !== activeThemeId) {
        activeThemeId = themeId;
        ApplyPanelTheme();
        if (panelElement && panelState.view === "themes") {
          RenderThemePanel();
        }
      }
    }
  }

  function StartObserver() {
    if (observer || !document.documentElement) {
      return;
    }

    observer = new MutationObserver(ScheduleRuleApply);
    observer.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  function StopObserver() {
    observer?.disconnect();
    observer = null;
  }

  function UpdateObserver() {
    if (!disposed && (activeRules.length || panelState.open)) {
      StartObserver();
    } else {
      StopObserver();
    }
  }

  function ScheduleRuleApply() {
    if (applyScheduled || disposed) {
      return;
    }

    applyScheduled = true;

    if (IsApplyBudgetSpent()) {
      window.setTimeout(RunScheduledApply, BUSY_APPLY_DELAY_MS);
    } else if (chainedDirtyApplies >= MAX_CHAINED_DIRTY_APPLIES) {
      window.setTimeout(RunScheduledApply, 0);
    } else {
      queueMicrotask(RunScheduledApply);
    }
  }

  function RunScheduledApply() {
    applyScheduled = false;
    if (disposed) {
      return;
    }

    const writes = ReattachOverlay() + ApplyAllRules().writes;
    if (writes > 0) {
      RecordDirtyApply();
    }
  }

  function RecordDirtyApply() {
    const now = performance.now();
    if (now - dirtyWindowStartedAt > DIRTY_APPLY_WINDOW_MS) {
      dirtyWindowStartedAt = now;
      dirtyAppliesInWindow = 0;
    }
    dirtyAppliesInWindow += 1;
    chainedDirtyApplies += 1;

    if (!chainResetPending) {
      chainResetPending = true;
      window.setTimeout(() => {
        chainResetPending = false;
        chainedDirtyApplies = 0;
      }, 0);
    }
  }

  function IsApplyBudgetSpent() {
    return dirtyAppliesInWindow >= MAX_DIRTY_APPLIES_PER_WINDOW &&
      performance.now() - dirtyWindowStartedAt <= DIRTY_APPLY_WINDOW_MS;
  }

  function SetActiveRules(rules) {
    const previousRules = activeRules;
    activeRules = rules;
    RemoveStaleRuleArtifacts(previousRules, rules);
    RefreshRuleCloak();
    UpdateObserver();
    ApplyAllRules();
  }

  function ApplyAllRules() {
    const stats = { matched: 0, writes: 0 };
    if (disposed || !activeRules.length) {
      return stats;
    }

    try {
      stats.writes += EnsureRuleCloakAttached();
      for (const rule of activeRules) {
        try {
          ApplyRule(rule, stats);
        } catch (error) {}
      }
    } finally {
      observer?.takeRecords();
    }

    return stats;
  }

  function ApplyRule(rule, stats) {
    if (!rule?.action) {
      return;
    }

    if (rule.action === "injectCSS") {
      stats.matched += 1;
      stats.writes += ApplyInjectCSS(rule);
      return;
    }

    if (!rule.selector) {
      return;
    }

    let elements;

    try {
      elements = document.querySelectorAll(rule.selector);
    } catch (error) {
      return;
    }

    const ruleKey = GetRuleKey(rule);

    for (const element of elements) {
      if (IsOwnElement(element)) {
        continue;
      }

      stats.matched += 1;
      try {
        stats.writes += ApplyRuleToElement(rule, ruleKey, element);
      } catch (error) {}
      stats.writes += MarkRuleApplied(rule, element);
    }
  }

  function ApplyInjectCSS(rule) {
    const id = GetInjectedCssId(rule);
    const css = String(rule.value ?? "");
    let styleEl = document.getElementById(id);
    if (styleEl) {
      if (styleEl.textContent === css) {
        return 0;
      }
      styleEl.textContent = css;
      return 1;
    }
    styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.setAttribute("data-sticky-css", "");
    styleEl.textContent = css;
    (document.head || document.documentElement).appendChild(styleEl);
    return 1;
  }

  function ApplyRuleToElement(rule, ruleKey, element) {
    const value = String(rule.value ?? "");

    switch (rule.action) {
      case "setText": {
        if (element === document.documentElement || element.textContent === value) {
          return 0;
        }
        element.textContent = value;
        return 1;
      }
      case "setHTML": {
        if (element === document.documentElement) {
          return 0;
        }
        const current = element.innerHTML;
        const state = GetElementRuleState(element, ruleKey);
        if (current === value || (state?.source === value && state.result === current)) {
          return 0;
        }
        element.innerHTML = value;
        SetElementRuleState(element, ruleKey, { source: value, result: element.innerHTML });
        return 1;
      }
      case "setValue": {
        if (!("value" in element) || element === document.activeElement) {
          return 0;
        }
        let writes = 0;
        const state = GetElementRuleState(element, ruleKey);
        const settled = element.value === value || (state?.source === value && state.result === element.value);
        if (!settled) {
          element.value = value;
          SetElementRuleState(element, ruleKey, { source: value, result: element.value });
          writes += 1;
        }
        if (element.getAttribute("value") !== value) {
          element.setAttribute("value", value);
          writes += 1;
        }
        return writes;
      }
      case "setAttribute": {
        const attributeName = String(rule.attributeName || "").trim();
        if (!attributeName || element.getAttribute(attributeName) === value) {
          return 0;
        }
        element.setAttribute(attributeName, value);
        return 1;
      }
      case "insertHTML":
        return InsertHtml(rule, element);
      case "remove":
        if (element === document.documentElement || element === document.head || element === document.body) {
          return 0;
        }
        element.remove();
        return 1;
      default:
        return 0;
    }
  }

  function InsertHtml(rule, element) {
    if (element.closest(`[${INSERTED_ATTRIBUTE}]`)) {
      return 0;
    }

    const marker = GetInsertMarker(rule);
    const position = rule.position || "append";
    if (HasInsertedContent(element, marker, position)) {
      return 0;
    }

    const parent = element.parentElement;
    if ((position === "before" || position === "after") && !parent) {
      return 0;
    }

    const fragment = BuildInsertFragment(rule.value, marker);
    if (!fragment.childNodes.length) {
      return 0;
    }

    if (position === "before") parent.insertBefore(fragment, element);
    else if (position === "after") parent.insertBefore(fragment, element.nextSibling);
    else if (position === "prepend") element.insertBefore(fragment, element.firstChild);
    else element.appendChild(fragment);
    return 1;
  }

  function HasInsertedContent(element, marker, position) {
    if (position === "before") {
      return Boolean(element.previousElementSibling?.hasAttribute(marker));
    }
    if (position === "after") {
      return Boolean(element.nextElementSibling?.hasAttribute(marker));
    }
    for (const child of element.children) {
      if (child.hasAttribute(marker)) {
        return true;
      }
    }
    return false;
  }

  function BuildInsertFragment(html, marker) {
    const template = document.createElement("template");
    template.innerHTML = String(html ?? "");
    const fragment = template.content;

    for (const node of Array.from(fragment.childNodes)) {
      let element = node;
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.data.trim()) {
          continue;
        }
        element = document.createElement("span");
        node.replaceWith(element);
        element.append(node);
      } else if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      element.setAttribute(marker, "");
      element.setAttribute(INSERTED_ATTRIBUTE, "");
    }

    return fragment;
  }

  function GetElementRuleState(element, ruleKey) {
    return elementRuleState.get(element)?.get(ruleKey) || null;
  }

  function SetElementRuleState(element, ruleKey, state) {
    let states = elementRuleState.get(element);
    if (!states) {
      states = new Map();
      elementRuleState.set(element, states);
    }
    states.set(ruleKey, state);
  }

  function RemoveStaleRuleArtifacts(previousRules, nextRules) {
    const nextKeys = new Set(nextRules.map(GetRuleKey));
    for (const rule of previousRules) {
      if (nextKeys.has(GetRuleKey(rule))) {
        continue;
      }
      try {
        if (rule.action === "injectCSS") {
          document.getElementById(GetInjectedCssId(rule))?.remove();
        } else if (rule.action === "insertHTML") {
          document.querySelectorAll(`[${GetInsertMarker(rule)}]`).forEach((node) => node.remove());
        }
      } catch (error) {}
    }
  }

  function GetRuleSuffix(rule) {
    return String(rule.savedAt || 0).replace(/[^\w-]/g, "");
  }

  function GetInjectedCssId(rule) {
    return `sticky-injected-css-${GetRuleSuffix(rule)}`;
  }

  function GetInsertMarker(rule) {
    return `data-sticky-injected-${GetRuleSuffix(rule)}`;
  }

  function IsOwnElement(element) {
    return element === panelHost ||
      element === ruleCloakElement ||
      element === initialCloakElement ||
      element.id === PANEL_HOST_ID ||
      element.hasAttribute("data-sticky-css");
  }

  async function SaveRule(rule, replacesKey) {
    const rules = await MutateRules((current) => UpsertRule(current, rule, replacesKey));
    return rules.length;
  }

  async function DeleteRule(ruleKey) {
    await MutateRules((current) => current.filter((rule) => GetRuleKey(rule) !== ruleKey));
  }

  async function MutateRules(mutate) {
    if (!storageKey) {
      throw new Error("This page cannot be modified by the extension.");
    }

    const nextRules = mutate(await ReadRules());
    await chrome.storage.local.set({ [storageKey]: nextRules });
    SetActiveRules(nextRules);
    return nextRules;
  }

  function UpsertRule(existingRules, nextRule, replacesKey) {
    const identity = GetRuleIdentity(nextRule);
    const IsReplaced = (rule) => (replacesKey && GetRuleKey(rule) === replacesKey) || GetRuleIdentity(rule) === identity;
    const index = existingRules.findIndex(IsReplaced);
    const filteredRules = existingRules.filter((rule) => !IsReplaced(rule));

    filteredRules.splice(index === -1 ? filteredRules.length : index, 0, nextRule);
    return filteredRules;
  }

  function GetRuleIdentity(rule) {
    if (rule.action === "injectCSS") {
      return `injectCSS::${rule.savedAt || 0}`;
    }
    return [rule.selector, rule.action, rule.attributeName || ""].join("::");
  }

  function GetRuleKey(rule) {
    return String(rule.savedAt || GetRuleIdentity(rule));
  }

  function NextSavedAt() {
    return activeRules.reduce((latest, rule) => Math.max(latest, (Number(rule.savedAt) || 0) + 1), Date.now());
  }

  async function ReadStoredState() {
    const keys = [THEME_STORAGE_KEY, storageKey, legacyStorageKey].filter(Boolean);
    const result = await chrome.storage.local.get(keys);
    return {
      rules: PickRules(result),
      themeId: NormalizeThemeId(result[THEME_STORAGE_KEY]),
    };
  }

  async function ReadRules() {
    if (!storageKey) {
      return [];
    }

    const result = await chrome.storage.local.get([storageKey, legacyStorageKey].filter(Boolean));
    return PickRules(result);
  }

  async function RefreshRulesFromStorage() {
    const rules = await ReadRules();
    if (!SameRules(rules, activeRules)) {
      SetActiveRules(rules);
    }
  }

  function PickRules(result) {
    if (storageKey && result[storageKey] !== undefined) {
      return NormalizeRules(result[storageKey]);
    }
    return legacyStorageKey ? NormalizeRules(result[legacyStorageKey]) : [];
  }

  function NormalizeRules(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((rule) => rule && typeof rule === "object" && typeof rule.action === "string");
  }

  function SameRules(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function RefreshRuleCloak() {
    activeReadyTokens = new Set(activeRules.map(GetRuleReadyToken));
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
    }
    if (ruleCloakElement.textContent !== css) {
      ruleCloakElement.textContent = css;
    }
    EnsureRuleCloakAttached();
  }

  function EnsureRuleCloakAttached() {
    if (!ruleCloakElement || ruleCloakElement.isConnected || !document.documentElement) {
      return 0;
    }
    document.documentElement.appendChild(ruleCloakElement);
    return 1;
  }

  function BuildRuleCloakCss(rules) {
    return rules
      .filter((rule) => rule?.selector && rule.action !== "injectCSS")
      .map((rule) => {
        const token = GetRuleReadyToken(rule);
        return `:where(${rule.selector}):not(html, head, body, #${PANEL_HOST_ID}):not([${RULE_READY_ATTRIBUTE}~="${token}"]){visibility:hidden!important;}`;
      })
      .join("\n");
  }

  function MarkRuleApplied(rule, element) {
    if (rule.action === "remove" || !element.isConnected) {
      return 0;
    }
    const token = GetRuleReadyToken(rule);
    const current = element.getAttribute(RULE_READY_ATTRIBUTE) || "";
    const tokens = current.split(/\s+/).filter((existing) => existing && activeReadyTokens.has(existing));
    if (!tokens.includes(token)) {
      tokens.push(token);
    }
    const next = tokens.join(" ");
    if (next === current) {
      return 0;
    }
    element.setAttribute(RULE_READY_ATTRIBUTE, next);
    return 1;
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

  function NormalizeThemeId(themeId) {
    return THEMES.some((theme) => theme.id === themeId) ? themeId : THEMES[0].id;
  }

  async function SaveThemeId(themeId) {
    activeThemeId = NormalizeThemeId(themeId);
    ApplyPanelTheme();
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: activeThemeId });
  }

  function GetActiveTheme() {
    return THEMES.find((theme) => theme.id === activeThemeId) || THEMES[0];
  }

  function ApplyPanelTheme() {
    if (!panelElement) return;
    const theme = GetActiveTheme();
    const targets = [panelElement, highlightBox].filter(Boolean);
    for (const [key, value] of Object.entries(theme)) {
      if (key !== "id" && key !== "name") {
        targets.forEach((target) => target.style.setProperty(`--si-${key}`, value));
      }
    }
    panelElement.dataset.theme = theme.id;
  }

  function IsolatePanelKeyEvent(event) {
    if (!panelHost || event.target !== panelHost) {
      return;
    }
    if (pickerActive && event.type === "keydown") {
      HandlePickerKeyDown(event);
    }
    event.stopImmediatePropagation();
  }

  function AddPickerListeners() {
    window.addEventListener("mousemove", HandlePickerMouseMove, true);
    for (const type of PICKER_BLOCKED_EVENTS) {
      window.addEventListener(type, BlockPickerEvent, true);
    }
    window.addEventListener("click", HandlePickerClick, true);
    window.addEventListener("keydown", HandlePickerKeyDown, true);
  }

  function RemovePickerListeners() {
    window.removeEventListener("mousemove", HandlePickerMouseMove, true);
    for (const type of PICKER_BLOCKED_EVENTS) {
      window.removeEventListener(type, BlockPickerEvent, true);
    }
    window.removeEventListener("click", HandlePickerClick, true);
    window.removeEventListener("keydown", HandlePickerKeyDown, true);
  }

  function HandlePickerMouseMove(event) {
    if (!pickerActive) {
      return;
    }

    const candidate = GetPickableElement(event.target);
    if (!candidate) {
      return;
    }

    SetHighlight(candidate);
  }

  function BlockPickerEvent(event) {
    if (!pickerActive || !GetPickableElement(event.target)) {
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

    StopPicker();
    RenderEditorPanel(candidate);
  }

  function HandlePickerKeyDown(event) {
    if (!pickerActive || event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    RenderMenuPanel();
  }

  function StopPicker() {
    if (!pickerActive) {
      return;
    }
    pickerActive = false;
    RemovePickerListeners();
  }

  function GetPickableElement(target) {
    if (!(target instanceof Element)) {
      return null;
    }

    if (panelHost && panelHost.contains(target)) {
      return null;
    }

    if (IsOwnElement(target)) {
      return null;
    }

    if (target === document.documentElement || target === document.body) {
      return null;
    }

    return target;
  }

  function SupportsPopover() {
    return typeof HTMLElement.prototype.showPopover === "function";
  }

  function EnsureOverlay() {
    if (!panelHost) {
      CreateOverlay();
    }
    AttachOverlay();
  }

  function CreateOverlay() {
    panelHost = document.createElement(PANEL_HOST_TAG);
    panelHost.id = PANEL_HOST_ID;
    panelHost.setAttribute("style", HOST_STYLE);
    if (SupportsPopover()) {
      panelHost.setAttribute("popover", "manual");
    }

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
        display: flex;
        flex-direction: column;
        width: min(340px, calc(100vw - 24px));
        max-width: calc(100vw - 24px);
        max-height: calc(100vh - ${PANEL_MARGIN * 2}px);
        background: var(--si-bg, #0f1f1a);
        color: var(--si-text, #ecfdf5);
        border: 1px solid var(--si-border, #1f3b30);
        border-radius: 12px;
        box-shadow: 0 18px 40px var(--si-shadow, rgba(0, 0, 0, 0.45));
        font: 13px/1.45 "Segoe UI", Tahoma, sans-serif;
        overflow: hidden;
        pointer-events: auto;
      }

      .panel-header {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 14px;
        background: var(--si-surface, #122b22);
        border-bottom: 1px solid var(--si-border, #1f3b30);
        cursor: move;
        user-select: none;
        touch-action: none;
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
        min-height: 0;
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
      .rules-list li.no-match .rule-sel { opacity: 0.5; }
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
      .element-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin: 0 0 6px;
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
        ClosePanel();
      }
    });
    ApplyPanelTheme();

    shadowRoot.append(style, highlightBox, panelElement);

    panelResizeObserver = new ResizeObserver(() => ApplyPanelPosition());
    panelResizeObserver.observe(panelElement);
    window.addEventListener("resize", HandleViewportResize, true);
    window.addEventListener("scroll", ScheduleHighlightRedraw, { capture: true, passive: true });
  }

  function AttachOverlay() {
    if (!panelHost || !document.documentElement) {
      return;
    }

    if (!panelHost.isConnected) {
      document.documentElement.appendChild(panelHost);
    }

    if (SupportsPopover()) {
      try {
        if (!panelHost.matches(":popover-open")) {
          panelHost.showPopover();
        }
      } catch (error) {}
    }
  }

  function ReattachOverlay() {
    if (!panelHost || !panelState.open || panelHost.isConnected || !document.documentElement) {
      return 0;
    }
    AttachOverlay();
    return 1;
  }

  function RemoveOverlay() {
    StopPicker();
    EndPanelDrag();
    SetHighlight(null);
    if (highlightFrame) {
      cancelAnimationFrame(highlightFrame);
      highlightFrame = 0;
    }
    window.removeEventListener("resize", HandleViewportResize, true);
    window.removeEventListener("scroll", ScheduleHighlightRedraw, { capture: true });
    panelResizeObserver?.disconnect();
    panelResizeObserver = null;

    if (panelHost?.isConnected) {
      panelHost.remove();
    }

    panelHost = null;
    highlightBox = null;
    panelElement = null;
  }

  function ClosePanel() {
    RemoveOverlay();
    panelState = { open: false, view: "menu", left: null, top: null };
    ClearPanelSession();
    UpdateObserver();
  }

  function IsPanelVisible() {
    return Boolean(panelElement && panelHost?.isConnected && panelState.open);
  }

  function PanelHeader(title) {
    const logo = logoUrl
      ? `<img class="header-logo" src="${EscapeHtml(logoUrl)}" alt="" aria-hidden="true">`
      : "";
    return `
      <div class="panel-header" data-drag-handle="true">
        <div class="header-title">
          ${logo}
          <h1 class="title">${EscapeHtml(title)}</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="header-icon gear-btn" data-action="open-themes" title="Themes" aria-label="Themes">&#9881;</button>
          <button type="button" class="header-icon close-x" data-action="close-x" title="Close" aria-label="Close">×</button>
        </div>
      </div>
    `;
  }

  function ReadPanelSession() {
    try {
      const raw = window.sessionStorage.getItem(PANEL_SESSION_KEY);
      const state = raw ? JSON.parse(raw) : null;
      if (!state || typeof state !== "object") {
        return null;
      }
      return {
        open: state.open === true,
        view: typeof state.view === "string" ? state.view : "menu",
        left: Number.isFinite(state.left) ? state.left : null,
        top: Number.isFinite(state.top) ? state.top : null,
      };
    } catch (e) {
      return null;
    }
  }

  function WritePanelSession() {
    if (!panelState.open) {
      return;
    }
    try {
      window.sessionStorage.setItem(PANEL_SESSION_KEY, JSON.stringify(panelState));
    } catch (e) {}
  }

  function ClearPanelSession() {
    try {
      window.sessionStorage.removeItem(PANEL_SESSION_KEY);
      LEGACY_PANEL_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
    } catch (e) {}
  }

  function RestorePanelFromSession() {
    const saved = ReadPanelSession();
    if (!saved?.open) {
      return;
    }

    panelState = { ...saved, open: true };
    EnsureOverlay();
    UpdateObserver();
    RestorePanelView(saved.view);
  }

  function RestorePanelView(view) {
    if (view === "themes") {
      RenderThemePanel();
    } else if (view === "rules") {
      RenderRulesListPanel();
    } else if (view === "manual") {
      RenderManualPanel();
    } else {
      RenderMenuPanel();
    }
  }

  function SetPanelView(view) {
    panelState.open = true;
    panelState.view = view;
    WritePanelSession();
  }

  function RenderPanel(view, title, bodyHtml) {
    if (!panelElement) {
      return false;
    }

    if (view !== "picker") {
      StopPicker();
    }
    SetHighlight(null);
    SetPanelView(view);
    panelElement.innerHTML = `
      ${PanelHeader(title)}
      <div class="panel-body">${bodyHtml}</div>
    `;
    BindPanelDragging();
    return true;
  }

  function CreateStatusSetter(statusElement) {
    return (text, isError) => {
      if (!statusElement) return;
      statusElement.textContent = text || "";
      statusElement.classList.toggle("error", Boolean(isError));
    };
  }

  function RenderThemePanel() {
    const cards = THEMES.map((theme) => RenderThemeCard(theme)).join("");
    const rendered = RenderPanel("themes", "Themes", `
      <p class="muted">Theme is global. Rules still stay saved per site.</p>
      <div class="theme-grid">${cards}</div>
      <div class="buttons stack">
        <button type="button" class="secondary" data-action="themes-back">Back</button>
      </div>
    `);
    if (!rendered) {
      return;
    }

    panelElement
      .querySelector('[data-action="themes-back"]')
      ?.addEventListener("click", () => RenderMenuPanel());

    panelElement.querySelectorAll(".theme-card").forEach((button) => {
      button.addEventListener("click", async () => {
        const themeId = button.getAttribute("data-theme-id");
        try {
          await SaveThemeId(themeId);
        } catch (error) {}
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
    const rendered = RenderPanel("picker", "Pick an element", `
      <p class="copy">${EscapeHtml(message || "Hover an element on the page, then click it.")}</p>
      <p class="muted">Press Esc to go back, or use the X to close.</p>
      <div class="buttons stack">
        <button type="button" class="secondary" data-action="back-to-menu">Back</button>
      </div>
    `);
    if (!rendered) {
      return;
    }

    if (!pickerActive) {
      pickerActive = true;
      AddPickerListeners();
    }

    panelElement
      .querySelector('[data-action="back-to-menu"]')
      ?.addEventListener("click", () => RenderMenuPanel());
  }

  function RenderMenuPanel(statusText) {
    const ruleCount = activeRules.length;
    const defaultStatus = `${ruleCount} rule${ruleCount === 1 ? "" : "s"} on ${pageKey || "this page"}`;

    const rendered = RenderPanel("menu", "Sticky Inspect", `
      <p class="muted" data-role="menu-status">${EscapeHtml(statusText || defaultStatus)}</p>
      <div class="buttons">
        <button type="button" class="primary" data-action="menu-pick">Pick element</button>
        <button type="button" class="secondary" data-action="menu-manual">Add manually</button>
        <button type="button" class="secondary" data-action="menu-rules">Rules (${ruleCount})</button>
        <button type="button" class="secondary" data-action="menu-apply">Reapply</button>
      </div>
      <p class="status"></p>
    `);
    if (!rendered) {
      return;
    }

    const SetStatus = CreateStatusSetter(panelElement.querySelector(".status"));

    panelElement
      .querySelector('[data-action="menu-pick"]')
      ?.addEventListener("click", () => RenderPickerPanel());

    panelElement
      .querySelector('[data-action="menu-manual"]')
      ?.addEventListener("click", () => RenderManualPanel());

    panelElement
      .querySelector('[data-action="menu-rules"]')
      ?.addEventListener("click", () => RenderRulesListPanel());

    panelElement
      .querySelector('[data-action="menu-apply"]')
      ?.addEventListener("click", async () => {
        try {
          const result = await ApplyRulesNow();
          if (result.ok) {
            SetStatus(`Reapplied rules to ${result.appliedCount} element${result.appliedCount === 1 ? "" : "s"}.`);
          } else {
            SetStatus(result.error || "Failed to reapply.", true);
          }
        } catch (error) {
          SetStatus(DescribeError(error), true);
        }
      });
  }

  function RenderRulesListPanel(statusText) {
    const ruleCount = activeRules.length;
    let unmatchedCount = 0;
    const rulesHtml = ruleCount
      ? `<ul class="rules-list">${activeRules
          .map((rule) => {
            const key = GetRuleKey(rule);
            const isCss = rule.action === "injectCSS";
            const label = isCss ? SummarizeCss(rule.value) : rule.selector || "";
            const matchCount = isCss ? null : CountMatches(rule.selector);
            const unmatched = matchCount === 0 && rule.action !== "remove";
            if (unmatched) unmatchedCount += 1;
            const matchText = matchCount === null ? "" : ` (${matchCount} match${matchCount === 1 ? "" : "es"} on this page)`;
            return `
              <li class="${unmatched ? "no-match" : ""}">
                <span class="rule-tag">${EscapeHtml(ActionLabel(rule.action))}</span>
                <span class="rule-sel" title="${EscapeHtml(label + matchText)}">${EscapeHtml(label)}</span>
                <button class="rule-edit" data-rule-key="${EscapeHtml(key)}" title="Edit rule" aria-label="Edit">✎</button>
                <button class="rule-del" data-rule-key="${EscapeHtml(key)}" title="Delete rule" aria-label="Delete">×</button>
              </li>
            `;
          })
          .join("")}</ul>`
      : `<div class="empty">No saved rules yet.</div>`;

    const defaultStatus = unmatchedCount
      ? "Faded rules match nothing on this page. Click ✎ to edit, × to delete."
      : "Click ✎ to edit a rule, × to delete it.";

    const rendered = RenderPanel("rules", `Rules (${ruleCount})`, `
      <p class="muted">${EscapeHtml(statusText || defaultStatus)}</p>
      ${rulesHtml}
      <div class="buttons">
        <button type="button" class="secondary" data-action="rules-back">Back</button>
        <button type="button" class="danger" data-action="rules-clear"${ruleCount ? "" : " disabled"}>Clear all</button>
      </div>
      <p class="status"></p>
    `);
    if (!rendered) {
      return;
    }

    const SetStatus = CreateStatusSetter(panelElement.querySelector(".status"));

    panelElement
      .querySelector('[data-action="rules-back"]')
      ?.addEventListener("click", () => RenderMenuPanel());

    const clearButton = panelElement.querySelector('[data-action="rules-clear"]');
    let clearArmedUntil = 0;
    clearButton?.addEventListener("click", async () => {
      if (Date.now() > clearArmedUntil) {
        clearArmedUntil = Date.now() + CLEAR_CONFIRM_MS;
        clearButton.textContent = "Click again to clear";
        window.setTimeout(() => {
          if (clearButton.isConnected) clearButton.textContent = "Clear all";
        }, CLEAR_CONFIRM_MS);
        return;
      }

      try {
        await ClearRules();
        RenderRulesListPanel("All rules cleared. Reload the page to restore the original content.");
      } catch (error) {
        SetStatus(DescribeError(error), true);
      }
    });

    panelElement.querySelectorAll(".rule-del").forEach((button) => {
      button.addEventListener("click", async () => {
        const key = button.getAttribute("data-rule-key");
        const rule = activeRules.find((candidate) => GetRuleKey(candidate) === key);
        try {
          await DeleteRule(key);
          const undoneLive = rule?.action === "injectCSS" || rule?.action === "insertHTML";
          RenderRulesListPanel(undoneLive ? "Rule deleted." : "Rule deleted. Reload the page to restore the original content.");
        } catch (error) {
          SetStatus(DescribeError(error), true);
        }
      });
    });

    panelElement.querySelectorAll(".rule-edit").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-rule-key");
        const rule = activeRules.find((candidate) => GetRuleKey(candidate) === key);
        if (rule) {
          RenderManualPanel({
            key,
            selector: rule.selector,
            action: rule.action,
            value: rule.value,
            attributeName: rule.attributeName,
            position: rule.position,
          });
        }
      });
    });
  }

  function RenderManualPanel(prefill) {
    const rendered = RenderPanel("manual", prefill?.key ? "Edit rule" : "Add rule manually", `
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
        <input data-field="attributeName" type="text" placeholder="style" spellcheck="false">
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
    `);
    if (!rendered) {
      return;
    }

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
    const SetStatus = CreateStatusSetter(panelElement.querySelector(".status"));
    let editingKey = prefill?.key || null;

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
        SetHighlight(null);
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
        SetHighlight(null);
        return;
      }
      if (!count) {
        selectorHint.textContent = "No matches on this page.";
        SetHighlight(null);
      } else {
        selectorHint.textContent = `${count} match${count === 1 ? "" : "es"} on this page.`;
        if (sample) {
          SetHighlight(sample);
          PrefillValueFromSample(sample);
        }
      }
    }

    let valueDirty = prefill?.value !== undefined;
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
      } else if (action === "setAttribute" && attributeInput.value && IsValidAttributeName(attributeInput.value.trim())) {
        valueInput.value = sample.getAttribute(attributeInput.value.trim()) ?? "";
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
      if (isCSS) {
        SetHighlight(null);
      } else {
        RefreshSelectorHint();
      }
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

    function MaybeNormalizeSelector() {
      const parsed = HtmlToSelector(selectorInput.value);
      if (parsed) {
        selectorInput.value = parsed;
        RefreshSelectorHint();
        SetStatus(`Detected pasted HTML, using selector ${parsed}.`);
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
      ?.addEventListener("click", () => RenderMenuPanel());

    panelElement
      .querySelector('[data-action="save-rule"]')
      ?.addEventListener("click", async () => {
        MaybeNormalizeSelector();
        const { rule, error } = BuildRule({
          action: actionSelect.value,
          selector: selectorInput.value,
          value: valueInput.value,
          attributeName: attributeInput.value,
          position: positionSelect.value,
        });
        if (error) {
          SetStatus(error, true);
          return;
        }

        const identity = GetRuleIdentity(rule);
        const replacesOther = activeRules.some((existing) => {
          return GetRuleIdentity(existing) === identity && GetRuleKey(existing) !== editingKey;
        });

        try {
          const newCount = await SaveRule(rule, editingKey);
          editingKey = GetRuleKey(rule);
          const note = replacesOther ? " Replaced the existing rule for this selector and action." : "";
          SetStatus(`Saved. ${newCount} rule${newCount === 1 ? "" : "s"} total.${note}`);
        } catch (saveError) {
          SetStatus(DescribeError(saveError), true);
        }
      });

    SyncFields();
  }

  function RenderEditorPanel(element) {
    const selector = BuildSelector(element);
    const currentText = element.textContent ?? "";
    const currentHTML = element.innerHTML ?? "";
    const currentValue = "value" in element ? String(element.value ?? "") : currentText;
    const available = window.__StickyInspectActions.GetApplicableActions(element);
    const parent = element.parentElement;
    const canSelectParent = Boolean(parent && parent !== document.documentElement && parent !== document.body);

    const actionOptions = available
      .map((a) => `<option value="${a.value}" data-hint="${EscapeHtml(a.hint || "")}">${EscapeHtml(a.label)}</option>`)
      .join("");

    const rendered = RenderPanel("editor", "Edit element", `
      <div class="element-meta">
        <p class="muted">${EscapeHtml(`<${element.localName}>`)} — ${available.length} compatible action${available.length === 1 ? "" : "s"}</p>
        ${canSelectParent ? `<button type="button" class="ghost" data-action="select-parent" title="Edit the element that contains this one">Select parent</button>` : ""}
      </div>
      <div class="selector">${EscapeHtml(selector)}</div>
      <label class="field">
        <span class="label">Action</span>
        <select data-field="action">${actionOptions}</select>
        <p class="hint" data-role="action-hint"></p>
      </label>
      <label class="field hidden" data-role="attribute-name-wrapper">
        <span class="label">Attribute name</span>
        <input data-field="attributeName" type="text" placeholder="style" spellcheck="false">
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
    `);
    if (!rendered) {
      return;
    }

    SetHighlight(element);

    const actionSelect = panelElement.querySelector('[data-field="action"]');
    const valueInput = panelElement.querySelector('[data-field="value"]');
    const attributeNameInput = panelElement.querySelector('[data-field="attributeName"]');
    const positionSelect = panelElement.querySelector('[data-field="position"]');
    const valueWrapper = panelElement.querySelector('[data-role="value-wrapper"]');
    const attributeWrapper = panelElement.querySelector('[data-role="attribute-name-wrapper"]');
    const positionWrapper = panelElement.querySelector('[data-role="position-wrapper"]');
    const actionHint = panelElement.querySelector('[data-role="action-hint"]');
    const SetStatus = CreateStatusSetter(panelElement.querySelector(".status"));
    let editingKey = null;

    function ReadElementAttribute(name) {
      const attributeName = name.trim();
      return IsValidAttributeName(attributeName) ? element.getAttribute(attributeName) ?? "" : "";
    }

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
        valueInput.value = ReadElementAttribute(attributeNameInput.value);
      }
    }

    actionSelect.addEventListener("change", SyncFields);
    attributeNameInput.addEventListener("input", () => {
      if (actionSelect.value === "setAttribute") {
        valueInput.value = ReadElementAttribute(attributeNameInput.value);
      }
    });

    SyncFields();

    panelElement
      .querySelector('[data-action="select-parent"]')
      ?.addEventListener("click", () => RenderEditorPanel(parent));

    panelElement
      .querySelector('[data-action="back-to-picker"]')
      ?.addEventListener("click", () => {
        RenderPickerPanel("Hover another element and click it.");
      });

    panelElement
      .querySelector('[data-action="save-rule"]')
      ?.addEventListener("click", async () => {
        const { rule, error } = BuildRule({
          action: actionSelect.value,
          selector,
          value: valueInput.value,
          attributeName: attributeNameInput.value,
          position: positionSelect.value,
        });
        if (error) {
          SetStatus(error, true);
          return;
        }

        try {
          const newCount = await SaveRule(rule, editingKey);
          editingKey = GetRuleKey(rule);
          SetStatus(`Saved. ${newCount} rule${newCount === 1 ? "" : "s"} total.`);
        } catch (saveError) {
          SetStatus(DescribeError(saveError), true);
        }
      });
  }

  function BuildRule(fields) {
    const action = fields.action;
    const rule = { action, savedAt: NextSavedAt() };

    if (action !== "injectCSS") {
      const selector = String(fields.selector || "").trim();
      if (!selector) {
        return { error: "Selector is required." };
      }
      if (!IsValidSelector(selector)) {
        return { error: "Invalid selector. Try pasting HTML or use a simpler selector like #id or .class." };
      }
      rule.selector = selector;
    }

    if (action !== "remove") {
      rule.value = String(fields.value ?? "");
    }

    if (action === "setAttribute") {
      const attributeName = String(fields.attributeName || "").trim();
      if (!attributeName) {
        return { error: "Attribute name is required." };
      }
      if (!IsValidAttributeName(attributeName)) {
        return { error: `"${attributeName}" is not a valid attribute name.` };
      }
      rule.attributeName = attributeName;
    }

    if (action === "insertHTML") {
      rule.position = fields.position || "append";
    }

    return { rule };
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

  function SummarizeCss(css) {
    const summary = String(css || "").replace(/\s+/g, " ").trim();
    return summary ? summary.slice(0, 80) : "(empty CSS)";
  }

  function CountMatches(selector) {
    try {
      return document.querySelectorAll(selector).length;
    } catch (error) {
      return 0;
    }
  }

  function IsValidSelector(selector) {
    try {
      document.createDocumentFragment().querySelector(selector);
      return true;
    } catch (error) {
      return false;
    }
  }

  function IsValidAttributeName(name) {
    if (!name) {
      return false;
    }
    try {
      document.createElement("div").setAttribute(name, "");
      return true;
    } catch (error) {
      return false;
    }
  }

  function BindPanelDragging() {
    const handle = panelElement?.querySelector('[data-drag-handle="true"]');
    if (!handle) {
      return;
    }

    handle.addEventListener("pointerdown", BeginPanelDrag);
    ApplyPanelPosition();
  }

  function GetViewportSize() {
    const root = document.compatMode === "BackCompat" ? document.body : document.documentElement;
    return {
      width: Math.min(window.innerWidth, root?.clientWidth || window.innerWidth),
      height: Math.min(window.innerHeight, root?.clientHeight || window.innerHeight),
    };
  }

  function ApplyPanelPosition() {
    if (!panelElement) {
      return;
    }

    const { left, top } = panelState;
    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      panelElement.style.left = "";
      panelElement.style.top = "";
      panelElement.style.right = "";
      return;
    }

    const viewport = GetViewportSize();
    const maxLeft = Math.max(PANEL_MARGIN, viewport.width - panelElement.offsetWidth - PANEL_MARGIN);
    const maxTop = Math.max(PANEL_MARGIN, viewport.height - panelElement.offsetHeight - PANEL_MARGIN);
    panelElement.style.left = `${Clamp(left, PANEL_MARGIN, maxLeft)}px`;
    panelElement.style.top = `${Clamp(top, PANEL_MARGIN, maxTop)}px`;
    panelElement.style.right = "auto";
  }

  function HandleViewportResize() {
    ApplyPanelPosition();
    ScheduleHighlightRedraw();
  }

  function BeginPanelDrag(event) {
    if (event.button !== 0 || !panelElement) {
      return;
    }
    if (event.target?.closest && event.target.closest("button, a, input, select, textarea")) {
      return;
    }

    EndPanelDrag();
    const rect = panelElement.getBoundingClientRect();
    panelDragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
      handle: event.currentTarget,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (e) {}

    document.addEventListener("pointermove", OnPanelDragMove, true);
    document.addEventListener("pointerup", EndPanelDrag, true);
    document.addEventListener("pointercancel", EndPanelDrag, true);
    event.currentTarget.addEventListener("lostpointercapture", EndPanelDrag, true);
    window.addEventListener("blur", EndPanelDrag, true);
    document.addEventListener("visibilitychange", EndPanelDrag, true);
    event.preventDefault();
  }

  function OnPanelDragMove(event) {
    if (!panelDragState || !panelElement) {
      return;
    }
    if (event.pointerId !== panelDragState.pointerId) {
      return;
    }
    if (event.buttons === 0) {
      EndPanelDrag();
      return;
    }

    panelState.left = Math.round(event.clientX - panelDragState.offsetX);
    panelState.top = Math.round(event.clientY - panelDragState.offsetY);
    ApplyPanelPosition();
  }

  function EndPanelDrag() {
    document.removeEventListener("pointermove", OnPanelDragMove, true);
    document.removeEventListener("pointerup", EndPanelDrag, true);
    document.removeEventListener("pointercancel", EndPanelDrag, true);
    document.removeEventListener("visibilitychange", EndPanelDrag, true);
    window.removeEventListener("blur", EndPanelDrag, true);

    if (!panelDragState) {
      return;
    }

    const { handle, pointerId } = panelDragState;
    panelDragState = null;
    handle.removeEventListener("lostpointercapture", EndPanelDrag, true);
    try {
      handle.releasePointerCapture(pointerId);
    } catch (e) {}

    if (panelElement && Number.isFinite(panelState.left)) {
      const rect = panelElement.getBoundingClientRect();
      panelState.left = Math.round(rect.left);
      panelState.top = Math.round(rect.top);
    }
    WritePanelSession();
  }

  function SetHighlight(element) {
    highlightedElement = element || null;
    DrawHighlight();
  }

  function ScheduleHighlightRedraw() {
    if (highlightFrame || !highlightedElement) {
      return;
    }
    highlightFrame = requestAnimationFrame(() => {
      highlightFrame = 0;
      DrawHighlight();
    });
  }

  function DrawHighlight() {
    if (!highlightBox) {
      return;
    }

    const element = highlightedElement;
    if (!element?.isConnected) {
      highlightBox.style.display = "none";
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
      .filter(IsStableClassName)
      .slice(0, 2);

    return classNames.length ? `.${classNames.map((name) => CSS.escape(name)).join(".")}` : "";
  }

  function IsStableClassName(className) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(className)) {
      return false;
    }
    if (/^(css|sc|jsx|svelte|emotion|styled)-/i.test(className)) {
      return false;
    }
    return !className.split(/[-_]+/).some((part) => {
      return part.length >= 5 && /\d/.test(part) && /[A-Za-z]/.test(part);
    });
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

  function GetPageKey(href, multipartSuffixes) {
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

      return GetRegistrableDomain(url.hostname, multipartSuffixes);
    } catch (error) {
      return null;
    }
  }

  function GetRegistrableDomain(hostname, multipartSuffixes) {
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

    const suffix = labels.slice(-2).join(".");
    if (multipartSuffixes.has(suffix)) {
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

    initialCloakTimer = window.setTimeout(RemoveInitialCloak, INITIAL_CLOAK_MAX_MS);
  }

  function RemoveInitialCloak() {
    if (!initialCloakElement) {
      return;
    }

    window.clearTimeout(initialCloakTimer);
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
      if (node === initialCloakElement) {
        document.documentElement.appendChild(node);
        document.documentElement.style.setProperty("visibility", "hidden", "important");
      }
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

  function GetExtensionUrl(path) {
    try {
      return chrome.runtime.getURL(path);
    } catch (error) {
      return "";
    }
  }

  function IsExtensionAlive() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch (error) {
      return false;
    }
  }

  function DescribeError(error) {
    if (!IsExtensionAlive()) {
      return "Sticky Inspect was updated or reloaded. Refresh this page to keep editing.";
    }
    return error instanceof Error ? error.message : String(error);
  }

  function EscapeHtml(value) {
    return String(value ?? "")
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
