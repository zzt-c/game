#!/bin/bash

# 游戏陪玩服务平台 - 安装脚本
# 适用于Linux/macOS系统

echo "🚀 开始安装游戏陪玩服务平台..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 显示版本信息
echo "📦 Node.js版本: $(node --version)"
echo "📦 npm版本: $(npm --version)"

# 安装依赖
echo "📥 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 创建环境变量文件
echo "⚙️ 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 已创建.env文件，请编辑该文件配置Supabase连接信息"
else
    echo "📝 .env文件已存在，跳过创建"
fi

# 创建必要的目录
echo "📁 创建项目目录..."
mkdir -p logs
mkdir -p uploads

# 设置文件权限
echo "🔒 设置文件权限..."
chmod +x deploy.sh

echo "✅ 安装完成！"

# 显示后续步骤
echo ""
echo "🎯 下一步操作："
echo "1. 编辑 .env 文件，配置Supabase连接信息"
echo "2. 在Supabase控制台执行 database-schema.sql"
echo "3. 运行 npm run dev 启动开发服务器"
echo "4. 访问 http://localhost:3000 查看项目"
echo ""
echo "📚 详细文档请查看 README.md"

# 检查是否在Windows环境下
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    echo ""
    echo "💡 检测到Windows环境，建议使用PowerShell执行脚本"
fi