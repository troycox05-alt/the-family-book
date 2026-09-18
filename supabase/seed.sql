-- Power 4 roster as of the 2026 season (no P4 membership changes from 2025;
-- all 2026 realignment activity was Group of Five / Pac-12 rebuild).
-- Sources checked 2026-09-17: ESPN realignment tracker, conference sites.
-- Stored as short school names (no mascot) because The Odds API returns
-- "<School> <Mascot>" strings; sync logic matches on substring/contains
-- against these names rather than requiring an exact mascot match.

insert into public.teams (name, conference) values
  -- ACC (17)
  ('Boston College', 'ACC'),
  ('California', 'ACC'),
  ('Clemson', 'ACC'),
  ('Duke', 'ACC'),
  ('Florida State', 'ACC'),
  ('Georgia Tech', 'ACC'),
  ('Louisville', 'ACC'),
  ('Miami', 'ACC'),
  ('North Carolina', 'ACC'),
  ('NC State', 'ACC'),
  ('Pittsburgh', 'ACC'),
  ('SMU', 'ACC'),
  ('Stanford', 'ACC'),
  ('Syracuse', 'ACC'),
  ('Virginia', 'ACC'),
  ('Virginia Tech', 'ACC'),
  ('Wake Forest', 'ACC'),

  -- Big Ten (18)
  ('Illinois', 'Big Ten'),
  ('Indiana', 'Big Ten'),
  ('Iowa', 'Big Ten'),
  ('Maryland', 'Big Ten'),
  ('Michigan', 'Big Ten'),
  ('Michigan State', 'Big Ten'),
  ('Minnesota', 'Big Ten'),
  ('Nebraska', 'Big Ten'),
  ('Northwestern', 'Big Ten'),
  ('Ohio State', 'Big Ten'),
  ('Oregon', 'Big Ten'),
  ('Penn State', 'Big Ten'),
  ('Purdue', 'Big Ten'),
  ('Rutgers', 'Big Ten'),
  ('UCLA', 'Big Ten'),
  ('USC', 'Big Ten'),
  ('Washington', 'Big Ten'),
  ('Wisconsin', 'Big Ten'),

  -- Big 12 (16)
  ('Arizona', 'Big 12'),
  ('Arizona State', 'Big 12'),
  ('Baylor', 'Big 12'),
  ('BYU', 'Big 12'),
  ('Cincinnati', 'Big 12'),
  ('Colorado', 'Big 12'),
  ('Houston', 'Big 12'),
  ('Iowa State', 'Big 12'),
  ('Kansas', 'Big 12'),
  ('Kansas State', 'Big 12'),
  ('Oklahoma State', 'Big 12'),
  ('TCU', 'Big 12'),
  ('Texas Tech', 'Big 12'),
  ('UCF', 'Big 12'),
  ('Utah', 'Big 12'),
  ('West Virginia', 'Big 12'),

  -- SEC (16)
  ('Alabama', 'SEC'),
  ('Arkansas', 'SEC'),
  ('Auburn', 'SEC'),
  ('Florida', 'SEC'),
  ('Georgia', 'SEC'),
  ('Kentucky', 'SEC'),
  ('LSU', 'SEC'),
  ('Mississippi State', 'SEC'),
  ('Missouri', 'SEC'),
  ('Oklahoma', 'SEC'),
  ('Ole Miss', 'SEC'),
  ('South Carolina', 'SEC'),
  ('Tennessee', 'SEC'),
  ('Texas', 'SEC'),
  ('Texas A&M', 'SEC'),
  ('Vanderbilt', 'SEC')
on conflict do nothing;
