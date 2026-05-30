<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  let sectionEl: HTMLElement;

  $effect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const targets = sectionEl.querySelectorAll<HTMLElement>('[data-animate]');
    targets.forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  });
</script>

<section bind:this={sectionEl} class="outer-section py-32 bg-base-100">
  <div class="inner-section-6xl flex-col gap-20">

    <!-- Header -->
    <div class="flex flex-col items-center text-center gap-4" data-animate>
      <span class="text-xs tracking-[0.3em] uppercase text-base-content/40">Das Produkt</span>
      <h2 class="text-5xl leading-tight text-base-content">Erschaffen für<br />die Ewigkeit</h2>
      <p class="max-w-lg text-base leading-relaxed text-base-content/50">
        Jedes Detail durchdacht, jede Linie gesetzt mit Absicht.
        Was hier entsteht, trägt den Anspruch einer Epoche.
      </p>
    </div>

    <!-- Feature grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">

      <div class="flex flex-col gap-4 p-8 rounded-box border border-base-content/10" data-animate>
        <span class="text-xs tracking-[0.3em] uppercase text-primary/60">Material</span>
        <h3 class="text-2xl text-base-content">Rohstoff der Götter</h3>
        <p class="text-sm leading-relaxed text-base-content/50">
          Nur das Seltenste findet Eingang in die Fertigung.
          Kein Kompromiss, keine Abkürzung — nur das Absolute.
        </p>
      </div>

      <div class="flex flex-col gap-4 p-8 rounded-box border border-base-content/10" data-animate>
        <span class="text-xs tracking-[0.3em] uppercase text-primary/60">Handwerk</span>
        <h3 class="text-2xl text-base-content">Meisterschaft in Form</h3>
        <p class="text-sm leading-relaxed text-base-content/50">
          Generationen von Wissen fließen in jeden Handgriff.
          Das Ergebnis spricht für sich — lautlos und unübersehbar.
        </p>
      </div>

      <div class="flex flex-col gap-4 p-8 rounded-box border border-base-content/10" data-animate>
        <span class="text-xs tracking-[0.3em] uppercase text-primary/60">Bestand</span>
        <h3 class="text-2xl text-base-content">Zeitlos und beständig</h3>
        <p class="text-sm leading-relaxed text-base-content/50">
          Trends vergehen, wahre Qualität bleibt.
          Gefertigt nicht für eine Saison, sondern für Jahrzehnte.
        </p>
      </div>

    </div>

    <!-- Quote -->
    <div class="flex flex-col items-center text-center gap-6 py-8" data-animate>
      <p class="max-w-2xl text-2xl leading-relaxed text-base-content/70 font-heading">
        „Das Beste entsteht nicht durch Eile —
        es wächst durch Hingabe."
      </p>
      <span class="text-xs tracking-[0.25em] uppercase text-base-content/30">— Unbekannter Meister</span>
    </div>

  </div>
</section>
