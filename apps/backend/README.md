# 后端项目文档

## 项目简介

这是一个基于 NestJS + TypeScript 的后端项目，主要实现了文件上传功能，支持图片上传、断点续传等功能。

## 技术栈

- NestJS
- TypeScript
- Multer (文件上传)
- Express

## 功能说明

1. **文件上传**：接收前端上传的图片文件，存储到本地 `uploads/` 目录，生成唯一文件名，返回上传成功的信息和文件 URL。
2. **断点续传支持**：提供获取文件信息 API 和文件块上传 API。
3. **CORS 和静态文件服务**：允许前端跨域访问，支持访问上传的文件。

## 项目结构

```
backend/
├── src/
│   ├── upload/    # 上传模块
│   │   ├── upload.controller.ts   # 上传控制器
│   │   ├── upload.module.ts       # 上传模块
│   │   └── upload.service.ts      # 上传服务
│   ├── app.module.ts   # 应用根模块
│   └── main.ts         # 应用入口
├── uploads/       # 上传文件存储目录
├── package.json
└── nest-cli.json
```

## 启动方式

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run start:dev
```

后端服务将运行在 http://localhost:3000

## 构建说明

```bash
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

## 开发指南

1. 模块开发遵循 NestJS 模块化架构
2. 上传功能主要在 `src/upload/` 目录
3. 配置文件位于 `src/main.ts`
4. 上传的文件将存储在 `uploads/` 目录

## 注意事项

1. 上传的文件将存储在 `uploads/` 目录
2. 支持的图片格式：JPG、PNG、GIF 等
3. 单文件最大限制：100MB
4. 开发环境下，前端通过 http://localhost:5173 访问，后端通过 http://localhost:3000 访问
