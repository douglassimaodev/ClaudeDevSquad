# Frontend conventions (Angular)

- **Stack (defaults, see skill `dev-squad:angular-stack`):** Angular latest stable, strict TypeScript, standalone components, signals, OnPush, SCSS; every observable/listener/timer torn down; reuse shared components. Override here if different.
- **Versions:** <exact Angular, TypeScript, UI library, test framework versions>
- **Structure & naming:** <features/ folders, standalone components, routing>
- **State & data access:** <signals/RxJS, API service layer, interceptors>
- **UI rules:** <design tokens, component library, i18n, responsive breakpoints, accessibility>
- **Auth & guards:** <roles and route guards>
- **Tests:** <unit framework, e2e framework, where they live>
- **Commands**
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Unit tests: `npm test`
  - E2E: <command>
  - Run locally: <command + URL>
