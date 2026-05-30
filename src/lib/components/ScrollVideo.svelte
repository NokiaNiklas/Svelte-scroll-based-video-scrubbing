<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import IconChevronDown from '~icons/lucide/chevron-down';
  import type { Snippet } from 'svelte';

  export type VideoSource = { src: string; type: string };

  interface Props {
    src?:          string;
    sources?:      VideoSource[];
    scrollHeight?: string;
    startOffset?:  string | number; // delay scroll start, e.g. '80vh' or 800 (px)
    class?:        string;
    children?:     Snippet<[number]>;
  }

  const {
    src,
    sources,
    scrollHeight = '500vh',
    startOffset  = 0,
    class: cls   = '',
    children,
  }: Props = $props();

  // Let the browser decide which source it can play.
  // canPlayType returns 'probably' | 'maybe' | '' — pick first non-empty.
  function pickSource(list: VideoSource[]): VideoSource {
    const probe = document.createElement('video');
    for (const s of list) {
      if (probe.canPlayType(s.type) !== '') return s;
    }
    return list[list.length - 1]; // last entry as hard fallback
  }

  // requestVideoFrameCallback is not yet in lib.dom.d.ts
  interface VideoFrameMetadata {
    mediaTime: number;
    presentedFrames: number;
    presentationTime: DOMHighResTimeStamp;
    expectedDisplayTime: DOMHighResTimeStamp;
    width: number;
    height: number;
  }
  interface VideoElementWithVFC extends HTMLVideoElement {
    requestVideoFrameCallback(cb: (now: DOMHighResTimeStamp, meta: VideoFrameMetadata) => void): number;
    cancelVideoFrameCallback(id: number): void;
  }

  let sectionEl:  HTMLElement;
  let canvasEl:   HTMLCanvasElement;
  let childrenEl: HTMLElement = $state()!;

  let scrollProgress = $state(0);
  let videoReady     = $state(false);
  let triggered      = $state(false); // true only after startOffset is reached
  let loadPercent    = $state(0);
  let loadLabel      = $state('Loading');

  let frames: ImageBitmap[] = [];
  let ctx:    CanvasRenderingContext2D;

  // ── Phase 1: Download blob  Phase 2: Extract frames ──────────────────────
  $effect(() => {
    const controller = new AbortController();
    ctx = canvasEl.getContext('2d', { alpha: true })!;

    (async () => {
      try {
        // Resolve source — sources[] takes priority, falls back to src string
        const active: VideoSource = sources?.length
          ? pickSource(sources)
          : { src: src!, type: 'video/webm' };

        // Download
        loadLabel    = 'Loading';
        const res    = await fetch(active.src, { signal: controller.signal });
        const total  = Number(res.headers.get('content-length')) || 0;
        const reader = res.body!.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let downloaded = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          downloaded += value.length;
          loadPercent = total ? Math.round((downloaded / total) * 50) : 25;
        }

        // Strip codec string for Blob (e.g. 'video/mp4; codecs=hvc1' → 'video/mp4')
        const mimeType = active.type.split(';')[0].trim();
        const blobUrl  = URL.createObjectURL(new Blob(chunks, { type: mimeType }));

        // Extract frames
        loadLabel = 'Preparing';
        const video       = document.createElement('video') as VideoElementWithVFC;
        video.src         = blobUrl;
        video.muted       = true;
        video.playsInline = true;

        await new Promise<void>(r => video.addEventListener('canplay', () => r(), { once: true }));

        canvasEl.width  = video.videoWidth  || 1280;
        canvasEl.height = video.videoHeight || 720;

        frames = await ('requestVideoFrameCallback' in video
          ? extractViaPlayback(video)
          : extractViaSeeking(video));

        video.src = '';
        URL.revokeObjectURL(blobUrl);

        videoReady = true;
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error('[ScrollVideo]', e);
      }
    })();

    return () => controller.abort();
  });

  async function extractViaPlayback(video: VideoElementWithVFC): Promise<ImageBitmap[]> {
    const result: ImageBitmap[] = [];
    const duration = video.duration;

    await new Promise<void>((resolve) => {
      const capture = async (_: DOMHighResTimeStamp, meta: VideoFrameMetadata) => {
        result.push(await createImageBitmap(video));
        loadPercent = 50 + Math.round((meta.mediaTime / duration) * 50);
        if (meta.mediaTime < duration - 0.05) {
          video.requestVideoFrameCallback(capture);
        } else {
          video.pause();
          resolve();
        }
      };
      video.requestVideoFrameCallback(capture);
      video.playbackRate = 4;
      video.play();
    });

    return result;
  }

  async function extractViaSeeking(video: HTMLVideoElement): Promise<ImageBitmap[]> {
    const result: ImageBitmap[] = [];
    const fps   = 12;
    const total = Math.ceil(video.duration * fps);

    for (let i = 0; i <= total; i++) {
      video.currentTime = (i / total) * video.duration;
      await new Promise<void>(r => video.addEventListener('seeked', () => r(), { once: true }));
      result.push(await createImageBitmap(video));
      loadPercent = 50 + Math.round((i / total) * 50);
    }

    return result;
  }

  function drawFrame(progress: number) {
    if (!frames.length) return;
    const idx = Math.round(progress * (frames.length - 1));
    const bmp = frames[Math.max(0, Math.min(idx, frames.length - 1))];
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(bmp, 0, 0);
  }

  // ── GSAP ScrollTrigger + children animation — runs once videoReady ──────────
  $effect(() => {
    if (!videoReady) return;

    gsap.registerPlugin(ScrollTrigger);
    drawFrame(0);

    // Animate any [data-animate] elements inside the children overlay
    let tl: gsap.core.Timeline | undefined;
    if (childrenEl) {
      const targets = childrenEl.querySelectorAll<HTMLElement>('[data-animate]');
      if (targets.length) {
        tl = gsap.timeline({ delay: 0.2 });
        tl.from(targets, {
          y: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.18,
          ease: 'power3.out',
        });
      }
    }

    const st = ScrollTrigger.create({
      trigger: sectionEl,
      start: startOffset ? `top+=${startOffset} top` : 'top top',
      end: 'bottom bottom',
      onEnter:     () => { triggered = true;  },
      onLeaveBack: () => { triggered = false; },
      onUpdate: ({ progress }) => {
        scrollProgress = progress;
        drawFrame(progress);
      },
    });

    return () => {
      tl?.kill();
      st.kill();
      frames.forEach(f => f.close());
      frames = [];
    };
  });
</script>

<section bind:this={sectionEl} style="height: {scrollHeight}">

  <div class="sticky top-0 h-screen overflow-hidden {cls}">

    <!-- Canvas — invisible until startOffset is reached, then fades in -->
    <canvas
      bind:this={canvasEl}
      class="absolute inset-0 w-full h-full transition-opacity duration-700"
      style="object-fit: contain; opacity: {videoReady && triggered ? 1 : 0}"
    ></canvas>

    <!-- Overlay content (vignette, text, etc.) — [data-animate] children are auto-animated -->
    {#if children}
      <div
        bind:this={childrenEl}
        class="relative z-20 w-full h-full transition-opacity duration-700"
        style="opacity: {videoReady && triggered ? 1 : 0}"
      >
        {@render children(scrollProgress)}
      </div>
    {/if}

    <!-- Loading overlay -->
    {#if !videoReady}
      <div class="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-base-100">
        <p class="text-xs tracking-[0.3em] uppercase text-base-content/40">{loadLabel}</p>
        <div class="w-48 h-px bg-base-content/10 overflow-hidden rounded-full">
          <div
            class="h-full bg-primary origin-left rounded-full"
            style="transform: scaleX({loadPercent / 100}); transition: transform 0.15s linear"
          ></div>
        </div>
        {#if loadPercent > 0}
          <p class="text-xs tabular-nums text-base-content/25">{loadPercent}%</p>
        {/if}
      </div>
    {/if}

    <!-- Scroll hint -->
    <div
      class="pointer-events-none absolute bottom-10 left-1/2 z-30 -translate-x-1/2
             flex flex-col items-center gap-2 text-base-content/30"
      style="opacity: {videoReady ? Math.max(0, 1 - scrollProgress * 7) : 0}"
    >
      <span class="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
      <IconChevronDown class="size-4 animate-bounce" />
    </div>

  </div>
</section>
