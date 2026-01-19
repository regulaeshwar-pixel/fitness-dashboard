## 2026-01-19 - Context-less Toggle Buttons
**Learning:** Meal tracker buttons only said "Done", which is ambiguous for screen readers and visually static.
**Action:** Always ensure toggle buttons have `aria-label` for context (e.g., "Toggle Breakfast") and use `aria-pressed` or dynamic text ("Undo") to indicate state.
