@echo off
chcp 65001 >nul
echo ========================================
echo   rent8 小程序编译脚本
echo ========================================
echo.

cd /d "%~dp0miniprogram"

echo [提示] 微信开发者工具需要手动打开
echo.
echo 请按以下步骤操作：
echo 1. 打开微信开发者工具
echo 2. 导入项目：D:\开发\rent8_wechat\miniprogram
echo 3. 点击编译按钮
echo.
echo 如果需要重新构建 npm，请运行：
echo   npm install
echo.
pause
