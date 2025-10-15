import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import frFR from 'antd/locale/fr_FR';
import { useI18n } from '../contexts/I18nContext';

const locales = {
  zh: zhCN,
  en: enUS,
  fr: frFR,
};

interface LocalizedConfigProviderProps {
  children: React.ReactNode;
}

const LocalizedConfigProvider: React.FC<LocalizedConfigProviderProps> = ({ children }) => {
  const { language } = useI18n();
  
  return (
    <ConfigProvider locale={locales[language]}>
      {children}
    </ConfigProvider>
  );
};

export default LocalizedConfigProvider;
