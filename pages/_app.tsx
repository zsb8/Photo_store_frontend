import React from "react";
import type { AppProps } from "next/app";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "antd/dist/reset.css";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ConfigProvider locale={zhCN}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
};

export default App;
