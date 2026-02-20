# api_server.py
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
import json
import os

# FastAPI приложение
app = FastAPI()

# Путь к файлу данных бота
DATA_FILE = "stats.json"

# Модели для Pydantic
class CharacterData(BaseModel):
    level: int
    xp: int
    xpForNext: int
    streak: int
    name: str

class ExerciseData(BaseModel):
    exercise: str
    count: int
    hasVideo: bool

# === ПОЛУЧЕНИЕ ДАННЫХ ПЕРСОНАЖА ===
@app.get("/api/character", response_model=CharacterData)
async def get_character_data():
    """Получить данные персонажа"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                char = data.get("characters", {}).get("1387706327", {})
                
                if char:
                    xp_for_next = get_xp_for_next_level(char['level'])
                    return CharacterData(
                        level=char['level'],
                        xp=char['xp'],
                        xpForNext=xp_for_next,
                        streak=char.get('current_streak', 0),
                        name=char.get('name', 'Герой')
                    )
        
        # Если нет данных — возвращаем тестовые
        return CharacterData(
            level=1,
            xp=0,
            xpForNext=100,
            streak=0,
            name="Герой"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === ЗАПИСЬ УПРАЖНЕНИЯ ===
@app.post("/api/record_exercise")
async def record_exercise(data: ExerciseData):
    """Записать упражнение"""
    try:
        # Здесь нужно вызвать функцию бота
        # Но так как это отдельный сервер, передадим в очередь
        # Для простоты — сохраним в файл
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                bot_data = json.load(f)
        else:
            bot_data = {"characters": {}, "stats": {}}
        
        user_id = "1387706327"  # Твой ID для теста
        
        # Проверяем статус Атлета
        char = bot_data.get("characters", {}).get(user_id, {})
        if char.get("is_trusted", False) and data.count <= 50:
            # Атлет — засчитываем сразу
            xp, level_up, new_achs, completed_quests, story_quest, raid_result = \
                add_exercise_to_stats(user_id, data.exercise, data.count)
            
            result = {
                "status": "success",
                "xp": xp,
                "levelUp": level_up is not None,
                "newAchievements": new_achs,
                "message": "Упражнение засчитано (Атлет)"
            }
        else:
            # Без видео — нужно подтверждение
            if not data.hasVideo:
                result = {
                    "status": "need_video",
                    "message": "Отправьте видео для подтверждения"
                }
            else:
                # Сохраняем в очередь на модерацию
                pending = load_pending()
                request_id = f"{user_id}_{int(datetime.now().timestamp())}"
                
                pending[request_id] = {
                    "user_id": user_id,
                    "exercise": data.exercise,
                    "count": data.count,
                    "video_file_id": "mock_video_id",  # Заглушка
                    "created_at": str(datetime.now()),
                    "status": "pending"
                }
                save_pending(pending)
                
                result = {
                    "status": "pending",
                    "message": "Упражнение отправлено на проверку"
                }
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
def get_xp_for_next_level(current_level: int) -> int:
    """Получить XP для следующего уровня"""
    # Тестовые данные
    levels = {
        1: 100, 2: 200, 3: 400, 4: 800, 5: 1600,
        6: 3200, 7: 6400, 8: 12800, 9: 25600, 10: 51200
    }
    return levels.get(current_level + 1, 100000)

def load_pending():
    """Загрузить заявки на модерацию"""
    pending_file = "pending.json"
    if os.path.exists(pending_file):
        with open(pending_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_pending(data):
    """Сохранить заявки на модерацию"""
    pending_file = "pending.json"
    with open(pending_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# === ЗАПУСК СЕРВЕРА ===
if __name__ == "__main__":
    import uvicorn
    
    # Добавим пути к модулям бота
    import sys
    sys.path.append(".")  # Добавляем текущую директорию
    
    # Импортируем функции из бота
    from bot51 import (
        add_exercise_to_stats,
        load_pending,
        save_pending,
        load_data,
        get_character,
        get_xp_for_next_level
    )
    
    # === ЗАПУСК СЕРВЕРА ===
    if __name__ == "__main__":
        import uvicorn
        import os
        
        port = int(os.environ.get("PORT", 8000))
        uvicorn.run(app, host="0.0.0.0", port=port) 