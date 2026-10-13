const SUPPORTED_URL = /^(https?|file):/i;
const CONTENT_SCRIPT_FILES = ["JS/actions.js", "JS/content.js"];
const LEGACY_PANEL_STATE_PREFIX = "stickyInspectPanelState:";
const BADGE_CLEAR_MS = 4000;

chrome.action.onClicked.addListener((tab) => {
  HandleActionClick(tab);
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "update") {
    RemoveLegacyPanelState();
  }
});

async function HandleActionClick(tab) {
  if (!tab?.id) {
    return;
  }

  if (tab.url && !SUPPORTED_URL.test(tab.url)) {
    await FlagUnusableTab(tab.id, "Sticky Inspect can't run on this page.");
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "stickyInspect:togglePanel" });
    if (response?.ok === false) {
      await FlagUnusableTab(tab.id, response.error || "Sticky Inspect can't run on this page.");
    }
    return;
  } catch (error) {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      files: CONTENT_SCRIPT_FILES,
    });
    await chrome.tabs.sendMessage(tab.id, { type: "stickyInspect:openMenu" });
  } catch (injectError) {
    const isFile = /^file:/i.test(tab.url || "");
    await FlagUnusableTab(
      tab.id,
      isFile
        ? "Turn on \"Allow access to file URLs\" for Sticky Inspect in chrome://extensions to use it on local files."
        : "Sticky Inspect can't run on this page."
    );
  }
}

async function FlagUnusableTab(tabId, title) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#b91c1c" });
    await chrome.action.setBadgeText({ tabId, text: "!" });
    await chrome.action.setTitle({ tabId, title });
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {});
      chrome.action.setTitle({ tabId, title: "Sticky Inspect" }).catch(() => {});
    }, BADGE_CLEAR_MS);
  } catch (error) {}
}

async function RemoveLegacyPanelState() {
  try {
    const stored = await chrome.storage.local.get(null);
    const staleKeys = Object.keys(stored).filter((key) => key.startsWith(LEGACY_PANEL_STATE_PREFIX));
    if (staleKeys.length) {
      await chrome.storage.local.remove(staleKeys);
    }
  } catch (error) {}
}
