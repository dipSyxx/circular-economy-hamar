"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion, type Variants } from "framer-motion"
import { norwayCounties } from "@/lib/geo"

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export function FylkerSection() {
  return (
    <section className="bg-gradient-to-b from-background via-muted/20 to-muted/40 py-14 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center md:mb-12"
        >
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">
            Utforsk Norge
          </span>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">Se bruktbutikker etter fylke</h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            Velg ditt fylke og finn sirkulære tilbud i ditt nærmiljø.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
        >
          {norwayCounties.map((county) => (
            <motion.div
              key={county.slug}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <Link
                href={`/${county.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 p-3 sm:h-32 md:h-36 md:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/counties/${county.slug}.svg`}
                    alt={`Kart over ${county.name}`}
                    className="h-full w-full object-contain drop-shadow-sm group-hover:drop-shadow-md group-hover:scale-110 transition-all duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="border-t border-border/60 bg-card px-3 py-3 transition-colors duration-200 group-hover:bg-primary/5">
                  <span className="block text-center text-xs font-semibold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:text-sm">
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
          className="mt-8 text-center md:mt-10"
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
