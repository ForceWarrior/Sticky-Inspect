# Changelog

## 1.1.0 - 2026-10-13

Stability release. Fixes the page freezes and lost edits reported by users.

### Fixed

- Pages could freeze completely when a rule's value was normalised by the
	browser (for example `Set HTML` containing `&` or `<br/>`), when `Insert HTML`
	contained several elements or plain text, or when the site kept undoing an
	edit. Rules now settle after one write, and a built-in brake slows Sticky
	Inspect down instead of letting it lock up the tab.
- Saving a rule in one tab could delete rules saved in another tab on the same
	site. Every save now starts from the latest stored rules, and open tabs stay
	in sync.
- One invalid rule (such as a bad attribute name) stopped every later rule from
	applying and could leave the whole page hidden.
- Pages were hidden for up to 5 seconds on every load when a site had a rule
	whose element was not on that page.
- `Set value` rules hid the input when it already had the saved value.
- The rules list did not open when a site had an `Inject CSS` rule.
- Reloading while picking an element left the picker running, which silently
	blocked every click on the page.
- The panel could end up off-screen after resizing the window, and could jump
	position between tabs. It now stays inside the window and remembers its
	place per tab.
- The panel could vanish on sites that re-render the whole page, or be removed
	by a broad `Remove element` rule. It is now drawn above all page content and
	is no longer affected by page styles or rules.
- Typing in the panel no longer triggers the site's keyboard shortcuts.
- Editing an `Insert HTML` or `Inject CSS` rule now updates the page right
	away, and deleting one removes its content without a reload.
- Editing a rule's selector no longer leaves a duplicate copy behind.
- Clicking the toolbar icon after an extension update now works without
	reloading the page.

### Changed

- The toolbar icon toggles the panel open and closed.
- `Clear all` asks for a second click.
- The rules list fades rules that match nothing on the current page.
- The element editor has a `Select parent` button.
- Element picking ignores auto-generated class names, so rules survive site
	redeploys more often.
- The toolbar icon shows a red `!` on pages the browser does not let
	extensions change.
- Removed the unused `tabs` and `activeTab` permissions.
- Panel position is no longer stored in extension storage.

## 1.0.0 - 2026-04-26

Initial release of Sticky Inspect.

- Added persistent per-site inspection rules.
- Added an element picker for selecting page elements visually.
- Added manual rule creation with CSS selectors or pasted HTML.
- Added actions for replacing text, setting form values, replacing HTML,
	inserting HTML, injecting CSS, setting attributes, and removing elements.
- Added a rules manager for editing, deleting, clearing, and reapplying saved
	rules.
- Added theme selection and draggable popup.
