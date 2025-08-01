import {
  Input,
  Layout,
  Space,
  Table,
  Alert,
  Button,
  Form,
  message,
} from "antd";
import { useGlobal } from "./App";
import React, { useEffect, useState, useContext, useRef } from "react";
import { createStyles } from "antd-style";

const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingInlineEnd: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

function Content() {
  const { currentIndex, imageFiles, base64Image, form } = useGlobal();
  const server = form.getFieldValue("server");
  const filePath = imageFiles[currentIndex] || "";
  const [year, setYear] = useState(() => extractFirstYear(filePath));
  const arr = filePath.split(/[\\/]/);
  const [anjuanhao, setAnjuanhao] = useState(() => arr.find((item) => item.includes("号")));
  const [juanci, setJuanci] = useState(() => arr[arr.length - 2 >= 0 ? arr.length - 2 : 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const { styles } = useStyle();

  useEffect(() => {
    setYear(extractFirstYear(filePath));
    const arr = filePath.split(/[\\/]/);
    setAnjuanhao(arr.find((item) => item.includes("号")));
    setJuanci(arr[arr.length - 2 >= 0 ? arr.length - 2 : 0]);
  }, [filePath]);

  const handleSave = (row) => {
    const newData = [...data];
    const index = row.index;
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setData(newData);
  };

  useEffect(() => {
    if (!server || !base64Image) {
      return;
    }
    ocr();
    return () => {
      setData([]);
      setError("");
      setLoading(false);
    };
  }, [base64Image, server]);

  function ocr() {
    setLoading(true);
    setData([]);
    setError("");
    window.electronAPI
      .ocr(server, base64Image)
      .then((rawResults) => {
        // 1. 基于坐标范围的过滤
        const fileNameItem = rawResults
          .filter((r) => r.text.replace(/\s+/g, "").startsWith("文件"))
          ?.sort((a, b) => a.box[0][1] - b.box[0][1])[0];
        // const recordItem = rawResults.find(r => r.text.replace(/\s+/g, '').startsWith('本卷宗连面带底'));
        const recordItem = rawResults
          .filter((r) => r.text.replace(/\s+/g, "").startsWith("备"))
          ?.sort((a, b) => b.box[0][1] - a.box[0][1])[0];

        if (!fileNameItem || !recordItem) {
          console.log({ rawResults });
          setError("未找到有效的范围标记");
          setLoading(false);
          return;
        }

        const minY = fileNameItem.box[3][1];
        const maxY = recordItem.box[0][1];

        const filtered = rawResults.filter(
          (item) => item.box[0][1] > minY && item.box[0][1] < maxY
        );

        // 匹配文件名称和页次
        const matched = [];
        filtered.forEach((item) => {
          if (/^\d+(-\d+)?$/.test(item.text)) return;
          if (
            item.text.replace(/\s+/g, "") === "备" ||
            item.text.replace(/\s+/g, "") === "考" ||
            item.text.replace(/\s+/g, "") === "备考" ||
            item.text.replace(/\s+/g, "") === "备考表"
          ) {
            return;
          }

          // 获取当前项右侧X坐标
          const leftX = item.box[0][0];
          // 获取当前项右侧Y坐标
          const leftY = item.box[0][1];

          // 查找右侧最近的页次
          const candidates = filtered
            .filter((r) => /^\d+(-\d+)?$/.test(r.text))
            .filter((r) => r.box[0][0] >= item.box[2][0])
            .map((r) => ({
              ...r,
              distance:
                Math.abs(r.box[0][0] - leftX) + Math.abs(r.box[0][1] - leftY),
            }))
            .sort((a, b) => a.distance - b.distance);

          if (candidates.length > 0) {
            const pageText = candidates[0].text.replace(/\s+/g, "");
            const tmp = pageText.split("-");
            const pageNumber = parseInt(tmp[0]);
            const pageNumber1 = parseInt(tmp.length > 1 ? tmp[1] : tmp[0]);

            matched.push({
              name: item.text.replace(/\s+/g, ""),
              page: pageText,
              pageNumber: pageNumber,
              pageNumber1: pageNumber1,
              score: item.score,
              box: item.box,
            });
          } else {
            // 没匹配到页码的也保留
            matched.push({
              name: item.text.replace(/\s+/g, ""),
              page: "",
              pageNumber: "",
              score: 0,
              box: item.box,
            });
          }
        });

        const left = [];
        const right = [];
        left.push(matched[0]);
        for (let i = 1; i < matched.length; i++) {
          // 如果跟左侧中任意一个有交集则加入, 否则放到right中
          let flag = false;
          for (let j = 0; j < left.length; j++) {
            const source = [left[j].box[0][0], left[j].box[1][0]];
            const target = [matched[i].box[0][0], matched[i].box[1][0]];
            // 如果 source 和 target 有交集
            if (
              (source[0] <= target[0] && source[1] >= target[0]) ||
              (target[0] <= source[0] && target[1] >= source[0])
            ) {
              flag = true;
              left.push(matched[i]);
              break;
            }
          }
          if (!flag) {
            right.push(matched[i]);
          }
        }
        // console.log({ left, right });
        // 按y轴从小到大排序
        left.sort((a, b) => a.box[0][1] - b.box[0][1]);
        right.sort((a, b) => a.box[0][1] - b.box[0][1]);
        // 排序逻辑
        // matched.sort((a, b) => a.pageNumber - b.pageNumber);
        const result = left.concat(right);
        result.unshift({
          name: "封皮",
          page: 0,
          pageNumber: 0,
          score: 1,
        });
        result.unshift({
          name: "目录",
          page: 0,
          pageNumber: 0,
          score: 1,
        });
        result.push({
          name: "备考表",
          page: matched[matched.length - 1].pageNumber1 + 1,
          pageNumber: matched[matched.length - 1].pageNumber1 + 1,
          score: matched[matched.length - 1].pageNumber1 > 10 ? 1 : 0.5,
        });
        setData(result.map((item, index) => ({ ...item, index })));
        setLoading(false);
      })
      .catch((ocrError) => {
        console.error("OCR处理时出错:", ocrError);
        setError("OCR处理时出错:" + JSON.stringify(ocrError));
        setLoading(false);
      });
  }

  async function handleExport() {
    const csvContent = [
      "批次,年度,案卷号,卷次,卷宗目录,页次,备注",
      ...data.map((item) => {
        const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
        return [
          escape(form.getFieldValue("pici")),
          escape(year),
          escape(anjuanhao),
          escape(juanci),
          escape(item.name),
          escape(item.pageNumber),
          "",
        ].join(",");
      }),
    ].join("\n");

    const dirPath = window.electronAPI.dirname(filePath);
    const csvPath = window.electronAPI.joinPath(dirPath, "ocr.csv");

    await window.electronAPI.writeFile(csvPath, csvContent);
    message.info(`成功导出到: ${csvPath}`);
  }

  function handleReset() {
    ocr();
  }

  return (
    <Layout style={{ padding: 12, display: "flex", height: "100%" }}>
      <Space style={{ marginBottom: 12 }}>
        <Input addonBefore="年度" value={year} onChange={(e) => setYear(e.target.value)} />
        <Input addonBefore="案卷号" value={anjuanhao} onChange={(e) => setAnjuanhao(e.target.value)} />
        <Input addonBefore="卷次" value={juanci} onChange={(e) => setJuanci(e.target.value)} />
        <Button color="green" variant="solid" onClick={handleExport}>
          导出(存储到图片统计目录)
        </Button>
        <Button color="orange" variant="solid" onClick={handleReset}>
          重置
        </Button>
      </Space>
      {error && <Alert type="error" message={error} />}
      <div style={{ flex: 1, overflow: "scroll" }}>
        <Table
          className={styles.customTable}
          rowKey={(item) => item.index}
          components={{
            body: {
              row: EditableRow,
              cell: EditableCell,
            },
          }}
          loading={loading}
          dataSource={data}
          // rowClassName={(item) => {
          //   if (item.score < 0.8) return "critical-bg";
          //   else if (item.score < 0.9) return "error-bg";
          //   else if (item.score < 0.95) return "warning-bg";
          // }}
          pagination={false}
          scroll={{ y: 55 * 12 }}
          columns={[
            {
              title: "操作",
              dataIndex: "_",
              width: 140,
              key: "_",
              render: (_, record, index) => {
                return (
                  <Space>
                    <Button
                      danger
                      onClick={() => {
                        const tmp = JSON.parse(JSON.stringify(data));
                        tmp.splice(index, 1);
                        setData(tmp.map((item, index) => ({ ...item, index })));
                      }}
                    >
                      删除
                    </Button>
                    <Button
                      onClick={() => {
                        const tmp = JSON.parse(JSON.stringify(data));
                        const newRow = {
                          name: "编辑",
                          page: "0",
                          pageNumber: "0",
                          score: 1,
                        };
                        tmp.splice(index + 1, 0, newRow);
                        setData(tmp.map((item, index) => ({ ...item, index })));
                      }}
                    >
                      添加
                    </Button>
                  </Space>
                );
              },
            },
            {
              title: "文件名称",
              dataIndex: "name",
              width: 200,
              key: "name",
              editable: true,
              // render: (name) => (name ? name : "错误"),
            },
            {
              title: "页次",
              dataIndex: "pageNumber",
              width: 60,
              key: "pageNumber",
              editable: true,
              render: (pageNumber) => (isNaN(pageNumber) ? "-" : pageNumber),
            },
            {
              title: "页次范围",
              width: 100,
              dataIndex: "page",
              key: "page",
              editable: true,
              render: (page) => (isNaN(page) ? "-" : page),
            },
            {
              title: "置信度",
              width: 60,
              dataIndex: "score",
              key: "score",
              render: (score) =>
                score ? (score * 100).toFixed(1) + "%" : "-",
            },
          ].map((col) => {
            if (!col.editable) {
              return col;
            }
            return {
              ...col,
              onCell: (record) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave,
              }),
            };
          })}
        />
      </div>
    </Layout>
  );
}

export default Content;

const extractFirstYear = (text) => {
  const yearMatch = /\d{4}/.exec(text);
  return yearMatch ? yearMatch[0] : "";
};

const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token;
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `,
  };
});
