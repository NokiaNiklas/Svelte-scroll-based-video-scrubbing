<script lang="ts">
  import ThemeSwitch from './ThemeSwitch.svelte';
  import { lenisStore } from '$lib/util/lenis.svelte';

  const chapters = [
    { label: 'Kapitel I',   target: '#kapitel-1' },
    { label: 'Kapitel II',  target: '#kapitel-2' },
    { label: 'Kapitel III', target: '#kapitel-3' },
  ];

  function jump(target: string) {
    lenisStore.scrollTo(target, { offset: -80, duration: 1.4 });
  }
</script>

<nav class="navbar fixed top-0 left-0 right-0 z-50 px-6
            bg-base-100/70 backdrop-blur-md border-b border-base-content/10">

  <!-- Logo -->
  <div class="flex-1">
    <span class="font-heading text-2xl text-base-content tracking-wide">
      The Legend
    </span>
  </div>

  <!-- Chapter links -->
  <div class="flex-none hidden md:flex gap-1">
    {#each chapters as ch}
      <button
        class="btn btn-ghost btn-sm text-xs tracking-[0.15em] uppercase text-base-content/60
               hover:text-base-content transition-colors"
        onclick={() => jump(ch.target)}
      >
        {ch.label}
      </button>
    {/each}
  </div>

  <!-- Theme switch -->
  <div class="flex-none ml-4">
    <ThemeSwitch />
  </div>

</nav>

<!-- Spacer so page content doesn't sit under the fixed navbar -->
<div class="h-16"></div>
