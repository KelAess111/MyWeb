-- Anki学习模块 - 添加日语汉字字段
-- 在Supabase SQL Editor中执行此文件

-- 1. 添加 kanji_form 字段用于存储日语汉字
ALTER TABLE anki_cards
ADD COLUMN IF NOT EXISTS kanji_form TEXT;

-- 2. 为新字段添加注释
COMMENT ON COLUMN anki_cards.kanji_form IS '日语汉字形式，出题时可与pronunciation（假名）随机选择';
COMMENT ON COLUMN anki_cards.special_note IS '特别注释，用于存储其他补充信息（如：私（日常女性用））';
COMMENT ON COLUMN anki_cards.pronunciation IS '发音/假名，对于日语是纯假名形式';

-- 3. 创建索引以优化查询（如果需要按kanji_form搜索）
-- CREATE INDEX IF NOT EXISTS idx_anki_cards_kanji ON anki_cards(kanji_form) WHERE kanji_form IS NOT NULL;
