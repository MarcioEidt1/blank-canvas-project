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
  console.error(
    "\n[guard-auth-middleware] ❌ auth-middleware.ts foi recriado e removido.\n" +
      "Esse arquivo NÃO pertence a este projeto (usa @tanstack/react-start).\n" +
      "Conteúdo inicial removido:\n" +
      preview +
      "\n\nRevise antes de prosseguir. Build abortado.\n"
  );
  process.exit(1);
}

console.log("[guard-auth-middleware] ok");
