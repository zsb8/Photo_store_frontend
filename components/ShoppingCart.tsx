import React, { useState } from 'react';
import { Badge, Button, Drawer, Card, Typography, Space, Divider, message } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import PhotoImage from './PhotoImage';

const { Title, Text } = Typography;

export interface CartItem {
  id: string | number;
  src: string;
  alt: string;
  price: number;
  description: string;
  purchased?: boolean;
}

interface ShoppingCartProps {
  items: CartItem[];
  onRemoveItem: (id: string | number) => void;
  onClearCart: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ items, onRemoveItem, onClearCart }) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // 检测移动端
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const unpurchasedItems = items.filter(item => !item.purchased);
  const purchasedItems = items.filter(item => item.purchased);

  // 添加调试信息
  console.log('=== SHOPPING CART DEBUG ===');
  console.log('All items:', items);
  console.log('Unpurchased items:', unpurchasedItems);
  console.log('Purchased items:', purchasedItems);
  console.log('Total amount:', totalAmount);
  console.log('Items length:', items.length);
  console.log('=== END SHOPPING CART DEBUG ===');

  const handleCheckout = () => {
    if (unpurchasedItems.length === 0) {
      message.warning('没有待购买的商品');
      return;
    }
    
    // 将购物车数据存储到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartItems', JSON.stringify(items));
      localStorage.setItem('cartTotal', unpurchasedItems.reduce((sum, item) => sum + item.price, 0).toString());
    }
    
    // 跳转到登录页面
    router.push('/login');
  };

  const formatPrice = (price: number) => {
    return `CAD $${price.toFixed(2)}`;
  };

  return (
    <>
      <Badge 
        count={unpurchasedItems.length > 0 ? unpurchasedItems.length : (purchasedItems.length > 0 ? '✓' : 0)} 
        size="small"
        style={purchasedItems.length > 0 && unpurchasedItems.length === 0 ? { backgroundColor: '#52c41a' } : undefined}
      >
                  <Button
            type="text"
            icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />}
            onClick={() => setIsDrawerVisible(true)}
            style={{ 
              color: '#1890ff',
              fontSize: '16px',
              height: '40px',
              width: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
      </Badge>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>
              购物车 ({unpurchasedItems.length} 件待购买, {purchasedItems.length} 件已购买)
            </span>
            {items.length > 0 && (
              <Button 
                type="link" 
                danger 
                size="small"
                onClick={onClearCart}
              >
                清空购物车
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={isMobile ? '100%' : 400}
        footer={
          unpurchasedItems.length > 0 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ fontSize: '18px' }}>
                  待支付总计: {formatPrice(unpurchasedItems.reduce((sum, item) => sum + item.price, 0))}
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                onClick={handleCheckout}
                style={{ width: '100%' }}
              >
                确定支付购物车内所有商品
              </Button>
            </div>
          ) : null
        }
      >
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ShoppingCartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Text type="secondary">购物车为空</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => (
              <Card 
                key={item.id} 
                size="small" 
                style={{ 
                  marginBottom: '8px',
                  opacity: item.purchased ? 0.6 : 1,
                  border: item.purchased ? '1px solid #52c41a' : undefined
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ 
                    position: 'relative', 
                    width: '60px', 
                    height: '60px', 
                    flexShrink: 0,
                    minWidth: '60px'
                  }}>
                    <PhotoImage
                      photoId={String(item.id).split('-')[0]}
                      alt={item.alt}
                      width={60}
                      height={60}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: '14px', display: 'block' }}>
                        {formatFileNameWithSize(item)}
                      </Text>
                      {item.purchased && (
                        <Text type="success" style={{ fontSize: '12px' }}>
                          ✓ 已购买
                        </Text>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {item.description.substring(0, 30)}...
                    </Text>
                    <Text strong style={{ color: item.purchased ? '#52c41a' : '#1890ff', fontSize: '14px' }}>
                      {formatPrice(item.price)}
                    </Text>
                  </div>
                  {!item.purchased && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => onRemoveItem(item.id)}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </div>
              </Card>
            ))}
            
            <Divider />
            
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{ fontSize: '16px' }}>
                总计: {formatPrice(totalAmount)}
              </Text>
              {purchasedItems.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="success" style={{ fontSize: '14px' }}>
                    已购买: {formatPrice(purchasedItems.reduce((sum, item) => sum + item.price, 0))}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default ShoppingCart;
