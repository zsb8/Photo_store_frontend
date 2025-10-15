import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Col, Row, Spin, Typography, Tag, Empty, Input, Button, message, Select } from "antd";
import Image from "next/image";
import styles from "../styles/home.module.css";
import { get_all_photo_settings, get_photos_presigned_url, query_ai_photo_id } from "../util/aws-api";
import { useI18n } from "../contexts/I18nContext";

const { Title, Text } = Typography;
const { Option } = Select;

interface PhotoSettingItem {
  id: string;
  filename: string;
  title?: string;
  description?: string;
  s3_newsize_path: string;
  type?: string;
  topic?: string;
}

export default function PhotoTypesPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<PhotoSettingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // 中文分类名称到翻译键值的映射
  const topicMapping: { [key: string]: string } = {
    '新品': 'new',
    '自然风光': 'nature',
    '城市建筑': 'urban',
    '静物': 'still',
    '抽象与艺术': 'abstract',
    '人文与生活': 'lifestyle',
    '其他': 'other'
  };

  const subcategoryMapping: { [key: string]: string } = {
    '新品': 'new',
    '山脉': 'mountain',
    '海洋': 'ocean',
    '森林': 'forest',
    '沙漠': 'desert',
    '动物': 'animal',
    '花卉': 'flower',
    '烟花': 'fireworks',
    '瀑布': 'waterfall',
    '鸟禽': 'bird',
    '冰雪': 'snow',
    '江海': 'river',
    '夜景': 'night',
    '极光': 'aurora',
    '星空': 'star',
    '航拍': 'aerial',
    '微距': 'macro',
    '地标': 'landmark',
    '街景': 'street',
    '物品': 'object',
    '光影': 'light',
    '色彩': 'color',
    '纹理': 'texture',
    '极简': 'minimal',
    '创意': 'creative',
    '人像': 'portrait',
    '情绪': 'emotion',
    '其他': 'other'
  };

  // 获取翻译后的分类名称
  const getTranslatedTopic = (topic: string) => {
    const key = topicMapping[topic] || 'other';
    return t(`PhotoTypes.topics.${key}`);
  };

  const getTranslatedSubcategory = (subcategory: string) => {
    const key = subcategoryMapping[subcategory] || 'other';
    return t(`PhotoTypes.subcategories.${key}`);
  };

  // 子类别选项配置（与上传图片页面保持一致）
  const getSubcategoryOptions = (topic: string) => {
    const subcategoryMap: { [key: string]: string[] } = {
      '新品': ['新品'],
      '自然风光': ['山脉', '海洋', '森林', '沙漠', '动物', '花卉', '烟花', '瀑布', '鸟禽', '冰雪', '江海', '夜景', '极光', '星空', '航拍', '微距'],
      '城市建筑': ['地标', '街景', '夜景'],
      '静物': ['物品'],
      '抽象与艺术': ['光影', '色彩', '纹理', '极简', '创意'],
      '人文与生活': ['人像', '街景', '情绪'],
      '其他': ['其他']
    };
    return subcategoryMap[topic] || [];
  };

  const handleTopicChange = (value: string) => {
    setSelectedTopic(value);
    setSelectedType(''); // 清空子类别选择
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const settings = await get_all_photo_settings();
        const gallery = await get_photos_presigned_url();

        const presignedMap = new Map<string, string>();
        (gallery.data || []).forEach((g: any) => presignedMap.set(g.id, g.presigned_url));

        const list: PhotoSettingItem[] = (settings.data || []).map((s: any, index: number) => ({
          id: s.id || `photo_${index}`,
          filename: s.filename,
          title: s.title,
          description: s.description,
          s3_newsize_path: presignedMap.get(s.id) || s.s3_newsize_path || "",
          type: s.type,
          topic: s.topic,
        }));
        setPhotos(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 根据搜索结果和分类过滤图片，保持搜索结果的顺序
  const filteredPhotos = useMemo(() => {
    let filtered = photos;
    
    // 如果处于搜索模式且有搜索结果，按搜索结果过滤
    if (isSearchMode && searchResult.length > 0) {
      console.log("搜索ID列表:", searchResult);
      console.log("所有图片ID列表:", photos.map(p => p.id));
      
      // 创建图片ID到图片对象的映射
      const photoMap = new Map(photos.map(photo => [photo.id, photo]));
      
      // 按照搜索结果ID的顺序来排列图片
      filtered = searchResult
        .map(id => photoMap.get(id))
        .filter(photo => photo !== undefined);
      
      console.log("搜索过滤后的图片数量:", filtered.length);
    }
    
    // 按主题过滤
    if (selectedTopic) {
      filtered = filtered.filter(photo => {
        const topic = photo.topic && typeof photo.topic === "string" && photo.topic.trim().length > 0 ? photo.topic : "其他";
        return topic === selectedTopic;
      });
    }
    
    // 按子类别过滤
    if (selectedType) {
      filtered = filtered.filter(photo => {
        const type = photo.type && typeof photo.type === "string" && photo.type.trim().length > 0 ? photo.type : "未分类";
        return type === selectedType;
      });
    }
    
    console.log("最终过滤后的图片数量:", filtered.length);
    return filtered;
  }, [photos, isSearchMode, searchResult, selectedTopic, selectedType]);

  // 按主题分组，并在每个主题下聚合所有子类(type)
  const topicGrouped = useMemo(() => {
    const map: Record<string, { items: PhotoSettingItem[]; subTypes: string[] } > = {};
    for (const p of filteredPhotos) {
      const topic = p.topic && typeof p.topic === "string" && p.topic.trim().length > 0 ? p.topic : "其他";
      if (!map[topic]) map[topic] = { items: [], subTypes: [] };
      map[topic].items.push(p);
      const t = p.type && typeof p.type === "string" && p.type.trim().length > 0 ? p.type : "未分类";
      if (!map[topic].subTypes.includes(t)) map[topic].subTypes.push(t);
    }
    // 对子类做一下排序
    Object.values(map).forEach(v => v.subTypes.sort());
    return map;
  }, [filteredPhotos]);

  const topics = useMemo(() => Object.keys(topicGrouped).sort(), [topicGrouped]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning(t("PhotoTypes.searchDescription"));
      return;
    }
    
    try {
      setSearchLoading(true);
      const result = await query_ai_photo_id(searchQuery.trim());
      console.log("搜索结果显示:", result);
      const searchIds = result.photo_id_list || [];
      setSearchResult(searchIds);
      setIsSearchMode(searchIds.length > 0);
    } catch (error) {
      console.error("搜索失败:", error);
      message.error(t("PhotoTypes.searchFailed"));
      setSearchResult([]);
      setIsSearchMode(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResult([]);
    setIsSearchMode(false);
    setSelectedTopic('');
    setSelectedType('');
  };

  return (
    <>
      <Head>
        <title>{t("PhotoTypes.pageTitle")}</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <div style={{ marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0, marginBottom: 16 }}>{t("PhotoTypes.title")}</Title>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Input
                placeholder={t("PhotoTypes.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 200 }}
              />
              <Button 
                type="primary" 
                onClick={handleSearch}
                loading={searchLoading}
              >
                {t("PhotoTypes.aiSearch")}
              </Button>
              <Select
                style={{ width: 120 }}
                placeholder={t("PhotoTypes.topic")}
                value={selectedTopic}
                onChange={handleTopicChange}
                allowClear
              >
                <Option value="新品">{getTranslatedTopic("新品")}</Option>
                <Option value="自然风光">{getTranslatedTopic("自然风光")}</Option>
                <Option value="城市建筑">{getTranslatedTopic("城市建筑")}</Option>
                <Option value="静物">{getTranslatedTopic("静物")}</Option>
                <Option value="抽象与艺术">{getTranslatedTopic("抽象与艺术")}</Option>
                <Option value="人文与生活">{getTranslatedTopic("人文与生活")}</Option>
                <Option value="其他">{getTranslatedTopic("其他")}</Option>
              </Select>
              <Select
                style={{ width: 120 }}
                placeholder={t("PhotoTypes.subcategory")}
                value={selectedType}
                onChange={setSelectedType}
                disabled={!selectedTopic}
                allowClear
              >
                {getSubcategoryOptions(selectedTopic).map(option => (
                  <Option key={option} value={option}>{getTranslatedSubcategory(option)}</Option>
                ))}
              </Select>
              {(isSearchMode || selectedTopic || selectedType) && (
                <Button 
                  onClick={handleClearSearch}
                  style={{ marginLeft: "8px" }}
                >
                  {t("PhotoTypes.clearFilters")}
                </Button>
              )}
              {isSearchMode && (
                <div style={{ marginLeft: "16px" }}>
                  <Text type="secondary">{t("PhotoTypes.searchSuccess")}: {searchResult.length} </Text>
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : isSearchMode ? (
            // 搜索模式：直接显示匹配的图片缩略图
            filteredPhotos.length === 0 ? (
              <Empty description={t("PhotoTypes.noMatchingPhotos")} />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredPhotos.map((photo) => (
                  <Col xs={12} sm={8} md={6} lg={4} xl={3} key={photo.id}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Link href={`/photo/${photo.id}`}>
                        <div
                          onContextMenu={(e) => e.preventDefault()}
                          style={{ 
                            position: "relative", 
                            width: "100%", 
                            height: 200, 
                            borderRadius: 8, 
                            overflow: "hidden", 
                            background: "#f0f0f0", 
                            cursor: "pointer", 
                            userSelect: 'none', 
                            WebkitUserSelect: 'none', 
                            WebkitTouchCallout: 'none',
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "transform 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {photo?.s3_newsize_path ? (
                            <Image
                              src={photo.s3_newsize_path}
                              alt={photo.title || photo.filename}
                              fill
                              style={{ objectFit: "cover" }}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          ) : (
                            <div style={{ width: "100%", height: 200, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Text type="secondary">{t("PhotoTypes.noImage")}</Text>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div style={{ padding: "0 4px" }}>
                        <div style={{ marginTop: 4 }}>
                          {photo.type && (
                            <Tag color="blue" style={{ fontSize: 10 }}>{getTranslatedSubcategory(photo.type)}</Tag>
                          )}
                          {photo.topic && (
                            <Tag color="green" style={{ fontSize: 10 }}>{getTranslatedTopic(photo.topic)}</Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )
          ) : topics.length === 0 ? (
            <Empty description={t("PhotoTypes.noPhotos")} />
          ) : (
            // 非搜索模式：按主题分类显示
            <Row gutter={[24, 24]}>
              {topics.map((topic) => (
                <Col xs={24} sm={24} md={24} lg={24} key={topic}>
                  <div style={{ marginBottom: 0 }}>
                    {/* 第一行：主题名字 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Title level={4} style={{ margin: 0 }}>{getTranslatedTopic(topic)}</Title>
                      <Tag color="blue">{topicGrouped[topic].items.length}</Tag>
                    </div>
                    {/* 第二行：该主题下所有子类（横向排列；每个子类仅展示1张样例） */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                      {topicGrouped[topic].subTypes.map((sub) => {
                        const subItems = topicGrouped[topic].items.filter(p => {
                        const typeLabel =
                          p.type && typeof p.type === "string" && p.type.trim().length > 0
                            ? p.type
                            : t("PhotoTypes.uncategorized");
                        return typeLabel === sub;

                        });
                        if (subItems.length === 0) return null;
                        const p = subItems[0];
                        return (
                          <div key={sub} style={{ width: 180, display: "flex", flexDirection: "column", gap: 6 }}>
                            <Tag color="geekblue" style={{ width: "fit-content" }}>
                              <Link href={`/photo/type/${encodeURIComponent(sub)}`}>
                                {getTranslatedSubcategory(sub)}（{subItems.length}）
                              </Link>
                            </Tag>
                            <Link href={`/photo/type/${encodeURIComponent(sub)}`}>
                              <div
                                onContextMenu={(e) => e.preventDefault()}
                                style={{ position: "relative", width: 180, height: 110, borderRadius: 6, overflow: "hidden", background: "#f0f0f0", cursor: "pointer", userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                              >
                                {p?.s3_newsize_path ? (
                                  <Image
                                    src={p.s3_newsize_path}
                                    alt={p.title || p.filename}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                  />
                                ) : (
                                  <div style={{ width: 180, height: 110, background: "#f5f5f5" }} />
                                )}
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </main>
    </>
  );
}


