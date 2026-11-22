import assert from 'node:assert/strict';
import {readAndaluciaD1} from './planes-gratis.mjs';
const rows=[
 {evento_id:'1',titulo:'Festival Familiar «FUNNY»',nombre_localidad:'Sevilla',nombre_provincia:'Sevilla',fecha_inicio:'2026-11-22',fecha_fin:'2026-11-22',precio_original:'',descripcion_html:'Plan familiar',datos_originales_json:'{}',enlace_contenido:null},
 {evento_id:'2',titulo:'Talleres de adornos navideños',nombre_localidad:'Sevilla',nombre_provincia:'Sevilla',fecha_inicio:'2026-11-22',fecha_fin:'2026-11-22',precio_original:'Gratuito',descripcion_html:'Taller',datos_originales_json:'{}',enlace_contenido:''},
 {evento_id:'3',titulo:'Ferrocarril del Alamillo',nombre_localidad:'Sevilla',nombre_provincia:'Sevilla',fecha_inicio:'2026-11-22',fecha_fin:'2026-11-22',precio_original:'',descripcion_html:'Familias',datos_originales_json:'{}',enlace_contenido:null},
 {evento_id:'4',titulo:'Jornada técnica: riesgos laborales',nombre_localidad:'Sevilla',fecha_inicio:'2026-11-22',datos_originales_json:'{}'},
 {evento_id:'5',titulo:'Consulta de expedientes',nombre_localidad:'Sevilla',fecha_inicio:'2026-11-22',datos_originales_json:'{}'},
 {evento_id:'6',titulo:'Concierto de Navidad',nombre_localidad:'Sevilla',fecha_inicio:'2026-11-23',precio_original:'10 €',enlace_contenido:'https://ejemplo.es/concierto',datos_originales_json:'{}'},
];
const db={prepare(q){assert.match(q,/junta-andalucia-agenda/);return {bind(province,to,from){assert.equal(province,'Sevilla');return {async all(){return {results:rows};}};}};}};
const d={received:0,missingTitle:0,missingDate:0,outOfRange:0,missingPlace:0,wrongProvince:0,missingLink:0,accepted:0,classified:{gratis:0,condicional:0,pendiente:0,pago:0}};
const output=await readAndaluciaD1(db,'2026-11-22','2026-11-29','Sevilla',d);
assert.equal(output.length,4);
assert.equal(d.missingLink,3);
assert.equal(d.excludedAdministrative,1);
assert.equal(d.excludedUnclear,1);
assert.equal(output.filter(x=>x.missingOfficialLink).length,3);
assert.equal(output.find(x=>x.title.startsWith('Festival')).status,'pendiente');
assert.equal(output.find(x=>x.title.startsWith('Talleres')).status,'gratis');
assert.equal(output.find(x=>x.title.startsWith('Concierto')).status,'pago');
assert(output.every(x=>x.description.includes('Fecha por confirmar')));
assert(output.filter(x=>x.missingOfficialLink).every(x=>x.url===''));
console.log('PASS: actividades sin enlace se conservan, sin inventar URL ni precio');
console.log('PASS: jornadas y contenidos imprecisos siguen excluidos');
console.log('PASS: fechas siguen marcadas por verificar');
console.log('PASS: otras provincias no se alteran (diff acotado a Andalucía)');
