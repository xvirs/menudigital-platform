interface ImportMetaEnv {
  readonly GITHUB_TOKEN: string;
  readonly GITHUB_OWNER: string;
  readonly GITHUB_REPO: string;
  readonly GITHUB_BRANCH: string;
  readonly ADMIN_USER: string;
  readonly ADMIN_PASS: string;
  readonly N8N_WEBHOOK_URL: string;
  readonly N8N_WEBHOOK_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
