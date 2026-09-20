# preview-jssp

Preview de templates de Adobe Campaign: una sola pagina JSSP.

- `previewFragment2.jssp` - lo unico que se despliega.
- `CLAUDE.md` - reglas del entorno y estado (lo primero que se lee).
- `SIGUIENTE.md` - ciclo de trabajo y prioridades.
- `QA-CAMPAIGN.md` - checklist para probar en Campaign.
- `CHANGELOG.md` - que cambio y por que.
- `design/handoff-legible.html` - el diseno aprobado (artboards, tokens, decisiones).

## Desplegar
Campaign -> Dynamic JavaScript pages -> `previewFragment` (`cus`) -> Edit code -> reemplazar todo
por el contenido de `previewFragment2.jssp`. La URL del webhook se pega en `WORKFRONT_URL` **solo
alli**. Mover el archivo como archivo: pegarlo por chat/markdown se come `*` y `\`.

## Probar
Comprobaciones locales: `sh lint.sh` y `node tests/preview-contacto.test.js`.
El preview omite las condiciones de correo, nombre y celular del ejecutivo al elegir variantes;
conserva sus datos ficticios en modo muestra. Las reglas guardadas en Campaign no cambian.

https://bcp-mkt-stage12.campaign.adobe.com/cus/previewFragment.jssp

En Claude Code, dentro de esta carpeta:

> Lee CLAUDE.md y SIGUIENTE.md.
