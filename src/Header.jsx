import { Form, Input, Space, Button, Select } from "antd";
import { useGlobal } from "./App";
import { useState } from "react";
import { findTemplates } from "./utils";

const { Item } = Form;

function Header() {
  const { form, defaultValues } = useGlobal();
  const dir = Form.useWatch("dir", form);
  const [options, setOptions] = useState([]);

  async function handleFolderSelect() {
    const dir = await window.electronAPI.openDirectoryDialog();
    form.setFieldValue("dir", dir);
    const templates = findTemplates(dir);
    setOptions(templates);
  }

  return (
    <Form form={form} layout="inline">
      <Item
        name="server"
        label="服务器地址"
        rules={[{ required: true, message: "请输入服务器地址" }]}
        initialValue={defaultValues.server}
        style={{ marginRight: 6 }}
      >
        <Input style={{ width: 200 }} type="text" placeholder="服务器地址" />
      </Item>
      <Item
        name="dir"
        label="模板目录"
        rules={[{ required: true, message: "请选择文件夹" }]}
        style={{ marginRight: 6 }}
      >
        <Space>
          <Input
            style={{ width: 200 }}
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
        name="template"
        label="选择模板"
        rules={[{ required: true, message: "请选择模板" }]}
        style={{ marginRight: 6 }}
      >
        <Select
          style={{ width: 400 }}
          options={options}
          placeholder="请选择模板"
        />
      </Item>
    </Form>
  );
}

export default Header;
