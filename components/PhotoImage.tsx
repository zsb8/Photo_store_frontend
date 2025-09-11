import React from 'react';
import Image from 'next/image';
import { getPresignedUrlFromStorage } from '../util/aws-api';

interface PhotoImageProps {
  photoId: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  className?: string;
  fallback?: React.ReactNode;
  onError?: (e: any) => void;
}

/**
 * 通用图片显示组件
 * 自动从本地存储获取预授权链接来显示图片
 */
const PhotoImage: React.FC<PhotoImageProps> = ({
  photoId,
  alt,
  width,
  height,
  fill = false,
  style,
  className,
  fallback,
  onError
}) => {
  // 从本地存储获取预授权链接
  const presignedUrl = getPresignedUrlFromStorage(photoId);
  
  // 添加调试日志
  console.log('PhotoImage Debug:', {
    photoId,
    presignedUrl: presignedUrl ? 'Found' : 'Not found',
    presignedUrlLength: presignedUrl?.length || 0
  });

  // 如果没有找到预授权链接，显示fallback或默认内容
  if (!presignedUrl) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div style={{
        width: width || '100%',
        height: height || '200px',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px',
        borderRadius: '4px',
        ...style
      }}>
        图片加载中
      </div>
    );
  }

  // 使用预授权链接显示图片
  if (fill) {
    return (
      <Image
        src={presignedUrl}
        alt={alt}
        fill
        style={style}
        className={className}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={presignedUrl}
      alt={alt}
      width={width}
      height={height}
      style={style}
      className={className}
      onError={onError}
    />
  );
};

export default PhotoImage;
