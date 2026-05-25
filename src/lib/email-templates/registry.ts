import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as applicationSubmitted } from './application-submitted'
import { template as hireRequestSubmitted } from './hire-request-submitted'
import { template as welcome } from './welcome'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'application-submitted': applicationSubmitted,
  'hire-request-submitted': hireRequestSubmitted,
  'welcome': welcome,
}
