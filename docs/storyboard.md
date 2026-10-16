# Del cuento al juego

Se revisó la secuencia visual completa de la referencia (116,743556 segundos),
sin procesar el sonido. Se inspeccionaron 117 muestras, una por segundo,
y ampliaciones de las páginas con animales, obstáculos y final. El plan de
desarrollo se definió después de revisar también el mapa desplegable.

## Lectura de las páginas

| Tiempo aproximado | Contenido observado | Adaptación jugable |
| --- | --- | --- |
| 0–6 s | Cubierta, guardas nocturnas y portada; conejo sobre piedra | Título y presentación del protagonista |
| 7–16 s | Amanecer rosa, sol rojo, conejo ante piedras pequeñas | Primer salto con espacio |
| 17–21 s | Piedra mayor y pájaro oscuro sobre el conejo | Pájaro como parte del paisaje y anuncio de ayuda |
| 22–27 s | Tortuga de caparazón oscuro con bandas azules, roca | Pedir ayuda y saltar desde el caparazón |
| 28–35 s | Zorro rojo sobre roca y túnel bajo tierra | Pedir ayuda y pasar agachado por el túnel |
| 36–39 s | El trasero del elefante parece una segunda roca oscura | Una primera pulsación lo hace girar |
| 40–46 s | Elefante de perfil junto a la roca clara; levanta al conejo | Una segunda pulsación pide ayuda a su trompa |
| 47–49 s | Pequeño charco azul | Saltar de orilla a orilla |
| 50–56 s | Jirafa en la orilla derecha; se arrodilla y extiende el cuello hacia la izquierda | Llamarla desde la orilla opuesta y cruzar sobre su cuello |
| 57–62 s | Cocodrilo alargado dormido en un río más ancho | Despertarlo y atravesar su lomo |
| 63–65 s | Entrada a los juncos amarillos, cola rayada asomando | Entrar caminando con la flecha derecha |
| 66–69 s | Una doble página de vegetación densa, sin conejo visible | Seguir andando oculto o retroceder con la flecha izquierda |
| 70–72 s | El conejo reaparece al otro lado; juncos a la izquierda | Salir sin necesidad de agacharse |
| 73–77 s | Pared vertical altísima sin serpiente visible | Pantalla propia; acercarse y mirar arriba con espacio |
| 78–83 s | Serpiente enrollada en una rama alta del costado de la montaña; baja la cabeza | Pedir ayuda una vez y esperar que se acerque |
| 84–90 s | La serpiente sostiene al conejo en un lazo y lo eleva a la meseta | Ascenso continuo con cámara vertical y cuerpo enrollado en la rama |
| 91–95 s | El conejo recorre la meseta; aparece una sola zanahoria en un bolsillo de tierra | Pantalla propia de la zanahoria, antes del encuentro |
| 96–101 s | El conejo marrón come junto al mismo bolsillo de tierra | Encontrarlo en una pantalla posterior |
| 102–110 s | Atardecer oscuro y desplegable de todo el recorrido | Mapa panorámico continuo, con progreso |
| 111–114 s | Conversación y partida de los dos conejos juntos | Saludar al marrón y seguir caminando con él |
| 115–116 s | Huerto extenso de zanahorias en las guardas finales | Escena final propia después de caminar juntos |

## Dirección visual

El espacio vacío del álbum es parte de la composición. El paisaje tiene un
suelo continuo y bajo, pocas hierbas finas, nubes blancas aplanadas y grandes
discos rojos para el sol. La luz cambia del amanecer rosa al azul grisáceo,
el amarillo del final de la tarde y la noche rojiza del desplegable.

Se recrean las siluetas asimétricas del collage: conejo marfil, orejas rosas
largas, bigotes delicados, piedras irregulares, tortuga oscura, zorro granate,
elefante gris pardo, jirafa ocre con manchas rojas, cocodrilo oliva y serpiente
roja con manchas circulares. El dibujo utiliza formas y texturas generadas
en JavaScript, sin fotografías ni capturas extraídas del vídeo.

El pasadizo del zorro tiene dos bocas al nivel del camino y un fondo curvo
en U bajo tierra; el conejo sigue esa curva en vez de pasar por una abertura
sobre el suelo. El zorro se asoma cabeza abajo al ayudar. La primera silueta
del elefante conserva solo el trasero redondeado, las dos patas y la cola,
antes de mostrar oreja, cara y trompa. La jirafa mantiene cuerpo y patas en
la orilla derecha durante toda la ayuda.

Los juncos forman un tramo de 2560 unidades, el doble del ancho del lienzo.
La cámara sigue el recorrido entre tallos ocres y flores pequeñas muy densos.
Mientras el conejo está completamente dentro, se ocultan también su silueta
y cualquier indicador sobre él. La cámara vertical de la serpiente permite
que la pared continúe fuera de pantalla y descubrir después su cima, con
la rama y el cuerpo enrollado en su lugar durante el ascenso.

La interfaz rodea la ilustración como un libro abierto. La sombra central
evoca el pliegue de las páginas. Títulos, pistas y controles permanecen en
HTML para conservar legibilidad, foco y acceso con teclado. El mapa muestra
el camino completo en una única franja de paisaje, siguiendo el desplegable.

## Decisiones de juego

El cuento no es un laberinto: el mapa confirma una única dirección de avance.
Cada obstáculo introduce una acción sencilla. Se conservan el orden y la
función de los animales; las ayudas se activan cerca del amigo con la misma
tecla que sirve para saltar. Las elevaciones requieren seguir caminando y
el túnel se recorre agachado.

Solo el túnel del zorro necesita agacharse. Los juncos no bloquean el paso:
ocultan al protagonista, que mantiene el movimiento normal en ambos
sentidos. La pared anterior a la serpiente y la zanahoria anterior al conejo
marrón conservan sus propias pantallas. La zanahoria no se recoge ni se
convierte en un premio. Saludar al nuevo amigo inicia la compañía; hay que
seguir caminando para llegar juntos al huerto final.

El pájaro y la cola entre los juncos son detalles narrativos; no se inventan
combates. El recorrido no añade enemigos, monedas, vidas ni un cronómetro.
Las caídas permiten intentarlo de nuevo desde la misma orilla. Abrir el mapa,
pausar o cambiar de ventana detiene el avance. El final enlaza la amistad con
las zanahorias de las últimas páginas.

## Criterios de comprobación

1. Las doce pantallas se completan en orden mediante controles reales:
   piedra, tortuga, zorro, elefante, charco, jirafa, cocodrilo, juncos, pared,
   serpiente, zanahoria y conejo. El huerto aparece después del saludo y la
   marcha conjunta.
2. Las rocas, los ríos y el túnel no se pueden atravesar sin
   resolver su prueba correspondiente.
3. La ayuda aparece junto al animal y altera el paso de forma visible.
4. El mapa conserva todos los hitos y marca el progreso sin permitir saltos.
5. El conejo no pierde la partida y dispone de pistas contextuales.
6. El paisaje y los controles siguen utilizables con otros tamaños de ventana.
7. El juego no depende de audio, peticiones externas ni un framework.

Las pruebas del motor verifican reglas y límites; las pruebas de navegador
recorren las etapas usando flechas y espacio, sin cambiar el estado desde
una API de pruebas. Las comprobaciones del túnel incluyen su profundidad;
las de los juncos, la ocultación, el retorno y la cámara horizontal; las de la
serpiente, las fases de descenso y elevación y la cámara vertical. La
composición y las siluetas se contrastan además mediante capturas con los
fotogramas del vídeo: los atributos del DOM no demuestran por sí solos la
fidelidad visual.
