import { CartItem } from '../components/ShoppingCart';
import { useI18n } from '../contexts/I18nContext';


  // 辅助函数：提取并格式化文件名和尺寸
 export const formatFileNameWithSize = (item: CartItem) => {
    const { t } = useI18n();
    const idStr = String(item.id);
    // if (idStr.includes('-')) {
    //   const [photoId, size] = idStr.split('-');
    //   // 从alt字段中提取文件名，如果没有alt则使用photoId
    //   let fileName = item.alt || photoId;
      
    //   // 如果alt包含文件名和尺寸信息，提取文件名部分
    //   if (fileName.includes('(') && fileName.includes(')')) {
    //     fileName = fileName.split('(')[0].trim();
    //   }
      
    //   // 如果文件名包含路径，只取文件名部分
    //   if (fileName.includes('/')) {
    //     fileName = fileName.split('/').pop() || fileName;
    //   }
      
    //   // 如果文件名包含扩展名，去掉扩展名
    //   if (fileName.includes('.')) {
    //     fileName = fileName.split('.')[0];
    //   }
      
    //   // 取前7个字符，如果不足7个字符则全部显示
    //   const shortFileName = fileName.length > 7 ? fileName.substring(0, 7) + '...' : fileName;
      
    //   // 添加尺寸标签
    //   const sizeLabel = size === 'small' ? t("Photos.size") : size === 'medium' ? t("Photos.size") : t("Photos.size");
    //     return `${shortFileName} (${sizeLabel})`;
    //   }
    // return item.alt || `${t("Photos.title")} ${item.id}`;
    const [photoId, size] = idStr.split('-')
    const sizeLabel = size === 'small' ? t("Photos.size") : size === 'medium' ? t("Photos.size") : t("Photos.size");
    return `${item.photoNewId} (${sizeLabel})`;
  };