/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harpy'

interface Props { planName?: string; interval?: string; amount?: string }

const SubscriptionConfirmedEmail = ({ planName, interval, amount }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Assinatura confirmada — bem-vindo ao {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Assinatura confirmada 🎉</Heading>
        <Text style={text}>
          Obrigado por assinar{planName ? ` o plano ${planName}` : ''}{interval ? ` (${interval})` : ''}
          {amount ? ` — ${amount}` : ''}. Seu acesso premium já está liberado.
        </Text>
        <Text style={text}>Você pode gerenciar sua assinatura a qualquer momento dentro do app.</Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionConfirmedEmail,
  subject: 'Assinatura confirmada',
  displayName: 'Assinatura confirmada',
  previewData: { planName: 'Premium', interval: 'mensal', amount: 'R$ 29,90' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
