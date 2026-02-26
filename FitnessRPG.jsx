import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: "1387706327",
  name: "Артём",
  race: "orc",
  class: "warrior",
  gender: "male",
  level: 23,
  xp: 14820,
  xp_next: 18500,
  current_streak: 12,
  best_streak: 21,
  combo_count: 8,
  achievements: ["squats_500", "pullups_100", "streak_7", "days_30", "level_20"],
  titles: { special: [{ title: "⭐ Ветеран" }], league: [], raid: [] },
  quests_completed_total: 47,
  referrals_count: 2,
  is_premium: false,
};

const MOCK_STATS_TODAY = { Приседания: 80, Подтягивания: 15, Отжимания: 60, Пресс: 120, Выпады: 30, Чтение: 25 };

const MOCK_STATS_WEEK = [
  { day: "Пн", total: 210, sq: 50, pu: 10, ps: 40, ab: 80, lu: 20, rd: 10 },
  { day: "Вт", total: 0, sq: 0, pu: 0, ps: 0, ab: 0, lu: 0, rd: 0 },
  { day: "Ср", total: 330, sq: 80, pu: 15, ps: 60, ab: 120, lu: 30, rd: 25 },
  { day: "Чт", total: 180, sq: 40, pu: 8, ps: 30, ab: 70, lu: 20, rd: 12 },
  { day: "Пт", total: 420, sq: 100, pu: 20, ps: 80, ab: 150, lu: 40, rd: 30 },
  { day: "Сб", total: 290, sq: 70, pu: 12, ps: 55, ab: 100, lu: 25, rd: 28 },
  { day: "Вс", total: 330, sq: 80, pu: 15, ps: 60, ab: 120, lu: 30, rd: 25 },
];

const MOCK_QUESTS = [
  { id: "squats_100", name: "🦵 Сотня приседов", description: "Сделай 100 приседаний за день", difficulty: "hard", xp_reward: 80, progress: 80, required: 100, completed: false },
  { id: "total_200", name: "🔥 Двести", description: "Сделай 200 любых повторений", difficulty: "hard", xp_reward: 80, progress: 200, required: 200, completed: true },
  { id: "variety_3", name: "🎯 Триатлон", description: "Сделай 3 разных упражнения", difficulty: "medium", xp_reward: 50, progress: 3, required: 3, completed: true },
  { id: "read_25", name: "📚 Книжный червь", description: "Прочитай 25 страниц", difficulty: "medium", xp_reward: 50, progress: 25, required: 25, completed: true },
];

const MOCK_LEAGUE = [
  { rank: 1, name: "Максим", race: "elf", level: 31, points: 4820, isMe: false },
  { rank: 2, name: "Артём", race: "orc", level: 23, points: 3210, isMe: true },
  { rank: 3, name: "Дима", race: "dwarf", level: 19, points: 2890, isMe: false },
  { rank: 4, name: "Саша", race: "human", level: 17, points: 2100, isMe: false },
  { rank: 5, name: "Кирилл", race: "tauren", level: 15, points: 1750, isMe: false },
  { rank: 6, name: "Иван", race: "undead", level: 12, points: 1200, isMe: false },
];

const MOCK_RAID = {
  boss_name: "Смертокрыл",
  boss_emoji: "🐉",
  current_hp: 42000,
  max_hp: 120000,
  end_date: "2026-03-05",
  participants: [
    { name: "Максим", damage: 18400, isMe: false },
    { name: "Артём", damage: 12800, isMe: true },
    { name: "Дима", damage: 9200, isMe: false },
    { name: "Саша", damage: 1600, isMe: false },
  ],
};

const MOCK_ACHIEVEMENTS = [
  { id: "squats_500", name: "🦵 Крепкие ноги", description: "500 приседаний суммарно", icon: "🥈", xp_reward: 150, earned: true },
  { id: "pullups_100", name: "💪 Стальные руки", description: "100 подтягиваний", icon: "🥈", xp_reward: 150, earned: true },
  { id: "streak_7", name: "🔥 Неделя огня", description: "7 дней подряд", icon: "🔥", xp_reward: 200, earned: true },
  { id: "days_30", name: "📅 Месяц дисциплины", description: "30 дней тренировок", icon: "⭐", xp_reward: 500, earned: true },
  { id: "level_20", name: "🎮 Уровень 20", description: "Достигни 20 уровня", icon: "⭐", xp_reward: 250, earned: true },
  { id: "squats_1000", name: "🦵 Стальные ноги", description: "1000 приседаний", icon: "🥇", xp_reward: 300, earned: false },
  { id: "streak_14", name: "🔥 Двухнедельный марафон", description: "14 дней подряд", icon: "💥", xp_reward: 500, earned: false },
  { id: "combo_5", name: "🎯 Комбо-боец", description: "5 дней с полным комбо", icon: "🎯", xp_reward: 150, earned: false },
];

const STORY_CHAPTERS = [
  { id: 1, name: "Пробуждение героя", completed: true, quests_done: 4, quests_total: 4, emoji: "🌅" },
  { id: 2, name: "Тени леса", completed: true, quests_done: 5, quests_total: 5, emoji: "🌲" },
  { id: 3, name: "Огонь и сталь", completed: false, quests_done: 2, quests_total: 6, emoji: "⚔️", active: true },
  { id: 4, name: "Тени во дворце", completed: false, quests_done: 0, quests_total: 5, emoji: "🏰", locked: true },
  { id: 5, name: "Земля мёртвых", completed: false, quests_done: 0, quests_total: 6, emoji: "💀", locked: true },
  { id: 6, name: "Секреты древних", completed: false, quests_done: 0, quests_total: 5, emoji: "🏚️", locked: true },
  { id: 7, name: "Конец тьмы", completed: false, quests_done: 0, quests_total: 7, emoji: "👑", locked: true },
];

const RACES = {
  human: { name: "Человек", emoji: "👨", color: "#c4a265" },
  orc: { name: "Орк", emoji: "👹", color: "#4caf50" },
  elf: { name: "Эльф", emoji: "🧝", color: "#81d4fa" },
  dwarf: { name: "Гном", emoji: "🧔", color: "#ff8a65" },
  undead: { name: "Нежить", emoji: "💀", color: "#9c27b0" },
  tauren: { name: "Таурен", emoji: "🐂", color: "#a1887f" },
};

const CLASSES = {
  warrior: { name: "Воин", emoji: "⚔️" },
  mage: { name: "Маг", emoji: "🔮" },
  rogue: { name: "Разбойник", emoji: "🗡️" },
  paladin: { name: "Паладин", emoji: "🛡️" },
};

const DIFF_COLORS = { easy: "#4caf50", medium: "#ff9800", hard: "#f44336", legendary: "#9c27b0" };
const DIFF_LABELS = { easy: "Лёгкий", medium: "Средний", hard: "Сложный", legendary: "Легендарный" };

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    trophy: "M8 21h8m-4-4v4m0-4a7 7 0 004.95-11.95L16 5H8l-.95.05A7 7 0 0012 17z",
    scroll: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    sword: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    fire: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    check: "M5 13l4 4L19 7",
    plus: "M12 4v16m8-8H4",
    flame: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 5.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-9V7l5 5-5 5v-4H7v-2h4z",
  };
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      {(icons[name] || "").split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
    </svg>
  );
};

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────
const XPBar = ({ current, max, level }) => {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#8899aa" }}>
        <span>Уровень {level}</span>
        <span>{current.toLocaleString()} / {max.toLocaleString()} XP</span>
      </div>
      <div style={{ height: 8, background: "#1a2030", borderRadius: 4, overflow: "hidden", border: "1px solid #243050" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #c9a227, #f4d03f)",
          borderRadius: 4,
          boxShadow: "0 0 8px rgba(201,162,39,0.6)",
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  );
};

const HpBar = ({ current, max, color = "#e53935" }) => {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div style={{ height: 14, background: "#1a2030", borderRadius: 7, overflow: "hidden", border: "1px solid #243050", position: "relative" }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        borderRadius: 7,
        transition: "width 1s ease",
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
        {current.toLocaleString()} / {max.toLocaleString()}
      </div>
    </div>
  );
};

const Card = ({ children, style = {}, glow }) => (
  <div style={{
    background: "linear-gradient(135deg, #111827 0%, #0d1520 100%)",
    border: `1px solid ${glow ? "#c9a22755" : "#1e2d45"}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: glow ? "0 0 20px rgba(201,162,39,0.15)" : "0 2px 8px rgba(0,0,0,0.4)",
    ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ label, color = "#c9a227" }) => (
  <span style={{
    background: `${color}22`,
    border: `1px solid ${color}55`,
    color,
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  }}>{label}</span>
);

const StatBox = ({ label, value, icon, color = "#c9a227" }) => (
  <div style={{
    background: "#0d1520",
    border: "1px solid #1e2d45",
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }}>
    <div style={{ color: "#556677", fontSize: 12, letterSpacing: 0.5 }}>{icon} {label}</div>
    <div style={{ color, fontSize: 22, fontWeight: 800, fontFamily: "'Cinzel', serif" }}>{value}</div>
  </div>
);

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home", label: "Главная", icon: "home" },
  { id: "train", label: "Тренировка", icon: "sword" },
  { id: "quests", label: "Квесты", icon: "scroll" },
  { id: "league", label: "Лига", icon: "trophy" },
  { id: "story", label: "Сюжет", icon: "book" },
  { id: "profile", label: "Профиль", icon: "user" },
];

// ─── PAGES ───────────────────────────────────────────────────────────────────

// HOME PAGE
const HomePage = ({ user, onNavigate }) => {
  const race = RACES[user.race];
  const cls = CLASSES[user.class];
  const todayTotal = Object.values(MOCK_STATS_TODAY).reduce((a, b) => a + b, 0);
  const questsDone = MOCK_QUESTS.filter(q => q.completed).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero Card */}
      <Card glow style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at top right, ${race.color}15 0%, transparent 60%)`,
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: `linear-gradient(135deg, ${race.color}33, ${race.color}11)`,
            border: `2px solid ${race.color}66`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
          }}>{race.emoji}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>{user.name}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <Badge label={`${cls.emoji} ${cls.name}`} color="#81d4fa" />
              <Badge label={`${race.emoji} ${race.name}`} color={race.color} />
              {user.titles.special[0] && <Badge label={user.titles.special[0].title} color="#9c27b0" />}
            </div>
          </div>
        </div>
        <XPBar current={user.xp} max={user.xp_next} level={user.level} />
      </Card>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <StatBox label="Серия" value={`${user.current_streak}🔥`} icon="🗓️" />
        <StatBox label="Повторений" value={todayTotal} icon="💪" color="#4caf50" />
        <StatBox label="Квестов" value={`${questsDone}/${MOCK_QUESTS.length}`} icon="📜" color="#ff9800" />
      </div>

      {/* Today exercises */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#8899aa", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Сегодня</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(MOCK_STATS_TODAY).map(([ex, val]) => {
            const maxes = { Приседания: 200, Подтягивания: 50, Отжимания: 150, Пресс: 300, Выпады: 100, Чтение: 50 };
            const pct = Math.min(100, (val / maxes[ex]) * 100);
            const colors = { Приседания: "#c9a227", Подтягивания: "#4caf50", Отжимания: "#81d4fa", Пресс: "#f44336", Выпады: "#ff9800", Чтение: "#9c27b0" };
            return (
              <div key={ex}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: "#ccd0d8" }}>{ex}</span>
                  <span style={{ color: colors[ex], fontWeight: 700 }}>{val}</span>
                </div>
                <div style={{ height: 5, background: "#1a2030", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[ex], borderRadius: 3, transition: "width 1s ease", opacity: 0.85 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "🏋️ Тренироваться", page: "train", color: "#c9a227" },
          { label: "📜 Квесты", page: "quests", color: "#ff9800" },
          { label: "🏆 Лига", page: "league", color: "#4caf50" },
          { label: "📖 Сюжет", page: "story", color: "#81d4fa" },
        ].map(b => (
          <button key={b.page} onClick={() => onNavigate(b.page)} style={{
            background: `linear-gradient(135deg, ${b.color}22, ${b.color}11)`,
            border: `1px solid ${b.color}44`,
            borderRadius: 10, padding: "14px 10px",
            color: b.color, fontSize: 14, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, ${b.color}33, ${b.color}22)`}
            onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, ${b.color}22, ${b.color}11)`}
          >{b.label}</button>
        ))}
      </div>

      {/* Raid teaser */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e53935" }}>🐉 Мировой рейд</div>
          <Badge label="Активен" color="#e53935" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{MOCK_RAID.boss_name}</div>
        <HpBar current={MOCK_RAID.current_hp} max={MOCK_RAID.max_hp} color="#e53935" />
        <div style={{ fontSize: 12, color: "#556677", marginTop: 8 }}>До: {MOCK_RAID.end_date} · Участников: {MOCK_RAID.participants.length}</div>
      </Card>
    </div>
  );
};

// TRAIN PAGE
const TrainPage = () => {
  const [exercise, setExercise] = useState("Приседания");
  const [count, setCount] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const exercises = ["Приседания", "Подтягивания", "Отжимания", "Пресс", "Выпады", "Чтение"];
  const colors = { Приседания: "#c9a227", Подтягивания: "#4caf50", Отжимания: "#81d4fa", Пресс: "#f44336", Выпады: "#ff9800", Чтение: "#9c27b0" };
  const emojis = { Приседания: "🦵", Подтягивания: "💪", Отжимания: "✊", Пресс: "🔥", Выпады: "🏃", Чтение: "📚" };
  const xpPer = { Приседания: 2, Подтягивания: 5, Отжимания: 3, Пресс: 1, Выпады: 6, Чтение: 2 };

  const handleSubmit = () => {
    if (!count || parseInt(count) <= 0) return;
    const xp = parseInt(count) * xpPer[exercise];
    setSubmitted({ exercise, count: parseInt(count), xp });
    setCount("");
    setTimeout(() => setSubmitted(null), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>⚔️ Тренировка</div>

      <Card>
        <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Выбери упражнение</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {exercises.map(ex => (
            <button key={ex} onClick={() => setExercise(ex)} style={{
              background: exercise === ex ? `${colors[ex]}33` : "#0d1520",
              border: `1px solid ${exercise === ex ? colors[ex] : "#1e2d45"}`,
              borderRadius: 8, padding: "12px 10px",
              color: exercise === ex ? colors[ex] : "#8899aa",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", textAlign: "left",
            }}>
              {emojis[ex]} {ex}
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{xpPer[ex]} XP / повт.</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          Количество {exercise === "Чтение" ? "страниц" : "повторений"}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="number" value={count}
            onChange={e => setCount(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="0"
            style={{
              flex: 1, background: "#0d1520", border: "1px solid #1e2d45",
              borderRadius: 8, padding: "12px 16px",
              color: "#e8d5a3", fontSize: 20, fontWeight: 700, fontFamily: "'Cinzel', serif",
              outline: "none",
            }}
          />
          <button onClick={handleSubmit} style={{
            background: `linear-gradient(135deg, ${colors[exercise]}, ${colors[exercise]}aa)`,
            border: "none", borderRadius: 8, padding: "12px 20px",
            color: "#000", fontSize: 16, fontWeight: 800,
            cursor: "pointer", transition: "opacity 0.2s",
          }}>+</button>
        </div>
        {count && parseInt(count) > 0 && (
          <div style={{ marginTop: 10, color: "#c9a227", fontSize: 13 }}>
            ✨ +{parseInt(count) * xpPer[exercise]} XP за этот подход
          </div>
        )}
        {/* Quick amounts */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {[5, 10, 15, 20, 30, 50, 100].map(n => (
            <button key={n} onClick={() => setCount(String(n))} style={{
              background: "#0d1520", border: "1px solid #1e2d45",
              borderRadius: 6, padding: "6px 12px",
              color: "#8899aa", fontSize: 13, cursor: "pointer",
            }}>{n}</button>
          ))}
        </div>
      </Card>

      {submitted && (
        <div style={{
          background: "linear-gradient(135deg, #1b5e2033, #1b5e2011)",
          border: "1px solid #4caf5066",
          borderRadius: 12, padding: 16,
          animation: "fadeIn 0.3s ease",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 28 }}>🎉</div>
          <div style={{ color: "#4caf50", fontWeight: 800, fontSize: 16 }}>
            {emojis[submitted.exercise]} {submitted.exercise}: {submitted.count} повторений
          </div>
          <div style={{ color: "#c9a227", marginTop: 4 }}>+{submitted.xp} XP</div>
        </div>
      )}

      {/* Today summary */}
      <Card>
        <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Сегодня</div>
        {Object.entries(MOCK_STATS_TODAY).map(([ex, val]) => (
          <div key={ex} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e2d45" }}>
            <span style={{ color: "#ccd0d8" }}>{emojis[ex]} {ex}</span>
            <span style={{ color: colors[ex], fontWeight: 700 }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800 }}>
          <span style={{ color: "#8899aa" }}>Итого</span>
          <span style={{ color: "#c9a227" }}>{Object.values(MOCK_STATS_TODAY).reduce((a, b) => a + b, 0)}</span>
        </div>
      </Card>
    </div>
  );
};

// QUESTS PAGE
const QuestsPage = () => {
  const done = MOCK_QUESTS.filter(q => q.completed).length;
  const total = MOCK_QUESTS.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>📜 Квесты дня</div>
        <Badge label={`${done}/${total}`} color={done === total ? "#4caf50" : "#ff9800"} />
      </div>

      {done === total && (
        <div style={{
          background: "linear-gradient(135deg, #1b5e2033, #1b5e2011)",
          border: "1px solid #4caf5066",
          borderRadius: 12, padding: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 24 }}>🎉</div>
          <div style={{ color: "#4caf50", fontWeight: 700 }}>Все квесты выполнены! +100 XP бонус</div>
        </div>
      )}

      {MOCK_QUESTS.map(q => (
        <Card key={q.id} style={{ opacity: q.completed ? 0.85 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {q.completed && <span style={{ color: "#4caf50", fontSize: 16 }}>✓</span>}
                <span style={{ fontSize: 15, fontWeight: 700, color: q.completed ? "#4caf50" : "#e8d5a3" }}>{q.name}</span>
              </div>
              <div style={{ fontSize: 13, color: "#8899aa" }}>{q.description}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
              <Badge label={DIFF_LABELS[q.difficulty]} color={DIFF_COLORS[q.difficulty]} />
              <div style={{ color: "#c9a227", fontSize: 13, fontWeight: 700, marginTop: 4 }}>+{q.xp_reward} XP</div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#556677", marginBottom: 4 }}>
              <span>Прогресс</span>
              <span>{Math.min(q.progress, q.required)} / {q.required}</span>
            </div>
            <div style={{ height: 6, background: "#1a2030", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (q.progress / q.required) * 100)}%`,
                background: q.completed ? "#4caf50" : DIFF_COLORS[q.difficulty],
                borderRadius: 3, transition: "width 0.8s ease",
              }} />
            </div>
          </div>
        </Card>
      ))}

      {/* Achievements preview */}
      <div style={{ fontSize: 16, fontWeight: 700, color: "#8899aa", marginTop: 8 }}>🏅 Достижения</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {MOCK_ACHIEVEMENTS.slice(0, 6).map(a => (
          <div key={a.id} style={{
            background: a.earned ? "#0d1520" : "#0a1018",
            border: `1px solid ${a.earned ? "#c9a22744" : "#1e2d4555"}`,
            borderRadius: 10, padding: 12,
            opacity: a.earned ? 1 : 0.5,
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: a.earned ? "#e8d5a3" : "#556677" }}>{a.name}</div>
            <div style={{ fontSize: 11, color: "#556677", marginTop: 2 }}>+{a.xp_reward} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// LEAGUE PAGE
const LeaguePage = () => {
  const [tab, setTab] = useState("league");
  const myRaidDmg = MOCK_RAID.participants.find(p => p.isMe)?.damage || 0;
  const totalDmg = MOCK_RAID.participants.reduce((s, p) => s + p.damage, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>🏆 Соревнования</div>

      <div style={{ display: "flex", gap: 8 }}>
        {[["league", "🏆 Лига"], ["raid", "🐉 Рейд"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
            background: tab === id ? "linear-gradient(135deg, #c9a22733, #c9a22711)" : "#0d1520",
            border: `1px solid ${tab === id ? "#c9a22766" : "#1e2d45"}`,
            color: tab === id ? "#c9a227" : "#8899aa", fontWeight: 700, fontSize: 14,
          }}>{label}</button>
        ))}
      </div>

      {tab === "league" && (
        <>
          <Card>
            <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Текущий сезон</div>
            <div style={{ fontSize: 15, color: "#e8d5a3", fontWeight: 700 }}>Сезон 3 · до 01.03.2026</div>
          </Card>
          {MOCK_LEAGUE.map((p, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={p.name} style={{
                background: p.isMe ? "linear-gradient(135deg, #c9a22722, #c9a22711)" : "#0d1520",
                border: `1px solid ${p.isMe ? "#c9a22755" : "#1e2d45"}`,
                borderRadius: 10, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>{medals[i] || `${i + 1}`}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: p.isMe ? "#c9a227" : "#e8d5a3", fontSize: 15 }}>
                    {p.name} {p.isMe && <span style={{ fontSize: 11, color: "#c9a227" }}>(ты)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#8899aa" }}>{RACES[p.race]?.emoji} {RACES[p.race]?.name} · Ур. {p.level}</div>
                </div>
                <div style={{ color: "#c9a227", fontWeight: 800, fontFamily: "'Cinzel', serif" }}>{p.points.toLocaleString()}</div>
              </div>
            );
          })}
        </>
      )}

      {tab === "raid" && (
        <>
          <Card glow style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>{MOCK_RAID.boss_emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif", marginBottom: 12 }}>{MOCK_RAID.boss_name}</div>
            <HpBar current={MOCK_RAID.current_hp} max={MOCK_RAID.max_hp} color="#e53935" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13, color: "#8899aa" }}>
              <span>{Math.round((MOCK_RAID.current_hp / MOCK_RAID.max_hp) * 100)}% HP осталось</span>
              <span>До: {MOCK_RAID.end_date}</span>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 4 }}>Твой урон</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#e53935", fontFamily: "'Cinzel', serif" }}>{myRaidDmg.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#556677", marginTop: 2 }}>{Math.round((myRaidDmg / totalDmg) * 100)}% от общего урона</div>
          </Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#8899aa", textTransform: "uppercase", letterSpacing: 1 }}>Таблица урона</div>
          {MOCK_RAID.participants.map((p, i) => {
            const pct = Math.round((p.damage / totalDmg) * 100);
            return (
              <div key={p.name} style={{
                background: p.isMe ? "linear-gradient(135deg, #e5393522, #e5393511)" : "#0d1520",
                border: `1px solid ${p.isMe ? "#e5393555" : "#1e2d45"}`,
                borderRadius: 10, padding: "12px 16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: p.isMe ? "#e53935" : "#e8d5a3" }}>
                    {["🥇","🥈","🥉",""][i]} {p.name}
                  </span>
                  <span style={{ color: "#e53935", fontWeight: 800 }}>{p.damage.toLocaleString()}</span>
                </div>
                <div style={{ height: 4, background: "#1a2030", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#e53935", borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// STORY PAGE
const StoryPage = () => {
  const [selected, setSelected] = useState(3);
  const active = STORY_CHAPTERS.find(c => c.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>📖 Сюжет</div>
      <div style={{ fontSize: 13, color: "#8899aa" }}>
        Глав завершено: {STORY_CHAPTERS.filter(c => c.completed).length} / {STORY_CHAPTERS.length}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STORY_CHAPTERS.map(ch => (
          <button key={ch.id} onClick={() => !ch.locked && setSelected(ch.id)} style={{
            background: selected === ch.id ? "linear-gradient(135deg, #81d4fa22, #81d4fa11)"
              : ch.completed ? "#0d1520" : ch.locked ? "#090e16" : "#0d1520",
            border: `1px solid ${selected === ch.id ? "#81d4fa55"
              : ch.completed ? "#4caf5033" : ch.locked ? "#1a2030" : "#c9a22755"}`,
            borderRadius: 10, padding: "14px 16px", cursor: ch.locked ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            opacity: ch.locked ? 0.5 : 1, transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24 }}>{ch.locked ? "🔒" : ch.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: ch.completed ? "#4caf50" : selected === ch.id ? "#81d4fa" : "#e8d5a3", fontSize: 14 }}>
                Глава {ch.id}: {ch.name}
              </div>
              <div style={{ fontSize: 12, color: "#8899aa", marginTop: 2 }}>
                {ch.locked ? "Заблокировано" : `${ch.quests_done}/${ch.quests_total} квестов`}
              </div>
            </div>
            {ch.completed && <span style={{ color: "#4caf50", fontSize: 18 }}>✓</span>}
            {ch.active && <Badge label="Активна" color="#c9a227" />}
          </button>
        ))}
      </div>

      {active && !active.locked && (
        <Card glow>
          <div style={{ fontSize: 20 }}>{active.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif", marginTop: 8 }}>
            Глава {active.id}: {active.name}
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8899aa", marginBottom: 4 }}>
              <span>Квесты</span><span>{active.quests_done}/{active.quests_total}</span>
            </div>
            <div style={{ height: 8, background: "#1a2030", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(active.quests_done / active.quests_total) * 100}%`,
                background: "linear-gradient(90deg, #81d4fa, #4fc3f7)",
                borderRadius: 4,
              }} />
            </div>
          </div>
          {active.completed ? (
            <div style={{ marginTop: 12, color: "#4caf50", fontWeight: 700 }}>✓ Глава завершена</div>
          ) : active.locked ? null : (
            <button style={{
              marginTop: 14, width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #c9a227, #f4d03f)",
              border: "none", borderRadius: 8,
              color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer",
            }}>
              {active.quests_done === 0 ? "Начать главу" : "Продолжить"}
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

// PROFILE PAGE
const ProfilePage = ({ user }) => {
  const race = RACES[user.race];
  const cls = CLASSES[user.class];
  const [totals] = useState({ Приседания: 1240, Подтягивания: 180, Отжимания: 890, Пресс: 2100, Выпады: 340, Чтение: 85 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>👤 Профиль</div>

      <Card glow style={{ textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: 16, margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${race.color}44, ${race.color}22)`,
          border: `2px solid ${race.color}88`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
        }}>{race.emoji}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#e8d5a3", fontFamily: "'Cinzel', serif" }}>{user.name}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <Badge label={`${cls.emoji} ${cls.name}`} color="#81d4fa" />
          <Badge label={`${race.emoji} ${race.name}`} color={race.color} />
        </div>
        <div style={{ marginTop: 16 }}>
          <XPBar current={user.xp} max={user.xp_next} level={user.level} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatBox label="Уровень" value={user.level} icon="🎮" />
        <StatBox label="Серия" value={`${user.current_streak}🔥`} icon="🗓️" />
        <StatBox label="Рекорд серии" value={user.best_streak} icon="🏆" color="#4caf50" />
        <StatBox label="Квестов" value={user.quests_completed_total} icon="📜" color="#ff9800" />
      </div>

      <Card>
        <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Всего повторений</div>
        {Object.entries(totals).map(([ex, val]) => (
          <div key={ex} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
            <span style={{ color: "#ccd0d8" }}>{ex}</span>
            <span style={{ color: "#c9a227", fontWeight: 700 }}>{val.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800 }}>
          <span style={{ color: "#8899aa" }}>Итого</span>
          <span style={{ color: "#c9a227", fontFamily: "'Cinzel', serif" }}>{Object.values(totals).reduce((a, b) => a + b, 0).toLocaleString()}</span>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Достижения ({user.achievements.length})</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {MOCK_ACHIEVEMENTS.map(a => (
            <div key={a.id} title={a.name} style={{
              width: "100%", aspectRatio: "1", borderRadius: 8,
              background: a.earned ? "#0d1520" : "#090e16",
              border: `1px solid ${a.earned ? "#c9a22744" : "#1a2030"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, opacity: a.earned ? 1 : 0.3, cursor: "pointer",
            }} title={a.name}>{a.icon}</div>
          ))}
        </div>
      </Card>

      {user.titles.special.length > 0 && (
        <Card>
          <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Титулы</div>
          {user.titles.special.map((t, i) => (
            <Badge key={i} label={t.title} color="#9c27b0" />
          ))}
        </Card>
      )}
    </div>
  );
};

// ─── WEEK BAR CHART ───────────────────────────────────────────────────────────
const WeekChart = () => {
  const max = Math.max(...MOCK_STATS_WEEK.map(d => d.total));
  return (
    <Card>
      <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>📊 Неделя</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
        {MOCK_STATS_WEEK.map(d => {
          const h = max > 0 ? (d.total / max) * 80 : 0;
          const isToday = d.day === "Вс";
          return (
            <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", height: h, borderRadius: "4px 4px 0 0",
                background: isToday ? "linear-gradient(180deg, #c9a227, #f4d03f55)"
                  : d.total === 0 ? "#1a2030" : "linear-gradient(180deg, #4caf5088, #4caf5033)",
                border: isToday ? "1px solid #c9a22766" : "1px solid transparent",
                minHeight: d.total > 0 ? 4 : 0,
                transition: "height 0.8s ease",
              }} />
              <div style={{ fontSize: 10, color: isToday ? "#c9a227" : "#556677" }}>{d.day}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user] = useState(MOCK_USER);

  const pages = { home: HomePage, train: TrainPage, quests: QuestsPage, league: LeaguePage, story: StoryPage, profile: ProfilePage };
  const PageComponent = pages[page];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #070d18 0%, #0a1220 100%)",
      fontFamily: "'Crimson Text', Georgia, serif",
      color: "#e8d5a3",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a1220; } ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 2px; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(180deg, #070d18 80%, transparent)",
        padding: "16px 16px 8px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 900, letterSpacing: 2, color: "#c9a227" }}>
          ⚔ FITNESS RPG
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#8899aa" }}>Ур. {user.level}</div>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${RACES[user.race].color}33, ${RACES[user.race].color}11)`,
            border: `1px solid ${RACES[user.race].color}66`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>{RACES[user.race].emoji}</div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, padding: "0 12px 100px", overflowY: "auto" }}>
        {page === "home" && <WeekChart />}
        <div style={{ marginTop: 12 }}>
          <PageComponent user={user} onNavigate={setPage} />
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "linear-gradient(0deg, #070d18 70%, transparent)",
        padding: "8px 8px 16px",
        display: "flex", justifyContent: "space-around",
        backdropFilter: "blur(10px)",
        zIndex: 100,
      }}>
        {NAV_ITEMS.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#c9a227" : "#445566",
              padding: "6px 10px", borderRadius: 8,
              transition: "color 0.2s",
              position: "relative",
            }}>
              {active && <div style={{
                position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)",
                width: 24, height: 2, background: "#c9a227", borderRadius: 1,
                boxShadow: "0 0 6px #c9a227",
              }} />}
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
