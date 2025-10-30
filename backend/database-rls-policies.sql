-- Supabase RLS策略配置
-- 这些策略需要在Supabase控制台的SQL编辑器中执行

-- 用户表策略
-- 允许用户查看自己的信息
CREATE POLICY "用户可以查看自己的信息" ON users
  FOR SELECT USING (auth.uid() = id);

-- 允许用户插入自己的记录（注册时）
CREATE POLICY "用户可以创建自己的记录" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的信息
CREATE POLICY "用户可以更新自己的信息" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 俱乐部表策略
-- 允许所有人查看俱乐部
CREATE POLICY "所有人可以查看俱乐部" ON clubs
  FOR SELECT USING (true);

-- 允许俱乐部所有者管理自己的俱乐部
CREATE POLICY "俱乐部所有者可以管理俱乐部" ON clubs
  FOR ALL USING (auth.uid() = owner_id);

-- 陪玩者表策略
-- 允许所有人查看陪玩者
CREATE POLICY "所有人可以查看陪玩者" ON playmates
  FOR SELECT USING (true);

-- 允许用户管理自己的陪玩者信息
CREATE POLICY "用户可以管理自己的陪玩者信息" ON playmates
  FOR ALL USING (auth.uid() = user_id);

-- 服务表策略
-- 允许所有人查看服务
CREATE POLICY "所有人可以查看服务" ON services
  FOR SELECT USING (true);

-- 允许陪玩者管理自己的服务
CREATE POLICY "陪玩者可以管理自己的服务" ON services
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM playmates WHERE playmates.id = services.playmate_id
    )
  );

-- 订单表策略
-- 允许用户查看自己的订单
CREATE POLICY "用户可以查看自己的订单" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- 允许陪玩者查看与自己相关的订单
CREATE POLICY "陪玩者可以查看相关订单" ON orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM playmates WHERE playmates.id = orders.playmate_id
    )
  );

-- 允许用户创建订单
CREATE POLICY "用户可以创建订单" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 评价表策略
-- 允许用户查看评价
CREATE POLICY "用户可以查看评价" ON reviews
  FOR SELECT USING (true);

-- 允许用户创建评价（只能对自己的订单）
CREATE POLICY "用户可以创建评价" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    auth.uid() IN (
      SELECT user_id FROM orders WHERE orders.id = reviews.order_id
    )
  );

-- 消息表策略
-- 允许用户查看与自己相关的消息
CREATE POLICY "用户可以查看相关消息" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

-- 允许用户发送消息
CREATE POLICY "用户可以发送消息" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 收藏表策略
-- 允许用户查看自己的收藏
CREATE POLICY "用户可以查看自己的收藏" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

-- 允许用户管理自己的收藏
CREATE POLICY "用户可以管理自己的收藏" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- 游戏表策略
-- 允许所有人查看游戏
CREATE POLICY "所有人可以查看游戏" ON games
  FOR SELECT USING (true);

-- 管理员策略（需要先在Supabase中设置管理员角色）
-- 允许管理员查看所有数据
CREATE POLICY "管理员可以查看所有用户" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "管理员可以管理所有数据" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');