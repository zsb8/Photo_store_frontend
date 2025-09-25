import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { Card, Button, Typography, Space, Divider, message, Radio, Row, Col, Spin, Alert, Form, Input } from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/CartContext";
import ShoppingCart from "../../components/ShoppingCart";
import styles from "../../styles/home.module.css";
import { get_photo_info } from "../../util/aws-api";

const { Title, Paragraph, Text } = Typography;

// 图片信息接口定义
interface PhotoInfoData {
  filename: string;
  fileName: string;
  origin_size: string;
  prices: {
    small: { S: string };
    large: { S: string };
    medium: { S: string };
  };
  s3_path: string;
  setting_datetime: string;
  description: string;
  id: string;
  new_size: string;
  upload_datetime: string;
  s3_newsize_path: string;
  title: string;
  size?: string;
  topic?: string;
  type?: string;
  place?: string;
  photo_year?: string;
}

const PhotoDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, isInCart, cartItems, removeFromCart, clearCart, markAsPurchased } = useCart();
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [photoInfo, setPhotoInfo] = useState<PhotoInfoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [contactForm] = Form.useForm();
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  

  // 获取图片详细信息
  useEffect(() => {
    const fetchPhotoInfo = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching photo info for ID:', id);
        const result = await get_photo_info(id);
        
        if (result.success && result.data) {
          setPhotoInfo(result.data);
          console.log('Photo info received:', result.data);
        } else {
          setError(result.message || '获取图片信息失败');
          console.error('Failed to get photo info:', result.message);
        }
      } catch (error) {
        console.error('Error fetching photo info:', error);
        setError('获取图片信息时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoInfo();
  }, [id]);

  // 加载并保存联系方式到本地
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('contact_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        setContactInfo(parsed);
        contactForm.setFieldsValue(parsed);
      }
    } catch {}
  }, [contactForm]);

  const handleContactChange = (changed: any, all: any) => {
    setContactInfo(all);
    try { localStorage.setItem('contact_info', JSON.stringify(all)); } catch {}
  };


  // 从本地存储获取图片的预授权链接
  const getPresignedUrlFromStorage = (photoId: string): string | null => {
    try {
      const storedData = localStorage.getItem('photo_gallery_data');
      if (storedData) {
        const photoData = JSON.parse(storedData);
        const photo = photoData.find((p: any) => p.id === photoId);
        return photo ? photo.presigned_url : null;
      }
    } catch (error) {
      console.error('Failed to get presigned URL from localStorage:', error);
    }
    return null;
  };

  // 获取当前图片的预授权链接
  const presignedUrl = photoInfo ? getPresignedUrlFromStorage(photoInfo.id) : null;

  // 加载状态
  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>正在加载图片信息...</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !photoInfo) {
    return (
      <div className={styles.container}>
        <Title level={2}>照片未找到</Title>
        <Text type="secondary">{error || '无法加载图片信息'}</Text>
        <div style={{ marginTop: '16px' }}>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  // 价格选项
  const sizeOptions = [
    { size: 'small', label: '小图片', price: parseFloat(photoInfo.prices.small.S) },
    { size: 'medium', label: '中图片', price: parseFloat(photoInfo.prices.medium.S) },
    { size: 'large', label: '大图片', price: parseFloat(photoInfo.prices.large.S) }
  ];

  const selectedSizeData = sizeOptions.find(s => s.size === selectedSize);
  const currentPrice = selectedSizeData?.price || 0;

  const handleAddToCart = () => {
    // 校验联系方式
    const { name, phone, address } = contactInfo;
    const phoneOk = /[\d\s+\-()]{7,20}/.test(phone || '');
    if (!name || !address || !phoneOk ) {
      message.error('请先填写完整且有效的联系方式（姓名、电话、地址）');
      return;
    }
    if (photoInfo && selectedSizeData) {
      const cartItemId = `${photoInfo.id}-${selectedSize}`;
      addToCart({
        id: cartItemId,
        src: photoInfo.s3_newsize_path, // 使用S3路径作为图片源
        alt: `${photoInfo.title || photoInfo.filename} (${selectedSizeData.label})`,
        price: selectedSizeData.price,
        description: `${photoInfo.description || photoInfo.title} - ${selectedSizeData.label}`
      });
      // 存储一次联系方式，供后续购买页或后台使用
      try { localStorage.setItem('contact_info', JSON.stringify(contactInfo)); } catch {}
      message.success(`已添加${selectedSizeData.label}到购物车！`);
    }
  };

  const getCartItem = () => {
    const cartItemId = `${photoInfo.id}-${selectedSize}`;
    return cartItems.find(item => item.id === cartItemId);
  };

  const isCurrentSizeInCart = () => {
    const cartItemId = `${photoInfo.id}-${selectedSize}`;
    return isInCart(cartItemId);
  };

  return (
    <>
      <Head>
        <title>{photoInfo.title || photoInfo.filename} - Photo Store</title>
        <meta name="description" content={photoInfo.description || `照片 ${photoInfo.id} 的详细信息`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* 头部区域 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push("/")}
              size="middle"
            >
              返回首页
            </Button>
            <ShoppingCart 
              items={cartItems}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
            />
          </div>

          <Card style={{ 
            maxWidth: '900px', 
            margin: '0 auto',
            width: '100%'
          }}>
            <div className={styles.photoDetailContainer}>
              {/* 左侧：照片展示 */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.photoImageContainer}>
                  {presignedUrl ? (
                    <div
                      onClick={() => setIsPreviewOpen(true)}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        position: 'relative', 
                        cursor: 'zoom-in',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none'
                      }}
                    >
                      <Image
                        src={presignedUrl}
                        alt={photoInfo.title || photoInfo.filename}
                        fill
                        style={{ objectFit: 'cover' }}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onError={(e) => {
                          console.error('Image load error for presigned URL:', presignedUrl);
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      background: '#f5f5f5',
                      color: '#666'
                    }}>
                      <div style={{ fontSize: '16px', marginBottom: '8px' }}>图片加载中...</div>
                      <div style={{ fontSize: '12px' }}>正在获取预授权链接</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Title level={3} style={{ 
                    marginBottom: '8px',
                    fontSize: '24px'
                  }}>
                    {(photoInfo.title || photoInfo.filename)?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')}
                  </Title>
                  <Paragraph style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.5', 
                    marginBottom: '0' 
                  }}>
                    {photoInfo.description || '暂无描述'}
                  </Paragraph>
                  
                  {/* 图片信息 */}
                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                    <div>图片ID: {photoInfo.id}</div>
                    <div>上传时间: {new Date(photoInfo.upload_datetime).toLocaleString()}</div>
                    <div>设置时间: {new Date(photoInfo.setting_datetime).toLocaleString()}</div>
                    {photoInfo.size && (
                      <div>尺寸: {photoInfo.size}</div>
                    )}
                    {photoInfo.type && (
                      <div>主题: {photoInfo.topic}</div>
                    )}
                    {photoInfo.type && (
                      <div>类型: {photoInfo.type}</div>
                    )}
                    {photoInfo.place && (
                      <div>拍摄地点: {photoInfo.place}</div>
                    )}
                    {photoInfo.photo_year && (
                      <div>拍摄时间（年）: {photoInfo.photo_year}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 右侧：购买信息 */}
              <div className={styles.photoInfoContainer}>
                <div>
                  {/* 尺寸选择 */}
                  <div className={styles.sizeSelectionContainer}>
                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                      选择尺寸:
                    </Text>
                    <Radio.Group 
                      value={selectedSize} 
                      onChange={(e) => setSelectedSize(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <Row gutter={[12, 12]}>
                        {sizeOptions.map((sizeOption) => (
                          <Col span={8} key={sizeOption.size}>
                            <Card 
                              size="small"
                              className={styles.sizeCard}
                              style={{ 
                                border: selectedSize === sizeOption.size ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                backgroundColor: selectedSize === sizeOption.size ? '#f0f8ff' : 'white'
                              }}
                              onClick={() => setSelectedSize(sizeOption.size as 'small' | 'medium' | 'large')}
                            >
                              <Text strong style={{ 
                                fontSize: '14px', 
                                marginBottom: '4px',
                                lineHeight: '1.2'
                              }}>
                                {sizeOption.label}
                              </Text>
                              <Text style={{ 
                                fontSize: '16px', 
                                color: '#1890ff', 
                                fontWeight: 'bold',
                                lineHeight: '1.2'
                              }}>
                                CAD ${sizeOption.price}
                              </Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Radio.Group>
                  </div>

                  {/* 当前选择的价格 */}
                  <div className={styles.priceDisplay}>
                    <Text strong style={{ fontSize: '16px' }}>当前选择: </Text>
                    <Text style={{ fontSize: '18px', color: '#52c41a', fontWeight: 'bold' }}>
                      {selectedSizeData?.label} - CAD ${currentPrice}
                    </Text>
                  </div>
                </div>
                
                

                {/* 购买按钮 */}
                <div style={{ marginTop: '16px' }}>
                  <Alert 
                    type="info" 
                    showIcon 
                    message={<span style={{ fontSize: 12 }}>温馨提示</span>} 
                    description={<span style={{ fontSize: 12, lineHeight: 1.4 }}>购买为实物邮寄服务：请准确填写收件人的姓名、电话、邮寄地址与邮箱，我们将使用实物方式寄送照片。</span>} 
                    style={{ marginBottom: 8, padding: 8 }} 
                  />

                  {/* 联系方式表单 */}
                  <Form 
                    form={contactForm}
                    layout="vertical"
                    initialValues={contactInfo}
                    onValuesChange={handleContactChange}
                    style={{ background: '#fafafa', padding: 8, border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 10 }}
                    size="small"
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item label={<span style={{ fontSize: 12 }}>收件姓名</span>} name="name" rules={[{ required: true, message: '请输入姓名' }]} style={{ marginBottom: 8 }}> 
                          <Input placeholder="请输入收件人姓名" size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label={<span style={{ fontSize: 12 }}>收件电话</span>} name="phone" rules={[{ required: true, message: '请输入电话' }]} style={{ marginBottom: 8 }}> 
                          <Input placeholder="用于快递联系，如 +1 450-456-7890" size="small" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label={<span style={{ fontSize: 12 }}>邮寄地址</span>} name="address" rules={[{ required: true, message: '请输入邮寄地址' }]} style={{ marginBottom: 8 }}> 
                      <Input placeholder="街道、城市、省、邮编" size="small" />
                    </Form.Item>
                  </Form>

                  {/* 购买按钮 */}
                  <Button
                    type={getCartItem()?.purchased ? "default" : (isCurrentSizeInCart() ? "default" : "primary")}
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleAddToCart}
                    disabled={isCurrentSizeInCart()}
                    className={styles.purchaseButton}
                  >
                    {getCartItem()?.purchased ? "已购买" : (isCurrentSizeInCart() ? "已加入购物车" : "立即购买")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      {isPreviewOpen && presignedUrl && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}
            aria-label="关闭预览"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 70,
              height: 70,
              borderRadius: 35,
              border: 'none',
              background: '#000',
              color: '#fff',
              fontSize: 36,
              cursor: 'pointer',
              lineHeight: '70px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            ×
          </button>
          <img
            src={presignedUrl}
            alt={photoInfo.title || photoInfo.filename}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              borderRadius: 4,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
};

export default PhotoDetailPage;
