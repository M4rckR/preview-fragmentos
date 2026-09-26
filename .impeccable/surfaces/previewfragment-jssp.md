---
version: 1
slug: "previewfragment-jssp"
primary_target: "previewFragment.jssp"
related_targets: ["design/maqueta-hoja-contactos.html"]
---

# Preview de templates (previewFragment.jssp)

Modo: Operate. Operadores de martech BCP recorren escenarios de un template (tarea principal), revisan pendientes y exportan/envian a aprobacion. Riesgo a evitar: mas clics que hoy. Nada es intocable mientras la funcion siga igual.

## Direction contract

THESIS: El preview es una hoja de contactos: cada variante del correo es un fotograma real a la vista y la lupa amplia el elegido. Rechaza el arreglo por defecto (panel de propiedades + lienzo) donde las variantes existen solo como botones y hay que imaginarse el resultado.

OWN-WORLD: Mesa de luz gris (#dfe1e4) con lienzo blanco; la tira es pelicula negra (#16181b) con codigos de borde ambar en mono (01A, 02A...). Un solo lapiz graso rojo (#d6372b): circulo a mano para el fotograma actual, X y cifra para los que tienen pendientes. Texto grafito (#1d2126). Tipografia del sistema; los valores de variable se escriben grandes bajo su fotograma. Cada valor lleva un tono derivado estable (tick en el borde del fotograma y en su control).

STORY: El operador ve de un vistazo como cambia el correo con cada valor de cada variable, salta a uno con un clic o con flechas, detecta en que fotogramas hay pendientes antes de abrirlos y exporta sin abrir menus.

FIRST VIEWPORT: Barra blanca (48px): titulo, combo de template, .html / PNG / PDF / Copiar enlace / Workfront como controles con nombre. Debajo la tira de pelicula a todo el ancho (~200px) con fotogramas agrupados por variable. Debajo, columna de escenario (280px: valores actuales, pendientes clicables, fechas editables en linea, bitacora) y la lupa con el correo a tamano real, con dispositivo y zoom en su cabecera.

FORM: Hoja de contactos, posicion 6 de mi lista ordenada; seed ec4ba6c6. Firma: flechas izquierda/derecha recorren fotogramas y todos se recalculan contra el escenario nuevo; H despliega la tira en hoja completa. Raises: teclado primero y bitacora (terminal), sin menus (casetera), plegado/desplegado (Miura), valor grande como etiqueta (tormenta), tono derivado por valor (generativa).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Pendiente
- Maqueta en design/maqueta-hoja-contactos.html; el JSSP no se toca hasta que Marcos la apruebe.
