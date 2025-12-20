## Repo snapshot

- Name: custom-hat-service (Next.js app using app-router)
- Language: TypeScript + React 19 (Next 16). Styling: Tailwind CSS. State: Zustand (v5) with persist middleware.
- Important folders: `app/` (Next app router), `components/` (UI + studio/customizer), `lib/` (stores, i18n), `public/assets/hats` (hat images).

## Quick dev commands

- Start dev server: `npm run dev` (runs `next dev`).
- Build: `npm run build` → `next build` and start: `npm run start`.
- Linting: `npm run lint` (runs `eslint`).

## Big picture / architecture notes for an AI coder

- This is a single Next.js app (app router). Most UI lives under `src/app` and `src/components`.
- Client vs server: many files are client components (look for `"use client"` at top). The app uses a small provider stack in `src/app/layout.tsx`:
  - `LanguageProvider` (`src/lib/i18n/language-context.tsx`) for translations
  - `StudioConfigProvider` (`src/lib/store/studio-context.tsx`) for product configuration and safe zones

- Design state: `src/lib/store/design-store.ts` (Zustand + persist). Key shape:
  - layersByColor: Record<string, DesignLayer[]> — designs are stored per base hat color
  - currentView: 'front'|'back'|'left'|'right'|'top' (HatView defined in `studio-context`)
  - persistent storage key: `runhouse-design-storage` (localStorage)

- Studio config: `src/lib/store/studio-context.tsx` defines default colors, image urls in `public/assets/hats/*`, safeZones, and persists config under `runhouse_studio_config` in localStorage.

- Canvas and interactions:
  - `src/components/customizer/HatCanvas.tsx` uses `react-rnd` for draggable/resizable logos.
  - `src/components/customizer/HatCustomizer.tsx` is the shell for uploading a logo, selecting base color, and saving.

## Project-specific conventions and gotchas (do not guess — search first)

- Persistent UI state lives in localStorage. Keys to inspect when debugging: `runhouse-design-storage`, `runhouse_studio_config`.
- Colors are canonical ids like `black`, `khaki`, `beige`, `red`. Images referenced from `public/assets/hats/{id}.png` or view-specific files (e.g., `black-front.png`).
- Design layers are stored per color; copying a design between colors is supported via `copyDesignToColor(from,to)`.
- Many modules are client components; adding server-only APIs must respect Next.js app-router distinctions. If you need server code, add `src/app/api/...` handlers.

## Integration points & dependencies to be aware of

- UI primitives: components in `src/components/ui/*` (Radix + custom wrappers). Reuse these for consistent styling.
- Draggable/resizable: `react-rnd` is used in `HatCanvas` — inspect default props there when reproducing interactions.
- State: `zustand` (v5) with `persist`. Use store selectors provided (e.g., `useCurrentViewLayers`, `useSelectedLayer`) rather than direct local state when possible.
- Translations: `src/lib/i18n/language-context.tsx` — follow the provider pattern seen in `layout.tsx`.
- Build/deploy: standard Next.js (Vercel-ready). If you add Prisma-backed APIs (`prisma` is present as a dependency), ensure Prisma schema and server runtime are added under server/API routes.

## Practical examples for common tasks

- To get layers for the current view inside a component:
  - import and call `useCurrentViewLayers()` from `src/lib/store/design-store.ts`.

- To reset the studio config or inspect safe zones:
  - `useStudioConfig()` in `src/lib/store/studio-context.tsx` — `config.safeZones` describes printable areas per view.

- To persist/inspect the current design during debugging:
  - Open DevTools → Application → Local Storage → `runhouse-design-storage` or use `JSON.parse(localStorage.getItem('runhouse-design-storage'))`.

## Where to look for more context (file references)

- App shell and provider wiring: `src/app/layout.tsx`
- Studio defaults and product assets: `src/lib/store/studio-context.tsx`
- Design store & selectors: `src/lib/store/design-store.ts`
- Main customizer UI: `src/components/customizer/HatCustomizer.tsx`
- Canvas implementation with react-rnd: `src/components/customizer/HatCanvas.tsx`
- UI components (buttons, cards, dialogs): `src/components/ui/*`
- Static hat images: `public/assets/hats/*`

## Small checklist for PRs by an AI agent

- Prefer client components only when interaction is required; keep heavy logic in stores or server-only routes.
- Reuse UI primitives from `src/components/ui/*`.
- If changing persisted state shape, migrate stored localStorage keys (`runhouse-design-storage`) or provide a safe default/transform.
- Avoid changing image filenames under `public/assets/hats` without updating `studio-context` views.

---

If anything is unclear or you'd like the file to include more examples (e.g., how to add a new hat color end-to-end), tell me which area and I'll extend the instructions. 
