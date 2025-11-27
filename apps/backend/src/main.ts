import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 启用CORS，允许所有源访问
  app.enableCors({
    origin: '*', // 允许所有源访问
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 配置静态文件服务，允许访问上传的文件
  app.useStaticAssets(join(__dirname, '../uploads'), {
    prefix: '/uploads/', // 访问前缀
  });

  // 配置WebSocket适配器，显式设置Socket.io路径
  class SocketAdapter extends IoAdapter {
    constructor(app: any) {
      super(app);
    }

    createIOServer(port: number, options?: ServerOptions) {
      const server = super.createIOServer(port, {
        ...options,
        path: '/socket.io', // 显式设置Socket.io路径
      });
      return server;
    }
  }

  app.useWebSocketAdapter(new SocketAdapter(app));

  await app.listen(process.env.PORT ?? 3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();
