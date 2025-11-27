import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Upload,
  Button,
  Typography,
  Card,
  Progress,
  message,
  List,
  Space,
} from "antd"
import {
  UploadOutlined,
  LeftOutlined,
  DeleteOutlined,
  PauseOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons"
import axios, { type AxiosProgressEvent } from "axios"
import "../styles/UploadPage.css"

const { Title, Text } = Typography

// 上传文件类型
interface UploadFile {
  uid: string
  name: string
  status: "uploading" | "done" | "error"
  percent: number
  size: number
  url?: string
  file?: File // 保存原始文件对象
  // 添加自定义状态字段，因为Ant Design的UploadFileStatus不支持paused状态
  customStatus?: "paused"
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  // 返回首页
  const handleBack = () => {
    navigate("/")
  }

  // 格式化文件大小
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  // 处理文件上传前的验证
  const beforeUpload = (file: File) => {
    // 验证文件类型，只允许图片
    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      message.error("只能上传图片文件！")
      return Upload.LIST_IGNORE
    }

    // 验证文件大小，最大100MB
    const isLt100M = file.size / 1024 / 1024 < 100
    if (!isLt100M) {
      message.error("图片大小不能超过100MB！")
      return Upload.LIST_IGNORE
    }

    // 添加到文件列表，保存原始文件对象
    const newFile: UploadFile = {
      uid: `file-${Date.now()}`,
      name: file.name,
      status: "error", // 使用error作为默认状态，因为Ant Design的UploadFileStatus不支持paused
      customStatus: "paused", // 使用自定义字段保存paused状态
      percent: 0,
      size: file.size,
      file: file, // 保存原始文件对象
    }

    setFileList([...fileList, newFile])
    return false // 阻止自动上传，使用手动上传
  }

  // 处理文件上传
  const handleUpload = async (file: UploadFile, fileObj: File) => {
    try {
      setUploading(true)

      // 创建FormData
      const formData = new FormData()
      formData.append("file", fileObj)

      // 模拟上传进度
      const config = {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setFileList((prev) =>
              prev.map((item) =>
                item.uid === file.uid
                  ? { ...item, percent: percentCompleted, status: "uploading" }
                  : item
              )
            )
          }
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }

      // 发送上传请求到后端（Docker环境中使用容器名称访问）
      const response = await axios.post(
        "http://backend:3000/api/upload",
        formData,
        config
      )

      if (response.status === 201) {
        message.success(`${file.name} 上传成功！`)
        setFileList((prev) =>
          prev.map((item) =>
            item.uid === file.uid
              ? { ...item, status: "done", url: response.data.url }
              : item
          )
        )
      }
    } catch {
      message.error(`${file.name} 上传失败！`)
      setFileList((prev) =>
        prev.map((item) =>
          item.uid === file.uid ? { ...item, status: "error" } : item
        )
      )
    } finally {
      setUploading(false)
    }
  }

  // 开始上传
  const startUpload = (file: UploadFile) => {
    if (file.file) {
      handleUpload(file, file.file)
    } else {
      message.error("文件对象不存在，无法上传")
    }
  }

  // 暂停上传
  const pauseUpload = (file: UploadFile) => {
    setFileList((prev) =>
      prev.map((item) =>
        item.uid === file.uid
          ? { ...item, status: "error", customStatus: "paused" }
          : item
      )
    )
    message.info(`${file.name} 已暂停上传`)
  }

  // 删除文件
  const deleteFile = (file: UploadFile) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid))
    message.info(`${file.name} 已删除`)
  }

  // 自定义上传组件
  const uploadProps = {
    beforeUpload,
    fileList: fileList,
    onRemove: (file: any) => {
      deleteFile(file as UploadFile)
    },
    showUploadList: false,
  }

  return (
    <div className="upload-container">
      <div className="header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={handleBack}
          className="back-button"
        >
          返回首页
        </Button>
        <Title level={2} className="title">
          文件上传
        </Title>
      </div>

      <div className="upload-content">
        {/* 上传区域 */}
        <Card className="upload-card">
          <Title level={4}>选择图片上传</Title>
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              type="primary"
              size="large"
              disabled={uploading}
            >
              点击上传
            </Button>
            <Text type="secondary" style={{ marginLeft: 10 }}>
              支持 JPG、PNG、GIF 等图片格式，单文件最大 100MB
            </Text>
          </Upload>
        </Card>

        {/* 上传列表 */}
        <Card className="file-list-card">
          <Title level={4}>上传列表</Title>
          {fileList.length === 0 ? (
            <div className="empty-list">
              <Text type="secondary">暂无上传文件</Text>
            </div>
          ) : (
            <List
              dataSource={fileList}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    file.status === "uploading" ? (
                      <Button
                        icon={<PauseOutlined />}
                        size="small"
                        onClick={() => pauseUpload(file)}
                      >
                        暂停
                      </Button>
                    ) : file.customStatus === "paused" ? (
                      <Button
                        icon={<PlayCircleOutlined />}
                        size="small"
                        onClick={() => startUpload(file)}
                      >
                        继续
                      </Button>
                    ) : null,
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={() => deleteFile(file)}
                    >
                      删除
                    </Button>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={file.name}
                    description={
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        <Text type="secondary">
                          {formatFileSize(file.size)}
                        </Text>
                        <Progress
                          percent={file.percent}
                          status={
                            file.status === "error"
                              ? "exception"
                              : file.status === "done"
                                ? "success"
                                : "active"
                          }
                        />
                        <Text
                          type={
                            file.status === "error"
                              ? "danger"
                              : file.status === "done"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {file.status === "uploading" && "上传中..."}
                          {file.status === "done" && "上传完成"}
                          {file.status === "error" &&
                            file.customStatus !== "paused" &&
                            "上传失败"}
                          {file.customStatus === "paused" && "已暂停"}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  )
}

export default UploadPage
