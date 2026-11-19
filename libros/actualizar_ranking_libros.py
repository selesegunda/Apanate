"""Actualiza el catálogo incrustado en libros/index.html usando el endpoint EXISTENTE.

No inventa puestos, no cambia precios ni cubiertas, no publica una fecha nueva
si no hay 40 libros reales y una edición más reciente.
"""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'libros' / 'index.html'
API_URL = os.getenv('RANKING_API_URL', 'https://apanate.pages.dev/api/libros-ranking')
PATTERN = re.compile(r'(<script\s+type="application/json"\s+id="catalog">)(.*?)(</script>)', re.S)
OFFICIAL_HOST = 'www.elespanol.com'


def norm(s):
    import unicodedata
    s = unicodedata.normalize('NFD', str(s or '').casefold())
    return ' '.join(''.join(c for c in s if not unicodedata.combining(c)).split())


def validate(payload, baseline_date):
    if not isinstance(payload, dict) or not isinstance(payload.get('libros'), list):
        raise ValueError('La API no proporciona una lista de libros')
    fecha = payload.get('fecha')
    if not isinstance(fecha, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', fecha):
        raise ValueError('Fecha de edición inválida')
    date = dt.date.fromisoformat(fecha)
    if date > dt.datetime.now(ZoneInfo('Europe/Madrid')).date():
        raise ValueError('La edición tiene fecha futura')
    url = payload.get('url', '')
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname != OFFICIAL_HOST or '/el-cultural/letras/los-libros-mas-vendidos/' not in parsed.path:
        raise ValueError('Enlace de edición no pertenece a la fuente conocida')
    books = payload['libros']
    if len(books) != 40:
        raise ValueError(f'Se necesitan 40 libros: recibidos {len(books)}')
    for grp in ('ficcion', 'no-ficcion'):
        matches = [b for b in books if isinstance(b, dict) and b.get('grupo') == grp]
        positions = [b.get('puesto') for b in matches]
        if sorted(positions) != list(range(1, 21)):
            raise ValueError(f'Ranking de {grp} incompleto o duplicado')
        if any(not isinstance(b.get('titulo'), str) or not b['titulo'].strip() or
               not isinstance(b.get('autor'), str) or not b['autor'].strip() for b in matches):
            raise ValueError(f'Títulos o autores incompletos en {grp}')
    if fecha <= baseline_date:
        return False
    return True


def update(html, payload):
    match = PATTERN.search(html)
    if not match:
        raise ValueError('No existe el catálogo JSON esperado en libros/index.html')
    old = json.loads(match.group(2))
    if not isinstance(old, list) or not old:
        raise ValueError('El catálogo anterior está vacío')
    old_dates = [b.get('fecha_ranking', '') for b in old if isinstance(b, dict)]
    baseline = max(old_dates, default='')
    if not validate(payload, baseline):
        print(f'Sin edición nueva: {payload["fecha"]} <= {baseline}')
        return None
    previous = {(norm(b.get('titulo')), norm(b.get('autor'))): b for b in old if isinstance(b, dict)}
    new = []
    for book in payload['libros']:
        key = (norm(book['titulo']), norm(book['autor']))
        prior = previous.get(key, {})
        # Conservamos metadatos solo de la misma obra, nunca asignamos los
        # datos de portada/ISBN/precio de otro título ni inventamos información.
        entry = {**prior, **book,
                 'fecha_ranking': payload['fecha'], 'fuente_ranking': payload['url']}
        new.append(entry)
    # Evitar que contenido externo cierre el bloque script o inyecte HTML.
    encoded = json.dumps(new, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    updated = html[:match.start(2)] + encoded + html[match.end(2):]
    # Actualizar las DOS referencias de fuente sin tocar elementos ajenos.
    for marker in ('id="rank-source-link"', 'data-rank-source'):
        pattern = re.compile(r'(<a\b(?=[^>]*' + re.escape(marker) + r')[^>]*\bhref=")[^"]+("[^>]*>)', re.S)
        updated, count = pattern.subn(lambda m: m.group(1) + payload['url'] + m.group(2), updated, count=1)
        if count != 1:
            raise ValueError(f'No se localizó el enlace esperado: {marker}')
    print(f'Actualización validada: {baseline} -> {payload["fecha"]}, {len(new)} libros')
    return updated


def main():
    html = INDEX.read_text(encoding='utf-8')
    try:
        u = urlparse(API_URL)
        if u.scheme != 'https' or not u.hostname:
            raise ValueError('La URL de la API debe usar HTTPS')
        request = Request(API_URL, headers={'Accept': 'application/json', 'User-Agent': 'ApanateRankingWeekly/1.0'})
        with urlopen(request, timeout=22) as response:
            if response.status != 200:
                raise ValueError(f'HTTP {response.status}')
            raw = response.read(1_000_001)
            if len(raw) > 1_000_000:
                raise ValueError('Respuesta demasiado grande')
        payload = json.loads(raw)
        revised = update(html, payload)
    except Exception as exc:
        # Nada que publicar. Sin fallar ni falsificar la fecha.
        print(f'Conservando ranking existente: {exc}', file=sys.stderr)
        return 0
    if revised is not None:
        INDEX.write_text(revised, encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
