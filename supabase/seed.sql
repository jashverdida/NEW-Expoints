-- ═══════════════════════════════════════════════════════════════════════════
--  EXPoints — seed data
--  Run AFTER schema.sql. Safe to re-run.
--
--  This only seeds the game catalogue. Users come from real signups (they must
--  exist in auth.users first), so there are no fake accounts here.
-- ═══════════════════════════════════════════════════════════════════════════

insert into games (slug, name, release_year, genre, platforms) values
  ('elden-ring',                  'Elden Ring',                              2022, 'Action RPG',   '{PC,PS5,"Xbox Series X|S"}'),
  ('elden-ring-shadow-of-the-erdtree','Elden Ring: Shadow of the Erdtree',    2024, 'Action RPG',   '{PC,PS5,"Xbox Series X|S"}'),
  ('baldurs-gate-3',              'Baldur''s Gate 3',                        2023, 'CRPG',         '{PC,PS5,"Xbox Series X|S",Mac}'),
  ('cyberpunk-2077',              'Cyberpunk 2077',                          2020, 'Action RPG',   '{PC,PS5,"Xbox Series X|S"}'),
  ('the-legend-of-zelda-tears-of-the-kingdom','The Legend of Zelda: Tears of the Kingdom', 2023, 'Adventure', '{"Nintendo Switch"}'),
  ('marvels-spider-man-2',        'Marvel''s Spider-Man 2',                  2023, 'Action',       '{PS5}'),
  ('hogwarts-legacy',             'Hogwarts Legacy',                         2023, 'Action RPG',   '{PC,PS5,"Xbox Series X|S","Nintendo Switch"}'),
  ('diablo-iv',                   'Diablo IV',                               2023, 'ARPG',         '{PC,PS5,"Xbox Series X|S"}'),
  ('starfield',                   'Starfield',                               2023, 'Action RPG',   '{PC,"Xbox Series X|S"}'),
  ('persona-4-golden',            'Persona 4 Golden',                        2012, 'JRPG',         '{PC,PS4,"Nintendo Switch"}'),
  ('persona-5-royal',             'Persona 5 Royal',                         2019, 'JRPG',         '{PC,PS5,"Xbox Series X|S","Nintendo Switch"}'),
  ('kingdom-hearts-ii',           'Kingdom Hearts II',                       2005, 'Action RPG',   '{PS2,PS4,PC}'),
  ('clair-obscur-expedition-33',  'Clair Obscur: Expedition 33',             2025, 'Turn-based RPG','{PC,PS5,"Xbox Series X|S"}'),
  ('the-witcher-3-wild-hunt',     'The Witcher 3: Wild Hunt',                2015, 'Action RPG',   '{PC,PS5,"Xbox Series X|S","Nintendo Switch"}'),
  ('red-dead-redemption-2',       'Red Dead Redemption 2',                   2018, 'Action',       '{PC,PS4,"Xbox One"}'),
  ('hades-ii',                    'Hades II',                                2024, 'Roguelite',    '{PC,"Nintendo Switch"}'),
  ('hollow-knight-silksong',      'Hollow Knight: Silksong',                 2025, 'Metroidvania', '{PC,PS5,"Xbox Series X|S","Nintendo Switch"}'),
  ('final-fantasy-vii-rebirth',   'Final Fantasy VII Rebirth',               2024, 'JRPG',         '{PC,PS5}'),
  ('helldivers-2',                'Helldivers 2',                            2024, 'Shooter',      '{PC,PS5}'),
  ('balatro',                     'Balatro',                                 2024, 'Roguelike Deckbuilder', '{PC,PS5,"Nintendo Switch",iOS,Android}'),
  ('dark-souls-iii',              'Dark Souls III',                          2016, 'Action RPG',   '{PC,PS4,"Xbox One"}'),
  ('bloodborne',                  'Bloodborne',                              2015, 'Action RPG',   '{PS4}'),
  ('sekiro-shadows-die-twice',    'Sekiro: Shadows Die Twice',               2019, 'Action',       '{PC,PS4,"Xbox One"}'),
  ('god-of-war-ragnarok',         'God of War Ragnarök',                     2022, 'Action',       '{PC,PS5}'),
  ('monster-hunter-wilds',        'Monster Hunter Wilds',                    2025, 'Action RPG',   '{PC,PS5,"Xbox Series X|S"}'),
  ('metaphor-refantazio',         'Metaphor: ReFantazio',                    2024, 'JRPG',         '{PC,PS5,"Xbox Series X|S"}'),
  ('stardew-valley',              'Stardew Valley',                          2016, 'Simulation',   '{PC,PS4,"Xbox One","Nintendo Switch",iOS,Android}'),
  ('minecraft',                   'Minecraft',                               2011, 'Sandbox',      '{PC,PS5,"Xbox Series X|S","Nintendo Switch",iOS,Android}'),
  ('grand-theft-auto-v',          'Grand Theft Auto V',                      2013, 'Action',       '{PC,PS5,"Xbox Series X|S"}'),
  ('the-last-of-us-part-ii',      'The Last of Us Part II',                  2020, 'Action',       '{PS5,PC}')
on conflict (slug) do nothing;

do $$ begin
  raise notice '✔ Seeded % games.', (select count(*) from games);
end $$;
