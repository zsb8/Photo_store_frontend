import React from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageAlt: string;
  onClose: () => void;
  onImageClick?: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  imageAlt,
  onClose,
  onImageClick
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="关闭预览"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 70,
          height: 70,
          borderRadius: 35,
          border: 'none',
          background: '#000',
          color: '#fff',
          fontSize: 36,
          cursor: 'pointer',
          lineHeight: '70px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
      >
        ×
      </button>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={imageUrl}
          alt={imageAlt}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: 'auto',
            height: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            borderRadius: 4,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
          onClick={(e) => { e.stopPropagation(); onImageClick?.(); }}
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
        {/* 水印文字 - 只在大图预览中显示 */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '14px',
          fontWeight: '300',
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.7)',
          letterSpacing: '0.8px',
          whiteSpace: 'nowrap'
        }}>
          All rights reserved. For preview only 
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
