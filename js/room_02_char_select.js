import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sprites as s, sounds } from "./assets.js";
import { set_fade_level } from "./faderShader.js";

// -------------------------------------------------------------------------------- ROOM CHAR SELECT

export function instantiate_room_char_select() {
  char_select_state = 0;
  active_entities = [];

  // SORT OUT WHICH CHARACTER(s) WE ARE UNLOCKING
  // let character_to_unlock = -1;
  // if (globalThis.unlocked_a_character) {
  //   for (let i = 0; i < Object.keys(characterUnlocked).length; i++) {
  //     if (!characterUnlocked[i]) {
  //       character_to_unlock = i;
  //       break;
  //     }
  //   }
  // }
  //
  // SORT OUT WHICH CHARACTERS WE ARE UNLOCKING
  let characters_to_unlock = [];
  if (globalThis.unlocked_a_character) {
    for (let i = 0; i < Object.keys(characterUnlocked).length; i++) {
      if (globalThis.ready_to_unlock_characters[i]) {
        characters_to_unlock.push(i);
      }
    }
  }
  onCharacterUnlocked();

  // ----------------------------------------- ----------------------------------------- BG + BGM
  active_entities.push({
    type: "bg",
    spr: s.bg_charselect,
    x: 0,
    y: 0,
    fade: 8,
    count: 0,
    update() {
      this.count++;
      if (this.count % 4 === 0) {
        this.fade -= 1;
      }
      if (this.count < 60) {
        set_fade_level(this.fade);
      }
      if (this.count === 90) {
        char_select_state = 1;
      }
    },
    draw() {
      g.image(this.spr, 0, 0);
    },
  });
  // ----------------------------------------- ----------------------------------------- BG PARTICLES
  for (let i = 0; i < 40; i++) {
    active_entities.push(
      (() => {
        const size = floor(Math.random() * 3);
        const xx = floor(Math.random() * WIDTH_PIXELS);
        const yy = floor(Math.random() * HEIGHT_PIXELS);
        const xspd = Math.random() * -4 - 2;
        const yspd = Math.random() * 0.5 + 1;
        return {
          x: xx,
          y: yy,
          update() {
            this.x += xspd;
            this.y += yspd;
            if (this.x < 0) {
              this.x = WIDTH_PIXELS;
            }
            // if (this.y < 0) {
            //   this.y = HEIGHT_PIXELS;
            // }
            // if (this.x < WIDTH_PIXELS) {
            //   this.x = 0;
            // }
            if (this.y > WIDTH_PIXELS) {
              this.y = 1;
            }
          },
          draw() {
            g.fill(255);
            g.stroke(128, 148, 192);
            g.rect(this.x, this.y, size, size);
          },
        };
      })(),
    );
  }
  // ----------------------------------------- ----------------------------------------- CHARACTER ICONS
  let count = 0;
  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) {
      count++;
      active_entities.push(
        (() => {
          //private vars
          let text = `TRY THE ARROW KEYS`;
          return {
            num: count,
            num_rotated_90_degrees: cx * 4 + cy,
            startFrame: frameCount,
            state3startFrame: frameCount,
            state4startFrame: frameCount,
            spr: s[`sprite_IC${count}`],
            x: cx * 40 + 16 - 2,
            y: cy * 48 + 40,
            xoff: 0,
            yoff: 260,
            unlock_glow_timer: 0,
            unlock_glow_alph: 0,
            update() {
              const current_frame = frameCount - this.startFrame;

              // locked / unlocked?
              if (characterUnlocked[this.num - 1]) {
                this.spr = s[`sprite_IC${this.num}`];
              } else {
                this.spr = s[`sprite_IC_locked`];
              }

              if (characters_to_unlock.includes(this.num - 1)) {
                this.unlock_glow_timer++;
                this.unlock_glow_alph =
                  Math.abs(Math.sin(this.unlock_glow_timer / 20)) * 200;
              } else {
                this.unlock_glow_alph = 0;
              }

              if (char_select_state !== 3) {
                this.state3startFrame = frameCount;
              }
              if (char_select_state !== 4) {
                this.state4startFrame = frameCount;
              }

              switch (char_select_state) {
                case 0:
                case 1:
                  if (current_frame > 30 + this.num * 2) {
                    // animate in
                    const speed_factor = 6;
                    this.yoff = (this.yoff * speed_factor) / (speed_factor + 1);
                  }
                  break;
                case 2:
                  break;
                case 3:
                  let my_state3_starting_frame =
                    this.state3startFrame + this.num_rotated_90_degrees * 2; // offset each icon
                  let duration = 40;
                  if (
                    frameCount > my_state3_starting_frame &&
                    frameCount < my_state3_starting_frame + duration
                  ) {
                    let t = (frameCount - my_state3_starting_frame) / duration;
                    this.xoff = cosineInterp(
                      0,
                      -(200 + this.num_rotated_90_degrees * 30),
                      t,
                    );
                  }
                  break;
                case 4:
                  //BACK TO CASE 1
                  let my_state4_starting_frame =
                    this.state4startFrame +
                    (15 - this.num_rotated_90_degrees) * 2; // offset each icon
                  let duration2 = 30;
                  if (
                    frameCount > my_state4_starting_frame &&
                    frameCount <= my_state4_starting_frame + duration2
                  ) {
                    let t = (frameCount - my_state4_starting_frame) / duration2;
                    this.xoff = cosineInterp(
                      -(200 + (15 - this.num_rotated_90_degrees) * 30),
                      0,
                      t,
                    );
                  }
                  break;
              }
            },
            draw() {
              g.image(
                this.spr,
                Math.floor(this.x + this.xoff),
                Math.floor(this.y + this.yoff),
              );
              if (this.unlock_glow_alph) {
                g.blendMode(ADD);
                g.fill(255, 255, 255, this.unlock_glow_alph);
                g.rect(
                  Math.floor(this.x + this.xoff),
                  Math.floor(this.y + this.yoff),
                  36,
                  36,
                );
                g.blendMode(BLEND);
              }
            },
          };
        })(),
      );
    }
  }

  // ----------------------------------------- ----------------------------------------- BIG CHARACTER DISPLAY
  active_entities.push(
    (() => {
      // animation variables
      // Define the target values for each parameter
      const targetX = 72;
      const targetY = 128;
      const targetWidth = 8;
      const targetHeight = 8;
      // Define the initial values for each parameter
      let currentX = 0;
      let currentY = 0;
      let currentWidth = 128;
      let currentHeight = 208;

      return {
        type: "big_char_display",
        spr: s.sprite_CH16,
        text: "",
        text_x: 320 + 16,
        x: 320 + 168,
        x_target: 320,
        y: 24,
        select_your_character_yoff: -64,
        select_your_character_ytarg: 0,
        state3count: 0,
        state4count: 0,
        confirm_option: 1,
        state8count: 0,
        state9count: 0,
        update() {
          if (char_select_state !== 3) {
            this.state3count = 0;
          }
          if (char_select_state !== 4) {
            this.state4count = 0;
          }
          if (char_select_state !== 8) {
            this.state8count = 0;
          }
          if (char_select_state !== 9) {
            this.state9count = 0;
          }
          if (char_select_state === 0) {
            return;
          }
          if (char_select_state === 8) {
            if (Math.abs(this.x - this.x_target) < 0.1) {
              this.x = this.x_target;
            } else {
              this.x = (this.x * 5 + this.x_target) / 6;
            }
          }
          if (char_select_state === 1 || char_select_state === 2) {
            if (Math.abs(this.x - this.x_target) < 0.1) {
              this.x = this.x_target;
            } else {
              this.x = (this.x * 5 + this.x_target) / 6;
            }

            // select_your_character y animation
            this.select_your_character_ytarg = 0;
            if (
              Math.abs(
                this.select_your_character_yoff -
                  this.select_your_character_ytarg,
              ) < 0.1
            ) {
              this.select_your_character_yoff =
                this.select_your_character_ytarg;
            } else {
              this.select_your_character_yoff =
                (this.select_your_character_yoff * 5 +
                  this.select_your_character_ytarg) /
                6;
            }

            // locked / unlocked?
            if (characterUnlocked[selected_character]) {
              this.text = ch_names[selected_character];
              this.spr = s[`sprite_CH${selected_character + 1}`];
            } else {
              this.text = `LOCKED`;
              if (characters_to_unlock.includes(selected_character)) {
                this.text = `PRESS Z TO\n UNLOCK!!!`;
              }
              this.spr = s[`sprite_CH_locked`];
            }
          } else if (char_select_state === 3) {
            this.state3count++;

            // select_your_character y animation
            this.select_your_character_ytarg = -64;
            if (
              Math.abs(
                this.select_your_character_yoff -
                  this.select_your_character_ytarg,
              ) < 0.1
            ) {
              this.select_your_character_yoff =
                this.select_your_character_ytarg;
            } else {
              this.select_your_character_yoff =
                (this.select_your_character_yoff * 5 +
                  this.select_your_character_ytarg) /
                6;
            }

            if (this.state3count < 40) {
              return;
            }
            this.x_target = 148;
            if (Math.abs(this.x - this.x_target) < 0.1) {
              this.x = this.x_target;
            } else {
              this.x = (this.x * 9 + this.x_target) / 10;
            }
            if (this.state3count > 100) {
              char_select_state = 7;
            }
          } else if (char_select_state === 4) {
            this.state4count++;
            this.x_target = 320;
            if (Math.abs(this.x - this.x_target) < 0.2) {
              this.x = this.x_target;
            } else {
              this.x = (this.x * 7 + this.x_target) / 8;
            }
            if (this.state4count > 60) {
              char_select_state = 1;
            }
          } else if (char_select_state === 8) {
            this.state8count++;
            if (this.state8count > 90) {
              sounds.noix_up.play();
              char_select_state = 9;
            }
          } else if (char_select_state === 9) {
            this.state9count++;
          }
        },
        keyPressed() {
          if (char_select_state === 0) {
            return;
          }
          if (char_select_state === 1) {
            // get input
            if (keyCode === LEFT_ARROW) {
              this.x = 320 + 168;
            }
            if (keyCode === RIGHT_ARROW) {
              this.x = 320 + 168;
            }
            if (keyCode === UP_ARROW) {
              this.x = 320 + 168;
            }
            if (keyCode === DOWN_ARROW) {
              this.x = 320 + 168;
            }
          }
          if (
            char_select_state === 7 ||
            (char_select_state === 3 && this.state3count > 20)
          ) {
            if (keyCode === UP_ARROW) {
              this.confirm_option = Math.max(this.confirm_option - 1, 1);
              sounds.squeek.play();
            }
            if (keyCode === DOWN_ARROW) {
              this.confirm_option = Math.min(this.confirm_option + 1, 2);
              sounds.squeek.play();
            }
          }
          if (
            char_select_state === 7 ||
            (char_select_state === 3 && this.state3count > 70)
          ) {
            if (KEYS_AFFIRM.includes(keyCode) && this.confirm_option === 1) {
              sounds.mus_charselect.stop();
              sounds.selected.play();
              char_select_state = 8;
            }

            if (
              (KEYS_AFFIRM.includes(keyCode) && this.confirm_option === 2) ||
              KEYS_BACK.includes(keyCode)
            ) {
              sounds.back.play();
              this.x_target = 320;
              char_select_state = 4;
              this.confirm_option = 1;
            }
          }
        },
        draw() {
          if (char_select_state === 0) {
            return;
          }
          if (char_select_state === 9) {
            // begin destroying the bg by fading to black
            g.noStroke();
            g.fill(0, 0, 0, Math.min(255, this.state9count * 10));
            g.rect(0, 0, 320, 240);
          }

          if (this.state9count < 61) {
            g.image(
              s.select_your_character,
              0,
              this.select_your_character_yoff,
            );
            g.image(this.spr, Math.floor(this.x - this.spr.width - 8), this.y);
          }

          if (char_select_state !== 9) {
            // draw the name above the char card
            const text_x =
              this.x -
              this.spr.width / 2 -
              Math.floor(this.text.split("\n")[0].length * 4);
            const text_y = this.y - 16;
            g.changeFont(0);
            g.drawSentence(this.text, Math.floor(text_x - 1), text_y + 1);
            g.drawSentence(this.text, Math.floor(text_x - 2), text_y + 2);
            g.changeFont(3);
            g.drawSentence(this.text, Math.floor(text_x), text_y);
          }

          if (
            char_select_state === 3 ||
            char_select_state === 7 ||
            char_select_state === 8
          ) {
            const blinking_yes =
              char_select_state === 8 &&
              Math.floor(this.state8count / 4) % 2 === 0
                ? "   "
                : "YES";
            g.drawSentenceWithBlackBorder(
              `${character_flavour_text[selected_character]}\n"${this.text}"\n is your choice???\n\n    ${blinking_yes}\n    NO`,
              Math.floor(this.x),
              this.y,
            );

            if (char_select_state !== 8) {
              // sin movement for hand cursor
              const cursor_xoff = Math.floor(
                Math.abs(Math.sin(frameCount / 16)) * 5,
              );
              g.image(
                s.hand_cursor,
                Math.round(cursor_xoff + this.x - 4),
                119 + 12 * this.confirm_option,
              );
            }
          }
          if (char_select_state === 9) {
            // begin animating this big ol sprite to turn white and go small
            g.noStroke();
            g.fill(255, 255, 255, Math.min(255, this.state9count * 6));
            if (this.state9count < 60) {
              g.blendMode(ADD);
              g.rect(this.x - this.spr.width - 8, this.y, 128, 208);
              g.blendMode(BLEND);
            } else {
              // animate to get smaller
              if (this.state9count === 60) {
                sounds.noix_down.play();
                currentX = this.x - this.spr.width - 8;
                currentY = this.y;
                currentWidth = 128;
                currentHeight = 208;
              }

              const animationDuration = 17;

              // Calculate the increment for each parameter per update
              const xIncrement = (targetX - currentX) / animationDuration;
              const yIncrement = (targetY - currentY) / (animationDuration - 2); // -2 FOR FASTER
              const widthIncrement =
                (targetWidth - currentWidth) / animationDuration;
              const heightIncrement =
                (targetHeight - currentHeight) / (animationDuration - 2); // -2 FOR FASTER

              currentX += xIncrement;
              currentY += yIncrement;
              currentWidth += widthIncrement;
              currentHeight += heightIncrement;

              const draw_currentX = Math.floor(currentX);
              const draw_currentY = Math.floor(currentY);
              const draw_currentWidth = Math.floor(currentWidth);
              const draw_currentHeight = Math.floor(currentHeight);

              // Render the rectangle with the current values
              g.rect(
                draw_currentX,
                draw_currentY,
                draw_currentWidth,
                draw_currentHeight,
              );
            }

            const moment_to_start_fading = 110;
            if (this.state9count > moment_to_start_fading) {
              set_fade_level(
                Math.floor((this.state9count - moment_to_start_fading) / 4),
              );
            }
            const moment_to_go_to_next_room = 150;

            if (this.state9count > moment_to_go_to_next_room) {
              room_goto_next();
            }

            // TEMP RED RECT REMOVE THIS
            // g.fill(255, 0, 0)
            // g.rect(72, 128, 8, 8);
          }
        },
      };
    })(),
  );
  // ----------------------------------------- ----------------------------------------- SELECTOR
  active_entities.push(
    (() => {
      let white_sqr_opac = 0;
      let white_sqr_opac_targ = 0;

      let offset = 0; // Variable to store the offset of the color gradient
      let rotation_spd = 1;
      let rotation_spd_targ = 1;
      // Store the pixel array of the gradient rectangle
      // Set the starting position of the rectangle and size
      const w = 38,
        h = 38;
      let gradRect = createImage(w, h);
      return {
        type: "selector",
        selected: selected_character ? selected_character : 0,
        ix: selected_character % 4,
        iy: Math.floor(selected_character / 4),
        x: 320,
        y: 24,
        count: 0,
        update() {
          if (char_select_state === 0 || char_select_state > 2) {
            return;
          }
          if (char_select_state === 2) {
            this.count++;
            if (this.count > 40) {
              char_select_state = 3;
            }
          } else if (char_select_state === 3) {
            /// just another char_select_state timer
            this.count++;
            if (this.count > 120) {
              char_select_state = 4;
            }
          }
          // handle the white sqr first
          white_sqr_opac = (white_sqr_opac * 15 + white_sqr_opac_targ) / 16;

          gradRect.loadPixels();
          // Calculate the pixel offset to achieve the rotation effect
          offset += rotation_spd;
          rotation_spd = (rotation_spd * 11 + rotation_spd_targ) / 12;

          offset = offset % (w * 2 + h * 2);

          // Animate and set the color gradient along the border
          for (let i = 0; i < w * 2 + h * 2; i++) {
            let cur = (i + Math.floor(offset)) % (w * 2 + h * 2);

            let xPixel = 0;
            let yPixel = 0;

            if (cur < w) {
              xPixel = cur;
              yPixel = 0;
            } else if (cur < w + h) {
              xPixel = w - 1;
              yPixel = cur - w;
            } else if (cur < w * 2 + h) {
              xPixel = w - 1 - (cur - (w + h));
              yPixel = h - 1;
            } else {
              xPixel = 0;
              yPixel = h - 1 - (cur - (w * 2 + h));
            }

            // Calculate the color at i
            let colorPos = (i / (w * 2 + h * 2)) * 2;
            if (colorPos > 1) colorPos -= 1;
            let col = lerpColor(
              color(58, 22, 200),
              color(188, 228, 255),
              colorPos,
            );
            // let col = lerpColor(color(78, 32, 200), color(255, 16, 16), colorPos);
            // Set the border color
            gradRect.set(xPixel, yPixel, col);

            // Set the adjoining border color
            if (xPixel === 0 && yPixel !== 1) {
              gradRect.set(xPixel + 1, yPixel, col);
              gradRect.set(xPixel + 2, yPixel, col);
              gradRect.set(xPixel + 1, yPixel - 1, col); // this fixes one singular terrible pixel. just try removing it
            }
            if (yPixel === 0 && xPixel !== 1) {
              gradRect.set(xPixel, yPixel + 1, col);
              gradRect.set(xPixel, yPixel + 2, col);
            }
            if (xPixel === w - 1 && yPixel !== h - 1) {
              gradRect.set(xPixel - 1, yPixel, col);
              gradRect.set(xPixel - 2, yPixel, col);
            }
            if (yPixel === h - 1 && xPixel !== w - 2) {
              gradRect.set(xPixel, yPixel - 1, col);
              gradRect.set(xPixel, yPixel - 2, col);
            }
          }
          // Update the gradient rectangle pixels and display
          gradRect.updatePixels();
        },
        keyPressed() {
          if (char_select_state === 0) {
            return;
          } else if (char_select_state === 1) {
            // get input
            if (keyCode === LEFT_ARROW) {
              this.ix = Math.max(this.ix - 1, 0);
              selected_character = this.iy * 4 + this.ix;
              sounds.ding.play();
            }
            if (keyCode === RIGHT_ARROW) {
              this.ix = Math.min(this.ix + 1, 3);
              selected_character = this.iy * 4 + this.ix;
              sounds.ding.play();
            }
            if (keyCode === UP_ARROW) {
              this.iy = Math.max(this.iy - 1, 0);
              selected_character = this.iy * 4 + this.ix;
              sounds.ding.play();
            }
            if (keyCode === DOWN_ARROW) {
              this.iy = Math.min(this.iy + 1, 3);
              selected_character = this.iy * 4 + this.ix;
              sounds.ding.play();
            }
            if (KEYS_AFFIRM.includes(keyCode)) {
              if (!characterUnlocked[selected_character]) {
                if (characters_to_unlock.includes(selected_character)) {
                  characterUnlocked[selected_character] = true;
                  ready_to_unlock_characters[selected_character] = false;
                  characters_to_unlock = [];
                  for (
                    let i = 0;
                    i < Object.keys(characterUnlocked).length;
                    i++
                  ) {
                    if (globalThis.ready_to_unlock_characters[i]) {
                      characters_to_unlock.push(i);
                    }
                  }
                  // Update the flag - only set to false if NO characters are ready anymore
                  globalThis.unlocked_a_character =
                    hasReadyToUnlockCharacters();
                  localStorage.setItem(
                    "characterUnlocked",
                    JSON.stringify(characterUnlocked),
                  );
                  // Save everything
                  localStorage.setItem(
                    "ready_to_unlock_characters",
                    JSON.stringify(globalThis.ready_to_unlock_characters),
                  );
                  localStorage.setItem(
                    "unlocked_a_character",
                    globalThis.unlocked_a_character.toString(),
                  );
                  sounds.selected.play();
                  onCharacterUnlocked();
                  return;
                }
                sounds.spawn_4shrug.play();
                return;
              }
              char_select_state = 2;
              this.count = 0;
              rotation_spd = 20;
              white_sqr_opac = 255;
              sounds.selected.play();
            }
            if (KEYS_BACK.includes(keyCode)) {
              sounds.back.play();
              room_goto("rm_title_screen");
            }
          } else if (char_select_state === 2) {
          }
        },
        draw() {
          if (char_select_state === 0 || char_select_state > 2) {
            return;
          }
          g.noFill();

          const xx = this.ix * 40 + 16 - 3;
          const yy = this.iy * 48 + 40 - 1;

          if (white_sqr_opac > 0) {
            g.fill(255, 255, 255, white_sqr_opac);
            g.blendMode(ADD);
            g.rect(xx + 1, yy + 1, 36, 36);
            g.blendMode(BLEND);
          }

          g.image(gradRect, xx, yy);
        },
      };
    })(),
  );
  return active_entities;
}
