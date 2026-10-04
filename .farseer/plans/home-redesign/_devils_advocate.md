# Devil's Advocate Review: home-redesign

## Critical (Must fix before building)

### C1. The forecast fetch fails every `@live` test once the real home.json has a `weather` section (008, 010)

`e2e/fixtures.ts` `liveTest` blocks every message matching `/^(call_service|frontend\/set_.*)$/` and fails the test at teardown if any blocked message was a `call_service` ("@live tests must be read-only"). `weather.get_forecasts` goes out as a `call_service` message. Once the owner adds `weather` to `public/home.json`, every `@live` spec that loads Home fails, and the Today card never gets a forecast in live runs because the guard answers `blocked_by_test`.

Fix (applied to 008): let through only `call_service` messages with `domain: 'weather'`, `service: 'get_forecasts'`, and `return_response: true`. Everything else stays blocked. Add a test that the guard forwards that one request and still blocks other `call_service` messages, so `smoke.spec.ts`'s "never forwards call_service" check stays true for writes. This guard sits on a business-critical path, so keep the allowlist that narrow.

### C2. Mocked specs that assert "no service calls" break as soon as the Today card exists (008, 009, 010)

009 adds `weather` to `testHomeConfig.ts`, which every mocked Playwright spec serves as `/home.json`. Once 010 renders the Today card, every mocked spec sends `weather.get_forecasts`. These assertions then fail:

- `attention.spec.ts:37`, `favorites.spec.ts:35`, `favorites-editor.spec.ts:42`, `snooze.spec.ts:47` (expect zero `call_service`)
- `attention-controls.spec.ts:26`, `controls.spec.ts:42/98`, `scene-controls.spec.ts:27/45` (expect an exact list of `call_service` messages)

Fix (applied to 008): add a `serviceCalls()` helper on `HaMock` that returns `call_service` messages without `return_response: true`, and switch those call sites to it. The read-only fetch then can't hide a real HA action or fake one.

### C3. The fake HA's response function can't tell hourly from daily (008, 014)

008 types `serviceResponses` as `Record<string, (call) => unknown>`, and the existing `ServiceCall` is `{ domain, service, entityIds }`. It has no `service_data`, so the `weather.get_forecasts` handler can't see `type: 'hourly' | 'daily'`. 010 makes two `useForecast` calls, and 014's demo has to answer both.

Fix (applied to 008): pass `serviceData` (the message's `service_data`, or `{}`) to the response function.

### C4. 001 asks for three equal columns while column 3 is empty and "must not take space" (001, 011, 013)

At 001, column 3 has no cards (Systems and Media arrive in 011 and 013), so the requirement "three equal top-aligned columns on a 1180 by 820 wall tablet" can't be tested. "Must not take space" also contradicts `grid-template-columns: repeat(3, …)`: a hidden third column still leaves an empty third track, so the page fills only two-thirds of the width. The same thing happens permanently in a house with no `systems` or `media` section.

Fix (applied to 001 and 011): from 1024 px, use three columns only when column 3 has a card (for example, `.home__grid:has(> .home__col--3:not(:empty))`), and two otherwise. 001 tests the two-column fallback. 011, the first task that puts a card in column 3, tests the three-equal-columns layout.

## Important (Should fix before building)

### I1. The two-column layout doesn't say where column 3 goes (001)

The mock-up (tablet portrait) puts column 3 below both columns, spanning the full width as its own two-column grid: `.col--3 { grid-column: 1 / -1; grid-template-columns: 1fr 1fr }`. That puts Systems and Media side by side under the two columns. 001 only says "favorites on the right". Without this, 011 and 013 will each guess.

Fix (applied to 001): spell out the 740–1023 px placement for column 3.

### I2. A theme context in `src/app/theme/` can't be read from the header (003)

The header is rendered by `HomeScreen` (`src/features/home/`). Features don't import `src/app/` (one-way `app → features → domains → infrastructure`), so a `ThemePreferenceProvider` in `src/app/theme/` can't be consumed from `HeaderBar`.

Fix (applied to 002 and 003): 002 gives `HeaderBar` a `tools` slot (a `ReactNode` rendered before Settings) that `HomeScreen` passes through. 003 builds `ThemeToggle` in `src/app/theme/`, and `AppShell` (which already holds `useThemePreference`) passes `<ThemeToggle preference={theme} onChange={setTheme} />` into `HomeScreen`. One hook instance, no layering break.

### I3. jsdom has no `matchMedia`, so the toggle crashes every AppShell test (003)

`src/test/setup.ts` doesn't stub `window.matchMedia`, and the only existing use (`SettingsSheet.tsx`) guards it with `?.`. A `ThemeToggle` that calls `matchMedia(...)` unguarded throws inside `AppShell.test.tsx`, `App.*.test.tsx`, and `SettingsSheet.test.tsx`.

Fix (applied to 003): guard the call (no `matchMedia` means light), and test the "system" case with `page.emulateMedia({ colorScheme })` in Playwright, or a stub local to the test.

### I4. 004 renders icons in `ConfirmButton`, but 005 "owns the confirm visuals" (004, 005)

The garage toggle and filter "Mark replaced" are `ConfirmButton`s. 004's requirement "shows an item's action as an icon button that keeps the action's name" can't pass without changing `ConfirmButton`, which today renders its name as text. 004 is told to stay out of 005's area.

Fix (applied to 004 and 005): 004 adds an `icon` prop to `ConfirmButton` and renders the icon with `aria-label` (unarmed: label; pending: pendingLabel; armed: today's text, unchanged). 005 replaces only the armed visuals and the armed name.

### I5. Lucide has no garage icon (004)

The current `lucide-react` (1.51) has no `garage` icon. A worker told to "pick a close-garage icon" will either invent a name that won't compile or draw a custom SVG.

Fix (applied to 004): badge `garage` maps to `Warehouse`, `door` to `DoorOpen`. The close-garage action icon is `ArrowDownToLine` (or `DoorClosed`). Missing maps to `CircleQuestionMark` (`CircleHelp` was renamed). The mapping stays in one tested pure function.

### I6. Importing `icons` or `DynamicIcon` from lucide pulls in the whole set (004, 007, 010, all icon users)

004, 007, and 010 each map a name to an icon. The easy way (`import { icons } from 'lucide-react'`, then `icons[name]`) bundles all ~1,800 icons into the main chunk.

Fix (applied to `_plan.md` Architecture Notes and 004): mapping functions import each icon by name and return the component from a `switch` or object literal. Never `icons`, `DynamicIcon`, or a namespace import.

### I7. The inline action error has no place in a one-row layout (004)

`AttentionAction` renders `ActionError` (a `role="status"` span) as a sibling of the button inside `.attention-item__actions`. When it fills with "Didn't work, tap to retry", the right-hand column widens and squeezes the title. That breaks "actions never wrap under the text".

Fix (applied to 004): the error shows on its own line under the row's text, spanning the row, and the live region stays rendered (empty) as now.

### I8. The AP up-state and the uptime label are tied to `status` (009, 011, 014)

009 counts access points as online when their state equals `status.upState`, and 011 labels the uptime tile with `status.label`. The plan's own reason for a configurable chip is that the owner may point `status` at a Ping or WAN sensor later. When that happens, `upState` becomes `on`, every AP (`connected`) reads offline, and the gateway uptime tile reads "Internet". So the "no code change" promise fails.

Fix (applied to 009, 011, 014): `uptime?: { entity_id: string; label: string }` and `accessPoints?: { entity_ids: string[]; upState: string }`, both independent of `status`.

### I9. `strings()` drops the section path from its error (009)

`strings()` in `homeConfig.ts` fails with `` `${key}[${i}]` `` and leaves out `path`. A bad `systems.accessPoints.entity_ids[1]` would report "entity_ids[1] must be a string". User story 54 asks for a clear, path-specific message.

Fix (applied to 009): prefix the path, and add a test for a nested string array.

### I10. Renaming Suggestions to "Suggested" breaks specs 001 doesn't list (001)

001 renames the region, but "Suggestions" is a region name in `e2e/suggestions.spec.ts:20`, `e2e/scene-controls.spec.ts:23/65`, `e2e/home.spec.ts:151/155/169`, `e2e/smoke.spec.ts:41`, and `SuggestionsStrip.test.tsx:35/52`. The task text says "region names elsewhere stay the same", which reads as if nothing else changes.

Fix (applied to 001): list those files and update them in the same task.

### I11. Each new card breaks the reading-order and phone-order assertions (010, 011, 013)

`e2e/home.spec.ts` (`SECTIONS`) and `e2e/smoke.spec.ts` (`order`) list every region in DOM order, and 001's phone-order test lists the cards. Each of 010, 011, and 013 adds a region that the shared test config turns on, so each one breaks those lists.

Fix (applied to 010, 011, 013): each card task extends both lists and the phone-order spec with its own card. Workers running in parallel should expect a small merge on those lines.

### I12. A header clock that ticks every 30 s can show the minute late by up to 29 s (002)

`useNow` ticks every 30 s from whenever the first subscriber arrived, not on the minute. A wall clock that turns over late is visible next to any phone. 002's requirement "updates when the minute changes" passes with fake timers either way.

Fix (applied to 002): align the shared clock's ticks to the wall clock (the next :00 or :30), and test that the header shows the new minute within a second of it changing. The attention duration rules lose nothing.

### I13. Artwork that fails once stays broken for every later track (013)

"On error, fall back to the placeholder" is usually done with a `failed` flag. If the flag isn't reset when `artworkUrl` changes, one bad image hides artwork for the rest of a kiosk's life. This is likely with `entity_picture` URLs that rotate their cache token, or an external `http://` URL that is blocked as mixed content.

Fix (applied to 013): key the image (or the error state) by URL, and test that a new URL tries again. Also handle `useHaUrl()` being undefined before the runtime config loads (no artwork yet, no crash).

### I14. 004 and 009 edit the same config files in parallel (004, 009)

Both change `src/config/homeConfig.ts`, `homeConfig.test.ts`, `home.example.json`, and `testHomeConfig.ts`. 004 adds the left-on `icon`, 009 adds three sections. Neither depends on the other.

Fix (applied to 004 and `_plan.md`): 004 depends on 009. 009 is small and has no dependencies, so this costs almost nothing.

### I15. The snoozes error and the "Snoozes are unavailable" note vanish with the card (006)

`AttentionSection` renders `snoozing.error` (`role="alert"`) and "Snoozes are unavailable." inside the card. With the card hidden, a failed Unsnooze from the strip shows no error at all.

Fix (applied to 006): the strip shows `snoozing.error` too, with a test.

### I16. The mock-up the tasks point to isn't reachable by workers (all)

001 points at a `claude.ai` artifact "linked in `_plan.md`", but `_plan.md` doesn't link it, and the local copy lived in a session scratchpad.

Fix (applied): copied it to `.farseer/plans/home-redesign/mockup.html` (placeholder data only) and pointed `_plan.md` and 001 at it. The mock-up's media transport buttons and its green "sent" check are not part of the plan (see I17).

### I17. The mock-up's green "sent" check is an optimistic state (005)

The mock-up flips a confirmed action to a green check for 1.4 s. Copying that would show success before HA reports the change, against principle 10 (pending lives in `useAction`; the entity changes when HA says so).

Fix (applied to 005): no "sent" state. While pending, the button shows its pending state (dimmed icon or spinner, `aria-disabled`, pendingLabel as its name). The row goes away when HA reports the sensor change.

### I18. Compact buttons need a scope (001)

001 says "shrink buttons", and the base `button` rule in `index.css` is global. Shrinking it changes the settings sheet, kiosk token form, favorites editor, and undo notice, none of which the mock-up covers. The `::after` hit area also gets clipped by any `overflow` ancestor (the sheet is `overflow-y: auto`). And when two compact buttons are less than 10 px apart (the mock-up's actions use a 2 px gap), the later button's overlay covers the earlier one's edge.

Fix (applied to 001): compact sizing applies only inside Home cards and the header bar, through a class or descendant selector. Other screens keep today's 44 px buttons. The hit-area test covers an action button next to the snooze button.

## Minor (Nice to address)

- **Header under the connection banner (002).** `.banner` is `position: sticky; top: 0; z-index: 10` outside `.content`. The new header is sticky at `top: 0` inside `.content` (which becomes a stacking context when `data-stale` sets opacity). While disconnected, the banner covers the header, including Settings and the theme toggle. The sign bar has the same problem today. Consider `top: var(--banner-height)` or putting both in one sticky stack.
- **Reading order differs from visual order on phones (001).** On phones, CSS `order` shows Crypto last, but DOM and screen-reader order put it after Suggestions. It's display-only, so focus order isn't affected, but the phone-order spec has to compare bounding boxes, not DOM order.
- **New factories must stay importable from `e2e/` (010, 011, 013).** `weather/factories.ts` and `sun/factories.ts` (and any new media factory helpers) are imported by Playwright through `tsconfig.node.json`. They need explicit `.ts` relative imports and `import type`, like `src/domains/factories.ts`.
- **"am/pm" in 24-hour locales (002).** Build the time with `Intl.DateTimeFormat#formatToParts` and render `dayPeriod` small only when it's there.
- **`sun.sun` attributes (010).** Check `next_setting` on the live 2026.9.4 instance before building on it. If it's gone, `sensor.sun_next_setting` is the fallback.
- **Malformed forecast versus a failed refetch (008).** "Malformed returns `[]`" plus "keep the last good value on failure" means a malformed reply wipes a good forecast. Treat a malformed reply like a failure (keep the last good value).
- **Daily high/low late in the day (010).** Some integrations start the daily forecast with tomorrow after the evening. Pick the entry whose date is today, or leave out high/low.
- **Neutral chip style (011).** The mock-up defines ok, danger, warn, and leaf chips, but no neutral one for "unknown" and "missing". 001's chip slot should include a neutral variant.
- **Backup with no backups yet (011).** The backup sensor reports `unknown` until the first backup. Show "Never" or "Unknown" rather than a blank tile.
- **Ambiguous action names.** Several urgent rows can each have a button named "Turn off". The mock-up uses "Turn off space heater". The plan keeps today's names, which is fine, but the specific names would be better for screen readers.
- **CSS merge conflicts (010, 011, 012, 013).** Workers appending blocks at the end of `index.css` in parallel will conflict on the same lines. A colocated `*.css` per card (imported by the card component) avoids it, if the team is happy with that convention.
- **Column 3 JSX (011, 013).** Both tasks insert into the empty column 3 in `HomeScreen.tsx`. Whichever merges second keeps Systems above Media.
- **Task 010 size.** Two new domains, a card, two forecast hooks, and an e2e spec. It's at the upper limit for one TDD worker. Splitting the weather and sun domains into their own task would let them start before 001 and 008 land.

## Questions for the Team

1. **Subscribe instead of polling for forecasts?** HA's frontend uses the `weather/subscribe_forecast` WebSocket subscription. It pushes a new forecast whenever the integration refreshes, involves no `call_service` (so no guard exception, no fake-HA response plumbing, no 30-minute timer), and the library resubscribes after a reconnect. The plan's scope names `weather.get_forecasts`, so the review keeps it and patches around it (C1–C3). If you'd rather switch, 008 gets simpler, and C1 and C2 mostly go away. Check the message on 2026.9.4 first.
2. **Should keyboard focus leaving an armed confirm also disarm it?** 005 disarms on an outside `pointerdown`. Tabbing away leaves it armed until the 4 s timeout.
3. **Compact buttons outside Home?** The review scopes them to Home cards and the header (I18). Say if you want the settings sheet and dialogs to match.
4. **Two columns on the wall when there's no Systems or Media?** The review makes the wall tablet fall back to two columns when column 3 is empty (C4), rather than leaving a blank third column. Confirm that's the look you want.
