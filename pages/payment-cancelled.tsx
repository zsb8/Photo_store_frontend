import React from 'react';
import { Card, Button, Typography, Result } from 'antd';
import { CloseCircleOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import Head from 'next/head';

const PaymentCancelledPage: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <Head>
                 <title>支付取消 - Purchase Photo</title>
        <meta name="description" content="支付已取消" />
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
            title="支付已取消"
            subTitle="您的支付已被取消，如果您遇到任何问题，请联系我们的客服团队。"
            extra={[
              <Button 
                type="primary" 
                key="home"
                icon={<HomeOutlined />}
                onClick={() => router.push('/print-store')}
                size="large"
              >
                返回购买页面
              </Button>,
              <Button 
                key="payment"
                icon={<ShoppingOutlined />}
                onClick={() => router.push('/print-store')}
                size="large"
              >
                重新购买
              </Button>
            ]}
          />

          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#fff2f0', 
            borderRadius: '8px',
            border: '1px solid #ffccc7'
          }}>
            <Typography.Text type="danger">
              <strong>需要帮助？</strong> 如果您在支付过程中遇到任何问题，请发送邮件至 support@reportdesigner.com 或致电 +1-800-123-4567
            </Typography.Text>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PaymentCancelledPage;
