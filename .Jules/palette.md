## 2026-01-20 - Ambiguous Toggle State Labels
**Learning:** Buttons labeled simply "Done" that toggle state are confusing for all users, but especially for screen readers. The label "Done" doesn't communicate if the action is to *mark* as done or if it *is* done.
**Action:** Use `aria-pressed` for toggle buttons and ensure the visible text or `aria-label` clearly communicates the *action* (e.g., "Undo") or the *state* with context (e.g., "Mark Breakfast as done").
