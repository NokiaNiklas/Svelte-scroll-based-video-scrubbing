<script lang="ts">
  import IconSun from '~icons/lucide/sun';
  import IconMoon from '~icons/lucide/moon';

  const THEMES = { dark: 'luxury', light: 'lofi' } as const;
  type Mode = keyof typeof THEMES;

  function readStored(): Mode {
    if (typeof localStorage === 'undefined') return 'dark';
    const v = localStorage.getItem('theme');
    return v === 'light' || v === 'dark' ? v : 'dark';
  }

  let mode = $state<Mode>(readStored());

  $effect(() => {
    document.documentElement.setAttribute('data-theme', THEMES[mode]);
    localStorage.setItem('theme', mode);
  });

  function toggle() {
    mode = mode === 'dark' ? 'light' : 'dark';
  }
</script>

<button
  class="btn btn-ghost btn-circle"
  onclick={toggle}
  aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  title={mode === 'dark' ? 'Lofi (light)' : 'Luxury (dark)'}
>
  {#if mode === 'dark'}
    <IconSun class="size-5" />
  {:else}
    <IconMoon class="size-5" />
  {/if}
</button>
