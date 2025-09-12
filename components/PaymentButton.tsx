import React, { useState } from 'react';
import { Button, Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { CreditCardOutlined, DollarOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';

const { Option } = Select;

// 确保在客户端加载Stripe
const stripePromise = loadStripe('pk_test_A7jK4iCYHL045qgjjfzAfPxu');

interface PaymentButtonProps {
  amount?: number;
  currency?: string;
  description?: string;
  buttonText?: string;
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  buttonSize?: 'large' | 'middle' | 'small';
  onSuccess?: (sessionId: string) => void;
  onError?: (error: any) => void;
}

interface PaymentFormData {
  amount: number;
  currency: string;
  description: string;
  email: string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount = 0.5,
  currency = 'cad',
  description = 'Purchase Photo服务',
  buttonText = '立即支付',
  buttonType = 'primary',
  buttonSize = 'middle',
  onSuccess,
  onError
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handlePayment = async (values: PaymentFormData) => {
    setLoading(true);
    
    try {
      console.log('PaymentButton: Sending payment request with amount:', values.amount);
      console.log('PaymentButton: Original amount prop:', amount);
      
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
      console.log('PaymentButton: API response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      const { sessionId } = data;

      if (!sessionId) {
        throw new Error('Failed to create checkout session');
      }

      // 调用成功回调
      if (onSuccess) {
        onSuccess(sessionId);
      }

      // 重定向到Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) {
          message.error(error.message);
          if (onError) {
            onError(error);
          }
        } else {
          setIsModalVisible(false);
          form.resetFields();
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      message.error('支付过程中出现错误，请重试');
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type={buttonType}
        size={buttonSize}
        icon={<CreditCardOutlined />}
        onClick={() => setIsModalVisible(true)}
      >
        {buttonText}
      </Button>

      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <DollarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
            安全支付
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePayment}
          initialValues={{
            amount,
            currency,
            description,
            email: ''
          }}
        >
          <Form.Item
            label="支付金额"
            name="amount"
            rules={[{ required: true, message: '请输入支付金额' }]}
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
          <div style={{ marginTop: '-12px', marginBottom: '16px' }}>
            <small style={{ color: '#666' }}>不低于0.5</small>
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
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="用于接收支付确认" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
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

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <small style={{ color: '#666' }}>
              <CreditCardOutlined /> 支付由Stripe安全处理
            </small>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default PaymentButton;
