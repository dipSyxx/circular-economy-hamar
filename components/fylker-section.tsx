"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { norwayCounties } from "@/lib/geo"

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export function FylkerSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-muted/40">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3 px-3 py-1 rounded-full bg-primary/10">
            Utforsk Norge
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Se bruktbutikker etter fylke</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Velg ditt fylke og finn sirkulære tilbud i ditt nærmiljø.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
        >
          {norwayCounties.map((county) => (
            <motion.div
              key={county.slug}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <Link
                href={`/${county.slug}`}
                className="group flex flex-col rounded-2xl bg-card border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full"
              >
                <div className="relative w-full h-36 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50 p-4 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/counties/${county.slug}.svg`}
                    alt={`Kart over ${county.name}`}
                    className="h-full w-full object-contain drop-shadow-sm group-hover:drop-shadow-md group-hover:scale-110 transition-all duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="px-3 py-2.5 border-t border-border/60 bg-card group-hover:bg-primary/5 transition-colors duration-200">
                  <span className="block text-xs font-semibold text-center leading-tight text-foreground group-hover:text-primary transition-colors duration-200">
                    {county.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/fylker"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Se alle fylker med detaljer
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
