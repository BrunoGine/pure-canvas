import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import type { Feature } from "@/lib/plans";

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
}

const FeatureGate = ({ feature, children, fallback = null }: FeatureGateProps) => {
  const { can, loading } = useSubscription();
  if (loading) return null;
  return <>{can(feature) ? children : fallback}</>;
};

export default FeatureGate;
