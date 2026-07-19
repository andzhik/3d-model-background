# Yoga Lemur Background

A Vite, React, and TypeScript foundation for a progressively enhanced interactive hero inspired by the supplied low-poly yoga lemur artwork. Prompt 01 provides the semantic, full-viewport poster experience; later steps will add the decorative Three.js scene without replacing the HTML content.

## Setup

Requires a current Node.js LTS release and npm. Rebuilding 3D assets also requires Blender 4.3.1 or a compatible release.

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
- `npm run assets:build` resolves Blender, generates every manifest asset headlessly, and validates the resulting GLBs.
- `npm run assets:build:source` also saves optional inspectable `.blend` output under `blender/generated/`.
- `npm run assets:validate` validates existing GLBs against `blender/assets-manifest.json` without launching Blender.
- `npm run assets:build -- --asset <id>` builds only one manifest asset and verifies that all unselected GLB outputs remain byte-for-byte unchanged. Repeat `--asset` to select more than one asset.

The isolated full-3D staging character is rebuilt with `npm run assets:build:lemur-full-3d` (equivalent to `npm run assets:build -- --asset lemur-full-3d`). It writes `public/models/lemur-full-3d.glb` and its versioned review packet without rebuilding or replacing `public/models/lemur.glb`. Validate it independently with `npm run assets:validate -- lemur-full-3d`.

To inspect the staging GLB interactively, start the development server and open
`http://localhost:5173/?review=lemur-full-3d`. The query-gated reviewer provides
orbit/zoom controls, canonical directions, wireframe inspection, model counts,
the reference image, and animation playback when clips exist. It does not change
the production page or replace `public/models/lemur.glb`.

## Blender asset pipeline

Set `BLENDER_PATH` to the full Blender executable path when Blender is not available on `PATH`. PowerShell example:

```powershell
$env:BLENDER_PATH = 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe'
npm run assets:build
```

The resolver checks `BLENDER_PATH` first, then detected Blender 4.3 install locations, then `PATH`. On this development machine Blender 4.3.1 was detected at `D:\Program Files\Blender Foundation\Blender 4.3\blender.exe`.

Version-controlled generators live in `blender/scripts/`, rebuildable inspection files in `blender/generated/`, runtime exports in `public/models/`, and expected asset names in `blender/assets-manifest.json`. Python generators are the source of truth; do not edit generated `.blend` or GLB files manually.

The supplied source artwork remains at `images/yoge-lemur.png` and is bundled directly by Vite as the initial hero poster.
