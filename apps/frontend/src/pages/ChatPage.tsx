import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Input, Button, message, Avatar, Spin } from 'antd';
import { SendOutlined, LeftOutlined, CameraOutlined, FileImageOutlined, SmileOutlined } from '@ant-design/icons';
import io, { Socket } from 'socket.io-client';
import UserInfoModal from '../components/UserInfoModal';
import '../styles/ChatPage.css';

interface User {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female';
  socketId?: string;
}

interface Message {
  id: string;
  content?: string;
  images?: string[];
  sender: {
    id: string;
    name: string;
    avatar: string;
    gender: 'male' | 'female';
  };
  receiver: string;
  timestamp: Date;
  type?: 'text' | 'image';
}

interface UserInfo {
  name: string;
  gender: 'male' | 'female';
  avatar: string;
  phone?: string;
  email?: string;
}



// 表情数据
const emojiData = {
  smileys: ['😊', '😂', '🤣', '😃', '😄', '😁', '😆', '😅', '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🧂', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🧉', '🍶', '🥄', '🍴', '🥣', '🥡', '🥢', '🧂'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🚣', '🏊', '🧗', '🚵', '🚴', '🤸', '🤺', '🤾', '🏌️', '🚣', '🏊', '🧗', '🚵', '🚴', '🏇', '🧘', '🏄', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🚣', '🏊', '🧗', '🚵', '🚴', '🏇', '🧘', '🏄'],
  travel: ['✈️', '🚂', '🚊', '🚉', '🚞', '🚆', '🚄', '🚅', '🚈', '🚇', '🚝', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚨', '🚕', '🚖', '🚗', '🚘', '🚙', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚨', '🚕', '🚖', '🚗', '🚘', '🚙', '🏎️', '🚚', '🚛', '🚜', '🚲', '🛵', '🏍️', '🛺', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚥', '🚦', '🚧', '🛑', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚥', '🚦', '🚧', '🛑', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '🏖️', '🏝️', '🏜️', '🏞️', '🏟️', '🎡', '🎢', '🎠', '⛲', '🏖️', '🏝️', '🏜️', '🏞️', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🕋', '⛩️', '🗼', '🗽', '🗿', '🌋', '🗻', '🏔️', '⛰️', '🏕️', '⛺', '🏖️', '🏝️', '🏜️', '🏞️', '🏟️', '🎡', '🎢', '🎠', '⛲'],
  objects: ['💡', '🔦', '🕯️', '🪔', '🏮', '🪤', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🔧', '🪛', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🔩', '⚙️', '🗜️', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🗿', '📿', '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🩹', '🩺', '🩻', '🧬', '🦠', '💡', '🔦', '🕯️', '🪔', '🏮', '🪤', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🔧', '🪛', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🔩', '⚙️', '🗜️', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🗿', '📿', '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🩹', '🩺', '🩻', '🧬', '🦠'],
};

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null); // 使用 ref 跟踪 Socket 实例，避免异步状态更新问题
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState<User[]>([]); // 在线用户列表
  const [showAtUsers, setShowAtUsers] = useState(false); // 是否显示@用户列表
  const [atPosition, setAtPosition] = useState(-1); // @符号的位置
  const [atText, setAtText] = useState(''); // @后面输入的文本
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // 是否显示表情选择器
  const [selectedImages, setSelectedImages] = useState<Array<{ file: File; preview: string }>>([]); // 选中的多张图片
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); // 输入框引用
  const emojiPickerRef = useRef<HTMLDivElement>(null); // 表情选择器引用
  const lastScrollTopRef = useRef(0);

  // 请求浏览器通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

  // 显示浏览器通知
  const showNotification = useCallback((title: string, options: NotificationOptions) => {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      return;
    }
    
    // 检查通知权限
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      // 如果权限未被拒绝，请求权限
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, options);
        }
      });
    }
  }, []);

  // 初始化WebSocket连接
  const initSocketConnection = useCallback((userInfo: UserInfo) => {
    // 确保只创建一个Socket实例，使用ref而不是state来检查
    if (socketRef.current) {
      return;
    }
    
    // 直接使用固定的WebSocket服务器地址
    // 确保无论从哪个平台访问，都连接到正确的后端服务器
    const wsUrl = 'http://192.168.120.178:3000';
    
    // 配置Socket.io选项，增加连接超时和传输限制
    const socketOptions = {
      timeout: 5000,
      transports: ['websocket'], // 优先使用WebSocket传输，避免长轮询导致的Payload Too Large错误
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    };
    
    const newSocket = io(wsUrl, socketOptions);
    
    // 保存到ref中，避免异步状态更新问题
    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      // 注册用户
      newSocket.emit('register', {
        id: `user-${Date.now()}`,
        ...userInfo
      });
      
      // 连接成功后自动加载历史消息
      newSocket.emit('get-messages', { limit: 20, offset: 0 });
    });

    newSocket.on('connect_error', () => {
      message.error('WebSocket连接失败，请刷新页面重试');
    });

    // 只添加一次new-message监听器
    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // 检查消息中是否包含@当前用户
      if (userInfo && message.sender.id !== userInfo.name) {
        // 改进正则表达式，确保能正确匹配@用户名
        const mentionedUsers = (message.content || '').match(/@([\w\u4e00-\u9fa5]+)/g) || [];
        
        const isMentioned = mentionedUsers.some(mention => {
          const username = mention.substring(1);
          return username === userInfo.name;
        });
        
        // 如果被提及，显示浏览器通知
        if (isMentioned) {
          showNotification(`有人@了你`, {
            body: message.content,
            icon: message.sender.avatar || 'https://via.placeholder.com/40',
            tag: message.id,
            requireInteraction: true, // 改为true，确保通知不会自动消失
            renotify: true
          });
        }
      }
      
      // 新消息添加后滚动到底部
      setTimeout(() => {
        const endRef = messagesEndRef.current;
        if (endRef) {
          endRef.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });

    newSocket.on('register-response', (users: User[]) => {
      setUsers(users);
    });
    
    // 监听用户连接事件
    newSocket.on('user-connected', (user: User) => {
      setUsers(prev => [...prev, user]);
    });
    
    // 监听用户断开事件
    newSocket.on('user-disconnected', (data: { socketId: string }) => {
      setUsers(prev => prev.filter(user => user.socketId !== data.socketId));
    });

    // 只添加一次get-messages-response监听器
    newSocket.on('get-messages-response', (historyMessages: Message[]) => {
      if (historyMessages.length > 0) {
        setMessages(prev => [...historyMessages, ...prev]);
        setOffset(20);
        if (historyMessages.length < 20) {
          setHasMore(false);
        }
        
        // 历史消息加载完成后滚动到底部
        setTimeout(() => {
          const endRef = messagesEndRef.current;
          if (endRef) {
            endRef.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });

  }, [setMessages, setUsers, setOffset, setHasMore, showNotification]);

  // 初始化组件 - 只在组件挂载时执行一次
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      const parsedUserInfo = JSON.parse(savedUserInfo);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserInfo(parsedUserInfo);
      initSocketConnection(parsedUserInfo);
      // 请求通知权限
      requestNotificationPermission();
    } else {
      setShowUserModal(true);
    }

    return () => {
      // 使用socketRef.current而不是socket状态来断开连接
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null; // 重置ref
      }
    };
  }, [initSocketConnection]);

  // 添加全局点击事件监听器，点击非表情包弹窗区域关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && emojiPickerRef.current) {
        // 检查点击目标是否在表情包弹窗内部
        if (!emojiPickerRef.current.contains(event.target as Node)) {
          setShowEmojiPicker(false);
        }
      }
    };

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // 移除事件监听器
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]); // 只监听showEmojiPicker状态变化

  // 保存和恢复滚动位置，防止表情包弹窗导致页面滚动
  useEffect(() => {
    // 保存当前滚动位置
    const scrollY = window.scrollY;
    
    if (showEmojiPicker) {
      // 弹窗显示时，固定body位置，防止页面滚动
      const body = document.body;
      const html = document.documentElement;
      
      // 保存当前滚动位置
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      body.style.width = '100%';
      html.style.overflow = 'hidden';
    } else {
      // 弹窗隐藏时，恢复滚动位置
      const body = document.body;
      const html = document.documentElement;
      
      // 获取保存的滚动位置
      const top = parseInt(body.style.top || '0', 10);
      
      // 恢复body样式
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      body.style.width = '';
      html.style.overflow = '';
      
      // 恢复滚动位置
      window.scrollTo(0, -top);
    }
  }, [showEmojiPicker]);

  // 处理用户信息提交
  const handleUserInfoSubmit = (info: UserInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(info));
    setUserInfo(info);
    setShowUserModal(false);
    initSocketConnection(info);
  };

  // 发送消息 - 支持多张图片
  const handleSendMessage = () => {
    if (!socketRef.current) {
      message.error('WebSocket连接已断开，请刷新页面重试');
      return;
    }
    
    if (!userInfo) {
      message.error('用户信息不存在，请重新登录');
      return;
    }
    
    if (selectedImages.length === 0 && !inputValue.trim()) {
      message.warning('请输入消息内容或选择图片');
      return;
    }

    const messageData = {
      id: `msg-${Date.now()}`,
      content: inputValue.trim(),
      images: selectedImages.map(img => img.preview),
      sender: {
        id: `user-${Date.now()}`,
        name: userInfo.name,
        avatar: userInfo.avatar,
        gender: userInfo.gender
      },
      receiver: 'all',
      timestamp: new Date(),
      type: selectedImages.length > 0 ? 'image' : 'text'
    };

    try {
      // 使用socketRef.current而不是socket状态
      socketRef.current.emit('send-message', messageData);
      
      // 清空输入框和图片预览
      setInputValue('');
      setSelectedImages([]);
      
      message.success('消息发送成功');
    } catch {
      message.error('消息发送失败，请重试');
    }
  };

  // 截图功能
  const handleScreenshot = () => {
    // 检查浏览器是否支持截图API
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      })
      .then(stream => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // 停止流
            stream.getTracks().forEach(track => track.stop());
            
            // 将截图转换为base64
            canvas.toDataURL('image/png');
            
            // 这里可以将截图发送到服务器或显示在聊天中
            message.success('截图成功');
          }
        };
      })
      .catch(() => {
        message.error('截图失败，请检查浏览器权限');
      });
    } else {
      message.error('当前浏览器不支持截图功能');
    }
  };

  // 图片上传功能 - 支持多张图片
  const handleImageUpload = () => {
    // 创建一个隐藏的input元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true; // 支持选择多张图片
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      if (files.length === 0) return;
      
      // 处理每张选中的图片
      files.forEach(file => {
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
          message.error(`${file.name} 图片大小不能超过10MB`);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target?.result as string;
          // 保存图片预览到数组
          setSelectedImages(prev => [...prev, { file, preview: base64Image }]);
        };
        reader.readAsDataURL(file);
      });
      
      message.success(`已选择 ${files.length} 张图片`);
    };
    input.click();
  };

  // 移除单张图片预览
  const removeImagePreview = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // 清空所有图片预览
  const clearAllImages = () => {
    setSelectedImages([]);
  };

  // 表情功能
  const handleEmoji = () => {
    // 切换表情选择器显示状态
    setShowEmojiPicker(!showEmojiPicker);
  };

  // 选择表情
  const handleEmojiSelect = (emoji: string) => {
    // 将表情插入到输入框中
    setInputValue(prev => prev + emoji);
    
    // 聚焦输入框
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // 关闭表情选择器
    setShowEmojiPicker(false);
  };

  // 加载历史消息
  const loadHistoryMessages = useCallback(() => {
    if (!socketRef.current || loadingHistory || !hasMore) return;

    setLoadingHistory(true);
    const container = messagesContainerRef.current;
    if (container) {
      lastScrollTopRef.current = container.scrollTop;
    }

    // 使用socketRef.current而不是socket状态
    socketRef.current.emit('get-messages', { limit: 20, offset });
    // 移除重复的监听器，只使用initSocketConnection中添加的监听器
    // 因为socket.on('get-messages-response')已经在initSocketConnection中添加了
  }, [loadingHistory, hasMore, offset]);

  // 处理滚动事件，实现下拉加载
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop } = container;
    
    // 当滚动到顶部附近时加载历史消息
    if (scrollTop < 50 && !loadingHistory && hasMore) {
      loadHistoryMessages();
    }
  }, [loadingHistory, hasMore, loadHistoryMessages]);

  // 监听滚动事件
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // 确保聊天室始终保持在底部，不受表情包弹窗影响
  useEffect(() => {
    // 只在组件挂载时滚动到底部一次
    const endRef = messagesEndRef.current;
    if (endRef) {
      endRef.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  // 渲染消息项
  const renderMessageItem = (message: Message, index: number) => {
    // 使用消息ID和索引组合作为key，避免重复
    const uniqueKey = `${message.id}-${index}`;
    // 修复消息方向判断，比较的是sender.name和userInfo.name
    const isOwnMessage = userInfo && message.sender.name === userInfo.name;
    
    return (
      <div key={uniqueKey} className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
        <div className="message-content">
          {!isOwnMessage && (
            <Avatar src={message.sender.avatar} className="message-avatar">
              {message.sender.name.charAt(0)}
            </Avatar>
          )}
          <div className={`message-bubble ${isOwnMessage ? 'own-bubble' : 'other-bubble'}`}>
            {/* 支持多张图片显示 */}
            {(message.images && message.images.length > 0) && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
              }}>
                {message.images.map((image, imgIndex) => (
                  <div 
                    key={imgIndex}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`聊天图片 ${imgIndex + 1}`} 
                      className="message-image"
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onClick={() => {
                        // 点击预览大图
                        const img = new Image();
                        img.src = image;
                        img.style.maxWidth = '90vw';
                        img.style.maxHeight = '90vh';
                        img.style.borderRadius = '8px';
                        img.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                        img.autoPlay = true;
                        img.loop = true;
                        img.playsInline = true;
                        
                        // 创建预览容器
                        const previewContainer = document.createElement('div');
                        previewContainer.style.position = 'fixed';
                        previewContainer.style.top = '0';
                        previewContainer.style.left = '0';
                        previewContainer.style.width = '100vw';
                        previewContainer.style.height = '100vh';
                        previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                        previewContainer.style.display = 'flex';
                        previewContainer.style.alignItems = 'center';
                        previewContainer.style.justifyContent = 'center';
                        previewContainer.style.zIndex = '9999';
                        previewContainer.style.cursor = 'pointer';
                        
                        // 添加关闭功能
                        previewContainer.addEventListener('click', () => {
                          document.body.removeChild(previewContainer);
                        });
                        
                        previewContainer.appendChild(img);
                        document.body.appendChild(previewContainer);
                      }}
                      autoPlay
                      loop
                      playsInline
                    />
                  </div>
                ))}
              </div>
            )}
            {message.content && (
              <div className="message-text">{message.content}</div>
            )}
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
          {isOwnMessage && (
            <Avatar src={message.sender.avatar} className="message-avatar">
              {message.sender.name.charAt(0)}
            </Avatar>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-layout">
      <div className="chat-container">
        <div className="chat-header">
          <Button 
            type="text" 
            icon={<LeftOutlined />} 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            返回
          </Button>
          <div className="chat-title">聊天室</div>
        </div>
        
        <div className="chat-content" ref={messagesContainerRef}>
          <div className="messages-container">
            {loadingHistory && (
              <div className="loading-history">
                <Spin size="small" /> 加载历史消息...
              </div>
            )}
            
            {messages.map(renderMessageItem)}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="chat-footer">
          <div className="input-container">
            {/* 功能区 */}
            <div className="input-features">
              <Button 
                type="text" 
                icon={<CameraOutlined />} 
                onClick={handleScreenshot}
                className="feature-button"
              >
                截图
              </Button>
              <Button 
                type="text" 
                icon={<FileImageOutlined />} 
                onClick={handleImageUpload}
                className="feature-button"
              >
                图片
              </Button>
              <Button 
                type="text" 
                icon={<SmileOutlined />} 
                onClick={handleEmoji}
                className="feature-button"
              >
                表情
              </Button>
            </div>
            
            {/* 使用React Portal渲染表情选择器，完全脱离聊天室DOM树 */}
            {showEmojiPicker && ReactDOM.createPortal(
              <div ref={emojiPickerRef} style={{
                position: 'fixed',
                bottom: '120px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 40px)',
                maxWidth: '500px',
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                zIndex: 9999,
                marginBottom: '8px',
                maxHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                willChange: 'transform',
                overflow: 'hidden'
              }}>
                {/* 直接显示表情列表，移除分类标签 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  padding: '12px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: '300px'
                }}>
                  {/* 直接显示所有表情，不再按分类 */}
                  {[...emojiData.smileys, ...emojiData.animals, ...emojiData.food, ...emojiData.activities, ...emojiData.travel, ...emojiData.objects]
                    .slice(0, 100)
                    .map((emoji, index) => (
                      <button
                        key={`emoji-${index}-${emoji}`}
                        onClick={() => handleEmojiSelect(emoji)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                </div>
              </div>,
              document.body // 渲染到document.body中，完全脱离聊天室DOM树
            )}
            
            {/* 输入区域 */}
            <div className="input-area">
              <div style={{ position: 'relative' }}>
                {/* 图片预览区域 - 支持多张图片 */}
                {selectedImages.length > 0 && (
                  <div style={{
                    marginBottom: '10px',
                    padding: '8px',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    position: 'relative'
                  }}>
                    {/* 多张图片预览 */}
                    {selectedImages.map((imageData, index) => (
                      <div 
                        key={index}
                        style={{
                          position: 'relative',
                          width: '50px',
                          height: '50px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}
                      >
                        <img 
                          src={imageData.preview} 
                          alt={`预览图片 ${index + 1}`} 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onClick={() => {
                            // 点击预览大图
                            const img = new Image();
                            img.src = imageData.preview;
                            img.style.maxWidth = '90vw';
                            img.style.maxHeight = '90vh';
                            img.style.borderRadius = '8px';
                            img.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                            img.autoPlay = true;
                        img.loop = true;
                        img.playsInline = true;
                            
                            // 创建预览容器
                            const previewContainer = document.createElement('div');
                            previewContainer.style.position = 'fixed';
                            previewContainer.style.top = '0';
                            previewContainer.style.left = '0';
                            previewContainer.style.width = '100vw';
                            previewContainer.style.height = '100vh';
                            previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                            previewContainer.style.display = 'flex';
                            previewContainer.style.alignItems = 'center';
                            previewContainer.style.justifyContent = 'center';
                            previewContainer.style.zIndex = '9999';
                            previewContainer.style.cursor = 'pointer';
                            
                            // 添加关闭功能
                            previewContainer.addEventListener('click', () => {
                              document.body.removeChild(previewContainer);
                            });
                            
                            previewContainer.appendChild(img);
                            document.body.appendChild(previewContainer);
                          }}
                          autoPlay
                          loop
                          playsInline
                        />
                        {/* 删除按钮 */}
                        <div 
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            backgroundColor: 'rgba(255, 77, 79, 0.9)',
                            color: 'white',
                            fontSize: '12px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡，避免触发图片预览
                            removeImagePreview(index);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          ×
                        </div>
                      </div>
                    ))}
                    
                    {/* 清空所有图片按钮 */}
                    <div style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={clearAllImages}
                        style={{
                          fontSize: '11px',
                          color: '#ff4d4f',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        清空
                      </button>
                    </div>
                  </div>
                )}
                
                <Input.TextArea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputValue(value);
                    
                    // 检测@符号
                    const lastAtIndex = value.lastIndexOf('@');
                    if (lastAtIndex !== -1) {
                      // 检查@符号是否是最后一个字符，或者后面没有空格
                      const afterAt = value.substring(lastAtIndex + 1);
                      if (afterAt.indexOf(' ') === -1) {
                        setAtPosition(lastAtIndex);
                        setAtText(afterAt);
                        setShowAtUsers(true);
                      } else {
                        setShowAtUsers(false);
                      }
                    } else {
                      setShowAtUsers(false);
                    }
                  }}
                  onPressEnter={(e) => {
                    e.preventDefault(); // 阻止默认的换行行为
                    handleSendMessage();
                  }}
                  placeholder="请输入消息..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className="message-input"
                />
                
                {/* @用户列表 */}
                {showAtUsers && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    marginBottom: '8px'
                  }}>
                    {users
                      .filter(user => user.name.toLowerCase().includes(atText.toLowerCase()))
                      .map(user => (
                        <div
                          key={user.id}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onClick={() => {
                            // 插入@用户名到输入框
                            const beforeAt = inputValue.substring(0, atPosition);
                            const afterAt = inputValue.substring(atPosition + atText.length + 1);
                            const newValue = `${beforeAt}@${user.name} ${afterAt}`;
                            setInputValue(newValue);
                            setShowAtUsers(false);
                            
                            // 聚焦输入框
                            if (inputRef.current) {
                              inputRef.current.focus();
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <Avatar src={user.avatar} size={24}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSendMessage}
                className="send-button"
                disabled={!inputValue.trim() && selectedImages.length === 0}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <UserInfoModal
        visible={showUserModal}
        onCancel={() => setShowUserModal(false)}
        onOk={handleUserInfoSubmit}
      />
    </div>
  );
};

export default ChatPage;