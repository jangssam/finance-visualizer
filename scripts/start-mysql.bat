@echo off
echo MySQL 8.4 서버 시작 중...
start "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir=C:\MySQLData --port=3306
timeout /t 3 /nobreak
echo MySQL이 시작되었습니다. (localhost:3306)
