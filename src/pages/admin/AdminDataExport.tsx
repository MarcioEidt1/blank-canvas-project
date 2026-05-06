import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Database,
  Users,
  HardDrive,
  Code2,
  Key,
  ScrollText,
  Download,
  Loader2,
  Copy,
  CheckCircle2,
  ShieldAlert,
  CalendarCheck,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";

const TABLE_NAMES = [
  "vehicles",
  "vehicle_images",
  "vehicle_documents",
  "vehicle_expenses",
  "vehicle_movements",
  "banners",
  "contacts",
  "site_settings",
  "testimonials",
  "user_profiles",
  "user_roles",
] as const;

const SCHEMA_SQL = `-- ====================================================
-- SQL de criação das tabelas — Prospect Car System
-- Atualizado com políticas RLS e view pública segura
-- ====================================================

-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ====================================================
-- TABELAS
-- ====================================================

-- Tabela: vehicles (dados sensíveis — acesso restrito a admins)
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  display_name TEXT DEFAULT '',
  year INTEGER NOT NULL,
  year_model INTEGER,
  km INTEGER NOT NULL DEFAULT 0,
  fuel TEXT NOT NULL DEFAULT 'Flex',
  transmission TEXT NOT NULL DEFAULT 'Automático',
  price NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '',
  internal_color TEXT DEFAULT '',
  doors INTEGER DEFAULT 4,
  image_url TEXT NOT NULL DEFAULT '',
  image_position TEXT NOT NULL DEFAULT 'center',
  highlights TEXT[] DEFAULT '{}',
  accessories TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN DEFAULT false,
  show_on_website BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'em_estoque',
  plate TEXT DEFAULT '',
  renavam TEXT DEFAULT '',
  chassis TEXT DEFAULT '',
  crv TEXT DEFAULT '',
  engine_number TEXT DEFAULT '',
  power_cv TEXT DEFAULT '',
  ownership_type TEXT DEFAULT 'proprio',
  current_owner TEXT DEFAULT '',
  dpvat_year TEXT DEFAULT '',
  licensing_year TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  entry_date DATE DEFAULT CURRENT_DATE,
  yard_location TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  factory_warranty_date DATE,
  is_promotion BOOLEAN NOT NULL DEFAULT false,
  promotion_price NUMERIC,
  promotion_label TEXT DEFAULT 'OFERTA',
  promotion_until DATE,
  purchase_price NUMERIC DEFAULT 0,
  extra_expenses_total NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  fipe_price NUMERIC DEFAULT 0,
  suggested_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_images
CREATE TABLE public.vehicle_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  image_position TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_documents
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL DEFAULT 'documento',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_expenses
CREATE TABLE public.vehicle_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_movements
CREATE TABLE public.vehicle_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'status_change',
  description TEXT NOT NULL DEFAULT '',
  previous_value TEXT DEFAULT '',
  new_value TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: banners
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link TEXT DEFAULT '#veiculos',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: contacts
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: site_settings (com flag is_public para liberar leitura anônima)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quote TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: user_profiles
CREATE TABLE public.user_profiles (
  user_id UUID NOT NULL PRIMARY KEY,
  username TEXT,
  recovery_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  is_master BOOLEAN NOT NULL DEFAULT false,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (user_id, role)
);

-- ====================================================
-- VIEW PÚBLICA SEGURA (somente campos não-sensíveis)
-- Usada pelo site público no lugar da tabela vehicles
-- ====================================================
CREATE OR REPLACE VIEW public.public_vehicles
WITH (security_invoker = true) AS
SELECT
  id, brand, model, version, display_name, year, year_model, km,
  fuel, transmission, price, color, doors, image_url, image_position,
  highlights, accessories, description, featured, show_on_website,
  video_url, is_promotion, promotion_price, promotion_label, promotion_until,
  is_active, created_at, updated_at
FROM public.vehicles
WHERE is_active = true AND show_on_website = true;

-- ====================================================
-- FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- ====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
      AND (is_master = true OR _permission = ANY(permissions))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin' AND is_master = true
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ====================================================
-- HABILITAR RLS
-- ====================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- POLÍTICAS RLS
-- ====================================================

-- vehicles: somente admins (público usa view public_vehicles)
CREATE POLICY "Admins can view all vehicles" ON public.vehicles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- vehicle_images: público lê, admin gerencia
CREATE POLICY "Public can view vehicle images" ON public.vehicle_images FOR SELECT USING (true);
CREATE POLICY "Admins manage vehicle images" ON public.vehicle_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- vehicle_documents/expenses/movements: somente admin
CREATE POLICY "Admins manage vehicle documents" ON public.vehicle_documents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage vehicle expenses" ON public.vehicle_expenses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage vehicle movements" ON public.vehicle_movements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- banners: público vê ativos, admin gerencia
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- contacts: qualquer um envia, somente admin lê/edita/deleta
CREATE POLICY "Anyone can submit contact" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- site_settings: público vê apenas as marcadas is_public, admin gerencia tudo
CREATE POLICY "Public can view public site settings" ON public.site_settings FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can view all site settings" ON public.site_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- testimonials
CREATE POLICY "Public can view active testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_master_admin(auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_master_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_master_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR is_master_admin(auth.uid()));
CREATE POLICY "Masters can delete profiles" ON public.user_profiles FOR DELETE TO authenticated USING (is_master_admin(auth.uid()));

-- user_roles (gerenciado por master admin)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Masters can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_master_admin(auth.uid()));
CREATE POLICY "Masters can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (is_master_admin(auth.uid()));
CREATE POLICY "Masters can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (is_master_admin(auth.uid())) WITH CHECK (is_master_admin(auth.uid()));
CREATE POLICY "Masters can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (is_master_admin(auth.uid()));
`;

type ExportCategory = {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
  csv?: boolean; // se true, oferece exportação em CSV
};

const EXPORT_CATEGORIES: ExportCategory[] = [
  { key: "database", label: "Banco de Dados", icon: Database, description: "Todas as tabelas: veículos, banners, contatos, depoimentos, configurações.", csv: true },
  { key: "users", label: "Usuários", icon: Users, description: "Perfis, roles e permissões dos administradores.", csv: true },
  { key: "storage", label: "Storage (Mídia)", icon: HardDrive, description: "Lista de arquivos nos buckets (veículos, banners, documentos)." },
  { key: "edge_functions", label: "Edge Functions", icon: Code2, description: "Código das funções de borda (apenas nomes — código está no repositório)." },
  { key: "secrets", label: "Secrets", icon: Key, description: "Nomes das secrets configuradas (valores NÃO são exportados por segurança)." },
  { key: "logs", label: "Logs Recentes", icon: ScrollText, description: "Últimas movimentações registradas no sistema.", csv: true },
  { key: "appointments", label: "Agendamentos", icon: CalendarCheck, description: "Contatos recebidos com data (funciona como agendamentos).", csv: true },
];

// Converte um array de objetos para CSV (RFC 4180)
function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headerSet = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((k) => headerSet.add(k));
  }
  const headers = Array.from(headerSet);
  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const str =
      typeof val === "object" ? JSON.stringify(val) : String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\r\n");
}

const AdminDataExport = () => {
  const { isMaster, hasPermission } = useAuth();
  const canExport = isMaster || hasPermission("data_export");
  const [exporting, setExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!canExport) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-destructive" size={48} />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">Você não tem permissão para exportar dados. Solicite a um Master o acesso "Exportar Dados".</p>
        </div>
      </AdminLayout>
    );
  }

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopied(true);
      toast.success("SQL copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar. Selecione manualmente.");
    }
  };

  // Coleta os dados de uma categoria como um mapa { tabela: linhas[] }
  const collectData = async (key: string): Promise<Record<string, any[]>> => {
    switch (key) {
      case "database": {
        const results: Record<string, any[]> = {};
        for (const table of TABLE_NAMES) {
          const { data, error } = await supabase.from(table).select("*");
          if (error) throw error;
          results[table] = data || [];
        }
        return results;
      }
      case "users": {
        const [profiles, roles] = await Promise.all([
          supabase.from("user_profiles").select("*"),
          supabase.from("user_roles").select("*"),
        ]);
        if (profiles.error) throw profiles.error;
        if (roles.error) throw roles.error;
        return { user_profiles: profiles.data || [], user_roles: roles.data || [] };
      }
      case "storage": {
        const buckets = ["vehicle-images", "banner-images", "vehicle-documents"];
        const result: Record<string, any[]> = {};
        for (const bucket of buckets) {
          const { data } = await supabase.storage.from(bucket).list("", { limit: 1000 });
          result[bucket] = data || [];
        }
        return result;
      }
      case "edge_functions":
        return {
          info: [
            {
              note: "O código das Edge Functions está no repositório em supabase/functions/",
              functions: [
                "export-backup",
                "feed-json",
                "feed-xml",
                "manage-admin-users",
                "resolve-login",
              ].join(", "),
            },
          ],
        };
      case "secrets":
        return {
          info: [
            {
              note: "Valores das secrets NÃO são exportados por segurança.",
              configured_secrets: [
                "SUPABASE_SERVICE_ROLE_KEY",
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
                "LOVABLE_API_KEY",
              ].join(", "),
            },
          ],
        };
      case "logs": {
        const { data, error } = await supabase
          .from("vehicle_movements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        return { vehicle_movements: data || [] };
      }
      case "appointments": {
        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return { contacts: data || [] };
      }
      default:
        return {};
    }
  };

  const exportCategory = async (key: string, format: "json" | "csv") => {
    setExporting(`${key}:${format}`);
    try {
      const data = await collectData(key);

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        saveAs(blob, `${key}-export.json`);
        toast.success(`${key}-export.json exportado!`);
      } else {
        const tables = Object.keys(data);
        if (tables.length === 1) {
          // Uma única tabela → CSV simples
          const csv = toCSV(data[tables[0]]);
          const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
          saveAs(blob, `${key}-export.csv`);
        } else {
          // Múltiplas tabelas → um CSV por tabela, concatenados com seções
          const parts: string[] = [];
          for (const t of tables) {
            parts.push(`# ${t}`);
            parts.push(toCSV(data[t]));
            parts.push("");
          }
          const blob = new Blob(["\ufeff" + parts.join("\r\n")], {
            type: "text/csv;charset=utf-8;",
          });
          saveAs(blob, `${key}-export.csv`);
        }
        toast.success(`${key}-export.csv exportado!`);
      }
    } catch (e) {
      toast.error(`Erro ao exportar: ${(e as Error).message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Exportar Dados</h1>
          <p className="text-muted-foreground mt-1">
            Exporte cada tipo de dado em JSON ou CSV, ou copie o SQL completo das tabelas para migração.
          </p>
        </div>

        {/* Export categories */}
        <div className="grid sm:grid-cols-2 gap-4">
          {EXPORT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const loadingJson = exporting === `${cat.key}:json`;
            const loadingCsv = exporting === `${cat.key}:csv`;
            const anyLoading = !!exporting;
            return (
              <div
                key={cat.key}
                className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                  </div>
                </div>
                <div className={`grid ${cat.csv ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                  <button
                    onClick={() => exportCategory(cat.key, "json")}
                    disabled={anyLoading}
                    className="flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-display font-bold text-xs tracking-wider rounded-md transition-colors disabled:opacity-50"
                  >
                    {loadingJson ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {loadingJson ? "..." : "JSON"}
                  </button>
                  {cat.csv && (
                    <button
                      onClick={() => exportCategory(cat.key, "csv")}
                      disabled={anyLoading}
                      className="flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-display font-bold text-xs tracking-wider rounded-md transition-colors disabled:opacity-50"
                    >
                      {loadingCsv ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                      {loadingCsv ? "..." : "CSV"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SQL Schema */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">SQL das Tabelas</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Inclui tabelas, view <code>public_vehicles</code>, funções e políticas RLS atualizadas.
              </p>
            </div>
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-xs rounded-md hover:opacity-90 transition-opacity"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? "COPIADO!" : "COPIAR SQL"}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-secondary/60 border border-border rounded-md p-4 text-xs text-foreground font-mono overflow-auto max-h-[500px] whitespace-pre">
              {SCHEMA_SQL}
            </pre>
          </div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-lg p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">💡 Dica de migração:</strong> 1) Copie o SQL acima e execute no novo projeto para criar as tabelas e políticas. 2) Exporte os dados em JSON (estrutura completa) ou CSV (para Excel/Sheets). 3) Importe no novo banco.
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDataExport;
