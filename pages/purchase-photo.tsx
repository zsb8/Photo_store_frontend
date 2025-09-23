import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card, Button, Typography, Space, Divider, message, Result } from 'antd';
import { ShoppingCartOutlined, HomeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import PaymentButton from '../components/PaymentButton';
import { CartItem } from '../components/ShoppingCart';
import { useCart } from '../contexts/CartContext';
import PhotoImage from '../components/PhotoImage';
import { get_photos_presigned_url } from '../util/aws-api';
import styles from '../styles/home.module.css';

const { Title, Text } = Typography;

const PurchasePhotoPage: React.FC = () => {
  const router = useRouter();
  const { markAsPurchased } = useCart();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [thumbRefreshCounter, setThumbRefreshCounter] = useState(0);

  // 辅助函数：提取并格式化文件名和尺寸
  const formatFileNameWithSize = (item: CartItem) => {
    const idStr = String(item.id);
    if (idStr.includes('-')) {
      const [photoId, size] = idStr.split('-');
      // 从alt字段中提取文件名，如果没有alt则使用photoId
      let fileName = item.alt || photoId;
      
      // 如果alt包含文件名和尺寸信息，提取文件名部分
      if (fileName.includes('(') && fileName.includes(')')) {
        fileName = fileName.split('(')[0].trim();
      }
      
      // 如果文件名包含路径，只取文件名部分
      if (fileName.includes('/')) {
        fileName = fileName.split('/').pop() || fileName;
      }
      
      // 如果文件名包含扩展名，去掉扩展名
      if (fileName.includes('.')) {
        fileName = fileName.split('.')[0];
      }
      
      // 取前7个字符，如果不足7个字符则全部显示
      const shortFileName = fileName.length > 7 ? fileName.substring(0, 7) + '...' : fileName;
      
      // 添加尺寸标签
      const sizeLabel = size === 'small' ? '小' : size === 'medium' ? '中' : '大';
      return `${shortFileName} (${sizeLabel})`;
    }
    return item.alt || `照片 ${item.id}`;
  };

  useEffect(() => {
    // 从localStorage加载购物车数据
    if (typeof window !== 'undefined') {
      const savedCartItems = localStorage.getItem('cartItems');
      const savedCartTotal = localStorage.getItem('cartTotal');
      
      if (savedCartItems && savedCartTotal) {
        try {
          setCartItems(JSON.parse(savedCartItems));
          setCartTotal(parseFloat(savedCartTotal));
        } catch (error) {
          console.error('Error loading cart data:', error);
          message.error('加载购物车数据失败');
          router.push('/');
        }
      } else {
        message.warning('购物车为空');
        router.push('/');
      }
    }
    setLoading(false);
  }, [router]);

  // 确保预签名链接存在（登录后localStorage被清空时补齐）
  useEffect(() => {
    const ensurePresignedUrls = async () => {
      if (typeof window === 'undefined') return;
      try {
        const storedData = localStorage.getItem('photo_gallery_data');
        const haveAll = (() => {
          if (!storedData) return false;
          try {
            const list = JSON.parse(storedData);
            const ids = new Set(list.map((p: any) => p.id));
            return cartItems.every(ci => ids.has(String(ci.id).split('-')[0]));
          } catch {
            return false;
          }
        })();
        if (!haveAll && cartItems.length > 0) {
          await get_photos_presigned_url();
          // 触发缩略图重新挂载，读取最新本地缓存
          setThumbRefreshCounter((c) => c + 1);
        }
      } catch (e) {
        // 忽略错误，UI 会显示占位
      }
    };
    ensurePresignedUrls();
  }, [cartItems]);

  const handlePaymentSuccess = (sessionId: string) => {
    message.success('支付成功！正在跳转到支付确认页面...');
    
    // 不在这里标记为已购买，让payment-success页面处理
    // markAsPurchased();
    
    setTimeout(() => {
      router.push('/payment-success');
    }, 2000);
  };

  const handlePaymentError = (error: any) => {
    message.error('支付过程中出现错误，请重试');
  };

  const formatPrice = (price: number) => {
    return `CAD $${price.toFixed(2)}`;
  };

  const handleBackToHome = () => {
    router.push('/print-store');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Result
          status="info"
          title="购物车为空"
          subTitle="请先选择要购买的照片"
          extra={
            <Button type="primary" onClick={handleBackToHome}>
              返回购买页面
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>购买照片 - Photo Store</title>
        <meta name="description" content="确认购买照片" />
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
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <Title level={1} style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 32px)' }}>
              确认购买
            </Title>
            <Button 
              icon={<HomeOutlined />} 
              onClick={handleBackToHome}
              size="middle"
            >
              返回购买页面
            </Button>
          </div>

          <Card style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            width: '100%'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={2}>
                <ShoppingCartOutlined style={{ marginRight: '8px' }} />
                购物车商品 ({cartItems.length} 件)
              </Title>
            </div>

            {/* 商品列表 */}
            <div style={{ marginBottom: '32px' }}>
              {cartItems.map((item) => (
                <Card key={item.id} size="small" style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ 
                      position: 'relative', 
                      width: '80px', 
                      height: '80px', 
                      flexShrink: 0,
                      minWidth: '80px'
                    }}>
                      <PhotoImage 
                        key={`${item.id}-${thumbRefreshCounter}`}
                        photoId={String(item.id).split('-')[0]} 
                        alt={item.alt} 
                        width={80} 
                        height={80} 
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
                        {formatFileNameWithSize(item)}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {item.description}
                      </Text>
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px', color: '#52c41a' }}>
                          ✓ 已添加到购物车
                        </Text>
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'right',
                      flexShrink: 0,
                      minWidth: '100px'
                    }}>
                      <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                        {formatPrice(item.price)}
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Divider />

            {/* 总计和支付 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '20px' }}>总计: </Text>
                <Text style={{ fontSize: '28px', color: '#1890ff', fontWeight: 'bold' }}>
                  {formatPrice(cartTotal)}
                </Text>
              </div>
              
              <PaymentButton
                amount={cartTotal}
                currency="cad"
                description={`购买 ${cartItems.length} 张照片 - ${cartItems.map(item => {
                  return formatFileNameWithSize(item);
                }).join(', ')}`}
                buttonText={`确认支付 ${formatPrice(cartTotal)}`}
                buttonType="primary"
                buttonSize="large"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default PurchasePhotoPage;