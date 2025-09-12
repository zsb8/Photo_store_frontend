import React from "react";
import type { AppProps } from "next/app";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "antd/dist/reset.css";
import "../styles/globals.css";
import { CartProvider } from "../contexts/CartContext";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ConfigProvider locale={zhCN}>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </ConfigProvider>
  );
};

export default App;
