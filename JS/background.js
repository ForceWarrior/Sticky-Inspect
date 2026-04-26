chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) {
    return;
  }

  if (!tab.url || !/^(https?|file):/i.test(tab.url)) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "stickyInspect:openMenu", forceDefaultPosition: true });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: false },
        files: ["JS/actions.js", "JS/content.js"],
      });
      await chrome.tabs.sendMessage(tab.id, { type: "stickyInspect:openMenu", forceDefaultPosition: true });
    } catch (injectError) {}
  }
});






