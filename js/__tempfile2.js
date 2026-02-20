class ShakeAndMoveEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.internal_x = x;
    this.internal_y = y;
    this.hit_opacity = 0;
    this.hit_spd = 0;
    this.count = 0;
    this.state = "shaking"; // or 'moving'
    this.target_x = 0;
    this.target_y = 0;
    this.random_targets_remaining = 3;
    this.frames_in_state = 0;
    this.frames_for_state = 0;

    // Configurable variables
    this.SHAKE_RANGE = 20;
    this.SHAKE_FRAMES_MIN = 40;
    this.SHAKE_FRAMES_MAX = 60;
    this.MOVE_FRAMES_MIN = 30;
    this.MOVE_FRAMES_MAX = 50;
    this.MOVE_SPEED = 3;
    this.PLAYER_TARGET_DISTANCE = 40;
  }

  update() {
    // Handle hit state
    if (this.hit_spd > 0) {
      let xspd = Math.cos(radians(this.hit_direction)) * this.hit_spd;
      let yspd = Math.sin(radians(this.hit_direction)) * this.hit_spd;
      this.apply_speed(xspd, yspd);
      this.hit_spd = Math.max(0, (this.hit_spd * 6) / 7 - 0.0001);
    }

    if (this.hit_opacity > 0) {
      this.hit_opacity = Math.max(0, this.hit_opacity - 20);
      this.squash_amount =
        sin((frameCount / squash_time_frames) * TWO_PI) *
        (this.hit_opacity / 90);
      return; // Don't do other movement while hit
    }

    this.frames_in_state++;

    if (this.frames_in_state >= this.frames_for_state) {
      this.switchState();
    }

    if (this.state === "shaking") {
      this.shake();
    } else if (this.state === "moving") {
      this.moveToTarget();
    }
  }

  shake() {
    this.x = this.internal_x + (Math.random() * 2 - 1) * this.SHAKE_RANGE;
    this.y = this.internal_y + (Math.random() * 2 - 1) * this.SHAKE_RANGE;
  }

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
  }

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
  }

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
          Math.pow(my_player.x - this.x, 2) + Math.pow(my_player.y - this.y, 2),
        ) + this.PLAYER_TARGET_DISTANCE;

      this.target_x = this.x + Math.cos(radians(direction)) * distance;
      this.target_y = this.y + Math.sin(radians(direction)) * distance;

      this.random_targets_remaining = 3; // Reset for next cycle
    }
  }

  apply_speed(xspd, yspd) {
    this.x += xspd;
    this.y += yspd;
  }
}
