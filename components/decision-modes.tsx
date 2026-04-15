"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { AIDecisionAssistant } from "@/components/ai-decision-assistant"
import { DecisionWizard } from "@/components/decision-wizard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { decideCopy } from "@/content/no"
import type { Actor, Co2eSource, Co2eSourceItem } from "@/lib/data"

interface DecisionModesProps {
  actors: Actor[]
  co2eSources: Co2eSource[]
  co2eSourceItems: Co2eSourceItem[]
}

export function DecisionModes({
  actors,
  co2eSources,
  co2eSourceItems,
}: DecisionModesProps) {
  const [activeMode, setActiveMode] = useState("manual")
  const [aiGeoPromptOpen, setAIGeoPromptOpen] = useState(false)
  const [aiGeoPromptHandled, setAIGeoPromptHandled] = useState(false)

  const handleModeChange = (nextMode: string) => {
    setActiveMode(nextMode)

    if (nextMode === "ai" && !aiGeoPromptHandled) {
      setAIGeoPromptOpen(true)
      return
    }

    if (nextMode !== "ai") {
      setAIGeoPromptOpen(false)
    }
  }

  const handleAIGeoPromptComplete = () => {
    setAIGeoPromptHandled(true)
    setAIGeoPromptOpen(false)
  }

  return (
    <Tabs value={activeMode} onValueChange={handleModeChange} className="space-y-8">
      <div className="flex justify-start">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-full border border-border/60 bg-background/80 p-1 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)] backdrop-blur sm:w-auto">
          <TabsTrigger
            value="manual"
            className="rounded-full px-4 py-2.5 text-muted-foreground hover:border-border/60 hover:bg-background/90 hover:text-foreground hover:shadow-[0_10px_25px_-20px_rgba(15,23,42,0.22)] data-[state=active]:border-transparent data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.58)] dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-950"
          >
            {decideCopy.modeTabs.manual}
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-full px-4 py-2.5 text-muted-foreground hover:border-primary/15 hover:bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(250,204,21,0.14))] hover:text-foreground hover:shadow-[0_12px_28px_-20px_rgba(34,197,94,0.35)] data-[state=active]:border-transparent data-[state=active]:bg-[linear-gradient(135deg,rgba(34,197,94,0.95),rgba(250,204,21,0.88))] data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_12px_30px_-18px_rgba(34,197,94,0.8)] dark:data-[state=active]:text-slate-950"
          >
            <Sparkles className="h-4 w-4" />
            {decideCopy.modeTabs.ai}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="manual">
        <DecisionWizard
          actors={actors}
          co2eSources={co2eSources}
          co2eSourceItems={co2eSourceItems}
          showIntro={false}
        />
      </TabsContent>

      <TabsContent value="ai">
        <AIDecisionAssistant
          actors={actors}
          co2eSources={co2eSources}
          co2eSourceItems={co2eSourceItems}
          geoPromptOpen={aiGeoPromptOpen}
          onGeoPromptComplete={handleAIGeoPromptComplete}
        />
      </TabsContent>
    </Tabs>
  )
}
