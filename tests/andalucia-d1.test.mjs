import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const code=await fs.readFile(new URL('../functions/api/planes-gratis.js',import.meta.url),'utf8');
const {readAndaluciaD1}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const sample=(evento_id,titulo,precio_original='Gratuito')=>({evento_id,titulo,descripcion_html:'<p>Actividad de la Junta</p>',tematica:'Cultura',categoria:'',precio_original,nombre_localidad:'Sevilla',nombre_provincia:'Sevilla',lugar_celebracion:'Parque',enlace_contenido:'https://www.juntadeandalucia.es/actividad/'+evento_id,fecha_inicio:'2026-11-22',fecha_fin:'2026-11-22',hora_inicio:'10:00',datos_originales_json:'{}'});
const rows=[sample('1','Talleres de adornos navideños'),sample('2','Premios Andalucía Joven 2020'),sample('3','Festival Familiar FUNNY',''),sample('1','Talleres de adornos navideños')];
function mock(){let query='',bindings=[];return {db:{prepare(sql){query=sql;return {bind(...v){bindings=v;return {async all(){return {results:rows}}}}}}},get(){return {query,bindings}}}}
function diag(){return {received:0,missingTitle:0,missingDate:0,missingPlace:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}}}
test('consulta solo SELECT, provincia y fechas parametrizadas',async()=>{const m=mock();const events=await readAndaluciaD1(m.db,'2026-11-22','2026-12-22','Sevilla',diag());assert.match(m.get().query.trim(),/^SELECT/i);assert.doesNotMatch(m.get().query,/\b(?:INSERT|DELETE|UPDATE)\b/i);assert.deepEqual(m.get().bindings,['Sevilla','2026-12-22','2026-11-22']);assert.equal(events.length,2)});
test('descarta convocatoria y evita duplicados',async()=>{const m=mock(),d=diag();const events=await readAndaluciaD1(m.db,'2026-11-22','2026-12-22','Sevilla',d);assert.equal(d.excludedAdministrative,1);assert.equal(events.filter(x=>x.title.includes('adornos')).length,1)});
test('no inventa gratuidad',async()=>{const m=mock();const events=await readAndaluciaD1(m.db,'2026-11-22','2026-12-22','Sevilla',diag());assert.equal(events.find(x=>x.title.includes('FUNNY')).status,'pendiente');assert.equal(events.find(x=>x.title.includes('adornos')).status,'gratis')});
test('sin base devuelve error explícito',async()=>{await assert.rejects(()=>readAndaluciaD1(null,'2026-11-22','2026-12-22','Sevilla',diag()),/binding/)});
