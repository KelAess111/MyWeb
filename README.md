# Afterlight 日志功能

## 环境变量

复制 `.env.example` 为 `.env.local`，填入：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AFTERLIGHT_IMAGES_BUCKET`
- `VITE_AFTERLIGHT_VIDEOS_BUCKET`
- `VITE_AFTERLIGHT_SIGNED_URL_EXPIRES_IN`

## Supabase 表与 Storage

请先执行：

- `supabase-afterlight-attachments.sql`

它会完成：

- 为 `afterlight_entries` 增加 `attachments` 字段
- 创建 `journal-images` 与 `journal-videos` buckets
- 配置 Storage RLS：
  - 所有人可读
  - 已登录作者可上传 / 更新 / 删除

## 访问方式

- 访客：只能查看已公开日志
- 作者：用邮箱 magic link 登录后，可在网页里新增 / 编辑 / 删除日志，并上传图片/视频附件

## 备注

- `AnnotationTerm` 复用了现有注释弹层组件，日志正文中的吐槽词会被替换成可点击的注释按钮。
- 图片与视频附件会通过 Supabase Storage 保存，并在前端以网格和 lightbox 形式展示。
