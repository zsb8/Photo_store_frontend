import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Spin, Form, Input } from "antd";
import styles from "@/styles/login.module.css";
import { useEffect } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { isAuthorized, signIn } from "../util/user-util";
import { useMediaQuery } from "react-responsive";
const { TextArea } = Input;

export default function Login() {
  console.log("Rendering");
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const router = useRouter();
  const [displayError, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  useEffect(() => {
    if (isAuthorized()) {
      router.push("/home");
    }
  }, [router]);

  const handleSubmit = (values: any) => {
    // 保留购物车相关数据，防止登录清空
    let preservedCartItems: string | null = null;
    let preservedCartTotal: string | null = null;
    if (typeof window !== 'undefined') {
      preservedCartItems = localStorage.getItem('cartItems');
      preservedCartTotal = localStorage.getItem('cartTotal');
    }
    localStorage.clear();
    setLoading(true);
    signIn(values.username, values.password)
      .then((result) => {
        setLoading(false);
        const currentdate = new Date();
        localStorage.setItem("username", values.username);
        localStorage.setItem("id_token", result.AuthenticationResult.IdToken);
        localStorage.setItem("session_time", currentdate.toString());
        localStorage.setItem("tenant_id", result.user.tenant.tenantId);
        localStorage.setItem("access_token", result.AuthenticationResult.AccessToken);
        localStorage.setItem("role", result.user.role);
        localStorage.setItem("user_name", result.user.username);
        console.log("Session Token Saved.");
        // 恢复购物车数据
        if (preservedCartItems) {
          localStorage.setItem('cartItems', preservedCartItems);
        }
        if (preservedCartTotal) {
          localStorage.setItem('cartTotal', preservedCartTotal);
        }
        
        // 检查是否有购物车数据
        if (typeof window !== 'undefined') {
          const cartItems = localStorage.getItem('cartItems');
          const cartTotal = localStorage.getItem('cartTotal');
          
          if (cartItems && cartTotal) {
            // 如果有购物车数据，跳转到购买页面
            router.push("/purchase-photo");
          } else {
            // 否则跳转到首页
            router.push("/home");
          }
        } else {
          router.push("/home");
        }
      })
      .catch((error) => {
        setLoading(false);
        setError(`Sign in Error: ${error}`);
      });
  };
  const handleActivate = () => {
    router.push("/activate-account");
  };
  return (
    <div>
      <div className={styles.app}>
        <div className={styles.title}>Statement of Account Login</div>
        <div>
          <Form 
            name="basic" 
            {...(isMobile 
              ? { layout: 'vertical' as const } 
              : { layout: 'horizontal' as const, labelCol: { span: 6 }, wrapperCol: { span: 18 } })}
            initialValues={{ remember: true }} 
            onFinish={handleSubmit} 
            autoComplete="off"
            size={isMobile ? 'middle' : 'middle'}
            style={{ maxWidth: 360 }}
          >
            <Form.Item label="Username" name="username" rules={[{ required: true, message: "Please input your username!" }]}> 
              <Input className={styles.inputBox} />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true, message: "Please input your password!" }]}> 
              <Input.Password className={styles.inputBox} />
            </Form.Item>
            <Form.Item {...(!isMobile ? { wrapperCol: { offset: 6, span: 18 } } : {})}>
              <div className={styles.bottomLink} style={{ gap: 12 }}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                {isLoading && (
                  <Spin indicator={antIcon} />
                )}
              </div>
            </Form.Item>
          </Form>
        </div>
        <div className={styles.bottomLink}>
          <div>
            <Button type="link" block onClick={handleActivate}>
              Activate Account
            </Button>
          </div>
        </div>
        <div>
          {displayError ? (
            <>
              <div className={styles.bottomLink}>
                <div className={styles.error}>SignIn operation failed. Please check if your usrname and password is correct.</div>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
