import { Ball } from './Ball';
import {
  PLAY_LEFT, PLAY_RIGHT, PLAY_TOP, PLAY_BOTTOM,
  BALL_RADIUS, FRICTION, MIN_SPEED, POCKET_POSITIONS, POCKET_RADIUS,
} from './constants';

export class Physics {
  /** Run one physics frame. Returns array of pocketed ball numbers. */
  static step(balls: Ball[]): {
    pocketed: number[];
    firstHit: number | null;
    cushionHit: boolean;
  } {
    const active = balls.filter((b) => b.active);
    let firstHit: number | null = null;
    let cushionHit = false;
    const pocketed: number[] = [];

    // Move all balls
    for (const b of active) {
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= FRICTION;
      b.vy *= FRICTION;

      // Stop very slow balls
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed < MIN_SPEED) {
        b.vx = 0;
        b.vy = 0;
      }
    }

    // Wall collisions
    for (const b of active) {
      if (b.x - BALL_RADIUS < PLAY_LEFT) {
        b.x = PLAY_LEFT + BALL_RADIUS;
        b.vx = Math.abs(b.vx) * 0.85;
        cushionHit = true;
      } else if (b.x + BALL_RADIUS > PLAY_RIGHT) {
        b.x = PLAY_RIGHT - BALL_RADIUS;
        b.vx = -Math.abs(b.vx) * 0.85;
        cushionHit = true;
      }
      if (b.y - BALL_RADIUS < PLAY_TOP) {
        b.y = PLAY_TOP + BALL_RADIUS;
        b.vy = Math.abs(b.vy) * 0.85;
        cushionHit = true;
      } else if (b.y + BALL_RADIUS > PLAY_BOTTOM) {
        b.y = PLAY_BOTTOM - BALL_RADIUS;
        b.vy = -Math.abs(b.vy) * 0.85;
        cushionHit = true;
      }
    }

    // Ball-ball collisions (O(n²), sufficient for 16 balls)
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = BALL_RADIUS * 2;

        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          // Separate overlapping balls
          const overlap = minDist - dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          // Elastic collision for equal-mass balls:
          // exchange velocity components along collision normal
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dot = dvx * nx + dvy * ny;

          if (dot > 0) {
            const impulse = dot * 0.97; // slight energy loss
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
            b.vx += impulse * nx;
            b.vy += impulse * ny;

            // Track first ball hit by cue ball
            if (firstHit === null) {
              if (a.ballNumber === 0) firstHit = b.ballNumber;
              else if (b.ballNumber === 0) firstHit = a.ballNumber;
            }
          }
        }
      }
    }

    // Pocket detection
    for (const b of active) {
      for (const pocket of POCKET_POSITIONS) {
        const dx = b.x - pocket.x;
        const dy = b.y - pocket.y;
        if (dx * dx + dy * dy < POCKET_RADIUS * POCKET_RADIUS) {
          b.active = false;
          b.vx = 0;
          b.vy = 0;
          pocketed.push(b.ballNumber);
          break;
        }
      }
    }

    return { pocketed, firstHit, cushionHit };
  }

  static allStopped(balls: Ball[]): boolean {
    return balls.every((b) => !b.active || (b.vx === 0 && b.vy === 0));
  }
}
