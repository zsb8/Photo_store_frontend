import Head from "next/head";
import React from "react";
import { Typography } from "antd";
import styles from "../styles/home.module.css";

const { Title, Paragraph } = Typography as any;

const AboutPage = () => {
  return (
    <>
      <Head>
        <title>作者简介</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <Title level={1} style={{ textAlign: "center", marginBottom: 24 }}>作者简介</Title>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            当今海外华人最热门风光摄影师，被誉为摄影界的奇才。 李连众定居加拿大。职业是工程师, 摄影是他的爱好。因酷爱旅行, 想更好的记录下路上的风光，2015年开始学摄影，很快成为近年来在风光摄影界奇军突起的一位新星。成为当今海外华人最热门风光摄影师！他所去的每个拍摄点都能拿出漂亮高品质的作品。
          </Paragraph>
        </div>
      </main>
    </>
  );
};

export default AboutPage;


