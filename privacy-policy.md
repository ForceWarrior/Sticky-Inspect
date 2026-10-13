# Sticky Inspect Privacy Policy

Effective date: October 13, 2026

Sticky Inspect is a browser extension that lets you pick elements on web pages, save local page edits, and reapply those edits when the page reloads or changes.

## Summary

Sticky Inspect does not collect, sell, rent, or transmit your personal information. The extension stores your saved rules and preferences locally in your browser so it can reapply your changes on the sites where you created them.

## Information Stored By The Extension

Sticky Inspect may store the following data locally in your browser:

- Saved rules for a site, such as CSS selectors, replacement text, form values, HTML snippets, CSS rules, attribute values, and remove/insert actions. When you pick an element, its current text or HTML is shown in the editor so you can change it. Whatever you save becomes part of the rule.
- Theme preference.
- Site keys used to associate saved rules with a domain or local file URL.

Rules, site keys, and the theme preference are stored in the extension's local storage (`chrome.storage.local`). Temporary panel state, such as whether the panel is open and where it was positioned, is kept in the tab's session storage and is cleared when the tab is closed. All of this stays on your device unless your browser sync settings or backup tools copy extension data elsewhere.

## Page Access

Sticky Inspect requests access to web pages so it can provide its core features:

- Inspect elements on pages you open.
- Highlight selected elements.
- Apply saved edits when a page loads or changes.
- Run on supported pages when you open the extension panel.

The extension can read and modify page content only to perform the actions you choose, such as replacing text, setting values, inserting HTML, injecting CSS, setting attributes, or removing elements.

## Data Sharing

Sticky Inspect does not send your saved rules, page content, browsing history, or preferences to any external server. It does not include analytics, tracking pixels, advertising SDKs, or remote logging.

Sticky Inspect does not sell or share user data with third parties.

## Remote Code

Sticky Inspect does not download or execute remote code. The extension runs the files packaged with the extension.

## User Control

You can delete saved rules from the extension's rule manager or by clearing the extension's browser storage. You can remove all extension data by uninstalling Sticky Inspect, subject to your browser's normal extension storage behavior.

## Permissions

Sticky Inspect uses these browser permissions:

- `storage`, to save rules and the theme preference locally.
- `scripting`, to add the in-page panel to tabs that were already open before Sticky Inspect was installed or updated.
- `<all_urls>`, so saved edits can be applied on the pages and local files where you use Sticky Inspect.

## Changes To This Policy

If Sticky Inspect changes how it handles data, this policy should be updated to describe the new behavior.

## Contact

For questions or issues, use the project repository or the support channel where you obtained the extension.
