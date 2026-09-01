# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page marketing/landing page for "植物料理家きみえの瓶詰め" (YuzuMono) — a preserved-lemon jar plus two sauces (whole-grain mustard, tapenade). Originally exported from Figma Make as the "SOL LEMON" page, then redesigned via the Claude Design project "Landing page setup and launch" (id d85e3e15-746a-481b-8807-41b3ada57323). Vite + React 18 + TypeScript + Tailwind CSS v4. No tests or linter are configured.

## Commands

```
npm i            # install (use npm, not pnpm — see below)
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # production build
```

- Use **npm**: `pnpm-workspace.yaml` pins `supportedArchitectures` to Linux only (a leftover from Figma Make's build environment), which breaks native binaries on this Windows machine. npm ignores that file.
- In PowerShell, if `npm` fails with an execution-policy error, run `npm.cmd` instead.
- `react`/`react-dom` are declared only as optional peerDependencies; npm installs them transitively via the hard peer deps of packages like `@mui/material`. Don't "clean up" the package.json peer-dep arrangement — it's the Figma Make convention.

## Architecture

- **`src/app/App.tsx`** is the whole page (~900 lines): all sections (hero with rotating slogans, jar lineup with carousel/split layouts, recipes, process, ingredients, FAQ, buy strip, footer), the combined language+theme context (`UICtx`), and a scroll-reveal helper (`useInView`/`Reveal`). Two themes ("Yuzu Grove" and "Wabi-Sabi") are defined in the `THEMES` map and applied as `--ym-*` CSS custom properties on the root element; styling is Tailwind utilities plus inline `style` objects referencing `var(--ym-*)` — follow that pattern, and never hardcode palette hexes in components. Defaults for the `--ym-*` variables (and the `ym-hover-*` utility classes) live at the bottom of `src/styles/theme.css`.
- **`src/app/i18n.ts`** holds all copy in four languages (`en`, `ja`, `fr`, `zh`) as one typed `translations` object, plus `SLOGANS` (per-language hero slogans) and `PHRASES` (Japanese tasting notes used in every locale). Any user-visible text change must be made in all four locales; the `Translations` interface enforces the shape.
- **`src/app/components/ui/`** is the full shadcn/ui kit scaffolded by Figma Make. Most of it is unused by App.tsx — don't delete it, but don't feel obliged to use it either.
- **Fonts**: Fraunces (display) and Mulish (body), applied via inline `fontFamily` style objects in App.tsx, loaded through `src/styles/fonts.css`.
- **Assets**: local images/video live in `src/imports/`; supplementary photos are hotlinked from Unsplash (the `PHOTOS` map in App.tsx). `vite.config.ts` has a custom resolver mapping `figma:asset/<file>` imports to `src/assets/` and aliases `@` → `src/`.
- **Styles entry**: `src/main.tsx` imports `src/styles/index.css`, which chains `fonts.css` → `tailwind.css` → `theme.css`. `globals.css` and `default_shadcn_theme.css` are not in that chain.
- `vite.config.ts` notes the React and Tailwind plugins are both required by Figma Make even if seemingly unused — do not remove them, and never add `.css`/`.ts`/`.tsx` to `assetsInclude`.

The original design lives at https://www.figma.com/design/czHyq9lxg6e94VAF2zb7Fm/Landing-page-for-lemon-jar.
