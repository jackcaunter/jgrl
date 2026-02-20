let screen_scale = 2;

let img; // Declare variable 'img'
let tileSize = 16; // Set tile size
let tileset1; // Declare tileset array
let w, h;
let c;
let tile1;

const level = [
  [0, 0, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

const collisionRect = {
  x: 32,
  y: 32,
  w: 17,
  h: 35
};
function checkTileCollision(level, collisionRect, tileSize) {
  // Convert the x and y properties of the collision rect from pixels to tile indices
  const rectX = collisionRect.x;
  const rectY = collisionRect.y;

  // Convert the width and height properties of the collision rect from pixels to the number of tiles
  const rectWidth = collisionRect.w;
  const rectHeight = collisionRect.h;

  // Iterate over the tiles within the rectangle formed by the collision rect
  for (let y = Math.floor(rectY / tileSize); y <= Math.ceil((rectY + rectHeight) / tileSize); y++) {
    for (let x = Math.floor(rectX / tileSize); x <= Math.ceil((rectX + rectWidth) / tileSize); x++) {
      // Check if the current tile is solid (1)
      if (level[y] && level[y][x] === 1) {
        // Convert the current tile's indices to pixels
        const tileX = x * tileSize;
        const tileY = y * tileSize;

        // Check if the collision rect is overlapping with the current tile
        if (rectX < tileX + tileSize && rectX + rectWidth > tileX &&
            rectY < tileY + tileSize && rectY + rectHeight > tileY) {
          return true;
        }
      }
    }
  }

  // If no solid tiles were found, return false
  return false;
}

console.log(checkTileCollision(level, collisionRect, tileSize)); // Outputs: true
















function preload() {
  img = loadImage('img/wal1.png'); // Load image
}

function setup() {
  createCanvas(320 * screen_scale, 240 * screen_scale); // Create canvas with 320 x 240 resolution
  noSmooth(); // Disable anti-aliasing

  w = ceil(img.width / tileSize) * tileSize; // Round up width to nearest multiple of tile size
  h = ceil(img.height / tileSize) * tileSize; // Round up height to nearest multiple of tile size

  tile1 = img.get(0, 0, tileSize, tileSize); // Set fill color based on pixel data

  tileset1 = new Array(w); // Initialize tileset array with rounded up width as the number of columns
  for (let i = 0; i < w; i++) {
    tileset1[i] = new Array(h); // Initialize inner array with rounded up height as the number of rows
    for (let j = 0; j < h; j++) {
      // Loop through tileset array and set tileset data.
      //tileset1[i][j] = img.get(i * tileSize, j * tileSize, tileSize, tileSize); // Set fill color based on pixel data
    }
  }


}

function draw() {
  scale(screen_scale);
  // Clear the screen
  background(64, 64, 64);
  
  // Draw the level
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      const tile = level[y][x];
      if (tile > 0) { // TODO: actually check what tile it is.
        const xPos = x * tileSize;
        const yPos = y * tileSize;
        image(tile1, xPos, yPos); // TODO: once we know what tile it is, put it in place of tile1.
      }
    }
  }

  image(tile1, 100, 80);
  
  // fill(tile1);
  // rect(132, 50, 16, 16);


  text(Math.round(frameRate()), 16, 16);
}