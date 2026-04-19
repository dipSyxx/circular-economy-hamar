'use client'

import * as React from 'react'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { FLOATING_LAYER_CLASS } from '@/lib/ui/layers'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type SelectValueType = string | undefined
type SelectOpenStrategy = 'selected' | 'first' | 'last'

type SelectItemMetadata = {
  value: string
  label: string
  disabled: boolean
}

type SelectContextValue = {
  contentId: string
  disabled: boolean
  focusStrategyRef: React.MutableRefObject<SelectOpenStrategy>
  itemRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>
  items: SelectItemMetadata[]
  open: boolean
  required: boolean
  setItems: React.Dispatch<React.SetStateAction<SelectItemMetadata[]>>
  setOpen: (open: boolean) => void
  setValue: (value: string) => void
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
  value: SelectValueType
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(slot: string) {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error(`${slot} must be used within <Select>.`)
  }

  return context
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('').trim()
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return getNodeText(element.props.children)
  }

  return ''
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ;(ref as React.MutableRefObject<T>).current = value
  }
}

function collectSelectItems(children: React.ReactNode, items: SelectItemMetadata[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return
    }

    const element = child as React.ReactElement<{
      children?: React.ReactNode
      disabled?: boolean
      value?: string
    }>

    if (element.type === SelectItem) {
      items.push({
        disabled: Boolean(element.props.disabled),
        label: getNodeText(element.props.children),
        value: element.props.value ?? '',
      })
      return
    }

    if (element.props.children) {
      collectSelectItems(element.props.children, items)
    }
  })

  return items
}

function getNextEnabledValue(
  items: SelectItemMetadata[],
  currentValue: string | null,
  direction: 'next' | 'previous',
) {
  const enabledItems = items.filter((item) => !item.disabled)

  if (enabledItems.length === 0) {
    return null
  }

  if (!currentValue) {
    return direction === 'next'
      ? enabledItems[0]?.value ?? null
      : enabledItems.at(-1)?.value ?? null
  }

  const currentIndex = enabledItems.findIndex((item) => item.value === currentValue)

  if (currentIndex === -1) {
    return direction === 'next'
      ? enabledItems[0]?.value ?? null
      : enabledItems.at(-1)?.value ?? null
  }

  const nextIndex =
    direction === 'next'
      ? (currentIndex + 1) % enabledItems.length
      : (currentIndex - 1 + enabledItems.length) % enabledItems.length

  return enabledItems[nextIndex]?.value ?? null
}

type SelectProps = {
  children?: React.ReactNode
  defaultOpen?: boolean
  defaultValue?: string
  disabled?: boolean
  form?: string
  name?: string
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string) => void
  open?: boolean
  required?: boolean
  value?: string
}

function Select({
  children,
  defaultOpen = false,
  defaultValue,
  disabled = false,
  form,
  name,
  onOpenChange,
  onValueChange,
  open: openProp,
  required = false,
  value: valueProp,
}: SelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [uncontrolledValue, setUncontrolledValue] = React.useState<SelectValueType>(defaultValue)
  const [items, setItems] = React.useState<SelectItemMetadata[]>([])

  const contentId = React.useId()
  const focusStrategyRef = React.useRef<SelectOpenStrategy>('selected')
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const open = openProp ?? uncontrolledOpen
  const value = valueProp ?? uncontrolledValue

  const setOpen = (nextOpen: boolean) => {
    if (disabled && nextOpen) {
      return
    }

    if (openProp === undefined) {
      setUncontrolledOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const setValue = (nextValue: string) => {
    if (valueProp === undefined) {
      setUncontrolledValue(nextValue)
    }

    onValueChange?.(nextValue)
  }

  return (
    <SelectContext.Provider
      value={{
        contentId,
        disabled,
        focusStrategyRef,
        itemRefs,
        items,
        open,
        required,
        setItems,
        setOpen,
        setValue,
        triggerRef,
        value,
      }}
    >
      <Popover data-slot='select' open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
      {name || form ? (
        <select
          aria-hidden='true'
          form={form}
          hidden
          name={name}
          onChange={(event) => setValue(event.target.value)}
          required={required}
          tabIndex={-1}
          value={value ?? ''}
        >
          {!value ? <option value='' /> : null}
          {items.map((item) => (
            <option key={item.value} disabled={item.disabled} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      ) : null}
    </SelectContext.Provider>
  )
}

type SelectTriggerProps = React.ComponentProps<'button'> & {
  size?: 'sm' | 'default'
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, disabled, onKeyDown, size = 'default', ...props }, forwardedRef) => {
    const context = useSelectContext('SelectTrigger')
    const isDisabled = context.disabled || Boolean(disabled)
    const hasPlaceholder = !context.value

    return (
      <PopoverTrigger asChild>
        <button
          aria-autocomplete='none'
          aria-controls={context.contentId}
          aria-expanded={context.open}
          aria-required={context.required}
          data-placeholder={hasPlaceholder ? '' : undefined}
          data-size={size}
          data-slot='select-trigger'
          data-state={context.open ? 'open' : 'closed'}
          disabled={isDisabled}
          type='button'
          {...props}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
          )}
          onKeyDown={(event) => {
            onKeyDown?.(event)

            if (event.defaultPrevented || isDisabled) {
              return
            }

            if (event.key === 'ArrowUp') {
              context.focusStrategyRef.current = 'last'
              context.setOpen(true)
              event.preventDefault()
              return
            }

            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
              context.focusStrategyRef.current = 'selected'
              context.setOpen(true)
              event.preventDefault()
            }
          }}
          ref={(node) => {
            context.triggerRef.current = node
            assignRef(forwardedRef, node)
          }}
          role='combobox'
        >
          {children}
          <ChevronDownIcon className='size-4 opacity-50' />
        </button>
      </PopoverTrigger>
    )
  },
)

SelectTrigger.displayName = 'SelectTrigger'

type SelectValueProps = React.ComponentProps<'span'> & {
  placeholder?: React.ReactNode
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ children, placeholder = '', ...props }, forwardedRef) => {
    const context = useSelectContext('SelectValue')
    const selectedItem = context.items.find((item) => item.value === context.value)
    const content = children ?? selectedItem?.label ?? placeholder

    return (
      <span data-slot='select-value' {...props} ref={forwardedRef}>
        {content}
      </span>
    )
  },
)

SelectValue.displayName = 'SelectValue'

type SelectContentProps = Omit<React.ComponentProps<typeof PopoverContent>, 'children'> & {
  children?: React.ReactNode
  position?: 'item-aligned' | 'popper'
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  (
    {
      align = 'start',
      children,
      className,
      container,
      onKeyDown,
      onOpenAutoFocus,
      position = 'popper',
      sideOffset = 4,
      ...props
    },
    forwardedRef,
  ) => {
    const context = useSelectContext('SelectContent')
    const items = React.useMemo(() => collectSelectItems(children), [children])
    const enabledItems = items.filter((item) => !item.disabled)
    const portalContainer =
      container ??
      context.triggerRef.current?.closest<HTMLElement>(
        '[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]',
      ) ??
      null

    React.useEffect(() => {
      context.setItems(items)
    }, [context.setItems, items])

    React.useEffect(() => {
      if (!context.open || enabledItems.length === 0) {
        return
      }

      const frame = window.requestAnimationFrame(() => {
        let targetValue: string | null = null

        if (context.focusStrategyRef.current === 'first') {
          targetValue = enabledItems[0]?.value ?? null
        } else if (context.focusStrategyRef.current === 'last') {
          targetValue = enabledItems.at(-1)?.value ?? null
        } else {
          targetValue =
            enabledItems.find((item) => item.value === context.value)?.value ??
            enabledItems[0]?.value ??
            null
        }

        if (targetValue) {
          context.itemRefs.current.get(targetValue)?.focus()
        }

        context.focusStrategyRef.current = 'selected'
      })

      return () => {
        window.cancelAnimationFrame(frame)
      }
    }, [context.focusStrategyRef, context.itemRefs, context.open, context.value, enabledItems])

    return (
      <PopoverContent
        align={align}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
          FLOATING_LAYER_CLASS,
          position === 'popper' &&
            'w-[var(--radix-popover-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        container={portalContainer}
        data-slot='select-content'
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)

          if (!event.defaultPrevented) {
            event.preventDefault()
          }
        }}
        sideOffset={sideOffset}
        {...props}
        ref={forwardedRef}
      >
        <div
          id={context.contentId}
          onKeyDown={(event) => {
            onKeyDown?.(event)

            if (event.defaultPrevented) {
              return
            }

            if (event.key === 'Escape') {
              context.setOpen(false)
              context.triggerRef.current?.focus()
              event.preventDefault()
              return
            }

            if (event.key === 'Tab') {
              context.setOpen(false)
              return
            }

            const activeElement = document.activeElement as HTMLElement | null
            const currentValue = activeElement?.getAttribute('data-value') ?? null

            if (event.key === 'ArrowDown') {
              const nextValue = getNextEnabledValue(items, currentValue, 'next')

              if (nextValue) {
                context.itemRefs.current.get(nextValue)?.focus()
                event.preventDefault()
              }

              return
            }

            if (event.key === 'ArrowUp') {
              const previousValue = getNextEnabledValue(items, currentValue, 'previous')

              if (previousValue) {
                context.itemRefs.current.get(previousValue)?.focus()
                event.preventDefault()
              }

              return
            }

            if (event.key === 'Home') {
              const firstValue = enabledItems[0]?.value

              if (firstValue) {
                context.itemRefs.current.get(firstValue)?.focus()
                event.preventDefault()
              }

              return
            }

            if (event.key === 'End') {
              const lastValue = enabledItems.at(-1)?.value

              if (lastValue) {
                context.itemRefs.current.get(lastValue)?.focus()
                event.preventDefault()
              }
            }
          }}
          role='listbox'
        >
          {children}
        </div>
      </PopoverContent>
    )
  },
)

SelectContent.displayName = 'SelectContent'

const SelectGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ ...props }, forwardedRef) => {
    return <div data-slot='select-group' {...props} ref={forwardedRef} />
  },
)

SelectGroup.displayName = 'SelectGroup'

const SelectLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, forwardedRef) => {
    return (
      <div
        data-slot='select-label'
        className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
        {...props}
        ref={forwardedRef}
      />
    )
  },
)

SelectLabel.displayName = 'SelectLabel'

type SelectItemProps = Omit<React.ComponentProps<'button'>, 'value'> & {
  value: string
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ children, className, disabled = false, onClick, onMouseMove, value, ...props }, forwardedRef) => {
    const context = useSelectContext('SelectItem')
    const isSelected = context.value === value

    return (
      <button
        aria-selected={isSelected}
        data-disabled={disabled ? '' : undefined}
        data-slot='select-item'
        data-state={isSelected ? 'checked' : 'unchecked'}
        data-value={value}
        disabled={disabled}
        role='option'
        type='button'
        {...props}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
          className,
        )}
        onClick={(event) => {
          onClick?.(event)

          if (event.defaultPrevented || disabled) {
            return
          }

          context.setValue(value)
          context.setOpen(false)
        }}
        onMouseMove={(event) => {
          onMouseMove?.(event)

          if (!event.defaultPrevented && !disabled) {
            event.currentTarget.focus({ preventScroll: true })
          }
        }}
        ref={(node) => {
          if (node) {
            context.itemRefs.current.set(value, node)
          } else {
            context.itemRefs.current.delete(value)
          }

          assignRef(forwardedRef, node)
        }}
      >
        <span className='absolute right-2 flex size-3.5 items-center justify-center'>
          {isSelected ? <CheckIcon className='size-4' /> : null}
        </span>
        <span>{children}</span>
      </button>
    )
  },
)

SelectItem.displayName = 'SelectItem'

const SelectSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, forwardedRef) => {
    return (
      <div
        aria-hidden='true'
        data-slot='select-separator'
        className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
        {...props}
        ref={forwardedRef}
      />
    )
  },
)

SelectSeparator.displayName = 'SelectSeparator'

const SelectScrollUpButton = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, forwardedRef) => {
    return (
      <div
        aria-hidden='true'
        data-slot='select-scroll-up-button'
        className={cn('hidden items-center justify-center py-1', className)}
        {...props}
        ref={forwardedRef}
      >
        <ChevronUpIcon className='size-4' />
      </div>
    )
  },
)

SelectScrollUpButton.displayName = 'SelectScrollUpButton'

const SelectScrollDownButton = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, forwardedRef) => {
    return (
      <div
        aria-hidden='true'
        data-slot='select-scroll-down-button'
        className={cn('hidden items-center justify-center py-1', className)}
        {...props}
        ref={forwardedRef}
      >
        <ChevronDownIcon className='size-4' />
      </div>
    )
  },
)

SelectScrollDownButton.displayName = 'SelectScrollDownButton'

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
