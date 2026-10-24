# 骰间手机端开发与验收

当前仓库同时包含 Web、Android 和 iOS 工程。移动端复用 React、TypeScript、Three.js 与现有图片，通过 Capacitor 提供原生容器。

## 项目信息

- App 名称：骰间
- Bundle/Application ID：`com.dicejian.app`
- Android：`android/`
- iOS：`ios/`
- Web 构建目录：`dist/`
- 原生图标与启动画面源文件：`assets/`

## 常用命令

```text
npm run typecheck
npm run build
npm run mobile:sync
npm run mobile:doctor
npm run mobile:android
npm run mobile:ios
```

每次修改 Web 功能后先执行 `npm run mobile:sync`，再从 Android Studio 或 Xcode 运行原生工程。

## 本地环境

Android 构建需要 JDK 21、Android SDK Platform 36 和相应 Build Tools。可以使用 Android Studio 管理 SDK，也可以使用 Google 官方命令行工具。SDK 路径由本机 `android/local.properties` 或 `ANDROID_HOME` 指定，不提交到仓库。

iOS 构建必须在安装 Xcode 的 macOS 上进行。Windows 可以生成、维护和同步 iOS 工程，但不能编译或上传 TestFlight。

## 数据与隐私

- 首版不需要登录和后端服务。
- 会话、主题、启用状态和历史记录保存在 App 的本地 WebView 存储中。
- 清空记录会同时清理命运 D20、互动 D20、筊杯和灵签记录。
- 删除或停用插件不会自动删除其历史数据。
- 应用不申请相机、定位、通讯录等无关权限。

## 视觉一致性

- D20 和灵签背景继续使用 `public/assets/` 中的原始图片。
- 原生 App 图标和启动画面使用 `assets/` 中的 SVG 源文件。
- 手机端只调整布局、触控面积和安全区，不修改各插件的结果规则、核心配色和内容层级。
- 关键验收视口为 390×844，同时检查窄屏、小屏和横屏。

## 发布前检查

1. 运行 TypeScript 检查和生产构建。
2. 执行 `npm run mobile:sync`，确保两个原生工程拿到最新资源。
3. Android 真机检查返回键、软键盘、深浅色模式、离线和 WebGL 降级。
4. iPhone 真机检查安全区、底部导航、输入框缩放和 TestFlight 安装升级。
5. 验证五个工具、四类历史记录、插件启停和数据重启恢复。
6. 生成正式签名的 AAB 和 iOS Archive；密钥、证书和描述文件不得提交到仓库。

## 当前机器的构建状态

- Web 生产构建和原生资源同步可运行。
- 2026-10-24：Web 生产构建、`cap sync android` 和 `gradlew.bat assembleDebug --offline` 已通过，已生成 Android APK。
- APK 签名校验通过，应用 ID 为 `com.dicejian.app`，显示名称为“骰间”，版本为 1.0，最低支持 Android 7.0（API 24）。
- 已验证的调试签名安装包保存在本地工作区 `releases/dicejian-1.0-debug.apk`。APK 属于本机构建产物，不提交到源码仓库。
- 通过下方重新打包命令可以在项目本地生成 APK；生成的安装包尚未进行安卓真机验收。
- iOS 工程已经生成；需要在 macOS/Xcode 环境完成编译、签名和 TestFlight 上传。

## 安卓安装与投掷

1. 在电脑上使用下方的重新打包命令生成安装包；本机已生成的文件位于 `releases/dicejian-1.0-debug.apk`。
2. 将 APK 通过 USB、聊天文件或其他文件传输方式发送到安卓手机。
3. 在手机文件管理器中打开 APK，按系统提示允许该来源安装应用，然后完成安装。
4. 打开“骰间”，在底部“工具”中选择“互动 D20”，点击“掷出 D20”或拖动骰子后松手进行投掷；其他工具也可从这里打开。
5. 网页资源已内置在安装包中，无需启动电脑上的开发服务器。可以在断网后检查投掷、记录以及关闭重开后的记录恢复。

此版本没有接入手机摇晃传感器。界面中的拖动投掷和按钮投掷复用现有网页逻辑，触控、返回键及键盘表现仍需在实际手机上验证。

## 在当前电脑重新打包安卓版本

从项目根目录执行以下 PowerShell 命令：

```powershell
npm run build
npx cap sync android
$env:JAVA_HOME = 'C:\Program Files\Android\openjdk\jdk-21.0.8'
$env:ANDROID_HOME = 'C:\Program Files (x86)\Android\android-sdk'
Push-Location android
try {
    .\gradlew.bat assembleDebug --offline --console=plain
} finally {
    Pop-Location
}
```

将其中的 `JAVA_HOME` 和 `ANDROID_HOME` 设置为你电脑上 JDK 21 与 Android SDK 的安装位置，并在 `android/local.properties` 中指定本地 SDK 路径。此文件不提交到仓库。Gradle 生成 APK 到 `android/app/build/outputs/apk/debug/app-debug.apk`；复制到 `releases/dicejian-1.0-debug.apk` 后即可安装。本机已缓存 Gradle 依赖，因此示例使用 `--offline`；新电脑首次构建需要联网下载依赖。
