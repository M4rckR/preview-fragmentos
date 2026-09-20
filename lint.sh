#!/bin/sh
# Lint de las reglas duras de CLAUDE.md sobre previewFragment2.jssp.
# No hay entorno local ni pruebas automaticas: esto es lo unico que se puede correr aqui.
# Uso: sh lint.sh   (sale 1 si algo falla)
F="previewFragment2.jssp"
fallos=0

mal() { echo "FALLA: $1"; fallos=$((fallos + 1)); }
bien() { echo "ok   : $1"; }

[ -f "$F" ] || { echo "FALLA: no existe $F"; exit 1; }

# 1. Solo ASCII imprimible (mas tabulador) en el .jssp, en los .md y en este lint.
#    El servidor real mostro "M?vil" por codificacion, y el "Funcion auxiliar" con tilde se
#    colo una vez: se revisa todo el repo, no solo el .jssp.
#    Se excluye design/: son referencias de diseno, no se despliegan y llevan acentos a proposito.
sucios=""
for a in "$F" *.md lint.sh; do
  [ -f "$a" ] || continue
  if LC_ALL=C grep -q '[^ -~	]' "$a"; then
    sucios="$sucios $a"
    mal "hay caracteres no ASCII en $a"
    LC_ALL=C grep -n '[^ -~	]' "$a" | head -3
  fi
done
[ -n "$sucios" ] || bien "solo ASCII (jssp, .md y lint.sh; design/ queda fuera)"

# 2. Nada de delimitadores de Campaign en la parte cliente (desde <!DOCTYPE html>),
#    salvo los tres <%= permitidos y los <% if/else del propio servidor.
cliente=$(awk '/<!DOCTYPE html>/{f=1} f && /<%|%>/{print NR": "$0}' "$F" \
  | grep -v '<%= datosLista %>' | grep -v '<%= selAttr %>' | grep -v '<%= datosHtml %>' \
  | grep -v '<% if (fragmentHtml != "") { %>' | grep -v '<% } else { %>' | grep -v '<% } %>')
if [ -n "$cliente" ]; then
  mal "delimitadores de Campaign en la parte cliente"
  echo "$cliente" | head -5
else
  bien "sin delimitadores en la parte cliente"
fi

# 3. El iframe del preview: exactamente allow-same-origin, y el permiso de scripts en ninguna
#    parte del archivo. Las dos cosas juntas anulan el aislamiento del HTML guardado.
if grep -q 'id="vista"[^>]*sandbox="allow-same-origin"' "$F"; then
  bien "el iframe lleva sandbox=\"allow-same-origin\""
else
  mal "el iframe del preview no lleva sandbox=\"allow-same-origin\""
fi
if grep -q 'allow-scripts' "$F"; then
  mal "aparece el permiso de scripts del sandbox"
  grep -n 'allow-scripts' "$F" | head -3
else
  bien "sin el permiso de scripts del sandbox"
fi

# 4. Sin eval, new Function ni XHR.
if grep -nE '\beval\(|new Function|XMLHttpRequest' "$F"; then
  mal "hay eval, new Function o XHR"
else
  bien "sin eval, new Function ni XHR"
fi

# 5. Unico fetch: el de Workfront, y la URL vacia en el repo.
n=$(grep -c 'fetch(' "$F")
if [ "$n" != "1" ] || ! grep -q 'fetch(WORKFRONT_URL' "$F"; then
  mal "el unico fetch debe ser fetch(WORKFRONT_URL, ...) (encontrados: $n)"
else
  bien "un solo fetch, el de Workfront"
fi
if grep -q 'var WORKFRONT_URL = "";' "$F"; then
  bien "WORKFRONT_URL vacia"
else
  mal "WORKFRONT_URL no esta vacia en el repo"
fi

# 6. Sin recursos externos.
if grep -nE 'src="https?://|href="https?://|@import' "$F"; then
  mal "hay recursos externos"
else
  bien "sin recursos externos"
fi

# 7. El escalamiento va fuera del try y se restaura en el finally.
if grep -q 'var org_ctx = logonEscalation("neolane");' "$F" && grep -q 'logonWithContext(org_ctx);' "$F"; then
  bien "logonEscalation fuera del try y logonWithContext en el finally"
else
  mal "falta logonEscalation fuera del try o logonWithContext en el finally"
fi

# 8. Sin correos reales en los valores de muestra.
# Solo correos dentro de un literal de texto: asi no cazan los @atributo de E4X.
if grep -nE '"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}"' "$F" | grep -v 'example.com'; then
  mal "hay correos que no son @example.com"
else
  bien "correos de muestra ficticios"
fi

echo "---"
if [ "$fallos" = "0" ]; then
  echo "sin fallos. Falta la prueba a mano en Campaign: ver QA-CAMPAIGN.md."
  exit 0
fi
echo "$fallos falla(s)."
exit 1
