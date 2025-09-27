import React from 'react';

// 声明全局EXIF变量
declare global {
  interface Window {
    EXIF: any;
  }
}

// 动态加载EXIF库的函数
const loadEXIF = async () => {
  if (typeof window === 'undefined') return null;
  
  // 如果全局EXIF已存在，直接使用
  if (window.EXIF) {
    return window.EXIF;
  }
  
  try {
    // 使用动态导入加载EXIF库
    const exifModule = await import('exif-js');
    const EXIF = exifModule.default || exifModule;
    // 缓存到全局变量
    window.EXIF = EXIF;
    return EXIF;
  } catch (error) {
    console.warn('无法加载exif-js库:', error);
    return null;
  }
};

/**
 * 图片EXIF信息接口
 */
export interface ImageExifInfo {
  dateTaken: string | null;
  make: string | null;
  model: string | null;
  orientation: string | null;
  width: string | null;
  height: string | null;
  iso: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  focalLength: string | null;
  flash: string | null;
  whiteBalance: string | null;
}

/**
 * 提取图片的拍摄日期
 * @param file - 图片文件
 * @returns Promise<string | null> - 拍摄日期（ISO格式）或null
 */
export const extractDateTaken = async (file: File): Promise<string | null> => {
  // 动态加载EXIF库
  const EXIF = await loadEXIF();
  
  if (!EXIF) {
    console.warn('EXIF库未加载');
    return null;
  }

  return new Promise((resolve) => {

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          // @ts-ignore - EXIF库的类型定义有问题
          EXIF.getData(img, function() {
            // @ts-ignore
            const dateTaken = EXIF.getTag(this, "DateTimeOriginal") || 
                            // @ts-ignore
                            EXIF.getTag(this, "DateTime") || 
                            // @ts-ignore
                            EXIF.getTag(this, "DateTimeDigitized");
            
            if (dateTaken) {
              // 将EXIF日期格式转换为ISO格式
              // EXIF格式通常是 "YYYY:MM:DD HH:MM:SS"
              const isoDate = dateTaken.replace(/:/g, '-').replace(' ', 'T');
              resolve(isoDate);
            } else {
              resolve(null);
            }
          });
        } catch (error) {
          console.warn('无法读取EXIF数据:', error);
          resolve(null);
        }
      };
      img.src = (e.target as FileReader)?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 提取图片的完整EXIF信息
 * @param file - 图片文件
 * @returns Promise<ImageExifInfo> - 完整的EXIF信息
 */
export const extractImageExifInfo = async (file: File): Promise<ImageExifInfo> => {
  // 动态加载EXIF库
  const EXIF = await loadEXIF();
  
  if (!EXIF) {
    console.warn('EXIF库未加载');
    return {
      dateTaken: null,
      make: null,
      model: null,
      orientation: null,
      width: null,
      height: null,
      iso: null,
      aperture: null,
      shutterSpeed: null,
      focalLength: null,
      flash: null,
      whiteBalance: null
    };
  }

  return new Promise((resolve) => {

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          // @ts-ignore - EXIF库的类型定义有问题
          EXIF.getData(img, function() {
            const exifInfo: ImageExifInfo = {
              // @ts-ignore
              dateTaken: EXIF.getTag(this, "DateTimeOriginal") || 
                        // @ts-ignore
                        EXIF.getTag(this, "DateTime") || 
                        // @ts-ignore
                        EXIF.getTag(this, "DateTimeDigitized"),
              // @ts-ignore
              make: EXIF.getTag(this, "Make"),
              // @ts-ignore
              model: EXIF.getTag(this, "Model"),
              // @ts-ignore
              orientation: EXIF.getTag(this, "Orientation"),
              // @ts-ignore
              width: EXIF.getTag(this, "PixelXDimension"),
              // @ts-ignore
              height: EXIF.getTag(this, "PixelYDimension"),
              // @ts-ignore
              iso: EXIF.getTag(this, "ISOSpeedRatings"),
              // @ts-ignore
              aperture: EXIF.getTag(this, "FNumber"),
              // @ts-ignore
              shutterSpeed: EXIF.getTag(this, "ExposureTime"),
              // @ts-ignore
              focalLength: EXIF.getTag(this, "FocalLength"),
              // @ts-ignore
              flash: EXIF.getTag(this, "Flash"),
              // @ts-ignore
              whiteBalance: EXIF.getTag(this, "WhiteBalance")
            };

            // 处理日期格式
            if (exifInfo.dateTaken) {
              exifInfo.dateTaken = exifInfo.dateTaken.replace(/:/g, '-').replace(' ', 'T');
            }

            resolve(exifInfo);
          });
        } catch (error) {
          console.warn('无法读取EXIF数据:', error);
          resolve({
            dateTaken: null,
            make: null,
            model: null,
            orientation: null,
            width: null,
            height: null,
            iso: null,
            aperture: null,
            shutterSpeed: null,
            focalLength: null,
            flash: null,
            whiteBalance: null
          });
        }
      };
      img.src = (e.target as FileReader)?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 格式化EXIF信息为JSON字符串
 * @param exifInfo - EXIF信息对象
 * @returns string - JSON字符串格式的EXIF信息
 */
export const formatExifInfo = (exifInfo: ImageExifInfo): string => {
  // 将所有数字类型字段转换为字符串
  const stringifiedExifInfo = {
    dateTaken: exifInfo.dateTaken,
    make: exifInfo.make,
    model: exifInfo.model,
    orientation: exifInfo.orientation !== null ? String(exifInfo.orientation) : null,
    width: exifInfo.width !== null ? String(exifInfo.width) : null,
    height: exifInfo.height !== null ? String(exifInfo.height) : null,
    iso: exifInfo.iso !== null ? String(exifInfo.iso) : null,
    aperture: exifInfo.aperture !== null ? String(exifInfo.aperture) : null,
    shutterSpeed: exifInfo.shutterSpeed !== null ? String(exifInfo.shutterSpeed) : null,
    focalLength: exifInfo.focalLength !== null ? String(exifInfo.focalLength) : null,
    flash: exifInfo.flash !== null ? String(exifInfo.flash) : null,
    whiteBalance: exifInfo.whiteBalance !== null ? String(exifInfo.whiteBalance) : null
  };
  
  return JSON.stringify(stringifiedExifInfo, null, 2);
};

/**
 * 格式化EXIF信息为可读字符串（保留原有功能）
 * @param exifInfo - EXIF信息对象
 * @returns string - 格式化的信息字符串
 */
export const formatExifInfoReadable = (exifInfo: ImageExifInfo): string => {
  const info: string[] = [];
  
  if (exifInfo.dateTaken) {
    info.push(`拍摄日期: ${exifInfo.dateTaken}`);
  }
  if (exifInfo.make && exifInfo.model) {
    info.push(`相机: ${exifInfo.make} ${exifInfo.model}`);
  }
  if (exifInfo.width && exifInfo.height) {
    info.push(`尺寸: ${exifInfo.width} × ${exifInfo.height}`);
  }
  if (exifInfo.iso) {
    info.push(`ISO: ${exifInfo.iso}`);
  }
  if (exifInfo.aperture) {
    info.push(`光圈: f/${exifInfo.aperture}`);
  }
  if (exifInfo.shutterSpeed) {
    info.push(`快门: 1/${Math.round(1/Number(exifInfo.shutterSpeed))}s`);
  }
  if (exifInfo.focalLength) {
    info.push(`焦距: ${exifInfo.focalLength}mm`);
  }
  
  return info.join('\n');
};

/**
 * 从JSON字符串解析EXIF信息
 * @param jsonString - JSON字符串
 * @returns ImageExifInfo - EXIF信息对象
 */
export const parseExifInfoFromJson = (jsonString: string): ImageExifInfo => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('解析EXIF JSON字符串失败:', error);
    return {
      dateTaken: null,
      make: null,
      model: null,
      orientation: null,
      width: null,
      height: null,
      iso: null,
      aperture: null,
      shutterSpeed: null,
      focalLength: null,
      flash: null,
      whiteBalance: null
    };
  }
};
