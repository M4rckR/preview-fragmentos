# Por donde seguir

Estado: UI redisenada segun `design/`, **nunca vista renderizada**.

## Ciclo de trabajo
1. Claude Code cambia `previewFragment2.jssp` (un cambio por vez).
2. Antes de entregar, repasa a mano las "Reglas duras" de `CLAUDE.md`. Las que mas se rompen:
   `<%`/`%>` en el cliente, caracteres no ASCII, y la guarda de `WORKFRONT_URL` vacia.
3. Marcos pega el archivo en Campaign y abre
   `https://bcp-mkt-stage12.campaign.adobe.com/cus/previewFragment.jssp`
4. Marcos prueba con `QA-CAMPAIGN.md` y trae lo que falle. Vuelta al punto 1.

No hay entorno local ni pruebas automaticas: Claude Code **no puede ver el resultado**, asi que
conviene entregar cambios chicos y que Marcos los mire seguido, en vez de una tanda grande.

## Prioridad
1. Lo que Marcos reporte de la primera pasada en Campaign. Lo que mas importa mirar alli:
   - Buscador con ~500 templates: velocidad al escribir, duplicados, nombres largos.
   - Panel de escenario con templates reales (muchos grupos, variables largas, condiciones raras).
   - Que no se desborde nada a 1024 px.
   - Tildes y codificacion.
   - Workfront contra el webhook real (CORS/CSP).
2. Volver a poner el login (bloque comentado al inicio del `.jssp`) y validar por operador antes
   de `logonEscalation`.
3. Resolver los `<%@ include fragment="VIEWnnn" %>` desde el servidor. Es la limitacion mas visible.
4. Preguntas abiertas del handoff.

## Lo que NO hay que hacer
- Tocar el bloque de servidor sin pedirlo.
- Romper una regla de `CLAUDE.md`.
- Poner la URL del webhook en el repo.
- Meter datos reales del banco en el diccionario de valores de muestra.
