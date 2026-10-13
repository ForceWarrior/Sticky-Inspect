# Sticky Inspect

Sticky Inspect is a browser extension for saving page edits that keep coming
back after refresh. Pick an element, choose what to change, and Sticky Inspect
will reapply that rule whenever the page loads or changes.

## Features

- Visual element picker with a live highlight.
- Per-site saved rules for text, values, HTML, attributes, inserted HTML,
	injected CSS, and removed elements.
- Manual rule creation with CSS selectors or pasted HTML snippets.
- Rule manager for editing, deleting, clearing, and reapplying changes.
- Draggable in-page panel with multiple themes.
- Automatic reapply on dynamic pages through a DOM observer.

## Install For Development

1. Open your browser extension manager.
2. Enable developer mode.
3. Choose the option to load an unpacked extension.
4. Select this project's folder (the one that contains `manifest.json`).
5. Pin Sticky Inspect if you want quick access from the toolbar.

## Usage

1. Open a page, then click the Sticky Inspect toolbar icon. Clicking it again
	closes the panel.
2. Choose `Pick element` and click an element on the page.
3. Select an action, edit the value, and save the rule.
4. Use `Rules` to edit, delete, clear, or reapply saved rules.

Rules are stored per site. For normal web pages, Sticky Inspect groups rules by
registrable domain, such as `example.com`. Subdomains of shared hosts and
country domains (for example `name.github.io` or `shop.example.co.in`) count as
separate sites. For local files, rules are stored by the file URL without query
strings or hashes. Changes made in one tab show up in other open tabs of the
same site right away.

## Permissions

Sticky Inspect requests:

- `storage`, to save rules and theme preferences.
- `scripting`, to add the in-page panel to tabs that were already open before
	Sticky Inspect was installed or updated.
- `<all_urls>`, so saved edits can be reapplied on any page where you created
	them.

## Userscript Version

A Violentmonkey or Tampermonkey compatible version is available at
`StickyInspect-Violentmonkey.user.js`.

The userscript build cannot use the browser toolbar action, so it adds a small
floating `SI` launcher and menu commands instead.

## License

See `LICENSE.txt`.

## Extension

Get the extension here:
https://chromewebstore.google.com/detail/sticky-inspect/ccddikklnkkdcejidbkmbaopfjggcaph

## Notes

- AI assistance was used
