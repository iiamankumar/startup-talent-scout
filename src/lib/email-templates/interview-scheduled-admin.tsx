import React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  candidateName?: string
  candidateEmail?: string
  scheduledAt?: string
  notes?: string
  calendarUrl?: string
  adminUrl?: string
}

const InterviewScheduledAdminEmail = ({
  candidateName,
  candidateEmail,
  scheduledAt,
  notes,
  calendarUrl,
  adminUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Interview scheduled with {candidateName ?? 'candidate'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Interview scheduled</Heading>
        <Text style={text}>
          You're scheduled to interview <b>{candidateName ?? 'a candidate'}</b>
          {candidateEmail ? ` (${candidateEmail})` : ''}.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>When</Text>
          <Text style={cardValue}>{scheduledAt ?? 'TBD'}</Text>
        </Section>
        {notes ? (
          <Section style={{ marginTop: '12px' }}>
            <Text style={cardLabel}>Your notes</Text>
            <Text style={text}>{notes}</Text>
          </Section>
        ) : null}
        <Section style={{ marginTop: '20px' }}>
          {calendarUrl ? (
            <Button href={calendarUrl} style={button}>Add to Google Calendar</Button>
          ) : null}
          {adminUrl ? (
            <Text style={{ ...text, marginTop: '14px' }}>
              Open candidate in <a href={adminUrl} style={{ color: '#000' }}>admin</a>.
            </Text>
          ) : null}
        </Section>
        <Text style={footer}>— Aveiq</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InterviewScheduledAdminEmail,
  subject: 'Interview scheduled',
  displayName: 'Interview scheduled — admin',
  previewData: {
    candidateName: 'Jane',
    candidateEmail: 'jane@example.com',
    scheduledAt: 'Monday, June 2 · 10:00 AM PT',
    notes: 'Push on system design.',
    calendarUrl: 'https://calendar.google.com/',
    adminUrl: 'https://aveiq.app/admin',
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
