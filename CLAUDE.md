# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Dos páginas JSSP (Dynamic JavaScript pages, namespace `cus`) de Adobe Campaign v8 (instancia BCP stage12). No hay build, dependencias ni servidor local.
- `previewFragment.jssp` → `/cus/previewFragment.jssp`. Lista los templates de email, carga el HTML **guardado**, resuelve fragmentos, poda los condicionales según un escenario y muestra el correo en un iframe. Exporta .html, PNG y PDF, y envía a Workfront.
- `proxy-images.jssp` → se publica en Campaign como **`/cus/imgProxy.jssp`** (el preview lo llama con ese nombre). Descarga imágenes de hosts sin CORS desde el servidor y devuelve texto `data:image/...;base64,...` para las exportaciones PNG/PDF.
- `design/Preview_de_templates.html`: bundle del diseño aprobado (artboards A–M). Está empaquetado: para leerlo hay que extraer el `__bundler/template` y el `__bundler/manifest` (base64 + gzip). El artboard E, "Ver todas las ramas", quedó descartado.

Idioma: todo (código, comentarios, commits, respuestas a Marcos) va en español.

## Cómo se prueba

La única prueba real es desplegar: Marcos pega el archivo en Campaign (Explorer > Administration > Configuration > Dynamic JavaScript pages) y abre, por ejemplo, `https://bcp-mkt-stage12.campaign.adobe.com/cus/previewFragment.jssp?frgId=11104969`. Hace falta commit y push para que pueda probarlo. Siempre trabaja sobre el archivo real: si lo pegas por chat se pierden `*` y `\`.

Verificación antes de cada commit (no hay lint ni tests en el repo; `lint.sh` se borró). Revisa la sintaxis del script de cliente y tres reglas duras: solo ASCII, nada de `<%`/`%>` en el script y nada del permiso de scripts en todo el archivo:
```sh
python3 - <<'EOF'
import re,subprocess
t=open('previewFragment.jssp').read()
js=re.findall(r'<script>(.*?)</script>',t,re.S)[0]
open('/tmp/c.js','w').write(js)
assert all(ord(c)<128 for c in t), 'hay caracteres no ASCII'
assert '<'+'%' not in js and '%'+'>' not in js, 'hay <% o %> en el script de cliente'
assert 'allow-'+'scripts' not in t, 'permiso de scripts en el archivo'
subprocess.run(['node','--check','/tmp/c.js'],check=True)
print('ok')
EOF
```

Prueba visual en local: copia desde `<!DOCTYPE html>` hacia abajo y reemplaza `<%= datosLista %>`, `<%= selAttr %>`, `<%= datosHtml %>` (HTML de correo pasado por `encodeURIComponent`) y `<%= datosFrg %>`. Quita los `<% if/else %>` y sirve el resultado con `python3 -m http.server`. La parte de servidor y el proxy solo se pueden probar en Campaign.

## Estructura de `previewFragment.jssp`

1. **Servidor** (hasta `<!DOCTYPE html>`). Consulta `nms:includeView`: `@type=1` son los templates y `@type=2` los fragmentos. Resuelve `<%@ include fragment="VIEWnnn" %>` en `frgResuelve` con un mapa nombre→id (`frgCargaMapa`) y `load(id)`, de forma recursiva y con topes. El token usa el **`@name`**, no el `@id`. Las consultas filtradas por `@name` nunca funcionaron en esta instancia, así que no las reintentes. Corre con `logonEscalation("neolane")`, que va fuera del `try`. No toques esta parte sin que te lo pidan.
2. **HTML + CSS.** Los tokens de diseño son variables en `:root`; usa esas, no colores sueltos. Las clases siguen BEM en español (`.barra__btn`, `.vars__seg`, `.fechas__f`…).
   - **Movimiento.** Tokens en `:root`: `--ease-out: cubic-bezier(0.23,1,0.32,1)` y las duraciones `--dur-xs` (120ms), `--dur-sm` (150ms), `--dur-md` (180ms) y `--dur-lg` (200ms). No escribas ms ni curvas sueltas. Todo vive en el bloque `/* ---------- movimiento ---------- */`:
     - Hover: solo `background-color`/`color` con `--dur-xs ease`.
     - Respuesta al clic: `:active { transform:scale(0.97) }`. En filas de ancho completo es más leve: `.menu__lista button` usa 0.98 y `.vars__sw` usa 0.985. Si agregas un botón, súmalo a las listas de `transition` y `:active`.
     - Entradas con keyframes (`entra-menu`, `entra-fechas`, `entra-modal`, `entra-detalle`, `entra-panel`, `funde`): parten de `opacity:0` más un `scale(0.96–0.97)` o un desplazamiento de 4 a 12 px, nunca `scale(0)`. `transform-origin` va hacia el disparador: el menú desde arriba a la derecha, el panel de fechas desde abajo a la derecha. El modal queda centrado.
     - La salida siempre es instantánea (`hidden` o quitar la clase).
     - Solo se animan `transform` y `opacity`. Nada de `transition: all`, `ease-in` ni duraciones de más de 300ms.
     - **Sin animación a propósito:** la lista del combo, el zoom, escritorio/móvil (también se accionan con teclado: `/`, `D`, `M`), el repintado del correo al cambiar el escenario y el panel de Escenario en escritorio (va en el flujo y el lienzo se reacomoda de golpe). No los animes.
     - `cambiarTexto(boton, txt, reposo)` cambia el texto de un botón sin mover la barra: durante los estados pasajeros el `min-width` solo crece y el texto entra con `.cambia` (un blur leve). Al volver al texto normal, pasa `reposo=true` para soltar el `min-width`; si no, el botón queda inflado para siempre y la barra (que hace wrap) puede quedar en dos líneas. Úsala siempre que un botón de la barra cambie de texto (Copiar enlace, Workfront, Descargar).
     - El panel flotante (≤900px) solo se anima con `.panel--entra`, que se pone al abrirlo con el riel. No lo animes en la carga: elegir un template recarga la página.
     - `.avisos--nuevo` (un fundido) solo se pone en `avisoWf`. No lo pongas en `pintarAvisos`, que corre en cada repintado.
     - `@media (prefers-reduced-motion:reduce)` va **al final del `<style>`**, para ganarles a los media queries de ancho. Las entradas usan `--ease-out`, también las que son solo un fundido. Deja solo fundidos y mantiene la respuesta al clic, porque es un scale en su lugar que no desplaza nada.
3. **Script de cliente** (ES5: `var` y `function`, sin arrow functions, `let`/`const` ni template literals). La lógica pura de poda vive entre `// BEGIN-PODA` y `// END-PODA`:
   - `podar(src, perfil, opciones)` elige una rama por grupo `[acr-dc-start-group]`…`[acr-dc-end-group]` con un evaluador propio, sin `eval` ni `Function`. Después reemplaza los tokens `<%= targetData.X %>` y `<%@ include view='X' %>` por `valorMuestra(k)` o por `[X]`. Devuelve `{html, elegidas, noEval, sinValor, includes, fechas}`.
   - Prioridad de `valorMuestra`: fecha editada (`editados`) > valor dinámico (`valorDinamico`: `PLASTICO` sale del `CODPRODUCTO` elegido) > `diccionario`. Los datos de muestra son ficticios; no pongas datos reales del banco.
   - `pintar()` guarda el resultado limpio en `ultimo`. `ultimo.html` es lo que usan Descargar (.html, PNG y PDF) y Workfront. El iframe de la vista se pinta con `senalar:true`: los campos sin valor van entre `⟪…⟫` y los grupos sin rama dejan un comentario `pv-sin-rama N`, y `senalarFaltas()` los convierte en marcas ámbar al cargar. Mientras el editor de fechas está abierto lleva además las marcas `⟦KEY⟧…⟦/⟧`. Ninguna de estas marcas debe llegar a `ultimo.html`.
   - Estado en la URL (`leerURL`/`escribirURL`): `frgId`, `v.VAR` (escenario), `d.CAMPO` (fechas editadas), `muestra=0`, `w=375`, `z=NN`.
   - La vista mide el alto y el ancho reales del correo (`medirVista`). En escritorio, el marco crece si el correo pide más de 700 px (por ejemplo, `body{min-width:750px}`). Para medir el alto, encoge el iframe a 0, lee `scrollHeight` y le devuelve su alto en la misma tarea, guardando y reponiendo el scroll del lienzo. Con el alto actual puesto, `scrollHeight` nunca baja de ese alto y un correo corto no podría achicarse. `pintar()` conserva el alto anterior hasta que mide el correo nuevo; `ALTO_VISTA` (3000) solo se usa en la primera vista.
   - En los campos de contacto (`DESCORREO…`, `DESNBRE…`, `DESCELULAR…EENNPRINCIPAL`), las condiciones se omiten al elegir variantes, pero sus valores ficticios sí se muestran.

## Reglas duras (cada una viene de un problema real)

- **El iframe de la vista y los de captura llevan `sandbox="allow-same-origin"` y nada más.** Nunca agregues el permiso de scripts: junto con `allow-same-origin` anula el aislamiento, y el HTML guardado correría con la sesión del operador.
- **Nunca escribas `<%` ni `%>` literales en la parte de cliente** (tampoco en strings, regex ni comentarios): el servidor los ejecuta. Arma esas cadenas con `var O = "<" + "%", C = "%" + ">";`.
- **Solo ASCII en los archivos.** Los acentos van como entidades HTML (`M&oacute;vil`) o escapes JS (`ó`); el servidor rompió la codificación una vez.
- Los datos del servidor viajan con `encodeURIComponent` en atributos `data-*` y se pintan con `textContent` o `srcdoc`. Los únicos `<%= %>` permitidos son `datosLista`, `selAttr`, `datosHtml` y `datosFrg`. Todo valor insertado en el HTML del correo pasa por `esc()`.
- **En los JSSP, la salida se escribe con `document.write`; nunca con `response.write`**, que da 500 `BAS-010063`, un error que esconde el detalle real. `response.sendError(n)` sí funciona. Para depurar el servidor, usa un modo `?dbg=N` que corte por pasos y escriba con `document.write`.
- El proxy mantiene la lista cerrada `PERMITIDOS` (host y prefijo de ruta), solo acepta `https`, solo extensiones de imagen y rechaza `..`. Sin eso queda expuesto a SSRF. `HttpClientRequest` funciona sin `logonEscalation`. Si cambias los hosts, actualiza también `PNG_PROXY_HOSTS` en el preview.
- Los únicos `fetch` son el de Workfront (`fetch(WORKFRONT_URL, …)`) y el de las imágenes para PNG/PDF (proxy o CORS). No uses recursos externos (CDN, fuentes, imágenes remotas) en la página.

## Estado y pendientes conocidos

- Hoy **el preview y el proxy no piden login** (solo es aceptable en stage). El bloque `checkAuthentication` está comentado; no lo borres, porque hay que reactivarlo sin `response.write`. Antes de `logonEscalation` falta validar el operador (named right o grupo, lo decide el admin de Campaign del banco).
- `WORKFRONT_URL`, `WORKFRONT_USER` y `WORKFRONT_PASS` están escritos en el cliente, y el repo en GitHub es público. Hay que moverlos al servidor.
- Producción: cambiar `bcp-mid-stage13` por el dominio de producción en `PERMITIDOS` y en `PNG_PROXY_HOSTS`.
- Pendiente de probar en Campaign (commits del 2026-09-25): la nueva medición del alto con correos cortos, largos con imágenes y con `height:100%`, además de las animaciones y la respuesta al clic.
- La exportación PNG/PDF (SVG `foreignObject` → canvas) no funciona en Safari (`SecurityError`); se usa Chrome o Edge. No incrusta `url()` dentro de `<style>` ni fuentes externas.
