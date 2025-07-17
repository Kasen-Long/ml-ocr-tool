import { Button, Space, message } from "antd";
import { useGlobal } from "./App";
import { useRef, useState, useEffect } from "react";
import { UploadOutlined } from "@ant-design/icons";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { canvasPreview } from "./canvasPreview";

function useDebounceEffect(fn, waitTime, deps) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn.apply(undefined, deps);
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, deps);
}

function Image() {
  const { image, setImage } = useGlobal();
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const { form, setOcr } = useGlobal();
  const server = form.getFieldValue("server");

  async function handleSelectImage() {
    // base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACiA
    // ext: ".jpg"
    // height: 3603
    // name: "00002 (2).jpg"
    // ocr: "iVBORw0KGgoAAAANSUhEUgAACiAAAA4TCAIAAADMZrt5AAAAC
    // path: "C:/Desktop/目录/目录/00002 (2).jpg"
    // width: 2592
    const image = await window.electronAPI.selectImage();
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImage(image);
  }

  function ocr(base64) {
    if (!server) {
      message.error("输入ocr服务器地址");
      return;
    }
    window.electronAPI.ocr(server, base64).then((res) => {
      setOcr(res);
    });
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          1,
          0
        ).then(async (base64) => {
          ocr(base64.split(",")[1]);
        });
      }
    },
    100,
    [completedCrop]
  );

  return (
    <div
      style={{
        width: "50vw",
        height: "calc(100vh - 108px)",
        overflow: "scroll",
      }}
    >
      <Space direction="vertical">
        <Space style={{ padding: "12px" }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleSelectImage}
          >
            选择图片
          </Button>
          {!!completedCrop && (
            <canvas
              ref={previewCanvasRef}
              style={{
                border: "1px solid black",
                objectFit: "contain",
                width: completedCrop.width,
                height: completedCrop.height,
              }}
            />
          )}
        </Space>
        {image !== null && (
          <div style={{ height: "100%", width: "100%", overflow: "scroll" }}>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img alt="crop" preview={false} ref={imgRef} src={image.base64} />
            </ReactCrop>
          </div>
        )}
      </Space>
    </div>
  );
}

export default Image;
