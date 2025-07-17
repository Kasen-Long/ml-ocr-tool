import { useGlobal } from "./App";

function Footer() {
  const { image } = useGlobal();

  return `路径: ${image?.path} (宽度: ${image?.width}px, 高度: ${image?.height}px)`;
}

export default Footer;
