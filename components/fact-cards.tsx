"use client"

import { motion } from "framer-motion"
import type { Fact } from "@/lib/data"
import { sectionContent } from "@/content/no"

interface FactCardsProps {
  facts: Fact[]
}

export function FactCards({ facts }: FactCardsProps) {
  return (
    <section className="bg-muted/30 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">{sectionContent.facts.title}</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">{sectionContent.facts.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="mb-4 text-3xl sm:text-4xl">{fact.icon}</div>
              <div className="mb-2 text-2xl font-bold text-primary">{fact.stat}</div>
              <h3 className="mb-2 font-semibold">{fact.title}</h3>
              <p className="text-sm text-muted-foreground">{fact.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
