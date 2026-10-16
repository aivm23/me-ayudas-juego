import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIDTH, HEIGHT, GROUND, RADIUS, SCENES, SCENE_GEOMETRY, SCENE_IDS,
  EMERGE_DURATION, MOUNTAIN_REVEAL_DURATION, CARROT_PLUCK_DURATION,
  ELEPHANT_REVEAL_DURATION, SNAKE_HELP_DURATION, SNAKE_LOWERING_PROGRESS,
  sceneId, sceneWidth, currentGeometry, tunnelFloorAt,
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
  switch (sceneId(state)) {
    case 'madriguera':
      pulse(state);
      tick(state, {}, EMERGE_DURATION + DT);
      break;
    case 'piedra':
      go(state, 520);
      pulse(state, 'action', RIGHT);
      go(state, 800);
      break;
    case 'tortuga':
      go(state, 490);
      pulse(state);
      tick(state, {}, 1.2);
      go(state, 620);
      pulse(state, 'up', RIGHT);
      go(state, 900);
      break;
    case 'zorro':
      go(state, 465);
      pulse(state);
      go(state, 1000, { right: true, down: true });
      break;
    case 'elefante':
      go(state, 480);
      pulse(state);
      tick(state, {}, 0.7);
      pulse(state);
      tick(state, {}, 1.2);
      go(state, 940);
      break;
    case 'charco':
      go(state, 510);
      pulse(state, 'action', RIGHT);
      go(state, 810);
      break;
    case 'jirafa':
    case 'cocodrilo':
      go(state, 450);
      pulse(state);
      go(state, 990);
      break;
    case 'juncos':
      go(state, 2240);
      break;
    case 'pared':
      go(state, 750);
      pulse(state);
      break;
    case 'serpiente':
      tick(state, {}, MOUNTAIN_REVEAL_DURATION + DT);
      go(state, 750);
      pulse(state);
      tick(state, {}, 3.2);
      go(state, 1050);
      break;
    case 'zanahoria':
      until(state, current => sceneId(current) === 'conejo', RIGHT);
      break;
    case 'conejo':
      break;
    default: assert.fail('Pantalla desconocida');
  }
  return state;
}

function reachScene(scene) {
  const destination = typeof scene === 'string' ? SCENE_IDS[scene] : scene;
  const state = playing();
  while (state.scene < destination) {
    const previous = state.scene;
    solveCurrent(state);
    if (state.scene === previous) {
      assert.equal(state.solved, true, `${sceneId(state)} debe estar resuelta antes de salir`);
      leave(state);
    } else {
      assert.equal(state.scene, previous + 1, 'Mirar la pared descubre la siguiente pantalla');
      assert.ok(state.completed.includes(SCENES[previous].id));
    }
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
  assert.equal(state.x, 170);
  assert.equal(state.y, GROUND);
  assert.deepEqual(state.completed, []);
  assert.equal(sceneId(state), 'madriguera');
  assert.match(getHint(state), /madriguera/);
});

test('la guarda inicial muestra el comienzo y la salida se anima antes de poder caminar', () => {
  const state = playing();
  assert.equal(state.emergeProgress, 0);
  assert.equal(state.emerging, false);
  assert.equal(state.solved, false);
  tick(state, {}, 1);
  assert.equal(state.emergeProgress, 0, 'La espera deja únicamente las orejas en la madriguera');
  const startX = state.x;
  pulse(state, 'action');
  assert.equal(state.emerging, true);
  tick(state, RIGHT, EMERGE_DURATION / 2);
  assert.ok(state.emergeProgress > 0 && state.emergeProgress < 1);
  assert.equal(state.x, startX);
  tick(state, {}, EMERGE_DURATION);
  assert.equal(state.emergeProgress, 1);
  assert.equal(state.emerging, false);
  assert.equal(state.solved, true);
  leave(state);
  assert.equal(sceneId(state), 'piedra');
  assert.equal(state.x, 100);
  assert.deepEqual(state.completed, ['madriguera']);
  const withArrow = playing();
  tick(withArrow, RIGHT, EMERGE_DURATION / 2);
  assert.ok(withArrow.emergeProgress > 0 && withArrow.emergeProgress < 1, 'La flecha derecha también inicia la salida');
});

test('las trece escenas incluyen la guarda inicial y separan los hitos del cuento', () => {
  assert.deepEqual(SCENES.map(scene => scene.id), ['madriguera', 'piedra', 'tortuga', 'zorro', 'elefante', 'charco', 'jirafa', 'cocodrilo', 'juncos', 'pared', 'serpiente', 'zanahoria', 'conejo']);
  assert.equal(SCENE_GEOMETRY.length, SCENES.length);
  assert.ok(SCENES.every(scene => typeof scene.mapLabel === 'string' && scene.mapLabel.length > 0));
  assert.equal(SCENE_GEOMETRY[SCENE_IDS.pared].wall.top, -1200);
  assert.equal(SCENE_GEOMETRY[SCENE_IDS.serpiente].wall.top, -600);
  assert.equal(SCENES.some(scene => scene.id === 'huerto'), false);
  assert.equal(WIDTH, 1280);
  assert.equal(HEIGHT, 720);
});

test('la marcha acelera, frena suavemente y respeta el límite izquierdo', () => {
  const state = reachScene('piedra');
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
  const state = reachScene('piedra');
  const timeBefore = state.time;
  tick(state, { left: true, right: true }, 1);
  assert.equal(state.x, 100);
  assert.equal(state.vx, 0);
  updateGame(state, RIGHT, Number.NaN);
  updateGame(state, RIGHT, -1);
  updateGame(state, RIGHT, Infinity);
  assert.equal(state.x, 100);
  assert.ok(Math.abs(state.time - timeBefore - 1) < 1e-10);
});

test('un delta enorme se limita y una pulsación no se duplica entre subpasos', () => {
  const ordinary = reachScene('piedra');
  const suspended = reachScene('piedra');
  updateGame(ordinary, { right: true, action: true }, 1 / 10);
  updateGame(suspended, { right: true, action: true }, 20);
  assert.deepEqual(suspended, ordinary);
  assert.ok(suspended.y < GROUND && suspended.vy < 0);
  assert.equal(suspended.grounded, false);
});

test('diez y sesenta fotogramas por segundo conservan distancia, salto y colisiones', () => {
  for (const jumping of [false, true]) {
    const smooth = reachScene('piedra');
    const slow = reachScene('piedra');
    for (let frame = 0; frame < 60; frame += 1) {
      updateGame(smooth, { right: true, action: jumping && frame === 0 }, 1 / 60);
    }
    for (let frame = 0; frame < 10; frame += 1) {
      updateGame(slow, { right: true, action: jumping && frame === 0 }, 1 / 10);
    }
    assert.deepEqual(slow, smooth, 'La frecuencia de dibujo no cambia el tiempo ni la física de los subpasos');
    assert.ok(slow.x > 340, 'Un segundo a diez FPS permite avanzar a velocidad normal');
    assert.equal(slow.y, GROUND);
    assert.equal(slow.grounded, true);
    for (let frame = 0; frame < 72; frame += 1) updateGame(smooth, RIGHT, 1 / 60);
    for (let frame = 0; frame < 12; frame += 1) updateGame(slow, RIGHT, 1 / 10);
    assert.deepEqual(slow, smooth, 'Los subpasos también conservan el contacto con una pared sólida');
    assert.equal(slow.x, currentGeometry(slow).rock.x - RADIUS);
    assert.equal(slow.vx, 0);
    assert.equal(slow.solved, false);
  }
});

test('una pulsación aérea en un fotograma largo se consume antes de aterrizar y no dispara otro salto', () => {
  const state = reachScene('piedra');
  pulse(state, 'up');
  until(state, current => !current.grounded && current.vy > 0 && current.y > GROUND - 10, {});
  const smooth = structuredClone(state);
  updateGame(state, { action: true }, 1 / 10);
  for (let frame = 0; frame < 6; frame += 1) {
    updateGame(smooth, { action: frame === 0 }, 1 / 60);
  }
  assert.deepEqual(state, smooth);
  assert.equal(state.y, GROUND, 'Aterrizar dentro de los doce subpasos no reutiliza espacio');
  assert.equal(state.vy, 0);
  assert.equal(state.grounded, true);
});

test('el salto alcanza unos 130 píxeles, vuelve al suelo y no permite salto aéreo', () => {
  const state = reachScene('piedra');
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
  const state = reachScene('piedra');
  pulse(state, 'up', RIGHT);
  tick(state, RIGHT, 5);
  assert.equal(sceneId(state), 'piedra');
  assert.equal(state.x, SCENE_GEOMETRY[SCENE_IDS.piedra].rock.x - 24);
  tick(state, { right: true, down: true }, 2);
  assert.equal(sceneId(state), 'piedra');
  assert.equal(state.solved, false);
  assert.deepEqual(state.completed, ['madriguera']);
});

test('el salto real supera la piedra y completa solo al salir de la pantalla', () => {
  const state = reachScene('piedra');
  solveCurrent(state);
  assert.equal(state.solved, true);
  assert.deepEqual(state.completed, ['madriguera']);
  leave(state);
  assert.equal(sceneId(state), 'tortuga');
  assert.equal(state.x, 100);
  assert.equal(state.y, GROUND);
  assert.deepEqual(state.completed, ['madriguera', 'piedra']);
});

test('la tortuga exige cercanía y ayuda, y luego un salto desde su caparazón', () => {
  const state = reachScene('tortuga');
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
  const state = reachScene('zorro');
  tick(state, { right: true, down: true }, 4);
  assert.equal(state.x, currentGeometry(state).tunnel.x - RADIUS);
  assert.equal(state.solved, false);
  until(state, current => current.x <= 470, { left: true });
  pulse(state);
  assert.equal(state.helped, true);
  tick(state, RIGHT, 2);
  assert.equal(state.x, currentGeometry(state).tunnel.x - RADIUS);
  go(state, 700, { right: true, down: true });
  const insideX = state.x;
  const insideY = state.y;
  assert.ok(insideY > GROUND + 95, 'El conejo desciende realmente bajo el suelo');
  assert.equal(insideY, tunnelFloorAt(insideX, currentGeometry(state).tunnel));
  tick(state, RIGHT, 1);
  assert.equal(state.x, insideX, 'Soltar abajo detiene la marcha bajo el techo');
  assert.equal(state.y, insideY, 'Sigue apoyado en el túnel al detenerse');
  assert.equal(state.ducking, true, 'El conejo no atraviesa el techo al levantarse');
  until(state, current => current.x <= 450, { left: true, down: true });
  tick(state, {}, 0.2);
  assert.equal(state.y, GROUND);
  assert.equal(state.ducking, false);
  assert.equal(state.solved, false, 'Volver por la entrada no cuenta como atravesar el túnel');
  go(state, 1000, { right: true, down: true });
  tick(state, {}, 0.2);
  assert.equal(state.solved, true);
  assert.equal(state.ducking, false);
  assert.equal(state.y, GROUND);
  assert.equal(state.grounded, true);
});

test('el túnel tiene perfil U continuo y la roca impide saltar sin cruzarlo', () => {
  const state = reachScene('zorro');
  const { tunnel, rock } = currentGeometry(state);
  assert.equal(tunnelFloorAt(tunnel.x - 100, tunnel), GROUND);
  assert.equal(tunnelFloorAt(tunnel.x, tunnel), GROUND);
  assert.equal(tunnelFloorAt(tunnel.x + tunnel.width / 2, tunnel), GROUND + 100);
  assert.equal(tunnelFloorAt(tunnel.x + tunnel.width + 100, tunnel), GROUND);
  assert.ok(tunnelFloorAt(rock.x, tunnel) - tunnel.clearance >= GROUND);
  go(state, 470);
  pulse(state);
  for (let i = 0; i < 3; i += 1) {
    pulse(state, 'up', RIGHT);
    tick(state, RIGHT, 1);
  }
  assert.equal(state.x, tunnel.x - RADIUS);
  assert.equal(state.solved, false);
  assert.equal(state.tunnelEntered, false);
});

test('el elefante gira con una acción y solo ayuda con otra tras darse la vuelta', () => {
  const state = reachScene('elefante');
  assert.equal(state.elephantRevealed, false);
  assert.equal(state.revealProgress, 0);
  pulse(state);
  tick(state, {}, 1);
  assert.equal(state.elephantRevealed, false, 'Hay que llamarlo de cerca');
  go(state, 480);
  tick(state, {}, 0.2);
  const liftX = state.x;
  pulse(state);
  assert.equal(state.elephantRevealed, true);
  assert.equal(state.helped, false);
  assert.equal(state.lifting, false);
  assert.equal(state.y, GROUND);
  tick(state, {}, ELEPHANT_REVEAL_DURATION / 2);
  assert.ok(state.revealProgress > 0 && state.revealProgress < 1);
  pulse(state);
  assert.equal(state.helped, false, 'Otra pulsación durante el giro no inicia la ayuda');
  assert.equal(state.grounded, true, 'La pulsación tampoco dispara un salto');
  tick(state, {}, ELEPHANT_REVEAL_DURATION);
  assert.equal(state.revealProgress, 1);
  assert.equal(state.helped, false, 'El fin del giro espera una segunda acción');
  pulse(state);
  tick(state, {}, 0.5);
  assert.equal(state.x, liftX);
  assert.ok(state.y > 318 && state.y < GROUND);
  assert.equal(state.lifting, true);
  tick(state, {}, 0.8);
  assert.equal(state.y, 318);
  go(state, 900);
  assert.equal(state.solved, true);
  leave(state);
  assert.equal(sceneId(state), 'charco');
  assert.equal(state.elephantRevealed, false);
  assert.equal(state.revealProgress, 0);
});

test('caminar al charco devuelve a la orilla sin perder progreso ni vidas', () => {
  const state = reachScene('charco');
  const completed = [...state.completed];
  until(state, current => current.resetCount > 0, RIGHT);
  assert.equal(sceneId(state), 'charco');
  assert.equal(state.y, GROUND);
  assert.equal(state.grounded, true);
  assert.equal(state.solved, false);
  assert.deepEqual(state.completed, completed);
  assert.match(state.message, /otra vez/);
  assert.equal(Object.hasOwn(state, 'lives'), false);
});

test('un salto desde la orilla cruza el charco y registra la prueba', () => {
  const state = reachScene('charco');
  solveCurrent(state);
  assert.equal(state.solved, true);
  assert.equal(state.resetCount, 0);
  assert.equal(state.grounded, true);
});

test('el charco reconoce ambos apoyos y conserva el cruce si saltas al aterrizar', () => {
  for (const takeoff of [510, 558]) {
    const state = reachScene('charco');
    go(state, takeoff);
    assert.equal(state.grounded, true);
    if (takeoff === 558) assert.ok(state.x > SCENE_GEOMETRY[SCENE_IDS.charco].gap.left);
    pulse(state, 'up', RIGHT);
    go(state, 690);
    // Stop in the air so the first landing is at the start of the right bank,
    // before the old completion threshold (right edge + rabbit radius).
    until(state, current => current.grounded, {});
    assert.ok(state.x >= 688 && state.x < 724);
    assert.equal(state.solved, true, 'Aterrizar en el apoyo derecho completa el salto');
    pulse(state, 'up', RIGHT);
    assert.equal(state.grounded, false);
    assert.ok(state.jumpOriginX > SCENE_GEOMETRY[SCENE_IDS.charco].gap.right - 12);
    until(state, current => current.grounded && current.x > 800, RIGHT);
    assert.equal(state.solved, true, 'Un segundo salto no borra un cruce válido');
    assert.equal(state.resetCount, 0);
    leave(state);
    assert.equal(sceneId(state), 'jirafa');
    assert.ok(state.completed.includes('charco'));
  }
});

test('el río de la jirafa es imposible de saltar y se cruza pidiendo ayuda', () => {
  const state = reachScene('jirafa');
  go(state, 510);
  pulse(state, 'action', RIGHT);
  // Space by the giraffe is deliberately help, so use the independent jump
  // key in a fresh state to verify the actual unassisted river width.
  assert.equal(state.helped, true);
  const unassisted = reachScene('jirafa');
  go(unassisted, 510);
  pulse(unassisted, 'up', RIGHT);
  until(unassisted, current => current.resetCount > 0, RIGHT);
  assert.equal(unassisted.solved, false);
  assert.equal(unassisted.helped, false);
  solveCurrent(state);
  assert.equal(state.solved, true);
});

test('el cocodrilo necesita espacio cercano; flecha arriba no lo despierta', () => {
  const state = reachScene('cocodrilo');
  go(state, 450);
  pulse(state, 'up');
  assert.equal(state.helped, false);
  tick(state, {}, 1);
  pulse(state);
  assert.equal(state.helped, true);
  go(state, 1000);
  assert.equal(state.solved, true);
});

test('los juncos ocupan dos páginas, ocultan al conejo y permiten avanzar o retroceder de pie', () => {
  const state = reachScene('juncos');
  const geometry = currentGeometry(state);
  assert.equal(sceneWidth(state), 2560);
  assert.deepEqual(geometry.reeds, { left: 380, right: 2160 });
  assert.equal(geometry.tunnel, undefined);
  go(state, 390);
  assert.equal(state.hiddenInReeds, false, 'Aún asoma parte del cuerpo por el borde');
  go(state, 410);
  assert.equal(state.hiddenInReeds, true, 'Solo desaparece cuando todo el cuerpo entra');
  assert.equal(state.ducking, false);
  go(state, 1200);
  assert.equal(state.y, GROUND);
  assert.equal(state.cameraX, state.x - 520);
  assert.equal(state.cameraY, 0);
  assert.equal(state.solved, false, 'La primera página no completa el juncal');
  until(state, current => current.x <= 370, { left: true });
  assert.equal(state.hiddenInReeds, false);
  assert.equal(state.ducking, false);
  assert.equal(state.cameraX, 0);
  go(state, 800, { right: true, down: true });
  assert.equal(state.ducking, true);
  const crouchedX = state.x;
  tick(state, RIGHT, 0.4);
  assert.ok(state.x > crouchedX, 'Soltar abajo no detiene el avance entre plantas');
  assert.equal(state.ducking, false);
  go(state, 2140);
  assert.equal(state.hiddenInReeds, false, 'El borde derecho vuelve a mostrar el cuerpo');
  assert.equal(state.solved, false);
  go(state, 2240);
  assert.equal(state.cameraX, WIDTH);
  assert.equal(state.solved, true);
  assert.equal(state.y, GROUND);
  leave(state);
  assert.equal(sceneId(state), 'pared');
  assert.equal(state.cameraX, 0);
  assert.equal(state.hiddenInReeds, false);
});

test('la pared revela toda la montaña mediante un zoom continuo sin teletransportar al conejo', () => {
  const state = reachScene('pared');
  assert.equal(SCENES[state.scene].helper, null);
  assert.equal(currentGeometry(state).tree, undefined);
  pulse(state);
  tick(state, RIGHT, 4);
  assert.equal(sceneId(state), 'pared');
  assert.equal(state.x, currentGeometry(state).wall.x - RADIUS);
  assert.equal(state.solved, false);
  assert.equal(state.helped, false);
  const position = { x: state.x, y: state.y };
  pulse(state);
  assert.equal(sceneId(state), 'serpiente');
  assert.ok(state.completed.includes('pared'));
  assert.equal(state.x, position.x);
  assert.equal(state.y, position.y);
  assert.equal(state.transition, 0, 'La cámara sustituye al fundido entre páginas');
  assert.equal(state.cameraZoom, 1);
  assert.equal(state.revealCameraProgress, 0);
  assert.equal(state.helped, false);
  assert.equal(state.snakePhase, 'coiled');
  pulse(state, 'action', { right: true });
  tick(state, { right: true, up: true }, MOUNTAIN_REVEAL_DURATION / 2 - DT);
  assert.equal(state.x, position.x, 'El encuadre mantiene el ancla durante el alejamiento');
  assert.equal(state.y, position.y);
  assert.equal(state.helped, false, 'Las pulsaciones no interrumpen la presentación');
  assert.ok(state.cameraZoom > 0.5 && state.cameraZoom < 1);
  assert.ok(state.cameraY < 0 && state.cameraY > -650);
  assert.ok(state.cameraX < 0 && state.cameraX > -1000);
  const midpoint = state.cameraZoom;
  tick(state, {}, MOUNTAIN_REVEAL_DURATION);
  assert.equal(state.revealCameraProgress, 1);
  assert.ok(state.cameraZoom < midpoint);
  assert.equal(state.cameraZoom, 0.5);
  assert.equal(state.cameraX, -1000);
  assert.equal(state.cameraY, -650);
  const geometry = currentGeometry(state);
  assert.equal((geometry.wall.top - state.cameraY) * state.cameraZoom, 25, 'La cima entra completa en el encuadre');
  assert.equal((GROUND - state.cameraY) * state.cameraZoom, 605, 'La base también permanece visible');
});

test('la serpiente baja la cabeza y eleva al conejo pequeño manteniendo la montaña completa', () => {
  const state = reachScene('serpiente');
  tick(state, {}, MOUNTAIN_REVEAL_DURATION + DT);
  assert.equal(state.snakePhase, 'coiled');
  assert.equal(state.cameraY, -650);
  const liftX = state.x;
  pulse(state);
  assert.equal(state.snakePhase, 'lowering');
  assert.equal(state.helped, true);
  assert.equal(state.lifting, false);
  tick(state, {}, SNAKE_HELP_DURATION * SNAKE_LOWERING_PROGRESS - 0.1);
  assert.equal(state.y, GROUND, 'No eleva antes de que la cabeza llegue al conejo');
  assert.equal(state.assistY, GROUND);
  assert.equal(state.snakePhase, 'lowering');
  tick(state, {}, 0.7);
  assert.equal(state.snakePhase, 'lifting');
  assert.equal(state.lifting, true);
  assert.ok(state.y < GROUND && state.y > currentGeometry(state).liftY);
  assert.equal(state.x, liftX, 'La ayuda conserva la posición horizontal');
  assert.ok(state.cameraY < -650 && state.cameraY > -820, 'La cámara asciende suavemente con la elevación');
  const cameraMidpoint = state.cameraY;
  assert.equal(state.cameraZoom, 0.5);
  tick(state, {}, 1.8);
  assert.equal(state.snakePhase, 'resting');
  assert.equal(state.helpProgress, 1);
  assert.equal(state.y, -600);
  assert.equal(state.cameraY, -820);
  assert.ok(state.cameraY < cameraMidpoint);
  assert.equal(state.cameraX, -1000);
  assert.equal(state.cameraZoom, 0.5);
  assert.ok((state.y - state.cameraY) * state.cameraZoom >= 100, 'La cima deja margen para las orejas y la cabeza');
  assert.ok((GROUND - state.cameraY) * state.cameraZoom <= HEIGHT, 'La base de la montaña sigue dentro del encuadre');
  go(state, 1200);
  assert.equal(state.solved, true);
  assert.equal(state.y, -600);
  assert.equal(state.grounded, true);
  leave(state);
  assert.equal(sceneId(state), 'zanahoria');
  assert.equal(state.y, GROUND);
  assert.equal(state.cameraY, 0);
  assert.equal(state.cameraZoom, 1);
  assert.equal(state.snakePhase, 'coiled');
  assert.deepEqual(state.completed, SCENES.slice(0, SCENE_IDS.zanahoria).map(scene => scene.id));
});

test('avanzar durante la ayuda de la serpiente espera la cima sin flotar ni atravesar la pared', () => {
  const state = reachScene('serpiente');
  tick(state, {}, MOUNTAIN_REVEAL_DURATION + DT);
  pulse(state, 'action', RIGHT);
  go(state, 826);
  assert.equal(state.helped, true);
  assert.equal(state.solved, false);
  assert.ok(state.y > currentGeometry(state).wall.top);
  until(state, current => current.snakePhase === 'resting', RIGHT);
  assert.ok(state.x >= 826 && state.x < 850 + RADIUS);
  assert.equal(state.y, currentGeometry(state).wall.top);
  assert.equal(state.grounded, true);
  go(state, 1050);
  assert.equal(state.solved, true);
  assert.equal(state.y, -600);
  assert.equal(state.grounded, true);
  assert.equal(state.resetCount, 0);
});

test('el conejo marrón aparece al acercarse el blanco y se lleva la única zanahoria', () => {
  const state = reachScene('zanahoria');
  const geometry = currentGeometry(state);
  assert.equal(geometry.carrotX, 900);
  assert.equal(SCENES[state.scene].helper, null);
  assert.equal(state.carrotPhase, 'planted');
  assert.equal(state.carrotTaken, false);
  assert.equal(state.friendX, 1340);
  go(state, 620);
  tick(state, {}, 0.3);
  assert.equal(state.carrotPhase, 'planted', 'El amigo espera fuera mientras el blanco está lejos');
  go(state, 660);
  assert.equal(state.carrotPhase, 'approaching');
  assert.ok(state.friendX < 1340 && state.friendX > 900);
  assert.equal(state.friendFacing, -1);
  until(state, current => current.carrotPhase === 'plucking', RIGHT);
  assert.equal(state.friendX, geometry.carrotX);
  assert.equal(state.carrotTaken, false, 'La zanahoria sigue plantada durante el gesto de cogerla');
  assert.ok(state.x <= geometry.carrotX - 75, 'El blanco no adelanta el arranque');
  tick(state, {}, CARROT_PLUCK_DURATION / 2);
  assert.equal(state.carrotPhase, 'plucking');
  until(state, current => current.carrotPhase === 'retreating', {});
  assert.equal(state.carrotTaken, true, 'La zanahoria pasa una sola vez de la tierra al amigo');
  assert.equal(state.friendFacing, 1);
  const retreatStart = state.friendX;
  tick(state, { left: true }, 0.3);
  assert.ok(state.friendX > retreatStart);
  until(state, current => current.carrotPhase === 'waiting', {});
  assert.equal(state.friendX, 1080);
  assert.equal(state.friendFacing, -1);
  const waitingX = state.x;
  tick(state, {}, 2);
  assert.equal(sceneId(state), 'zanahoria', 'El amigo espera hasta que el blanco llegue a su lado');
  assert.equal(state.friendX, 1080);
  assert.equal(state.carrotTaken, true);
  assert.ok(state.x >= waitingX);
  assert.equal(state.solved, false);
  until(state, current => sceneId(current) === 'conejo', RIGHT);
  assert.ok(state.x >= 990 && state.x < 995, 'El encuentro sucede junto al amigo, sin volver al inicio');
  assert.equal(state.y, GROUND);
  assert.equal(state.friendX, 1080);
  assert.equal(state.friendGreeted, true);
  assert.equal(state.carrotPhase, 'together');
  assert.equal(state.carrotTaken, true);
  assert.equal(state.transition, 0);
  assert.equal(state.sceneTime, 0);
  assert.ok(state.completed.includes('zanahoria'));
});

test('el encuentro conserva postura y trayectoria si el blanco llega saltando', () => {
  const state = reachScene('zanahoria');
  until(state, current => current.carrotPhase === 'waiting', RIGHT);
  go(state, 900);
  pulse(state, 'up', { right: true, down: true });
  const takeoffX = state.jumpOriginX;
  const walkBefore = state.walkTime;
  assert.equal(state.grounded, false);
  assert.equal(state.ducking, true);
  until(state, current => sceneId(current) === 'conejo', { right: true, down: true });
  assert.equal(state.grounded, false, 'Cambiar el hito narrativo no crea un apoyo en el aire');
  assert.equal(state.ducking, true);
  assert.ok(state.walkTime > walkBefore, 'La animación de caminar conserva su fase');
  assert.equal(state.jumped, true);
  assert.equal(state.jumpOriginX, takeoffX);
  assert.ok(state.y < GROUND);
  const airborneVelocity = state.vy;
  pulse(state, 'action', { down: true });
  assert.ok(state.vy > airborneVelocity, 'Espacio aplica gravedad, sin iniciar un segundo salto aéreo');
  assert.equal(state.grounded, false);
  assert.equal(state.jumpOriginX, takeoffX);
  until(state, current => current.grounded, {});
  assert.equal(state.y, GROUND);
  assert.equal(sceneId(state), 'conejo');
});

test('acercarse al amigo inicia el paseo conjunto y solo llegar juntos al borde termina el cuento', () => {
  const state = reachScene('conejo');
  assert.equal(state.friendGreeted, true);
  assert.equal(state.mode, 'playing', 'El encuentro no salta directamente al huerto');
  assert.equal(state.completed.length, SCENES.length - 1);
  const offset = state.friendX - state.x;
  const encounterX = state.x;
  tick(state, {}, 0.3);
  assert.equal(state.mode, 'playing');
  tick(state, { left: true }, 0.5);
  assert.ok(state.x < encounterX);
  assert.equal(state.friendFacing, -1);
  assert.ok(Math.abs(state.friendX - state.x - offset) < 1e-8, 'Ambos retroceden juntos');
  until(state, current => current.mode === 'ending', RIGHT);
  assert.equal(state.mode, 'ending');
  assert.equal(state.friendFacing, 1);
  assert.deepEqual(state.completed, SCENES.map(scene => scene.id));
  assert.match(getHint(state), /Llegaste/);
  const ending = structuredClone(state);
  tick(state, { action: true, right: true }, 2);
  assert.deepEqual(state, ending, 'El final no duplica completados ni deja seguir caminando');
});

test('reiniciar borra el progreso, la ayuda y los estados transitorios', () => {
  const state = reachScene('conejo');
  solveCurrent(state);
  assert.equal(state.friendGreeted, true);
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
