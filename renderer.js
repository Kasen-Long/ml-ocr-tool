const serverInput = document.getElementById('server');
const dirInput = document.getElementById('dir');
const selectDirBtn = document.getElementById('selectDirBtn');
const imgNameInput = document.getElementById('imgName');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const progressInfo = document.getElementById('progressInfo');
const currentImage = document.getElementById('currentImage');
const imageInfo = document.getElementById('imageInfo');
const ocrResult = document.getElementById('ocrResult');
const imagePlaceholder = document.getElementById('imagePlaceholder');

let imageFiles = [];
let currentIndex = -1;

const validImageExtensions = ['.jpeg', '.jpg', '.png', '.tiff', '.bmp'];

// Function to set the UI state for image display
function showImageUI(show) {
    if (show) {
        currentImage.style.display = 'block';
        imageInfo.style.display = 'block';
        imagePlaceholder.style.display = 'none';
    } else {
        currentImage.style.display = 'none';
        imageInfo.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
    }
}

// Find images based on multiple names
function findImages(dir, imgNamesStr) {
    let results = [];
    const targetNamesInput = imgNamesStr.split(',').map(name => name.trim().toLowerCase()).filter(name => name.length > 0);
    if (targetNamesInput.length === 0) return results; // No names to search for

    // Create a set of target names without extensions for efficient lookup
    const targetNamesSet = new Set();
    targetNamesInput.forEach(name => {
        const ext = window.electronAPI.extname(name).toLowerCase();
        if (validImageExtensions.includes(ext)) {
            targetNamesSet.add(window.electronAPI.basename(name, ext).toLowerCase());
        } else {
            targetNamesSet.add(name); // Assume no extension if not a valid image one
        }
    });

    if (targetNamesSet.size === 0) return results; // No valid names to search for after processing

    const list = window.electronAPI.readdirSync(dir);
    list.forEach(file => {
        const filePath = window.electronAPI.joinPath(dir, file);
        if (window.electronAPI.isDirectory(filePath)) {
            results = results.concat(findImages(filePath, imgNamesStr)); // Pass original string for recursion
        } else {
            const currentFileExt = window.electronAPI.extname(file).toLowerCase();
            if (validImageExtensions.includes(currentFileExt)) {
                const currentFileNameWithoutExt = window.electronAPI.basename(file, currentFileExt).toLowerCase();
                if (targetNamesSet.has(currentFileNameWithoutExt)) {
                    results.push(filePath);
                }
            }
        }
    });
    return results;
}

function displayCurrentImage(filePath) { // Removed async as readFileSync is sync
    if (!filePath) {
        showImageUI(false);
        imagePlaceholder.textContent = '没有更多图片了。';
        ocrResult.textContent = '';
        progressInfo.textContent = '';
        nextBtn.style.display = 'none';
        startBtn.disabled = false;
        return;
    }

    try {
        // Correctly call readFileSync and specify base64 encoding
        const base64Image = window.electronAPI.readFileSync(filePath, { encoding: 'base64' });
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

        progressInfo.textContent = `图片 ${currentIndex + 1} / ${imageFiles.length}`;
        ocrResult.textContent = '正在识别中...';
        nextBtn.style.display = 'inline-block'; // Show next button while processing

        // OCR can remain async
        window.electronAPI.ocr(serverInput.value, base64Image)
            .then(result => {
                ocrResult.textContent = JSON.stringify(result, null, 2);
            })
            .catch(ocrError => {
                console.error('OCR处理时出错:', ocrError);
                ocrResult.textContent = `OCR 错误: ${ocrError.message}`;
            });

    } catch (error) {
        console.error('加载或显示图片时出错:', error);
        showImageUI(false); // Ensure UI shows placeholder on error
        imagePlaceholder.textContent = `加载图片失败: ${filePath}`;
        ocrResult.textContent = `错误: ${error.message}`;
        nextBtn.style.display = 'inline-block'; // Allow trying next image even if current one fails
    }
}

startBtn.addEventListener('click', () => {
    const dir = dirInput.value;
    const imgNamesStr = imgNameInput.value;
    if (!dir) {
        alert('请选择图片根目录。');
        return;
    }
    if (!imgNamesStr) {
        alert('请输入图片名称（多个名称用逗号分隔）。');
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
            imagePlaceholder.textContent = '在指定目录及其子目录中未找到具有该名称的图片。';
            ocrResult.textContent = '';
            progressInfo.textContent = '';
            nextBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('查找图片时出错:', error);
        showImageUI(false);
        imagePlaceholder.textContent = '查找图片时出错。';
        ocrResult.textContent = `查找图片错误: ${error.message}`;
    }
});

nextBtn.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex < imageFiles.length) {
        displayCurrentImage(imageFiles[currentIndex]);
    } else {
        showImageUI(false);
        imagePlaceholder.textContent = '已是最后一张图片。';
        ocrResult.textContent = '';
        progressInfo.textContent = '';
        nextBtn.style.display = 'none';
        startBtn.disabled = false;
    }
});

selectDirBtn.addEventListener('click', async () => {
    const selectedPath = await window.electronAPI.openDirectoryDialog();
    if (selectedPath) {
        dirInput.value = selectedPath;
    }
});

// Allow dropping directory onto the input field
dirInput.addEventListener('drop', (event) => {
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
dirInput.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
});

// Initial state
document.addEventListener('DOMContentLoaded', () => {
    showImageUI(false);
    imagePlaceholder.textContent = '请先选择图片目录并输入图片名称（多个用逗号分隔），然后点击开始。';
    nextBtn.style.display = 'none';
});