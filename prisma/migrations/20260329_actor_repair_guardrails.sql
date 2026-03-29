CREATE OR REPLACE FUNCTION public.actor_category_allows_repair_services(category_value "ActorCategory")
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN category_value::text IN (
    'reparasjon',
    'reparasjon_sko_klar',
    'mobelreparasjon',
    'sykkelverksted',
    'ombruksverksted'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_actor_repair_service_category()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actor_category "ActorCategory";
BEGIN
  SELECT category
  INTO actor_category
  FROM public.actors
  WHERE id = NEW.actor_id;

  IF actor_category IS NULL THEN
    RAISE EXCEPTION 'Actor % not found for repair service write', NEW.actor_id
      USING ERRCODE = '23503';
  END IF;

  IF NOT public.actor_category_allows_repair_services(actor_category) THEN
    RAISE EXCEPTION 'Repair services are not allowed for actor category %', actor_category
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS actor_repair_services_category_guard ON public.actor_repair_services;
CREATE TRIGGER actor_repair_services_category_guard
BEFORE INSERT OR UPDATE ON public.actor_repair_services
FOR EACH ROW
EXECUTE FUNCTION public.guard_actor_repair_service_category();

CREATE OR REPLACE FUNCTION public.guard_actor_category_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.actor_category_allows_repair_services(NEW.category) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.actor_repair_services
    WHERE actor_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Actor % still has repair services and cannot change to category %', NEW.id, NEW.category
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS actors_category_repair_guard ON public.actors;
CREATE TRIGGER actors_category_repair_guard
BEFORE UPDATE OF category ON public.actors
FOR EACH ROW
EXECUTE FUNCTION public.guard_actor_category_update();
