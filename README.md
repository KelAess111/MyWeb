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
- `supabase-writing-tree.sql`

它们会完成：

- 为写作树与 Afterlight 日志建立对应存储表
- 创建存储 bucket
- 配置 Storage / table RLS：
  - 访客只读
  - 已登录作者可写

## 写作模块访问

- 访客：只能查看写作树与内容
- 作者：在 `/writing?edit=K` 进入作者模式后，点击发送验证码；验证码发送到预设作者邮箱，页面不展示邮箱地址
- 验证通过后，才能进入编辑
- Supabase 的 Email provider 模板需要使用 `{{ .Token }}` 输出六位验证码；默认的 `{{ .ConfirmationURL }}` 是登录链接，不能用于本页面的验证码输入框

## 备注

- 写作栏位编辑、子栏位编辑、内容编辑都由同一套写作树驱动。
- 内容正文保留注释模块，和日志区的注释交互一致。
- 图片与视频附件会通过 Supabase Storage 保存，并在前端以网格和 lightbox 形式展示。
