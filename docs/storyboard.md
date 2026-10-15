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
| 36–46 s | Elefante junto a una roca enorme; levanta al conejo | La trompa eleva al conejo hasta la roca |
| 47–49 s | Pequeño charco azul | Saltar de orilla a orilla |
| 50–56 s | Jirafa muy alta que dobla el cuello sobre un río | Pedirle ayuda para formar un puente |
| 57–62 s | Cocodrilo alargado dormido en un río más ancho | Despertarlo y atravesar su lomo |
| 63–72 s | Juncos amarillos, cola rayada asomando | Agacharse y avanzar entre los juncos |
| 73–90 s | Pared vertical clara y serpiente roja en una rama | Pedir ayuda y subir con la serpiente |
| 91–101 s | Meseta, zanahoria y segundo conejo marrón | Alcanzar al nuevo amigo |
| 102–110 s | Atardecer oscuro y desplegable de todo el recorrido | Mapa panorámico continuo, con progreso |
| 111–116 s | Los conejos se marchan juntos; huerto en guardas finales | Encuentro y huerto al terminar |

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

La interfaz rodea la ilustración como un libro abierto. La sombra central
evoca el pliegue de las páginas. Títulos, pistas y controles permanecen en
HTML para conservar legibilidad, foco y acceso con teclado. El mapa muestra
el camino completo en una única franja de paisaje, siguiendo el desplegable.

## Decisiones de juego

El cuento no es un laberinto: el mapa confirma una única dirección de avance.
Cada obstáculo introduce una acción sencilla. Se conservan el orden y la
función de los animales; las ayudas se activan cerca del amigo con la misma
tecla que sirve para saltar. Las elevaciones requieren seguir caminando y
los pasos estrechos se recorren agachado.

El pájaro y la cola entre los juncos son detalles narrativos; no se inventan
combates. El recorrido no añade enemigos, monedas, vidas ni un cronómetro.
Las caídas permiten intentarlo de nuevo desde la misma orilla. Abrir el mapa,
pausar o cambiar de ventana detiene el avance. El final enlaza la amistad con
las zanahorias de las últimas páginas.

## Criterios de comprobación

1. Las diez pantallas se completan en orden mediante controles reales.
2. Las rocas, los ríos y los pasos estrechos no se pueden atravesar sin
   resolver su prueba correspondiente.
3. La ayuda aparece junto al animal y altera el paso de forma visible.
4. El mapa conserva todos los hitos y marca el progreso sin permitir saltos.
5. El conejo no pierde la partida y dispone de pistas contextuales.
6. El paisaje y los controles siguen utilizables con otros tamaños de ventana.
7. El juego no depende de audio, peticiones externas ni un framework.
