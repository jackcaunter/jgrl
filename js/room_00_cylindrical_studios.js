import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sounds } from './assets.js';
import { set_fade_level } from "./faderShader.js";

// -------------------------------------------------------------------------------- ROOM CYLINDRICAL STUDIOS

export function instantiate_room_cylindrical_studios() {
  let active_entities = [
    {
      type: 'cylindrical_studios_text',
      text_unclicked: '( click to unmute )',
      text_clicked: 'cylindrical studios',
      clicked: false,
      fade: 16,
      count: 0,
      update() {
        // Clear the screen
        g.background(0);
        g.changeFont('white');
        if (!this.clicked) {
          g.drawSentence(this.text_unclicked, WIDTH_PIXELS / 2 - 58, HEIGHT_PIXELS / 2 + 48);
        } else {
          // WE CLICKED
          this.count++;
          if (this.count < 90 && this.fade > 0 && this.count % 3 === 0) {
            this.fade -= 1;
          }
          if (this.count === 30 && !sounds.mus_cylindricalstudios.isPlaying()) {
            sounds.mus_cylindricalstudios.play();
          }
          if (this.count > 220) {
            // sound is done playing by this point so fade out and go to next room
            if (this.count % 3 === 0) {
              this.fade++;
            }
            if (this.count >= 280) {
              room_goto_next();
            }
          }
          set_fade_level(this.fade);
          g.drawSentence(this.text_clicked, WIDTH_PIXELS / 2 - 52, HEIGHT_PIXELS / 2 - 6);
        }
      },
      mousePressed() {
        if (!this.clicked) {
          // userStartAudio();
          this.clicked = true;
          if (mouseButton === RIGHT) {
            // debug skip jingle
            this.count = 280;
          }
        }
      },
      keyPressed() {
        if ((keyCode === ENTER || keyCode === 32 || true) && !this.clicked) {
          // userStartAudio();
          this.clicked = true;
        }
      },
    }
  ];

  return active_entities;
}
