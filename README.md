# 全栈聊天应用

这是一个全栈聊天应用，具有实时消息传递和文件上传功能。

## CI/CD 流水线

本项目使用 GitHub Actions 进行 CI/CD。CI/CD 流水线配置在 `.github/workflows/ci-cd.yml` 文件中。

### CI/CD 工作原理

1. **触发事件**：
   - 每次推送到 `main` 分支时，流水线会运行
   - 每次向 `main` 分支提交拉取请求时，流水线会运行

2. **作业**：
   - `build-and-test`：构建和测试前端和后端应用
   - `deploy`：将应用部署到生产环境（仅在推送到 main 分支时运行）

3. **build-and-test 作业步骤**：
   - 检出代码
   - 设置 Node.js
   - 安装前端依赖
   - 运行前端 lint
   - 构建前端
   - 安装后端依赖
   - 运行后端 lint
   - 构建后端
   - 运行后端测试

4. **deploy 作业步骤**：
   - 检出代码
   - 部署到生产环境（占位符，需要根据实际情况配置）

### 如何查看 CI/CD 执行情况

1. 进入您的 GitHub 仓库
2. 点击 "Actions" 标签页
3. 您将看到所有流水线运行的列表
4. 点击某个流水线运行可查看详细日志
5. 点击某个作业可查看步骤及其输出

### 如何配置部署

要配置实际部署，您需要修改 `.github/workflows/ci-cd.yml` 文件中的 `deploy` 作业。

#### 选项 1：SSH 部署

```yaml
- name: 通过 SSH 部署到生产环境
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USERNAME }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    script: |
      cd /path/to/your/app
      git pull origin main
      # 安装依赖并构建
      npm install
      npm run build
      # 重启应用
      pm2 restart app
```

#### 选项 2：Docker 部署

```yaml
- name: 构建并推送 Docker 镜像
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: your-dockerhub-username/your-image-name:latest

- name: 部署到 Docker Swarm
  run: |
    docker stack deploy -c docker-compose.yml your-app-name
```

#### 选项 3：云服务部署

```yaml
- name: 部署到 AWS S3
  uses: jakejarvis/s3-sync-action@master
  with:
    args: --acl public-read --follow-symlinks --delete
  env:
    AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: ${{ secrets.AWS_REGION }}
    SOURCE_DIR: ./apps/frontend/build
```

### 如何测试 CI/CD

1. 对代码进行一些修改
2. 将修改推送到 `main` 分支
3. 进入 GitHub 仓库的 "Actions" 标签页
4. 您将看到一个新的流水线运行正在启动
5. 等待流水线完成
6. 检查日志以查看是否一切通过

### 所需的 GitHub Secrets

您需要在 GitHub 仓库设置中添加以下 Secrets：

- 对于 SSH 部署：
  - `SERVER_HOST`：您的服务器 IP 地址或域名
  - `SERVER_USERNAME`：您的服务器用户名
  - `SERVER_SSH_KEY`：您的服务器 SSH 私钥

- 对于 Docker 部署：
  - `DOCKER_HUB_USERNAME`：您的 Docker Hub 用户名
  - `DOCKER_HUB_PASSWORD`：您的 Docker Hub 密码或访问令牌

- 对于 AWS 部署：
  - `AWS_S3_BUCKET`：您的 AWS S3 桶名称
  - `AWS_ACCESS_KEY_ID`：您的 AWS 访问密钥 ID
  - `AWS_SECRET_ACCESS_KEY`：您的 AWS 秘密访问密钥
  - `AWS_REGION`：您的 AWS 区域

## 项目结构

```
fullStack/
├── apps/
│   ├── backend/          # NestJS 后端
│   └── frontend/         # React 前端
├── .github/
│   └── workflows/
│       └── ci-cd.yml     # CI/CD 配置
├── docker-compose.yml    # Docker Compose 配置
└── package.json          # 根目录 package.json
```

## 快速开始

### 前提条件

- Node.js 18.x 或更高版本
- npm 或 pnpm

### 安装

1. 克隆仓库
2. 安装依赖：
   ```
   npm install
   ```
3. 启动开发服务器：
   ```
   # 启动前端
   cd apps/frontend
   npm run dev
   
   # 启动后端
   cd apps/backend
   npm run start:dev
   ```

## 许可证

MIT