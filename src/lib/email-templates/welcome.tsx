import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'AVEIQ'
const ROOT_DOMAIN = 'aveiq.app'

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — India's top AI engineer network</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {SITE_NAME}</Heading>
        <Text style={text}>
          Hi {name || 'there'},
        </Text>
        <Text style={text}>
          You have successfully joined {SITE_NAME}. We are building the most trusted network of India's top AI engineers — and we are glad you are here.
        </Text>
        <Text style={text}>
          <strong>For engineers:</strong> Apply to the network to get vetted and matched with top startups worldwide.
        </Text>
        <Text style={text}>
          <strong>For startups:</strong> Post a hiring request and we will hand-pick 3–5 engineers within 72 hours.
        </Text>
        <Button style={button} href={`https://${ROOT_DOMAIN}`}>
          Explore Aveiq
        </Button>
        <Text style={footer}>
          If you have any questions, reply to this email or reach out at{' '}
          <Link href="mailto:support@aveiq.app" style={link}>
            support@aveiq.app
          </Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welcome to ${SITE_NAME}`,
  displayName: 'Welcome email',
  previewData: { name: 'Rahul' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '1' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const link = { color: '#000000', textDecoration: 'underline' }
const button = { backgroundColor: '#000000', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
