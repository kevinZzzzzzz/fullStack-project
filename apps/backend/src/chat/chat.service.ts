import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// 消息类型
export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    gender: 'male' | 'female';
  };
  receiver: string;
  timestamp: Date;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female';
  socketId: string;
}

@Injectable()
export class ChatService {
  // 存储在线用户
  private users: Map<string, User> = new Map();
  // 存储聊天消息
  private messages: Message[] = [];
  // 最大存储消息数量
  private readonly MAX_MESSAGES = 1000;
  // 聊天记录存储目录
  private readonly CHAT_DIR = join(__dirname, '../../chat');
  // 聊天记录文件路径
  private readonly CHAT_FILE = join(this.CHAT_DIR, 'messages.json');

  constructor() {
    // 初始化聊天记录目录
    this.initChatDir();
    // 加载历史消息
    this.loadMessages();
  }

  /**
   * 初始化聊天记录目录
   */
  private initChatDir() {
    // 检查目录是否存在，不存在则创建
    if (!existsSync(this.CHAT_DIR)) {
      mkdirSync(this.CHAT_DIR, { recursive: true });
      console.log(`聊天记录目录已创建: ${this.CHAT_DIR}`);
    }

    // 检查文件是否存在，不存在则创建空文件
    if (!existsSync(this.CHAT_FILE)) {
      writeFileSync(this.CHAT_FILE, JSON.stringify([], null, 2), 'utf-8');
      console.log(`聊天记录文件已创建: ${this.CHAT_FILE}`);
    }
  }

  /**
   * 加载历史消息
   */
  private loadMessages() {
    try {
      // 读取聊天记录文件
      const data = readFileSync(this.CHAT_FILE, 'utf-8');
      // 解析JSON数据并添加类型断言
      const messages = JSON.parse(data) as Array<{
        id: string;
        content: string;
        sender: {
          id: string;
          name: string;
          avatar: string;
          gender: 'male' | 'female';
        };
        receiver: string;
        timestamp: string | number | Date;
      }>;
      // 转换时间戳为Date对象
      this.messages = messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      console.log(`已加载 ${this.messages.length} 条历史消息`);
    } catch (error) {
      console.error('加载历史消息失败:', error);
      // 如果加载失败，使用空数组
      this.messages = [];
    }
  }

  /**
   * 保存消息到文件
   */
  private saveMessagesToFile() {
    try {
      // 将消息转换为JSON字符串
      const data = JSON.stringify(this.messages, null, 2);
      // 写入文件
      writeFileSync(this.CHAT_FILE, data, 'utf-8');
    } catch (error) {
      console.error('保存消息到文件失败:', error);
    }
  }

  /**
   * 添加用户
   * @param socketId WebSocket连接ID
   * @param user 用户信息
   */
  addUser(socketId: string, user: User) {
    this.users.set(socketId, user);
  }

  /**
   * 移除用户
   * @param socketId WebSocket连接ID
   */
  removeUser(socketId: string) {
    this.users.delete(socketId);
  }

  /**
   * 获取用户信息
   * @param socketId WebSocket连接ID
   */
  getUser(socketId: string): User | undefined {
    return this.users.get(socketId);
  }

  /**
   * 获取所有在线用户
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 保存消息
   * @param message 消息内容
   */
  saveMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date(),
    };

    // 保存消息到内存，超过最大数量则删除最早的消息
    this.messages.push(newMessage);
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages.shift();
    }

    // 保存消息到文件
    this.saveMessagesToFile();

    return newMessage;
  }

  /**
   * 获取消息列表（分页）
   * @param limit 每页数量
   * @param offset 偏移量
   */
  getMessages(limit: number = 20, offset: number = 0): Message[] {
    const start = Math.max(0, this.messages.length - offset - limit);
    const end = this.messages.length - offset;
    return this.messages.slice(start, end);
  }

  /**
   * 获取消息总数
   */
  getMessagesCount(): number {
    return this.messages.length;
  }
}
