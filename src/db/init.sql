-- 記事テーブル
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 画像テーブル
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id),
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notion設定テーブル
CREATE TABLE IF NOT EXISTS notion_settings (
    id SERIAL PRIMARY KEY,
    database_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- articlesテーブルのupdated_atを自動更新するトリガー
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- notion_settingsテーブルのupdated_atを自動更新するトリガー
CREATE TRIGGER update_notion_settings_updated_at
    BEFORE UPDATE ON notion_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 