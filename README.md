# video_scroll_test

SvelteKit 2 + Svelte 5 Projekt mit einer **scroll-gesteuerten Sprite-Animation**:
eine Bild-Sequenz wird in webp-Spritesheets gepackt und per WebGL frame-genau
beim Scrollen abgespielt — performanter und flüssiger als Video-Scrubbing, mit
voller Transparenz.

## Tech Stack

| Layer | Wahl |
|-------|------|
| Framework | SvelteKit 2, Svelte 5 (Runes) |
| Styling | Tailwind CSS v4 + daisyUI v5 |
| Animation | GSAP 3 (ScrollTrigger) + WebGL2 |
| Smooth Scroll | Lenis |
| Icons | unplugin-icons (Lucide + custom) |
| Bilder | `@zerodevx/svelte-img` + vite-imagetools |
| Paketmanager | pnpm |

## Setup

```bash
pnpm install
pnpm dev          # → http://localhost:5173
```

Bei einem frischen Clone einmalig: `pnpm approve-builds esbuild sharp`, dann
`pnpm install`.

### Befehle

```bash
pnpm dev          # Dev-Server
pnpm build        # Production-Build
pnpm preview      # Build lokal ansehen
pnpm check        # svelte-check (Typen)
pnpm format       # Prettier schreiben
pnpm lint         # Prettier prüfen (CI)
```

## Die Scroll-Sprite-Animation

Das Herzstück ist die wiederverwendbare Komponente unter
[`src/lib/components/scroll-sprite-animation/`](src/lib/components/scroll-sprite-animation/README.md).
Sie ist generisch gehalten und für andere Projekte gedacht — ihre eigene README
erklärt alles im Detail (Props, was kopieren, Voraussetzungen).

Kurz:

```svelte
<script lang="ts">
  import { ScrollSpriteAnimation } from '$lib/components/scroll-sprite-animation';
  const sheets = import.meta.glob('$lib/assets/hero-animation/spritesheet-*.webp');
</script>

<ScrollSpriteAnimation {sheets} frameCount={192} />
```

Die Spritesheets selbst werden aus einer PNG-Frame-Sequenz erzeugt — siehe
[`frame-tools/README.md`](src/lib/components/scroll-sprite-animation/frame-tools/README.md).

## Projektstruktur

```
src/
├── routes/
│   ├── +layout.svelte
│   └── +page.svelte              # richtet Lenis + GSAP ein, rendert die Demo
├── lib/
│   ├── components/
│   │   ├── HeroSection.svelte     # Intro + 3-Spalten-Layout (Text · Animation · Text)
│   │   ├── ProductInfo.svelte
│   │   ├── Navbar.svelte · ThemeSwitch.svelte
│   │   └── scroll-sprite-animation/   # ← die generische Komponente (eigene README)
│   │       ├── ScrollSpriteAnimation.svelte
│   │       ├── LoadingScreen.svelte
│   │       ├── internal/ · glsl/
│   │       └── frame-tools/            # Sprite-Erzeugung (Dev-Tooling, eigene README)
│   ├── assets/hero-animation/    # die generierten spritesheet-*.webp
│   ├── css/ · icons/ · util/
│   └── …
└── app.html · app.css
```

Detaillierte Konventionen (Routing-Helfer, Icons, Fonts, Utility-Klassen) stehen
in [`CLAUDE.md`](CLAUDE.md).

## Lizenz

Privat / unlizenziert.
