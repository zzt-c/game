#!/bin/bash

# 游戏陪玩服务平台 - 部署脚本

echo "🚀 开始部署游戏陪玩服务平台..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装"
        return 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        return 1
    fi
    
    # 检查环境变量文件
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，请先配置环境变量"
        return 1
    fi
    
    log_success "环境检查通过"
    return 0
}

# 构建项目
build_project() {
    log_info "开始构建项目..."
    
    # 安装依赖
    log_info "安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "依赖安装失败"
        return 1
    fi
    
    # 执行构建
    log_info "执行构建..."
    npm run build
    if [ $? -ne 0 ]; then
        log_error "项目构建失败"
        return 1
    fi
    
    log_success "项目构建完成"
    return 0
}

# 检查构建结果
check_build() {
    log_info "检查构建结果..."
    
    if [ ! -d "dist" ]; then
        log_error "构建目录不存在"
        return 1
    fi
    
    # 检查必要的文件
    required_files=("index.html" "assets/")
    for file in "${required_files[@]}"; do
        if [ ! -e "dist/$file" ]; then
            log_error "构建文件不完整: $file"
            return 1
        fi
    done
    
    log_success "构建结果检查通过"
    return 0
}

# 部署到不同平台
deploy_to_platform() {
    local platform=$1
    
    case $platform in
        "vercel")
            deploy_vercel
            ;;
        "netlify")
            deploy_netlify
            ;;
        "supabase")
            deploy_supabase
            ;;
        "static")
            deploy_static
            ;;
        *)
            log_error "不支持的部署平台: $platform"
            return 1
            ;;
    esac
}

# 部署到Vercel
deploy_vercel() {
    log_info "部署到Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_info "安装Vercel CLI..."
        npm install -g vercel
    fi
    
    vercel --prod
}

# 部署到Netlify
deploy_netlify() {
    log_info "部署到Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        log_info "安装Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    netlify deploy --prod --dir=dist
}

# 部署到Supabase
deploy_supabase() {
    log_info "部署到Supabase..."
    
    # 这里可以添加Supabase特定的部署逻辑
    log_info "Supabase部署需要手动配置，请参考deploy/supabase-setup.md"
}

# 静态文件部署
deploy_static() {
    log_info "准备静态文件部署..."
    
    # 创建部署包
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local deploy_dir="deploy_$timestamp"
    
    mkdir -p "$deploy_dir"
    cp -r dist/* "$deploy_dir/"
    
    # 创建部署说明
    cat > "$deploy_dir/README.txt" << EOF
游戏陪玩服务平台 - 静态部署包
生成时间: $(date)

部署说明:
1. 将此目录上传到静态文件服务器
2. 配置服务器指向index.html
3. 确保支持SPA路由重写

环境要求:
- 支持HTTPS
- 支持现代浏览器
- 支持JavaScript ES6+

注意事项:
- 确保Supabase环境变量已配置
- 检查跨域设置
- 配置正确的MIME类型
EOF
    
    log_success "静态部署包已创建: $deploy_dir"
    log_info "请将此目录上传到您的静态文件托管服务"
}

# 主函数
main() {
    local platform=${1:-"static"}
    
    log_info "开始部署游戏陪玩服务平台到: $platform"
    
    # 检查环境
    if ! check_environment; then
        log_error "环境检查失败，部署中止"
        exit 1
    fi
    
    # 构建项目
    if ! build_project; then
        log_error "项目构建失败，部署中止"
        exit 1
    fi
    
    # 检查构建结果
    if ! check_build; then
        log_error "构建结果检查失败，部署中止"
        exit 1
    fi
    
    # 执行部署
    if ! deploy_to_platform "$platform"; then
        log_error "部署失败"
        exit 1
    fi
    
    log_success "部署完成！"
}

# 显示帮助信息
show_help() {
    cat << EOF
使用说明: $0 [平台]

可选平台:
  vercel    - 部署到Vercel
  netlify   - 部署到Netlify  
  supabase  - 部署到Supabase（需要额外配置）
  static    - 创建静态部署包（默认）

示例:
  $0 vercel    # 部署到Vercel
  $0 static    # 创建静态部署包

环境要求:
  - Node.js 16+
  - npm 8+
  - 配置好的.env文件
EOF
}

# 参数处理
case "$1" in
    "-h"|"--help")
        show_help
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac