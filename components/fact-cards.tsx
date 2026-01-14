"use client"

import { motion } from "framer-motion"
import { facts } from "@/lib/data"
import { sectionContent } from "@/content/no"

export function FactCards() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{sectionContent.facts.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{sectionContent.facts.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border shadow-sm"
            >
              <div className="text-4xl mb-4">{fact.icon}</div>
              <div className="text-2xl font-bold text-primary mb-2">{fact.stat}</div>
              <h3 className="font-semibold mb-2">{fact.title}</h3>
              <p className="text-sm text-muted-foreground">{fact.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
