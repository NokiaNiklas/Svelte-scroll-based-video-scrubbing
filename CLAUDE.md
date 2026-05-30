# video-scroll-test

SvelteKit 2 + Svelte 5 project with scroll-driven video/animation interactions.

## Commands

```bash
pnpm dev          # dev server → http://localhost:5173
pnpm build        # production build
pnpm preview      # preview production build
pnpm check        # svelte-check type-checking
pnpm format       # prettier format
pnpm lint         # prettier check (CI)
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | SvelteKit 2, Svelte 5 |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Icons | unplugin-icons (Lucide + custom) |
| Images | `@zerodevx/svelte-img` + vite-imagetools |
| Animation | GSAP 3 |
| Slider | Swiper 11 |
| Package manager | pnpm |

## Conventions

### Routing
Always use `route()` from `$lib/util/route.svelte` for internal `href` values and `goto()` calls:

```svelte
<script lang="ts">
  import { route } from '$lib/util/route.svelte';
</script>

<a href={route('/about')}>About</a>
```

This prepends the SvelteKit `base` path so the app works when deployed at a sub-path.

### Icons
- **Lucide** — `import IconName from '~icons/lucide/icon-name'`
- **Custom** — drop an SVG into `src/lib/icons/`, import as `~icons/custom/filename-without-ext`

```svelte
<script lang="ts">
  import IconArrowRight from '~icons/lucide/arrow-right';
  import MyIcon from '~icons/custom/my-icon';
</script>

<IconArrowRight class="size-4" />
```

### Images
```svelte
<script lang="ts">
  import Img from '@zerodevx/svelte-img';
  import src from '$lib/assets/photo.jpg?w=800&format=webp&imagetools';
</script>

<Img {src} alt="..." />
```

### Svelte 5 component props
Use the runes API — `$props()`, `$state()`, `$derived()`, `$effect()`. No `export let`.

```svelte
<script lang="ts">
  interface Props { title: string; count?: number }
  const { title, count = 0 }: Props = $props();
</script>
```

## Typography

Fonts are self-hosted in `static/fonts/` and declared in `src/lib/css/fonts.css`.

| Font | Verwendung | Tailwind-Token | Gewichte |
|------|-----------|----------------|----------|
| **Pirata One** | Alle Headings (`h1`–`h6`) | `font-heading` | 400 |
| **Nunito** | Alles andere (body, UI, labels) | `font-sans` | 200–900 + Italic |

- `h1`–`h6` bekommen `font-family: var(--font-heading)` automatisch via `@layer base` — kein extra Class nötig.
- Für Body-Text passiert nichts: Nunito ist der `html`-Default.
- Um PirataOne explizit auf einem Element zu erzwingen: `class="font-heading"`
- Um Nunito explizit zu setzen: `class="font-sans"`

```svelte
<h1>Pirata One automatisch</h1>
<p>Nunito automatisch</p>
<span class="font-heading">Pirata One erzwungen</span>
```

## CSS Utility Classes (defined in `src/lib/css/app.css`)

```
.outer-section        → w-full flex flex-col items-center
.inner-section-5xl    → px-4 max-w-5xl w-full flex
.inner-section-6xl    → px-4 max-w-6xl w-full flex
.inner-section-8xl    → px-4 max-w-8xl w-full flex
```

Typical page section pattern:

```svelte
<section class="outer-section py-16">
  <div class="inner-section-6xl flex-col gap-8">
    <!-- content -->
  </div>
</section>
```

## Project Structure

```
src/
├── app.html              # HTML shell
├── app.css               # Tailwind + DaisyUI entrypoint
├── app.d.ts              # global TS types (unplugin-icons ref)
├── lib/
│   ├── css/
│   │   ├── fonts.css     # @font-face + @theme font tokens + h1-h6 base styles
│   │   └── app.css       # custom utility classes
│   ├── icons/            # custom SVG icons → ~icons/custom/<name>
│   └── util/
│       └── route.svelte.ts  # route() helper
└── routes/
    ├── +layout.svelte
    └── +page.svelte
```

```
static/
└── fonts/          # PirataOne-Regular.ttf + alle Nunito-Schnitte (200–900 + Italic)
```

## Notes

- `@sveltejs/vite-plugin-svelte` must be a direct devDependency (pnpm strict hoisting).
- On a fresh clone: run `pnpm approve-builds esbuild sharp` once, then `pnpm install`.
- `max-w-8xl` (88 rem / 1408 px) is a custom theme extension defined in `src/lib/css/app.css`.
