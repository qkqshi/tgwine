# Пуш изменений (Apple-style дизайн) на GitHub
# Запустите в папке tgbot: .\push-to-github.ps1

Set-Location $PSScriptRoot

git add -A
git status

$msg = "Apple-style design: Tailwind, new UI, safe area for Telegram"
git commit -m $msg
if ($LASTEXITCODE -ne 0) {
    Write-Host "Нет изменений для коммита или ошибка. Проверьте git status."
    exit 1
}

git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nГотово! Репозиторий: https://github.com/qkqshi/tgwine"
} else {
    Write-Host "Ошибка push. Проверьте: git remote -v, доступ к GitHub, ветку main."
}
