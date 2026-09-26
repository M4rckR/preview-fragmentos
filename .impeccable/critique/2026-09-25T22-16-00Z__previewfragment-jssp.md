---
target: previewFragment.jssp
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/marcosdev/Personal/Develop/trabajo/preview-fragmentos/previewFragment.jssp"
target_fingerprint: "sha256:43b75655337d42d70869bc035b5540b114f7fcf2f1816577764441a22474d220"
target_path: /Users/marcosdev/Personal/Develop/trabajo/preview-fragmentos/previewFragment.jssp
timestamp: 2026-09-25T22-16-00Z
slug: previewfragment-jssp
---
# Critica: previewFragment.jssp (2026-09-25)

Heuristicas: 1=3, 2=2, 3=3, 4=2, 5=2, 6=2, 7=3, 8=3, 9=2, 10=2. Total 24/40 (Aceptable, cerca de Bueno).

Especificidad: autorada para el producto (panel de escenario derivado del template, ramas activas, cinta de muestra, editor de fechas, estado en URL). Cascara visual generica tipo Tailwind (aceptable, sin marca). Copy habla como el codigo.

Detector (copia HTML; el CLI no escanea .jssp): tiny-text 11px (token --fs-xs), texto de 10px (.combo__id, .vars__tipo, .ramas__chip, .combo__gt), contraste 4.1:1 en .barra__wf (Workfront), border-accent-on-rounded (.fechas, .marco--muestra), sombras anchas con borde fino (.combo__lista, .menu__lista, .fechas), cramped-padding .barra__seg. Falsos positivos: layout-transition en body, clipped-overflow en body.

Prioridades:
1. [P1] Workfront deja enviar con errores; foco inicial en "Enviar ahora"; "Destino" muestra la URL del webhook; nota fija "MARIA LOPEZ DEMO" no coincide con el correo. (L2260-2279)
2. [P1] Errores no visibles donde ocurren: [CAMPO] sin valor sale con la tipografia del correo; grupo sin rama desaparece sin marca; aviso en 11px en la cinta. (L874, 886, 901, 1437)
3. [P1] Combo se abre filtrado por el nombre del template actual; lo escrito se concatena. (L1215-1235)
4. [P2] Jerga: "valores", "presencia", "token(s)", chips con expresion cruda, aria-label con codigo crudo (Label in Name). (L1308-1330, 1414, 1429)
5. [P2] Texto 10-11px y contraste 4.1:1 en Workfront. (L248, 279, 302, 367, 396)

Personas: Alex (combo, atajos invisibles, zoom tope 100%, Enter-Enter envia). Sam (modal sin trampa de foco, role=toolbar sin flechas, role=status repetitivo, aria-label crudo). Operador BCP (sin estado global "listo para aprobar", fecha 1940 parece error, movil se corta sin aviso, sin comprobante tras envio).

Menores: Detalle muestra columnas vacias; boton Detalle se mueve; doble anillo de foco en combo; dos "Restablecer"; exito Workfront oculta avisos; motivo de deshabilitado solo en title; panel flotante <=900 abre sobre el correo; credenciales Workfront en repo publico (ya pendiente).
