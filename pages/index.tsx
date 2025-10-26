import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Carousel, Spin, Typography } from "antd";
import styles from "../styles/home.module.css";
import { get_photos_presigned_url } from "../util/aws-api";
import { useI18n } from "../contexts/I18nContext";

interface SlidePhoto {
  id: string;
  presigned_url: string;
  filename: string;
}

const SlideshowHome: React.FC = () => {
  const { t } = useI18n();
  const [photos, setPhotos] = useState<SlidePhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await get_photos_presigned_url();
        if (resp && resp.data) {
          const list = resp.data
            .filter((p: any) =>
              p.presigned_url &&
              !String(p.presigned_url).includes("error") &&
              p.is_home_carousel === "1"
            )
            .slice(0, 5)
            .map((p: any) => ({ id: p.id, presigned_url: p.presigned_url, filename: p.filename || "" }));
          setPhotos(list);
        } else {
          setPhotos([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [showImageSharp, setShowImageSharp] = useState<boolean>(false);
  const [imagesReady, setImagesReady] = useState<boolean>(false);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleBeforeChange = () => {
    // 切换前先隐藏文字，并清理定时器
    setShowOverlay(false);
    setShowImageSharp(false);
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }
  };

  const handleAfterChange = (newIndex: number) => {
    setCurrentSlide(newIndex);
    // 图片切入后，稍后再显示文字
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlay(true);
    }, 200);
    // 让图片从模糊到清晰
    imageTimerRef.current = setTimeout(() => {
      setShowImageSharp(true);
    }, 60);
  };

  useEffect(() => {
    // 当图片资源准备就绪后，做一次延迟显示
    if (!loading && imagesReady && photos.length > 0) {
      // 首次展示：图片和文字一起立即显示
      setShowImageSharp(true);
      setShowOverlay(true);
    }
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current);
      }
    };
  }, [loading, imagesReady, photos.length]);

  // 预加载前五张图片，确保图片都下载完毕后再开始轮播
  useEffect(() => {
    if (photos.length === 0) {
      setImagesReady(false);
      return;
    }
    const targets = photos.slice(0, 5);
    let cancelled = false;
    const preload = async () => {
      const loaders = targets.map((p) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = p.presigned_url;
        })
      );
      await Promise.all(loaders);
      if (!cancelled) setImagesReady(true);
    };
    setImagesReady(false);
    preload();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  return (
    <>
      <Head>
        <title>{t("Home.title")}</title>
      </Head>
      <div style={{ minHeight: "calc(100vh - 64px)", background: "#000" }}>
        {loading || !imagesReady ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <Spin size="large" />
            <span style={{ marginLeft: "16px", color: "#fff" }}>{t("Common.loading")}</span>
          </div>
        ) : (
          <Carousel
            autoplay
            dots
            pauseOnHover={false}
            draggable
            autoplaySpeed={5200}
            speed={1600}
            beforeChange={handleBeforeChange}
            afterChange={handleAfterChange}
            className={styles.fullHeightCarousel}
            style={{ height: "calc(100vh - 64px)" }}
          >
            {photos.slice(0, 5).map((p, idx) => (
              <div key={p.id} className={styles.fullHeightSlide}>
                <Image
                  src={p.presigned_url}
                  alt={p.filename}
                  fill
                  style={{
                    objectFit: "contain",
                    // 第一张在加载圈圈结束后直接清晰；后续按过渡
                    filter:
                      idx === 0
                        ? "blur(0px)"
                        : currentSlide === idx && showImageSharp
                        ? "blur(0px)"
                        : "blur(8px)",
                    transition: "filter 900ms ease",
                  }}
                  priority={idx === 0}
                />
                <div
                  className={styles.heroOverlay}
                  style={{
                    opacity:
                      (idx === 0 && imagesReady)
                        ? 1
                        : (currentSlide === idx && showOverlay ? 1 : 0),
                    transition: "opacity 800ms ease 200ms",
                  }}
                >
                  <div className={styles.heroLineTop}>{t("Home.heroSubtitle")}</div>
                  <div className={styles.heroTitle}>{t("Home.heroTitle")}</div>
                  <div className={styles.heroLineBottom}>{t("Home.heroDescription")}</div>
                </div>
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </>
  );
};

export default SlideshowHome;
