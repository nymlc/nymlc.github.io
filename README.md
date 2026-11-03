# nymlc.github.io

nymlc 的统一项目介绍与下载入口，使用原生 HTML、CSS 和少量 JavaScript，并通过 GitHub Pages 部署。页面包含滚动显现、轻量悬浮和悬停动效，同时尊重系统的“减少动态效果”设置。

## 当前项目

- [FinderX 项目介绍](https://nymlc.github.io/projects/finderx/)
- [FinderX 下载页](https://nymlc.github.io/projects/finderx/download.html)
- [FinderX 权限与数据说明](https://nymlc.github.io/projects/finderx/privacy.html)

FinderX 应用源码保存在独立仓库；此仓库只包含网站内容、展示资源和发行版附件。FinderX 介绍页使用真实应用界面截图（`assets/finderx-real-history-settings.png`），功能卡片采用抽象装饰，不再用仿制界面冒充产品截图。

## 更新网站

向 `main` 分支推送后，`.github/workflows/pages.yml` 会自动部署网站。GitHub Pages 的发布来源需设置为 **GitHub Actions**。

## 发布 FinderX 下载

在本仓库创建正式 GitHub Release，标签使用 `finderx-v<版本号>`，例如 `finderx-v2026.11.03`，并附加文件名为 `FinderX.dmg` 的安装包。下载页会从公开 Release 列表中筛选 FinderX 的最新正式版；其他项目可使用自己的标签前缀，互不影响。

建议每个正式版本在发布前完成 Developer ID 签名和 Apple 公证，并在 Release 说明中写明系统要求、更新内容和校验值。未发布正式版时，下载页会明确显示“首个公开版本准备中”，不会显示失效的直链。

## 本仓库与应用源码

这是公开的静态网站仓库。它不包含 FinderX 应用源码；公开网站仓库中的页面 HTML、CSS、脚本和展示图标可被访问。FinderX 应用源码仍由其独立仓库管理。
