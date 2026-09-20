// Fixtures genericos: no copiar HTML de mailings reales a este directorio.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'previewFragment2.jssp'), 'utf8');
const pure = source.split('// BEGIN-PODA')[1].split('// END-PODA')[0];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(pure, ctx);

const fields = ['DESCORREOEENNPRINCIPAL', 'DESNBREENNPRINCIPAL', 'DESCELULAREENNPRINCIPAL'];
const consumo = "(targetData.SEGMENTO == 'CONSUMO' || targetData.DESCORREOEENNPRINCIPAL == '' || targetData.DESNBREENNPRINCIPAL === '' || targetData.DESCELULAREENNPRINCIPAL === '') && targetData.PRODUCTO == 'CLASICA'";
// Incluye la comparacion invertida que dejaba inaccesible el banner BEX.
const bex = "(targetData.SEGMENTO == 'BEX' && targetData.DESCORREOEENNPRINCIPAL == '' && targetData.DESNBREENNPRINCIPAL !== '' && targetData.DESCELULAREENNPRINCIPAL !== '') && targetData.PRODUCTO == 'CLASICA'";

function branch(condition, label, html) {
  return '<% ' + (condition ? 'if (' + condition + ') ' : 'else ') + '{ %>' +
    '<%/* [acr-dc-start-cond(' + label + ',id,cond)] */%>' + html +
    '<%/* [acr-dc-end-cond] */%><% } %>';
}
function group(body) {
  return '<%/* [acr-dc-start-group(g)] */%>' + body + '<%/* [acr-dc-end-group] */%>';
}
const sampleTokens = fields.map(f => '<%= targetData.' + f + ' %>').join('|');
const fixture = group(branch(consumo, 'Consumo', 'BANNER_CONSUMO') +
  branch(bex, 'BEX', 'BANNER_BEX') + branch(null, 'Default', 'SIN_BANNER')) + sampleTokens;

let scenarios = 0;
for (const segment of ['CONSUMO', 'BEX']) {
  for (const product of ['CLASICA', 'OTRO']) {
    for (let mask = 0; mask < 8; mask++) {
      const profile = { SEGMENTO: segment, PRODUCTO: product };
      fields.forEach((f, i) => { profile[f] = mask & (1 << i) ? 'otro' : ''; });
      const result = ctx.podar(fixture, profile, {});
      const expected = product === 'OTRO' ? 'SIN_BANNER' : 'BANNER_' + segment;
      assert.ok(result.html.startsWith(expected), JSON.stringify(profile));
      assert.equal(result.noEval, 0);
      assert.equal(result.includes.length, 0);
      assert.ok(result.html.includes('ejecutivo@example.com'));
      assert.ok(result.html.includes('MARIA LOPEZ DEMO'));
      assert.ok(result.html.includes('987654321'));
      const raw = ctx.podar(fixture, profile, { muestra: false });
      fields.forEach(f => assert.ok(raw.html.includes('[' + f + ']')));
      assert.equal(raw.elegidas[0].label, result.elegidas[0].label);
      scenarios++;
    }
  }
}

const detection = ctx.detectar(fixture);
assert.deepEqual(Array.from(detection.orden), ['SEGMENTO', 'PRODUCTO']);
assert.deepEqual(Array.from(detection.omitidas).sort(), fields.slice().sort());
assert.equal(ctx.evaluar(bex, { SEGMENTO: 'BEX', PRODUCTO: 'CLASICA' }), true);
assert.equal(ctx.evaluar(consumo, { SEGMENTO: 'BEX', PRODUCTO: 'CLASICA' }), false);
assert.equal(ctx.evaluar("!(recipient.DESCORREOEENNPRINCIPAL != '') && targetData.SEGMENTO == 'BEX'", { SEGMENTO: 'BEX' }), true);
assert.equal(ctx.evaluar("targetData.SEGMENTO == 'CONSUMO' || !(recipient.DESCORREOEENNPRINCIPAL != '')", { SEGMENTO: 'BEX' }), false);
assert.equal(ctx.evaluar("'' == targetData.DESCORREOEENNPRINCIPAL", {}), true);
assert.equal(ctx.evaluar("targetData.OTROCONTACTO != ''", { OTROCONTACTO: '' }), false);
assert.equal(ctx.evaluar("targetData.OTROCONTACTO != ''", { OTROCONTACTO: 'dato' }), true);
assert.equal(ctx.evaluar("targetData.TEXTO == 'DESCORREOEENNPRINCIPAL'", { TEXTO: 'diferente' }), false);
assert.throws(() => ctx.evaluar('targetData.DESCORREOEENNPRINCIPAL.toString()', {}));
assert.throws(() => ctx.evaluar("targetData.DESCORREOEENNPRINCIPAL == '' && funcionDesconocida", {}));

const contactOnly = group(branch("targetData.DESCORREOEENNPRINCIPAL != ''", 'Contacto', sampleTokens) + branch(null, 'Default', 'VACIO'));
assert.equal(ctx.podar(contactOnly, {}, {}).elegidas[0].label, 'Contacto');
assert.equal(ctx.detectar(contactOnly).orden.length, 0);
assert.equal(ctx.detectar('Sin condiciones').omitidas.length, 0);

// Los enlaces antiguos no vuelven a activar las banderas ni se propagan al copiar enlace.
ctx.location = { search: '?frgId=123&v.SEGMENTO=BEX&v.PRODUCTO=CLASICA&v.DESCORREOEENNPRINCIPAL=&v.DESNBREENNPRINCIPAL=otro&v.DESCELULAREENNPRINCIPAL=otro&muestra=0', pathname: '/preview.jssp' };
ctx.perfil = {};
ctx.vista = { w: 700, z: 100, muestra: true };
ctx.actual = '123';
ctx.det = detection;
let written;
ctx.history = { replaceState(_state, _title, url) { written = url; } };
vm.runInContext(source.slice(source.indexOf('  function leerURL()'), source.indexOf('  // ---------------- Combobox')), ctx);
ctx.leerURL();
fields.forEach(f => assert.equal(ctx.perfil[f], undefined));
ctx.escribirURL();
assert.equal(written, '/preview.jssp?frgId=123&v.SEGMENTO=BEX&v.PRODUCTO=CLASICA&muestra=0');
console.log('OK: ' + scenarios + ' escenarios, datos ficticios, modo CAMPOS, condiciones mixtas y enlaces antiguos.');
