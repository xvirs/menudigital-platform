interface ImportMetaEnv {
  readonly GITHUB_TOKEN: string;
  readonly GITHUB_OWNER: string;
  readonly GITHUB_REPO: string;
  readonly GITHUB_BRANCH: string;
  readonly ADMIN_USER: string;
  readonly ADMIN_PASS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
