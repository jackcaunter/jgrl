import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sprites as s, sounds } from "./assets.js";
import { set_fade_level } from "./faderShader.js";

// -------------------------------------------------------------------------------- ROOM CREDITS SCROLL

export function instantiate_room_credits_scroll() {
  active_entities = [
    {
      type: "credits_bg",
      scroll_y: HEIGHT_PIXELS, // Start below the screen
      credits_text: [
        "",
        "",
        "",
        "CREDITS",
        "",
        "",
        "",
        "jg rougelite",
        "",
        "",
        "",
        "A GAME BY",
        "cylindrical studios",
        "",
        "",
        "",
        "",
        "",
        "a cylindrical production",
        "",
        "",
        "",
        "",
        "",
        "",
        "yea......",
        "",
        "",
        "",
        "thanks",
        "for playing",
        "",
        "",
      ],
      scroll_speed: 0.5,
      music_started: false,
      showing_stats: false,
      stats_display_y: HEIGHT_PIXELS / 2 - 40,
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

        // Black background
        g.fill(0);
        g.noStroke();
        g.rect(0, 0, WIDTH_PIXELS, HEIGHT_PIXELS);

        if (!this.showing_stats) {
          // Draw scrolling credits
          g.changeFont("white");
          let currentY = this.scroll_y;

          for (let i = 0; i < this.credits_text.length; i++) {
            const line = this.credits_text[i];
            const lineWidth = line.length * 8; // Approximate width per character
            const centerX = Math.floor((WIDTH_PIXELS - lineWidth) / 2);

            // Only draw if on screen
            if (currentY > -12 && currentY < HEIGHT_PIXELS) {
              g.drawSentence(line, centerX, Math.floor(currentY));
            }

            currentY += 12; // Line height
          }

          // Scroll up
          this.scroll_y -= this.scroll_speed;

          // Check if credits finished scrolling
          const totalHeight = this.credits_text.length * 12;
          if (this.scroll_y + totalHeight < 0) {
            this.showing_stats = true;
          }
        } else {
          // Show stats screen
          g.changeFont("white");

          let y = this.stats_display_y;
          let x = WIDTH_PIXELS / 2 - 60;

          g.drawSentence("FINAL STATS", x, y);
          y += 24;

          g.drawSentence("Time Played: 42:15", x, y);
          y += 16;

          g.drawSentence("Enemies Defeated: 127", x, y);
          y += 16;

          g.drawSentence("Items Collected: 45", x, y);
          y += 16;

          g.drawSentence("Deaths: 8", x, y);
          y += 16;

          g.drawSentence("Completion: 100%", x, y);
        }
      },
    },
  ];
  return active_entities;
}
