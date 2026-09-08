-- Anki学习模块数据库设计
-- 在Supabase SQL Editor中执行此文件

-- 1. 词库卡片表
CREATE TABLE IF NOT EXISTS anki_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('japanese', 'english')),
  original_text TEXT NOT NULL,
  pronunciation TEXT,
  part_of_speech TEXT,
  translation TEXT NOT NULL,
  special_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 练习记录表
CREATE TABLE IF NOT EXISTS anki_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('japanese', 'english')),
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 错题本表
CREATE TABLE IF NOT EXISTS anki_wrong_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES anki_cards(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('japanese', 'english')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position INTEGER NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_anki_cards_user_language ON anki_cards(user_id, language);
CREATE INDEX IF NOT EXISTS idx_anki_practice_user ON anki_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_anki_wrong_cards_user_lang ON anki_wrong_cards(user_id, language);
CREATE INDEX IF NOT EXISTS idx_anki_wrong_cards_position ON anki_wrong_cards(user_id, language, position);

-- 启用RLS
ALTER TABLE anki_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE anki_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anki_wrong_cards ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "Users can view their own cards" ON anki_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cards" ON anki_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards" ON anki_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards" ON anki_cards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own practice sessions" ON anki_practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own practice sessions" ON anki_practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wrong cards" ON anki_wrong_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wrong cards" ON anki_wrong_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wrong cards" ON anki_wrong_cards FOR DELETE USING (auth.uid() = user_id);

-- 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anki_cards_updated_at
  BEFORE UPDATE ON anki_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
