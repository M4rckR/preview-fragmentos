---
version: 1
slug: "previewfragment-jssp"
primary_target: "previewFragment.jssp"
related_targets: ["design/maqueta-ficha-destinatario.html"]
---

# Preview de templates (previewFragment.jssp)

Modo: Operate. Operadores de martech BCP recorren escenarios de un template (tarea principal), revisan pendientes y exportan/envian a aprobacion. Riesgos: mas clics que hoy, y cualquier franja que le quite espacio o protagonismo al correo (Marcos descarto la Hoja de contactos por su tira superior).

## Direction contract

THESIS: El escenario es una frase sobre a quien le llega el correo, escrita en una ficha de destinatario; el correo ocupa toda la pantalla. Rechaza el panel de propiedades lateral y cualquier franja que empuje el correo.

OWN-WORLD: Mesa gris (#e8eaed); ficha blanca con renglones de direccion y tinta azul postal (#1f3a93) para los valores; un matasellos rojo (#c62d1f) circular es lo unico que grita, y solo si hay pendientes (si no, queda azul y quieto). Texto #1f2430, tipografia del sistema; mono solo en ids y fechas.

STORY: El operador lee "Para un cliente con segmento Consumo y producto LATAM Platinum", cambia una palabra y el correo cambia; ve el matasellos, lo abre y salta a cada problema en el correo.

FIRST VIEWPORT: Barra fina de 44 px con template, dispositivo, zoom y acciones directas. Debajo, el correo centrado desde arriba; en el margen izquierdo la ficha (sticky), en el derecho el matasellos con sus notas. Bajo ~1180 px, ficha y matasellos se pliegan en una linea sobre el correo.

FORM: Ficha del destinatario, posicion 5 de la segunda lista; seed ec4ba6c6 (re-roll 1). Firma: izquierda/derecha cambian el valor de la variable activa, arriba/abajo cambian de variable; el numero del matasellos cambia como evento visible. Raises: un solo territorio (mapa), un solo elemento que grita (TDR), cifra que cambia visible (nixie), estados con nombre y enlace (ciclorama), estados sin color (1 bit), problemas recortados sobre su zona (cantera).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisiones de Marcos posteriores al contrato (2026-09-25)
- La frase se reemplazo por grillas de botones por variable (pedido explicito).
- El matasellos se quito; queda un aviso chico "por revisar" junto a la etiqueta de datos de muestra, solo si hay algo.
- Sin "otro valor" en las variables. Barra azul oscuro #14275f. La ficha queda junto al correo y no se mueve al pasar a movil.
- (2026-09-26) Los datos de muestra (todo lo impreso salvo producto/plastico y segmento) son editables en un panel del margen derecho, en orden de aparicion en el template; bajo 1400 px es un cajon. Las marcas del correo solo se ven en el dato activo.
- (2026-09-26) La ayuda de teclado y el interruptor de atajos van en un panel "?" de la barra, no en la ficha. Atajos activados por defecto.

## Pendiente
- Implementado en previewFragment.jssp (2026-09-25 y 26). La maqueta (design/maqueta-ficha-destinatario.html) quedo atras del JSSP; la Hoja de contactos (design/maqueta-hoja-contactos.html) es la alternativa descartada por espacio.
- Falta: revision final independiente y DESIGN.md, cuando Marcos confirme en Campaign.
