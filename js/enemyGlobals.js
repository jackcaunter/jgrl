import { gameboy_graphics as g } from "./gameboyGraphics.js";

export function drawHealthBar(my_sprite_width = 24, bar_y_offset = -5) {
  const bar_width = 32;
  const bar_height = 2;

  // Calculate the x position to center the bar
  const bar_x = Math.round(this.x + my_sprite_width / 2 - bar_width / 2);
  const bar_y = Math.round(this.y + bar_y_offset);

  // Calculate width of the green (health) portion
  const health_width = (this.hp / this.max_hp) * bar_width;

  // Draw red background (missing health)
  g.noStroke();
  g.fill(224, 0, 0);
  g.rect(
    Math.round(bar_x),
    Math.round(bar_y),
    Math.round(bar_width),
    Math.round(bar_height),
  );

  // Draw green health bar
  g.fill(80, 255, 80);
  g.rect(
    Math.round(bar_x),
    Math.round(bar_y),
    Math.round(health_width),
    Math.round(bar_height),
  );
}
