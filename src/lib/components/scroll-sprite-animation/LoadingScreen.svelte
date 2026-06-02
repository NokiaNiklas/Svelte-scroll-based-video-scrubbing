<script lang="ts">
  import { fade } from 'svelte/transition';

  // Project-specific loading screen used by ScrollSpriteAnimation while the
  // sprite frames load. Not meant to be generic — copy it along and restyle it
  // per project (it uses Tailwind + daisyUI classes).
  interface Props {
    /** Text above the spinner. */
    label?: string;
    /** Classes for the full-screen overlay (background colour etc.). */
    class?: string;
  }

  const { label = 'Loading', class: cls = 'bg-base-100' }: Props = $props();
</script>

<div
  class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 {cls}"
  transition:fade={{ duration: 400 }}
>
  <p class="text-xs uppercase tracking-[0.3em] text-base-content/40">{label}</p>
  <span class="loading loading-bars loading-lg text-primary"></span>
</div>
