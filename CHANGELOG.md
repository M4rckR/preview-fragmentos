# Cambios: rediseno de la UI (handoff de Claude Design)

Implementado sobre `previewFragment2.jssp`. El bloque de servidor (login, consulta, escalamiento)
no se toco. 73 pruebas en verde (`npm run test:all`).

## Nuevo
- **Buscador de templates** en vez del `<select>` con ~500 opciones. Filtra por nombre (sin tildes
  ni mayusculas, varias palabras) y por id; el **id siempre visible** resuelve los duplicados;
  teclado (flechas, Enter, Esc, `/` enfoca); resaltado de la coincidencia; **recientes** (ultimos 5,
  en `localStorage` con try/catch: si Campaign lo bloquea, se degrada a la lista completa).
- **Panel de escenario lateral** (308 px) con tres controles segun el tipo de variable:
  segmentado para valores, interruptor con texto para presencia, y grupo con interruptor "todos"
  (tres estados) para banderas parecidas (`DES...EENNPRINCIPAL`). Boton Restablecer.
- **Ramas activas** listadas por grupo ("Grupo 1 -> Banner - Consumo"), con estado "sin rama activa"
  en ambar. "Ver todas las ramas" paso a este panel.
- **Datos de muestra explicitos**: cinta ambar sobre el visor, borde superior naranja e interruptor
  "muestra / [CAMPOS]" (preferencia recordada). El HTML del email no se modifica.
- **Zoom 50-100%** y **Copiar enlace**. El escenario vive en la URL
  (`?frgId=..&v.VARIABLE=valor&todas=1&muestra=0&w=375&z=80`), se lee al cargar y se actualiza con
  `history.replaceState`; los valores invalidos se ignoran.
- **Barra de avisos** no bloqueante con "Ver detalle": condiciones no evaluables (con su texto),
  fragmentos no resueltos y tokens sin valor de muestra.
- **Workfront con dialogo propio** en vez de `confirm()`/`alert()`: muestra template, escenario,
  ramas activas, vista, destino y el aviso de datos de muestra. Estados del boton: normal /
  enviando / enviado (vuelve a normal a los 5 s) / reintentar / **no configurado** (deshabilitado,
  con la explicacion en el tooltip). El error de red explica que pudo llegar igual por CORS.
- Atajos `D`, `M`, `T`, `/`. Foco visible, `role` de combobox, listbox, switch, dialog y status.
- Responsive: a 1100 px se ocultan las etiquetas; a 900 px el panel flota sobre el lienzo.

## Cambios internos
- `podar(src, perfil, { todas, muestra })` devuelve ademas `noEvalTextos`, `includes`, `sinValor`, y
  `elegidas` pasa a ser `[{ grupo, label, sin?, todas? }]` para poder listarlas por grupo.
- `detectar` clasifica cada variable como `valores` o `presencia`.
- Nuevos ayudantes puros: `agrupar` (junta banderas por prefijo largo o prefijo + sufijo),
  `norm` (busqueda sin tildes) y `urlTemplate`.

## Sin cambios (a proposito)
- Reglas del entorno: solo ASCII, cero `<%`/`%>` en el cliente, `sandbox=""`, sin eval ni recursos
  externos, unico `fetch` el de Workfront con `WORKFRONT_URL` vacia en el repo.
- Payload de Workfront: `{ templateId, nombreTemplate, htmlFinal, fechaEnvio }`.
- Los `<%@ include fragment %>` siguen sin resolverse (limitacion conocida; ahora se listan en Detalle).

## Version de prueba sin login
A pedido, se quito `checkAuthentication()` para poder probar sin sesion. El bloque de login quedo
comentado al inicio del `.jssp`, listo para volver a pegarlo, con el aviso de lo que implica:
sin login, cualquiera que abra la URL lista y lee todos los templates con el operador `neolane`.
Sigue pendiente la validacion por operador antes del escalamiento.

## No verificado
La UI se valida con jsdom. **No** hay navegador en este entorno: nada de esto se ha visto renderizado
ni probado dentro de Campaign. Ver `QA-CAMPAIGN.md`.
