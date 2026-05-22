import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrivacyToggleRow from "@/components/privacy/PrivacyToggleRow";
import { PrivacyKey, usePrivacySettings } from "@/hooks/usePrivacySettings";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass-card rounded-2xl px-4 py-2">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-3 pb-1">
      {title}
    </p>
    <div className="divide-y divide-border/40">{children}</div>
  </div>
);

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { settings, isLoading, update, isUpdating } = usePrivacySettings();

  const toggle = (key: PrivacyKey) => (v: boolean) => update({ [key]: v } as Partial<Record<PrivacyKey, boolean>>);

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shield size={22} className="text-primary" />
            Privacidade
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Você decide o que compartilhar.</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Section title="Vaquinhas e metas compartilhadas">
            <PrivacyToggleRow
              title="Ocultar minha foto"
              description="Outros membros verão um avatar neutro no lugar da sua foto."
              checked={settings.hide_avatar_in_shared_goals}
              onChange={toggle("hide_avatar_in_shared_goals")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Ocultar valor contribuído"
              description="Sua contribuição não aparece nos rankings e listas públicas da vaquinha."
              checked={settings.hide_contribution_amount}
              onChange={toggle("hide_contribution_amount")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Exigir aprovação para entrar nas minhas vaquinhas"
              description="Quando alguém usar o código de convite, você precisa aprovar antes da entrada."
              checked={settings.require_invite_approval}
              onChange={toggle("require_invite_approval")}
              loading={isUpdating}
            />
          </Section>

          <Section title="Perfil público">
            <PrivacyToggleRow
              title="Ocultar perfil em listas compartilhadas"
              description="Seu nome aparece como “Membro” e seu perfil não fica clicável."
              checked={settings.hide_profile_in_public_lists}
              onChange={toggle("hide_profile_in_public_lists")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Ocultar atividade recente"
              description="Metas concluídas, certificados e badges não ficam visíveis em contextos públicos."
              checked={settings.hide_recent_activity}
              onChange={toggle("hide_recent_activity")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Desativar recomendações sociais"
              description="Não receber sugestões de conexões e networking quando esse recurso for liberado."
              checked={settings.disable_social_recommendations}
              onChange={toggle("disable_social_recommendations")}
              loading={isUpdating}
            />
          </Section>

          <Section title="Harp.I.A">
            <PrivacyToggleRow
              title="Permitir que a Harp.I.A use meus dados financeiros"
              description="Quando ativo, a IA personaliza respostas com base nas suas transações e metas. Quando desativado, ela responde de forma genérica e educativa."
              checked={settings.ai_use_financial_data}
              onChange={toggle("ai_use_financial_data")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Permitir análises empresariais inteligentes"
              description="Controla se a Harp.I.A pode acessar os dados da sua empresa no modo empresa."
              checked={settings.ai_use_business_data}
              onChange={toggle("ai_use_business_data")}
              loading={isUpdating}
            />
          </Section>

          <Section title="E-mails">
            <PrivacyToggleRow
              title="E-mails essenciais"
              description="Cobrança, segurança e suporte. Esses e-mails são obrigatórios para o funcionamento da conta."
              checked={true}
              onChange={() => {}}
              disabled
            />
            <PrivacyToggleRow
              title="Novidades do produto"
              description="Avisos sobre novas funcionalidades e melhorias."
              checked={settings.email_product_updates}
              onChange={toggle("email_product_updates")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Dicas financeiras"
              description="Conteúdos educativos enviados ocasionalmente."
              checked={settings.email_financial_tips}
              onChange={toggle("email_financial_tips")}
              loading={isUpdating}
            />
            <PrivacyToggleRow
              title="Marketing"
              description="Promoções, parcerias e campanhas."
              checked={settings.email_marketing}
              onChange={toggle("email_marketing")}
              loading={isUpdating}
            />
          </Section>

          <p className="text-xs text-muted-foreground text-center px-4">
            Você pode mudar essas preferências a qualquer momento. Algumas mudanças podem levar alguns minutos para
            refletir em todas as telas.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default PrivacyPage;
