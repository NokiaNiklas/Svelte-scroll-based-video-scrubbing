import type Lenis from 'lenis';

class LenisStore {
  instance = $state<Lenis | null>(null);

  scrollTo(target: string | HTMLElement | number, options?: Parameters<Lenis['scrollTo']>[1]) {
    this.instance?.scrollTo(target as any, options);
  }
}

export const lenisStore = new LenisStore();
