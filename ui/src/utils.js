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