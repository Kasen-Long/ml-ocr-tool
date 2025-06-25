import { Image as AntdImage } from "antd";
import { useGlobal } from "./App";
import { useEffect, useState } from "react";

function Image() {
  const {
    currentIndex,
    total,
    imageFiles,
    setWidth,
    setHeight,
    setBase64Image,
  } = useGlobal();
  const [url, setUrl] = useState("");

  useEffect(() => {
    const filePath = imageFiles[currentIndex];
    if (!filePath) {
      return;
    }
    const base64Image = window.electronAPI.readFileSync(filePath, {
      encoding: "base64",
    });
    const ext = window.electronAPI.extname(filePath).substring(1);
    setUrl(`data:image/${ext};base64,${base64Image}`);
    setBase64Image(base64Image);
    return () => {
      setBase64Image("");
      setUrl("");
    };
  }, [currentIndex, imageFiles, setBase64Image]);

  if (currentIndex >= total) {
    return null;
  }

  return (
    <AntdImage
      style={{
        height: "auto",
        maxHeight: "calc(100vh - 200px)",
        display: "block",
      }}
      src={url}
      onLoad={(e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setWidth(naturalWidth);
        setHeight(naturalHeight);
      }}
    />
  );
}

export default Image;
