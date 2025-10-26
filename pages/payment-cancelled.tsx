import React from 'react';
import { Card, Button, Typography, Result } from 'antd';
import { CloseCircleOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useI18n } from '../contexts/I18nContext';

const PaymentCancelledPage: React.FC = () => {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <>
      <Head>
                 <title>{t("Payment.cancelled")}</title>
        <meta name="description" content={t("Payment.cancelled")} />
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
            status="error"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title={t("Payment.cancelled")}
            subTitle={t("Payment.yourPaymentHasBeenCancelled")}
            extra={[
              <Button 
                type="primary" 
                key="home"
                icon={<HomeOutlined />}
                onClick={() => router.push('/print-store')}
                size="large"
              >
                {t("Common.back")}
              </Button>,
              // <Button 
              //   key="payment"
              //   icon={<ShoppingOutlined />}
              //   onClick={() => router.push('/print-store')}
              //   size="large"
              // >
              //   重新购买
              // </Button>
            ]}
          />

          {/* <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#fff2f0', 
            borderRadius: '8px',
            border: '1px solid #ffccc7'
          }}>
            <Typography.Text type="danger">
              <strong>需要帮助？</strong> 如果您在支付过程中遇到任何问题，请发送邮件至 support@reportdesigner.com 或致电 +1-800-123-4567
            </Typography.Text>
          </div> */}
        </Card>
      </div>
    </>
  );
};

export default PaymentCancelledPage;
