# ¿Me ayudas?

Un pequeño conejo recorre un paisaje de papel pintado y descubre cuánto
puede conseguir con la ayuda de sus amigos. Adaptación jugable del cuento
de **Raúl Bermejo y Nacho Uve**, realizada a partir de la referencia visual
en vídeo.

**[Jugar en el navegador](https://aivm23.github.io/me-ayudas-juego/)**

Trece pantallas conectadas, ilustración original mediante Canvas 2D y un mapa
panorámico del camino. Sin sonido, cuentas, analítica ni conexiones externas
durante el juego. HTML, CSS y JavaScript nativos, sin framework ni compilación.

## Controles

| Tecla | Acción |
| --- | --- |
| ← / → | Caminar |
| Espacio | Saltar; cerca de un amigo, pedir ayuda |
| ↑ | Otra forma de saltar |
| ↓ + ← / → | Recorrer agachado el túnel del zorro |
| Esc | Pausar o continuar; cerrar el mapa |

El cuento empieza también con la barra espaciadora. Una guarda nocturna
muestra las orejas del conejo: con espacio o → sale de su madriguera y
comienza el camino. En móvil hay controles
táctiles que permiten mantener pulsada una dirección mientras se salta.
Los botones superiores abren el mapa y la pausa; desde la pausa se puede
volver al principio. No hay vidas ni límite de tiempo. Si caes al agua,
vuelves a la orilla para intentarlo de nuevo.

El zorro muestra un túnel excavado bajo la roca. El elefante aparece primero
de espaldas: el primer espacio lo hace girar y el segundo pide su ayuda.
La jirafa espera al otro lado del río y acerca el cuello hasta tu orilla.
Los juncos se atraviesan caminando: el conejo desaparece entre ellos y puedes
seguir con → o retroceder con ← hasta reaparecer. Ante la pared, espacio
abre suavemente el encuadre hasta mostrar toda la montaña y el conejo
pequeño en su base. La serpiente baja desde su rama y te eleva a la meseta.
Al acercarte a una zanahoria solitaria, aparece el conejo marrón, la arranca
y se la lleva. Acércate a él y seguid caminando juntos al atardecer. El cuento
se cierra en un huerto nocturno: solo asoman las cuatro orejas de los amigos.

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
- `pnpm test:e2e`: teclado, las trece pantallas y sus pasos intermedios, pausa,
  mapa, reinicio y móvil, con navegadores reales y perfiles temporales aislados.

Playwright comprueba la interfaz en Chromium, Firefox y WebKit y ejecuta el
recorrido completo con controles reales en Chromium. Cubre el giro del
elefante, el descenso por el túnel, la marcha y el retorno entre los juncos,
la salida de la madriguera, la pared previa, el zoom que revela la montaña,
el ascenso de la serpiente y la entrada, recogida y retirada del conejo marrón
antes de la marcha conjunta hacia el huerto.
La fidelidad de las ilustraciones se revisa con capturas del juego y los
fotogramas originales; los atributos de estado prueban las reglas y la
progresión. Los fallos conservan trazas y capturas en directorios ignorados
por Git. Para examinar el informe:
`pnpm exec playwright show-report`.

Para comprobar solo Chromium y Firefox en un sistema que no tenga las
bibliotecas de WebKit:

```sh
pnpm test:e2e --project=chromium --project=firefox
```

La CI ejecuta siempre los tres motores en Ubuntu 24.04.

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
src/engine.js         Física y trece etapas, independiente del DOM
src/art.js            Paisaje, animales, cámaras y panorama en Canvas 2D
assets/               Tipografías libres y favicon
tests/                Pruebas del motor y del navegador
scripts/              Servidor, comprobación y empaquetado estático
docs/storyboard.md    Análisis del vídeo y decisiones de adaptación
```

Consulta [los créditos](CREDITS.md) y [el análisis visual](docs/storyboard.md).
El vídeo y sus fotogramas de revisión no se distribuyen en el repositorio.
