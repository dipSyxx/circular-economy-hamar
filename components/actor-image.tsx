"use client"

import { useState } from "react"
import Image from "next/image"

interface ActorImageProps {
  src: string | null | undefined
  alt: string
}

export function ActorImage({ src, alt }: ActorImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <img
        src="/placeholder.svg"
        alt={alt}
        className="h-full w-full object-contain sm:object-cover"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-contain sm:object-cover"
      onError={() => setHasError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
      priority
    />
  )
}
