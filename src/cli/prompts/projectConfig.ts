export async function projectConfig() {
  // Placeholder - will be implemented in Phase 3
  return {
    timeline: 'mvp' as const,
    teamSize: 'solo' as const,
    deployment: 'vercel',
    extras: {
      docker: true,
      testing: true,
      linting: true,
    },
  };
}
