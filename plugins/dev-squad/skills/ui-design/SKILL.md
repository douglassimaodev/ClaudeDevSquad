---
name: ui-design
description: How to design and build polished, distinctive Angular UIs, especially admin panels and dashboards - a written design direction (ProjectInfo/design.md), design tokens, admin-template patterns (shell, KPI cards, data grids, filters, drawers, forms, states), Syncfusion theming, accessibility, and the mandatory screenshot-and-critique loop. Load before designing, building or reviewing any user-facing screen.
---

# ui-design

Most generated UIs look like a generic admin template because nothing told them what *this* product should feel like, and nobody looked at the result. This skill fixes both: a written design direction per project, and a look-and-critique loop that is part of "done".

## 1. Design direction comes first
- Read `ProjectInfo/design.md`. **No screen is built until it exists and the user has approved it** (`Status: approved` at the top). If it is missing or a draft, the `ui-designer` agent writes it (design-direction mode) and the orchestrator shows the user a summary and waits.
- It defines: product personality in 3 adjectives, audiences and density (public site = airy, admin = compact), color tokens (brand, neutral scale, semantic success/warning/danger/info), typography scale, spacing scale, radius, elevation, motion, iconography, light/dark support, and the screen inventory.
- Design the public site and the admin as **one brand with two densities**, never two unrelated styles.

## 2. Tokens, not values
- All color, spacing, radius, shadow, font and z-index values are CSS custom properties defined once (`styles/tokens.scss` or the project's equivalent) and consumed everywhere. **No raw hex, px magic numbers or ad-hoc fonts in component styles.**
- Dark mode = a second token set, not duplicated styles. Check contrast on both (text 4.5:1, large text and UI 3:1).
- The UI library theme (Syncfusion) is mapped onto the same tokens so third-party components match the brand.

## 3. Admin-template patterns (what "very nice" looks like)
- **Shell:** collapsible sidebar (icons + labels, active state, grouped sections), slim top bar (breadcrumbs, global search, notifications, user menu), responsive: sidebar becomes a drawer on mobile. Content has a max width and consistent page header (title, description, primary action).
- **Dashboard:** KPI cards (value, delta, sparkline, period), a few purposeful charts, a recent-activity list. Hierarchy over density: one clear focal point, aligned grid, no chart junk. Each number has a label, unit and period.
- **Data tables / grids:** sticky header, sortable columns, server-side paging, filter bar with applied-filter chips, column visibility, row actions menu, bulk actions with selection count, status badges (color + text, never color alone), right-aligned numerics, truncation with tooltip, empty and loading (skeleton) states, responsive fallback (stacked cards or horizontal scroll with pinned first column).
- **Detail views:** master-detail drawer or page with tabs; summary header with status and key actions; activity/audit timeline.
- **Forms:** sectioned layout, labels above inputs, inline validation after touch/submit, helper text, required markers, sticky action bar, disabled-while-busy submit with spinner, unsaved-changes guard, confirmation dialogs for destructive actions (with the consequence stated).
- **Feedback:** toasts for transient success, inline banners for persistent errors, skeletons not spinners for page loads, optimistic UI only where safe.
- **Every screen has all states:** loading, empty (with a helpful action), error (with retry), partial, success, and permission-denied.
- Consistent iconography, one icon set. Microcopy is specific and human ("No partners yet - invite the first one"), not "No data".

## 4. Craft rules
- Spacing from the scale only; align to a 4/8px grid; generous whitespace; consistent card padding and radius.
- Type scale of at most 6 sizes; 1-2 font families; line length 60-80 characters for prose; tabular numerals for figures.
- Color: neutral-dominant with one brand accent; semantic colors only for meaning; never rely on color alone.
- Motion: 150-250 ms, ease-out, purposeful (state change, entry); respect `prefers-reduced-motion`.
- Responsive mobile-first: verify at 360, 768, 1280 and 1920 widths. Touch targets at least 44 px on mobile.
- Accessibility: semantic HTML, labelled controls, visible focus ring, keyboard operable (menus, dialogs with focus trap and Esc), `aria-live` for toasts, alt text, correct heading order.
- Performance: lazy-load heavy components (charts, grids) with `@defer`, `NgOptimizedImage`, no layout shift.

## 5. Syncfusion specifics (default library; follow the project's if different)
- Use the Angular Syncfusion packages (`@syncfusion/ej2-angular-*`) and import only the modules a component needs.
- Load one theme (Tailwind 3 / Material 3 / Fluent 2 / Bootstrap 5), then **override through CSS variables / a thin SCSS layer** so Grid, Dropdowns, Calendars, Dialogs and Buttons match the tokens. Avoid `::ng-deep` except in that one themed layer, commented.
- Wrap library components in small project components (e.g. `app-data-grid`, `app-confirm-dialog`) with the project's defaults (paging, empty template, loading overlay, status-badge template) so screens stay consistent and reuse is real.
- Destroy library widgets with their component (Angular wrappers do; manual `new Grid()` must call `destroy()`).
- Do not mix a second component library.

## 6. The look-and-critique loop (mandatory for every UI task)
1. Build the screen with realistic data (not "Lorem"/"test"); cover each state.
2. Run the app and take screenshots with Playwright at 360 and 1280 widths (plus dark mode if supported). Save under `ProjectInfo/screenshots/<task-id>/`.
3. **Look at the images** (Read them) and critique against this list: hierarchy and focal point, alignment and spacing consistency, token use, contrast, truncation/overflow, empty/loading/error states, density appropriate to the surface, does it look like the design direction rather than a stock template.
4. Fix, re-shoot, repeat until the critique finds nothing material (at most 3 rounds).
5. List the screenshot paths in the handoff. The senior reviews them; QA verifies fresh screenshots.

## 7. Review/QA checklist
- Matches approved `design.md`; only tokens and shared components used; no raw colors or one-off styles.
- All states present; responsive at the listed widths; dark mode if supported.
- Keyboard and focus work; contrast passes; labels and aria present.
- Tables/forms follow the patterns above; destructive actions confirmed.
- No visual regressions elsewhere (shared component changes re-checked on pages that use them).
- Screenshots exist, were actually viewed, and match the criteria.
