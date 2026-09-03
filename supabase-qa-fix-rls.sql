-- 修复 Q&A RLS 策略
-- 如果提交问题时遇到 403 错误，执行此脚本

-- 1. 删除所有现有策略
DROP POLICY IF EXISTS "Anyone can view answered questions" ON qa_entries;
DROP POLICY IF EXISTS "Anyone can submit questions" ON qa_entries;
DROP POLICY IF EXISTS "Only author can update" ON qa_entries;
DROP POLICY IF EXISTS "Only author can delete" ON qa_entries;

-- 2. 重新创建策略

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
