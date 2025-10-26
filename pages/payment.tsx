import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, InputNumber, Select, message, Space, Typography, Divider } from 'antd';
import { CreditCardOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import Head from 'next/head';

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
                 <title>支付页面 - Purchase Photo</title>
        <meta name="description" content="安全支付页面" />
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
              <DollarOutlined /> 安全支付
            </Title>
            <Text type="secondary">使用Stripe安全支付系统</Text>
            {cartTotal > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text strong style={{ color: '#52c41a' }}>
                  购物车总金额: CAD ${cartTotal.toFixed(2)}
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
              label="支付金额"
              name="amount"
              rules={[
                { required: true, message: '请输入支付金额' },
                { 
                  type: 'number', 
                  min: 0.01, 
                  message: '金额必须大于0' 
                },
                {
                  validator: (_, value) => {
                    if (value && (value > 10000 || value < 0.01)) {
                      return Promise.reject(new Error('金额必须在0.01到10000之间'));
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
                 placeholder="输入金额"
                 addonBefore={<DollarOutlined />}
               />
            </Form.Item>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>快速选择金额:</Text>
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
              label="货币"
              name="currency"
              rules={[{ required: true, message: '请选择货币' }]}
            >
                             <Select>
                 <Option value="usd">USD - 美元</Option>
                 <Option value="cad">CAD - 加元</Option>
                 <Option value="eur">EUR - 欧元</Option>
                 <Option value="gbp">GBP - 英镑</Option>
                 <Option value="jpy">JPY - 日元</Option>
                 <Option value="cny">CNY - 人民币</Option>
               </Select>
            </Form.Item>

            <Form.Item
              label="商品描述"
              name="description"
              rules={[{ required: true, message: '请输入商品描述' }]}
            >
              <Input placeholder="请输入商品或服务描述" />
            </Form.Item>

            <Form.Item
              label="电子邮箱地址"
              name="email"
              rules={[
                { required: true, message: '请输入电子邮箱地址' },
                { type: 'email', message: '请输入有效的电子邮箱地址' }
              ]}
            >
              <Input placeholder="用于接收支付确认" />
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
                {loading ? '处理中...' : '立即支付'}
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <CreditCardOutlined /> 支付由Stripe安全处理
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
              返回主页
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PaymentPage;
