import { Controller, Post, UploadedFile, UseInterceptors, Res, Req, Get, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import type { Response, Request } from 'express';
import { join } from 'path';

@Controller('api')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {
    // 确保上传目录存在
    this.uploadService.ensureUploadDir();
  }

  // 处理文件上传
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      return { message: '没有文件被上传' };
    }

    // 返回上传成功的信息
    return {
      message: '文件上传成功',
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.uploadService.getFileUrl(file.filename),
    };
  }

  // 断点续传支持 - 获取文件信息
  @Get('upload/:filename')
  async getFileInfo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(__dirname, '../../uploads', filename);
    try {
      // 检查文件是否存在
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return res.json({
          exists: true,
          size: stats.size,
        });
      } else {
        return res.json({
          exists: false,
          size: 0,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: '获取文件信息失败',
        error: error.message,
      });
    }
  }

  // 断点续传支持 - 上传文件块
  @Post('upload/chunk')
  async uploadChunk(@Req() req: Request, @Res() res: Response) {
    try {
      // 这里可以实现断点续传的逻辑
      // 例如：接收文件块，合并文件等
      return res.status(200).json({
        message: '文件块上传成功',
      });
    } catch (error) {
      return res.status(500).json({
        message: '文件块上传失败',
        error: error.message,
      });
    }
  }
}
