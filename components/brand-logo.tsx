import Image from "next/image"
import Link from "next/link"
import { site } from "@/content/no"
import { cn } from "@/lib/utils"

type BrandLogoProps = {
  href?: string
  className?: string
  imageClassName?: string
  textClassName?: string
  priority?: boolean
  variant?: "compact" | "full"
}

export function BrandLogo({
  href = "/",
  className,
  imageClassName,
  textClassName,
  priority = false,
  variant = "compact",
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <Link href={href} className={cn("inline-flex items-center gap-3", className)} aria-label={site.name}>
        <Image
          src="/logo/FULLlogologosirkularnorge.PNG"
          alt={site.name}
          width={425}
          height={478}
          priority={priority}
          className={cn("h-12 w-auto object-contain", imageClassName)}
        />
        <span className={cn("text-lg font-bold tracking-tight", textClassName)}>{site.name}</span>
      </Link>
    )
  }

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)} aria-label={site.name}>
      <Image
        src="/logo/FULLlogologosirkularnorge.PNG"
        alt=""
        aria-hidden="true"
        width={425}
        height={478}
        priority={priority}
        className={cn("h-10 w-auto object-contain", imageClassName)}
      />
      <span className={cn("text-lg font-bold tracking-tight", textClassName)}>{site.name}</span>
    </Link>
  )
}
