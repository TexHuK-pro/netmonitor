# 🌐 Network Monitor

Приложение для мониторинга доступности сетевых адресов (хостов) с графическим интерфейсом.  
Написано на **Go** с использованием фреймворка **Wails** (Go + WebView2).

## ✨ Возможности

- 🔹 Добавление хостов с произвольным названием и адресом (`IP:порт`)
- 🔹 Автоматическая проверка доступности через TCP (каждые 3 секунды)
- 🔹 Визуальная индикация статуса: 🟢 Доступен / 🔴 Недоступен / ⏳ Проверка
- 🔹 Отображение времени отклика в миллисекундах
- 🔹 Сохранение списка хостов в `config.json` (персистентность между запусками)
- 🔹 Авто-обновление интерфейса без перезагрузки страницы
- 🔹 Портативный `.exe` файл — не требует установки Go или Node.js на целевом ПК

---

## 🔄 1. Полный цикл работы (пошагово)

### 🔹 Сценарий 1: Добавление хоста

1. **Пользователь** вводит `Google` и `8.8.8.8:53`, нажимает **"➕ Добавить"**
2. **JavaScript** вызывает: `window.go.main.App.AddHost("Google", "8.8.8.8:53")`
3. **Wails** передаёт вызов в **Go**
4. **Go** (метод `AddHost`):
   - Создаёт `HostEntry{ID: 1, Name: "Google", Addr: "8.8.8.8:53", Status: "checking"}`
   - Добавляет в список `a.hosts`
   - Запускает горутину `go checkHost(1)`
   - Вызывает `SaveConfig()` → записывает в `config.json`
   - Возвращает `id = 1`
5. **JavaScript** очищает поля ввода
6. **JavaScript** вызывает `loadHosts()` → обновляет интерфейс

### 🔹 Сценарий 2: Фоновая проверка (каждые 3 секунды)

1. **Горутина** `checkHost(1)` (работает в фоне):
   - Ждёт 3 секунды (`ticker.C`)
   - Читает адрес `8.8.8.8:53` из `a.hosts`
   - Выполняет `net.DialTimeout("tcp", "8.8.8.8:53", 2*time.Second)`
   - Замеряет время: `elapsed = 45ms`
   - Обновляет: `a.hosts[0].Status = "ok"`, `a.hosts[0].Latency = "45 мс"`

### 🔹 Сценарий 3: Авто-обновление интерфейса (каждые 2 секунды)

1. **JavaScript** (`setInterval`):
   - Вызывает `loadHosts()` каждые 2000 мс
2. **JavaScript** вызывает: `window.go.main.App.GetHosts()`
3. **Go** (метод `GetHosts`):
   - Возвращает `[]HostEntry{ {ID:1, Name:"Google", Status:"ok", Latency:"45 мс"} }`
4. **JavaScript** (`renderHosts`):
   - Создаёт HTML: `<div class="host-status status-ok">45 мс</div>`
   - Вставляет в `hostsList`

### 🔹 Сценарий 4: Удаление хоста

1. **Пользователь** нажимает **"🗑 Удалить"**
2. **JavaScript** вызывает: `window.go.main.App.RemoveHost(1)`
3. **Go** (метод `RemoveHost`):
   - Находит хост с `ID == 1`
   - Удаляет из `a.hosts`
   - Вызывает `SaveConfig()` → обновляет `config.json`
4. **JavaScript** вызывает `loadHosts()` → удаляет строку из интерфейса

### 🔹 Сценарий 5: Перезапуск программы

1. **Пользователь** закрывает программу → открывает снова
2. **Go** (`main` → `NewApp()` → `Startup`):
   - Создаёт пустой `App{}`
   - Вызывает `a.LoadConfig()`
3. **Go** (`LoadConfig`):
   - Читает `config.json`
   - Парсит JSON в `[]ConfigEntry`
   - Создаёт `[]HostEntry` с `Status: "checking"`
   - Запускает `go checkHost(id)` для каждого
4. **JavaScript** (`startAutoUpdate`):
   - Вызывает `loadHosts()` → получает список
   - Отрисовывает строки с серыми ⏳
5. Через 2-3 секунды **горутины** обновляют статусы → **JavaScript** показывает 🟢 или 🔴

## 📊 2. Таблица соответствия JS ↔ Go

| JavaScript (Frontend)                     | Go (Backend)                                         | Описание         |
|-------------------------------------------|------------------------------------------------------|------------------|
| `window.go.main.App.AddHost(name, addr)`  | `func (a *App) AddHost(name, addr string) int`       | Добавить хост    |
| `window.go.main.App.RemoveHost(id)`       | `func (a *App) RemoveHost(id int)`                   | Удалить хост     |
| `window.go.main.App.GetHosts()`           | `func (a *App) GetHosts() []HostEntry`               | Получить список  |
| `setInterval(loadHosts, 2000)`            | `go checkHost(id)` (каждые 3 сек)                    | Авто-обновление  |
| `JSON: {id, name, addr, status, latency}` | `struct HostEntry {ID, Name, Addr, Status, Latency}` | Структура данных |

# Обычная сборка
wails build

# ИЛИ сборка с оптимизацией (меньший размер .exe)
wails build -ldflags="-s -w"