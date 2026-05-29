# WeTTY Fork — Development Guide

Назначение этой сессии: форк WeTTY (Web + TTY) для портирования на современные
версии Node.js и улучшения кодовой базы.

## Project Info

- **Upstream:** https://github.com/butlerx/wetty
- **Fork:** https://github.com/OmSoft-tech/wetty
- **Локально:** /home/omsoft/develop/wetty/
- **Лицензия:** MIT
- **Язык:** TypeScript (Node.js)
- **Пакетный менеджер:** pnpm

## Development Setup

```bash
cd ~/develop/wetty
pnpm install              # Установка зависимостей
pnpm build                # Сборка проекта (esbuild)
pnpm start                # Запуск
pnpm test                 # Mocha тесты
pnpm dev                  # Режим разработки с hot-reload
```

## Выполненные изменения

### Port default 3000 → 3001

- `src/shared/defaults.ts` — `PORT || '3000'` → `PORT || '3001'`
- Все доки (README.md, docs/), конфиги, Dockerfile, docker-compose.yml

### node-pty upgrade 0.10 → 1.1.0

- `package.json` — `^0.10.0` → `^1.1.0`
- Причина: node-pty 0.10 использует `nan` (устаревший C++ API), который
  несовместим с Node.js 25
- node-pty 1.1.0 использует `node-addon-api` (N-API) — совместим со всеми
  современными Node
- API обратно совместим: `IPtyForkOptions`, `pty.spawn()` — без изменений

### gc-stats removed

- `package.json` — удалён из зависимостей
- `src/server.ts` — удалён импорт и вызов `gc().on('stats', gcMetrics)`
- `src/server/metrics.ts` — удалён (файл) — файл целиком
- Причина: gc-stats застрял на 1.4.1, использует `nan`, несовместим с Node 25
- Альтернатива не требуется — Prometheus GC-метрики не критичны,
  `collectDefaultMetrics()` остаётся

## Architecture

```
src/
├── main.ts              — CLI (yargs)
├── server.ts            — Express + Socket.IO, spawn процессов
├── server/
│   ├── command.ts       — SSH vs local login выбор
│   ├── command/
│   │   ├── address.ts   — Резолв адреса по socket
│   │   ├── login.ts     — `/bin/login` или `--command`
│   │   └── ssh.ts       — Сборка ssh команды
│   ├── spawn.ts         — node-pty: spawn процесса
│   ├── socketServer.ts  — HTTP + Socket.IO сервер
│   ├── shared/xterm.ts  — Настройки pty (xterm-256color)
│   └── flowcontrol.ts   — Backpressure контроль
├── client/
│   ├── wetty.ts         — xterm.js клиент
│   └── wetty/           — Download, Mobile, Term, Socket, FlowControl
└── shared/
    ├── config.ts        — JSON5 конфиг
    ├── defaults.ts      — Дефолтные значения
    └── interfaces.ts    — TypeScript типы
```

## Key Facts

- **Текущий Node:** v25.9.0 (LTS для проекта — 22.x)
- **Сборка:** esbuild (одна команда `pnpm build` собирает и сервер, и клиент)
- **Зависимости:** в основном древние — проект в режиме поддержки
- **Клиент:** xterm.js через WebSocket + Socket.IO
- **Сервер:** Express + node-pty для эмуляции терминала

## Git Remotes

- `origin` → `github.com/OmSoft-tech/wetty` (наш форк)
- `upstream` → `github.com/butlerx/wetty` (оригинал)

## Правила работы

- Все ответы пользователю — только на русском языке
- Промежуточные рассуждения возможны на английском
- Ничего не менять без явного разрешения пользователя (read-only mode)
- tmux окно называть "wetty-dev"

## Ссылки

- Документация WeTTY: https://github.com/butlerx/wetty/tree/main/docs
- node-pty 1.x: https://www.npmjs.com/package/node-pty
- xterm.js: https://xtermjs.org/

## Миграция запуска (Docker → native)

Команда для запуска вместо Docker:

```bash
cd ~/develop/wetty
node . --base / --port 3001 --host 172.27.0.1 --command /bin/zsh
```

- `--base /` — терминал по корневому URL (без /wetty)
- `--command /bin/zsh` — прямой shell (без SSH), работает благодаря фиксу
  non-root --command
- `--host 172.27.0.1` — слушать на Docker-хосте (для nginx-proxy-manager)

Порядок переключения:

1. Обновить nginx-proxy-manager: proxy_pass → http://172.27.0.1:3001/ (без
   /wetty)
2. Убить процесс WeTTY
3. Запустить снова
4. Остановить Docker-контейнер

Docker-контейнер пока работает — не трогать до переключения. systemd-сервис
пользователь настроит сам.
