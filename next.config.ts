import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Next 16 génère AGENTS.md/CLAUDE.md au démarrage s'il n'en trouve pas :
     docs/REPRISE.md tient déjà ce rôle, pas besoin d'un second fichier. */
  agentRules: false,
};

export default nextConfig;
