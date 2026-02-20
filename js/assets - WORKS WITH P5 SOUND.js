export let sprites;
export let sounds;

export function preloadAllSprites() {
  sprites = {
    bg_title_screen: loadImage('../img/bigtitlebg.png'),
    bg_title_1: loadImage('../img/bigtitle1.png'),
    bg_title_2: loadImage('../img/bigtitle2.png'),
    bg_charselect: loadImage('../img/bg_charselect.png'),
    select_your_character: loadImage('../img/select_your_character.png'),
    hand_cursor: loadImage('../img/hand_cursor.png'),

    sprite_lol: loadImage('../img/lol.png'),

    sprite_IC1: loadImage('../img/IC_vish.png'),
    sprite_IC2: loadImage('../img/IC_sumichan.png'),
    sprite_IC3: loadImage('../img/IC_wompis.png'),
    sprite_IC4: loadImage('../img/IC_lechina.png'),
    sprite_IC5: loadImage('../img/IC_brewmonkey.png'),
    sprite_IC6: loadImage('../img/IC_ndgt.png'),
    sprite_IC7: loadImage('../img/IC_peanut.png'),
    sprite_IC8: loadImage('../img/IC_goggins.png'),
    sprite_IC9: loadImage('../img/IC_mj.png'),
    sprite_IC10: loadImage('../img/IC_kratos.png'),
    sprite_IC11: loadImage('../img/IC_tony.png'),
    sprite_IC12: loadImage('../img/IC_dgg.png'),
    sprite_IC13: loadImage('../img/IC_marth.png'),
    sprite_IC14: loadImage('../img/IC_jordo.png'),
    sprite_IC15: loadImage('../img/IC_joegan.png'),
    sprite_IC16: loadImage('../img/IC_poki.png'),
    sprite_IC_locked: loadImage('../img/IC_locked.png'),

    sprite_CH1: loadImage('../img/CH_vish.png'),
    sprite_CH2: loadImage('../img/CH_sumichan.png'),
    sprite_CH3: loadImage('../img/CH_wompis.png'),
    sprite_CH4: loadImage('../img/CH_lechina.png'),
    sprite_CH5: loadImage('../img/CH_brewmonkey.png'),
    sprite_CH6: loadImage('../img/CH_ndgt.png'),
    sprite_CH7: loadImage('../img/CH_peanut.png'),
    sprite_CH8: loadImage('../img/CH_goggins.png'),
    sprite_CH9: loadImage('../img/CH_mj.png'),
    sprite_CH10: loadImage('../img/CH_kratos.png'),
    sprite_CH11: loadImage('../img/CH_tony.png'),
    sprite_CH12: loadImage('../img/CH_dgg.png'),
    sprite_CH13: loadImage('../img/CH_marth.png'),
    sprite_CH14: loadImage('../img/CH_jordo.png'),
    sprite_CH15: loadImage('../img/CH_joegan.png'),
    sprite_CH16: loadImage('../img/CH_poki.png'),
    sprite_CH_locked: loadImage('../img/CH_locked.png'),

    tiles_grassland: loadImage('../img/tiles_grassland.png'),
    tiles_cave: loadImage('../img/tiles_cave.png'),
    tiles_castle: loadImage('../img/tiles_castle.png'),
    gate: loadImage('../img/gate.png'),
    chest8: loadImage('../img/chest_08.png'),
    chest16: loadImage('../img/chest_16.png'),
    chest24: loadImage('../img/chest_24.png'),
    key: loadImage('../img/key.png'),
    heart: loadImage('../img/heart.png'),
    heart_capsule: loadImage('../img/heart_capsule.png'),

    deathscreen: loadImage('../img/deathscreen.png'),
    your_dead_text: loadImage('../img/your_dead_text.png'),

    sword_swing_animation: [
      loadImage('../img/sword_swing/sword_swing1.png'),
      loadImage('../img/sword_swing/sword_swing2.png'),
      loadImage('../img/sword_swing/sword_swing3.png'),
      loadImage('../img/sword_swing/sword_swing4.png'),
      loadImage('../img/sword_swing/sword_swing5.png'),
      loadImage('../img/sword_swing/sword_swing6.png'),
      loadImage('../img/sword_swing/sword_swing7.png'),
    ],
    sword_swing_small_animation: [
      loadImage('../img/sword_swing_small/sword_swing_small1.png'),
      loadImage('../img/sword_swing_small/sword_swing_small2.png'),
      loadImage('../img/sword_swing_small/sword_swing_small3.png'),
      loadImage('../img/sword_swing_small/sword_swing_small4.png'),
      loadImage('../img/sword_swing_small/sword_swing_small5.png'),
      loadImage('../img/sword_swing_small/sword_swing_small6.png'),
      loadImage('../img/sword_swing_small/sword_swing_small7.png'),
    ],

    '5mower': loadImage('../img/emojis24/5mower.png'),
    'unknown': loadImage('../img/emojis24/unknown.png'),
    'pepega': loadImage('../img/emojis24/pepega.png'),
    'downbad': loadImage('../img/emojis24/downbad.png'),


    '4shrug': loadImage('../img/emojis24/4shrug.png'),
    'atpquan': loadImage('../img/emojis24/atpquan.png'),
    'bezospog': loadImage('../img/emojis24/bezospog.png'),
    'opieop': loadImage('../img/emojis24/opieop.png'),
    'hulk': loadImage('../img/emojis24/hulk.png'),
    'sheeeesh': loadImage('../img/emojis24/sheeeesh.png'),
    'yes': loadImage('../img/emojis24/yes.png'),
    'zoomer': loadImage('../img/emojis24/zoomer.png'),
  };
  const loadSound = function(url) {
    return({
      play() {

      },
      setVolume() {

      },
      stop() {

      },
      isPlaying() {

      },
    })
  }

  sounds = {
    mus_cylindricalstudios: loadSound('../audio/cylindricalstudios.ogg'),
    mus_title: loadSound('../audio/title.ogg'),
    mus_charselect: loadSound('../audio/charselect.ogg'),
    mus_overworld: loadSound('../audio/overworld.ogg'),
    mus_cave: loadSound('../audio/cave.ogg'),
    mus_castle: loadSound('../audio/castle.ogg'),
    mus_boss: loadSound('../audio/boss_music.ogg'),
    back: loadSound('../audio/back.ogg'),
    ding: loadSound('../audio/ding.ogg'),
    noix_down: loadSound('../audio/noix_down.ogg'),
    noix_up: loadSound('../audio/noix_up.ogg'),
    squeek: loadSound('../audio/squeek.ogg'),
    selected: loadSound('../audio/selected.ogg'),
    stab: loadSound('../audio/stab.ogg'),
    sword_swings: [
      loadSound('../audio/swing01.ogg'),
      loadSound('../audio/swing02.ogg'),
      loadSound('../audio/swing03.ogg'),
    ],
    sword_stabs: [
      loadSound('../audio/stab01.ogg'),
      loadSound('../audio/stab02.ogg'),
      loadSound('../audio/stab03.ogg'),
      loadSound('../audio/stab04.ogg'),
    ],
    mower: loadSound('../audio/5mower.ogg'),
    explode01: loadSound('../audio/explode01.ogg'),
    explode02: loadSound('../audio/explode02.ogg'),
    spawn_key: loadSound('../audio/spawn_key.ogg'),
    spawn_bonus: loadSound('../audio/spawn_bonus.ogg'),
    spawn_4shrug: loadSound('../audio/spawn_4shrug.ogg'),
    key_get: loadSound('../audio/key_get.ogg'),
    gate_open: loadSound('../audio/gate_open.ogg'),
    chest_open: loadSound('../audio/chest_open.ogg'),
    chest_spawn: loadSound('../audio/chest_spawn.ogg'),
    player_get_hit: loadSound('../audio/player_get_hit.ogg'),
    collectible01: loadSound('../audio/collectible01.ogg'),
    collectible02: loadSound('../audio/collectible02.ogg'),
    collectible03: loadSound('../audio/collectible03.ogg'),
    collectible04: loadSound('../audio/collectible04.ogg'),
    collectible05: loadSound('../audio/collectible05.ogg'),
    collectible06: loadSound('../audio/collectible06.ogg'),
    powerup01: loadSound('../audio/powerup01.ogg'),
    powerup02: loadSound('../audio/powerup02.ogg'),
    powerup03: loadSound('../audio/powerup03.ogg'),
    powerup04: loadSound('../audio/powerup04.ogg'),
    powerup05: loadSound('../audio/powerup05.ogg'),
    fart: loadSound('../audio/fart.ogg'),
    text_blip: loadSound('../audio/text_blip.ogg'),
    text_blip2: loadSound('../audio/text_blip2.ogg'),
    your_dead: loadSound('../audio/your_dead.ogg'),
    your_dead_music: loadSound('../audio/your_dead_music.ogg'),
  }
  globalThis.mus_cylindricalstudios_volume = 1;
  globalThis.mus_title_volume = 0.9;
  globalThis.mus_charselect_volume = 0.8;
  globalThis.mus_overworld_volume = 0.7;
  globalThis.mus_cave_volume = 0.5;
  globalThis.mus_castle_volume = 0.6;
  globalThis.mus_boss_volume = 0.6;
  sounds.sword_stabs[0].setVolume(0.5);
  sounds.sword_stabs[1].setVolume(0.5);
  sounds.sword_stabs[2].setVolume(0.5);
  sounds.sword_stabs[3].setVolume(0.5);
  sounds.ding.setVolume(0.6);
  sounds.back.setVolume(0.8);
  sounds.noix_down.setVolume(0.3);
  sounds.noix_up.setVolume(0.2);
  sounds.squeek.setVolume(2);
  sounds.selected.setVolume(0.8);
  sounds.mower.setVolume(0.3);
  sounds.fart.setVolume(0.5);
  sounds.gate_open.setVolume(2);
  sounds.spawn_4shrug.setVolume(2);
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



}
// CH_vish.png
// CH_sumichan.png
// CH_wompis.png
// CH_lechina.png
// CH_brewmonkey.png
// CH_ndgt.png
// CH_peanut.png
// CH_goggins.png
// CH_mj.png
// CH_kratos.png
// CH_tony.png
// CH_dgg.png
// CH_marth.png
// CH_jordo.png
// CH_joegan.png
// CH_poki.png

// IC_vish.png
// IC_sumichan.png
// IC_wompis.png
// IC_lechina.png
// IC_brewmonkey.png
// IC_ndgt.png
// IC_peanut.png
// IC_goggins.png
// IC_mj.png
// IC_kratos.png
// IC_tony.png
// IC_dgg.png
// IC_marth.png
// IC_jordo.png
// IC_joegan.png
// IC_poki.png





/*

CH_brewmonkey.png
CH_dgg.png
CH_goggins.png
CH_joegan.png
CH_jordo.png
CH_kratos.png
CH_lechina.png
CH_marth.png
CH_mj.png
CH_ndgt.png
CH_peanut.png
CH_poki.png
CH_sumichan.png
CH_tony.png
CH_vish.png
CH_wompis.png

IC_brewmonkey.png
IC_dgg.png
IC_goggins.png
IC_joegan.png
IC_jordo.png
IC_kratos.png
IC_lechina.png
IC_marth.png
IC_mj.png
IC_ndgt.png
IC_peanut.png
IC_poki.png
IC_sumichan.png
IC_tony.png
IC_vish.png
IC_wompis.png
*/