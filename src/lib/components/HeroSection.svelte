<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import ScrollVideo from './ScrollVideo.svelte';

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
  class="h-screen bg-base-100 flex flex-col items-center justify-center -mt-10 text-center px-6 select-none relative z-10"
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

<!-- ── Video + scrolling text blocks ─────────────────────────────────────── -->
<div class="relative">

  <ScrollVideo src="/video/animation.webm" scrollHeight="500vh" class="bg-base-100 -mt-180" />

  <div class="absolute inset-0 z-20 pointer-events-none flex flex-col">

    <div class="h-[50vh] shrink-0"></div>

    <!-- Text 1 — links -->
    <div id="kapitel-1" class="h-[100vh] shrink-0 flex items-center pl-[18%]">
      <div bind:this={block1} class="max-w-sm text-left opacity-0">
        <p class="mb-3 text-xs tracking-[0.3em] uppercase text-base-content/35">Kapitel I</p>
        <h2 class="mb-4 text-5xl leading-tight text-base-content">Der erste<br />Atemzug</h2>
        <p class="text-base leading-relaxed text-base-content/50">
          Aus dem Nichts entstand Form —<br />und mit ihr der Beginn aller Dinge.
        </p>
      </div>
    </div>

    <div class="h-[50vh] shrink-0"></div>

    <!-- Text 2 — rechts -->
    <div id="kapitel-2" class="h-[100vh] shrink-0 flex items-center justify-end pr-[18%]">
      <div bind:this={block2} class="max-w-sm text-right opacity-0">
        <p class="mb-3 text-xs tracking-[0.3em] uppercase text-base-content/35">Kapitel II</p>
        <h2 class="mb-4 text-5xl leading-tight text-base-content">Die große<br />Wandlung</h2>
        <p class="text-base leading-relaxed text-base-content/50">
          Zwischen Licht und Schatten —<br />entscheidet sich alles in einem Moment.
        </p>
      </div>
    </div>

    <div class="h-[50vh] shrink-0"></div>

    <!-- Text 3 — links -->
    <div id="kapitel-3" class="h-[100vh] shrink-0 flex items-center pl-[18%]">
      <div bind:this={block3} class="max-w-sm text-left opacity-0">
        <p class="mb-3 text-xs tracking-[0.3em] uppercase text-base-content/35">Kapitel III</p>
        <h2 class="mb-4 text-5xl leading-tight text-base-content">Die<br />Vollendung</h2>
        <p class="text-base leading-relaxed text-base-content/50">
          Was begann als Flüstern —<br />endet als unvergängliche Legende.
        </p>
      </div>
    </div>

    <div class="h-[50vh] shrink-0"></div>

  </div>
</div>
