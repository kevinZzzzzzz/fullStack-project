import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

// 消息类型
type MessageType = {
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    gender: 'male' | 'female';
  };
  receiver: string;
};

// 获取消息请求类型
type GetMessagesRequest = {
  limit: number;
  offset: number;
};

@WebSocketGateway({
  cors: {
    origin: '*', // 允许所有来源访问
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'], // 支持WebSocket和轮询
  path: '/socket.io', // 明确指定Socket.io路径
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  /**
   * 处理客户端连接
   * @param client WebSocket客户端
   */
  handleConnection(client: Socket) {
    console.log(`客户端连接: ${client.id}`);
  }

  /**
   * 处理客户端断开连接
   * @param client WebSocket客户端
   */
  handleDisconnect(client: Socket) {
    console.log(`客户端断开连接: ${client.id}`);
    // 移除用户
    this.chatService.removeUser(client.id);
    // 广播用户离开消息
    this.server.emit('user-disconnected', { socketId: client.id });
  }

  
  /**
   * 处理客户端注册用户信息
   * @param client WebSocket客户端
   * @param payload 用户信息
   */
  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { name: string; avatar: string; gender: 'male' | 'female' },
  ) {
    console.log(`用户注册: ${payload.name}, socketId: ${client.id}`);
    // 添加用户
    this.chatService.addUser(client.id, {
      ...payload,
      id: client.id,
      socketId: client.id,
    });
    // 广播用户加入消息
    this.server.emit('user-connected', {
      ...payload,
      socketId: client.id,
    });
    // 返回所有在线用户
    const users = this.chatService.getAllUsers();
    client.emit('register-response', users);
    return users;
  }

  /**
   * 处理客户端发送的消息
   * @param client WebSocket客户端
   * @param payload 消息内容
   */
  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageType,
  ) {
    console.log(`收到消息: ${payload.content}, 发送者: ${payload.sender.name}`);
    // 保存消息
    const savedMessage = this.chatService.saveMessage(payload);
    // 广播消息给所有客户端
    this.server.emit('new-message', savedMessage);
  }

  /**
   * 处理客户端获取历史消息
   * @param client WebSocket客户端
   * @param payload 请求参数
   */
  @SubscribeMessage('get-messages')
  handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetMessagesRequest,
  ) {
    const { limit = 20, offset = 0 } = payload;
    // 获取历史消息
    const messages = this.chatService.getMessages(limit, offset);
    // 返回历史消息
    client.emit('get-messages-response', messages);
    return messages;
  }

  /**
   * 处理客户端获取在线用户列表
   */
  @SubscribeMessage('get-users')
  handleGetUsers() {
    // 获取所有在线用户
    const users = this.chatService.getAllUsers();
    // 返回在线用户列表
    return users;
  }
}
