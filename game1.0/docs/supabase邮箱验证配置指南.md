# Supabase 邮箱验证配置指南

## 问题描述
测试邮箱地址（如 `test1761636008744@solution-test.com`）被Supabase拒绝，错误信息："Email address is invalid"

## 解决方案

### 方法1：在Supabase控制台配置邮箱验证设置

**步骤1：登录Supabase控制台**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目：`peqjtpoqycwxndacnwfc`

**步骤2：进入认证设置**
1. 在左侧菜单点击 **Authentication**
2. 选择 **Settings** 选项卡
3. 找到 **Email Templates** 或 **Email Settings** 部分

**步骤3：调整邮箱验证设置**
在认证设置中，您需要配置以下选项：

1. **禁用邮箱域名验证**（推荐用于开发环境）：
   - 找到 "Email Domains" 或 "Allowed Email Domains" 设置
   - 确保设置为允许所有域名，或添加测试域名到白名单
   - 如果有限制列表，请清空或添加 `test.com`, `example.com` 等测试域名

2. **配置SMTP设置**（如果使用自定义邮箱服务）：
   - 确保SMTP服务配置正确
   - 检查发件人邮箱地址是否有效

3. **调整安全设置**：
   - 找到 "Security Settings" 或 "Rate Limiting"
   - 临时放宽注册频率限制用于测试

### 方法2：使用SQL配置（高级）

如果控制台界面没有相关选项，可以使用SQL配置：

```sql
-- 检查当前认证配置
SELECT * FROM auth.config;

-- 禁用邮箱验证（开发环境）
-- 注意：这需要超级用户权限，可能无法在Supabase免费版中执行
```

### 方法3：使用有效的邮箱域名

**临时解决方案**：在测试代码中使用真实邮箱域名：

```javascript
// 修改测试代码，使用有效域名
const testEmail = `test${Date.now()}@gmail.com`;        // Gmail
const testEmail = `test${Date.now()}@qq.com`;          // QQ邮箱
const testEmail = `test${Date.now()}@outlook.com`;     // Outlook
const testEmail = `test${Date.now()}@yahoo.com`;       // Yahoo
```

### 方法4：检查项目级别的邮箱限制

**步骤1：检查项目设置**
1. 在Supabase控制台进入 **Settings** → **General**
2. 查看是否有邮箱相关的限制设置

**步骤2：检查认证提供者配置**
1. 进入 **Authentication** → **Providers**
2. 检查 "Email" 提供者的配置
3. 确保没有启用额外的验证规则

## 具体操作步骤

### 立即操作（推荐）：

1. **修改测试代码使用有效域名**：
   ```javascript
   // 在 simple-fix-rls.js 中修改
   const testEmail = `test${Date.now()}@gmail.com`;
   ```

2. **测试注册功能**：
   - 运行 `node simple-fix-rls.js`
   - 检查是否仍然有邮箱验证错误

3. **如果仍然失败，在Supabase控制台配置**：
   - 按照方法1的步骤操作
   - 特别是检查 "Allowed Email Domains" 设置

## 验证配置是否生效

### 测试脚本：

```javascript
// 测试不同域名的邮箱
const testDomains = [
  'gmail.com',
  'qq.com', 
  'outlook.com',
  'yahoo.com',
  'test.com',      // 测试域名
  'example.com'    // 示例域名
];

for (const domain of testDomains) {
  const testEmail = `test${Date.now()}@${domain}`;
  console.log(`测试邮箱: ${testEmail}`);
  // 执行注册测试...
}
```

## 常见问题排查

### 问题1：邮箱仍然被拒绝
- **原因**：Supabase项目可能配置了严格的邮箱验证策略
- **解决**：联系Supabase支持或检查项目级别的安全设置

### 问题2：验证邮件无法发送
- **原因**：SMTP配置问题或频率限制
- **解决**：检查SMTP设置，或使用邮箱确认跳过功能

### 问题3：特定域名被阻止
- **原因**：域名在黑名单中
- **解决**：在控制台的白名单中添加域名

## 生产环境建议

对于生产环境，建议：
1. 保持邮箱验证以确保安全性
2. 只允许真实的邮箱域名
3. 配置合适的SMTP服务
4. 设置合理的频率限制

## 相关文件
- `simple-fix-rls.js` - 测试脚本
- 项目配置文件（如有）

按照以上步骤操作，应该能够解决邮箱验证问题。如果问题仍然存在，可能需要检查Supabase项目的具体配置或联系技术支持。