import * as xlsx from 'xlsx';

const validImageExtensions = [".jpeg", ".jpg", ".png", ".tiff", ".bmp"];

export function findImages(dir, imgNamesStr) {
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

const validTemplateExtensions = [".xls", ".xlsx"];

// 查到dir下所有后缀为 xls, xlsx, csv 的文件
export function findTemplates(dir) {
    let results = [];
    const list = window.electronAPI.readdirSync(dir);
    list.forEach((file) => {
        const filePath = window.electronAPI.joinPath(dir, file);
        if (window.electronAPI.isDirectory(filePath)) {
            results = results.concat(findTemplates(filePath)); // Pass original string for recursion
        } else {
            const currentFileExt = window.electronAPI.extname(file).toLowerCase();
            if (validTemplateExtensions.includes(currentFileExt)) {
                const content = window.electronAPI.readFileSync(filePath);
                const workbook = xlsx.read(content, { type: "buffer" });
                const value = xlsx.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]], { FS: ',', RS: '\n' }).split(/\r?\n/)?.[0] || '';
                if (value.length) {
                    results.push({ value: `${results.length}:${value}`, label: window.electronAPI.basename(file, currentFileExt) });
                }
            }
        }
    });
    return results;
}