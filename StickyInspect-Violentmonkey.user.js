// ==UserScript==
// @name         Sticky Inspect
// @namespace    https://github.com/ForceWarrior/StickyInspect
// @version      1.0.0
// @description  Save page edits and reapply them whenever a site reloads or changes.
// @author       ForceWarrior
// @match        http://*/*
// @match        https://*/*
// @match        file:///*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_PREFIX = "stickyInspectUserscriptRules:";
  const THEME_STORAGE_KEY = "stickyInspectUserscriptTheme";
  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:", "file:"]);
  const HOST_ID = "sticky-inspect-userscript-host";
  const HIGHLIGHT_ID = "sticky-inspect-userscript-highlight";
  const LAUNCHER_ID = "sticky-inspect-userscript-launcher";
  const INITIAL_CLOAK_ID = "sticky-inspect-userscript-initial-cloak";
  const RULE_CLOAK_ID = "sticky-inspect-userscript-rule-cloak";
  const RULE_READY_ATTRIBUTE = "data-sticky-inspect-userscript-ready";
  const REAPPLY_DEBOUNCE_MS = 150;
  const INITIAL_APPLY_INTERVAL_MS = 16;
  const INITIAL_APPLY_WINDOW_MS = 5000;
  const INITIAL_CLOAK_MAX_MS = 5000;
  const PANEL_OPEN_SESSION_KEY = "stickyInspectUserscript:panelOpen";
  const PANEL_VIEW_SESSION_KEY = "stickyInspectUserscript:panelView";
  const PANEL_POSITION_SESSION_KEY = "stickyInspectUserscript:panelPosition";

  const LOGO_SVG = `<span class="si-logo-text">SI</span>`;

  const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
  ]);
  const TEXT_HOSTILE_TAGS = new Set([
    "script", "style", "noscript", "template", "iframe", "object", "embed",
    "video", "audio", "canvas", "svg", "math", "img", "br", "hr", "meta",
    "link", "input", "textarea", "select", "option", "source", "track",
    "picture", "col", "colgroup",
  ]);
  const FORM_VALUE_TAGS = new Set(["input", "textarea", "select"]);

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

  const pageKey = GetPageKey(window.location.href);
  const storageKey = pageKey ? `${STORAGE_PREFIX}${pageKey}` : null;

  let activeRules = ReadRules();
  let observer = null;
  let applyScheduled = false;
  let isApplyingRules = false;
  let pickerActive = false;
  let highlightedElement = null;
  let selectedElement = null;
  let host = null;
  let panel = null;
  let highlightBox = null;
  let launcher = null;
  let dragState = null;
  let activeThemeId = ReadThemeId();
  let initialPhaseActive = false;
  let initialCloakElement = null;
  let ruleCloakElement = null;

  if (!IsSupportedPage()) {
    return;
  }

  RegisterMenuCommands();
  if (activeRules.length) {
    InstallInitialCloak();
  }
  InstallLauncher();
  InitializeUserscript();

  async function InitializeUserscript() {
    await WaitForDocumentElement();
    StartObserver();
    activeRules = ReadRules();

    if (!activeRules.length) {
      RemoveInitialCloak();
    } else {
      StartInitialApplyBurst();
    }

    RestorePanelIfOpen();
  }

  function RestorePanelIfOpen() {
    if (ReadSession(PANEL_OPEN_SESSION_KEY) !== "1") {
      return;
    }

    activeRules = ReadRules();
    EnsureOverlay();
    pickerActive = false;
    selectedElement = null;
    highlightedElement = null;
    RemovePickerListeners();

    const view = ReadSession(PANEL_VIEW_SESSION_KEY) || "menu";
    if (view === "themes") RenderThemePanel();
    else if (view === "rules") RenderRulesPanel();
    else if (view === "manual") RenderManualPanel();
    else RenderMenuPanel();

    RestorePanelPosition();
  }

  function ReadSession(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function WriteSession(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (e) {}
  }

  function RemoveSession(key) {
    try { window.sessionStorage.removeItem(key); } catch (e) {}
  }

  function MarkPanelOpen(view) {
    WriteSession(PANEL_OPEN_SESSION_KEY, "1");
    WriteSession(PANEL_VIEW_SESSION_KEY, view);
  }

  function MarkPanelClosed() {
    RemoveSession(PANEL_OPEN_SESSION_KEY);
    RemoveSession(PANEL_VIEW_SESSION_KEY);
    RemoveSession(PANEL_POSITION_SESSION_KEY);
  }

  function SavePanelPosition() {
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    WriteSession(PANEL_POSITION_SESSION_KEY, JSON.stringify({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
    }));
  }

  function RestorePanelPosition() {
    if (!panel) return;
    const raw = ReadSession(PANEL_POSITION_SESSION_KEY);
    if (!raw) return;
    let position;
    try { position = JSON.parse(raw); } catch (e) { return; }
    const left = Number(position?.left);
    const top = Number(position?.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
    panel.style.left = `${Clamp(left, 8, maxLeft)}px`;
    panel.style.top = `${Clamp(top, 8, maxTop)}px`;
    panel.style.right = "auto";
  }

  function RegisterMenuCommands() {
    if (typeof GM_registerMenuCommand !== "function") {
      return;
    }

    GM_registerMenuCommand("Sticky Inspect: Open", OpenMenu);
    GM_registerMenuCommand("Sticky Inspect: Reapply rules", () => {
      activeRules = ReadRules();
      ApplyAllRules();
    });
    GM_registerMenuCommand("Sticky Inspect: Clear rules for this site", () => {
      ClearRules();
      RenderMenuPanel("All rules cleared.");
    });
  }

  function InstallLauncher() {
    if (document.getElementById(LAUNCHER_ID)) {
      return;
    }

    launcher = document.createElement("button");
    launcher.id = LAUNCHER_ID;
    launcher.type = "button";
    launcher.textContent = "SI";
    launcher.title = "Open Sticky Inspect";
    launcher.addEventListener("click", ToggleMenu);

    const style = document.createElement("style");
    style.textContent = `
      #${LAUNCHER_ID} {
        position: fixed !important;
        right: 16px !important;
        bottom: 16px !important;
        z-index: 2147483646 !important;
        width: 42px !important;
        height: 42px !important;
        border: 1px solid var(--si-border, #1f3b30) !important;
        border-radius: 10px !important;
        background: var(--si-accent, #10b981) !important;
        color: var(--si-primaryText, #052e1a) !important;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35) !important;
        font: 700 13px/1 "Segoe UI", Tahoma, sans-serif !important;
        cursor: pointer !important;
      }
      #${LAUNCHER_ID}:hover { filter: brightness(1.08) !important; }
    `;

    AppendWhenReady(style);
    AppendWhenReady(launcher);
    ApplyTheme();
  }

  function ToggleMenu() {
    if (host?.isConnected) {
      ClosePanel();
      return;
    }

    OpenMenu();
  }

  function OpenMenu() {
    activeRules = ReadRules();
    EnsureOverlay();
    pickerActive = false;
    selectedElement = null;
    highlightedElement = null;
    RemovePickerListeners();
    RenderMenuPanel();
  }

  function StartObserver() {
    if (observer || !document.documentElement) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.every(IsOwnMutation)) {
        return;
      }

      if (!isApplyingRules) {
        ScheduleRuleApply();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  function ScheduleRuleApply() {
    if (applyScheduled) {
      return;
    }

    applyScheduled = true;
    queueMicrotask(() => {
      applyScheduled = false;
      activeRules = ReadRules();
      ApplyAllRules();
    });
  }

  function StartInitialApplyBurst() {
    initialPhaseActive = true;
    const burstStartedAt = Date.now();
    let stableHits = 0;

    const AllSatisfied = () => activeRules.every(IsRuleSatisfied);
    const ApplyPass = () => {
      ApplyAllRules();
      stableHits = AllSatisfied() ? stableHits + 1 : 0;
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
    document.addEventListener("DOMContentLoaded", ApplyPass, { once: true });
    window.addEventListener("load", ApplyPass, { once: true });
    window.setTimeout(StopBurst, INITIAL_CLOAK_MAX_MS);
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
    if (!rule || !rule.action) {
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
    const id = `sticky-inspect-userscript-css-${rule.savedAt || 0}`;
    let style = document.getElementById(id);
    const css = rule.value || "";
    if (style) {
      style.textContent = css;
      return true;
    }

    style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    AppendWhenReady(style);
    return true;
  }

  function ApplyRuleToElement(rule, element) {
    switch (rule.action) {
      case "setText":
        if (element.textContent !== rule.value) {
          element.textContent = rule.value;
        }
        return true;
      case "setValue":
        if ("value" in element && element.value !== rule.value) {
          element.value = rule.value;
          element.setAttribute("value", rule.value);
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        return false;
      case "setHTML":
        if (element.innerHTML !== rule.value) {
          element.innerHTML = rule.value;
        }
        return true;
      case "setAttribute":
        if (!rule.attributeName) {
          return false;
        }
        if (element.getAttribute(rule.attributeName) !== rule.value) {
          element.setAttribute(rule.attributeName, rule.value);
        }
        return true;
      case "insertHTML":
        return InsertHtml(rule, element);
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
    if (!rule || !rule.action) return true;

    if (rule.action === "injectCSS") {
      const style = document.getElementById(`sticky-inspect-userscript-css-${rule.savedAt || 0}`);
      return Boolean(style && style.textContent === (rule.value || ""));
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
      const marker = `data-sticky-inspect-userscript-${rule.savedAt || 0}`;
      const position = rule.position || "append";
      return elements.length > 0 && Array.from(elements).every((element) => {
        if (position === "before") return element.previousElementSibling?.hasAttribute?.(marker);
        if (position === "after") return element.nextElementSibling?.hasAttribute?.(marker);
        if (position === "prepend") return element.firstElementChild?.hasAttribute?.(marker);
        return element.lastElementChild?.hasAttribute?.(marker);
      });
    }

    if (!elements.length) return false;
    return Array.from(elements).every((element) => {
      switch (rule.action) {
        case "setText": return element.textContent === rule.value;
        case "setValue": return "value" in element ? element.value === rule.value : true;
        case "setHTML": return element.innerHTML === rule.value;
        case "setAttribute": return rule.attributeName ? element.getAttribute(rule.attributeName) === rule.value : true;
        default: return true;
      }
    });
  }

  function InsertHtml(rule, element) {
    const marker = `data-sticky-inspect-userscript-${rule.savedAt || 0}`;
    const position = rule.position || "append";
    if (position === "before" && element.previousElementSibling?.hasAttribute?.(marker)) return true;
    if (position === "after" && element.nextElementSibling?.hasAttribute?.(marker)) return true;
    if (position === "prepend" && element.firstElementChild?.hasAttribute?.(marker)) return true;
    if (position === "append" && element.lastElementChild?.hasAttribute?.(marker)) return true;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = rule.value || "";
    const nodes = Array.from(wrapper.childNodes);
    const firstElement = nodes.find((node) => node.nodeType === Node.ELEMENT_NODE);
    if (firstElement) {
      firstElement.setAttribute(marker, "");
    }

    if (position === "before") nodes.forEach((node) => element.parentNode?.insertBefore(node, element));
    else if (position === "after") nodes.reverse().forEach((node) => element.parentNode?.insertBefore(node, element.nextSibling));
    else if (position === "prepend") nodes.reverse().forEach((node) => element.insertBefore(node, element.firstChild));
    else nodes.forEach((node) => element.appendChild(node));
    return true;
  }

  function SaveRule(rule) {
    activeRules = UpsertRule(activeRules, rule);
    WriteRules(activeRules);
    RefreshRuleCloak();
    return activeRules.length;
  }

  function UpsertRule(existingRules, nextRule) {
    const nextIdentity = GetRuleIdentity(nextRule);
    return existingRules.filter((rule) => GetRuleIdentity(rule) !== nextIdentity).concat(nextRule);
  }

  function GetRuleIdentity(rule) {
    if (rule.action === "injectCSS") {
      return `injectCSS::${rule.savedAt || 0}`;
    }
    return [rule.selector || "", rule.action || "", rule.attributeName || ""].join("::");
  }

  function ReadRules() {
    if (!storageKey) {
      return [];
    }

    const value = ReadStoredValue(storageKey, []);
    return Array.isArray(value) ? value : [];
  }

  function WriteRules(rules) {
    if (storageKey) {
      WriteStoredValue(storageKey, rules);
    }
    RefreshRuleCloak();
  }

  function ClearRules() {
    if (!storageKey) {
      return;
    }
    DeleteStoredValue(storageKey);
    activeRules = [];
    RefreshRuleCloak();
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
      AppendWhenReady(ruleCloakElement);
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

  function EnsureOverlay() {
    if (host && panel && highlightBox) {
      return;
    }

    host = document.createElement("div");
    host.id = HOST_ID;
    const shadowRoot = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      #${HIGHLIGHT_ID} {
        position: fixed;
        z-index: 2147483646;
        border: 2px solid var(--si-accent, #10b981);
        background: color-mix(in srgb, var(--si-accent, #10b981) 22%, transparent);
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
        width: min(350px, calc(100vw - 24px));
        max-width: calc(100vw - 24px);
        background: var(--si-bg, #0f1f1a);
        color: var(--si-text, #ecfdf5);
        border: 1px solid var(--si-border, #1f3b30);
        border-radius: 12px;
        box-shadow: 0 18px 40px var(--si-shadow, rgba(0, 0, 0, 0.45));
        font: 13px/1.45 "Segoe UI", Tahoma, sans-serif;
        overflow: hidden;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: var(--si-surface, #122b22);
        border-bottom: 1px solid var(--si-border, #1f3b30);
        cursor: move;
        user-select: none;
      }
      .header-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .header-logo { width: 22px; height: 22px; border-radius: 6px; flex: 0 0 auto; background: var(--si-accent, #10b981); color: var(--si-primaryText, #052e1a); display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 0 0 1px color-mix(in srgb, var(--si-accent, #10b981) 35%, transparent), 0 4px 10px rgba(0, 0, 0, 0.25); }
      .si-logo-text { font: 800 11px/1 "Segoe UI", Tahoma, sans-serif; letter-spacing: 0.5px; }
      .header-actions { display: flex; align-items: center; gap: 6px; }
      .header-icon { background: transparent; color: var(--si-muted, #6ee7b7); border: 1px solid transparent; border-radius: 6px; padding: 0; width: 22px; height: 22px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
      .header-icon:hover { background: var(--si-border, #1f3b30); color: var(--si-text, #ecfdf5); }
      .gear-btn { font-size: 14px; }
      .close-x { font-size: 16px; }
      .title { margin: 0; font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .body { padding: 14px; max-height: 72vh; overflow-y: auto; }
      .muted { margin: 0 0 10px; color: var(--si-soft, #a7f3d0); font-size: 12px; }
      .selector {
        margin: 0 0 10px;
        padding: 8px;
        border: 1px solid var(--si-border, #1f3b30);
        border-radius: 6px;
        background: var(--si-field, #0a1612);
        color: var(--si-text, #d1fae5);
        font: 12px/1.35 Consolas, "Courier New", monospace;
        word-break: break-all;
        max-height: 78px;
        overflow: auto;
      }
      .field { display: block; margin-bottom: 10px; }
      .label { display: block; margin-bottom: 4px; color: var(--si-muted, #6ee7b7); font-size: 11px; text-transform: lowercase; }
      .hint { margin: 4px 0 0; color: var(--si-hint, #5eead4); font-size: 11px; opacity: 0.85; }
      input, select, textarea, button { font: inherit; }
      input, select, textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 7px 9px;
        border-radius: 6px;
        border: 1px solid var(--si-border, #1f3b30);
        background: var(--si-field, #0a1612);
        color: var(--si-text, #ecfdf5);
        outline: none;
      }
      textarea { min-height: 92px; resize: vertical; font-family: Consolas, "Courier New", monospace; font-size: 12px; }
      .buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
      .buttons.stack { grid-template-columns: 1fr; }
      button { border: 1px solid transparent; border-radius: 6px; padding: 8px 12px; cursor: pointer; font-weight: 600; }
      button:hover { filter: brightness(1.1); }
      .primary { background: var(--si-accent, #10b981); color: var(--si-primaryText, #052e1a); }
      .secondary { background: transparent; color: var(--si-soft, #a7f3d0); border-color: var(--si-border, #1f3b30); }
      .danger { background: transparent; color: var(--si-danger, #fca5a5); border-color: var(--si-dangerBorder, #4c1d1d); }
      .status { margin: 10px 0 0; min-height: 16px; color: var(--si-muted, #6ee7b7); font-size: 12px; }
      .status.error { color: var(--si-danger, #fca5a5); }
      .hidden { display: none; }
      .rules { list-style: none; margin: 0 0 10px; padding: 0; border: 1px solid var(--si-border, #1f3b30); border-radius: 6px; max-height: 185px; overflow-y: auto; }
      .rules li { display: flex; gap: 6px; align-items: center; padding: 6px 8px; border-bottom: 1px solid var(--si-border, #1f3b30); }
      .rules li:last-child { border-bottom: 0; }
      .tag { flex: 0 0 auto; padding: 1px 5px; border-radius: 3px; background: var(--si-tagBg, #042f1f); color: var(--si-muted, #6ee7b7); font-size: 10px; }
      .rule-selector { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: Consolas, "Courier New", monospace; }
      .mini { flex: 0 0 auto; padding: 2px 6px; background: transparent; color: var(--si-soft, #a7f3d0); border: 0; }
      .empty { padding: 10px; text-align: center; color: var(--si-muted, #6ee7b7); }
      .theme-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
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
      .theme-card[aria-pressed="true"] { outline: 2px solid var(--preview-accent); outline-offset: 1px; }
      .theme-card[aria-pressed="true"]::after { transform: scaleX(1); }
      .theme-name { font-size: 12px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
      .theme-preview { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
      .theme-lines { display: grid; gap: 5px; }
      .theme-line { height: 6px; border-radius: 999px; background: var(--preview-soft); opacity: 0.75; transition: opacity 220ms ease; }
      .theme-line.short { width: 60%; }
      .theme-line.tiny { width: 35%; height: 4px; }
      .theme-dot { width: 22px; height: 22px; border-radius: 7px; background: var(--preview-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--preview-accent) 25%, transparent); transition: transform 260ms ease; }
      .theme-swatches { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
      .theme-swatch { height: 7px; border-radius: 999px; transition: transform 200ms ease; }
      .theme-card:hover .theme-swatch { transform: scaleY(1.4); }
    `;

    highlightBox = document.createElement("div");
    highlightBox.id = HIGHLIGHT_ID;
    panel = document.createElement("section");
    panel.className = "panel";
    shadowRoot.append(style, highlightBox, panel);
    AppendWhenReady(host);
    ApplyTheme();
  }

  function PanelHeader(title) {
    return `
      <div class="header" data-drag-handle="true">
        <div class="header-title">
          <span class="header-logo" aria-hidden="true">${LOGO_SVG}</span>
          <h1 class="title">${EscapeHtml(title)}</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="header-icon gear-btn" data-action="open-themes" title="Themes" aria-label="Themes">&#9881;</button>
          <button type="button" class="header-icon close-x" data-action="close" title="Close" aria-label="Close">\u00d7</button>
        </div>
      </div>
    `;
  }

  function RenderMenuPanel(statusText) {
    EnsureOverlay();
    MarkPanelOpen("menu");
    const ruleCount = activeRules.length;
    panel.innerHTML = `
      ${PanelHeader("Sticky Inspect")}
      <div class="body">
        <p class="muted">${EscapeHtml(statusText || `${ruleCount} rule${ruleCount === 1 ? "" : "s"} on ${pageKey}`)}</p>
        <div class="buttons">
          <button type="button" class="primary" data-action="pick">Pick element</button>
          <button type="button" class="secondary" data-action="manual">Add manually</button>
          <button type="button" class="secondary" data-action="rules">Rules (${ruleCount})</button>
          <button type="button" class="secondary" data-action="apply">Reapply</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindCommonPanelActions();
    BindPanelDragging();
    const status = panel.querySelector(".status");
    panel.querySelector('[data-action="pick"]').addEventListener("click", StartPicker);
    panel.querySelector('[data-action="manual"]').addEventListener("click", () => RenderManualPanel());
    panel.querySelector('[data-action="rules"]').addEventListener("click", () => RenderRulesPanel());
    panel.querySelector('[data-action="apply"]').addEventListener("click", () => {
      const count = ApplyAllRules();
      status.textContent = `Reapplied ${count} change${count === 1 ? "" : "s"}.`;
    });
  }

  function RenderThemePanel() {
    MarkPanelOpen("themes");
    const cards = THEMES.map((theme) => RenderThemeCard(theme)).join("");
    panel.innerHTML = `
      ${PanelHeader("Themes")}
      <div class="body">
        <p class="muted">Theme is global. Rules still stay saved per site.</p>
        <div class="theme-grid">${cards}</div>
        <div class="buttons stack">
          <button type="button" class="secondary" data-action="back">Back</button>
        </div>
      </div>
    `;

    BindCommonPanelActions();
    BindPanelDragging();
    panel.querySelector('[data-action="back"]').addEventListener("click", () => RenderMenuPanel());
    panel.querySelectorAll(".theme-card").forEach((button) => {
      button.addEventListener("click", () => {
        SaveThemeId(button.dataset.themeId);
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

  function ReadThemeId() {
    const stored = ReadStoredValue(THEME_STORAGE_KEY, THEMES[0].id);
    return THEMES.some((theme) => theme.id === stored) ? stored : THEMES[0].id;
  }

  function SaveThemeId(themeId) {
    activeThemeId = THEMES.some((theme) => theme.id === themeId) ? themeId : THEMES[0].id;
    WriteStoredValue(THEME_STORAGE_KEY, activeThemeId);
    ApplyTheme();
  }

  function GetActiveTheme() {
    return THEMES.find((theme) => theme.id === activeThemeId) || THEMES[0];
  }

  function ApplyTheme() {
    const theme = GetActiveTheme();
    const targets = [host, panel, launcher].filter(Boolean);
    for (const [key, value] of Object.entries(theme)) {
      if (key !== "id" && key !== "name") {
        targets.forEach((target) => target.style.setProperty(`--si-${key}`, value));
      }
    }
  }

  function StartPicker(message) {
    EnsureOverlay();
    pickerActive = true;
    selectedElement = null;
    highlightedElement = null;
    AddPickerListeners();
    RenderPickerPanel(message);
  }

  function RenderPickerPanel(message) {
    panel.innerHTML = `
      ${PanelHeader("Pick an element")}
      <div class="body">
        <p class="muted">${EscapeHtml(message || "Hover an element on the page, then click it.")}</p>
        <div class="buttons stack">
          <button type="button" class="secondary" data-action="back">Back</button>
        </div>
      </div>
    `;
    BindCommonPanelActions();
    BindPanelDragging();
    panel.querySelector('[data-action="back"]').addEventListener("click", () => {
      StopPickerKeepPanel();
      RenderMenuPanel();
    });
  }

  function RenderRulesPanel(statusText) {
    MarkPanelOpen("rules");
    const rulesHtml = activeRules.length
      ? `<ul class="rules">${activeRules.map((rule, index) => `
          <li>
            <span class="tag">${EscapeHtml(ActionLabel(rule.action))}</span>
            <span class="rule-selector" title="${EscapeHtml(rule.selector || "global css")}">${EscapeHtml(rule.selector || "global css")}</span>
            <button type="button" class="mini" data-action="edit" data-index="${index}" title="Edit">edit</button>
            <button type="button" class="mini" data-action="delete" data-index="${index}" title="Delete">x</button>
          </li>
        `).join("")}</ul>`
      : `<div class="empty">No saved rules yet.</div>`;

    panel.innerHTML = `
      ${PanelHeader(`Rules (${activeRules.length})`)}
      <div class="body">
        <p class="muted">${EscapeHtml(statusText || "Edit, delete, or clear saved rules for this site.")}</p>
        ${rulesHtml}
        <div class="buttons">
          <button type="button" class="secondary" data-action="back">Back</button>
          <button type="button" class="danger" data-action="clear">Clear all</button>
        </div>
      </div>
    `;

    BindCommonPanelActions();
    BindPanelDragging();
    panel.querySelector('[data-action="back"]').addEventListener("click", () => RenderMenuPanel());
    panel.querySelector('[data-action="clear"]').addEventListener("click", () => {
      ClearRules();
      RenderRulesPanel("All rules cleared.");
    });
    panel.querySelectorAll('[data-action="delete"]').forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        activeRules.splice(index, 1);
        WriteRules(activeRules);
        RenderRulesPanel("Rule deleted.");
      });
    });
    panel.querySelectorAll('[data-action="edit"]').forEach((button) => {
      button.addEventListener("click", () => {
        const rule = activeRules[Number(button.dataset.index)];
        if (rule) {
          RenderManualPanel(rule);
        }
      });
    });
  }

  function RenderManualPanel(prefill) {
    MarkPanelOpen("manual");
    panel.innerHTML = `
      ${PanelHeader("Add rule manually")}
      <div class="body">
        <label class="field">
          <span class="label">Action</span>
          <select data-field="action">${DefaultActions().map((action) => `<option value="${action.value}" data-hint="${EscapeHtml(action.hint)}">${EscapeHtml(action.label)}</option>`).join("")}</select>
          <p class="hint" data-role="action-hint"></p>
        </label>
        <label class="field" data-role="selector-wrapper">
          <span class="label">CSS selector</span>
          <input data-field="selector" type="text" placeholder="#id, .class, or pasted HTML" spellcheck="false">
          <p class="hint" data-role="selector-hint"></p>
        </label>
        <label class="field hidden" data-role="attribute-wrapper">
          <span class="label">Attribute name</span>
          <input data-field="attributeName" type="text" placeholder="style">
        </label>
        <label class="field hidden" data-role="position-wrapper">
          <span class="label">Position</span>
          <select data-field="position">
            <option value="append">Inside at end</option>
            <option value="prepend">Inside at start</option>
            <option value="before">Before element</option>
            <option value="after">After element</option>
          </select>
        </label>
        <label class="field" data-role="value-wrapper">
          <span class="label" data-role="value-label">Value</span>
          <textarea data-field="value"></textarea>
        </label>
        <div class="buttons">
          <button type="button" class="primary" data-action="save">Save rule</button>
          <button type="button" class="secondary" data-action="back">Back</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindCommonPanelActions();
    BindPanelDragging();

    const actionSelect = panel.querySelector('[data-field="action"]');
    const selectorInput = panel.querySelector('[data-field="selector"]');
    const attributeInput = panel.querySelector('[data-field="attributeName"]');
    const positionSelect = panel.querySelector('[data-field="position"]');
    const valueInput = panel.querySelector('[data-field="value"]');
    const selectorWrapper = panel.querySelector('[data-role="selector-wrapper"]');
    const attributeWrapper = panel.querySelector('[data-role="attribute-wrapper"]');
    const positionWrapper = panel.querySelector('[data-role="position-wrapper"]');
    const valueWrapper = panel.querySelector('[data-role="value-wrapper"]');
    const valueLabel = panel.querySelector('[data-role="value-label"]');
    const actionHint = panel.querySelector('[data-role="action-hint"]');
    const selectorHint = panel.querySelector('[data-role="selector-hint"]');
    const status = panel.querySelector(".status");

    if (prefill) {
      actionSelect.value = prefill.action || "setText";
      selectorInput.value = prefill.selector || "";
      attributeInput.value = prefill.attributeName || "";
      positionSelect.value = prefill.position || "append";
      valueInput.value = prefill.value || "";
    }

    function SyncFields() {
      const action = actionSelect.value;
      selectorWrapper.classList.toggle("hidden", action === "injectCSS");
      attributeWrapper.classList.toggle("hidden", action !== "setAttribute");
      positionWrapper.classList.toggle("hidden", action !== "insertHTML");
      valueWrapper.classList.toggle("hidden", action === "remove");
      valueLabel.textContent = ValueLabelFor(action);
      actionHint.textContent = actionSelect.selectedOptions[0]?.dataset.hint || "";
      RefreshSelectorHint();
    }

    function RefreshSelectorHint() {
      if (actionSelect.value === "injectCSS") {
        selectorHint.textContent = "CSS rules apply globally on this page.";
        return;
      }

      const selector = selectorInput.value.trim();
      if (!selector) {
        selectorHint.textContent = "Type a CSS selector or paste an HTML element.";
        return;
      }

      try {
        const matches = document.querySelectorAll(selector);
        selectorHint.textContent = `${matches.length} match${matches.length === 1 ? "" : "es"} on this page.`;
        if (matches[0]) {
          DrawHighlight(matches[0]);
        }
      } catch (error) {
        selectorHint.textContent = "Invalid selector.";
      }
    }

    actionSelect.addEventListener("change", SyncFields);
    selectorInput.addEventListener("input", RefreshSelectorHint);
    selectorInput.addEventListener("blur", () => NormalizePastedHtmlSelector(selectorInput, status));
    panel.querySelector('[data-action="back"]').addEventListener("click", () => RenderMenuPanel());
    panel.querySelector('[data-action="save"]').addEventListener("click", () => {
      NormalizePastedHtmlSelector(selectorInput, status);
      const action = actionSelect.value;
      const isCss = action === "injectCSS";
      const selector = selectorInput.value.trim();

      if (!isCss) {
        if (!selector) {
          SetStatus(status, "Selector is required.", true);
          return;
        }
        try {
          document.querySelector(selector);
        } catch (error) {
          SetStatus(status, "Invalid selector.", true);
          return;
        }
      }

      const rule = {
        selector: isCss ? "" : selector,
        action,
        value: valueInput.value,
        attributeName: attributeInput.value.trim(),
        position: positionSelect.value,
        savedAt: prefill?.savedAt || Date.now(),
      };

      if (action === "setAttribute" && !rule.attributeName) {
        SetStatus(status, "Attribute name is required.", true);
        return;
      }
      if (action === "remove") {
        delete rule.value;
        delete rule.attributeName;
        delete rule.position;
      } else if (action === "insertHTML") {
        delete rule.attributeName;
      } else if (action === "injectCSS") {
        delete rule.selector;
        delete rule.attributeName;
        delete rule.position;
      } else if (action !== "setAttribute") {
        delete rule.attributeName;
        delete rule.position;
      } else {
        delete rule.position;
      }

      const count = SaveRule(rule);
      ApplyRule(rule);
      SetStatus(status, `Saved. ${count} rule${count === 1 ? "" : "s"} total.`, false);
    });

    SyncFields();
  }

  function RenderEditorPanel(element) {
    const selector = BuildSelector(element);
    const actions = GetApplicableActions(element);
    panel.innerHTML = `
      ${PanelHeader("Edit element")}
      <div class="body">
        <p class="muted">${EscapeHtml(`<${element.localName}>`)}</p>
        <div class="selector">${EscapeHtml(selector)}</div>
        <label class="field">
          <span class="label">Action</span>
          <select data-field="action">${actions.map((action) => `<option value="${action.value}" data-hint="${EscapeHtml(action.hint)}">${EscapeHtml(action.label)}</option>`).join("")}</select>
          <p class="hint" data-role="action-hint"></p>
        </label>
        <label class="field hidden" data-role="attribute-wrapper">
          <span class="label">Attribute name</span>
          <input data-field="attributeName" type="text" placeholder="style">
        </label>
        <label class="field hidden" data-role="position-wrapper">
          <span class="label">Position</span>
          <select data-field="position">
            <option value="append">Inside at end</option>
            <option value="prepend">Inside at start</option>
            <option value="before">Before element</option>
            <option value="after">After element</option>
          </select>
        </label>
        <label class="field" data-role="value-wrapper">
          <span class="label" data-role="value-label">Value</span>
          <textarea data-field="value"></textarea>
        </label>
        <div class="buttons">
          <button type="button" class="primary" data-action="save">Save rule</button>
          <button type="button" class="secondary" data-action="back">Back</button>
        </div>
        <p class="status"></p>
      </div>
    `;

    BindCommonPanelActions();
    BindPanelDragging();

    const actionSelect = panel.querySelector('[data-field="action"]');
    const attributeInput = panel.querySelector('[data-field="attributeName"]');
    const positionSelect = panel.querySelector('[data-field="position"]');
    const valueInput = panel.querySelector('[data-field="value"]');
    const attributeWrapper = panel.querySelector('[data-role="attribute-wrapper"]');
    const positionWrapper = panel.querySelector('[data-role="position-wrapper"]');
    const valueWrapper = panel.querySelector('[data-role="value-wrapper"]');
    const valueLabel = panel.querySelector('[data-role="value-label"]');
    const actionHint = panel.querySelector('[data-role="action-hint"]');
    const status = panel.querySelector(".status");

    function SyncFields() {
      const action = actionSelect.value;
      attributeWrapper.classList.toggle("hidden", action !== "setAttribute");
      positionWrapper.classList.toggle("hidden", action !== "insertHTML");
      valueWrapper.classList.toggle("hidden", action === "remove");
      valueLabel.textContent = ValueLabelFor(action);
      actionHint.textContent = actionSelect.selectedOptions[0]?.dataset.hint || "";

      if (action === "setText") valueInput.value = element.textContent || "";
      else if (action === "setValue" && "value" in element) valueInput.value = element.value || "";
      else if (action === "setHTML") valueInput.value = element.innerHTML || "";
      else if (action === "insertHTML" && !valueInput.value) valueInput.value = "<div>Hello</div>";
      else if (action === "setAttribute") {
        if (!attributeInput.value) attributeInput.value = "style";
        valueInput.value = element.getAttribute(attributeInput.value) || "";
      }
    }

    actionSelect.addEventListener("change", SyncFields);
    attributeInput.addEventListener("input", () => {
      if (actionSelect.value === "setAttribute") {
        valueInput.value = element.getAttribute(attributeInput.value) || "";
      }
    });
    panel.querySelector('[data-action="back"]').addEventListener("click", () => StartPicker("Hover another element and click it."));
    panel.querySelector('[data-action="save"]').addEventListener("click", () => {
      const action = actionSelect.value;
      const rule = {
        selector,
        action,
        value: valueInput.value,
        attributeName: attributeInput.value.trim(),
        position: positionSelect.value,
        savedAt: Date.now(),
      };

      if (action === "setAttribute" && !rule.attributeName) {
        SetStatus(status, "Attribute name is required.", true);
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

      const count = SaveRule(rule);
      ApplyRule(rule);
      SetStatus(status, `Saved. ${count} rule${count === 1 ? "" : "s"} total.`, false);
    });

    SyncFields();
  }

  function BindCommonPanelActions() {
    panel.querySelector('[data-action="close"]')?.addEventListener("click", ClosePanel);
    panel.querySelector('[data-action="open-themes"]')?.addEventListener("click", () => RenderThemePanel());
  }

  function ClosePanel() {
    StopPickerKeepPanel();
    host?.remove();
    host = null;
    panel = null;
    highlightBox = null;
    MarkPanelClosed();
  }

  function AddPickerListeners() {
    document.addEventListener("mousemove", HandlePickerMove, true);
    document.addEventListener("mousedown", BlockPickerClick, true);
    document.addEventListener("click", HandlePickerClick, true);
    document.addEventListener("keydown", HandlePickerKeyDown, true);
    window.addEventListener("scroll", SyncHighlight, true);
    window.addEventListener("resize", SyncHighlight, true);
  }

  function RemovePickerListeners() {
    document.removeEventListener("mousemove", HandlePickerMove, true);
    document.removeEventListener("mousedown", BlockPickerClick, true);
    document.removeEventListener("click", HandlePickerClick, true);
    document.removeEventListener("keydown", HandlePickerKeyDown, true);
    window.removeEventListener("scroll", SyncHighlight, true);
    window.removeEventListener("resize", SyncHighlight, true);
  }

  function HandlePickerMove(event) {
    if (!pickerActive) return;
    const candidate = GetPickableElement(event.target);
    if (!candidate) return;
    highlightedElement = candidate;
    DrawHighlight(candidate);
  }

  function BlockPickerClick(event) {
    if (!pickerActive || !GetPickableElement(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function HandlePickerClick(event) {
    if (!pickerActive) return;
    const candidate = GetPickableElement(event.target);
    if (!candidate) return;
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
    if (pickerActive && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      StopPickerKeepPanel();
      RenderMenuPanel();
    }
  }

  function StopPickerKeepPanel() {
    pickerActive = false;
    selectedElement = null;
    RemovePickerListeners();
    if (highlightBox) {
      highlightBox.style.display = "none";
    }
  }

  function SyncHighlight() {
    if (selectedElement?.isConnected) DrawHighlight(selectedElement);
    else if (highlightedElement?.isConnected) DrawHighlight(highlightedElement);
  }

  function GetPickableElement(target) {
    if (!(target instanceof Element)) return null;
    if (host?.contains(target)) return null;
    if (target.id === LAUNCHER_ID || target.id === HIGHLIGHT_ID) return null;
    if (target === document.documentElement || target === document.body) return null;
    return target;
  }

  function DrawHighlight(element) {
    if (!highlightBox || !element?.isConnected) return;
    const rect = element.getBoundingClientRect();
    highlightBox.style.display = "block";
    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.left = `${rect.left}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
  }

  function BindPanelDragging() {
    const handle = panel?.querySelector('[data-drag-handle="true"]');
    if (!handle) return;
    handle.addEventListener("pointerdown", BeginPanelDrag);
  }

  function BeginPanelDrag(event) {
    if (event.button !== 0 || !panel) return;
    if (event.target.closest?.("button, a, input, select, textarea")) return;
    const rect = panel.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      handle: event.currentTarget,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      maxLeft: Math.max(8, window.innerWidth - rect.width - 8),
      maxTop: Math.max(8, window.innerHeight - rect.height - 8),
      nextLeft: rect.left,
      nextTop: rect.top,
      frameId: 0,
    };
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = "auto";
    panel.style.willChange = "left, top";

    try { dragState.handle.setPointerCapture(event.pointerId); } catch (e) {}
    dragState.handle.addEventListener("pointermove", OnPanelDragMove);
    dragState.handle.addEventListener("pointerup", EndPanelDrag);
    dragState.handle.addEventListener("pointercancel", EndPanelDrag);
    dragState.handle.addEventListener("lostpointercapture", EndPanelDrag);
    window.addEventListener("blur", EndPanelDrag, true);
    document.addEventListener("visibilitychange", OnVisibilityCancelDrag, true);
    event.preventDefault();
  }

  function OnPanelDragMove(event) {
    if (!dragState || !panel || event.pointerId !== dragState.pointerId) return;
    dragState.nextLeft = Clamp(event.clientX - dragState.offsetX, 8, dragState.maxLeft);
    dragState.nextTop = Clamp(event.clientY - dragState.offsetY, 8, dragState.maxTop);
    if (!dragState.frameId) {
      dragState.frameId = window.requestAnimationFrame(FlushPanelDrag);
    }
  }

  function FlushPanelDrag() {
    if (!dragState || !panel) return;
    panel.style.left = `${dragState.nextLeft}px`;
    panel.style.top = `${dragState.nextTop}px`;
    dragState.frameId = 0;
  }

  function OnVisibilityCancelDrag() {
    if (document.visibilityState === "hidden") {
      EndPanelDrag();
    }
  }

  function EndPanelDrag(event) {
    if (!dragState) return;
    if (event && typeof event.pointerId === "number" && event.pointerId !== dragState.pointerId) return;

    if (dragState.frameId) {
      window.cancelAnimationFrame(dragState.frameId);
      FlushPanelDrag();
    }
    if (panel) {
      panel.style.willChange = "";
    }

    const { handle, pointerId } = dragState;
    if (handle) {
      try { handle.releasePointerCapture(pointerId); } catch (e) {}
      handle.removeEventListener("pointermove", OnPanelDragMove);
      handle.removeEventListener("pointerup", EndPanelDrag);
      handle.removeEventListener("pointercancel", EndPanelDrag);
      handle.removeEventListener("lostpointercapture", EndPanelDrag);
    }
    window.removeEventListener("blur", EndPanelDrag, true);
    document.removeEventListener("visibilitychange", OnVisibilityCancelDrag, true);

    dragState = null;
    SavePanelPosition();
  }

  function DescribeElement(element) {
    if (!(element instanceof Element)) return null;
    const tag = element.localName;
    return {
      tag,
      isVoid: VOID_ELEMENTS.has(tag),
      isFormValue: FORM_VALUE_TAGS.has(tag),
      hasTextContent: !TEXT_HOSTILE_TAGS.has(tag),
      isRoot: element === document.documentElement || element === document.body,
    };
  }

  function GetApplicableActions(element) {
    const info = DescribeElement(element);
    if (!info) return DefaultActions();
    const actions = [];
    if (info.hasTextContent && !info.isVoid) actions.push({ value: "setText", label: "Set text", hint: "Replace visible text." });
    if (info.isFormValue) actions.push({ value: "setValue", label: "Set value", hint: "Replace a form value." });
    if (!info.isVoid) actions.push({ value: "setHTML", label: "Set HTML", hint: "Replace inner HTML." });
    actions.push({ value: "insertHTML", label: "Insert HTML", hint: "Insert HTML around or inside the element." });
    actions.push({ value: "setAttribute", label: "Set attribute", hint: "Add or replace an attribute." });
    if (!info.isRoot) actions.push({ value: "remove", label: "Remove element", hint: "Delete the element." });
    return actions;
  }

  function DefaultActions() {
    return [
      { value: "setText", label: "Replace text", hint: "Replace visible text." },
      { value: "setValue", label: "Set form value", hint: "Replace input, textarea, or select values." },
      { value: "setHTML", label: "Replace HTML", hint: "Overwrite child HTML." },
      { value: "insertHTML", label: "Insert HTML", hint: "Insert custom HTML." },
      { value: "injectCSS", label: "Inject CSS", hint: "Add CSS rules for this page." },
      { value: "setAttribute", label: "Set attribute", hint: "Add or replace an attribute." },
      { value: "remove", label: "Remove element", hint: "Delete matching elements." },
    ];
  }

  function ValueLabelFor(action) {
    return {
      setText: "New text",
      setValue: "New form value",
      setHTML: "Replacement HTML",
      insertHTML: "HTML to insert",
      injectCSS: "CSS rules",
      setAttribute: "Attribute value",
      remove: "Value",
    }[action] || "Value";
  }

  function ActionLabel(action) {
    return {
      setText: "text",
      setValue: "value",
      setHTML: "html",
      insertHTML: "insert",
      injectCSS: "css",
      setAttribute: "attr",
      remove: "remove",
    }[action] || action || "?";
  }

  function BuildSelector(element) {
    if (element.id) {
      const selector = `#${CSS.escape(element.id)}`;
      if (IsUniqueSelector(selector)) return selector;
    }

    const segments = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let segment = current.localName;
      if (!segment) break;

      if (current.id) {
        segments.unshift(`#${CSS.escape(current.id)}`);
        return segments.join(" > ");
      }

      segment += StableAttributeSelector(current) || ClassSelector(current);
      const parent = current.parentElement;
      if (parent) {
        const sameTagSiblings = Array.from(parent.children).filter((child) => child.localName === current.localName);
        if (sameTagSiblings.length > 1) {
          segment += `:nth-of-type(${sameTagSiblings.indexOf(current) + 1})`;
        }
      }

      segments.unshift(segment);
      const candidate = segments.join(" > ");
      if (IsUniqueSelector(candidate)) return candidate;
      current = parent;
    }
    return segments.join(" > ");
  }

  function StableAttributeSelector(element) {
    for (const name of ["data-testid", "data-test", "data-qa", "aria-label", "name"]) {
      const value = element.getAttribute(name);
      if (!value) continue;
      const selector = `[${name}="${CSS.escape(value)}"]`;
      if (IsUniqueSelector(selector)) return selector;
    }
    return "";
  }

  function ClassSelector(element) {
    const classes = Array.from(element.classList)
      .filter((className) => /^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(className))
      .slice(0, 2);
    return classes.length ? `.${classes.map((className) => CSS.escape(className)).join(".")}` : "";
  }

  function IsUniqueSelector(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch (error) {
      return false;
    }
  }

  function NormalizePastedHtmlSelector(input, status) {
    const value = input.value.trim();
    if (!value.startsWith("<")) return;
    const template = document.createElement("template");
    template.innerHTML = value;
    const element = template.content.firstElementChild;
    if (!element) return;

    if (element.id) {
      input.value = `#${CSS.escape(element.id)}`;
    } else {
      const classes = (element.getAttribute("class") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((className) => `.${CSS.escape(className)}`)
        .join("");
      input.value = `${element.localName}${classes}`;
    }
    SetStatus(status, `Detected pasted HTML, using ${input.value}.`, false);
  }

  function SetStatus(element, text, isError) {
    element.textContent = text;
    element.classList.toggle("error", Boolean(isError));
  }

  function GetPageKey(href) {
    try {
      const url = new URL(href);
      if (!SUPPORTED_PROTOCOLS.has(url.protocol)) return null;
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
    if (!normalized) return null;
    if (normalized === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) return normalized;

    const labels = normalized.split(".").filter(Boolean);
    if (labels.length <= 2) return normalized;

    const multipartSuffixes = new Set(["co.uk", "org.uk", "gov.uk", "ac.uk", "co.jp", "com.au", "net.au", "org.au", "co.nz", "com.br"]);
    const suffix = labels.slice(-2).join(".");
    if (multipartSuffixes.has(suffix) && labels.length >= 3) return labels.slice(-3).join(".");
    return labels.slice(-2).join(".");
  }

  function IsSupportedPage() {
    return Boolean(pageKey) && SUPPORTED_PROTOCOLS.has(window.location.protocol);
  }

  function InstallInitialCloak() {
    if (initialCloakElement) {
      return;
    }

    initialCloakElement = document.createElement("style");
    initialCloakElement.id = INITIAL_CLOAK_ID;
    initialCloakElement.textContent = "html{visibility:hidden !important;}";
    AppendWhenReady(initialCloakElement);
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

  function IsOwnMutation(mutation) {
    const target = mutation.target;
    if (!(target instanceof Node)) {
      return false;
    }
    return Boolean(
      host?.contains(target) ||
      launcher?.contains?.(target) ||
      target === host ||
      target === launcher ||
      target === initialCloakElement ||
      target === ruleCloakElement ||
      mutation.attributeName === RULE_READY_ATTRIBUTE
    );
  }

  function ReadStoredValue(key, fallback) {
    try {
      if (typeof GM_getValue === "function") {
        return GM_getValue(key, fallback);
      }
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function WriteStoredValue(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {}
  }

  function DeleteStoredValue(key) {
    try {
      if (typeof GM_deleteValue === "function") {
        GM_deleteValue(key);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {}
  }

  function AppendWhenReady(node) {
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
    rootObserver.observe(document, { childList: true, subtree: true });
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
