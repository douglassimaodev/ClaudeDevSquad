---
name: angular-stack
description: Frontend stack reference for the dev-squad frontend agents - Angular (latest stable) with TypeScript strict, standalone components, signals, SCSS, best practices, zero memory leaks (every observable/listener/timer torn down) and component reusability. Load before planning, implementing, reviewing or testing frontend work. ProjectInfo/ overrides anything here.
---

# Frontend stack: Angular (latest stable)

Defaults derived from a reference project (TradesApp: Angular 22, signals, standalone, SCSS, Syncfusion, Vitest, Playwright). **If `ProjectInfo/conventions-frontend.md` or `architecture.md` says otherwise, the project wins.** Read the real versions from `package.json` / `angular.json` first. A new project uses the latest stable Angular major; an existing project keeps its major unless a task says to upgrade. Use the APIs of the installed version, not older idioms from memory; when unsure, check the project's own code or the Angular docs for that version.

## Stack
- **Angular latest stable**, **TypeScript strict** (`strict`, `noImplicitOverride`, strict templates), **SCSS**.
- **Standalone components only** (no NgModules unless the project still has them). Built-in control flow (`@if`, `@for` with `track`, `@switch`, `@defer`), not `*ngIf`/`*ngFor`.
- **Signals first:** `signal`, `computed`, `effect` (sparingly), `input()`, `output()`, `model()`, `viewChild()`, `inject()`; `linkedSignal`/`resource`-style APIs where the installed version provides them.
- `ChangeDetectionStrategy.OnPush` on every component (unless the project's default is zoneless/signals-only, in which case follow it).
- UI library per project (e.g. Syncfusion): use its Angular components and theme tokens; don't mix a second UI library.
- Tests per project (reference: Vitest via `ng test`; Playwright for e2e).

## Memory leaks: the non-negotiable rule
**Every subscription, listener, timer and resource must be released when the owner is destroyed. A reviewer or QA finding an unreleased one is a blocking finding.**

Preferred order:
1. **Don't subscribe.** Bind with the `async` pipe in templates, or convert to a signal with `toSignal(obs$)` (auto-unsubscribes; provide `initialValue`). Use `toObservable(signal)` for the reverse.
2. **HTTP calls** complete on their own, but still cancel on teardown when the result targets a destroyed view: pipe through `takeUntilDestroyed(this.destroyRef)`.
3. **Manual `subscribe`** (event streams, `valueChanges`, route params, `fromEvent`, `interval`, websockets) must end the pipe with `takeUntilDestroyed()` (the last operator, right before `subscribe`). Inside the constructor/field initializer `takeUntilDestroyed()` needs no argument; anywhere else pass `inject(DestroyRef)` captured as a field.
4. **Never leave a bare `.subscribe()` on a long-lived or infinite observable.** No `Subscription` fields without an `ngOnDestroy`/`DestroyRef.onDestroy` that unsubscribes. No `takeUntil(subject)` boilerplate when `takeUntilDestroyed` works.
5. **Other resources:** `addEventListener` / `renderer.listen` (call the returned unlisten, or use `host` bindings/template events), `setTimeout`/`setInterval`/`requestAnimationFrame` (clear them via `DestroyRef.onDestroy`), `IntersectionObserver`/`ResizeObserver`/`MutationObserver` (`disconnect()`), third-party widgets and charts (call their `destroy()`), `effect()` with cleanup (`onCleanup`), object URLs (`URL.revokeObjectURL`), `Renderer2` listeners, `fromEvent(window|document, ...)`.
6. **Services:** root services that hold subscriptions or `Subject`s must clean up (`DestroyRef` / `ngOnDestroy`); `BehaviorSubject`s exposed publicly via `.asObservable()`, completed when the service is destroyed if it is not root-singleton. Prefer signals for state.
7. **Components must not leak through closures or statics:** no component instances stored in services, no module-level arrays of callbacks, no unbounded caches.
8. **Guards/resolvers/interceptors** return observables that complete; never leave inner subscriptions open.

Review heuristic: grep the diff for `.subscribe(`, `Subscription`, `Subject`, `interval`, `timer`, `fromEvent`, `addEventListener`, `setInterval`, `setTimeout`, `new .*Observer`, `.valueChanges`, `.events`, `.queryParams`, `.paramMap`, and prove each is torn down.

## RxJS rules
- Flatten with `switchMap` (latest wins), `exhaustMap` (ignore while busy, e.g. submit), `concatMap` (ordered), `mergeMap` only with a stated reason. Never nest subscribes.
- Always handle errors (`catchError` returning a safe value or surfacing an error state); an unhandled error kills the stream.
- Debounce/`distinctUntilChanged` user-typed searches. Avoid `shareReplay` without `{ bufferSize: 1, refCount: true }`.
- Types on everything; no `any`. Use `unknown` and narrow.

## Reusability
- Before creating a component, search `shared/` and the feature for an existing one; extend it via inputs/outputs/content projection (`ng-content`, `ng-template` outlets, `contentChild`) instead of copying.
- **Extract to `shared/`** (or the project's equivalent) when the same UI or logic is needed by a second feature: presentational ("dumb") components with `input()`/`output()` and no service calls; containers/pages own data fetching.
- Keep components small and single-purpose; move logic out of the component into services, pure functions or utilities; move repeated template logic into pipes or directives.
- Shared components must be generic: no feature-specific models, no hard-coded copy (inputs or i18n), styling via the project's design tokens and CSS variables, accessible by default (labels, roles, keyboard, focus).
- Don't over-abstract: a component used once stays in its feature. Extract on the second real use, not speculatively. Don't add a shared component without a task saying so or a senior's approval when it changes the shared API.
- Typed API models live in the feature's model files; a single API service layer wraps `HttpClient` (base URL, errors); components never call `HttpClient` directly.

## Other best practices
- **Folders:** `core/` (singletons: auth, interceptors, layout, config, base services), `shared/` (reusable UI), `features/<area>/...` (lazy-loaded routes by audience/role, pages + feature services + models).
- **Routing:** lazy-load feature routes (`loadComponent`/`loadChildren`), functional guards and resolvers, role guards per area; UI hiding is not security.
- **Forms:** typed reactive forms (or signal forms if the installed version and project use them), validators reused from a shared validators file, show validation messages on touched/submit, disable submit while busy.
- **State:** signals in components and feature services; no global store unless the project has one.
- **Performance:** `track` in every `@for`, `@defer` for heavy below-the-fold UI, `NgOptimizedImage`, avoid function calls in templates (use `computed` or pipes), no heavy work in `effect`.
- **HTTP:** functional interceptors for auth/loading/errors; never put tokens in URLs; handle 401/403/422/5xx distinctly.
- **Templates:** no `innerHTML` with untrusted data (never bypass sanitization without a security note), accessible markup (labels, `aria-*`, focus management, contrast), responsive layout mobile-first.
- **Style:** SCSS with the project's tokens; component-scoped styles; no `::ng-deep`/`!important` unless the third-party library leaves no alternative, and then isolated and commented.
- **Config:** environment files, no secrets or API keys in the bundle.
- **Naming:** follow the project's file/class naming (e.g. `job-detail.ts` / `JobDetailPage`); one component per file.

## Testing rules
- Test behaviour, not implementation: rendered output, emitted outputs, service calls, guard decisions, form validation, error/empty/loading states.
- **Leak tests:** for components with subscriptions/timers/listeners, destroy the fixture and assert the stream no longer emits/handlers are removed (e.g. a spied `Subject.observed` is false, timers cleared with fake timers).
- Mock services with the project's tooling; no real HTTP. Fake timers instead of real waits.
- Cover each acceptance criterion plus its negative case (invalid input, API error, empty data, unauthorized role). No placeholder tests.
- Commands come from `ProjectInfo` (reference: `npm run build`, `npm run lint`, `npm test`, `npx playwright test`).

## Review / QA checklist
- Every observable/subscription/listener/timer/observer torn down (see grep list above), with `takeUntilDestroyed`, `async`, or `toSignal`.
- Standalone + OnPush + signals; `@for` has `track`; no `any`; strict templates compile.
- Existing shared component reused or properly extracted; no duplicated markup/logic.
- All screen states (loading, empty, error, success); validation messages; responsive; keyboard and focus; labels.
- API calls match the backend `Contract` exactly; errors handled per status.
- Route guards and roles correct; no secrets; no unsanitized HTML.
- Build, lint and tests green; no new console errors/warnings.
