# previewFragment2.jssp

Pagina JSSP (Dynamic JavaScript page, namespace `cus`) de Adobe Campaign que muestra el HTML
**guardado** de los templates de contenido (`nms:includeView`, tipo 1), permite ver cada escenario
de contenido condicional y enviar el resultado a Workfront. **Un solo archivo**, sin build, sin
dependencias, sin entorno local: se prueba desplegandolo.

## Como se prueba
Marcos pega el archivo en Campaign y abre:
`https://bcp-mkt-stage12.campaign.adobe.com/cus/previewFragment.jssp`
(Dynamic JavaScript pages -> `previewFragment`, namespace `cus` -> Edit code -> reemplazar todo.)
No hay entorno local ni pruebas automaticas: **antes de entregar un cambio, revisa a mano la lista
"Reglas duras" de aqui abajo y dile a Marcos que pase `QA-CAMPAIGN.md`.**
Mover el archivo como archivo: pegarlo via chat/markdown se come `*` y `\` (rompe comentarios y regex).

## Estado actual (leer antes de tocar nada)
- La UI ya esta **redisenada** segun el handoff de Claude Design (`design/handoff-legible.html`):
  buscador de templates, panel de escenario, ramas activas, datos de muestra, zoom, avisos con
  detalle, Workfront con dialogo propio, estado en la URL y atajos. Ver `CHANGELOG.md`.
- **Nunca se ha visto renderizada**: ni en un navegador ni dentro de Campaign.
- **El `.jssp` esta SIN login**, a pedido, para poder probar. El bloque de `checkAuthentication`
  quedo comentado al inicio del archivo. No lo borres ni lo "limpies": hay que volver a ponerlo
  antes de dejarlo fijo, junto con la validacion por operador antes del escalamiento.

## Estructura del archivo
1. Bloque de servidor (arriba, hasta `<!DOCTYPE html>`): consulta a Campaign y `logonEscalation`.
   **No tocar sin que Marcos lo pida.**
2. Plantilla HTML + CSS (tokens como variables CSS en `:root`).
3. `<script>` cliente: buscador, poda de condicionales, panel, avisos, Workfront.
   La logica pura (sin DOM) esta entre `// BEGIN-PODA` y `// END-PODA`.

## Reglas duras del entorno (cada una viene de un problema real)
1. **Nunca escribas `<%` ni `%>` literales en la parte cliente** (ni en strings, regex o
   comentarios): el servidor los toma por codigo. Se arman por partes:
   `var O = "<" + "%", C = "%" + ">";`
2. **Solo ASCII en todo el archivo.** Acentos como entidades (`M&oacute;vil`) en HTML o `\u00f3`
   en JS (`\u00bf` = ?, `\u2713` = check). El servidor real mostro `M?vil` por codificacion.
3. **Nada guardado se imprime con `<%= %>`.** Los datos viajan con `encodeURIComponent` en
   atributos `data-*` y el cliente los decodifica; se insertan con `textContent` o `srcdoc`.
   Solo se permiten `<%= datosLista %>`, `<%= selAttr %>` y `<%= datosHtml %>`.
   (Evidencia: al escapar a mano, el HTML se veia como texto; `<%=` parece escapar por si solo.)
4. **El iframe del preview lleva `sandbox=""`** (sin allow-scripts): el contenido guardado no es
   confiable.
5. **Sin `eval`, `new Function`, XHR ni recursos externos** (CDN, fuentes, imagenes remotas).
   Los condicionales se evaluan con el mini evaluador propio (`targetData.X` / `recipient.X`,
   textos, `== != === !== && || ! ( )`).
6. **Unico `fetch` permitido: el de Workfront**, escrito como `fetch(WORKFRONT_URL, ...)`.
   - `var WORKFRONT_URL = "";` queda **vacia en el repo**; la URL se pega solo en Campaign.
   - Con la URL vacia el boton sale deshabilitado y ningun manejador llega al `fetch`.
     (Sin esa guarda, `fetch("")` hace POST a la propia pagina, responde 200 y la UI diria
     "Enviado" sin haber enviado nada.)
   - Solo se considera exito `res.ok`.
7. ES5 (`var`, `function`), sin dependencias ni build.
8. **Sin datos reales del banco** en el `diccionario` de valores de muestra: nombres, correos y
   telefonos ficticios (`@example.com`).
9. `logonEscalation` va FUERA del `try`; el `finally` restaura el contexto.

## Comportamiento que debes conservar
- El HTML guardado trae los condicionales como codigo de Campaign:
  `<% if (cond) {%><%/* [acr-dc-start-cond(Etiqueta,id,idCond)] */%>...<%/* [acr-dc-end-cond] */%><%} else {%>...<%}%>`
  dentro de `[acr-dc-start-group(id)]` ... `[acr-dc-end-group]`. La poda elige una rama por grupo.
- **Valores de muestra**: los tokens `<%= targetData.X %>` / `recipient.X` y
  `<%@ include view='n' %>` se reemplazan por el valor del `diccionario` si existe; si no, se ven
  como `[X]`. El interruptor "muestra / [CAMPOS]" apaga el reemplazo.
- `<%@ include fragment="VIEWnnn" %>` -> recuadro amarillo "no resuelto" (limitacion conocida).
- Condiciones no evaluables cuentan en `noEval`, se salta esa rama y se listan en el panel Detalle.
- Workfront envia `{ templateId, nombreTemplate, htmlFinal, fechaEnvio }`; `htmlFinal` es lo que se
  ve en pantalla (escenario aplicado y, si esta activo, con valores de muestra).
- El escenario vive en la URL: `?frgId=..&v.VARIABLE=valor&todas=1&muestra=0&w=375&z=80`.

## Diseno
El diseno aprobado esta en `design/handoff-legible.html` (artboards A-M, tokens y decisiones).
**Manda el diseno** en lo visual; mandan estas reglas en lo tecnico. Si algo del diseno no se puede
construir con las reglas, dilo y propone la alternativa mas cercana.
Los tokens viven como variables CSS en `:root`; usalas, no pongas colores sueltos.

## Deuda conocida
- El `.jssp` fue **reconstruido** a partir de una version pegada en el chat a la que le faltaban los
  `*` y `\`. Si aparece el archivo real exportado de Campaign, comparar antes de seguir.
- Sin login y sin validacion por operador antes del escalamiento.
- Los `<%@ include fragment %>` no se resuelven. Resolverlos requiere consultar `nms:includeView`
  por nombre en el servidor.
- Workfront puede fallar por CORS/CSP desde el dominio de Campaign; sin probarlo no se sabe.
- Preguntas abiertas del handoff: al final de `design/handoff-legible.html`.
