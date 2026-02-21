import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sounds, sprites } from "./assets.js";
import { set_fade_level } from "./faderShader.js";

// -------------------------------------------------------------------------------- ROOM CREDITS SCROLL

export function instantiate_room_credits_scroll() {
  active_entities = [
    {
      type: "credits_bg",
      scroll_y: HEIGHT_PIXELS, // Start below the screen
      music_started: false,
      showing_stats: false,
      stats_display_y: 32,
      runComplete: false,
      update() {
        set_fade_level(-4);
        // Start music on first frame
        // if (!this.music_started) {
        //   if (sounds.mus_credits && !sounds.mus_credits.isPlaying()) {
        //     sounds.mus_credits.setVolume(0.7);
        //     sounds.mus_credits.loop();
        //   }
        //   this.music_started = true;
        // }

        if (!this.runComplete) {
          onRunComplete();
          this.runComplete = true;
        }

        // Black background
        g.fill(0);
        g.noStroke();
        g.rect(0, 0, WIDTH_PIXELS, HEIGHT_PIXELS);

        // Show stats screen
        g.changeFont("white");

        g.drawSentence("jg rougelite", 124, 16);

        const hitPersonalBest = stats.currentRunFrames === stats.bestRunFrames;

        let y = this.stats_display_y;
        let x = 10;

        g.drawSentence("FINAL STATS", x, y);
        y += 14;
        if (hitPersonalBest) {
          let frame_to_sine = Math.sin(((2 * Math.PI) / 60) * frameCount);
          frame_to_sine = (frame_to_sine + 1) * (255 / 2);
          g.tint(255, 255, 48, frame_to_sine);
        }
        g.drawSentence(
          "Run Time: " +
            formatTime(stats.currentRunFrames) +
            (hitPersonalBest ? " (BEST!)" : ""),
          x,
          y,
        );

        if (hitPersonalBest) {
          g.tint(255, 255, 48, 255);
          g.drawSentence(
            "Run Time: " + formatTime(stats.currentRunFrames),
            x,
            y,
          );
        }
        y += 14;
        g.drawSentence(
          "Best Time: " +
            (stats.bestRunFrames !== null
              ? formatTime(stats.bestRunFrames)
              : "--:--"),
          x,
          y,
        );
        g.tint(255);
        y += 14;
        g.drawSentence(
          "Enemies Defeated (This run): " + stats.enemiesDefeatedThisRun,
          x,
          y,
        );
        y += 14;
        g.drawSentence(
          "Upgrades Collected (This run): " + stats.upgradesCollectedThisRun,
          x,
          y,
        );
        y += 14;
        g.drawSentence("Total Playtime: " + formatTime(stats.frames), x, y);
        y += 14;
        g.drawSentence(
          "Total Enemies Defeated: " + stats.enemiesDefeated,
          x,
          y,
        );
        y += 14;
        g.drawSentence(
          "Total Upgrades Collected: " + stats.upgradesCollected,
          x,
          y,
        );
        y += 14;
        g.drawSentence("Failed Runs: " + stats.deaths, x, y);
        y += 14;
        g.drawSentence(
          "Characters Unlocked: " + stats.charactersUnlocked + "/16",
          x,
          y,
        );
        y += 14;
        g.drawSentence("Completion: " + getCompletionPercent() + "%", x, y);

        // draw the ... player stats

        // draw the HUD
        g.changeFont("white");
        g.drawSentence(
          ch_shortnames[selected_character],
          10,
          HEIGHT_PIXELS - 41,
        );
        const max_hearts = my_player.max_hp;
        const filled_hearts = my_player.max_hp; //full hp for a nice screen

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
          g.image(sprites.key, TILE_SIZE * max_hearts + 16, HEIGHT_PIXELS - 16);
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

        g.drawSentence(`DEF:`, STATS_START_X, STATS_START_Y + STATS_ROW_HEIGHT);
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
        g.drawSentence(`SPD:`, STATS_START_X + STATS_COL_WIDTH, STATS_START_Y);
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
        //
        // draw the minimap (full map, centered at 268, 112)
        const mini_rm_width = 7;
        const mini_rm_height = 5;
        const center_x = 254;
        const center_y = 112;

        // Compute bounds of all visited rooms to find the map center
        let min_x = Infinity,
          max_x = -Infinity,
          min_y = Infinity,
          max_y = -Infinity;
        for (let rm_i = 0; rm_i < dungeon.rooms.length; rm_i++) {
          const rm = dungeon.rooms[rm_i];
          if (rm.visited) {
            if (rm.x < min_x) min_x = rm.x;
            if (rm.x > max_x) max_x = rm.x;
            if (rm.y < min_y) min_y = rm.y;
            if (rm.y > max_y) max_y = rm.y;
          }
        }
        const map_center_x = (min_x + max_x) / 2;
        const map_center_y = (min_y + max_y) / 2;

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
            // g.stroke(255, 0, 0);
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
            if (!room.exits.includes("west")) {
              g.line(x + 1, y, x + 1, y + h);
            }
            if (!room.exits.includes("east")) {
              g.line(x + w - 1, y, x + w - 1, y + h);
            }
          }
        }

        for (let rm_i = 0; rm_i < dungeon.rooms.length; rm_i++) {
          const rm = dungeon.rooms[rm_i];

          if (rm.visited) {
            const x_diff = rm.x - map_center_x;
            const y_diff = rm.y - map_center_y;

            const rect_x = center_x + x_diff * (mini_rm_width + 1);
            const rect_y = center_y + y_diff * (mini_rm_height + 1);

            draw_room_for_minimap(rm, rect_x + 0.5, rect_y + 0.5);
          }
        }

        //end
      },
    },
  ];
  return active_entities;
}

// helper funcs

function formatTime(frames) {
  const totalSeconds = Math.floor(frames / 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getCompletionPercent() {
  return Math.round((stats.charactersUnlocked / 16) * 100);
}
