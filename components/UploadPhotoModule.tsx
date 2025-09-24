import React from 'react';
import { Card, Form, Upload, Input, InputNumber, Space, Button, Select } from 'antd';
import { PlusOutlined, UploadOutlined, ClearOutlined } from '@ant-design/icons';
import styles from '../styles/photos-backend-management.module.css';

const { TextArea } = Input;

interface UploadPhotoModuleProps {
  uploadForm: any;
  selectedImage: any;
  isUploading: boolean;
  onImageChange: (info: any) => void;
  onClearImage: () => void;
  onSubmit: (values: any) => void;
}

const UploadPhotoModule: React.FC<UploadPhotoModuleProps> = ({
  uploadForm,
  selectedImage,
  isUploading,
  onImageChange,
  onClearImage,
  onSubmit,
}) => {
  return (
    <Card title="上传图片" className={styles.contentCard}>
      <Form
        form={uploadForm}
        layout="vertical"
        onFinish={onSubmit}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          name="image"
          label="选择图片"
          rules={[{ required: true, message: '请选择图片文件' }]}
        >
          <Upload
            beforeUpload={() => false}
            accept="image/*"
            maxCount={1}
            listType="picture-card"
            fileList={selectedImage ? [selectedImage] : []}
            onChange={onImageChange}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
              showDownloadIcon: false,
            }}
          >
            {!selectedImage && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
          {selectedImage && (
            <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                <strong>文件名:</strong> {selectedImage.name}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                <strong>文件大小:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                <strong>文件类型:</strong> {selectedImage.type || '未知类型'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                <strong>上传方式:</strong> {selectedImage.size >= 2 * 1024 * 1024 ? '大图直传S3' : '小图Base64'}
              </p>
            </div>
          )}
        </Form.Item>

        <Form.Item
          name="alt"
          label="图片标题"
          rules={[{ required: true, message: '请输入图片标题' }]}
        >
          <Input placeholder="请输入图片标题" />
        </Form.Item>

        <Form.Item
          name="description"
          label="图片描述"
        >
          <TextArea rows={4} placeholder="请输入图片描述" />
        </Form.Item>

        <Form.Item label="价格设置">
          <Space>
            <Form.Item
              name="smallPrice"
              label="小图片价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                step={1}
                placeholder="5"
                prefix="$"
              />
            </Form.Item>
            <Form.Item
              name="mediumPrice"
              label="中图片价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                step={1}
                placeholder="10"
                prefix="$"
              />
            </Form.Item>
            <Form.Item
              name="largePrice"
              label="大图片价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                step={1}
                placeholder="20"
                prefix="$"
              />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item label="作品信息">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <Form.Item name="metaSize" label="尺寸">
                <Input placeholder="如：30x40 cm" />
              </Form.Item>
              <Form.Item name="metaType" label="类型">
                <Select style={{ width: 160 }} placeholder="请选择">
                  <Select.Option value="animal">动物</Select.Option>
                  <Select.Option value="flowers">花卉</Select.Option>
                  <Select.Option value="landscape">风光</Select.Option>
                  <Select.Option value="portrait">人像</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
            </Space>
            <Space wrap>
              <Form.Item name="metaPlace" label="拍摄地点">
                <Input placeholder="如：Banff, Canada" />
              </Form.Item>
              <Form.Item name="metaYear" label="拍摄时间（年）">
                <Input placeholder="如：2024" />
              </Form.Item>
            </Space>
          </Space>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<UploadOutlined />}
              loading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? '上传中...' : '上传图片'}
            </Button>
            {selectedImage && !isUploading && (
              <Button onClick={onClearImage} icon={<ClearOutlined />}>
                清除选择
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UploadPhotoModule;


