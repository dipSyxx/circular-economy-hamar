'use client'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useRef, useState } from 'react'

export type SearchableSelectOption = {
  value: string
  label: string
  keywords?: string
}

type SearchableSelectProps = {
  value?: string
  options: SearchableSelectOption[]
  placeholder?: string
  disabled?: boolean
  emptyLabel?: string
  container?: HTMLElement | null
  onChange: (value: string) => void
}

export function SearchableSelect({
  value,
  options,
  placeholder,
  disabled,
  emptyLabel = 'Ingen treff.',
  container,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = options.find((option) => option.value === value)
  const displayLabel = selected?.label ?? ''
  const portalContainer =
    container ??
    triggerRef.current?.closest<HTMLElement>(
      '[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]',
    ) ??
    null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className='w-full justify-between'
        >
          <span className={cn('truncate text-left', !displayLabel && 'text-muted-foreground')}>
            {displayLabel || placeholder || 'Velg'}
          </span>
          <ChevronsUpDownIcon className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start' container={portalContainer}>
        <Command>
          <CommandInput placeholder='Søk...' />
          <CommandList className='max-h-64 overflow-y-auto overscroll-contain touch-pan-y'>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const searchValue = `${option.label} ${option.keywords ?? option.value}`.trim()
                const isSelected = option.value === value
                return (
                  <CommandItem
                    key={option.value}
                    value={searchValue}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <CheckIcon className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    <span className='truncate'>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
