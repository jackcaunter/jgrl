export let sprites;
export let sounds;

const successful_load = function () {};

let ROOT_DIR = "../";

const hostname = window.location.hostname;

if (
  hostname === "jack.caunter.ca" ||
  hostname === "jackcaunter.com" ||
  hostname === "jackcaunter.github.io"
) {
  console.log("Running in production!");
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
  console.log("Running in some other environment!");
  ROOT_DIR = "/";
}

export function preloadAllSprites() {
  sprites = {
    bg_title_screen: loadImage("" + ROOT_DIR + "img/bigtitlebg.png"),
    bg_title_1: loadImage("" + ROOT_DIR + "img/bigtitle1.png"),
    bg_title_2: loadImage("" + ROOT_DIR + "img/bigtitle2.png"),
    bg_charselect: loadImage("" + ROOT_DIR + "img/bg_charselect.png"),
    select_your_character: loadImage(
      "" + ROOT_DIR + "img/select_your_character.png",
    ),
    hand_cursor: loadImage("" + ROOT_DIR + "img/hand_cursor.png"),

    sprite_lol: loadImage("" + ROOT_DIR + "img/lol.png"),

    sprite_IC1: loadImage("" + ROOT_DIR + "img/IC_vish.png"),
    sprite_IC2: loadImage("" + ROOT_DIR + "img/IC_sumichan.png"),
    sprite_IC3: loadImage("" + ROOT_DIR + "img/IC_wompis.png"),
    sprite_IC4: loadImage("" + ROOT_DIR + "img/IC_lechina.png"),
    sprite_IC5: loadImage("" + ROOT_DIR + "img/IC_brewmonkey.png"),
    sprite_IC6: loadImage("" + ROOT_DIR + "img/IC_ndgt.png"),
    sprite_IC7: loadImage("" + ROOT_DIR + "img/IC_peanut.png"),
    sprite_IC8: loadImage("" + ROOT_DIR + "img/IC_goggins.png"),
    sprite_IC9: loadImage("" + ROOT_DIR + "img/IC_joegan.png"),
    sprite_IC10: loadImage("" + ROOT_DIR + "img/IC_jordo.png"),
    sprite_IC11: loadImage("" + ROOT_DIR + "img/IC_tony.png"),
    sprite_IC12: loadImage("" + ROOT_DIR + "img/IC_dgg.png"),
    sprite_IC13: loadImage("" + ROOT_DIR + "img/IC_marth.png"),
    sprite_IC14: loadImage("" + ROOT_DIR + "img/IC_kratos.png"),
    sprite_IC15: loadImage("" + ROOT_DIR + "img/IC_mj.png"),
    sprite_IC16: loadImage("" + ROOT_DIR + "img/IC_poki.png"),
    sprite_IC_locked: loadImage("" + ROOT_DIR + "img/IC_locked.png"),

    sprite_CH1: loadImage("" + ROOT_DIR + "img/CH_vish.png"),
    sprite_CH2: loadImage("" + ROOT_DIR + "img/CH_sumichan.png"),
    sprite_CH3: loadImage("" + ROOT_DIR + "img/CH_wompis.png"),
    sprite_CH4: loadImage("" + ROOT_DIR + "img/CH_lechina.png"),
    sprite_CH5: loadImage("" + ROOT_DIR + "img/CH_brewmonkey.png"),
    sprite_CH6: loadImage("" + ROOT_DIR + "img/CH_ndgt.png"),
    sprite_CH7: loadImage("" + ROOT_DIR + "img/CH_peanut.png"),
    sprite_CH8: loadImage("" + ROOT_DIR + "img/CH_goggins.png"),
    sprite_CH9: loadImage("" + ROOT_DIR + "img/CH_joegan.png"),
    sprite_CH10: loadImage("" + ROOT_DIR + "img/CH_jordo.png"),
    sprite_CH11: loadImage("" + ROOT_DIR + "img/CH_tony.png"),
    sprite_CH12: loadImage("" + ROOT_DIR + "img/CH_dgg.png"),
    sprite_CH13: loadImage("" + ROOT_DIR + "img/CH_marth.png"),
    sprite_CH14: loadImage("" + ROOT_DIR + "img/CH_kratos.png"),
    sprite_CH15: loadImage("" + ROOT_DIR + "img/CH_mj.png"),
    sprite_CH16: loadImage("" + ROOT_DIR + "img/CH_poki.png"),
    sprite_CH_locked: loadImage("" + ROOT_DIR + "img/CH_locked.png"),

    tiles_grassland: loadImage("" + ROOT_DIR + "img/tiles_grassland.png"),
    tiles_cave: loadImage("" + ROOT_DIR + "img/tiles_cave.png"),
    tiles_castle: loadImage("" + ROOT_DIR + "img/tiles_castle.png"),
    gate: loadImage("" + ROOT_DIR + "img/gate.png"),
    chest8: loadImage("" + ROOT_DIR + "img/chest_08.png"),
    chest16: loadImage("" + ROOT_DIR + "img/chest_16.png"),
    chest24: loadImage("" + ROOT_DIR + "img/chest_24.png"),
    key: loadImage("" + ROOT_DIR + "img/key.png"),
    heart: loadImage("" + ROOT_DIR + "img/heart.png"),
    heart_capsule: loadImage("" + ROOT_DIR + "img/heart_capsule.png"),

    deathscreen: loadImage("" + ROOT_DIR + "img/deathscreen.png"),
    your_dead_text: loadImage("" + ROOT_DIR + "img/your_dead_text.png"),

    textbox: loadImage("" + ROOT_DIR + "img/textbox.png"),
    textinput: loadImage("" + ROOT_DIR + "img/textinput.png"),

    sword_swing_animation: [
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing1.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing2.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing3.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing4.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing5.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing6.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing/sword_swing7.png"),
    ],
    sword_swing_small_animation: [
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small1.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small2.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small3.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small4.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small5.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small6.png"),
      loadImage("" + ROOT_DIR + "img/sword_swing_small/sword_swing_small7.png"),
    ],

    "5mower": loadImage("" + ROOT_DIR + "img/emojis24/5mower.png"),
    unknown: loadImage("" + ROOT_DIR + "img/emojis24/unknown.png"),
    pepega: loadImage("" + ROOT_DIR + "img/emojis24/pepega.png"),
    lemickey: loadImage("" + ROOT_DIR + "img/emojis24/lemickey.png"),
    downbad: loadImage("" + ROOT_DIR + "img/emojis24/downbad.png"),
    hypers: loadImage("" + ROOT_DIR + "img/emojis24/HYPERS.png"),
    peepopanties: loadImage("" + ROOT_DIR + "img/emojis24/peepopanties.png"),
    pogyou: loadImage("" + ROOT_DIR + "img/emojis24/pogyou.png"),
    kekw2: loadImage("" + ROOT_DIR + "img/emojis24/kekw2.png"),
    omegalul: loadImage("" + ROOT_DIR + "img/emojis24/omegalul.png"),
    sadge: loadImage("" + ROOT_DIR + "img/emojis24/sadge.png"),
    bruvchamp: loadImage("" + ROOT_DIR + "img/emojis24/bruvchamp.png"),
    "4head": loadImage("" + ROOT_DIR + "img/emojis24/4head.png"),

    lebum: loadImage("" + ROOT_DIR + "img/stickers/lebum.png"),
    ibdw: loadImage("" + ROOT_DIR + "img/stickers/ibdw.png"),

    "4shrug": loadImage("" + ROOT_DIR + "img/emojis24/4Shrug.png"),
    arnoldproceed: loadImage("" + ROOT_DIR + "img/emojis24/arnoldproceed.png"),
    atpquan: loadImage("" + ROOT_DIR + "img/emojis24/atpquan.png"),
    lfg: loadImage("" + ROOT_DIR + "img/emojis24/LFG.png"),
    bezospog: loadImage("" + ROOT_DIR + "img/emojis24/bezospog.png"),
    opieop: loadImage("" + ROOT_DIR + "img/emojis24/opieop.png"),
    hulk: loadImage("" + ROOT_DIR + "img/emojis24/hulk.png"),
    joysob: loadImage("" + ROOT_DIR + "img/emojis24/joysob.png"),
    prayge: loadImage("" + ROOT_DIR + "img/emojis24/prayge.png"),
    sheeeesh: loadImage("" + ROOT_DIR + "img/emojis24/sheeeesh.png"),
    yes: loadImage("" + ROOT_DIR + "img/emojis24/yes.png"),
    zoomer: loadImage("" + ROOT_DIR + "img/emojis24/ZOOMER.png"),
  };

  // BIG HACK to adapt p5.sound to howler.js
  // never use p5.sound. it lags and takes a shit when you've played more than ~200 sounds
  // and there is no way to fix it because the library consists of a pile of dogshit with a bunch of other libraries duct taped to it.
  const loadSound = function (url) {
    const my_howlin_sound = new Howl({
      src: [url],
    });
    return {
      play() {
        my_howlin_sound.play();
      },
      loop() {
        my_howlin_sound.loop(true);
        my_howlin_sound.play();
      },
      setVolume(vol, timeFromNow) {
        if (timeFromNow) {
          my_howlin_sound.fade(
            my_howlin_sound.volume(),
            vol,
            timeFromNow * 1000,
          );
        } else {
          my_howlin_sound.volume(vol);
        }
      },
      stop() {
        my_howlin_sound.stop();
      },
      isPlaying() {
        return my_howlin_sound.playing();
      },
    };
  };

  sounds = {
    mus_cylindricalstudios: loadSound(
      "" + ROOT_DIR + "audio/cylindricalstudios.ogg",
    ),
    mus_title: loadSound("" + ROOT_DIR + "audio/title.ogg"),
    mus_cutscene: loadSound("" + ROOT_DIR + "audio/cutscene.ogg"),
    mus_charselect: loadSound("" + ROOT_DIR + "audio/charselect.ogg"),
    mus_overworld: loadSound("" + ROOT_DIR + "audio/overworld_2.ogg"),
    mus_cave: loadSound("" + ROOT_DIR + "audio/cave.ogg"),
    mus_castle: loadSound("" + ROOT_DIR + "audio/castle.ogg"),
    mus_boss: loadSound("" + ROOT_DIR + "audio/boss_music.ogg"),
    mus_final_boss: loadSound("" + ROOT_DIR + "audio/final_boss_music.ogg"),
    mus_boss_pregame: loadSound("" + ROOT_DIR + "audio/mus_boss_pregame_3.ogg"),
    mus_boss_blowing_up: loadSound(
      "" + ROOT_DIR + "audio/mus_boss_blowing_up_5.ogg",
    ),
    exploud: loadSound("" + ROOT_DIR + "audio/exploud.ogg"),
    back: loadSound("" + ROOT_DIR + "audio/back.ogg"),
    ding: loadSound("" + ROOT_DIR + "audio/ding.ogg"),
    noix_down: loadSound("" + ROOT_DIR + "audio/noix_down.ogg"),
    noix_up: loadSound("" + ROOT_DIR + "audio/noix_up.ogg"),
    squeek: loadSound("" + ROOT_DIR + "audio/squeek.ogg"),
    selected: loadSound("" + ROOT_DIR + "audio/selected.ogg"),
    stab: loadSound("" + ROOT_DIR + "audio/stab.ogg"),
    sword_swings: [
      loadSound("" + ROOT_DIR + "audio/swing01.ogg"),
      loadSound("" + ROOT_DIR + "audio/swing02.ogg"),
      loadSound("" + ROOT_DIR + "audio/swing03.ogg"),
    ],
    sword_stabs: [
      loadSound("" + ROOT_DIR + "audio/stab01.ogg"),
      loadSound("" + ROOT_DIR + "audio/stab02.ogg"),
      loadSound("" + ROOT_DIR + "audio/stab03.ogg"),
      loadSound("" + ROOT_DIR + "audio/stab04.ogg"),
    ],
    mower: loadSound("" + ROOT_DIR + "audio/5mower.ogg"),
    explode01: loadSound("" + ROOT_DIR + "audio/explode01.ogg"),
    explode02: loadSound("" + ROOT_DIR + "audio/explode02.ogg"),
    spawn_key: loadSound("" + ROOT_DIR + "audio/spawn_key.ogg"),
    spawn_bonus: loadSound("" + ROOT_DIR + "audio/spawn_bonus.ogg"),
    spawn_4shrug: loadSound("" + ROOT_DIR + "audio/spawn_4shrug.ogg"),
    key_get: loadSound("" + ROOT_DIR + "audio/key_get.ogg"),
    gate_open: loadSound("" + ROOT_DIR + "audio/gate_open.ogg"),
    chest_open: loadSound("" + ROOT_DIR + "audio/chest_open.ogg"),
    chest_spawn: loadSound("" + ROOT_DIR + "audio/chest_spawn.ogg"),
    player_get_hit: loadSound("" + ROOT_DIR + "audio/player_get_hit.ogg"),
    collectible01: loadSound("" + ROOT_DIR + "audio/collectible01.ogg"),
    collectible02: loadSound("" + ROOT_DIR + "audio/collectible02.ogg"),
    collectible03: loadSound("" + ROOT_DIR + "audio/collectible03.ogg"),
    collectible04: loadSound("" + ROOT_DIR + "audio/collectible04.ogg"),
    collectible05: loadSound("" + ROOT_DIR + "audio/collectible05.ogg"),
    collectible06: loadSound("" + ROOT_DIR + "audio/collectible06.ogg"),
    powerup01: loadSound("" + ROOT_DIR + "audio/powerup01.ogg"),
    powerup02: loadSound("" + ROOT_DIR + "audio/powerup02.ogg"),
    powerup03: loadSound("" + ROOT_DIR + "audio/powerup03.ogg"),
    powerup04: loadSound("" + ROOT_DIR + "audio/powerup04.ogg"),
    powerup05: loadSound("" + ROOT_DIR + "audio/powerup05.ogg"),
    fart: loadSound("" + ROOT_DIR + "audio/fart.ogg"),
    roof: loadSound("" + ROOT_DIR + "audio/roof.ogg"),
    flashbang: loadSound("" + ROOT_DIR + "audio/flashbang.ogg"),
    text_blip: loadSound("" + ROOT_DIR + "audio/text_blip.ogg"),
    text_blip2: loadSound("" + ROOT_DIR + "audio/text_blip2.ogg"),
    your_dead: loadSound("" + ROOT_DIR + "audio/your_dead.ogg"),
    your_dead_music: loadSound("" + ROOT_DIR + "audio/your_dead_music.ogg"),
  };
  globalThis.mus_cylindricalstudios_volume = 1;
  globalThis.mus_title_volume = 0.9;
  globalThis.mus_cutscene_volume = 0.35;
  globalThis.mus_charselect_volume = 0.5;
  globalThis.mus_overworld_volume = 0.6;
  globalThis.mus_cave_volume = 0.45;
  globalThis.mus_castle_volume = 0.5;
  globalThis.mus_boss_volume = 0.6;
  globalThis.mus_final_boss_volume = 0.6;
  globalThis.mus_boss_blowing_up_volume = 0.6;
  globalThis.mus_boss_pregame_volume = 0.6;
  sounds.sword_stabs[0].setVolume(0.35);
  sounds.sword_stabs[1].setVolume(0.35);
  sounds.sword_stabs[2].setVolume(0.35);
  sounds.sword_stabs[3].setVolume(0.35);
  sounds.ding.setVolume(0.45);
  sounds.exploud.setVolume(0.7);
  sounds.back.setVolume(0.4);
  sounds.noix_down.setVolume(0.3);
  sounds.noix_up.setVolume(0.2);
  sounds.squeek.setVolume(2);
  sounds.selected.setVolume(0.3);
  sounds.mower.setVolume(0.3);
  sounds.fart.setVolume(0.5);
  sounds.flashbang.setVolume(1);
  sounds.gate_open.setVolume(2);
  sounds.spawn_4shrug.setVolume(2);
  sounds.chest_open.setVolume(0.7);
  sounds.chest_spawn.setVolume(0.8);
  sounds.collectible01.setVolume(0.6);
  sounds.collectible02.setVolume(0.6);
  sounds.collectible03.setVolume(0.6);
  sounds.collectible04.setVolume(1.2);
  sounds.collectible05.setVolume(0.6);
  sounds.powerup01.setVolume(0.6);
  sounds.powerup02.setVolume(0.4);
  sounds.powerup03.setVolume(0.6);
  sounds.powerup04.setVolume(0.6);
  sounds.powerup05.setVolume(0.6);
  sounds.text_blip.setVolume(0.4);
  sounds.text_blip2.setVolume(0.5);
  sounds.your_dead.setVolume(0.75);
}
