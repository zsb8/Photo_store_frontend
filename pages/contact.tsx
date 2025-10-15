import Head from "next/head";
import React from "react";
import { Typography } from "antd";
import styles from "../styles/home.module.css";
import { useI18n } from "../contexts/I18nContext";

const { Title, Paragraph } = Typography as any;

const ContactPage = () => {
  const { t } = useI18n();
  
  return (
    <>
      <Head>
        <title>{t("Contact.title")}</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <Title level={1} style={{ textAlign: "center", marginBottom: 24 }}>{t("Contact.title")}</Title>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            {t("Contact.formDescription")}<br></br>{t("Contact.email")}：XXXX@google.com <br></br> 微信：XXX   
          </Paragraph>
        </div>
      </main>
    </>
  );
};

export default ContactPage;


