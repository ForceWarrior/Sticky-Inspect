(function () {
  const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);

  const TEXT_HOSTILE_TAGS = new Set([
    "script", "style", "noscript", "template", "iframe", "object",
    "embed", "video", "audio", "canvas", "svg", "math",
    "img", "br", "hr", "meta", "link", "input", "textarea", "select",
    "option", "source", "track", "picture", "col", "colgroup",
  ]);

  const FORM_VALUE_TAGS = new Set(["input", "textarea", "select"]);

  function Describe(element) {
    if (!(element instanceof Element)) {
      return null;
    }
    const tag = element.localName;
    const type = element.getAttribute("type") || "";
    return {
      tag,
      type,
      isVoid: VOID_ELEMENTS.has(tag),
      isFormValue: FORM_VALUE_TAGS.has(tag),
      hasTextContent: !TEXT_HOSTILE_TAGS.has(tag),
      isRoot: element === document.documentElement || element === document.body,
    };
  }

  function GetApplicableActions(element) {
    const info = Describe(element);
    if (!info) {
      return DefaultActions();
    }

    const actions = [];

    if (info.hasTextContent && !info.isVoid) {
      actions.push({
        value: "setText",
        label: "Set text",
        hint: "Replace the visible text inside this element.",
        recommended: !info.isFormValue,
      });
    }

    if (info.isFormValue) {
      actions.push({
        value: "setValue",
        label: "Set value",
        hint: "Replace the form value (works on input, textarea, select).",
        recommended: true,
      });
    }

    if (!info.isVoid) {
      actions.push({
        value: "setHTML",
        label: "Set HTML",
        hint: "Replace the inner HTML. Be careful with markup.",
      });
    }

    actions.push({
      value: "insertHTML",
      label: "Insert HTML",
      hint: "Insert custom HTML before/after/inside this element.",
    });

    actions.push({
      value: "setAttribute",
      label: "Set attribute",
      hint: "Override or add an attribute (style, class, src, ...).",
    });

    if (!info.isRoot) {
      actions.push({
        value: "remove",
        label: "Remove element",
        hint: "Delete the element from the page.",
      });
    }

    return actions;
  }

  function DefaultActions() {
    return [
      { value: "setText", label: "Replace text", hint: "Replace the visible text inside matching elements." },
      { value: "setValue", label: "Set form value", hint: "Replace the value of input/textarea/select." },
      { value: "setHTML", label: "Replace inner HTML", hint: "Overwrite the children of matching elements with raw HTML." },
      { value: "insertHTML", label: "Insert HTML", hint: "Insert custom HTML before/after/inside matching elements." },
      { value: "injectCSS", label: "Inject CSS", hint: "Append a <style> tag with raw CSS rules. No selector needed." },
      { value: "setAttribute", label: "Set attribute", hint: "Override or add an attribute (style, class, src, ...)." },
      { value: "remove", label: "Remove element", hint: "Delete matching elements from the page." },
    ];
  }

  function GetApplicableForSelector(selector) {
    if (!selector) {
      return { actions: DefaultActions(), matchCount: 0, sample: null };
    }

    let matches;
    try {
      matches = document.querySelectorAll(selector);
    } catch (error) {
      return { actions: DefaultActions(), matchCount: 0, sample: null, error: "Invalid selector." };
    }

    if (!matches.length) {
      return { actions: DefaultActions(), matchCount: 0, sample: null };
    }

    return {
      actions: GetApplicableActions(matches[0]),
      matchCount: matches.length,
      sample: matches[0],
    };
  }

  window.__StickyInspectActions = {
    Describe,
    GetApplicableActions,
    GetApplicableForSelector,
    DefaultActions,
  };
})();