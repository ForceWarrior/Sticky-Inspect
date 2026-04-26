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
4. Select the `src` folder from this project.
5. Pin Sticky Inspect if you want quick access from the toolbar.

## Usage

1. Open a page, then click the Sticky Inspect toolbar icon.
2. Choose `Pick element` and click an element on the page.
3. Select an action, edit the value, and save the rule.
4. Use `Rules` to edit, delete, clear, or reapply saved rules.

Rules are stored per site. For normal web pages, Sticky Inspect groups rules by
registrable domain, such as `example.com`. For local files, rules are stored by
the file URL without query strings or hashes.

## Permissions

Sticky Inspect requests:

- `storage`, to save rules and theme preferences.
- `tabs`, `activeTab`, and `scripting`, to open the in-page panel and inject the
	content scripts when needed.
- `<all_urls>`, so the extension can run on all pages.

## Userscript Version

A Violentmonkey or Tampermonkey compatible version is available at
`StickyInspect-Violentmonkey.user.js`.

The userscript build cannot use the browser toolbar action, so it adds a small
floating `SI` launcher and menu commands instead.

## License

See `LICENSE.txt`.
