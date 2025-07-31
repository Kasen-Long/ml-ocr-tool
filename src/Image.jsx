import { useGlobal } from "./App";
import { useEffect, useState } from "react";
import ImageWithInlineToolbar from "./ImageWithToolbar";

function MyImage() {
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
    <ImageWithInlineToolbar
      src={url}
      onLoad={(e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setWidth(naturalWidth);
        setHeight(naturalHeight);
      }}
    />
  );

  // return (
  //   <Image
  //     style={{
  //       height: "auto",
  //       maxHeight: "calc(100vh - 200px)",
  //       display: "block",
  //       cursor: 'pointer',
  //       transition: 'all 0.3s',
  //     }}
  //     src={url}
  //     onLoad={(e) => {
  //       const { naturalWidth, naturalHeight } = e.target;
  //       setWidth(naturalWidth);
  //       setHeight(naturalHeight);
  //     }}
  //   />
  // );
}

export default MyImage;
