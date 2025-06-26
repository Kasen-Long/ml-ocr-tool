import "./App.css";
import { Form, Layout } from "antd";
import { createContext, useContext, useState } from "react";
import HeaderUI from "./Header";
import FooterUI from "./Footer";
import ContentUI from "./Content";
import Image from "./Image";

const { Header, Footer, Sider, Content } = Layout;

const layoutStyle = {
  width: "100vw",
  height: "100vh",
};

const headerStyle = {
  backgroundColor: "#fff",
  borderBottom: "1px solid #ccc",
  height: "40px",
  paddingTop: "4px",
};

const mainStyle = {
  flex: 1,
  backgroundColor: "#f0f2f5",
};

const siderStyle = {
  backgroundColor: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const footerStyle = {
  backgroundColor: "#000",
  color: "#fff",
};

const context = createContext({
  defaultValues: {
    server: "http://127.0.0.1:1224",
    pici: "CK-2025-0",
    dir: "",
    imgName: "00002.jpg",
  },
  total: 0,
  setTotal: (total) => null,
  currentIndex: 0,
  setCurrentIndex: (index) => null,
  form: null,
  imageFiles: [],
  setImageFiles: () => null,
  width: 0,
  setWidth: (width) => null,
  height: 0,
  setHeight: (height) => null,
  base64Image: "",
  setBase64Image: (base64Image) => null,
});

export const useGlobal = () => {
  return useContext(context);
};

function App() {
  const [total, setTotal] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form] = Form.useForm();
  const [imageFiles, setImageFiles] = useState([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [base64Image, setBase64Image] = useState("");

  return (
    <context.Provider
      value={{
        total,
        setTotal,
        currentIndex,
        setCurrentIndex,
        form,
        imageFiles,
        setImageFiles,
        width,
        setWidth,
        height,
        setHeight,
        base64Image,
        setBase64Image,
        defaultValues: {
          server: "http://10.37.120.4:1224",
          pici: "CK-2025-0",
          dir: "",
          imgName: "00002.jpg",
        },
      }}
    >
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <HeaderUI />
        </Header>
        <Layout style={mainStyle}>
          <Sider width="50%" style={siderStyle}>
            <Image />
          </Sider>
          <Content>
            <ContentUI />
          </Content>
        </Layout>
        <Footer style={footerStyle}>
          <FooterUI />
        </Footer>
      </Layout>
    </context.Provider>
  );
}

export default App;
