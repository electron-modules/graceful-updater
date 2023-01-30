:: 通过 「Bat To Exe Converter」 软件编译成 installer.exe
@echo off
taskkill /f /im %3
timeout /T 1 /NOBREAK
del /f /q /a %1\app.asar
move %2\latest.asar %1
ren %1\latest.asar app.asar
explorer.exe %4