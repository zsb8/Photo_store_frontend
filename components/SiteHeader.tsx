import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Layout, Menu, Select } from "antd";
import type { MenuProps } from "antd";
import styles from "../styles/site-header.module.css";
import { useI18n } from "../contexts/I18nContext";

const { Header } = Layout;

const SiteHeader: React.FC = () => {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const [current, setCurrent] = useState<string>("/");

  useEffect(() => {
    setCurrent(router.pathname === "/" ? "/" : router.pathname.split("?")[0]);
  }, [router.pathname]);

  const menuItems: MenuProps["items"] = [
    { key: "/", label: <Link href="/">{t("Navigation.home")}</Link> },
    { key: "/photo_types", label: <Link href="/photo_types">{t("Navigation.photos")}</Link> },
    { key: "/print-store", label: <Link href="/print-store">{t("Navigation.purchase")}</Link> },
    { key: "/about", label: <Link href="/about">{t("Navigation.about")}</Link> },
    { key: "/contact", label: <Link href="/contact">{t("Navigation.contact")}</Link> },
    { key: "/cart", label: <Link href="/cart">{t("Navigation.cart")}</Link> },
    { key: "/photos-backend-management", label: <Link href="/photos-backend-management">{t("Navigation.edit")}</Link> }
  ];

  const languageOptions = [
    { value: "zh", label: t("Common.zh") },
    { value: "en", label: t("Common.en") },
    { value: "fr", label: t("Common.fr") }
  ];

  const onSelectLanguage = (value: string) => {
    setLanguage(value as "zh" | "en" | "fr");
  };

  return (
    <Header className={styles.header}>
      <div className={styles.brand}>
        <Link href="/" className={styles.brandLink}>
          {t("Common.siteName")}
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
          <span className={styles.langLabel}>{t("Common.language")}</span>
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


