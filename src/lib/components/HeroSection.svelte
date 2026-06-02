<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { ScrollSpriteAnimation } from './scroll-sprite-animation';

  // Lazy import map of the hero sprite sheets — handed to the component.
  const heroSheets = import.meta.glob('$lib/assets/hero-animation/spritesheet-*.webp');

  let textSectionEl: HTMLElement;
  let block1: HTMLElement;
  let block2: HTMLElement;
  let block3: HTMLElement;

  // Intro entrance animation
  $effect(() => {
    const targets = textSectionEl.querySelectorAll<HTMLElement>('[data-animate]');
    const tl = gsap.timeline({ delay: 0.3 });
    tl.from(targets, { y: 50, opacity: 0, duration: 1, stagger: 0.18, ease: 'power3.out' });
    return () => tl.kill();
  });

  // Scroll text fade — animiert rein wenn Block sichtbar wird, raus wenn er fast weg ist
  $effect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggers: ScrollTrigger[] = [];

    for (const block of [block1, block2, block3]) {
      triggers.push(
        ScrollTrigger.create({
          trigger: block,
          start: 'top 80%',    // fade in: später — oberkante muss erst die Mitte erreichen
          end:   'bottom 20%', // fade out: früher — unterkante verlässt schon bei Mitte
          onEnter:     () => gsap.to(block, { opacity: 1, y: 0,   duration: 0.7, ease: 'power2.out' }),
          onLeave:     () => gsap.to(block, { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in'  }),
          onEnterBack: () => gsap.to(block, { opacity: 1, y: 0,   duration: 0.7, ease: 'power2.out' }),
          onLeaveBack: () => gsap.to(block, { opacity: 0, y:  30, duration: 0.5, ease: 'power2.in'  }),
        })
      );
    }

    return () => triggers.forEach(t => t.kill());
  });
</script>

<!-- ── Intro text section ─────────────────────────────────────────────────── -->
<section
  bind:this={textSectionEl}
  class="h-screen bg-base-100 flex flex-col items-center justify-center text-center px-6 select-none"
>
  <div class="mb-20">
      <span data-animate class="mb-5 inline-block rounded-full border border-base-content/20 px-4 py-1.5
         text-xs tracking-[0.25em] uppercase text-base-content/50">
    Scroll to reveal
  </span>
    <h1 data-animate class="mb-5 text-[clamp(3rem,10vw,7rem)] leading-[0.9] text-base-content">
      The Legend<br />Begins
    </h1>
    <p data-animate class="max-w-sm text-base leading-relaxed text-base-content/50">
      Eine Reise durch Bild und Bewegung —<br />gesteuert allein durch dein Scrollen.
    </p>
  </div>

</section>

<!-- ── 3 columns: text · animation · text ────────────────────────────────────
     Sprite sheets live in src/lib/assets/hero-animation/ (built via
     hero-animation/pack-frames.sh). frameCount = total frames it reported.
     The middle column pins (sticky) while the side texts scroll past. -->
<section class="bg-base-100 outer-section">
  <div class="mx-auto grid w-full max-w-8xl grid-cols-[1fr_3fr_1fr] gap-8 px-6">

    <!-- LEFT texts (Kapitel I + III) — hug the centre -->
    <div class="flex min-w-0 flex-col items-end text-left">
      <div class="h-[30vh] shrink-0"></div>
      <div bind:this={block1} class="w-full max-w-xs opacity-0">
        <p class="mb-3 text-xs tracking-[0.3em] uppercase text-base-content/35">Kapitel I</p>
        <h2 class="mb-4 text-4xl leading-tight text-base-content">Der erste<br />Atemzug</h2>
        <p class="text-base leading-relaxed text-base-content/50">
          Aus dem Nichts entstand Form — und mit ihr der Beginn aller Dinge.
        </p>
      </div>

      <div class="h-[150vh] shrink-0"></div>
      <div bind:this={block3} class="w-full max-w-xs opacity-0">
        <p class="mb-3 text-xs tracking-[0.3em] uppercase text-base-content/35">Kapitel III</p>
        <h2 class="mb-4 text-4xl leading-tight text-base-content">Die<br />Vollendung</h2>
        <p class="text-base leading-relaxed text-base-content/50">
          Was begann als Flüstern — endet als unvergängliche Legende.
        </p>
      </div>
    </div>

    <!-- MIDDLE: pinned animation (transparent — floats on the section bg) -->
    <ScrollSpriteAnimation sheets={heroSheets} frameCount={192} />

    <!-- RIGHT texts (Kapitel II) — hug the centre -->
    <div class="flex min-w-0 flex-col items-start text-right">
      <div class="h-[105vh] shrink-0"></div>
      <div bind:this={block2} class="w-full max-w-xs opacity-0">
        <p class="mb-3 text-xs tracking-[0.3em] uppercase text-base-content/35">Kapitel II</p>
        <h2 class="mb-4 text-4xl leading-tight text-base-content">Die große<br />Wandlung</h2>
        <p class="text-base leading-relaxed text-base-content/50">
          Zwischen Licht und Schatten — entscheidet sich alles in einem Moment.
        </p>
      </div>
    </div>

  </div>
</section>
