import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { Card, Button, Typography, Space, Divider, message, Radio, Row, Col, Spin, Alert } from "antd";
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
}

const PhotoDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, isInCart, cartItems, removeFromCart, clearCart, markAsPurchased } = useCart();
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [photoInfo, setPhotoInfo] = useState<PhotoInfoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    if (photoInfo && selectedSizeData) {
      const cartItemId = `${photoInfo.id}-${selectedSize}`;
      addToCart({
        id: cartItemId,
        src: photoInfo.s3_newsize_path, // 使用S3路径作为图片源
        alt: `${photoInfo.title || photoInfo.filename} (${selectedSizeData.label})`,
        price: selectedSizeData.price,
        description: `${photoInfo.description || photoInfo.title} - ${selectedSizeData.label}`
      });
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
                    <Image
                      src={presignedUrl}
                      alt={photoInfo.title || photoInfo.filename}
                      fill
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        console.error('Image load error for presigned URL:', presignedUrl);
                      }}
                    />
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
                <div style={{ marginTop: 'auto' }}>
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
    </>
  );
};

export default PhotoDetailPage;
