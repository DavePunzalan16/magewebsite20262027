/**
 * Legacy sound exports — redirects to the centralized Audio Manager
 */
import { audioManager } from "./audio/AudioManager";
import { UI, GAME } from "./audio/SoundMap";

export function playClick() { audioManager.play(UI.buttonClick); }
export function playHover() { audioManager.play(UI.buttonHover, { volume: 0.4 }); }
export function playBack() { audioManager.play(UI.buttonBack); }
export function playGameStart() { audioManager.play(GAME.gameStart); }
export function playAchievement() { audioManager.play(UI.achievementUnlock); }
export function playError() { audioManager.play(UI.error); }
export function playSuccess() { audioManager.play(UI.success); }
export function playNotification() { audioManager.play(UI.notification); }
export function playScore() { audioManager.play(GAME.score, { volume: 0.7 }); }
export function playVictory() { audioManager.play(GAME.victory); }
export function playDefeat() { audioManager.play(GAME.defeat); }
export function playCoinCollect() { audioManager.play(UI.coinCollect, { volume: 0.8 }); }
export function playLevelUp() { audioManager.play(UI.levelUp); }
