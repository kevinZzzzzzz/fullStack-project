import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface UserInfo {
  name: string;
  gender: 'male' | 'female';
  avatar: string;
  phone?: string;
  email?: string;
}

interface UserInfoModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (userInfo: UserInfo) => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm<UserInfo>();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      onOk(values);
      message.success('个人信息保存成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const normFile = (info: { fileList?: Array<{ uid: string; name: string; status: string; url?: string }> } | Array<{ uid: string; name: string; status: string; url?: string }>) => {
    if (Array.isArray(info)) {
      return info;
    }
    return info?.fileList;
  };

  return (
    <Modal
      title="填写个人信息"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          确定
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          gender: 'male',
        }}
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>

        <Form.Item
          name="gender"
          label="性别"
          rules={[{ required: true, message: '请选择性别' }]}
        >
          <Select placeholder="请选择性别">
            <Select.Option value="male">男</Select.Option>
            <Select.Option value="female">女</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="avatar"
          label="头像"
          rules={[{ required: true, message: '请上传头像' }]}
          getValueFromEvent={normFile}
        >
          <Upload
            name="avatar"
            listType="picture-circle"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>上传头像</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机"
        >
          <Input placeholder="请输入手机号码" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
        >
          <Input placeholder="请输入邮箱地址" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserInfoModal;