// Pure, deterministic game rules. Positions refer to the rabbit's feet.
export const WIDTH = 1280;
export const HEIGHT = 720;
export const GROUND = 560;

export const SCENES = Object.freeze([
  { id: 'madriguera', mapLabel: 'La madriguera', title: 'Un conejito bajo las estrellas', description: 'Dos orejas blancas asoman entre la hierba de la noche.', task: 'Pulsa espacio o → para salir de la madriguera y comenzar el viaje.', helper: null, kind: 'burrow', skyTop: '#163e43', skyBottom: '#315455', groundColor: '#58633c' },
  { id: 'piedra', mapLabel: 'La piedra', title: 'Una piedra en el camino', description: 'El conejito quiere llegar al huerto de su amigo.', task: 'Salta la piedra y sigue el camino.', helper: null, kind: 'rock', skyTop: '#a9d4d6', skyBottom: '#ce9db1', groundColor: '#767347' },
  { id: 'tortuga', mapLabel: 'La tortuga', title: '¿Me ayudas, tortuga?', description: 'Una roca muy alta. Una amiga con un gran caparazón.', task: 'Pide ayuda y salta desde el caparazón.', helper: 'tortuga', kind: 'lift-rock', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#767347' },
  { id: 'zorro', mapLabel: 'El zorro', title: 'El pasadizo del zorro', description: 'El zorro conoce un paso bajo la roca.', task: 'Pide ayuda y mantén ↓ mientras cruzas el túnel.', helper: 'zorro', kind: 'tunnel', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#767347' },
  { id: 'elefante', mapLabel: 'El elefante', title: '¿Una piedra o un elefante?', description: 'Esa gran silueta es un elefante de espaldas.', task: 'Llámalo con espacio y vuelve a pulsar para pedir ayuda.', helper: 'elefante', kind: 'lift-rock', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#767347' },
  { id: 'charco', mapLabel: 'El charco', title: '¡Un salto al otro lado!', description: 'Un pequeño charco corta el camino.', task: 'Acércate y salta el charco.', helper: null, kind: 'gap', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#7c794e' },
  { id: 'jirafa', mapLabel: 'La jirafa', title: 'El puente de la jirafa', description: 'La jirafa te ve desde la otra orilla del río.', task: 'Llámala y cruza sobre su cuello.', helper: 'jirafa', kind: 'bridge', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#7c794e' },
  { id: 'cocodrilo', mapLabel: 'El cocodrilo', title: 'Un amigo dormilón', description: 'El cocodrilo duerme junto al río.', task: 'Despiértalo con espacio y cruza con calma.', helper: 'cocodrilo', kind: 'bridge', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#7c794e' },
  { id: 'juncos', mapLabel: 'Los juncos', title: 'Entre los juncos', description: 'Un mar de juncos oculta el camino.', task: 'Sigue con → entre los juncos; con ← puedes volver.', helper: null, kind: 'reeds', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#85804e' },
  { id: 'pared', mapLabel: 'La pared', title: 'Una montaña altísima', description: 'La pared de la montaña se pierde en el cielo.', task: 'Acércate a la pared y pulsa espacio para mirar arriba.', helper: null, kind: 'mountain', skyTop: '#a9d4d6', skyBottom: '#d5c79d', groundColor: '#888052' },
  { id: 'serpiente', mapLabel: 'La serpiente', title: 'La escalera de la serpiente', description: 'Una serpiente espera enrollada en un árbol a media montaña.', task: 'Pide ayuda a la serpiente y sube hasta la cima.', helper: 'serpiente', kind: 'wall', skyTop: '#a9d4d6', skyBottom: '#d5c79d', groundColor: '#888052' },
  { id: 'zanahoria', mapLabel: 'Una zanahoria', title: 'Una zanahoria en la cima', description: 'Una sola zanahoria asoma en la tierra de la meseta.', task: 'Acércate a la zanahoria y descubre quién viene a buscarla.', helper: null, kind: 'plateau', skyTop: '#e2c15f', skyBottom: '#eed17a', groundColor: '#74705f' },
  { id: 'conejo', mapLabel: 'El conejo marrón', title: '¡Hola, amigo!', description: 'Tu amigo ha recogido la zanahoria y te espera.', task: 'Caminad juntos hacia la derecha hasta llegar al huerto.', helper: 'conejo', kind: 'friend', skyTop: '#e2c15f', skyBottom: '#eed17a', groundColor: '#74705f' },
]);

// Shared with the illustration: left edges, widths, and absolute top surfaces.
// An assisted animal's support follows assistY, then remains at liftY. Its
// illustrated shell/trunk/head supports the rabbit throughout the lift range.
export const SCENE_GEOMETRY = Object.freeze([
  {},
  { rock: { x: 610, width: 110, top: 470 } },
  { helperX: 500, rock: { x: 670, width: 130, top: 350 }, liftY: 455, liftLeft: 430, liftRight: 670 },
  { helperX: 470, tunnel: { x: 500, width: 440, depth: 100, clearance: 52, top: 305 }, rock: { x: 620, width: 200, top: 305 } },
  { helperX: 490, rock: { x: 710, width: 155, top: 318 }, liftY: 318, liftLeft: 420, liftRight: 710 },
  { gap: { left: 550, right: 700 } },
  { helperX: 470, gap: { left: 550, right: 860 } },
  { helperX: 470, gap: { left: 530, right: 900 } },
  { width: 2560, reeds: { left: 380, right: 2160 } },
  { wall: { x: 850, width: 430, top: -1200 }, lookFromX: 720 },
  { helperX: 740, wall: { x: 850, width: 430, top: -600 }, liftY: -600, liftLeft: 640, liftRight: 850, tree: { x: 860, y: -190 } },
  { carrotX: 900, approachX: 650, friendStartX: 1340, friendWaitX: 1080 },
  {},
]);

export const SCENE_IDS = Object.freeze(Object.fromEntries(SCENES.map((scene, index) => [scene.id, index])));
export const RADIUS = 24;
export const HEIGHT_STANDING = 66;
export const HEIGHT_DUCKING = 36;
export const SPEED = 270;
const GRAVITY = 1400;
const JUMP_SPEED = 610;
const EPSILON = 0.001;
export const EMERGE_DURATION = 0.7;
export const MOUNTAIN_REVEAL_DURATION = 1.6;
export const CARROT_PLUCK_DURATION = 0.38;
export const ELEPHANT_REVEAL_DURATION = 0.65;
export const SNAKE_HELP_DURATION = 3;
export const SNAKE_LOWERING_PROGRESS = 0.32;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const eased = progress => progress * progress * (3 - 2 * progress);

export const sceneId = state => SCENES[state.scene].id;
export const currentGeometry = state => SCENE_GEOMETRY[state.scene];
export const sceneWidth = state => currentGeometry(state).width ?? WIDTH;

export function tunnelFloorAt(x, tunnel) {
  const progress = clamp((x - tunnel.x) / tunnel.width, 0, 1);
  return GROUND + tunnel.depth * Math.sin(Math.PI * progress);
}

export function createGame() {
  return {
    mode: 'title', scene: 0, x: 120, y: GROUND, vx: 0, vy: 0,
    facing: 1, grounded: true, ducking: false, helped: false,
    completed: [], time: 0, sceneTime: 0, celebration: 0,
    transition: 0, message: 'Un pequeño viaje. Muchos amigos.', helpProgress: 0,
    // Public animation state: lifting, assistY and walkTime. Remaining fields
    // record actual traversals, local recovery and short accessible messages.
    lifting: false, assistY: GROUND, walkTime: 0, solved: false,
    crossedTop: false, tunnelEntered: false, jumpOriginX: null,
    jumped: false, resetCount: 0, toast: '', toastTimer: 0,
    elephantRevealed: false, revealProgress: 0, hiddenInReeds: false,
    cameraX: 0, cameraY: 0, cameraZoom: 1, revealCameraProgress: 0,
    emerging: false, emergeProgress: 0, snakePhase: 'coiled', friendGreeted: false,
    carrotPhase: 'planted', carrotPhaseTime: 0, carrotTaken: false,
    friendX: 1340, friendFacing: -1, friendOffset: 90,
  };
}

export function startGame(state) {
  Object.assign(state, createGame(), { mode: 'playing', x: 170 });
  state.message = getHint(state);
  return state;
}

export function restartGame(state) {
  return startGame(state);
}

function say(state, message, seconds = 1.4) {
  state.toast = message;
  state.toastTimer = seconds;
  state.message = message;
}

function enterNextScene(state, continuity = {}) {
  const completed = [...state.completed, SCENES[state.scene].id];
  const next = state.scene + 1;
  const { time, resetCount } = state;
  Object.assign(state, createGame(), {
    mode: 'playing', scene: next, x: 100, completed, time,
    resetCount, transition: 0.65, ...continuity,
  });
  state.message = getHint(state);
}

function bodyHeight(state) {
  return state.ducking ? HEIGHT_DUCKING : HEIGHT_STANDING;
}

function overlaps(x, rectangle) {
  return x + RADIUS > rectangle.x + EPSILON
    && x - RADIUS < rectangle.x + rectangle.width - EPSILON;
}

function obstacles(state, geometry) {
  const result = [];
  if (geometry.rock) result.push({ ...geometry.rock, bottom: GROUND });
  if (geometry.wall) result.push({ ...geometry.wall, bottom: GROUND + HEIGHT });
  return result;
}

function bridgeReady(state) {
  return SCENES[state.scene].kind === 'bridge' && state.helped;
}

function onGroundAt(state, geometry, x) {
  if (!geometry.gap || bridgeReady(state)) return true;
  // Feet retain a little support at the river bank, without an invisible ledge.
  return x - 12 <= geometry.gap.left || x + 12 >= geometry.gap.right;
}

function help(state, geometry) {
  if (geometry.helperX === undefined || !SCENES[state.scene].helper) return false;
  if (Math.abs(state.x - geometry.helperX) > 105 || !state.grounded) return false;
  const id = sceneId(state);
  if (id === 'elefante') {
    if (!state.elephantRevealed) {
      state.elephantRevealed = true;
      state.revealProgress = 0;
      say(state, '¡Es un elefante! Espera a que se dé la vuelta.', 0.8);
      return true;
    }
    // Each press is consumed during the turn, so it cannot also start a jump
    // or accidentally combine the reveal and the lift into one action.
    if (state.revealProgress < 1) return true;
  }
  const canRelift = geometry.liftY !== undefined && state.y > GROUND - 10;
  if (state.helped && !canRelift) return false;
  state.helped = true;
  state.helpProgress = 0;
  state.celebration = 0.7;
  state.lifting = geometry.liftY !== undefined && id !== 'serpiente';
  if (id === 'serpiente') state.snakePhase = 'lowering';
  state.assistY = GROUND;
  state.vy = 0;
  const messages = {
    tortuga: '¡Gracias, tortuga! Su caparazón te acerca a la roca.',
    zorro: '¡Gracias, zorro! Ahora puedes pasar bajo la roca.',
    elefante: '¡Gracias, elefante! Su trompa te lleva hacia arriba.',
    jirafa: '¡Gracias, jirafa! Ya puedes cruzar el río.',
    cocodrilo: '¡Buenos días, cocodrilo! Ya puedes cruzar.',
    serpiente: '¡Gracias, serpiente! Baja su cabeza para ayudarte a subir.',
  };
  say(state, messages[id] ?? '¡Gracias por ayudarme!', 2);
  return true;
}

function recover(state, geometry) {
  state.x = geometry.gap ? geometry.gap.left - 105 : 100;
  state.y = GROUND;
  state.vx = 0;
  state.vy = 0;
  state.grounded = true;
  state.ducking = false;
  state.lifting = false;
  state.jumpOriginX = null;
  state.jumped = false;
  state.resetCount += 1;
  say(state, 'Volvemos a la orilla. ¡Puedes intentarlo otra vez!', 2);
}

function markSolved(state) {
  if (state.solved) return;
  state.solved = true;
  state.celebration = 1.2;
  say(state, '¡Muy bien! Sigue el camino hacia la derecha.', 1.6);
}

function checkChallenge(state, geometry, input) {
  const id = sceneId(state);
  const rock = geometry.rock ?? geometry.wall;
  if (rock && overlaps(state.x, rock) && state.y <= rock.top + 1) {
    state.crossedTop = true;
  }
  if (geometry.rock && !geometry.tunnel && state.crossedTop && state.x > rock.x + rock.width + RADIUS
    && (id === 'piedra' || state.helped)) markSolved(state);
  if (id === 'serpiente' && state.helped && state.crossedTop && state.y <= rock.top + 1
    && state.x > rock.x + 72) markSolved(state);
  if (geometry.tunnel) {
    const tunnel = geometry.tunnel;
    if (state.x > tunnel.x + RADIUS && state.x < tunnel.x + tunnel.width - RADIUS
      && state.ducking && input.down && state.helped) {
      state.tunnelEntered = true;
    }
    if (state.tunnelEntered && state.x > tunnel.x + tunnel.width + RADIUS) markSolved(state);
  }
  if (geometry.gap && state.grounded) {
    // A bank supports the feet over its last 12 pixels. Recognize the actual
    // landing immediately, before a new jump can replace the jump's origin.
    if (id === 'charco' && state.jumped && state.jumpOriginX <= geometry.gap.left + 12
      && state.x + 12 >= geometry.gap.right) markSolved(state);
    if (state.x > geometry.gap.right + RADIUS && bridgeReady(state)
      && state.helpProgress >= 1) markSolved(state);
  }
  if (geometry.reeds && state.x > geometry.reeds.right + RADIUS) markSolved(state);
}

function updateCarrotEncounter(state, geometry, dt) {
  if (state.carrotPhase === 'planted' && state.x >= geometry.approachX) {
    state.carrotPhase = 'approaching';
    state.carrotPhaseTime = 0;
    state.friendX = geometry.friendStartX;
    state.friendFacing = -1;
  }
  if (state.carrotPhase === 'planted') return;
  state.carrotPhaseTime += dt;
  if (state.carrotPhase === 'approaching') {
    state.friendX = Math.max(geometry.carrotX, state.friendX - 440 * dt);
    if (state.friendX === geometry.carrotX) {
      state.carrotPhase = 'plucking';
      state.carrotPhaseTime = 0;
    }
  } else if (state.carrotPhase === 'plucking' && state.carrotPhaseTime >= CARROT_PLUCK_DURATION) {
    // Ownership changes once: the same carrot leaves the ground and remains
    // with the brown rabbit throughout its retreat and the shared walk.
    state.carrotTaken = true;
    state.carrotPhase = 'retreating';
    state.carrotPhaseTime = 0;
    state.friendFacing = 1;
  } else if (state.carrotPhase === 'retreating') {
    state.friendX = Math.min(geometry.friendWaitX, state.friendX + 225 * dt);
    if (state.friendX === geometry.friendWaitX) {
      state.carrotPhase = 'waiting';
      state.carrotPhaseTime = 0;
      state.friendFacing = -1;
    }
  }
}

function revealMountain(state, dt) {
  state.revealCameraProgress = Math.min(1, state.revealCameraProgress + dt / MOUNTAIN_REVEAL_DURATION);
  const progress = eased(state.revealCameraProgress);
  state.cameraZoom = 1 - 0.5 * progress;
  state.cameraX = -1000 * progress;
  state.cameraY = -650 * progress;
}

function step(state, input, dt) {
  const geometry = SCENE_GEOMETRY[state.scene];
  const id = sceneId(state);
  const previousX = state.x;
  state.time += dt;
  state.sceneTime += dt;
  state.transition = Math.max(0, state.transition - dt);
  state.celebration = Math.max(0, state.celebration - dt);
  state.toastTimer = Math.max(0, state.toastTimer - dt);

  if (id === 'madriguera' && state.emergeProgress < 1) {
    if (input.action || input.right) state.emerging = true;
    if (state.emerging) state.emergeProgress = Math.min(1, state.emergeProgress + dt / EMERGE_DURATION);
    state.vx = 0;
    state.vy = 0;
    if (state.emergeProgress === 1) {
      state.emerging = false;
      state.solved = true;
    }
    state.message = getHint(state);
    return;
  }
  if (id === 'serpiente' && state.revealCameraProgress < 1) {
    revealMountain(state, dt);
    state.vx = 0;
    state.vy = 0;
    state.message = getHint(state);
    return;
  }
  if (id === 'zanahoria') updateCarrotEncounter(state, geometry, dt);

  if (state.elephantRevealed) {
    state.revealProgress = Math.min(1, state.revealProgress + dt / ELEPHANT_REVEAL_DURATION);
  }
  if (state.helped) {
    const duration = id === 'serpiente' ? SNAKE_HELP_DURATION : 1.05;
    state.helpProgress = Math.min(1, state.helpProgress + dt / duration);
  }
  if (geometry.liftY !== undefined && state.helped) {
    let progress = state.helpProgress;
    if (id === 'serpiente') {
      state.snakePhase = progress >= 1 ? 'resting'
        : progress >= SNAKE_LOWERING_PROGRESS ? 'lifting' : 'lowering';
      progress = clamp((progress - SNAKE_LOWERING_PROGRESS) / (1 - SNAKE_LOWERING_PROGRESS), 0, 1);
      // Lower the head before the loop begins raising the rabbit. A single
      // help action controls both phases, including at reduced motion.
      if (state.snakePhase === 'lifting') state.lifting = true;
    }
    const liftProgress = eased(progress);
    state.assistY = GROUND - (GROUND - geometry.liftY) * liftProgress;
    if (id === 'serpiente') state.cameraY = -650 - 170 * liftProgress;
  }

  const tunnel = geometry.tunnel;
  const insideTunnel = tunnel && state.helped && overlaps(state.x, tunnel);
  // Keep the head safe when down is released beneath the ceiling; movement
  // resumes only while down is held. Thus a single tap cannot bypass a tunnel.
  state.ducking = Boolean(input.down || insideTunnel);
  let direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  if (insideTunnel && !input.down) direction = 0;
  if (direction) state.facing = direction;
  const target = direction * SPEED;
  const acceleration = direction ? 1900 : 2400;
  const change = Math.min(Math.abs(target - state.vx), acceleration * dt);
  state.vx += Math.sign(target - state.vx) * change;
  if (insideTunnel && !input.down) state.vx = 0;

  if (input.action && id === 'pared' && state.grounded && state.x >= geometry.lookFromX) {
    markSolved(state);
    enterNextScene(state, { x: state.x, y: state.y, facing: state.facing, transition: 0 });
    return;
  }
  let usedAction = false;
  if (input.action && !usedAction) usedAction = help(state, geometry);
  if ((input.up || (input.action && !usedAction)) && state.grounded
    && !state.lifting && !insideTunnel && id !== 'madriguera'
    && !(id === 'serpiente' && state.helped && state.helpProgress < 1)) {
    state.vy = -JUMP_SPEED;
    state.grounded = false;
    state.jumped = true;
    state.jumpOriginX = state.x;
  }

  const rectangles = obstacles(state, geometry);
  let nextX = Math.max(40, state.x + state.vx * dt);
  // Both mouths belong to the same underground passage. They cannot be
  // entered upright, nor before asking the fox to open the way.
  if (tunnel && !(state.helped && input.down)) {
    if (state.vx > 0 && state.x + RADIUS <= tunnel.x + EPSILON && nextX + RADIUS > tunnel.x) {
      nextX = tunnel.x - RADIUS;
      state.vx = 0;
    } else if (state.vx < 0 && state.x - RADIUS >= tunnel.x + tunnel.width - EPSILON
      && nextX - RADIUS < tunnel.x + tunnel.width) {
      nextX = tunnel.x + tunnel.width + RADIUS;
      state.vx = 0;
    }
  }
  // Let the approaching friend pick the carrot before the white rabbit can
  // pass it. Backtracking remains free while this short action unfolds.
  if (id === 'zanahoria' && state.carrotPhase !== 'waiting') {
    const limit = geometry.carrotX - 75;
    if (nextX > limit) { nextX = limit; state.vx = 0; }
  }
  const height = bodyHeight(state);
  for (const rectangle of rectangles) {
    if (state.y <= rectangle.top + EPSILON || state.y - height >= rectangle.bottom - EPSILON) continue;
    if (state.vx > 0 && state.x + RADIUS <= rectangle.x + EPSILON
      && nextX + RADIUS > rectangle.x) {
      nextX = rectangle.x - RADIUS;
      state.vx = 0;
    } else if (state.vx < 0 && state.x - RADIUS >= rectangle.x + rectangle.width - EPSILON
      && nextX - RADIUS < rectangle.x + rectangle.width) {
      nextX = rectangle.x + rectangle.width + RADIUS;
      state.vx = 0;
    }
  }
  state.x = Math.min(nextX, state.solved ? sceneWidth(state) : sceneWidth(state) - 65);

  if (tunnel && state.helped && overlaps(state.x, tunnel)) {
    state.y = tunnelFloorAt(state.x, tunnel);
    state.vy = 0;
    state.grounded = true;
    state.ducking = true;
  } else if (state.lifting && state.x >= geometry.liftLeft - RADIUS
    && state.x <= geometry.liftRight + RADIUS) {
    state.y = state.assistY;
    state.vy = 0;
    state.grounded = true;
    if (state.helpProgress >= 1) state.lifting = false;
  } else {
    state.lifting = false;
    const previousY = state.y;
    state.vy += GRAVITY * dt;
    let nextY = previousY + state.vy * dt;
    state.grounded = false;
    if (state.vy < 0) {
      for (const rectangle of rectangles) {
        if (overlaps(state.x, rectangle) && previousY - height >= rectangle.bottom - EPSILON
          && nextY - height <= rectangle.bottom) {
          nextY = rectangle.bottom + height;
          state.vy = 0;
        }
      }
    } else {
      const surfaces = [];
      if (onGroundAt(state, geometry, state.x)) surfaces.push(GROUND);
      for (const rectangle of rectangles) {
        if (overlaps(state.x, rectangle)) surfaces.push(rectangle.top);
      }
      if (geometry.liftY !== undefined && state.helped && state.helpProgress >= 1
        && state.x >= geometry.liftLeft - RADIUS && state.x <= geometry.liftRight + RADIUS) {
        surfaces.push(geometry.liftY);
      }
      const landing = surfaces.filter(top => previousY <= top + EPSILON && nextY >= top)
        .sort((a, b) => a - b)[0];
      if (landing !== undefined) {
        nextY = landing;
        state.vy = 0;
        state.grounded = true;
      }
    }
    state.y = nextY;
  }

  state.walkTime += Math.abs(state.x - previousX) / SPEED;
  if (state.y > HEIGHT + 100) recover(state, geometry);
  checkChallenge(state, geometry, input);
  state.hiddenInReeds = Boolean(geometry.reeds
    && state.x - RADIUS >= geometry.reeds.left && state.x + RADIUS <= geometry.reeds.right);
  if (id !== 'serpiente') {
    state.cameraX = geometry.reeds ? clamp(state.x - 520, 0, sceneWidth(state) - WIDTH) : 0;
    state.cameraY = 0;
    state.cameraZoom = 1;
  }
  if (id === 'zanahoria' && state.carrotPhase === 'waiting' && state.x >= state.friendX - 90) {
    enterNextScene(state, {
      x: state.x, y: state.y, vx: state.vx, vy: state.vy, facing: state.facing,
      grounded: state.grounded, ducking: state.ducking, walkTime: state.walkTime,
      jumped: state.jumped, jumpOriginX: state.jumpOriginX,
      friendX: state.friendX, friendOffset: state.friendX - state.x, friendFacing: state.facing,
      carrotTaken: true, carrotPhase: 'together', friendGreeted: true, solved: true, transition: 0,
    });
    say(state, '¡Hola, amigo! Vamos juntos al huerto. Sigue con →.', 2);
    return;
  }
  if (id === 'conejo') {
    state.friendX = state.x + state.friendOffset;
    state.friendFacing = state.facing;
  }
  if (state.solved && state.x >= sceneWidth(state) - 45) {
    if (id === 'conejo' && state.friendGreeted) {
      state.mode = 'ending';
      state.vx = 0;
      state.vy = 0;
      state.completed = [...state.completed, id];
      state.celebration = 4;
      state.message = getHint(state);
      return;
    }
    if (state.scene < SCENES.length - 1) enterNextScene(state);
  }
  state.message = getHint(state);
}

export function updateGame(state, input = {}, dt = 0) {
  if (state.mode !== 'playing' || !Number.isFinite(dt) || dt <= 0) return state;
  // Cap suspended-tab deltas, then use short collision steps. Pulsed actions
  // are consumed only once even when an update contains multiple substeps.
  const duration = Math.min(dt, 1 / 30);
  const count = Math.ceil(duration / (1 / 120));
  const initialScene = state.scene;
  for (let i = 0; i < count && state.mode === 'playing'; i += 1) {
    step(state, i === 0 ? input : { ...input, action: false, up: false }, duration / count);
    if (state.scene !== initialScene) break;
  }
  return state;
}

export function getHint(state) {
  if (state.mode === 'title') return 'Flechas para moverte. Espacio para saltar y pedir ayuda.';
  if (state.mode === 'ending') return '¡Llegaste! Compartir el camino lo hace más bonito.';
  if (state.toastTimer > 0) return state.toast;
  if (state.friendGreeted) return 'Camina con tu amigo hacia el huerto con →.';
  if (state.solved) return '¡Prueba superada! Sigue hacia la derecha.';
  const geometry = SCENE_GEOMETRY[state.scene];
  const id = sceneId(state);
  if (id === 'madriguera') return state.emergeProgress < 1
    ? (state.emerging ? 'El conejito sale de su madriguera.' : 'Pulsa espacio o → para salir de la madriguera.')
    : '¡Comienza el viaje! Sigue hacia la derecha con →.';
  if (id === 'serpiente' && state.revealCameraProgress < 1) return 'Mira: la montaña es enorme. Una serpiente espera arriba.';
  if (state.lifting) return 'Tu amigo te está subiendo. Puedes avanzar con las flechas.';
  if (id === 'serpiente' && state.snakePhase === 'lowering') return 'La serpiente baja la cabeza. Espera junto a ella.';
  if (id === 'elefante' && state.elephantRevealed && state.revealProgress < 1) {
    return 'El elefante se está dando la vuelta.';
  }
  if (geometry.helperX !== undefined && !state.helped) {
    if (Math.abs(state.x - geometry.helperX) <= 105) {
      if (id === 'elefante' && !state.elephantRevealed) return 'Pulsa espacio para llamar a esa gran silueta.';
      return id === 'cocodrilo' ? 'Pulsa espacio para despertar al cocodrilo.'
        : `Pulsa espacio para pedir ayuda ${['tortuga', 'jirafa', 'serpiente'].includes(id) ? 'a la' : 'al'} ${SCENES[state.scene].helper}.`;
    }
    return 'Acércate a tu amigo con la flecha derecha.';
  }
  switch (id) {
    case 'piedra': return state.x < 430 ? 'Avanza con → hasta la piedra.' : 'Pulsa espacio o ↑ y avanza para saltar la piedra.';
    case 'tortuga': return state.y > 500 ? 'Vuelve junto a la tortuga y pulsa espacio para subir.' : 'Avanza por el caparazón y salta hacia la roca con espacio o ↑.';
    case 'zorro': return 'Mantén ↓ y avanza con → para pasar por el túnel; con ← puedes volver.';
    case 'elefante': return state.y > 500 ? 'Vuelve junto al elefante y pulsa espacio para subir.' : 'Avanza con → sobre la roca. ¡Gracias, elefante!';
    case 'charco': return state.x < 400 ? 'Acércate al charco con →.' : 'Desde la orilla, pulsa espacio o ↑ y avanza para saltar.';
    case 'jirafa': return 'Cruza el puente de la jirafa con →.';
    case 'cocodrilo': return 'Camina sobre el lomo del cocodrilo con →.';
    case 'juncos': return 'Sigue con → entre los juncos. Con ← puedes retroceder.';
    case 'pared': return state.x >= geometry.lookFromX ? 'Pulsa espacio para alejar la vista y descubrir la montaña.' : 'Acércate a la pared con →.';
    case 'serpiente': return state.y > 500 ? 'Vuelve junto a la serpiente y pulsa espacio para subir.' : 'Avanza con → hacia lo alto de la pared.';
    case 'zanahoria': return state.carrotPhase === 'planted' ? 'Una zanahoria en la cima. Acércate con →.'
      : state.carrotPhase === 'waiting' ? 'Tu amigo te espera. Acércate a él con →.'
        : '¡Ha venido un conejo marrón a recoger la zanahoria!';
    case 'conejo': return 'Camina con tu amigo hacia el huerto con →.';
    default: return 'Sigue el camino con →.';
  }
}
