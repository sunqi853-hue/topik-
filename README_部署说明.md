# TOPIK 背词网页部署说明

这个文件夹已经整理成 GitHub Pages 可以直接识别的静态网页结构。

## 当前项目状态

- `index.html`、`app.js`、`styles.css` 已放在根目录。
- 已加入 `.nojekyll`，避免 GitHub Pages 忽略特殊文件。
- `data/vocab.js` 已放到正确位置。
- 音频不放进仓库，网页默认从 GitHub Release `v1.0` 读取。

## 还缺什么

还需要把 zip 里的 mp3 单独上传到 GitHub Release，不能只上传 `audio-files.zip`。

你的网页代码目前会读取：

- `./data/vocab.js`
- `https://github.com/sunqi853-hue/topik-/releases/download/v1.0/初级-UNIT-1.mp3`
- `https://github.com/sunqi853-hue/topik-/releases/download/v1.0/中级-UNIT-1.mp3`
- `https://github.com/sunqi853-hue/topik-/releases/download/v1.0/高级-UNIT-1.mp3`

GitHub Release 里的 `audio-files.zip` 不能被网页直接当作单个 mp3 播放。你需要先解压 zip，然后把 mp3 按下面的名字单独上传到 Release Assets：

- `初级-UNIT-1.mp3`
- `初级-UNIT-2.mp3`
- `中级-UNIT-1.mp3`
- `高级-UNIT-20.mp3`

也就是把原来的 `初级/UNIT 1.mp3` 改名为 `初级-UNIT-1.mp3`，把原来的 `中级/UNIT 2.mp3` 改名为 `中级-UNIT-2.mp3`。

## 上传到 GitHub

1. 打开仓库：https://github.com/sunqi853-hue/topik-
2. 点击 `Add file`。
3. 选择 `Upload files`。
4. 把本文件夹里的内容拖进去，注意不是只上传 zip 文件，而是上传解压后的文件。
5. 提交到 `main` 分支。

## 开启 GitHub Pages

1. 打开仓库的 `Settings`。
2. 左侧点击 `Pages`。
3. `Build and deployment` 选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. 保存。

成功后，网址通常是：

https://sunqi853-hue.github.io/topik-/

如果刚开启 Pages，可能需要等待 1-3 分钟。
