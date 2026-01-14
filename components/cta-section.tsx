"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ctaContent } from "@/content/no"

export function CTASection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 md:p-12 bg-primary text-primary-foreground">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{ctaContent.title}</h2>
                <p className="text-primary-foreground/80 max-w-xl mx-auto">
                  {ctaContent.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mb-8">
                {ctaContent.actions.map((action, index) => (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-primary-foreground/10"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{action}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href={ctaContent.primaryCta.href}>{ctaContent.primaryCta.label}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
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
