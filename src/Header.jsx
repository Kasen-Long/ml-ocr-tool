import { Form, Input, Space, Button, Progress, message } from "antd";
import { useGlobal } from "./App";
import { useState } from "react";
import { findImages, findOcrCsvs } from "./utils";

const { Item } = Form;

function Header() {
  const {
    form,
    defaultValues,
    total,
    setTotal,
    currentIndex,
    setCurrentIndex,
    imageFiles,
    setImageFiles,
  } = useGlobal();
  const dir = Form.useWatch("dir", form);
  const [inProgress, setInProgress] = useState(false);

  async function handleFolderSelect() {
    const dir = await window.electronAPI.openDirectoryDialog();
    form.setFieldValue("dir", dir);
  }

  async function onFinish(values) {
    setInProgress(true);
    const { dir, imgName } = values;
    const files = findImages(dir, imgName);
    setImageFiles(files);
    setTotal(files.length);
    setCurrentIndex(0);
  }

  async function mergeOcrResults() {
    console.log("merget ocr results");
    const csvContents = findOcrCsvs(dir);
    const first = csvContents[0];
    const result = [];
    result.push(first);
    for (let i = 1; i < csvContents.length; i++) {
      const current = csvContents[i];
      const currentLines = current.split("\n");
      for (let j = 1; j < currentLines.length; j++) {
        const currentLine = currentLines[j];
        result.push(currentLine);
      }
    }
    const merged = result.join("\n");
    const csvPath = `${dir}/result.csv`;
    window.electronAPI.writeFile(csvPath, merged);
    message.info(`成功导出到: ${csvPath}`);
  }

  return (
    <Form form={form} layout="inline" onFinish={onFinish}>
      <Item
        name="server"
        label="服务器地址"
        rules={[{ required: true, message: "请输入服务器地址" }]}
        initialValue={defaultValues.server}
        style={{ marginRight: 2 }}
      >
        <Input style={{ width: 140 }} type="text" placeholder="服务器地址" />
      </Item>
      <Item
        name="pici"
        label="批次号"
        rules={[{ required: true, message: "请输入批次号" }]}
        initialValue={defaultValues.pici}
        style={{ marginRight: 2 }}
      >
        <Input style={{ width: 140 }} type="text" placeholder="批次号" />
      </Item>
      <Item
        name="dir"
        label="图片根目录"
        rules={[{ required: true, message: "请选择文件夹" }]}
        style={{ marginRight: 2 }}
      >
        <Space>
          <Input
            style={{ width: 140 }}
            value={dir}
            placeholder="请选择文件夹"
            disabled
          />
          <Button htmlType="button" onClick={handleFolderSelect}>
            浏览...
          </Button>
        </Space>
      </Item>
      <Item
        name="imgName"
        label="图片名称"
        rules={[{ required: true, message: "请输入图片名称" }]}
        initialValue={defaultValues.imgName}
        style={{ marginRight: 2 }}
      >
        <Input style={{ width: 140 }} type="text" placeholder="图片名称" />
      </Item>
      <Item name="submit" style={{ marginRight: 12 }}>
        <Button type="primary" htmlType="submit" disabled={inProgress}>
          开始识别
        </Button>
      </Item>
      <Space>
        <Button
          disabled={!inProgress}
          onClick={() => {
            setCurrentIndex(0);
            setTotal(0);
            setImageFiles([]);
            setInProgress(false);
          }}
        >
          重置
        </Button>
        <Button
          disabled={!inProgress}
          onClick={() => {
            setCurrentIndex(Math.max(currentIndex - 1, 0));
          }}
        >
          上一张
        </Button>
        <Button
          disabled={!inProgress}
          onClick={() => {
            setCurrentIndex(Math.min(currentIndex + 1, imageFiles.length - 1));
          }}
        >
          下一张
        </Button>
        <Progress
          size="small"
          status="active"
          percent={(currentIndex / total) * 100}
          showInfo={true}
          format={() => `${currentIndex + 1}/${total}`}
        />
        <Button
          disabled={!dir}
          onClick={mergeOcrResults}
        >
          合并
        </Button>
      </Space>
    </Form>
  );
}

export default Header;
