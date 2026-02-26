"""
web_api.py — REST API для веб-приложения.

Подключение в main.py:
  from web_api import setup_web_routes
  ...
  # В функции main(), там где создаётся app:
  app = web.Application()
  setup_web_routes(app)
  runner = web.AppRunner(app)

Все эндпоинты доступны по /api/...
Авторизация: ?user_id=TELEGRAM_ID
"""

import json
import os
from datetime import date, datetime, timedelta
from aiohttp import web

# ── импортируем то, что уже есть в main.py ──────────────────────────────────
# Эти функции и переменные уже определены в main.py, поэтому здесь только
# обёртки. Файл предполагает, что setup_web_routes вызывается из main.py,
# где все нужные имена уже в области видимости.

# ────────────────────────────────────────────────────────────────────────────
# CORS middleware — разрешаем запросы с любого origin (для локальной разработки)
# ────────────────────────────────────────────────────────────────────────────
async def cors_middleware(app, handler):
    async def middleware(request):
        if request.method == "OPTIONS":
            return web.Response(headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            })
        response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
    return middleware


# ────────────────────────────────────────────────────────────────────────────
# HELPERS
# ────────────────────────────────────────────────────────────────────────────
def _json(data, status=200):
    return web.Response(
        text=json.dumps(data, ensure_ascii=False),
        content_type="application/json",
        status=status,
    )


def _error(msg, status=400):
    return _json({"error": msg}, status)


def _get_user_id(request):
    """Достать user_id из query-параметров."""
    uid = request.rel_url.query.get("user_id", "").strip()
    if not uid:
        return None, _error("user_id required", 400)
    return uid, None


# ────────────────────────────────────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────────────────────────────────────

# GET /api/user?user_id=XXX
async def api_get_user(request):
    """Профиль персонажа + базовая статистика."""
    uid, err = _get_user_id(request)
    if err:
        return err

    from main import load_data, LEVELS, RACES, CLASSES, get_xp_for_next_level
    data = load_data()

    char = data["characters"].get(uid)
    if not char:
        return _error("Character not found", 404)

    user_stats = data["stats"].get(uid, {})
    today = str(date.today())

    # Суммарные повторения
    totals = {}
    for day_stats in user_stats.values():
        for ex, val in day_stats.items():
            totals[ex] = totals.get(ex, 0) + val

    # Подготавливаем ответ — только то, что нужно фронту
    return _json({
        "user_id": uid,
        "name": char.get("name"),
        "race": char.get("race"),
        "class": char.get("class"),
        "gender": char.get("gender"),
        "level": char.get("level", 1),
        "xp": char.get("xp", 0),
        "xp_next_level": get_xp_for_next_level(char.get("level", 1)),
        "current_streak": char.get("current_streak", 0),
        "best_streak": char.get("best_streak", 0),
        "combo_count": char.get("combo_count", 0),
        "quests_completed_total": char.get("quests_completed_total", 0),
        "achievements": char.get("achievements", []),
        "titles": {
            "league": char.get("league_titles", []),
            "raid": char.get("raid_titles", []),
            "special": char.get("special_titles", []),
        },
        "is_premium": char.get("is_premium", False),
        "referrals_count": char.get("referrals_count", 0),
        "totals": totals,
        "days_trained": len(user_stats),
        "today_trained": today in user_stats,
    })


# GET /api/stats/today?user_id=XXX
async def api_stats_today(request):
    """Статистика за сегодня."""
    uid, err = _get_user_id(request)
    if err:
        return err

    from main import load_data
    data = load_data()
    today = str(date.today())
    stats = data["stats"].get(uid, {}).get(today, {})

    exercises = ["Приседания", "Подтягивания", "Отжимания", "Пресс", "Выпады", "Чтение"]
    return _json({
        "date": today,
        "stats": {ex: stats.get(ex, 0) for ex in exercises},
        "total": sum(stats.get(ex, 0) for ex in exercises),
    })


# GET /api/stats/week?user_id=XXX
async def api_stats_week(request):
    """Статистика за последние 7 дней."""
    uid, err = _get_user_id(request)
    if err:
        return err

    from main import load_data
    data = load_data()
    user_stats = data["stats"].get(uid, {})
    exercises = ["Приседания", "Подтягивания", "Отжимания", "Пресс", "Выпады", "Чтение"]
    days = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        d_str = str(d)
        day_data = user_stats.get(d_str, {})
        days.append({
            "date": d_str,
            "day": ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][d.weekday()],
            "stats": {ex: day_data.get(ex, 0) for ex in exercises},
            "total": sum(day_data.get(ex, 0) for ex in exercises),
        })

    return _json({"week": days})


# GET /api/quests?user_id=XXX
async def api_get_quests(request):
    """Ежедневные квесты пользователя."""
    uid, err = _get_user_id(request)
    if err:
        return err

    from main import load_data, generate_daily_quests, DAILY_QUESTS
    data = load_data()
    char = data["characters"].get(uid)
    if not char:
        return _error("Character not found", 404)

    today = str(date.today())

    # Генерируем квесты если их нет или они устарели
    if char.get("quests_date") != today or not char.get("daily_quests"):
        generate_daily_quests(uid)
        data = load_data()
        char = data["characters"][uid]

    quests_ids = char.get("daily_quests", [])
    completed_ids = char.get("completed_quests_today", [])
    user_stats = data["stats"].get(uid, {}).get(today, {})

    result = []
    for qid in quests_ids:
        q = DAILY_QUESTS.get(qid, {})
        if not q:
            continue

        # Простой расчёт прогресса для отображения
        progress = 0
        required = 1
        cond = q.get("condition", {})
        if q["type"] == "exercise_count":
            ex = cond.get("exercise", "")
            required = cond.get("count", 1)
            progress = user_stats.get(ex, 0)
        elif q["type"] == "total_count":
            required = cond.get("count", 1)
            progress = sum(user_stats.values())
        elif q["type"] == "different_exercises":
            required = cond.get("count", 1)
            progress = len([v for v in user_stats.values() if v > 0])

        result.append({
            "id": qid,
            "name": q.get("name"),
            "description": q.get("description"),
            "difficulty": q.get("difficulty"),
            "xp_reward": q.get("xp_reward"),
            "progress": min(progress, required),
            "required": required,
            "completed": qid in completed_ids,
        })

    bonus_xp = char.get("quests_bonus_earned_today", False)
    return _json({
        "quests": result,
        "all_completed": len(completed_ids) >= len(quests_ids) and len(quests_ids) > 0,
        "bonus_xp_earned": bonus_xp,
        "date": today,
    })


# POST /api/train — добавить тренировку
# Body: {"user_id": "XXX", "exercise": "Приседания", "count": 30}
async def api_add_training(request):
    """Добавить упражнение (без видео-модерации, напрямую)."""
    try:
        body = await request.json()
    except Exception:
        return _error("Invalid JSON")

    uid = str(body.get("user_id", "")).strip()
    exercise = body.get("exercise", "").strip()
    count = body.get("count", 0)

    if not uid:
        return _error("user_id required")
    if not exercise:
        return _error("exercise required")
    try:
        count = int(count)
    except (TypeError, ValueError):
        return _error("count must be integer")
    if count <= 0 or count > 10000:
        return _error("count must be 1–10000")

    valid_exercises = ["Приседания", "Подтягивания", "Отжимания", "Пресс", "Выпады", "Чтение"]
    if exercise not in valid_exercises:
        return _error(f"exercise must be one of: {', '.join(valid_exercises)}")

    from main import load_data, get_character, add_exercise_to_stats
    if not get_character(uid):
        return _error("Character not found", 404)

    try:
        xp, level_up, new_achievements, completed_quests, story_quest, raid_result = \
            add_exercise_to_stats(uid, exercise, count)
    except Exception as e:
        return _error(f"Server error: {str(e)}", 500)

    # Перечитываем свежие данные персонажа
    data = load_data()
    char = data["characters"].get(uid, {})

    return _json({
        "success": True,
        "xp_gained": xp,
        "level_up": level_up,
        "new_achievements": new_achievements,
        "completed_quests": completed_quests or [],
        "new_level": char.get("level", 1),
        "new_xp": char.get("xp", 0),
        "current_streak": char.get("current_streak", 0),
    })


# GET /api/league
async def api_league(request):
    """Таблица лиги + информация о сезоне."""
    from main import load_data
    from league import get_leaderboard, get_season_info

    try:
        leaderboard = get_leaderboard()
        season = get_season_info()
    except Exception as e:
        return _error(f"League error: {str(e)}", 500)

    uid = request.rel_url.query.get("user_id", "")
    data = load_data()

    players = []
    for i, entry in enumerate(leaderboard[:20]):
        player_uid = str(entry.get("user_id", entry.get("id", "")))
        char = data["characters"].get(player_uid, {})
        players.append({
            "rank": i + 1,
            "user_id": player_uid,
            "name": entry.get("name", "???"),
            "points": entry.get("points", 0),
            "level": char.get("level", 1),
            "race": char.get("race", "human"),
            "is_me": player_uid == uid,
        })

    return _json({
        "players": players,
        "season": season,
    })


# GET /api/raid
async def api_raid(request):
    """Информация о рейде."""
    from raid import get_raid_info, get_raid_leaderboard

    try:
        raid = get_raid_info()
        leaderboard = get_raid_leaderboard()
    except Exception as e:
        return _error(f"Raid error: {str(e)}", 500)

    uid = request.rel_url.query.get("user_id", "")

    participants = []
    for i, entry in enumerate(leaderboard[:10]):
        player_uid = str(entry.get("user_id", ""))
        participants.append({
            "rank": i + 1,
            "user_id": player_uid,
            "name": entry.get("name", "???"),
            "damage": entry.get("damage", 0),
            "is_me": player_uid == uid,
        })

    return _json({
        "boss_name": raid.get("boss_name", "???"),
        "boss_emoji": raid.get("boss_emoji", "🐉"),
        "current_hp": raid.get("current_hp", 0),
        "max_hp": raid.get("max_hp", 1),
        "is_defeated": raid.get("is_defeated", False),
        "end_date": raid.get("raid_end", ""),
        "participants": participants,
        "my_damage": next((p["damage"] for p in participants if p["is_me"]), 0),
    })


# GET /api/story?user_id=XXX
async def api_story(request):
    """Прогресс сюжета пользователя."""
    uid, err = _get_user_id(request)
    if err:
        return err

    from story import get_user_story, get_story_stats
    from story_data import CHAPTERS

    try:
        story = get_user_story(uid)
        stats = get_story_stats(uid)
    except Exception as e:
        return _error(f"Story error: {str(e)}", 500)

    completed_chapters = story.get("completed_chapters", [])
    current_chapter = story.get("current_chapter")

    chapters = []
    for ch_id, ch in CHAPTERS.items():
        chapters.append({
            "id": ch_id,
            "name": ch.get("name"),
            "emoji": ch.get("emoji", "📖"),
            "completed": ch_id in completed_chapters,
            "active": ch_id == current_chapter,
            "locked": ch_id not in completed_chapters and ch_id != current_chapter,
            "quests_done": len([q for q in story.get("completed_quests", []) if str(q).startswith(str(ch_id))]),
            "quests_total": len(ch.get("quests", [])),
        })

    return _json({
        "chapters": chapters,
        "current_chapter": current_chapter,
        "current_quest": story.get("current_quest"),
        "stats": stats,
    })


# GET /api/achievements?user_id=XXX
async def api_achievements(request):
    """Достижения пользователя."""
    uid, err = _get_user_id(request)
    if err:
        return err

    from main import load_data, ACHIEVEMENTS
    data = load_data()
    char = data["characters"].get(uid)
    if not char:
        return _error("Character not found", 404)

    earned_ids = set(char.get("achievements", []))
    result = []
    for ach_id, ach in ACHIEVEMENTS.items():
        result.append({
            "id": ach_id,
            "name": ach["name"],
            "description": ach["description"],
            "icon": ach.get("icon", "🏅"),
            "xp_reward": ach.get("xp_reward", 0),
            "category": ach.get("category"),
            "earned": ach_id in earned_ids,
        })

    return _json({
        "achievements": result,
        "earned_count": len(earned_ids),
        "total_count": len(result),
    })


# GET /api/health
async def api_health(request):
    from main import load_data
    data = load_data()
    return _json({
        "status": "ok",
        "users": len(data.get("characters", {})),
        "time": datetime.now().isoformat(),
    })


# ────────────────────────────────────────────────────────────────────────────
# SETUP
# ────────────────────────────────────────────────────────────────────────────
def setup_web_routes(app: web.Application):
    """Подключить все API-роуты к aiohttp приложению."""
    app.middlewares.append(cors_middleware)

    app.router.add_get("/api/health",         api_health)
    app.router.add_get("/api/user",            api_get_user)
    app.router.add_get("/api/stats/today",     api_stats_today)
    app.router.add_get("/api/stats/week",      api_stats_week)
    app.router.add_get("/api/quests",          api_get_quests)
    app.router.add_post("/api/train",          api_add_training)
    app.router.add_get("/api/league",          api_league)
    app.router.add_get("/api/raid",            api_raid)
    app.router.add_get("/api/story",           api_story)
    app.router.add_get("/api/achievements",    api_achievements)

    # Статика — отдаём index.html для всех остальных путей
    app.router.add_get("/", serve_index)
    app.router.add_get("/{tail:.*}", serve_index)


async def serve_index(request):
    """Отдаём index.html если он есть рядом."""
    index_path = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return web.Response(text=f.read(), content_type="text/html")
    return web.Response(text="<h1>index.html not found</h1>", content_type="text/html")
