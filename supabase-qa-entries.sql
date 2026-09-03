-- Q&A 表结构
-- 用于存储问答条目，支持状态管理和显示顺序控制

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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_qa_entries_status ON qa_entries(status);
CREATE INDEX IF NOT EXISTS idx_qa_entries_created_at ON qa_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_entries_display_order ON qa_entries(display_order DESC);

-- 添加 RLS (Row Level Security) 策略
ALTER TABLE qa_entries ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看已回答的问题（包括匿名用户）
CREATE POLICY "Anyone can view answered questions"
  ON qa_entries FOR SELECT
  TO public
  USING (status = 'answered');

-- 允许所有人插入新问题（包括匿名用户）
CREATE POLICY "Anyone can submit questions"
  ON qa_entries FOR INSERT
  TO public
  WITH CHECK (
    status = 'pending' AND
    question IS NOT NULL
  );

-- 仅作者可以查看所有问题（用于管理界面）
CREATE POLICY "Author can view all questions"
  ON qa_entries FOR SELECT
  TO authenticated
  USING (auth.email() = '2597631359@qq.com');

-- 仅作者可以更新
CREATE POLICY "Only author can update"
  ON qa_entries FOR UPDATE
  TO authenticated
  USING (auth.email() = '2597631359@qq.com')
  WITH CHECK (auth.email() = '2597631359@qq.com');

-- 仅作者可以删除
CREATE POLICY "Only author can delete"
  ON qa_entries FOR DELETE
  TO authenticated
  USING (auth.email() = '2597631359@qq.com');

-- 插入一些示例数据（可选）
INSERT INTO qa_entries (question, answer, status, answered_at, display_order) VALUES
  ('你是如何开始创作的？', '我从小就喜欢画画和写故事，后来逐渐接触到游戏设计和音乐制作。这些不同的媒介让我发现，它们其实可以相互连接，讲述同一个世界的不同侧面。', 'answered', NOW(), 100),
  ('你最喜欢的创作工具是什么？', '游戏设计我用 Unity 和 Godot，绘画主要是 Procreate 和 Clip Studio Paint，音乐制作用 FL Studio，3D 建模则是 Blender。不过工具只是手段，重要的是想表达什么。', 'answered', NOW(), 90),
  ('未来有什么创作计划？', '我正在构建一个完整的世界观，会通过游戏、插画、音乐和文字档案逐步展现。具体项目还在打磨中，会在这个网站慢慢更新。', 'answered', NOW(), 80);
