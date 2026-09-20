# previewFragment2.jssp

Pagina JSSP (Dynamic JavaScript page, namespace `cus`) de Adobe Campaign que muestra el HTML
**guardado** de los templates de contenido (`nms:includeView`, tipo 1), permite ver cada escenario
de contenido condicional y enviar el resultado a Workfront. **Un solo archivo**, sin build, sin
dependencias, sin entorno local: se prueba desplegandolo.

## Como se prueba
Marcos pega el archivo en Campaign y abre:
`https://bcp-mkt-stage12.campaign.adobe.com/cus/previewFragment.jssp`
(Dynamic JavaScript pages -> `previewFragment`, namespace `cus` -> Edit code -> reemplazar todo.)
No hay entorno local: **antes de entregar un cambio, corre `sh lint.sh`** (revisa las reglas duras
que se pueden comprobar leyendo el archivo), repasa a mano el resto de la lista "Reglas duras" de
aqui abajo y **dile a Marcos que pase `QA-CAMPAIGN.md`**, que es la unica prueba de verdad.
Para la lógica de variantes, corre también `node tests/preview-contacto.test.js` (sin dependencias).
Mover el archivo como archivo: pegarlo via chat/markdown se come `*` y `\` (rompe comentarios y regex).

## Estado actual (leer antes de tocar nada)
- La UI ya esta **redisenada** segun el handoff de Claude Design (`design/handoff-legible.html`):
  buscador de templates, panel de escenario, ramas activas, datos de muestra, zoom, avisos con
  detalle, Workfront con dialogo propio, estado en la URL y atajos. Ver `CHANGELOG.md`.
- **Nunca se ha visto renderizada**: ni en un navegador ni dentro de Campaign.
- **Mientras el login siga fuera, este repo NO vuelve a ser publico.** Paso a privado el
  2026-09-20 por esto. La cabecera del `.jssp` dice que la pagina no exige sesion y que corre
  con `logonEscalation("neolane")` (administrador): publicarla es dar media entrada, y el
  `OBSERVACIONES.json` lo deja por escrito junto con el host de stage12 y la nomenclatura
  interna. Antes de volver a ponerlo publico hay que restaurar el login **y** la validacion
  por operador (ver el TODO al inicio del `.jssp`).
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
   Solo se permiten `<%= datosLista %>`, `<%= selAttr %>`, `<%= datosHtml %>` y
   `<%= datosFrg %>` (la traza de fragmentos: nombres que ya pasaron el filtro
   `/^[A-Za-z0-9_-]+$/` y una de seis palabras que escribe el propio archivo).
   (Evidencia: al escapar a mano, el HTML se veia como texto; `<%=` parece escapar por si solo.)
4. **El iframe del preview lleva `sandbox="allow-same-origin"` y nada mas.** El contenido guardado
   no es confiable. `allow-same-origin` esta solo para que la pagina pueda leer el alto real del
   correo (`medirVista`) y el scroll lo haga el lienzo; sin scripts, el contenido no puede hacer
   nada con ese origen. **Nunca agregar el permiso de scripts del sandbox**: junto con
   `allow-same-origin` anula el aislamiento y deja el HTML guardado corriendo en el origen de
   Campaign. `sh lint.sh` falla si aparece.
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
- **Vista visual sin condiciones de contacto**: al elegir variantes se omiten exclusivamente
  `DESCORREOEENNPRINCIPAL`, `DESNBREENNPRINCIPAL` y `DESCELULAREENNPRINCIPAL`, tanto en
  `targetData` como en `recipient`. Se eliminan sus predicados de AND/OR/NOT; no se sustituyen
  por `true` dentro de un OR, porque activaría Consumo indebidamente. El resto de condiciones
  sigue evaluándose. Si una condición solo contiene esos campos, se elige la primera rama.
  No aparecen como controles ni se conservan en los enlaces del preview. Sus valores ficticios
  siguen sustituyéndose en el HTML en modo muestra. Esto no modifica las reglas del template
  guardado ni valida la selección real de destinatarios. La descarga y Workfront usan esta vista.
- El HTML guardado trae los condicionales como codigo de Campaign:
  `<% if (cond) {%><%/* [acr-dc-start-cond(Etiqueta,id,idCond)] */%>...<%/* [acr-dc-end-cond] */%><%} else {%>...<%}%>`
  dentro de `[acr-dc-start-group(id)]` ... `[acr-dc-end-group]`. La poda elige una rama por grupo.
- **Valores de muestra**: los tokens `<%= targetData.X %>` / `recipient.X` y
  `<%@ include view='n' %>` se reemplazan por el valor del `diccionario` si existe; si no, se ven
  como `[X]`. El interruptor "muestra / [CAMPOS]" apaga el reemplazo.
- **Solo los fragmentos BLOQUEADOS llegan como token.** En el editor se distinguen por la clase:
  `acr-fragment is-locked` (se guarda por referencia, deja el `<%@ include fragment=... %>`) frente
  a `acr-fragment acr-component` (se guarda con el HTML dentro). Por eso la mayor parte del correo
  se ve bien sin resolver nada: en el template de referencia hay 162 no bloqueados y 2 bloqueados.
- **El CSS del fragmento ya viaja**: va como `<style type="text/css" data-fragment-ref="VIEWnnn">`
  dentro del `<head>` del HTML guardado, con sus media queries. Al resolver **solo** se inyecta el
  `source.html` del cuerpo; no hay que buscar ni duplicar el CSS, y el `<div>` envoltorio y las
  clases del fragmento entran tal cual.
- `<%@ include fragment="VIEWnnn" %>` se resuelve **en el servidor** (`frgResuelve`): se sustituye
  por el `source.html` del `nms:includeView` con ese `@name`, de forma recursiva (tope 5 niveles,
  corte de ciclos, tope de ~2 MB). Lo que aprendio stage12 y no se debe volver a perder:
  - El nombre del token es el **`@name`**, NO el `@id`: `VIEWnnn` es autogenerado con su propio
    contador (`@id=136` no existe; `VIEW136` es el id 11034018).
  - `@type` separa la tabla: **0** bloques de personalizacion de Adobe, **1** templates (los que
    lista el buscador), **2** fragmentos. La resolucion filtra por `@type=2`; un template puede
    llamarse igual (el 11104969 se llama `PTLL_MDP_0017_...`).
  - El HTML del fragmento entra tal cual, con sus condicionales y tokens: los poda el cliente.
  - Un token que no se resuelve se deja intacto -> recuadro amarillo y panel Detalle,
    con la causa: «no existe» (el nombre no está en la tabla), «existe pero no trae html»,
    «se cortó por tamaño» o «ciclo o profundidad». Los resueltos salen en la columna
    «Fragmentos resueltos» del mismo panel.
  - **No se filtra por nombre en la consulta.** Las condiciones con `@name` (igualdad e `IN`)
    nunca funcionaron en esta instalación y no se llegó a explicar por qué; `load(id)` sí
    funciona. Se trae la tabla entera de `@type=2` (~180 filas) en **una** consulta por
    petición, se arma el mapa `nombre -> id` en memoria (`frgCargaMapa`) y cada token se
    resuelve con `NLWS.nmsIncludeView.load(id)`. Si vuelves a intentarlo con condiciones por
    cadena, es justo lo que ya falló.
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
- Workfront puede fallar por CORS/CSP desde el dominio de Campaign; sin probarlo no se sabe.
- Preguntas abiertas del handoff: al final de `design/handoff-legible.html`.
