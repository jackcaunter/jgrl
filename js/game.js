import { drawSentence, preloadPixelFont, setupPixelFont } from "./pixelFont.js";
import {
  startMeasuringFrameTime,
  finishMeasuringFrameTime,
  startMeasuringExecutionTime,
  finishMeasuringExecutionTime,
  averageFrameRate,
} from "./fpsCounter.js";
import {
  faderShader,
  preloadFaderShader,
  updateFaderShader,
  add_to_fade_level,
  set_fade_level,
} from "./faderShader.js";
import {
  gameboy_graphics as g,
  setupGameboyGraphics,
  increasePixelScale,
  decreasePixelScale,
  updateCanvasSizes,
} from "./gameboyGraphics.js";
import { instantiate_room_char_select } from "./room_02_char_select.js";
import { instantiate_room_title_screen } from "./room_01_title_screen.js";
import { instantiate_room_cutscene } from "./room_015_cutscene.js";
import { instantiate_room_cylindrical_studios } from "./room_00_cylindrical_studios.js";
import { preloadAllSprites, sounds } from "./assets.js";
import { setGlobals } from "./globals.js";
import { instantiate_room_rougelite } from "./room_03_rougelite.js";
import { instantiate_room_credits_scroll } from "./room_04_credits_scroll.js";

window.preload = function () {
  setGlobals();
  // Preload assets for all scenes
  preloadPixelFont();
  preloadFaderShader();

  preloadAllSprites();
};

window.setup = function () {
  // create the p5 graphics representing the gameboy screen
  setupGameboyGraphics();

  // create the WEBGL canvas that the scaled gameboy screen will be drawn to.
  // global scope p5 functions will be executed in this context.
  createCanvas(WIDTH_PIXELS * pixel_scale, HEIGHT_PIXELS * pixel_scale, WEBGL);
  // Disable scaling for retina screens which can create inconsistent scaling between displays
  pixelDensity(1);
  noStroke();

  updateCanvasSizes();

  setupPixelFont();

  // instantiate array that contains all entities that will be looped over each frame
  // active_entities = instantiate_room_cylindrical_studios();
  room_goto(current_room);
};

window.draw = function () {
  finishMeasuringFrameTime();
  startMeasuringFrameTime();

  updateGameLogic();
  g.resetMatrix();
  drawGameToGameboyScreen();
  drawGameboyScreenToCanvas();
};

function updateGameLogic() {
  // update all updateable entities
  active_entities
    .filter((entity) => typeof entity.update === "function")
    .forEach((entity) => {
      entity.update();
    });
  for (let i = 0; i < active_entities.length; i++) {
    const entity = active_entities[i];
    if (entity.dead === true) {
      active_entities[i] = null;
      active_entities.splice(i, 1);
      i--; //recheck;
    }
  }
}

function drawGameToGameboyScreen() {
  // Draw the current room
  if (current_room === "rm_cylindrical_studios") {
  }
  if (current_room === "rm_title_screen") {
  }

  // draw all drawable entities
  active_entities
    .filter((entity) => typeof entity.draw === "function")
    .forEach((entity) => {
      entity.draw();
    });

  // draw debug text
  if (debug_mode) {
    // g.resetMatrix();
    g.changeFont("white");
    g.drawSentenceWithBlackBorder(`debug mode on`, 0, 0);

    const fps_string = `fps: ${averageFrameRate().toFixed(2)}`;
    g.changeFont("white");
    g.drawSentenceWithBlackBorder(fps_string, 0, 12);

    g.drawSentenceWithBlackBorder(
      `x: ${Math.floor(mouseX / pixel_scale)}`,
      0,
      24,
    );
    g.drawSentenceWithBlackBorder(
      `y: ${Math.floor(mouseY / pixel_scale)}`,
      0,
      36,
    );
    g.drawSentenceWithBlackBorder(
      `xtile: ${Math.floor(mouseX / pixel_scale / 8)}`,
      0,
      48,
    );
    g.drawSentenceWithBlackBorder(
      `ytile: ${Math.floor(mouseY / pixel_scale / 8)}`,
      0,
      60,
    );
  }
}

function drawGameboyScreenToCanvas() {
  // --------------- ENTERING WEBGL LAND -----------------
  updateFaderShader(g);
  // shader() sets the active shader with our shader
  shader(faderShader);
  // rect gives us some geometry on the screen. without this, no geometry will be sent to the shader so nothing will be drawn.
  rect(1000, 1000, 10, 10);
}

window.keyPressed = function () {
  // DEVELOPMENT FUNCTION TO toggle debug mode.
  if (mode === "DEVELOPMENT") {
    if (keyCode === 68) {
      // D key
      debug_mode = !debug_mode;
    }
  }

  // TEMP FUNCTION TO TEST fade_level.
  // if (keyCode === DOWN_ARROW) {
  //   add_to_fade_level(1);
  // } else if (keyCode === UP_ARROW) {
  //   add_to_fade_level(-1);
  // }

  // keypress all keypressable entities
  active_entities
    .filter((entity) => typeof entity.keyPressed === "function")
    .forEach((entity) => {
      entity.keyPressed();
    });
};

window.keyReleased = function () {
  // keyrelease all keyreleaseable entities
  active_entities
    .filter((entity) => typeof entity.keyReleased === "function")
    .forEach((entity) => {
      entity.keyReleased();
    });
};

window.mousePressed = function () {
  // mousePress all mousePressable entities
  active_entities
    .filter((entity) => typeof entity.mousePressed === "function")
    .forEach((entity) => {
      entity.mousePressed();
    });
  return false;
};

// disable the right click context menu
window.oncontextmenu = function (event) {
  event.preventDefault();
  return false;
};

globalThis.room_goto = function (rm) {
  if (ROOMS.includes(rm)) {
    // DO STUFF WHEN LEAVING THIS ROOM LIKE MAKING SURE THE MUSIC IS OFF
    switch (current_room) {
      case "rm_cylindrical_studios":
        break;
      case "rm_title_screen":
        if (sounds.mus_title.isPlaying()) {
          sounds.mus_title.stop();
        }
        break;
      case "rm_cutscene":
        if (sounds.mus_cutscene.isPlaying()) {
          sounds.mus_cutscene.stop();
        }
        break;
      case "rm_char_select":
        if (sounds.mus_charselect.isPlaying()) {
          sounds.mus_charselect.stop();
        }
        break;
      case "rm_rougelite":
        if (globalThis.dungeon && globalThis.dungeon.rooms) {
          dungeon.rooms.forEach((room) => {
            if (!room.image) {
              return;
            }
            room.image.loadPixels();
            room.image.pixels = null;
            room.image.updatePixels();
            room.image = null;
          });
          // console.log(dungeon)
        }

        current_dungeon_room_index = 0;
        break;

      case "rm_credits_scroll":
        break;
      default:
        // Handle the default case if needed
        break;
    }

    current_room = rm;
    // Additional code to perform actions when changing rooms
    active_entities = [];
    switch (current_room) {
      case "rm_cylindrical_studios":
        active_entities = instantiate_room_cylindrical_studios();
        break;
      case "rm_title_screen":
        active_entities = instantiate_room_title_screen();
        break;
      case "rm_cutscene":
        active_entities = instantiate_room_cutscene();
        break;
      case "rm_char_select":
        if (!sounds.mus_charselect.isPlaying()) {
          sounds.mus_charselect.setVolume(mus_charselect_volume);
          sounds.mus_charselect.loop();
        }
        active_entities = instantiate_room_char_select();
        break;
      case "rm_rougelite":
        active_entities = instantiate_room_rougelite();
        break;
      case "rm_credits_scroll":
        active_entities = instantiate_room_credits_scroll();
        break;
      default:
        // Handle the default case if needed
        break;
    }
  } else {
    console.error("Room not found:", rm);
  }
};

globalThis.room_goto_next = function () {
  const currentIndex = ROOMS.indexOf(current_room);
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % ROOMS.length;
    const nextRoom = ROOMS[nextIndex];
    room_goto(nextRoom);
    // Additional code to perform actions when changing rooms
  } else {
    console.error("Invalid current room:", current_room);
  }
};

globalThis.room_goto_previous = function () {
  const currentIndex = ROOMS.indexOf(current_room);
  if (currentIndex !== -1) {
    const previousIndex = (currentIndex - 1) % ROOMS.length;
    const previousRoom = ROOMS[previousIndex];
    room_goto(previousRoom);
    // Additional code to perform actions when changing rooms
  } else {
    console.error("Invalid current room:", current_room);
  }
};
