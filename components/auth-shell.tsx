"use client"

import type { MotionProps, Transition } from "framer-motion"
import { motion, useReducedMotion } from "framer-motion"
import { AuthView } from "@neondatabase/auth/react"
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
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.22),transparent_48%),radial-gradient(circle_at_60%_90%,rgba(34,197,94,0.12),transparent_55%)]" />
        <div className="absolute inset-0 opacity-35 bg-[linear-gradient(transparent_0,transparent_96%,rgba(15,23,42,0.08)_100%)]" />
        <motion.div
          className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          animate={floatAnimation}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 18, ease: "easeInOut", repeat: Infinity }
          }
        />
        <motion.div
          className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-accent/25 blur-3xl"
          animate={floatAnimationAlt}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 20, ease: "easeInOut", repeat: Infinity, delay: 4 }
          }
        />
      </div>
      <div className="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col gap-10 px-4 py-10 md:py-16 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-16 lg:px-10">
        <section className="order-2 space-y-8 lg:order-1">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground shadow-sm backdrop-blur"
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
                reduceMotion ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              }
            />
            Sikker innlogging
          </motion.div>
          <div className="space-y-4">
            <motion.h1
              className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
              {...fadeUp(0.1)}
            >
              Logg inn for å holde oversikt over sirkulære valg.
            </motion.h1>
            <motion.p className="max-w-xl text-lg text-muted-foreground" {...fadeUp(0.18)}>
              Få personlig profil, statistikk og anbefalinger.
            </motion.p>
          </div>
        </section>
        <section className="order-1 flex w-full justify-center lg:order-2 lg:justify-end">
          <div className="relative w-full max-w-md">
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
              <AuthView
                path={path}
                localization={localization}
                className="w-full max-w-md"
                classNames={{
                  base: "border-white/50 bg-card/85 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.5)] backdrop-blur dark:border-white/10",
                  header: "space-y-2 border-b/60 pb-5",
                  title: "text-2xl font-semibold tracking-tight",
                  description: "text-sm text-muted-foreground",
                  content: "gap-5",
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
