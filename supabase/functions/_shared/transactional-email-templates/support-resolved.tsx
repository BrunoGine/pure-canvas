/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harpy'

interface Props { subject?: string; ticketId?: string }

const SupportResolvedEmail = ({ subject }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu chamado foi resolvido</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Chamado resolvido</Heading>
        <Text style={text}>
          Seu chamado{subject ? ` "${subject}"` : ''} foi marcado como resolvido. Se ainda precisar de ajuda, é só responder por lá.
        </Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportResolvedEmail,
  subject: (d: any) => d?.subject ? `Resolvido: ${d.subject}` : 'Seu chamado foi resolvido',
  displayName: 'Chamado resolvido',
  previewData: { subject: 'Dúvida sobre cobrança' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
