# County import workspaces

Use `pnpm run init:county-import -- --county=<county-slug>` to scaffold:

- `actors.csv`
- `actor_sources.csv`
- `actor_repair_services.csv`
- `README.txt`

Each county folder is intended for curated imports that are previewed through `/admin/imports?county=<county-slug>`.

For `actor_repair_services.csv`:

- `price_min` is required.
- `price_max` may be blank when the source only publishes a starting price (`fra`).
