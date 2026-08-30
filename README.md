# 历史文化名城保护法规数据库（GitHub Pages 静态版）

这是一个纯静态 React + Vite 网站。页面数据来自仓库内的 `data/` 文件；运行时不连接数据库、不调用 Cloudflare Worker、D1、OpenAI 或 ChatGPT 身份服务。

## 本地运行

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

生产构建：

```bash
npm run build
```

构建结果会写入 `dist/`，可用 `npm run preview` 本地预览。

## 部署到 GitHub Pages

1. 新建 GitHub Repository，将本目录内容作为仓库根目录提交并推送到 `main`。
2. 在仓库 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。
3. 推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会运行 `npm ci`、`npm run build` 并发布 `dist/`。

`vite.config.ts` 使用相对资源路径，因此同时支持 GitHub Pages 的仓库子路径和自定义域名。

## 保留的数据与功能

- `data/laws.raw.json`：法规全文和条文记录
- `data/codings.raw.json`：指标编码和证据回链
- `data/indicators.ts`：指标定义和量表
- `app/database-client.tsx`：浏览、搜索、筛选与抽屉详情等前端交互
- `public/`：网站静态素材

## 已移除的原平台模板代码

OpenAI Sites 配置、Cloudflare Worker/D1、Drizzle migration、示例 API、ChatGPT 登录辅助代码及其依赖均未进入本静态版，因为当前页面没有调用它们。
