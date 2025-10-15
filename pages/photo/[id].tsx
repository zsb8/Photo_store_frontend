import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { Card, Button, Typography, Space, Divider, message, Radio, Row, Col, Spin, Alert, Form, Input } from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useCart } from "../../contexts/CartContext";
import ShoppingCart from "../../components/ShoppingCart";
import ImagePreviewModal from "../../components/ImagePreviewModal";
import styles from "../../styles/home.module.css";
import { get_photo_info } from "../../util/aws-api";
import { parseExifInfoFromJson, ImageExifInfo } from "../../util/image-exif-utils";
import { useI18n } from "../../contexts/I18nContext";

const { Title, Paragraph, Text } = Typography;

// 获取当前语言设置
const getCurrentLanguage = (): string => {
  if (typeof window === 'undefined') return 'zh';
  try {
    return localStorage.getItem('site_language') || 'zh';
  } catch {
    return 'zh';
  }
};

// 解析多语言描述
const parseMultiLanguageDescription = (description: string, language: string): string => {
  try {
    const parsed = JSON.parse(description);
    const languageMap: { [key: string]: string } = {
      'zh': 'CHS',
      'en': 'ENG', 
      'fr': 'FRA'
    };
    const langKey = languageMap[language] || 'CHS';
    return parsed[langKey] || parsed['CHS'] || description;
  } catch {
    // 如果解析失败，返回原始描述
    return description;
  }
};

// 图片信息接口定义
interface PhotoInfoData {
  filename: string;
  fileName: string;
  origin_size: string;
  prices: {
    small: { S: string };
    large: { S: string };
    medium: { S: string };
    special?: { S: string };
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
  exifInfo?: string;
  filename_id?: string;
}

const PhotoDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useI18n();
  const { addToCart, isInCart, cartItems, removeFromCart, clearCart, markAsPurchased } = useCart();
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large' | 'special'>('medium');
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
  const [currentLanguage, setCurrentLanguage] = useState<string>('zh');
  

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
          setError(result.message || t("PhotoDetail.cannotLoadInfo"));
          console.error('Failed to get photo info:', result.message);
        }
      } catch (error) {
        console.error('Error fetching photo info:', error);
        setError(t("PhotoDetail.cannotLoadInfo"));
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

  // 获取当前语言设置
  useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
    
    // 监听语言变化
    const handleLanguageChange = () => {
      setCurrentLanguage(getCurrentLanguage());
    };
    
    // 监听localStorage变化
    window.addEventListener('storage', handleLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
    };
  }, []);

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

  // 格式化 EXIF 拍摄日期为 YYYY.MM.DD（例如 2024-01-18T08-51-59 -> 2024.01.18）
  const formatExifDate = (dateStr: string): string => {
    try {
      const datePart = (dateStr || '').split('T')[0];
      if (!datePart) return dateStr;
      return datePart.replace(/-/g, '.');
    } catch {
      return dateStr;
    }
  };

  // 当图片信息变化时，若当前选择尺寸无效，则自动选择第一个有效尺寸（价格>0）
  useEffect(() => {
    if (!photoInfo) return;
    try {
      const computedOptions = [
        { size: 'small' as const, price: parseFloat(photoInfo.prices.small.S) },
        { size: 'medium' as const, price: parseFloat(photoInfo.prices.medium.S) },
        { size: 'large' as const, price: parseFloat(photoInfo.prices.large.S) },
        ...(photoInfo.prices.special?.S ? [{ size: 'special' as const, price: parseFloat(photoInfo.prices.special.S) }] : [])
      ];
      const available = computedOptions.filter(opt => opt.price > 0);
      if (available.length === 0) return;
      const stillValid = available.some(opt => opt.size === selectedSize);
      if (!stillValid) {
        setSelectedSize(available[0].size);
      }
    } catch {}
  }, [photoInfo, selectedSize]);

  // 加载状态
  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>{t("PhotoDetail.loadingInfo")}</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !photoInfo) {
    return (
      <div className={styles.container}>
        <Title level={2}>{t("PhotoDetail.photoNotFound")}</Title>
        <Text type="secondary">{error || t("PhotoDetail.cannotLoadInfo")}</Text>
        <div style={{ marginTop: '16px' }}>
          <Button onClick={() => router.push("/")}>{t("PhotoDetail.backToPhotos")}</Button>
        </div>
      </div>
    );
  }

  // 价格选项
  const sizeOptions = [
    { size: 'small', label: t("PhotoDetail.sizeOptions.small"), price: parseFloat(photoInfo.prices.small.S) },
    { size: 'medium', label: t("PhotoDetail.sizeOptions.medium"), price: parseFloat(photoInfo.prices.medium.S) },
    { size: 'large', label: t("PhotoDetail.sizeOptions.large"), price: parseFloat(photoInfo.prices.large.S) },
    ...(photoInfo.prices.special?.S ? [{ size: 'special', label: t("PhotoDetail.sizeOptions.special"), price: parseFloat(photoInfo.prices.special.S) }] : [])
  ];

  // 过滤掉价格为0的尺寸
  const availableSizeOptions = sizeOptions.filter((option) => option.price > 0);

  const selectedSizeData = availableSizeOptions.find(s => s.size === selectedSize);
  const currentPrice = selectedSizeData?.price || 0;

  const handleAddToCart = () => {
    // 校验联系方式
    const { name, phone, address } = contactInfo;
    const phoneOk = /[\d\s+\-()]{7,20}/.test(phone || '');
    if (!name || !address || !phoneOk ) {
      message.error(t("PhotoDetail.contactInfoRequired"));
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
      message.success(t("PhotoDetail.addToCartSuccess").replace("{size}", selectedSizeData.label));
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
        <meta name="description" content={photoInfo.description || `图片 ${photoInfo.id} 的详细信息`} />
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
              {t("PhotoDetail.backToPhotos")}
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
              {/* 左侧：图片展示 */}
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
                      <div style={{ fontSize: '16px', marginBottom: '8px' }}>{t("PhotoDetail.imageLoading")}</div>
                      <div style={{ fontSize: '12px' }}>{t("PhotoDetail.gettingPresignedUrl")}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  {/* <Title level={3} style={{ 
                    marginBottom: '8px',
                    fontSize: '24px'
                  }}>
                    {(photoInfo.title || photoInfo.filename)?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')}
                  </Title> */}
                  <Paragraph style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.5', 
                    marginBottom: '0' 
                  }}>
                    {parseMultiLanguageDescription(photoInfo.description || '暂无描述', currentLanguage)}
                  </Paragraph>
                  
                  {/* 图片信息 */}
                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                    <div>{t("PhotoDetail.photoInfo.photoId")} {photoInfo.exifInfo ? (() => { try { const exifData: ImageExifInfo = parseExifInfoFromJson(photoInfo.exifInfo); return exifData.dateTaken ? `${formatExifDate(exifData.dateTaken)} ` : ''; } catch { return ''; } })() : ''}- {photoInfo.filename_id || photoInfo.id}</div>
                    {/* <div>上传时间: {new Date(photoInfo.upload_datetime).toLocaleString()}</div>
                    <div>设置时间: {new Date(photoInfo.setting_datetime).toLocaleString()}</div> */}
                    {photoInfo.size && (
                      <div>{t("PhotoDetail.photoInfo.size")} {photoInfo.size}</div>
                    )}
                    {photoInfo.type && (
                      <div>{t("PhotoDetail.photoInfo.topic")} {photoInfo.topic}</div>
                    )}
                    {photoInfo.type && (
                      <div>{t("PhotoDetail.photoInfo.type")} {photoInfo.type}</div>
                    )}
                    {photoInfo.place && (
                      <div>{t("PhotoDetail.photoInfo.place")} {photoInfo.place}</div>
                    )}
                    {/* {photoInfo.photo_year && (
                      <div>拍摄时间（年）: {photoInfo.photo_year}</div>
                    )} */}
                    {photoInfo.exifInfo && (() => {
                      try {
                        const exifData: ImageExifInfo = parseExifInfoFromJson(photoInfo.exifInfo);
                        return (
                          <div style={{ marginTop: '2px' }}>
                            {/* <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>EXIF信息:</div> */}
                            {exifData.dateTaken && (
                              <div>{t("PhotoDetail.photoInfo.dateTaken")} {formatExifDate(exifData.dateTaken)}</div>
                            )}
                            {/* {exifData.make && exifData.model && (
                              <div>相机: {exifData.make} {exifData.model}</div>
                            )}
                            {exifData.width && exifData.height && (
                              <div>尺寸: {exifData.width} × {exifData.height}</div>
                            )}
                            {exifData.iso && (
                              <div>ISO: {exifData.iso}</div>
                            )}
                            {exifData.aperture && (
                              <div>光圈: f/{exifData.aperture}</div>
                            )}
                            {exifData.shutterSpeed && (
                              <div>快门: 1/{Math.round(1/Number(exifData.shutterSpeed))}s</div>
                            )}
                            {exifData.focalLength && (
                              <div>焦距: {exifData.focalLength}mm</div>
                            )}
                            {exifData.flash && (
                              <div>闪光灯: {String(exifData.flash) === '1' ? '开启' : '关闭'}</div>
                            )}
                            {exifData.whiteBalance && (
                              <div>白平衡: {String(exifData.whiteBalance) === '1' ? '自动' : '手动'}</div>
                            )} */}
                          </div>
                        );
                      } catch (error) {
                        console.warn('解析EXIF信息失败:', error);
                        return null;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* 右侧：购买信息 */}
              <div className={styles.photoInfoContainer}>
                <div>
                  {/* 尺寸选择 */}
                  <div className={styles.sizeSelectionContainer}>
                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                      {t("PhotoDetail.selectSize")}
                    </Text>
                    <Radio.Group 
                      value={selectedSize} 
                      onChange={(e) => setSelectedSize(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <Row gutter={[12, 12]}>
                        {availableSizeOptions.map((sizeOption) => (
                          <Col span={8} key={sizeOption.size}>
                            <Card 
                              size="small"
                              className={styles.sizeCard}
                              style={{ 
                                border: selectedSize === sizeOption.size ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                backgroundColor: selectedSize === sizeOption.size ? '#f0f8ff' : 'white'
                              }}
                              onClick={() => setSelectedSize(sizeOption.size as 'small' | 'medium' | 'large' | 'special')}
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
                    <Text strong style={{ fontSize: '16px' }}>{t("PhotoDetail.currentSelection")}</Text>
                    {selectedSizeData ? (
                      <Text style={{ fontSize: '18px', color: '#52c41a', fontWeight: 'bold' }}>
                        {selectedSizeData.label} - CAD ${currentPrice}
                      </Text>
                    ) : (
                      <Text type="secondary" style={{ fontSize: '14px' }}>{t("PhotoDetail.noSizeAvailable")}</Text>
                    )}
                  </div>
                </div>
                
                

                {/* 购买按钮 */}
                <div style={{ marginTop: '16px' }}>
                  <Alert 
                    type="info" 
                    showIcon 
                    message={<span style={{ fontSize: 12 }}>{t("PhotoDetail.warmTip")}</span>} 
                    description={<span style={{ fontSize: 12, lineHeight: 1.4 }}>{t("PhotoDetail.warmTipContent")}</span>} 
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
                        <Form.Item label={<span style={{ fontSize: 12 }}>{t("PhotoDetail.contactForm.name")}</span>} name="name" rules={[{ required: true, message: t("PhotoDetail.contactForm.nameRequired") }]} style={{ marginBottom: 8 }}> 
                          <Input placeholder={t("PhotoDetail.contactForm.namePlaceholder")} size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label={<span style={{ fontSize: 12 }}>{t("PhotoDetail.contactForm.phone")}</span>} name="phone" rules={[{ required: true, message: t("PhotoDetail.contactForm.phoneRequired") }]} style={{ marginBottom: 8 }}> 
                          <Input placeholder={t("PhotoDetail.contactForm.phonePlaceholder")} size="small" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label={<span style={{ fontSize: 12 }}>{t("PhotoDetail.contactForm.address")}</span>} name="address" rules={[{ required: true, message: t("PhotoDetail.contactForm.addressRequired") }]} style={{ marginBottom: 8 }}> 
                      <Input placeholder={t("PhotoDetail.contactForm.addressPlaceholder")} size="small" />
                    </Form.Item>
                  </Form>

                  {/* 购买按钮 */}
                  <Button
                    type={getCartItem()?.purchased ? "default" : (isCurrentSizeInCart() ? "default" : "primary")}
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleAddToCart}
                    disabled={!selectedSizeData || isCurrentSizeInCart()}
                    className={styles.purchaseButton}
                  >
                    {getCartItem()?.purchased ? t("PhotoDetail.purchased") : (!selectedSizeData ? t("PhotoDetail.notAvailable") : (isCurrentSizeInCart() ? t("PhotoDetail.inCart") : t("PhotoDetail.buyNow")))}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        imageUrl={presignedUrl || ''}
        imageAlt={photoInfo?.title || photoInfo?.filename || ''}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

export default PhotoDetailPage;
