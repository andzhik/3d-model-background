# Yoga Lemur Background

A Vite, React, and TypeScript foundation for a progressively enhanced interactive hero inspired by the supplied low-poly yoga lemur artwork. Prompt 01 provides the semantic, full-viewport poster experience; later steps will add the decorative Three.js scene without replacing the HTML content.

## Setup

Requires a current Node.js LTS release and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Commands

- `npm run dev` starts the development server.
- `npm run build` type-checks and creates the production bundle in `dist/`.
- `npm run typecheck` checks strict TypeScript types.
- `npm run lint` runs ESLint with zero warnings allowed.
- `npm test` runs the Vitest suite once.
- `npm run test:watch` runs Vitest in watch mode.
- `npm run format` formats project files with Prettier.
- `npm run format:check` checks formatting without changing files.

The supplied source artwork remains at `images/yoge-lemur.png` and is bundled directly by Vite as the initial hero poster.
