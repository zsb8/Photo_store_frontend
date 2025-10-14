import React, { useEffect, useMemo, useState } from 'react';
import { Card, Image, Checkbox, Button, message, Space, Pagination, Select } from 'antd';
import { get_all_photo_settings, get_photos_presigned_url, save_photo_settings, set_home_carousel_photos } from '../util/aws-api';

interface SettingItem {
  id: string;
  filename: string;
  title?: string;
  description?: string;
  prices?: any;
  s3_newsize_path?: string;
  place?: string;
}

interface GalleryItem {
  id: string;
  presigned_url: string;
}

const HomeCarouselSelector: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [galleryMap, setGalleryMap] = useState<Map<string, string>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(48);

  const load = async () => {
    setLoading(true);
    try {
      const [settingsResp, galleryResp] = await Promise.all([
        get_all_photo_settings(),
        get_photos_presigned_url(),
      ]);

      const items: SettingItem[] = (settingsResp.data || []).map((s: any) => ({
        id: s.id,
        filename: s.filename,
        title: s.title,
        description: s.description,
        prices: s.prices,
        s3_newsize_path: s.s3_newsize_path,
        place: s.place,
      }));
      setSettings(items);

      const gMap = new Map<string, string>();
      (galleryResp.data || []).forEach((g: any) => gMap.set(g.id, g.presigned_url));
      setGalleryMap(gMap);

      const preSelected = new Set<string>(items.filter(it => it.place === 'homepage').map(it => it.id));
      setSelectedIds(preSelected);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const save = async () => {
    setLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const resp = await set_home_carousel_photos(ids);
      if (resp.success) {
        message.success(resp.message || '已保存首页滚动图片设置');
        await load();
      } else {
        message.error(resp.message || '保存失败');
      }
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(() => settings, [settings]);
  const total = cards.length;
  const pagedCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return cards.slice(start, start + pageSize);
  }, [cards, page, pageSize]);

  return (
    <Card
      title="主页滚动图片选择"
      loading={loading}
      extra={<Button type="primary" onClick={save}>保存</Button>}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>共 {total} 张</div>
        <Space>
          <span>每页</span>
          <Select
            size="small"
            value={pageSize}
            style={{ width: 88 }}
            options={[{ value: 24, label: '24' }, { value: 48, label: '48' }, { value: 96, label: '96' }]}
            onChange={(v) => { setPage(1); setPageSize(v); }}
          />
          <span>张</span>
        </Space>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {pagedCards.map((s) => {
          const url = galleryMap.get(s.id) || s.s3_newsize_path || '';
          const checked = selectedIds.has(s.id);
          return (
            <Card key={s.id} size="small" bodyStyle={{ padding: 6 }} hoverable>
              <div style={{ position: 'relative', width: '100%', height: 110, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                {url ? (
                  <Image src={url} alt={s.title || s.filename} style={{ objectFit: 'cover', width: '100%', height: '100%' }} preview={false} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>无图</div>
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div style={{ fontWeight: 500, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title || s.filename}</div>
                  <Checkbox checked={checked} onChange={(e) => toggle(s.id, e.target.checked)}>首页滚动</Checkbox>
                </Space>
              </div>
            </Card>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          size="small"
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger={false}
          onChange={(p) => setPage(p)}
        />
      </div>
    </Card>
  );
};

export default HomeCarouselSelector;


