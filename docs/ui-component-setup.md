# UI component setup

This project already uses TypeScript (strict mode), Tailwind CSS v4, and a shared UI folder:

- Components: `src/components/ui`, imported through `@/components/ui`.
- Global styles and design tokens: `src/app/globals.css`.
- TypeScript import alias: `@/*` maps to `src/*` in `tsconfig.json`.

Use this existing UI folder instead of creating a second top-level `components/ui` folder. It keeps shared components discoverable and imports consistent with the source layout.

The Ark UI steps component does not require shadcn initialization. `@ark-ui/react` is installed and the landing page imports `StepsWithDescriptions` from `@/components/ui/steps`. The basic four-step example is the default export.

## Optional shadcn CLI setup

There is currently no `components.json`, so the shadcn CLI has not been initialized. To enable adding shadcn components, run from `web`:

```powershell
npx shadcn@latest init
```

Use `src/app/globals.css` for styles and `@/components/ui` for the UI alias. For Tailwind v4, leave the Tailwind configuration-file path empty. Review generated CSS changes against the existing Runvex tokens before keeping them. Tailwind and TypeScript need no further installation.

Official instructions: https://ui.shadcn.com/docs/installation/next and https://ui.shadcn.com/docs/components-json.
