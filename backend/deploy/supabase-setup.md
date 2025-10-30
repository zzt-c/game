# Supabase 部署配置指南

## 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 注册/登录账户
3. 点击"New Project"创建新项目
4. 填写项目信息：
   - **Name**: game-companion-platform
   - **Database Password**: 设置强密码
   - **Region**: 选择亚洲区域（如ap-southeast-1）
5. 等待项目创建完成（约2-3分钟）

## 2. 获取项目配置

项目创建完成后，在项目设置中获取：

- **URL**: 在Settings > API页面找到Project URL
- **anon key**: 在Settings > API页面找到anon public key

## 3. 数据库初始化

### 3.1 执行SQL架构

1. 进入Supabase控制台的SQL编辑器
2. 复制 `database-schema.sql` 中的全部内容
3. 点击"Run"执行SQL语句
4. 确认所有表创建成功

### 3.2 配置存储桶

在Storage中创建以下存储桶：

```sql
-- 创建头像存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 创建服务图片存储桶  
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true);

-- 创建评价图片存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);
```

### 3.3 配置存储策略

为每个存储桶设置访问策略：

```sql
-- 头像存储策略
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- 服务图片策略
CREATE POLICY "Service images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'authenticated');

-- 评价图片策略
CREATE POLICY "Review images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');
```

## 4. 认证配置

### 4.1 启用第三方登录（可选）

在Authentication > Settings中配置：

- **微信登录**: 需要企业认证，可后期添加
- **QQ登录**: 需要企业认证，可后期添加
- **邮箱/密码**: 默认启用

### 4.2 配置重定向URL

在Authentication > URL Configuration中设置：

- **Site URL**: https://your-domain.com
- **Redirect URLs**: 
  - https://your-domain.com/auth/callback
  - https://your-domain.com/reset-password

## 5. 行级安全策略(RLS)

数据库架构中已包含基本的RLS启用语句，需要根据业务需求细化策略：

### 用户表策略示例
```sql
-- 用户只能查看自己的信息
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- 用户只能更新自己的信息
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);
```

### 订单表策略示例
```sql
-- 用户只能查看自己的订单
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

-- 陪玩者只能查看分配给自己的订单
CREATE POLICY "Playmates can view assigned orders" ON orders
FOR SELECT USING (auth.uid() = playmate_id);
```

## 6. 环境变量配置

在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=游戏陪玩服务平台
VITE_APP_VERSION=1.0.0
```

## 7. 测试部署

### 7.1 本地测试
```bash
npm install
npm run dev
```

访问 http://localhost:3000 测试功能

### 7.2 生产部署

#### Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Netlify部署
1. 将代码推送到GitHub
2. 在Netlify中连接仓库
3. 配置构建命令：`npm run build`
4. 发布目录：`dist`
5. 设置环境变量

## 8. 监控和维护

### 8.1 数据库监控
- 在Supabase控制台查看数据库性能
- 设置慢查询告警
- 监控连接数和使用量

### 8.2 错误监控
- 配置Sentry错误追踪
- 设置性能监控
- 日志收集和分析

## 9. 备份策略

### 9.1 自动备份
- Supabase提供每日自动备份
- 可设置时间点恢复(PITR)

### 9.2 手动备份
```sql
-- 导出关键数据
pg_dump -h your-host -U your-user -d your-db -t users -t orders > backup.sql
```

## 10. 性能优化

### 10.1 数据库优化
- 定期分析查询性能
- 添加合适的索引
- 优化复杂查询

### 10.2 缓存策略
- 使用Redis缓存热点数据
- 实现客户端缓存机制
- CDN加速静态资源

## 常见问题

### Q: 数据库连接失败
A: 检查环境变量配置和网络连接

### Q: 认证失败
A: 检查重定向URL配置和密钥有效性

### Q: 存储上传失败  
A: 检查存储桶配置和权限策略

### Q: 实时订阅不工作
A: 检查WebSocket连接和认证状态