import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Space, Spin, message } from "antd";
import { ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useCart } from "../contexts/CartContext";
import ShoppingCart from "../components/ShoppingCart";
import styles from "../styles/home.module.css";
import { get_photos_presigned_url } from "../util/aws-api";

const { Title, Text } = Typography;

interface PhotoItem {
  id: string;
  filename: string;
  s3_newsize_path: string;
  created_at: string;
  presigned_url: string;
  expires_in: number;
}

const HomePage = () => {
  const router = useRouter();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取图片数据
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const result = await get_photos_presigned_url();
        
        if (result.success) {
          setPhotos(result.data);
        } else {
          message.error('获取图片失败: ' + result.message);
        }
      } catch (error) {
        console.error('获取图片时发生错误:', error);
        message.error('获取图片时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  const handlePhotoClick = (photoId: string) => {
    router.push(`/photo/${photoId}`);
  };

  const getLargePrice = (photo: PhotoItem) => {
    // The original code had a sizes array, but the new API doesn't return it.
    // Assuming a default price or that the price logic needs to be re-evaluated
    // based on the new API response structure.
    // For now, returning 0 as a placeholder.
    return 0; 
  };

  return (
    <>
      <Head>
        <title>Photo Store - 精美照片销售</title>
        <meta name="description" content="购买精美照片，高质量摄影作品" />
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
            padding: '0 20px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <Title level={1} style={{ 
              margin: 0,
              fontSize: 'clamp(24px, 5vw, 32px)',
              textAlign: 'center',
              flex: '1 1 auto'
            }}>
              精美照片销售
            </Title>
            <ShoppingCart 
              items={cartItems}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
            />
          </div>
          
          <Row gutter={[24, 24]} justify="center" style={{ padding: '0 12px' }}>
            {loading ? (
              <Col span={24} style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>正在加载图片...</div>
              </Col>
            ) : photos.length === 0 ? (
              <Col span={24} style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">暂无照片可售。</Text>
              </Col>
            ) : (
              photos.map((photo, index) => {
                // 检查是否有有效的预签名URL
                if (!photo.presigned_url || photo.presigned_url.includes('error') || photo.presigned_url.includes('404')) {
                  return null; // 跳过无效的图片
                }
                
                return (
                  <Col xs={24} sm={12} md={6} key={photo.id}>
                    <div style={{ 
                      position: 'relative',
                      marginBottom: index < photos.length - 1 ? '24px' : '0',
                      padding: '16px 0'
                    }}>
                       {/* 移动端照片区域容器 */}
                       <div 
                         className={styles.photoSectionContainer}
                         style={{
                           border: '2px solid transparent',
                           borderRadius: '16px',
                           padding: '16px',
                           background: 'linear-gradient(135deg, #fafafa, #f0f0f0)',
                           position: 'relative'
                         }}
                       >
                        <Card
                          hoverable
                          cover={
                            <div 
                              style={{ position: 'relative', height: '200px', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                              onContextMenu={(e) => e.preventDefault()}
                            >
                              <Image
                                src={photo.presigned_url}
                                alt={photo.filename || `图片 ${photo.id}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onError={(e) => {
                                  console.error('Image load error for:', photo.presigned_url);
                                  // 可以在这里设置一个默认图片
                                }}
                              />
                            </div>
                          }
                          actions={[
                            <Button
                              key="view"
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => handlePhotoClick(photo.id)}
                            >
                              查看详情
                            </Button>,
                            <Button
                              key="buy"
                              type="primary"
                              icon={<ShoppingCartOutlined />}
                              onClick={() => handlePhotoClick(photo.id)}
                            >
                              立即购买
                            </Button>
                          ]}
                          style={{
                            border: '2px solid #f0f0f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            marginBottom: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          className={styles.photoCard}
                        >
                          <Card.Meta
                            title={photo.filename || `图片 ${photo.id}`}
                            description=""
                          />
                        </Card>
                        
                        {/* 移动端分界线 */}
                        {index < photos.length - 1 && (
                          <div 
                            className={styles.mobileDivider}
                            style={{
                              display: 'none',
                              height: '3px',
                              background: 'linear-gradient(90deg, #f0f0f0, #1890ff, #f0f0f0)',
                              margin: '24px 0',
                              borderRadius: '2px',
                              position: 'relative',
                              boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: '-10px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                              color: 'white',
                              padding: '6px 16px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.4)',
                              border: '2px solid white'
                            }}>
                              ↓ 下一个照片 ↓
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                );
              }).filter(Boolean) // 过滤掉null值
            )}
          </Row>
        </div>
      </main>
    </>
  );
};

export default HomePage;
