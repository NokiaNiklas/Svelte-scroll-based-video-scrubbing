# ScrollSpriteAnimation

A scroll-driven sprite-sequence player for Svelte 5. It renders a frame sequence
(packed into webp **sprite sheets**) onto a WebGL2 canvas and advances the frame
as the user scrolls — far cheaper and smoother than scrubbing a `<video>`, and it
supports per-pixel transparency.

> Sprites first. This component only *plays* sprite sheets — it doesn't create
> them. To turn a PNG frame sequence into sheets, see
> [`frame-tools/README.md`](./frame-tools/README.md).

## What to copy into a new project

Copy the **whole component folder** — it is self-contained:

```
scroll-sprite-animation/
├── ScrollSpriteAnimation.svelte   ← the generic component
├── LoadingScreen.svelte           ← project-specific loader (restyle freely)
├── internal/                      ← webgl + matrix + batching helpers
│   ├── webgl.ts
│   ├── webgl-matrix.ts
│   └── batch.ts
├── glsl/                          ← the two shaders (imported with ?raw)
│   ├── drawImage.vert
│   └── drawImage.frag
├── index.ts                       ← re-exports
└── README.md                      ← this file
```

What you do **not** need to copy:

- `frame-tools/` — only needed to *generate* sprite sheets (build-time, dev only).
- The sprite `*.webp` files — those are your own assets; put them in the new
  project under `/src` (e.g. `src/lib/assets/<name>/`) and point `path` at them.

## Requirements in the target project

| Requirement | Why | Notes |
|-------------|-----|-------|
| **Svelte 5** (runes) | `$props`, `$state`, `$bindable`, `$derived` | required |
| **Vite** | `import.meta.glob` + `?raw` shader imports | any SvelteKit/Vite app |
| **Tailwind CSS** | layout/utility classes in the markup | required as-is |
| **daisyUI** | only in `LoadingScreen.svelte` (`loading`, `bg-base-*`) | swap those classes if you don't use daisyUI |

No npm packages beyond what a normal SvelteKit + Tailwind + daisyUI app already
has. The scroll hint is an inline SVG, so there is **no icon-library dependency**.

## Usage

1. Put your sprite sheets somewhere under `/src`, named `spritesheet-0.webp`,
   `spritesheet-1.webp`, … (this is exactly what `frame-tools` produces), e.g.
   `src/lib/assets/hero-animation/`.

2. Hand the sheets to the component via the `sheets` prop:

```svelte
<script lang="ts">
  import { ScrollSpriteAnimation } from '$lib/components/scroll-sprite-animation';

  // Lazy import map of your sheets. The glob string is literal (Vite needs that)
  // and lives here in your app, so the component stays path-agnostic.
  const sheets = import.meta.glob('$lib/assets/hero-animation/spritesheet-*.webp');
</script>

<ScrollSpriteAnimation {sheets} frameCount={192} />
```

`frameCount` is what `frame-tools` reports at the end of a run. If you omit it,
the component assumes every sheet is full (`columns × rows × sheetCount`).

### Why `sheets` is a prop (and not a path string)

`import.meta.glob` must be called with a **literal** string — it can't read a
runtime variable. So instead of hiding a broad glob inside the component, you
write the literal glob in your own app and pass the result in. Benefits: nothing
is hard-coded, no project-root assumptions, the sheets stay lazily loaded, and
the component just sorts them by the number in the filename and plays them.

You can also pass a plain **array of URLs** instead of a glob map:

```svelte
<script lang="ts">
  const sheets = Object.values(
    import.meta.glob('$lib/assets/hero-animation/spritesheet-*.webp', {
      eager: true, query: '?url', import: 'default',
    })
  ) as string[];
</script>

<ScrollSpriteAnimation {sheets} frameCount={192} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sheets` | glob map \| `string[]` | — | The sprite sheets: `import.meta.glob('…/spritesheet-*.webp')` or an array of URLs. |
| `frameCount` | `number` | auto | Total frames. Omit → `columns × rows × sheetCount`. |
| `columns` | `number` | `4` | Sprite columns per sheet — must match the packed grid. |
| `rows` | `number` | `4` | Sprite rows per sheet. |
| `scrollPerFrame` | `number` | `12` | Scroll px per frame (pinned mode). Lower = faster. |
| `aspect` | `string` | `'16 / 9'` | Panel aspect ratio (any CSS `aspect-ratio`). |
| `fit` | `'cover' \| 'contain'` | `'cover'` | How each frame fills the panel. |
| `backgroundColor` | `string` | `'transparent'` | Solid colour behind the animation (any CSS colour). |
| `pin` | `boolean` | `true` | Sticky-pin while scrolling. `false` = runs as it passes through the viewport. |
| `class` | `string` | `''` | Extra classes for the panel (rounding, shadow, …). |
| `loading` | `boolean` (bindable) | `true` | `bind:loading` to observe the load state. |
| `progress` | `number` (bindable) | `0` | `bind:progress` for the scroll progress 0..1. |

`columns`/`rows` must match how the sheets were packed (the default 4×4 matches
`frame-tools`). The frame **pixel size** is detected automatically from the first
sheet, so you don't configure it here.

## Loading screen

`LoadingScreen.svelte` is rendered by the component (full-screen) while the
sheets load. It is intentionally **not generic** — it uses Tailwind + daisyUI and
is meant to be copied along and restyled per project. Edit that file to change
the look; the generic component doesn't need to change.

You can also drive your own loading UI instead by binding `loading`:

```svelte
<ScrollSpriteAnimation {sheets} bind:loading={isLoading} />
{#if isLoading}<MyOwnLoader />{/if}
```

(Then remove the `<LoadingScreen />` usage at the bottom of
`ScrollSpriteAnimation.svelte` to avoid showing both.)

## Generating sprite sheets

See [`frame-tools/README.md`](./frame-tools/README.md) — it covers turning a PNG
frame sequence into the `spritesheet-*.webp` files this component consumes
(`pack-frames.sh`).
