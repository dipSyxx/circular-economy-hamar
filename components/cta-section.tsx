"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ctaContent } from "@/content/no"

export function CTASection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-primary p-5 text-primary-foreground sm:p-8 md:p-12">
              <div className="mb-8 text-center">
                <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:mb-4 md:text-4xl">{ctaContent.title}</h2>
                <p className="mx-auto max-w-xl text-sm text-primary-foreground/80 sm:text-base">
                  {ctaContent.description}
                </p>
              </div>

              <div className="mb-8 grid gap-3 md:grid-cols-2 md:gap-4">
                {ctaContent.actions.map((action, index) => (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{action}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                <Button asChild size="lg" variant="secondary" className="sm:min-w-[220px]">
                  <Link href={ctaContent.primaryCta.href}>{ctaContent.primaryCta.label}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:min-w-[220px]"
                >
                  <Link href={ctaContent.secondaryCta.href}>{ctaContent.secondaryCta.label}</Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
