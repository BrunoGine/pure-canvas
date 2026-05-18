/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Section } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harpy'

interface Props { subject?: string; ticketId?: string; userName?: string; message?: string }

const SupportReplyEmail = ({ subject, userName, message }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Nova resposta no seu chamado em {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Olá{userName ? `, ${userName}` : ''}!</Heading>
        <Text style={text}>Nossa equipe respondeu seu chamado{subject ? `: "${subject}"` : ''}.</Text>
        {message && (
          <Section style={quote}>
            <Text style={quoteText}>{message}</Text>
          </Section>
        )}
        <Text style={text}>Acesse o app para continuar a conversa.</Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportReplyEmail,
  subject: (d: any) => d?.subject ? `Re: ${d.subject}` : 'Nova resposta do suporte',
  displayName: 'Resposta de suporte',
  previewData: { subject: 'Dúvida sobre cobrança', userName: 'Ana', message: 'Olá, segue o esclarecimento...' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const quote = { borderLeft: '3px solid #000000', padding: '8px 12px', backgroundColor: '#f7f7f7', margin: '16px 0' }
const quoteText = { fontSize: '14px', color: '#333333', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
