import { drawSentence, drawSentenceWithBlackBorder, changeFont } from './pixelFont.js';


// p5 graphics representing the pixel screen that everything in the game is drawn to
export let gameboy_graphics;


export function setupGameboyGraphics() {
  gameboy_graphics = createGraphics(globalThis.WIDTH_PIXELS, globalThis.HEIGHT_PIXELS);
  gameboy_graphics.noSmooth();
  // bind extra draw functions to this graphics object
  gameboy_graphics.drawSentence = drawSentence.bind(gameboy_graphics);
  gameboy_graphics.drawSentenceWithBlackBorder = drawSentenceWithBlackBorder.bind(gameboy_graphics);
  gameboy_graphics.changeFont = changeFont.bind(gameboy_graphics);
}



export function decreasePixelScale() {
  pixel_scale = Math.max(MIN_PIXEL_SCALE, pixel_scale - 1);
  // SAVING DATA
  localStorage.setItem("pixel_scale", pixel_scale);
  updateCanvasSizes();
}

export function increasePixelScale() {
  pixel_scale = Math.min(MAX_PIXEL_SCALE, pixel_scale + 1);
  // SAVING DATA
  localStorage.setItem("pixel_scale", pixel_scale);
  updateCanvasSizes();
}

export function updateCanvasSizes() {
  let w, h;
  w = WIDTH_PIXELS * pixel_scale;
  h = HEIGHT_PIXELS * pixel_scale;

  gameboy_graphics.resizeCanvas(WIDTH_PIXELS, HEIGHT_PIXELS);
  resizeCanvas(w, h);
}


window.windowResized = function () {
  updateCanvasSizes();
}
