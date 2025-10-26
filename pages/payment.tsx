import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, InputNumber, Select, message, Space, Typography, Divider } from 'antd';
import { CreditCardOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useI18n } from "../contexts/I18nContext";

const { Title, Text } = Typography;
const { Option } = Select;

// 确保在客户端加载Stripe
// const stripe_public_token = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_TEST ?? "";
const stripe_public_token = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_LIVE ?? "";
const stripePromise = loadStripe(stripe_public_token);

interface PaymentFormData {
  amount: number;
  currency: string;
  description: string;
  email: string;
}

const PaymentPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [form] = Form.useForm();
  const router = useRouter();
  const { t } = useI18n();

  // 从localStorage读取购物车总金额
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCartTotal = localStorage.getItem('cartTotal');
      if (savedCartTotal) {
        const total = parseFloat(savedCartTotal);
        if (!isNaN(total) && total > 0) {
          setCartTotal(total);
          form.setFieldsValue({ amount: total });
        }
      }
    }
  }, [form]);

  const handlePayment = async (values: PaymentFormData) => {
    setLoading(true);
    
    try {
      // 验证金额
      if (!values.amount || values.amount <= 0) {
        message.error('请输入有效的支付金额');
        return;
      }

      // 创建checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: values.amount,
          currency: values.currency,
          description: values.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建支付会话失败');
      }

      const { sessionId } = data;

      if (!sessionId) {
        throw new Error('Failed to create checkout session');
      }

      // 重定向到Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) {
          message.error(error.message);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : '支付过程中出现错误，请重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [1, 10, 25, 50, 100, 200];

  return (
    <>
      <Head>
        <title>{t('Payment.securePayment')} - Purchase Photo</title>
        <meta name="description" content={t('Payment.securePayment')} />
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
            maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: '16px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
              <DollarOutlined /> {t('Payment.securePayment')}
            </Title>
            <Text type="secondary">{t('Payment.stripeSecurePayment')}</Text>
            {cartTotal > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text strong style={{ color: '#52c41a' }}>
                  {t('Payment.cartTotal')}: CAD ${cartTotal.toFixed(2)}
                </Text>
              </div>
            )}
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handlePayment}
                         initialValues={{
               amount: cartTotal > 0 ? cartTotal : undefined,
               currency: 'cad',
               description: 'Purchase Photo服务',
               email: ''
             }}
          >
            <Form.Item
              label={t('Payment.amount')}
              name="amount"
              rules={[
                { required: true, message: t('Payment.amountRequired') },
                { 
                  type: 'number', 
                  min: 0.01, 
                  message: t('Payment.amountMin')
                },
                {
                  validator: (_, value) => {
                    if (value && (value > 10000 || value < 0.01)) {
                      return Promise.reject(new Error(t('Payment.amountRange')));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                max={10000}
                step={0.01}
                precision={2}
                placeholder={t('Payment.amount')}
                addonBefore={<DollarOutlined />}
              />
            </Form.Item>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>{t('Payment.quickAmounts')}</Text>
              <Space wrap style={{ marginTop: '8px' }}>
                {presetAmounts.map(amount => (
                  <Button
                    key={amount}
                    size="small"
                    onClick={() => form.setFieldsValue({ amount })}
                    type={form.getFieldValue('amount') === amount ? 'primary' : 'default'}
                  >
                    ${amount}
                  </Button>
                ))}
              </Space>
            </div>

            <Form.Item
              label={t('Payment.currency')}
              name="currency"
              rules={[{ required: true, message: t('Payment.currencyRequired') }]}
            >
              <Select>
                <Option value="usd">USD - {t('Common.currency.usd')}</Option>
                <Option value="cad">CAD - {t('Common.currency.cad')}</Option>
                <Option value="eur">EUR - {t('Common.currency.eur')}</Option>
                <Option value="gbp">GBP - {t('Common.currency.gbp')}</Option>
                <Option value="jpy">JPY - {t('Common.currency.jpy')}</Option>
                <Option value="cny">CNY - {t('Common.currency.cny')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('Payment.description')}
              name="description"
              rules={[{ required: true, message: t('Payment.descriptionRequired') }]}
            >
              <Input placeholder={t('Payment.descriptionPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('Common.email')}
              name="email"
              rules={[
                { required: true, message: t('Payment.emailRequired') },
                { type: 'email', message: t('Payment.emailInvalid') }
              ]}
            >
              <Input placeholder={t('Payment.emailPlaceholder')} />
            </Form.Item>

            <Divider />

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CreditCardOutlined />}
                size="large"
                style={{ width: '100%', height: '48px' }}
              >
                {loading ? t('Common.processing') : t('Payment.payNow')}
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <CreditCardOutlined /> {t('Payment.stripeSecurePayment')}
              </Text>
            </div>
          </Form>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Button 
              type="link" 
              onClick={() => router.push('/home')}
              icon={<ShoppingCartOutlined />}
            >
              {t("Common.back")}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PaymentPage;
