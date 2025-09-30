import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Menu, Card, Upload, Button, Form, Input, InputNumber, Space, message, Modal, Table, Image, Tag, Popconfirm, DatePicker, Select, Typography } from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, HomeOutlined, PictureOutlined, ClearOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { photos, Photo, PhotoSize } from '../data/photos';
import { upload_photo, fileToBase64, get_all_photo_settings, get_photos_presigned_url, save_photo_settings, upload_bigphoto, delete_photo_from_dynamodb_s3 } from '../util/aws-api';
import styles from '../styles/photos-backend-management.module.css';
import { RouteGuard } from '../components/route-guard';
import UploadPhotoModule from '../components/UploadPhotoModule';
import EditPhotosModule from '../components/EditPhotosModule';
import ViewOrdersModule from '../components/ViewOrdersModule';
import { extractDateTaken, extractImageExifInfo, formatExifInfo, formatExifInfoReadable, parseExifInfoFromJson } from '../util/image-exif-utils';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface PhotoFormData {
  alt: string;
  description: string;
  sizes: {
    small: number;
    medium: number;
    large: number;
    special?: number;
  };
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: number;
  customer_email?: string;
}

const PhotosBackendManagement: React.FC = () => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState<string>('upload-photo');
  const [photoList, setPhotoList] = useState<Photo[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  
  // 上传状态
  const [isUploading, setIsUploading] = useState(false);

  // 订单相关状态
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

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
            const specialPrice = item.prices?.special?.S ? parseFloat(item.prices.special.S) : 0;
            
            return {
              id: item.id || `photo_${index}`, // 使用API返回的真实ID
              uniqueId: item.id || `photo_${index}`,
              filename_id: item.filename_id, // 从DynamoDB获取filename_id
              src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
              alt: item.title || item.filename || `Photo ${index + 1}`,
              sizes: [
                { size: 'small', label: '小图片', price: smallPrice },
                { size: 'medium', label: '中图片', price: mediumPrice },
                { size: 'large', label: '大图片', price: largePrice },
                { size: 'special', label: '特殊尺寸', price: specialPrice }
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
                { size: 'large', label: '大图片', price: 20.00 },
                { size: 'special', label: '特殊尺寸', price: 0 }
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
      largePrice: 20,
      specialPrice: 100
    });
  }, [uploadForm]);

  // 加载支付记录
  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const response = await fetch('/api/payment-history?limit=100');
      const data = await response.json();
      
      if (response.ok) {
        setPayments(data.sessions || []);
      } else {
        message.error('加载支付记录失败');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      message.error('加载支付记录失败');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // 当选择查看订单菜单时加载数据
  useEffect(() => {
    if (selectedMenu === 'view-orders') {
      loadPayments();
    }
  }, [selectedMenu, loadPayments]);
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
      // 清除会话并返回主页
      if (typeof window !== 'undefined') {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('session_time');
        localStorage.removeItem('username');
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
      }
      router.push('/');
      return;
    }
    setSelectedMenu(key);
  };


  // 处理图片上传（自动判断大小选择接口）
  const handlePhotoUpload = useCallback(async (values: any) => {
    try {
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

      // 提取图片拍摄日期
      console.log('正在提取图片拍摄日期...');
      const dateTaken = await extractDateTaken(file);
      if (dateTaken) {
        console.log('提取到拍摄日期:', dateTaken);
      } else {
        console.log('未找到拍摄日期信息');
      }

      // 提取完整的EXIF信息
      const exifInfo = await extractImageExifInfo(file);
      console.log('完整EXIF信息:', formatExifInfo(exifInfo));

      // 提取file.name 这个文件名里面的数字串作为filename_id
      const filename_id = file.name.match(/\d+/)?.[0] || '';
      console.log('提取的文件名数字串:', filename_id);

      // 开始上传
      setIsUploading(true);
      const loadingMessage = message.loading(`正在上传图片到AWS${isLargeFile ? '(大图直传)' : ''}...`, 0);
      
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
              large: values.largePrice || 20,
              special: values.specialPrice ?? 100
            },
            values.metaSize,
            values.metaTopic,
            values.metaType,
            values.metaPlace,
            values.metaYear ? String(values.metaYear) : undefined,
            formatExifInfo(exifInfo),
            filename_id
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
              large: values.largePrice || 20,
              special: values.specialPrice ?? 100
            },
            values.metaSize,
            values.metaTopic,
            values.metaType,
            values.metaPlace,
            values.metaYear ? String(values.metaYear) : undefined,
            formatExifInfo(exifInfo),
            filename_id
          );
        }
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message);
        }

        // 上传成功
        loadingMessage();
        setIsUploading(false);
        
        // 上传成功后，自动刷新图片数据以获取真实的API数据
        uploadForm.resetFields();
        // 重置后重新设置默认价格
        uploadForm.setFieldsValue({
          smallPrice: 5,
          mediumPrice: 10,
          largePrice: 20,
          specialPrice: 100
        });
        setSelectedImage(null); // 清空选择的图片
        message.success(`图片上传成功！文件名: ${uploadResult.file_name} (${isLargeFile ? '大图直传' : '小图Base64'})`);
        
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
                const specialPrice = item.prices?.special?.S ? parseFloat(item.prices.special.S) : 0;
                
              return {
                id: item.id || `photo_${index}`, // 使用API返回的真实ID
                uniqueId: item.id || `photo_${index}`,
                filename_id: item.filename_id, // 从DynamoDB获取filename_id
                src: presignedUrlMap.get(item.id) || item.s3_newsize_path || `/placeholder-${index + 1}.jpg`,
                alt: item.title || item.filename || `Photo ${index + 1}`,
                sizes: [
                  { size: 'small', label: '小图片', price: smallPrice },
                  { size: 'medium', label: '中图片', price: mediumPrice },
                  { size: 'large', label: '大图片', price: largePrice },
                  { size: 'special', label: '特殊尺寸', price: specialPrice }
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
        loadingMessage();
        setIsUploading(false);
        throw uploadError;
      }
    } catch (error) {
      setIsUploading(false);
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
      specialPrice: 100,
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
          large: values.largePrice || 20,
          special: values.specialPrice ?? 100
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
                filename_id: item.filename_id, // 从DynamoDB获取filename_id
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
      const loadingMessage = message.loading('图片...', 0);
      
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
                filename_id: item.filename_id, // 从DynamoDB获取filename_id
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

  // 支付记录相关函数
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const getStatusTag = (status: string) => {
    const config = {
      paid: { color: 'green', text: '已支付' },
      pending: { color: 'orange', text: '处理中' },
      failed: { color: 'red', text: '失败' },
      canceled: { color: 'gray', text: '已取消' },
    };
    const statusConfig = config[status as keyof typeof config] || { color: 'default', text: status };
    return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
  };

  

  // 筛选支付记录
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchText || 
      payment.id.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchText.toLowerCase()) ||
      (payment.customer_email && payment.customer_email.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    const matchesDate = !dateRange || (
      payment.created >= new Date(dateRange[0]).getTime() / 1000 &&
      payment.created <= new Date(dateRange[1]).getTime() / 1000
    );
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  

  // 支付记录表格列配置
  const paymentColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: PaymentRecord) => (
        <Text strong>{formatAmount(amount, record.currency)}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '客户邮箱',
      dataIndex: 'customer_email',
      key: 'customer_email',
      render: (email: string) => email || '-',
    },
    {
      title: '支付时间',
      dataIndex: 'created',
      key: 'created',
      render: (created: number) => formatDate(created),
    },
    
  ];

  // 图片管理表格列配置
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
          <UploadPhotoModule
            uploadForm={uploadForm}
            selectedImage={selectedImage}
            isUploading={isUploading}
            onImageChange={handleImageChange}
            onClearImage={clearImage}
            onSubmit={handlePhotoUpload}
          />
        );

      case 'edit-photos':
        return (
          <EditPhotosModule
            photoList={photoList}
            onRefresh={async () => {
              // 复用当前页面已有刷新逻辑
              try {
                message.loading('正在刷新图片数据...', 0);
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
                      filename_id: item.filename_id, // 从DynamoDB获取filename_id
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
            onOpenEdit={openEditModal}
            onDelete={handleDeletePhoto}
          />
        );

      case 'view-orders':
        return (
          <ViewOrdersModule
            payments={payments}
            filteredPayments={filteredPayments}
            paymentsLoading={paymentsLoading}
            searchText={searchText}
            setSearchText={setSearchText}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setDateRange={setDateRange}
            loadPayments={loadPayments}
            formatAmount={formatAmount}
            formatDate={formatDate}
            getStatusTag={getStatusTag}
          />
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
    <RouteGuard>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className={styles.header}>
          <div className={styles.headerContent}>
            <PictureOutlined className={styles.logo} />
            <h1 className={styles.title}>图片商店后台管理系统</h1>
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
              label="图片描述（须标准JSON格式）"
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
                <Form.Item
                  name="specialPrice"
                  label="特殊尺寸价格"
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
    </RouteGuard>
  );
};

export default PhotosBackendManagement;
