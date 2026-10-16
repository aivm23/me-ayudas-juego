import { createGame, startGame, restartGame, updateGame, getHint, SCENES } from './engine.js';
import { createRenderer } from './art.js';

const $ = (selector) => document.querySelector(selector);
const state = createGame();
const canvas = $('#game-canvas');
const renderer = createRenderer(canvas);
const held = new Set();
const pulses = new Set();
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
let mapOpen = false;
let lastTime = 0;
let lastUI = '';
let lastHint = '';
let mapReturnFocus = null;

const controls = new Map([
  ['ArrowLeft', 'left'], ['ArrowRight', 'right'],
  ['ArrowUp', 'up'], ['ArrowDown', 'down'], ['Space', 'action'],
]);

function clearInput() {
  held.clear();
  pulses.clear();
  document.querySelectorAll('.is-held').forEach((button) => button.classList.remove('is-held'));
}

function begin() {
  startGame(state);
  paused = false;
  mapOpen = false;
  clearInput();
  updateUI(true);
  $('#play-area').focus({ preventScroll: true });
}

function setPaused(value, { focus = true } = {}) {
  if (state.mode !== 'playing' || mapOpen) return;
  paused = value;
  clearInput();
  updateUI(true);
  if (focus) {
    if (paused) $('#resume-button').focus({ preventScroll: true });
    else $('#play-area').focus({ preventScroll: true });
  }
}

function showMap() {
  if (state.mode === 'title' || mapOpen) return;
  mapReturnFocus = document.activeElement;
  mapOpen = true;
  clearInput();
  updateUI(true);
  $('#close-map').focus({ preventScroll: true });
}

function closeMap() {
  mapOpen = false;
  clearInput();
  updateUI(true);
  const target = paused ? $('#resume-button') : state.mode === 'playing' ? $('#play-area') : mapReturnFocus;
  (target?.isConnected ? target : $('#play-area')).focus({ preventScroll: true });
}

function restart() {
  restartGame(state);
  paused = false;
  mapOpen = false;
  clearInput();
  updateUI(true);
  $('#play-area').focus({ preventScroll: true });
}

$('#start-button').addEventListener('click', begin);
$('#pause-button').addEventListener('click', () => setPaused(!paused));
$('#resume-button').addEventListener('click', () => setPaused(false));
$('#map-button').addEventListener('click', showMap);
$('#ending-map').addEventListener('click', showMap);
$('#close-map').addEventListener('click', closeMap);
$('#again-button').addEventListener('click', restart);
$('#restart-button').addEventListener('click', () => {
  clearInput();
  $('#restart-dialog').showModal();
  $('#cancel-restart').focus();
});
$('#cancel-restart').addEventListener('click', () => $('#restart-dialog').close());
$('#confirm-restart').addEventListener('click', () => {
  $('#restart-dialog').close();
  restart();
});
$('.wordmark').addEventListener('click', (event) => {
  if (state.mode !== 'title') {
    event.preventDefault();
    if (mapOpen) closeMap();
    if (state.mode === 'playing') {
      setPaused(true);
      $('#restart-dialog').showModal();
      $('#cancel-restart').focus();
    } else restart();
  }
});

window.addEventListener('keydown', (event) => {
  if ($('#restart-dialog').open) return;
  const control = controls.get(event.code);
  if (event.code === 'Escape') {
    event.preventDefault();
    if (event.repeat) return;
    if (mapOpen) closeMap();
    else setPaused(!paused);
    return;
  }
  if (!control) return;
  // Space keeps its native behavior on focused interface buttons.
  if (event.code === 'Space' && document.activeElement instanceof HTMLButtonElement) return;
  event.preventDefault();
  if (event.repeat) return;
  if (mapOpen) return;
  if (state.mode === 'title') {
    if (control === 'action' || control === 'up') begin();
    return;
  }
  if (paused) {
    if (control === 'action') setPaused(false);
    return;
  }
  if (state.mode === 'ending') return;
  held.add(control);
  if (control === 'action' || control === 'up') pulses.add(control);
});
window.addEventListener('keyup', (event) => {
  const control = controls.get(event.code);
  if (control) {
    held.delete(control);
    const nativeButtonSpace = event.code === 'Space' && document.activeElement instanceof HTMLButtonElement;
    if (!$('#restart-dialog').open && !nativeButtonSpace) event.preventDefault();
  }
});

for (const button of document.querySelectorAll('[data-control]')) {
  const control = button.dataset.control;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (state.mode === 'title') {
      if (control === 'action') begin();
      return;
    }
    if (paused || mapOpen || state.mode !== 'playing') return;
    button.setPointerCapture(event.pointerId);
    held.add(control);
    if (control === 'action') pulses.add('action');
    button.classList.add('is-held');
  });
  const release = () => {
    held.delete(control);
    button.classList.remove('is-held');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  // Native click from keyboard or assistive technology has no pointerdown.
  button.addEventListener('click', (event) => {
    if (event.detail !== 0) return;
    if (state.mode === 'title' && control === 'action') begin();
    else if (!paused && !mapOpen && state.mode === 'playing') {
      if (control === 'action') pulses.add(control);
      else {
        held.add(control);
        window.setTimeout(() => held.delete(control), 160);
      }
    }
  });
}

window.addEventListener('blur', () => {
  clearInput();
  if (state.mode === 'playing' && !mapOpen) setPaused(true, { focus: false });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInput();
    if (state.mode === 'playing' && !mapOpen) setPaused(true, { focus: false });
  }
});

// A small focus boundary keeps keyboard navigation inside overlays.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || $('#restart-dialog').open) return;
  const panel = mapOpen ? $('#map-panel') : paused ? $('#pause-panel') : null;
  if (!panel) return;
  const items = [...panel.querySelectorAll('button:not(:disabled)')];
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});

function updateUI(force = false) {
  const mode = mapOpen ? 'map' : paused ? 'paused' : state.mode;
  const scene = SCENES[state.scene];
  const key = `${mode}:${state.scene}:${state.helped}:${state.completed.length}:${state.elephantRevealed}:${state.friendGreeted}:${state.hiddenInReeds}`;
  if (force || key !== lastUI) {
    lastUI = key;
    $('#intro').hidden = state.mode !== 'title' || mapOpen;
    $('#scene-label').hidden = state.mode !== 'playing' || paused || mapOpen;
    $('#pause-panel').hidden = !paused || mapOpen;
    $('#map-panel').hidden = !mapOpen;
    $('#ending-panel').hidden = state.mode !== 'ending' || mapOpen;
    $('#map-button').disabled = state.mode === 'title' || mapOpen;
    $('#pause-button').disabled = state.mode !== 'playing' || mapOpen;
    $('#pause-button').setAttribute('aria-label', paused ? 'Continuar' : 'Pausar');
    $('#pause-button span').textContent = paused ? 'Continuar' : 'Pausar';
    $('#pause-button').setAttribute('aria-pressed', String(paused));
    $('[data-testid="scene-title"]').textContent = scene.title;
    $('#chapter-number').textContent = `Un paso más · ${state.scene + 1} de ${SCENES.length}`;
    $('#page-number').textContent = state.mode === 'title' ? 'Un paso, una historia' : state.mode === 'ending' ? 'Fin… y un nuevo comienzo' : `${state.scene + 1} / ${SCENES.length}`;
    $('.spread').classList.toggle('is-night', mapOpen || state.mode === 'title' || state.mode === 'ending' || scene.id === 'madriguera' || scene.id === 'conejo');
    $('.spread').classList.toggle('is-map', mapOpen);
    canvas.setAttribute('aria-label', mapOpen ? 'Mapa panorámico del recorrido completo: madriguera, piedras, animales, ríos, juncos, montaña y huerto.' : state.mode === 'title' ? 'Una noche estrellada. Las orejas de un conejo blanco asoman en una madriguera bajo la luna.' : state.mode === 'ending' ? 'Huerto de zanahorias bajo un cielo nocturno. Las cuatro orejas de los dos amigos asoman juntas en una madriguera.' : `${scene.title}. ${scene.description}`);
    $('#map-description').textContent = state.completed.length === SCENES.length ? '¡Lo recorrimos entero! Gracias por acompañarnos.' : `Hemos recorrido ${state.completed.length} de ${SCENES.length} tramos. Cada amigo nos ayuda a seguir.`;
    $('#map-legend').style.setProperty('--scene-count', SCENES.length);
    $('#map-legend').replaceChildren(...SCENES.map((item, index) => {
      const li = document.createElement('li');
      li.textContent = item.mapLabel || item.title;
      li.dataset.number = String(index + 1);
      if (state.completed.includes(item.id)) li.classList.add('visited');
      else if (index === state.scene) li.classList.add('current');
      if (index === state.scene) li.setAttribute('aria-current', 'step');
      return li;
    }));
    document.querySelectorAll('[data-control]').forEach((button) => {
      button.disabled = paused || mapOpen || state.mode === 'ending';
    });
  }
  const hint = mapOpen ? 'Este es nuestro camino. Cierra el mapa para seguir.' : paused ? 'Descansa un momento. Pulsa espacio para continuar.' : state.mode === 'title' ? 'Pulsa espacio para abrir el cuento.' : state.mode === 'ending' ? 'A veces, pedir ayuda es el comienzo de una gran amistad.' : getHint(state);
  if (hint !== lastHint) {
    $('#hint').textContent = hint;
    lastHint = hint;
  }
  const storyLines = {
    madriguera: state.emergeProgress === 1 ? '¡Vamos!' : '',
    piedra: '¡Vamos!', tortuga: '¿Me ayudas, tortuga?',
    zorro: '¿Hay un camino por debajo?',
    elefante: state.elephantRevealed ? '¡Hola, elefante!' : '¡Qué dos rocas tan grandes!',
    charco: '¡Un charco!', jirafa: '¡Holaaaaa!', cocodrilo: 'Zzz…',
    juncos: '', pared: '¿Y ahora…?',
    serpiente: state.snakePhase === 'lowering' ? '¿Me ayudas?' : '¡Hola, serpiente! ¿Puedes oírme?',
    zanahoria: state.carrotTaken ? '¡Eh! ¡La zanahoria!' : '¡Una zanahoria!', conejo: '¡Sígueme, que te ayudo!',
  };
  const nearby = state.x > 340 && state.x < 790;
  const helping = state.helped && state.snakePhase !== 'lowering';
  const line = helping ? (state.helpProgress < 1 ? `¡Gracias, ${scene.helper}!` : '') : storyLines[scene.id];
  const message = state.mode === 'playing' && !paused && !mapOpen && nearby && !state.solved && !state.hiddenInReeds ? line : '';
  if ($('#speech').textContent !== message) $('#speech').textContent = message;
  $('#speech').hidden = !message;
  const debug = $('#game-state');
  debug.dataset.mode = mode;
  debug.dataset.scene = String(state.scene);
  debug.dataset.sceneId = scene.id;
  debug.dataset.x = String(Math.round(state.x));
  debug.dataset.y = String(Math.round(state.y));
  debug.dataset.helped = String(state.helped);
  debug.dataset.ducking = String(state.ducking);
  debug.dataset.hiddenInReeds = String(Boolean(state.hiddenInReeds));
  debug.dataset.elephantRevealed = String(Boolean(state.elephantRevealed));
  debug.dataset.revealProgress = String(state.revealProgress || 0);
  debug.dataset.snakePhase = state.snakePhase || 'coiled';
  debug.dataset.friendGreeted = String(Boolean(state.friendGreeted));
  debug.dataset.cameraX = String(Math.round(state.cameraX || 0));
  debug.dataset.cameraY = String(Math.round(state.cameraY || 0));
  debug.dataset.cameraZoom = String(state.cameraZoom ?? 1);
  debug.dataset.revealCameraProgress = String(state.revealCameraProgress ?? 0);
  debug.dataset.carrotPhase = state.carrotPhase || 'planted';
  debug.dataset.carrotTaken = String(Boolean(state.carrotTaken));
  debug.dataset.friendX = String(Math.round(state.friendX ?? 1340));
  debug.dataset.emergeProgress = String(state.emergeProgress || 0);
}

function frame(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 1 / 30) : 0;
  lastTime = timestamp;
  if (!paused && !mapOpen && state.mode === 'playing' && !$('#restart-dialog').open) {
    updateGame(state, {
      left: held.has('left'), right: held.has('right'), down: held.has('down'),
      up: pulses.has('up'), action: pulses.has('action'),
    }, dt);
  }
  pulses.clear();
  updateUI();
  renderer.render(state, { reducedMotion: motion.matches || paused, map: mapOpen });
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => renderer.resize());
renderer.resize();
updateUI(true);
requestAnimationFrame(frame);
