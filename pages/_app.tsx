import React from "react";
import type { AppProps } from "next/app";
import "antd/dist/reset.css";
import "../styles/globals.css";
import { CartProvider } from "../contexts/CartContext";
import { I18nProvider } from "../contexts/I18nContext";
import LocalizedConfigProvider from "../components/LocalizedConfigProvider";
import { Layout } from "antd";
import SiteHeader from "../components/SiteHeader";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <I18nProvider>
      <LocalizedConfigProvider>
        <CartProvider>
          <Layout>
            <SiteHeader />
            <Layout.Content>
              <Component {...pageProps} />
            </Layout.Content>
          </Layout>
        </CartProvider>
      </LocalizedConfigProvider>
    </I18nProvider>
  );
};

export default App;
