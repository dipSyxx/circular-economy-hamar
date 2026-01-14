"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Sparkles, HelpCircle, Users } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { heroContent } from "@/content/no"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary/5 py-20 md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#22c55e10_1px,transparent_1px),linear-gradient(to_bottom,#22c55e10_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {heroContent.badge}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
            {heroContent.title.lead} <span className="text-primary">{heroContent.title.highlight}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            {heroContent.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href={heroContent.primaryCta.href}>
                {heroContent.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
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
          className="mt-16 grid gap-4 md:grid-cols-3 max-w-4xl mx-auto"
        >
          <Link href={heroContent.quickLinks[0].href} className="group">
            <div className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{heroContent.quickLinks[0].title}</h3>
                <p className="text-sm text-muted-foreground">{heroContent.quickLinks[0].description}</p>
              </div>
            </div>
          </Link>

          <Link href={heroContent.quickLinks[1].href} className="group">
            <div className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{heroContent.quickLinks[1].title}</h3>
                <p className="text-sm text-muted-foreground">{heroContent.quickLinks[1].description}</p>
              </div>
            </div>
          </Link>

          <Link href={heroContent.quickLinks[2].href} className="group">
            <div className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
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
