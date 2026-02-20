import { gameboy_graphics as g } from "./gameboyGraphics.js";
import { sounds, sprites } from "./assets.js";
import { set_fade_level, add_to_fade_level } from "./faderShader.js";
import { enemy_types } from "./enemies.js";

// Initialize dungeon
let dungeon_rooms = [];
let biomes = ["grassland", "cave", "castle"];
let biomeIndex = 0;
let biomeRoomCount = [-1, 0, 0];
let maxRooms = 12;

// a bunch of functions.

function isSpaceAvailable(room, direction) {
  // New room coordinates based on the direction
  let newX = room.x;
  let newY = room.y;

  switch (direction) {
    case "north":
      newY--;
      break;
    case "south":
      newY++;
      break;
    case "west":
      newX--;
      break;
    case "east":
      newX++;
      break;
    default:
      throw new Error("Invalid direction");
  }

  // Check if there's a room in the new position
  for (let i = 0; i < dungeon_rooms.length; i++) {
    if (dungeon_rooms[i].x === newX && dungeon_rooms[i].y === newY) {
      return false;
    }
  }
  return true;
}

// generate a new room object with the specified properties.
function generateRoom(x, y, exits, biome) {
  return { x, y, exits, biome };
}

// create a new room based on an existing room and a direction, and then place the new room in the dungeon.
function addRoom(room, direction) {
  let newRoomX, newRoomY, newRoomExits;

  if (!isSpaceAvailable(room, direction)) {
    return false;
  }

  // first interpret the direction and calculate the coordinates for the new room accordingly.
  // also determine the exit of the new room that leads back to the existing room.
  switch (direction) {
    case "north":
      newRoomX = room.x;
      newRoomY = room.y - 1;
      newRoomExits = ["south"];
      room.exits.push("north");
      break;
    case "east":
      newRoomX = room.x + 1;
      newRoomY = room.y;
      newRoomExits = ["west"];
      room.exits.push("east");
      break;
    case "south":
      newRoomX = room.x;
      newRoomY = room.y + 1;
      newRoomExits = ["north"];
      room.exits.push("south");
      break;
    case "west":
      newRoomX = room.x - 1;
      newRoomY = room.y;
      newRoomExits = ["east"];
      room.exits.push("west");
      break;
  }

  // determine the biome for the new room.
  // If the existing room is a boss room, the new room will have a new biome, otherwise, it will keep the existing room's biome.
  let newBiome = room.boss_room
    ? biomes[(biomeIndex + 1) % biomes.length]
    : room.biome;

  // Finally, we generate the new room and add it to the dungeon, and increment the count for its biome.
  const newRoom = generateRoom(newRoomX, newRoomY, newRoomExits, newBiome);
  dungeon_rooms.push(newRoom);
  biomeRoomCount[biomes.indexOf(newBiome)]++;

  // If the new room has a different biome than the existing room, we update the current biome index.
  if (newRoom.biome !== room.biome)
    biomeIndex = (biomeIndex + 1) % biomes.length;

  return newRoom;
}

// chooses a random room from the dungeon array,
// checks if it's not a boss room, not a starting room and if it doesn't already have 4 exits, AND if it's not the northernmost room (win room)
// If any of these conditions are true, it chooses another room. It continues until it finds a suitable room and returns it.
function chooseRoom() {
  let indices = [...Array(dungeon_rooms.length).keys()];
  indices = indices.filter((index) => {
    let room = dungeon_rooms[index];
    return !(
      (room.x === 0 && room.y === 0) ||
      room.boss_room ||
      room.pre_boss_room ||
      room.exits.length === 4 ||
      isNorthernmost(room, dungeon_rooms)
    );
  });

  if (indices.length > 0) {
    return dungeon_rooms[indices[Math.floor(Math.random() * indices.length)]];
  }

  return null;
}

function isNorthernmost(room) {
  for (let otherRoom of dungeon_rooms) {
    if (otherRoom.y < room.y) {
      return false;
    }
  }
  return true;
}

// create the main path in the dungeon.
function createMainPath(startingRoom) {
  let currentRoom = startingRoom;

  function moveEastOrWest() {
    // Add a room east or west 0, 1, or 2 times
    let horizontalMoves = Math.floor(Math.random() * 3);
    for (let j = 0; j < horizontalMoves; j++) {
      let direction = Math.random() < 0.5 ? "east" : "west";
      let newRoom = addRoom(currentRoom, direction);
      if (newRoom) {
        currentRoom = newRoom;
      }
    }
  }

  currentRoom = addRoom(currentRoom, "north");

  // Repeat this until we have created 3 boss rooms
  for (let i = 0; i < 3; i++) {
    moveEastOrWest();

    // Move north
    currentRoom = addRoom(currentRoom, "north");

    moveEastOrWest();

    // Move north
    // currentRoom = addRoom(currentRoom, 'north');

    // moveEastOrWest();

    // Add a "gate" property to the most recently added room
    currentRoom.gate = true;
    currentRoom.peaceful = true;

    // Add a pre-boss room.
    currentRoom = addRoom(currentRoom, "north");
    currentRoom.peaceful = true;
    currentRoom.pre_boss_room = true;
    currentRoom.pre_boss_room_dimensions = true;

    // Add a room north, and add "boss_room: true" to it
    currentRoom = addRoom(currentRoom, "north");
    currentRoom.boss_room = true;
    if (currentRoom.biome === "castle") {
      // win item, since this is the last chest
      currentRoom.chest = { item: "arnoldproceed" };
    } else {
      currentRoom.chest = { item: "three_hearts" };
    }

    // Add a room with the next biome (handled by addRoom), north of the boss room.
    currentRoom = addRoom(currentRoom, "north");
    currentRoom.peaceful = true;
    if (currentRoom.biome === "grassland") {
      currentRoom.win_room = true;
    }
  }
}

// Fill the remaining rooms
function createSidePaths() {
  let shouldChooseNewRoom = true; // Flag to control whether to choose new room
  let chosenRoom;

  let panic_button = 0;

  while (biomeRoomCount.some((count) => count < maxRooms)) {
    panic_button++;

    if (shouldChooseNewRoom) {
      chosenRoom = chooseRoom();
      if (!chosenRoom) {
        shouldChooseNewRoom = true;
        continue;
      }
    }

    if (biomeRoomCount[biomes.indexOf(chosenRoom.biome)] >= maxRooms) {
      shouldChooseNewRoom = true;
      continue;
    }

    let directions = ["north", "east", "south", "west"];
    directions.sort(() => Math.random() - 0.5);

    for (let direction of directions) {
      let addedRoom = addRoom(chosenRoom, direction);
      if (!addedRoom) {
        shouldChooseNewRoom = true;
        break;
      } else {
        chosenRoom = addedRoom;
      }

      // this makes it more likely to create deeper paths
      shouldChooseNewRoom = !(Math.random() < 0.4);

      // last room for this biome
      if (biomeRoomCount[biomes.indexOf(addedRoom.biome)] === maxRooms) {
        addedRoom.chest = { item: "key" };
        shouldChooseNewRoom = true;
        break;
      } else {
      }
      if (
        addedRoom.exits.length === 4 ||
        isNorthernmost(addedRoom, dungeon_rooms)
      ) {
        shouldChooseNewRoom = true;
        break;
      }
      break;
    }

    if (panic_button > 10000) {
      break;
    }
  }
}

function generateTiles(room) {
  let map = [];

  // Initialize empty map
  for (let row = 0; row < ROOM_HEIGHT_TILES; row++) {
    map.push(".".repeat(ROOM_WIDTH_TILES));
  }

  // Add walls around the map
  for (let row = 0; row < WALL_WIDTH_TILES; row++) {
    map[row] = "1".repeat(ROOM_WIDTH_TILES);
    map[ROOM_HEIGHT_TILES - row - 1] = "1".repeat(ROOM_WIDTH_TILES);
  }
  for (
    let row = WALL_WIDTH_TILES;
    row < ROOM_HEIGHT_TILES - WALL_WIDTH_TILES;
    row++
  ) {
    map[row] =
      "1".repeat(WALL_WIDTH_TILES) +
      ".".repeat(ROOM_WIDTH_TILES - 2 * WALL_WIDTH_TILES) +
      "1".repeat(WALL_WIDTH_TILES);
  }

  // Carve out exits in the center of the walls
  if (room.exits.includes("north")) {
    let startY =
      Math.floor(ROOM_WIDTH_TILES / 2) - Math.floor(EXIT_WIDTH_TILES / 2);
    for (let col = startY; col < startY + EXIT_WIDTH_TILES; col++) {
      for (let row = 0; row < WALL_WIDTH_TILES; row++) {
        map[row] =
          map[row].substring(0, col) + "." + map[row].substring(col + 1);
      }
    }
  }
  if (room.exits.includes("south")) {
    let startY =
      Math.floor(ROOM_WIDTH_TILES / 2) - Math.floor(EXIT_WIDTH_TILES / 2);
    for (let col = startY; col < startY + EXIT_WIDTH_TILES; col++) {
      for (
        let row = ROOM_HEIGHT_TILES - WALL_WIDTH_TILES;
        row < ROOM_HEIGHT_TILES;
        row++
      ) {
        map[row] =
          map[row].substring(0, col) + "." + map[row].substring(col + 1);
      }
    }
  }

  if (room.exits.includes("east")) {
    let startX =
      Math.floor(ROOM_HEIGHT_TILES / 2) - Math.floor(EXIT_WIDTH_TILES / 2);
    for (let row = startX; row < startX + EXIT_WIDTH_TILES; row++) {
      map[row] =
        map[row].substring(0, ROOM_WIDTH_TILES - WALL_WIDTH_TILES) +
        ".".repeat(WALL_WIDTH_TILES);
    }
  }

  if (room.exits.includes("west")) {
    let startX =
      Math.floor(ROOM_HEIGHT_TILES / 2) - Math.floor(EXIT_WIDTH_TILES / 2);
    for (let row = startX; row < startX + EXIT_WIDTH_TILES; row++) {
      map[row] =
        ".".repeat(WALL_WIDTH_TILES) + map[row].substring(WALL_WIDTH_TILES);
    }
  }

  if (room.pre_boss_room_dimensions) {
    const EXTRA_COLUMNS = 10;

    // Thicken left wall
    for (
      let row = WALL_WIDTH_TILES;
      row < ROOM_HEIGHT_TILES - WALL_WIDTH_TILES;
      row++
    ) {
      map[row] =
        "1".repeat(WALL_WIDTH_TILES + EXTRA_COLUMNS) +
        ".".repeat(
          ROOM_WIDTH_TILES - 2 * (WALL_WIDTH_TILES + EXTRA_COLUMNS) + 1,
        ) +
        "1".repeat(WALL_WIDTH_TILES + EXTRA_COLUMNS);
    }
  }

  if (
    (room.x === 0 && room.y === 0) ||
    room.pre_boss_room ||
    room.boss_room ||
    isNorthernmost(room, dungeon_rooms)
  ) {
    // don't make a pond in the start room or pre_boss_room or northernmost room
    return map;
  }

  // Generate pond
  let pond_probability = 0.25;
  if (room.biome === "cave") {
    pond_probability = 0.6;
  }
  if (Math.random() < pond_probability) {
    room.pond = true;

    const pond_min_width = 8;
    const pond_min_height = 6;
    const pond_max_width = 22;
    let pond_max_height = 14;
    if (room.biome === "cave" && room.peaceful) {
      pond_max_height = pond_min_height + 4;
    }
    // Create a 2D grid filled with water (1s)
    const pond = [];
    const pond_height = getRandomInt(pond_min_height, pond_max_height);
    const pond_width = getRandomInt(pond_min_width, pond_max_width);
    for (let row = 0; row < pond_height; row++) {
      pond.push("2".repeat(pond_width));
    }

    pond[0] = replace_char_at(pond[0], 0, ".");
    pond[0] = replace_char_at(pond[0], pond_width - 1, ".");
    pond[pond_height - 1] = replace_char_at(pond[pond_height - 1], 0, ".");
    pond[pond_height - 1] = replace_char_at(
      pond[pond_height - 1],
      pond_width - 1,
      ".",
    );

    // now merge the pond with the current room
    function place_grid(large_grid, small_grid, x, y) {
      // Create a copy of the large_grid
      let output = large_grid.map((row) => row.slice());

      // Loop through the small_grid and update the output grid
      for (let row = 0; row < small_grid.length; row++) {
        for (let col = 0; col < small_grid[row].length; col++) {
          output[row + y] = replace_char_at(
            output[row + y],
            col + x,
            small_grid[row][col],
          );
        }
      }

      return output;
    }

    // Calculate the valid range for x and y based on the larger grid and pond dimensions
    const minX = WALL_WIDTH_TILES + 2;
    const maxX = ROOM_WIDTH_TILES - (WALL_WIDTH_TILES + 2) - pond_width;
    const minY = WALL_WIDTH_TILES + 2;
    let maxY = ROOM_HEIGHT_TILES - (WALL_WIDTH_TILES + 2) - pond_height;
    if (room.biome === "cave" && room.peaceful) {
      maxY = minY;
    }

    // Generate random x and y coordinates within the valid range
    const pond_x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const pond_y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    map = place_grid(map, pond, pond_x, pond_y);
  }

  return map;
}

globalThis.generateEnemySpawnsForRoom = function (room, clearedRoomCount) {
  // This function will return an array of enemy spawn points, tailored to the room
  // and how many rooms the player has already cleared.

  const enemy_spawns = [];

  // TODO: ROOM ENEMY GENERATION LOGIC
  // Apply some logic based on the room type and the clearedRoomCount
  // to create appropriate enemy spawns.

  if (room.boss_room) {
    // BOSS ROOM :D
    let new_enemy_spawn = find_enemy_by_type("lebum").new_spawnpoint(room);
    enemy_spawns.push(new_enemy_spawn);
    return enemy_spawns;
  }

  let num_mowers = 0;
  let num_unknowns = 0;
  let num_pepegas = 0;

  let num_downbads = 0;
  let num_lemickeys = 0;

  let num_kekw2s = 0;

  if (mode === "DEVELOPMENT") {
    const num1 = getRandomInt(2, 5);
    const num2 = getRandomInt(2, 5);
    const enemynamearray = [
      "5mower",
      "unknown",
      "hypers",
      "pepega",
      "lemickey",
      "downbad",
      "pogyou",
      "kekw2",
      "bruvchamp",
      "sadge",
    ];
  }

  // Check if the current room's biome is a grassland
  if (room.biome === "grassland") {
    // Case where no rooms have been cleared or only one room has been cleared
    if (clearedRoomCount === 0 || clearedRoomCount === 1) {
      // Randomly decide between spawning mowers or unknown entities
      if (Math.random() < 0.5) {
        num_mowers = getRandomInt(1, 2); // 50% chance to spawn 1 or 2 mowers
      } else {
        num_unknowns = getRandomInt(1, 2); // 50% chance to spawn 1 or 2 unknown entities
      }

      // Case where exactly two rooms have been cleared
    } else if (clearedRoomCount === 2) {
      const the_rand = Math.random(); // Generate a random number for branching logic

      // Probability based logic for spawning mowers or unknowns
      if (the_rand < 0.3) {
        num_mowers = getRandomInt(2, 5); // 30% chance to spawn between 2 and 5 mowers
      } else if (the_rand < 0.6) {
        num_unknowns = getRandomInt(2, 5); // Next 30% chance for unknowns
      } else {
        num_mowers = getRandomInt(2, 3); // Remaining 40% chance to spawn both mowers and unknowns
        num_unknowns = getRandomInt(2, 3);
      }

      // Case where up to three rooms have been cleared
    } else if (clearedRoomCount <= 3) {
      num_pepegas = getRandomInt(1, 2); // Spawn 1 or 2 pepegas regardless of the random number

      // Randomly decide between spawning mowers or unknown entities
      if (Math.random() < 0.5) {
        num_mowers = getRandomInt(2, 4); // 50% chance to spawn between 2 and 5 mowers
      } else {
        num_unknowns = getRandomInt(2, 4); // 50% chance to spawn between 2 and 5 unknown entities
      }

      // Case where up to four rooms have been cleared
    } else if (clearedRoomCount <= 4) {
      num_pepegas = getRandomInt(1, 3); // Spawn 1 to 3 pepegas regardless of the random number

      // Randomly decide between spawning mowers or unknown entities
      if (Math.random() < 0.5) {
        num_mowers = getRandomInt(2, 5); // 50% chance to spawn between 2 and 5 mowers
      } else {
        num_unknowns = getRandomInt(2, 5); // 50% chance to spawn between 2 and 5 unknown entities
      }

      // Case where more than four rooms have been cleared
    } else {
      // Randomly shuffle the array of types and then decide which entities to spawn based on the order
      let types = ["mowers", "unknowns", "pepegas"].sort(
        () => Math.random() < 0.5,
      );

      // Assign random counts for each entity based on the shuffled types
      if (types[0] === "mowers" || types[1] === "mowers") {
        num_mowers = getRandomInt(2, 5); // If 'mowers' is in the first two types, spawn 2 to 5 mowers
      }
      if (types[0] === "unknowns" || types[1] === "unknowns") {
        num_unknowns = getRandomInt(2, 5); // Similarly for 'unknowns'
      }
      if (types[0] === "pepegas" || types[1] === "pepegas") {
        num_pepegas = getRandomInt(2, 5); // And for 'pepegas'
      }
    }

    for (let i = 0; i < num_mowers; i++) {
      let new_enemy_spawn = find_enemy_by_type("5mower").new_spawnpoint(room);
      enemy_spawns.push(new_enemy_spawn);
    }
    for (let i = 0; i < num_unknowns; i++) {
      let new_enemy_spawn = find_enemy_by_type("unknown").new_spawnpoint(room);
      enemy_spawns.push(new_enemy_spawn);
    }
    for (let i = 0; i < num_pepegas; i++) {
      let new_enemy_spawn = find_enemy_by_type("pepega").new_spawnpoint(room);
      enemy_spawns.push(new_enemy_spawn);
    }
  }
  if (room.biome === "cave") {
    let num_lemickeys = 0;
    let num_downbads = 0;
    let num_hypers = 0;
    switch (clearedRoomCount) {
      case 0:
        globalThis.groink = getRandomInt(0, 1);
        if (groink) {
          num_downbads = 1;
          num_lemickeys = 1;
        } else {
          num_lemickeys = 2;
        }
        break;
      case 1:
        if (!groink) {
          num_downbads = 1;
          num_lemickeys = 1;
        } else {
          num_lemickeys = getRandomInt(2, 3);
        }
        break;
      case 2:
        num_downbads = 0;
        if (Math.random() < 0.5) {
          num_lemickeys = getRandomInt(2, 4);
        } else {
          num_hypers = getRandomInt(2, 3);
        }
        break;
      case 3:
        num_downbads = getRandomInt(0, 1);
        num_hypers = getRandomInt(2, 3);
        if (num_downbads === 0) {
          num_hypers++;
        }
        break;
      case 4:
        num_downbads = 1;
        if (Math.random() < 0.5) {
          num_lemickeys = getRandomInt(2, 4);
        } else {
          num_hypers = getRandomInt(2, 3);
        }
        break;
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
        num_downbads = getRandomInt(0, 2);
        if (Math.random() < 0.5) {
          num_lemickeys = getRandomInt(3, 5);
          if (num_downbads === 0 && num_lemickeys <= 4) {
            num_hypers = getRandomInt(1, 2);
          }
        } else {
          num_hypers = getRandomInt(2, 4);
          if (num_downbads === 0 && num_hypers <= 4) {
            num_lemickeys = getRandomInt(1, 2);
          }
        }
        break;
      default:
        break;
    }

    for (let i = 0; i < num_lemickeys; i++) {
      let new_enemy_spawn = find_enemy_by_type("lemickey").new_spawnpoint(room);
      enemy_spawns.push(new_enemy_spawn);
    }
    for (let i = 0; i < num_downbads; i++) {
      let new_enemy_spawn = find_enemy_by_type("downbad").new_spawnpoint(room);
      enemy_spawns.push(new_enemy_spawn);
    }
    for (let i = 0; i < num_hypers; i++) {
      let new_enemy_spawn = find_enemy_by_type("hypers").new_spawnpoint(room);
      enemy_spawns.push(new_enemy_spawn);
    }
  }
  if (room.biome === "castle") {
    let num_kekw2s = getRandomInt(2, 6);
    let num_bruvchamps = getRandomInt(2, 6);
    let num_pogyous = getRandomInt(2, 6);

    let bad1 = getRandomInt(1, 3);

    if (clearedRoomCount === 0) {
      num_kekw2s = 2;
      num_bruvchamps = 0;
      num_pogyous = 0;
      bad1 = -1;
    }
    if (clearedRoomCount === 1) {
      num_kekw2s = 0;
      num_bruvchamps = 2;
      num_pogyous = 2;
      bad1 = -1;
    }

    if (bad1 !== 1) {
      for (let i = 0; i < num_kekw2s; i++) {
        let new_enemy_spawn = find_enemy_by_type("kekw2").new_spawnpoint(room);
        enemy_spawns.push(new_enemy_spawn);
      }
    }
    if (bad1 !== 2) {
      for (let i = 0; i < num_bruvchamps; i++) {
        let new_enemy_spawn =
          find_enemy_by_type("bruvchamp").new_spawnpoint(room);
        enemy_spawns.push(new_enemy_spawn);
      }
    }
    if (bad1 !== 3) {
      for (let i = 0; i < num_pogyous; i++) {
        let new_enemy_spawn = find_enemy_by_type("pogyou").new_spawnpoint(room);
        enemy_spawns.push(new_enemy_spawn);
      }
    }
  }

  return enemy_spawns;
};

function see_if_this_room_is_an_enemy_room(room) {
  if (room.x === 0 && room.y === 0) {
    return false;
  }
  if (room.pre_boss_room) {
    return false;
  }
  if (room.peaceful) {
    return false;
  }
  if (room.win_room) {
    return false;
  }

  return true;
}

export function generate_dungeon() {
  // Initialize dungeon
  dungeon_rooms = [];
  biomes = ["grassland", "cave", "castle"];
  biomeIndex = 0;
  biomeRoomCount = [-1, 0, 0];
  maxRooms = 12;

  // Create the starting room
  let startingRoom = generateRoom(0, 0, [], biomes[biomeIndex]);
  startingRoom.peaceful = true;
  startingRoom.visited = true;
  dungeon_rooms.push(startingRoom);
  biomeRoomCount[biomeIndex]++;

  // Create the main path
  createMainPath(startingRoom);

  // Create the side paths
  createSidePaths();

  // Create tiles and images for each room
  dungeon_rooms.forEach((room) => {
    room.tiles = generateTiles(room);
    room.image = new_room_image(room);
    room.enemy_room = see_if_this_room_is_an_enemy_room(room);
  });

  // console.log(dungeon_rooms);

  return {
    rooms: dungeon_rooms,
  };
}

// Function to get room index at certain coords
export function getRoomIndex(rooms, x, y) {
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].x === x && rooms[i].y === y) {
      return i;
    }
  }
  return -1;
}

// BADDDDDDDDDDDD ------------------------------------------------------------------------------------- VERY BAD STUFF BELOW HERE
/*


// Function to check if a room exists at given coordinates (x, y)
function roomExists(rooms, x, y) {
  return getRoomIndex(rooms, x, y) !== -1;
}
export function generate_dungeon_BAD() {


  // Function to add a new room to the dungeon
  function addRoomIfUnoccupied(rooms, currentRoom, direction) {
    const offsets = {
      north: { x: 0, y: -1, opposite: 'south' },
      east: { x: 1, y: 0, opposite: 'west' },
      south: { x: 0, y: 1, opposite: 'north' },
      west: { x: -1, y: 0, opposite: 'east' }
    };

    const { x, y } = currentRoom;
    const offset = offsets[direction];
    const newX = x + offset.x;
    const newY = y + offset.y;

    if (!roomExists(rooms, newX, newY)) {
      const newRoom = { x: newX, y: newY, exits: [], biome: currentRoom.biome, visited: false, cleared: true };
      newRoom.exits.push(offset.opposite);
      currentRoom.exits.push(direction);
      rooms.push(newRoom);

      return newRoom;
    }

    return null;
  }



  // recursively generate the dungeon
  const startingRoom = { x: 0, y: 0, exits: [], biome: 'grassland', visited: true, starting_room: true, cleared: true };
  const rooms = [startingRoom];

  const second_room = addRoomIfUnoccupied(rooms, startingRoom, 'east');
  let current_room = second_room;
  const numRooms = 30;

  for (let i = 0; i < numRooms; i++) {

    const directions = ['north', 'east', 'south', 'west'];
    const potentialExits = directions.filter(direction => !current_room.exits.includes(direction));

    if (potentialExits.length === 0) {
      //TODO: fix this by recursing to the previous room with available potentialExits
      break;
    }

    let newRoom = null;

    while (potentialExits.length > 0) {
      // Pick a random index
      const randomExitIndex = getRandomInt(0, potentialExits.length - 1);

      // Get the random element and do nothing
      const new_exit = potentialExits[randomExitIndex];

      // Remove the random element from the array
      potentialExits.splice(randomExitIndex, 1);

      newRoom = addRoomIfUnoccupied(rooms, current_room, new_exit);
      if (newRoom !== null) {
        break;
      }
    }

    if (newRoom === null) {
      console.log('oh my god we really died');
      //TODO: REALLY FIX THIS WE NEED TO RECURSE AND ACTUALLY CREATE ROOMS INSTEAD OF FAILING TO CREATE ROOMS
      break;
    }

    // now we have successfully added a new default room
    // change room settings here depending on where we are in the dungeon

    if (i <= 10) {
      newRoom.biome = 'grassland';
    } else if (i <= 20) {
      newRoom.biome = 'cave';
    } else if (i <= 30) {
      newRoom.biome = 'castle';
    }
    current_room = newRoom;

  }


  return { 'rooms': rooms };

}

*/
