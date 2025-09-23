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
        }));
        setPhotos(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, PhotoSettingItem[]> = {};
    for (const p of photos) {
      const key = p.type && typeof p.type === "string" && p.type.trim().length > 0 ? p.type : "other";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [photos]);

  const keys = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  return (
    <>
      <Head>
        <title>相片分类</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <Title level={2} style={{ marginBottom: 16 }}>相片分类</Title>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : keys.length === 0 ? (
            <Empty description="暂无相片" />
          ) : (
            keys.map((k) => (
              <div key={k} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Title level={4} style={{ margin: 0 }}>{k}</Title>
                  <Tag color="blue">{grouped[k].length}</Tag>
                  <Link href={`/photo/type/${encodeURIComponent(k)}`}>查看该分类</Link>
                </div>
                <Row gutter={[16, 16]}>
                  {grouped[k].slice(0, 6).map((p) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
                      <div style={{ position: "relative", height: 180, borderRadius: 8, overflow: "hidden", background: "#f0f0f0" }}>
                        {p.s3_newsize_path ? (
                          <Image src={p.s3_newsize_path} alt={p.title || p.filename} fill style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ height: 180, background: "#f5f5f5" }} />
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}


