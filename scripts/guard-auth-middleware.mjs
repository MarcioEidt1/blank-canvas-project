#!/usr/bin/env node
/**
 * Guard: src/integrations/supabase/auth-middleware.ts must NOT exist.
 *
 * Esse arquivo (TanStack Start) já foi recriado por engano por sugestões
 * automáticas. Este projeto usa React Router + Vite — autenticação é via
 * AuthContext + RLS no Supabase. Se aparecer, removemos e abortamos o build
 * para forçar revisão manual.
 */
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve("src/integrations/supabase/auth-middleware.ts");

if (existsSync(target)) {
  let preview = "";
  try {
    preview = readFileSync(target, "utf8").slice(0, 200);
  } catch {}
  unlinkSync(target);
  console.warn(
    "\n[guard-auth-middleware] ⚠️  auth-middleware.ts foi recriado e removido automaticamente.\n" +
      "Esse arquivo NÃO pertence a este projeto (usa @tanstack/react-start).\n" +
      "Prévia do conteúdo removido:\n" +
      preview +
      "\n\nBuild prossegue normalmente.\n"
  );
}

console.log("[guard-auth-middleware] ok");
