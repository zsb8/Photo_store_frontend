import React, { useState } from 'react';
import { Badge, Button, Drawer, Card, Typography, Space, Divider, message, Checkbox } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import PhotoImage from './PhotoImage';
import { useI18n } from '../contexts/I18nContext';
import {formatFileNameWithSize} from '../util/photo-util';

const { Title, Text } = Typography;

export interface CartItem {
  id: string | number;
  src: string;
  alt: string;
  price: number;
  description: string;
  purchased?: boolean;
  photoNewId?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onRemoveItem: (id: string | number) => void;
  onClearCart: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ items, onRemoveItem, onClearCart }) => {
  const { t } = useI18n();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
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
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const unpurchasedItems = items.filter(item => !item.purchased);
  const purchasedItems = items.filter(item => item.purchased);

  const selectedUnpurchasedItems = unpurchasedItems.filter(item => selectedIds.includes(item.id));
  const selectedTotalAmount = selectedUnpurchasedItems.reduce((sum, item) => sum + item.price, 0);

  // 添加调试信息
  console.log('=== SHOPPING CART DEBUG ===');
  console.log('All items:', items);
  console.log('Unpurchased items:', unpurchasedItems);
  console.log('Purchased items:', purchasedItems);
  console.log('Total amount:', totalAmount);
  console.log('Items length:', items.length);
  console.log('=== END SHOPPING CART DEBUG ===');

  const handleCheckout = () => {
    if (selectedUnpurchasedItems.length === 0) {
      if (unpurchasedItems.length === 0) {
        message.warning(t("Cart.empty"));
      } else {
        message.warning(t("Cart.checkout"));
      }
      return;
    }
    // 将选择的信息存储到localStorage（不覆盖整个购物车）
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartSelectedIds', JSON.stringify(selectedUnpurchasedItems.map(i => i.id)));
      localStorage.setItem('cartSelectedTotal', selectedTotalAmount.toString());
    }
    // 跳转到购买页面
    router.push('/purchase-photo');
  };

  const toggleSelect = (id: string | number, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter(x => String(x) !== String(id));
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(unpurchasedItems.map(i => i.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
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
              {t("Cart.title")} ({unpurchasedItems.length} {t("Cart.items")}, {purchasedItems.length} {t("Cart.items")})
            </span>
            {items.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unpurchasedItems.length > 0 && (
                  <Space size={8}>
                    <Button size="small" onClick={handleSelectAll}>{t("Cart.select")}</Button>
                    <Button size="small" onClick={handleClearSelection}>{t("Common.clear")}</Button>
                  </Space>
                )}
                <Button 
                  type="link" 
                  danger 
                  size="small"
                  onClick={onClearCart}
                >
                  {t("Cart.clearCart")}
                </Button>
              </div>
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
                {selectedUnpurchasedItems.length > 0 ? (
                  <>
                    <Text strong style={{ fontSize: '18px' }}>
                      {t("Cart.select")} {selectedUnpurchasedItems.length} {t("Cart.items")}, {t("Cart.total")}: {formatPrice(selectedTotalAmount)}
                    </Text>
                  </>
                ) : (
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {t("Cart.checkout")}
                  </Text>
                )}
              </div>
              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                onClick={handleCheckout}
                style={{ width: '100%' }}
                disabled={selectedUnpurchasedItems.length === 0}
              >
                {selectedUnpurchasedItems.length > 0 ? `${t("Payment.placeOrder")} ${selectedUnpurchasedItems.length} ${t("Cart.items")}` : t("Cart.checkout")}
              </Button>
            </div>
          ) : null
        }
      >
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ShoppingCartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Text type="secondary">{t("Cart.empty")}</Text>
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
                  {!item.purchased && (
                    <div style={{ paddingTop: 6 }}>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onChange={e => toggleSelect(item.id, e.target.checked)}
                      />
                    </div>
                  )}
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
                          ✓ {t("Payment.success")}
                        </Text>
                      )}
                    </div>
                    {/* <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {item.description.substring(0, 30)}...
                    </Text> */}
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
                {t("Cart.total")}: {formatPrice(totalAmount)}
              </Text>
              {purchasedItems.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="success" style={{ fontSize: '14px' }}>
                    {t("Payment.success")}: {formatPrice(purchasedItems.reduce((sum, item) => sum + item.price, 0))}
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
