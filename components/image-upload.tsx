"use client"

import { useId, useRef, useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ImageUploadFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
  disabled?: boolean
  folder?: string
  className?: string
}

export function ImageUploadField({
  value,
  onChange,
  label,
  id,
  disabled,
  folder = "uploads",
  className,
}: ImageUploadFieldProps) {
  const inputId = id ?? useId()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)

  const isBlobUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.hostname.endsWith(".blob.vercel-storage.com")
    } catch {
      return false
    }
  }

  const deleteBlobUrl = async (url: string) => {
    if (!isBlobUrl(url)) return
    try {
      const response = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Kunne ikke slette bilde.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke slette bilde.")
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Kun bildefiler er tillatt.")
      return
    }

    setUploading(true)
    setError(null)
    const previousUrl = value
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      })

      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Kunne ikke laste opp bilde.")
      }

      setPreviewError(false)
      onChange(data.url)
      if (previousUrl && previousUrl !== data.url) {
        await deleteBlobUrl(previousUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke laste opp bilde.")
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await handleFile(file)
    event.target.value = ""
  }

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewError(false)
    setError(null)
    onChange(event.target.value)
  }

  const clearImage = async () => {
    const previousUrl = value
    setPreviewError(false)
    setError(null)
    onChange("")
    if (previousUrl) {
      await deleteBlobUrl(previousUrl)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className="gap-2"
        >
          <Upload className="size-4" />
          {uploading ? "Laster opp..." : "Last opp bilde"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={clearImage} disabled={disabled}>
            Fjern
          </Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      <Input
        id={inputId}
        type="url"
        value={value}
        onChange={handleUrlChange}
        placeholder="https://"
        disabled={disabled}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && !previewError && (
        <div className="mt-2 inline-flex overflow-hidden rounded-md border bg-muted/20">
          <img
            src={value}
            alt="Forhandsvisning av bilde"
            className="h-auto w-auto max-w-full object-contain"
            onError={() => setPreviewError(true)}
          />
        </div>
      )}
    </div>
  )
}
