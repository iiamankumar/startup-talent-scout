import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry }  from './registry'

const SITE_NAME = 'AVEIQ'
const ROOT_DOMAIN = 'aveiq.app'

interface ApplicationSubmittedProps {
  name?: string
  displayName?: string
}

const ApplicationSubmittedEmail = ({ name, displayName }: ApplicationSubmittedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your application to {SITE_NAME} has been received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application received</Heading>
        <Text style={text}>
          Hi {displayName || name || 'there'},
        </Text>
        <Text style={text}>
          We have received your application to join the {SITE_NAME} network. Here is what happens next:
        </Text>
        <Text style={text}>
          <strong>Step 1 — Resume screening:</strong> Our AI screens your resume for signal and relevance. This usually takes a few minutes.
        </Text>
        <Text style={text}>
          <strong>Step 2 — AI interview:</strong> If your resume scores well, Kai (our AI interviewer) will reach out to schedule a short technical conversation.
        </Text>
        <Text style={text}>
          <strong>Step 3 — Final review:</strong> After the AI interview, a human reviewer evaluates your fit and decides on acceptance.
        </Text>
        <Text style={text}>
          You can track your progress anytime on your{' '}
          <Link href={`https://${ROOT_DOMAIN}/apply`} style={link}>
            application dashboard
          </Link>.
        </Text>
        <Button style={button} href={`https://${ROOT_DOMAIN}/apply`}>
          View Application
        </Button>
        <Text style={footer}>
          If you have questions, reply to this email or reach out at{' '}
          <Link href="mailto:support@aveiq.app" style={link}>
            support@aveiq.app
          </Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ApplicationSubmittedEmail,
  subject: `Your ${SITE_NAME} application has been received`,
  displayName: 'Application submitted',
  previewData: { displayName: 'Rahul', name: 'Rahul' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const link = { color: '#000000', textDecoration: 'underline' }
const button = { backgroundColor: '#000000', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
