import React, { useState } from 'react';
import { Button, Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { CreditCardOutlined, DollarOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { useI18n } from "../contexts/I18nContext";

const { Option } = Select;

// 这个页面其实就是你点击购买后，弹出的再次让你确认和输入电邮的页面。这个页面过完就是真的进入stripe支付页面了。

// 确保在客户端加载Stripe
// const stripe_public_token = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_TEST ?? "";
const stripe_public_token = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_LIVE ?? "";
const stripePromise = loadStripe(stripe_public_token);

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
  buttonText: propButtonText,
  buttonType = 'primary',
  buttonSize = 'middle',
  onSuccess,
  onError
}) => {
  const { t } = useI18n();
  const buttonText = propButtonText || t('Payment.paynow');
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
            {t("Payment.securePayment")}
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
            label={t("Payment.amount")}
            name="amount"
            rules={[{ required: true, message: t("Payment.amountRequired") }]}
          >
                         <InputNumber
               style={{ width: '100%' }}
               min={1.00}
               max={10000}
               step={0.01}
               precision={2}
               placeholder={t("Payment.amountRequired")}
               addonBefore={<DollarOutlined />}
             />
          </Form.Item>
          <Form.Item
            label={t("Payment.currency")}
            name="currency"
            rules={[{ required: true, message: '请选择货币' }]}
          >
                         <Select>
               <Option value="usd">USD {t("Payment.currencyUSD")}</Option>
               <Option value="cad">CAD {t("Payment.currencyCAD")}</Option>
               <Option value="eur">EUR {t("Payment.currencyEUR")}</Option>
               <Option value="gbp">GBP {t("Payment.currencyGBP")}</Option>
               <Option value="jpy">JPY {t("Payment.currencyJPY")}</Option>
               <Option value="cny">CNY {t("Payment.currencyCNY")}</Option>
             </Select>
          </Form.Item>

          <Form.Item
            label={t("Payment.description")}
            name="description"
            rules={[{ required: true, message: '请输入商品描述' }]}
          >
            <Input placeholder="请输入商品或服务描述" />
          </Form.Item>

          <Form.Item
            label={t("Common.email")}
            name="email"
            rules={[
              { required: true, message: t("Payment.emailRequired") },
              { type: 'email', message: t("Payment.emailInvalid") }
            ]}
          >
            <Input placeholder={t("Payment.emailPlaceholder")} />
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
              {loading ? t("Common.processing") : t('Payment.paynow')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <small style={{ color: '#666' }}>
              <CreditCardOutlined /> {t('Payment.stripeSecurePayment')}
            </small>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default PaymentButton;
