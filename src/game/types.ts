export type BallGroup = 'solids' | 'stripes';

export type GamePhase =
  | 'BALL_IN_HAND'  // place cue ball
  | 'AIMING'        // player aiming, balls stopped
  | 'SHOOTING'      // balls in motion
  | 'GAME_OVER';    // game ended

export interface ShotResult {
  pocketedBalls: number[];   // ball numbers pocketed this shot
  cueBallPocketed: boolean;
  firstBallHit: number | null; // first ball the cue ball struck
  cushionHit: boolean;          // did any ball hit a cushion?
}

export interface PlayerState {
  group: BallGroup | null;
  name: string;
}
