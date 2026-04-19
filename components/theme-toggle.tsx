"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { ClientReady } from "@/components/client-ready"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { themeCopy } from "@/content/no"
import { HEADER_MENU_LAYER_CLASS } from "@/lib/ui/layers"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <ClientReady
      fallback={
        <Button variant="ghost" size="icon" aria-hidden="true" disabled tabIndex={-1}>
          <Sun className="h-4 w-4" />
        </Button>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={themeCopy.toggleLabel}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={HEADER_MENU_LAYER_CLASS}>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            {themeCopy.light}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            {themeCopy.dark}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            {themeCopy.system}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ClientReady>
  )
}
