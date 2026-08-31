# macOS 学生实验环境安装指南

> 适用对象：在 macOS 13 或更高版本上完成 DSA Mastery 本地 C++ Lab 的学生，支持 Apple Silicon 与 Intel Mac。

开始前，可以点击屏幕左上角的 Apple 菜单，选择“关于本机”，确认 macOS 版本和芯片类型。显示“Apple M1/M2/M3/M4”等型号时选择 Apple Silicon（ARM64）安装包；显示 Intel 时选择 x64 安装包。

## 1. 安装 Xcode Command Line Tools

DSA Mastery 的 C++ Lab 需要 Git、C++ 编译器和 Make。macOS 可以通过 Xcode Command Line Tools 安装这些基础工具，无需下载完整的 Xcode。

打开终端，执行：

```bash
xcode-select --install
```

在弹出的窗口中点击“安装”，同意许可协议并等待安装完成。如果提示工具已经安装，则无需重复安装。

<!-- 截图位置：xcode-select --install 弹出的安装窗口。建议文件名：02-xcode-select-install.png -->

安装完成后，在终端运行：

```bash
echo "=== Xcode Command Line Tools 安装检查 ==="
echo
echo "开发工具路径："
xcode-select -p
echo
echo "Git 版本："
git --version
echo
echo "C++ 编译器版本："
clang++ --version | head -n 3
```

`xcode-select -p` 通常会输出以下路径之一：

```text
/Library/Developer/CommandLineTools
```

或者：

```text
/Applications/Xcode.app/Contents/Developer
```

能够正常显示开发工具路径、Git 版本和 Apple Clang 版本，即表示安装成功。

<!-- 截图位置：终端显示 xcode-select、Git 和 Apple Clang 检查结果。建议文件名：03-xcode-tools-check.png -->

Apple 官方说明：[安装 Xcode Command Line Tools](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools)

## 2. （可选）安装 Homebrew

Homebrew 是 macOS 常用的软件包管理工具，方便后续安装其他开发工具。本指南中的 Node.js 和 CMake 均使用官方图形安装包，因此不安装 Homebrew 也可以完成课程 Lab。

### 2.1 下载安装包

打开 [Homebrew 最新版本页面](https://github.com/Homebrew/brew/releases/latest)，展开页面底部的 **Assets**，点击 `Homebrew.pkg`。

不要下载 `Source code` 文件。

![Homebrew.pkg 下载链接](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/0e71af2113e20637b6cd92bfc383d91d.png)

下载完成后，双击 `Homebrew.pkg` 打开安装器。

### 2.2 完成安装

进入安装器后，点击“继续”。

![Homebrew 安装器介绍页面](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/7486701d715f5e45654edb64edf0ac07.png)

阅读软件许可协议，然后点击“继续”。

![Homebrew 软件许可协议](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/11d4945284ac22ff681bfce32a691378.png)

在弹出的确认窗口中点击“同意”。

![同意 Homebrew 软件许可协议](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/143181127b4836b6c0884531a675e9f7.png)

保持默认安装位置，点击“安装”。系统可能要求输入 Mac 登录密码或使用 Touch ID。

![确认安装 Homebrew](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/d627d6376a8a3d4f91c83baf494d2ecf.png)

出现“安装成功”后，点击“关闭”。

![Homebrew 安装成功](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/99c3517106cb7e98641195a09276e612.png)

### 2.3 配置终端环境

安装完成后，需要将 Homebrew 加入终端环境。

Apple Silicon Mac 执行：

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Intel Mac 执行：

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

最后检查安装结果：

```bash
brew --version
brew --prefix
```

可以得到如下：

![Homebrew 版本与安装路径](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/8335804009da3db3315dc7372ce8cf07-1.png)

Apple Silicon Mac 的安装路径通常为 `/opt/homebrew`，Intel Mac 通常为 `/usr/local`。能够正常显示版本和安装路径，即表示 Homebrew 已可使用。

Homebrew 官方安装说明：[Homebrew Installation](https://docs.brew.sh/Installation)

Homebrew 官方网站：[Homebrew](https://brew.sh/)

## 3. 安装 Node.js 和 pnpm

本指南推荐安装 Node.js 24 LTS。不要使用 npm 替代 pnpm 安装项目依赖，否则可能产生与仓库不一致的锁文件。

### 3.1 下载 Node.js

打开 [Node.js 官方下载页面](https://nodejs.org/en/download)，选择：

- 版本：Node.js 24 LTS
- 系统：macOS
- Apple Silicon Mac：`ARM64`
- Intel Mac：`x64`

然后点击 **macOS Installer (.pkg)**。

![Node.js 官方下载页面](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/24e0f1c1ab806a491792caf4a9cb4543.png)

### 3.2 安装 Node.js

双击下载的 `.pkg` 文件，打开 Node.js 安装器。

点击“继续”，按照提示阅读并同意许可协议，然后保持默认安装位置完成安装。系统可能要求输入 Mac 登录密码或使用 Touch ID。

![Node.js macOS 安装器](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/85f03b08325b9ecdd2c8259242d114bb.png)

安装完成后，关闭并重新打开终端。

### 3.3 检查 Node.js

在终端运行：

```bash
node --version
npm --version
corepack --version
which node
```

Node.js 应显示 `v24.x.x`，安装路径通常为：

```text
/usr/local/bin/node
```

![Node.js、npm 与 Corepack 版本检查](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/ee2ccec21b35aad2e007c70267abff3c.png)

### 3.4 安装 pnpm

Node.js 24 附带 Corepack，可以通过 Corepack 安装项目指定的 pnpm。

使用官方 `.pkg` 安装 Node.js 时，Corepack 需要管理员权限在 `/usr/local/bin` 中创建 pnpm 命令。执行：

```bash
sudo corepack enable pnpm
```

终端会要求输入 Mac 登录密码。输入密码时不会显示字符，正常输入并按回车即可。

然后安装并固定 pnpm 版本：

```bash
corepack install --global pnpm@11.1.1
hash -r
```

检查安装结果：

```bash
pnpm --version
which pnpm
```

预期版本为：

```text
11.1.1
```

安装路径通常为：

```text
/usr/local/bin/pnpm
```

![pnpm 版本与安装路径](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/1238f8ae7f5abebd14b154202fdc09d2.png)

至此，Node.js 和 pnpm 均已安装完成。

## 4. 安装 VS Code

Visual Studio Code 用于编辑代码和查看项目文件。它本身不包含 C++ 编译器；前面安装的 Apple Clang 负责编译 C++ 程序。

### 4.1 下载 VS Code

打开 [VS Code 官方下载页面](https://code.visualstudio.com/Download)，选择适合当前 Mac 的安装包。

![VS Code macOS 下载页面](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/image.png)

### 4.2 安装 C++ 扩展

打开 VS Code 左侧的“扩展”页面，搜索并安装：

```text
C/C++
```

确认扩展发布者为 Microsoft，扩展 ID 为：

```text
ms-vscode.cpptools
```

该扩展提供 C++ 代码补全、语法检查和调试支持。

如果后续需要运行或调试 CMake Project Lab，还可以安装 [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools)，扩展 ID 为 `ms-vscode.cmake-tools`。

<!-- 截图位置：VS Code 扩展页中的 C/C++ 与 CMake Tools。建议文件名：16-vscode-extensions.png -->

### 4.3 启用 code 命令

按 `Command + Shift + P` 打开命令面板，搜索并执行：

```text
Shell Command: Install 'code' command in PATH
```

关闭并重新打开终端，然后检查：

```bash
code --version
```

之后可以在项目目录中执行：

```bash
code .
```

用 VS Code 打开整个项目。

<!-- 截图位置：命令面板中安装 code 命令，以及终端执行 code --version。建议文件名：17-vscode-code-command.png -->

## 5. 安装 CMake

Project Lab 需要 CMake。打开 [CMake 官方下载页面](https://cmake.org/download/)，下载：

```text
cmake-4.4.3-macos-universal.dmg
```

![CMake macOS Universal 安装包](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/76803143522d8745971ba1cc4ef315dd.png)

打开 `.dmg` 文件，将 `CMake.app` 拖入 `Applications` 文件夹。

然后在终端执行：

```bash
sudo "/Applications/CMake.app/Contents/bin/cmake-gui" --install
```

重新打开终端并检查：

```bash
cmake --version
which cmake
```

CMake 版本为 `3.25` 或更高即表示安装成功。

![CMake 版本与安装路径](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/new.png)

## 6. 验证完整环境

打开终端，依次执行：

```bash
echo "Git 版本："
git --version
echo

echo "Node.js 版本："
node --version
echo

echo "pnpm 版本："
pnpm --version
echo

echo "C++ 编译器版本："
clang++ --version | head -n 3
echo

echo "CMake 版本："
cmake --version | head -n 1
```

版本要求：

| 工具 | 要求 |
| --- | --- |
| Node.js | `22.13.0` 或更高 |
| pnpm | `11.1.1` |
| Apple Clang | `14.0.0` 或更高 |
| CMake | `3.25` 或更高 |

能够正常显示各工具的版本号，即表示环境安装完成。

![DSA Mastery 完整环境检查结果](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/3871e2892b8090aabd9ab36e8d93ac09.png)

## 7. 下载课程仓库

建议把代码放在路径简短、没有特殊符号的目录中，例如 `~/Projects`。打开终端，执行：

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/AzenAnn/DSA-Mastery.git
cd DSA-Mastery
pnpm install --frozen-lockfile
```

第一次安装依赖需要联网。出现 `Done` 且没有错误信息，即表示依赖安装成功。

如果已经 Fork 了仓库，并且需要向自己的仓库提交修改，请把克隆地址替换为自己的地址，例如：

```bash
git clone https://github.com/yourid/DSA-Mastery.git
```

也可以从 GitHub 下载 ZIP，但 ZIP 不包含完整的 Git 历史，不方便同步更新和提交 PR，因此推荐使用 `git clone`。

<!-- 截图位置：git clone 和 pnpm install --frozen-lockfile 成功输出。建议文件名：21-clone-and-install.png -->

安装完成后，可以在仓库目录执行：

```bash
code .
```

## 8. 运行第一个 Program Lab

进入仓库根目录：

```bash
cd ~/Projects/DSA-Mastery
```

先检查运行环境：

```bash
pnpm lab:doctor -- labs/chapter-01/exercise/E-01-01-sequential-list-deduplication
```

看到 `PASS 环境检查`，并且 Clang 显示 `AVAILABLE`，即可继续。

![Program Lab 环境检查结果](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/947c7d8124381f81f57d18658776d026.png)

为了确认编译和测试流程正常，可以运行仓库中的参考实现：

```bash
pnpm lab:run -- labs/chapter-01/exercise/E-01-01-sequential-list-deduplication --target solution
```

看到 `PASS`、`4/4 cases` 和 `100/100`，表示测试全部通过。

![Program Lab 全部公开测试通过](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/9ff4403fb88b39e5294144d2f50941b4.png)

也可以只运行示例测试：

```bash
pnpm lab:run -- labs/chapter-01/exercise/E-01-01-sequential-list-deduplication --target solution --case 001-sample
```

![Program Lab 示例测试通过](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/4550e0bf28331a52b348a1c3d793d831.png)

`--target solution` 用于验证仓库提供的参考实现。学生完成自己的代码后，应去掉该参数：

```bash
pnpm lab:run -- labs/chapter-01/exercise/E-01-01-sequential-list-deduplication
```

## 9. 运行 Project Lab

Project Lab 需要 Apple Clang 和 CMake。先执行环境检查：

```bash
pnpm lab:doctor -- labs/chapter-08/project/P-08-01-avl-tree-rotations
```

看到 `PASS 环境检查`，并且 Clang 和 CMake 显示 `AVAILABLE`，即可继续。MSVC 仅供 Windows 使用，显示 `NOT FOUND` 属于正常情况；GNU Make 版本较旧也不影响使用 `pnpm`。

![Project Lab 环境检查结果](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/project-lab-doctor.png)

运行 Project Lab 的参考实现：

```bash
pnpm lab:run -- labs/chapter-08/project/P-08-01-avl-tree-rotations --target solution
```

自动测试通过后会显示：

```text
AUTOMATED PASS · MANUAL REVIEW PENDING
```

其中 `PENDING` 表示报告部分需要人工评分，不代表运行失败。

![Project Lab 自动测试通过](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/1debcf3aa88c3fa90aaf0d8e8f6b6a0b.png)

也可以只运行指定任务和测试用例：

```bash
pnpm lab:run -- labs/chapter-08/project/P-08-01-avl-tree-rotations --target solution --task bst --case 001-basic
```

看到 `AUTOMATED PASS` 即表示该测试通过。因为这里只运行了一个任务，所以 `Provisional total` 不会显示为 100 分。

![Project Lab 指定任务与用例通过](../../docs/image/MACOS_STUDENT_SETUP_GUIDE/39e7083699781c49a1157da78a189f59.png)

学生完成自己的 Project 代码后，应去掉 `--target solution`，测试 `student` 目录中的实现。
