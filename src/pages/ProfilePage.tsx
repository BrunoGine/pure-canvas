import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Camera, Moon, Sun, ChevronRight, Shield, Bell, HelpCircle, LogOut, Pencil, Check, X, Award, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StatsHeader from "@/components/courses/StatsHeader";
import BadgesGrid from "@/components/profile/BadgesGrid";
import CertificatesList from "@/components/profile/CertificatesList";
import MentorCard from "@/components/profile/MentorCard";

const ProfilePage = () => {
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const displayName = data?.display_name || user.user_metadata?.display_name || "Usuário";
        setName(displayName);
        if (data?.avatar_url) setAvatar(data.avatar_url);
      });
  }, [user]);

  const startEditing = () => { setEditName(name); setEditingName(true); };
  const cancelEditing = () => setEditingName(false);

  const saveName = async () => {
    if (!user || !editName.trim()) return;
    const { error } = await supabase.from("profiles").update({ display_name: editName.trim() }).eq("id", user.id);
    if (error) { toast({ title: "Erro", description: "Não foi possível salvar o nome.", variant: "destructive" }); return; }
    setName(editName.trim());
    setEditingName(false);
    toast({ title: "Sucesso", description: "Nome atualizado!" });
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const menuItems = [
    { icon: Bell, label: "Notificações", action: () => {} },
    { icon: Shield, label: "Privacidade", action: () => {} },
    { icon: HelpCircle, label: "Ajuda & Suporte", action: () => {} },
  ];

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Suas configurações</p>
      </motion.div>

      {/* Avatar & Name */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center border-2 border-primary/20 shadow-glow">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white shadow-glow"
            >
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          {editingName ? (
            <div className="w-full max-w-xs flex items-center gap-2">
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveName()}
                placeholder="Seu nome"
                className="text-center bg-secondary/30 border-border/50"
                autoFocus
              />
              <button onClick={saveName} className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors">
                <Check size={18} />
              </button>
              <button onClick={cancelEditing} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{name}</span>
              <button onClick={startEditing} className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
                <Pencil size={14} className="text-muted-foreground" />
              </button>
            </div>
          )}

          {user?.email && (
            <p className="text-xs text-muted-foreground -mt-2">{user.email}</p>
          )}
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
              <div>
                <p className="text-sm font-medium">Tema {theme === "dark" ? "Escuro" : "Claro"}</p>
                <p className="text-xs text-muted-foreground">Alterne entre claro e escuro</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </div>
      </motion.div>

      {/* Menu */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border/50">
            {menuItems.map(({ icon: Icon, label, action }, i) => (
              <button key={i} onClick={action} className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <button onClick={signOut} className="flex items-center justify-center gap-2 w-full py-3 text-sm text-destructive font-medium hover:bg-destructive/5 rounded-xl transition-colors">
          <LogOut size={16} /> Sair da conta
        </button>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
