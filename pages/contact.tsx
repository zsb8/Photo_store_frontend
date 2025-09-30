import Head from "next/head";
import React from "react";
import { Typography } from "antd";
import styles from "../styles/home.module.css";

const { Title, Paragraph } = Typography as any;

const ContactPage = () => {
  return (
    <>
      <Head>
        <title>联系</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <Title level={1} style={{ textAlign: "center", marginBottom: 24 }}>联系</Title>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            如果有任何疑问和建议，请采用如下方式联系：<br></br>电子邮件：XXXX@google.com <br></br> 微信：XXX   
          </Paragraph>
        </div>
      </main>
    </>
  );
};

export default ContactPage;


