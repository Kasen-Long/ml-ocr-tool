import { useGlobal } from "./App";

function Footer() {
  const { width, height, currentIndex, imageFiles } = useGlobal();
  const filePath = imageFiles[currentIndex] || "";

  return `路径: ${filePath} (宽度: ${width}px, 高度: ${height}px)`;
}

export default Footer;
