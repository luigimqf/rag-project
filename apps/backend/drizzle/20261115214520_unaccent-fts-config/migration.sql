-- Custom SQL migration file, put your code below! --
-- Config de full-text em português que ignora acentos ("liquida" casa com "líquida").
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE TEXT SEARCH CONFIGURATION pt_unaccent (COPY = portuguese);--> statement-breakpoint
ALTER TEXT SEARCH CONFIGURATION pt_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, portuguese_stem;
