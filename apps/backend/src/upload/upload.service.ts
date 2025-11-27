import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  // 确保上传目录存在
  ensureUploadDir() {
    const uploadDir = join(__dirname, '../../uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
  }

  // 删除文件
  deleteFile(filePath: string) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  // 获取文件URL
  getFileUrl(filename: string) {
    return `http://localhost:3000/uploads/${filename}`;
  }
}
