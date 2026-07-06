INSERT INTO materials (id, name, slug, kind, aliases)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Papel', 'paper', 'paper', ARRAY['hoja', 'cuaderno', 'libreta']),
  ('22222222-2222-2222-2222-222222222222', 'Lapicera', 'pen', 'writing', ARRAY['lapiz', 'birome', 'marcador']),
  ('33333333-3333-3333-3333-333333333333', 'Mazo comun', 'standard-deck', 'cards', ARRAY['cartas francesas', 'naipes', 'baraja']),
  ('44444444-4444-4444-4444-444444444444', 'Fichas', 'tokens', 'tokens', ARRAY['piedritas', 'monedas', 'porotos']),
  ('55555555-5555-5555-5555-555555555555', 'Dado', 'dice', 'dice', ARRAY['dados']),
  ('66666666-6666-6666-6666-666666666666', 'Reloj', 'timer', 'timer', ARRAY['cronometro', 'temporizador', 'celular'])
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    kind = EXCLUDED.kind,
    aliases = EXCLUDED.aliases,
    updated_at = now();

INSERT INTO games (
  id,
  title,
  slug,
  summary_md,
  rules_md,
  min_players,
  max_players,
  min_age,
  difficulty,
  duration_minutes,
  indoor,
  outdoor,
  status
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Tateti',
    'tateti',
    '**Tateti** es un duelo rapido de alineacion en una grilla de nueve casilleros.',
    '- Dibujen una grilla de 3 por 3.
- Cada jugador alterna turnos marcando X u O.
- Gana quien complete una linea horizontal, vertical o diagonal.',
    2,
    2,
    5,
    'easy',
    5,
    true,
    true,
    'approved'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Tutifruti',
    'tutifruti',
    'Juego de palabras por categorias, ideal para grupos y partidas cortas.',
    '- Elijan categorias y una letra inicial.
- Completen una palabra por categoria antes que el resto.
- Puntuen respuestas validas y repitan con otra letra.',
    2,
    12,
    8,
    'easy',
    20,
    true,
    true,
    'approved'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Gatitos explosivos casero',
    'gatitos-explosivos-casero',
    'Variante inspirada en cartas de eliminacion usando un mazo comun.',
    '- Asignen valores del mazo comun a efectos especiales.
- Roben una carta por turno salvo que jueguen una accion.
- Quien roba bomba queda fuera si no tiene defensa.',
    2,
    5,
    10,
    'medium',
    25,
    true,
    false,
    'approved'
  )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    summary_md = EXCLUDED.summary_md,
    rules_md = EXCLUDED.rules_md,
    min_players = EXCLUDED.min_players,
    max_players = EXCLUDED.max_players,
    min_age = EXCLUDED.min_age,
    difficulty = EXCLUDED.difficulty,
    duration_minutes = EXCLUDED.duration_minutes,
    indoor = EXCLUDED.indoor,
    outdoor = EXCLUDED.outdoor,
    status = EXCLUDED.status,
    updated_at = now();

INSERT INTO game_materials (game_id, material_id, requirement_type)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'required'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'required'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'required'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'required'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 'optional'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'required'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'optional'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'optional')
ON CONFLICT (game_id, material_id) DO UPDATE
SET requirement_type = EXCLUDED.requirement_type;
