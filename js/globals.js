import { enemy_types } from "./enemies.js";

export function setGlobals() {
  loadSavedData();

  // globalThis.mode = "PRODUCTION";
  globalThis.mode = "DEVELOPMENT";
  //
  //

  console.log("Runnning in development!");

  globalThis.ROOMS = [
    "rm_cylindrical_studios",
    "rm_title_screen",
    "rm_cutscene",
    "rm_char_select",
    "rm_rougelite",
    "rm_credits_scroll",
  ];

  globalThis.char_select_state = 0;
  globalThis.selected_character = 0;
  if (mode === "DEVELOPMENT") {
    // globalThis.ROOMS = [
    //   "rm_title_screen",
    //   "rm_char_select",
    //   "rm_rougelite",
    //   "rm_credits_scroll",
    //   "rm_cylindrical_studios",
    //   "rm_cutscene",
    // ];
  }

  globalThis.ch_names = {
    0: "VISH",
    1: "SUMI-CHAN",
    2: "WOMPIS",
    3: "LECHINA",
    4: "BREW MONKET",
    5: "NDGT",
    6: "PEANUT",
    7: "D. GOGGINS",
    8: "JOEGAN",
    9: "JORDO",
    10: "TONY",
    11: "STEPHEN BONNELL",
    12: "MARTH",
    13: "KRATOS",
    14: "MICHAEL MUTHA\nFUCKIN JACKSON",
    15: "POKIMANE",
  };
  globalThis.ch_shortnames = {
    0: "VISH",
    1: "SUMI-CHAN",
    2: "WOMPIS",
    3: "LECHINA",
    4: "BREW\nMONKET",
    5: "NDGT",
    6: "PEANUT",
    7: "D. GOGGINS",
    8: "JOEGAN",
    9: "JORDO",
    10: "TONY",
    11: "STEPHEN\nBONNELL",
    12: "MARTH",
    13: "KRATOS",
    14: "MICHAEL MF\nJACKSON",
    15: "POKIMANE",
  };
  globalThis.character_flavour_text = [
    // each of these MUST contain EXACTLY FIVE of \n or else EVERYTHING will BREAK

    `"THIS\nALL OF THIS"\n\n\n\n`,
    `"omg im sumi chan\nu can pick me if u want...\n>.<"\n\n\n`,
    `"it's discord's birthday\nu should buy nitro as a\npresent xD"\n\n\n`,
    `"leFRAUD???? NOOOOOOO\nOOOOOOOOO"\n\n\n\n`,
    `"oo oo aa aa"\n[LUCK +1]\n\n\n\n`,
    `"WAHOOOO! let's do this\nwith the power of SCIENCE!!!!\n!!!!!!!!!!!!!!!!!!!YE\nAH"\n[ACC +1]\n`,
    `"im beginning to feel like\na rat dog rat dog..."\n[BARK MODE active]\n\n\n`,
    `"IM HARD"\n[HARD +0. suffer]\n\n\n\n`,
    `"so what are the rules is\nthis MMA or what"\n[DEFENSE +1]\n\n\n`,
    `"Selecting me for your\ngame of "rouge light" is\nlikely to INCREASE your\nproclivity to WIN"\n[ATTACK +1]\n`,
    `"heyyyyy im tony idk what\ni usually say i neva watcha the\nsopranos ayyyy"\n[HP -1]\n\n`,
    `"I have Factorio open on\nmy main monitor so I'll be\ndevoting like 5% of my\nattention to this ok"\n[ACC +2]\n`,
    `"..."\n[RANGE +2]\n\n\n\n`,
    `"wtf game is this... why\nam i here... i was supposed\nto be fighting the dog of\nwar or something..."\n[ATTACK +2]\n`,
    `"HEEE HEE"\n[SPEED +2]\n\n\n`,
    `"hey im poki!!!\nlets try our best or whatev\ner"\n[HP +2]\n\n`,
  ];
  globalThis.character_death_quotes = [
    [
      `${ch_names[0]}:\nwe died what the heck`,
      `${ch_names[0]}:\n????????????????????`,
      `${ch_names[0]}:\nnot this! no siree!`,
    ],
    [
      `${ch_names[1]}:\noh no i let u down :3`,
      `${ch_names[1]}:\noopth >.< that one\nwas my fault!!!`,
      `${ch_names[1]}:\nthis wasnt part of the\nrental agreement....`,
    ],
    [
      `${ch_names[2]}:\nuse code WOMPUS for 5%\noff nitro`,
      `${ch_names[2]}:\nwaaaaaaa\n*crying wumpis sticker*`,
      `${ch_names[2]}:\n*eats burger*`,
    ],
    [
      `${ch_names[3]}:\nim the goat...\nu can't do this to me...`,
      `${ch_names[3]}:\nu miss 99% of the shots`,
      `${ch_names[3]}:\ntheres always next year....`,
    ],
    [
      `${ch_names[4]}:\nyes`,
      `${ch_names[4]}:\nno`,
      `${ch_names[4]}:\noo oo aa aa`,
      `${ch_names[4]}:\n:deadbob:`,
    ],
    [
      `${ch_names[5]}:\nthere is no god.\ni am not going to heaven`,
      `${ch_names[5]}:\ndid u know theres water\nin the ocean`,
      `${ch_names[5]}:\ni didnt have the factoids\nto calculate this!!!!`,
    ],
    [
      `${ch_names[6]}:\ngrrrrr. im a dog`,
      `${ch_names[6]}:\nbarrk bark boark\nsniffffff bark`,
      `${ch_names[6]}:\nROAOARAER boarjk boarf bar\nk`,
    ],
    [
      `${ch_names[7]}:\ngoggins never DIES.\ni will KILL the mother FUCKER\nwho made this game`,
      `${ch_names[7]}:\ndo you get yourself killed\nthis easily in real life?\nTHINK about that.\nSTAY HARD.`,
      `${ch_names[7]}:\nevery DEATH you\nget another LIFE.\nSTAY HARD.`,
    ],
    [
      `${ch_names[8]}:\n*gorilla noises*`,
      `${ch_names[8]}:\nspotify just cut my\nrevenue by 80%`,
      `${ch_names[8]}:\nhey man. it's ok.\njust don't read the comments.\nit's so bad for you man.`,
    ],
    [
      `${ch_names[9]}:\ngit your act together!!!\nthe west is doomed if we\nlet the postmodernists win!!!`,
      `${ch_names[9]}:\ni guess we saw who cancelled\nwho.....\nit was me...\ni got cancelled.......`,
      `${ch_names[9]}:\nthat was a sorry attempt.\nwhy don't you put yourself\ntogether BUCKO`,
    ],
    [
      `${ch_names[10]}:\nheyyy woahhh pizza pie\nwe can alwasy try again\npardner`,
      `${ch_names[10]}:\nhey nexttime we give em\na little TONY MAGIC ehh??`,
      `${ch_names[10]}:\nheyyyy badda bing bada boom\nsomeitmes ya win or lose!!\nits the luck of the draw\nbabey!!! WOOOOO\nOOOOO`,
    ],
    [
      `${ch_names[11]}:\nthis is really bad for my\noptics.`,
      `${ch_names[11]}:\nsorry could you repeat\nthat i wasn't listening.`,
      `${ch_names[11]}:\nyou made a couple logical\nerrors.\ni can walk you through\nmy argument if you want.`,
    ],
    [
      `${ch_names[12]}:\n...\nwhy don't i have\n3 more stocks...`,
      `${ch_names[12]}:\nwhere is the grab button`,
      `${ch_names[12]}:\nuwaaaaaaaahhhhhh...`,
    ],
    [
      `${ch_names[13]}:\nuauarahrugh..... yea...\nlets try again or something...`,
      `${ch_names[13]}:\narggghhh...\nthe dog of war beckons...\nor something....`,
      `${ch_names[13]}:\nsomething tells me u could\nbe playing a better game rn...`,
    ],
    [
      `${ch_names[14]}:\npiss rat`,
      `${ch_names[14]}:\n*moonwalks*`,
      `${ch_names[14]}:\n*crotch grab*`,
    ],
    [
      `${ch_names[15]}:\nomg. stop letting me DIE\n*punches you*`,
      `${ch_names[15]}:\nwtf. *writes twitlonger*`,
      `${ch_names[15]}:\ncan u NOT`,
    ],
  ];
  globalThis.character_colours = [
    color(215, 30, 235),
    color(255, 65, 50),
    color(110, 80, 255),
    color(240, 180, 61),
    color(140, 42, 40),
    color(90, 20, 19),
    color(233, 210, 150),
    color(140, 10, 12),
    color(250, 210, 180),
    color(242, 232, 200),
    color(232, 244, 211),
    color(221, 244, 200),
    color(70, 20, 160),
    color(233, 233, 233),
    color(50, 12, 10),
    color(240, 240, 160),
  ];

  globalThis.KEYS_AFFIRM = [
    32, // space
    13, // enter
    90, // Z
    16, // LSHIFT
  ];
  globalThis.KEYS_BACK = [
    27, // ESC
    8, // backspace
    88, // X
  ];
  globalThis.KEYS_ATTACK = [
    32, // space
    90, // Z
    16, // LSHIFT
  ];

  globalThis.MAX_PIXEL_SCALE = 6;
  globalThis.MIN_PIXEL_SCALE = 1;

  globalThis.debug_mode = false;
  globalThis.TILE_SIZE = 8;

  globalThis.WIDTH_TILES = 40;
  globalThis.HEIGHT_TILES = 30;
  globalThis.WIDTH_PIXELS = TILE_SIZE * WIDTH_TILES; // 320
  globalThis.HEIGHT_PIXELS = TILE_SIZE * HEIGHT_TILES; // 240

  globalThis.WALL_WIDTH_TILES = 3;
  globalThis.EXIT_WIDTH_TILES = 3;

  globalThis.ROOM_WIDTH_TILES = WIDTH_TILES;
  globalThis.ROOM_HEIGHT_TILES = HEIGHT_TILES - 6;
  globalThis.ROOM_WIDTH_PIXELS = TILE_SIZE * ROOM_WIDTH_TILES;
  globalThis.ROOM_HEIGHT_PIXELS = TILE_SIZE * ROOM_HEIGHT_TILES;

  globalThis.ROOM_TRANSITION_YSPEED = 6;
  globalThis.ROOM_TRANSITION_XSPEED = 10;

  globalThis.current_room = ROOMS[0];
  globalThis.active_entities = [];
  globalThis.current_dungeon_room_index = 0;
  globalThis.previous_dungeon_room_index = 0;

  globalThis.boss_cleared = {
    grassland: false,
    cave: false,
    castle: false,
  };

  globalThis.cosineInterp = function (start, end, t) {
    const cos_t = (1 - Math.cos(t * Math.PI)) / 2; //Calculate cos(t)
    return start * (1 - cos_t) + end * cos_t; //Return interpolated value
  };
}

function loadSavedData() {
  const characterUnlocked = {
    0: true, // Unlocked
    1: true, // Unlocked
    2: true, // Unlocked
    3: true, // Unlocked
    4: false, // Locked
    5: false, // Locked
    6: false, // Locked
    7: false, // Locked
    8: false, // Locked
    9: false, // Locked
    10: false, // Locked
    11: false, // Locked
    12: false, // Locked
    13: false, // Locked
    14: false, // Locked
    15: false, // Locked
  };

  const savedCharacterUnlocked = localStorage.getItem("characterUnlocked");
  globalThis.characterUnlocked = savedCharacterUnlocked
    ? JSON.parse(savedCharacterUnlocked)
    : characterUnlocked;

  // Load the ready-to-unlock state
  const saved_ready_to_unlock = localStorage.getItem(
    "ready_to_unlock_characters",
  );
  globalThis.ready_to_unlock_characters = saved_ready_to_unlock
    ? JSON.parse(saved_ready_to_unlock)
    : {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
        10: false,
        11: false,
        12: false,
        13: false,
        14: false,
        15: false,
      };

  const saved_can_skip_cutscene = localStorage.getItem("can_skip_cutscene");
  globalThis.can_skip_cutscene = saved_can_skip_cutscene ? true : false;

  const saved_pixel_scale = localStorage.getItem("pixel_scale");
  globalThis.pixel_scale = saved_pixel_scale ? parseInt(saved_pixel_scale) : 3;

  const saved_seen_lava = localStorage.getItem("seen_lava");
  globalThis.seen_lava = saved_seen_lava ? true : false;

  const saved_unlocked_a_character = localStorage.getItem(
    "unlocked_a_character",
  );
  globalThis.unlocked_a_character =
    saved_unlocked_a_character === "true"
      ? true
      : Object.values(globalThis.ready_to_unlock_characters).some(
          (ready) => ready === true,
        );
}

// Check if any characters are ready to unlock
globalThis.hasReadyToUnlockCharacters = function () {
  return Object.values(globalThis.ready_to_unlock_characters).some(
    (ready) => ready === true,
  );
};

// Mark characters as ready to unlock (call this when you want to unlock 4 at once)
globalThis.setCharactersReadyToUnlock = function (characterIds) {
  characterIds.forEach((id) => {
    globalThis.ready_to_unlock_characters[id] = true;
  });
  globalThis.unlocked_a_character = true;
  localStorage.setItem(
    "ready_to_unlock_characters",
    JSON.stringify(globalThis.ready_to_unlock_characters),
  );
  localStorage.setItem("unlocked_a_character", "true");
};

globalThis.unlockNext4Characters = function () {
  const readyCount = 4;
  let charactersToUnlock = [];

  // Loop through characters 0-15 in order
  for (let i = 0; i <= 15; i++) {
    // Check if this character is locked (not unlocked AND not ready to unlock)
    if (!characterUnlocked[i] && !globalThis.ready_to_unlock_characters[i]) {
      charactersToUnlock.push(i);

      // Stop once we've found 4
      if (charactersToUnlock.length === readyCount) {
        break;
      }
    }
  }

  // Set them as ready to unlock
  if (charactersToUnlock.length > 0) {
    setCharactersReadyToUnlock(charactersToUnlock);
  }

  return charactersToUnlock; // Returns the IDs that were set, in case you need them
};

// Function to generate a random integer within a range
globalThis.getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
globalThis.calculate_angle_between_points = function (x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const degrees = angle * (180 / Math.PI);
  return degrees;
};

globalThis.find_enemy_by_type = function (type) {
  return enemy_types.find((ene) => ene.type === type);
};

const aenemy_names = [
  "5mower",
  "unknown",
  "hypers",
  "pepega",
  "lemickey",
  "downbad",
  "pogyou",
  "sadge",
  "kekw2",
  "bruvchamp",
];
