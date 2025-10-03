import React, { useState } from 'react';
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
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // 子类别选项配置
  const getSubcategoryOptions = (topic: string) => {
    const subcategoryMap: { [key: string]: string[] } = {
      '新品': ['新品'],
      '自然风光': ['山脉', '海洋', '森林', '沙漠', '动物', '花卉', '烟花', '瀑布', '鸟禽', '冰雪', '江海', '夜景', '极光', '星空', '航拍', '微距'],
      '城市建筑': ['地标', '街景', '夜景'],
      '静物': ['物品'],
      '抽象与艺术': ['光影', '色彩', '纹理', '极简', '创意'],
      '人文与生活': ['人像', '街景', '情绪'],
      '其他': ['其他']
    };
    return subcategoryMap[topic] || [];
  };

  const handleTopicChange = (value: string) => {
    setSelectedTopic(value);
    // 清空子类别选择
    uploadForm.setFieldsValue({ metaType: undefined });
  };
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
          label="选择图片(不大于10M)"
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

        {/* <Form.Item
          name="alt"
          label="图片标题"
          rules={[{ required: true, message: '请输入图片标题' }]}
        >
          <Input placeholder="请输入图片标题" />
        </Form.Item> */}

        <Form.Item
          name="description"
          label="图片描述"
        >
          <TextArea rows={1} placeholder="请输入固定格式三语图片描述。如果留空，将自动由AI生成三语的图片描述" />
        </Form.Item>

        <Form.Item label="售价">
          <Space>
            <Form.Item
              name="smallPrice"
              label="小图片价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                step={1}
                placeholder="0"
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
                placeholder="0"
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
                placeholder="0"
                prefix="$"
              />
            </Form.Item>
            <Form.Item
              name="specialPrice"
              label="特殊尺寸价格"
            >
              <InputNumber
                min={0}
                step={1}
                placeholder="0"
                prefix="$"
              />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item label="作品信息">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <Form.Item name="metaSize" label="尺寸">
                <Select style={{ width: 200 }} placeholder="请选择尺寸">
                  <Select.Option value="6*8英寸，152*203毫米">小（6*8英寸，152*203毫米）</Select.Option>
                  <Select.Option value="8*12英寸，203*305毫米">中（8*12英寸，203*305毫米）</Select.Option>
                  <Select.Option value="12*18英寸，305*457毫米">大（12*18英寸，305*457毫米）</Select.Option>
                  <Select.Option value="Special">特殊（X*Y英寸，M*N毫米）</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="metaTopic" label="主题">
                <Select style={{ width: 160 }} placeholder="请选择主题" onChange={handleTopicChange}>
                  <Select.Option value="新品">新品</Select.Option>
                  <Select.Option value="自然风光">自然风光</Select.Option>
                  <Select.Option value="城市建筑">城市建筑</Select.Option>
                  <Select.Option value="静物">静物</Select.Option>
                  <Select.Option value="抽象与艺术">抽象与艺术</Select.Option>
                  <Select.Option value="人文与生活">人文与生活</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="metaType" label="子类别">
                <Select 
                  style={{ width: 160 }} 
                  placeholder="请选择子类别"
                  disabled={!selectedTopic}
                >
                  {getSubcategoryOptions(selectedTopic).map(option => (
                    <Select.Option key={option} value={option}>{option}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Space>
            <Space wrap>
              <Form.Item name="metaPlace" label="拍摄地点(国家/目的地)">
                <Input placeholder="如：Banff, Canada" />
              </Form.Item>
              {/* <Form.Item name="metaYear" label="拍摄时间（年）">
                <Input placeholder="如：2024" />
              </Form.Item> */}
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


