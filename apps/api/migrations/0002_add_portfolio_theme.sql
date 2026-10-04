ALTER TABLE portfolios ADD COLUMN theme_key TEXT NOT NULL DEFAULT 'cosmic-cyan'
  CHECK (theme_key IN ('cosmic-cyan', 'solar-orange', 'nebula-violet'));
