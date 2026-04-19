export const actorImportTemplates = {
  actors: `actor_slug,name,category,description,long_description,address,postal_code,county,county_slug,municipality,municipality_slug,city,area,lat,lng,phone,email,website,instagram,opening_hours,opening_hours_osm,tags,benefits,how_to_use,image,nationwide,service_area_county_slugs,service_area_municipality_slugs
eksempel-aktor,Eksempel Aktør,brukt,Kort beskrivelse,Lang beskrivelse,Gate 1 0001 Oslo,0001,Oslo,oslo,Oslo,oslo,Oslo,,59.9139,10.7522,+4712345678,post@example.no,https://example.no,,Man-fre 10:00-18:00|Lør 11:00-16:00,Mo-Fr 10:00-18:00; Sa 11:00-16:00,second hand|lokal,Reduserer avfall|gir nytt liv,Lever inn varer|Besøk butikken,,false,akershus,baerum`,
  actor_sources: `actor_slug,type,title,url,captured_at,note
eksempel-aktor,website,Offisiell nettside,https://example.no,2026-03-29,Primærkilde for åpningstider og kontaktinfo`,
  actor_repair_services: `actor_slug,problem_type,item_types,price_min,price_max,eta_days
eksempel-aktor,screen,phone|laptop,900,,2`,
} as const
