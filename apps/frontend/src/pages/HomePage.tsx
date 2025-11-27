import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography } from 'antd';// 导入更多图标
import { 
  UploadOutlined, 
  MessageOutlined, 
  VideoCameraOutlined, 
  FileTextOutlined, 
  SettingOutlined, 
  UserOutlined, 
  BarChartOutlined, 
  CloudOutlined 
} from '@ant-design/icons';
import '../styles/HomePage.css';

const { Title } = Typography;

// 菜单数据
const menuItems = [
  {
    id: 1,
    title: '上传文件',
    icon: <UploadOutlined />,
    path: '/upload',
    color: '#4A90E2'
  },
  {
    id: 2,
    title: '聊天界面',
    icon: <MessageOutlined />,
    path: '/chat',
    color: '#9013FE'
  },
  {
    id: 3,
    title: '视频管理',
    icon: <VideoCameraOutlined />,
    path: '#',
    color: '#00B16A'
  },
  {
    id: 4,
    title: '文档管理',
    icon: <FileTextOutlined />,
    path: '#',
    color: '#F5AB35'
  },
  {
    id: 5,
    title: '系统设置',
    icon: <SettingOutlined />,
    path: '#',
    color: '#D24D57'
  },
  {
    id: 6,
    title: '用户管理',
    icon: <UserOutlined />,
    path: '#',
    color: '#8E44AD'
  },
  {
    id: 7,
    title: '数据分析',
    icon: <BarChartOutlined />,
    path: '#',
    color: '#3498DB'
  },
  {
    id: 8,
    title: '云存储',
    icon: <CloudOutlined />,
    path: '#',
    color: '#27AE60'
  }
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // 处理菜单点击
  const handleMenuClick = (path: string) => {
    if (path !== '#') {
      navigate(path);
    }
  };

  return (
    <div className="home-container">
      <div className="header">
        <Title level={1} className="title">系统菜单</Title>
      </div>
      <div className="menu-grid">
        {menuItems.map((item) => (
          <Card
            key={item.id}
            className="menu-card"
            hoverable
            onClick={() => handleMenuClick(item.path)}
            style={{
              background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}80 100%)`
            }}
          >
            <div className="menu-icon">
              {item.icon}
            </div>
            <Card.Meta 
              title={item.title} 
              style={{ color: 'white' }}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HomePage;