# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:3000 (Vite HMR)
npm run build    # tsc type-check then Vite production build → dist/
npm run preview  # Serve the dist/ build locally
npx tsc --noEmit # Type-check only (no emit — tsconfig has noEmit:true)
```

There are no tests. `npm run build` is the canonical correctness check.

## Architecture

**Stack:** PixiJS v7 (WebGL rendering) · TypeScript (strict) · Tailwind CSS · Vite

**Rendering boundary:** PixiJS owns the `<canvas>` (game visuals); Tailwind/HTML owns everything outside it (scoreboard, phase label, game-over overlay). The `Game` class bridges both — it holds the PIXI app *and* receives references to DOM elements for UI updates.

### Class responsibilities

| Class | File | Role |
|-------|------|------|
| `Game` | `game/Game.ts` | State machine, input events, game rules, PIXI app setup |
| `Ball` | `game/Ball.ts` | Physics state (x, y, vx, vy, active) + PIXI rendering |
| `Table` | `game/Table.ts` | Static table background + live aim-line overlay |
| `Cue` | `game/Cue.ts` | Cue stick visual + power bar, no state of its own |
| `Physics` | `game/Physics.ts` | Pure static utility — no PIXI, no game state |

### Game loop (PIXI ticker, ~60 fps)

```
ticker → Game.update()
  SHOOTING  → Physics.step(balls)   returns { pocketed, firstHit, cushionHit }
              accumulate into shotResult
              Physics.allStopped() → resolveShotResult() → next phase
  AIMING    → increment power while isCharging
  any phase → render()
                Ball.syncPosition()        push physics coords → PIXI containers
                Table.updateAimLine(...)   redraw dashed line
                Cue.update(...)            redraw stick + power bar
```

### Game phases (`GamePhase`)

`BALL_IN_HAND` → `AIMING` → `SHOOTING` → back to `AIMING` or `BALL_IN_HAND`
(or `GAME_OVER` when the 8-ball is legally/illegally pocketed)

### Cue control convention

Mouse position = where the cue **points** (where the ball will travel). The cue stick is drawn on the opposite side of the cue ball from the mouse. `shoot()` fires the cue ball *toward* the mouse.

### Physics

All constants live in `constants.ts`. Key values: `FRICTION=0.9875`, wall restitution `0.85`, ball-ball restitution `0.97`, `BALL_RADIUS=11`, `POCKET_RADIUS=20`. Collision resolution is O(n²) impulse-based (fine for 16 balls). No spin/English modelled.

### Adding a new game rule or phase

1. Extend the `GamePhase` union in `types.ts`.
2. Handle the new phase in `Game.update()` and `Game.updateUI()`.
3. Transition into it from `resolveShotResult()` or an input handler.
