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
import Link from "next/link";
import type { Actor } from "@/lib/data";
import { actorCopy } from "@/content/no";
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
  const badgeStyle = {
    backgroundColor: `${categoryColor}1A`,
    borderColor: categoryColor,
    color: categoryColor,
  };

  return (
    <Card className="overflow-hidden pt-0 hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={actor.image || "/placeholder.svg"}
          alt={actor.name}
          className="object-cover w-full h-full"
        />
        <div className="absolute h-[21px] top-4 left-4 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full">
          <Badge variant="outline" className="border" style={badgeStyle}>
            {actorCopy.categoryLabels[actor.category]}
          </Badge>
        </div>
        {showFavorite && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-3 top-3 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {actor.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {actor.address}
        </CardDescription>
        {distanceLabel && (
          <p className="text-xs text-muted-foreground mt-1">{distanceLabel}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{actor.description}</p>

        <div className="flex flex-wrap gap-2">
          {actor.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link
              href={`/aktorer/${actor.slug}`}
              onClick={() => recordAction("open_actor", { actorId: actor.id })}
            >
              {actorCopy.readMoreLabel}
            </Link>
          </Button>
          {actor.website && (
            <Button variant="outline" size="icon" asChild>
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
