import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'AVEIQ'
const ROOT_DOMAIN = 'aveiq.app'

interface CompleteSignupProps {
  name?: string
  audience?: 'engineer' | 'founder' | 'unknown'
}

const CompleteSignupEmail = ({ name, audience = 'unknown' }: CompleteSignupProps) => {
  const isFounder = audience === 'founder'
  const ctaHref = isFounder
    ? `https://${ROOT_DOMAIN}/hire`
    : `https://${ROOT_DOMAIN}/apply`
  const ctaLabel = isFounder ? 'Finish posting your role' : 'Finish your application'
  const dashHref = `https://${ROOT_DOMAIN}/dashboard`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isFounder
          ? `Hey there, don't forget to finish posting your role on ${SITE_NAME}`
          : `Hey there, don't forget to finish your ${SITE_NAME} application`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Heading style={brand}>{SITE_NAME}</Heading>

            <Heading style={h1}>
              {isFounder ? `Welcome to ${SITE_NAME}` : `Welcome to ${SITE_NAME}`}
            </Heading>
            <Text style={subtle}>
              {isFounder
                ? "You're one step away from meeting India's top AI engineers."
                : "You're one step away from getting matched with top startups."}
            </Text>

            <Button style={buttonPrimary} href={ctaHref}>{ctaLabel}</Button>
            <Button style={buttonSecondary} href={dashHref}>Open dashboard</Button>

            <div style={divider} />

            <Text style={text}><strong>Hi {name || 'there'},</strong></Text>
            <Text style={text}>
              Thanks for signing up for {SITE_NAME}. To finish{' '}
              {isFounder ? 'posting your hiring request' : 'joining our engineer network'},
              please:
            </Text>

            {isFounder ? (
              <Text style={list}>
                1. Visit <Link href={ctaHref} style={link}>aveiq.app/hire</Link><br />
                2. Share the role, stack and budget<br />
                3. We hand-pick 3–5 engineers within 72 hours
              </Text>
            ) : (
              <Text style={list}>
                1. Visit <Link href={ctaHref} style={link}>aveiq.app/apply</Link><br />
                2. Upload your resume and skills<br />
                3. Explore opportunities
              </Text>
            )}

            <Text style={text}>
              If you have already started, you can pick up where you left off from your{' '}
              <Link href={dashHref} style={link}>dashboard</Link>.
            </Text>

            <Heading style={h2}>What happens next?</Heading>
            <Text style={text}>
              {isFounder
                ? "Once your role is posted, we'll match it against vetted engineers and send you a shortlist within 72 hours."
                : "We'll reach out when we find the right role for you. If you don't get matched at first, that's okay — we'll keep your profile available for future opportunities."}
            </Text>

            <Heading style={h2}>Any questions?</Heading>
            <Text style={text}>
              Reply to this email or reach us at{' '}
              <Link href="mailto:care@aveiq.app" style={link}>care@aveiq.app</Link>.
            </Text>

            <Text style={signoff}>— The {SITE_NAME} Team</Text>
            <Text style={footer}>
              This is an automated reminder because you started signing up but haven't finished yet.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CompleteSignupEmail,
  subject: (data: Record<string, any>) =>
    data?.audience === 'founder'
      ? "Hey there, don't forget to post your role"
      : "Hey there, don't forget to upload your resume",
  displayName: 'Complete your signup reminder',
  previewData: { name: 'Aman', audience: 'engineer' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 16px', maxWidth: '560px', margin: '0 auto' }
const card = { padding: '28px 24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #ececec' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#5b5bd6', margin: '0 0 24px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 10px', lineHeight: '1.25' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '28px 0 10px' }
const subtle = { fontSize: '15px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#3d3d3d', lineHeight: '1.6', margin: '0 0 14px' }
const list = { fontSize: '14px', color: '#3d3d3d', lineHeight: '1.9', margin: '0 0 16px', paddingLeft: '12px' }
const link = { color: '#5b5bd6', textDecoration: 'underline' }
const buttonPrimary = { backgroundColor: '#5b5bd6', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block', marginRight: '8px', marginBottom: '10px' }
const buttonSecondary = { backgroundColor: '#f1f0ee', color: '#0a0a0a', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block', marginBottom: '10px' }
const divider = { borderTop: '1px solid #ececec', margin: '24px 0 20px' }
const signoff = { fontSize: '14px', color: '#3d3d3d', margin: '20px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
