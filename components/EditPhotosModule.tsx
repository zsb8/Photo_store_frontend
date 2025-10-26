import React from 'react';
import { Card, Button, Table, Space, Tag, Image } from 'antd';
import { PictureOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../styles/photos-backend-management.module.css';
import { Photo } from '../data/photos';

interface EditPhotosModuleProps {
  photoList: Photo[];
  onRefresh: () => Promise<void> | void;
  onOpenEdit: (photo: Photo) => void;
  onDelete: (photoId: number) => void;
}

const EditPhotosModule: React.FC<EditPhotosModuleProps> = ({ photoList, onRefresh, onOpenEdit, onDelete }) => {
  const columns = [
    {
      title: '预览',
      key: 'preview',
      width: 80,
      render: (photo: Photo) => (
        <div style={{ position: 'relative' }}>
          <Image
            width={60}
            height={45}
            src={photo.src}
            alt={photo.alt}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      ),
    },
    {
      title: '图片ID',
      key: 'id',
      width: 120,
      render: (photo: Photo) => {
        // 格式化 EXIF 拍摄日期为 YYYY.MM.DD 格式
        const formatExifDate = (dateStr: string): string => {
          try {
            const datePart = (dateStr || '').split('T')[0];
            if (!datePart) return dateStr;
            return datePart.replace(/-/g, '.');
          } catch {
            return dateStr;
          }
        };

        // 解析EXIF信息获取拍摄日期
        let datePrefix = '';
        if ((photo as any).exifInfo) {
          try {
            const exifData = JSON.parse((photo as any).exifInfo);
            if (exifData.dateTaken) {
              datePrefix = `${formatExifDate(exifData.dateTaken)} - `;
            }
          } catch (error) {
            console.warn('Failed to parse EXIF info:', error);
          }
        }

        return `${datePrefix}${photo.filename_id || photo.id}`;
      },
    },
    {
      title: '文件名',
      dataIndex: 'alt',
      key: 'alt',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '价格',
      key: 'prices',
      render: (photo: Photo) => (
        <Space direction="vertical" size="small">
          {photo.sizes
            .filter(size => Number(size.price) > 0)
            .map(size => (
            <Tag key={size.size} color="blue">
              {size.label}: ${size.price}
            </Tag>
          ))}
        </Space>
      ),
      width: 200,
    },
    {
      title: '操作',
      key: 'actions',
      render: (photo: Photo) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onOpenEdit(photo)}
          >
            编辑
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => onDelete(photo.id)}
          >
            删除
          </Button>
        </Space>
      ),
      width: 150,
    },
  ];

  return (
    <Card title="编辑图片信息" className={styles.contentCard}>
      <div style={{ marginBottom: '16px' }}>
        <Button type="primary" icon={<PictureOutlined />} onClick={() => onRefresh()}>
          刷新图片数据
        </Button>
        <span style={{ marginLeft: '12px', fontSize: '12px', color: '#666' }}>
          当前显示 {photoList.length} 张图片
        </span>
      </div>
      <Table
        dataSource={photoList}
        columns={columns as any}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};

export default EditPhotosModule;


