import React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  candidateName?: string
  scheduledAt?: string
  notes?: string
  calendarUrl?: string
}

const InterviewScheduledEngineerEmail = ({
  candidateName,
  scheduledAt,
  notes,
  calendarUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Aveiq interview is scheduled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {candidateName ? `Hi ${candidateName},` : 'Hi,'}
        </Heading>
        <Text style={text}>
          Your final Aveiq interview has been scheduled. An Aveiq engineer
          will join you at the time below.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>When</Text>
          <Text style={cardValue}>{scheduledAt ?? 'TBD'}</Text>
        </Section>
        {notes ? (
          <Section style={{ marginTop: '12px' }}>
            <Text style={cardLabel}>Notes from your interviewer</Text>
            <Text style={text}>{notes}</Text>
          </Section>
        ) : null}
        {calendarUrl ? (
          <Section style={{ marginTop: '20px' }}>
            <Button href={calendarUrl} style={button}>Add to Google Calendar</Button>
          </Section>
        ) : null}
        <Text style={footer}>— The Aveiq team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InterviewScheduledEngineerEmail,
  subject: 'Your Aveiq interview is scheduled',
  displayName: 'Interview scheduled — engineer',
  previewData: {
    candidateName: 'Jane',
    scheduledAt: 'Monday, June 2 · 10:00 AM PT',
    notes: 'We will go deep on system design.',
    calendarUrl: 'https://calendar.google.com/',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const card = { background: '#f5f5f5', borderRadius: '10px', padding: '16px 18px', marginTop: '8px' }
const cardLabel = { fontSize: '11px', color: '#777', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 6px' }
const cardValue = { fontSize: '16px', color: '#000', fontWeight: 600 as const, margin: 0 }
const button = { background: '#000', color: '#fff', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: 600 as const, textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999', margin: '28px 0 0' }
