CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "actors"
ADD COLUMN IF NOT EXISTS "search_text" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "actor_browse_scopes" (
  "id" TEXT PRIMARY KEY,
  "actor_id" TEXT NOT NULL REFERENCES "actors"("id") ON DELETE CASCADE,
  "county_slug" TEXT NOT NULL,
  "municipality_slug" TEXT NULL,
  "priority" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "actors_status_lat_lng_idx" ON "actors"("status", "lat", "lng");
CREATE INDEX IF NOT EXISTS "actors_search_text_trgm_idx" ON "actors" USING GIN ("search_text" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "actors_tags_gin_idx" ON "actors" USING GIN ("tags");

CREATE INDEX IF NOT EXISTS "actor_browse_scopes_actor_id_idx" ON "actor_browse_scopes"("actor_id");
CREATE INDEX IF NOT EXISTS "actor_browse_scopes_lookup_idx"
  ON "actor_browse_scopes"("county_slug", "municipality_slug", "priority", "actor_id");
CREATE UNIQUE INDEX IF NOT EXISTS "actor_browse_scopes_actor_scope_unique"
  ON "actor_browse_scopes"("actor_id", "county_slug", COALESCE("municipality_slug", ''));

