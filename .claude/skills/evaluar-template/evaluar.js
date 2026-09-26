// Evalua un template de Campaign con la misma logica de poda del preview.
// Uso: node evaluar.js <frgId> [ruta a previewFragment.jssp]
// Baja /cus/previewFragment.jssp?frgId=N de stage, recorre todos los escenarios
// (combinaciones de los valores que nombra el template) y reporta que falta en cada uno.
// Solo lee: no envia nada ni toca Campaign.
var fs = require("fs");
var path = require("path");

var HOST = "https://bcp-mkt-stage12.campaign.adobe.com";
var TOPE = 400; // escenarios maximos a recorrer

var frgId = process.argv[2];
var jssp = process.argv[3] || path.join(__dirname, "..", "..", "..", "previewFragment.jssp");
if (!/^\d+$/.test(frgId || "")) { console.error("Uso: node evaluar.js <frgId> [previewFragment.jssp]"); process.exit(2); }

function desentidad(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); })
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function atributo(pagina, nombre) {
  var m = new RegExp(nombre + '="([^"]*)"').exec(pagina);
  return m ? desentidad(m[1]) : "";
}

// La logica de poda sale del propio JSSP (entre BEGIN-PODA y END-PODA): el reporte
// usa exactamente el mismo evaluador que la pagina.
function cargarPoda() {
  var t = fs.readFileSync(jssp, "utf8");
  var a = t.indexOf("// BEGIN-PODA"), b = t.indexOf("// END-PODA");
  if (a < 0 || b < 0) throw new Error("No encuentro BEGIN-PODA/END-PODA en " + jssp);
  var cuerpo = "var perfil = {}, VAL_OTRO = 'otro';\n" + t.slice(a, b) +
    "\nreturn { podar: podar, detectar: detectar, traducirUI: traducirUI, FRG_VIA: FRG_VIA," +
    " diccionario: diccionario, esContactoMuestra: esContactoMuestra," +
    " fijarPerfil: function (p) { perfil = p; } };";
  return new Function(cuerpo)();
}

function combinaciones(det) {
  var listas = det.orden.map(function (v) {
    var d = det.vars[v];
    return d.tipo === "valores" ? d.reales.slice() : ["S", ""];
  });
  var out = [{}];
  det.orden.forEach(function (v, i) {
    var sig = [];
    out.forEach(function (p) {
      listas[i].forEach(function (val) { var c = Object.assign({}, p); c[v] = val; sig.push(c); });
    });
    out = sig;
  });
  return out;
}

function main(pagina) {
  var html = decodeURIComponent(atributo(pagina, "data-html"));
  if (!html) { console.error("La pagina no trae data-html: revisa el frgId o si el template esta guardado."); process.exit(1); }
  var P = cargarPoda();
  atributo(pagina, "data-frg").split(",").forEach(function (x) {
    if (!x) return;
    var p = x.split("|");
    P.FRG_VIA[decodeURIComponent(p[0])] = p[1] || "";
  });

  var det = P.detectar(html);
  var escenarios = combinaciones(det);
  var recortado = escenarios.length > TOPE;
  if (recortado) escenarios = escenarios.slice(0, TOPE);

  var problemas = {}; // clave -> { tipo, detalle, escenarios: [] }
  function anota(tipo, detalle, esc) {
    var k = tipo + "|" + detalle;
    (problemas[k] = problemas[k] || { tipo: tipo, detalle: detalle, escenarios: [] }).escenarios.push(esc);
  }
  function nombreEsc(p) {
    return det.orden.map(function (v) { return P.traducirUI(v) + "=" + (p[v] === "" ? "(vacio)" : P.traducirUI(p[v])); }).join(", ") || "(sin variables)";
  }
  escenarios.forEach(function (p) {
    P.fijarPerfil(p);
    var r = P.podar(html, p, { muestra: true });
    var esc = nombreEsc(p);
    r.elegidas.forEach(function (e) { if (e.sin) anota("Grupo sin rama activa", "grupo " + e.grupo, esc); });
    r.noEvalTextos.forEach(function (c) { anota("Condicion no evaluable", c, esc); });
    r.includes.forEach(function (f) { anota("Fragmento no resuelto", f, esc); });
    r.sinValor.forEach(function (k) { anota("Campo sin dato de muestra (solo preview)", k, esc); });
  });

  var total = escenarios.length;
  var lineas = [];
  lineas.push("# Evaluacion del template " + frgId);
  lineas.push("");
  lineas.push("- Variables: " + (det.orden.map(function (v) {
    var d = det.vars[v];
    return P.traducirUI(v) + " (" + (d.tipo === "valores" ? d.reales.length + " valores" : "presencia") + ")";
  }).join(", ") || "ninguna"));
  if (det.omitidas.length) lineas.push("- Condiciones de contacto omitidas: " + det.omitidas.join(", "));
  lineas.push("- Escenarios recorridos: " + total + (recortado ? " (recortado a " + TOPE + ")" : ""));
  lineas.push("");
  var orden = ["Grupo sin rama activa", "Condicion no evaluable", "Fragmento no resuelto", "Campo sin dato de muestra (solo preview)"];
  var hay = false;
  orden.forEach(function (tipo) {
    var ls = Object.keys(problemas).map(function (k) { return problemas[k]; }).filter(function (x) { return x.tipo === tipo; });
    if (!ls.length) return;
    hay = true;
    lineas.push("## " + tipo);
    ls.forEach(function (x) {
      var n = x.escenarios.length;
      lineas.push("- `" + x.detalle + "`: " + (n === total ? "todos los escenarios" : n + " de " + total + " escenarios"));
      if (n !== total) x.escenarios.slice(0, 8).forEach(function (e) { lineas.push("  - " + e); });
      if (n !== total && n > 8) lineas.push("  - ... y " + (n - 8) + " mas");
    });
    lineas.push("");
  });
  if (!hay) lineas.push("Sin problemas: todos los escenarios eligen rama, evaluan sus condiciones y tienen dato de muestra.");
  lineas.push("");
  inventario(html, P, det).forEach(function (l) { lineas.push(l); });
  console.log(lineas.join("\n"));
}

// ---------- Inventario de variables ----------
// Que variables deciden ramas (con que valores), cuales solo se imprimen (donde: texto o atributo)
// y si el preview tiene dato de muestra. Ademas avisa de montos escritos fijos y de condiciones que
// mezclan el segmento con los datos de contacto.
function inventario(h, P, det) {
  var O = "<" + "%", C = "%" + ">", m, vars = {}, orden = [];
  function v(n) { if (!vars[n]) { vars[n] = { conds: 0, vals: {}, impr: 0, donde: {} }; orden.push(n); } return vars[n]; }
  var rc = new RegExp(O + "\\s*\\}?\\s*(?:else\\s+)?if\\s*\\(([\\s\\S]*?)\\)\\s*\\{\\s*" + C, "g"), mezcla = 0;
  while ((m = rc.exec(h))) {
    var c = m[1], r = /(?:targetData|recipient)\.(\w+)\s*(?:===?|!==?)\s*(?:'([^']*)'|"([^"]*)")/g, mm, vistos = {};
    while ((mm = r.exec(c))) {
      var x = v(mm[1]);
      if (!vistos[mm[1]]) { x.conds++; vistos[mm[1]] = 1; }
      var val = mm[2] !== undefined ? mm[2] : mm[3];
      x.vals[val] = (x.vals[val] || 0) + 1;
    }
    if (/\|\|/.test(c) && det.orden.some(function (n) { return c.indexOf(n) >= 0; }) &&
        det.omitidas.some(function (n) { return c.indexOf(n) >= 0; })) mezcla++;
  }
  function lugar(i) {
    var a = i - 1; while (a >= 0) { a = h.lastIndexOf("<", a); if (a < 0 || h.charAt(a + 1) !== "%") break; a--; }
    var z = i - 1; while (z >= 0) { z = h.lastIndexOf(">", z); if (z < 0 || h.charAt(z - 1) !== "%") break; z--; }
    if (a > z) { var at = /([\w-]+)\s*=\s*["'][^"']*$/.exec(h.slice(a, i)); return at ? "atributo " + at[1] : "atributo"; }
    return "texto";
  }
  var ri = new RegExp(O + "=([\\s\\S]*?)" + C, "g");
  while ((m = ri.exec(h))) {
    var k = /(?:targetData|recipient)\.(\w+)/.exec(m[1]);
    if (!k) continue;
    var x = v(k[1]); x.impr++; var l = lugar(m.index); x.donde[l] = (x.donde[l] || 0) + 1;
  }
  var rv = new RegExp(O + "@\\s*include\\s+view\\s*=\\s*['\"]([^'\"]+)['\"]\\s*" + C, "g");
  while ((m = rv.exec(h))) { var x2 = v(m[1]); x2.impr++; var l2 = lugar(m.index); x2.donde[l2] = (x2.donde[l2] || 0) + 1; }

  var out = ["## Variables", "", "### Deciden que rama se muestra"];
  orden.filter(function (n) { return vars[n].conds; }).forEach(function (n) {
    var x = vars[n], vals = Object.keys(x.vals).map(function (z) { return z === "" ? "(vacio)" : z + " (" + P.traducirUI(z) + ")"; });
    out.push("- `" + n + "`" + (P.traducirUI(n) !== n ? " = " + P.traducirUI(n) : "") + ": " + x.conds + " condiciones" +
      (P.esContactoMuestra(n) ? "; dato de contacto, el preview omite estas condiciones" : (det.vars[n] ? "; se elige en la ficha" : "")) + ". Valores: " + vals.join(", "));
  });
  out.push("", "### Se imprimen en el correo (editables en Datos de muestra, salvo PLASTICO)");
  var impresas = orden.filter(function (n) { return vars[n].impr; });
  if (!impresas.length) out.push("- Ninguna.");
  impresas.forEach(function (n) {
    var x = vars[n], donde = Object.keys(x.donde).map(function (z) { return z + " x" + x.donde[z]; }).join(", ");
    var muestra = n === "PLASTICO" ? "sale del producto elegido" : (P.diccionario[n] !== undefined ? "dato de muestra: " + P.diccionario[n] : "SIN dato de muestra");
    out.push("- `" + n + "`: " + donde + "; " + muestra);
  });
  // Montos escritos fijos en el texto (no vienen de una variable).
  var texto = h.replace(new RegExp(O + "[\\s\\S]*?" + C, "g"), " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  var montos = texto.match(/(?:S\/|US\$|\$)\s*\d[\d.,]*/g) || [];
  out.push("", "### Avisos");
  if (montos.length) out.push("- Montos escritos fijos en el HTML (todos los clientes ven el mismo): " +
    montos.map(function (x) { return x.replace(/\s+/g, " "); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 8).join(", ") +
    ". Si deberian ser personalizados, falta un campo en Campaign.");
  if (mezcla) out.push("- " + mezcla + " condiciones mezclan una variable de la ficha con datos de contacto vacios (con ||): un cliente al que le falte el dato de contacto cae en esa rama aunque su segmento o producto sea otro. El preview no muestra ese caso.");
  if (!montos.length && !mezcla) out.push("- Ninguno.");
  return out;
}

fetch(HOST + "/cus/previewFragment.jssp?frgId=" + frgId)
  .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
  .then(main)
  .catch(function (e) { console.error("No se pudo bajar el template: " + e.message); process.exit(1); });
