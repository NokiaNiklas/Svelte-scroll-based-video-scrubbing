<script lang="ts">
  import { onMount, tick } from 'svelte';
  import LoadingScreen from './LoadingScreen.svelte';
  import { promiseAllInBatches } from './internal/batch';
  import {
    calculateFitCoordinates,
    compileShader,
    createProgram,
    deleteTextures,
    loadTexture,
    resizeCanvasToDisplaySize,
    type WebGLTextureInfo,
  } from './internal/webgl';
  import {
    createOrthographicProjectionMatrix,
    createScalingMatrix,
    createTranslationMatrix,
    multiplyMatrix,
  } from './internal/webgl-matrix';
  import drawImageVertexShader from './glsl/drawImage.vert?raw';
  import drawImageFragmentShader from './glsl/drawImage.frag?raw';

  /** A glob map from `import.meta.glob(...)`, or a plain array of sheet URLs. */
  type SpriteSheets = Record<string, () => Promise<unknown>> | string[];

  interface Props {
    /**
     * The sprite sheets to play. Pass the result of
     * `import.meta.glob('…/spritesheet-*.webp')` (lazy, recommended) or an array
     * of sheet URLs. Either way they're sorted by the number in their filename.
     */
    sheets?: SpriteSheets;
    /**
     * Total number of frames across all sheets. If omitted, every sheet is
     * assumed full (columns × rows × sheetCount). Set it for an exact end frame.
     */
    frameCount?: number;
    /** Sprite columns per sheet (must match how the sheets were packed). Default 4. */
    columns?: number;
    /** Sprite rows per sheet. Default 4. */
    rows?: number;
    /** Pixels of scroll distance per frame. Lower = faster. Only used when pinned. Default 12. */
    scrollPerFrame?: number;
    /** Aspect ratio of the panel — any CSS `aspect-ratio` value. Default '16 / 9'. */
    aspect?: string;
    /** How each frame fills the panel. Default 'cover'. */
    fit?: 'cover' | 'contain';
    /** Solid background behind the (transparent) animation — any CSS colour. Default 'transparent'. */
    backgroundColor?: string;
    /** Pin the animation (sticky) while scrolling through it. Default true. */
    pin?: boolean;
    /** Extra classes for the animation panel (rounding, shadow, …). */
    class?: string;
    /** Bindable — true while the sheets load. */
    loading?: boolean;
    /** Bindable — scroll progress 0..1. */
    progress?: number;
  }

  let {
    sheets,
    frameCount,
    columns = 4,
    rows = 4,
    scrollPerFrame = 12,
    aspect = '16 / 9',
    fit = 'cover',
    backgroundColor = 'transparent',
    pin = true,
    class: cls = '',
    loading = $bindable(true),
    progress = $bindable(0),
  }: Props = $props();

  const framesPerSheet = $derived(columns * rows);

  // Normalise to a sorted list of loaders, whether `sheets` is a glob map or URLs.
  const sheetLoaders = $derived.by<Array<() => Promise<string>>>(() => {
    if (!sheets) return [];
    const numberOf = (s: string) => Number.parseInt(/spritesheet-(\d+)/.exec(s)?.[1] ?? '0');

    if (Array.isArray(sheets)) {
      return [...sheets]
        .sort((a, b) => numberOf(a) - numberOf(b))
        .map((url) => () => Promise.resolve(url));
    }

    return Object.entries(sheets)
      .sort((a, b) => numberOf(a[0]) - numberOf(b[0]))
      .map(([, importFn]) => async () => ((await importFn()) as { default: string }).default);
  });

  const totalFrames = $derived(
    frameCount && frameCount > 0 ? frameCount : sheetLoaders.length * framesPerSheet
  );
  const hasSheets = $derived(sheetLoaders.length > 0);

  // ── Layout ──────────────────────────────────────────────────────────────────
  let windowHeight = $state(0);
  let containerElement: HTMLDivElement;

  const scrollDistance = $derived(totalFrames * scrollPerFrame);
  const containerHeight = $derived(scrollDistance + windowHeight);

  // ── WebGL state ─────────────────────────────────────────────────────────────
  let animationCanvas: HTMLCanvasElement;
  let gl: WebGL2RenderingContext;
  let loadedSheets: WebGLTextureInfo[] = [];
  let frameWidth = 0;
  let frameHeight = 0;

  let shaderProgram: WebGLProgram;
  let matrixUniformLocation: WebGLUniformLocation;
  let textureMatrixUniformLocation: WebGLUniformLocation;
  let textureUniformLocation: WebGLUniformLocation;
  let vao: WebGLVertexArrayObject;

  let rafHandle: number | undefined;

  onMount(() => {
    windowHeight = window.innerHeight;

    if (!hasSheets) {
      loading = false;
      console.warn(
        '[ScrollSpriteAnimation] No sheets passed. Provide the `sheets` prop, e.g. ' +
          "import.meta.glob('$lib/assets/hero-animation/spritesheet-*.webp')."
      );
      return;
    }

    initialize();

    return () => {
      if (rafHandle) cancelAnimationFrame(rafHandle);
      if (gl) deleteTextures(gl, loadedSheets);
    };
  });

  async function initialize() {
    await tick();

    // alpha:true so the canvas itself can be transparent where the sprites are.
    const context = animationCanvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    });
    if (!context) throw new Error('WebGL2 could not be initialized!');
    gl = context;

    prepareWebGL();
    await loadSheets();

    if (loadedSheets[0]) {
      frameWidth = loadedSheets[0].width / columns;
      frameHeight = loadedSheets[0].height / rows;
    }

    loading = false;
    rafHandle = requestAnimationFrame(render);
  }

  async function loadSheets() {
    // 4 at a time — browsers choke on too many simultaneous image decodes.
    loadedSheets = await promiseAllInBatches(
      async (load) => loadTexture(gl, await load()),
      sheetLoaders,
      4
    );
  }

  function prepareWebGL() {
    // A unit quad (two triangles) reused for every frame; position == texcoord.
    const unitQuad = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];

    // Composite sprite alpha over the (transparent) background.
    // ONE / ONE_MINUS_SRC_ALPHA because textures are loaded premultiplied.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    shaderProgram = createProgram(
      gl,
      compileShader(gl, drawImageVertexShader, gl.VERTEX_SHADER),
      compileShader(gl, drawImageFragmentShader, gl.FRAGMENT_SHADER)
    );

    const positionLoc = gl.getAttribLocation(shaderProgram, 'a_position');
    const texcoordLoc = gl.getAttribLocation(shaderProgram, 'a_texcoord');
    matrixUniformLocation = gl.getUniformLocation(shaderProgram, 'u_matrix')!;
    textureMatrixUniformLocation = gl.getUniformLocation(shaderProgram, 'u_textureMatrix')!;
    textureUniformLocation = gl.getUniformLocation(shaderProgram, 'u_texture')!;

    vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitQuad), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitQuad), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);
  }

  /** Maps a frame index to its sheet + pixel position within that sheet. */
  function getFramePosition(frameIndex: number) {
    const sheetIndex = Math.floor(frameIndex / framesPerSheet);
    const indexOnSheet = frameIndex - sheetIndex * framesPerSheet;

    return {
      sheetIndex,
      x: (indexOnSheet % columns) * frameWidth,
      y: Math.floor(indexOnSheet / columns) * frameHeight,
    };
  }

  function render() {
    rafHandle = requestAnimationFrame(render);
    drawCurrentFrame();
  }

  function drawCurrentFrame() {
    if (!animationCanvas || !frameWidth) return;

    resizeCanvasToDisplaySize(animationCanvas, Math.min(window.devicePixelRatio || 1, 2));
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Map scroll position to 0..1 progress.
    const rect = containerElement.getBoundingClientRect();
    if (pin) {
      // Pinned: progress over the tall spacer (top travels 0 → -scrollDistance).
      const localScroll = Math.min(scrollDistance, Math.max(0, -rect.top));
      progress = scrollDistance > 0 ? localScroll / scrollDistance : 0;
    } else {
      // Inline: progress as the panel travels through the viewport.
      const travel = windowHeight + rect.height;
      progress = travel > 0 ? Math.min(1, Math.max(0, (windowHeight - rect.top) / travel)) : 0;
    }

    const frameId = Math.max(0, Math.min(Math.round(progress * (totalFrames - 1)), totalFrames - 1));

    const pos = getFramePosition(frameId);
    const sheet = loadedSheets[pos.sheetIndex];
    if (!sheet) return;

    const coords = calculateFitCoordinates(fit, {
      sourceX: pos.x,
      sourceY: pos.y,
      sourceWidth: frameWidth,
      sourceHeight: frameHeight,
      canvasWidth: gl.canvas.width,
      canvasHeight: gl.canvas.height,
    });

    drawSprite(sheet, coords);
  }

  function drawSprite(
    sheet: WebGLTextureInfo,
    {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight,
    }: ReturnType<typeof calculateFitCoordinates>
  ) {
    gl.useProgram(shaderProgram);
    gl.bindVertexArray(vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sheet.texture);
    gl.uniform1i(textureUniformLocation, 0);

    // Pixel-space → clip-space, then place + size the quad on the canvas.
    const projection = createOrthographicProjectionMatrix(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
    let matrix = multiplyMatrix(
      createTranslationMatrix(destinationX, destinationY, 0),
      createScalingMatrix(destinationWidth, destinationHeight, 1)
    );
    matrix = multiplyMatrix(projection, matrix);
    gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);

    // Pick the sprite cell out of the sheet in texture space (0..1).
    const textureMatrix = multiplyMatrix(
      createTranslationMatrix(sourceX / sheet.width, sourceY / sheet.height, 0),
      createScalingMatrix(sourceWidth / sheet.width, sourceHeight / sheet.height, 1)
    );
    gl.uniformMatrix4fv(textureMatrixUniformLocation, false, textureMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
</script>

<svelte:window bind:innerHeight={windowHeight} />

<!-- When pinned, the outer div is a tall scroll spacer and the panel inside
     stays pinned while scrolling through it. When not pinned, the panel just
     sits inline and the animation runs as it passes through the viewport. -->
<div bind:this={containerElement} class="relative w-full" style={pin ? `height: ${containerHeight}px;` : undefined}>
  <div class={pin ? 'sticky top-0 flex h-screen items-center justify-center' : 'flex items-center justify-center'}>
    <div
      class="relative w-full overflow-hidden {cls}"
      style="aspect-ratio: {aspect}; background-color: {backgroundColor};"
    >
      <canvas bind:this={animationCanvas} class="block h-full w-full"></canvas>

      {#if !hasSheets}
        <div class="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-base-content/40">
          Keine Sprites übergeben — `sheets`-Prop setzen.
        </div>
      {/if}
    </div>

    <!-- Scroll hint — only meaningful when pinned; fades out on first scroll. -->
    {#if pin && !loading && hasSheets}
      <div
        class="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-base-content/40"
        style="opacity: {Math.max(0, 1 - progress * 8)}"
      >
        <span class="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <svg
          class="size-4 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    {/if}
  </div>
</div>

{#if loading && hasSheets}
  <LoadingScreen />
{/if}
