# QA manual en Campaign

Desplegar: Dynamic JavaScript pages -> `previewFragment` (`cus`) -> Edit code -> pegar
`previewFragment2.jssp` completo. Pegar la URL del webhook en `WORKFRONT_URL` **solo aqui**.
Mover el archivo como archivo (pegarlo por chat/markdown se come `*` y `\`).

> Esta version es **de prueba y no pide login**: cualquiera con la URL lista y lee todos los
> templates con permisos de administrador. Antes de dejarla fija, volver a poner el bloque de login
> que esta comentado al inicio del `.jssp` y agregar la validacion por operador.

## Basico
- [ ] La pagina abre directo (sin login). Confirmar en incognito que es lo esperado en stage.
- [ ] Sin `?frgId`: se ve "Elige un template" y el buscador funciona.
- [ ] Acentos: "Movil", "(vacio)", "condicion" se ven con tilde y sin caracteres raros.

## Buscador (~500 templates)
- [ ] Abre al enfocar; escribir filtra en menos de un segundo.
- [ ] "revision fragmentos" encuentra el que tiene tilde.
- [ ] Un nombre duplicado ("New content template") muestra ids distintos y abre el correcto.
- [ ] Buscar por id funciona. Flechas + Enter navegan. Esc cierra. `/` enfoca.
- [ ] Recientes aparecen al abrir sin escribir (si no, `localStorage` esta bloqueado: no es error).

## Escenario
- [ ] Un template con `CODSUBSEGMENTO`: el segmentado muestra los valores reales.
- [ ] Correo, nombre y celular del ejecutivo no aparecen como banderas; se muestra la nota de vista visual. Las demás variables siguen disponibles.
- [ ] `11104969`, BEX (`X1N`) y LATAM Clásica (`TCRCLL`): cabecera, banner y ambos botones eligen BEX incluso con enlaces antiguos que tengan los tres campos vacíos.
- [ ] Cambiar a Consumo selecciona sus variantes; volver a BEX recupera las suyas. Copiar enlace no incluye las tres banderas omitidas.
- [ ] En modo muestra siguen apareciendo los datos ficticios de contacto donde el HTML los use; en modo `[CAMPOS]` se ven los tokens, sin cambiar la variante.
- [ ] Cambiar un control actualiza el visor y la lista de ramas activas.
- [ ] Un template sin condicionales dice "no tiene contenido condicional"; uno con solo condiciones de contacto indica que no hay otras variables para elegir.
- [ ] Un template con condicion rara: aviso "no evaluable" y su texto en Ver detalle.
- [ ] Restablecer vuelve al inicio.

## Vista
- [ ] Escritorio 700 y Movil 375 con ancho real; zoom 50-100 sin cortar el visor.
- [ ] Interruptor muestra / [CAMPOS] cambia el contenido y la cinta.
- [ ] Descargar .html baja lo que se ve.
- [ ] Copiar enlace: pegarlo en otra pestana reproduce template, escenario, vista y zoom.

## Resolucion de fragmentos
- [ ] Probar `11104969` con `CODSUBSEGMENTO=M1N` y `CODPRODUCTO=TCRORL`: revisar `VIEW136` y `VIEW140` en Ver detalle.
- [ ] Probar `11157592`: revisar `VIEW140`. Cuando se resuelven, deben aparecer en Fragmentos resueltos y verse la cabecera/pie correspondientes.
- [ ] Si aparece consulta o carga fallida, revisar el log del servidor buscando `previewFragment:`. Una consulta vacia o limitada no demuestra que el fragmento no exista.
- [ ] Confirmar que el correo completo sigue siendo accesible mediante el scroll del lienzo.

## Workfront
- [ ] Con `WORKFRONT_URL` vacia: boton deshabilitado, texto "Workfront no configurado", no envia.
- [ ] Con URL de prueba: el dialogo muestra template, escenario, ramas, vista, destino y el aviso.
- [ ] Cancelar y Esc no envian.
- [ ] Envio correcto: llega el POST y el payload trae el HTML visible.
- [ ] Forzar 500: aviso rojo con "HTTP 500" y boton "Reintentar".
- [ ] **CORS/CSP**: si el navegador bloquea la respuesta, comprobar en Workfront si llego igual.
      Si siempre cae en error pese a llegar, cambiar el texto a "Enviado (sin confirmacion)".

## Responsive y accesibilidad
- [ ] A 1024 px y 768 px nada se desborda.
- [ ] Recorrer toda la barra y el panel solo con Tab, con foco visible.
