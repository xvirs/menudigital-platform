import { Octokit } from 'octokit';
import type { Restaurant } from '../types/restaurant';

let cached: Octokit | null = null;

function client(): Octokit {
  if (cached) return cached;
  const auth = import.meta.env.GITHUB_TOKEN;
  if (!auth) throw new Error('GITHUB_TOKEN is not set');
  cached = new Octokit({ auth });
  return cached;
}

function repoRef() {
  return {
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    branch: import.meta.env.GITHUB_BRANCH || 'main',
  };
}

const CONTENT_DIR = 'content/restaurants';

export interface RestaurantSummary {
  slug: string;
  name: string;
  status: Restaurant['status'];
  updatedAt: string;
  missingFieldsCount: number;
}

interface FileEntry {
  path: string;
  sha: string;
  decoded: Restaurant;
}

async function fetchFile(slug: string): Promise<FileEntry> {
  const { owner, repo, branch } = repoRef();
  const res = await client().rest.repos.getContent({
    owner,
    repo,
    path: `${CONTENT_DIR}/${slug}.json`,
    ref: branch,
  });
  const data = res.data;
  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`Expected file at ${CONTENT_DIR}/${slug}.json, got something else`);
  }
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return {
    path: data.path,
    sha: data.sha,
    decoded: JSON.parse(content) as Restaurant,
  };
}

export async function listRestaurants(): Promise<RestaurantSummary[]> {
  const { owner, repo, branch } = repoRef();
  const res = await client().rest.repos.getContent({
    owner,
    repo,
    path: CONTENT_DIR,
    ref: branch,
  });
  if (!Array.isArray(res.data)) return [];

  const files = res.data.filter(
    (f) => f.type === 'file' && f.name.endsWith('.json')
  );

  const summaries: RestaurantSummary[] = [];
  for (const f of files) {
    const slug = f.name.replace(/\.json$/, '');
    try {
      const { decoded } = await fetchFile(slug);
      summaries.push({
        slug: decoded.slug,
        name: decoded.info.name,
        status: decoded.status,
        updatedAt: decoded.updatedAt,
        missingFieldsCount: decoded._meta.missingFields.length,
      });
    } catch {
      // Skip files that can't be parsed; the validator catches them on push.
    }
  }
  return summaries.sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));
}

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
  try {
    const { decoded } = await fetchFile(slug);
    return decoded;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function updateRestaurant(
  slug: string,
  data: Restaurant,
  commitMessage: string
): Promise<void> {
  const { owner, repo, branch } = repoRef();
  const existing = await fetchFile(slug);
  const content = JSON.stringify(data, null, 2) + '\n';

  await client().rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: existing.path,
    message: commitMessage,
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha: existing.sha,
    branch,
  });
}

export async function deleteRestaurant(
  slug: string,
  commitMessage: string
): Promise<void> {
  const { owner, repo, branch } = repoRef();
  const existing = await fetchFile(slug);

  await client().rest.repos.deleteFile({
    owner,
    repo,
    path: existing.path,
    message: commitMessage,
    sha: existing.sha,
    branch,
  });
}
