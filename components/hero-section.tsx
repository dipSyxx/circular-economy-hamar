"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Calculator, HelpCircle } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

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
            Lokale sirkulære tilbud i Hamar
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
            Kjøp brukt. Reparer. <span className="text-primary">Spar penger og miljøet.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Finn de beste bruktbutikkene, reparatørene og gjenvinningsstedene i Hamar. Vi gjør det enkelt å ta sirkulære
            valg.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/aktorer">
                Utforsk aktører
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
              <Link href="/quiz">
                Ta quizen
                <HelpCircle className="h-4 w-4" />
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
          <Link href="/kart" className="group">
            <div className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">Finn på kartet</h3>
                <p className="text-sm text-muted-foreground">Se alle steder nær deg</p>
              </div>
            </div>
          </Link>

          <Link href="/kalkulator" className="group">
            <div className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">Beregn besparelse</h3>
                <p className="text-sm text-muted-foreground">Reparer vs kjøp nytt</p>
              </div>
            </div>
          </Link>

          <Link href="/quiz" className="group">
            <div className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">Test deg selv</h3>
                <p className="text-sm text-muted-foreground">Hvor sirkulær er du?</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
