const kekw2_enemy = {
  index: 2,
  type: "kekw2",
  sprite_name: "kekw2",
  new_instance(x, y) {
    // Timing constants
    const LANDING_FRAMES = 30;
    const JUMPING_FRAMES = 60;
    const TOTAL_CYCLE = LANDING_FRAMES + JUMPING_FRAMES;

    // Jump heights and distances
    const NORMAL_JUMP_HEIGHT = 40;
    const PLAYER_JUMP_HEIGHT = 40;
    const NORMAL_JUMP_RANGE = 50;
    const PLAYER_JUMP_RANGE = 20;
    const COLLISION_CHECK_ATTEMPTS = 50;
    const COLLISION_EXPAND_AMOUNT = 5;

    // State variables
    let state = "landing";
    let frame_counter = 0;
    let jumps_until_player = 3;
    let start_x = x;
    let start_y = y;
    let target_x = x;
    let target_y = y;
    let current_z = 0;

    return {
      type: this.type,
      sprite_name: this.sprite_name,
      x: x,
      y: y,
      hp: 3,
      max_hp: 3,
      hit_opacity: 0,
      squash_amount: 0,
      hurtbox: {
        invincible_to_id: -1,
        x: 0,
        y: 0,
        width: 24,
        height: 16,
        damage: 1,
      },

      checkCollision(x, y) {
        // Same as unknown enemy
        return false; // Placeholder
      },

      get_hit(damage, angle) {
        // Only take damage if not in middle of jump
        if (
          state === "jumping" &&
          frame_counter > 5 &&
          frame_counter < JUMPING_FRAMES - 5
        ) {
          return;
        }

        this.hp -= damage;
        this.hit_opacity = 255;
      },

      die() {
        this.dead = true;
      },

      pickNewTarget() {
        jumps_until_player--;

        if (jumps_until_player <= 0) {
          // Jump towards player
          target_x = my_player.x + (Math.random() * 2 - 1) * PLAYER_JUMP_RANGE;
          target_y = my_player.y + (Math.random() * 2 - 1) * PLAYER_JUMP_RANGE;
          jumps_until_player = 3; // Reset counter
        } else {
          // Random jump
          let found = false;
          let attempt = 0;
          let search_range = NORMAL_JUMP_RANGE;

          while (!found && attempt < COLLISION_CHECK_ATTEMPTS) {
            target_x = this.x + (Math.random() * 2 - 1) * search_range;
            target_y = this.y + (Math.random() * 2 - 1) * search_range;

            // Keep in bounds
            target_x = Math.max(0, Math.min(ROOM_WIDTH_PIXELS, target_x));
            target_y = Math.max(0, Math.min(ROOM_HEIGHT_PIXELS, target_y));

            if (!this.checkCollision(target_x, target_y)) {
              found = true;
            }

            attempt++;
            search_range += COLLISION_EXPAND_AMOUNT;
          }
        }
      },

      update() {
        frame_counter++;

        if (state === "landing") {
          // Landing squash animation
          const landing_progress = frame_counter / LANDING_FRAMES;
          this.squash_amount = -Math.sin(landing_progress * Math.PI);

          if (frame_counter >= LANDING_FRAMES) {
            state = "jumping";
            frame_counter = 0;
            start_x = this.x;
            start_y = this.y;
            this.pickNewTarget();
          }
        } else if (state === "jumping") {
          // Movement
          const jump_progress = frame_counter / JUMPING_FRAMES;
          this.x = start_x + (target_x - start_x) * jump_progress;
          this.y = start_y + (target_y - start_y) * jump_progress;

          // Z height (parabolic)
          const jump_height =
            jumps_until_player === 3 ? PLAYER_JUMP_HEIGHT : NORMAL_JUMP_HEIGHT;
          current_z = jump_height * 4 * jump_progress * (1 - jump_progress);

          // Initial stretch
          if (frame_counter <= JUMPING_FRAMES / 4) {
            const stretch_progress = frame_counter / (JUMPING_FRAMES / 4);
            this.squash_amount = Math.sin(stretch_progress * Math.PI);
          } else {
            this.squash_amount = 0;
          }

          if (frame_counter >= JUMPING_FRAMES) {
            state = "landing";
            frame_counter = 0;
          }
        }

        // Hit flash fade
        if (this.hit_opacity > 0) {
          this.hit_opacity = Math.max(0, this.hit_opacity - 20);
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
};
