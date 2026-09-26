---
target: previewFragment.jssp (ficha del destinatario)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/marcosdev/Personal/Develop/trabajo/preview-fragmentos/previewFragment.jssp"
target_fingerprint: "sha256:abfae03b8e15c7703af0b781ffc0edd0231cf4640319ea93f7f564ec8cf6e35c"
target_path: /Users/marcosdev/Personal/Develop/trabajo/preview-fragmentos/previewFragment.jssp
timestamp: 2026-09-26T04-17-21Z
slug: previewfragment-jssp
---
Method: dual-agent (A: revision de diseno + accesibilidad + pulido · B: detector + navegador)

## Design Health Score

| # | Heuristica | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidad del estado | 2 | Condiciones no evaluables y campos sin valor dentro de un href no se ven en ningun lado; el resultado de PNG/PDF (#accion) queda fuera de vista si se hizo scroll |
| 2 | Correspondencia con el mundo real | 3 | Codigos crudos (FLGCASHBACK), "con dato"/"(vacio)" es jerga |
| 3 | Control y libertad | 3 | Por defecto, fechas originales y URL reversibles |
| 4 | Consistencia | 3 | Variable de un solo valor como boton presionado; .lnk con poco peso |
| 5 | Prevencion de errores | 2 | Sin revision antes de exportar; PNG con imagenes en blanco sale en verde |
| 6 | Reconocer antes que recordar | 3 | La variable activa apenas se distingue (linea al 35 %) |
| 7 | Flexibilidad y eficiencia | 3 | Flechas, 1-9, D/M, /; falta recorrer combinaciones en secuencia y marcar revisados |
| 8 | Estetica y minimalismo | 3 | Escritorio limpio; bajo 1080 px la ficha entera tapa el correo |
| 9 | Recuperacion de errores | 2 | Resultado de exportar escondido y con tono equivocado; Workfront desactivado se explica solo en un title |
| 10 | Ayuda | 2 | Ayuda de atajos presente; sin leyenda de las marcas ambar |
| **Total** | | **26/40** | **Aceptable** |

## Veredicto de especificidad
Propio a medias: mesa gris, correo protagonista, azul postal, PARA y "escenario n de N". La frase y el matasellos del contrato se quitaron por pedido de Marcos (grillas de botones y sin sello), asi que el contrato quedo desactualizado; lo que queda se acerca a un panel de propiedades bien hecho. Detector: 1 hallazgo real (texto de ayuda de teclado en 11 px, #ayuda); los demas son intencionales o vienen de extensiones del navegador.

## Problemas prioritarios
- [P1] Pendientes invisibles: sin el sello, pendientes() solo aparece en el modal de Workfront (pausado). Condiciones no evaluables y campos en href (p. ej. ?c=[CODCAMPANA]) no tienen marca. Fix: contador compacto en .centro__cab solo si hay pendientes, que despliegue la lista; en senalarFaltas, contorno ambar en el elemento cuyo atributo se limpio. (clarify)
- [P1] Bajo 1080 px el correo sale de la primera pantalla: la ficha completa va arriba (a 800 px el correo empieza en ~720 px). Fix: en angosto, ficha plegada en una linea de chips que despliega la grilla. (adapt)
- [P2] Resultado de exportar escondido y en verde aunque haya imagenes en blanco. Fix: estado accion--aviso ambar y resultado visible (bajo la barra o en el boton). (harden)
- [P2] Variable activa poco visible y 1-9 mudo para lector de pantalla; FLGCASHBACK crudo, "con dato"/"(vacio)". Fix: marca mas clara en .var--activa, anunciar al elegir variable, traducir etiquetas. (typeset/clarify)
- [P3] Teclado caro: 16+ paradas de Tab en la ficha, flechas actuan con foco en la barra, 14 productos sin agrupar por familia, variable de un solo valor como boton. (polish)

## Alertas por persona
- Alex: no puede recorrer las 28 combinaciones en secuencia ni marcar revisados; las flechas cambian escenario con foco en la barra.
- Sam: 1-9 no se anuncia; 16 paradas de Tab; Workfront desactivado sin explicacion accesible; ninguna region viva cuenta pendientes.
- Operadora de martech: exporta PNG, ve verde y lo sube con imagenes en blanco; en laptop de 1024 px no ve ficha y correo a la vez.

## Observaciones menores
- Sticky con top:0: la ficha pierde el aire; usar top de 20 px.
- #ayuda en 11 px (instruccion, no metadato): subir a 12 px.
- Cajas .var anidadas en la ficha: peso visual alto.
- Workfront desactivado con fondo translucido parece activo.
- pendientes() sigue sin incluir el desborde en Movil.

## Preguntas
1. Sin sello, donde vive la respuesta a "esta pieza esta lista"?
2. Hace falta la grilla de 14 productos siempre abierta si se recorre con flechas?
3. Con 28 escenarios, no es "cuantos revise y cuales tienen problemas" lo mas valioso de la pantalla?
