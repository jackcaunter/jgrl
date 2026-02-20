let fade_level = 0;
export let faderShader;

export function preloadFaderShader() {
  let ROOT_DIR = "../";

  const hostname = window.location.hostname;

  if (hostname === "jackcaunter.github.io") {
    console.log("SHADING in production!");
    const location = window.location;
    const fullPath =
      location.origin + location.pathname.replace(/\/[^\/]*$/, "/");
    ROOT_DIR = fullPath;
  } else if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("dev.")
  ) {
    ROOT_DIR = "../";
  } else {
    console.log("SHADING in some other environment!");
    ROOT_DIR = "/";
  }
  faderShader = loadShader(
    "" + ROOT_DIR + "shader/faderShader.vert",
    "" + ROOT_DIR + "shader/faderShader.frag",
  );
}

export function updateFaderShader(g) {
  // g is the graphics that we will be drawing to the screen. pass this as a texture to the shader.
  // if g is not exactly the size it needs to be at this point, webgl creates horrible anti-aliasing as it tries to scale up the texture,
  // and i have NO CLUE how to turn this off. so basically make sure you've already scaled g.
  faderShader.setUniform("tex0", g);
  faderShader.setUniform("fadeValue", fade_level);
  const SCREEN_SCALE = 1;
  faderShader.setUniform("u_multiplier", SCREEN_SCALE);
  faderShader.setUniform("u_texSize", [WIDTH_PIXELS, HEIGHT_PIXELS]);
}

export function add_to_fade_level(num) {
  fade_level = fade_level + num;
  fade_level = Math.min(fade_level, 8);
  fade_level = Math.max(fade_level, 0);
}

export function set_fade_level(num) {
  fade_level = num;
  fade_level = Math.min(fade_level, 8);
  fade_level = Math.max(fade_level, 0);
}
