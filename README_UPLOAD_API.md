# 图片上传API使用说明

## 概述
本项目新增了两个API端点用于上传图片到AWS S3存储桶：
- `/upload_photo` - 上传单张图片
- `/upload_multiple_photos` - 批量上传多张图片

## API端点

### 1. 上传单张图片
**端点**: `POST /upload_photo`

**请求体**:
```json
{
  "photo_data": "base64编码的图片数据",
  "file_name": "可选的文件名"
}
```

**响应**:
```json
{
  "message": "Success",
  "result": {
    "status": "success",
    "message": "Photo uploaded successfully",
    "file_name": "photo_20241201_143022_a1b2c3d4.jpg",
    "s3_key": "photos/photo_20241201_143022_a1b2c3d4.jpg",
    "s3_url": "https://zsbtest.s3.amazonaws.com/photos/photo_20241201_143022_a1b2c3d4.jpg",
    "bucket": "zsbtest",
    "upload_time": "20241201_143022"
  }
}
```

### 2. 批量上传图片
**端点**: `POST /upload_multiple_photos`

**请求体**:
```json
{
  "photos_data": [
    "base64编码的图片数据1",
    "base64编码的图片数据2"
  ]
}
```

**响应**:
```json
{
  "message": "Success",
  "result": {
    "status": "success",
    "message": "Successfully uploaded 2 photos",
    "photos": [
      {
        "status": "success",
        "message": "Photo uploaded successfully",
        "file_name": "photo_20241201_143022_1.jpg",
        "s3_key": "photos/photo_20241201_143022_1.jpg",
        "s3_url": "https://zsbtest.s3.amazonaws.com/photos/photo_20241201_143022_1.jpg",
        "bucket": "zsbtest",
        "upload_time": "20241201_143022"
      },
      {
        "status": "success",
        "message": "Photo uploaded successfully",
        "file_name": "photo_20241201_143022_2.jpg",
        "s3_key": "photos/photo_20241201_143022_2.jpg",
        "s3_url": "https://zsbtest.s3.amazonaws.com/photos/photo_20241201_143022_2.jpg",
        "bucket": "zsbtest",
        "upload_time": "20241201_143022"
      }
    ]
  }
}
```

## 部署说明

1. 确保AWS凭证已正确配置
2. 运行部署命令：
   ```bash
   serverless deploy
   ```
3. 部署完成后，会获得API Gateway的URL

## 注意事项

- 图片数据必须是base64编码的字符串
- 支持的文件格式：JPG, JPEG, PNG, GIF, BMP
- 如果不提供文件名，系统会自动生成带时间戳的唯一文件名
- 上传的图片会被设置为公开可访问
- 图片会存储在S3存储桶的`photos/`目录下
