'use client'

import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import type { GroundedClaim } from '@/lib/ai/schemas'

type EvidenceCollapsibleProps = {
  claim: GroundedClaim
}

export function EvidenceCollapsible({ claim }: EvidenceCollapsibleProps) {
  return (
    <div className="py-3 border-b last:border-b-0">
      <p className="text-sm leading-relaxed">{claim.claim}</p>
      <Collapsible>
        <CollapsibleTrigger className="text-muted-foreground text-xs hover:text-foreground flex items-center gap-1 mt-1">
          источник
          <ChevronDown className="h-3 w-3 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <p className="text-sm italic text-muted-foreground">{claim.evidence.text}</p>
          {claim.evidence.speaker && (
            <p className="text-xs text-muted-foreground mt-1">{claim.evidence.speaker}</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
