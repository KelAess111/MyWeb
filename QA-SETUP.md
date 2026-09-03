# Q&A 功能使用说明

## 功能概述

Q&A 功能允许访客在你的个人资料页面提问，你可以通过管理界面回答这些问题。已回答的问题会自动显示在个人资料页面上。

## 安装步骤

### 1. 创建 Supabase 表

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL 脚本：

```bash
# 文件位置
supabase-qa-entries.sql
```

或者直接复制粘贴以下内容到 SQL Editor：

```sql
-- 创建 Q&A 表
CREATE TABLE IF NOT EXISTS qa_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT,
  author_email TEXT,
  author_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_qa_entries_status ON qa_entries(status);
CREATE INDEX IF NOT EXISTS idx_qa_entries_created_at ON qa_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_entries_display_order ON qa_entries(display_order DESC);

-- 启用 RLS
ALTER TABLE qa_entries ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Anyone can view answered questions"
  ON qa_entries FOR SELECT
  USING (status = 'answered');

CREATE POLICY "Anyone can submit questions"
  ON qa_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only author can update"
  ON qa_entries FOR UPDATE
  USING (auth.email() = '2597631359@qq.com');

CREATE POLICY "Only author can delete"
  ON qa_entries FOR DELETE
  USING (auth.email() = '2597631359@qq.com');
```

### 2. 访问页面

- **公开页面（访客可见）**: `http://localhost:5173/profile#qa`
- **管理页面（仅作者可见）**: `http://localhost:5173/qa-admin`

## 使用方法

### 访客提问

1. 访问个人资料页面 (`/profile`)
2. 滚动到 "问答时间" 区块
3. 点击 "我也有问题" 按钮
4. 填写问题内容（可选填写称呼）
5. 提交问题

### 管理员回答问题

1. 确保已在本地编辑模式下登录（使用 `.env.local` 中的账号）
2. 访问管理页面：`http://localhost:5173/qa-admin`
3. 查看所有提交的问题
4. 点击 "编辑" 按钮
5. 输入回答内容
6. 选择状态：
   - **待回答**：问题尚未回答，不会显示在公开页面
   - **已回答**：问题已回答，会显示在公开页面
   - **已隐藏**：问题被隐藏，不会显示在公开页面
7. 点击 "保存"

### 筛选和管理

在管理页面，你可以：
- 按状态筛选问题（全部/待回答/已回答/已隐藏）
- 查看统计数据（待回答数量、已回答数量、总计）
- 删除不合适的问题
- 编辑已有的回答

## 数据库字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 问题唯一标识 |
| question | TEXT | 问题内容 |
| answer | TEXT | 回答内容（可为空） |
| author_name | TEXT | 提问者称呼 |
| author_email | TEXT | 提问者邮箱（可选） |
| status | TEXT | 状态（pending/answered/hidden） |
| created_at | TIMESTAMPTZ | 创建时间 |
| answered_at | TIMESTAMPTZ | 回答时间 |
| display_order | INTEGER | 显示顺序（数字越大越靠前） |
| tags | TEXT[] | 标签（预留字段） |
| likes_count | INTEGER | 点赞数（预留字段） |

## 权限说明

- **公开读取**：任何人都可以查看状态为 `answered` 的问题
- **公开提交**：任何人都可以提交新问题
- **管理权限**：只有邮箱为 `2597631359@qq.com` 的用户可以更新和删除问题

## 安全提示

1. 管理页面需要 Supabase 认证，只有登录后才能访问
2. RLS 策略确保只有作者可以编辑和删除问题
3. 访客提交的问题默认状态为 `pending`，不会立即显示在公开页面
4. 建议定期检查和回复待回答的问题

## 扩展功能（可选）

如果需要扩展功能，可以考虑：

1. **标签分类**：使用 `tags` 字段对问题进行分类
2. **点赞功能**：使用 `likes_count` 字段实现点赞
3. **搜索功能**：在管理页面添加搜索框
4. **邮件通知**：问题被回答后发送邮件通知提问者
5. **显示顺序**：调整 `display_order` 值来置顶重要问题

## 故障排除

### 问题：无法访问管理页面

**解决方案**：
1. 确保已经在本地编辑模式下登录
2. 检查 `.env.local` 文件中的认证信息
3. 在浏览器控制台检查是否有认证错误

### 问题：提交问题失败

**解决方案**：
1. 检查 Supabase 表是否正确创建
2. 检查 RLS 策略是否正确设置
3. 检查网络连接和 Supabase 配置

### 问题：已回答的问题不显示

**解决方案**：
1. 确认问题状态为 `answered`
2. 确认回答内容不为空
3. 刷新页面或清除缓存

## 文件结构

```
src/
├── services/
│   └── qaService.js           # Q&A 数据服务
├── components/
│   └── QASection.jsx          # Q&A 公开展示组件
├── pages/
│   ├── ProfilePage.jsx        # 个人资料页（包含 Q&A）
│   └── QAAdminPage.jsx        # Q&A 管理页面
└── App.css                    # 样式文件（包含 Q&A 样式）

supabase-qa-entries.sql        # 数据库表结构
```

## 注意事项

- 此功能完全独立，不会影响现有的 afterlight-entries 和 writing-tree 表
- 示例数据已包含在 SQL 脚本中，可以选择保留或删除
- 建议定期备份 `qa_entries` 表数据
