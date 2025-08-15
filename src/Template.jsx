import {
  Layout,
  Typography,
  Space,
  Form,
  Input,
  Divider,
  Button,
  message,
} from "antd";
import { useGlobal } from "./App";
import { useEffect } from "react";

const { Paragraph } = Typography;
const { Item } = Form;

function Template() {
  const { ocr = [], form, image } = useGlobal();
  const template = Form.useWatch("template", form);
  const [_form] = Form.useForm();
  const csv = template?.split(":")?.[1]?.split(",") || [];

  useEffect(() => {
    _form.resetFields();
  }, [template]);

  async function handleExport() {
    const values = _form.getFieldsValue();
    const csvContent = [
      csv.join(","),
      csv.map((_, index) => values[index] || "").join(","),
    ].join("\n");
    const dirPath = window.electronAPI.dirname(image.path);
    const csvPath = window.electronAPI.joinPath(dirPath, "ocr.csv");

    await window.electronAPI.writeFile(csvPath, csvContent);
    message.info(`成功导出到: ${csvPath}`);
  }

  return (
    <div
      style={{
        width: "50vw",
        height: "calc(100vh - 108px)",
        overflow: "scroll",
      }}
    >
      <Layout style={{ padding: 12, display: "flex", height: "100%" }}>
        <div style={{ display: "flex" }}>
          <Space direction="vertical" style={{ flex: 1 }}>
            <Paragraph copyable style={{ fontSize: 18 }}>
              {ocr
                .filter((item) => item.text !== "")
                .map(item => item.text)
                .join("")
              }
            </Paragraph>
          </Space>
          <Divider type="vertical" style={{ height: "100%" }} />
          <Button color="green" variant="solid" onClick={handleExport}>
            导出(存储到图片目录)
          </Button>
        </div>
        <Divider />
        <Form form={_form} labelCol={{ span: 6 }} labelAlign="left">
          {!!csv &&
            csv.map((field, index) => (
              <Item
                name={index}
                key={index}
                label={field}
                style={{ marginRight: 6 }}
              >
                <Input style={{ width: 300 }} type="text" placeholder={field} />
              </Item>
            ))}
        </Form>
      </Layout>
    </div>
  );
}

export default Template;
