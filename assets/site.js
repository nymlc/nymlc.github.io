const HUB_REPO = "nymlc/nymlc.github.io";
const FINDERX_TAG_PREFIX = "finderx-v";
const RELEASES_URL = `https://github.com/${HUB_REPO}/releases`;

function formatReleaseDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function updateReleaseSummary(release) {
  document.querySelectorAll("[data-release-summary]").forEach((element) => {
    element.textContent = release
      ? `${release.name || release.tag_name} · 已发布`
      : "首个公开版本准备中，发布后可在这里获取。";
  });
}

function setDownloadUnavailable(message, meta = "正式版将通过 GitHub Releases 发布。") {
  const state = document.querySelector("[data-release-state]");
  const metaElement = document.querySelector("[data-release-meta]");
  const note = document.querySelector("[data-release-note]");
  const button = document.querySelector("[data-finderx-download]");

  if (state) state.textContent = message;
  if (metaElement) metaElement.textContent = meta;
  if (note) note.textContent = "FinderX 应用源码与本项目介绍页分开管理；正式发行包会单独附在版本说明中。";
  if (button) {
    button.href = RELEASES_URL;
    button.target = "_blank";
    button.rel = "noreferrer";
    button.textContent = "查看 GitHub Releases";
    button.setAttribute("aria-disabled", "false");
    button.classList.remove("is-disabled");
  }
  updateReleaseSummary(null);
}

async function loadFinderXRelease() {
  const state = document.querySelector("[data-release-state]");
  if (!state && !document.querySelector("[data-release-summary]")) return;

  if (state) state.textContent = "正在检查最新版本…";
  const initialButton = document.querySelector("[data-finderx-download]");
  if (initialButton) initialButton.textContent = "正在检查版本";

  try {
    const response = await fetch(
      `https://api.github.com/repos/${HUB_REPO}/releases?per_page=100`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    const releases = await response.json();
    const release = releases
      .filter((item) => !item.draft && !item.prerelease && item.tag_name.startsWith(FINDERX_TAG_PREFIX))
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))[0];

    if (!release) {
      setDownloadUnavailable("首个公开版本准备中", "目前还没有可下载的正式发行版。");
      return;
    }

    updateReleaseSummary(release);

    const asset = release.assets.find((item) => item.name.toLowerCase() === "finderx.dmg");
    if (!asset) {
      setDownloadUnavailable(
        `${release.name || release.tag_name} 已发布`,
        "此版本暂未附加 FinderX.dmg，请打开版本说明查看详情。",
      );
      return;
    }

    if (state) state.textContent = release.name || release.tag_name;
    const meta = document.querySelector("[data-release-meta]");
    if (meta) {
      const date = formatReleaseDate(release.published_at);
      const size = `${(asset.size / (1024 * 1024)).toFixed(1)} MB`;
      meta.textContent = [date, size, "DMG"].filter(Boolean).join(" · ");
    }

    const note = document.querySelector("[data-release-note]");
    if (note) {
      note.textContent = release.body?.trim()
        ? release.body.trim().replace(/[#*_`]/g, "").slice(0, 260)
        : "建议查看版本说明，了解更新内容与安装注意事项。";
    }

    const button = document.querySelector("[data-finderx-download]");
    if (button) {
      button.href = asset.browser_download_url;
      button.removeAttribute("target");
      button.removeAttribute("rel");
      button.removeAttribute("aria-disabled");
      button.classList.remove("is-disabled");
      button.innerHTML = '下载 FinderX.dmg <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m-4-4 4 4 4-4M4 16h12"/></svg>';
      button.setAttribute("aria-label", `下载 ${release.name || release.tag_name} 的 FinderX DMG 安装包`);
    }

    document.querySelectorAll("[data-release-page]").forEach((link) => {
      link.href = release.html_url;
      link.textContent = "查看版本说明 ↗";
    });
  } catch (error) {
    console.warn("Unable to load FinderX releases:", error);
    setDownloadUnavailable("暂时无法读取版本状态", "可前往 GitHub Releases 查看已发布版本。");
  }
}

document.querySelectorAll("#current-year").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

loadFinderXRelease();
