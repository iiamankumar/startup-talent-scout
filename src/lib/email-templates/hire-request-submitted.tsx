import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'AVEIQ'
const ROOT_DOMAIN = 'aveiq.app'

interface HireRequestSubmittedProps {
  companyName?: string
  roleTitle?: string
}

const HireRequestSubmittedEmail = ({ companyName, roleTitle }: HireRequestSubmittedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your hiring request has been received — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hiring request received</Heading>
        <Text style={text}>
          Hi,
        </Text>
        <Text style={text}>
          We have received your hiring request for <strong>{roleTitle || 'a new role'}</strong>{companyName ? ` at ${companyName}` : ''}.
        </Text>
        <Text style={text}>
          Our team will hand-pick 3–5 vetted AI engineers from the network and send you a shortlist within <strong>72 hours</strong>.
        </Text>
        <Text style={text}>
          In the meantime, you can track the status of your request and manage interviews from your{' '}
          <Link href={`https://${ROOT_DOMAIN}/dashboard`} style={link}>
            hiring dashboard
          </Link>.
        </Text>
        <Button style={button} href={`https://${ROOT_DOMAIN}/dashboard`}>
          Go to Dashboard
        </Button>
        <Text style={footer}>
          Questions? Reach out at{' '}
          <Link href="mailto:support@aveiq.app" style={link}>
            support@aveiq.app
          </Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: HireRequestSubmittedEmail,
  subject: `Your ${SITE_NAME} hiring request has been received`,
  displayName: 'Hire request submitted',
  previewData: { companyName: 'Acme Inc', roleTitle: 'Senior AI Engineer' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const link = { color: '#000000', textDecoration: 'underline' }
const button = { backgroundColor: '#000000', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
