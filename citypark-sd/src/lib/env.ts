// lib/env.ts
export const env = {
  GITLAB_API: process.env.GITLAB_API ?? "https://gitlab.com/api/v4",
  GITLAB_TOKEN: process.env.GITLAB_TOKEN,
  GITLAB_PROJECT_ID: process.env.GITLAB_PROJECT_ID, 
};

export function assertServerEnv() {
  const missing: string[] = [];
  if (!env.GITLAB_TOKEN) missing.push("GITLAB_TOKEN");
  if (!env.GITLAB_PROJECT_ID) missing.push("GITLAB_PROJECT_ID");
  if (missing.length) {
    throw new Error(
      `[ENV] Missing required env vars: ${missing.join(
        ", "
      )}. Add them to .env.local (server-side).`
    );
  }
}
