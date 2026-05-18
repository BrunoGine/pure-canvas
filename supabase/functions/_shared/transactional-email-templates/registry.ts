/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as supportReply } from './support-reply.tsx'
import { template as supportResolved } from './support-resolved.tsx'
import { template as ticketCreated } from './ticket-created.tsx'
import { template as subscriptionConfirmed } from './subscription-confirmed.tsx'
import { template as paymentFailed } from './payment-failed.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'ticket-reply': supportReply,
  'ticket-resolved': supportResolved,
  'ticket-created': ticketCreated,
  'subscription-confirmed': subscriptionConfirmed,
  'payment-failed': paymentFailed,
}
