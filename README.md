# video_scroll_test

SvelteKit 2 + Svelte 5 Projekt mit scroll-gesteuerter Video-Animation.

---

## ScrollVideo Component

`src/lib/components/ScrollVideo.svelte`

Ein wiederverwendbarer Component der ein Video komplett vorlädt, alle Frames in den GPU-Speicher extrahiert und dann frame-genau per Scroll-Position abspielt — ohne Seeking-Verzögerung.

### Wie es funktioniert

1. Video wird als Blob heruntergeladen (Ladebalken sichtbar)
2. Frames werden via `requestVideoFrameCallback` extrahiert und als `ImageBitmap` im GPU-Speicher gespeichert
3. GSAP ScrollTrigger mappt die Scroll-Position auf den Frame-Index
4. Per Scroll wird nur `ctx.drawImage(frames[idx])` aufgerufen — kein Seeking, sofortige Darstellung

---

## Setup in einem neuen Projekt

### 1. Packages installieren

```bash
pnpm add gsap lenis
```

### 2. Lenis in `+page.svelte` einrichten

Lenis muss **einmal pro Seite** eingerichtet werden, **bevor** ScrollTrigger-Instanzen erstellt werden.

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import Lenis from 'lenis';
  import ScrollVideo from '$lib/components/ScrollVideo.svelte';

  $effect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis    = new Lenis({ duration: 1.2 });
    const lenisRaf = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenisRaf);
    };
  });
</script>

<ScrollVideo src="/video/mein-video.webm" />
```

### 3. Video ablegen

```
static/
└── video/
    └── mein-video.webm   ← hier, damit Range-Requests funktionieren
```

---

## Component Props

```svelte
<ScrollVideo
  src="/video/animation.webm"   <!-- einzelne Quelle (shorthand) -->
  scrollHeight="500vh"          <!-- Scroll-Reiseweite, default: '500vh' -->
  class="bg-base-100"           <!-- CSS-Klassen für den sticky Container -->
>
  <!-- Optional: Overlay-Content über dem Video -->
  <!-- [data-animate] Elemente werden automatisch eingeblendet wenn das Video geladen ist -->
</ScrollVideo>
```

### Overlay mit Scroll-Progress

Der `children`-Snippet bekommt den aktuellen Scroll-Fortschritt (0–1) übergeben:

```svelte
<ScrollVideo src="/video/clip.webm">
  {#snippet children(progress)}
    <div class="absolute top-1/2 left-12" style="opacity: {progress < 0.5 ? 1 : 0}">
      <h2 data-animate>Sichtbar in der ersten Hälfte</h2>
    </div>
  {/snippet}
</ScrollVideo>
```

### Mehrere Instanzen auf einer Seite

Lenis nur einmal in `+page.svelte` einrichten. Beide Components nutzen es automatisch:

```svelte
<ScrollVideo src="/video/clip1.webm" />
<ScrollVideo src="/video/clip2.webm" />
```

---

## Fallback-Video für Safari (MP4 / HEVC)

WebM mit Alpha-Kanal wird von Safari nicht unterstützt. Der Component hat dafür ein eingebautes `sources`-Prop — der Browser wählt selbst via `canPlayType()` die erste Quelle die er abspielen kann.

### Verwendung mit mehreren Quellen

```svelte
<script lang="ts">
  import ScrollVideo, { type VideoSource } from '$lib/components/ScrollVideo.svelte';

  const sources: VideoSource[] = [
    { src: '/video/animation.webm',  type: 'video/webm' },               // Chrome, Firefox
    { src: '/video/animation.mov',   type: 'video/mp4; codecs=hvc1' },   // Safari (mit Alpha)
    { src: '/video/animation.mp4',   type: 'video/mp4; codecs=avc1.640028' }, // Fallback (kein Alpha)
  ];
</script>

<ScrollVideo {sources} />
```

Der Component testet jeden Eintrag der Reihe nach mit `canPlayType()` und lädt die erste unterstützte Quelle. Der letzte Eintrag dient als harter Fallback falls nichts passt.

### Wie `canPlayType` funktioniert

```ts
video.canPlayType('video/webm')                      // '' in Safari → überspringen
video.canPlayType('video/mp4; codecs=hvc1')          // 'probably' in Safari → nehmen
video.canPlayType('video/mp4; codecs=avc1.640028')   // 'probably' überall → Fallback
```

Rückgabewerte: `'probably'` · `'maybe'` · `''` (nicht unterstützt). Der Component nimmt den ersten Eintrag der nicht leer ist.

> **Kein UserAgent-Sniffing** — der Browser entscheidet selbst was er kann, unabhängig von Betriebssystem-Version oder Browser-Flags.

### Video-Formate im Überblick

| Format | Transparenz | Chrome | Firefox | Safari |
|--------|-------------|--------|---------|--------|
| WebM (VP9) | ✅ | ✅ | ✅ | ❌ |
| MP4 (H.264) | ❌ | ✅ | ✅ | ✅ |
| MOV (HEVC) | ✅ | ❌ | ❌ | ✅ |

**Empfehlung:** WebM als primäre Quelle + MP4 als Fallback (ohne Transparenz). Für Transparenz in Safari: MOV mit HEVC Alpha — benötigt macOS 10.15+ und iOS 13+.

```bash
# MP4 Fallback aus WebM erstellen (ffmpeg)
ffmpeg -i animation.webm -c:v libx264 -pix_fmt yuv420p animation.mp4

# HEVC mit Alpha für Safari (nur auf macOS mit Apple Silicon empfohlen)
ffmpeg -i animation.webm -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 1 animation.mov
```

---

## Projekt-Stack

| | |
|---|---|
| Framework | SvelteKit 2, Svelte 5 |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Smooth Scroll | Lenis |
| Animationen | GSAP + ScrollTrigger |
| Icons | unplugin-icons (Lucide + Custom) |
| Fonts | PirataOne, Nunito (self-hosted) |
| Package Manager | pnpm |

## Entwicklung

```bash
pnpm install
pnpm approve-builds   # einmalig nach erstem Clone (esbuild + sharp)
pnpm dev              # http://localhost:5173
pnpm build
pnpm check            # TypeScript + Svelte check
```
