import { Divider, Space, Input, Button, Tree, List, Typography } from "antd";
import { useState } from "react";
import { findImagesInCurrentDir } from "./utils";

const updateTreeData = (list, key, children) =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

function MyTree({ handleSelectImage: _handleSelectImage }) {
  const [dir, setDir] = useState("");
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);

  async function handleFolderSelect() {
    const dir = await window.electronAPI.openDirectoryDialog();
    setDir(dir);
    setFolders([]);
    const items = {
      key: dir,
      title: window.electronAPI.basename(dir),
      isLeaf: false,
    };
    setFolders([items]);
  }

  async function loadData({ key, children }) {
    if (children) {
      return;
    }
    const items = window.electronAPI.readdirSync(key).filter((item) => {
      const file = window.electronAPI.joinPath(key, item);
      return window.electronAPI.isDirectory(file);
    });
    setFolders((origin) =>
      updateTreeData(
        origin,
        key,
        items.map((item) => ({
          key: window.electronAPI.joinPath(key, item),
          title: item,
          isLeaf: false,
        }))
      )
    );
    return;
  }

  async function handleSelect(key) {
    if (!key) return;
    const images = findImagesInCurrentDir(key);
    // [{name: '', path: ''}]
    setImages(images);
  }

  async function handleSelectImage(path) {
    const image = await window.electronAPI.dealImage(path);
    _handleSelectImage(image);
  }

  return (
    <>
      <div style={{ flex: 1, height: "calc(50vh - 54px)", overflow: "scroll" }}>
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
        <Tree
          treeData={folders}
          loadData={loadData}
          onSelect={(keys, info) => handleSelect(keys[0])}
        />
      </div>
      <Divider />
      <div style={{ flex: 1, height: "calc(50vh - 54px)", overflow: "scroll" }}>
        <List
          dataSource={images}
          renderItem={(item) => (
            <List.Item
              key={item.path}
              onClick={() => handleSelectImage(item.path)}
              style={{ paddingLeft: '12px' }}
            >
              <Typography.Link href="#">{item.name}</Typography.Link>
            </List.Item>
          )}
        />
      </div>
    </>
  );
}

export default MyTree;
