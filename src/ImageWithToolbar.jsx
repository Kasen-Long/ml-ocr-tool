import React, { useState, useRef } from "react";
import {
    ZoomInOutlined,
    ZoomOutOutlined,
    RotateRightOutlined,
    DownloadOutlined,
    UndoOutlined,
    CopyOutlined,
} from "@ant-design/icons";
import { Tooltip, Space, message } from "antd";
import "antd/dist/reset.css";

const ImprovedImageToolbar = ({ src, alt = "图片", onLoad }) => {
    // 状态管理
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const imageContainerRef = useRef(null);
    const imageRef = useRef(null);

    // 处理图片加载完成
    const handleImageLoad = (e) => {
        setLoading(false);
        onLoad(e);
    };

    // 缩放功能
    const handleZoomIn = () => {
        setScale((prev) => {
            const newScale = prev * 1.2;
            return Math.min(newScale, 5); // 最大放大到5倍
        });
    };

    const handleZoomOut = () => {
        setScale((prev) => {
            const newScale = prev / 1.2;
            return Math.max(newScale, 0.5); // 最小缩小到0.5倍
        });
    };

    // 重置功能
    const handleReset = () => {
        setScale(1);
        setRotate(0);
        setPosition({ x: 0, y: 0 });
    };

    // 旋转功能
    const handleRotate = () => {
        setRotate((prev) => (prev + 90) % 360);
    };

    // 拖拽相关事件处理
    const handleMouseDown = (e) => {
        // 只有当图片被放大时才能拖拽
        if (scale <= 1) return;

        e.preventDefault();
        setIsDragging(true);
        setStartPos({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        const newX = e.clientX - startPos.x;
        const newY = e.clientY - startPos.y;

        // 获取容器和图片尺寸用于边界检查
        const container = imageContainerRef.current;
        const image = imageRef.current;

        if (container && image) {
            const containerRect = container.getBoundingClientRect();
            const imageRect = image.getBoundingClientRect();

            // 计算边界限制（防止图片完全拖出容器）
            const maxX = (imageRect.width * scale - containerRect.width) / 2;
            const maxY = (imageRect.height * scale - containerRect.height) / 2;

            // 应用边界限制
            const constrainedX = Math.max(-maxX, Math.min(newX, maxX));
            const constrainedY = Math.max(-maxY, Math.min(newY, maxY));

            setPosition({ x: constrainedX, y: constrainedY });
        } else {
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // 渲染工具栏
    const renderToolbar = () => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                backgroundColor: "#f5f5f5",
                border: "1px solid #e8e8e8",
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
                gap: 8,
            }}
        >
            <Space size="small">
                <Tooltip title="放大">
                    <ZoomInOutlined
                        style={{ cursor: "pointer", fontSize: 16, color: "#666" }}
                        onClick={handleZoomIn}
                    />
                </Tooltip>
                <Tooltip title="缩小">
                    <ZoomOutOutlined
                        style={{ cursor: "pointer", fontSize: 16, color: "#666" }}
                        onClick={handleZoomOut}
                    />
                </Tooltip>
                <Tooltip title="旋转">
                    <RotateRightOutlined
                        style={{ cursor: "pointer", fontSize: 16, color: "#666" }}
                        onClick={handleRotate}
                    />
                </Tooltip>
                <Tooltip title="重置">
                    <UndoOutlined
                        style={{ cursor: "pointer", fontSize: 16, color: "#666" }}
                        onClick={handleReset}
                    />
                </Tooltip>
            </Space>

            <div style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>
                缩放: {Math.round(scale * 100)}% | 旋转: {rotate}°
                {isDragging && (
                    <span style={{ marginLeft: 8, color: "#1890ff" }}>正在拖动...</span>
                )}
            </div>
        </div>
    );

    return (
        <div
            className="image-with-toolbar"
            style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                overflow: "hidden",
                width: "100%",
            }}
        >
            {/* 图片容器 - 符合尺寸要求 */}
            <div
                ref={imageContainerRef}
                style={{
                    width: "100%", // 充满父容器宽度
                    height: "auto", // 高度自动
                    maxHeight: "calc(100vh - 200px)", // 最大高度限制
                    overflow: "auto", // 超出时显示滚动条
                    backgroundColor: "#fafafa",
                    position: "relative",
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    style={{
                        minHeight: "100px", // 确保容器有最小高度
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    {/* 加载状态 */}
                    {loading && (
                        <div
                            style={{
                                position: "absolute",
                                width: "60px",
                                height: "60px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                className="loading-spinner"
                                style={{
                                    width: 24,
                                    height: 24,
                                    border: "3px solid #f0f0f0",
                                    borderTop: "3px solid #1890ff",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                }}
                            ></div>
                            <style jsx global>{`
                @keyframes spin {
                  0% {
                    transform: rotate(0deg);
                  }
                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
                        </div>
                    )}

                    {/* 提示信息 - 当图片可以拖拽时显示 */}
                    {!loading && scale > 1 && !isDragging && (
                        <div
                            style={{
                                position: "absolute",
                                top: 10,
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "white",
                                fontSize: 12,
                                padding: "4px 8px",
                                borderRadius: 4,
                                zIndex: 1,
                            }}
                        >
                            拖动图片查看更多区域
                        </div>
                    )}

                    {/* 图片 */}
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        onLoad={handleImageLoad}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            transition: "transform 0.2s ease",
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotate}deg)`,
                            objectFit: "contain",
                            cursor:
                                scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                        }}
                        onMouseDown={handleMouseDown}
                    />
                </div>
            </div>
            {/* 工具栏 */}
            {renderToolbar()}
        </div>
    );
};

export default ImprovedImageToolbar;
