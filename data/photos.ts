export interface PhotoSize {
  size: 'small' | 'medium' | 'large';
  label: string;
  price: number;
}

export interface Photo {
  id: number;
  uniqueId: string;
  src: string;
  alt: string;
  sizes: PhotoSize[];
  description: string;
}

export const photos: Photo[] = [
  { 
    id: 1, 
    uniqueId: "photo_abc123def456",
    src: "/1.jpg", 
    alt: "Photo 1", 
    sizes: [
      { size: 'small', label: '小图片', price: 0.31 },
      { size: 'medium', label: '中图片', price: 0.41 },
      { size: 'large', label: '大图片', price: 0.51 }
    ],
    description: "this is a test description .....1.jpg......  only for test"
  },
  { 
    id: 2, 
    uniqueId: "photo_ghi789jkl012",
    src: "/2.jpg", 
    alt: "Photo 2", 
    sizes: [
      { size: 'small', label: '小图片', price: 0.41 },
      { size: 'medium', label: '中图片', price: 0.51 },
      { size: 'large', label: '大图片', price: 0.61 }
    ],
    description: "this is a test description .....2.jpg......  only for test"
  },
  { 
    id: 3, 
    uniqueId: "photo_mno345pqr678",
    src: "/3.jpg", 
    alt: "Photo 3", 
    sizes: [
      { size: 'small', label: '小图片', price: 0.51 },
      { size: 'medium', label: '中图片', price: 0.61 },
      { size: 'large', label: '大图片', price: 0.71 }
    ],
    description: "this is a test description .....3.jpg......  only for test"
  },
  { 
    id: 4, 
    uniqueId: "photo_stu901vwx234",
    src: "/4.jpg", 
    alt: "Photo 4", 
    sizes: [
      { size: 'small', label: '小图片', price: 0.61 },
      { size: 'medium', label: '中图片', price: 0.71 },
      { size: 'large', label: '大图片', price: 0.81 }
    ],
    description: "this is a test description .....4.jpg......  only for test"
  },
];

// 根据ID查找照片
export const findPhotoById = (id: number): Photo | undefined => {
  return photos.find(photo => photo.id === id);
};

// 根据唯一ID查找照片
export const findPhotoByUniqueId = (uniqueId: string): Photo | undefined => {
  return photos.find(photo => photo.uniqueId === uniqueId);
};
