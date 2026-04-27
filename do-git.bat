@echo off
set GIT=C:\Users\Dokumentasi\AppData\Local\Programs\Git\cmd\git.exe
set REPO=C:\Users\Dokumentasi\Documents\Projects\evolution-api

REM Hapus SKILL.md dari git tracking (file tetap ada di disk)
%GIT% -C %REPO% rm --cached SKILL.md

REM Update .gitignore
%GIT% -C %REPO% add .gitignore

REM Orphan branch baru = hapus seluruh history lama
%GIT% -C %REPO% checkout --orphan clean-main
%GIT% -C %REPO% add -A
%GIT% -C %REPO% commit -m "Initial commit: Evolution API Masjid MJ - clean history"
%GIT% -C %REPO% branch -D main
%GIT% -C %REPO% branch -m main
%GIT% -C %REPO% push origin main --force
echo GIT_DONE
