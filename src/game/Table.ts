import * as PIXI from 'pixi.js';
import {
  TABLE_OUTER_LEFT, TABLE_OUTER_TOP, TABLE_OUTER_RIGHT, TABLE_OUTER_BOTTOM,
  PLAY_LEFT, PLAY_TOP, PLAY_RIGHT, PLAY_BOTTOM,
  POCKET_POSITIONS, POCKET_RADIUS,
} from './constants';

export class Table {
  container: PIXI.Container;
  aimLine: PIXI.Graphics;
  ghostBall: PIXI.Graphics;

  constructor() {
    this.container = new PIXI.Container();

    const g = new PIXI.Graphics();
    this.drawTable(g);
    this.container.addChild(g);

    // Aim line (updated each frame when aiming)
    this.aimLine = new PIXI.Graphics();
    this.container.addChild(this.aimLine);

    // Ghost ball (predicted cue ball position)
    this.ghostBall = new PIXI.Graphics();
    this.container.addChild(this.ghostBall);
  }

  private drawTable(g: PIXI.Graphics): void {
    const OL = TABLE_OUTER_LEFT;
    const OT = TABLE_OUTER_TOP;
    const OR = TABLE_OUTER_RIGHT;
    const OB = TABLE_OUTER_BOTTOM;

    // Outer wood frame (dark walnut)
    g.beginFill(0x5C3A1E);
    g.drawRoundedRect(OL, OT, OR - OL, OB - OT, 8);
    g.endFill();

    // Wood grain lines
    g.lineStyle(1, 0x7A4F2E, 0.3);
    for (let i = 0; i < 6; i++) {
      const y = OT + 10 + i * ((OB - OT - 20) / 6);
      g.moveTo(OL + 5, y);
      g.lineTo(OR - 5, y);
    }

    // Rail cushion (dark green border)
    g.lineStyle(0);
    g.beginFill(0x1B5E20);
    g.drawRect(PLAY_LEFT - 12, PLAY_TOP - 12, PLAY_RIGHT - PLAY_LEFT + 24, PLAY_BOTTOM - PLAY_TOP + 24);
    g.endFill();

    // Felt (green)
    g.beginFill(0x2E7D32);
    g.drawRect(PLAY_LEFT, PLAY_TOP, PLAY_RIGHT - PLAY_LEFT, PLAY_BOTTOM - PLAY_TOP);
    g.endFill();

    // Felt texture (subtle lines)
    g.lineStyle(1, 0x3A8A3F, 0.08);
    for (let x = PLAY_LEFT; x < PLAY_RIGHT; x += 20) {
      g.moveTo(x, PLAY_TOP);
      g.lineTo(x, PLAY_BOTTOM);
    }

    // Head string (dotted line at 1/4 table width from left)
    const headX = PLAY_LEFT + (PLAY_RIGHT - PLAY_LEFT) * 0.25;
    g.lineStyle(1, 0x4CAF50, 0.3);
    for (let y = PLAY_TOP; y < PLAY_BOTTOM; y += 8) {
      g.moveTo(headX, y);
      g.lineTo(headX, y + 4);
    }

    // Head spot (where cue ball breaks from)
    g.lineStyle(0);
    g.beginFill(0x4CAF50, 0.5);
    g.drawCircle(headX, (PLAY_TOP + PLAY_BOTTOM) / 2, 3);
    g.endFill();

    // Foot spot (where rack apex goes)
    g.beginFill(0x4CAF50, 0.5);
    g.drawCircle(PLAY_LEFT + (PLAY_RIGHT - PLAY_LEFT) * 0.75, (PLAY_TOP + PLAY_BOTTOM) / 2, 3);
    g.endFill();

    // Pocket holes (black circles over the felt)
    for (const pocket of POCKET_POSITIONS) {
      // Pocket shadow
      g.beginFill(0x000000, 0.4);
      g.drawCircle(pocket.x, pocket.y, POCKET_RADIUS + 3);
      g.endFill();

      // Pocket hole
      g.beginFill(0x0A0A0A);
      g.drawCircle(pocket.x, pocket.y, POCKET_RADIUS);
      g.endFill();

      // Pocket rim highlight
      g.lineStyle(1.5, 0x8B6914, 0.7);
      g.drawCircle(pocket.x, pocket.y, POCKET_RADIUS + 1);
    }
  }

  updateAimLine(
    cueBallX: number,
    cueBallY: number,
    dirX: number,
    dirY: number,
    visible: boolean,
  ): void {
    this.aimLine.clear();
    this.ghostBall.clear();
    if (!visible) return;

    // Aim line from cue ball in shot direction
    const lineLen = 300;
    const endX = cueBallX + dirX * lineLen;
    const endY = cueBallY + dirY * lineLen;

    // Dashed line
    const dashLen = 8;
    const gapLen = 5;
    const totalLen = Math.sqrt(
      (endX - cueBallX) ** 2 + (endY - cueBallY) ** 2,
    );
    let drawn = 0;
    this.aimLine.lineStyle(1.5, 0xFFFFFF, 0.55);
    while (drawn < totalLen) {
      const t0 = drawn / totalLen;
      const t1 = Math.min((drawn + dashLen) / totalLen, 1);
      this.aimLine.moveTo(
        cueBallX + (endX - cueBallX) * t0,
        cueBallY + (endY - cueBallY) * t0,
      );
      this.aimLine.lineTo(
        cueBallX + (endX - cueBallX) * t1,
        cueBallY + (endY - cueBallY) * t1,
      );
      drawn += dashLen + gapLen;
    }
  }
}
