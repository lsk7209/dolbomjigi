@echo off
chcp 65001 > nul
title [돌봄지기] 무인 자동 콘텐츠 발행 및 동기화 데몬

echo ======================================================================
echo  [돌봄지기] 무인 자율 콘텐츠 발행 데몬 구동
echo  - 모드: 상주형 백그라운드 데몬 (--daemon)
echo  - 주기: 6시간마다 자동 Wake-up 및 큐 동기화
echo  - 로그: logs/daemon-dolbom.log
echo ======================================================================

cd /d "%~dp0"
node scripts/daemon-content.mjs --daemon --interval-hours 6

pause
