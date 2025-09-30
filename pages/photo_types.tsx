import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Col, Row, Spin, Typography, Tag, Empty } from "antd";
import Image from "next/image";
import styles from "../styles/home.module.css";
import { get_all_photo_settings, get_photos_presigned_url } from "../util/aws-api";

const { Title, Text } = Typography;

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
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<PhotoSettingItem[]>([]);

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

  // 按主题分组，并在每个主题下聚合所有子类(type)
  const topicGrouped = useMemo(() => {
    const map: Record<string, { items: PhotoSettingItem[]; subTypes: string[] } > = {};
    for (const p of photos) {
      const topic = p.topic && typeof p.topic === "string" && p.topic.trim().length > 0 ? p.topic : "其他";
      if (!map[topic]) map[topic] = { items: [], subTypes: [] };
      map[topic].items.push(p);
      const t = p.type && typeof p.type === "string" && p.type.trim().length > 0 ? p.type : "未分类";
      if (!map[topic].subTypes.includes(t)) map[topic].subTypes.push(t);
    }
    // 对子类做一下排序
    Object.values(map).forEach(v => v.subTypes.sort());
    return map;
  }, [photos]);

  const topics = useMemo(() => Object.keys(topicGrouped).sort(), [topicGrouped]);

  return (
    <>
      <Head>
        <title>图片分类</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <Title level={2} style={{ marginBottom: 16 }}>图片分类</Title>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : topics.length === 0 ? (
            <Empty description="暂无图片" />
          ) : (
            <Row gutter={[24, 24]}>
              {topics.map((topic) => (
                <Col xs={24} sm={24} md={24} lg={24} key={topic}>
                  <div style={{ marginBottom: 0 }}>
                    {/* 第一行：主题名字 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Title level={4} style={{ margin: 0 }}>{topic}</Title>
                      <Tag color="blue">{topicGrouped[topic].items.length}</Tag>
                    </div>
                    {/* 第二行：该主题下所有子类（横向排列；每个子类仅展示1张样例） */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                      {topicGrouped[topic].subTypes.map((sub) => {
                        const subItems = topicGrouped[topic].items.filter(p => {
                          const t = p.type && typeof p.type === "string" && p.type.trim().length > 0 ? p.type : "未分类";
                          return t === sub;
                        });
                        if (subItems.length === 0) return null;
                        const p = subItems[0];
                        return (
                          <div key={sub} style={{ width: 180, display: "flex", flexDirection: "column", gap: 6 }}>
                            <Tag color="geekblue" style={{ width: "fit-content" }}>
                              <Link href={`/photo/type/${encodeURIComponent(sub)}`}>
                                {sub}（{subItems.length}）
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


