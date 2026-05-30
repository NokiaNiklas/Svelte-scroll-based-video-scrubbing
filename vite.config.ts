import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    Icons({
      compiler: 'svelte',
      customCollections: {
        // Drop SVG files into src/lib/icons/ and import with ~icons/custom/<name>
        custom: FileSystemIconLoader('./src/lib/icons'),
      },
    }),
    imagetools(),
  ],
});
