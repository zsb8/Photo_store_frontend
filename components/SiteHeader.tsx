import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Layout, Menu, Select } from "antd";
import type { MenuProps } from "antd";
import styles from "../styles/site-header.module.css";

const { Header } = Layout;

const menuItems: MenuProps["items"] = [
  { key: "/", label: <Link href="/">主页</Link> },
  { key: "/photo_types", label: <Link href="/photo_types">相片</Link> },
  { key: "/print-store", label: <Link href="/print-store">购买</Link> },
  { key: "/about", label: <Link href="/about">作者简介</Link> },
  { key: "/contact", label: <Link href="/contact">联系</Link> }
];

const languageOptions = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" }
];

const SiteHeader: React.FC = () => {
  const router = useRouter();
  const [current, setCurrent] = useState<string>("/");
  const [language, setLanguage] = useState<string>("zh");

  useEffect(() => {
    setCurrent(router.pathname === "/" ? "/" : router.pathname.split("?")[0]);
  }, [router.pathname]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("site_language") : null;
    if (saved) setLanguage(saved);
  }, []);

  const onSelectLanguage = (value: string) => {
    setLanguage(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("site_language", value);
    }
  };

  return (
    <Header className={styles.header}>
      <div className={styles.brand}>
        <Link href="/" className={styles.brandLink}>
          精美照片销售
        </Link>
      </div>
      <div className={styles.navArea}>
        <Menu
          mode="horizontal"
          selectedKeys={[current]}
          items={menuItems}
          className={styles.menu}
          theme="dark"
        />
        <div className={styles.langSelectWrapper}>
          <span className={styles.langLabel}>中/英/法</span>
          <Select
            value={language}
            onChange={onSelectLanguage}
            options={languageOptions}
            size="middle"
            className={styles.langSelect}
          />
        </div>
      </div>
    </Header>
  );
};

export default SiteHeader;


