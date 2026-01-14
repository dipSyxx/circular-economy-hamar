import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Actor } from "@/lib/data"

interface ActorCardProps {
  actor: Actor
}

export function ActorCard({ actor }: ActorCardProps) {
  const categoryColors = {
    brukt: "bg-primary/10 text-primary",
    reparasjon: "bg-accent/20 text-accent-foreground",
    gjenvinning: "bg-chart-2/20 text-chart-2",
  }

  const categoryLabels = {
    brukt: "Brukt",
    reparasjon: "Reparasjon",
    gjenvinning: "Gjenvinning",
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img src={actor.image || "/placeholder.svg"} alt={actor.name} className="object-cover w-full h-full" />
        <div className="absolute top-4 left-4">
          <Badge className={categoryColors[actor.category]}>{categoryLabels[actor.category]}</Badge>
        </div>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">{actor.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {actor.address}
        </CardDescription>
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
            <Link href={`/aktorer/${actor.slug}`}>Les mer</Link>
          </Button>
          {actor.website && (
            <Button variant="outline" size="icon" asChild>
              <a href={actor.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
