import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface Props {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

const PrivacyToggleRow = ({ title, description, checked, onChange, disabled, loading }: Props) => (
  <div className="flex items-start justify-between gap-4 py-3.5">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
    </div>
    <div className="flex items-center gap-2 pt-0.5">
      {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  </div>
);

export default PrivacyToggleRow;
