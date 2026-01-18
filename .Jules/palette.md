## 2024-05-22 - Accessibility of Repetitive Actions
**Learning:** Repetitive buttons with generic text like "Done" or "View" create confusing experiences for screen reader users ("mystery meat navigation").
**Action:** Always scope generic buttons with unique `aria-label`s that include the specific item name (e.g., "Toggle Breakfast completed").
