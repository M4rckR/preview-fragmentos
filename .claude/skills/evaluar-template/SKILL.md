---
name: evaluar-template
description: Evalua un template de email de Campaign (por frgId) y reporta exactamente que le falta en cada escenario - grupos sin rama, condiciones no evaluables, fragmentos no resueltos y campos sin dato de muestra. Usala cuando Marcos pida revisar, evaluar o diagnosticar un template, o pregunte que le falta a un frgId, despues de subir el preview a Campaign.
argument-hint: <frgId>
---

# Evaluar un template

Sirve para saber, una vez subido el preview a Campaign, que le falta exactamente a un template. Recorre todos los escenarios (cada combinacion de los valores que nombra el template) con la misma logica de poda del preview y los agrupa por problema.

## Pasos

1. Toma el `frgId` de los argumentos. Si no viene, pideselo a Marcos.
2. Corre el script desde la raiz del repo (necesita red hacia stage12; el preview no pide login):
   ```sh
   node .claude/skills/evaluar-template/evaluar.js <frgId>
   ```
   Usa la logica de `previewFragment.jssp` del repo. Si Marcos subio a Campaign una version distinta, el resultado puede no coincidir con lo que ve en pantalla: avisale.
3. Explica el reporte en espanol, en simple y separando dos tipos de hallazgo:
   - **Problemas del template** (afectan el envio real): grupo sin rama activa (un cliente con ese escenario recibiria el correo sin ese bloque), condicion no evaluable (la condicion esta mal escrita o usa algo que el evaluador no soporta) y fragmento no resuelto (el include no existe o no cargo).
   - **Solo del preview**: campo sin dato de muestra. El template esta bien; falta un valor ficticio en `diccionario` (dentro de BEGIN-PODA en `previewFragment.jssp`). Ofrece agregarlo; los datos de muestra son ficticios, nunca datos reales del banco, y las fechas se calculan relativas a hoy.
4. Para cada problema del template, indica en que escenarios pasa y, si lo puedes ubicar, el texto de la condicion o el nombre del fragmento, para que Marcos sepa que corregir en Campaign.
5. Presenta el inventario de variables (seccion "Variables" del reporte) como tablas:
   - **Deciden que rama se muestra:** variable, nombre en la UI, cantidad de condiciones y valores (codigo y nombre). Producto y segmento se eligen en la ficha; los datos de contacto el preview los omite al elegir ramas.
   - **Se imprimen en el correo:** variable, donde (texto o atributo, p. ej. `href` de los enlaces), cuantas veces y su dato de muestra. Todas son editables en "Datos de muestra" del preview, salvo `PLASTICO` (sale del producto elegido). Si alguna dice "SIN dato de muestra", ofrece agregarla a `diccionario` (y a `ETIQ_FECHA` con una etiqueta legible).
   - **Avisos:** destaca los montos escritos fijos en el HTML (todos los clientes verian el mismo; si deberian ser personalizados, falta un campo en Campaign) y las condiciones que mezclan segmento/producto con datos de contacto vacios (`||`), explicando que cliente cae en que rama. Pregunta si es intencional; no lo afirmes como error.

## Reglas

- No guardes en el repo el HTML de los templates: es contenido del banco y el repo es publico. Si necesitas inspeccionarlo, usa el scratchpad.
- El script solo lee. No envies nada a Workfront ni cambies nada en Campaign.
