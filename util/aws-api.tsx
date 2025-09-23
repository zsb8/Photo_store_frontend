import { prepareGetRequest, preparePostRequest } from "@/util/request-helper";
const urlprefix = process.env.NEXT_PUBLIC_URLPREFIX ?? "";
// 图片上传接口类型定义
interface UploadPhotoRequest {
    photo_data: string;  // Base64编码的图片数据
    file_name: string;   // 文件名
    title?: string;      // 图片标题
    description?: string; // 图片描述
    prices?: {           // 价格信息
        small: number;   // 小图片价格
        medium: number;  // 中图片价格
        large: number;   // 大图片价格
    };
}

interface UploadPhotoResponse {
    success: boolean;
    message: string;
    photo_url?: string;  // 上传成功后的图片URL
    file_name?: string;  // 上传的文件名
}

/**
 * 上传图片到AWS API，注意，这里因为AWS APIGateway的限制，单个图片大小不能超过2M
 * @param photoData - Base64编码的图片数据
 * @param filename - 文件名
 * @param title - 图片标题（可选）
 * @param description - 图片描述（可选）
 * @param prices - 价格信息（可选）
 * @returns Promise<UploadPhotoResponse>
 */
export async function upload_photo(
    photoData: string, 
    filename: string, 
    title?: string, 
    description?: string, 
    prices?: { small: number; medium: number; large: number },
    size?: string,
    type?: string,
    place?: string,
    photo_year?: string
): Promise<UploadPhotoResponse> {
    console.log("!!!!=====upload_photo START");
    console.log("Photo data:", photoData);
    console.log("Filename:", filename);
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Prices:", prices);
    console.log("Size:", size);
    console.log("Type:", type);
    console.log("Place:", place);
    console.log("Photo year:", photo_year);
    console.log("!!!!=====upload_photo END");

    const uploadUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/upload_photo`;
    
    // 第一步：上传图片（只使用photo_data和file_name）
    const uploadData: UploadPhotoRequest = {
        photo_data: photoData,
        file_name: filename
    };
    console.log("Uploading photo:", { filename, dataLength: photoData.length });
    const requestParams = preparePostRequest(JSON.stringify(uploadData));
    
    try {
        const response = await fetch(uploadUrl, requestParams);
        const result = await response.json();
        console.log("Upload response:", result);
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        if (result.error) {
            throw new Error(result.message || result.error);
        }
        
        // 第二步：图片上传成功后，保存图片设置到DynamoDB
        console.log("Photo upload successful, now saving photo settings...");
        
        // 检查返回结果中是否有 record_id
        if (!result.result || !result.result.record_id) {
            // 如果没有 record_id，设置 result.error
            result.error = "Missing record_id in upload response";
            throw new Error("上传响应中缺少 record_id");
        }
        
        const record_id = result.result.record_id;
        console.log("Parameters being passed to save_photo_settings:", {
            filename,
            title,
            description,
            prices,
            record_id,
            size,
            type,
            place,
            photo_year,
        });
        
        const saveSettingsResult = await save_photo_settings(
            filename,
            title,
            description,
            prices,
            record_id,
            size,
            type,
            place,
            photo_year
        );
        
        if (!saveSettingsResult.success) {
            console.error("Photo uploaded but settings save failed:", saveSettingsResult.message);
            console.error("Full error details:", saveSettingsResult);
            // 即使设置保存失败，图片上传仍然成功
        } else {
            console.log("Photo settings saved successfully");
        }
        
        return {
            success: true,
            message: result.message || "图片上传成功",
            photo_url: result.photo_url,
            file_name: result.file_name || filename
        };
    } catch (error) {
        console.error('Error uploading photo:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '图片上传失败'
        };
    }
}

/**
 * 将File对象转换为Base64字符串
 * @param file - 要转换的文件
 * @returns Promise<string> - Base64编码的字符串
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // 移除 data:image/jpeg;base64, 前缀，只保留Base64数据
            const base64Data = result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = (error) => reject(error);
    });
}

// 保存图片设置到DynamoDB的接口类型定义
interface SavePhotoSettingsRequest {
    data: {
        filename: string;
        title?: string;
        description?: string;
        prices?: {
            small: string;
            medium: string;
            large: string;
        };
        record_id?: string;
        size?: string;
        type?: string;
        place?: string;
        photo_year?: string;
    };
}

interface SavePhotoSettingsResponse {
    success: boolean;
    message: string;
}

/**
 * 保存图片设置到AWS DynamoDB的photo_settings表格
 * @param filename - 文件名
 * @param title - 图片标题（可选）
 * @param description - 图片描述（可选）
 * @param prices - 价格信息（可选）
 * @param record_id - 记录ID（可选）
 * @returns Promise<SavePhotoSettingsResponse>
 */
export async function save_photo_settings(
    filename: string,
    title?: string,
    description?: string,
    prices?: { small: number; medium: number; large: number },
    record_id?: string,
    size?: string,
    type?: string,
    place?: string,
    photo_year?: string
): Promise<SavePhotoSettingsResponse> {
    console.log("!!!!=====save_photo_settings", filename, title, description, prices, record_id);
    const saveUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/save_photo_settings`;
    const saveData: SavePhotoSettingsRequest = {
        data: {
            filename: filename,
            title: title,
            description: description,
            prices: prices ? {
                small: prices.small.toString(),
                medium: prices.medium.toString(),
                large: prices.large.toString()
            } : undefined,
            record_id: record_id,
            size: size,
            type: type,
            place: place,
            photo_year: photo_year
        },
    };
    console.log("Saving photo settings:", saveData);
    const requestParams = preparePostRequest(JSON.stringify(saveData));
    try {
        console.log("Making request to save photo settings...");
        console.log("Request URL:", saveUrl);
        console.log("Request data:", saveData);
        
        const response = await fetch(saveUrl, requestParams);
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);
        
        const result = await response.json();
        console.log("Save photo settings response:", result);
        
        if (!response.ok) {
            console.error("HTTP error:", response.status, response.statusText);
            console.error("Response body:", result);
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        if (result.error) {
            console.error("API error:", result.error);
            throw new Error(result.message || result.error);
        }
        return {
            success: true,
            message: result.message || "图片设置保存成功"
        };
    } catch (error) {
        console.error('Error saving photo settings:', error);
        console.error('Error type:', typeof error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return {
            success: false,
            message: error instanceof Error ? error.message : '图片设置保存失败'
        };
    }
}

/**
 * 获取图片画廊数据
 * @returns Promise<PhotoGalleryResponse>
 */
export async function get_photos_presigned_url(): Promise<PhotoGalleryResponse> {
  const galleryUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/get_photos_presigned_url`;
  
  console.log("!!!!=====get_photos_presigned_url START");
    console.log("Gallery URL:", galleryUrl);
    console.log("URL prefix:", urlprefix);
    
    try {
        // 对于公开的图片画廊API，不需要认证头
        const requestParams = {
            method: "GET",
            mode: "cors" as RequestMode,
            cache: "no-cache" as RequestCache,
            headers: {
                "Content-Type": "application/json",
            },
        };
        
        console.log("Request parameters:", requestParams);
        console.log("Making fetch request to:", galleryUrl);
        
        const response = await fetch(galleryUrl, requestParams);
        console.log("Response received:", response);
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);
        console.log("Response headers:", response.headers);
        
        const result = await response.json();
        console.log("Response JSON parsed:", result);
        console.log("Result type:", typeof result);
        console.log("Result keys:", Object.keys(result));
        
        if (!response.ok) {
            console.error("HTTP error occurred:", response.status, response.statusText);
            console.error("Error response body:", result);
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (result.error) {
            console.error("API error in response:", result.error);
            throw new Error(result.message || result.error);
        }
        
        // 验证数据结构
        console.log("Checking result.data:", result.data);
        console.log("Data type:", typeof result.data);
        console.log("Data length:", Array.isArray(result.data) ? result.data.length : 'Not an array');
        
        if (Array.isArray(result.data)) {
            console.log("First photo item:", result.data[0]);
            if (result.data[0]) {
                console.log("First photo presigned_url:", result.data[0].presigned_url);
                console.log("First photo id:", result.data[0].id);
            }
        }
        
        const responseData = {
            success: true,
            message: result.message || "获取图片画廊成功",
            data: result.data || [],
            count: result.count || 0
        };
        
        // 保存图片数据到本地存储，只保存id、presigned_url和当前时间
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            try {
                const photoDataForStorage = result.data.map((photo: PhotoGalleryItem) => ({
                    id: photo.id,
                    presigned_url: photo.presigned_url,
                    datetime: new Date().toISOString()
                }));
                
                localStorage.setItem('photo_gallery_data', JSON.stringify(photoDataForStorage));
                localStorage.setItem('photo_gallery_last_update', new Date().toISOString());
                
                console.log('Photo data saved to localStorage:', photoDataForStorage);
            } catch (storageError) {
                console.warn('Failed to save photo data to localStorage:', storageError);
                // 即使保存失败，也不影响API的正常返回
            }
        }
        
        console.log("Returning response data:", responseData);
        console.log("!!!!=====get_photos_presigned_url SUCCESS");
        
        return responseData;
    } catch (error) {
        console.error('!!!!=====get_photos_presigned_url ERROR');
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        return {
            success: false,
            message: error instanceof Error ? error.message : '获取图片画廊失败',
            data: [],
            count: 0
        };
    }
}

/**
 * 获取用于上传超大图片的预签名URL（S3直传）
 * @param filename 原始文件名，例如 PXL_20250907_143718997.MP.jpg
 * @param contentType 文件Content-Type，例如 image/jpeg
 */
export interface PresignBigPhotoData {
    method: string;
    url: string;
    headers: Record<string, string>;
    bucket: string;
    key: string;
    expires_in: number;
}

export interface PresignBigPhotoResponse {
    success: boolean;
    message: string;
    data?: PresignBigPhotoData;
}

export async function get_presigned_url_for_upload_bigphotos(
    filename: string,
    contentType: string
): Promise<PresignBigPhotoResponse> {
    const presignUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/get_presigned_url_for_upload_bigphotos`;
    console.log("!!!!=====get_presigned_url_for_upload_bigphotos START");
    console.log("Presign URL:", presignUrl);
    console.log("Payload:", { filename, content_type: contentType });

    try {
        const payload = { filename: filename, content_type: contentType };
        const requestParams = preparePostRequest(JSON.stringify(payload));

        const response = await fetch(presignUrl, requestParams);
        const result = await response.json();
        console.log("Presign response status:", response.status, response.statusText);
        console.log("Presign response body:", result);

        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        if (result.error) {
            throw new Error(result.message || result.error);
        }

        return {
            success: true,
            message: result.message || "Success",
            data: result.data,
        };
    } catch (error) {
        console.error('get_presigned_url_for_upload_bigphotos ERROR:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '获取预签名URL失败',
        };
    }
}

/**
 * 使用预签名URL将大图片直接上传到S3
 * @param file 要上传的文件对象
 * @param presignData 从get_presigned_url_for_upload_bigphotos返回的预签名数据
 */
export async function upload_bigphoto(
    file: File,
    filename: string,
    contentType: string,
    title?: string,
    description?: string,
    prices?: { small: number; medium: number; large: number },
    size?: string,
    type?: string,
    place?: string,
    photo_year?: string
): Promise<UploadPhotoResponse> {
    console.log("!!!!=====upload_bigphoto START");
    console.log("File:", { name: file.name, size: file.size, type: file.type });
    console.log("filename/ContentType:", filename, contentType);

    try {
        // 1) 获取预签名URL
        const presign = await get_presigned_url_for_upload_bigphotos(filename, contentType);
        if (!presign.success || !presign.data) {
            throw new Error(presign.message || '获取预签名URL失败');
        }
        const { method, url, headers, key, bucket } = presign.data;

        // 2) 使用PUT方法直接上传到S3
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: file
        });

        // 3) S3通常仅返回状态码；200/204表示成功
        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('S3 upload error response:', errorText);
            throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
        }

        // 直传成功后，保存图片设置到DynamoDB（record_id未知，省略）
        try {
            const saveSettingsResult = await save_photo_settings(
                filename,
                title,
                description,
                prices,
                undefined,
                size,
                type,
                place,
                photo_year
            );
            if (!saveSettingsResult.success) {
                console.warn('Big photo uploaded but settings save failed:', saveSettingsResult.message);
            }
        } catch (e) {
            console.warn('Failed to save settings after big photo upload:', e);
        }

        const photoUrl = bucket && key ? `https://${bucket}.s3.amazonaws.com/${key}` : url.split('?')[0];

        return {
            success: true,
            message: '图片上传成功',
            photo_url: photoUrl,
            file_name: filename
        };
    } catch (error) {
        console.error('upload_bigphoto ERROR:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '图片上传失败'
        } as UploadPhotoResponse;
    }
}

/**
 * 从本地存储获取图片的预授权链接
 * @param photoId - 图片ID
 * @returns string | null - 预授权链接，如果没找到则返回null
 */
export function getPresignedUrlFromStorage(photoId: string): string | null {
    try {
        console.log('getPresignedUrlFromStorage called with photoId:', photoId);
        
        const storedData = localStorage.getItem('photo_gallery_data');
        console.log('Stored data exists:', !!storedData);
        
        if (storedData) {
            const photoData = JSON.parse(storedData);
            console.log('Photo data length:', photoData.length);
            console.log('Photo IDs in storage:', photoData.map((p: any) => p.id));
            
            const photo = photoData.find((p: any) => p.id === photoId);
            console.log('Found photo:', !!photo);
            
            if (photo) {
                console.log('Photo presigned_url exists:', !!photo.presigned_url);
                console.log('Photo presigned_url length:', photo.presigned_url?.length || 0);
            }
            
            return photo ? photo.presigned_url : null;
        }
    } catch (error) {
        console.error('Failed to get presigned URL from localStorage:', error);
    }
    return null;
}

/**
 * 从本地存储获取所有图片数据
 * @returns PhotoGalleryItem[] | null - 图片数据数组，如果没找到则返回null
 */
export function getAllPhotosFromStorage(): PhotoGalleryItem[] | null {
    try {
        const storedData = localStorage.getItem('photo_gallery_data');
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error('Failed to get photos from localStorage:', error);
    }
    return null;
}

// 图片画廊接口类型定义
interface PhotoGalleryItem {
    id: string;
    filename: string;
    s3_newsize_path: string;
    created_at: string;
    presigned_url: string;
    expires_in: number;
    title?: string;  // 添加title字段
}

interface PhotoGalleryResponse {
    success: boolean;
    message: string;
    data: PhotoGalleryItem[];
    count: number;
}

// 单个图片信息接口类型定义
interface PhotoInfoRequest {
    id: string;
}

interface PhotoInfoData {
    filename: string;
    fileName: string;
    origin_size: string;
    prices: {
        small: { S: string };
        large: { S: string };
        medium: { S: string };
    };
    s3_path: string;
    setting_datetime: string;
    description: string;
    id: string;
    new_size: string;
    upload_datetime: string;
    s3_newsize_path: string;
    title: string;
}

interface PhotoInfoResponse {
    success: boolean;
    message: string;
    data: PhotoInfoData | null;
}

/**
 * 获取单个图片的详细信息
 * @param photoId - 图片ID
 * @returns Promise<PhotoInfoResponse>
 */
export async function get_photo_info(photoId: string): Promise<PhotoInfoResponse> {
    const photoInfoUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/photo_info`;
    
    console.log("!!!!=====get_photo_info START");
    console.log("Photo Info URL:", photoInfoUrl);
    console.log("Photo ID:", photoId);
    
    try {
        const requestData: PhotoInfoRequest = {
            id: photoId
        };
        
        const requestParams = {
            method: "POST",
            mode: "cors" as RequestMode,
            cache: "no-cache" as RequestCache,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData)
        };
        
        console.log("Request parameters:", requestParams);
        console.log("Request data:", requestData);
        console.log("Making POST request to:", photoInfoUrl);
        
        const response = await fetch(photoInfoUrl, requestParams);
        console.log("Response received:", response);
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);
        
        const result = await response.json();
        console.log("Response JSON parsed:", result);
        console.log("Result type:", typeof result);
        console.log("Result keys:", Object.keys(result));
        
        if (!response.ok) {
            console.error("HTTP error occurred:", response.status, response.statusText);
            console.error("Error response body:", result);
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (result.error) {
            console.error("API error in response:", result.error);
            throw new Error(result.message || result.error);
        }
        
        // 验证数据结构
        console.log("Checking result.data:", result.data);
        console.log("Data type:", typeof result.data);
        
        const responseData: PhotoInfoResponse = {
            success: true,
            message: result.message || "获取图片信息成功",
            data: result.data || null
        };
        
        console.log("Returning response data:", responseData);
        console.log("!!!!=====get_photo_info SUCCESS");
        
        return responseData;
    } catch (error) {
        console.error('!!!!=====get_photo_info ERROR');
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        return {
            success: false,
            message: error instanceof Error ? error.message : '获取图片信息失败',
            data: null
        };
    }
}

/**
 * 获取所有图片设置信息
 * @returns Promise<AllPhotoSettingsResponse> - 返回完整的API响应格式
 */
export async function get_all_photo_settings(): Promise<AllPhotoSettingsResponse> {
    const allPhotoSettingsUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/get_all_photo_settings`;
    
    console.log("!!!!=====get_all_photo_settings START");
    console.log("All Photo Settings URL:", allPhotoSettingsUrl);
    
    try {
        // 使用GET方法访问API，不需要认证头
        const requestParams = {
            method: "GET",
            mode: "cors" as RequestMode,
            cache: "no-cache" as RequestCache,
            headers: {
                "Content-Type": "application/json",
            },
        };
        
        console.log("Request parameters:", requestParams);
        console.log("Making GET request to:", allPhotoSettingsUrl);
        
        const response = await fetch(allPhotoSettingsUrl, requestParams);
        console.log("Response received:", response);
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);
        
        const result = await response.json();
        console.log("Response JSON parsed:", result);
        console.log("Result type:", typeof result);
        console.log("Result keys:", Object.keys(result));
        
        if (!response.ok) {
            console.error("HTTP error occurred:", response.status, response.statusText);
            console.error("Error response body:", result);
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (result.error) {
            console.error("API error in response:", result.error);
            throw new Error(result.message || result.error);
        }
        
        // 验证数据结构
        console.log("Checking result.data:", result.data);
        console.log("Data type:", typeof result.data);
        console.log("Data length:", Array.isArray(result.data) ? result.data.length : 'Not an array');
        
        if (Array.isArray(result.data)) {
            console.log("First photo settings item:", result.data[0]);
            if (result.data[0]) {
                console.log("First photo filename:", result.data[0].filename);
                console.log("First photo id:", result.data[0].id);
            }
        }
        
        console.log("Returning complete API response:", result);
        console.log("!!!!=====get_all_photo_settings SUCCESS");
        
        // 直接返回完整的API响应
        return result;
    } catch (error) {
        console.error('!!!!=====get_all_photo_settings ERROR');
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // 发生错误时返回错误响应格式
        return {
            message: error instanceof Error ? error.message : '获取所有图片设置失败',
            data: [],
            count: 0
        };
    }
}

// 所有图片设置接口类型定义
interface PhotoSettingItem {
    filename: string;
    fileName: string;
    origin_size: string;
    prices: {
        small: { S: string };
        large: { S: string };
        medium: { S: string };
    };
    s3_path: string;
    setting_datetime: string;
    description: string;
    id: string;
    new_size: string;
    upload_datetime: string;
    s3_newsize_path: string;
    title: string;
}

interface AllPhotoSettingsResponse {
    message: string;
    data: PhotoSettingItem[];
    count: number;
}

// 删除图片接口类型定义
interface DeletePhotoRequest {
    id: string;
}

interface DeletePhotoResponse {
    message: string;
    result: string;
}

/**
 * 从DynamoDB和S3删除图片
 * @param recordId - 图片记录ID
 * @returns Promise<DeletePhotoResponse>
 */
export async function delete_photo_from_dynamodb_s3(recordId: string): Promise<DeletePhotoResponse> {
    const deleteUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/delete_photo_from_dynamodb_s3`;
    
    console.log("!!!!=====delete_photo_from_dynamodb_s3 START");
    console.log("Delete URL:", deleteUrl);
    console.log("Record ID:", recordId);
    
    try {
        const requestData: DeletePhotoRequest = {
            id: recordId
        };
        
        const requestParams = preparePostRequest(JSON.stringify(requestData));
        
        console.log("Request parameters:", requestParams);
        console.log("Request data:", requestData);
        console.log("Making POST request to:", deleteUrl);
        
        const response = await fetch(deleteUrl, requestParams);
        console.log("Response received:", response);
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);
        
        const result = await response.json();
        console.log("Response JSON parsed:", result);
        console.log("Result type:", typeof result);
        console.log("Result keys:", Object.keys(result));
        
        if (!response.ok) {
            console.error("HTTP error occurred:", response.status, response.statusText);
            console.error("Error response body:", result);
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (result.error) {
            console.error("API error in response:", result.error);
            throw new Error(result.message || result.error);
        }
        
        console.log("Returning response data:", result);
        console.log("!!!!=====delete_photo_from_dynamodb_s3 SUCCESS");
        
        return {
            message: result.message || "删除成功",
            result: result.result || "删除完成"
        };
    } catch (error) {
        console.error('!!!!=====delete_photo_from_dynamodb_s3 ERROR');
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        throw new Error(error instanceof Error ? error.message : '删除图片失败');
    }
}


