import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Upload, message, Space, Divider, Input, Radio, Select, Card, Typography, Image, Row, Col, Spin } from "antd";
import { LogoutOutlined, UploadOutlined, EditOutlined, CheckOutlined, CloseOutlined, SaveOutlined, CreditCardOutlined, DollarOutlined, PictureOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useRouter } from "next/router";
import styles from "../styles/home.module.css";
import { isAuthorized } from "@/util/user-util";
import { Column, Line, Scatter } from '@ant-design/plots';
import { get_photos_presigned_url } from "@/util/aws-api";
import PaymentButton from "../components/PaymentButton";
import { useCart } from "../contexts/CartContext";
import { CartItem } from "../components/ShoppingCart";

interface AWSResponse {
  message: string;
  result?: {
    status: string;
    id: string;
    message: string;
  };
}

interface PhotoItem {
  id: string;
  filename: string;
  s3_newsize_path: string;
  created_at: string;
  presigned_url: string;
  expires_in: number;
}

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const DEFAULT_LOGO = "/logo-default.png";

export default function ReportDesigner() {
  const router = useRouter();
  const { cartItems, getCartTotal, getUnpurchasedItems } = useCart();
  const [unpurchasedTotal, setUnpurchasedTotal] = useState<number>(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取图片画廊数据
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const result = await get_photos_presigned_url();
        
        if (result.success) {
          setPhotos(result.data);
        } else {
          message.error('获取图片失败: ' + result.message);
        }
      } catch (error) {
        console.error('获取图片时发生错误:', error);
        message.error('获取图片时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  // 计算未购买商品的总金额
  useEffect(() => {
    const unpurchasedItems = getUnpurchasedItems();
    const total = unpurchasedItems.reduce((sum, item) => sum + item.price, 0);
    setUnpurchasedTotal(total);
  }, [cartItems, getUnpurchasedItems]);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    // router.push("/login");
    router.push("/");
  };

  const menuItems: MenuProps["items"] = [
    {
      label: "Logout",
      key: "logout",
      icon: <LogoutOutlined />,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "logout") {
      handleLogout();
    }
  };

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>Purchase Photo</div>
        <div className={styles.headerActions}>
          <Button 
            type="primary" 
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            size="middle"
            style={{ 
              marginLeft: '16px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            退出登录
          </Button>
        </div>
      </Header>
      <Content className={styles.content}>
        <div style={{ padding: '24px' }}>
          <Title level={2} className={styles.pageTitle}>
            欢迎使用 Purchase Photo支付页面
          </Title>
          <div className={styles.cardGrid}>
            <Card 
              title="支付服务" 
              extra={<DollarOutlined />}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Text>安全便捷的支付解决方案</Text>
              <div style={{ marginTop: '16px' }}>
                <PaymentButton
                  amount={unpurchasedTotal > 0 ? unpurchasedTotal : 0.50}
                  currency="cad"
                  description={unpurchasedTotal > 0 ? `购买未付款商品 (${unpurchasedTotal.toFixed(2)} CAD)` : "Purchase Photo服务"}
                  buttonText={unpurchasedTotal > 0 ? `支付购物车商品 (${unpurchasedTotal.toFixed(2)} CAD)` : "立即支付"}
                  buttonType="primary"
                  buttonSize="middle"
                  onSuccess={(sessionId) => {
                    console.log('Payment session created:', sessionId);
                    console.log('Payment amount used:', unpurchasedTotal > 0 ? unpurchasedTotal : 0.50);
                    // 只记录会话创建，不标记为已购买
                    message.success('正在跳转到支付页面...');
                  }}
                  onError={(error) => {
                    console.error('Payment error:', error);
                    console.error('Payment amount that failed:', unpurchasedTotal > 0 ? unpurchasedTotal : 0.50);
                    message.error('创建支付会话失败，请重试');
                  }}
                />
              </div>
            </Card>

            {/* <Card 
              title="支付历史" 
              extra={<DollarOutlined />}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Text>查看您的支付记录和交易历史</Text>
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="default" 
                  icon={<DollarOutlined />}
                  onClick={() => router.push('/payment-history')}
                >
                  查看历史
                </Button>
              </div>
            </Card> */}
          </div>

          <div style={{ marginTop: '32px', padding: '24px', background: '#f0f2f5', borderRadius: '8px' }}>
            <Title level={3}>感谢您的购买</Title>
            <Text>
              感谢您选择我们的图片服务！我们致力于为您提供最优质的图片产品和最安全的支付体验。
              您的满意是我们最大的动力，期待为您提供更多精彩的图片作品。
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
