import * as PIXI from 'pixi.js';
import { BALL_RADIUS, BALL_COLORS } from './constants';

export class Ball {
  container: PIXI.Container;
  private graphics: PIXI.Graphics;
  private numberText?: PIXI.Text;
  private maskGraphics?: PIXI.Graphics;

  ballNumber: number; // 0 = cue, 1–7 = solids, 8 = 8-ball, 9–15 = stripes
  color: number;
  isStripe: boolean;

  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  active: boolean = true;

  constructor(ballNumber: number, x: number, y: number) {
    this.ballNumber = ballNumber;
    this.x = x;
    this.y = y;
    this.isStripe = ballNumber >= 9 && ballNumber <= 15;
    this.color = BALL_COLORS[ballNumber] ?? 0xCCCCCC;

    this.container = new PIXI.Container();
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);

    if (ballNumber > 0 && ballNumber <= 15) {
      this.numberText = new PIXI.Text(String(ballNumber), {
        fontFamily: 'Arial, sans-serif',
        fontSize: ballNumber >= 10 ? 8 : 9,
        fontWeight: 'bold',
        fill: ballNumber === 8 ? 0xFFFFFF : (this.isStripe ? 0x111111 : 0xFFFFFF),
      });
      this.numberText.anchor.set(0.5);
      this.container.addChild(this.numberText);
    }

    this.draw();
  }

  draw(): void {
    this.graphics.clear();

    if (this.isStripe) {
      // White base circle
      this.graphics.beginFill(0xFFFFFF);
      this.graphics.drawCircle(0, 0, BALL_RADIUS);
      this.graphics.endFill();

      // Colored stripe band across middle (clipped by mask)
      const stripe = new PIXI.Graphics();
      stripe.beginFill(this.color);
      stripe.drawRect(-BALL_RADIUS, -BALL_RADIUS * 0.55, BALL_RADIUS * 2, BALL_RADIUS * 1.1);
      stripe.endFill();

      // Circular mask for the stripe
      if (this.maskGraphics) {
        this.maskGraphics.destroy();
      }
      this.maskGraphics = new PIXI.Graphics();
      this.maskGraphics.beginFill(0xFFFFFF);
      this.maskGraphics.drawCircle(0, 0, BALL_RADIUS);
      this.maskGraphics.endFill();
      stripe.mask = this.maskGraphics;

      this.container.addChild(this.maskGraphics);
      this.container.addChild(stripe);
    } else {
      // Solid ball
      this.graphics.beginFill(this.color);
      this.graphics.drawCircle(0, 0, BALL_RADIUS);
      this.graphics.endFill();
    }

    // Subtle border
    this.graphics.lineStyle(0.8, 0x000000, 0.25);
    this.graphics.drawCircle(0, 0, BALL_RADIUS);

    // Highlight (specular)
    this.graphics.lineStyle(0);
    this.graphics.beginFill(0xFFFFFF, 0.35);
    this.graphics.drawEllipse(-3.5, -3.5, 4, 3);
    this.graphics.endFill();
  }

  syncPosition(): void {
    this.container.x = this.x;
    this.container.y = this.y;
    this.container.visible = this.active;
    if (this.numberText) {
      this.numberText.x = 0;
      this.numberText.y = 0;
    }
  }
}
