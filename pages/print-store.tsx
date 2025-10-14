import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Spin, message } from "antd";
import { ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useCart } from "../contexts/CartContext";
import ShoppingCart from "../components/ShoppingCart";
import styles from "../styles/home.module.css";
import { get_photos_presigned_url, get_all_photo_settings } from "../util/aws-api";

const { Title, Text } = Typography;

interface PhotoItem {
  id: string;
  filename: string;
  s3_newsize_path: string;
  created_at: string;
  presigned_url: string;
  expires_in: number;
  title?: string;
  filename_id?: string;
}

const PrintStorePage = () => {
  const router = useRouter();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const photoSettingsResponse = await get_all_photo_settings();
        
        if (photoSettingsResponse.data && photoSettingsResponse.data.length > 0) {
          const galleryResponse = await get_photos_presigned_url();
          
          const presignedUrlMap = new Map<string, string>();
          if (galleryResponse.data) {
            galleryResponse.data.forEach((item: any, index: number) => {
              presignedUrlMap.set(item.id, item.presigned_url);
            });
          }
          
          const convertedPhotos: PhotoItem[] = photoSettingsResponse.data.map((item: any, index: number) => {
            const converted = {
              id: item.id || `photo_${index}`,
              filename: item.filename || `Photo ${index + 1}`,
              s3_newsize_path: item.s3_newsize_path || "",
              created_at: item.upload_datetime || new Date().toISOString(),
              presigned_url: presignedUrlMap.get(item.id) || item.s3_newsize_path || "",
              expires_in: 3600,
              title: item.title || item.filename || `Photo ${index + 1}`,
              filename_id: item.filename_id,
            };
            return converted;
          });
          setPhotos(convertedPhotos);
        } else {
          message.error("暂无图片可售");
          setPhotos([]);
        }
      } catch (error) {
        message.error("获取图片时发生错误");
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  const handlePhotoClick = (photoId: string) => {
    router.push(`/photo/${photoId}`);
  };

  return (
    <>
      <Head>
        <title>作品 - 精美图片销售</title>
        <meta name="description" content="购买精美图片，高质量摄影作品" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            padding: "0 20px",
            flexWrap: "wrap",
            gap: "16px",
          }}>
            <Title level={1} style={{ margin: 0, fontSize: "clamp(24px, 5vw, 32px)", textAlign: "center", flex: "1 1 auto" }}>
              作品
            </Title>
            <ShoppingCart items={cartItems} onRemoveItem={removeFromCart} onClearCart={clearCart} />
          </div>

          <Row gutter={[24, 24]} justify="center" style={{ padding: "0 12px" }}>
            {(() => {
              console.log('🔍 [DEBUG] 渲染状态检查:');
              console.log('🔍 [DEBUG] loading:', loading);
              console.log('🔍 [DEBUG] photos.length:', photos.length);
              console.log('🔍 [DEBUG] photos 内容:', photos);
              return null;
            })()}
            {loading ? (
              <Col span={24} style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <div style={{ marginTop: "16px" }}>正在加载图片...</div>
              </Col>
            ) : photos.length === 0 ? (
              <Col span={24} style={{ textAlign: "center", padding: "40px" }}>
                <Text type="secondary">暂无图片可售。</Text>
              </Col>
            ) : (
              photos
                .map((photo, index) => {
                  console.log(`🔍 [DEBUG] 处理图片 ${index}:`, photo);
                  console.log(`🔍 [DEBUG] photo.presigned_url:`, photo.presigned_url);
                  
                  // 简化过滤逻辑：只检查是否有URL，不进行其他过滤（与photo_types页面保持一致）
                  if (!photo.presigned_url) {
                    console.log(`🔍 [DEBUG] 图片 ${index} 被过滤掉，原因: 没有 presigned_url`);
                    return null;
                  }
                  
                  console.log(`🔍 [DEBUG] 图片 ${index} 通过检查，将渲染`);
                  return (
                    <Col xs={24} sm={12} md={6} key={photo.id}>
                      <div style={{ position: "relative", marginBottom: index < photos.length - 1 ? "24px" : "0", padding: "16px 0" }}>
                        <div className={styles.photoSectionContainer} style={{ border: "2px solid transparent", borderRadius: "16px", padding: "16px", background: "linear-gradient(135deg, #fafafa, #f0f0f0)", position: "relative" }}>
                          <Card
                            hoverable
                            cover={
                              <div style={{ position: "relative", height: "200px", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", cursor: "pointer" }} onContextMenu={(e) => e.preventDefault()} onClick={() => handlePhotoClick(photo.id)}>
                                <Image src={photo.presigned_url} alt={`图片 ${photo.id}` || photo.filename} fill style={{ objectFit: "cover" }} draggable={false} onContextMenu={(e) => e.preventDefault()} />
                              </div>
                            }
                            actions={[
                              <Button key="view" type="text" icon={<EyeOutlined />} onClick={() => handlePhotoClick(photo.id)}>
                                查看详情
                              </Button>,
                              <Button key="buy" type="primary" icon={<ShoppingCartOutlined />} onClick={() => handlePhotoClick(photo.id)}>
                                立即购买
                              </Button>,
                            ]}
                            style={{ border: "2px solid #f0f0f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "16px", position: "relative", overflow: "hidden" }}
                            className={styles.photoCard}
                          >
                            <Card.Meta title={(photo.filename_id || photo.id)} description="" />
                          </Card>
                          {index < photos.length - 1 && (
                            <div className={styles.mobileDivider} style={{ display: "none", height: "3px", background: "linear-gradient(90deg, #f0f0f0, #1890ff, #f0f0f0)", margin: "24px 0", borderRadius: "2px", position: "relative", boxShadow: "0 2px 4px rgba(24, 144, 255, 0.3)" }}>
                              <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #1890ff, #40a9ff)", color: "white", padding: "6px 16px", borderRadius: "16px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(24, 144, 255, 0.4)", border: "2px solid white" }}>
                                ↓ 下一个图片 ↓
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })
                .filter(Boolean)
            )}
          </Row>
        </div>
      </main>
    </>
  );
};

export default PrintStorePage;


