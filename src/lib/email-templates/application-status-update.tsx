import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const ROOT_DOMAIN = 'aveiq.app'

interface Props {
  candidateName?: string
  roleTitle?: string
  companyName?: string
  status?: 'shortlisted' | 'hired' | 'rejected' | string
}

const subjectFor = (status: string, role?: string) => {
  const r = role ? ` — ${role}` : ''
  if (status === 'hired') return `Congratulations, you've been hired${r}`
  if (status === 'shortlisted') return `You've been shortlisted${r}`
  if (status === 'rejected') return `Application update${r}`
  return `Application update${r}`
}

const headlineFor = (status: string) => {
  if (status === 'hired') return 'You have been hired 🎉'
  if (status === 'shortlisted') return 'You have been shortlisted'
  if (status === 'rejected') return 'Application update'
  return 'Application update'
}

const bodyFor = (status: string, role?: string, company?: string) => {
  const where = company ? ` at ${company}` : ''
  const forRole = role ? ` for the ${role} role` : ''
  if (status === 'hired') {
    return `Great news — the founder${where} has decided to hire you${forRole}. They will reach out shortly with next steps. Welcome aboard!`
  }
  if (status === 'shortlisted') {
    return `You have been shortlisted${forRole}${where}. The founder is reviewing finalists and will be in touch soon.`
  }
  if (status === 'rejected') {
    return `Thank you for applying${forRole}${where}. The founder has decided to move forward with other candidates this time. Your profile remains active for other roles on Aveiq.`
  }
  return `There is an update to your application${forRole}${where}.`
}

const ApplicationStatusUpdateEmail = ({ candidateName, roleTitle, companyName, status }: Props) => {
  const s = status ?? 'shortlisted'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headlineFor(s)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{headlineFor(s)}</Heading>
          <Text style={text}>Hi {candidateName || 'there'},</Text>
          <Text style={text}>{bodyFor(s, roleTitle, companyName)}</Text>
          <Button style={button} href={`https://${ROOT_DOMAIN}/apply`}>
            View your applications
          </Button>
          <Text style={footer}>
            Questions? Reach us at{' '}
            <Link href="mailto:care@aveiq.app" style={link}>care@aveiq.app</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ApplicationStatusUpdateEmail,
  subject: (data: Record<string, any>) => subjectFor(data?.status ?? 'shortlisted', data?.roleTitle),
  displayName: 'Application status update',
  previewData: { candidateName: 'Rahul', roleTitle: 'Software Engineer', companyName: 'Acme', status: 'hired' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const link = { color: '#000000', textDecoration: 'underline' }
const button = { backgroundColor: '#000000', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
