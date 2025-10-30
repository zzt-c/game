-- 游戏陪玩服务平台数据库架构 - Supabase PostgreSQL

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户表
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    real_name VARCHAR(50),
    id_card VARCHAR(18),
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    balance DECIMAL(10,2) DEFAULT 0.00,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 游戏表
CREATE TABLE games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url TEXT,
    category VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 俱乐部表
CREATE TABLE clubs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES users(id),
    logo_url TEXT,
    cover_url TEXT,
    description TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_orders INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 陪玩者表
CREATE TABLE playmates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    club_id UUID REFERENCES clubs(id),
    nickname VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    introduction TEXT,
    specialty_games UUID[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_orders INTEGER DEFAULT 0,
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    is_online BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    tags VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 服务表
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playmate_id UUID REFERENCES playmates(id) NOT NULL,
    game_id UUID REFERENCES games(id) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    service_type VARCHAR(50) CHECK (service_type IN ('ranking', 'companion', 'teaching', 'entertainment', 'custom')),
    price_per_hour DECIMAL(8,2) NOT NULL,
    min_hours INTEGER DEFAULT 1,
    max_hours INTEGER DEFAULT 8,
    available_slots INTEGER DEFAULT 1,
    tags VARCHAR[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    playmate_id UUID REFERENCES playmates(id) NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    club_id UUID REFERENCES clubs(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    service_hours INTEGER NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    user_notes TEXT,
    playmate_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    user_review TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评价表
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    reviewer_id UUID REFERENCES users(id) NOT NULL,
    reviewee_id UUID REFERENCES users(id) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) NOT NULL,
    receiver_id UUID REFERENCES users(id) NOT NULL,
    order_id UUID REFERENCES orders(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    target_type VARCHAR(20) CHECK (target_type IN ('playmate', 'club', 'service')),
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_playmates_club_id ON playmates(club_id);
CREATE INDEX idx_services_playmate_id ON services(playmate_id);
CREATE INDEX idx_services_game_id ON services(game_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_playmate_id ON orders(playmate_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playmates_updated_at BEFORE UPDATE ON playmates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playmates ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 插入示例游戏数据
INSERT INTO games (name, icon_url, category, description) VALUES
('英雄联盟', 'https://example.com/lol-icon.png', 'MOBA', 'League of Legends - 5v5多人在线战术竞技游戏'),
('王者荣耀', 'https://example.com/honor-icon.png', 'MOBA', '腾讯开发的5v5英雄对战手游'),
('原神', 'https://example.com/genshin-icon.png', 'RPG', '开放世界动作角色扮演游戏'),
('CS2', 'https://example.com/cs2-icon.png', 'FPS', '反恐精英2 - 第一人称射击游戏'),
('永劫无间', 'https://example.com/naraka-icon.png', 'Battle Royale', '武侠风格的大逃杀游戏'),
('绝地求生', 'https://example.com/pubg-icon.png', 'Battle Royale', 'PlayerUnknown''s Battlegrounds');

-- 创建管理员用户（需要在Supabase控制台设置）
-- 注意：实际部署时需要在Supabase控制台配置具体的RLS策略