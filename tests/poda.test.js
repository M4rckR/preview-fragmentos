// Pruebas de la logica de poda de previewFragment.jssp (entre BEGIN-PODA y END-PODA).
// Uso: node --test tests/
// No usa dependencias ni red. El correo de prueba es sintetico: nunca pongas aqui el HTML de un template real.
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

// Delimitadores armados por partes, igual que en el JSSP.
var O = "<" + "%", C = "%" + ">";
var MK_A = "\u27E6", MK_B = "\u27E7", MK_FIN = "\u27E6/\u27E7";
var MF_A = "\u27EA", MF_B = "\u27EB";

// Carga el bloque de poda del propio JSSP, como .claude/skills/evaluar-template/evaluar.js.
// perfil y VAL_OTRO viven fuera del bloque en la pagina; aqui se simulan.
function cargarPoda() {
  var t = fs.readFileSync(path.join(__dirname, "..", "previewFragment.jssp"), "utf8");
  var a = t.indexOf("// BEGIN-PODA"), b = t.indexOf("// END-PODA");
  if (a < 0 || b < 0) throw new Error("No encuentro BEGIN-PODA/END-PODA");
  var cuerpo = "var perfil = {}, VAL_OTRO = 'otro';\n" + t.slice(a, b) +
    "\nreturn { podar: podar, evaluar: evaluar, tokenizar: tokenizar, detectar: detectar," +
    " esc: esc, norm: norm, fechaMuestra: fechaMuestra, fechaCompacta: fechaCompacta," +
    " frgMotivo: frgMotivo, valorMuestra: valorMuestra, FRG_VIA: FRG_VIA, diccionario: diccionario," +
    " fijarPerfil: function (p) { perfil = p; }," +
    " fijarEditados: function (e) { editados = e; } };";
  return new Function(cuerpo)();
}

// Cada prueba parte de un estado limpio (perfil, editados y FRG_VIA son globales del bloque).
function nueva() { return cargarPoda(); }

// Arma un grupo como lo guarda Campaign. ramas: [{ cond, label, html }]; sin cond = else.
function grupo(nombre, ramas) {
  var s = O + "/* [acr-dc-start-group(" + nombre + ")] */" + C;
  ramas.forEach(function (r, i) {
    var abre = r.cond === undefined ? "else" : (i === 0 ? "if (" + r.cond + ")" : "else if (" + r.cond + ")");
    s += O + " " + (i === 0 ? "" : "} ") + abre + " { " + C +
      O + "/* [acr-dc-start-cond(" + r.label + "," + (i + 1) + ",a)] */" + C +
      r.html + O + "/* [acr-dc-end-cond] */" + C;
  });
  return s + O + " } " + C + O + "/* [acr-dc-end-group] */" + C;
}
function campo(k) { return O + "= targetData." + k + " " + C; }

var PRODUCTO = grupo("g1", [
  { cond: "targetData.CODPRODUCTO == 'TCRPLL'", label: "LATAM Platinum", html: "<p>platinum</p>" },
  { cond: "targetData.CODPRODUCTO == 'TCRORL'", label: "LATAM Oro", html: "<p>oro</p>" },
  { label: "Resto de productos", html: "<p>resto</p>" }
]);
var SEGMENTO_SIN_ELSE = grupo("g2", [
  { cond: "targetData.CODSUBSEGMENTO == 'M1N'", label: "Consumo", html: "<p>consumo</p>" },
  { cond: "targetData.CODSUBSEGMENTO == 'X1N'", label: "BEX", html: "<p>bex</p>" }
]);

// ---------------- evaluador ----------------

test("evaluar: comparaciones de igualdad y desigualdad", function () {
  var P = nueva(), p = { A: "x", B: "y" };
  assert.equal(P.evaluar("targetData.A == 'x'", p), true);
  assert.equal(P.evaluar("targetData.A === \"x\"", p), true);
  assert.equal(P.evaluar("targetData.A != 'x'", p), false);
  assert.equal(P.evaluar("targetData.A !== 'z'", p), true);
  assert.equal(P.evaluar("recipient.B == 'y'", p), true);
});

test("evaluar: una variable sin dato vale cadena vacia", function () {
  var P = nueva();
  assert.equal(P.evaluar("targetData.NADA == ''", {}), true);
  assert.equal(P.evaluar("targetData.NADA != ''", {}), false);
  assert.equal(P.evaluar("targetData.NADA == null", {}), true);
});

test("evaluar: &&, ||, ! y parentesis con la precedencia de JS", function () {
  var P = nueva(), p = { A: "1", B: "2" };
  assert.equal(P.evaluar("targetData.A == '1' && targetData.B == '3'", p), false);
  assert.equal(P.evaluar("targetData.A == '9' || targetData.B == '2'", p), true);
  assert.equal(P.evaluar("!(targetData.A == '1')", p), false);
  // && liga mas fuerte que ||: true || (false && false)
  assert.equal(P.evaluar("targetData.A == '1' || targetData.B == '9' && targetData.A == '9'", p), true);
  assert.equal(P.evaluar("(targetData.A == '1' || targetData.B == '9') && targetData.A == '9'", p), false);
});

test("evaluar: textos con comillas escapadas y numeros", function () {
  var P = nueva();
  assert.equal(P.evaluar("targetData.A == 'l\\'oro'", { A: "l'oro" }), true);
  assert.equal(P.evaluar("targetData.N == 5", { N: "5" }), true);
  assert.equal(P.evaluar("true", {}), true);
  assert.equal(P.evaluar("false", {}), false);
});

test("evaluar: rechaza lo que no es una condicion simple (no ejecuta codigo)", function () {
  var P = nueva();
  [
    "alert(1)",
    "targetData.A + 'x' == 'y'",
    "window.x == 1",
    "targetData.A == 'x' &&",
    "(targetData.A == 'x'",
    "targetData.A == 'x')",
    "targetData.A = 'x'",
    "`x` == 'x'"
  ].forEach(function (c) {
    assert.throws(function () { P.evaluar(c, { A: "x" }); }, c);
  });
});

test("evaluar: los campos de contacto se omiten sin volver true un OR", function () {
  var P = nueva();
  // Solo contacto: se muestra la primera variante.
  assert.equal(P.evaluar("targetData.DESCORREOEENNPRINCIPAL != ''", {}), true);
  // En un OR, el contacto no activa la rama: decide el otro operando.
  assert.equal(P.evaluar("targetData.DESNBREENNPRINCIPAL != '' || targetData.SEG == 'M1N'", { SEG: "X1N" }), false);
  assert.equal(P.evaluar("targetData.DESNBREENNPRINCIPAL != '' || targetData.SEG == 'M1N'", { SEG: "M1N" }), true);
  // En un AND tambien decide el otro operando.
  assert.equal(P.evaluar("targetData.DESCELULAREENNPRINCIPAL == '' && targetData.SEG == 'M1N'", { SEG: "X1N" }), false);
  // Negar una omision sigue siendo omision.
  assert.equal(P.evaluar("!(targetData.DESCORREOEENNPRINCIPAL == '') && targetData.SEG == 'M1N'", { SEG: "M1N" }), true);
});

// ---------------- podar: ramas ----------------

test("podar: elige la primera rama que cumple", function () {
  var P = nueva();
  var r = P.podar(PRODUCTO, { CODPRODUCTO: "TCRORL" });
  assert.equal(r.html, "<p>oro</p>");
  assert.deepEqual(r.elegidas, [{ grupo: 1, label: "LATAM Oro" }]);
  assert.equal(r.noEval, 0);
});

test("podar: sin coincidencia cae en la rama else", function () {
  var P = nueva();
  var r = P.podar(PRODUCTO, { CODPRODUCTO: "AMXPLL" });
  assert.equal(r.html, "<p>resto</p>");
  assert.equal(r.elegidas[0].label, "Resto de productos");
});

test("podar: un grupo sin rama activa desaparece o deja la marca pv-sin-rama", function () {
  var P = nueva();
  var src = "<div>" + PRODUCTO + "</div><table><tr><td>" + SEGMENTO_SIN_ELSE + "</td></tr></table>";
  var r = P.podar(src, { CODPRODUCTO: "TCRPLL", CODSUBSEGMENTO: "Z" });
  assert.equal(r.html, "<div><p>platinum</p></div><table><tr><td></td></tr></table>");
  assert.deepEqual(r.elegidas[1], { grupo: 2, label: "", sin: true });
  var v = P.podar(src, { CODPRODUCTO: "TCRPLL", CODSUBSEGMENTO: "Z" }, { senalar: true });
  assert.match(v.html, /<td><!--pv-sin-rama 2--><\/td>/);
});

test("podar: una condicion no evaluable cuenta en noEval y se salta", function () {
  var P = nueva();
  var src = grupo("g", [
    { cond: "algo(targetData.A)", label: "Rara", html: "rara" },
    { cond: "targetData.A == 'x'", label: "Normal", html: "normal" }
  ]);
  var r = P.podar(src, { A: "x" });
  assert.equal(r.html, "normal");
  assert.equal(r.noEval, 1);
  assert.deepEqual(r.noEvalTextos, ["algo(targetData.A)"]);
});

test("podar: la etiqueta de la rama conserva comas internas", function () {
  var P = nueva();
  var src = grupo("g", [{ cond: "true", label: "Oro, Platinum", html: "x" }]);
  assert.equal(P.podar(src, {}).elegidas[0].label, "Oro, Platinum");
});

test("podar: grupos anidados se resuelven de adentro hacia afuera", function () {
  var P = nueva();
  var interno = grupo("in", [
    { cond: "targetData.B == '1'", label: "B1", html: "b1" },
    { label: "Otro B", html: "bx" }
  ]);
  var externo = grupo("out", [
    { cond: "targetData.A == '1'", label: "A1", html: "[" + interno + "]" },
    { label: "Otro A", html: "ax" }
  ]);
  assert.equal(P.podar(externo, { A: "1", B: "1" }).html, "[b1]");
  assert.equal(P.podar(externo, { A: "1", B: "2" }).html, "[bx]");
  assert.equal(P.podar(externo, { A: "2", B: "1" }).html, "ax");
});

// ---------------- podar: campos ----------------

test("podar: reemplaza campos con el dato de muestra o con [CAMPO]", function () {
  var P = nueva();
  var r = P.podar("<p>" + campo("firstName") + " / " + campo("NOEXISTE") + "</p>", {});
  assert.equal(r.html, "<p>Ana / [NOEXISTE]</p>");
  assert.deepEqual(r.sinValor, ["NOEXISTE"]);
  assert.deepEqual(r.campos, ["firstName", "NOEXISTE"]);
});

test("podar: muestra:false deja todos los campos como [CAMPO]", function () {
  var P = nueva();
  var r = P.podar(campo("firstName"), {}, { muestra: false, senalar: true });
  // En modo [CAMPOS] no se senalan: la falta es a proposito.
  assert.equal(r.html, "[firstName]");
});

test("podar: senalar envuelve solo los campos sin valor", function () {
  var P = nueva();
  var r = P.podar(campo("firstName") + campo("NOEXISTE"), {}, { senalar: true });
  assert.equal(r.html, "Ana" + MF_A + "[NOEXISTE]" + MF_B);
});

test("podar: marcar rodea cada campo con su clave", function () {
  var P = nueva();
  var r = P.podar(campo("firstName"), {}, { marcar: true });
  assert.equal(r.html, MK_A + "firstName" + MK_B + "Ana" + MK_FIN);
});

test("podar: sin senalar ni marcar no quedan marcas en el html", function () {
  var P = nueva();
  var src = "<a href='x?c=" + campo("NOEXISTE") + "'>" + campo("FECFINVIGENCIACAMPANIA") + "</a>" + SEGMENTO_SIN_ELSE;
  var r = P.podar(src, { CODSUBSEGMENTO: "Z" });
  assert.doesNotMatch(r.html, /[\u27E6\u27E7\u27EA\u27EB]|pv-sin-rama/);
});

test("podar: escapa los valores de muestra antes de insertarlos", function () {
  var P = nueva();
  P.fijarEditados({ firstName: "<b>\"Ana\" & co</b>" });
  var r = P.podar(campo("firstName"), {});
  assert.equal(r.html, "&lt;b&gt;&quot;Ana&quot; &amp; co&lt;/b&gt;");
});

test("podar: un dato editado no puede salirse de un atributo con comilla simple", function () {
  var P = nueva();
  P.fijarEditados({ firstName: "x' onmouseover='alert(1)" });
  var r = P.podar("<a href='https://example.com/?n=" + campo("firstName") + "'>hola</a>", {});
  assert.equal(r.html, "<a href='https://example.com/?n=x&#39; onmouseover=&#39;alert(1)'>hola</a>");
});

test("podar: descarta datos editados con un esquema ejecutable", function () {
  var P = nueva();
  ["javascript:alert(1)", " JavaScript:alert(1)", "java\tscript:alert(1)", "vbscript:x", "data:text/html,x"].forEach(function (v) {
    P.fijarEditados({ URLX: v });
    var r = P.podar("<a href=\"" + campo("URLX") + "\">x</a>", {});
    assert.equal(r.html, "<a href=\"[URLX]\">x</a>", v);
    assert.deepEqual(r.sinValor, ["URLX"], v);
  });
  // Un texto normal con dos puntos sigue pasando.
  P.fijarEditados({ URLX: "Nota: vence hoy" });
  assert.equal(P.podar(campo("URLX"), {}).html, "Nota: vence hoy");
});

test("podar: lo editado gana al diccionario y PLASTICO sale del producto", function () {
  var P = nueva();
  P.fijarEditados({ TCEA: "99.9" });
  P.fijarPerfil({ CODPRODUCTO: "TCRCLL" });
  var r = P.podar(campo("TCEA") + "|" + campo("PLASTICO"), {});
  assert.equal(r.html, "99.9|LATAM Cl\u00E1sica");
  // Con VAL_OTRO no hay nombre de tarjeta.
  P.fijarPerfil({ CODPRODUCTO: "otro" });
  assert.equal(P.podar(campo("PLASTICO"), {}).html, "[PLASTICO]");
});

test("podar: un dato editado vacio cuenta como sin valor", function () {
  var P = nueva();
  P.fijarEditados({ firstName: "" });
  var r = P.podar(campo("firstName"), {});
  assert.equal(r.html, "[firstName]");
  assert.deepEqual(r.sinValor, ["firstName"]);
});

test("podar: fechas va solo con los campos FEC", function () {
  var P = nueva();
  var r = P.podar(campo("FECINICIOVIGENCIACAMPANIA") + campo("TCEA") + campo("FECFINVIGENCIACAMPANIA"), {});
  assert.deepEqual(r.fechas, ["FECINICIOVIGENCIACAMPANIA", "FECFINVIGENCIACAMPANIA"]);
  assert.deepEqual(r.campos, ["FECINICIOVIGENCIACAMPANIA", "TCEA", "FECFINVIGENCIACAMPANIA"]);
});

test("podar: include view usa el dato de muestra o queda sin valor", function () {
  var P = nueva();
  var r = P.podar(O + "@ include view='bcpSoloPrimerNombre' " + C + "-" + O + "@include view=\"vistaX\"" + C, {});
  assert.equal(r.html, "Ana-[vistaX]");
  assert.deepEqual(r.sinValor, ["vistaX"]);
});

test("podar: include fragment sin resolver avisa con el motivo del servidor", function () {
  var P = nueva();
  P.FRG_VIA.VIEW1 = "peso";
  var r = P.podar(O + "@ include fragment='VIEW1' " + C + O + "@ include fragment='VIEW2' " + C, {});
  assert.match(r.html, /\[fragmento VIEW1 no resuelto: se cort\u00F3 por tama\u00F1o\]/);
  assert.match(r.html, /\[fragmento VIEW2 no resuelto: sin diagn\u00F3stico del servidor\]/);
  assert.deepEqual(r.includes, ["VIEW1 - se cort\u00F3 por tama\u00F1o", "VIEW2 - sin diagn\u00F3stico del servidor"]);
});

test("podar: quita comentarios y codigo de Campaign que sobra", function () {
  var P = nueva();
  var r = P.podar("a" + O + "/* nota */" + C + "b" + O + " var x = 1; " + C + "c", {});
  assert.equal(r.html, "abc");
  assert.equal(r.html.indexOf(O), -1);
});

test("podar: un campo dentro de un href queda en sinValor", function () {
  var P = nueva();
  var r = P.podar("<a href=\"https://example.com/?u=" + campo("IDCLIENTE") + "\">x</a>", {}, { senalar: true });
  assert.deepEqual(r.sinValor, ["IDCLIENTE"]);
  assert.match(r.html, /href="https:\/\/example.com\/\?u=\u27EA\[IDCLIENTE\]\u27EB"/);
});

// ---------------- detectar ----------------

test("detectar: variables, valores comparados y tipo", function () {
  var P = nueva();
  var presencia = grupo("g3", [{ cond: "targetData.FLGCASHBACK != ''", label: "Con cashback", html: "c" }]);
  var contacto = grupo("g4", [{ cond: "targetData.DESCORREOEENNPRINCIPAL != ''", label: "Con correo", html: "m" }]);
  var d = P.detectar(PRODUCTO + SEGMENTO_SIN_ELSE + presencia + contacto);
  assert.deepEqual(d.orden, ["CODPRODUCTO", "CODSUBSEGMENTO", "FLGCASHBACK"]);
  assert.deepEqual(d.vars.CODPRODUCTO.reales, ["TCRPLL", "TCRORL"]);
  assert.equal(d.vars.CODPRODUCTO.tipo, "valores");
  assert.equal(d.vars.FLGCASHBACK.tipo, "presencia");
  assert.deepEqual(d.omitidas, ["DESCORREOEENNPRINCIPAL"]);
  assert.equal(d.n, 6);
});

// ---------------- auxiliares ----------------

test("fechaMuestra: es relativa a hoy, en dd/mm/aaaa", function () {
  var P = nueva();
  var hoy = new Date(), en30 = new Date();
  en30.setDate(en30.getDate() + 30);
  function f(d) { return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }
  assert.equal(P.fechaMuestra(0), f(hoy));
  assert.equal(P.fechaMuestra(30), f(en30));
  assert.equal(P.diccionario.FECFINVIGENCIACAMPANIA, f(en30));
  assert.equal(P.fechaCompacta(0), f(hoy).split("/").reverse().join(""));
});

test("esc y norm", function () {
  var P = nueva();
  assert.equal(P.esc("<a href=\"x\" title='y'>&</a>"), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
  assert.equal(P.norm("Cl\u00E1sica \u00D1and\u00FA"), "clasica nandu");
});
