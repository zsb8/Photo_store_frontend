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
import { useI18n } from "../contexts/I18nContext";

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
  const { t } = useI18n();
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
          message.error(t("Photos.loadingPhotos") + ': ' + result.message);
        }
      } catch (error) {
        console.error('获取图片时发生错误:', error);
        message.error(t("Photos.loadingPhotos"));
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
      label: t("Navigation.logout"),
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
        <div className={styles.logo}>{t("Payment.title")}</div>
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
            {t("Navigation.logout")}
          </Button>
        </div>
      </Header>
      <Content className={styles.content}>
        <div style={{ padding: '24px' }}>
          <Title level={2} className={styles.pageTitle}>
            {t("Home.welcome")} - {t("Payment.title")}
          </Title>
          <div className={styles.cardGrid}>
            <Card 
              title={t("Payment.paymentMethod")} 
              extra={<DollarOutlined />}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Text>{t("Payment.title")}</Text>
              <div style={{ marginTop: '16px' }}>
                <PaymentButton
                  amount={unpurchasedTotal > 0 ? unpurchasedTotal : 0.50}
                  currency="cad"
                  description={unpurchasedTotal > 0 ? `${t("Cart.items")} (${unpurchasedTotal.toFixed(2)} CAD)` : t("Payment.title")}
                  buttonText={unpurchasedTotal > 0 ? `${t("Payment.placeOrder")} (${unpurchasedTotal.toFixed(2)} CAD)` : t("Payment.placeOrder")}
                  buttonType="primary"
                  buttonSize="middle"
                  onSuccess={(sessionId) => {
                    console.log('Payment session created:', sessionId);
                    console.log('Payment amount used:', unpurchasedTotal > 0 ? unpurchasedTotal : 0.50);
                    // 只记录会话创建，不标记为已购买
                    message.success(t("Common.processing"));
                  }}
                  onError={(error) => {
                    console.error('Payment error:', error);
                    console.error('Payment amount that failed:', unpurchasedTotal > 0 ? unpurchasedTotal : 0.50);
                    message.error(t("Payment.failed"));
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
            <Title level={3}>{t("Messages.thankYou")}</Title>
            <Text>
              {t("About.description")}
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
