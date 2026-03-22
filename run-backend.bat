@echo off
chcp 65001 >nul
echo ========================================
echo   rent8 后端依赖安装脚本
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/2] 正在安装依赖...
echo.
npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [错误] 安装失败，请尝试以下操作：
    echo 1. 关闭所有编辑器（如 VSCode, TRAE 等）
    echo 2. 以管理员身份运行此脚本
    echo 3. 检查杀毒软件是否阻止了 npm
    pause
    exit /b 1
)

echo.
echo [2/2] 启动开发服务器...
echo.
npm run start:dev

pause
