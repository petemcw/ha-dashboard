# Task 001: Card Shell, Compact Buttons, and the Column Grid

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Turn every Home section into a boxed card with an icon label and a status-chip slot, shrink buttons to the mock-up's compact size while keeping 44 px touch targets, and replace the Home grid with the approved layout: three equal columns from 1024 px once the third column has a card, two from 740 px (with the third column spanning below), one below 740 px. This is the pre-factoring every other reskin task and every new card builds on.

## Context

- Related files: `src/features/home/SectionCard.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/suggestions/SuggestionsStrip.tsx`, `src/features/home/crypto/CryptoRow.tsx`, `src/features/home/favorites/FavoritesSection.tsx`, `src/features/home/attention/AttentionSection.tsx`, `src/index.css` (`.home__grid`, `.home__col`, `.card*`, base `button` rules), `e2e/home.spec.ts` ("home screen layout"), `e2e/smoke.spec.ts`, `package.json`. The Suggestions rename also touches `e2e/suggestions.spec.ts` (:20), `e2e/scene-controls.spec.ts` (:23, :65), `e2e/home.spec.ts` (:151, :155, :169), `e2e/smoke.spec.ts` (:41), and `src/features/home/suggestions/SuggestionsStrip.test.tsx` (:35, :52), which all look up the region named "Suggestions". Update them here.
- Patterns to follow: the approved mock-up, `.farseer/plans/home-redesign/mockup.html` (static, placeholder data; open it in a browser and use its Phone / Tablet / Wall size and theme switches). Its media transport buttons and the green "sent" check on a confirmed action are not part of this plan. Cards have a 1 px border, an 18 px radius, 16 px padding (18 px at the bottom), and a 16 px gap between header and content. The header holds a small-caps label (0.7 rem, letter-spaced) with a 14 px icon and a right-aligned slot for a chip or link. Needs attention keeps a slab-face title instead of the small-caps label and a stronger border. Tokens stay as they are in `src/app/theme/tokens.css`.
- Add `lucide-react` as a dependency. Icons are `aria-hidden`.
- `SectionCard` keeps `<section aria-labelledby>` so regions stay named by their title. Suggestions moves onto `SectionCard` with the title "Suggested". Region names elsewhere stay the same: "Needs attention", "Favorites", "Crypto".
- Columns: col 1 holds attention, suggestions and crypto; col 2 holds favorites (Today joins it in 010); col 3 is empty for now (Systems and Media join it in 011 and 013).
  - Below 740 px, columns use `display: contents` and cards take an explicit order: attention (or the snoozed strip from 006, which uses the same slot), suggestions, favorites, today, systems, media, crypto. Define the order classes for all seven slots here, including the cards that don't exist yet, so 006, 010, 011, and 013 don't edit the grid CSS again.
  - 740–1023 px (two columns): col 1 on the left, col 2 on the right, and col 3 below both, spanning the full width as its own two-column grid (Systems and Media side by side), as in the mock-up's tablet view (`.col--3 { grid-column: 1 / -1; grid-template-columns: 1fr 1fr }`).
  - From 1024 px: three equal columns **only when col 3 has a card** (e.g. `.home__grid:has(> .home__col--3:not(:empty))`). With col 3 empty (today, and permanently in a house without `systems` or `media` sections), keep two columns, so there's never an empty third track. An empty col 3 never takes space at any width.
  - The three-equal-columns layout can't be tested until a card lands in col 3, so 011 owns that requirement.
- Compact buttons: the visual height is 34 px. A positioned `::after` with a negative inset (about −5 px) extends the hit area to at least 44×44 px. Icon-only buttons are 34 px circles.
  - Scope (decided with the owner): compact sizing applies everywhere, through the global `button` / `.button-link` rule, including the settings sheet, kiosk token form, favorites editor, and undo notice. Check each of those screens in a screenshot after the change, and update any spec that measured a 44 px visual height.
  - The overlay is clipped by any ancestor with `overflow` other than `visible`, so don't put compact buttons inside one. When two compact buttons sit side by side, the later one's overlay covers the earlier one's edge if they're less than about 10 px apart. Keep enough gap, or limit the overlay to the outer side, so a tap on an action's visible edge never lands on the snooze button next to it.
- The phone order spec compares bounding boxes (top to bottom), not DOM order: with `display: contents` and `order`, the DOM order (crypto in col 1) differs from what a phone shows.
- Drop the People assertions from the layout spec here; 002 moves People into the header and asserts its new position. Update the reading-order locator to `main section` and the expected order to the current cards.

## Requirements (Test Descriptions)

- [x] `it renders a home section as a card region named by its title`
- [x] `it shows the section's icon label and its header chip in the card header`
- [x] `it stacks the cards in one column on a phone in the order attention, suggested, favorites, crypto`
- [x] `it shows two top-aligned columns on a tablet in portrait with favorites on the right`
- [x] `it keeps two columns on a 1180 by 820 wall tablet while the third column has no cards`
- [x] `it never scrolls sideways at phone, tablet, wall-tablet, or desktop sizes`
- [x] `it hits a compact button when tapping just outside its visible edge`
- [x] `it sends a tap on the visible edge of an action button to that button, not to the snooze button beside it`
- [x] `it keeps full-size buttons in the settings sheet`

## Acceptance Criteria

- All requirements have passing tests (layout and hit-area requirements are Playwright specs on the existing phone and tablet projects, plus explicit viewport sizes)
- Code follows code standards
- No decrease in test coverage
- Screenshots in `e2e/screenshots/` checked against the mock-up

## Implementation Notes

- SectionCard now takes `icon` (lucide, aria-hidden) and `chip`; Suggestions uses it, titled "Suggested". Attention keeps a slab title via `.card.attention`.
- Grid: `.home__col--1/2/3`; order classes `home__order--{attention,suggested,favorites,today,systems,media,crypto}` live on wrappers in HomeScreen (all seven defined in CSS). Three columns only via `:has(> .home__col--3:not(:empty))` from 1024 px (011 owns that test).
- Compact buttons: 34 px visual, `::after` inset -6px (the overlay is sized from the padding box inside the 1 px border, so -5 only reached 4 px past the edge). Action/snooze/suggestion rows use a 12 px gap.
- Settings sheet scrolls (overflow-y: auto), which would clip the overlay, so `.sheet` buttons stay 44 px full-size with no overlay (this resolves the "everywhere" scope vs the "full-size in settings sheet" requirement). Favorite tiles also have no overlay.
- Specs: new e2e/compact-buttons.spec.ts; layout specs in home.spec.ts rewritten (People assertions dropped); crypto spec sparkline locator scoped to `.crypto-spark`. DOM order is attention, suggested, crypto, favorites.
- Node 24 needed (nvm use); default shell node 20 breaks vitest.
