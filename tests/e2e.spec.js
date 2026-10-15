import { test, expect } from '@playwright/test';

const state = (page) => page.getByTestId('game-state');
const number = async (page, name) => Number(await state(page).getAttribute(`data-${name}`));

async function start(page, keyboard = true, focusButton = false) {
  // La copia publicada se sirve desde una subcarpeta para comprobar sus rutas.
  await page.goto('./');
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Empezar el cuento', exact: true })).toBeVisible();
  if (focusButton) await page.getByRole('button', { name: 'Empezar el cuento', exact: true }).focus();
  if (keyboard) await page.keyboard.press('Space');
  else await page.getByRole('button', { name: 'Empezar el cuento', exact: true }).click();
  await expect(state(page)).toHaveAttribute('data-mode', 'playing');
}

async function walkTo(page, target, { down = false, timeout = 8_000 } = {}) {
  const scene = await number(page, 'scene');
  if (down) await page.keyboard.down('ArrowDown');
  await page.keyboard.down('ArrowRight');
  try {
    await expect.poll(async () => {
      if (await number(page, 'scene') !== scene) return true;
      return (await number(page, 'x')) >= target;
    }, { timeout, intervals: [20, 30, 50] }).toBe(true);
  } finally {
    await page.keyboard.up('ArrowRight');
    if (down) await page.keyboard.up('ArrowDown');
  }
}

async function jumpTo(page, target) {
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('ArrowUp');
  try {
    await expect.poll(() => number(page, 'x'), { timeout: 5_000, intervals: [20, 30] }).toBeGreaterThanOrEqual(target);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
}

async function waitForGround(page, ground = 560) {
  await expect.poll(() => number(page, 'y'), { intervals: [30, 50] }).toBeCloseTo(ground, 0);
}

async function askForHelp(page, x, liftY) {
  await walkTo(page, x);
  await page.keyboard.press('Space');
  await expect(state(page)).toHaveAttribute('data-helped', 'true');
  if (liftY !== undefined) await waitForGround(page, liftY);
}

async function leaveScene(page, next, options) {
  await walkTo(page, 1260, options);
  await expect(state(page)).toHaveAttribute('data-scene', String(next));
}

test('teclado, salto, pausa, mapa y reinicio accesible', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page, true, true);
  await expect(page.getByTestId('scene-title')).not.toBeEmpty();
  await expect(page.getByTestId('hint')).not.toBeEmpty();
  const initialX = await number(page, 'x');
  await walkTo(page, initialX + 100);
  await page.keyboard.press('Space');
  await expect.poll(() => number(page, 'y')).toBeLessThan(540);
  await waitForGround(page);
  await page.keyboard.down('ArrowDown');
  await expect(state(page)).toHaveAttribute('data-ducking', 'true');
  await page.keyboard.up('ArrowDown');
  await expect(state(page)).toHaveAttribute('data-ducking', 'false');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const pausedX = await number(page, 'x');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  expect(await number(page, 'x')).toBe(pausedX);
  await page.locator('#pause-panel').getByRole('button', { name: 'Continuar', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(state(page)).toHaveAttribute('data-mode', 'playing');

  await page.getByRole('button', { name: 'Ver el mapa', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cerrar el mapa', exact: true })).toBeVisible();
  const mapX = await number(page, 'x');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  expect(await number(page, 'x')).toBe(mapX);
  await page.getByRole('button', { name: 'Cerrar el mapa', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('button', { name: 'Volver al principio', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '¿Volvemos al principio?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir jugando', exact: true }).click();
  expect(await number(page, 'x')).toBe(mapX);
  await page.getByRole('button', { name: 'Volver al principio', exact: true }).click();
  await page.getByRole('button', { name: 'Empezar de nuevo', exact: true }).click();
  await expect(state(page)).toHaveAttribute('data-scene', '0');
  await expect(state(page)).toHaveAttribute('data-mode', 'playing');
  expect(await number(page, 'x')).toBeLessThanOrEqual(120);
  expect(errors).toEqual([]);
});

test('pantalla móvil: lienzo ajustado, controles visibles y ningún desbordamiento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, false);
  const bounds = await page.locator('#game-canvas').boundingBox();
  expect(bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.height).toBeGreaterThan(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const right = page.getByRole('button', { name: 'Mover a la derecha', exact: true });
  await expect(right).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mover a la izquierda', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agacharse', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saltar o pedir ayuda', exact: true })).toBeVisible();
  const initialX = await number(page, 'x');
  const button = await right.boundingBox();
  await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
  await page.mouse.down();
  try {
    await expect.poll(() => number(page, 'x')).toBeGreaterThan(initialX + 50);
  } finally {
    await page.mouse.up();
  }
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole('button', { name: 'Ver el mapa', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar el mapa', exact: true }).click();
});

test('recorre las diez escenas con flechas y espacio hasta el final', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'El recorrido completo se prueba en Chromium; los tres motores cubren la interfaz.');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  // Piedra: la primera prueba enseña a saltar sin ayuda.
  await walkTo(page, 520);
  await jumpTo(page, 750);
  await leaveScene(page, 1);
  // Tortuga: su caparazón permite alcanzar la roca alta.
  await expect(state(page)).toHaveAttribute('data-helped', 'false');
  await askForHelp(page, 500, 455);
  await walkTo(page, 620);
  await jumpTo(page, 835);
  await leaveScene(page, 2);
  // Zorro: abrir el paso y atravesarlo agachado.
  await askForHelp(page, 470);
  await walkTo(page, 900, { down: true });
  await leaveScene(page, 3);
  // Elefante: esperar su ayuda y caminar sobre la roca.
  await askForHelp(page, 490, 318);
  await leaveScene(page, 4);
  // Charco: salto desde la orilla, con posibilidad de reintentar.
  await walkTo(page, 500);
  await jumpTo(page, 750);
  await leaveScene(page, 5);
  // Jirafa y cocodrilo forman puentes al pedir ayuda.
  await askForHelp(page, 470);
  await leaveScene(page, 6);
  await askForHelp(page, 470);
  await leaveScene(page, 7);
  // Juncos: mantener abajo durante todo el paso.
  await leaveScene(page, 8, { down: true });
  // Serpiente: subir hasta la pared y recorrerla por arriba.
  await askForHelp(page, 550, 300);
  await leaveScene(page, 9);
  // El cuento termina al saludar al conejo del huerto.
  await walkTo(page, 930);
  await page.keyboard.press('Space');
  await expect(state(page)).toHaveAttribute('data-mode', 'ending');
  await expect(page.getByRole('heading', { name: '¡Un nuevo amigo!', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver nuestro camino', exact: true }).click();
  await expect(page.locator('#map-legend li.visited')).toHaveCount(10);
  await expect(page.locator('#map-description')).toContainText('entero');
  expect(errors).toEqual([]);
});
