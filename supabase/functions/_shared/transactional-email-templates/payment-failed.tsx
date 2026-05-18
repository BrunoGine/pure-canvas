/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harpy'

interface Props { planName?: string }

const PaymentFailedEmail = ({ planName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Não conseguimos processar seu pagamento</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Pagamento não realizado</Heading>
        <Text style={text}>
          Tivemos um problema ao processar o pagamento{planName ? ` do plano ${planName}` : ''}.
          Atualize seu método de pagamento no app para manter seu acesso ativo.
        </Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentFailedEmail,
  subject: 'Falha no pagamento da sua assinatura',
  displayName: 'Falha no pagamento',
  previewData: { planName: 'Premium' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
