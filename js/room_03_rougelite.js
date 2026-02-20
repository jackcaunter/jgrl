import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sounds, sprites } from "./assets.js";
import { set_fade_level, add_to_fade_level } from "./faderShader.js";
import { enemy_types } from "./enemies.js";
import { getRoomIndex, generate_dungeon } from "./dungeon_generation.js";
import { drawSentence } from "./pixelFont.js";

// -------------------------------------------------- GLOBAL SCOPE REPLACE CHAR AT ETC
globalThis.replace_char_at = function (str, index, replacement) {
  return (
    str.substr(0, index) + replacement + str.substr(index + replacement.length)
  );
};

// -------------------------------------------------- GLOBAL SCOPE NEW ROOM IMAGE

globalThis.new_room_image = function (room) {
  const room_tileset = sprites[`tiles_${room.biome}`];

  // Create a large image to hold all the tiles
  let combinedImage = createImage(
    room.tiles[0].length * TILE_SIZE,
    room.tiles.length * TILE_SIZE,
  );

  // Load all pixel data for the new combined image and tileset
  combinedImage.loadPixels();
  room_tileset.loadPixels();

  // Draw the current room full of tiles
  for (let y = 0; y < room.tiles.length; y++) {
    for (let x = 0; x < room.tiles[y].length; x++) {
      const tileChar = room.tiles[y][x];
      let sx = 0;
      let sy = 0;

      if (tileChar === "1") {
        sx = TILE_SIZE;
      } else if (tileChar === "2") {
        sx = TILE_SIZE * 2;
      } else if (tileChar === "3") {
        sx = TILE_SIZE * 3;
      }

      // Copy the tile pixels to the combined image
      for (let ty = 0; ty < TILE_SIZE; ty++) {
        for (let tx = 0; tx < TILE_SIZE; tx++) {
          const tilePixelIndex =
            ((sy + ty) * room_tileset.width + (sx + tx)) * 4;
          const combinedPixelIndex =
            ((y * TILE_SIZE + ty) * combinedImage.width + x * TILE_SIZE + tx) *
            4;
          combinedImage.pixels[combinedPixelIndex] =
            room_tileset.pixels[tilePixelIndex];
          combinedImage.pixels[combinedPixelIndex + 1] =
            room_tileset.pixels[tilePixelIndex + 1];
          combinedImage.pixels[combinedPixelIndex + 2] =
            room_tileset.pixels[tilePixelIndex + 2];
          combinedImage.pixels[combinedPixelIndex + 3] =
            room_tileset.pixels[tilePixelIndex + 3];
        }
      }
    }
  }

  // Update the pixel data for the combined image
  combinedImage.updatePixels();

  return combinedImage;
};

// -------------------------------------------------------------------------------- ROOM ROUGELITE

export function instantiate_room_rougelite() {
  globalThis.current_dungeon_room_index = 0;
  globalThis.previous_dungeon_room_index = 0;
  active_entities = [];

  globalThis.dungeon = generate_dungeon();

  // ------------------------------------------------------------------------- CREATE INSTANCES

  // ENTITY INSTANCE CREATION

  function create_damage_number(damage, x, y, col, lifetime = 60) {
    let damage_text = typeof damage === "string" ? damage : `${damage}`;
    let string_width = damage_text.split("\n")[0].length * 8;
    let count = 0;
    // let lifetime = 60;
    return {
      x: Math.min(x, ROOM_WIDTH_PIXELS - string_width),
      y: Math.max(y, 36),
      yoff: 0,
      alph: 255,
      color: col ? col : color(255),
      dead: false,
      update() {
        count++;
        if (count > lifetime - 48) {
          this.alph = Math.max(0, this.alph - 40);
        }
        if (count > lifetime) {
          this.dead = true;
        }
        this.yoff = (this.yoff * 9 - 24) / 10;
      },
      draw() {
        this.color.setAlpha(this.alph);
        g.tint(this.color);
        g.drawSentenceWithBlackBorder(
          damage_text,
          Math.floor(this.x),
          Math.floor(this.y + this.yoff),
        );
        g.tint(255);
      },
    };
  }

  function create_text_typer(text, x, y, color) {
    let full_text = text;

    return {
      x: x,
      y: y,
      text: "",
      alph: 255,
      color: color ? color : color(255),
      frame_count: 0,
      dead: false,
      update() {
        this.frame_count++;
        this.text = full_text.substring(0, this.frame_count);
      },
      draw() {
        this.color.setAlpha(this.alph);
        g.tint(this.color);
        g.drawSentenceWithBlackBorder(this.text, this.x, this.y);
        g.tint(255);
      },
    };
  }

  function create_softlock_typer() {
    let full_text = `  A VOICE CAN BE HEARD FROM ABOVE...\n\n${ch_names[selected_character]}!                       \nYOUR GONNA SOFTLOCK THE GAME\nIF YOU DONT GET THAT KEY...`;

    let my_y = 32;
    if (
      my_enemy_manager.instances.find((instance) => instance.type === "key").y <
      ROOM_HEIGHT_PIXELS / 2
    ) {
      my_y = ROOM_HEIGHT_PIXELS - 84;
    }

    return {
      type: "softlock_typer",
      x: 32,
      y: my_y,
      text: "",
      color: color(255),
      thanked: false,
      frame_count: 0,
      dead: false,
      update() {
        const prev_floored_frame_count = Math.floor(this.frame_count);
        this.frame_count += 0.33;
        const this_floored_frame_count = Math.floor(this.frame_count);

        // Fetch the current character from the substring
        const current_character = full_text[Math.floor(this.frame_count)];

        // Boolean flag to check if the current character is not a space or a newline
        const current_character_is_not_a_space_or_newline =
          current_character !== " " && current_character !== "\n";

        if (
          this.text !== full_text &&
          prev_floored_frame_count !== this_floored_frame_count &&
          current_character_is_not_a_space_or_newline
        ) {
          sounds.text_blip.play();
        }

        this.text = full_text.substring(0, Math.floor(this.frame_count));
        if (!this.thanked && my_player.key) {
          this.thanked = true;
          this.frame_count = 0;
          full_text = "          THANKS...";
          this.text = "";
        }
      },
      draw() {
        g.tint(this.color);
        g.drawSentenceWithBlackBorder(this.text, this.x, this.y);
        g.tint(255);
      },
    };
  }

  globalThis.create_textbox = function (text_array) {
    let messages = [
      `Default text.`,
      `hope you dont mind`,
      `a default text...\n...`,
      `u really shouldnt be seeing this btw....`,
    ];
    console.log("my tesxt array");
    console.log(text_array);
    if (text_array && typeof text_array[0] === "string") {
      messages = text_array;
    } else {
      console.log("FUCK");
    }
    let currentMessageIndex = 0;
    let isWaitingForInput = false;

    let my_y = HEIGHT_PIXELS - 48;

    const textbox = {
      type: "textbox",
      x: 0,
      y: my_y,
      text: "",
      color: color(255),
      frame_count: 0,
      cutscene_object: true,
      dead: false,
      update() {
        if (this.dead) return;

        if (isWaitingForInput) {
          // Here we should listen for player input, such as a keypress or mouse click,
          // to advance to the next message or do something else.
        } else {
          this.typeText();
        }
      },
      keyPressed() {
        if (KEYS_BACK.includes(keyCode)) {
          this.text = messages[currentMessageIndex];
          isWaitingForInput = true;
          this.frame_count = 0;
        }
        if (isWaitingForInput) {
          if (KEYS_AFFIRM.includes(keyCode)) {
            isWaitingForInput = false;
            this.advanceToNextMessage();
          }
        }
      },
      typeText() {
        const fullText = messages[currentMessageIndex];
        const prevFrameCount = Math.floor(this.frame_count);
        this.frame_count += 0.33;
        const currentFrameIndex = Math.floor(this.frame_count);

        if (
          prevFrameCount !== currentFrameIndex &&
          currentFrameIndex < fullText.length
        ) {
          const currentCharacter = fullText[currentFrameIndex];
          if (currentCharacter !== " " && currentCharacter !== "\n") {
            sounds.text_blip.play();
          }
        }

        this.text = fullText.substring(0, currentFrameIndex);

        if (this.text === fullText) {
          // When the current message is fully displayed, wait for input.
          isWaitingForInput = true;
          this.frame_count = 0;
        }
      },
      is_talking() {
        if (this.text === messages[currentMessageIndex]) {
          return false;
        } else {
          return true;
        }
      },
      advanceToNextMessage() {
        if (currentMessageIndex < messages.length - 1) {
          currentMessageIndex++;
          this.text = "";
          isWaitingForInput = false;
        } else {
          // All messages finished, you might want to do something here
          this.dead = true;
        }
      },
      draw() {
        // draw the TEXTBOX IMAGE
        g.image(sprites.textbox, this.x, this.y);
        g.tint(this.color);
        g.drawSentenceWithBlackBorder(this.text, this.x + 4, this.y + 5);
        g.tint(255);

        if (isWaitingForInput) {
          // Optionally draw an indicator that the user can advance the text
          g.image(
            sprites.textinput,
            this.x + WIDTH_PIXELS - 20,
            this.y + 32 + (Math.floor(frameCount / 30) % 2 === 0 ? 1 : 0),
          );
        }
      },
    };

    return textbox;
  };

  function create_gate() {
    return {
      x: 152,
      y: 8,
      width: 24,
      height: 14,
      spr: sprites.gate,
      solid: true,
      update() {
        if (
          my_player.key &&
          Math.abs(my_player.x + 4 - (this.x + this.width / 2)) < 32 &&
          Math.abs(my_player.y + 4 - (this.y + this.height / 2)) < 32
        ) {
          my_player.key = false;
          this.dead = true;
          sounds.gate_open.play();
          dungeon.rooms[current_dungeon_room_index].gate = false;
        }
      },
      draw() {
        g.image(this.spr, this.x, this.y);
      },
    };
  }

  function create_chest() {
    let create_x = 0;
    let create_y = 0;
    let create_opened = false;
    let create_item = "4shrug";
    let create_invincible = false;

    const rm = dungeon.rooms[current_dungeon_room_index];
    if (rm.chest) {
      // wow... we got a chest
    } else {
      // set rm.chest to an empty object if one doesn't exist
      rm.chest = {};
    }

    if (rm.chest?.x && rm.chest?.y) {
      create_x = rm.chest.x;
      create_y = rm.chest.y;
    } else {
      // get a random location for the chest
      let valid_location = false;

      do {
        create_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
            WALL_WIDTH_TILES +
            1,
        );
        create_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
            WALL_WIDTH_TILES +
            1,
        );
        valid_location = rm.tiles[create_y][create_x] === ".";

        if (
          Math.abs(create_x * TILE_SIZE - my_player.x) < 24 &&
          Math.abs(create_y * TILE_SIZE - my_player.y) < 24
        ) {
          valid_location = false;
        }
      } while (!valid_location);

      create_x = create_x * TILE_SIZE;
      create_y = create_y * TILE_SIZE;

      // store the chest location in rm.chest
      rm.chest.x = create_x;
      rm.chest.y = create_y;
    }

    if (rm.chest?.opened) {
      create_opened = rm.chest.opened;
    }

    if (rm.chest?.item) {
      create_item = rm.chest.item;
    } else {
      // generate a random item
      const item_types = [
        { type: "heart_capsule", probability: my_player.max_hp < 7 ? 0.2 : 0 },
        {
          type: "three_hearts",
          probability: my_player.hp < my_player.max_hp ? 0.2 : 0,
        },
        {
          type: "heart_item",
          probability: my_player.hp < my_player.max_hp ? 1.0 : 0,
        },
        {
          type: "atpquan",
          probability:
            my_player.miss_chance < 0.01 ? 0 : 0.1 + 3 * my_player.miss_chance,
        },
        { type: "bezospog", probability: 0.2 },
        { type: "hulk", probability: 0.18 },
        { type: "joysob", probability: 0.02 + my_player.miss_chance * 4 },
        {
          type: "opieop",
          probability:
            my_player.can_swim === false && rm.biome !== "cave" ? 0.05 : 0,
        },
        { type: "prayge", probability: 0.18 },
        {
          type: "sheeeesh",
          probability:
            !my_player.immune_to_lava && seen_lava && rm.biome === "cave"
              ? 0.05
              : 0,
        },
        { type: "yes", probability: 0.2 },
        { type: "zoomer", probability: 0.2 },
        {
          type: "unlock_character",
          probability:
            !globalThis.unlocked_a_character && !characterUnlocked[15]
              ? 0.08
              : 0,
        },
        { type: "4shrug", probability: 0.2 },
      ];
      // Select a random item
      const totalProbability = item_types.reduce(
        (total, item) => total + item.probability,
        0,
      );
      let randomValue = Math.random() * totalProbability;
      let selectedItem;

      for (let item of item_types) {
        randomValue -= item.probability;
        if (randomValue < 0) {
          selectedItem = item.type;
          break;
        }
      }
      create_item = selectedItem;
    }
    if (rm.chest?.invincible) {
      create_invincible = rm.chest.invincible;
    }

    if (!create_opened) {
      // play a sound upon  creation
      sounds.chest_spawn.play();
    }

    return {
      type: "chest",
      x: create_x,
      y: create_y,
      opened: create_opened,
      item: create_item,
      invincible: create_invincible,
      width: 8,
      height: 8,

      z: 0,
      airtime_frames: 45,
      airtime_apex_height: -40,
      frame_count: 0,

      spr: sprites.chest8,
      solid: true,

      update() {
        // bounce up a lil upon creation
        if (this.opened) {
          this.invincible = true;
          return;
        }
        if (this.frame_count < this.airtime_frames) {
          this.invincible = true;
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.z = 0;
          this.invincible = false;
        }
      },
      get_hit(damage, angle) {
        sounds.chest_open.play();

        // pop out my item
        if (this.item === "4shrug") {
          my_enemy_manager.instances.push(create_4shrug(this.x, this.y));
        }
        if (this.item === "arnoldproceed") {
          my_enemy_manager.instances.push(create_arnoldproceed(this.x, this.y));
        }
        if (this.item === "atpquan") {
          my_enemy_manager.instances.push(create_atpquan(this.x, this.y));
        }
        if (this.item === "bezospog") {
          my_enemy_manager.instances.push(create_bezospog(this.x, this.y));
        }
        if (this.item === "hulk") {
          my_enemy_manager.instances.push(create_hulk(this.x, this.y));
        }
        if (this.item === "joysob") {
          my_enemy_manager.instances.push(create_joysob(this.x, this.y));
        }
        if (this.item === "opieop") {
          my_enemy_manager.instances.push(create_opieop(this.x, this.y));
        }
        if (this.item === "prayge") {
          my_enemy_manager.instances.push(create_prayge(this.x, this.y));
        }
        if (this.item === "sheeeesh") {
          my_enemy_manager.instances.push(create_sheeeesh(this.x, this.y));
        }
        if (this.item === "zoomer") {
          my_enemy_manager.instances.push(create_zoomer(this.x, this.y));
        }
        if (this.item === "yes") {
          my_enemy_manager.instances.push(create_yes(this.x, this.y));
        }
        if (this.item === "unlock_character") {
          my_enemy_manager.instances.push(
            create_unlock_character(this.x, this.y),
          );
        }
        if (this.item === "heart_capsule") {
          my_enemy_manager.instances.push(create_heart_capsule(this.x, this.y));
        }
        if (this.item === "three_hearts") {
          my_enemy_manager.instances.push(create_heart_item(this.x, this.y));
          my_enemy_manager.instances.push(create_heart_item(this.x, this.y));
          my_enemy_manager.instances.push(create_heart_item(this.x, this.y));
        }
        if (this.item === "heart_item") {
          my_enemy_manager.instances.push(create_heart_item(this.x, this.y));
        }
        if (this.item === "key") {
          sounds.spawn_key.play();
          my_enemy_manager.instances.push(create_key(this.x, this.y));
        }

        this.opened = true;
        rm.chest.opened = true;
        this.item = "";
        rm.chest.item = "";
        this.invincible = true;
        rm.chest.invincible = true;
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x;
        const offset_y = this.y + 6;
        g.rect(offset_x + 1, offset_y + 1, 6, 2);
        g.rect(offset_x, offset_y, 8, 4);

        let sprite_x = this.opened ? 8 : 0;
        g.image(this.spr, this.x, this.y + this.z, 8, 8, sprite_x, 0, 8, 8);
      },
    };
  }

  function create_heart_capsule(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 1) * TILE_SIZE;

    return {
      type: "heart_capsule",
      x: x - 10,
      y: y - 12,
      start_x: x - 10,
      start_y: y - 12,
      target_x: target_x,
      target_y: target_y,
      width: 20,
      height: 12,
      spr: sprites.heart_capsule,
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup01.play();
        my_enemy_manager.instances.push(
          create_damage_number(`HP UP!`, this.target_x, this.target_y),
        );
        my_player.max_hp++;
        my_player.hp++;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 12;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_4shrug(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "4shrug",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["4shrug"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.fart.play();
        my_enemy_manager.instances.push(
          create_damage_number(`+NOTHING`, this.target_x, this.target_y),
        );
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_arnoldproceed(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "arnoldproceed",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["arnoldproceed"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.fart.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `yea u won.`,
            this.target_x,
            this.target_y,
            color(255, 255, 255),
            150,
          ),
        );
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }
  function create_atpquan(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "atpquan",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["atpquan"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup02.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `LOCKED IN!\nACCURACY UP!`,
            Math.min(this.target_x, 210),
            this.target_y,
            color(255),
            100,
          ),
        );
        my_player.miss_chance = 0;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_bezospog(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "bezospog",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["bezospog"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup02.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `RANGE UP!`,
            this.target_x,
            this.target_y,
            color(255),
            80,
          ),
        );
        my_player.range_level++;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_hulk(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "hulk",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["hulk"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup02.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `ATTACK UP!`,
            this.target_x,
            this.target_y,
            color(255),
            80,
          ),
        );
        my_player.damage_level++;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }
  function create_joysob(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];

    target_x = my_player.x - 12;
    target_y = my_player.y - 12;

    return {
      type: "joysob",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["joysob"],
      airtime_frames: 145,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.fart.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `IT'S JOEVER!\nACCURACY DOWN!`,
            Math.min(this.x, ROOM_WIDTH_PIXELS - 130),
            Math.max(this.y - 16, 60),
            color(255),
            110,
          ),
        );
        my_player.miss_chance += Math.random() * 0.3 + 0.2;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          this.target_x = my_player.x - 12;
          this.target_y = my_player.y - 12;
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = my_player.x;
          this.y = my_player.y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_opieop(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "opieop",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["opieop"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup04.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `    BMI UP!      \n(NOW U CAN SWIM)`,
            this.target_x,
            this.target_y,
            color(255),
            160,
          ),
          120,
        );
        my_player.can_swim = true;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_prayge(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "prayge",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["prayge"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup04.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `LUCK UP!`,
            this.target_x,
            this.target_y,
            color(255),
            100,
          ),
          140,
        );
        my_player.luc++;
        my_player.crit_chance += 0.04;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }
  function create_sheeeesh(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "sheeeesh",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["sheeeesh"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup04.play();
        my_enemy_manager.instances.push(
          create_damage_number(
            `UR TOO HOT TO HANDLE!\n(IMMUNE TO LAVA)`,
            this.target_x,
            this.target_y,
            color(255),
            150,
          ),
          140,
        );
        my_player.immune_to_lava = true;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_yes(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "yes",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["yes"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup03.play();
        my_player.defence_level++;
        my_enemy_manager.instances.push(
          create_damage_number(
            `DEFENCE UP!`,
            this.target_x,
            this.target_y,
            color(255),
            80,
          ),
        );
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_zoomer(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "zoomer",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 24,
      height: 24,
      spr: sprites["zoomer"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.powerup05.play();
        // my_player.max_spd = my_player.max_spd + 0.5;
        my_player.speed_level++;
        my_enemy_manager.instances.push(
          create_damage_number(
            `ATTACK SPEED UP!`,
            this.target_x,
            this.target_y,
            color(255),
            110,
          ),
        );
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 24;
        g.rect(offset_x - 9, offset_y - 3, 18, 6);
        g.rect(offset_x - 10, offset_y - 2, 20, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_unlock_character(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = (target_x - 1) * TILE_SIZE;
    target_y = (target_y - 2) * TILE_SIZE;

    return {
      type: "unlock_character",
      x: x - 8,
      y: y - 24,
      start_x: x - 8,
      start_y: y - 24,
      target_x: target_x,
      target_y: target_y,
      width: 36,
      height: 36,
      spr: sprites["sprite_IC_locked"],
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        // play collectible sound
        sounds.collectible01.play();
        globalThis.unlocked_a_character = true;
        localStorage.setItem("unlocked_a_character", "true");
        unlockNext4Characters();
        my_enemy_manager.instances.push(
          create_damage_number(
            `NEW CHARACTERS UNLOCKED!`,
            this.target_x,
            this.target_y,
            color(255),
            110,
          ),
        );
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x + 10;
        const offset_y = this.y + 36;
        g.rect(offset_x - 9, offset_y - 3, 34, 6);
        g.rect(offset_x - 10, offset_y - 2, 36, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_heart_item(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = target_x * TILE_SIZE;
    target_y = target_y * TILE_SIZE;

    return {
      type: "heart",
      x: x,
      y: y,
      start_x: x,
      start_y: y,
      target_x: target_x,
      target_y: target_y,
      width: 8,
      height: 8,
      spr: sprites.heart,
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        this.dead = true;
        if (my_player.hp >= my_player.max_hp) {
          my_player.hp = my_player.max_hp;
          return;
        }
        my_player.hp = Math.min(my_player.hp + 1, my_player.max_hp);
        sounds.collectible06.play();
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x;
        const offset_y = this.y + 4;
        g.rect(offset_x + 1, offset_y + 1, 6, 2);
        g.rect(offset_x, offset_y, 8, 4);

        g.image(this.spr, this.x, this.y + this.z, 8, 8, true ? 8 : 0, 0, 8, 8);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function create_key(x, y) {
    let target_x;
    let target_y;

    const rm = dungeon.rooms[current_dungeon_room_index];
    let valid_location = false;

    do {
      target_x = Math.floor(
        Math.random() * (ROOM_WIDTH_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      target_y = Math.floor(
        Math.random() * (ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES * 2 + 2)) +
          WALL_WIDTH_TILES +
          1,
      );
      valid_location = rm.tiles[target_y][target_x] === ".";

      if (
        Math.abs(target_x * TILE_SIZE - my_player.x) < 24 &&
        Math.abs(target_y * TILE_SIZE - my_player.y) < 24
      ) {
        valid_location = false;
      }
    } while (!valid_location);

    target_x = target_x * TILE_SIZE;
    target_y = target_y * TILE_SIZE;

    return {
      type: "key",
      x: x,
      y: y,
      start_x: x,
      start_y: y,
      target_x: target_x,
      target_y: target_y,
      width: 8,
      height: 8,
      spr: sprites.key,
      airtime_frames: 45,
      airtime_apex_height: -40,
      collectible: false,
      frame_count: 0,
      get_collected() {
        sounds.collectible02.play();
        my_player.key = true;
        this.dead = true;
      },
      update() {
        if (this.frame_count < this.airtime_frames) {
          // Calculate interpolation factor between 0 and 1
          var t = this.frame_count / this.airtime_frames;

          // Calculate the difference in x and y values
          var xDist = this.target_x - this.start_x;
          var yDist = this.target_y - this.start_y;

          // Adjust x and y according to linear interpolation
          this.x = this.start_x + xDist * t;
          this.y = this.start_y + yDist * t;

          // Adjust z according to parabolic path
          this.z =
            this.airtime_apex_height -
            4 * this.airtime_apex_height * (t - 0.5) * (t - 0.5);

          this.frame_count++;
        } else {
          this.x = target_x;
          this.y = target_y;
          this.z = 0;
          this.collectible = true;
        }
      },
      draw() {
        // shadow
        g.noStroke();
        g.fill(0, 0, 0, 32);
        const offset_x = this.x;
        const offset_y = this.y + 4;
        g.rect(offset_x + 1, offset_y + 1, 6, 2);
        g.rect(offset_x, offset_y, 8, 4);

        g.image(this.spr, this.x, this.y + this.z);

        if (debug_mode) {
          g.fill(255, 255, 0, 128);
          g.noStroke();
          g.rect(this.x, this.y, this.width, this.height);
        }
      },
    };
  }

  function close_room_exits(rm) {
    if (rm.exits.includes("north")) {
      rm.tiles[0] = replace_char_at(rm.tiles[0], 19, "333");
    }
    if (rm.exits.includes("south")) {
      rm.tiles[ROOM_HEIGHT_TILES - 1] = replace_char_at(
        rm.tiles[ROOM_HEIGHT_TILES - 1],
        19,
        "333",
      );
    }
    if (rm.exits.includes("west")) {
      rm.tiles[11] = replace_char_at(rm.tiles[11], 0, "3");
      rm.tiles[12] = replace_char_at(rm.tiles[12], 0, "3");
      rm.tiles[13] = replace_char_at(rm.tiles[13], 0, "3");
    }
    if (rm.exits.includes("east")) {
      rm.tiles[11] = replace_char_at(rm.tiles[11], ROOM_WIDTH_TILES - 1, "3");
      rm.tiles[12] = replace_char_at(rm.tiles[12], ROOM_WIDTH_TILES - 1, "3");
      rm.tiles[13] = replace_char_at(rm.tiles[13], ROOM_WIDTH_TILES - 1, "3");
    }
    rm.image = new_room_image(rm);
  }

  function open_room_exits(rm) {
    if (rm.cleared) {
      if (rm.exits.includes("north")) {
        rm.tiles[0] = replace_char_at(rm.tiles[0], 19, "...");
      }
      if (rm.exits.includes("south")) {
        rm.tiles[ROOM_HEIGHT_TILES - 1] = replace_char_at(
          rm.tiles[ROOM_HEIGHT_TILES - 1],
          19,
          "...",
        );
      }
      if (rm.exits.includes("west")) {
        rm.tiles[11] = replace_char_at(rm.tiles[11], 0, ".");
        rm.tiles[12] = replace_char_at(rm.tiles[12], 0, ".");
        rm.tiles[13] = replace_char_at(rm.tiles[13], 0, ".");
      }
      if (rm.exits.includes("east")) {
        rm.tiles[11] = replace_char_at(rm.tiles[11], ROOM_WIDTH_TILES - 1, ".");
        rm.tiles[12] = replace_char_at(rm.tiles[12], ROOM_WIDTH_TILES - 1, ".");
        rm.tiles[13] = replace_char_at(rm.tiles[13], ROOM_WIDTH_TILES - 1, ".");
      }
      rm.image = new_room_image(rm);
    }
  }

  // ------------------------------------------------------------ BACKGROUND TILE DRAWER
  let room_transitioning = false;
  let room_transition_direction = -1;
  let room1_xoff = 0;
  let room1_yoff = 0;
  let room2_xoff = 0;
  let room2_yoff = 0;

  active_entities.push(
    (() => {
      // closures etc

      function draw_room_image(x, y, room) {
        // Draw the room image to the screen
        if (room.image) {
          g.image(room.image, x, y);
        }
      }

      function complete_switch_room() {
        room_transitioning = false;
        room1_xoff = 0;
        room1_yoff = 0;
        room2_xoff = 0;
        room2_yoff = 0;

        // put the player at the correct place
        const inset = 20;
        switch (room_transition_direction) {
          case "east":
            my_player.x = inset - TILE_SIZE;
            break;
          case "west":
            my_player.x = ROOM_WIDTH_PIXELS - inset;
            break;
          case "south":
            my_player.y = inset - TILE_SIZE;
            break;
          case "north":
            my_player.y = ROOM_HEIGHT_PIXELS - inset;
            break;
        }

        // spawn enemies for the room and stuff
        const new_current_rm = dungeon.rooms[current_dungeon_room_index];
        const clearedRoomCount = dungeon.rooms.filter(
          (room) => room.biome === new_current_rm.biome && room.cleared,
        ).length;
        console.log(
          `we cleared ${clearedRoomCount} in biome ${new_current_rm.biome}`,
        );

        if (new_current_rm.enemy_room && !new_current_rm.cleared) {
          new_current_rm.enemy_spawns = generateEnemySpawnsForRoom(
            new_current_rm,
            clearedRoomCount,
          );
          new_current_rm.enemy_spawns.forEach((enemy_spawn) => {
            my_enemy_manager.enemies.push(
              find_enemy_by_type(enemy_spawn.type).new_instance(
                enemy_spawn.x * TILE_SIZE,
                enemy_spawn.y * TILE_SIZE,
              ),
            );
          });
        }

        // win if its the win room
        if (new_current_rm.win_room) {
          my_enemy_manager.enemies.push(
            find_enemy_by_type("4head").new_instance(
              ROOM_WIDTH_PIXELS / 2 - 8,
              60,
            ),
          );
          my_enemy_manager.instances.push(
            create_textbox([
              `wow! ${ch_names[selected_character]}! u did it!`,
              `ibdw is defeated even\nthough he had so much ire!`,
              `the isle of joe, is under the rule of ibdw no\nmore.`,
              `and, you won!!! concragolations!! wooooooooooooo\nooooo ooo o o oo oo ooo o oo `,
            ]),
          );
        }

        // spawn the gate if theres a gate
        if (new_current_rm.gate) {
          my_enemy_manager.instances.push(create_gate());
        }
        // spawn the chest if theres a chest
        if (new_current_rm?.chest?.x && new_current_rm?.chest?.y) {
          my_enemy_manager.instances.push(create_chest());
        }

        // make the doors close
        if (
          new_current_rm.enemy_spawns &&
          new_current_rm.enemy_spawns.length > 0 &&
          !new_current_rm.cleared
        ) {
          close_room_exits(new_current_rm);
        }

        // seen_lava if we seen the lava
        if (new_current_rm.biome === "cave" && new_current_rm.pond) {
          seen_lava = true;
          localStorage.setItem("seen_lava", "true");
        }

        // play music
        let should_play_music = true;
        // if (new_current_rm.boss_room) {
        //   if (!sounds.mus_boss_pregame.isPlaying()) {
        //     sounds.mus_boss_pregame.setVolume(mus_boss_pregame_volume);
        //     sounds.mus_boss_pregame.loop();
        //   }
        //   should_play_music = false;
        // }
        if (new_current_rm.boss_room) {
          should_play_music = false;
        }

        if (should_play_music) {
          sounds.mus_boss.stop();
          sounds.mus_final_boss.stop();
          sounds.mus_boss_pregame.stop();
          sounds.mus_boss_blowing_up.stop();
          switch (new_current_rm.biome) {
            case "grassland":
              if (!sounds.mus_overworld.isPlaying()) {
                sounds.mus_overworld.setVolume(mus_overworld_volume);
                sounds.mus_overworld.loop();
              }
              break;
            case "cave":
              if (!sounds.mus_cave.isPlaying()) {
                sounds.mus_cave.setVolume(mus_cave_volume);
                sounds.mus_cave.loop();
              }
              break;
            case "castle":
              if (!sounds.mus_castle.isPlaying()) {
                sounds.mus_castle.setVolume(mus_castle_volume);
                sounds.mus_castle.loop();
              }
              break;
          }
        }
      }

      return {
        fade_timer: 0,
        draw() {
          this.fade_timer++;
          if (this.fade_timer < 90 && frameCount % 4 === 0) {
            add_to_fade_level(-1);
            // TODO: this will destroy the fade if we ever try to fade
          }

          g.background(0);
          if (room_transitioning) {
            switch (room_transition_direction) {
              case "north":
                room1_yoff += ROOM_TRANSITION_YSPEED;
                room2_yoff += ROOM_TRANSITION_YSPEED;
                if (room1_yoff >= ROOM_HEIGHT_PIXELS) {
                  complete_switch_room();
                }
                break;
              case "south":
                room1_yoff -= ROOM_TRANSITION_YSPEED;
                room2_yoff -= ROOM_TRANSITION_YSPEED;
                if (room1_yoff <= -ROOM_HEIGHT_PIXELS) {
                  complete_switch_room();
                }
                break;
              case "east":
                room1_xoff -= ROOM_TRANSITION_XSPEED;
                room2_xoff -= ROOM_TRANSITION_XSPEED;
                if (room1_xoff <= -ROOM_WIDTH_PIXELS) {
                  complete_switch_room();
                }
                break;
              case "west":
                room1_xoff += ROOM_TRANSITION_XSPEED;
                room2_xoff += ROOM_TRANSITION_XSPEED;
                if (room1_xoff >= ROOM_WIDTH_PIXELS) {
                  complete_switch_room();
                }
                break;
            }

            draw_room_image(
              room1_xoff,
              room1_yoff,
              dungeon.rooms[previous_dungeon_room_index],
            );
            draw_room_image(
              room2_xoff,
              room2_yoff,
              dungeon.rooms[current_dungeon_room_index],
            );
          } else {
            draw_room_image(0, 0, dungeon.rooms[current_dungeon_room_index]);
          }
        },
      };
    })(),
  );

  // --------------------------------------------------------------------- PLAYER

  globalThis.my_player = (() => {
    //private vars
    // let max_spd = 3;
    // let base_spd_acc = 0.5;
    // let spd_acc = 0.5;
    // let spd_dec = 0.8;
    // let xspd = 0;
    // let yspd = 0;

    // let text = `TRY THE ARROW KEYS`;
    let text = ``;
    let sword_swingin = false;
    let sword_swingin_timer = 0;
    let sword_swing_frame = 0;
    let last_sword_swing_sound = 0;

    const HALF_PLAYER_WIDTH = 4;
    const BASE_HITBOX_SIZE = 8;
    const RANGE_MULTIPLIER = 4;

    let keysPressed = [];

    function create_sword_attack_hitbox(attack_direction) {
      const missed = Math.random() < my_player.miss_chance ? true : false;
      const critted =
        !missed && Math.random() < my_player.crit_chance ? true : false;
      let damagecalc = my_player.damage_level * 0.5 + 0.5;
      if (critted) {
        damagecalc = damagecalc * 3;
      }
      if (missed) {
        damagecalc = 0;
      }
      let hitbox = {
        id: Math.floor(Math.random() * 1000000),
        // x: -16 + 4,
        // y: -16 + 4,
        // width: 32,
        // height: 32,
        x:
          HALF_PLAYER_WIDTH -
          (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER),
        y:
          HALF_PLAYER_WIDTH -
          (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER),
        width:
          (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER) * 2,
        height:
          (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER) * 2,
        damage: damagecalc,
        miss: missed,
        critical: critted,
      };

      switch (attack_direction) {
        case "north":
          hitbox.y -=
            -HALF_PLAYER_WIDTH +
            (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER);
          break;
        case "east":
          hitbox.x +=
            -HALF_PLAYER_WIDTH +
            (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER);
          break;
        case "south":
          hitbox.y +=
            -HALF_PLAYER_WIDTH +
            (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER);
          break;
        case "west":
          hitbox.x -=
            -HALF_PLAYER_WIDTH +
            (BASE_HITBOX_SIZE + my_player.range_level * RANGE_MULTIPLIER);
          break;
        default:
          // Handle invalid attack_direction value
          console.error("Invalid attack direction:", attack_direction);
          break;
      }

      return hitbox;
    }

    return {
      type: "lol_guy",
      spr: sprites.sprite_lol,
      x: 72,
      y: 128,
      width: 8,
      height: 8,
      hp: selected_character === 15 ? 5 : selected_character === 10 ? 2 : 3, //pokimane +hp, tony -hp
      max_hp: selected_character === 15 ? 5 : selected_character === 10 ? 2 : 3, //pokimane +hp, tony -hp

      max_spd: 2,
      prev_max_spd: 2,
      base_spd_acc: 0.5,
      spd_acc: 0.5,
      spd_dec: 0.8,
      xspd: 0,
      yspd: 0,

      damage_level:
        selected_character === 13 ? 3 : selected_character === 9 ? 2 : 1, // kratos bigger jordo big ATTACK
      range_level: selected_character === 12 ? 4 : 2, // marth big sword range
      defence_level: selected_character === 8 ? 1 : 0, //joegan defense
      speed_level: selected_character === 14 ? 3 : 1, // michael mf jackson big speed
      luc: selected_character === 4 ? 2 : 1, // brew monkey luck
      crit_chance: selected_character === 4 ? 0.01 + 0.04 : 0.01, // brew monkey luck
      miss_chance:
        selected_character === 5
          ? 0.01
          : selected_character === 11
            ? 0.0
            : 0.02, //ndgt +1 acc, stephen bonnell +2 acc
      hit_direction: 0,
      hit_spd: 0,
      wanna_attack: 0,
      WANNA_ATTACK_BUFFER: 5,
      swing_cooldown_timer: 0,
      invincible_timer: 0,
      direction: "east",
      attack_direction: "east",
      attack_hitboxes: [],
      can_swim: false,
      immune_to_lava: false,
      dead: false,
      checkCollision(x, y) {
        if (globalThis.debug_mode) {
          return false;
        }
        // TODO: generalize this so the mowers can use it too
        const grid = dungeon.rooms[current_dungeon_room_index].tiles;

        // Calculate start and end indices for both x and y axis
        const startX = Math.floor(x / TILE_SIZE);
        const startY = Math.floor(y / TILE_SIZE);
        const endX = Math.ceil((x + this.width) / TILE_SIZE);
        const endY = Math.ceil((y + this.height) / TILE_SIZE);

        // Ensure indices are within grid bounds
        const checkedStartX = Math.max(0, startX);
        const checkedStartY = Math.max(0, startY);
        const checkedEndX = Math.min(grid[0].length, endX);
        const checkedEndY = Math.min(grid.length, endY);

        for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
          for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
            if (
              grid[tile_y][tile_x] === "." ||
              (this.can_swim && grid[tile_y][tile_x] === "2") ||
              (dungeon.rooms[current_dungeon_room_index].biome === "cave" &&
                grid[tile_y][tile_x] === "2")
            ) {
              continue;
            }
            const wall_x = tile_x * TILE_SIZE;
            const wall_y = tile_y * TILE_SIZE;

            if (
              x < wall_x + TILE_SIZE &&
              x + this.width > wall_x &&
              y < wall_y + TILE_SIZE &&
              y + this.height > wall_y
            ) {
              return true;
            }
          }
        }

        // now that we've checked all the tiles, le'ts check all the instances in the room handled by my_enemy_manager
        for (let i = 0; i < my_enemy_manager.instances.length; i++) {
          const other = my_enemy_manager.instances[i];
          if (other === this) {
            continue;
          }
          if (!other.solid) {
            continue;
          }
          if (!(other.width && other.height)) {
            continue;
          }
          // now we have confirmed that this entity is one we should be checking collisions against
          if (
            x < other.x + other.width &&
            x + this.width > other.x &&
            y < other.y + other.height &&
            y + this.height > other.y
          ) {
            return true;
          }
        }

        return false;
      },
      checkCollisionWithLava(x, y) {
        if (globalThis.debug_mode) {
          return false;
        }
        if (dungeon.rooms[current_dungeon_room_index].biome !== "cave") {
          return false;
        }
        const grid = dungeon.rooms[current_dungeon_room_index].tiles;

        // Calculate start and end indices for both x and y axis
        const startX = Math.floor(x / TILE_SIZE);
        const startY = Math.floor(y / TILE_SIZE);
        const endX = Math.ceil((x + this.width) / TILE_SIZE);
        const endY = Math.ceil((y + this.height) / TILE_SIZE);

        // Ensure indices are within grid bounds
        const checkedStartX = Math.max(0, startX);
        const checkedStartY = Math.max(0, startY);
        const checkedEndX = Math.min(grid[0].length, endX);
        const checkedEndY = Math.min(grid.length, endY);

        for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
          for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
            if (grid[tile_y][tile_x] !== "2") {
              continue;
            }
            const wall_x = tile_x * TILE_SIZE;
            const wall_y = tile_y * TILE_SIZE;

            if (
              x < wall_x + TILE_SIZE &&
              x + this.width > wall_x &&
              y < wall_y + TILE_SIZE &&
              y + this.height > wall_y
            ) {
              return true;
            }
          }
        }

        return false;
      },
      die() {
        if (this.dead) {
          return;
        }
        this.dead = true;
        onDeath();
        create_deathscreen();
      },
      get_hit(damage, angle) {
        if (this.dead) {
          return;
        }
        let actual_damage = Math.max(0.5, damage - this.defence_level * 0.5);
        if (debug_mode) {
          actual_damage = 0;
        }

        this.hp -= actual_damage;
        active_entities.push(
          create_damage_number(
            -actual_damage,
            this.x,
            this.y,
            color(255, 0, 0),
          ),
        );

        if (this.hp <= 0) {
          this.die();
          return;
        }
        this.hit_direction = angle;
        this.hit_spd = 4;
        this.xspd = 0;
        this.yspd = 0;
        this.invincible_timer = 60;
        sounds.player_get_hit.play();
      },
      update() {
        if (this.dead) {
          return;
        }
        if (room_transitioning) {
          this.xspd = 0;
          this.yspd = 0;
          // put the player at the correct place
          switch (room_transition_direction) {
            case "east":
              this.x -= ROOM_TRANSITION_XSPEED + 0;
              break;
            case "west":
              this.x += ROOM_TRANSITION_XSPEED + 0;
              break;
            case "south":
              this.y -= ROOM_TRANSITION_YSPEED + 0;
              break;
            case "north":
              this.y += ROOM_TRANSITION_YSPEED + 0;
              break;
          }
          return;
        }
        if (
          my_enemy_manager.instances.find((instance) => {
            return instance.cutscene_object === true;
          })
        ) {
          sword_swingin = false;
          sword_swingin_timer = 0;
          sword_swing_frame = 0;
          this.attack_hitboxes = [];
          return;
        }

        if (
          my_enemy_manager.enemies.find((instance) => {
            return instance.type === "4head";
          })
        ) {
          this.xspd = 0;
          this.yspd = 0;
          console.log("4headeda");
          sword_swingin = false;
          sword_swingin_timer = 0;
          sword_swing_frame = 0;
          this.attack_hitboxes = [];
          return;
        }

        const boss_instance = my_enemy_manager.enemies.find((enemy) => {
          return enemy.boss === true;
        });
        if (boss_instance) {
          // we in da boss room
          switch (boss_instance.phase) {
            case `spawned`:
              if (boss_instance.frame_count < 30) {
                return;
              }
              if (
                !my_enemy_manager.instances.find((instance) => {
                  return instance.type === `textbox`;
                })
              ) {
                console.log(boss_instance);
                console.log(boss_instance.pregame_text);
                my_enemy_manager.instances.push(
                  create_textbox(boss_instance.pregame_text),
                );
                sounds.mus_boss_pregame.setVolume(mus_boss_pregame_volume);
                sounds.mus_boss_pregame.loop();
                boss_instance.phase = `pregame`;
                return;
              }
              return;
            case `pregame`:
              if (
                !my_enemy_manager.instances.find((instance) => {
                  return instance.type === `textbox`;
                })
              ) {
                boss_instance.phase = `health_load`;
                boss_instance.frame_count = 0;
                sounds.mus_boss_pregame.stop();
                if (boss_instance.final_boss === true) {
                  sounds.mus_final_boss.setVolume(mus_final_boss_volume);
                  sounds.mus_final_boss.loop();
                } else {
                  sounds.mus_boss.setVolume(mus_boss_volume);
                  sounds.mus_boss.loop();
                }
                break;
              }
              return;
            case `health_load`:
              // if (boss_instance.frame_count < 90) {
              //   return;
              // }
              return;
            // case `dying_cutscene`:
            //   return;
          }
        }

        if (this.max_spd !== 10) {
          this.prev_max_spd = this.max_spd;
        }

        if (debug_mode) {
          this.max_spd = 10;
          this.hp = this.max_hp;
        } else {
          this.max_spd = this.prev_max_spd;
        }

        // invincibility
        this.invincible_timer--;
        if (this.invincible_timer >= 40) {
          this.spd_acc = 0;
        } else if (this.invincible_timer > 0) {
          this.spd_acc =
            ((40 - this.invincible_timer) / 40) * this.base_spd_acc;
        } else {
          this.invincible_timer = 0;
          this.spd_acc = this.base_spd_acc;
        }
        if (this.hit_spd > 0) {
          // split spd into x and y components
          let hit_xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
          let hit_yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
          this.apply_speed(hit_xspd, hit_yspd);
          this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
        }

        // PREVENT KEY SOFTLOCK
        if (
          !this.key &&
          my_enemy_manager.instances.some((instance) => instance.type === "key")
        ) {
          if (this.x >= ROOM_WIDTH_PIXELS - TILE_SIZE * 2) {
            this.x = ROOM_WIDTH_PIXELS - TILE_SIZE * 2;
            if (
              !my_enemy_manager.instances.some(
                (instance) => instance.type === "softlock_typer",
              )
            ) {
              my_enemy_manager.instances.push(create_softlock_typer());
            }
          }
          if (this.x <= TILE_SIZE) {
            this.x = TILE_SIZE;
            if (
              !my_enemy_manager.instances.some(
                (instance) => instance.type === "softlock_typer",
              )
            ) {
              my_enemy_manager.instances.push(create_softlock_typer());
            }
          }
          if (this.y >= ROOM_HEIGHT_PIXELS - TILE_SIZE * 2) {
            this.y = ROOM_HEIGHT_PIXELS - TILE_SIZE * 2;
            if (
              !my_enemy_manager.instances.some(
                (instance) => instance.type === "softlock_typer",
              )
            ) {
              my_enemy_manager.instances.push(create_softlock_typer());
            }
          }
          if (this.y <= TILE_SIZE) {
            this.y = TILE_SIZE;
            if (
              !my_enemy_manager.instances.some(
                (instance) => instance.type === "softlock_typer",
              )
            ) {
              my_enemy_manager.instances.push(create_softlock_typer());
            }
          }
        }

        // Switch room if outside room boundaries
        const rm = dungeon.rooms[current_dungeon_room_index];
        if (this.x >= ROOM_WIDTH_PIXELS - this.max_spd) {
          const desired_rm_index = getRoomIndex(dungeon.rooms, rm.x + 1, rm.y);
          if (desired_rm_index !== -1) {
            room_transition_direction = "east";
            switch_room(desired_rm_index);
            this.xspd = 0;
            this.yspd = 0;
            return;
          }
        }
        if (this.x <= -TILE_SIZE + this.max_spd) {
          const desired_rm_index = getRoomIndex(dungeon.rooms, rm.x - 1, rm.y);
          if (desired_rm_index !== -1) {
            room_transition_direction = "west";
            switch_room(desired_rm_index);
            this.xspd = 0;
            this.yspd = 0;
            return;
          }
        }
        if (this.y >= ROOM_HEIGHT_PIXELS - this.max_spd) {
          const desired_rm_index = getRoomIndex(dungeon.rooms, rm.x, rm.y + 1);
          if (desired_rm_index !== -1) {
            room_transition_direction = "south";
            switch_room(desired_rm_index);
            this.xspd = 0;
            this.yspd = 0;
            return;
          }
        }
        if (this.y <= -TILE_SIZE + this.max_spd) {
          const desired_rm_index = getRoomIndex(dungeon.rooms, rm.x, rm.y - 1);
          if (desired_rm_index !== -1) {
            room_transition_direction = "north";
            switch_room(desired_rm_index);
            this.xspd = 0;
            this.yspd = 0;
            return;
          }
        }

        // get input
        const horizontal_input =
          (keyIsDown(RIGHT_ARROW) ? 1 : 0) - (keyIsDown(LEFT_ARROW) ? 1 : 0);
        const vertical_input =
          (keyIsDown(DOWN_ARROW) ? 1 : 0) - (keyIsDown(UP_ARROW) ? 1 : 0);

        // decelerate
        if (horizontal_input !== 1 && this.xspd > 0) {
          this.xspd = Math.max(0, this.xspd - this.spd_dec);
        }
        if (horizontal_input !== -1 && this.xspd < 0) {
          this.xspd = Math.min(0, this.xspd + this.spd_dec);
        }
        if (vertical_input !== 1 && this.yspd > 0) {
          this.yspd = Math.max(0, this.yspd - this.spd_dec);
        }
        if (vertical_input !== -1 && this.yspd < 0) {
          this.yspd = Math.min(0, this.yspd + this.spd_dec);
        }

        // accelerate
        if (horizontal_input === -1) {
          text = ``;
          this.xspd = Math.max(-this.max_spd, this.xspd - this.spd_acc);
        }
        if (horizontal_input === 1) {
          text = ``;
          this.xspd = Math.min(this.max_spd, this.xspd + this.spd_acc);
        }
        if (vertical_input === -1) {
          text = ``;
          this.yspd = Math.max(-this.max_spd, this.yspd - this.spd_acc);
        }
        if (vertical_input === 1) {
          text = ``;
          this.yspd = Math.min(this.max_spd, this.yspd + this.spd_acc);
        }

        this.apply_speed(this.xspd, this.yspd);

        // check collision with lava and take damage
        if (
          !this.immune_to_lava &&
          this.checkCollisionWithLava(this.x, this.y)
        ) {
          if (this.invincible_timer === 0) {
            this.get_hit(
              1,
              calculate_angle_between_points(
                this.x,
                this.y,
                this.x - this.xspd,
                this.y - this.yspd,
              ),
            );
          }
        }

        // cool down that sword swing
        if (this.swing_cooldown_timer > 0) {
          this.swing_cooldown_timer--;
        }

        // swing that sword swing (if ya wanna)
        this.wanna_attack--;
        if (this.swing_cooldown_timer <= 0 && this.wanna_attack > 0) {
          this.swing_that_sword();
        }

        // animate that sword swing
        if (sword_swingin) {
          sword_swingin_timer++;
          if (sword_swingin_timer < 4 || sword_swingin_timer % 3 === 0) {
            sword_swing_frame++;
            if (sword_swing_frame >= sprites.sword_swing_animation.length) {
              sword_swingin = false;
              sword_swingin_timer = 0;
              sword_swing_frame = 0;
              this.attack_hitboxes = [];
            }
          }
          if (sword_swingin_timer > 6) {
            this.attack_hitboxes = [];
          }
        }

        // adjust music based on my y position for pre_boss_room
        if (rm.pre_boss_room) {
          let max_desired_volume = 1;
          // get max volume desired
          switch (dungeon.rooms[previous_dungeon_room_index].biome) {
            case "grassland":
              max_desired_volume = mus_overworld_volume;
              break;
            case "cave":
              max_desired_volume = mus_cave_volume;
              break;
            case "castle":
              max_desired_volume = mus_castle_volume;
              break;
          }

          const lowerBound = ROOM_HEIGHT_PIXELS - 8;
          const upperBound = 64;

          let desired_volume = max_desired_volume;

          // set volume to 0 if near the top, or to 1 if near the bottom
          if (this.y <= upperBound) {
            desired_volume = 0;
          } else if (this.y >= lowerBound) {
            desired_volume = max_desired_volume;
          } else {
            // if y is in-between, compute the volume proportionally
            let volume = (this.y - upperBound) / (lowerBound - upperBound);
            desired_volume = volume * max_desired_volume;
          }

          // now apply the calculated volume
          switch (dungeon.rooms[previous_dungeon_room_index].biome) {
            case "grassland":
              sounds.mus_overworld.setVolume(desired_volume);
              break;
            case "cave":
              sounds.mus_cave.setVolume(desired_volume);
              break;
            case "castle":
              sounds.mus_castle.setVolume(desired_volume);
              break;
          }
        }
      },
      apply_speed(xspd, yspd) {
        // apply xspd
        if (!this.checkCollision(this.x + xspd, this.y)) {
          this.x += xspd;
        } else {
          // we collided so move towards that wall in the x direction 1 pixel at a time
          if (xspd > 0) {
            let pixel_correct = 0;
            for (let i = 0; i <= this.max_spd; i++) {
              if (!this.checkCollision(Math.ceil(this.x + i), this.y)) {
                pixel_correct = i;
                continue;
              } else {
                break;
              }
            }
            this.x = Math.ceil(this.x + pixel_correct);
            xspd = 0;
          } else if (xspd < 0) {
            let pixel_correct = 0;
            for (let i = 0; i <= this.max_spd; i++) {
              if (!this.checkCollision(Math.floor(this.x - i), this.y)) {
                pixel_correct = i;
                continue;
              } else {
                break;
              }
            }
            this.x = Math.floor(this.x - pixel_correct);
            xspd = 0;
          }
        }

        // apply yspd
        if (!this.checkCollision(this.x, this.y + yspd)) {
          this.y += yspd;
        } else {
          // We collided, so move towards that wall in the y direction 1 pixel at a time
          if (yspd > 0) {
            let pixel_correct = 0;
            for (let i = 0; i <= this.max_spd; i++) {
              if (!this.checkCollision(this.x, Math.ceil(this.y + i))) {
                pixel_correct = i;
                continue;
              } else {
                break;
              }
            }
            this.y = Math.ceil(this.y + pixel_correct);
            yspd = 0;
          } else if (yspd < 0) {
            let pixel_correct = 0;
            for (let i = 0; i <= this.max_spd; i++) {
              if (!this.checkCollision(this.x, Math.floor(this.y - i))) {
                pixel_correct = i;
                continue;
              } else {
                break;
              }
            }
            this.y = Math.floor(this.y - pixel_correct);
            yspd = 0;
          }
        }
      },
      keyPressed() {
        if (this.dead) {
          return;
        }
        if (
          my_enemy_manager.instances.find((instance) => {
            return instance.cutscene_object;
          })
        ) {
          return;
        }

        const boss_instance = my_enemy_manager.enemies.find((enemy) => {
          return enemy.boss === true;
        });
        if (boss_instance) {
          if (boss_instance.phase === `spawned`) {
            if (KEYS_ATTACK.includes(keyCode) || KEYS_BACK.includes(keyCode)) {
              boss_instance.frame_count += 30;
            }
            return;
          }
          if (boss_instance.phase === `health_load`) {
            // if (boss_instance.frame_count < 90) {
            //   return;
            // }
            return;
          }
        }
        // Add the key code to the keysPressed array
        if (
          [UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode) &&
          !keysPressed.includes(keyCode)
        ) {
          keysPressed.push(keyCode);
        }

        if (room_transitioning) {
          return;
        }

        if (keyCode === UP_ARROW) {
          this.direction = "north";
        }
        if (keyCode === DOWN_ARROW) {
          this.direction = "south";
        }
        if (keyCode === LEFT_ARROW) {
          this.direction = "west";
        }
        if (keyCode === RIGHT_ARROW) {
          this.direction = "east";
        }
        if (KEYS_ATTACK.includes(keyCode)) {
          this.wanna_attack = this.WANNA_ATTACK_BUFFER;
          if (this.swing_cooldown_timer <= 0) {
            this.swing_that_sword();
          }
        }
      },
      swing_that_sword() {
        {
          this.wanna_attack = 0;
          sword_swingin = true;
          sword_swing_frame = 0;
          sword_swingin_timer = 0;
          const cooldown_calc = (lvl) => {
            switch (lvl) {
              case 0:
                return 18;
              case 1:
                return 18;
              case 2:
                return 14;
              case 3:
                return 10;
              case 4:
                return 6;
              case 5:
                return 4;
              default:
                return 4;
            }
          };
          this.swing_cooldown_timer = cooldown_calc(this.speed_level);
          this.attack_direction = this.direction;

          // swing that sword
          this.attack_hitboxes = [
            create_sword_attack_hitbox(this.attack_direction),
          ];

          // Get the number of available sword swing sounds
          const num_sword_swings = sounds.sword_swings.length;
          let sword_swing_index = Math.floor(Math.random() * num_sword_swings);
          // If it is the same, generate a new index until it's different
          while (sword_swing_index === last_sword_swing_sound) {
            sword_swing_index = Math.floor(Math.random() * num_sword_swings);
          }

          // Play the sword swing sound
          if (selected_character === 6) {
            sounds.roof.play();
          } else {
            sounds.sword_swings[sword_swing_index].play();
          }

          // Update the last_sword_swing_index
          last_sword_swing_sound = sword_swing_index;
        }
      },
      keyReleased() {
        if (this.dead) {
          return;
        }
        // Remove the released key code from the keysPressed array
        const index = keysPressed.indexOf(keyCode);
        if (index !== -1) {
          keysPressed[index] = null;
          keysPressed.splice(index, 1);
        }

        if (room_transitioning) {
          return;
        }

        // Update this.direction to the most recently pressed key that is still held down
        if (keysPressed.length > 0) {
          const lastKeyCode = keysPressed[keysPressed.length - 1];

          if (lastKeyCode === UP_ARROW) {
            this.direction = "north";
          }
          if (lastKeyCode === DOWN_ARROW) {
            this.direction = "south";
          }
          if (lastKeyCode === LEFT_ARROW) {
            this.direction = "west";
          }
          if (lastKeyCode === RIGHT_ARROW) {
            this.direction = "east";
          }
        }
      },
      draw() {
        if (this.dead) {
          return;
        }
        // g.image(this.spr, this.x, this.y);
        const floored_x = Math.floor(this.x);
        const floored_y = Math.floor(this.y);

        if (
          this.invincible_timer < 0 ||
          Math.floor(this.invincible_timer / 3) % 2 === 0
        ) {
          // g.noStroke();
          let strokeColour = color(
            red(character_colours[selected_character]) * 0.7,
            green(character_colours[selected_character]) * 0.7,
            blue(character_colours[selected_character]) * 0.7,
            alpha(character_colours[selected_character]),
          );

          g.stroke(strokeColour);
          g.fill(character_colours[selected_character]);
          g.rect(floored_x + 0.5, floored_y + 0.5, 8 - 1, 8 - 1);
        }

        g.drawSentence(text, floored_x, floored_y - 14);

        // draw the sword
        if (sword_swingin) {
          // Save the context state
          g.push();

          g.translate(floored_x + 4, floored_y + 4);

          // Rotate the image based on the direction
          g.angleMode(DEGREES);
          if (this.attack_direction === "north") {
            g.rotate(0);
          } else if (this.attack_direction === "east") {
            g.rotate(90);
          } else if (this.attack_direction === "south") {
            g.rotate(180);
          } else if (this.attack_direction === "west") {
            g.rotate(270);
          }

          // Draw the image at the new origin
          if (this.range_level === 1) {
            // Move the origin point to (12, 20)
            g.translate(-12, -16);
            g.image(
              sprites.sword_swing_small_animation[sword_swing_frame],
              0,
              0,
            );
          } else {
            const sword_scale = 0.5 + 0.25 * this.range_level;
            g.scale(sword_scale, sword_scale);
            g.translate(-12, -20);
            g.image(sprites.sword_swing_animation[sword_swing_frame], 0, 0);
          }

          // Restore the context state
          g.pop();

          if (debug_mode) {
            g.fill(255, 0, 0, 128);
            g.noStroke();
            if (this.attack_hitboxes[0]) {
              g.rect(
                floored_x + this.attack_hitboxes[0].x,
                floored_y + this.attack_hitboxes[0].y,
                this.attack_hitboxes[0].width,
                this.attack_hitboxes[0].height,
              );
            }
          }
        }

        // TEMP
        // g.image(sprites[`sprite_CH${selected_character + 1}`], this.x+16, this.y-100);
      },
    };
  })();
  active_entities.push(my_player);

  globalThis.get_my_enemy_manager = function () {
    return my_enemy_manager;
  };
  globalThis.get_active_entities = function () {
    return active_entities;
  };

  // ------------------------------------------------------------ ENEMY / ENTITY MANAGER
  const my_enemy_manager = (() => {
    return {
      room_clear_timer: 0,
      enemies: [],
      instances: [],
      update() {
        if (this.room_clear_timer > 0) {
          this.room_clear_timer = Math.max(0, this.room_clear_timer - 1);

          if (this.room_clear_timer === 0) {
            this.instances.push(create_chest());
            open_room_exits(dungeon.rooms[current_dungeon_room_index]);
          }
        }

        if (!my_player.dead) {
          // ysort :feelsgoodman:
          this.enemies = this.enemies.sort(
            (enemy1, enemy2) => enemy1.y > enemy2.y,
          );

          // update all my updateable enemies
          this.enemies
            .filter((enemy) => typeof enemy.update === "function")
            .forEach((enemy) => {
              enemy.update();
            });
          // update all my updateable instances
          this.instances
            .filter((instance) => typeof instance.update === "function")
            .forEach((instance) => {
              instance.update();
            });
          // CHECK PLAYER'S ATTACK
          for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];

            if (my_player.attack_hitboxes.length > 0) {
              my_player.attack_hitboxes.forEach((attack_hitbox) => {
                const adjusted_attack_hitbox = {
                  x: my_player.x + attack_hitbox.x,
                  y: my_player.y + attack_hitbox.y,
                  width: attack_hitbox.width,
                  height: attack_hitbox.height,
                };
                const adjusted_enemy_hitbox = {
                  x: enemy.x + enemy.hurtbox.x,
                  y: enemy.y + enemy.hurtbox.y,
                  width: enemy.hurtbox.width,
                  height: enemy.hurtbox.height,
                };

                // Check if hitbox1 overlaps with hitbox2
                if (
                  !enemy.invincible &&
                  enemy.hurtbox.invincible_to_id !== attack_hitbox.id &&
                  enemy.x + enemy.hurtbox.x <
                    my_player.x + attack_hitbox.x + attack_hitbox.width &&
                  enemy.x + enemy.hurtbox.x + enemy.hurtbox.width >
                    my_player.x + attack_hitbox.x &&
                  enemy.y + enemy.hurtbox.y <
                    my_player.y + attack_hitbox.y + attack_hitbox.height &&
                  enemy.y + enemy.hurtbox.y + enemy.hurtbox.height >
                    my_player.y + attack_hitbox.y
                ) {
                  // Collision detected
                  enemy.hurtbox.invincible_to_id = attack_hitbox.id;
                  const random_sword_stab_index = Math.floor(
                    Math.random() * sounds.sword_stabs.length,
                  );

                  // apply velocity to victim
                  const hit_angle = calculate_angle_between_points(
                    my_player.x + 4,
                    my_player.y + 4,
                    enemy.x + enemy.hurtbox.width / 2,
                    enemy.y + enemy.hurtbox.height / 2,
                  );
                  if (!attack_hitbox.miss) {
                    enemy.get_hit(attack_hitbox.damage, hit_angle);
                  }
                  let damage_number = create_damage_number(
                    -attack_hitbox.damage,
                    enemy.x,
                    enemy.y,
                    color(255, 255, 255),
                  );
                  if (attack_hitbox.critical) {
                    damage_number = create_damage_number(
                      `Critical!\n${-attack_hitbox.damage}`,
                      enemy.x,
                      enemy.y - 16,
                      color(255, 255, 48),
                      100,
                    );
                  }
                  if (attack_hitbox.miss) {
                    damage_number = create_damage_number(
                      `Miss`,
                      enemy.x,
                      enemy.y,
                      color(96, 255, 255),
                    );
                  }
                  active_entities.push(damage_number);

                  // TODO: crit sound and miss sound

                  if (!attack_hitbox.miss) {
                    sounds.sword_stabs[random_sword_stab_index].play();
                  }
                  if (enemy.hp <= 0) {
                    //TEST. DIE FUNCTION.
                    if (typeof enemy.die === "function") {
                      enemy.die();
                      onEnemyDefeated();
                      return;
                    }

                    return;
                  }
                }

                // No collision
              });
            }
          }
          // CHECK PLAYER'S ATTACK against the chest / other entities
          for (let i = 0; i < this.instances.length; i++) {
            const instance = this.instances[i];

            if (my_player.attack_hitboxes.length > 0) {
              my_player.attack_hitboxes.forEach((attack_hitbox) => {
                // Check if hitbox1 overlaps with hitbox2
                if (
                  !instance.invincible &&
                  instance.x <
                    my_player.x + attack_hitbox.x + attack_hitbox.width &&
                  instance.x + instance.width > my_player.x + attack_hitbox.x &&
                  instance.y <
                    my_player.y + attack_hitbox.y + attack_hitbox.height &&
                  instance.y + instance.height > my_player.y + attack_hitbox.y
                ) {
                  // Collision detected

                  // apply velocity to victim
                  const hit_angle = calculate_angle_between_points(
                    my_player.x + 4,
                    my_player.y + 4,
                    instance.x + instance.width / 2,
                    instance.y + instance.height / 2,
                  );
                  if (typeof instance.get_hit === "function") {
                    instance.get_hit(attack_hitbox.damage, hit_angle);
                  }
                  // active_entities.push(create_damage_number(-attack_hitbox.damage, instance.x, instance.y, color(255, 255, 255)));
                }

                // No collision
              });
            }
          }
          // CHECK PLAYER'S OWN BODY against the collectible entities
          for (let i = 0; i < this.instances.length; i++) {
            const instance = this.instances[i];
            // Check if hitbox1 overlaps with hitbox2
            if (
              instance.collectible &&
              instance.x - 2 < my_player.x + my_player.width &&
              instance.x + instance.width + 2 > my_player.x &&
              instance.y - 2 < my_player.y + my_player.height &&
              instance.y + instance.height + 2 > my_player.y
            ) {
              // Collision detected
              instance.get_collected();
              instance.dead = true;
              onUpgradeCollected();
            }
            // No collision
          }

          // CHECK ENEMY'S ATTACK
          for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];

            const enemy_hitboxes = [];

            if (enemy.hurtbox) {
              enemy_hitboxes.push(enemy.hurtbox);
            }

            if (enemy_hitboxes.length > 0) {
              enemy_hitboxes.forEach((enemy_hitbox) => {
                // Check if hitbox1 overlaps with hitbox2
                if (
                  my_player.invincible_timer <= 0 &&
                  my_player.x + 3 <
                    enemy.x + enemy_hitbox.x + enemy_hitbox.width &&
                  my_player.x + 5 > enemy.x + enemy_hitbox.x &&
                  my_player.y + 3 <
                    enemy.y + enemy_hitbox.y + enemy_hitbox.height &&
                  my_player.y + 5 > enemy.y + enemy_hitbox.y
                ) {
                  // Collision detected
                  // apply velocity to victim
                  const hit_angle = calculate_angle_between_points(
                    enemy.x + enemy_hitbox.width,
                    enemy.y + enemy_hitbox.height,
                    my_player.x + my_player.width / 2,
                    my_player.y + my_player.height / 2,
                  );
                  my_player.get_hit(enemy_hitbox.damage, hit_angle);
                }

                // No collision
              });
            }
          }
        }

        // mower sounds
        if (
          !my_player?.dead &&
          this.enemies.some((enemy) => enemy.type === "5mower")
        ) {
          //
          if (!sounds.mower.isPlaying()) {
            sounds.mower.setVolume(0);
            sounds.mower.loop();
            sounds.mower.setVolume(0.3, 0.1);
          }
        } else {
          if (sounds.mower.isPlaying()) {
            sounds.mower.setVolume(0, 0.1);
            sounds.mower.stop(0.1);
          }
        }

        // destroy all my destroyable instances
        for (let i = 0; i < this.instances.length; i++) {
          if (this.instances[i].dead === true) {
            this.instances[i] = null;
            this.instances.splice(i, 1);
            i--; //recheck
          }
        }

        // destroy all my destroyable enemies
        for (let i = 0; i < this.enemies.length; i++) {
          if (this.enemies[i].dead === true) {
            this.enemies[i] = null;
            this.enemies.splice(i, 1);
            i--; //recheck

            //since we are killing enemies here, check for clearing the room.
            const current_rm = dungeon.rooms[current_dungeon_room_index];
            if (this.enemies.length <= 0 && !current_rm.cleared) {
              current_rm.cleared = true;
              this.room_clear_timer = 60;
              if (current_rm.boss_room) {
                this.room_clear_timer = 120;
                sounds.mus_boss.stop();
                sounds.mus_final_boss.stop();
                sounds.mus_boss_blowing_up.stop();
                current_rm.boss_room = false;
                // find the pre_boss_room corresponding to this biome and remove its status as well
                const corresponding_pre_boss_room = dungeon.rooms.find(
                  (rm) => rm.pre_boss_room && rm.biome === current_rm.biome,
                );
                if (corresponding_pre_boss_room) {
                  corresponding_pre_boss_room.pre_boss_room = false;
                }
              }
            }
          }
        }
      },
      keyPressed() {
        // keyPress all my keyPressable enemies
        this.enemies
          .filter((enemy) => typeof enemy.keyPressed === "function")
          .forEach((enemy) => {
            enemy.keyPressed();
          });
        // keyPress all my keyPressable instances
        this.instances
          .filter((instance) => typeof instance.keyPressed === "function")
          .forEach((instance) => {
            instance.keyPressed();
          });
      },
      draw() {
        // draw all my drawable enemies
        this.enemies
          .filter((enemy) => typeof enemy.draw === "function")
          .forEach((enemy) => {
            enemy.draw();
          });
        // draw all my drawable instances
        this.instances
          .filter((instance) => typeof instance.draw === "function")
          .forEach((instance) => {
            instance.draw();
          });
      },
    };
  })();
  active_entities.push(my_enemy_manager);

  // ------------------------------------------------------------ GLOBAL SCOPE SWITCH ROOM FUNCTION

  function switch_room(index) {
    previous_dungeon_room_index = current_dungeon_room_index;
    current_dungeon_room_index = index;
    const new_current_rm = dungeon.rooms[current_dungeon_room_index];
    const prev_rm = dungeon.rooms[previous_dungeon_room_index];
    new_current_rm.visited = true;
    my_enemy_manager.enemies = [];
    my_enemy_manager.instances = [];

    room_transitioning = true;

    function getInitialRoom2Offset(direction) {
      let xoff = 0;
      let yoff = 0;

      switch (direction) {
        case "north":
          yoff = -ROOM_HEIGHT_PIXELS;
          break;
        case "south":
          yoff = ROOM_HEIGHT_PIXELS;
          break;
        case "east":
          xoff = ROOM_WIDTH_PIXELS;
          break;
        case "west":
          xoff = -ROOM_WIDTH_PIXELS;
          break;
      }

      return { xoff, yoff };
    }
    let room2Offsets = getInitialRoom2Offset(room_transition_direction);
    room2_xoff = room2Offsets.xoff;
    room2_yoff = room2Offsets.yoff;

    if (new_current_rm.biome !== prev_rm.biome || new_current_rm.boss_room) {
      //stop music
      switch (dungeon.rooms[previous_dungeon_room_index].biome) {
        case "grassland":
          sounds.mus_overworld.setVolume(0, 0.3);
          sounds.mus_overworld.stop(0.3);
          break;
        case "cave":
          sounds.mus_cave.setVolume(0, 0.3);
          sounds.mus_cave.stop(0.3);
          break;
        case "castle":
          sounds.mus_castle.setVolume(0, 0.3);
          sounds.mus_castle.stop(0.3);
          break;
      }
    }
  }

  // ------------------------------------------------------------ HUD DRAWER
  active_entities.push(
    (() => {
      // closures etc

      return {
        draw() {
          if (
            my_enemy_manager.instances.find((inst) => inst.type === `textbox`)
          ) {
            // no more text. if theres a text box.
            return;
          }

          g.noStroke();
          g.fill(0);
          g.rect(0, ROOM_HEIGHT_PIXELS, WIDTH_PIXELS, HEIGHT_PIXELS);

          // draw the HUD
          g.changeFont("white");
          g.drawSentence(
            ch_shortnames[selected_character],
            10,
            HEIGHT_PIXELS - 41,
          );
          const max_hearts = my_player.max_hp;
          const filled_hearts = my_player.hp;

          // NEW HEART CODE
          for (let i = 0; i < max_hearts; i++) {
            let heart_sprite_index = 0; // empty heart
            if (filled_hearts - i > 0) {
              if (filled_hearts - 0.6 - i > 0) {
                heart_sprite_index = 8; // fully filled heart
              } else {
                heart_sprite_index = 16; // half filled heart
              }
            }
            g.image(
              sprites.heart,
              8 + TILE_SIZE * i,
              HEIGHT_PIXELS - 16,
              TILE_SIZE,
              TILE_SIZE,
              heart_sprite_index,
              0,
              TILE_SIZE,
              TILE_SIZE,
            );
          }

          // OLD HEART CODE THAT WORKS
          // for (let i = 0; i < max_hearts; i++) {
          //   g.image(sprites.heart, 8 + (TILE_SIZE * i), HEIGHT_PIXELS - 16, TILE_SIZE, TILE_SIZE, 0 + (8 * (filled_hearts - i > 0)), 0, TILE_SIZE, TILE_SIZE);
          // }

          if (my_player.key) {
            g.image(
              sprites.key,
              TILE_SIZE * max_hearts + 16,
              HEIGHT_PIXELS - 16,
            );
          }

          // Stats layout configuration
          const STATS_START_X = ROOM_WIDTH_PIXELS / 2 - 64; // Base X position
          const STATS_START_Y = HEIGHT_PIXELS - 41; // Base Y position
          const STATS_ROW_HEIGHT = 12; // Vertical spacing between stats
          const STATS_COL_WIDTH = 56; // Width between columns
          const STATS_LABEL_VALUE_GAP = 36; // Space between label and value

          // Draw stats in 3 columns
          // Column 1
          g.drawSentence(`ATK:`, STATS_START_X, STATS_START_Y);
          g.drawSentence(
            `${my_player.damage_level}`,
            STATS_START_X + STATS_LABEL_VALUE_GAP,
            STATS_START_Y,
          );

          g.drawSentence(
            `DEF:`,
            STATS_START_X,
            STATS_START_Y + STATS_ROW_HEIGHT,
          );
          g.drawSentence(
            `${my_player.defence_level + 1}`,
            STATS_START_X + STATS_LABEL_VALUE_GAP,
            STATS_START_Y + STATS_ROW_HEIGHT,
          );

          g.drawSentence(
            `RNG:`,
            STATS_START_X,
            STATS_START_Y + STATS_ROW_HEIGHT * 2,
          );
          g.drawSentence(
            `${my_player.range_level - 1}`,
            STATS_START_X + STATS_LABEL_VALUE_GAP,
            STATS_START_Y + STATS_ROW_HEIGHT * 2,
          );

          // Column 2
          g.drawSentence(
            `SPD:`,
            STATS_START_X + STATS_COL_WIDTH,
            STATS_START_Y,
          );
          g.drawSentence(
            `${my_player.speed_level}`,
            STATS_START_X + STATS_COL_WIDTH + STATS_LABEL_VALUE_GAP,
            STATS_START_Y,
          );

          g.drawSentence(
            `ACC:`,
            STATS_START_X + STATS_COL_WIDTH,
            STATS_START_Y + STATS_ROW_HEIGHT,
          );
          g.drawSentence(
            `${Math.round((1 - my_player.miss_chance) * 100)}`,
            STATS_START_X + STATS_COL_WIDTH + STATS_LABEL_VALUE_GAP,
            STATS_START_Y + STATS_ROW_HEIGHT,
          );

          g.drawSentence(
            `LUC:`,
            STATS_START_X + STATS_COL_WIDTH,
            STATS_START_Y + STATS_ROW_HEIGHT * 2,
          );
          g.drawSentence(
            `${my_player.luc}`,
            STATS_START_X + STATS_COL_WIDTH + STATS_LABEL_VALUE_GAP,
            STATS_START_Y + STATS_ROW_HEIGHT * 2,
          );

          // Column 3

          if (my_player.can_swim) {
            g.drawSentence(
              `BMI:`,
              STATS_START_X + STATS_COL_WIDTH * 2,
              STATS_START_Y,
            );
            g.drawSentence(
              `45`,
              STATS_START_X + STATS_COL_WIDTH * 2 + STATS_LABEL_VALUE_GAP,
              STATS_START_Y,
            );
          }
          if (false) {
            g.drawSentence(
              `POG:`,
              STATS_START_X + STATS_COL_WIDTH * 2,
              STATS_START_Y + STATS_ROW_HEIGHT,
            );
            g.drawSentence(
              `YES`,
              STATS_START_X + STATS_COL_WIDTH * 2 + STATS_LABEL_VALUE_GAP,
              STATS_START_Y + STATS_ROW_HEIGHT,
            );
          }

          if (my_player.immune_to_lava) {
            g.drawSentence(
              `HOT:`,
              STATS_START_X + STATS_COL_WIDTH * 2,
              STATS_START_Y + STATS_ROW_HEIGHT * 2,
            );
            g.drawSentence(
              `YEA`,
              STATS_START_X + STATS_COL_WIDTH * 2 + STATS_LABEL_VALUE_GAP,
              STATS_START_Y + STATS_ROW_HEIGHT * 2,
            );
          }

          // draw the minimap
          const mini_rm_width = 7;
          const mini_rm_height = 5;
          const center_x = 287;
          const center_y = 213;

          // Calculate the x and y coordinates for the bounding box of the minimap
          const rect_x1 = center_x + -2 * (mini_rm_width + 1) - 1;
          const rect_y1 = center_y + -2 * (mini_rm_height + 1) - 1;
          const rect_x2 = center_x + 3 * (mini_rm_width + 1) + 1;
          const rect_y2 = center_y + 3 * (mini_rm_height + 1) + 1;
          g.rectMode(CORNERS);

          g.stroke(128);
          g.fill(16);
          g.rect(rect_x1, rect_y1, rect_x2, rect_y2);

          g.rectMode(CORNER);

          g.noStroke();
          g.fill(255);

          function draw_room_for_minimap(room, x, y) {
            let w = mini_rm_width;
            let h = mini_rm_height;

            switch (room.biome) {
              case "grassland":
                g.fill(20, 92, 20);
                break;
              case "cave":
                g.fill(10, 0, 102);
                break;
              case "castle":
                g.fill(90, 46, 0);
                break;
            }
            g.noStroke();
            g.rect(x, y, w, h);

            switch (room.biome) {
              case "grassland":
                g.stroke(178, 255, 178);
                break;
              case "cave":
                g.stroke(120, 140, 252);
                break;
              case "castle":
                g.stroke(232, 255, 170);
                break;
            }
            if (room === dungeon.rooms[current_dungeon_room_index]) {
              g.stroke(255, 0, 0);
            }

            g.strokeWeight(1);

            // North wall
            if (room.exits.includes("north")) {
              g.line(x, y, x + 2, y);
              g.line(x + w - 2, y, x + w, y);
            } else {
              g.line(x, y, x + w, y);
            }

            // East wall
            if (room.exits.includes("east")) {
              g.line(x + w, y + h - 1, x + w, y + h);
              g.line(x + w, y, x + w, y + 1);
            } else {
              g.line(x + w, y, x + w, y + h);
            }

            // South wall
            if (room.exits.includes("south")) {
              g.line(x + 2, y + h, x, y + h);
              g.line(x + w, y + h, x + w - 2, y + h);
            } else {
              g.line(x + w, y + h, x, y + h);
            }

            // West wall
            if (room.exits.includes("west")) {
              g.line(x, y, x, y + 1);
              g.line(x, y + h, x, y + h - 1);
            } else {
              g.line(x, y + h, x, y);
            }

            if (room.pre_boss_room_dimensions) {
              // Extra wall for pre_boss_room on the west side
              if (!room.exits.includes("west")) {
                g.line(x + 1, y, x + 1, y + h); // Draw the inner wall one pixel to the right
              }

              // Extra wall for pre_boss_room on the east side
              if (!room.exits.includes("east")) {
                g.line(x + w - 1, y, x + w - 1, y + h); // Draw the inner wall one pixel to the left
              }
            }
          }

          for (let rm_i = 0; rm_i < dungeon.rooms.length; rm_i++) {
            const rm = dungeon.rooms[rm_i];
            const current_rm = dungeon.rooms[current_dungeon_room_index];

            if (rm.visited) {
              // Calculate the x and y differences between the current room and the other room
              const x_diff = rm.x - current_rm.x;
              const y_diff = rm.y - current_rm.y;
              if (Math.abs(x_diff) > 2 || Math.abs(y_diff) > 2) {
                continue;
              }

              // Calculate the x and y coordinates for the other room's rectangle
              const rect_x = center_x + x_diff * (mini_rm_width + 1);
              const rect_y = center_y + y_diff * (mini_rm_height + 1);

              // draw in white
              g.stroke(255);
              // but draw this current room in red

              draw_room_for_minimap(rm, rect_x + 0.5, rect_y + 0.5); // +0.5 bc we are doing weird shader stuff
            }
          }

          // g.rectMode(CORNERS)

          // g.stroke(128);
          // g.noFill();
          // g.rect(rect_x1, rect_y1, rect_x2, rect_y2);

          // g.rectMode(CORNER)
        },
      };
    })(),
  );

  // ------------------------------------------------------------ DEATHSCREEN DRAWER
  function create_deathscreen() {
    // stop all music
    if (sounds.mus_overworld.isPlaying()) {
      sounds.mus_overworld.stop();
    }
    if (sounds.mus_cave.isPlaying()) {
      sounds.mus_cave.stop();
    }
    if (sounds.mus_castle.isPlaying()) {
      sounds.mus_castle.stop();
    }
    if (sounds.mus_boss.isPlaying()) {
      sounds.mus_boss.stop();
    }
    if (sounds.mus_final_boss.isPlaying()) {
      sounds.mus_final_boss.stop();
    }
    if (sounds.mus_boss_pregame.isPlaying()) {
      sounds.mus_boss_pregame.stop();
    }
    if (sounds.mus_boss_blowing_up.isPlaying()) {
      sounds.mus_boss_blowing_up.stop();
    }
    if (sounds.mower.isPlaying()) {
      sounds.mower.stop();
    }

    // alert('holy god damn are you ever DEAD');

    sounds.your_dead.play();

    active_entities.push(
      (() => ({
        deathscreen_state: "just_died",
        deathscreen_frame: 0,
        selected_room: "rm_char_select",
        deadguy_x: my_player.x,
        deadguy_y: my_player.y,
        deadguy_xspasm: 0,
        deadguy_yspasm: 0,
        spasm_amount: 15,
        deadguy_target_x: 255 - 4,
        deadguy_target_y: 166 - 4,

        text: "",
        full_text: `${character_death_quotes[selected_character][Math.floor(Math.random() * character_death_quotes[selected_character].length)]}      `,

        blackscreen_alpha: 0,

        option: 1,
        cursor_xoff: 0,
        cursor_yoff: 0,

        go_to_the_selected_room_now() {
          // TRY DESPERATELY TO CLEAN UP MEMORY
          my_enemy_manager.enemies = [];
          my_enemy_manager.instances = [];
          dungeon = null;
          room_goto(this.selected_room);
        },
        update_deadguy_positions() {
          this.deadguy_x = (this.deadguy_x * 25 + this.deadguy_target_x) / 26;
          this.deadguy_y = (this.deadguy_y * 25 + this.deadguy_target_y) / 26;
          if (this.spasm_amount > 0.1) {
            this.spasm_amount = (this.spasm_amount * 21 + 0) / 22;
            this.deadguy_xspasm = Math.ceil(
              Math.random() * this.spasm_amount - this.spasm_amount / 2,
            );
            this.deadguy_yspasm = Math.ceil(
              Math.random() * this.spasm_amount - this.spasm_amount / 2,
            );
          } else {
            this.spasm_amount = 0;
            this.deadguy_xspasm = 1;
            this.deadguy_yspasm = 1;
          }
        },
        update() {
          switch (this.deathscreen_state) {
            case "just_died":
              this.deathscreen_frame++;

              this.deadguy_xspasm =
                Math.random() * this.spasm_amount - this.spasm_amount / 2;
              this.deadguy_yspasm =
                Math.random() * this.spasm_amount - this.spasm_amount / 2;
              if (this.deathscreen_frame > 40) {
                sounds.your_dead_music.setVolume(1);
                sounds.your_dead_music.play();
                this.deathscreen_frame = 0;
                this.deathscreen_state = "fading_to_your_dead";
              }
              break;

            case "fading_to_your_dead":
              this.deathscreen_frame++;

              this.update_deadguy_positions();

              this.blackscreen_alpha = Math.min(
                this.deathscreen_frame * 4,
                255,
              );

              if (this.deathscreen_frame > 70) {
                this.deathscreen_frame = 0;
                this.deathscreen_state = "fading_to_deathscreen";
              }
              break;

            case "fading_to_deathscreen":
              this.deathscreen_frame++;

              this.update_deadguy_positions();

              this.blackscreen_alpha = Math.max(
                128 - this.deathscreen_frame * 3,
                0,
              );

              if (this.deathscreen_frame > 70) {
                this.deathscreen_frame = 0;
                this.deathscreen_state = "death_quote";
              }

              break;
            case "death_quote":
              this.update_deadguy_positions();

              const prev_floored_frame_count = Math.floor(
                this.deathscreen_frame,
              );
              this.deathscreen_frame += 0.33;
              const this_floored_frame_count = Math.floor(
                this.deathscreen_frame,
              );

              // Fetch the current character from the substring
              const current_character =
                this.full_text[Math.floor(this.deathscreen_frame)];

              // Boolean flag to check if the current character is not a space or a newline
              const current_character_is_not_a_space_or_newline =
                current_character !== " " && current_character !== "\n";

              if (
                this.text.length < this.full_text.length - 1 &&
                prev_floored_frame_count !== this_floored_frame_count &&
                current_character_is_not_a_space_or_newline
              ) {
                sounds.text_blip2.play();
              }

              this.text = this.full_text.substring(
                0,
                Math.floor(this.deathscreen_frame),
              );
              if (this.text === this.full_text) {
                this.deathscreen_frame = 0;
                this.deathscreen_state = "menu";
              }

              break;
            case "menu":
              this.deathscreen_frame++;

              // sin movement for hand cursor
              this.cursor_xoff = Math.floor(
                Math.abs(Math.sin(frameCount / 16)) * 5,
              );

              this.update_deadguy_positions();

              break;
            case "cursor_blinking_cause_we_selected_something":
              this.deathscreen_frame++;

              this.update_deadguy_positions();

              if (this.deathscreen_frame > 60) {
                // FADE OUT THE DEATHMUSIC
                sounds.your_dead_music.setVolume(0, 0.6);
                this.deathscreen_frame = 0;
                this.deathscreen_state = "fading_to_selected_room";
              }

              break;
            case "fading_to_selected_room":
              this.deathscreen_frame++;

              this.update_deadguy_positions();

              if (this.deathscreen_frame % 4 === 0) {
                add_to_fade_level(1);
              }
              if (this.deathscreen_frame > 50) {
                this.go_to_the_selected_room_now();
              }
            default:
              break;
          }
        },
        keyPressed() {
          switch (this.deathscreen_state) {
            case "death_quote":
              if (
                KEYS_AFFIRM.includes(keyCode) ||
                KEYS_BACK.includes(keyCode)
              ) {
                this.deathscreen_frame = 0;
                this.deathscreen_state = "menu";
              }
              break;
            case "menu":
              // 12 FRAME GRACE PERIOD WEREH U DOINT CAN T DO ANYTHING
              if (this.deathscreen_frame < 12) {
                break;
              }
              if (keyCode === UP_ARROW) {
                this.option = Math.max(this.option - 1, 1);
                this.cursor_yoff = (this.option - 1) * 12;
                sounds.squeek.play();
              } else if (keyCode === DOWN_ARROW) {
                this.option = Math.min(this.option + 1, 3);
                this.cursor_yoff = (this.option - 1) * 12;
                sounds.squeek.play();
              } else if (KEYS_AFFIRM.includes(keyCode)) {
                switch (this.option) {
                  case 1:
                    this.selected_room = "rm_rougelite";
                    break;
                  case 2:
                    this.selected_room = "rm_char_select";
                    break;
                  case 3:
                    this.selected_room = "rm_title_screen";
                    break;
                }
                this.deathscreen_frame = 0;
                this.deathscreen_state =
                  "cursor_blinking_cause_we_selected_something";
                sounds.selected.play();
              }
              break;
          }
        },
        draw_black_screen() {
          // THIS WORKS TO FADE TO BLACK
          //Invert colors
          g.noStroke();
          g.blendMode(DIFFERENCE);
          g.fill(255);
          g.rect(0, 0, WIDTH_PIXELS, HEIGHT_PIXELS);

          //black rectangle trick
          g.blendMode(ADD);
          g.fill(255, this.blackscreen_alpha);
          g.rect(0, 0, WIDTH_PIXELS, HEIGHT_PIXELS);

          //Invert colors back
          g.blendMode(DIFFERENCE);
          g.fill(255);
          g.rect(0, 0, WIDTH_PIXELS, HEIGHT_PIXELS);

          g.blendMode(BLEND);
        },
        draw_dead_guy() {
          // draw the dead guy
          const floored_x = Math.floor(this.deadguy_x + this.deadguy_xspasm);
          const floored_y = Math.floor(this.deadguy_y + this.deadguy_yspasm);

          let strokeColour = color(
            red(character_colours[selected_character]) * 0.7,
            green(character_colours[selected_character]) * 0.7,
            blue(character_colours[selected_character]) * 0.7,
            alpha(character_colours[selected_character]),
          );
          g.stroke(strokeColour);
          g.fill(character_colours[selected_character]);
          g.rect(floored_x + 0.5, floored_y + 0.5, 8 - 1, 8 - 1);
        },
        draw() {
          switch (this.deathscreen_state) {
            case "just_died":
              this.draw_dead_guy();

              break;
            case "fading_to_your_dead":
              this.draw_black_screen();
              this.draw_dead_guy();
              // YOUR DEAD TEXT
              g.image(sprites.your_dead_text, WIDTH_PIXELS / 2 - 64, 40);

              break;
            case "fading_to_deathscreen":
              g.image(sprites.deathscreen, 0, 0);
              this.draw_black_screen();
              this.draw_dead_guy();

              // YOUR DEAD TEXT
              g.image(sprites.your_dead_text, WIDTH_PIXELS / 2 - 64, 40);

              break;
            case "death_quote":
              g.image(sprites.deathscreen, 0, 0);
              this.draw_dead_guy();
              // YOUR DEAD TEXT
              g.image(sprites.your_dead_text, WIDTH_PIXELS / 2 - 64, 40);

              // type text
              g.drawSentence(this.text, 16, 80);

              break;
            case "menu":
              g.image(sprites.deathscreen, 0, 0);
              this.draw_dead_guy();
              // YOUR DEAD TEXT
              g.image(sprites.your_dead_text, WIDTH_PIXELS / 2 - 64, 40);
              // type fulltext
              g.drawSentence(this.full_text, 16, 80);

              // DRAW MENU OPTIONS
              g.drawSentence(`TRY AGAIN`, 56, 192 + 12 * 0);
              g.drawSentence(`CHARACTER SELECT`, 56, 192 + 12 * 1);
              if (unlocked_a_character) {
                let frame_to_sine = Math.sin(((2 * Math.PI) / 60) * frameCount);
                frame_to_sine = (frame_to_sine + 1) * (255 / 2);
                g.tint(255, 255, 48, frame_to_sine);
                g.drawSentence(`(NEW!)`, 184, 192 + 12 * 1);
                g.tint(255);
              }
              g.drawSentence(`QUIT`, 56, 192 + 12 * 2);

              g.image(
                sprites.hand_cursor,
                30 + this.cursor_xoff,
                192 + this.cursor_yoff,
              );

              break;
            case "cursor_blinking_cause_we_selected_something":
              g.image(sprites.deathscreen, 0, 0);
              this.draw_dead_guy();
              // YOUR DEAD TEXT
              g.image(sprites.your_dead_text, WIDTH_PIXELS / 2 - 64, 40);
              // type fulltext
              g.drawSentence(this.full_text, 16, 80);

              // DRAW MENU OPTIONS
              g.drawSentence(`TRY AGAIN`, 56, 192 + 12 * 0);

              g.drawSentence(`CHARACTER SELECT`, 56, 192 + 12 * 1);
              if (unlocked_a_character) {
                let frame_to_sine = Math.sin(((2 * Math.PI) / 60) * frameCount);
                frame_to_sine = (frame_to_sine + 1) * (255 / 2);
                g.tint(255, 255, 48, frame_to_sine);
                g.drawSentence(`(NEW!)`, 184, 192 + 12 * 1);
                g.tint(255);
              }

              g.drawSentence(`QUIT`, 56, 192 + 12 * 2);

              if (Math.floor(this.deathscreen_frame / 4) % 2 === 0) {
                g.image(
                  sprites.hand_cursor,
                  30 + this.cursor_xoff,
                  192 + this.cursor_yoff,
                );
              }

              break;
            case "fading_to_selected_room":
              g.image(sprites.deathscreen, 0, 0);
              this.draw_dead_guy();
              // YOUR DEAD TEXT
              g.image(sprites.your_dead_text, WIDTH_PIXELS / 2 - 64, 40);
              // type fulltext
              g.drawSentence(this.full_text, 16, 80);

              // DRAW MENU OPTIONS
              g.drawSentence(`TRY AGAIN`, 56, 192 + 12 * 0);
              g.drawSentence(`CHARACTER SELECT`, 56, 192 + 12 * 1);
              if (unlocked_a_character) {
                let frame_to_sine = Math.sin(((2 * Math.PI) / 60) * frameCount);
                frame_to_sine = (frame_to_sine + 1) * (255 / 2);
                g.tint(255, 255, 48, frame_to_sine);
                g.drawSentence(`(NEW!)`, 184, 192 + 12 * 1);
                g.tint(255);
              }
              g.drawSentence(`QUIT`, 56, 192 + 12 * 2);

              break;
          }
          //DEBUGER
          // g.drawSentence(`${this.deathscreen_state}`, 8, 8)
        },
      }))(),
    );
  }

  return active_entities;
}
