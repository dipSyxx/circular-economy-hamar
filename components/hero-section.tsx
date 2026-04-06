"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Sparkles, HelpCircle, Users } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { heroContent } from "@/content/no"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary/5 py-12 sm:py-16 md:py-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#22c55e10_1px,transparent_1px),linear-gradient(to_bottom,#22c55e10_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-primary sm:mb-6 sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {heroContent.badge}
          </div>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl md:mb-6 md:text-6xl">
            {heroContent.title.lead} <span className="text-primary">{heroContent.title.highlight}</span>
          </h1>

          <p className="mx-auto mb-7 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg md:mb-8 md:text-xl">
            {heroContent.description}
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="gap-2 sm:min-w-[220px]">
              <Link href={heroContent.primaryCta.href}>
                {heroContent.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent sm:min-w-[220px]">
              <Link href={heroContent.secondaryCta.href}>
                {heroContent.secondaryCta.label}
                <Users className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 grid max-w-4xl gap-3 sm:mt-12 md:mt-16 md:grid-cols-3 md:gap-4"
        >
          <Link href={heroContent.quickLinks[0].href} className="group">
            <div className="flex items-center gap-4 rounded-2xl border bg-card/90 p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-12 md:w-12">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{heroContent.quickLinks[0].title}</h3>
                <p className="text-sm text-muted-foreground">{heroContent.quickLinks[0].description}</p>
              </div>
            </div>
          </Link>

          <Link href={heroContent.quickLinks[1].href} className="group">
            <div className="flex items-center gap-4 rounded-2xl border bg-card/90 p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground md:h-12 md:w-12">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{heroContent.quickLinks[1].title}</h3>
                <p className="text-sm text-muted-foreground">{heroContent.quickLinks[1].description}</p>
              </div>
            </div>
          </Link>

          <Link href={heroContent.quickLinks[2].href} className="group">
            <div className="flex items-center gap-4 rounded-2xl border bg-card/90 p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-12 md:w-12">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{heroContent.quickLinks[2].title}</h3>
                <p className="text-sm text-muted-foreground">{heroContent.quickLinks[2].description}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
