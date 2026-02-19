import * as PIXI from 'pixi.js';
import { Ball } from './Ball';
import { Table } from './Table';
import { Cue } from './Cue';
import { Physics } from './Physics';
import { GamePhase, PlayerState, ShotResult } from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  RACK_POSITIONS, CUE_BALL_START_X, CUE_BALL_START_Y,
  MAX_POWER, POWER_CHARGE_RATE,
  PLAY_LEFT, PLAY_RIGHT, PLAY_TOP, PLAY_BOTTOM,
  BALL_RADIUS,
} from './constants';

export class Game {
  app: PIXI.Application;
  private table: Table;
  private balls: Ball[] = [];
  private cue: Cue;

  private phase: GamePhase = 'AIMING';
  private currentPlayer = 0;
  private players: PlayerState[] = [
    { name: 'Player 1', group: null },
    { name: 'Player 2', group: null },
  ];

  private mouseX = 0;
  private mouseY = 0;
  private isCharging = false;
  private power = 0;

  // Track shot result across frames
  private shotResult: ShotResult = {
    pocketedBalls: [],
    cueBallPocketed: false,
    firstBallHit: null,
    cushionHit: false,
  };

  // UI element references (HTML elements passed in)
  private uiElements: {
    phase: HTMLElement;
    player: HTMLElement;
    p1Group: HTMLElement;
    p2Group: HTMLElement;
    p1Balls: HTMLElement;
    p2Balls: HTMLElement;
    message: HTMLElement;
    overlay: HTMLElement;
    overlayTitle: HTMLElement;
    overlayMsg: HTMLElement;
    restartBtn: HTMLElement;
  };

  constructor(container: HTMLElement, ui: Game['uiElements']) {
    this.uiElements = ui;

    this.app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });
    container.appendChild(this.app.view as HTMLCanvasElement);

    this.table = new Table();
    this.app.stage.addChild(this.table.container);

    this.cue = new Cue();
    this.app.stage.addChild(this.cue.container);

    this.setupBalls();
    this.setupInput();

    this.app.ticker.add(() => this.update());
    this.updateUI();
  }

  private setupBalls(): void {
    // Remove old balls from stage
    for (const b of this.balls) {
      this.app.stage.removeChild(b.container);
    }
    this.balls = [];

    // Cue ball
    const cueBall = new Ball(0, CUE_BALL_START_X, CUE_BALL_START_Y);
    this.balls.push(cueBall);
    this.app.stage.addChild(cueBall.container);

    // Rack balls
    for (const pos of RACK_POSITIONS) {
      const ball = new Ball(pos.ballNum, pos.x, pos.y);
      this.balls.push(ball);
      this.app.stage.addChild(ball.container);
    }
  }

  private setupInput(): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      const pos = e.getLocalPosition(this.app.stage);
      this.mouseX = pos.x;
      this.mouseY = pos.y;

      if (this.phase === 'BALL_IN_HAND') {
        const cb = this.getCueBall();
        if (cb) {
          cb.x = Math.max(PLAY_LEFT + BALL_RADIUS, Math.min(PLAY_RIGHT - BALL_RADIUS, pos.x));
          cb.y = Math.max(PLAY_TOP + BALL_RADIUS, Math.min(PLAY_BOTTOM - BALL_RADIUS, pos.y));
        }
      }
    });

    this.app.stage.on('pointerdown', () => {
      if (this.phase === 'BALL_IN_HAND') {
        this.phase = 'AIMING';
        this.updateUI();
        return;
      }
      if (this.phase === 'AIMING') {
        this.isCharging = true;
        this.power = 0;
      }
    });

    this.app.stage.on('pointerup', () => {
      if (this.phase === 'AIMING' && this.isCharging && this.power > 0.05) {
        this.shoot();
      }
      this.isCharging = false;
    });
  }

  private getCueBall(): Ball | undefined {
    return this.balls.find((b) => b.ballNumber === 0 && b.active);
  }

  private shoot(): void {
    const cb = this.getCueBall();
    if (!cb) return;

    const dx = this.mouseX - cb.x;
    const dy = this.mouseY - cb.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const speed = this.power * MAX_POWER;
    cb.vx = (dx / len) * speed;
    cb.vy = (dy / len) * speed;

    this.shotResult = {
      pocketedBalls: [],
      cueBallPocketed: false,
      firstBallHit: null,
      cushionHit: false,
    };

    this.phase = 'SHOOTING';
    this.isCharging = false;
    this.power = 0;
    this.updateUI();
  }

  private update(): void {
    if (this.phase === 'SHOOTING') {
      const { pocketed, firstHit, cushionHit } = Physics.step(this.balls);

      // Accumulate shot result
      for (const bn of pocketed) {
        if (bn === 0) this.shotResult.cueBallPocketed = true;
        else this.shotResult.pocketedBalls.push(bn);
      }
      if (firstHit !== null && this.shotResult.firstBallHit === null) {
        this.shotResult.firstBallHit = firstHit;
      }
      if (cushionHit) this.shotResult.cushionHit = true;

      if (Physics.allStopped(this.balls)) {
        this.resolveShotResult();
      }
    }

    if (this.phase === 'AIMING' && this.isCharging) {
      this.power = Math.min(1, this.power + POWER_CHARGE_RATE / 60);
    }

    this.render();
  }

  private resolveShotResult(): void {
    const result = this.shotResult;
    const player = this.players[this.currentPlayer];
    const other = this.players[1 - this.currentPlayer];

    // Check if 8-ball was pocketed
    if (result.pocketedBalls.includes(8)) {
      const myBallsLeft = this.getBallsLeft(player.group);
      if (myBallsLeft.length === 0) {
        // Win!
        this.triggerGameOver(`${player.name} wins! 🎱`, '8-Ball legally pocketed!');
      } else {
        // Pocketed 8-ball too early
        this.triggerGameOver(`${other.name} wins!`, `${player.name} pocketed the 8-ball too early!`);
      }
      return;
    }

    // Cue ball scratch
    if (result.cueBallPocketed) {
      this.showMessage(`${player.name} scratched! Ball-in-hand for ${other.name}.`);
      this.respawnCueBall();
      this.switchPlayer();
      this.phase = 'BALL_IN_HAND';
      this.updateUI();
      return;
    }

    // Assign groups if not yet assigned
    if (!player.group && result.pocketedBalls.length > 0) {
      const firstPocketed = result.pocketedBalls[0];
      const isSolid = firstPocketed >= 1 && firstPocketed <= 7;
      player.group = isSolid ? 'solids' : 'stripes';
      other.group = isSolid ? 'stripes' : 'solids';
      this.showMessage(`${player.name} → ${player.group.toUpperCase()}! ${other.name} → ${other.group.toUpperCase()}!`);
    }

    // Check if current player pocketed their own balls
    const myGroup = player.group;
    const pocketedOwn = myGroup
      ? result.pocketedBalls.filter((n) => this.isBallInGroup(n, myGroup)).length
      : result.pocketedBalls.filter((n) => n !== 8).length;

    const keepTurn = pocketedOwn > 0;

    if (!keepTurn) {
      this.switchPlayer();
    }

    this.phase = 'AIMING';
    this.updateUI();
    this.checkWinCondition();
  }

  private isBallInGroup(ballNumber: number, group: 'solids' | 'stripes'): boolean {
    if (group === 'solids') return ballNumber >= 1 && ballNumber <= 7;
    return ballNumber >= 9 && ballNumber <= 15;
  }

  private getBallsLeft(group: 'solids' | 'stripes' | null): number[] {
    if (!group) return [];
    return this.balls.filter((b) => b.active && this.isBallInGroup(b.ballNumber, group)).map((b) => b.ballNumber);
  }

  private checkWinCondition(): void {
    const player = this.players[this.currentPlayer];
    if (player.group && this.getBallsLeft(player.group).length === 0) {
      this.showMessage(`${player.name}: All ${player.group} pocketed! Now sink the 8-ball!`);
    }
  }

  private switchPlayer(): void {
    this.currentPlayer = 1 - this.currentPlayer;
  }

  private respawnCueBall(): void {
    const cb = this.balls.find((b) => b.ballNumber === 0);
    if (cb) {
      cb.active = true;
      cb.x = CUE_BALL_START_X;
      cb.y = CUE_BALL_START_Y;
      cb.vx = 0;
      cb.vy = 0;
    }
  }

  private triggerGameOver(title: string, message: string): void {
    this.phase = 'GAME_OVER';
    this.uiElements.overlayTitle.textContent = title;
    this.uiElements.overlayMsg.textContent = message;
    this.uiElements.overlay.classList.remove('hidden');
    this.updateUI();
  }

  private showMessage(msg: string): void {
    this.uiElements.message.textContent = msg;
    setTimeout(() => {
      if (this.uiElements.message.textContent === msg) {
        this.uiElements.message.textContent = '';
      }
    }, 3500);
  }

  restart(): void {
    this.players = [
      { name: 'Player 1', group: null },
      { name: 'Player 2', group: null },
    ];
    this.currentPlayer = 0;
    this.phase = 'AIMING';
    this.isCharging = false;
    this.power = 0;
    this.uiElements.overlay.classList.add('hidden');
    this.uiElements.message.textContent = '';
    this.setupBalls();
    this.updateUI();
  }

  private render(): void {
    // Sync ball visuals
    for (const b of this.balls) {
      b.syncPosition();
    }

    const cb = this.getCueBall();
    const showCue = cb && (this.phase === 'AIMING');

    // Update aim line and cue
    if (showCue && cb) {
      const dx = this.mouseX - cb.x;
      const dy = this.mouseY - cb.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) {
        const nx = dx / len;
        const ny = dy / len;
        this.table.updateAimLine(cb.x, cb.y, nx, ny, true);
      }
      this.cue.update(cb.x, cb.y, this.mouseX, this.mouseY, this.power, true);
    } else {
      this.table.updateAimLine(0, 0, 0, 0, false);
      this.cue.update(0, 0, 0, 0, 0, false);
    }

    // Ball-in-hand cursor hint
    if (this.phase === 'BALL_IN_HAND' && cb) {
      this.cue.update(0, 0, 0, 0, 0, false);
    }
  }

  private groupIcon(group: 'solids' | 'stripes' | null): string {
    if (!group) return '?';
    return group === 'solids' ? '● Solids (1-7)' : '◑ Stripes (9-15)';
  }

  private updateUI(): void {
    const p = this.players[this.currentPlayer];
    this.uiElements.player.textContent =
      this.phase === 'GAME_OVER' ? '' : `${p.name}'s Turn`;

    this.uiElements.p1Group.textContent = this.groupIcon(this.players[0].group);
    this.uiElements.p2Group.textContent = this.groupIcon(this.players[1].group);

    const left0 = this.players[0].group ? this.getBallsLeft(this.players[0].group).length : 7;
    const left1 = this.players[1].group ? this.getBallsLeft(this.players[1].group).length : 7;
    this.uiElements.p1Balls.textContent = `${left0} left`;
    this.uiElements.p2Balls.textContent = `${left1} left`;

    const phaseLabels: Record<GamePhase, string> = {
      BALL_IN_HAND: '📍 Place cue ball — click to confirm',
      AIMING: '🎯 Hold mouse button to charge, release to shoot',
      SHOOTING: '💨 Balls in motion...',
      GAME_OVER: '🏆 Game Over',
    };
    this.uiElements.phase.textContent = phaseLabels[this.phase];
  }
}
