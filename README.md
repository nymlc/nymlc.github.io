# nymlc Projects

nymlc 的统一项目介绍与下载入口。网站使用 Vue 3、Vite 和 Three.js，以多页面结构构建并部署到 GitHub Pages。

## 页面

- `/`：应用总览，首屏提供实时渲染的宽幅自然场景（WebGL），下方是项目介绍
- `/projects/finderx/`：FinderX 项目介绍
- `/projects/finderx/download.html`：正式版下载、系统要求和安装说明
- `/projects/finderx/privacy.html`：权限与数据说明

## 首页实时场景

首屏的草原河流、海湾渔村、雪山河谷与热带小岛均为实时 WebGL 动画，源自 [cswfww123/wind-fields](https://github.com/cswfww123/wind-fields)，代码在 `src/windfields/`。可在场景说明右侧切换主题；移动端与桌面端共用同一场景。

- 页面只用 `createWindFields(canvas)`；画布填满哪个容器，画面就跟着那个容器的尺寸走。
- 首屏先显示与当前主题对应的 `*-poster*.webp` 加载海报，实时场景首帧渲染出来后画布淡入。
- 以下情况只显示海报：浏览器不支持 WebGL2、系统开启「减少动态效果」、开启省流量模式。
- 滚出视口会暂停渲染；帧率持续低于约 28fps 时会自动降低像素比。
- 鼠标进入画面后飞机会飞向鼠标，点击左键翻滚；触屏设备只自动飞行。
- `biome_*.js` 定义各主题的实时地貌；`scenes.js` 管理色板、植被与场景道具。拱桥、棕榈、房屋和船等模型也由 WebGL 几何体绘制。

FinderX 介绍页和总览卡片使用真实应用界面截图。应用源码保存在独立仓库；本仓库只包含网站源码、展示资源和发行版入口。

## 本地开发

```sh
pnpm install --frozen-lockfile
pnpm dev
```

生产构建与预览：

```sh
pnpm build
pnpm preview
```

## GitHub Pages 部署

向 `main` 分支推送后，`.github/workflows/pages.yml` 会安装依赖、构建 `dist/` 并将构建结果发布到 GitHub Pages。Pages 的发布来源需设为 **GitHub Actions**。

## 发布 FinderX 下载

在本仓库创建正式 GitHub Release，标签使用 `finderx-v<版本号>`，例如 `finderx-v2026.11.03`，并附加文件名为 `FinderX.dmg` 的安装包。下载页会筛选 FinderX 最新正式版；尚无正式版本时会展示准备中状态。

建议每个正式版本在发布前完成 Developer ID 签名和 Apple 公证，并在 Release 说明中写明系统要求、更新内容和校验值。
