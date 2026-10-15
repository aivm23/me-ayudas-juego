import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIDTH, HEIGHT, GROUND, SCENES, SCENE_GEOMETRY,
  createGame, startGame, restartGame, updateGame, getHint,
} from '../src/engine.js';

const DT = 1 / 60;
const RIGHT = { right: true };

function playing() {
  return startGame(createGame());
}

function tick(state, input = {}, seconds = DT) {
  const frames = Math.ceil(seconds / DT);
  for (let i = 0; i < frames; i += 1) updateGame(state, input, DT);
  return state;
}

function until(state, condition, input = RIGHT, seconds = 12) {
  for (let i = 0; i < seconds / DT && !condition(state); i += 1) updateGame(state, input, DT);
  assert.ok(condition(state), `No se alcanzó el destino: escena=${state.scene}, x=${state.x.toFixed(2)}, y=${state.y.toFixed(2)}, ayuda=${state.helped}, resuelta=${state.solved}`);
  return state;
}

function go(state, x, input = RIGHT) {
  return until(state, current => current.x >= x, input);
}

function pulse(state, key = 'action', held = {}) {
  return updateGame(state, { ...held, [key]: true }, DT);
}

function leave(state) {
  const current = state.scene;
  return until(state, next => next.scene === current + 1, RIGHT);
}

// Routes use the very same sustained directions and one-frame key pulses as
// the browser. No coordinates, progress flags or challenge state are changed.
function solveCurrent(state) {
  switch (state.scene) {
    case 0:
      go(state, 520);
      pulse(state, 'action', RIGHT);
      go(state, 800);
      break;
    case 1:
      go(state, 490);
      pulse(state);
      tick(state, {}, 1.2);
      go(state, 620);
      pulse(state, 'up', RIGHT);
      go(state, 900);
      break;
    case 2:
      go(state, 465);
      pulse(state);
      go(state, 900, { right: true, down: true });
      break;
    case 3:
      go(state, 480);
      pulse(state);
      tick(state, {}, 1.2);
      go(state, 940);
      break;
    case 4:
      go(state, 510);
      pulse(state, 'action', RIGHT);
      go(state, 810);
      break;
    case 5:
    case 6:
      go(state, 450);
      pulse(state);
      go(state, 990);
      break;
    case 7:
      go(state, 1000, { right: true, down: true });
      break;
    case 8:
      go(state, 535);
      pulse(state);
      tick(state, {}, 1.2);
      go(state, 1050);
      break;
    case 9:
      go(state, 910);
      pulse(state);
      break;
    default: assert.fail('Pantalla desconocida');
  }
  return state;
}

function reachScene(scene) {
  const state = playing();
  while (state.scene < scene) {
    solveCurrent(state);
    assert.equal(state.solved, true);
    leave(state);
  }
  return state;
}

test('el título es inerte y el comienzo inicializa el recorrido', () => {
  const state = createGame();
  assert.equal(state.mode, 'title');
  const before = structuredClone(state);
  tick(state, { right: true, action: true }, 2);
  assert.deepEqual(state, before);
  startGame(state);
  assert.equal(state.mode, 'playing');
  assert.equal(state.x, 100);
  assert.equal(state.y, GROUND);
  assert.deepEqual(state.completed, []);
  assert.match(getHint(state), /piedra/);
});

test('las diez escenas y su geometría siguen el cuento completo', () => {
  assert.deepEqual(SCENES.map(scene => scene.id), ['piedra', 'tortuga', 'zorro', 'elefante', 'charco', 'jirafa', 'cocodrilo', 'juncos', 'serpiente', 'huerto']);
  assert.equal(SCENE_GEOMETRY.length, 10);
  assert.equal(SCENE_GEOMETRY[8].wall.top, 300);
  assert.equal(WIDTH, 1280);
  assert.equal(HEIGHT, 720);
});

test('la marcha acelera, frena suavemente y respeta el límite izquierdo', () => {
  const state = playing();
  updateGame(state, RIGHT, DT);
  assert.ok(state.vx > 0 && state.vx < 270);
  tick(state, RIGHT, 0.7);
  assert.equal(state.vx, 270);
  const movingX = state.x;
  tick(state, {}, 0.2);
  assert.equal(state.vx, 0);
  assert.ok(state.x > movingX);
  tick(state, { left: true }, 3);
  assert.equal(state.x, 40);
  assert.equal(state.facing, -1);
});

test('direcciones opuestas se cancelan y nunca generan coordenadas inválidas', () => {
  const state = playing();
  tick(state, { left: true, right: true }, 1);
  assert.equal(state.x, 100);
  assert.equal(state.vx, 0);
  updateGame(state, RIGHT, Number.NaN);
  updateGame(state, RIGHT, -1);
  updateGame(state, RIGHT, Infinity);
  assert.equal(state.x, 100);
  assert.ok(Math.abs(state.time - 1) < 1e-10);
});

test('un delta enorme se limita y una pulsación no se duplica entre subpasos', () => {
  const ordinary = playing();
  const suspended = playing();
  updateGame(ordinary, { right: true, action: true }, 1 / 30);
  updateGame(suspended, { right: true, action: true }, 20);
  assert.deepEqual(suspended, ordinary);
  assert.ok(suspended.y < GROUND && suspended.vy < 0);
  assert.equal(suspended.grounded, false);
});

test('el salto alcanza unos 130 píxeles, vuelve al suelo y no permite salto aéreo', () => {
  const state = playing();
  pulse(state, 'up');
  let highest = state.y;
  for (let i = 0; i < 12; i += 1) {
    updateGame(state, {}, DT);
    highest = Math.min(highest, state.y);
  }
  const before = state.vy;
  pulse(state, 'action');
  assert.ok(state.vy > before, 'Espacio en el aire no reinicia la velocidad');
  for (let i = 0; i < 60; i += 1) {
    updateGame(state, {}, DT);
    highest = Math.min(highest, state.y);
  }
  assert.ok(GROUND - highest > 125 && GROUND - highest < 136);
  assert.equal(state.y, GROUND);
  assert.equal(state.grounded, true);
  assert.equal(state.vy, 0);
});

test('la piedra bloquea correr, agacharse o saltar demasiado pronto', () => {
  const state = playing();
  pulse(state, 'up', RIGHT);
  tick(state, RIGHT, 5);
  assert.equal(state.scene, 0);
  assert.equal(state.x, SCENE_GEOMETRY[0].rock.x - 24);
  tick(state, { right: true, down: true }, 2);
  assert.equal(state.scene, 0);
  assert.equal(state.solved, false);
  assert.deepEqual(state.completed, []);
});

test('el salto real supera la piedra y completa solo al salir de la pantalla', () => {
  const state = playing();
  solveCurrent(state);
  assert.equal(state.solved, true);
  assert.deepEqual(state.completed, []);
  leave(state);
  assert.equal(state.scene, 1);
  assert.equal(state.x, 100);
  assert.equal(state.y, GROUND);
  assert.deepEqual(state.completed, ['piedra']);
});

test('la tortuga exige cercanía y ayuda, y luego un salto desde su caparazón', () => {
  const state = reachScene(1);
  pulse(state);
  assert.equal(state.helped, false);
  tick(state, RIGHT, 3);
  for (let i = 0; i < 3; i += 1) {
    pulse(state, 'up', RIGHT);
    tick(state, RIGHT, 1);
  }
  assert.equal(state.helped, false);
  assert.equal(state.solved, false);
  assert.ok(state.x <= 646);
  until(state, current => current.x <= 505, { left: true });
  pulse(state);
  assert.equal(state.helped, true);
  assert.equal(state.lifting, true);
  tick(state, {}, 1.2);
  assert.equal(state.y, 455);
  assert.equal(state.grounded, true);
  tick(state, RIGHT, 2);
  assert.equal(state.x, 646);
  assert.equal(state.solved, false, 'La elevación sola no supera la roca');
  pulse(state, 'up', RIGHT);
  go(state, 900);
  assert.equal(state.solved, true);
});

test('el zorro debe abrir el túnel antes de poder pasar agachado', () => {
  const state = reachScene(2);
  tick(state, { right: true, down: true }, 4);
  assert.equal(state.x, 596);
  assert.equal(state.solved, false);
  until(state, current => current.x <= 470, { left: true });
  pulse(state);
  assert.equal(state.helped, true);
  tick(state, RIGHT, 2);
  assert.equal(state.x, 596);
  go(state, 700, { right: true, down: true });
  const insideX = state.x;
  tick(state, RIGHT, 1);
  assert.equal(state.x, insideX, 'Soltar abajo detiene la marcha bajo el techo');
  assert.equal(state.ducking, true, 'El conejo no atraviesa el techo al levantarse');
  go(state, 900, { right: true, down: true });
  tick(state, {}, 0.2);
  assert.equal(state.solved, true);
  assert.equal(state.ducking, false);
});

test('el elefante sube sin teletransportar horizontalmente y deja avanzar sobre la roca', () => {
  const state = reachScene(3);
  go(state, 480);
  tick(state, {}, 0.2);
  const liftX = state.x;
  pulse(state);
  tick(state, {}, 0.5);
  assert.equal(state.x, liftX);
  assert.ok(state.y > 318 && state.y < GROUND);
  assert.equal(state.lifting, true);
  tick(state, {}, 0.8);
  assert.equal(state.y, 318);
  go(state, 900);
  assert.equal(state.solved, true);
});

test('caminar al charco devuelve a la orilla sin perder progreso ni vidas', () => {
  const state = reachScene(4);
  const completed = [...state.completed];
  until(state, current => current.resetCount > 0, RIGHT);
  assert.equal(state.scene, 4);
  assert.equal(state.y, GROUND);
  assert.equal(state.grounded, true);
  assert.equal(state.solved, false);
  assert.deepEqual(state.completed, completed);
  assert.match(state.message, /otra vez/);
  assert.equal(Object.hasOwn(state, 'lives'), false);
});

test('un salto desde la orilla cruza el charco y registra la prueba', () => {
  const state = reachScene(4);
  solveCurrent(state);
  assert.equal(state.solved, true);
  assert.equal(state.resetCount, 0);
  assert.equal(state.grounded, true);
});

test('el charco reconoce ambos apoyos y conserva el cruce si saltas al aterrizar', () => {
  for (const takeoff of [510, 558]) {
    const state = reachScene(4);
    go(state, takeoff);
    assert.equal(state.grounded, true);
    if (takeoff === 558) assert.ok(state.x > SCENE_GEOMETRY[4].gap.left);
    pulse(state, 'up', RIGHT);
    go(state, 690);
    // Stop in the air so the first landing is at the start of the right bank,
    // before the old completion threshold (right edge + rabbit radius).
    until(state, current => current.grounded, {});
    assert.ok(state.x >= 688 && state.x < 724);
    assert.equal(state.solved, true, 'Aterrizar en el apoyo derecho completa el salto');
    pulse(state, 'up', RIGHT);
    assert.equal(state.grounded, false);
    assert.ok(state.jumpOriginX > SCENE_GEOMETRY[4].gap.right - 12);
    until(state, current => current.grounded && current.x > 800, RIGHT);
    assert.equal(state.solved, true, 'Un segundo salto no borra un cruce válido');
    assert.equal(state.resetCount, 0);
    leave(state);
    assert.equal(state.scene, 5);
    assert.ok(state.completed.includes('charco'));
  }
});

test('el río de la jirafa es imposible de saltar y se cruza pidiendo ayuda', () => {
  const state = reachScene(5);
  go(state, 510);
  pulse(state, 'action', RIGHT);
  // Space by the giraffe is deliberately help, so use the independent jump
  // key in a fresh state to verify the actual unassisted river width.
  assert.equal(state.helped, true);
  const unassisted = reachScene(5);
  go(unassisted, 510);
  pulse(unassisted, 'up', RIGHT);
  until(unassisted, current => current.resetCount > 0, RIGHT);
  assert.equal(unassisted.solved, false);
  assert.equal(unassisted.helped, false);
  solveCurrent(state);
  assert.equal(state.solved, true);
});

test('el cocodrilo necesita espacio cercano; flecha arriba no lo despierta', () => {
  const state = reachScene(6);
  go(state, 450);
  pulse(state, 'up');
  assert.equal(state.helped, false);
  tick(state, {}, 1);
  pulse(state);
  assert.equal(state.helped, true);
  go(state, 1000);
  assert.equal(state.solved, true);
});

test('los juncos no se pueden saltar ni cruzar de pie', () => {
  const state = reachScene(7);
  tick(state, RIGHT, 3);
  assert.equal(state.x, 446);
  pulse(state, 'up', RIGHT);
  tick(state, RIGHT, 1);
  assert.equal(state.x, 446);
  assert.equal(state.solved, false);
  go(state, 1000, { right: true, down: true });
  assert.equal(state.solved, true);
});

test('la serpiente eleva a la pared y la salida conserva el suelo alto', () => {
  const state = reachScene(8);
  tick(state, RIGHT, 4);
  assert.equal(state.x, 826);
  assert.equal(state.solved, false);
  until(state, current => current.x <= 550, { left: true });
  tick(state, {}, 0.2);
  pulse(state);
  tick(state, {}, 1.2);
  assert.equal(state.y, 300);
  go(state, 1200);
  assert.equal(state.solved, true);
  assert.equal(state.y, 300);
  assert.equal(state.grounded, true);
  leave(state);
  assert.equal(state.scene, 9);
  assert.equal(state.y, GROUND);
  assert.deepEqual(state.completed, SCENES.slice(0, 9).map(scene => scene.id));
});

test('el recorrido completo requiere saludar al conejo y termina con las diez pruebas', () => {
  const state = reachScene(9);
  pulse(state);
  assert.equal(state.mode, 'playing');
  tick(state, RIGHT, 5);
  assert.equal(state.mode, 'playing', 'Llegar al borde no sustituye saludar al amigo');
  assert.equal(state.scene, 9);
  until(state, current => current.x <= 1010, { left: true });
  pulse(state);
  assert.equal(state.mode, 'ending');
  assert.deepEqual(state.completed, SCENES.map(scene => scene.id));
  assert.match(getHint(state), /Llegaste/);
  const ending = structuredClone(state);
  tick(state, { action: true, right: true }, 2);
  assert.deepEqual(state, ending, 'El final no duplica completados ni deja seguir caminando');
});

test('reiniciar borra el progreso, la ayuda y los estados transitorios', () => {
  const state = reachScene(3);
  solveCurrent(state);
  restartGame(state);
  assert.deepEqual(state, playing());
});

test('dos recorridos con los mismos inputs producen exactamente el mismo estado', () => {
  const first = playing();
  const second = playing();
  for (const state of [first, second]) {
    solveCurrent(state);
    leave(state);
    solveCurrent(state);
    leave(state);
  }
  assert.deepEqual(first, second);
});
