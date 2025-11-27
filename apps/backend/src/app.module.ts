import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [UploadModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
