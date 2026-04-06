"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Actor } from "@/lib/data";
import { actorCopy } from "@/content/no";
import { ActorTrustBadges } from "@/components/actor-trust-badges";
import { formatActorGeoLabel } from "@/lib/geo";
import { recordAction } from "@/lib/profile-store";
import { categoryConfig } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface ActorCardProps {
  actor: Actor;
  isFavorite?: boolean;
  showFavorite?: boolean;
  onToggleFavorite?: (actorId: string) => void;
  distanceLabel?: string;
}

export function ActorCard({
  actor,
  isFavorite,
  showFavorite,
  onToggleFavorite,
  distanceLabel,
}: ActorCardProps) {
  const categoryColor = categoryConfig[actor.category]?.color ?? "#64748b";
  const locationLabel = formatActorGeoLabel(actor);
  const badgeStyle = {
    backgroundColor: `${categoryColor}1A`,
    borderColor: categoryColor,
    color: categoryColor,
  };

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden pb-4 pt-0 transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted md:aspect-[16/10]">
        <Image
          src={actor.image || "/placeholder.svg"}
          alt={actor.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute left-3 top-3 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm md:left-4 md:top-4">
          <Badge variant="outline" className="border" style={badgeStyle}>
            {actorCopy.categoryLabels[actor.category]}
          </Badge>
        </div>
        {showFavorite && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isFavorite ? "Fjern fra favoritter" : "Legg til i favoritter"}
            className="absolute right-3 top-3 rounded-full bg-white/85 backdrop-blur-sm hover:bg-white md:right-4 md:top-4"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite?.(actor.id);
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
              )}
            />
          </Button>
        )}
      </div>
      <CardHeader className="gap-1.5 px-4 pb-2 pt-3.5">
        <CardTitle className="flex items-start justify-between gap-3 text-base leading-tight sm:text-lg">
          {actor.name}
        </CardTitle>
        <CardDescription className="flex min-w-0 items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{actor.address}</span>
        </CardDescription>
        {(locationLabel || distanceLabel) && (
          <div className="space-y-0.5 text-xs text-muted-foreground">
            {locationLabel ? <p>{locationLabel}</p> : null}
            {distanceLabel ? <p>{distanceLabel}</p> : null}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5 px-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">{actor.description}</p>

        <ActorTrustBadges actor={actor} />

        <div className="flex flex-wrap gap-1.5">
          {actor.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-stretch gap-2 pt-1">
          <Button asChild className="min-w-0 flex-1">
            <Link
              href={`/aktorer/${actor.slug}`}
              onClick={() => recordAction("open_actor", { actorId: actor.id })}
            >
              {actorCopy.readMoreLabel}
            </Link>
          </Button>
          {actor.website && (
            <Button
              variant="outline"
              size="icon"
              asChild
              className="size-11 shrink-0"
            >
              <a
                href={actor.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  recordAction("go_website", { actorId: actor.id })
                }
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
