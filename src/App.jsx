import "./App.css";
import { Form, Layout } from "antd";
import { createContext, useContext, useState } from "react";
import HeaderUI from "./Header";
import FooterUI from "./Footer";
import Image from "./Image";
import Template from "./Template";

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
    dir: "",
  },
  form: null,
  image: null,
  setImage: () => null,
  ocr: "",
  setOcr: () => null,
});

export const useGlobal = () => {
  return useContext(context);
};

function App() {
  const [form] = Form.useForm();
  const [image, setImage] = useState(null);
  const [ocr, setOcr] = useState([]);

  return (
    <context.Provider
      value={{
        form,
        image,
        setImage,
        ocr,
        setOcr,
        defaultValues: {
          server: "http://127.0.0.1:1224",
          dir: "",
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
            <Template />
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
