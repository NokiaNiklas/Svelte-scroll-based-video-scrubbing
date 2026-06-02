/**
 * Small WebGL2 helper kit for the sprite-sheet scroll animation.
 * Nothing app-specific lives here — just shader/texture/canvas plumbing.
 */

export interface WebGLTextureInfo {
  texture: WebGLTexture;
  /** Natural width of the source image (the full sprite sheet). */
  width: number;
  /** Natural height of the source image. */
  height: number;
}

/** Compiles a single shader and throws with the info log on failure. */
export function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile error: ' + log);
  }

  return shader;
}

/** Links a vertex + fragment shader into a program and throws on failure. */
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create program');

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Program link error: ' + log);
  }

  return program;
}

/** Loads an image URL into a (NPOT-safe) texture and resolves with its size. */
export function loadTexture(gl: WebGL2RenderingContext, src: string): Promise<WebGLTextureInfo> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';

    image.onload = () => {
      const texture = gl.createTexture();
      if (!texture) {
        reject(new Error('Could not create texture'));
        return;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Premultiply alpha on upload so transparent sprite areas composite cleanly.
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      // No mipmaps, clamp to edge → works with any (non-power-of-two) size.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      resolve({ texture, width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => reject(new Error('Could not load image: ' + src));
    image.src = src;
  });
}

/** Frees a list of textures (called before reloading). */
export function deleteTextures(gl: WebGL2RenderingContext, textures: WebGLTextureInfo[]): void {
  for (const { texture } of textures) {
    gl.deleteTexture(texture);
  }
}

/**
 * Resizes the canvas backing store to match its displayed CSS size
 * (times `multiplier`, e.g. devicePixelRatio for crisp rendering).
 * Returns true if the size actually changed.
 */
export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier = 1): boolean {
  const width = Math.floor(canvas.clientWidth * multiplier);
  const height = Math.floor(canvas.clientHeight * multiplier);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  return false;
}

export interface FitParams {
  /** Top-left of the source sprite cell within the sheet (px). */
  sourceX: number;
  sourceY: number;
  /** Size of the source sprite cell (px). */
  sourceWidth: number;
  sourceHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Computes source/destination rectangles for drawing a sprite cell onto the
 * canvas, like CSS `object-fit`:
 * - `cover`   → fills the canvas, crops the overflow.
 * - `contain` → fits inside the canvas, letterboxes the rest.
 * Aspect ratio is preserved either way.
 */
export function calculateFitCoordinates(fit: 'cover' | 'contain', p: FitParams) {
  if (fit === 'contain') {
    const scale = Math.min(p.canvasWidth / p.sourceWidth, p.canvasHeight / p.sourceHeight);
    const destWidth = p.sourceWidth * scale;
    const destHeight = p.sourceHeight * scale;

    return {
      sourceX: p.sourceX,
      sourceY: p.sourceY,
      sourceWidth: p.sourceWidth,
      sourceHeight: p.sourceHeight,
      destinationX: (p.canvasWidth - destWidth) / 2,
      destinationY: (p.canvasHeight - destHeight) / 2,
      destinationWidth: destWidth,
      destinationHeight: destHeight,
    };
  }

  // cover
  const scale = Math.max(p.canvasWidth / p.sourceWidth, p.canvasHeight / p.sourceHeight);
  const cropWidth = p.canvasWidth / scale;
  const cropHeight = p.canvasHeight / scale;

  return {
    sourceX: p.sourceX + (p.sourceWidth - cropWidth) / 2,
    sourceY: p.sourceY + (p.sourceHeight - cropHeight) / 2,
    sourceWidth: cropWidth,
    sourceHeight: cropHeight,
    destinationX: 0,
    destinationY: 0,
    destinationWidth: p.canvasWidth,
    destinationHeight: p.canvasHeight,
  };
}
