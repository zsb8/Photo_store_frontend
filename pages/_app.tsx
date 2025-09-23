import React from "react";
import type { AppProps } from "next/app";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "antd/dist/reset.css";
import "../styles/globals.css";
import { CartProvider } from "../contexts/CartContext";
import { Layout } from "antd";
import SiteHeader from "../components/SiteHeader";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ConfigProvider locale={zhCN}>
      <CartProvider>
        <Layout>
          <SiteHeader />
          <Layout.Content>
            <Component {...pageProps} />
          </Layout.Content>
        </Layout>
      </CartProvider>
    </ConfigProvider>
  );
};

export default App;
