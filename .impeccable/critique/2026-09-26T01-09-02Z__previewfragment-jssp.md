---
target: previewFragment.jssp
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/marcosdev/Personal/Develop/trabajo/preview-fragmentos/previewFragment.jssp"
target_fingerprint: "sha256:c78bde259821aad3d9a9bede688531503dccc909e1b02a41ba29d56f426e1053"
target_path: /Users/marcosdev/Personal/Develop/trabajo/preview-fragmentos/previewFragment.jssp
timestamp: 2026-09-26T01-09-02Z
slug: previewfragment-jssp
---
# Critica: previewFragment.jssp (2026-09-25, segunda ronda)

Heuristicas: 1=3, 2=3, 3=3, 4=2, 5=3, 6=3, 7=3, 8=2, 9=2, 10=3. Total 27/40 (Aceptable, a un punto de Bueno).

Especificidad: autorada para el producto; errores marcados en el correo, modal defensivo, estado en URL. Debilidad: arquitectura de avisos (cinta, detalle arriba, chips) y fecha de muestra 01/01/1940.

Detector: 3 hallazgos (antes 9 + 3 advisories). Quedan border-accent en .fechas/.marco--muestra (intencional), overflow del body (falso positivo), borde fino + sombra en .fechas (advisory real).

Prioridades:
1. [P1] Fecha de muestra 01/01/1940 sale como "Vigente hasta" vencido en PNG/PDF/Workfront (L786-788). Confirmar si es intencional.
2. [P1] avisoWf reusa #avisos y borra los pendientes tras un fallo; detalle tecnico crudo en mono (L2463-2485).
3. [P1] La cinta mezcla estado y acciones y se parte en 2-3 lineas; "Ver campos" huerfano (L585-591, 411-419).
4. [P2] Detalle abre arriba de todo, lejos de su boton; "Grupo 3" sin condicion ni salto al correo (L566, 1521-1531).
5. [P2] El modal no incluye el desborde de Movil en pendientes (L2394).
6. [P3] Variable de un solo valor se ve como boton activo (L1352).

Personas: Alex (sin atajos de escenario/Workfront/detalle; mucho chrome a 800px). Sam (atajos de una tecla sin desactivar, WCAG 2.1.4; detalle no mueve foco). Operador (PNG con 1940; pendientes perdidos tras fallo; "Grupo 3" opaco).
