/**
 * M.A.G.E. Guild — Complete Sound Assignment Map
 * 
 * Maps every game event to the appropriate .mp3 file from /public/Sound/
 * All paths are relative to public root.
 */

// === UI / GLOBAL SOUNDS ===
export const UI = {
  buttonClick: "/Sound/button_click.mp3",
  buttonHover: "/Sound/button_hover.mp3",
  buttonBack: "/Sound/button_back.mp3",
  menuOpen: "/Sound/menu_open.mp3",
  menuClose: "/Sound/menu_close.mp3",
  popupOpen: "/Sound/popup_open.mp3",
  popupClose: "/Sound/popup_close.mp3",
  tabSwitch: "/Sound/tab_switch.mp3",
  notification: "/Sound/notification.mp3",
  error: "/Sound/error.mp3",
  success: "/Sound/success.mp3",
  achievementUnlock: "/Sound/achievement_unlock.mp3",
  levelUp: "/Sound/level_up.mp3",
  xpGain: "/Sound/xp_gain.mp3",
  coinCollect: "/Sound/coin_collect.mp3",
  goldCollect: "/Sound/gold_collect.mp3",
  questComplete: "/Sound/quest_complete.mp3",
  missionComplete: "/Sound/mission_complete.mp3",
  newHighscore: "/Sound/new_highscore.mp3",
  loading: "/Sound/loading.mp3",
  shopOpen: "/Sound/shop_open.mp3",
  shopBuy: "/Sound/shop_buy.mp3",
  shopSell: "/Sound/shop_sell.mp3",
  cash: "/Sound/cash.mp3",
  trade: "/Sound/trade.mp3",
  upgrade: "/Sound/upgrade.mp3",
  dialogue: "/Sound/dialogue.mp3",
} as const;

// === GAME STATE SOUNDS ===
export const GAME = {
  countdown: "/Sound/countdown.mp3",
  gameStart: "/Sound/game_start.mp3",
  gamePause: "/Sound/game_pause.mp3",
  gameResume: "/Sound/game_resume.mp3",
  gameOver: "/Sound/game_over.mp3",
  victory: "/Sound/victory.mp3",
  defeat: "/Sound/defeat.mp3",
  score: "/Sound/score.mp3",
  correct: "/Sound/correct.mp3",
  wrong: "/Sound/wrong.mp3",
  timeUp: "/Sound/time_up.mp3",
  timerTick: "/Sound/timer_tick.mp3",
  respawn: "/Sound/respawn.mp3",
  savePoint: "/Sound/save_point.mp3",
  finish: "/Sound/finish.mp3",
} as const;

// === PUZZLE GAME SOUNDS ===
export const PUZZLE = {
  tileMove: "/Sound/tile_move.mp3",
  tileMerge: "/Sound/tile_merge.mp3",
  lineClear: "/Sound/line_clear.mp3",
  pieceRotate: "/Sound/piece_rotate.mp3",
  piecePlace: "/Sound/piece_place.mp3",
  numberPlace: "/Sound/number_place.mp3",
  match: "/Sound/match.mp3",
  cellOpen: "/Sound/cell_open.mp3",
  cardFlip: "/Sound/card_flip.mp3",
  cardPick: "/Sound/card_pick.mp3",
  cardPlace: "/Sound/card_place.mp3",
} as const;

// === BOARD GAME SOUNDS ===
export const BOARD = {
  pieceMove: "/Sound/piece_move.mp3",
  piecePlace: "/Sound/piece_place.mp3",
  pieceCapture: "/Sound/piece_capture.mp3",
  diceRoll: "/Sound/dice_roll.mp3",
  diceLand: "/Sound/dice_land.mp3",
  chip: "/Sound/chip.mp3",
  draw: "/Sound/draw.mp3",
  flagPlace: "/Sound/flag_place.mp3",
  flagRemove: "/Sound/flag_remove.mp3",
} as const;

// === ARCADE / ACTION SOUNDS ===
export const ACTION = {
  jump: "/Sound/jump.mp3",
  land: "/Sound/land.mp3",
  dash: "/Sound/dash.mp3",
  run: "/Sound/run.mp3",
  climb: "/Sound/climb.mp3",
  fall: "/Sound/fall.mp3",
  slide: "/Sound/slide.mp3",
  shoot: "/Sound/shoot.mp3",
  laser: "/Sound/laser.mp3",
  explosion: "/Sound/explosion.mp3",
  rocket: "/Sound/rocket.mp3",
  attack: "/Sound/attack.mp3",
  criticalHit: "/Sound/critical_hit.mp3",
  block: "/Sound/block.mp3",
  parry: "/Sound/parry.mp3",
  hurt: "/Sound/hurt.mp3",
  heal: "/Sound/heal.mp3",
  enemyHit: "/Sound/enemy_hit.mp3",
  enemyDie: "/Sound/enemy_die.mp3",
  alienDie: "/Sound/alien_die.mp3",
  alienMove: "/Sound/alien_move.mp3",
  bossRoar: "/Sound/boss_roar.mp3",
  bounce: "/Sound/bounce.mp3",
  crash: "/Sound/crash.mp3",
  magicCast: "/Sound/magic_cast.mp3",
  teleport: "/Sound/teleport.mp3",
  portal: "/Sound/portal.mp3",
  thruster: "/Sound/thruster.mp3",
  ufo: "/Sound/ufo.mp3",
} as const;

// === SPORTS SOUNDS ===
export const SPORTS = {
  kick: "/Sound/kick.mp3",
  ballHit: "/Sound/ball_hit.mp3",
  ballCollision: "/Sound/ball_collision.mp3",
  ballRoll: "/Sound/ball_roll.mp3",
  puckHit: "/Sound/puck_hit.mp3",
  racketHit: "/Sound/racket_hit.mp3",
  cueHit: "/Sound/cue_hit.mp3",
  serve: "/Sound/serve.mp3",
  goal: "/Sound/goal.mp3",
  crowdCheer: "/Sound/crowd_cheer.mp3",
  whistle: "/Sound/whistle.mp3",
} as const;

// === RACING SOUNDS ===
export const RACING = {
  engineStart: "/Sound/engine_start.mp3",
  engineIdle: "/Sound/engine_idle.mp3",
  accelerate: "/Sound/accelerate.mp3",
  brake: "/Sound/brake.mp3",
  drift: "/Sound/drift.mp3",
  boost: "/Sound/boost.mp3",
  crash: "/Sound/crash.mp3",
  finish: "/Sound/finish.mp3",
} as const;

// === CASINO / LUCK SOUNDS ===
export const CASINO = {
  reelSpin: "/Sound/reel_spin.mp3",
  reelStop: "/Sound/reel_stop.mp3",
  diceRoll: "/Sound/dice_roll.mp3",
  diceLand: "/Sound/dice_land.mp3",
  chip: "/Sound/chip.mp3",
  cash: "/Sound/cash.mp3",
} as const;

// === ITEM / INVENTORY SOUNDS ===
export const ITEMS = {
  pickupItem: "/Sound/pickup_item.mp3",
  dropItem: "/Sound/drop_item.mp3",
  equip: "/Sound/equip.mp3",
  unequip: "/Sound/unequip.mp3",
  consume: "/Sound/consume.mp3",
  eat: "/Sound/eat.mp3",
  drink: "/Sound/drink.mp3",
  keyPickup: "/Sound/key_pickup.mp3",
  chestOpen: "/Sound/chest_open.mp3",
  gemCollect: "/Sound/gem_collect.mp3",
  goldCollect: "/Sound/gold_collect.mp3",
  ironCollect: "/Sound/iron_collect.mp3",
  stoneCollect: "/Sound/stone_collect.mp3",
  woodCollect: "/Sound/wood_collect.mp3",
  inventoryOpen: "/Sound/inventory_open.mp3",
  inventoryClose: "/Sound/inventory_close.mp3",
} as const;

// === BUILDING / CRAFTING SOUNDS ===
export const CRAFT = {
  craft: "/Sound/craft.mp3",
  building: "/Sound/building.mp3",
  hammer: "/Sound/hammer.mp3",
  repair: "/Sound/repair.mp3",
  saw: "/Sound/saw.mp3",
  placeObject: "/Sound/place_object.mp3",
  destroyObject: "/Sound/destroy_object.mp3",
  openDoor: "/Sound/open_door.mp3",
  openClose: "/Sound/open_close.mp3",
} as const;

// === NATURE / FARMING SOUNDS ===
export const NATURE = {
  plantSeed: "/Sound/plant_seed.mp3",
  waterCrop: "/Sound/water_crop.mp3",
  fertilize: "/Sound/fertilize.mp3",
  cropGrow: "/Sound/crop_grow.mp3",
  harvest: "/Sound/harvest.mp3",
  fruitPick: "/Sound/fruit_pick.mp3",
  axeHitTree: "/Sound/axe_hit_tree.mp3",
  treeFall: "/Sound/tree_fall.mp3",
  hoe: "/Sound/hoe.mp3",
  dig: "/Sound/dig.mp3",
  pickStick: "/Sound/pick_stick.mp3",
  fishSplash: "/Sound/fish_splash.mp3",
  arrowRelease: "/Sound/arrow_release.mp3",
  rockBreak: "/Sound/rock_break.mp3",
  mineStone: "/Sound/mine_stone.mp3",
  mineIron: "/Sound/mine_iron.mp3",
  mineGold: "/Sound/mine_gold.mp3",
} as const;

// === ENVIRONMENT / AMBIENCE SOUNDS ===
export const AMBIENCE = {
  rain: "/Sound/rain.mp3",
  wind: "/Sound/wind.mp3",
  storm: "/Sound/storm.mp3",
  thunder: "/Sound/thunder.mp3",
  fire: "/Sound/fire.mp3",
  swim: "/Sound/swim.mp3",
  bird: "/Sound/bird.mp3",
  frog: "/Sound/frog.mp3",
  bee: "/Sound/bee.mp3",
  wolf: "/Sound/wolf.mp3",
  snake: "/Sound/snake.mp3",
  chicken: "/Sound/chicken.mp3",
  cow: "/Sound/cow.mp3",
  pig: "/Sound/pig.mp3",
  sheep: "/Sound/sheep.mp3",
} as const;

// === MOVEMENT / FOOTSTEP SOUNDS ===
export const MOVEMENT = {
  footstepGrass: "/Sound/footstep_grass.mp3",
  footstepSand: "/Sound/footstep_sand.mp3",
  footstepStone: "/Sound/footstep_stone.mp3",
  footstepWood: "/Sound/footstep_wood.mp3",
  footstepWater: "/Sound/footstep_water.mp3",
  run: "/Sound/run.mp3",
  swim: "/Sound/swim.mp3",
  climb: "/Sound/climb.mp3",
  jump: "/Sound/jump.mp3",
  land: "/Sound/land.mp3",
  fall: "/Sound/fall.mp3",
  dash: "/Sound/dash.mp3",
  slide: "/Sound/slide.mp3",
} as const;

// === COMBAT SOUNDS ===
export const COMBAT = {
  attack: "/Sound/attack.mp3",
  criticalHit: "/Sound/critical_hit.mp3",
  block: "/Sound/block.mp3",
  parry: "/Sound/parry.mp3",
  shoot: "/Sound/shoot.mp3",
  laser: "/Sound/laser.mp3",
  explosion: "/Sound/explosion.mp3",
  hurt: "/Sound/hurt.mp3",
  enemyHit: "/Sound/enemy_hit.mp3",
  enemyDie: "/Sound/enemy_die.mp3",
  bossRoar: "/Sound/boss_roar.mp3",
  magicCast: "/Sound/magic_cast.mp3",
  heal: "/Sound/heal.mp3",
} as const;

// === DESTRUCTION SOUNDS ===
export const DESTROY = {
  brickBreak: "/Sound/brick_break.mp3",
  rockBreak: "/Sound/rock_break.mp3",
  asteroidBreak: "/Sound/asteroid_break.mp3",
  destroyObject: "/Sound/destroy_object.mp3",
  explosion: "/Sound/explosion.mp3",
  crash: "/Sound/crash.mp3",
} as const;

// === BACKGROUND MUSIC ===
export const MUSIC = {
  mainMenu: "/music/mage.mp3",
  arcade: "/music/M2.mp3",
  puzzle: "/music/M3.mp3",
  action: "/music/M4.mp3",
  chill: "/music/M5.mp3",
  boss: "/music/M6.mp3",
} as const;

// === PRELOAD GROUPS ===
// Sounds that should be preloaded for instant feedback
export const PRELOAD_UI = [
  UI.buttonClick, UI.buttonHover, UI.buttonBack,
  UI.notification, UI.error, UI.success,
  GAME.gameStart, GAME.gameOver, GAME.victory, GAME.defeat,
  GAME.score, GAME.correct, GAME.wrong,
];

export const PRELOAD_ARCADE = [
  ACTION.jump, ACTION.shoot, ACTION.explosion,
  ACTION.enemyHit, ACTION.enemyDie, ACTION.hurt,
  ACTION.bounce, GAME.score, UI.coinCollect,
];

export const PRELOAD_PUZZLE = [
  PUZZLE.tileMove, PUZZLE.tileMerge, PUZZLE.lineClear,
  PUZZLE.piecePlace, PUZZLE.pieceRotate, PUZZLE.match,
  GAME.correct, GAME.wrong,
];

export const PRELOAD_BOARD = [
  BOARD.pieceMove, BOARD.pieceCapture, BOARD.piecePlace,
  GAME.correct, GAME.wrong, GAME.victory,
];

export const PRELOAD_SPORTS = [
  SPORTS.ballHit, SPORTS.kick, SPORTS.goal,
  SPORTS.crowdCheer, SPORTS.whistle, SPORTS.puckHit,
];
