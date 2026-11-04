export const FINDERX_REPOSITORY = 'nymlc/nymlc.github.io';
export const FINDERX_RELEASES_URL = `https://github.com/${FINDERX_REPOSITORY}/releases`;

export async function loadLatestFinderXRelease() {
  const response = await fetch(
    `https://api.github.com/repos/${FINDERX_REPOSITORY}/releases?per_page=100`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

  const releases = await response.json();
  return releases
    .filter((item) => !item.draft && !item.prerelease && item.tag_name.startsWith('finderx-v'))
    .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))[0] || null;
}
