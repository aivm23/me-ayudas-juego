import { WIDTH, HEIGHT, GROUND, SCENES, SCENE_GEOMETRY, tunnelFloorAt } from './engine.js';

// Todas las formas de este libro se pintan aquí: no hay imágenes descargadas,
// fuentes gráficas ni fotogramas del vídeo incluidos en el juego.
const INK = '#383a36';
const IVORY = '#f6efec';
const CORAL = '#e84560';
const TAUPE = '#a69b87';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function surface(width = WIDTH, height = HEIGHT) {
  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;
  return result;
}

function shape(ctx, definition, fill, stroke, lineWidth = 1) {
  const path = definition instanceof Path2D ? definition : new Path2D(definition);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke(path);
  }
  return path;
}

function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, definition, color, width = 1) {
  shape(ctx, definition, null, color, width);
}

function makePaper() {
  const paper = surface(256, 256);
  const ctx = paper.getContext('2d');
  const rng = random(9187);
  const pixels = ctx.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const light = rng() > 0.49;
    pixels.data[i] = light ? 255 : 43;
    pixels.data[i + 1] = light ? 252 : 45;
    pixels.data[i + 2] = light ? 241 : 42;
    pixels.data[i + 3] = Math.floor(rng() * 14);
  }
  ctx.putImageData(pixels, 0, 0);
  for (let i = 0; i < 650; i += 1) {
    const x = rng() * 256;
    const y = rng() * 256;
    ctx.strokeStyle = rng() > 0.5 ? '#fff9eb10' : '#4140340c';
    ctx.lineWidth = rng() * 0.8 + 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng() * 12, y + rng() * 1.5);
    ctx.stroke();
  }
  return paper;
}

function paint(ctx, definition, fill, bounds, paper, seed = 3, strength = 1) {
  const path = shape(ctx, definition, fill);
  ctx.save();
  ctx.clip(path);
  const rng = random(seed);
  const [x, y, w, h] = bounds;
  for (let i = 0; i < 17; i += 1) {
    const py = y + rng() * h;
    const px = x + rng() * w;
    ctx.strokeStyle = i % 3 ? `rgba(35,35,31,${0.014 * strength})` : `rgba(255,247,229,${0.034 * strength})`;
    ctx.lineWidth = rng() * Math.max(h * 0.15, 2) + 1;
    ctx.beginPath();
    ctx.moveTo(px - w * 0.3, py);
    ctx.bezierCurveTo(px, py - rng() * h * 0.07, px + w * 0.3, py + h * 0.05, px + w * 0.7, py - h * 0.025);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = paper;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  return path;
}

function grass(ctx, x, y, size = 1, color = '#686e49') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.lineCap = 'round';
  line(ctx, 'M0 0 Q-2 -18 -7 -28 M1 0 Q1 -25 8 -38 M2 -1 Q9 -16 12 -19', color, 1.45);
  ctx.restore();
}

function cloud(ctx, x, y, width, height, paper, tint = '#edf0e9') {
  ctx.save();
  ctx.translate(x, y);
  const p = new Path2D(`M${-width / 2} 2 C${-width * 0.55} ${-height * 0.48},${-width * 0.17} ${-height * 0.63},${width * 0.12} ${-height * 0.52} C${width * 0.41} ${-height * 0.6},${width * 0.56} ${-height * 0.26},${width * 0.5} 7 C${width * 0.48} ${height * 0.42},${-width * 0.22} ${height * 0.55},${-width * 0.46} ${height * 0.2} Z`);
  const gradient = ctx.createLinearGradient(0, -height, 0, height);
  gradient.addColorStop(0, tint);
  gradient.addColorStop(0.55, tint);
  gradient.addColorStop(1, '#b5c5bf00');
  ctx.filter = 'blur(2.5px)';
  paint(ctx, p, gradient, [-width * 0.6, -height, width * 1.2, height * 2], paper, 5, 0.3);
  ctx.restore();
}

function rock(ctx, x, width, top, paper, seed = 8, base = GROUND) {
  const height = base - top;
  const path = new Path2D(`M${x + width * 0.17} ${base} C${x - width * 0.02} ${base - height * 0.09},${x - width * 0.07} ${top + height * 0.54},${x + width * 0.04} ${top + height * 0.36} C${x + width * 0.14} ${top + height * 0.16},${x + width * 0.35} ${top - 3},${x + width * 0.5} ${top} C${x + width * 0.71} ${top - 1},${x + width * 0.91} ${top + height * 0.18},${x + width * 0.97} ${top + height * 0.39} C${x + width * 1.1} ${top + height * 0.68},${x + width * 0.99} ${base - height * 0.08},${x + width * 0.81} ${base - 1} Q${x + width * 0.5} ${base + 5},${x + width * 0.17} ${base} Z`);
  const gradient = ctx.createLinearGradient(x, top, x + width * 0.45, base + 15);
  gradient.addColorStop(0, '#b4aa98');
  gradient.addColorStop(0.45, TAUPE);
  gradient.addColorStop(0.8, '#968d7b');
  gradient.addColorStop(1, '#756c5f');
  paint(ctx, path, gradient, [x - width * 0.1, top - 3, width * 1.2, height + 10], paper, seed, 1.7);
  const rng = random(seed + 60);
  ctx.save();
  ctx.clip(path);
  for (let i = 0; i < 15; i += 1) {
    const xx = x + rng() * width;
    const yy = top + rng() * height;
    ctx.fillStyle = i % 2 ? '#e9dfca16' : '#5c53440b';
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    for (let j = 0; j < 8; j += 1) {
      const a = j * Math.PI / 4;
      ctx.lineTo(xx + Math.cos(a) * (3 + rng() * width * 0.13), yy + Math.sin(a) * (3 + rng() * height * 0.06));
    }
    ctx.fill();
  }
  line(ctx, `M${x + width * 0.7} ${top + height * 0.13} l-5 8 6 5 -3 7 M${x + width * 0.15} ${top + height * 0.7} l8 -3 6 4 7 -1`, '#5a554620', 1.3);
  ctx.restore();
  ellipse(ctx, x + width * 0.49, base + 2, width * 0.42, 3, '#453e3819');
}

function ground(ctx, scene, paper, options = {}) {
  const width = options.width || WIDTH;
  const bottom = options.bottom || HEIGHT;
  const id = SCENES[scene]?.id;
  const isDusk = options.ending || ['pared', 'serpiente', 'zanahoria', 'conejo'].includes(id);
  const topColor = options.ending ? '#554741' : options.plateau ? '#a8a499' : ['juncos', 'pared', 'serpiente'].includes(id) ? '#928357' : ['elefante', 'charco', 'jirafa', 'cocodrilo'].includes(id) ? '#8c7252' : '#7e8055';
  const gradient = ctx.createLinearGradient(0, GROUND, 0, bottom);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.32, options.ending ? '#49423a' : options.plateau ? '#aaa69b' : '#8b7c50');
  gradient.addColorStop(1, options.ending ? '#292e2d' : options.plateau ? '#939186' : isDusk ? '#716647' : '#78764b');
  const p = new Path2D(`M0 ${GROUND} C230 ${GROUND - 1},370 ${GROUND + 2},540 ${GROUND} C850 ${GROUND + 2},1070 ${GROUND - 2},${width} ${GROUND} L${width} ${bottom} L0 ${bottom}Z`);
  paint(ctx, p, gradient, [0, GROUND - 3, width, bottom - GROUND + 3], paper, 671 + scene, 1.5);
  const rng = random(719 + scene);
  ctx.save();
  ctx.clip(p);
  for (let i = 0; i < Math.round(90 * width / WIDTH); i += 1) {
    const y = GROUND + 10 + rng() * 150;
    const x = rng() * width;
    ctx.strokeStyle = i % 3 ? '#b5a2690a' : '#3f4f3609';
    ctx.lineWidth = rng() * 12 + 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 30, y - 3, x + 140, y + 5, x + 240 * rng(), y);
    ctx.stroke();
  }
  ctx.restore();
}

function water(ctx, x, end, paper, kind = 'river') {
  const p = new Path2D(`M${x} ${GROUND} C${x + 8} ${GROUND + 14},${x - 4} ${GROUND + 64},${x + 12} 720 L${end - 12} 720 Q${end + 5} ${GROUND + 60},${end} ${GROUND}Z`);
  const gradient = ctx.createLinearGradient(x, GROUND, end, 720);
  gradient.addColorStop(0, '#537f91');
  gradient.addColorStop(0.55, '#709aa4');
  gradient.addColorStop(1, '#86a9ad');
  paint(ctx, p, gradient, [x - 2, GROUND, end - x + 4, 160], paper, 821, 1.4);
  ctx.save();
  ctx.clip(p);
  const rng = random(702);
  for (let i = 0; i < 25; i += 1) {
    const xx = mix(x, end, rng());
    const yy = GROUND + 15 + rng() * 140;
    line(ctx, `M${xx} ${yy} q${10 + rng() * 30} -4 ${25 + rng() * 35} 0`, i % 3 ? '#d0d6c729' : '#2b586035', 1.3);
  }
  if (kind === 'river') {
    for (let i = 0; i < 5; i += 1) {
      ellipse(ctx, end - 27 + Math.sin(i * 3) * 10, 615 + i * 11, 2.8, 2.4, '#e6e9d889');
    }
  }
  ctx.restore();
  // Los bordes abiertos permiten leer de inmediato qué se puede saltar.
  shape(ctx, `M${x - 8} ${GROUND} L${x + 2} ${GROUND} L${x + 12} 720 L${x - 3} 720Z`, '#645b42');
  shape(ctx, `M${end} ${GROUND} L${end + 7} ${GROUND} L${end + 3} 720 L${end - 12} 720Z`, '#6e6349');
}

function rabbit(ctx, x, y, paper, options = {}) {
  const { facing = 1, moving = 0, ducking = false, brown = false, time = 0, airborne = false, scale = 1 } = options;
  const walk = Math.sin(time * 16) * Math.min(1, Math.abs(moving) / 90);
  const lean = airborne ? -0.12 : moving ? -0.045 : 0;
  const coat = brown ? '#af8166' : IVORY;
  const shadow = brown ? '#835d50' : '#dbccce';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  ctx.rotate(lean);
  if (ducking) {
    ctx.scale(1.18, 0.64);
  }
  // La cola, la grupa y la cabeza se solapan como recortes de papel.
  ellipse(ctx, -22, -19, 7, 8, brown ? '#b88a71' : '#efe5e4', -0.3);
  const body = new Path2D('M-19 -7 C-28 -13 -27 -32 -21 -44 C-18 -53 -9 -58 1 -57 C13 -58 23 -51 24 -38 C27 -23 18 -9 9 -4 C1 0 -12 0 -19 -7Z');
  paint(ctx, body, coat, [-28, -60, 56, 62], paper, brown ? 42 : 41, 0.5);
  ellipse(ctx, -12, -3 + walk * 1.3, 9, 4.2, coat, -0.12);
  ellipse(ctx, 10, -2 - walk * 1.3, 8, 3.8, coat, 0.1);
  line(ctx, 'M-5 -20 Q-9 -10 -8 -5 M8 -20 Q5 -10 6 -5', shadow, 1.8);
  ctx.save();
  ctx.translate(5, -54);
  ctx.rotate(ducking ? -1.4 : airborne ? -0.2 : walk * 0.022);
  const ears = new Path2D('M-9 2 C-13 -13 -20 -38 -18 -46 C-17 -51 -13 -51 -10 -46 C-6 -36 -3 -16 -1 -3 L1 -4 C1 -23 2 -47 6 -51 C10 -55 12 -52 12 -46 C12 -33 9 -11 8 2Z');
  paint(ctx, ears, coat, [-22, -56, 38, 62], paper, 46, 0.4);
  line(ctx, 'M-7 -7 Q-12 -29 -14 -44 M4 -7 Q5 -29 8 -46', brown ? '#ce9a8d' : '#dfa9bb', 4.1);
  ctx.restore();
  const face = new Path2D('M-13 -49 C-13 -61 -4 -66 7 -64 C17 -63 24 -57 27 -48 C33 -47 34 -42 29 -39 C22 -35 7 -35 -2 -39 C-8 -42 -12 -44 -13 -49Z');
  paint(ctx, face, coat, [-14, -67, 50, 34], paper, 43, 0.3);
  ellipse(ctx, 17, -53, 1.65, 2.2, INK, -0.12);
  ellipse(ctx, 10, -54.5, 1.05, 1.8, INK, -0.18);
  line(ctx, 'M15 -57 l1 -2 M10 -58 l-1 -2', INK, 0.9);
  shape(ctx, 'M29 -46 L33 -44 L29 -42Z', brown ? '#80534e' : '#b77f8a');
  line(ctx, 'M29 -42 Q27 -38 24 -41', '#7e7374', 0.8);
  ctx.lineCap = 'round';
  line(ctx, 'M24 -46 L42 -49 M25 -43 L44 -43 M24 -40 L40 -36 M5 -46 L-9 -48 M4 -43 L-11 -42', brown ? '#665454' : '#706b6d', 0.85);
  ctx.restore();
}

function turtle(ctx, x, feet, paper, progress = 0, time = 0) {
  ctx.save();
  ctx.translate(x, feet);
  const step = Math.sin(time * 4) * progress * 3;
  shape(ctx, `M-28 -20 L-29 ${1 + step} L-18 ${1 + step} L-13 -17 M20 -19 L25 ${1 - step} L35 ${1 - step} L31 -22`, '#293935');
  shape(ctx, 'M-34 -27 Q-49 -23 -54 -37 Q-60 -51 -68 -47 Q-76 -41 -65 -26 Q-57 -13 -38 -13Z', '#293935');
  ellipse(ctx, -66, -42, 6.2, 7, '#f3eadf', -0.4);
  ellipse(ctx, -67, -43, 2.3, 3.3, '#273434');
  shape(ctx, 'M38 -26 Q49 -23 51 -29 Q46 -20 39 -19Z', '#263734');
  const shell = new Path2D('M-44 -22 Q-40 -60 -16 -68 Q11 -79 32 -51 Q42 -37 43 -22 Q5 -8 -44 -22Z');
  paint(ctx, shell, '#253638', [-47, -74, 94, 64], paper, 91, 0.7);
  ctx.save();
  ctx.clip(shell);
  line(ctx, 'M-45 -43 Q-5 -20 45 -41', '#63858a', 8);
  line(ctx, 'M-31 -61 Q-4 -49 25 -63', '#58777c', 6);
  line(ctx, 'M-45 -22 Q-3 -7 45 -22', '#8daba8', 4);
  ctx.restore();
  ctx.restore();
}

function bird(ctx, x, feet, paper) {
  ctx.save();
  ctx.translate(x, feet);
  line(ctx, 'M-3 -12 L-4 0 M5 -11 L8 0', '#b66859', 2.1);
  const body = new Path2D('M-15 -54 Q-7 -51 -2 -39 C3 -34 14 -30 16 -19 C20 1 -9 -2 -18 -24 Q-23 -37 -20 -48Z');
  const fill = ctx.createLinearGradient(-23, -40, 17, -8);
  fill.addColorStop(0, '#3c4441');
  fill.addColorStop(0.55, '#454d46');
  fill.addColorStop(1, '#242f2c');
  paint(ctx, body, fill, [-26, -58, 48, 57], paper, 94, 0.8);
  shape(ctx, 'M-18 -51 Q-12 -58 -10 -46 L-10 -35 L-18 -36Z', '#b04749');
  shape(ctx, 'M-19 -48 L-29 -46 L-19 -43Z', '#b66357');
  ellipse(ctx, -15, -46, 3.1, 3.6, '#f2e5cb');
  ellipse(ctx, -15.5, -46.4, 1.35, 2.1, '#252d29');
  line(ctx, 'M-17 -54 Q-17 -65 -8 -64', '#4c4138', 3);
  ellipse(ctx, -6, -64, 4.3, 2.2, '#5b453a', 0.35);
  line(ctx, 'M1 -30 Q8 -22 8 -13', '#7779684a', 1);
  ctx.restore();
}

function fox(ctx, x, feet, paper, helped = false) {
  if (helped) {
    foxLookingDown(ctx, x, feet, paper);
    return;
  }
  ctx.save();
  ctx.translate(x, feet);
  // Cola curvada y patas largas: la silueta sentada del zorro del cuento.
  const tail = new Path2D('M-20 -26 C-68 -17 -73 10 -53 32 C-42 44 -18 45 -11 35 C-11 26 -26 24 -35 27 C-48 27 -49 13 -42 6 L-8 -2Z');
  paint(ctx, tail, '#632f31', [-71, -27, 63, 76], paper, 101, 1.4);
  const body = new Path2D('M-39 -7 C-58 -18 -55 -51 -36 -71 L-7 -99 L18 -100 L23 -8 Q-6 -2 -39 -7Z');
  paint(ctx, body, '#7b3034', [-59, -102, 88, 104], paper, 102, 1.5);
  shape(ctx, 'M-9 -77 L-5 -6 Q0 0 8 -4 L7 -65 M13 -82 L19 -5 Q26 1 31 -5 L24 -96Z', '#562e2d');
  line(ctx, 'M1 -69 L3 -10', '#c19e8d', 1.4);
  shape(ctx, 'M-1 -87 Q-15 -64 -13 -40 Q-4 -52 2 -63Z', '#d0ad91');
  const head = new Path2D('M-24 -100 L-29 -153 L-9 -139 L13 -158 L20 -108 L-16 -92 L-46 -100Z');
  paint(ctx, head, '#8e3437', [-48, -158, 72, 68], paper, 104, 1);
  shape(ctx, 'M-26 -148 L-13 -137 L-23 -130Z M12 -151 L13 -131 L3 -137Z', '#d18c85');
  shape(ctx, 'M-44 -101 L-13 -111 L18 -111 L-14 -95Z', '#b9564e');
  shape(ctx, 'M-46 -101 L-39 -105 L-38 -99Z', '#292f2d');
  shape(ctx, 'M-22 -120 L-11 -123 L-15 -117Z M-4 -123 L8 -126 L2 -120Z', '#eee8d4');
  line(ctx, 'M-17 -122 l-1 4 M2 -125 l-1 4', '#252a27', 1.6);
  line(ctx, 'M-39 -100 l-18 -3 M-39 -97 l-17 3 M-35 -105 l-15 -6', '#393630', 0.85);
  ctx.restore();
}

function foxLookingDown(ctx, x, feet, paper) {
  ctx.save();
  ctx.translate(x, feet);
  // En el cuento se sujeta a la piedra con las patas traseras y apoya
  // las delanteras junto al túnel. La cabeza conserva las orejas arriba:
  // esta postura necesita otra silueta, no dar la vuelta al zorro sentado.
  const tail = new Path2D('M35 -222 C44 -249 18 -266 -12 -264 C-30 -263 -46 -269 -48 -279 C-18 -296 20 -279 37 -259 Q48 -242 43 -221Z');
  paint(ctx, tail, '#632f31', [-49, -289, 99, 69], paper, 105, 1.3);
  shape(ctx, 'M-48 -279 Q-37 -285 -26 -284 L-20 -265 Q-38 -267 -48 -279Z', '#a96952');
  line(ctx, 'M-37 -282 L-31 -269 M-28 -284 L-22 -266', '#d1a18355', 2);
  shape(ctx, 'M39 -222 Q73 -235 104 -198 L97 -175 Q91 -170 89 -178 L94 -196 L48 -209Z', '#562e2d');
  const body = new Path2D('M-1 -79 C3 -116 7 -168 11 -199 C14 -221 29 -239 46 -229 C61 -220 59 -203 51 -185 C39 -154 27 -119 22 -88 L12 -66Z');
  paint(ctx, body, '#7b3034', [-3, -234, 65, 173], paper, 106, 1.5);
  shape(ctx, 'M44 -222 Q74 -226 96 -192 L88 -154 Q82 -149 80 -158 L85 -191 L47 -208Z', '#642d2f');
  line(ctx, 'M62 -212 L90 -191 L84 -158', '#a0614d', 1.3);
  shape(ctx, 'M20 -166 Q10 -138 9 -101 L19 -91 Q27 -129 29 -155Z', '#b46d52');
  // Dos apoyos estrechos y firmes, justo en el borde de la boca izquierda.
  shape(ctx, 'M2 -89 L7 -3 Q11 1 16 -2 L15 -85 M17 -90 L21 -3 Q26 1 31 -2 L26 -89Z', '#562e2d');
  line(ctx, 'M12 -78 L13 -7 M25 -78 L27 -7', '#ad735c', 1.4);
  const head = new Path2D('M-8 -64 L-25 -80 L-23 -57 L-43 -68 L-35 -45 L-14 -8 L4 -29 L11 -59 L0 -68Z');
  paint(ctx, head, '#8e3437', [-44, -81, 58, 74], paper, 107, 1.1);
  shape(ctx, 'M-23 -72 L-14 -62 L-21 -60Z M-38 -62 L-27 -53 L-31 -48Z', '#d18c85');
  shape(ctx, 'M-28 -44 L-5 -49 L3 -33 L-14 -9Z', '#b9564e');
  shape(ctx, 'M-28 -45 L-17 -46 L-23 -39Z M-8 -50 L2 -53 L-1 -45Z', '#eee8d4');
  line(ctx, 'M-23 -44 l1 4 M-2 -51 l0 5', '#252a27', 1.6);
  shape(ctx, 'M-17 -12 L-11 -13 L-14 -6Z', '#292f2d');
  line(ctx, 'M-18 -17 l-15 4 M-17 -21 l-18 -2 M-9 -19 l14 -6 M-10 -15 l14 1', '#393630', 0.85);
  ctx.restore();
}

function elephantProfile(ctx, x, feet, paper, state) {
  const p = ease(clamp(state.helpProgress || 0, 0, 1));
  ctx.save();
  ctx.translate(x, feet);
  line(ctx, 'M84 -209 Q129 -181 147 -155 M145 -156 l13 12 M146 -156 l5 18 M146 -155 l-2 15', '#5e554c', 4);
  const body = new Path2D('M-74 -11 L-78 -118 C-102 -144 -112 -204 -91 -251 C-75 -288 -36 -305 12 -292 C80 -284 104 -248 105 -190 L100 -7 Q87 5 65 -3 L59 -89 L-13 -88 L-14 -7 Q-35 6 -52 -2 L-52 -90 L-53 -10Z');
  const gradient = ctx.createLinearGradient(-100, -290, 100, 0);
  gradient.addColorStop(0, '#7d7063');
  gradient.addColorStop(0.5, '#6e6357');
  gradient.addColorStop(1, '#625b50');
  paint(ctx, body, gradient, [-111, -307, 222, 314], paper, 111, 1.3);
  const head = new Path2D('M-57 -289 C-87 -303 -119 -271 -129 -238 C-137 -216 -127 -174 -119 -156 L-89 -137 L-51 -192Z');
  paint(ctx, head, '#75685c', [-136, -303, 91, 174], paper, 113, 1.5);
  const ear = new Path2D('M-42 -257 C-25 -263 -17 -238 -25 -206 C-31 -178 -60 -169 -76 -184 C-97 -205 -83 -245 -64 -254Z');
  paint(ctx, ear, '#92786d', [-88, -262, 70, 91], paper, 116, 1.7);
  line(ctx, 'M-48 -246 Q-73 -225 -61 -190', '#b48f7c24', 7);
  // La misma trompa que mira al conejo se curva y lo acompaña al elevarlo.
  const supportX = clamp(state.x || 490, 420, 710) - x;
  const supportY = (Number.isFinite(state.assistY) ? state.assistY : mix(GROUND, 318, p)) - feet;
  let trunk;
  if (state.helped) {
    trunk = new Path2D(`M-129 -212 C-139 -130,-133 ${supportY + 36},${supportX - 7} ${supportY + 16} Q${supportX + 20} ${supportY + 17},${supportX + 22} ${supportY + 1} L${supportX - 3} ${supportY + 1} C${supportX - 15} ${supportY + 16},-105 ${supportY + 2},-107 -207Z`);
  } else {
    trunk = new Path2D('M-130 -223 C-142 -161 -133 -97 -142 -46 Q-145 -30 -158 -36 Q-169 -44 -167 -31 Q-161 -15 -141 -20 Q-117 -25 -117 -57 L-106 -211Z');
  }
  paint(ctx, trunk, '#73675b', [-174, -229, Math.max(80, supportX + 205), 250], paper, 118, 1.4);
  line(ctx, 'M-133 -137 l17 2 M-135 -107 l16 2 M-136 -80 l15 1', '#b1a08b50', 1.1);
  shape(ctx, 'M-111 -192 Q-130 -179 -161 -181 Q-175 -184 -177 -173 Q-138 -160 -104 -181Z', '#eee0c6');
  ellipse(ctx, -110, -234, 3.4, 4.6, '#312f2b', -0.2);
  ellipse(ctx, -110.8, -236, 1.2, 1.6, '#ece6d3');
  line(ctx, 'M-116 -240 Q-111 -246 -105 -242', '#544d44', 1.5);
  for (const xx of [-66, -38, 72, 88]) {
    ellipse(ctx, xx, -3, 5, 5, '#c1afa0');
  }
  line(ctx, 'M-27 -291 l-1 -10 M-19 -293 l0 -11 M-11 -293 l1 -12 M-3 -292 l2 -10 M5 -291 l2 -8', '#4e4940', 1.2);
  ctx.restore();
}

function elephant(ctx, x, feet, paper, state) {
  const turn = ease(clamp(state.revealProgress || 0, 0, 1));
  if (turn < 1) {
    ctx.save();
    ctx.translate(x, feet);
    ctx.globalAlpha *= 1 - Math.max(0, (turn - 0.35) / 0.65);
    ctx.scale(mix(1, 0.72, turn), 1);
    // De espaldas solo se ven una grupa redonda, dos patas y la colita.
    // La estrecha rendija entre las patas desvela la segunda «piedra».
    const rear = new Path2D('M-103 -2 C-111 -41 -109 -120 -114 -174 C-119 -244 -91 -302 -46 -326 C-20 -342 13 -342 40 -329 C91 -307 116 -248 115 -183 L108 -5 Q76 3 32 -2 L19 -100 L12 -99 L7 -3 Q-45 4 -103 -2Z');
    const shade = ctx.createLinearGradient(-100, -330, 90, 0);
    shade.addColorStop(0, '#494540');
    shade.addColorStop(0.42, '#514c44');
    shade.addColorStop(1, '#3e3c36');
    paint(ctx, rear, shade, [-120, -343, 242, 350], paper, 110, 1.6);
    line(ctx, 'M-13 -241 C-12 -219 -20 -200 -7 -179 Q1 -164 20 -164 M16 -171 l13 12 M14 -169 l8 14 M10 -168 l2 13', '#302f2b', 2.2);
    line(ctx, 'M-92 -61 q31 8 61 2 M39 -51 q31 8 64 -3', '#81736228', 1.2);
    ctx.restore();
  }
  if (turn > 0) {
    ctx.save();
    ctx.globalAlpha *= clamp((turn - 0.12) / 0.88, 0, 1);
    elephantProfile(ctx, x, feet, paper, state);
    ctx.restore();
  }
}

function bezierPoint(points, t) {
  const a = 1 - t;
  return {
    x: a ** 3 * points[0].x + 3 * a * a * t * points[1].x + 3 * a * t * t * points[2].x + t ** 3 * points[3].x,
    y: a ** 3 * points[0].y + 3 * a * a * t * points[1].y + 3 * a * t * t * points[2].y + t ** 3 * points[3].y,
  };
}

function ribbon(points, width, steps = 48) {
  const pointAt = typeof points === 'function' ? points : (t) => bezierPoint(points, t);
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = pointAt(t);
    const next = pointAt(Math.min(1, t + 0.001));
    const previous = pointAt(Math.max(0, t - 0.001));
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    left.push({ x: point.x - dy / length * width / 2, y: point.y + dx / length * width / 2 });
    right.push({ x: point.x + dy / length * width / 2, y: point.y - dx / length * width / 2 });
  }
  const p = new Path2D();
  p.moveTo(left[0].x, left[0].y);
  for (const point of left) p.lineTo(point.x, point.y);
  for (const point of right.reverse()) p.lineTo(point.x, point.y);
  p.closePath();
  return p;
}

function giraffe(ctx, paper, progress = 0) {
  const p = ease(clamp(progress, 0, 1));
  const gold = '#dca050';
  // Las cuatro patas y la grupa se quedan siempre en la orilla derecha.
  const bodyTop = mix(245, 423, p);
  const bodyBottom = bodyTop + 82;
  const body = new Path2D(`M941 ${bodyTop + 8} Q989 ${bodyTop - 8},1044 ${bodyTop + 11} Q1090 ${bodyTop + 15},1091 ${bodyTop + 57} L1080 ${bodyBottom} L961 ${bodyBottom} Q941 ${bodyBottom - 4},941 ${bodyTop + 8}Z`);
  const feet = [966, 990, 1062, 1084];
  for (let i = 0; i < feet.length; i += 1) {
    const xx = feet[i];
    const hip = bodyBottom - (i < 2 ? 7 : 16);
    const bend = i < 2 ? xx + p * 67 : xx + p * 33;
    const knee = mix(hip + 95, 537, p);
    const path = new Path2D(`M${xx - 7} ${hip} Q${xx - 8} ${knee - 12},${bend - 7} ${knee} L${xx + p * (i < 2 ? 69 : -14) - 6} 554 Q${xx + p * (i < 2 ? 69 : -14)} 562,${xx + p * (i < 2 ? 69 : -14) + 8} 556 L${bend + 6} ${knee} Q${xx + 7} ${knee - 15},${xx + 7} ${hip}Z`);
    paint(ctx, path, i % 2 ? '#ce914c' : gold, [xx - 12, hip, 95, GROUND - hip + 3], paper, 128 + i, 0.8);
    ellipse(ctx, xx + p * (i < 2 ? 69 : -14), 557, 10, 3.5, '#6c5140');
  }
  paint(ctx, body, gold, [938, bodyTop - 5, 160, 99], paper, 130, 1.1);
  ctx.save();
  ctx.clip(body);
  for (let i = 0; i < 18; i += 1) {
    const xx = 946 + (i % 6) * 27;
    const yy = bodyTop + 13 + Math.floor(i / 6) * 26;
    ellipse(ctx, xx, yy, 9 + i % 4, 9 + i % 3, '#a8493c', i * 0.51);
  }
  ctx.restore();
  line(ctx, `M1084 ${bodyTop + 31} Q1122 ${bodyTop + 64},1141 ${bodyTop + 47}`, '#c68b4b', 5);
  for (let i = 0; i < 8; i += 1) line(ctx, `M1134 ${bodyTop + 50} l${9 + i} ${i * 3 - 10}`, '#765342', 1);
  const standing = [
    { x: 957, y: 283 }, { x: 929, y: 204 },
    { x: 925, y: 63 }, { x: 916, y: 41 },
  ];
  const points = (t) => {
    const upright = bezierPoint(standing, t);
    const kneeling = t < 0.32
      ? bezierPoint([{ x: 957, y: 461 }, { x: 912, y: 461 }, { x: 896, y: 578 }, { x: 850, y: 578 }], t / 0.32)
      : { x: mix(850, 563, (t - 0.32) / 0.68), y: 578 };
    return { x: mix(upright.x, kneeling.x, p), y: mix(upright.y, kneeling.y, p) };
  };
  const neck = ribbon(points, mix(42, 43, p));
  paint(ctx, neck, gold, [537, 9, 449, 596], paper, 131, 1);
  ctx.save();
  ctx.clip(neck);
  for (let i = 0; i < 22; i += 1) {
    const point = points(i / 21);
    const offset = i % 2 ? -10 : 8;
    ellipse(ctx, point.x + (1 - p) * offset, point.y + p * offset, 9 + i % 3, 11 - i % 4, '#ab5140', i * 0.4);
  }
  ctx.restore();
  for (let i = 0; i < 67; i += 1) {
    const point = points(i / 66);
    line(ctx, `M${point.x + (1 - p) * 20} ${point.y - p * 22} l${mix(10, -1, p)} ${mix(-2, -11, p)}`, '#76533f', 1.1);
  }
  const end = points(1);
  ctx.save();
  ctx.translate(end.x, end.y - p * 12);
  const head = new Path2D('M10 9 Q14 -9 2 -17 L-19 -20 L-53 4 Q-70 14 -64 26 Q-57 36 -44 26 L-15 20 Q1 25 10 9Z');
  paint(ctx, head, '#dfa351', [-68, -24, 85, 62], paper, 134, 0.8);
  shape(ctx, 'M-10 -16 L-8 -38 L-2 -38 L-1 -15 M4 -14 L11 -35 L16 -32 L12 -11', '#d49d5c');
  ellipse(ctx, -5, -38, 4.5, 3.5, '#735846');
  ellipse(ctx, 14, -34, 4.2, 3.6, '#735846');
  shape(ctx, 'M9 -9 Q33 -26 38 -15 Q29 -1 11 0Z', '#d5984b');
  line(ctx, 'M15 -6 L31 -16', '#a4694c', 1.4);
  ellipse(ctx, -18, -3, 5.2, 6.6, '#faf0d7');
  ellipse(ctx, -19, -2, 2.8, 4.5, '#312f29');
  ellipse(ctx, -56, 19, 3, 4, '#9d6148');
  ctx.restore();
}

function crocodile(ctx, paper, progress = 0, time = 0) {
  const p = ease(clamp(progress, 0, 1));
  const yy = GROUND + mix(25, 0, p);
  ctx.save();
  ctx.translate(530, yy);
  shape(ctx, 'M139 21 L144 55 L155 65 L160 52 L166 57 L164 29 M238 21 L239 49 L251 58 L255 45 L261 49 L258 21', '#3a493f');
  const body = new Path2D('M0 2 L74 -1 Q104 -9 165 -5 L263 -6 L374 -12 Q331 13 271 31 Q208 50 104 28 L0 19Z');
  const gradient = ctx.createLinearGradient(0, -10, 0, 45);
  gradient.addColorStop(0, '#6c7953');
  gradient.addColorStop(1, '#364a40');
  paint(ctx, body, gradient, [-2, -14, 379, 67], paper, 141, 1.3);
  const spikes = new Path2D();
  for (let i = 0; i < 27; i += 1) {
    const x = 80 + i * 10.6;
    const y = -2 - i * 0.31;
    spikes.moveTo(x, y);
    spikes.lineTo(x + 5, y - 9 + i * 0.05);
    spikes.lineTo(x + 11, y);
    spikes.closePath();
  }
  shape(ctx, spikes, '#41533e');
  line(ctx, 'M3 12 Q53 17 98 10', '#293b32', 1.8);
  for (let i = 1; i <= 13; i += 1) {
    shape(ctx, `M${i * 7} 13 l4 0 -2 5Z`, '#a5ad7b');
  }
  ellipse(ctx, 93, -5, 8.4, 10, '#6f7d51');
  ellipse(ctx, 110, -6, 7.4, 9, '#62734b');
  if (p > 0.6) {
    ellipse(ctx, 92, -7, 3.1, 4, '#e8e6b7');
    ellipse(ctx, 92, -7, 1.2, 3, '#27382e');
    ellipse(ctx, 109, -8, 2.5, 3.6, '#e8e6b7');
    ellipse(ctx, 109, -8, 1.1, 2.8, '#27382e');
  } else {
    line(ctx, 'M87 -7 q5 3 10 0 M105 -8 q4 3 8 0', '#293d31', 1.8);
    if (Math.sin(time * 1.7) > -0.5) {
      ctx.globalAlpha = 0.4;
      line(ctx, 'M75 -28 q-8 -10 -2 -17 M87 -33 q-7 -9 -1 -16', '#faf0d7', 1.5);
      ctx.globalAlpha = 1;
    }
  }
  ellipse(ctx, 13, 5, 2, 1.5, '#344536');
  ctx.restore();
}

function reeds(ctx, paper, foreground = false, extent = { left: 380, right: 2160 }) {
  const { left, right } = extent;
  const rng = random(foreground ? 152 : 149);
  const width = right - left;
  if (!foreground) {
    // La mata es una franja continua de dos páginas, con una base opaca.
    const haze = ctx.createLinearGradient(0, 348, 0, GROUND);
    haze.addColorStop(0, '#c9b87600');
    haze.addColorStop(0.32, '#b8a267a8');
    haze.addColorStop(0.72, '#af955b');
    haze.addColorStop(1, '#92784a');
    const edge = new Path2D(`M${left} 559 L${left + 4} 475 Q${left + 18} 434,${left + 56} 418 Q${left + width * 0.48} 385,${right - 72} 412 Q${right - 8} 424,${right} 477 L${right} 566Z`);
    paint(ctx, edge, haze, [left, 348, width, 219], paper, 147, 0.8);
  }
  // Miles de tallos finos conservan el aspecto de hierba seca del libro.
  const count = Math.round(width * (foreground ? 1.04 : 1.16));
  for (let i = 0; i < count; i += 1) {
    const x = left + rng() * width;
    const atEdge = clamp(Math.min(x - left, right - x) / 54, 0, 1);
    const height = (foreground ? 30 + rng() * 108 : 106 + rng() * 106) * mix(0.46, 1, atEdge);
    const lean = rng() * 20 - 10;
    const colors = foreground ? ['#927140', '#aa8b4b', '#c0a164', '#79633c'] : ['#baa368', '#b59b59', '#c4ad6d', '#a88b4d'];
    ctx.globalAlpha = foreground ? 0.87 : 0.75;
    line(ctx, `M${x} ${GROUND + 3} Q${x - 3} ${GROUND - height * 0.5},${x + lean} ${GROUND - height}`, colors[i % 4], foreground ? 1.15 : 1.05);
    if (i % 5 === 0) {
      ellipse(ctx, x + lean, GROUND - height, 2.9 + rng() * 1.3, 3.7 + rng() * 2.1, colors[(i + 1) % 4], lean * 0.03);
    } else if (i % 7 === 0) {
      line(ctx, `M${x + lean} ${GROUND - height} l-3 -9 M${x + lean} ${GROUND - height} l4 -12`, colors[(i + 1) % 4], 0.8);
    }
  }
  ctx.globalAlpha = 1;
  if (!foreground) {
    // La cola rayada asoma al entrar, como en la doble página original.
    const tail = new Path2D(`M${left + 93} 539 C${left + 103} 495,${left + 99} 453,${left + 73} 437 C${left + 58} 428,${left + 42} 434,${left + 45} 445 C${left + 46} 453,${left + 56} 454,${left + 59} 447 C${left + 59} 440,${left + 66} 443,${left + 71} 450 C${left + 90} 474,${left + 81} 514,${left + 79} 540Z`);
    paint(ctx, tail, '#d99b57', [left + 40, 428, 67, 119], paper, 151, 1);
    ctx.save();
    ctx.clip(tail);
    for (let i = 0; i < 9; i += 1) line(ctx, `M${left + 37 + i * 4} ${437 + i * 12} l62 -12`, '#493c2f', 6);
    ctx.restore();
  }
}

function cliff(ctx, paper, x = 850, top = -220, bottom = HEIGHT, right = WIDTH) {
  const path = new Path2D(`M${x + 34} ${top} Q${x - 10} ${top + 8},${x - 2} ${top + 67} C${x + 11} ${top + 151},${x - 8} ${top + 267},${x + 8} ${bottom} L${right} ${bottom} L${right} ${top}Z`);
  const gradient = ctx.createLinearGradient(x, top, 1210, bottom);
  gradient.addColorStop(0, '#b7ad9e');
  gradient.addColorStop(0.48, '#a49b8c');
  gradient.addColorStop(1, '#928b7b');
  paint(ctx, path, gradient, [x - 12, top, right - x + 24, bottom - top], paper, 160, 1.9);
  ctx.save();
  ctx.clip(path);
  const rng = random(161);
  for (let i = 0; i < 27; i += 1) {
    const xx = x + 26 + rng() * 390;
    const yy = top + rng() * (bottom - top);
    line(ctx, `M${xx} ${yy} l-7 13 9 10 -3 17 5 13`, '#665f5130', 1.2 + rng());
    ellipse(ctx, xx - 4, yy + 30, 8 + rng() * 11, 17 + rng() * 22, '#dcd1b816', rng());
  }
  ctx.restore();
  line(ctx, `M${x + 31} ${top + 1} Q1060 ${top - 2} ${right} ${top}`, '#d7ccaf75', 2);
}

function snakeTree(ctx, paper, treeY = 190) {
  ctx.save();
  ctx.translate(0, treeY - 190);
  // Una ramita nace del costado de la montaña, lejos de la cima.
  const branch = new Path2D('M866 187 Q823 190 783 178 Q755 170 719 174 L717 182 Q752 178 777 188 Q822 201 866 201Z');
  paint(ctx, branch, '#72684f', [713, 165, 156, 40], paper, 163, 1.4);
  line(ctx, 'M786 184 Q767 158 753 147 M757 180 Q742 196 721 203 M813 192 Q793 212 774 223 M740 175 Q720 161 703 163', '#70664b', 3.2);
  for (const [xx, yy, angle] of [[748, 150, -0.8], [735, 161, -0.7], [756, 163, 0.6], [721, 201, -0.7], [708, 203, 0.4], [775, 221, -0.4], [790, 211, -0.7], [704, 160, -0.2], [716, 169, 0.6]]) {
    ctx.save();
    ctx.translate(xx, yy);
    ctx.rotate(angle);
    paint(ctx, 'M0 8 Q-13 0 -8 -13 Q0 -22 4 -9 Q15 -15 14 -6 Q15 4 0 8Z', '#64724d', [-14, -22, 31, 33], paper, 164 + xx, 0.8);
    ctx.restore();
  }
  ctx.restore();
}

const snakePatterns = new WeakMap();

function snakeStroke(ctx, definition) {
  const path = new Path2D(definition);
  let pattern = snakePatterns.get(ctx);
  if (!pattern) {
    const tile = surface(48, 56);
    const ink = tile.getContext('2d');
    ink.fillStyle = '#b94c4b';
    ink.fillRect(0, 0, 48, 56);
    for (const [x, y] of [[9, 13], [34, 41]]) {
      ellipse(ink, x, y, 7.2, 8, '#533a32', -0.25);
      ellipse(ink, x + 0.7, y, 3.9, 4.7, '#cda163');
      ellipse(ink, x + 1.2, y, 1.7, 2.7, '#6b4838');
    }
    pattern = ctx.createPattern(tile, 'repeat');
    snakePatterns.set(ctx, pattern);
  }
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#813c3b';
  ctx.lineWidth = 30;
  ctx.stroke(path);
  ctx.strokeStyle = '#dc7e59';
  ctx.lineWidth = 26;
  ctx.stroke(path);
  ctx.strokeStyle = pattern;
  ctx.lineWidth = 21;
  ctx.stroke(path);
  ctx.restore();
}

function snake(ctx, paper, state) {
  const branchY = SCENE_GEOMETRY[state.scene]?.tree?.y ?? 190;
  const progress = clamp(state.helpProgress || 0, 0, 1);
  const lowering = ease(clamp(progress / 0.32, 0, 1));
  const active = Boolean(state.helped);
  const feetX = clamp(state.x || 550, 480, 850);
  const feetY = Number.isFinite(state.assistY) ? state.assistY : GROUND;
  let head;
  let body;
  if (!active) {
    head = { x: 771, y: branchY + 41 };
    body = `M823 ${branchY} C791 ${branchY + 1} 805 ${branchY + 19} 803 ${branchY + 30} Q797 ${branchY + 50} 771 ${branchY + 41}`;
  } else if (progress < 0.32) {
    head = { x: mix(771, feetX - 27, lowering), y: mix(branchY + 41, GROUND - 55, lowering) };
    body = `M823 ${branchY} C778 ${branchY + 2},${head.x + 43} ${head.y - 128},${head.x + 27} ${head.y - 13} Q${head.x + 18} ${head.y + 6},${head.x} ${head.y}`;
  } else {
    const raised = ease(clamp((progress - 0.32) / 0.68, 0, 1));
    head = { x: feetX - 32, y: feetY - mix(55, 100, raised) };
    body = `M823 ${branchY} C764 ${branchY + 3},${feetX + 90} ${feetY + 42},${feetX + 25} ${feetY + 20} Q${feetX - 5} ${feetY + 16},${feetX - 7} ${feetY - 8} C${feetX - 9} ${feetY - 44},${head.x + 32} ${head.y + 11},${head.x} ${head.y}`;
  }
  snakeStroke(ctx, body);
  // Tres vueltas se quedan ancladas a la rama durante toda la ayuda.
  ctx.save();
  ctx.translate(0, branchY - 190);
  snakeStroke(ctx, 'M852 191 C844 160 822 165 823 190 C822 220 803 222 800 195 C797 166 777 166 776 190 C776 215 757 211 759 185 C761 163 744 164 743 180');
  ctx.restore();
  ctx.save();
  ctx.translate(head.x, head.y);
  const face = new Path2D('M13 -10 Q-4 -17 -22 -9 Q-36 -4 -30 5 Q-26 13 -8 10 L15 6Z');
  paint(ctx, face, '#ac4341', [-35, -17, 53, 31], paper, 169, 0.8);
  ellipse(ctx, -18, -6, 5.2, 5.8, '#eee1b3');
  ellipse(ctx, -19, -6.8, 2.1, 3.5, '#3e352b');
  ellipse(ctx, -3, -8, 4.4, 4.8, '#e5d6a6');
  ellipse(ctx, -4, -8.5, 1.7, 3.2, '#3e352b');
  line(ctx, 'M-30 5 Q-18 8 -11 5', '#56302d', 1);
  line(ctx, 'M-30 4 q-13 1 -16 9 M-42 11 l-7 -1 M-42 11 l-3 7', '#b24b55', 1.4);
  ctx.restore();
}

function carrot(ctx, x, y, paper, angle = 0, small = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (small) ctx.scale(0.7, 0.7);
  shape(ctx, 'M-6 0 Q-8 11 -1 27 Q6 13 7 1Z', '#d68047');
  line(ctx, 'M-3 8 l5 1 M-1 15 l4 1', '#985d3c66', 1);
  line(ctx, 'M0 2 Q-17 -10 -10 -18 Q-3 -15 0 -1 M0 1 Q-1 -21 5 -23 Q11 -14 2 0 M2 0 Q17 -19 19 -11 Q17 -4 2 2', '#65804b', 3.8);
  ctx.restore();
}

function garden(ctx, paper, dusk = false) {
  const rng = random(183);
  for (let i = 0; i < 28; i += 1) {
    const x = 690 + rng() * 520;
    const y = 583 + rng() * 112;
    ctx.save();
    ctx.globalAlpha = dusk ? 0.67 : 0.9;
    ellipse(ctx, x, y + 8, 10, 3, '#423f3220');
    carrot(ctx, x, y, paper, (rng() - 0.5) * 0.5, i % 3 !== 0);
    ctx.restore();
  }
}

function tunnel(ctx, paper, geometry) {
  const t = geometry.tunnel;
  const r = geometry.rock;
  rock(ctx, r.x, r.width, r.top, paper, 24);
  // Un corte real del terreno: el suelo y el techo siguen el mismo perfil U.
  const cut = new Path2D();
  const count = 100;
  for (let i = 0; i <= count; i += 1) {
    const xx = t.x + t.width * i / count;
    const yy = Math.max(GROUND, tunnelFloorAt(xx, t) - t.clearance);
    if (i === 0) cut.moveTo(xx, yy);
    else cut.lineTo(xx, yy);
  }
  for (let i = count; i >= 0; i -= 1) {
    const xx = t.x + t.width * i / count;
    cut.lineTo(xx, tunnelFloorAt(xx, t));
  }
  cut.closePath();
  const dark = ctx.createLinearGradient(0, 520, 0, 668);
  dark.addColorStop(0, '#40342e');
  dark.addColorStop(0.45, '#49382f');
  dark.addColorStop(1, '#382e29');
  paint(ctx, cut, dark, [t.x, GROUND - t.clearance, t.width, t.depth + t.clearance], paper, 43, 1.5);
  const lip = new Path2D();
  for (let i = 0; i <= count; i += 1) {
    const xx = t.x + t.width * i / count;
    const yy = tunnelFloorAt(xx, t);
    if (i === 0) lip.moveTo(xx, yy);
    else lip.lineTo(xx, yy);
  }
  ctx.strokeStyle = '#b09a6538';
  ctx.lineWidth = 3;
  ctx.stroke(lip);
}

function loneCarrot(ctx, paper, planted) {
  const pocket = new Path2D('M827 560 Q837 593 855 614 Q879 628 897 647 Q916 651 930 629 Q959 613 965 584 L976 560Z');
  paint(ctx, pocket, '#35322d', [824, 557, 156, 95], paper, 181, 1.2);
  ellipse(ctx, 809, 557, 7, 5, '#8d8776', -0.3);
  if (planted) {
    // Solo asoma una pequeña raíz: las hojas son la señal visible del huerto.
    ellipse(ctx, 900, 558, 8, 5, '#dc985d');
    line(ctx, 'M900 556 Q898 531 898 506 M898 536 Q882 522 879 510 M898 527 Q912 513 914 500 M897 518 Q882 502 882 493', '#4f6443', 2.1);
    for (const [xx, yy, rot] of [[882, 512, -0.7], [878, 503, -0.6], [888, 520, -0.8], [910, 510, 0.8], [916, 500, 0.7], [901, 518, 0.2], [883, 493, -0.3], [898, 506, 0.2]]) {
      ellipse(ctx, xx, yy, 4, 7, '#536944', rot);
      ellipse(ctx, xx - 3, yy - 1, 3.7, 4.3, '#647b4b', rot);
    }
  }
}

function nightSky(ctx, paper, ending) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#202530');
  sky.addColorStop(0.52, '#2b3340');
  sky.addColorStop(1, '#657a86');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const rng = random(312);
  for (let i = 0; i < 780; i += 1) {
    const x = rng() * WIDTH;
    const y = rng() * 510;
    const opacity = (0.12 + rng() * 0.46) * (1 - y / 680);
    ctx.fillStyle = `rgba(230,232,221,${opacity})`;
    ctx.fillRect(x, y, 0.45 + rng() * 1.25, 0.5 + rng() * 1.1);
  }
  if (!ending) {
    const halo = ctx.createRadialGradient(1090, 168, 12, 1090, 168, 90);
    halo.addColorStop(0, '#ede5db32');
    halo.addColorStop(0.5, '#d2d4dc16');
    halo.addColorStop(1, '#d2d4dc00');
    ctx.fillStyle = halo;
    ctx.fillRect(990, 68, 200, 200);
    const moon = new Path2D();
    moon.ellipse(1090, 168, 31, 32, -0.06, 0, Math.PI * 2);
    paint(ctx, moon, '#ded9d6', [1057, 133, 66, 69], paper, 313, 1);
    ctx.save();
    ctx.clip(moon);
    line(ctx, 'M1054 159 Q1090 151 1128 159 M1054 174 Q1094 168 1127 177', '#a1a5b325', 6);
    ctx.restore();
  } else cloud(ctx, 850, 79, 150, 24, paper, '#718995');
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

function burrowEars(ctx, x, y, paper, brown = false) {
  ctx.save();
  ctx.translate(x, y);
  const ears = new Path2D('M-12 1 Q-14 -12 -18 -35 Q-19 -45 -14 -44 Q-9 -43 -7 -32 L-3 -1 L1 -1 Q4 -19 8 -36 Q10 -45 15 -42 Q18 -40 15 -30 L10 2Z');
  paint(ctx, ears, brown ? '#b58260' : '#e7dedb', [-20, -46, 40, 49], paper, brown ? 316 : 315, 0.8);
  line(ctx, 'M-8 -3 Q-12 -27 -14 -38 M6 -3 Q9 -27 12 -37', brown ? '#87594d' : '#bd919c', 3.4);
  ctx.restore();
}

function nightGround(ctx, paper, ending) {
  const moundX = ending ? 972 : 170;
  const soil = new Path2D(`M0 ${GROUND} L${moundX - 82} ${GROUND} Q${moundX - 34} ${GROUND - 3} ${moundX - 23} ${GROUND - 17} Q${moundX} ${GROUND - 27} ${moundX + 32} ${GROUND - 14} Q${moundX + 53} ${GROUND} ${moundX + 89} ${GROUND} L1280 ${GROUND} L1280 720 L0 720Z`);
  paint(ctx, soil, '#24292b', [0, GROUND - 30, WIDTH, 190], paper, 318, 1.3);
  if (!ending) {
    ellipse(ctx, 927, GROUND - 12, 21, 14, '#252a2d', -0.12);
    grass(ctx, 966, GROUND, 0.35, '#29383a');
    return;
  }
  // Las guardas muestran el huerto entero, con raíces apenas sobre la tierra.
  for (let i = 0; i < 20; i += 1) {
    const x = 34 + i * 63;
    if (x > 890 && x < 1055) continue;
    const height = 72 + Math.sin(i * 7.1) * 12;
    const stalk = GROUND - height;
    line(ctx, `M${x} ${GROUND - 5} Q${x + 2} ${stalk + 40} ${x - 3} ${stalk}`, '#39473c', 2.5);
    for (let j = 0; j < 4; j += 1) {
      const y = stalk + j * 16;
      const reach = 10 + j * 2;
      for (const sign of [-1, 1]) {
        line(ctx, `M${x} ${y + 13} Q${x + reach * sign} ${y - 1} ${x + (reach + 4) * sign} ${y - 3}`, '#3a483c', 2);
        for (let k = 0; k < 3; k += 1) {
          const xx = x + (reach * 0.45 + k * 3) * sign;
          ellipse(ctx, xx, y + 2 - k * 3, 3.3, 5.2, k % 2 ? '#40513f' : '#455440', -sign * 0.55);
        }
      }
    }
    shape(ctx, `M${x - 7} ${GROUND - 4} Q${x} ${GROUND - 15} ${x + 7} ${GROUND - 4} L${x + 5} ${GROUND} L${x - 6} ${GROUND}Z`, '#bf8059');
    line(ctx, `M${x - 3} ${GROUND - 6} l7 1`, '#dea07766', 1);
  }
  burrowEars(ctx, 953, GROUND - 19, paper);
  burrowEars(ctx, 988, GROUND - 18, paper, true);
  ellipse(ctx, 318, GROUND - 9, 17, 11, '#26353a');
}

function background(scene, paper, options = {}) {
  const id = SCENES[scene]?.id || 'piedra';
  const geometry = SCENE_GEOMETRY[scene] || {};
  const ending = options.ending;
  const title = options.title;
  const night = ending || id === 'madriguera' || title;
  const plateau = id === 'zanahoria' || id === 'conejo';
  const skyCanvas = surface();
  const skyCtx = skyCanvas.getContext('2d');
  if (night) {
    nightSky(skyCtx, paper, ending);
    const world = surface();
    nightGround(world.getContext('2d'), paper, ending);
    return { sky: skyCanvas, world, top: 0, left: 0 };
  }
  const sky = skyCtx.createLinearGradient(0, 0, 0, GROUND + 10);
  if (ending || options.dusk) {
    sky.addColorStop(0, '#28383c');
    sky.addColorStop(0.38, '#454248');
    sky.addColorStop(0.8, '#a74d5e');
    sky.addColorStop(1, '#ce6072');
  } else if (id === 'piedra') {
    sky.addColorStop(0, '#accfd1');
    sky.addColorStop(0.35, '#b2c6cd');
    sky.addColorStop(0.76, '#c38f9f');
    sky.addColorStop(1, '#ce8096');
  } else if (plateau) {
    sky.addColorStop(0, '#b5c7b7');
    sky.addColorStop(0.48, '#cbcdb0');
    sky.addColorStop(1, '#e1ce9d');
  } else {
    sky.addColorStop(0, '#9ec7cd');
    sky.addColorStop(0.55, '#acd1d1');
    sky.addColorStop(1, '#a8caca');
  }
  skyCtx.fillStyle = sky;
  skyCtx.fillRect(0, 0, WIDTH, HEIGHT);
  if (!options.hideSun && (id === 'piedra' || plateau)) {
    const sunX = options.dusk ? 508 : plateau ? 300 : 321;
    const sunY = options.dusk ? 610 : plateau ? 260 : 311;
    const radius = options.dusk ? 218 : plateau ? 46 : 113;
    const disc = new Path2D();
    disc.ellipse(sunX, sunY, radius * 0.97, radius, -0.04, 0, Math.PI * 2);
    paint(skyCtx, disc, CORAL, [sunX - radius, sunY - radius, radius * 2, radius * 2], paper, 12, 1.2);
  }
  if (ending || options.dusk) {
    cloud(skyCtx, 240, 144, 233, 39, paper, '#a4bdc0');
    cloud(skyCtx, 1060, 99, 116, 21, paper, '#adc4c5');
  } else if (!plateau && id !== 'pared' && id !== 'serpiente') {
    cloud(skyCtx, title ? 853 : 810, 142, 272, 57, paper);
    cloud(skyCtx, title ? 1130 : 1034, 236, 151, 41, paper);
    if (id === 'juncos') cloud(skyCtx, 163, 152, 191, 44, paper);
  }
  skyCtx.save();
  skyCtx.globalAlpha = 0.32;
  skyCtx.fillStyle = paper;
  skyCtx.fillRect(0, 0, WIDTH, HEIGHT);
  skyCtx.restore();
  const panoramic = id === 'serpiente';
  const width = panoramic ? WIDTH * 3 : geometry.width || WIDTH;
  const left = panoramic ? -WIDTH : 0;
  const top = id === 'pared' || panoramic ? -1300 : 0;
  const bottom = panoramic ? 1100 : HEIGHT;
  const world = surface(width, bottom - top);
  const ctx = world.getContext('2d');
  ctx.translate(-left, -top);
  ctx.save();
  ctx.translate(left, 0);
  ground(ctx, scene, paper, { ending: ending || options.dusk, plateau, width, bottom });
  ctx.restore();
  if (['piedra', 'tortuga', 'elefante'].includes(id)) {
    const r = geometry.rock;
    rock(ctx, r.x, r.width, r.top, paper, 21 + scene);
  }
  if (id === 'piedra') bird(ctx, 814, GROUND, paper);
  if (id === 'zorro') tunnel(ctx, paper, geometry);
  if (['charco', 'jirafa', 'cocodrilo'].includes(id)) water(ctx, geometry.gap.left, geometry.gap.right, paper, id === 'charco' ? 'puddle' : 'river');
  if (id === 'juncos') reeds(ctx, paper, false, geometry.reeds);
  if (id === 'pared' || id === 'serpiente') {
    cliff(ctx, paper, geometry.wall.x, geometry.wall.top, bottom, panoramic ? WIDTH * 2 : WIDTH);
    if (panoramic) {
      snakeTree(ctx, paper, geometry.tree.y);
      // Los juncos quedan lejos, a la izquierda del mismo macizo.
      ctx.save();
      ctx.translate(-1650, 0);
      reeds(ctx, paper, false, { left: 380, right: 920 });
      ctx.restore();
    }
  }
  if (plateau && !ending) loneCarrot(ctx, paper, Boolean(options.planted));
  if (ending) garden(ctx, paper, true);
  const plants = id === 'pared' || id === 'serpiente' ? [[83, 0.6], [830, 0.4]] : id === 'piedra' ? [[457, 0.65], [921, 0.48], [1173, 0.36]] : id === 'juncos' ? [[83, 0.6], [2256, 0.48], [2430, 0.25]] : plateau ? [] : [[83, 0.6], [1055, 0.48], [1154, 0.25]];
  for (const [x, size] of plants) grass(ctx, x, GROUND, size, ending ? '#5f6b4f' : '#73774e');
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = paper;
  ctx.fillRect(left, top, width, bottom - top);
  ctx.restore();
  let foreground;
  if (id === 'juncos') {
    foreground = surface(width, HEIGHT);
    reeds(foreground.getContext('2d'), paper, true, geometry.reeds);
  }
  return { sky: skyCanvas, world, top, left, foreground };
}

function drawMap(ctx, state, paper) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 565);
  gradient.addColorStop(0, '#263c43');
  gradient.addColorStop(0.45, '#42494b');
  gradient.addColorStop(0.8, '#9c5666');
  gradient.addColorStop(1, '#cc6374');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const disc = new Path2D();
  disc.ellipse(851, 548, 161, 163, 0, 0, Math.PI * 2);
  paint(ctx, disc, '#ef5265', [683, 383, 335, 330], paper, 201, 1.1);
  cloud(ctx, 231, 278, 102, 20, paper, '#cedbd7');
  cloud(ctx, 328, 241, 45, 12, paper, '#cedbd7');
  cloud(ctx, 1107, 182, 121, 22, paper, '#c1d1cf');
  const earth = new Path2D('M0 553 Q216 548 398 552 Q600 551 825 542 Q996 539 1280 541 L1280 720 L0 720Z');
  const soil = ctx.createLinearGradient(0, 541, 0, 720);
  soil.addColorStop(0, '#7c6953');
  soil.addColorStop(1, '#504f3c');
  paint(ctx, earth, soil, [0, 540, WIDTH, 180], paper, 204, 1.8);
  const centers = SCENES.map((_, index) => WIDTH * (0.04 + 0.92 * (index + 0.5) / SCENES.length));
  const route = SCENES.map((scene, index) => [scene.id === 'serpiente' ? centers[index - 1] + 15 : centers[index], ['zanahoria', 'conejo'].includes(scene.id) ? 355 : 550]);
  const mini = (x, y, scale, draw) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    draw();
    ctx.restore();
  };
  // Todos los hitos comparten un paisaje; cada ilustración cae bajo su rótulo.
  for (let index = 0; index < SCENES.length; index += 1) {
    const x = centers[index];
    const id = SCENES[index].id;
    if (id === 'madriguera') mini(x, 551, 0.65, () => {
      burrowEars(ctx, 0, 0, paper);
      shape(ctx, 'M-36 6 Q0 -5 36 6Z', '#504f3c');
    });
    if (id === 'piedra') mini(x, 551, 0.26, () => {
      rock(ctx, -45, 90, -70, paper, 20, 0);
      bird(ctx, 74, 0, paper);
    });
    if (id === 'tortuga') mini(x, 551, 0.28, () => {
      turtle(ctx, -62, 0, paper);
      rock(ctx, -3, 105, -154, paper, 21, 0);
    });
    if (id === 'zorro') mini(x, 552, 0.28, () => {
      rock(ctx, -40, 110, -160, paper, 22, 0);
      fox(ctx, -55, 0, paper);
      line(ctx, 'M-100 4 Q0 70 100 4', '#302f2b', 18);
    });
    if (id === 'elefante') mini(x, 551, 0.24, () => {
      elephant(ctx, -47, 0, paper, { revealProgress: 1 });
      rock(ctx, 105, 130, -210, paper, 23, 0);
    });
    if (id === 'charco') shape(ctx, `M${x - 21} 550 Q${x} 585 ${x + 21} 551Z`, '#65909d');
    if (id === 'jirafa') {
      shape(ctx, `M${x - 40} 550 Q${x - 20} 584 ${x + 3} 551Z`, '#6a97a2');
      mini(x - 230, 421, 0.23, () => giraffe(ctx, paper, 0));
    }
    if (id === 'cocodrilo') {
      shape(ctx, `M${x - 40} 550 Q${x} 590 ${x + 45} 548Z`, '#60899a');
      mini(x - 166, 420, 0.23, () => crocodile(ctx, paper, 1));
    }
    if (id === 'juncos') mini(x - 150, 410, 0.25, () => {
      reeds(ctx, paper, false, { left: 380, right: 820 });
      reeds(ctx, paper, true, { left: 380, right: 820 });
    });
    if (id === 'pared') {
      // La pared y la serpiente son dos momentos ante la misma montaña.
      const side = x + 40;
      const wall = new Path2D(`M${side + 20} 355 Q${side - 4} 354 ${side + 1} 389 L${side + 8} 720 L1280 720 L1280 355Z`);
      const fill = ctx.createLinearGradient(side, 355, 1280, 720);
      fill.addColorStop(0, '#aaa18e');
      fill.addColorStop(1, '#797360');
      paint(ctx, wall, fill, [side - 4, 351, 1284 - side, 370], paper, 206, 1.7);
    }
    if (id === 'serpiente') {
      const side = centers[SCENES.findIndex((scene) => scene.id === 'pared')] + 40;
      mini(side - 204, 387, 0.24, () => {
        snakeTree(ctx, paper);
        snake(ctx, paper, { helped: false });
      });
    }
    if (id === 'zanahoria') mini(x, 355, 0.46, () => {
      shape(ctx, 'M-35 0 Q-20 45 0 46 Q25 35 35 0Z', '#38362f');
      carrot(ctx, 0, -8, paper, 0, true);
    });
    if (id === 'conejo') mini(x, 355, 0.42, () => {
      rabbit(ctx, 0, 0, paper, { brown: true, facing: -1 });
      carrot(ctx, -29, -37, paper, -1.2, true);
    });
  }
  const current = clamp(state.scene || 0, 0, SCENES.length - 1);
  const [rx, routeY] = route[current];
  const climbing = SCENES[current].id === 'serpiente';
  const ry = climbing ? mix(550, 355, ease(clamp(((state.helpProgress || 0) - 0.32) / 0.68, 0, 1))) : routeY;
  const width = SCENE_GEOMETRY[current].width || WIDTH;
  const fraction = clamp((state.x || 0) / width, 0, 0.72);
  const next = route[Math.min(current + 1, SCENES.length - 1)];
  const cx = !climbing && current < SCENES.length - 1 ? mix(rx, next[0], fraction * 0.7) : rx;
  ctx.save();
  ctx.globalAlpha = 0.15;
  ellipse(ctx, cx, ry - 20, 35, 36, '#fff3cc');
  ctx.restore();
  rabbit(ctx, state.mode === 'ending' || SCENES[current].id === 'conejo' ? centers.at(-1) - 29 : cx, state.mode === 'ending' ? 355 : ry, paper, { scale: 0.4 });
  for (const x of [256, 512, 768, 1024]) {
    const fold = ctx.createLinearGradient(x - 10, 0, x + 9, 0);
    fold.addColorStop(0, '#182f3200');
    fold.addColorStop(0.47, '#1d34331c');
    fold.addColorStop(0.5, '#fff8df22');
    fold.addColorStop(1, '#fff8df00');
    ctx.fillStyle = fold;
    ctx.fillRect(x - 10, 0, 19, HEIGHT);
  }
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

function assistance(ctx, x, y, progress) {
  if (progress <= 0 || progress >= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.75;
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI + i * Math.PI / 4;
    const distance = 44 + progress * 35;
    const xx = x + Math.cos(a) * distance;
    const yy = y + Math.sin(a) * distance - 25;
    line(ctx, `M${xx} ${yy} l${Math.cos(a) * 8} ${Math.sin(a) * 8}`, '#fff3d7', 2.2);
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const paperCanvas = makePaper();
  const paper = ctx.createPattern(paperCanvas, 'repeat');
  const scenes = new Map();
  let scaleX = 1;
  let skyExtension = 0;
  let mapCache;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round((rect.width || WIDTH) * pixelRatio);
    const height = Math.round((rect.height || HEIGHT) * pixelRatio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    scaleX = canvas.width / WIDTH;
    // En pantallas altas se añade cielo; el conejo y el recorrido conservan
    // exactamente sus proporciones y sus coordenadas de colisión.
    skyExtension = Math.max(0, canvas.height / scaleX - HEIGHT);
    ctx.imageSmoothingEnabled = true;
  }

  function render(state, { reducedMotion = false, map = false } = {}) {
    ctx.setTransform(scaleX, 0, 0, scaleX, 0, 0);
    const scene = clamp(state.scene || 0, 0, SCENES.length - 1);
    const id = SCENES[scene].id;
    const time = reducedMotion ? 0 : state.time || 0;
    const ending = state.mode === 'ending';
    const title = state.mode === 'title';
    const night = ending || title || id === 'madriguera';
    const plateau = id === 'zanahoria' || id === 'conejo';
    if (skyExtension > 0) {
      ctx.fillStyle = map ? '#263c43' : night ? '#202530' : id === 'piedra' ? '#accfd1' : plateau ? '#b5c7b7' : '#9ec7cd';
      ctx.fillRect(0, 0, WIDTH, skyExtension + 1);
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, WIDTH, skyExtension + 1);
      ctx.restore();
      ctx.translate(0, skyExtension);
    }
    if (map) {
      const key = `${scene}:${state.mode}:${Math.round((state.x || 0) / 8)}:${Math.round((state.helpProgress || 0) * 32)}`;
      if (!mapCache || mapCache.key !== key) {
        const bitmap = surface();
        drawMap(bitmap.getContext('2d'), state, paper);
        mapCache = { key, bitmap };
      }
      ctx.drawImage(mapCache.bitmap, 0, 0);
      return;
    }
    const planted = id === 'zanahoria' && !state.carrotTaken;
    const key = night ? (ending ? 'guarda-final' : 'guarda-inicial') : `${id}:${planted}`;
    if (!scenes.has(key)) scenes.set(key, background(scene, paper, { ending, title, planted, hideSun: id === 'conejo' }));
    const layer = scenes.get(key);
    ctx.drawImage(layer.sky, 0, 0);
    let duskLayer;
    const duskProgress = id === 'conejo' && !ending ? ease(clamp((state.sceneTime || 0) / 0.65, 0, 1)) : 0;
    if (duskProgress > 0) {
      const duskKey = 'companion-dusk';
      if (!scenes.has(duskKey)) scenes.set(duskKey, background(scene, paper, { dusk: true, hideSun: true }));
      duskLayer = scenes.get(duskKey);
      ctx.save();
      ctx.globalAlpha = duskProgress;
      ctx.drawImage(duskLayer.sky, 0, 0);
      if (skyExtension > 0) ctx.drawImage(duskLayer.sky, 0, 0, WIDTH, 1, 0, -skyExtension, WIDTH, skyExtension);
      ctx.restore();
    }
    if (id === 'conejo' && !ending) {
      // Un único sol desciende y crece al pasar del encuentro al atardecer.
      const x = mix(300, 508, duskProgress);
      const y = mix(260, 610, duskProgress);
      const radius = mix(46, 218, duskProgress);
      const disc = new Path2D();
      disc.ellipse(x, y, radius * 0.97, radius, -0.04, 0, Math.PI * 2);
      paint(ctx, disc, CORAL, [x - radius, y - radius, radius * 2, radius * 2], paper, 12, 1.2);
    }
    ctx.save();
    const zoom = ending ? 1 : state.cameraZoom || 1;
    ctx.scale(zoom, zoom);
    ctx.translate(ending ? 0 : -(state.cameraX || 0), ending ? 0 : -(state.cameraY || 0));
    ctx.drawImage(layer.world, layer.left || 0, layer.top);
    if (duskLayer) {
      ctx.save();
      ctx.globalAlpha = duskProgress;
      ctx.drawImage(duskLayer.world, 0, duskLayer.top);
      ctx.restore();
    }
    if (night) {
      if (!ending) {
        const progress = title ? 0 : state.emergeProgress || 0;
        if (progress === 0) burrowEars(ctx, title ? 170 : state.x, GROUND - 20, paper);
        else {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, WIDTH, GROUND);
          ctx.clip();
          rabbit(ctx, state.x, state.y + 43 * (1 - ease(progress)), paper, {
            facing: state.facing || 1, time,
            moving: progress < 1 || reducedMotion ? 0 : state.vx,
            airborne: progress >= 1 && !state.grounded,
          });
          ctx.restore();
        }
      }
      ctx.restore();
      return;
    }
    if (!ending && id === 'tortuga') {
      const p = ease(clamp(state.helpProgress || 0, 0, 1));
      const tx = state.helped ? clamp(state.x, 450, 650) : 515;
      ctx.save();
      ctx.translate(tx, GROUND);
      ctx.scale(1 + p * 0.2, 1 + p * 0.5);
      turtle(ctx, 0, 0, paper, state.helped ? 1 : 0, time);
      ctx.restore();
    }
    if (!ending && id === 'zorro') {
      if (state.helped) fox(ctx, 548, GROUND, paper, true);
      else fox(ctx, 725, 306, paper, false);
    }
    if (!ending && id === 'elefante') elephant(ctx, 569, GROUND, paper, state);
    if (!ending && id === 'jirafa') giraffe(ctx, paper, state.helpProgress || 0);
    if (!ending && id === 'cocodrilo') crocodile(ctx, paper, state.helpProgress || 0, time);
    if (!ending && id === 'serpiente') snake(ctx, paper, state);
    if (id === 'conejo' || id === 'zanahoria' && state.carrotPhase !== 'planted') {
      const friendX = state.friendX ?? 1340;
      const facing = state.friendFacing || -1;
      const running = ['approaching', 'retreating'].includes(state.carrotPhase);
      const picking = state.carrotPhase === 'plucking';
      const hop = running && !reducedMotion ? Math.abs(Math.sin(time * 13)) * 13 : 0;
      rabbit(ctx, friendX, GROUND - hop, paper, {
        brown: true, facing, time, ducking: picking,
        moving: reducedMotion ? 0 : running ? 250 : state.friendGreeted ? state.vx : 0,
      });
      // La raíz desaparece de la tierra exactamente al pasar a sus patas.
      if (state.carrotTaken) carrot(ctx, friendX + facing * 28, GROUND - 37 - hop, paper, facing * 1.2, true);
    }
    if (!state.hiddenInReeds && state.grounded && Math.abs(state.vx || 0) > 30 && !reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ellipse(ctx, state.x - (state.facing || 1) * 27, state.y - 2, 14, 3.5, '#e3d2ab');
      ctx.restore();
    }
    if (!state.hiddenInReeds || ending) {
      rabbit(ctx, ending ? 825 : state.x ?? 120, ending ? GROUND : state.y ?? GROUND, paper, {
        facing: ending ? 1 : state.facing || 1,
        moving: reducedMotion || ending ? 0 : state.vx || 0,
        ducking: state.ducking,
        time,
        airborne: !state.grounded,
      });
    }
    if (layer.foreground && !ending) ctx.drawImage(layer.foreground, 0, 0);
    if (!reducedMotion && state.helped && !state.hiddenInReeds) assistance(ctx, state.x, state.y - 33, state.helpProgress || 0);
    ctx.restore();
  }

  resize();
  return { render, resize };
}
