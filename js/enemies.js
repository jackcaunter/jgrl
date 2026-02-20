import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sounds, sprites } from "./assets.js";
import { set_fade_level, add_to_fade_level } from "./faderShader.js";
import { drawHealthBar } from "./enemyGlobals.js";

// ENEMY TYPES
export const enemy_types = [
  {
    index: 0,
    type: "5mower",
    sprite_name: "5mower",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 2][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 2][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 2][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;
      let direction_timer = 0;
      let direction_change_time = (Math.random() * 4 + 2) * 60;
      let yvibration = 0;
      let spd = 0.2;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 5;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 5,
        max_hp: 5,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 8,
          width: 24,
          height: 16,
          damage: 2,
        },
        checkCollision(x, y) {
          // TODO: looks like the mower is using it anyway
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }
          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;
          this.hit_direction = angle;
          this.hit_spd = 4;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        update() {
          direction_timer++;
          if (frameCount % 3 === 0) {
            yvibration = Math.abs(yvibration - 1);
          }

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }

          if (direction_timer < direction_change_time - 90) {
            // mowin along

            // split spd into x and y components
            xspd = Math.cos(radians(direction)) * spd;
            yspd = Math.sin(radians(direction)) * spd;
            this.apply_speed();
          } else if (direction_timer < direction_change_time) {
            // stop mowin
          } else {
            direction_timer = 0;
            direction = Math.random() * 360;
            direction_change_time = (Math.random() * 4 + 2) * 60;
          }
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y + yvibration);
          g.image(sprites[this.sprite_name], floored_x, floored_y);

          if (this.hp < this.max_hp) {
            this.drawHealthBar();
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            g.image(sprites[this.sprite_name], floored_x, floored_y);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 1,
    type: "unknown",
    sprite_name: "unknown",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;
      let direction_timer = 0;
      let direction_change_time = (Math.random() * 4 + 2) * 60;
      let squash_time_frames = 40;
      let spd = 0.2;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 5;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 3,
        max_hp: 3,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,
        fast: false,
        squash_amount: 1,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 1,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          // TODO: have to add dynamic stuff like chests and gates to the collisions
          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;
          this.fast = true;
          spd = 0.8;
          squash_time_frames = 15;
          direction_timer = 3000;

          this.hit_direction = angle;
          this.hit_spd = 4;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        update() {
          direction_timer++;

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }

          if (direction_timer < direction_change_time) {
            // squishin along

            // split spd into x and y components
            xspd = Math.cos(radians(direction)) * spd;
            yspd = Math.sin(radians(direction)) * spd;
            this.apply_speed();
          } else {
            direction_timer = 0;
            direction = Math.random() * 360;
            if (this.fast) {
              direction_change_time = (Math.random() * 2 + 0.5) * 60;
            } else {
              direction_change_time = (Math.random() * 4 + 2) * 60;
            }
          }
          // Calculate squash and stretch amount with sine function oscillating over 60 frames
          this.squash_amount = sin((frameCount / squash_time_frames) * TWO_PI);
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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
        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          // Set the squashing and stretching amounts
          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          // Reset the transformation matrix
          g.resetMatrix();

          // Translate to the desired origin (bottom center of hurtbox)
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );

          // Squash and stretch
          g.scale(xScale, yScale);

          // Draw the sprite. The coordinates are now relative to the bottom center of the hurtbox
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );

          // Reset the transformation matrix again so that other drawings aren't affected
          g.resetMatrix();
        },
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          this.drawSquashedSprite(this.squash_amount);

          if (this.hp < this.max_hp) {
            this.drawHealthBar(24, -12);
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            this.drawSquashedSprite(this.squash_amount);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 400,
    type: "hypers",
    sprite_name: "hypers",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;
      let direction_timer = 0;
      let direction_change_time = (Math.random() * 4 + 2) * 60;
      let squash_time_frames = 15;
      let spd = 3;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 5;

      return {
        type: this.type,
        sprite_name: Math.random() < 0.5 ? "hypers" : "peepopanties",
        x: x,
        y: y,
        move_xspeed: 2 + Math.random(),
        move_yspeed: 0.4 + Math.random() * 0.3,
        dir: ["DR", "DL", "UR", "UL"][getRandomInt(0, 3)],
        hp: 7,
        max_hp: 7,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,
        fast: true,
        squash_amount: 1,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 1.5,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          // TODO: have to add dynamic stuff like chests and gates to the collisions
          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;
          // this.fast = true;
          // spd = 0.8;
          // squash_time_frames = 15;
          // direction_timer = 3000;

          this.hit_direction = angle;
          this.hit_spd = 5;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        move_right() {
          if (this.x + this.hurtbox.width < 296) {
            this.x += this.move_xspeed;
          } else {
            if (this.dir === "DR") {
              this.dir = "DL";
            }
            if (this.dir === "UR") {
              this.dir = "UL";
            }
            this.x -= this.move_xspeed;
          }
        },
        move_left() {
          if (this.x > 24) {
            this.x -= this.move_xspeed;
          } else {
            if (this.dir === "DL") {
              this.dir = "DR";
            }
            if (this.dir === "UL") {
              this.dir = "UR";
            }
            this.x = 24;
            this.x += this.move_xspeed;
          }
        },
        move_down() {
          if (this.y + this.hurtbox.height < 168) {
            this.y += this.move_yspeed;
          } else {
            if (this.dir === "DR") {
              this.dir = "UR";
            }
            if (this.dir === "DL") {
              this.dir = "UL";
            }
            this.y -= this.move_yspeed;
          }
        },
        move_up() {
          if (this.y > 24) {
            this.y -= this.move_yspeed;
          } else {
            if (this.dir === "UR") {
              this.dir = "DR";
            }
            if (this.dir === "UL") {
              this.dir = "DL";
            }
            this.y = 24;
            this.y += this.move_yspeed;
          }
        },
        update() {
          switch (this.dir) {
            case "DR":
              this.move_right();
              this.move_down();
              break;
            case "DL":
              this.move_left();
              this.move_down();
              break;
            case "UR":
              this.move_right();
              this.move_up();
              break;
            case "UL":
              this.move_left();
              this.move_up();
              break;
            default:
              console.log("what the FUCK");
              break;
          }

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }

          // Calculate squash and stretch amount with sine function oscillating over 60 frames
          this.squash_amount = sin((frameCount / squash_time_frames) * TWO_PI);
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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
        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          // Set the squashing and stretching amounts
          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          // Reset the transformation matrix
          g.resetMatrix();

          // Translate to the desired origin (bottom center of hurtbox)
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );

          // Squash and stretch
          g.scale(xScale, yScale);

          // Draw the sprite. The coordinates are now relative to the bottom center of the hurtbox
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );

          // Reset the transformation matrix again so that other drawings aren't affected
          g.resetMatrix();
        },
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          this.drawSquashedSprite(this.squash_amount);

          if (this.hp < this.max_hp) {
            this.drawHealthBar(24, -12);
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            this.drawSquashedSprite(this.squash_amount);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 2,
    type: "pepega",
    sprite_name: "pepega",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;

      let spd = 0;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 10;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 3,
        max_hp: 3,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,

        unrestable: false,
        unrestable_timer: 0,
        should_rest: true,
        rest_timer: 0,
        invincible: false,

        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 1,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;

          spd = 0;
          this.should_rest = true;
          this.rest_timer = -5;

          this.hit_direction = angle;
          this.hit_spd = 7;
          this.hit_opacity = 255;

          this.invincible = true;
        },
        die() {
          this.dead = true;
        },
        // rest() {
        //   this.rest_timer = 0;
        //   this.should_rest = false;
        //   spd = 0;
        //   wait_time = 15;
        //   seek_timer = 0;
        //   seeking = false;
        // },
        seek() {
          this.should_rest = false;
          this.rest_timer = 0;
          this.unrestable = true;
          this.invincible = false;
          direction = my_player
            ? calculate_angle_between_points(
                this.x,
                this.y,
                my_player.x,
                my_player.y,
              )
            : Math.random() * 360;
          spd = 4 - this.hp * 0.75;
        },
        update() {
          if (this.invincible) {
            this.invisible = Math.floor(frameCount / 3) % 2 === 0;
          } else {
            this.invisible = false;
          }

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }

          xspd = Math.cos(radians(direction)) * spd;
          yspd = Math.sin(radians(direction)) * spd;

          if (this.unrestable) {
            this.unrestable_timer++;
            if (this.unrestable_timer > 15) {
              this.unrestable = false;
            }
          }

          if (this.should_rest) {
            this.rest_timer++;
            xspd = (xspd / 15) * Math.max(0, 15 - this.rest_timer);
            yspd = (yspd / 15) * Math.max(0, 15 - this.rest_timer);
            if (this.rest_timer > 30) {
              this.seek();
            }
          }

          this.apply_speed();
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
                  pixel_correct = i;
                  continue;
                } else {
                  break;
                }
              }
              this.x = Math.ceil(this.x + pixel_correct);
              xspd = 0;
              if (!this.unrestable) {
                this.should_rest = true;
              }
            } else if (xspd < 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
                  pixel_correct = i;
                  continue;
                } else {
                  break;
                }
              }
              this.x = Math.floor(this.x - pixel_correct);
              xspd = 0;
              if (!this.unrestable) {
                this.should_rest = true;
              }
            }
          }

          // apply yspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
                  pixel_correct = i;
                  continue;
                } else {
                  break;
                }
              }
              this.y = Math.ceil(this.y + pixel_correct);
              yspd = 0;
              if (!this.unrestable) {
                this.should_rest = true;
              }
            } else if (yspd < 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
                  pixel_correct = i;
                  continue;
                } else {
                  break;
                }
              }
              this.y = Math.floor(this.y - pixel_correct);
              yspd = 0;
              if (!this.unrestable) {
                this.should_rest = true;
              }
            }
          }
        },
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          if (!this.invisible) {
            g.image(sprites[this.sprite_name], floored_x, floored_y);

            if (this.hit_opacity > 0) {
              g.blendMode(ADD);
              g.tint(255, this.hit_opacity);
              g.image(sprites[this.sprite_name], floored_x, floored_y);
              g.blendMode(BLEND);
              g.tint(255);
            }
          }

          if (this.hp < this.max_hp) {
            this.drawHealthBar();
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 3,
    type: "lemickey",
    sprite_name: "lemickey",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y, dir) {
      // closures etc
      const dirs = ["DR", "DL", "UR", "UL"];
      let starting_direction = dirs[Math.floor(Math.random() * dirs.length)];
      if (dir) {
        starting_direction = dir;
      }

      let spd = 0;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 10;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        move_speed: 1,
        hp: 5,
        max_hp: 5,
        dir_index: 0,
        dir: starting_direction,
        dead: false,

        invincible: false,

        hurtbox: {
          invincible_to_id: -1,
          x: 4,
          y: 4,
          width: 16,
          height: 16,
          damage: 1,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;
          this.hit_direction = angle;
          this.hit_spd = 4;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        move_right() {
          if (this.x + this.hurtbox.width < 296) {
            this.x += this.move_speed;
          } else {
            if (this.dir === "DR") {
              this.dir = "DL";
            }
            if (this.dir === "UR") {
              this.dir = "UL";
            }
            this.x -= this.move_speed;
          }
        },
        move_left() {
          if (this.x > 24) {
            this.x -= this.move_speed;
          } else {
            if (this.dir === "DL") {
              this.dir = "DR";
            }
            if (this.dir === "UL") {
              this.dir = "UR";
            }
            this.x += this.move_speed;
          }
        },
        move_down() {
          if (this.y + this.hurtbox.height < 168) {
            this.y += this.move_speed;
          } else {
            if (this.dir === "DR") {
              this.dir = "UR";
            }
            if (this.dir === "DL") {
              this.dir = "UL";
            }
            this.y -= this.move_speed;
          }
        },
        move_up() {
          if (this.y > 24) {
            this.y -= this.move_speed;
          } else {
            if (this.dir === "UR") {
              this.dir = "DR";
            }
            if (this.dir === "UL") {
              this.dir = "DL";
            }
            this.y += this.move_speed;
          }
        },

        update() {
          switch (this.dir) {
            case "DR":
              this.move_down();
              this.move_right();
              break;
            case "DL":
              this.move_down();
              this.move_left();
              break;
            case "UR":
              this.move_up();
              this.move_right();
              break;
            default:
              this.move_up();
              this.move_left();
              break;
          }

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }

          if (this.invincible) {
            this.invisible = Math.floor(frameCount / 3) % 2 === 0;
          } else {
            this.invisible = false;
          }

          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          if (!this.invisible) {
            g.image(sprites[this.sprite_name], floored_x, floored_y);

            if (this.hit_opacity > 0) {
              g.blendMode(ADD);
              g.tint(255, this.hit_opacity);
              g.image(sprites[this.sprite_name], floored_x, floored_y);
              g.blendMode(BLEND);
              g.tint(255);
            }
          }

          if (this.hp < this.max_hp) {
            this.drawHealthBar();
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 4,
    type: "downbad",
    sprite_name: "downbad",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y, dir) {
      // closures etc

      let spd = 0;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 10;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 14,
        max_hp: 14,
        flashbang_timer: 50,
        should_teleport: false,
        dead: false,

        invincible: false,

        hurtbox: {
          invincible_to_id: -1,
          x: 4,
          y: 4,
          width: 16,
          height: 16,
          damage: 2,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;
          this.hit_spd = 3;
          this.hit_direction = angle;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        flashbang() {
          function create_flashbang() {
            let lifetime = 180;
            let count = 0;
            return {
              alph: 255,
              color: color(255),
              dead: false,
              update() {
                count++;
                if (count > 60) {
                  this.alph = 255 - ((count - 60) / 120) * 255;
                }
                if (count > lifetime) {
                  this.dead = true;
                }
              },
              draw() {
                g.blendMode(ADD);
                g.fill(255, 255, 255, this.alph);
                g.noStroke();
                g.rect(0, 0, ROOM_WIDTH_PIXELS, ROOM_HEIGHT_PIXELS);
                g.blendMode(BLEND);
                const all_downbads = get_my_enemy_manager().enemies.filter(
                  (enemy) => enemy.type === "downbad",
                );

                all_downbads.forEach((downbad) => {
                  if (typeof downbad.draw === "function") {
                    const floored_x = Math.floor(downbad.x);
                    const floored_y = Math.floor(downbad.y);
                    g.tint(0, 0, 0, this.alph);
                    g.image(sprites[downbad.sprite_name], floored_x, floored_y);
                    g.tint(255);
                  }
                });
              },
            };
          }
          sounds.flashbang.stop();
          sounds.flashbang.play();
          get_active_entities().push(create_flashbang());
        },

        update() {
          this.flashbang_timer--;
          if (this.flashbang_timer < 0) {
            this.flashbang_timer = 400 + Math.random() * 100;
            this.flashbang();
            if (!this.should_teleport) {
              this.should_teleport = true;
              return;
            }
            for (let i = 0; i < 30; i++) {
              const newx = Math.random() * ROOM_WIDTH_PIXELS;
              const newy = Math.random() * ROOM_HEIGHT_PIXELS;
              if (!this.checkCollision(newx, newy)) {
                this.x = newx;
                this.y = newy;
                break;
              }
            }
          }

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }

          if (this.invincible) {
            this.invisible = Math.floor(frameCount / 3) % 2 === 0;
          } else {
            this.invisible = false;
          }

          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          if (!this.invisible) {
            g.image(sprites[this.sprite_name], floored_x, floored_y);

            if (this.hit_opacity > 0) {
              g.blendMode(ADD);
              g.tint(255, this.hit_opacity);
              g.image(sprites[this.sprite_name], floored_x, floored_y);
              g.blendMode(BLEND);
              g.tint(255);
            }
          }

          if (this.hp < this.max_hp) {
            this.drawHealthBar();
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 93221,
    type: "pogyou",
    sprite_name: "pogyou",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;
      let squash_time_frames = 15;
      let spd = 0.1;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 5;
      let count = 0;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 15,
        max_hp: 15,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,
        squash_amount: 1,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 2,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          // TODO: have to add dynamic stuff like chests and gates to the collisions
          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;

          this.hit_direction = angle;
          this.hit_spd = 4;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        update() {
          count++;
          if (count % 60 === 0) {
            spd += 0.1;
          }

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
            this.squash_amount =
              sin((frameCount / squash_time_frames) * TWO_PI) *
              (this.hit_opacity / 90);
          } else {
            this.squash_amount = 0;
          }

          // POGGIN along

          direction = my_player
            ? calculate_angle_between_points(
                this.x,
                this.y,
                my_player.x,
                my_player.y,
              )
            : Math.random() * 360;
          // split spd into x and y components
          xspd = Math.cos(radians(direction)) * spd;
          yspd = Math.sin(radians(direction)) * spd;
          this.apply_speed();

          // Calculate squash and stretch amount with sine function oscillating over 60 frames
          // this.squash_amount = sin((frameCount / squash_time_frames) * TWO_PI);
        },
        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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
        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          // Set the squashing and stretching amounts
          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          // Reset the transformation matrix
          g.resetMatrix();

          // Translate to the desired origin (bottom center of hurtbox)
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );

          // Squash and stretch
          g.scale(xScale, yScale);

          // Draw the sprite. The coordinates are now relative to the bottom center of the hurtbox
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );

          // Reset the transformation matrix again so that other drawings aren't affected
          g.resetMatrix();
        },
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          this.drawSquashedSprite(this.squash_amount);

          if (this.hp < this.max_hp) {
            this.drawHealthBar(24, -12);
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            this.drawSquashedSprite(this.squash_amount);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 93222,
    type: "sadge",
    sprite_name: "sadge",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;
      let squash_time_frames = 15;
      let spd = 0.1;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 5;
      let count = 0;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 1,
        max_hp: 1,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,
        squash_amount: 1,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 1,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          // TODO: have to add dynamic stuff like chests and gates to the collisions
          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;

          this.hit_direction = angle;
          this.hit_spd = 4;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        update() {
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
            this.squash_amount =
              sin((frameCount / squash_time_frames) * TWO_PI) *
              (this.hit_opacity / 90);
          } else {
            this.squash_amount = 0;
          }

          // sadgin along

          // Calculate squash and stretch amount with sine function oscillating over 60 frames
          // this.squash_amount = sin((frameCount / squash_time_frames) * TWO_PI);
        },
        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          // Set the squashing and stretching amounts
          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          // Reset the transformation matrix
          g.resetMatrix();

          // Translate to the desired origin (bottom center of hurtbox)
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );

          // Squash and stretch
          g.scale(xScale, yScale);

          // Draw the sprite. The coordinates are now relative to the bottom center of the hurtbox
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );

          // Reset the transformation matrix again so that other drawings aren't affected
          g.resetMatrix();
        },
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          this.drawSquashedSprite(this.squash_amount);

          if (this.hp < this.max_hp) {
            this.drawHealthBar(24, -12);
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            this.drawSquashedSprite(this.squash_amount);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 2333333,
    type: "kekw2",
    sprite_name: "kekw2",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // Constants
      const LANDING_FRAMES = 30;
      const JUMPING_FRAMES = 60;
      const TOTAL_CYCLE_FRAMES = LANDING_FRAMES + JUMPING_FRAMES;
      const NORMAL_JUMP_HEIGHT = 30;
      const PLAYER_JUMP_HEIGHT = 80;
      const NORMAL_JUMP_RANGE = 50;
      const PLAYER_JUMP_RANGE = 10;
      const MAX_COLLISION_TRIES = 50;
      const COLLISION_EXPAND_AMOUNT = 5;
      const JUMPS_BEFORE_PLAYER = 3;

      // State variables
      let frame_counter =
        getRandomInt(0, 3) * Math.floor(TOTAL_CYCLE_FRAMES / 4);
      let jumps_since_player = JUMPS_BEFORE_PLAYER - 1;

      // FIX
      const cycle_position = frame_counter % TOTAL_CYCLE_FRAMES;
      const is_jumping = cycle_position < JUMPING_FRAMES;

      let current_z = 0;
      if (is_jumping) {
        // Handle jumping state
        const jump_progress = cycle_position / JUMPING_FRAMES;
        // Parabolic z motion
        const jump_height =
          jumps_since_player === JUMPS_BEFORE_PLAYER
            ? PLAYER_JUMP_HEIGHT
            : NORMAL_JUMP_HEIGHT;
        current_z = jump_height * (4 * jump_progress * (1 - jump_progress));
      }

      let target_x = x;
      let target_y = y;
      let start_x = x;
      let start_y = y;

      let max_spd = 5;
      let xspd = 0;
      let yspd = 0;

      return {
        type: this.type,
        sprite_name: Math.random() < 0.5 ? "kekw2" : "omegalul",
        x: x,
        y: y,
        hp: 11,
        max_hp: 11,
        hit_opacity: 0,
        squash_amount: 0,
        hit_spd: 0,
        hit_direction: 0,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 3,
        },

        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          // TODO: have to add dynamic stuff like chests and gates to the collisions
          return false;
        },

        get_hit(damage, angle) {
          this.hp -= damage;
          this.hit_direction = angle;
          this.hit_spd = 3;
          this.hit_opacity = 255;
        },

        die() {
          this.dead = true;
        },

        findValidTarget(max_distance, check_collision) {
          let tries = 0;
          let search_distance = max_distance;

          while (tries < MAX_COLLISION_TRIES) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * search_distance;
            const test_x = this.x + Math.cos(angle) * dist;
            const test_y = this.y + Math.sin(angle) * dist;

            if (!check_collision || !this.checkCollision(test_x, test_y)) {
              return { x: test_x, y: test_y };
            }

            tries++;
            search_distance += COLLISION_EXPAND_AMOUNT;
          }
          return { x: this.x, y: this.y }; // Fallback to current position
        },

        update() {
          const cycle_position = frame_counter % TOTAL_CYCLE_FRAMES;
          const is_jumping = cycle_position < JUMPING_FRAMES;

          if (is_jumping) {
            // Handle jumping state
            const jump_progress = cycle_position / JUMPING_FRAMES;

            if (cycle_position >= 5) {
              this.hurtbox.x = -7000;
            } else {
              this.hurtbox.x = 0;
            }

            // Parabolic z motion
            const jump_height =
              jumps_since_player === JUMPS_BEFORE_PLAYER
                ? PLAYER_JUMP_HEIGHT
                : NORMAL_JUMP_HEIGHT;
            current_z = jump_height * (4 * jump_progress * (1 - jump_progress));

            // Linear x/y movement
            this.x = start_x + (target_x - start_x) * jump_progress;
            this.y = start_y + (target_y - start_y) * jump_progress;

            // Initial stretch in first quarter
            if (jump_progress < 0.25) {
              const stretch_progress = jump_progress * 4;
              this.squash_amount = -Math.sin(stretch_progress * Math.PI);
            } else {
              this.squash_amount = 0;
            }
          } else {
            // Handle landing state
            const landing_progress =
              (cycle_position - JUMPING_FRAMES) / LANDING_FRAMES;
            this.squash_amount = Math.sin(landing_progress * Math.PI);
            current_z = 0;
            this.hurtbox.x = 0;

            // Choose new target at end of landing
            if (cycle_position === TOTAL_CYCLE_FRAMES - 1) {
              start_x = this.x;
              start_y = this.y;

              if (jumps_since_player === 0) {
                // Jump at player
                target_x =
                  my_player.x + (Math.random() - 0.5) * PLAYER_JUMP_RANGE * 2;
                target_y =
                  my_player.y + (Math.random() - 0.5) * PLAYER_JUMP_RANGE * 2;
                jumps_since_player = JUMPS_BEFORE_PLAYER;
              } else {
                // Random jump
                const target = this.findValidTarget(NORMAL_JUMP_RANGE, true);
                target_x = target.x;
                target_y = target.y;
                jumps_since_player--;
              }
            }
          }

          frame_counter++;

          if (this.hit_spd > 0) {
            // split spd into x and y components
            xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed();
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }
          // Handle hit flash fade
          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }
        },

        apply_speed() {
          // apply xspd
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x + xspd,
              this.y + this.hurtbox.y,
            )
          ) {
            this.x += xspd;
          } else {
            // we collided so move towards that wall in the x direction 1 pixel at a time
            if (xspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.ceil(this.x + this.hurtbox.x + i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    Math.floor(this.x + this.hurtbox.x - i),
                    this.y + this.hurtbox.y,
                  )
                ) {
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
          if (
            !this.checkCollision(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y + yspd,
            )
          ) {
            this.y += yspd;
          } else {
            // We collided, so move towards that wall in the y direction 1 pixel at a time
            if (yspd > 0) {
              let pixel_correct = 0;
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.ceil(this.y + this.hurtbox.y + i),
                  )
                ) {
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
              for (let i = 0; i <= max_spd; i++) {
                if (
                  !this.checkCollision(
                    this.x + this.hurtbox.x,
                    Math.floor(this.y + this.hurtbox.y - i),
                  )
                ) {
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

        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y - current_z); // Subtract z for height

          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          g.resetMatrix();
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );
          g.scale(xScale, yScale);
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );
          g.resetMatrix();
        },

        drawHealthBar: drawHealthBar,

        draw() {
          const SHADOW_BASE_WIDTH = this.sprite_name === "kekw2" ? 24 : 12;
          const SHADOW_MIN_WIDTH = SHADOW_BASE_WIDTH / 2;
          const SHADOW_BASE_ALPHA = 48;
          const SHADOW_MIN_ALPHA = 16; // Half of base alpha
          const SHADOW_Y_OFFSET = 13;
          const SHADOW_INNER_HEIGHT = 2;
          const SHADOW_TOTAL_HEIGHT = 4;

          // Get normalized height (0 to 1)
          const heightRatio = current_z / NORMAL_JUMP_HEIGHT;

          // Calculate shadow width based on z height
          const shadowWidth = Math.max(
            SHADOW_MIN_WIDTH,
            SHADOW_BASE_WIDTH * (1 - heightRatio),
          );

          // Calculate alpha using linear interpolation
          const currentAlpha = Math.max(
            SHADOW_BASE_ALPHA -
              heightRatio * (SHADOW_BASE_ALPHA - SHADOW_MIN_ALPHA),
            SHADOW_MIN_ALPHA,
          );
          // Calculate x offset to keep shadow centered
          const shadowXOffset = this.x + (SHADOW_BASE_WIDTH - shadowWidth) / 2;
          const shadowYOffset = this.y + SHADOW_Y_OFFSET;

          // Draw shadow
          g.noStroke();
          g.fill(0, 0, 0, currentAlpha);

          // Inner shadow rectangle
          g.rect(
            shadowXOffset + 1,
            shadowYOffset + 1,
            shadowWidth - 2,
            SHADOW_INNER_HEIGHT,
          );

          // Outer shadow rectangle
          g.rect(
            shadowXOffset,
            shadowYOffset,
            shadowWidth,
            SHADOW_TOTAL_HEIGHT,
          );
          this.drawSquashedSprite(this.squash_amount);

          if (this.hp < this.max_hp) {
            this.drawHealthBar(24, -12 - current_z); // Offset health bar by z
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            this.drawSquashedSprite(this.squash_amount);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y - current_z,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 221,
    type: "bruvchamp",
    sprite_name: "bruvchamp",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      // closures etc
      let direction = Math.random() * 360;
      let squash_time_frames = 15;
      let spd = 0.1;
      let xspd = 0;
      let yspd = 0;
      let max_spd = 5;
      let count = 0;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 9,
        max_hp: 9,
        hit_direction: 0,
        hit_spd: 0,
        hit_opacity: 0,
        squash_amount: 1,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 2,
        },
        internal_x: x,
        internal_y: y,
        hit_opacity: 0,
        hit_spd: 0,
        count: 0,
        state: "shaking", // or 'moving,
        target_x: 0,
        target_y: 0,
        random_targets_remaining: 3,
        frames_in_state: 0,
        frames_for_state: Math.floor(Math.random() * 100 + 100),

        // Configurable variables
        SHAKE_RANGE: 1,
        SHAKE_FRAMES_MIN: 40,
        SHAKE_FRAMES_MAX: 100,
        MOVE_SPEED: 4,
        PLAYER_TARGET_DISTANCE: 40,
        checkCollision(x, y) {
          // no collisions for this guy
          return false;
        },
        get_hit(damage, angle) {
          this.hp -= damage;

          this.hit_direction = angle;
          this.hit_spd = 3;
          this.hit_opacity = 255;
        },
        die() {
          this.dead = true;
        },
        update() {
          // Handle hit state
          if (this.hit_spd > 0) {
            let xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
            let yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
            this.apply_speed(xspd, yspd);
            this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
          }

          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 18);
            this.squash_amount =
              sin((frameCount / squash_time_frames) * TWO_PI) *
              (this.hit_opacity / 90);
            this.internal_x = this.x;
            this.internal_y = this.y;
            return; // Don't do other movement while hit
          }
          this.squash_amount = 0;

          this.frames_in_state++;

          if (this.frames_in_state >= this.frames_for_state) {
            this.switchState();
          }

          if (this.state === "shaking") {
            this.shake();
          } else if (this.state === "moving") {
            this.moveToTarget();
          }
        },

        shake() {
          this.x = this.internal_x + (Math.random() * 2 - 1) * this.SHAKE_RANGE;
          this.y = this.internal_y + (Math.random() * 2 - 1) * this.SHAKE_RANGE;
        },

        moveToTarget() {
          let direction = calculate_angle_between_points(
            this.x,
            this.y,
            this.target_x,
            this.target_y,
          );
          let xspd = Math.cos(radians(direction)) * this.MOVE_SPEED;
          let yspd = Math.sin(radians(direction)) * this.MOVE_SPEED;
          this.apply_speed(xspd, yspd);
        },

        switchState() {
          this.frames_in_state = 0;

          if (this.state === "shaking") {
            this.state = "moving";
            this.pickNewTarget();
            // Calculate frames needed to reach target
            let dist = Math.sqrt(
              Math.pow(this.target_x - this.x, 2) +
                Math.pow(this.target_y - this.y, 2),
            );
            this.frames_for_state = Math.ceil(dist / this.MOVE_SPEED);
          } else {
            this.state = "shaking";
            this.internal_x = this.x;
            this.internal_y = this.y;
            this.frames_for_state = Math.floor(
              Math.random() * (this.SHAKE_FRAMES_MAX - this.SHAKE_FRAMES_MIN) +
                this.SHAKE_FRAMES_MIN,
            );
          }
        },

        pickNewTarget() {
          if (this.random_targets_remaining > 0) {
            this.target_x = Math.random() * ROOM_WIDTH_PIXELS;
            this.target_y = Math.random() * ROOM_HEIGHT_PIXELS;
            this.random_targets_remaining--;
          } else {
            // Target beyond player
            let direction = calculate_angle_between_points(
              this.x,
              this.y,
              my_player.x,
              my_player.y,
            );
            let distance =
              Math.sqrt(
                Math.pow(my_player.x - this.x, 2) +
                  Math.pow(my_player.y - this.y, 2),
              ) + this.PLAYER_TARGET_DISTANCE;

            this.target_x = this.x + Math.cos(radians(direction)) * distance;
            this.target_y = this.y + Math.sin(radians(direction)) * distance;

            this.random_targets_remaining = 3; // Reset for next cycle
          }
        },

        apply_speed(xspd, yspd) {
          this.x += xspd;
          this.y += yspd;
        },
        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          // Set the squashing and stretching amounts
          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          // Reset the transformation matrix
          g.resetMatrix();

          // Translate to the desired origin (bottom center of hurtbox)
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );

          // Squash and stretch
          g.scale(xScale, yScale);

          // Draw the sprite. The coordinates are now relative to the bottom center of the hurtbox
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );

          // Reset the transformation matrix again so that other drawings aren't affected
          g.resetMatrix();
        },
        drawHealthBar: drawHealthBar,
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          this.drawSquashedSprite(this.squash_amount);

          if (this.hp < this.max_hp) {
            this.drawHealthBar(24, -12);
          }

          if (this.hit_opacity > 0) {
            g.blendMode(ADD);
            g.tint(255, this.hit_opacity);
            this.drawSquashedSprite(this.squash_amount);
            g.blendMode(BLEND);
            g.tint(255);
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },

  {
    index: 40, //TODO: Make sure this doesnt break stuff
    type: "lebum",
    sprite_name: "lebum",
    phases: [`spawned`, `pregame`, `health_load`, `phase1`],
    new_spawnpoint(rm) {
      return {
        index: this.index,
        type: this.type,
        x: Math.floor(ROOM_WIDTH_TILES / 2) - 4.5,
        y: 5,
      };
    },
    new_instance(x, y) {
      // closures etc
      const current_room = dungeon.rooms[current_dungeon_room_index];
      let level = 0;
      let starting_hp = 30;
      let my_damage = 2;
      let sprite_name = "lebum";
      let final_boss = false;
      let pregame_text = [];
      let dying_text = [];

      if (current_room.biome === "grassland") {
        level = 1;
        starting_hp = 100;
        my_damage = 1;
        sprite_name = "lebum";
        pregame_text = [
          `so........ ${ch_names[selected_character]}`,
          `u finally made it.`,
          `but. your journey ends here`,
          "prepare urself",
        ];
        dying_text = [
          "ow ow, i died",
          `but my minions will make light work of you..\nif you proceed in to the CAVES OF JOE`,
          `u haven't seen the last of me.............`,
        ];
      } else if (current_room.biome === "cave") {
        level = 2;
        starting_hp = 256;
        my_damage = 2;
        sprite_name = "lebum";
        pregame_text = [
          `${ch_names[selected_character]} i cant believe u made it again...`,
          `this time it wont be so easy...`,
          `even tho it will be kind of similar to last time...\nbecause my boss attack patterns are the same\njust faster...`,
          "prepare urself2",
        ];
        dying_text = [
          `i died but level 2`,
          "noo02....... i failed... my master IBDW...",
          `go on... the CASTLE awaits u...... the final level`,
          `u HAVE seen the last of me....`,
        ];
      } else if (current_room.biome === "castle") {
        level = 3;
        starting_hp = 600;
        my_damage = 2;
        sprite_name = "ibdw";
        final_boss = true;
        pregame_text = [
          `i have been waiting for u. ${ch_names[selected_character]}`,
          `yes i am ibdw`,
          `prepare to DIE`,
        ];
        dying_text = [
          "noooo.... NOOOOOO........",
          `${ch_names[selected_character]}... u think you have defeated me...`,
          `but... u failed to account for 1 thing...`,
          `MY FINAL FORM!!!!!!!!!`,
          `yes thats right. that was just a warmup. i hope\nu have enough hp left.`,
          `here i go...`,
          `my final form.......!`,
          "JUST FKING KIDDING i dont have a final form",
          `im dead now goodbye`,
        ];
      }

      return {
        type: this.type,
        boss: true,
        final_boss: final_boss,
        level: level,
        pregame_text: pregame_text,
        dying_text: dying_text,
        phase: this.phases[0],
        frame_count: 0,
        sprite_name: sprite_name,
        x: x,
        y: y,
        move_speed: 1,
        dir_index: 0,
        dir: "right",
        frames_to_spawn_lemickeys: 60,

        // Level 3 specific vars
        frames_to_teleport: 240, // teleport every 4 seconds initially
        frames_to_wait_after_reappearing: 0,
        is_teleporting: false,
        teleport_frame_count: 0,
        teleport_state: "none", // 'none', 'disappearing', 'waiting', 'telegraphing', 'appearing'
        telegraph_x: 0, // Where the boss will reappear
        telegraph_y: 0,
        has_spawned_phase2_enemies: false,

        invincible: false,
        max_hp: starting_hp,
        hp: 0,

        hurtbox: {
          invincible_to_id: -1,
          x: 10,
          y: 5,
          width: 60,
          height: 70,
          damage: my_damage,
        },
        checkCollision(x, y) {
          const grid = dungeon.rooms[current_dungeon_room_index].tiles;

          // Calculate start and end indices for both x and y axis
          const startX = Math.floor(x / TILE_SIZE);
          const startY = Math.floor(y / TILE_SIZE);
          const endX = Math.ceil((x + this.hurtbox.width) / TILE_SIZE);
          const endY = Math.ceil((y + this.hurtbox.height) / TILE_SIZE);

          // Ensure indices are within grid bounds
          const checkedStartX = Math.max(0, startX);
          const checkedStartY = Math.max(0, startY);
          const checkedEndX = Math.min(grid[0].length, endX);
          const checkedEndY = Math.min(grid.length, endY);

          for (let tile_y = checkedStartY; tile_y < checkedEndY; tile_y++) {
            for (let tile_x = checkedStartX; tile_x < checkedEndX; tile_x++) {
              if (
                grid[tile_y][tile_x] === "." ||
                (this.can_swim && grid[tile_y][tile_x] === "2")
              ) {
                continue;
              }
              const wall_x = tile_x * TILE_SIZE;
              const wall_y = tile_y * TILE_SIZE;

              if (
                x < wall_x + TILE_SIZE &&
                x + this.hurtbox.width > wall_x &&
                y < wall_y + TILE_SIZE &&
                y + this.hurtbox.height > wall_y
              ) {
                return true;
              }
            }
          }

          return false;
        },
        get_hit(damage, angle) {
          if (this.phase === `dying_cutscene`) {
            return;
          }
          this.hp -= damage;
          this.hit_opacity = 255;
        },
        reset_hurtbox() {
          this.hurtbox.x = 10;
        },
        die() {
          if (this.phase === `dying_cutscene`) {
            return;
          }
          //STOP. THE MUSIC.
          sounds.mus_boss.stop();
          sounds.mus_final_boss.stop();
          //START DYIHNG.
          this.phase = `dying_cutscene`;
          sounds.mus_boss_blowing_up.setVolume(
            sounds.mus_boss_blowing_up_volume,
          );
          sounds.mus_boss_blowing_up.loop();
          // killem all
          get_my_enemy_manager()
            .enemies.filter((ene) => !ene.boss)
            .forEach((ene) => {
              ene.die();
            });
          // start that cutscene
          get_my_enemy_manager().instances.push(
            create_textbox(this.dying_text),
          );
        },
        update() {
          this.frame_count++;
          if (this.phase === `spawned`) {
            return;
          }
          if (this.phase === `pregame`) {
            if (mode === "DEVELOPMENT" && debug_mode) {
              // this.max_hp = 30;
            }
            return;
          }
          if (this.phase === `health_load`) {
            const TOTAL_FRAMES = 120; // Total duration in frames of the health_load phase
            const FRAMES_TO_ZERO = 40; // Number of frames to go from negative hp to 0
            const FRAMES_PAST_ZERO = 40; // Number of frames to past

            const HP_PER_FRAME = this.max_hp / (TOTAL_FRAMES - FRAMES_TO_ZERO);
            const START_HP = -HP_PER_FRAME * FRAMES_TO_ZERO;

            // Calculate the current hp based on the frame count
            this.hp = START_HP + HP_PER_FRAME * this.frame_count;

            // Clamp hp to not exceed max_hp
            this.hp = Math.min(this.hp, this.max_hp);

            if (this.frame_count >= TOTAL_FRAMES + FRAMES_PAST_ZERO) {
              this.phase = `phase1`;
            }

            return;
          }
          if (this.phase === `dying_cutscene`) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 40);
            if (this.hit_opacity <= 0) {
              this.hit_opacity = 255;
            }
            if (
              !get_my_enemy_manager().instances.find((instance) => {
                return instance.type === `textbox`;
              })
            ) {
              if (!sounds.exploud.isPlaying()) {
                sounds.exploud.play();
              }
              this.dead = true;
            }
            return;
          }

          //ok. now we are in battle phase

          if (level === 1) {
            this.frames_to_spawn_lemickeys -= 1;
            if (this.hp < this.max_hp / 2) {
              // spawn lemickeys faster, at half health
              this.frames_to_spawn_lemickeys -= 0.8;
            }
            if (this.frames_to_spawn_lemickeys < 1) {
              const dirs = ["DR", "DL", "UR", "UL"];
              let shuffled_dirs = [...dirs].sort(() => Math.random() < 0.5); // Shuffle the array

              get_my_enemy_manager().enemies.push(
                find_enemy_by_type("lemickey").new_instance(
                  this.x + 24,
                  this.y + 28,
                  shuffled_dirs[0],
                ),
              );
              if (this.hp < this.max_hp / 2) {
                // spawn more lemickeys at half health
                get_my_enemy_manager().enemies.push(
                  find_enemy_by_type("lemickey").new_instance(
                    this.x + 24,
                    this.y + 28,
                    shuffled_dirs[1],
                  ),
                );
              }
              this.frames_to_spawn_lemickeys = getRandomInt(7, 10) * 60;
            }

            const dirs = ["right", "down", "left", "up"];
            //level 1 move speed
            if (this.hp < this.max_hp / 2) {
              this.move_speed = 2;
            }

            switch (this.dir) {
              case "right":
                if (this.x + this.hurtbox.width < 296) {
                  this.x += this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }

                break;
              case "down":
                if (this.y + this.hurtbox.height < 176) {
                  this.y += this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }

                break;
              case "left":
                if (this.x > 8) {
                  this.x -= this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }
                break;
              default:
                if (this.y > 6) {
                  this.y -= this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }

                break;
            }
          }

          if (level === 2) {
            // Similar to level 1 but more aggressive
            this.frames_to_spawn_lemickeys -= 1;

            if (this.frames_to_spawn_lemickeys < 1) {
              const dirs = ["DR", "DL", "UR", "UL"];
              let shuffled_dirs = [...dirs].sort(() => Math.random() < 0.5);

              // Always spawn 2 lemickeys
              get_my_enemy_manager().enemies.push(
                find_enemy_by_type("lemickey").new_instance(
                  this.x + 24,
                  this.y + 28,
                  shuffled_dirs[0],
                ),
              );
              get_my_enemy_manager().enemies.push(
                find_enemy_by_type("lemickey").new_instance(
                  this.x + 24,
                  this.y + 28,
                  shuffled_dirs[1],
                ),
              );

              // At half health, spawn a 3rd one
              if (this.hp < this.max_hp / 2) {
                get_my_enemy_manager().enemies.push(
                  find_enemy_by_type("lemickey").new_instance(
                    this.x + 24,
                    this.y + 28,
                    shuffled_dirs[2],
                  ),
                );
              }

              this.frames_to_spawn_lemickeys = getRandomInt(6, 8) * 60; // Faster respawn than level 1
            }

            const dirs = ["right", "down", "left", "up"];

            // Faster movement from the start
            this.move_speed = 1.5;
            if (this.hp < this.max_hp / 2) {
              this.move_speed = 2.5; // Even faster at half health
            }

            // Movement logic (same as level 1)
            switch (this.dir) {
              case "right":
                if (this.x + this.hurtbox.width < 296) {
                  this.x += this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }
                break;
              case "down":
                if (this.y + this.hurtbox.height < 176) {
                  this.y += this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }
                break;
              case "left":
                if (this.x > 8) {
                  this.x -= this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }
                break;
              default:
                if (this.y > 6) {
                  this.y -= this.move_speed;
                } else {
                  this.dir_index = (this.dir_index + 1) % 4;
                  this.dir = dirs[this.dir_index];
                }
                break;
            }
          }

          if (level === 3) {
            // Final boss - ibdw
            // Fast movement speed
            this.move_speed = 2;
            if (this.hp < this.max_hp / 2) {
              this.move_speed = 3; // Ultra fast at half health
            }

            // Teleport attack - disappear and spawn enemies
            if (this.teleport_state === "none") {
              this.frames_to_teleport -= 1;

              // Teleport more frequently at half health
              if (
                this.hp < this.max_hp / 2 &&
                !this.has_spawned_phase2_enemies
              ) {
                this.frames_to_teleport -= 1; // Count down twice as fast
              }

              if (this.frames_to_teleport < 1) {
                this.teleport_state = "disappearing";
                this.teleport_frame_count = 0;
                this.invisible = true;
              }
            } else if (this.teleport_state === "disappearing") {
              this.teleport_frame_count++;

              if (this.teleport_frame_count === 20) {
                sounds.noix_down.play();
                sounds.noix_up.play();
              }

              // Disappearing phase - flash visible/invisible and spawn enemies
              // After 60 frames (1 second), move to waiting state
              if (this.teleport_frame_count >= 60) {
                // Spawn 3 random enemies at quarter of the disappearing phase
                const spawn_positions = [
                  { x: 60, y: 60 },
                  { x: 200, y: 60 },
                  { x: 130, y: 120 },
                ];

                // Minimum safe distance (player is 8x8, enemy is 24x24, so we need clearance)
                const MIN_DISTANCE = 40; // Safe buffer to ensure no overlap

                spawn_positions.forEach((pos, index) => {
                  // Check if this position is too close to the player
                  const dx = pos.x - my_player.x;
                  const dy = pos.y - my_player.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  if (distance < MIN_DISTANCE) {
                    // Too close! Move to fallback position
                    spawn_positions[index] = { x: 200, y: 130 };
                  }
                });

                const all_enemy_names = [
                  "5mower",
                  "unknown",
                  "hypers",
                  "pepega",
                  "lemickey",
                  "downbad",
                  "pogyou",
                  "sadge",
                  "kekw2",
                  "bruvchamp",
                ];
                const dirs = ["DR", "DL", "UR", "UL"];
                for (let i = 0; i < 3; i++) {
                  const random_enemy_type =
                    all_enemy_names[
                      Math.floor(Math.random() * all_enemy_names.length)
                    ];
                  const random_dir =
                    dirs[Math.floor(Math.random() * dirs.length)];
                  get_my_enemy_manager().enemies.push(
                    find_enemy_by_type(random_enemy_type).new_instance(
                      spawn_positions[i].x,
                      spawn_positions[i].y,
                      random_dir,
                    ),
                  );
                }

                // After 60 frames (1 second), move to waiting state
                if (this.teleport_frame_count >= 60) {
                  this.teleport_state = "waiting";
                  this.invisible = true;
                  // move hurtbox out of the way so that we cant hurt the player
                  this.hurtbox.x = -10000;
                  this.teleport_frame_count = 0;
                  // Set the position where boss will reappear
                  this.telegraph_x = getRandomInt(40, ROOM_WIDTH_PIXELS - 90);
                  this.telegraph_y = getRandomInt(40, ROOM_HEIGHT_PIXELS - 90);
                }
              }
            } else if (this.teleport_state === "waiting") {
              this.teleport_frame_count++;
              const enemies_left = get_my_enemy_manager().enemies.filter(
                (ene) => !ene.boss,
              );

              // Wait completely invisibly for 9 seconds (560 frames at 60fps)
              if (
                this.teleport_frame_count >= 560 ||
                enemies_left.length === 0
              ) {
                this.teleport_state = "telegraphing";
                this.teleport_frame_count = 0;
              }
            } else if (this.teleport_state === "telegraphing") {
              this.teleport_frame_count++;

              // Telegraph for 2 seconds (120 frames at 60fps)
              if (this.teleport_frame_count >= 120) {
                // wait for 2 seconds after reappearing
                this.frames_to_wait_after_reappearing = 120;
                this.dir = "right";
                this.dir_index = 0;

                // Actually reappear at the telegraphed position
                this.x = this.telegraph_x;
                this.y = this.telegraph_y;

                this.teleport_state = "none";
                this.invincible = false;
                this.invisible = false;
                this.reset_hurtbox();

                // Set next teleport time
                if (this.hp < this.max_hp / 2) {
                  this.frames_to_teleport = getRandomInt(7, 9) * 60; // Faster at low health
                } else {
                  this.frames_to_teleport = getRandomInt(9, 12) * 60;
                }
              }
            }

            // Normal movement when not teleporting
            if (this.teleport_state === "none") {
              this.frames_to_wait_after_reappearing--;
              const dirs = ["right", "down", "left", "up"];

              if (this.frames_to_wait_after_reappearing <= 0) {
                switch (this.dir) {
                  case "right":
                    if (this.x + this.hurtbox.width < 296) {
                      this.x += this.move_speed;
                    } else {
                      this.dir_index = (this.dir_index + 1) % 4;
                      this.dir = dirs[this.dir_index];
                    }
                    break;
                  case "down":
                    if (this.y + this.hurtbox.height < 176) {
                      this.y += this.move_speed;
                    } else {
                      this.dir_index = (this.dir_index + 1) % 4;
                      this.dir = dirs[this.dir_index];
                    }
                    break;
                  case "left":
                    if (this.x > 8) {
                      this.x -= this.move_speed;
                    } else {
                      this.dir_index = (this.dir_index + 1) % 4;
                      this.dir = dirs[this.dir_index];
                    }
                    break;
                  default:
                    if (this.y > 6) {
                      this.y -= this.move_speed;
                    } else {
                      this.dir_index = (this.dir_index + 1) % 4;
                      this.dir = dirs[this.dir_index];
                    }
                    break;
                }
              }
            }
          }

          if (this.hit_opacity > 0) {
            this.hit_opacity = Math.max(0, this.hit_opacity - 20);
          }

          if (this.invincible) {
            this.invisible = Math.floor(frameCount / 3) % 2 === 0;
          } else {
            this.invisible = false;
          }

          if (
            this.teleport_state === "disappearing" &&
            this.teleport_frame_count > 20
          ) {
            this.invisible = Math.floor(frameCount / 2) % 2 === 0;
          }

          if (
            this.teleport_state === "waiting" ||
            this.teleport_state === "telegraphing"
          ) {
            this.invisible = true;
          }
        },
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          g.fill(255, 0, 0);
          g.noStroke();
          let hpbarx = 48;
          let hpbary = 12;
          let hpbarw = WIDTH_PIXELS - hpbarx * 2;
          let hpbarh = 6;
          let hp_percent =
            this.hp > 0 ? Math.max(0, Math.min(1, this.hp / this.max_hp)) : 0; // Ensures hp_percent is between 0 and 1
          let adjusted_hpbarw = Math.ceil(hp_percent * hpbarw); // Adjust the width of hp bar based on the percentage

          if (this.hp > 0) {
            g.rect(hpbarx, hpbary, adjusted_hpbarw, hpbarh);
          }

          g.tint(255);

          // Draw telegraph indicator when in telegraphing state
          if (this.teleport_state === "telegraphing") {
            // visual telegraph effect
            // This draws a pulsing yellow circle at the reappear location
            // You can replace this with a custom sprite, animation, or effect

            const pulse = Math.sin(this.teleport_frame_count * 0.1) * 0.3 + 0.7; // Pulsing between 0.4 and 1.0
            const alpha = 150 * pulse;

            g.fill(255, 224, 32, alpha);
            g.noStroke();

            // Draw a circle that grows and shrinks
            const baseRadius = 40;
            const radius = baseRadius * (1 + pulse * 0.3);
            g.ellipse(
              this.telegraph_x + this.hurtbox.width / 2,
              this.telegraph_y + this.hurtbox.height / 2,
              radius * 2,
              radius * 2,
            );
          }

          if (!this.invisible) {
            g.image(sprites[this.sprite_name], floored_x, floored_y);

            if (this.hit_opacity > 0) {
              g.blendMode(ADD);
              g.tint(255, this.hit_opacity);
              g.image(sprites[this.sprite_name], floored_x, floored_y);
              g.blendMode(BLEND);
              g.tint(255);
            }
          }

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
  {
    index: 1,
    type: "4head",
    sprite_name: "4head",
    new_spawnpoint(rm) {
      function try_to_get_spawnpoint() {
        let spawn_x = Math.floor(
          Math.random() * (ROOM_WIDTH_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        let spawn_y = Math.floor(
          Math.random() * (ROOM_HEIGHT_TILES - 3 - WALL_WIDTH_TILES * 2 - 4) +
            WALL_WIDTH_TILES +
            2,
        );
        return { spawn_x, spawn_y };
      }
      // spawn it anywhere that has an empty 2x3
      let newspawns = try_to_get_spawnpoint();
      let spawn_x = newspawns.spawn_x;
      let spawn_y = newspawns.spawn_y;

      let tries = 0;
      let max_tries = 500;
      while (
        !(
          rm.tiles[spawn_y + 0][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 0][spawn_x + 2] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 0] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 1] === "." &&
          rm.tiles[spawn_y + 1][spawn_x + 2] === "."
        )
      ) {
        tries++;
        newspawns = try_to_get_spawnpoint();
        spawn_x = newspawns.spawn_x;
        spawn_y = newspawns.spawn_y;
        if (tries > max_tries) {
          break;
        }
      }
      return {
        index: this.index,
        type: this.type,
        x: spawn_x,
        y: spawn_y,
      };
    },
    new_instance(x, y) {
      let squash_time_frames = 40;

      return {
        type: this.type,
        sprite_name: this.sprite_name,
        x: x,
        y: y,
        hp: 999, // Can't be killed
        max_hp: 999,
        squash_amount: 0, // Start at 0 (normal scale)
        fade: 0,
        fade_count: 0,
        is_fading: false,
        hurtbox: {
          invincible_to_id: -1,
          x: 0,
          y: 0,
          width: 24,
          height: 16,
          damage: 0, // Does no damage
        },
        is_textbox_talking() {
          // TODO: Replace this with the actual check for whether the textbox is in "talking" state
          // This should return true when the textbox is typing text, false otherwise

          // Get the textbox instance from the enemy manager
          const textbox = get_my_enemy_manager().instances.find((instance) => {
            return instance.type === `textbox`;
          });

          // If textbox exists, check its talking state
          if (textbox) {
            return textbox.is_talking();
          }

          return false; // No textbox = not talking
        },
        is_textbox_finished() {
          // check for whether the textbox has finished
          // This should return true when the textbox has completed typing
          //
          if (
            get_my_enemy_manager().instances.find((instance) => {
              return instance.type === `textbox`;
            })
          ) {
            return false;
          } else {
            return true;
          }
        },
        get_hit(damage, angle) {
          // 4head cannot be hurt
        },
        die() {
          // 4head cannot die
        },
        update() {
          // Check if textbox is talking to engage squash animation
          if (this.is_textbox_talking()) {
            // Calculate squash and stretch amount with sine function oscillating
            this.squash_amount = sin(
              (frameCount / squash_time_frames) * TWO_PI,
            );
          } else {
            // Normal scale when not talking
            this.squash_amount = 0;
          }

          // Check if textbox finished to start fade
          if (this.is_textbox_finished() && !this.is_fading) {
            this.is_fading = true;
            this.fade_count = 0;
          }

          // Handle fade out
          if (this.is_fading) {
            this.fade_count++;
            if (this.fade_count % 16 === 0) {
              this.fade += 1;
            }
            if (this.fade_count < 148) {
              set_fade_level(this.fade);
            } else {
              // Fade complete, go to next room
              room_goto_next();
            }
          }
        },
        drawSquashedSprite(amount) {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);

          // Set the squashing and stretching amounts
          let yScale = 1 - amount * 0.2;
          let xScale = 2 - yScale;

          // Reset the transformation matrix
          g.resetMatrix();

          // Translate to the desired origin (bottom center of hurtbox)
          g.translate(
            floored_x + this.hurtbox.width / 2,
            floored_y + this.hurtbox.height,
          );

          // Squash and stretch
          g.scale(xScale, yScale);

          // Draw the sprite. The coordinates are now relative to the bottom center of the hurtbox
          g.image(
            sprites[this.sprite_name],
            -this.hurtbox.width / 2,
            -this.hurtbox.height - 6,
          );

          // Reset the transformation matrix again so that other drawings aren't affected
          g.resetMatrix();
        },
        draw() {
          const floored_x = Math.floor(this.x);
          const floored_y = Math.floor(this.y);
          this.drawSquashedSprite(this.squash_amount);

          if (debug_mode) {
            g.fill(255, 255, 0, 128);
            g.noStroke();
            g.rect(
              this.x + this.hurtbox.x,
              this.y + this.hurtbox.y,
              this.hurtbox.width,
              this.hurtbox.height,
            );
          }
        },
      };
    },
  },
];
