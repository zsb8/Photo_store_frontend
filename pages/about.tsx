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
            欢迎并感谢您对我的摄影图片的欣赏！
          </Paragraph>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            李连众博士，一位具有能源行业深耕近40年的资深人员，主要致力于下列领域：
          </Paragraph>
          <ul style={{ fontSize: 16, lineHeight: 1.9, paddingLeft: 20, marginTop: 0 }}>
            <li>集中供热系统的规划设计与项目建设</li>
            <li>动态数学模型创建及仿真</li>
            <li>运行控制与动态优化</li>
            <li>智能AI管控应用</li>
            <li>网络平衡调试</li>
            <li>异常与故障分析诊断</li>
          </ul>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            作为自由摄影爱好者，我将科学技术的严谨与艺术的敏感融合在一起。于1988—1992年在《人民摄影》（原名《中国摄影报》）发表过60余篇摄影技术类文章，奠定了摄影语言的深厚积淀，并将对能源流动的深刻理解，转化为捕捉自然之光的独特视角。
          </Paragraph>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.9 }}>
            业余时光多以旅行为主。近年来，我期望把所理解和记录的自然环境壮丽之美，基于不同主题，以时空切片（图片）的形式分享给您、您的家人及朋友。观者透过图片，从不同维度探索与感受大自然的馈赠与深切热爱；同时，也唤起对自然资源与环境保护的重视与参与，赋予您对这些时空切片的所有诠释。
          </Paragraph>
        </div>
      </main>
    </>
  );
};

export default AboutPage;


