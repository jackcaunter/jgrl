
/*
import { increasePixelScale, decreasePixelScale } from "./gameboyGraphics.js";

export let levelEditingMode = false;
export let levelEditorCameraX = 0;
export let levelEditorCameraY = 0;

let mouseStartDragX = 0;
let mouseStartDragY = 0;

export function toggleLevelEditingMode() {
  levelEditingMode = !levelEditingMode;
}

export function updateLevelEditor() {
  // Level editor logic

  
  if (mouseIsPressed === true && mouseButton === CENTER) {
    // Calculate the difference between the current mouse position and the initial mouse position
    const dx = winMouseX - mouseStartDragX;
    const dy = winMouseY - mouseStartDragY;

    // Update the camera offsets based on the difference in mouse position
    levelEditorCameraX = dx;
    levelEditorCameraY = dy;
  }
}

// disable the right click context menu
window.oncontextmenu = function (event) {
  event.preventDefault();
  return false;
}


window.mousePressed = function () {
  mouseStartDragX = winMouseX - levelEditorCameraX;
  mouseStartDragY = winMouseY - levelEditorCameraY;
  return false;
};


window.mouseWheel = function (event) {
  if (globalThis.debug_mode || levelEditingMode) {
    if (mouseIsPressed === true && mouseButton === CENTER) { // cancel zoom if middle mouse button is pressed
      return false;
    }
    let scrollDirectionIsUp = (event.delta < 0);
    if (scrollDirectionIsUp) {
      if (pixel_scale < MAX_PIXEL_SCALE) {
        levelEditorCameraX -= (winMouseX - levelEditorCameraX) / (pixel_scale);
        levelEditorCameraY -= (winMouseY - levelEditorCameraY) / (pixel_scale);
        increasePixelScale();
      }
    } else {
      if (pixel_scale > MIN_PIXEL_SCALE) {
        levelEditorCameraX += (winMouseX - levelEditorCameraX) / (pixel_scale);
        levelEditorCameraY += (winMouseY - levelEditorCameraY) / (pixel_scale);
        decreasePixelScale();
      }
    }
    return false;
  }
};

*/