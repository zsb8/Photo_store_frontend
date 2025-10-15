import Head from "next/head";
import React from "react";
import { Typography } from "antd";
import styles from "../styles/home.module.css";
import { useI18n } from "../contexts/I18nContext";

const { Title, Paragraph } = Typography as any;

const AboutPage = () => {
  const { t } = useI18n();
  
  return (
    <>
      <Head>
        <title>{t("About.title")}</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <Title level={1} style={{ textAlign: "center", marginBottom: 24 }}>{t("About.title")}</Title>
          <Paragraph style={{ fontSize: 22, lineHeight: 2, fontWeight: 700, textAlign: "left", marginBottom: 16 }}>
            {t("About.welcome")}
          </Paragraph>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            {t("About.authorIntro")}
          </Paragraph>
          <ul style={{ fontSize: 16, lineHeight: 1.9, paddingLeft: 20, marginTop: 0 }}>
            <li>{t("About.expertise.heating")}</li>
            <li>{t("About.expertise.modeling")}</li>
            <li>{t("About.expertise.optimization")}</li>
            <li>{t("About.expertise.ai")}</li>
            <li>{t("About.expertise.network")}</li>
            <li>{t("About.expertise.diagnosis")}</li>
          </ul>
          <Paragraph style={{ fontSize: 18, lineHeight: 2 }}>
            {t("About.photographyPhilosophy")}
          </Paragraph>
          <Paragraph style={{ fontSize: 18, lineHeight: 2 }}>
            {t("About.travelMessage")}
          </Paragraph>
        </div>
      </main>
    </>
  );
};

export default AboutPage;


