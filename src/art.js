import { WIDTH, HEIGHT, GROUND, SCENE_GEOMETRY } from './engine.js';

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
  const isDusk = options.ending || scene >= 8;
  const topColor = options.ending ? '#554741' : scene >= 7 ? '#928357' : scene >= 3 ? '#8c7252' : '#7e8055';
  const gradient = ctx.createLinearGradient(0, GROUND, 0, HEIGHT);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.32, options.ending ? '#49423a' : '#8b7c50');
  gradient.addColorStop(1, options.ending ? '#292e2d' : isDusk ? '#716647' : '#78764b');
  const p = new Path2D(`M0 ${GROUND} C230 ${GROUND - 1},370 ${GROUND + 2},540 ${GROUND} C850 ${GROUND + 2},1070 ${GROUND - 2},1280 ${GROUND} L1280 720 L0 720Z`);
  paint(ctx, p, gradient, [0, GROUND - 3, WIDTH, HEIGHT - GROUND + 3], paper, 671 + scene, 1.5);
  const rng = random(719 + scene);
  ctx.save();
  ctx.clip(p);
  for (let i = 0; i < 90; i += 1) {
    const y = GROUND + 10 + rng() * 150;
    const x = rng() * WIDTH;
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
  if (helped) {
    line(ctx, 'M28 3 q10 2 16 -3 M34 10 q10 1 16 -5', '#d7bc8d66', 1.3);
  }
  ctx.restore();
}

function elephant(ctx, x, feet, paper, state) {
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

function bezierPoint(points, t) {
  const a = 1 - t;
  return {
    x: a ** 3 * points[0].x + 3 * a * a * t * points[1].x + 3 * a * t * t * points[2].x + t ** 3 * points[3].x,
    y: a ** 3 * points[0].y + 3 * a * a * t * points[1].y + 3 * a * t * t * points[2].y + t ** 3 * points[3].y,
  };
}

function ribbon(points, width, steps = 48) {
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = bezierPoint(points, t);
    const next = bezierPoint(points, Math.min(1, t + 0.001));
    const previous = bezierPoint(points, Math.max(0, t - 0.001));
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
  const x = 494;
  const base = GROUND;
  // El cuerpo permanece en la orilla; el largo cuello llega hasta la otra.
  shape(ctx, 'M477 524 L477 560 L487 560 L490 525 M508 526 L512 560 L522 560 L520 516', '#d69a52');
  shape(ctx, 'M477 556 L487 556 L487 561 L476 561Z M511 556 L523 556 L523 561 L512 561Z', '#635449');
  paint(ctx, 'M473 521 Q474 501 491 499 Q510 499 522 517 L516 541 L484 541Z', '#dda04e', [470, 497, 56, 47], paper, 130, 1);
  const points = [
    { x: 510, y: 531 },
    { x: mix(505, 560, p), y: mix(460, 571, p) },
    { x: mix(474, 776, p), y: mix(299, 578, p) },
    { x: mix(474, 868, p), y: mix(211, 578, p) },
  ];
  const neck = ribbon(points, 37);
  paint(ctx, neck, '#dfa04d', [453, 190, 443, 411], paper, 131, 0.8);
  ctx.save();
  ctx.clip(neck);
  for (let i = 0; i < 14; i += 1) {
    const point = bezierPoint(points, i / 13);
    const offset = i % 2 ? -10 : 7;
    ellipse(ctx, point.x + (1 - p) * offset, point.y + p * offset, 8 + i % 3, 11 - i % 4, '#ad5746', i * 0.4);
  }
  ctx.restore();
  for (let i = 0; i < 53; i += 1) {
    const point = bezierPoint(points, i / 52);
    line(ctx, `M${point.x + (1 - p) * 19} ${point.y - p * 19} l${mix(10, 0, p)} ${mix(0, -10, p)}`, '#755845', 1.15);
  }
  const end = points[3];
  ctx.save();
  ctx.translate(end.x, end.y - p * 10);
  ctx.scale(mix(1, -1, p) || 0.01, 1);
  const head = new Path2D('M10 9 Q14 -9 2 -17 L-19 -20 L-53 4 Q-70 14 -64 26 Q-57 36 -44 26 L-15 20 Q1 25 10 9Z');
  paint(ctx, head, '#e0a351', [-68, -24, 85, 62], paper, 134, 0.8);
  shape(ctx, 'M-10 -16 L-8 -38 L-2 -38 L-1 -15 M4 -14 L11 -35 L16 -32 L12 -11', '#d49d5c');
  ellipse(ctx, -5, -38, 4.5, 3.5, '#735846');
  ellipse(ctx, 14, -34, 4.2, 3.6, '#735846');
  shape(ctx, 'M9 -9 Q33 -26 38 -15 Q29 -1 11 0Z', '#d5984b');
  line(ctx, 'M15 -6 L31 -16', '#a4694c', 1.4);
  ellipse(ctx, -18, -3, 5.2, 6.6, '#faf0d7');
  ellipse(ctx, -19, -2, 2.8, 4.5, '#312f29');
  ellipse(ctx, -56, 19, 3, 4, '#9d6148');
  ctx.restore();
  ellipse(ctx, x - 1, base - 29, 5, 7, '#ae5b45', -0.6);
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

function reeds(ctx, paper, foreground = false) {
  const rng = random(149);
  if (!foreground) {
    const tail = new Path2D('M747 544 C750 503 757 444 729 407 C714 388 686 389 684 408 C683 420 693 426 699 419 C693 414 694 404 705 407 C738 418 737 486 731 541Z');
    paint(ctx, tail, '#d99156', [682, 389, 80, 160], paper, 151, 1);
    ctx.save();
    ctx.clip(tail);
    for (let i = 0; i < 11; i += 1) {
      line(ctx, `M${672 + i * 7} ${400 + i * 13} l50 -13`, '#3e3830', 8);
    }
    ctx.restore();
  }
  const count = foreground ? 109 : 145;
  for (let i = 0; i < count; i += 1) {
    const x = 469 + rng() * 465;
    const height = (foreground ? 22 : 85) + rng() * (foreground ? 87 : 113);
    const lean = rng() * 20 - 10;
    const gold = i % 4 === 0;
    ctx.globalAlpha = foreground ? 0.79 : 0.64;
    line(ctx, `M${x} 563 Q${x - 3} ${560 - height * 0.5},${x + lean} ${560 - height}`, gold ? '#977842' : '#9f8151', foreground ? 1.45 : 1.1);
    if (i % 3) {
      ellipse(ctx, x + lean, 560 - height, 2.9 + rng() * 1.2, 5.2 + rng() * 2.6, gold ? '#b99b5a' : '#aa8850', lean * 0.03);
    } else {
      line(ctx, `M${x + lean} ${560 - height} l-3 -10 M${x + lean} ${560 - height} l4 -14`, '#ae945b', 1);
    }
  }
  ctx.globalAlpha = 1;
}

function cliff(ctx, paper, x = 850, top = 300, bottom = HEIGHT) {
  const path = new Path2D(`M${x + 21} ${top} Q${x - 8} ${top + 6},${x - 1} ${top + 54} C${x + 10} ${top + 119},${x - 2} ${top + 186},${x + 10} ${bottom} L1280 ${bottom} L1280 ${top}Z`);
  const gradient = ctx.createLinearGradient(x, top, 1150, 720);
  gradient.addColorStop(0, '#b3a591');
  gradient.addColorStop(0.48, '#a09580');
  gradient.addColorStop(1, '#7e7762');
  paint(ctx, path, gradient, [x - 10, top, WIDTH - x + 20, bottom - top], paper, 160, 1.9);
  ctx.save();
  ctx.clip(path);
  line(ctx, `M${x + 48} ${top + 31} l-15 18 9 17 -3 11 M${x + 35} ${top + 190} l14 11 -7 16 5 17 M${x + 190} ${top + 141} l-9 17 9 11 1 20 M1138 ${top + 23} l-9 20 3 12`, '#655f4e33', 2);
  ctx.restore();
  line(ctx, `M${x + 25} ${top + 1} Q1060 ${top - 2} 1280 ${top}`, '#cec19e77', 2);
  grass(ctx, x + 13, GROUND, 0.5, '#6b704d');
}

function snake(ctx, paper, state) {
  const p = ease(clamp(state.helpProgress || 0, 0, 1));
  const active = state.helped;
  const head = {
    x: active ? clamp(state.x || 550, 480, 850) : 563,
    y: active ? (Number.isFinite(state.assistY) ? state.assistY : mix(GROUND, 300, p)) + 11 : 501,
  };
  const points = [
    { x: 906, y: 304 },
    { x: 800, y: 216 },
    { x: active ? head.x + 113 : 792, y: active ? head.y + 50 : 502 },
    head,
  ];
  const body = ribbon(points, 24);
  paint(ctx, body, '#b64345', [head.x - 25, 220, 407, 360], paper, 167, 1.1);
  ctx.save();
  ctx.clip(body);
  for (let i = 0; i < 24; i += 1) {
    const point = bezierPoint(points, i / 23);
    ellipse(ctx, point.x, point.y, 8.4, 8.7, '#4b3633');
    ellipse(ctx, point.x + 1, point.y, 4.7, 5.1, '#d9b567');
    ellipse(ctx, point.x + 2, point.y - 1, 2.8, 3.1, '#604436');
  }
  ctx.restore();
  ctx.save();
  ctx.translate(head.x, head.y);
  const face = new Path2D('M13 -10 Q-4 -17 -22 -9 Q-36 -4 -30 5 Q-26 13 -8 10 L15 6Z');
  paint(ctx, face, '#aa4241', [-35, -17, 53, 31], paper, 169, 0.8);
  ellipse(ctx, -18, -6, 5.2, 5.8, '#eee1b3');
  ellipse(ctx, -19, -6.8, 2.1, 3.5, '#3e352b');
  ellipse(ctx, -3, -8, 4.4, 4.8, '#e5d6a6');
  ellipse(ctx, -4, -8.5, 1.7, 3.2, '#3e352b');
  line(ctx, 'M-30 5 Q-18 8 -11 5', '#56302d', 1);
  if (!active) {
    line(ctx, 'M-30 4 q-13 1 -16 9 M-42 11 l-7 -1 M-42 11 l-3 7', '#b24b55', 1.4);
  }
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

function background(scene, paper, options = {}) {
  const canvas = surface();
  const ctx = canvas.getContext('2d');
  const ending = options.ending;
  const title = options.title;
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND + 10);
  if (ending) {
    sky.addColorStop(0, '#28383c');
    sky.addColorStop(0.38, '#454248');
    sky.addColorStop(0.8, '#a74d5e');
    sky.addColorStop(1, '#ce6072');
  } else if (scene === 0) {
    sky.addColorStop(0, '#accfd1');
    sky.addColorStop(0.35, '#b2c6cd');
    sky.addColorStop(0.76, '#c38f9f');
    sky.addColorStop(1, '#ce8096');
  } else if (scene === 9) {
    sky.addColorStop(0, '#829a9e');
    sky.addColorStop(0.6, '#b9b2a7');
    sky.addColorStop(1, '#d68d82');
  } else {
    sky.addColorStop(0, '#9ec7cd');
    sky.addColorStop(0.55, '#acd1d1');
    sky.addColorStop(1, '#a8caca');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (scene === 0 || ending || scene === 9) {
    const sunX = ending ? 508 : title ? 994 : scene === 9 ? 1017 : 321;
    const sunY = ending ? 610 : scene === 9 ? 542 : 311;
    const radius = ending ? 218 : title ? 117 : scene === 9 ? 163 : 113;
    const disc = new Path2D();
    disc.ellipse(sunX, sunY, radius * 0.97, radius, -0.04, 0, Math.PI * 2);
    paint(ctx, disc, CORAL, [sunX - radius, sunY - radius, radius * 2, radius * 2], paper, 12, 1.2);
  }
  if (ending) {
    cloud(ctx, 240, 144, 233, 39, paper, '#a4bdc0');
    cloud(ctx, 1060, 99, 116, 21, paper, '#adc4c5');
  } else {
    cloud(ctx, title ? 853 : 810, 142, 272, 57, paper);
    cloud(ctx, title ? 1130 : 1034, 236, 151, 41, paper);
    if (scene === 7) cloud(ctx, 163, 152, 191, 44, paper);
  }
  ground(ctx, scene, paper, { ending });
  const geometry = SCENE_GEOMETRY[scene] || {};
  if (scene === 0 || scene === 1 || scene === 3) {
    const r = geometry.rock || ({ 0: { x: 610, width: 110, top: 470 }, 1: { x: 670, width: 130, top: 350 }, 3: { x: 710, width: 155, top: 318 } })[scene];
    rock(ctx, r.x, r.width, r.top, paper, 21 + scene);
  }
  if (scene === 0) bird(ctx, 814, GROUND, paper);
  if (scene === 2) {
    // El zorro conoce un paso bajo la roca, visible como un corte de la tierra.
    const r = geometry.tunnel || { x: 620, width: 200, ceiling: 516, top: 305 };
    rock(ctx, r.x + 22, r.width - 44, r.top, paper, 24, r.ceiling);
    const tunnel = new Path2D(`M${r.x - 24} 560 Q${r.x - 14} 545,${r.x - 7} ${r.ceiling + 12} Q${r.x - 1} ${r.ceiling},${r.x + 15} ${r.ceiling} L${r.x + r.width - 15} ${r.ceiling} Q${r.x + r.width + 9} ${r.ceiling},${r.x + r.width + 22} 560 Q${r.x + r.width + 14} 589,${r.x + 157} 601 Q${r.x + 96} 634,${r.x + 24} 601 Q${r.x - 16} 589,${r.x - 24} 560Z`);
    paint(ctx, tunnel, '#484035', [r.x - 25, r.ceiling, r.width + 50, 122], paper, 43, 1.5);
    line(ctx, `M${r.x - 24} 560 Q${r.x - 13} 544,${r.x - 7} ${r.ceiling + 12} Q${r.x - 1} ${r.ceiling},${r.x + 15} ${r.ceiling} L${r.x + r.width - 15} ${r.ceiling} Q${r.x + r.width + 9} ${r.ceiling},${r.x + r.width + 22} 560`, '#827a55', 7);
    line(ctx, `M${r.x - 3} 561 Q${r.x + 109} 579,${r.x + r.width + 8} 559`, '#272e2726', 2);
  }
  if (scene >= 4 && scene <= 6) {
    const fallback = scene === 4 ? { x: 550, end: 700 } : scene === 5 ? { x: 550, end: 860 } : { x: 530, end: 900 };
    const gap = geometry.gap || fallback;
    water(ctx, gap.left ?? fallback.x, gap.right ?? fallback.end, paper, scene === 4 ? 'puddle' : 'river');
  }
  if (scene === 7) reeds(ctx, paper);
  if (scene === 8) cliff(ctx, paper);
  if (scene === 9) garden(ctx, paper, ending);
  const plants = scene === 0 ? [[457, 0.65], [921, 0.48], [1173, 0.36]] : [[83, 0.6], [1055, 0.48], [1154, 0.25]];
  for (const [x, size] of plants) grass(ctx, x, GROUND, size, ending ? '#5f6b4f' : '#73774e');
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
  return canvas;
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
  const earth = new Path2D('M0 553 Q216 548 398 552 Q600 551 825 542 Q996 539 1110 541 L1110 720 L0 720Z');
  const soil = ctx.createLinearGradient(0, 541, 0, 720);
  soil.addColorStop(0, '#7c6953');
  soil.addColorStop(1, '#504f3c');
  paint(ctx, earth, soil, [0, 540, WIDTH, 180], paper, 204, 1.8);
  // Un paisaje continuo, como el gran desplegable al final del cuento.
  const mini = (x, y, scale, draw) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    draw();
    ctx.restore();
  };
  mini(110, 551, 0.22, () => {
    rock(ctx, -45, 90, -70, paper, 20, 0);
    bird(ctx, 85, 0, paper);
  });
  mini(228, 551, 0.27, () => {
    turtle(ctx, -42, 0, paper);
    rock(ctx, 4, 105, -154, paper, 21, 0);
  });
  mini(346, 552, 0.28, () => {
    rock(ctx, -40, 110, -160, paper, 22, 0);
    fox(ctx, 15, -160, paper);
    line(ctx, 'M-78 4 Q0 52 82 4', '#302f2b', 12);
  });
  mini(464, 551, 0.28, () => {
    elephant(ctx, -48, 0, paper, { helped: false });
    rock(ctx, 97, 130, -210, paper, 23, 0);
  });
  shape(ctx, 'M563 550 Q577 582 600 552Z', '#65909d');
  mini(565, 399, 0.27, () => giraffe(ctx, paper, 0));
  shape(ctx, 'M717 550 Q728 578 754 548Z', '#6a97a2');
  shape(ctx, 'M770 546 Q786 583 866 544Z', '#60899a');
  mini(655, 419, 0.23, () => crocodile(ctx, paper, 1));
  mini(761, 403, 0.25, () => reeds(ctx, paper));
  const wall = new Path2D('M1111 359 Q1081 360 1083 399 Q1092 462 1095 541 L1093 720 L1280 720 L1280 355 Q1198 350 1111 359Z');
  const cliffFill = ctx.createLinearGradient(1088, 356, 1250, 720);
  cliffFill.addColorStop(0, '#a39983');
  cliffFill.addColorStop(0.65, '#8a8069');
  cliffFill.addColorStop(1, '#6b6552');
  paint(ctx, wall, cliffFill, [1078, 351, 205, 370], paper, 206, 1.7);
  line(ctx, 'M1112 370 l-6 12 5 11 -1 20 M1105 479 l12 10 -6 15', '#615f4e42', 1.6);
  mini(884, 281, 0.26, () => snake(ctx, paper, { helped: false }));
  mini(1172, 357, 0.39, () => rabbit(ctx, 0, 0, paper, { brown: true, facing: -1 }));
  mini(1220, 357, 0.35, () => carrot(ctx, 0, 8, paper, 0.3));
  const route = [
    [78, 552], [190, 552], [306, 553], [410, 551], [543, 552],
    [652, 551], [767, 548], [887, 543], [1012, 541], [1138, 357],
  ];
  const current = clamp(state.scene || 0, 0, 9);
  const [rx, ry] = route[current];
  const fraction = state.mode === 'ending' ? 1 : clamp((state.x || 0) / WIDTH, 0, 0.75);
  const next = route[Math.min(current + 1, 9)];
  const cx = current < 8 ? mix(rx, next[0], fraction) : rx;
  ctx.save();
  ctx.globalAlpha = 0.15;
  ellipse(ctx, cx, ry - 20, 35, 36, '#fff3cc');
  ctx.restore();
  rabbit(ctx, state.mode === 'ending' ? 1135 : cx, state.mode === 'ending' ? 357 : ry, paper, { scale: 0.45 });
  // Los pliegues recuerdan el papel del panorama, sin dividirlo en tarjetas.
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
    const scene = clamp(state.scene || 0, 0, 9);
    const time = reducedMotion ? 0 : state.time || 0;
    if (skyExtension > 0) {
      ctx.fillStyle = map ? '#263c43' : state.mode === 'ending' ? '#28383c'
        : scene === 0 ? '#accfd1' : scene === 9 ? '#829a9e' : '#9ec7cd';
      ctx.fillRect(0, 0, WIDTH, skyExtension + 1);
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, WIDTH, skyExtension + 1);
      ctx.restore();
      ctx.translate(0, skyExtension);
    }
    if (map) {
      // El paisaje estático se conserva; el pequeño conejo marca el progreso.
      const key = `${scene}:${state.mode}:${Math.round((state.x || 0) / 8)}`;
      if (!mapCache || mapCache.key !== key) {
        const bitmap = surface();
        drawMap(bitmap.getContext('2d'), state, paper);
        mapCache = { key, bitmap };
      }
      ctx.drawImage(mapCache.bitmap, 0, 0);
      return;
    }
    const key = `${scene}:${state.mode === 'ending'}:${state.mode === 'title'}`;
    if (!scenes.has(key)) {
      scenes.set(key, background(scene, paper, { ending: state.mode === 'ending', title: state.mode === 'title' }));
    }
    ctx.drawImage(scenes.get(key), 0, 0);
    if (scene === 1) {
      const p = ease(clamp(state.helpProgress || 0, 0, 1));
      const tx = state.helped ? clamp(state.x, 450, 650) : 515;
      ctx.save();
      ctx.translate(tx, GROUND);
      ctx.scale(1 + p * 0.2, 1 + p * 0.5);
      turtle(ctx, 0, 0, paper, state.helped ? 1 : 0, time);
      ctx.restore();
    }
    if (scene === 2) fox(ctx, 725, 306, paper, state.helped);
    if (scene === 3) elephant(ctx, 569, GROUND, paper, state);
    if (scene === 5) giraffe(ctx, paper, state.helpProgress || 0);
    if (scene === 6) crocodile(ctx, paper, state.helpProgress || 0, time);
    if (scene === 8) snake(ctx, paper, state);
    if (scene === 9) {
      rabbit(ctx, state.mode === 'ending' ? 956 : 930, GROUND, paper, { brown: true, facing: state.mode === 'ending' ? 1 : -1, time });
    }
    if (state.grounded && Math.abs(state.vx || 0) > 30 && !reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ellipse(ctx, state.x - (state.facing || 1) * 27, state.y - 2, 14, 3.5, '#e3d2ab');
      ctx.restore();
    }
    const ending = state.mode === 'ending';
    rabbit(ctx, ending ? 825 : state.x ?? 120, ending ? GROUND : state.y ?? GROUND, paper, {
      facing: ending ? 1 : state.facing || 1,
      moving: reducedMotion || ending ? 0 : state.vx || 0,
      ducking: state.ducking,
      time,
      airborne: !state.grounded,
    });
    if (scene === 7) reeds(ctx, paper, true);
    if (scene === 8 && state.x > 870 && state.y >= GROUND - 2) {
      // Protección gráfica si una transición coloca al conejo detrás del corte.
      cliff(ctx, paper);
    }
    if (!reducedMotion && state.helped) {
      assistance(ctx, state.x, state.y - 33, state.helpProgress || 0);
    }
  }

  resize();
  return { render, resize };
}
