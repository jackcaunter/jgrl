import {
  decreasePixelScale,
  gameboy_graphics as g,
  increasePixelScale,
} from "./gameboyGraphics.js";
import { sprites as s, sounds } from "./assets.js";
import { set_fade_level } from "./faderShader.js";

// -------------------------------------------------------------------------------- ROOM TITLE SCREEN

export function instantiate_room_title_screen() {
  active_entities = [
    {
      type: "bg_title",
      title1_x: 40,
      title1_y: 32,
      title2_x: 104,
      title2_y: 80,
      fade: 8,
      count: 0,
      update() {
        this.count++;
        if (this.count === 8 && !sounds.mus_title.isPlaying()) {
          sounds.mus_title.setVolume(mus_title_volume);
          sounds.mus_title.loop();
        }
        if (this.count % 4 === 0) {
          this.fade -= 1;
        }
        if (this.count < 60) {
          set_fade_level(this.fade);
        }
        g.image(s.bg_title_screen, 0, 0);
        g.image(s.bg_title_1, this.title1_x, this.title1_y);
        g.image(s.bg_title_2, this.title2_x, this.title2_y);
      },
    },
    // -------------------------------- cursor + options
    {
      type: "cursor",
      state: 0,
      next_state: 0,
      option: 1,
      option_option: 1,
      fade: 0,
      ry: 148,
      rw: 64,
      rh: 12 * 5,
      rect_anim_direction: "opening",
      cursor_xoff: 0,
      count: 0,
      count2: 0,
      update() {
        switch (this.state) {
          case 0:
            g.changeFont("white");
            if (Math.floor(frameCount / 40) % 2 === 0) {
              g.drawSentenceWithBlackBorder(
                `PRESS START`,
                116,
                this.ry + this.rh / 2,
              );
            }
            break;
          case 1:
            // animating menu opening/closing
            if (this.rect_anim_direction === "opening") {
              this.count++;
            } else {
              this.count -= 1;
            }

            // Calculate the x-coordinate and y-coordinate based on this.count and the dimensions of the rectangle
            let centerX = WIDTH_PIXELS / 2; // Center of the screen

            // let centerY = this.ry + (this.rh / 2); // Center of the original rectangle position
            let centerY = this.ry + (12 * 6) / 2; // Center of the original rectangle position
            let rectWidth = this.count * 6; // Width of the rectangle
            let rectHeight = this.count * 6; // Height of the rectangle

            if (rectWidth > this.rw * 2) {
              rectWidth = this.rw * 2; // Limit the width to this.rw * 2
              if (this.rect_anim_direction === "opening") {
                // opened menu state
                this.state = this.next_state;
              }
            }
            if (rectHeight > this.rh) {
              rectHeight = this.rh; // Limit the height to this.rh
            }

            if (rectWidth <= 0 && this.rect_anim_direction === "closing") {
              // closed menu state
              this.state = this.next_state;
            }
            let rectX = centerX - rectWidth / 2;
            let rectY = centerY - rectHeight / 2;

            g.stroke(255);
            g.strokeWeight(2);
            g.fill(0);
            g.rect(rectX, rectY, rectWidth, rectHeight);

            break;

          case 10:
            this.count2++;
            if (this.count2 === 40) {
              sounds.mus_title.setVolume(0, 0.5);
            }
            if (this.count2 > 50) {
              if (this.count2 % 6 === 0) {
                this.fade += 1;
              }
              set_fade_level(this.fade);
            }
            if (this.fade > 16) {
              room_goto_next();
            }
          // NO BREAK BECAUSE WE'RE STILL DRAWING ALL THE STUFF FROM CASE 2
          case 2:
            g.stroke(255);
            g.strokeWeight(2);
            g.fill(0);
            g.rect(
              WIDTH_PIXELS / 2 - this.rw,
              this.ry + (12 * 6) / 2 - this.rh / 2,
              this.rw * 2,
              this.rh,
            );
            g.changeFont("white");
            if (
              !(
                this.state === 10 &&
                this.option === 1 &&
                Math.floor(this.count2 / 4) % 2 === 0
              )
            ) {
              g.drawSentence(`START GAME`, 124, this.ry + 12 + 6);
            }
            g.changeFont("white");
            g.drawSentence(`CONTINUE`, 124, this.ry + 12 + 12 + 6);
            g.changeFont("white");
            g.drawSentence(`OPTIONS`, 124, this.ry + 12 + 12 + 12 + 6);

            // sin movement for hand cursor
            this.cursor_xoff = Math.floor(
              Math.abs(Math.sin(frameCount / 16)) * 5,
            );

            if (!(this.state === 10)) {
              // state 10 is selected so don't draw hand
              g.image(
                s.hand_cursor,
                98 + this.cursor_xoff,
                this.ry - 2 + 6 + 12 * this.option,
              );
            }

            break;
          case 3:
            // simply switch from closing to opening, and go to state 4
            this.rect_anim_direction = "opening";
            this.rect_anim_progress = 0;
            this.rw = 80;
            this.rh = 12 * 7;
            this.state = 1;
            this.next_state = 4;
            break;

          case 4:
            g.stroke(255);
            g.strokeWeight(2);
            g.fill(0);
            g.rect(
              WIDTH_PIXELS / 2 - this.rw,
              this.ry + (12 * 6) / 2 - this.rh / 2,
              this.rw * 2,
              this.rh,
            );

            g.drawSentence(
              `You Can't "CONTINUE"\nbecause this game is a\n"Rougelite"\n\n   OK`,
              88,
              154,
            );

            // sin movement for hand cursor
            this.cursor_xoff = Math.floor(
              Math.abs(Math.sin(frameCount / 16)) * 5,
            );

            g.image(s.hand_cursor, 80 + this.cursor_xoff, 200);
            break;

          case 5:
            // simply switch from closing to opening, and go to state 2
            this.rect_anim_direction = "opening";
            this.rect_anim_progress = 0;
            this.rw = 64;
            this.rh = 12 * 5;
            this.state = 1;
            this.next_state = 2;
            break;

          case 6:
            // simply switch from closing to opening, and go to state 7
            this.rect_anim_direction = "opening";
            this.rect_anim_progress = 0;
            this.rw = 96;
            this.rh = 12 * 6;
            this.state = 1;
            this.option_option = 1;
            this.next_state = 7;
            break;
          case 7:
            g.stroke(255);
            g.strokeWeight(2);
            g.fill(0);
            g.rect(
              WIDTH_PIXELS / 2 - this.rw,
              this.ry + (12 * 6) / 2 - this.rh / 2,
              this.rw * 2,
              this.rh,
            );

            g.drawSentence(
              `        OPTIONS\n\nScreen Scale     ${this.option_option === 1 ? "<" : " "} ${pixel_scale} ${this.option_option === 1 ? ">" : " "} \n\nDONE`,
              90,
              154,
            );

            // sin movement for hand cursor
            this.cursor_xoff = Math.floor(
              Math.abs(Math.sin(frameCount / 16)) * 5,
            );
            let cursor_y = 200;
            switch (this.option_option) {
              case 1:
                cursor_y = 200 - 12 - 12;
                break;
            }

            g.image(s.hand_cursor, 65 + this.cursor_xoff, cursor_y);
            break;
        }
      },
      keyPressed() {
        switch (this.state) {
          case 0: // PRESS START STATE
            if (KEYS_AFFIRM.includes(keyCode)) {
              // AFFIRM KEY PRESSED
              sounds.selected.play();
              this.rect_anim_direction = "opening";
              this.rect_anim_progress = 0;
              this.state = 1;
              this.next_state = 2;
            }
            break;
          case 1: // ANIMATING STATE, DO NOTHING
            break;
          case 2: // FIRST MENU STATE
            if (keyCode === UP_ARROW) {
              this.option = Math.max(this.option - 1, 1);
              sounds.squeek.play();
            } else if (keyCode === DOWN_ARROW) {
              this.option = Math.min(this.option + 1, 3);
              sounds.squeek.play();
            } else if (KEYS_BACK.includes(keyCode)) {
              this.state = 1; //animating closed
              sounds.back.play();
              this.rect_anim_direction = "closing";
              this.rect_anim_progress = this.rw * 2;
              this.state = 1;
              this.next_state = 0;
            } else if (KEYS_AFFIRM.includes(keyCode)) {
              switch (this.option) {
                case 1:
                  this.state = 10; // goto next room state
                  this.count2 = 0;
                  sounds.selected.play();
                  break;
                case 2:
                  sounds.selected.play();
                  this.rect_anim_direction = "closing";
                  this.rect_anim_progress = this.rw * 2;
                  this.state = 1;
                  this.next_state = 3;
                  break;
                case 3:
                  sounds.selected.play();
                  this.rect_anim_direction = "closing";
                  this.rect_anim_progress = this.rw * 2;
                  this.state = 1;
                  this.next_state = 6;
                  break;
                  break;
              }
            }
            break;
          case 4:
            if (KEYS_AFFIRM.includes(keyCode) || KEYS_BACK.includes(keyCode)) {
              sounds.back.play();
              this.rect_anim_direction = "closing";
              this.rect_anim_progress = this.rw * 2;
              this.state = 1;
              this.next_state = 5;
            }
            break;
          case 7: // OPTION MENU STATE
            if (keyCode === UP_ARROW) {
              this.option_option = Math.max(this.option_option - 1, 1);
              sounds.squeek.play();
            } else if (keyCode === DOWN_ARROW) {
              this.option_option = Math.min(this.option_option + 1, 2);
              sounds.squeek.play();
            } else if (keyCode === LEFT_ARROW) {
              if (this.option_option === 1) {
                // visual scaling
                if (pixel_scale > MIN_PIXEL_SCALE) {
                  sounds.squeek.play();
                }
                decreasePixelScale();
              }
            } else if (keyCode === RIGHT_ARROW) {
              if (this.option_option === 1) {
                // visual scaling
                if (pixel_scale < MAX_PIXEL_SCALE) {
                  sounds.squeek.play();
                }
                increasePixelScale();
              }
            } else if (
              KEYS_BACK.includes(keyCode) ||
              (KEYS_AFFIRM.includes(keyCode) && this.option_option === 2)
            ) {
              this.state = 1; //animating closed
              sounds.back.play();
              this.rect_anim_direction = "closing";
              this.rect_anim_progress = this.rw * 2;
              this.state = 1;
              this.next_state = 5;
            }
            break;
        }
      },
    },
  ];
  return active_entities;
}
