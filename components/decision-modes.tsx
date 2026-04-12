"use client"

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
  return (
    <Tabs defaultValue="manual" className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1 sm:w-auto">
        <TabsTrigger value="manual" className="px-4 py-2">
          {decideCopy.modeTabs.manual}
        </TabsTrigger>
        <TabsTrigger value="ai" className="px-4 py-2">
          {decideCopy.modeTabs.ai}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <DecisionWizard
          actors={actors}
          co2eSources={co2eSources}
          co2eSourceItems={co2eSourceItems}
          showIntro={false}
        />
      </TabsContent>

      <TabsContent value="ai">
        <AIDecisionAssistant actors={actors} co2eSources={co2eSources} co2eSourceItems={co2eSourceItems} />
      </TabsContent>
    </Tabs>
  )
}
