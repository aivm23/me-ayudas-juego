// Pure, deterministic game rules. Positions refer to the rabbit's feet.
export const WIDTH = 1280;
export const HEIGHT = 720;
export const GROUND = 560;

export const SCENES = Object.freeze([
  { id: 'piedra', title: 'Una piedra en el camino', description: 'El conejito quiere llegar al huerto de su amigo.', task: 'Salta la piedra y sigue el camino.', helper: null, kind: 'rock', skyTop: '#a9d4d6', skyBottom: '#ce9db1', groundColor: '#767347' },
  { id: 'tortuga', title: '¿Me ayudas, tortuga?', description: 'Una roca muy alta. Una amiga con un gran caparazón.', task: 'Pide ayuda y salta desde el caparazón.', helper: 'tortuga', kind: 'lift-rock', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#767347' },
  { id: 'zorro', title: 'El pasadizo del zorro', description: 'El zorro conoce un pequeño paso bajo la roca.', task: 'Pide ayuda y pasa agachado.', helper: 'zorro', kind: 'tunnel', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#767347' },
  { id: 'elefante', title: 'Una trompa muy amable', description: 'El elefante puede ayudarte a subir.', task: 'Pide ayuda y avanza sobre la gran roca.', helper: 'elefante', kind: 'lift-rock', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#767347' },
  { id: 'charco', title: '¡Un salto al otro lado!', description: 'Un pequeño charco corta el camino.', task: 'Acércate y salta el charco.', helper: null, kind: 'gap', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#7c794e' },
  { id: 'jirafa', title: 'El puente de la jirafa', description: 'El río es ancho. La jirafa tiene una idea.', task: 'Pide ayuda y cruza su puente.', helper: 'jirafa', kind: 'bridge', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#7c794e' },
  { id: 'cocodrilo', title: 'Un amigo dormilón', description: 'El cocodrilo duerme junto al río.', task: 'Despiértalo con espacio y cruza con calma.', helper: 'cocodrilo', kind: 'bridge', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#7c794e' },
  { id: 'juncos', title: 'Entre los juncos', description: 'El camino continúa bajo los juncos.', task: 'Mantén la flecha abajo mientras avanzas.', helper: null, kind: 'reeds', skyTop: '#a9d4d6', skyBottom: '#b7d6d3', groundColor: '#85804e' },
  { id: 'serpiente', title: 'La escalera de la serpiente', description: 'Falta una última pared antes del huerto.', task: 'Pide ayuda a la serpiente y sube.', helper: 'serpiente', kind: 'wall', skyTop: '#a9d4d6', skyBottom: '#d5c79d', groundColor: '#888052' },
  { id: 'huerto', title: 'Por fin, el huerto', description: 'Tu amigo te espera entre las zanahorias.', task: 'Acércate a tu amigo y pulsa espacio.', helper: 'conejo', kind: 'garden', skyTop: '#829a9e', skyBottom: '#d68d67', groundColor: '#74705f' },
]);

// Shared with the illustration: left edges, widths, and absolute top surfaces.
// An assisted animal's support follows assistY, then remains at liftY. Its
// illustrated shell/trunk/head supports the rabbit throughout the lift range.
export const SCENE_GEOMETRY = Object.freeze([
  { rock: { x: 610, width: 110, top: 470 } },
  { helperX: 500, rock: { x: 670, width: 130, top: 350 }, liftY: 455, liftLeft: 430, liftRight: 670 },
  { helperX: 470, tunnel: { x: 620, width: 200, top: 305, ceiling: 516 } },
  { helperX: 490, rock: { x: 710, width: 155, top: 318 }, liftY: 318, liftLeft: 420, liftRight: 710 },
  { gap: { left: 550, right: 700 } },
  { helperX: 470, gap: { left: 550, right: 860 } },
  { helperX: 470, gap: { left: 530, right: 900 } },
  { tunnel: { x: 470, width: 460, top: 390, ceiling: 516 } },
  { helperX: 550, wall: { x: 850, width: 430, top: 300 }, liftY: 300, liftLeft: 480, liftRight: 850 },
  { friendX: 930 },
]);

const RADIUS = 24;
const HEIGHT_STANDING = 66;
const HEIGHT_DUCKING = 36;
const SPEED = 270;
const GRAVITY = 1400;
const JUMP_SPEED = 610;
const EPSILON = 0.001;
const EXIT = WIDTH - 45;

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
  };
}

export function startGame(state) {
  Object.assign(state, createGame(), { mode: 'playing', x: 100 });
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

function enterNextScene(state) {
  const completed = [...state.completed, SCENES[state.scene].id];
  const next = state.scene + 1;
  const { time, resetCount } = state;
  Object.assign(state, createGame(), {
    mode: 'playing', scene: next, x: 100, completed, time,
    resetCount, transition: 0.65,
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
  if (geometry.tunnel) {
    const locked = state.scene === 2 && !state.helped;
    result.push({ ...geometry.tunnel, bottom: locked ? GROUND : geometry.tunnel.ceiling });
  }
  return result;
}

function bridgeReady(state) {
  return (state.scene === 5 || state.scene === 6) && state.helped;
}

function onGroundAt(state, geometry, x) {
  if (!geometry.gap || bridgeReady(state)) return true;
  // Feet retain a little support at the river bank, without an invisible ledge.
  return x - 12 <= geometry.gap.left || x + 12 >= geometry.gap.right;
}

function help(state, geometry) {
  if (geometry.helperX === undefined || !SCENES[state.scene].helper) return false;
  if (Math.abs(state.x - geometry.helperX) > 105 || !state.grounded) return false;
  const canRelift = geometry.liftY !== undefined && state.y > GROUND - 10;
  if (state.helped && !canRelift) return false;
  state.helped = true;
  state.helpProgress = 0;
  state.celebration = 0.7;
  state.lifting = geometry.liftY !== undefined;
  state.assistY = GROUND;
  state.vy = 0;
  const messages = {
    1: '¡Gracias, tortuga! Su caparazón te acerca a la roca.',
    2: '¡Gracias, zorro! Ahora puedes pasar agachado.',
    3: '¡Gracias, elefante! Su trompa te lleva hacia arriba.',
    5: '¡Gracias, jirafa! Ya puedes cruzar el río.',
    6: '¡Buenos días, cocodrilo! Ya puedes cruzar.',
    8: '¡Gracias, serpiente! Sube contigo hasta la pared.',
  };
  say(state, messages[state.scene] ?? '¡Gracias por ayudarme!', 2);
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
  const rock = geometry.rock ?? geometry.wall;
  if (rock && overlaps(state.x, rock) && state.y <= rock.top + 1) {
    state.crossedTop = true;
  }
  if (geometry.rock && state.crossedTop && state.x > rock.x + rock.width + RADIUS
    && (state.scene === 0 || state.helped)) markSolved(state);
  if (geometry.wall && state.helped && state.crossedTop && state.y <= rock.top + 1
    && state.x > rock.x + 72) markSolved(state);
  if (geometry.tunnel) {
    const tunnel = geometry.tunnel;
    if (state.x > tunnel.x + RADIUS && state.x < tunnel.x + tunnel.width - RADIUS
      && state.ducking && input.down && (state.scene !== 2 || state.helped)) {
      state.tunnelEntered = true;
    }
    if (state.tunnelEntered && state.x > tunnel.x + tunnel.width + RADIUS) markSolved(state);
  }
  if (geometry.gap && state.grounded) {
    // A bank supports the feet over its last 12 pixels. Recognize the actual
    // landing immediately, before a new jump can replace the jump's origin.
    if (state.scene === 4 && state.jumped && state.jumpOriginX <= geometry.gap.left + 12
      && state.x + 12 >= geometry.gap.right) markSolved(state);
    if (state.x > geometry.gap.right + RADIUS && bridgeReady(state)
      && state.helpProgress >= 1) markSolved(state);
  }
}

function step(state, input, dt) {
  const geometry = SCENE_GEOMETRY[state.scene];
  const previousX = state.x;
  state.time += dt;
  state.sceneTime += dt;
  state.transition = Math.max(0, state.transition - dt);
  state.celebration = Math.max(0, state.celebration - dt);
  state.toastTimer = Math.max(0, state.toastTimer - dt);

  if (state.helped) state.helpProgress = Math.min(1, state.helpProgress + dt / 1.05);
  if (geometry.liftY !== undefined && state.helped) {
    const p = state.helpProgress;
    const eased = p * p * (3 - 2 * p);
    state.assistY = GROUND - (GROUND - geometry.liftY) * eased;
  }

  const tunnel = geometry.tunnel;
  const insideTunnel = tunnel && overlaps(state.x, tunnel)
    && state.y > tunnel.top && state.y - HEIGHT_STANDING < tunnel.ceiling;
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

  let usedAction = false;
  if (input.action && state.scene === 9 && state.grounded
    && Math.abs(state.x - geometry.friendX) <= 105) {
    state.mode = 'ending';
    state.vx = 0;
    state.vy = 0;
    state.completed = [...state.completed, SCENES[state.scene].id];
    state.celebration = 4;
    state.message = '¡Llegaste! Compartir el camino lo hace más bonito.';
    return;
  }
  if (input.action) usedAction = help(state, geometry);
  if ((input.up || (input.action && !usedAction)) && state.grounded
    && !state.lifting && !insideTunnel) {
    state.vy = -JUMP_SPEED;
    state.grounded = false;
    state.jumped = true;
    state.jumpOriginX = state.x;
  }

  const rectangles = obstacles(state, geometry);
  let nextX = Math.max(40, state.x + state.vx * dt);
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
  state.x = Math.min(nextX, state.scene === 9 || !state.solved ? WIDTH - 65 : WIDTH);

  if (state.lifting && state.x >= geometry.liftLeft - RADIUS
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
  if (state.solved && state.scene < SCENES.length - 1 && state.x >= EXIT) enterNextScene(state);
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
  if (state.solved) return '¡Prueba superada! Sigue hacia la derecha.';
  const geometry = SCENE_GEOMETRY[state.scene];
  if (state.lifting) return 'Tu amigo te está subiendo. Puedes avanzar con las flechas.';
  if (geometry.helperX !== undefined && !state.helped) {
    if (Math.abs(state.x - geometry.helperX) <= 105) {
      return state.scene === 6 ? 'Pulsa espacio para despertar al cocodrilo.'
        : `Pulsa espacio para pedir ayuda ${state.scene === 1 || state.scene === 5 || state.scene === 8 ? 'a la' : 'al'} ${SCENES[state.scene].helper}.`;
    }
    return 'Acércate a tu amigo con la flecha derecha.';
  }
  switch (state.scene) {
    case 0: return state.x < 430 ? 'Avanza con → hasta la piedra.' : 'Pulsa espacio o ↑ y avanza para saltar la piedra.';
    case 1: return state.y > 500 ? 'Vuelve junto a la tortuga y pulsa espacio para subir.' : 'Avanza por el caparazón y salta hacia la roca con espacio o ↑.';
    case 2: return 'Mantén ↓ y avanza con → para pasar por el túnel.';
    case 3: return state.y > 500 ? 'Vuelve junto al elefante y pulsa espacio para subir.' : 'Avanza con → sobre la roca. ¡Gracias, elefante!';
    case 4: return state.x < 400 ? 'Acércate al charco con →.' : 'Desde la orilla, pulsa espacio o ↑ y avanza para saltar.';
    case 5: return 'Cruza el puente de la jirafa con →.';
    case 6: return 'Camina sobre el lomo del cocodrilo con →.';
    case 7: return 'Mantén ↓ y → para caminar bajo los juncos.';
    case 8: return state.y > 500 ? 'Vuelve junto a la serpiente y pulsa espacio para subir.' : 'Avanza con → hacia lo alto de la pared.';
    case 9: return Math.abs(state.x - geometry.friendX) <= 105 ? '¡Tu amigo! Pulsa espacio para saludarlo.' : 'Sigue el camino hasta tu amigo, el conejo marrón.';
    default: return 'Sigue el camino con →.';
  }
}
