# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Dos páginas JSSP (Dynamic JavaScript pages, namespace `cus`) de Adobe Campaign v8 (instancia BCP stage12). No hay build, dependencias ni servidor local.
- `previewFragment.jssp` → `/cus/previewFragment.jssp`. Lista los templates de email, carga el HTML **guardado**, resuelve fragmentos, poda los condicionales según un escenario y muestra el correo en un iframe. Exporta .html, PNG y PDF, y envía a Workfront.
- `proxy-images.jssp` → se publica en Campaign como **`/cus/imgProxy.jssp`** (el preview lo llama con ese nombre). Descarga imágenes de hosts sin CORS desde el servidor y devuelve texto `data:image/...;base64,...` para las exportaciones PNG/PDF.
- `PRODUCT.md`: contexto de producto (usuarios, propósito, principios). Lo usa la skill `impeccable`; léelo antes de proponer cambios de diseño.
- `.impeccable/critique/`: críticas de diseño guardadas, con fecha: 24/40, 27/40 y 26/40 (la tercera, sobre el rediseño; sus problemas ya se aplicaron el 2026-09-25). `/impeccable polish` lee de ahí los problemas prioritarios.
- `.impeccable/surfaces/previewfragment-jssp.md`: contrato de diseño del rediseño "Ficha del destinatario" y las decisiones de Marcos posteriores.
- `design/maqueta-ficha-destinatario.html`: maqueta del diseño actual (con la poda real y un correo ficticio). `design/maqueta-hoja-contactos.html`: la alternativa descartada (su tira de variantes le quitaba espacio al correo).
- `design/Preview_de_templates.html`: bundle del diseño **anterior** (artboards A–M), solo como historia. Está empaquetado (`__bundler/template` y `__bundler/manifest`, base64 + gzip). El artboard E, "Ver todas las ramas", quedó descartado.

Idioma: todo (código, comentarios, commits, respuestas a Marcos) va en español.

## Cómo se prueba

La única prueba real es desplegar: Marcos pega el archivo en Campaign (Explorer > Administration > Configuration > Dynamic JavaScript pages) y abre, por ejemplo, `https://bcp-mkt-stage12.campaign.adobe.com/cus/previewFragment.jssp?frgId=11104969`. Hace falta commit y push para que pueda probarlo. Siempre trabaja sobre el archivo real: si lo pegas por chat se pierden `*` y `\`.

Verificación antes de cada commit (no hay lint; `lint.sh` se borró. Las pruebas de la poda van aparte, abajo). Revisa la sintaxis del script de cliente y tres reglas duras: solo ASCII, nada de `<%`/`%>` en el script y nada del permiso de scripts en todo el archivo:
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

La lógica de poda (entre `BEGIN-PODA` y `END-PODA`) tiene pruebas en `tests/poda.test.js`: `node --test tests/*.test.js` (sin dependencias). Cargan el bloque desde el propio JSSP, así que prueban el código real. Córrelas antes de cada commit que toque ese bloque, y si cambias la poda, agrega el caso. El correo de prueba es sintético: el helper `grupo()` arma los grupos `[acr-dc-*]` con el mismo formato de Campaign.

Para saber qué le falta a un template ya subido, usa la skill `/evaluar-template <frgId>` (`.claude/skills/evaluar-template/`): baja la página de stage, recorre todos los escenarios con la poda del JSSP y separa los problemas del template (grupos sin rama, condiciones no evaluables, fragmentos no resueltos) de los campos sin dato de muestra, que solo afectan al preview. También trae el inventario de variables (cuáles deciden ramas, cuáles se imprimen y dónde) y avisa de montos escritos fijos y de condiciones que mezclan segmento con datos de contacto. Nunca guardes en el repo el HTML de un template.

Prueba visual en local: copia desde `<!DOCTYPE html>` hacia abajo y reemplaza `<%= datosLista %>`, `<%= selAttr %>`, `<%= datosHtml %>` (HTML de correo pasado por `encodeURIComponent`) y `<%= datosFrg %>`. Quita los `<% if/else %>` y sirve el resultado con `python3 -m http.server`. La parte de servidor y el proxy solo se pueden probar en Campaign.
- Para probar con un template real: el preview de stage no pide login, así que `curl` a `…/previewFragment.jssp?frgId=N` trae la página; el correo está en `data-html` (primero `html.unescape`, porque Campaign convierte `'` en `&#39;`, y después `unquote`). Guárdalo solo en el scratchpad, nunca en el repo.
- El correo de prueba debe traer lo que la UI tiene que mostrar: dos o más grupos `[acr-dc-*]`, uno sin rama `else` y metido en una `<table>` (así prueba la nota "sin rama activa" en una celda), un `targetData.X` sin valor también dentro de un `href`, fechas `FEC…` y ancho de 600 px para el aviso de desborde en Móvil.
- En Chrome, `resize_window` no achica el viewport. Para probar anchos chicos (≤1400 px los datos de muestra pasan a cajón; ≤1080 px la ficha se pliega arriba del correo), carga la página dentro de un `<iframe width="…">` del mismo origen. Chrome sin interfaz tampoco baja de ~500 px de ancho.
- Antes de abrir el modal de Workfront, reemplaza `window.fetch` por una función que rechace o que devuelva `{ok:false,status:500}`. Nunca envíes de verdad desde una prueba local.
- Workfront está pausado (`WORKFRONT_ACTIVO = false`). Para probar el modal en local, ponlo en `true` solo en la copia.

## Estructura de `previewFragment.jssp`

1. **Servidor** (hasta `<!DOCTYPE html>`). Consulta `nms:includeView`: `@type=1` son los templates y `@type=2` los fragmentos. Resuelve `<%@ include fragment="VIEWnnn" %>` en `frgResuelve` con un mapa nombre→id (`frgCargaMapa`) y `load(id)`, de forma recursiva y con topes. El token usa el **`@name`**, no el `@id`. Las consultas filtradas por `@name` nunca funcionaron en esta instancia, así que no las reintentes. Corre con `logonEscalation("neolane")`, que va fuera del `try`. No toques esta parte sin que te lo pidan.
2. **HTML + CSS.** Los tokens de diseño son variables en `:root`; usa esas, no colores sueltos. Las clases siguen BEM en español (`.barra__btn`, `.var__g`, `.fechas__f`…). El diseño es la "Ficha del destinatario" (maqueta en `design/maqueta-ficha-destinatario.html`, contrato en `.impeccable/surfaces/`): el correo al centro es el protagonista.
   - **Tipografía.** Escala `--fs-xxs` 11 px (solo metadatos: id del template, rótulos en mayúsculas, número de fecha), `--fs-xs` 12 px (etiquetas), `--fs-sm` 13 px (controles) y `--fs-md` 14 px (cuerpo). No uses tamaños sueltos ni bajes de 11 px.
   - **Contraste.** `--text-muted` es `#5b6678` (≥4.5:1 sobre blanco, `--vars-bg` y la mesa `--canvas-bg`). La barra es `--bar-bg` `#14275f` con texto blanco; `--acento` `#1f3a93` es el azul de los valores elegidos, el foco y el botón del modal. El placeholder del combo usa `--bar-fg-muted`. `--ok-bg`/`--ok-fg` son el verde de "todo resuelto" y de los resultados correctos. Si cambias un color, comprueba que el texto siga en 4.5:1 o más.
   - **Barra** (44 px, azul oscuro): título, combo, Escritorio/Móvil, zoom, `.html` / `PNG` / `PDF` como botones directos (no hay menú Descargar), Copiar enlace, Workfront y el botón "?" (`#bAyuda`) que abre el panel de atajos `#ayudaPop`. Tiene que caber en una línea desde 1280 px; si le agregas algo, vuelve a medir.
   - **Mesa** (`#lienzo`, el contenedor con scroll): grid de tres columnas, `minmax(300px,1fr) auto minmax(0,1fr)`. A la izquierda la **ficha** (`.ficha`, sticky, con `max-height` y scroll propio); al centro `#centro` con la línea de estado (`#cintaEtq` datos de muestra/campos, `#cintaTxt` datos editados, `#desborde`), `#accion` (resultado de Workfront, PNG o PDF) y el marco con el iframe; a la derecha el panel **Datos de muestra** (`#datosAside` > `#fechas`, sticky).
     - Desde 1401 px el panel de datos queda fijo a la derecha y el vínculo "Datos de muestra" de la ficha se oculta. Bajo 1400 px (no entran los dos márgenes) el panel es un cajón fijo al borde derecho (`.datos--abierto`, `abrirDatos`/`cerrarDatos`, ✕ y Escape) que se abre con ese vínculo.
     - `#centro` mide siempre el ancho de escritorio (`anchoCentro`, 700 o el mayor medido): la ficha queda junto al correo y **no se mueve al pasar a Móvil**. No la ancles al borde de la ventana (Marcos lo rechazó).
     - Bajo 1080 px la grilla pasa a una columna y la ficha va arriba del correo, **plegada en una línea** (`#fichaRes`: "CONSUMO · LATAM Clásica ▾") que despliega `#fichaCuerpo` a pedido (`.ficha--abierta`).
   - **Ficha:** "PARA" + "escenario n de N"; cada variable es un bloque `.var` (separados por una línea, sin caja) con su grilla de botones `.var__g` (dos columnas; el elegido va relleno de `--acento`). Con 6 o más valores de varias familias (LATAM, Amex, Qore) se agrupan con un rótulo `.var__fam` y `valoresDe` los ordena por familia. Una variable con un solo valor es texto fijo (`.var__fijo`). La variable activa lleva la marca "← →" (`.var--activa`), oculta si los atajos están apagados (`.ficha--sin-atajos`). Debajo: Por defecto, Ver campos y **Datos de muestra** (abre el cajón bajo 1400 px). Se puede editar todo lo que el correo imprime (`r.campos` pasado por `editables()`), salvo `PLASTICO` (sale del producto) y las variables de la ficha (producto, segmento): pedido de Marcos. Las etiquetas legibles están en `ETIQ_FECHA`; lo editado va en `editados` y en la URL como `d.CAMPO`. Se ordenan por **aparición en el template** (`ordenAparicion`, por la primera marca `⟦KEY⟧` en el HTML de la vista). La vista siempre lleva las marcas (`fechasAbierto` es true con template), pero son invisibles: solo se resalta, con su número, el dato que se señala o edita en el panel (`enfocarFecha`). La ayuda de teclado y el interruptor de atajos **no van en la ficha** (Marcos pidió liberar ese espacio): están en el panel del botón "?".
   - **Por revisar** (`#revisar`, `pintarRevisar()`, `problemas()`): Marcos quitó el sello; lo que queda es un aviso **chico** "⚠ N por revisar" junto a "Datos de muestra", que solo aparece si hay algo, y una lista flotante (`#revisarL`, no empuja el correo) con cada problema, un clic que baja a su marca (`irA`) y la leyenda de las marcas. No lo conviertas en franja ni en sello. Los campos sin valor dentro de un atributo (`href`, `src`) marcan el elemento con `data-pv-atr` (contorno ámbar punteado).
   - **Movimiento.** Tokens en `:root`: `--ease-out: cubic-bezier(0.23,1,0.32,1)` y las duraciones `--dur-xs` (120ms), `--dur-sm` (150ms), `--dur-md` (180ms) y `--dur-lg` (200ms). No escribas ms ni curvas sueltas. Todo vive en el bloque `/* ---------- movimiento ---------- */`:
     - Hover: solo `background-color`/`color` con `--dur-xs ease`.
     - Respuesta al clic: `:active { transform:scale(0.97) }`. Si agregas un botón, súmalo a las listas de `transition` y `:active`.
     - Entradas con keyframes (`entra-lista`, `entra-datos`, `entra-modal`, `funde`): parten de `opacity:0` más un `scale(0.96–0.97)` o un desplazamiento de 2 a 12 px, nunca `scale(0)`. Las listas flotantes (por revisar, ayuda "?") salen desde su botón; el cajón de datos entra desde el borde derecho; el modal queda centrado.
     - La salida siempre es instantánea (`hidden` o quitar la clase).
     - Solo se animan `transform` y `opacity`. Nada de `transition: all`, `ease-in` ni duraciones de más de 300ms.
     - **Sin animación a propósito:** la lista del combo, el zoom, escritorio/móvil y el cambio de escenario (se accionan en ráfagas o con teclado: `/`, `D`, `M`, flechas, 1–9) y el repintado del correo. No los animes.
     - `cambiarTexto(boton, txt, reposo)` cambia el texto de un botón sin mover la barra: durante los estados pasajeros el `min-width` solo crece y el texto entra con `.cambia` (un blur leve). Al volver al texto normal, pasa `reposo=true` para soltar el `min-width`; si no, el botón queda inflado para siempre y la barra (que hace wrap) puede quedar en dos líneas. Úsala siempre que un botón de la barra cambie de texto (Copiar enlace, Workfront, PNG, PDF: durante la exportación el botón pulsado dice "Generando escritorio…").
     - `.accion--nuevo` (un fundido) solo se pone en `avisoWf`, nunca en algo que corra en cada repintado.
     - `@media (prefers-reduced-motion:reduce)` va **al final del `<style>`**, para ganarles a los media queries de ancho. Las entradas usan `--ease-out`, también las que son solo un fundido. Deja solo fundidos y mantiene la respuesta al clic, porque es un scale en su lugar que no desplaza nada.
3. **Script de cliente** (ES5: `var` y `function`, sin arrow functions, `let`/`const` ni template literals). La lógica pura de poda vive entre `// BEGIN-PODA` y `// END-PODA`:
   - `podar(src, perfil, opciones)` elige una rama por grupo `[acr-dc-start-group]`…`[acr-dc-end-group]` con un evaluador propio, sin `eval` ni `Function`. Después reemplaza los tokens `<%= targetData.X %>` y `<%@ include view='X' %>` por `valorMuestra(k)` o por `[X]`. Devuelve `{html, elegidas, noEval, sinValor, includes, fechas, campos}` (`campos`: todo lo impreso; `fechas`: solo los `FEC…`).
   - Prioridad de `valorMuestra`: fecha editada (`editados`) > valor dinámico (`valorDinamico`: `PLASTICO` sale del `CODPRODUCTO` elegido) > `diccionario`. Los datos de muestra son ficticios; no pongas datos reales del banco.
   - `pintar()` guarda el resultado limpio en `ultimo`. `ultimo.html` es lo que usan .html, PNG, PDF y Workfront. El iframe de la vista se pinta con `senalar:true`: los campos sin valor van entre `⟪…⟫` y los grupos sin rama dejan un comentario `pv-sin-rama N`, y `senalarFaltas()` los convierte en marcas ámbar al cargar. Lleva además las marcas `⟦KEY⟧…⟦/⟧` de los datos de muestra (invisibles salvo el activo). Ninguna de estas marcas debe llegar a `ultimo.html`.
   - Estado en la URL (`leerURL`/`escribirURL`): `frgId`, `v.VAR` (escenario), `d.CAMPO` (datos de muestra editados), `muestra=0`, `w=375`, `z=NN`.
   - La vista mide el alto y el ancho reales del correo (`medirVista`). En escritorio, el marco crece si el correo pide más de 700 px (por ejemplo, `body{min-width:750px}`). Para medir el alto, encoge el iframe a 0, lee `scrollHeight` y le devuelve su alto en la misma tarea, guardando y reponiendo el scroll del lienzo. Con el alto actual puesto, `scrollHeight` nunca baja de ese alto y un correo corto no podría achicarse. `pintar()` conserva el alto anterior hasta que mide el correo nuevo; `ALTO_VISTA` (3000) solo se usa en la primera vista.
   - En los campos de contacto (`DESCORREO…`, `DESNBRE…`, `DESCELULAR…EENNPRINCIPAL`), las condiciones se omiten al elegir variantes, pero sus valores ficticios sí se muestran.
   - Las fechas de muestra se calculan con `fechaMuestra(dias)`: el inicio es hoy y los fines son hoy + 30 días, en `dd/mm/aaaa`. Nunca pongas una fecha fija: con el tiempo queda vencida y en el PNG parece un error del correo.
   - **Avisos.**
     - `avisoWf(ok, texto, detalle)` escribe solo en `#accion`, que es sticky (queda a la vista aunque se baje en el correo). `ok` es `true` (verde), `false` (rojo) o `"aviso"` (ámbar: PNG/PDF con imágenes que no se pudieron traer, Workfront pausado). El detalle técnico va plegado en un `<details>`.
     - `anunciar(txt, forzar)` escribe en `#anuncio` (`.sr`, `role=status`) solo cuando el texto cambia; se usa al cambiar el escenario y en las acciones.
   - **Modal de Workfront.**
     - `pendientes()` arma la lista de revisión y `revision(p)` la pinta: roja si hay pendientes, verde ("✓ Todo resuelto") si no.
     - Con pendientes, el foco empieza en Cancelar y el botón dice "Enviar de todos modos". Sin pendientes, el foco va a "Enviar ahora".
     - `atraparFoco` mantiene Tab dentro del diálogo.
     - No muestres la URL del webhook ni la fila "Vista": el HTML que se envía es siempre el mismo.
     - `fetch` tiene un tope de 30 s con `AbortController`. Hay tres mensajes de error:
       - HTTP de error: "no se registró, puedes reintentar".
       - Sin respuesta (red o CORS): "pudo llegar, revisa antes de reintentar".
       - Tope de 30 s: el mismo aviso de "revisa antes de reintentar".
   - **Lenguaje de la UI.**
     - El modal pasa cada condición por `legible()`: `targetData.CODPRODUCTO == 'TCRPLL'` sale como "PRODUCTO = LATAM Platinum", y el original queda en el `title`.
     - Los códigos se traducen con `traducirUI`, también en los `aria-label`.
     - Los plurales se arman con `plural(n, uno, varios)`; nada de "(s)" ni "(es)".
     - Al usuario se le dice "campo", no "token".
     - Los botones nombran su acción: "Por defecto", "Datos originales", "Ver campos" / "Ver datos de muestra".
   - **Ficha y teclado.** `pintarFicha()` corre en cada `pintar()`. `valoresDe(n)` ofrece solo los valores reales que compara el template (sin "otro valor"); una bandera de presencia ofrece "con valor" (`VAL_OTRO`) o "sin valor" (`""`). `activa` es la variable que cambian ← / → (`paso`); 1–9 la eligen (`marcarActiva`). Los botones de la grilla tienen id `vb-<n.º de variable>-<n.º de valor>` para devolverles el foco tras repintar, y tabindex itinerante (solo el elegido es parada de Tab). Las flechas no actúan con el foco en la barra. `etiqVar(n)` da el nombre visible de la variable (traducción o el código sin prefijo: `FLGCASHBACK` → CASHBACK); los productos llevan tilde en `DICCIONARIO_UI` ("LATAM Clásica").
   - **Desborde en Móvil.** Si el correo es más ancho que 375 px, `medirVista` muestra `#desborde`: "El correo mide N px: en 375 px se corta a la derecha".
   - **Combo.** Al abrirlo, el nombre actual queda seleccionado y no filtra (`pintarLista` lo trata como búsqueda vacía). Los atajos van en `title` y `aria-keyshortcuts`.
   - **Atajos** (`/`, `D`, `M`, `1`–`9`, ← / →). Vienen **activados por defecto**; se apagan con `#atajos` dentro del panel "?" (`aria-pressed`, guardado en localStorage como `prevTpl.atajos`), por WCAG 2.1.4. `?` abre el panel (`abrirAyuda`/`cerrarAyuda`, Escape lo cierra). `pintarAyuda()` arma la lista con la variable activa; `pintarAtajos()` quita el `title` y el `aria-keyshortcuts` y atenúa la lista cuando están apagados. No se disparan con Ctrl/Cmd/Alt, con el modal abierto ni dentro de las fechas.
   - **Zoom.** "+" se desactiva en 100% y "−" en 50%.

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
- El envío a Workfront está **pausado**: `WORKFRONT_ACTIVO = false` deja el botón con `aria-disabled` (enfocable, borde punteado) y al pulsarlo explica que está pausado. Para reactivarlo, se pone en `true`.
- `WORKFRONT_URL`, `WORKFRONT_USER` y `WORKFRONT_PASS` están escritos en el cliente, y el repo en GitHub es público. Hay que moverlos al servidor.
- Producción: cambiar `bcp-mid-stage13` por el dominio de producción en `PERMITIDOS` y en `PNG_PROXY_HOSTS`.
- Pendiente de probar en Campaign (commits del 2026-09-25 y 26):
  - la medición del alto con correos cortos, largos con imágenes y con `height:100%`;
  - las animaciones y la respuesta al clic;
  - las marcas ámbar con correos reales;
  - el rediseño "Ficha del destinatario" (2026-09-25 y 26): ficha y teclado, por revisar, panel de datos de muestra a la derecha (y cajón bajo 1400 px), ayuda "?", PNG/PDF desde sus botones (resultado en ámbar si faltan imágenes) y ficha plegada bajo 1080 px;
  - las fechas relativas.
- Ideas que quedaron de la tercera crítica (no pedidas todavía): recorrer los escenarios en secuencia (todas las combinaciones) y marcar cuáles ya se revisaron.
- impeccable pide cerrar el rediseño con una revisión final independiente y un `DESIGN.md`; se hará cuando Marcos confirme en Campaign que se ve bien.
- **Descartado a propósito:** el `overflow:hidden` del body es parte del layout, aunque el detector lo marque.
- La exportación PNG/PDF (SVG `foreignObject` → canvas) no funciona en Safari (`SecurityError`); se usa Chrome o Edge. No incrusta `url()` dentro de `<style>` ni fuentes externas.
