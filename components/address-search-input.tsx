"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

type AddressOption = {
  address_id: string
  main_text: string
  secondary_text: string
  is_complete: boolean
}

type AddressSearchInputProps = {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  onCoordinates?: (coords: { lat: number; lng: number }) => void
  placeholder?: string
  disabled?: boolean
}

const formatAddress = (option: AddressOption) => {
  const secondary = option.secondary_text?.trim()
  if (!secondary) return option.main_text
  return `${option.main_text}, ${secondary}`
}

export function AddressSearchInput({
  id,
  name,
  value,
  onChange,
  onCoordinates,
  placeholder,
  disabled,
}: AddressSearchInputProps) {
  const [options, setOptions] = useState<AddressOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [shouldSearch, setShouldSearch] = useState(false)

  const query = value.trim()

  useEffect(() => {
    if (disabled || !isFocused || !shouldSearch) return
    if (query.length < 3) {
      setOptions([])
      setOpen(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const handle = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/address-search?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const payload = (await response.json()) as { data?: AddressOption[]; error?: string }
        if (!response.ok) {
          setError(payload?.error ?? "Kunne ikke hente adresser.")
          setOptions([])
        } else {
          setOptions(Array.isArray(payload.data) ? payload.data : [])
        }
        if (isFocused) setOpen(true)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Kunne ikke hente adresser.")
          setOptions([])
          if (isFocused) setOpen(true)
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(handle)
    }
  }, [query, disabled, isFocused, shouldSearch])

  const selectedLabel = useMemo(() => value.trim(), [value])

  const handleFocus = () => {
    if (disabled) return
    setIsFocused(true)
    if (query.length >= 3) {
      setShouldSearch(true)
    }
    if (options.length || loading || error) {
      setOpen(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleSelect = async (option: AddressOption) => {
    const formatted = formatAddress(option)
    onChange(formatted)
    setShouldSearch(false)
    setOptions([])
    setError(null)
    setOpen(false)

    if (onCoordinates) {
      try {
        const response = await fetch(`/api/address-geocode?query=${encodeURIComponent(formatted)}`)
        const payload = (await response.json()) as { lat?: number; lng?: number }
        if (response.ok && typeof payload.lat === "number" && typeof payload.lng === "number") {
          onCoordinates({ lat: payload.lat, lng: payload.lng })
        }
      } catch {
        // Ignore geocode errors; user can still edit coordinates manually.
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div>
          <Input
            id={id}
            name={name}
            value={value}
            onChange={(event) => {
              if (!shouldSearch) setShouldSearch(true)
              onChange(event.target.value)
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[min(520px,90vw)] p-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest("input[name],input[id]")) {
            event.preventDefault()
          }
        }}
      >
        <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
          <span>Søkeresultater</span>
          {loading && <Loader2Icon className="size-4 animate-spin" />}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {error ? (
            <div className="px-2 py-2 text-sm text-destructive">{error}</div>
          ) : options.length ? (
            <ul className="grid gap-1">
              {options.map((option) => {
                const label = formatAddress(option)
                const isSelected = selectedLabel === label
                return (
                  <li key={option.address_id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                        isSelected && "bg-muted",
                      )}
                    >
                      <div className="mt-0.5">
                        {isSelected && <CheckIcon className="size-4 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{option.main_text}</p>
                        {option.secondary_text && (
                          <p className="text-xs text-muted-foreground">{option.secondary_text}</p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            !loading && <div className="px-2 py-2 text-sm text-muted-foreground">Ingen treff.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
