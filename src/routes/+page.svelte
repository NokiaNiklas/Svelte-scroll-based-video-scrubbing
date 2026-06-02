<script lang="ts">
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import Lenis from 'lenis';
  import HeroSection from '$lib/components/HeroSection.svelte';
  import ProductInfo from '$lib/components/ProductInfo.svelte';
  import { lenisStore } from '$lib/util/lenis.svelte';

  $effect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis    = new Lenis({ duration: 1.2 , smoothWheel:true });
    const lenisRaf = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    lenisStore.instance = lenis;

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenisRaf);
      lenisStore.instance = null;
    };
  });
</script>

<HeroSection />
<ProductInfo />
