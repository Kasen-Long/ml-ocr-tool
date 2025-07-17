npm install --os=win32 --cpu=ia32 sharp@0.34.2

# electron sharp
如何基于electron forge webpack安装sharp. 

## 问题
安装完sharp打包无法打开app。

## 原因

forge打包基于
```
module.exports = {
  module: {
    rules: [
      {
        // We're specifying native_modules in the test because the asset
        // relocator loader generates a "fake" .node file which is really
        // a cjs file.
        test: /native_modules\/.+\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          loader: '@vercel/webpack-asset-relocator-loader',
          options: {
            outputAssetBase: 'native_modules'
          }
        }
      }
    ]
  }
};
```
node-loader 插件会为.node配置unpack。

@vercel/webpack-asset-relocator-loader 会把.node copy到构建目录下(.webpack). 并且重新命名。
一般情况直接引用  xx.node 或者使用https://www.npmjs.com/package/bindings  此插件会正确的查找到。

### 为啥构建完成sharp不行了

sharp构建目录，包括引用方式都比较特殊，导致插件@vercel/webpack-asset-relocator-loader读取失败，即便成功了因为有.dll文件也不能加载成功

```
目录: D:\electron-node-addon\node_modules\@img\sharp-win32-x64\lib

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        2024/11/21     11:49       18956288 libvips-42.dll
-a----        2024/11/21     11:49         369152 libvips-cpp.dll
-a----        2024/11/21     11:49         421888 sharp-win32-x64.node
```

## 如何解决
我这里采用简单的方法，把相关文件放到extraResource里面，具体配置如下

```
packagerConfig: {
    asar: true,
    extraResource: [
      `node_modules/@img`,
    ]
  }
}
```
然后安装 npm i sharp-electron

sharp-electron里面我改动了 lib\sharp.js

```
const paths = [
  `${process.resourcesPath}/@img/sharp-${runtimePlatform}/lib/sharp-${runtimePlatform}.node`,
  `../src/build/Release/sharp-${runtimePlatform}.node`,
  '../src/build/Release/sharp-wasm32.node',
  `@img/sharp-${runtimePlatform}/sharp.node`,
  '@img/sharp-wasm32/sharp.node'
];
```
这样就能够加载到打包后extraResource里的内容了。

### 关于process.resourcesPath
这个环境变量是electron内置的extraResource路径。

## 参考
https://www.electronforge.io/config/plugins/webpack