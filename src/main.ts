import './style.css';
import { Game } from './game/Game';

const canvasContainer = document.getElementById('canvas-container')!;
const phaseEl = document.getElementById('phase-info')!;
const playerEl = document.getElementById('current-player')!;
const p1GroupEl = document.getElementById('p1-group')!;
const p2GroupEl = document.getElementById('p2-group')!;
const p1BallsEl = document.getElementById('p1-balls')!;
const p2BallsEl = document.getElementById('p2-balls')!;
const messageEl = document.getElementById('message')!;
const overlayEl = document.getElementById('game-over-overlay')!;
const overlayTitleEl = document.getElementById('overlay-title')!;
const overlayMsgEl = document.getElementById('overlay-msg')!;
const restartBtn = document.getElementById('restart-btn')!;

const game = new Game(canvasContainer, {
  phase: phaseEl,
  player: playerEl,
  p1Group: p1GroupEl,
  p2Group: p2GroupEl,
  p1Balls: p1BallsEl,
  p2Balls: p2BallsEl,
  message: messageEl,
  overlay: overlayEl,
  overlayTitle: overlayTitleEl,
  overlayMsg: overlayMsgEl,
  restartBtn,
});

restartBtn.addEventListener('click', () => game.restart());
