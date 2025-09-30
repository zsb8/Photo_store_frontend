import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Col, Row, Spin, Typography, Empty, Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import ImagePreviewModal from "../../../components/ImagePreviewModal";
import styles from "../../../styles/home.module.css";
import { get_all_photo_settings, get_photos_presigned_url } from "../../../util/aws-api";

const { Title } = Typography;

export default function PhotoTypeListPage() {
  const router = useRouter();
  const { type } = router.query as { type?: string };
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewAlt, setPreviewAlt] = useState<string>("");
  const [previewId, setPreviewId] = useState<string>("");

  useEffect(() => {
    if (!type) return;
    const load = async () => {
      try {
        setLoading(true);
        const settings = await get_all_photo_settings();
        const gallery = await get_photos_presigned_url();
        const presignedMap = new Map<string, string>();
        (gallery.data || []).forEach((g: any) => presignedMap.set(g.id, g.presigned_url));
        const list = (settings.data || []).map((s: any, index: number) => ({
          id: s.id || `photo_${index}`,
          title: s.title || s.filename,
          description: s.description,
          type: s.type,
          url: presignedMap.get(s.id) || s.s3_newsize_path || "",
          filename: s.filename,
        }));
        const targetType = typeof type === 'string' ? type : '';
        const filtered = list.filter((p: any) => {
          const key = p.type && typeof p.type === 'string' && p.type.trim().length > 0 ? p.type : 'other';
          return key === targetType;
        });
        setItems(filtered);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type]);

  const openPreview = (id: string, url: string, alt: string) => {
    setPreviewId(id);
    setPreviewUrl(url);
    setPreviewAlt(alt);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <Head>
        <title>分类：{type}</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>分类：{type}</Title>
            <Link href="/photo_types"><Button>返回分类</Button></Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : items.length === 0 ? (
            <Empty description="该分类暂无图片" />
          ) : (
            <Row gutter={[16, 16]}>
              {items.map((p) => (
                <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
                  <div 
                    style={{ position: 'relative', width: 320, height: 200, borderRadius: 8, overflow: 'hidden', background: '#f0f0f0', cursor: 'zoom-in', margin: '0 auto' }}
                    onClick={() => openPreview(p.id, p.url, p.title || p.filename)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {p.url ? (
                      <Image src={p.url} alt={p.title || p.filename} fill style={{ objectFit: 'contain' }} />
                    ) : (
                      <div style={{ height: 200, background: '#f5f5f5' }} />
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          )}
          <ImagePreviewModal
            isOpen={isPreviewOpen}
            imageUrl={previewUrl}
            imageAlt={previewAlt}
            onClose={() => setIsPreviewOpen(false)}
            onImageClick={() => {
              if (previewId) {
                router.push(`/photo/${encodeURIComponent(previewId)}`);
              }
            }}
          />
        </div>
      </main>
    </>
  );
}
