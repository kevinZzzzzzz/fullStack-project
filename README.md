# FullStack 项目文档

## 项目简介

这是一个基于 monorepo 架构的全栈项目，包含前端 React + Ant Design 和后端 NestJS 两个子项目。项目实现了一个文件上传系统，支持图片上传、断点续传等功能。

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design
- React Router
- Axios
- Vite

### 后端
- NestJS
- TypeScript
- Multer (文件上传)
- Express

## 项目结构

```
fullStack/
├── apps/
│   ├── frontend/          # 前端 React 项目
│   │   ├── src/
│   │   │   ├── assets/    # 静态资源
│   │   │   ├── pages/     # 页面组件
│   │   │   │   ├── HomePage.tsx      # 首页菜单
│   │   │   │   └── UploadPage.tsx     # 上传页面
│   │   │   ├── styles/    # 样式文件
│   │   │   ├── App.tsx    # 应用根组件
│   │   │   └── main.tsx   # 应用入口
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/           # 后端 NestJS 项目
│       ├── src/
│       │   ├── upload/    # 上传模块
│       │   │   ├── upload.controller.ts   # 上传控制器
│       │   │   ├── upload.module.ts       # 上传模块
│       │   │   └── upload.service.ts      # 上传服务
│       │   ├── app.module.ts   # 应用根模块
│       │   └── main.ts         # 应用入口
│       ├── uploads/       # 上传文件存储目录
│       ├── package.json
│       └── nest-cli.json
├── package.json
└── pnpm-workspace.yaml    # monorepo 配置
```

## 功能说明

### 首页菜单
- 使用 Grid 布局，每行 8 个菜单
- 每个菜单包含图标和文字
- 支持悬停效果和动画
- 响应式设计，适配不同屏幕尺寸

### 文件上传
- 支持图片上传，单文件最大 100MB
- 实时显示上传进度
- 支持暂停/继续上传
- 支持删除文件
- 上传列表展示
- 断点续传支持

## 启动方式

### 后端启动

1. 进入后端目录：
```bash
cd apps/backend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run start:dev
```

后端服务将运行在 http://localhost:3000

### 前端启动

1. 进入前端目录：
```bash
cd apps/frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端服务将运行在 http://localhost:5173

## 开发指南

### 前端开发

1. 页面组件位于 `src/pages/` 目录
2. 样式文件位于 `src/styles/` 目录
3. 使用 Ant Design 组件库
4. 使用 React Router 进行路由管理

### 后端开发

1. 模块开发遵循 NestJS 模块化架构
2. 上传功能主要在 `src/upload/` 目录
3. 配置文件位于 `src/main.ts`

## 构建说明

### 前端构建

```bash
cd apps/frontend
npm run build
```

构建产物将生成在 `dist/` 目录

### 后端构建

```bash
cd apps/backend
npm run build
```

构建产物将生成在 `dist/` 目录

## API 接口

### 文件上传

- **URL**: `/api/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `file`: 要上传的文件
- **Response**: 
  ```json
  {
    "message": "文件上传成功",
    "filename": "file-1234567890-1234567890.jpg",
    "originalname": "example.jpg",
    "size": 102400,
    "mimetype": "image/jpeg",
    "url": "http://localhost:3000/uploads/file-1234567890-1234567890.jpg"
  }
  ```

### 获取文件信息

- **URL**: `/api/upload/:filename`
- **Method**: `GET`
- **Response**: 
  ```json
  {
    "exists": true,
    "size": 102400
  }
  ```

### 上传文件块

- **URL**: `/api/upload/chunk`
- **Method**: `POST`
- **Response**: 
  ```json
  {
    "message": "文件块上传成功"
  }
  ```

## 注意事项

1. 上传的文件将存储在后端的 `uploads/` 目录
2. 支持的图片格式：JPG、PNG、GIF 等
3. 单文件最大限制：100MB
4. 后端服务需要先启动，前端才能正常访问 API
5. 开发环境下，前端通过 http://localhost:5173 访问，后端通过 http://localhost:3000 访问

## 部署指南

### 部署前准备

1. 确保服务器已安装 Node.js 18+ 和 npm
2. 确保服务器已安装 Git
3. 准备好数据库（如果需要）
4. 配置好域名和 SSL 证书（可选，用于生产环境）

### 前端部署

1. 克隆代码仓库：
```bash
git clone <repository-url>
cd fullStack/apps/frontend
```

2. 安装依赖：
```bash
npm install
```

3. 构建项目：
```bash
npm run build
```

4. 部署构建产物：
   - 将 `dist/` 目录下的所有文件复制到 Web 服务器的静态文件目录（如 Nginx 的 `html/` 目录）
   - 或者使用静态文件托管服务（如 Vercel、Netlify 等）

### 后端部署

1. 克隆代码仓库：
```bash
git clone <repository-url>
cd fullStack/apps/backend
```

2. 安装依赖：
```bash
npm install
```

3. 构建项目：
```bash
npm run build
```

4. 配置环境变量（可选）：
   - 创建 `.env` 文件，配置端口、数据库连接等信息
   - 例如：
     ```
     PORT=3000
     NODE_ENV=production
     ```

5. 启动服务：
   - 使用 PM2 管理进程（推荐）：
     ```bash
     npm install -g pm2
     pm2 start dist/main.js --name fullstack-backend
     pm2 save
     pm2 startup
     ```
   - 或者直接启动：
     ```bash
     npm run start:prod
     ```

### Nginx 配置（可选）

如果使用 Nginx 作为反向代理，可以参考以下配置：

```nginx
# 前端配置
server {
    listen 80;
    server_name frontend.example.com;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 后端配置
server {
    listen 80;
    server_name backend.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件访问
    location /uploads/ {
        alias /path/to/backend/uploads/;
        expires 30d;
    }
}
```

### 环境变量配置

#### 前端环境变量

在前端项目根目录创建 `.env` 文件：

```
VITE_API_URL=http://localhost:3000/api
```

#### 后端环境变量

在后端项目根目录创建 `.env` 文件：

```
PORT=3000
NODE_ENV=production
UPLOAD_DIR=./uploads
```

### 常见问题及解决方案

1. **前端无法访问后端 API**
   - 检查后端服务是否正常运行
   - 检查 CORS 配置是否正确
   - 检查前端 API URL 配置是否正确

2. **文件上传失败**
   - 检查上传目录权限是否正确
   - 检查文件大小限制是否设置正确
   - 检查 Multer 配置是否正确

3. **服务启动失败**
   - 检查端口是否被占用
   - 检查环境变量配置是否正确
   - 检查依赖是否安装完整

## 许可证

MIT
