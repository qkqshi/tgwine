# Как запушить на GitHub и проверить в Telegram-боте

## 1. Установите Git (если ещё не установлен)

- Скачайте: https://git-scm.com/download/win  
- При установке отметьте **"Add Git to PATH"**.

## 2. Запушьте код

**Вариант А — через скрипт (в PowerShell в папке `tgbot`):**

```powershell
cd C:\Users\danil\Desktop\tgbot
.\push-to-github.ps1
```

**Вариант Б — вручную:**

```powershell
cd C:\Users\danil\Desktop\tgbot

git add -A
git commit -m "Apple-style design: Tailwind, new UI, safe area for Telegram"
git push origin main
```

При первом `git push` может потребоваться авторизация в GitHub (логин/пароль или токен).

## 3. Подключите фронт к боту

- Репозиторий: **https://github.com/qkqshi/tgwine**
- Если фронт деплоится на **Vercel** (есть `client/vercel.json`):
  - Подключите репозиторий в Vercel: https://vercel.com → Import Project → GitHub → `qkqshi/tgwine`.
  - Root Directory укажите **`client`** (или настройте build: `npm run build`, output: `dist`).
  - После деплоя скопируйте URL приложения (например `https://tgwine.vercel.app`).
- В коде бота (BotFather или сервер) укажите этот URL как **Web App** для кнопки/команды, которая открывает мини-приложение.

## 4. Проверка в Telegram

- Откройте бота в Telegram.
- Нажмите кнопку/команду, которая открывает Web App.
- Должен открыться обновлённый интерфейс в стиле Apple с новым дизайном.

---

**Remote репозитория:** `origin` → https://github.com/qkqshi/tgwine (ветка `main`).
