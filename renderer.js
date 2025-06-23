const serverInput = document.getElementById("server");
const dirInput = document.getElementById("dir");
const selectDirBtn = document.getElementById("selectDirBtn");
const imgNameInput = document.getElementById("imgName");
const piciInput = document.getElementById("pici");
const startBtn = document.getElementById("startBtn");
const preBtn = document.getElementById("preBtn");
const nextBtn = document.getElementById("nextBtn");
const progressInfo = document.getElementById("progressInfo");
const currentImage = document.getElementById("currentImage");
const imageInfo = document.getElementById("imageInfo");
const ocrResult = document.getElementById("ocrResult");
const imagePlaceholder = document.getElementById("imagePlaceholder");

let imageFiles = [];
let currentIndex = -1;

const validImageExtensions = [".jpeg", ".jpg", ".png", ".tiff", ".bmp"];

// Function to set the UI state for image display
var viewer = null;
function showImageUI(show) {
  if (show) {
    currentImage.style.display = "none";
    imageInfo.style.display = "block";
    imagePlaceholder.style.display = "none";
    if (viewer) {
      viewer.destroy();
    }
    viewer = new Viewer(currentImage, {
      inline: true,
    });
  } else {
    currentImage.style.display = "none";
    imageInfo.style.display = "none";
    imagePlaceholder.style.display = "flex";
  }
}

// Find images based on multiple names
function findImages(dir, imgNamesStr) {
  let results = [];
  const targetNamesInput = imgNamesStr
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0);
  if (targetNamesInput.length === 0) return results; // No names to search for

  // Create a set of target names without extensions for efficient lookup
  const targetNamesSet = new Set();
  targetNamesInput.forEach((name) => {
    const ext = window.electronAPI.extname(name).toLowerCase();
    if (validImageExtensions.includes(ext)) {
      targetNamesSet.add(window.electronAPI.basename(name, ext).toLowerCase());
    } else {
      targetNamesSet.add(name); // Assume no extension if not a valid image one
    }
  });

  if (targetNamesSet.size === 0) return results; // No valid names to search for after processing

  const list = window.electronAPI.readdirSync(dir);
  list.forEach((file) => {
    const filePath = window.electronAPI.joinPath(dir, file);
    if (window.electronAPI.isDirectory(filePath)) {
      results = results.concat(findImages(filePath, imgNamesStr)); // Pass original string for recursion
    } else {
      const currentFileExt = window.electronAPI.extname(file).toLowerCase();
      if (validImageExtensions.includes(currentFileExt)) {
        const currentFileNameWithoutExt = window.electronAPI
          .basename(file, currentFileExt)
          .toLowerCase();
        if (targetNamesSet.has(currentFileNameWithoutExt)) {
          results.push(filePath);
        }
      }
    }
  });
  return results;
}

function displayCurrentImage(filePath) {
  // Removed async as readFileSync is sync
  if (!filePath) {
    showImageUI(false);
    imagePlaceholder.textContent = "没有更多图片了。";
    ocrResult.textContent = "";
    progressInfo.textContent = "";
    preBtn.style.display = "none";
    nextBtn.style.display = "none";
    startBtn.disabled = false;
    return;
  }

  try {
    const year = extractFirstYear(filePath);
    document.getElementById("year").value = year;
    const arr = filePath.split("\\");
    const anjuanhao = arr.find((item) => item.includes("号"));
    document.getElementById("anjuanhao").value = anjuanhao;
    const juanci = arr[arr.length - 2 >= 0 ? arr.length - 2 : 0];
    document.getElementById("juanci").value = juanci;
    // Correctly call readFileSync and specify base64 encoding
    const base64Image = window.electronAPI.readFileSync(filePath, {
      encoding: "base64",
    });
    const ext = window.electronAPI.extname(filePath).substring(1);
    currentImage.src = `data:image/${ext};base64,${base64Image}`;
    // Wait for the image to load to get its dimensions
    currentImage.onload = () => {
      imageInfo.textContent = `路径: ${filePath} (宽度: ${currentImage.naturalWidth}px, 高度: ${currentImage.naturalHeight}px)`;
      showImageUI(true); // Ensure UI is updated to show image
    };
    currentImage.onerror = () => {
      // Handle image loading error specifically for dimensions part if needed
      imageInfo.textContent = `路径: ${filePath} (无法加载图片尺寸)`;
      showImageUI(false); // Or true, depending on desired behavior for failed dimension read
    };

    progressInfo.textContent = `图片 ${currentIndex + 1} / ${
      imageFiles.length
    }`;
    ocrResult.textContent = "正在识别中...";
    nextBtn.style.display = "inline-block";
    preBtn.style.display = "inline-block";

    // OCR can remain async
    window.electronAPI
      .ocr(serverInput.value, base64Image)
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
          ocrResult.textContent = "未找到有效的范围标记";
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
            item.text.replace(/\s+/g, "") == "备" ||
            item.text.replace(/\s+/g, "") == "考" ||
            item.text.replace(/\s+/g, "") == "备考" ||
            item.text.replace(/\s+/g, "") == "备考表"
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
        console.log({ left, right });
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

        // 生成带样式的表格
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        console.log("init", { result });

        function rendTable() {
          const tableHTML = `
                    <thead>
                      <tr style='background:#f5f5f5'>
                        <th>操作</th>
                        <th>文件名称</th>
                        <th>页次</th>
                        <th>页次范围</th>
                        <th>置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${result
                        .map((item, index) => {
                          let bgColor = "";
                          if (item.score < 0.8) bgColor = "critical-bg";
                          else if (item.score < 0.9) bgColor = "error-bg";
                          else if (item.score < 0.95) bgColor = "warning-bg";

                          return `
                          <tr data-index='${index}'>
                            <td class="${bgColor}">
                                <div style="display: flex;">
                                    <span class="delete-btn" data-index='${index}'>删除</span>
                                    <span class="add-btn" data-index='${index}'>添加</span>
                                </div>
                            </td>
                            <td data-index='${index}' class="${bgColor}">
                                <input type="text" value="${
                                  item.name
                                }" data-index='${index}' data-field='name' />
                            </td>
                            <td data-index='${index}' class="${bgColor}">
                                <input type="text" value="${
                                  item.pageNumber
                                }" data-index='${index}' data-field='pageNumber' />
                            </td>
                            <td data-index='${index}' class="${bgColor}">
                                <input type="text" value="${
                                  item.page
                                }" data-index='${index}' data-field='page' />
                            </td>
                            <td data-index='${index}' class="${bgColor}">${(
                            item.score * 100
                          ).toFixed(1)}%</td>
                          </tr>
                        `;
                        })
                        .join("")}
                    </tbody>
                  `;
          table.innerHTML = tableHTML;
          bindEvents();
          ocrResult.innerHTML = "";
          ocrResult.appendChild(table);
          // actions
          const actions = document.createElement("div");
          actions.className = "actions";
          // 添加导出按钮事件
          const exportButton = document.createElement("button");
          exportButton.className = "export";
          exportButton.textContent = "导出(存储到图片统计目录)";
          exportButton.onclick = async () => {
            try {
              const csvContent = [
                "批次,年度,案卷号,卷次,卷宗目录,页次,备注",
                ...result.map((item) => {
                  const escape = (str) =>
                    `"${String(str).replace(/"/g, '""')}"`;
                  return [
                    escape(piciInput.value),
                    escape(document.getElementById("year").value),
                    escape(document.getElementById("anjuanhao").value),
                    escape(document.getElementById("juanci").value),
                    escape(item.name),
                    escape(item.pageNumber),
                    "",
                  ].join(",");
                }),
              ].join("\n");

              const dirPath = window.electronAPI.dirname(filePath);
              const csvPath = window.electronAPI.joinPath(dirPath, "ocr.csv");

              await window.electronAPI.writeFile(csvPath, csvContent);
              alert(`成功导出到: ${csvPath}`);
            } catch (err) {
              console.error("导出失败:", err);
              alert(`导出失败: ${err.message}`);
            }
          };
          actions.appendChild(exportButton);
          const resetButton = document.createElement("button");
          resetButton.className = "reset";
          resetButton.textContent = "重置";
          resetButton.onclick = () => {
            displayCurrentImage(filePath);
          };
          actions.appendChild(resetButton);
          ocrResult.appendChild(actions);
        }

        // 添加表格样式和事件监听
        function bindEvents() {
          table.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.onclick = () => {
              const rowIndex = btn.dataset.index;
              result.splice(rowIndex, 1);
              console.log("delete", { result });
              rendTable();
            };
          });

          table.querySelectorAll(".add-btn").forEach((btn) => {
            btn.onclick = () => {
              const newRow = {
                name: "",
                page: "",
                pageNumber: "",
                score: 1,
              };
              const rowIndex = btn.dataset.index;
              console.log("rowIndex", rowIndex);
              result.splice(parseInt(rowIndex) + 1, 0, newRow);
              console.log("add", { result });
              rendTable();
            };
          });
          table.querySelectorAll("input").forEach((input) => {
            input.oninput = () => {
              const rowIndex = input.dataset.index;
              const field = input.dataset.field;
              result[rowIndex][field] = input.value;
            };
          });
        }
        rendTable();
      })
      .catch((ocrError) => {
        console.error("OCR处理时出错:", ocrError);
        ocrResult.textContent = `OCR 错误: ${ocrError.message}`;
      });
  } catch (error) {
    console.error("加载或显示图片时出错:", error);
    showImageUI(false); // Ensure UI shows placeholder on error
    imagePlaceholder.textContent = `加载图片失败: ${filePath}`;
    ocrResult.textContent = `错误: ${error.message}`;
    nextBtn.style.display = "inline-block"; // Allow trying next image even if current one fails
    preBtn.style.display = "inline-block";
  }
}

startBtn.addEventListener("click", () => {
  const dir = dirInput.value;
  const imgNamesStr = imgNameInput.value;
  const piciStr = piciInput.value;
  if (!piciStr) {
    alert("请输入批次号");
    return;
  }
  if (!dir) {
    alert("请选择图片根目录。");
    return;
  }
  if (!imgNamesStr) {
    alert("请输入图片名称（多个名称用逗号分隔）。");
    return;
  }

  try {
    imageFiles = findImages(dir, imgNamesStr);
    if (imageFiles.length > 0) {
      currentIndex = 0;
      startBtn.disabled = true;
      displayCurrentImage(imageFiles[currentIndex]);
    } else {
      showImageUI(false);
      imagePlaceholder.textContent =
        "在指定目录及其子目录中未找到具有该名称的图片。";
      ocrResult.textContent = "";
      progressInfo.textContent = "";
      nextBtn.style.display = "none";
      preBtn.style.display = "none";
    }
  } catch (error) {
    console.error("查找图片时出错:", error);
    showImageUI(false);
    imagePlaceholder.textContent = "查找图片时出错。";
    ocrResult.textContent = `查找图片错误: ${error.message}`;
  }
});

preBtn.addEventListener("click", () => {
  currentIndex--;
  if (currentIndex >= 0) {
    displayCurrentImage(imageFiles[currentIndex]);
  } else {
    showImageUI(false);
    imagePlaceholder.textContent = "已是第一张图片。";
    ocrResult.textContent = "";
    progressInfo.textContent = "";
    preBtn.style.display = "none";
  }
});

nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < imageFiles.length) {
    displayCurrentImage(imageFiles[currentIndex]);
  } else {
    showImageUI(false);
    imagePlaceholder.textContent = "已是最后一张图片。";
    ocrResult.textContent = "";
    progressInfo.textContent = "";
    nextBtn.style.display = "none";
    startBtn.disabled = false;
  }
});

selectDirBtn.addEventListener("click", async () => {
  const selectedPath = await window.electronAPI.openDirectoryDialog();
  if (selectedPath) {
    dirInput.value = selectedPath;
  }
});

// Allow dropping directory onto the input field
dirInput.addEventListener("drop", (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer.files.length > 0) {
    // Ensure it's a directory, though electronAPI.openDirectoryDialog is better for this
    // For simplicity, we'll assume the user drops a directory path or a file from which we can derive a path.
    // A more robust solution would check if event.dataTransfer.files[0].type is empty (usually for folders)
    // or use fs.statSync via preload if exposed.
    dirInput.value = event.dataTransfer.files[0].path;
  }
});
dirInput.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.stopPropagation();
});

// Initial state
document.addEventListener("DOMContentLoaded", () => {
  showImageUI(false);
  imagePlaceholder.textContent =
    "请先选择图片目录并输入图片名称（多个用逗号分隔），然后点击开始。";
  nextBtn.style.display = "none";
});

// 新增年份提取函数
const extractFirstYear = (text) => {
  const yearMatch = /\d{4}/.exec(text);
  return yearMatch ? yearMatch[0] : "";
};
