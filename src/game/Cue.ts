import * as PIXI from 'pixi.js';
import { BALL_RADIUS } from './constants';

const CUE_LENGTH = 200;
const CUE_TIP_WIDTH = 4;
const CUE_BUTT_WIDTH = 12;

export class Cue {
  container: PIXI.Container;
  private cueGraphics: PIXI.Graphics;
  private powerBar: PIXI.Graphics;
  private powerBarBg: PIXI.Graphics;

  /** Current pull-back distance (0–1) */
  power: number = 0;

  constructor() {
    this.container = new PIXI.Container();

    this.cueGraphics = new PIXI.Graphics();
    this.container.addChild(this.cueGraphics);

    this.powerBarBg = new PIXI.Graphics();
    this.container.addChild(this.powerBarBg);

    this.powerBar = new PIXI.Graphics();
    this.container.addChild(this.powerBar);
  }

  update(
    cueBallX: number,
    cueBallY: number,
    mouseX: number,
    mouseY: number,
    power: number,
    visible: boolean,
  ): void {
    this.cueGraphics.clear();
    this.powerBar.clear();
    this.powerBarBg.clear();

    if (!visible) return;

    // Shot direction: from cue ball toward mouse (where the ball will travel)
    const dx = mouseX - cueBallX;
    const dy = mouseY - cueBallY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const sx = dx / len; // shot direction (toward mouse)
    const sy = dy / len;

    // Cue lies BEHIND the ball — opposite to shot direction
    const cx = -sx;
    const cy = -sy;

    // Pull-back: cue shifts further from ball when charging
    const pullBack = power * 30; // max 30px pullback
    const tipX = cueBallX + cx * (BALL_RADIUS + 2 + pullBack);
    const tipY = cueBallY + cy * (BALL_RADIUS + 2 + pullBack);
    const buttX = tipX + cx * CUE_LENGTH;
    const buttY = tipY + cy * CUE_LENGTH;

    const angle = Math.atan2(cy, cx);

    // Draw cue as a tapered stick using a rotated polygon
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perp = { x: -sin, y: cos };

    const halfTip = CUE_TIP_WIDTH / 2;
    const halfButt = CUE_BUTT_WIDTH / 2;

    // Cue body (maple gradient simulation: lighter in middle)
    this.cueGraphics.beginFill(0xD4A853);
    this.cueGraphics.drawPolygon([
      tipX - perp.x * halfTip,  tipY - perp.y * halfTip,
      tipX + perp.x * halfTip,  tipY + perp.y * halfTip,
      buttX + perp.x * halfButt, buttY + perp.y * halfButt,
      buttX - perp.x * halfButt, buttY - perp.y * halfButt,
    ]);
    this.cueGraphics.endFill();

    // Cue lighter grain lines
    this.cueGraphics.lineStyle(0.5, 0xE8C06A, 0.4);
    this.cueGraphics.moveTo(tipX + perp.x * halfTip * 0.3, tipY + perp.y * halfTip * 0.3);
    this.cueGraphics.lineTo(buttX + perp.x * halfButt * 0.3, buttY + perp.y * halfButt * 0.3);

    // Cue tip (light blue/gray)
    this.cueGraphics.lineStyle(0);
    this.cueGraphics.beginFill(0x7BAFD4);
    this.cueGraphics.drawPolygon([
      tipX - perp.x * halfTip, tipY - perp.y * halfTip,
      tipX + perp.x * halfTip, tipY + perp.y * halfTip,
      tipX + perp.x * halfTip + cos * 6, tipY + perp.y * halfTip + sin * 6,
      tipX - perp.x * halfTip + cos * 6, tipY - perp.y * halfTip + sin * 6,
    ]);
    this.cueGraphics.endFill();

    // Cue wrap (dark band near butt)
    this.cueGraphics.beginFill(0x2D2D2D);
    const wrapPos = 0.7; // 70% of the way from tip to butt
    const wx1 = tipX + cos * CUE_LENGTH * wrapPos - perp.x * halfButt * 0.9;
    const wy1 = tipY + sin * CUE_LENGTH * wrapPos - perp.y * halfButt * 0.9;
    const wx2 = tipX + cos * CUE_LENGTH * wrapPos + perp.x * halfButt * 0.9;
    const wy2 = tipY + sin * CUE_LENGTH * wrapPos + perp.y * halfButt * 0.9;
    const wx3 = wx2 + cos * 18;
    const wy3 = wy2 + sin * 18;
    const wx4 = wx1 + cos * 18;
    const wy4 = wy1 + sin * 18;
    this.cueGraphics.drawPolygon([wx1, wy1, wx2, wy2, wx3, wy3, wx4, wy4]);
    this.cueGraphics.endFill();

    // Power bar (drawn near cue butt end, screen-space)
    if (power > 0) {
      const barX = buttX + cos * 10;
      const barY = buttY + sin * 10;
      const barW = 60;
      const barH = 8;

      this.powerBarBg.lineStyle(1, 0x888888);
      this.powerBarBg.beginFill(0x333333, 0.8);
      this.powerBarBg.drawRoundedRect(barX - barW / 2, barY - barH / 2, barW, barH, 3);
      this.powerBarBg.endFill();

      const r = Math.round(255 * power);
      const g2 = Math.round(255 * (1 - power));
      const fillColor = (r << 16) | (g2 << 8);
      this.powerBar.beginFill(fillColor, 0.95);
      this.powerBar.drawRoundedRect(barX - barW / 2 + 1, barY - barH / 2 + 1, (barW - 2) * power, barH - 2, 2);
      this.powerBar.endFill();
    }
  }
}
