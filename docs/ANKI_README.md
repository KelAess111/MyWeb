# Anki 学习模块使用指南

## 📚 功能概述

Anki学习模块是一个独立的词汇学习系统，支持日语和英语两个词库。主要功能包括：

- 📝 词库管理（CRUD操作）
- 🎯 随机2选1练习
- 🔥 Combo连击系统（10连Fever，30连Super Fever）
- 📕 50题容量错题本（FIFO）
- 📊 练习记录统计（最近114次）
- 🔒 用户登录系统（Supabase Auth）

---

## 🚀 快速开始

### 1. 配置Supabase

#### 1.1 创建Supabase项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目
3. 获取项目URL和anon key

#### 1.2 执行数据库迁移
1. 进入Supabase项目的SQL Editor
2. 打开 `docs/anki-database-schema.sql` 文件
3. 复制全部SQL代码并执行

#### 1.3 配置环境变量
在 `.env.local` 文件中添加：

```env
VITE_SUPABASE_URL=你的supabase项目URL
VITE_SUPABASE_ANON_KEY=你的supabase-anon-key
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问功能

1. 打开首页
2. 在轮盘中选择"功能区"
3. 点击"Anki 学习"
4. 首次使用需要登录（通过邮箱验证码）

---

## 📖 模块结构

```
src/
├── pages/
│   ├── UtilitiesPage.jsx          # 功能区主页
│   ├── AnkiHomePage.jsx           # Anki主页（选择词库）
│   ├── AnkiPracticePage.jsx       # 练习页面
│   ├── AnkiManagePage.jsx         # 词库管理页面
│   └── AnkiWrongCardsPage.jsx     # 错题本页面
├── services/
│   └── ankiService.js             # Supabase数据服务层
├── styles/
│   └── anki.css                   # Anki模块样式
└── docs/
    ├── anki-database-schema.sql   # 数据库建表脚本
    └── ANKI_README.md             # 本文档
```

---

## 🎮 使用流程

### 添加卡片

1. 进入"词库管理"
2. 选择语言（日语/英语）
3. 点击"添加卡片"
4. 填写信息：
   - **日语卡片**：原文 + 罗马音 + 中文 + 特别注释
   - **英语卡片**：原文 + 词性 + 中文 + 特别注释

### 开始练习

1. 返回Anki主页
2. 选择词库（日语/英语）
3. 点击"开始练习"
4. 2选1答题：
   - ✅ **答对**：题目卡和干扰项进入50题缓冲区
   - ❌ **答错**：干扰项进入缓冲区，题目卡加入错题本

### Combo系统

- **10连击** → 进入Fever模式（粉色背景 + 星星特效）
- **30连击** → 进入Super Fever模式（金色背景 + 更强特效）
- **答错** → Combo清零，回到普通模式

### 查看错题

1. 进入"错题本"
2. 选择语言
3. 查看最近50道错题（FIFO）
4. 可选择移除已掌握的题目

---

## 🔧 技术细节

### 缓冲区机制

- **容量**：50题（词库≥100时启用）
- **逻辑**：防止短时间内重复出题
- **存储**：内存中（BufferQueue类）

### 错题本机制

- **容量**：50题（FIFO）
- **触发**：答错时自动加入
- **存储**：Supabase数据库

### 练习记录

- **保存时机**：结束练习时
- **保存内容**：正确数、错误数、最高连击
- **历史记录**：最近114次
- **总正确率**：基于历史总计算

---

## 🎨 样式说明

所有样式集中在 `src/styles/anki.css`，包括：

- 功能区页面样式
- Anki各页面样式
- Fever特效动画
- 响应式布局

如需自定义，修改该文件即可。

---

## 🔐 权限说明

### Row Level Security (RLS)

Supabase已启用RLS策略，确保：
- 用户只能查看/编辑自己的卡片
- 用户只能查看自己的练习记录
- 用户只能查看自己的错题本

### 登录流程

1. 用户点击"Anki学习"
2. 检测到未登录，弹出登录提示
3. 输入邮箱
4. Supabase发送验证链接到邮箱
5. 点击链接完成登录
6. 自动跳转回Anki页面

---

## 📊 数据库表结构

### anki_cards（词库卡片）
- id, user_id, language
- original_text, pronunciation, part_of_speech
- translation, special_note
- created_at, updated_at

### anki_practice_sessions（练习记录）
- id, user_id, language
- correct_count, wrong_count, max_combo
- created_at

### anki_wrong_cards（错题本）
- id, user_id, card_id, language
- added_at, position

---

## 🐛 故障排除

### 问题1：无法连接Supabase
- 检查 `.env.local` 配置是否正确
- 确认Supabase项目是否激活
- 检查网络连接

### 问题2：登录后仍提示未登录
- 清除浏览器缓存
- 重新登录
- 检查Supabase Auth设置

### 问题3：练习页面卡片不显示
- 确认已添加至少2张卡片
- 检查浏览器控制台错误信息
- 检查数据库RLS策略

---

## 🚧 未来计划（Phase 2-4）

### Phase 2: 优化功能
- [ ] 批量导入卡片（CSV/JSON）
- [ ] 导出卡片数据
- [ ] 卡片标签系统

### Phase 3: 增强特效
- [ ] 星星粒子特效（Canvas/Lottie）
- [ ] 音效反馈
- [ ] 更多Combo里程碑

### Phase 4: 数据分析
- [ ] 学习曲线图表
- [ ] 错题率统计
- [ ] 学习建议

---

## 📝 注意事项

1. **沙箱隔离**：Anki模块独立运作，即使出错也不影响其他功能
2. **数据安全**：所有用户数据通过RLS隔离
3. **免费额度**：Supabase免费层足够个人使用（500MB数据库）
4. **浏览器兼容**：建议使用Chrome/Edge/Firefox最新版

---

## 💡 开发提示

### 添加新语言词库

1. 修改 `ankiService.js` 的language验证
2. 在数据库约束中添加新语言
3. 更新前端UI显示

### 自定义Fever效果

修改 `anki.css` 中的动画：
- `.anki-fever-effect` - Fever特效
- `.anki-superfever-effect` - Super Fever特效
- `@keyframes` - 动画关键帧

---

## 🙏 致谢

- Supabase - 后端服务
- React - 前端框架
- Vite - 构建工具

---

**Made with ❤️ for Language Learners**
