# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El equipo de martech y campañas del BCP (squad de Growth Digital de Tarjetas de Crédito) que trabaja en Adobe Campaign v8. Son operadores que arman templates de email con fragmentos y condicionales, y que necesitan ver cómo queda el correo para cada perfil antes de mandarlo a aprobación. Lo usan en escritorio, dentro de su jornada en Campaign, y a veces revisan la vista móvil.

## Product Purpose

Muestra el correo tal como lo recibiría cada perfil, sin enviar pruebas reales: carga el HTML guardado del template, resuelve los fragmentos, elige una rama por grupo condicional según el escenario y rellena las variables con datos de muestra ficticios.

El preview cumple su trabajo cuando:
- el operador ve fiel cada escenario (variantes, fechas, plástico);
- la pieza llega a aprobación (Workfront, PNG, PDF o .html) sin armar capturas a mano;
- los errores salen antes del envío: variables sin valor, condiciones que no se pueden evaluar e includes o fragmentos rotos.

## Positioning

Vive dentro de la misma instancia de Campaign y trabaja sobre el HTML guardado real, con los fragmentos resueltos por nombre y los condicionales `[acr-dc-*]` podados con un evaluador propio. El resultado es el correo que saldría, no una simulación aparte.

## Operating Context

- Se despliega como página JSSP (`/cus/previewFragment.jssp`) en Campaign v8, instancia BCP stage12. Se prueba pegando el archivo en Campaign; no hay build ni servidor local.
- Se entra con `?frgId=`. El estado (escenario, datos de muestra editados, ancho, zoom) viaja en la URL, así que un enlace reproduce la vista.
- La aprobación pasa por Workfront. Las exportaciones PNG/PDF funcionan en Chrome o Edge, no en Safari.

## Capabilities and Constraints

- Vocabulario: template, fragmento, escenario, rama/variante, grupo condicional, datos de muestra.
- Restricciones técnicas duras en `CLAUDE.md`: solo ASCII, ES5 en el cliente, iframe con `sandbox="allow-same-origin"` y nada más, sin recursos externos y sin `<%`/`%>` en el cliente.
- Diseño actual: "Ficha del destinatario" (2026-09-25): el correo al centro es el protagonista; a la izquierda la ficha con el escenario (grillas de botones por variable), a la derecha los datos de muestra editables, barra fina azul oscuro. El diseño anterior (`design/Preview_de_templates.html`) queda como historia; su artboard E, "Ver todas las ramas", quedó descartado.
- Para revisar un template completo (todos los escenarios, inventario de variables, montos fijos) existe la skill `/evaluar-template <frgId>`.
- Pendiente: autenticación y validación del operador, credenciales de Workfront en el servidor, dominios de producción.

## Brand Commitments

Ninguno. Es una herramienta interna; la marca vive en el correo que se previsualiza, no en la UI del preview. Todo el texto de la interfaz va en español.

## Evidence on Hand

- Datos de muestra ficticios en el código. Nunca usar datos reales de clientes del banco.
- Diseño de referencia: `design/Preview_de_templates.html`.

## Product Principles

1. Fidelidad antes que adorno: lo que se ve debe ser lo que se envía.
2. Los errores se muestran, no se esconden: una variable sin valor o una condición no evaluable tiene que saltar a la vista.
3. El correo es el protagonista: la UI acompaña y se aparta.
4. Rapidez de operador: atajos de teclado, estado en la URL y exportación en un paso.
5. Seguridad por defecto: el HTML guardado nunca ejecuta scripts con la sesión del operador.
