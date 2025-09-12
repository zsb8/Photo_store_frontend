# AWS 图片上传 API 使用说明

## 概述

本项目已集成AWS图片上传功能，支持单个和批量图片上传到AWS S3存储。

## API 端点

- **URL**: `https://gegfmomdl9.execute-api.us-east-1.amazonaws.com/upload_photo`
- **方法**: POST
- **内容类型**: application/json

## 请求格式

```json
{
  "photo_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "file_name": "testzsbphoto",
  "title": "图片标题",
  "description": "图片描述",
  "prices": {
    "small": 0.31,
    "medium": 0.41,
    "large": 0.51
  }
}
```

### 参数说明

- `photo_data`: Base64编码的图片数据（不包含data:image前缀）
- `file_name`: 图片文件名
- `title`: 图片标题（可选）
- `description`: 图片描述（可选）
- `prices`: 价格信息对象（可选）
  - `small`: 小图片价格
  - `medium`: 中图片价格
  - `large`: 大图片价格

## 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "图片上传成功",
  "photo_url": "https://your-s3-bucket.s3.amazonaws.com/path/to/image.jpg",
  "file_name": "testzsbphoto"
}
```

### 失败响应
```json
{
  "success": false,
  "message": "上传失败的具体原因"
}
```

## 使用方法

### 1. 单个图片上传

```typescript
import { upload_photo, fileToBase64 } from '../util/aws-api';

// 上传单个图片
const handleUpload = async (file: File) => {
  try {
    // 将文件转换为Base64
    const base64Data = await fileToBase64(file);
    
    // 调用上传API
    const result = await upload_photo(
      base64Data, 
      file.name,
      "图片标题", // 可选
      "图片描述", // 可选
      {
        small: 0.31,
        medium: 0.41,
        large: 0.51
      } // 可选
    );
    
    if (result.success) {
      console.log('上传成功:', result.photo_url);
    } else {
      console.error('上传失败:', result.message);
    }
  } catch (error) {
    console.error('上传错误:', error);
  }
};
```

### 2. 批量图片上传

```typescript
import { upload_multiple_photos } from '../util/aws-api';

// 批量上传图片
const handleBatchUpload = async (files: File[]) => {
  try {
    const results = await upload_multiple_photos(
      files,
      "批量上传标题", // 可选
      "批量上传描述", // 可选
      {
        small: 0.31,
        medium: 0.41,
        large: 0.51
      } // 可选
    );
    
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`文件 ${files[index].name} 上传成功`);
      } else {
        console.error(`文件 ${files[index].name} 上传失败:`, result.message);
      }
    });
  } catch (error) {
    console.error('批量上传错误:', error);
  }
};
```

### 3. 文件转Base64

```typescript
import { fileToBase64 } from '../util/aws-api';

// 将File对象转换为Base64字符串
const convertToBase64 = async (file: File) => {
  const base64Data = await fileToBase64(file);
  console.log('Base64数据:', base64Data);
};
```

## 在后台管理系统中的使用

后台管理系统已集成此上传功能：

1. **单个图片上传**: 在"上传单个图片"页面中，选择图片后会自动调用AWS API上传
2. **批量图片上传**: 在"上传批量图片"页面中，选择多个图片后会自动批量上传
3. **测试功能**: 在"测试上传功能"页面中可以测试API功能

## 错误处理

API包含完整的错误处理机制：

- 网络错误
- 文件格式错误
- AWS服务错误
- 文件大小限制

## 注意事项

1. **文件格式**: 支持常见的图片格式（JPEG, PNG, GIF等）
2. **文件大小**: 建议单个文件不超过10MB
3. **Base64编码**: 自动处理文件到Base64的转换
4. **并发上传**: 批量上传支持并发处理
5. **错误重试**: 包含基本的错误重试机制

## 测试页面

访问 `/test-upload` 页面可以测试上传功能：

- 单个文件上传测试
- 批量文件上传测试
- 实时上传状态显示
- 详细的上传结果记录

## 集成到现有项目

1. 确保已安装所需依赖
2. 导入相关函数
3. 在需要的地方调用上传API
4. 处理返回结果

```typescript
// 示例：在表单提交时上传图片
const handleFormSubmit = async (values: any) => {
  const file = values.image?.[0]?.originFileObj;
  if (file) {
    const base64Data = await fileToBase64(file);
    const uploadResult = await upload_photo(
      base64Data, 
      file.name,
      values.title, // 从表单获取标题
      values.description, // 从表单获取描述
      {
        small: values.smallPrice,
        medium: values.mediumPrice,
        large: values.largePrice
      } // 从表单获取价格
    );
    
    if (uploadResult.success) {
      // 使用返回的URL保存到数据库
      const photoUrl = uploadResult.photo_url;
      // ... 其他处理逻辑
    }
  }
};
```
