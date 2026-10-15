# ¿Me ayudas?

Un pequeño conejo recorre un paisaje de papel pintado y descubre cuánto
puede conseguir con la ayuda de sus amigos. Adaptación jugable del cuento
de **Raúl Bermejo y Nacho Uve**, realizada a partir de la referencia visual
en vídeo.

**[Jugar en el navegador](https://aivm23.github.io/me-ayudas-juego/)**

Diez pantallas conectadas, ilustración original mediante Canvas 2D y un mapa
panorámico del camino. Sin sonido, cuentas, analítica ni conexiones externas
durante el juego. HTML, CSS y JavaScript nativos, sin framework ni compilación.

## Controles

| Tecla | Acción |
| --- | --- |
| ← / → | Caminar |
| Espacio | Saltar; cerca de un amigo, pedir ayuda |
| ↑ | Otra forma de saltar |
| ↓ | Agacharse para atravesar el túnel y los juncos |
| Esc | Pausar o continuar; cerrar el mapa |

El cuento empieza también con la barra espaciadora. En móvil hay controles
táctiles que permiten mantener pulsada una dirección mientras se salta.
Los botones superiores abren el mapa y la pausa; desde la pausa se puede
volver al principio. No hay vidas ni límite de tiempo. Si caes al agua,
vuelves a la orilla para intentarlo de nuevo.

## Ejecutar

Requisitos de desarrollo: **Node 24.16.0** y **pnpm 11.19.0**.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abrir `http://127.0.0.1:4173`. El servidor escucha en loopback por defecto;
se puede cambiar con `pnpm dev --host 0.0.0.0 --port 8080`.
También se puede servir el repositorio con cualquier servidor estático que
respete los tipos MIME de los módulos JavaScript. Funciona en una subcarpeta.

## Pruebas

```sh
pnpm exec playwright install --with-deps
pnpm verify
```

- `pnpm check`: sintaxis de JavaScript e integridad de los recursos del juego.
- `pnpm test`: física, colisiones, ayudas, progresión, reintentos y seguridad
  del servidor estático, con el ejecutor de pruebas de Node.
- `pnpm test:e2e`: teclado, recorrido jugable, pausa, mapa, reinicio y móvil,
  con navegadores reales y perfiles temporales aislados.

Playwright ejecuta Chromium, Firefox y WebKit. Los fallos conservan trazas
y capturas en directorios ignorados por Git. Para examinar el informe:
`pnpm exec playwright show-report`.

## CI y publicación

GitHub Actions comprueba cada push y pull request. La publicación en GitHub
Pages solo se ejecuta desde `main` después de superar las pruebas. Se
publican únicamente `index.html`, `styles.css`, `src/` y `assets/`.
Las acciones están fijadas a revisiones concretas; el lockfile fija las
dependencias de desarrollo. No hay dependencias de ejecución.

## Organización

```text
index.html            Interfaz accesible
styles.css            Tipografía, libro y controles adaptables
src/app.js            Teclado, táctil, pausa y presentación
src/engine.js         Física y diez pruebas, independiente del DOM
src/art.js            Paisaje, animales y panorama en Canvas 2D
assets/               Tipografías libres y favicon
tests/                Pruebas del motor y del navegador
scripts/              Servidor, comprobación y empaquetado estático
docs/storyboard.md    Análisis del vídeo y decisiones de adaptación
```

Consulta [los créditos](CREDITS.md) y [el análisis visual](docs/storyboard.md).
El vídeo y sus fotogramas de revisión no se distribuyen en el repositorio.
