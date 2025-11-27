# 前端项目文档

## 项目简介

这是一个基于 React + TypeScript + Ant Design 的前端项目，主要实现了文件上传功能。

## 技术栈

- React 18
- TypeScript
- Ant Design
- React Router
- Axios
- Vite

## 功能说明

1. **首页菜单**：使用 Grid 布局，每行 8 个菜单，包含图标和文字，支持悬停效果和动画。
2. **文件上传**：支持图片上传，单文件最大 100MB，实时显示上传进度，支持暂停/继续上传，支持删除文件。

## 项目结构

```
frontend/
├── src/
│   ├── assets/    # 静态资源
│   ├── pages/     # 页面组件
│   │   ├── HomePage.tsx      # 首页菜单
│   │   └── UploadPage.tsx     # 上传页面
│   ├── styles/    # 样式文件
│   ├── App.tsx    # 应用根组件
│   └── main.tsx   # 应用入口
├── package.json
└── vite.config.ts
```

## 启动方式

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

前端服务将运行在 http://localhost:5173

## 构建说明

```bash
npm run build
```

构建产物将生成在 `dist/` 目录

## 开发指南

1. 页面组件位于 `src/pages/` 目录
2. 样式文件位于 `src/styles/` 目录
3. 使用 Ant Design 组件库
4. 使用 React Router 进行路由管理
5. 使用 Axios 进行 HTTP 请求

## 注意事项

1. 前端服务需要后端服务支持，后端服务地址为 http://localhost:3000
2. 上传的文件将发送到后端服务，并存储在后端的 `uploads/` 目录
3. 支持的图片格式：JPG、PNG、GIF 等
4. 单文件最大限制：100MB
