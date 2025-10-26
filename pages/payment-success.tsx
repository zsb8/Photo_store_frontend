import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Button, Typography, Space, Result, Spin, Descriptions, message } from 'antd';
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCart } from '../contexts/CartContext';
import { useI18n } from "../contexts/I18nContext";

const { Title, Text } = Typography;

interface PaymentSession {
  id: string;
  amount_total: number;
  currency: string;
  customer_details?: {
    email?: string;
  };
  payment_status: string;
  created: number;
}

const PaymentSuccessPage: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState<string | null>(null);
  const hasMarkedAsPurchasedRef = useRef(false);
  const { session_id } = router.query;
  const { markAsPurchased, refreshCart } = useCart();
  const { t } = useI18n();

  const fetchSessionDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/retrieve-session?session_id=${session_id}`);
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      } else {
        console.error('Failed to fetch session:', response.status);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }, [session_id]);

  useEffect(() => {
    if (session_id) {
      fetchSessionDetails();
    }
  }, [session_id, fetchSessionDetails]);

  useEffect(() => {
    // 支付成功后，标记购物车中的商品为已购买（只执行一次）
    const handlePaymentSuccess = async () => {
      if (session && 
          (session.payment_status === 'paid' || session.payment_status === 'complete') && 
          !hasMarkedAsPurchasedRef.current) {
        try {
          console.log('Payment confirmed as paid/complete, marking items as purchased');
          hasMarkedAsPurchasedRef.current = true;
          
          // 等待标记完成
          await markAsPurchased();
          
          // 确保状态更新完成后再刷新购物车
          setTimeout(() => {
            refreshCart();
            console.log('Cart refreshed after payment success');
            
            // 再次确认localStorage已更新
            if (typeof window !== 'undefined') {
              const updatedCart = localStorage.getItem('cartItems');
              console.log('Final cart state in localStorage:', updatedCart);
            }
          }, 200);
          
        } catch (error) {
          console.error('Error marking items as purchased:', error);
        }
      } else if (session) {
        console.log('Session found but payment status is:', session.payment_status);
      }
    };

    handlePaymentSuccess();
  }, [session, markAsPurchased, refreshCart]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleNavigation = async (path: string, buttonType: string) => {
    try {
      setNavigating(buttonType);
      console.log(`Navigating to ${path}...`);
      
      // 确保购物车数据已保存
      if (typeof window !== 'undefined') {
        const cartData = localStorage.getItem('cartItems');
        console.log('Cart data before navigation:', cartData);
      }
      
      await router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      message.error('页面跳转失败，请重试');
      setNavigating(null);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Head>
                 <title>支付成功 - Purchase Photo</title>
        <meta name="description" content="支付成功页面" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Card 
          style={{ 
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: '16px'
          }}
        >
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title={t("Payment.success")}
            subTitle={t("Payment.paymentSuccess")}
            extra={[
              <Button 
                type="primary" 
                key="home"
                icon={<HomeOutlined />}
                loading={navigating === 'home'}
                onClick={() => handleNavigation('/print-store', 'home')}
                size="large"
              >
                {navigating === 'home' ? t("Common.processing") : t("Common.back")}
              </Button>,
              <Button 
                key="payment"
                icon={<ShoppingOutlined />}
                loading={navigating === 'payment'}
                onClick={() => handleNavigation('/print-store', 'payment')}
                size="large"
              >
                {navigating === 'payment' ? t("Common.processing") : t("Cart.continueShopping")}
              </Button>
            ]}
          />

          {session && (
            <div style={{ marginTop: '24px' }}>
              <Title level={4}>{t("Payment.paymentDetails")}</Title>
              <Descriptions bordered column={1}>
                <Descriptions.Item label={t("Payment.transactionId")}>
                  <Text code>{session.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t("Payment.amount")}>
                  <Text strong style={{ color: '#52c41a' }}>
                    {formatAmount(session.amount_total, session.currency)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t("Payment.paymentStatus")}>
                  <Text type="success" strong>
                    {session.payment_status === 'paid' ? t("Payment.paid") : session.payment_status}
                  </Text>
                </Descriptions.Item>
                {session.customer_details?.email && (
                  <Descriptions.Item label={t("Common.email")}>
                    {session.customer_details.email}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={t("Payment.paymentTime")}>
                  {formatDate(session.created)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#f6ffed', 
            borderRadius: '8px',
            border: '1px solid #b7eb8f'
          }}>
            <Text type="success">
              {t("Payment.nextStep")}
            </Text>
            <div style={{ marginTop: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
              {t("Payment.prompt")}
            </Text>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PaymentSuccessPage;
