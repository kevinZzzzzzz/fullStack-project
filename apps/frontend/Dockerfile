# 前端Dockerfile

# 阶段1：构建前端
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 阶段2：使用Nginx提供静态文件服务
FROM docker.sharing8.cn/nginx:stable-alpine

# 复制构建产物到Nginx的静态文件目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置文件（可选）
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
