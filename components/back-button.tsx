"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  fallbackHref: string
  label?: string
  className?: string
}

export function BackButton({ fallbackHref, label = "Tilbake", className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer.includes(window.location.origin)
    ) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant="ghost" onClick={handleClick} className={cn("gap-2", className)}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
