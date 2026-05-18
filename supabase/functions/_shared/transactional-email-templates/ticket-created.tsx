/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harpy'

interface Props { subject?: string; ticketId?: string; userName?: string }

const TicketCreatedEmail = ({ subject, userName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recebemos seu chamado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Recebemos seu chamado{userName ? `, ${userName}` : ''}</Heading>
        <Text style={text}>
          Confirmamos a abertura do seu chamado{subject ? `: "${subject}"` : ''}. Vamos responder o mais breve possível.
        </Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TicketCreatedEmail,
  subject: (d: any) => d?.subject ? `Recebido: ${d.subject}` : 'Recebemos seu chamado',
  displayName: 'Chamado recebido',
  previewData: { subject: 'Não consigo importar transações', userName: 'Ana' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
