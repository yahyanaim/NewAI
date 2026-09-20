CREATE TABLE moroccan_news_articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    pub_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    content TEXT,
    source TEXT NOT NULL,
    category TEXT,
    guid TEXT,
    sentiment TEXT DEFAULT 'neutral',
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);