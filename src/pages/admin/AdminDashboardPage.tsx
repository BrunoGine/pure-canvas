import { Users, UserCheck, UserPlus, Crown, Building2, Clock, Ban, ShieldAlert, Trash2, Sparkles } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AdminRoute from "@/components/admin/AdminRoute";
import MetricCard from "@/components/admin/MetricCard";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminDashboardPage = () => {
  const { data: m, isLoading } = useAdminMetrics();
  const navigate = useNavigate();

  return (
    <AdminRoute>
      <AdminShell title="Visão geral">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Total de usuários" value={m?.total_users} icon={Users} loading={isLoading} />
          <MetricCard label="Ativos hoje" value={m?.active_today} icon={UserCheck} loading={isLoading} tone="success" />
          <MetricCard label="Novos (7d)" value={m?.new_7d} icon={UserPlus} loading={isLoading} />
          <MetricCard label="Novos (30d)" value={m?.new_30d} icon={UserPlus} loading={isLoading} />
          <MetricCard label="Premium" value={m?.premium} icon={Crown} loading={isLoading} tone="success" />
          <MetricCard label="Empresa" value={m?.enterprise} icon={Building2} loading={isLoading} tone="success" />
          <MetricCard label="Em trial" value={m?.trialing} icon={Sparkles} loading={isLoading} />
          <MetricCard label="Empresas criadas" value={m?.companies} icon={Building2} loading={isLoading} />
          <MetricCard label="Inativos 30d+" value={m?.inactive_30d} icon={Clock} loading={isLoading} tone="warning" />
          <MetricCard label="Suspensos" value={m?.suspended} icon={ShieldAlert} loading={isLoading} tone="warning" />
          <MetricCard label="Banidos" value={m?.banned} icon={Ban} loading={isLoading} tone="danger" />
          <MetricCard label="Excluídos" value={m?.soft_deleted} icon={Trash2} loading={isLoading} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => navigate("/admin/usuarios")}>Gerenciar usuários</Button>
          <Button variant="outline" onClick={() => navigate("/admin/assinaturas")}>
            Assinaturas
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/logs")}>
            Ver logs
          </Button>
        </div>
      </AdminShell>
    </AdminRoute>
  );
};

export default AdminDashboardPage;
