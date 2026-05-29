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

### Port: 3000 (как в upstream)

- Дефолтный порт — 3000, расхождений с upstream нет
- В контейнере передаётся `--port 3000` для совместимости с nginx-proxy-manager

### node-pty upgrade 0.10 → 1.1.0

- `package.json` — `^0.10.0` → `^1.1.0`
- Причина: node-pty 0.10 использует `nan` (устаревший C++ API), который
  несовместим с Node.js 25
- node-pty 1.1.0 использует `node-addon-api` (N-API) — совместим со всеми
  современными Node
- API обратно совместим: `IPtyForkOptions`, `pty.spawn()` — без изменений

### GC-метрики: нативный PerformanceObserver

- upstream v3.0.0 переписал `src/server/metrics.ts` на `node:perf_hooks` вместо
  пакета `gc-stats` — больше не требует нативного аддона
- `observeGC()` вызывается из `src/server.ts`

### PWA Support

- `src/assets/manifest.json` — standalone режим, иконка, theme-color
- `src/assets/sw.js` — service worker с network-first кешированием
- `src/assets/wetty.svg` — SVG-иконка терминала
- `src/server/socketServer/html.ts` — `<link rel="manifest">` и
  `<meta name="theme-color">`
- `src/client/wetty.ts` — регистрация service worker
- `Cache-Control: no-cache` на `sw.js` и `manifest.json`

### sshpass: безопасная передача пароля

- `src/server/command/ssh.ts` — `sshpass -e` вместо `sshpass -p` (пароль через
  `SSHPASS` env)
- `src/server/command/ssh.spec.ts` — тесты

### Build fixes

- `build.js` — `await esbuild.build()` (гонка с tsc)
- `build.js` — `npx tsc` вместо `pnpm tsc`
- `.dockerignore` — `*.tsbuildinfo`

### Docker

- `containers/wetty/Dockerfile` — `node:22-alpine`, `ENTRYPOINT`, без gc-stats
- Контейнер `wetty` в сети `npm_default`, порт 3000, base `/wetty`
- Проксируется через nginx-proxy-manager на хосте

### PR'ы в upstream

- [#601](https://github.com/butlerx/wetty/pull/601) — PWA support (approved)

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
