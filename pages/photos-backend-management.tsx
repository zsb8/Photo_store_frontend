import React, { useState, useCallback } from 'react';
import { Layout, Menu, Card, Upload, Button, Form, Input, InputNumber, Space, message, Modal, Table, Image, Tag, Popconfirm, Progress } from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, HomeOutlined, PictureOutlined, ClearOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { photos, Photo, PhotoSize } from '../data/photos';
import { upload_photo, fileToBase64, get_all_photo_settings, get_photos_presigned_url, save_photo_settings, upload_bigphoto, delete_photo_from_dynamodb_s3 } from '../util/aws-api';
import styles from '../styles/photos-backend-management.module.css';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;

interface PhotoFormData {
  alt: string;
  description: string;
  sizes: {
    small: number;
    medium: number;
    large: number;
  };
}

const PhotosBackendManagement: React.FC = () => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState<string>('upload-photo');
  const [photoList, setPhotoList] = useState<Photo[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  
  // 上传进度相关状态
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');

  // 模拟上传进度更新
  const simulateProgress = (callback: (progress: number) => void, duration: number = 3000) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15; // 随机增加进度
      if (progress >= 90) {
        progress = 90; // 最多到90%，等待实际完成
        clearInterval(interval);
      }
      callback(progress);
    }, 200);
    
    return () => clearInterval(interval);
  };

  // 从API加载真实的图片数据
  React.useEffect(() => {
    const loadRealPhotoData = async () => {
      try {
        // 获取所有图片设置信息
        const photoSettingsResponse = await get_all_photo_settings();
        console.log('Photo settings response:', photoSettingsResponse);
        
        if (photoSettingsResponse.data && photoSettingsResponse.data.length > 0) {
          // 获取图片画廊数据（包含预授权链接）
          const galleryResponse = await get_photos_presigned_url();
          console.log('Gallery response:', galleryResponse);
          
          // 创建图片ID到预授权链接的映射
          const presignedUrlMap = new Map<string, string>();
          if (galleryResponse.data) {
            galleryResponse.data.forEach((item: any) => {
              presignedUrlMap.set(item.id, item.presigned_url);
            });
          }
          
          // 转换数据格式以匹配 Photo 接口
          const convertedPhotos: Photo[] = photoSettingsResponse.data.map((item: any, index: number) => {
            // 从价格信息中提取价格值
            const smallPrice = item.prices?.small?.S ? parseFloat(item.prices.small.S) : 5;
            const mediumPrice = item.prices?.medium?.S ? parseFloat(item.prices.medium.S) : 10;
            const largePrice = item.prices?.large?.S ? parseFloat(item.prices.large.S) : 20;
            
            return {
              id: item.id || `photo_${index}`, // 使用API返回的真实ID
              uniqueId: item.id || `photo_${index}`,
              src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
              alt: item.title || item.filename || `Photo ${index + 1}`,
              sizes: [
                { size: 'small', label: '小图片', price: smallPrice },
                { size: 'medium', label: '中图片', price: mediumPrice },
                { size: 'large', label: '大图片', price: largePrice }
              ],
              description: item.description || '暂无描述'
            };
          });
          
          setPhotoList(convertedPhotos);
          console.log('Loaded real photo data from API:', convertedPhotos);
        } else {
          // 如果没有API数据，使用默认数据
          setPhotoList(photos);
          console.log('No API photo data found, using default data');
        }
      } catch (error) {
        console.error('Error loading photo data from API:', error);
        // 如果API调用失败，尝试从本地存储加载
        try {
          const storedData = localStorage.getItem('photo_gallery_data');
          if (storedData) {
            const photoData = JSON.parse(storedData);
            const convertedPhotos: Photo[] = photoData.map((item: any, index: number) => ({
              id: index + 1,
              uniqueId: item.id || `photo_${index}`,
              src: item.presigned_url || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
              alt: item.filename || item.title || `Photo ${index + 1}`,
              sizes: [
                { size: 'small', label: '小图片', price: 5.00 },
                { size: 'medium', label: '中图片', price: 10.00 },
                { size: 'large', label: '大图片', price: 20.00 }
              ],
              description: item.description || '暂无描述'
            }));
            setPhotoList(convertedPhotos);
            console.log('Loaded photo data from localStorage as fallback:', convertedPhotos);
          } else {
            setPhotoList(photos);
            console.log('No fallback data found, using default data');
          }
        } catch (fallbackError) {
          console.error('Error loading fallback data:', fallbackError);
          setPhotoList(photos);
        }
      }
    };

    loadRealPhotoData();
  }, []);

  // 初始化表单默认值
  React.useEffect(() => {
    uploadForm.setFieldsValue({
      smallPrice: 5,
      mediumPrice: 10,
      largePrice: 20
    });
  }, [uploadForm]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  

  // 菜单项配置
  const menuItems = [
    {
      key: 'upload-photo',
      icon: <UploadOutlined />,
      label: '上传图片',
    },
    {
      key: 'edit-photos',
      icon: <EditOutlined />,
      label: '编辑图片信息',
    },
    {
      key: 'view-orders',
      icon: <EditOutlined />,
      label: '查看订单',
    },    
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '退出到主页',
    },
  ];

  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    if (key === 'home') {
      router.push('/');
      return;
    }
    setSelectedMenu(key);
  };

  // 处理图片上传（自动判断大小选择接口）
  const handlePhotoUpload = useCallback(async (values: any) => {
    try {
      console.log('表单数据:', values);
      console.log('价格数据:', {
        smallPrice: values.smallPrice,
        mediumPrice: values.mediumPrice,
        largePrice: values.largePrice
      });
      console.log('选择的图片:', selectedImage);
      
      // 优先使用selectedImage，如果没有则使用表单数据
      let file = null;
      if (selectedImage?.originFileObj) {
        file = selectedImage.originFileObj;
      } else if (values.image?.[0]?.originFileObj) {
        file = values.image[0].originFileObj;
      }
      
      if (!file) {
        message.error('请选择图片文件');
        return;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      const isLargeFile = fileSizeMB >= 2;
      
      console.log(`文件大小: ${fileSizeMB.toFixed(2)}MB, 使用${isLargeFile ? '大图' : '小图'}上传接口`);

      // 开始上传，显示进度条
      setIsUploading(true);
      setUploadProgress(0);
      setUploadFileName(file.name);
      setUploadStatus('准备上传...');
      
      // 启动进度模拟
      const stopProgress = simulateProgress((progress) => {
        setUploadProgress(progress);
        if (progress < 30) {
          setUploadStatus('正在准备文件...');
        } else if (progress < 60) {
          setUploadStatus('正在上传到AWS...');
        } else if (progress < 90) {
          setUploadStatus('正在处理图片...');
        }
      });
      
      try {
        let uploadResult;
        
        if (isLargeFile) {
          // 大图：使用upload_bigphoto直传S3
          uploadResult = await upload_bigphoto(
            file,
            file.name,
            file.type || 'image/jpeg',
            values.alt,
            values.description,
            {
              small: values.smallPrice || 5,
              medium: values.mediumPrice || 10,
              large: values.largePrice || 20
            }
          );
        } else {
          // 小图：使用upload_photo（Base64）
          const base64Data = await fileToBase64(file);
          uploadResult = await upload_photo(
            base64Data, 
            file.name, 
            values.alt, 
            values.description, 
            {
              small: values.smallPrice || 5,
              medium: values.mediumPrice || 10,
              large: values.largePrice || 20
            }
          );
        }
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message);
        }

        // 停止进度模拟，设置完成状态
        stopProgress();
        setUploadProgress(100);
        setUploadStatus('上传完成！');
        
        // 延迟一下显示完成状态
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadStatus('');
          setUploadFileName('');
          
          // 上传成功后，自动刷新图片数据以获取真实的API数据
          uploadForm.resetFields();
          // 重置后重新设置默认价格
          uploadForm.setFieldsValue({
            smallPrice: 5,
            mediumPrice: 10,
            largePrice: 20
          });
          setSelectedImage(null); // 清空选择的图片
          message.success(`图片上传成功！文件名: ${uploadResult.file_name} (${isLargeFile ? '大图直传' : '小图Base64'})`);
        }, 1000);
        
        // 延迟1秒后自动刷新图片数据，确保后端数据已保存
        setTimeout(async () => {
          try {
            message.loading('正在刷新图片数据...', 0);
            
            // 获取所有图片设置信息
            const photoSettingsResponse = await get_all_photo_settings();
            console.log('Photo settings response after upload:', photoSettingsResponse);
            
            if (photoSettingsResponse.data && photoSettingsResponse.data.length > 0) {
              // 获取图片画廊数据（包含预授权链接）
              const galleryResponse = await get_photos_presigned_url();
              console.log('Gallery response after upload:', galleryResponse);
              
              // 创建图片ID到预授权链接的映射
              const presignedUrlMap = new Map<string, string>();
              if (galleryResponse.data) {
                galleryResponse.data.forEach((item: any) => {
                  presignedUrlMap.set(item.id, item.presigned_url);
                });
              }
              
              // 转换数据格式以匹配 Photo 接口
              const convertedPhotos: Photo[] = photoSettingsResponse.data.map((item: any, index: number) => {
                // 从价格信息中提取价格值
                const smallPrice = item.prices?.small?.S ? parseFloat(item.prices.small.S) : 5;
                const mediumPrice = item.prices?.medium?.S ? parseFloat(item.prices.medium.S) : 10;
                const largePrice = item.prices?.large?.S ? parseFloat(item.prices.large.S) : 20;
                
                return {
                  id: item.id || `photo_${index}`, // 使用API返回的真实ID
                  uniqueId: item.id || `photo_${index}`,
                  src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
                  alt: item.title || item.filename || `Photo ${index + 1}`,
                  sizes: [
                    { size: 'small', label: '小图片', price: smallPrice },
                    { size: 'medium', label: '中图片', price: mediumPrice },
                    { size: 'large', label: '大图片', price: largePrice }
                  ],
                  description: item.description || '暂无描述'
                };
              });
              
              setPhotoList(convertedPhotos);
              message.destroy();
              console.log('Refreshed photo data after upload:', convertedPhotos);
            } else {
              message.destroy();
              message.warning('上传成功但未找到图片数据');
            }
          } catch (error) {
            message.destroy();
            console.error('Error refreshing photo data after upload:', error);
            message.error(`刷新图片数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }, 1000);
      } catch (uploadError) {
        // 停止进度模拟，显示错误状态
        stopProgress();
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
        setUploadFileName('');
        throw uploadError;
      }
    } catch (error) {
      // 确保在错误时也重置上传状态
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadFileName('');
      message.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [photoList, uploadForm, selectedImage]);


  

  // 打开编辑模态框
  const openEditModal = (photo: Photo) => {
    setEditingPhoto(photo);
    editForm.setFieldsValue({
      alt: photo.alt,
      description: photo.description,
      smallPrice: photo.sizes.find(s => s.size === 'small')?.price,
      mediumPrice: photo.sizes.find(s => s.size === 'medium')?.price,
      largePrice: photo.sizes.find(s => s.size === 'large')?.price,
    });
    setIsEditModalVisible(true);
  };

  // 保存编辑
  const handleEditSave = async (values: any) => {
    if (!editingPhoto) return;

    try {
      // 显示保存进度
      const loadingMessage = message.loading('正在保存图片信息...', 0);
      
      // 调用 save_photo_settings API 保存图片信息
      const saveResult = await save_photo_settings(
        editingPhoto.alt, // filename 使用图片标题
        values.alt, // title 使用新的标题
        values.description, // description 使用新的描述
        {
          small: values.smallPrice || 5,
          medium: values.mediumPrice || 10,
          large: values.largePrice || 20
        }, // prices 使用新的价格
        editingPhoto.id.toString() // record_id 使用图片ID，转换为字符串
      );

      if (!saveResult.success) {
        throw new Error(saveResult.message);
      }

      // 更新本地状态
      const updatedPhoto: Photo = {
        ...editingPhoto,
        alt: values.alt,
        description: values.description,
        sizes: [
          { size: 'small', label: '小图片', price: values.smallPrice || 5 },
          { size: 'medium', label: '中图片', price: values.mediumPrice || 10 },
          { size: 'large', label: '大图片', price: values.largePrice || 20 }
        ],
      };

      setPhotoList(prev => prev.map(photo => 
        photo.id === editingPhoto.id ? updatedPhoto : photo
      ));

      loadingMessage();
      setIsEditModalVisible(false);
      setEditingPhoto(null);
      message.success('图片信息更新成功！');
      
      // 刷新图片数据以获取最新信息
      setTimeout(async () => {
        try {
          const photoSettingsResponse = await get_all_photo_settings();
          if (photoSettingsResponse.data && photoSettingsResponse.data.length > 0) {
            const galleryResponse = await get_photos_presigned_url();
            const presignedUrlMap = new Map<string, string>();
            if (galleryResponse.data) {
              galleryResponse.data.forEach((item: any) => {
                presignedUrlMap.set(item.id, item.presigned_url);
              });
            }
            
            const convertedPhotos: Photo[] = photoSettingsResponse.data.map((item: any, index: number) => {
              const smallPrice = item.prices?.small?.S ? parseFloat(item.prices.small.S) : 5;
              const mediumPrice = item.prices?.medium?.S ? parseFloat(item.prices.medium.S) : 10;
              const largePrice = item.prices?.large?.S ? parseFloat(item.prices.large.S) : 20;
              
              return {
                id: item.id || `photo_${index}`,
                uniqueId: item.id || `photo_${index}`,
                src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
                alt: item.title || item.filename || `Photo ${index + 1}`,
                sizes: [
                  { size: 'small', label: '小图片', price: smallPrice },
                  { size: 'medium', label: '中图片', price: mediumPrice },
                  { size: 'large', label: '大图片', price: largePrice }
                ],
                description: item.description || '暂无描述'
              };
            });
            
            setPhotoList(convertedPhotos);
          }
        } catch (error) {
          console.error('Error refreshing photo data after edit:', error);
        }
      }, 1000);
      
    } catch (error) {
      message.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('Error saving photo settings:', error);
    }
  };

  // 删除图片
  const handleDeletePhoto = async (photoId: number) => {
    try {
      // 显示删除进度
      const loadingMessage = message.loading('正在删除图片...', 0);
      
      // 调用 delete_photo_from_dynamodb_s3 API 删除图片
      const deleteResult = await delete_photo_from_dynamodb_s3(photoId.toString());
      
      // 从本地状态中移除图片
      setPhotoList(prev => prev.filter(photo => photo.id !== photoId));
      
      loadingMessage();
      message.success(`图片删除成功！${deleteResult.result}`);
      
      // 延迟1秒后自动刷新图片数据，确保删除操作完成
      setTimeout(async () => {
        try {
          message.loading('正在刷新图片数据...', 0);
          
          // 获取所有图片设置信息
          const photoSettingsResponse = await get_all_photo_settings();
          console.log('Photo settings response after delete:', photoSettingsResponse);
          
          if (photoSettingsResponse.data && photoSettingsResponse.data.length > 0) {
            // 获取图片画廊数据（包含预授权链接）
            const galleryResponse = await get_photos_presigned_url();
            console.log('Gallery response after delete:', galleryResponse);
            
            // 创建图片ID到预授权链接的映射
            const presignedUrlMap = new Map<string, string>();
            if (galleryResponse.data) {
              galleryResponse.data.forEach((item: any) => {
                presignedUrlMap.set(item.id, item.presigned_url);
              });
            }
            
            // 转换数据格式以匹配 Photo 接口
            const convertedPhotos: Photo[] = photoSettingsResponse.data.map((item: any, index: number) => {
              // 从价格信息中提取价格值
              const smallPrice = item.prices?.small?.S ? parseFloat(item.prices.small.S) : 5;
              const mediumPrice = item.prices?.medium?.S ? parseFloat(item.prices.medium.S) : 10;
              const largePrice = item.prices?.large?.S ? parseFloat(item.prices.large.S) : 20;
              
              return {
                id: item.id || `photo_${index}`, // 使用API返回的真实ID
                uniqueId: item.id || `photo_${index}`,
                src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
                alt: item.title || item.filename || `Photo ${index + 1}`,
                sizes: [
                  { size: 'small', label: '小图片', price: smallPrice },
                  { size: 'medium', label: '中图片', price: mediumPrice },
                  { size: 'large', label: '大图片', price: largePrice }
                ],
                description: item.description || '暂无描述'
              };
            });
            
            setPhotoList(convertedPhotos);
            message.destroy();
            console.log('Refreshed photo data after delete:', convertedPhotos);
          } else {
            message.destroy();
            setPhotoList([]);
            message.info('所有图片已删除');
          }
        } catch (error) {
          message.destroy();
          console.error('Error refreshing photo data after delete:', error);
          message.error(`刷新图片数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }, 1000);
      
    } catch (error) {
      message.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('Error deleting photo:', error);
    }
  };

  // 处理图片选择变化
  const handleImageChange = (info: any) => {
    const file = info.fileList[0] || null;
    setSelectedImage(file);
    
    // 同步更新表单数据
    if (file) {
      uploadForm.setFieldsValue({ 
        image: [file],
        alt: file.name // 自动填充文件名作为标题
      });
    } else {
      uploadForm.setFieldsValue({ image: undefined });
    }
  };

  // 清除图片选择
  const clearImage = () => {
    setSelectedImage(null);
    uploadForm.setFieldsValue({ 
      image: undefined,
      alt: undefined // 同时清除自动填充的标题
    });
  };

  

  // 表格列配置
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
             fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
             onError={(e) => {
               console.error('Image load error for photo:', photo.id, photo.src);
             }}
           />
           {!photo.src || photo.src.startsWith('/placeholder-') && (
             <div style={{
               position: 'absolute',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               background: '#f5f5f5',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: '8px',
               color: '#999',
               borderRadius: '4px'
             }}>
               无图片
             </div>
           )}
         </div>
       ),
     },
         {
       title: '图片ID',
       dataIndex: 'id',
       key: 'id',
       width: 80,
     },
    {
      title: '标题',
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
          {photo.sizes.map(size => (
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
            onClick={() => openEditModal(photo)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这张图片吗？"
            onConfirm={() => handleDeletePhoto(photo.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 150,
    },
  ];

  // 渲染右侧内容
  const renderContent = () => {
    switch (selectedMenu) {
      case 'upload-photo':
        return (
          <Card title="上传图片" className={styles.contentCard}>
            <Form
              form={uploadForm}
              layout="vertical"
              onFinish={handlePhotoUpload}
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
                  onChange={handleImageChange}
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
                    <Button onClick={clearImage} icon={<ClearOutlined />}>
                      清除选择
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </Card>
        );

      case 'edit-photos':
        return (
          <Card title="编辑图片信息" className={styles.contentCard}>
            <div style={{ marginBottom: '16px' }}>
              <Button 
                type="primary" 
                icon={<PictureOutlined />}
                onClick={async () => {
                  try {
                    message.loading('正在刷新图片数据...', 0);
                    
                    // 获取所有图片设置信息
                    const photoSettingsResponse = await get_all_photo_settings();
                    console.log('Photo settings response:', photoSettingsResponse);
                    
                    if (photoSettingsResponse.data && photoSettingsResponse.data.length > 0) {
                      // 获取图片画廊数据（包含预授权链接）
                      const galleryResponse = await get_photos_presigned_url();
                      console.log('Gallery response:', galleryResponse);
                      
                      // 创建图片ID到预授权链接的映射
                      const presignedUrlMap = new Map<string, string>();
                      if (galleryResponse.data) {
                        galleryResponse.data.forEach((item: any) => {
                          presignedUrlMap.set(item.id, item.presigned_url);
                        });
                      }
                      
                      // 转换数据格式以匹配 Photo 接口
                      const convertedPhotos: Photo[] = photoSettingsResponse.data.map((item: any, index: number) => {
                        // 从价格信息中提取价格值
                        const smallPrice = item.prices?.small?.S ? parseFloat(item.prices.small.S) : 5;
                        const mediumPrice = item.prices?.medium?.S ? parseFloat(item.prices.medium.S) : 10;
                        const largePrice = item.prices?.large?.S ? parseFloat(item.prices.large.S) : 20;
                        
                        return {
                          id: item.id || `photo_${index}`, // 使用API返回的真实ID
                          uniqueId: item.id || `photo_${index}`,
                          src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
                          alt: item.title || item.filename || `Photo ${index + 1}`,
                          sizes: [
                            { size: 'small', label: '小图片', price: smallPrice },
                            { size: 'medium', label: '中图片', price: mediumPrice },
                            { size: 'large', label: '大图片', price: largePrice }
                          ],
                          description: item.description || '暂无描述'
                        };
                      });
                      
                      setPhotoList(convertedPhotos);
                      message.destroy();
                      message.success(`图片数据已刷新，共 ${convertedPhotos.length} 张图片`);
                      console.log('Refreshed photo data from API:', convertedPhotos);
                    } else {
                      message.destroy();
                      message.warning('未找到图片数据，请先上传图片');
                    }
                  } catch (error) {
                    message.destroy();
                    console.error('Error refreshing photo data:', error);
                    message.error(`刷新图片数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
                  }
                }}
              >
                刷新图片数据
              </Button>
              <span style={{ marginLeft: '12px', fontSize: '12px', color: '#666' }}>
                当前显示 {photoList.length} 张图片
              </span>
            </div>
            <Table
              dataSource={photoList}
              columns={columns}
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

      default:
        return (
          <Card title="欢迎使用后台管理系统" className={styles.contentCard}>
            <p>请从左侧菜单选择要执行的操作</p>
          </Card>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className={styles.header}>
        <div className={styles.headerContent}>
          <PictureOutlined className={styles.logo} />
          <h1 className={styles.title}>照片商店后台管理系统</h1>
        </div>
      </Header>
      
      <Layout>
        <Sider width={250} className={styles.sider}>
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
            className={styles.menu}
          />
        </Sider>
        
        <Content className={styles.content}>
          {renderContent()}
        </Content>
      </Layout>

      {/* 上传进度模态框 */}
      <Modal
        title="图片上传进度"
        open={isUploading}
        closable={false}
        maskClosable={false}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px', color: '#1890ff' }}>
              {uploadFileName}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {uploadStatus}
            </div>
          </div>
          
          <Progress
            percent={Math.round(uploadProgress)}
            status={uploadProgress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            style={{ marginBottom: '20px' }}
          />
          
          <div style={{ fontSize: '12px', color: '#999' }}>
            {uploadProgress < 100 ? '请耐心等待，不要关闭页面...' : '上传完成！'}
          </div>
        </div>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑图片信息"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingPhoto(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSave}
        >
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
                  prefix="$"
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存修改
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                setEditingPhoto(null);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PhotosBackendManagement;
