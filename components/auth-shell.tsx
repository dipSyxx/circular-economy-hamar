"use client"

import type { MotionProps, Transition } from "framer-motion"
import { motion, useReducedMotion } from "framer-motion"
import { AuthViewShell } from "@/components/auth-view-shell"
import { Navigation } from "@/components/navigation"

type AuthShellProps = {
  path: string
  localization: Record<string, string>
}

export function AuthShell({ path, localization }: AuthShellProps) {
  const reduceMotion = useReducedMotion()
  const fadeUp = (delay = 0): MotionProps => {
    const transition: Transition = reduceMotion
      ? { duration: 0 }
      : { duration: 0.7, ease: "easeOut", delay }

    return {
      initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition,
    }
  }

  const floatAnimation = reduceMotion ? { y: 0 } : { y: [0, -12, 0] }
  const floatAnimationAlt = reduceMotion ? { y: 0 } : { y: [0, 14, 0] }

  return (
    <>
      <Navigation />
      <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.18),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.16),transparent_46%),radial-gradient(circle_at_60%_90%,rgba(34,197,94,0.1),transparent_55%)] sm:bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.22),transparent_48%),radial-gradient(circle_at_60%_90%,rgba(34,197,94,0.12),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_96%,rgba(15,23,42,0.05)_100%)] opacity-20 sm:opacity-35" />
          <motion.div
            className="absolute -top-24 left-1/3 h-60 w-60 rounded-full bg-primary/20 blur-3xl sm:h-72 sm:w-72 sm:bg-primary/25"
            animate={floatAnimation}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 18, ease: "easeInOut", repeat: Infinity }
            }
          />
          <motion.div
            className="absolute bottom-[-120px] right-[-80px] h-64 w-64 rounded-full bg-accent/20 blur-3xl sm:h-80 sm:w-80 sm:bg-accent/25"
            animate={floatAnimationAlt}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 20, ease: "easeInOut", repeat: Infinity, delay: 4 }
            }
          />
        </div>

        <div className="container relative mx-auto flex min-h-[calc(100dvh-4rem)] flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-8 md:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-16 lg:px-10 lg:py-16">
          <section className="order-2 space-y-6 lg:order-1 lg:space-y-8">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-[0.65rem] sm:tracking-[0.32em]"
              {...fadeUp(0)}
            >
              <motion.span
                className="h-2 w-2 rounded-full bg-primary"
                animate={
                  reduceMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                }
              />
              Sikker innlogging
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              <motion.h1
                className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
                {...fadeUp(0.1)}
              >
                Logg inn for å holde oversikt over sirkulære valg.
              </motion.h1>
              <motion.p className="max-w-xl text-base text-muted-foreground sm:text-lg" {...fadeUp(0.18)}>
                Få personlig profil, statistikk og anbefalinger.
              </motion.p>
            </div>
          </section>

          <section className="order-1 flex w-full justify-center lg:order-2 lg:justify-end">
            <div className="relative w-full max-w-[min(100%,28rem)] sm:max-w-md">
              <motion.div
                className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.35),transparent_55%)] opacity-60 blur-2xl"
                {...fadeUp(0.12)}
              />
              <motion.div
                initial={
                  reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 22, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut", delay: 0.18 }}
              >
                <AuthViewShell
                  path={path}
                  localization={localization}
                  className="w-full max-w-md"
                  classNames={{
                    base: "rounded-[1.5rem] border-white/50 bg-card/85 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 sm:rounded-[1.75rem]",
                    header: "space-y-2 border-b/60 pb-4 sm:pb-5",
                    title: "text-xl font-semibold tracking-tight sm:text-2xl",
                    description: "text-sm text-muted-foreground",
                    content: "gap-4 sm:gap-5",
                    continueWith: "text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground",
                    separator: "bg-border/60",
                  }}
                />
              </motion.div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
