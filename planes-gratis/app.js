 'use strict';
const form = document.getElementById('events-form');
const place = document.getElementById('place');
const category = document.getElementById('category');
const when = document.getElementById('when');
const feedback = document.getElementById('feedback');
document.getElementById('year').textContent = new Date().getFullYear();
function dateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function calendarRange(selection) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let end = new Date(start);
  if (selection === 'libre') return '';
  if (selection === 'semana') end.setDate(start.getDate() + 7);
  else if (selection === 'fin') {
    const daysUntilSaturday = (6 - start.getDay() + 7) % 7;
    const saturday = new Date(start); saturday.setDate(start.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday); sunday.setDate(saturday.getDate() + 1);
    return `${dateLocal(saturday)} a ${dateLocal(sunday)}`;
  } else if (selection === 'mes') end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return `${dateLocal(start)} a ${dateLocal(end)}`;
}
function search() {
  const city = place.value.trim().replace(/\s+/g, ' ');
  if (!city) { place.focus(); feedback.textContent = 'Escribe una ciudad o provincia para buscar.'; return; }
  const kind = category.value;
  const dates = calendarRange(when.value);
  const query = ['agenda', 'eventos', 'gratis gratuitos entrada libre', kind, city, 'España', dates].filter(Boolean).join(' ');
  const url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
  feedback.textContent = `Abriendo la búsqueda de planes gratuitos en ${city}. Comprueba fechas, precio y lugar en la web oficial.`;
  // Navegación directa: evita bloqueadores de ventanas emergentes.
  window.location.assign(url);
}
form.addEventListener('submit', event => {event.preventDefault(); search();});
document.querySelectorAll('[data-kind]').forEach(button => {
  button.addEventListener('click', () => {
    category.value = button.dataset.kind;
    if (!place.value.trim()) { place.focus(); feedback.textContent = 'Escribe tu ciudad o provincia arriba y pulsa Buscar.'; return; }
    search();
  });
});
