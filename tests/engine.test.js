import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIDTH, HEIGHT, GROUND, RADIUS, SCENES, SCENE_GEOMETRY, SCENE_IDS,
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
      go(state, 535);
      pulse(state);
      tick(state, {}, 3.2);
      go(state, 1050);
      break;
    case 'zanahoria':
      go(state, 1000);
      break;
    case 'conejo':
      go(state, 910);
      pulse(state);
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
      assert.ok(state.completed.includes('pared'));
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
  assert.equal(state.x, 100);
  assert.equal(state.y, GROUND);
  assert.deepEqual(state.completed, []);
  assert.match(getHint(state), /piedra/);
});

test('las doce escenas separan pared, serpiente, zanahoria y encuentro antes del huerto final', () => {
  assert.deepEqual(SCENES.map(scene => scene.id), ['piedra', 'tortuga', 'zorro', 'elefante', 'charco', 'jirafa', 'cocodrilo', 'juncos', 'pared', 'serpiente', 'zanahoria', 'conejo']);
  assert.equal(SCENE_GEOMETRY.length, SCENES.length);
  assert.ok(SCENES.every(scene => typeof scene.mapLabel === 'string' && scene.mapLabel.length > 0));
  assert.equal(SCENE_GEOMETRY[SCENE_IDS.pared].wall.top, -1200);
  assert.equal(SCENE_GEOMETRY[SCENE_IDS.serpiente].wall.top, -220);
  assert.equal(SCENES.some(scene => scene.id === 'huerto'), false);
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

test('la pared es un paso propio que solo descubre la serpiente al mirar arriba de cerca', () => {
  const state = reachScene('pared');
  assert.equal(SCENES[state.scene].helper, null);
  assert.equal(currentGeometry(state).tree, undefined);
  pulse(state);
  tick(state, RIGHT, 4);
  assert.equal(sceneId(state), 'pared');
  assert.equal(state.x, currentGeometry(state).wall.x - RADIUS);
  assert.equal(state.solved, false);
  assert.equal(state.helped, false);
  pulse(state);
  assert.equal(sceneId(state), 'serpiente');
  assert.ok(state.completed.includes('pared'));
  assert.equal(state.x, 100, 'La acción se consume una sola vez al cambiar de pantalla');
  assert.equal(state.helped, false);
  assert.equal(state.snakePhase, 'coiled');
});

test('la serpiente baja la cabeza, eleva desde la rama y la cámara revela la cima real', () => {
  const state = reachScene('serpiente');
  assert.equal(state.snakePhase, 'coiled');
  assert.equal(state.cameraY, 0);
  tick(state, RIGHT, 4);
  assert.equal(state.x, 826);
  assert.equal(state.solved, false);
  until(state, current => current.x <= 550, { left: true });
  tick(state, {}, 0.2);
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
  tick(state, {}, 0.5);
  assert.ok(state.cameraY < 0);
  assert.equal(state.cameraY, Math.min(0, state.y - 340));
  tick(state, {}, 1.3);
  assert.equal(state.snakePhase, 'resting');
  assert.equal(state.helpProgress, 1);
  assert.equal(state.y, -220);
  assert.equal(state.cameraY, -560);
  go(state, 1200);
  assert.equal(state.solved, true);
  assert.equal(state.y, -220);
  assert.equal(state.grounded, true);
  leave(state);
  assert.equal(sceneId(state), 'zanahoria');
  assert.equal(state.y, GROUND);
  assert.equal(state.cameraY, 0);
  assert.equal(state.snakePhase, 'coiled');
  assert.deepEqual(state.completed, SCENES.slice(0, SCENE_IDS.zanahoria).map(scene => scene.id));
});

test('avanzar durante la ayuda de la serpiente espera la cima sin flotar ni atravesar la pared', () => {
  const state = reachScene('serpiente');
  go(state, 535);
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
  assert.equal(state.y, -220);
  assert.equal(state.grounded, true);
  assert.equal(state.resetCount, 0);
});

test('la zanahoria solitaria precede al conejo y se supera caminando sin recogerla', () => {
  const state = reachScene('zanahoria');
  assert.equal(currentGeometry(state).carrotX, 900);
  assert.equal(currentGeometry(state).friendX, undefined);
  assert.equal(SCENES[state.scene].helper, null);
  go(state, 920);
  assert.equal(state.solved, false);
  go(state, 960);
  assert.equal(state.solved, true);
  assert.equal(Object.hasOwn(state, 'carrots'), false);
  leave(state);
  assert.equal(sceneId(state), 'conejo');
  assert.equal(currentGeometry(state).carrotX, undefined);
  assert.equal(state.friendGreeted, false);
});

test('el recorrido completo requiere saludar al conejo y caminar juntos para terminar las doce pruebas', () => {
  const state = reachScene('conejo');
  pulse(state);
  assert.equal(state.mode, 'playing');
  tick(state, RIGHT, 5);
  assert.equal(state.mode, 'playing', 'Llegar al borde no sustituye saludar al amigo');
  assert.equal(sceneId(state), 'conejo');
  assert.equal(state.friendGreeted, false);
  until(state, current => current.x <= 1010, { left: true });
  pulse(state);
  assert.equal(state.friendGreeted, true);
  assert.equal(state.mode, 'playing', 'Saludar no salta directamente al huerto');
  assert.equal(state.completed.length, SCENES.length - 1);
  tick(state, {}, 0.3);
  assert.equal(state.mode, 'playing');
  until(state, current => current.mode === 'ending', RIGHT);
  assert.equal(state.mode, 'ending');
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
