import {
  decreasePixelScale,
  gameboy_graphics as g,
  increasePixelScale,
} from "./gameboyGraphics.js";
import { sprites as s, sounds } from "./assets.js";
import { set_fade_level } from "./faderShader.js";
import { cutscene_script } from "./cutscene.js";
// import { cutscene_script } from "./cutscene.js";

function create_cutscene_text_typer(script, x, y, color) {
  let full_text = script[0];

  return {
    x: x,
    y: y,
    text: "",
    alph: 255,
    color: color ? color : g.color(255),
    frame_count: 0,
    real_count: -20,
    script_page: 0,
    page_done_count: 0,
    PAGE_WAIT_FRAMES: 90,
    fade: 0,
    quick_fade: false,
    dead: false,
    update() {
      if (this.totally_done) {
        this.frame_count++;
        if (this.quick_fade) {
          this.frame_count += 3;
        }
        sounds.mus_cutscene.setVolume(
          ((200 - this.frame_count) / 200) * sounds.mus_cutscene_volume,
        );
        if (this.frame_count > 60 && this.frame_count % 16 === 0) {
          this.fade += 1;
          set_fade_level(this.fade);
        }
        if (this.frame_count > 200) {
          globalThis.can_skip_cutscene = true;
          localStorage.setItem("can_skip_cutscene", "true");
          room_goto_next();
        }
        return;
      }
      this.frame_count++;
      if (this.frame_count % 3 === 0) {
        this.real_count++;
      }
      this.text = full_text.substring(0, Math.max(0, this.real_count));
      if (this.text === full_text) {
        this.page_done_count++;
      }
      if (this.page_done_count > this.PAGE_WAIT_FRAMES) {
        this.go_to_next_page();
      }
    },
    go_to_next_page() {
      this.page_done_count = 0;
      this.real_count = 0;
      this.frame_count = 0;

      this.text = "";
      this.script_page++;
      if (this.script_page >= script.length) {
        this.text = script[script.length - 1];
        this.totally_done = true;
        this.frame_count = 0;
        return;
      }
      full_text = script[this.script_page];
    },
    keyPressed() {
      if (!can_skip_cutscene) {
        return;
      }
      if (KEYS_BACK.includes(keyCode) || KEYS_AFFIRM.includes(keyCode)) {
        if (this.totally_done && this.frame_count > 60) {
          return;
        }
        this.quick_fade = true;
        this.totally_done = true;
        this.frame_count = 60;
      }
    },
    draw() {
      this.color.setAlpha(this.alph);
      g.tint(this.color);
      g.drawSentenceWithBlackBorder(this.text, this.x, this.y);
      g.tint(255);
    },
  };
}

// -------------------------------------------------------------------------------- ROOM CUTSCENE

export function instantiate_room_cutscene() {
  const cutscener = {
    type: "bg_cutscene",
    fade: 8,
    count: 0,
    update() {
      if (my_cutscene_typer.totally_done) {
        return;
      }
      this.count++;
      if (this.count === 60 && !sounds.mus_cutscene.isPlaying()) {
        sounds.mus_cutscene.setVolume(mus_cutscene_volume);
        sounds.mus_cutscene.play();
      }
      if (this.count % 8 === 0) {
        this.fade -= 1;
      }
      if (this.count < 80) {
        set_fade_level(this.fade);
      }
    },
    draw() {
      g.fill(0);
      g.noStroke();
      g.rect(0, 0, WIDTH_PIXELS, HEIGHT_PIXELS);
      // First, get the cropped portion using get()
      let cropped = s.bg_title_screen.get(
        48,
        64,
        s.bg_title_screen.width - 96,
        s.bg_title_screen.height - 112,
      );

      // Convert to greyscale and draw
      cropped.filter(g.GRAY);
      g.tint(255, 192, 0);
      g.image(cropped, 48, 32);
      g.tint(255);
    },
  };
  const my_cutscene_typer = create_cutscene_text_typer(
    cutscene_script,
    64,
    168,
  );
  active_entities = [cutscener, my_cutscene_typer];
  return active_entities;
}
