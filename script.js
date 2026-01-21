/* script.js
   LocalStorage-backed replacement for the Canva data/element SDK.
   Drop into the project created earlier.
*/

const STORAGE_KEY = "fitness_data_v1";
const CONFIG_KEY = "fitness_config_v1";

const defaultConfig = {
  dashboard_title: "My Fitness Dashboard",
  subtitle: "Workout • Nutrition • Posture • Sleep",
  motivation_low: "Start strong 💥",
  motivation_medium: "Good going 👍",
  motivation_high: "Excellent discipline 🔥"
};

const workoutPlans = {
  Monday: {
    muscle: "Chest & Triceps",
    exercises: [
      { name: "Bench Press", sets: "4 × 8-10" },
      { name: "Incline Dumbbell Press", sets: "3 × 10" },
      { name: "Cable Flies", sets: "3 × 12" },
      { name: "Tricep Dips", sets: "3 × 10" },
      { name: "Tricep Pushdowns", sets: "3 × 12" }
    ],
    masai: false
  },
  Tuesday: {
    muscle: "Back & Biceps",
    exercises: [
      { name: "Deadlifts", sets: "4 × 6-8" },
      { name: "Pull-ups", sets: "3 × 8" },
      { name: "Bent-over Rows", sets: "3 × 10" },
      { name: "Bicep Curls", sets: "3 × 12" },
      { name: "Hammer Curls", sets: "3 × 12" }
    ],
    masai: false
  },
  Wednesday: {
    muscle: "Legs & Core",
    exercises: [
      { name: "Squats", sets: "4 × 8-10" },
      { name: "Leg Press", sets: "3 × 12" },
      { name: "Lunges", sets: "3 × 10 each" },
      { name: "Leg Curls", sets: "3 × 12" },
      { name: "Vertical Jumps", sets: "3 × 15" },
      { name: "Plank", sets: "3 × 60s" }
    ],
    masai: true
  },
  Thursday: {
    muscle: "Shoulders & Abs",
    exercises: [
      { name: "Military Press", sets: "4 × 8-10" },
      { name: "Lateral Raises", sets: "3 × 12" },
      { name: "Front Raises", sets: "3 × 12" },
      { name: "Face Pulls", sets: "3 × 15" },
      { name: "Cable Crunches", sets: "3 × 15" }
    ],
    masai: false
  },
  Friday: {
    muscle: "Full Body Power",
    exercises: [
      { name: "Power Clean", sets: "4 × 5" },
      { name: "Front Squats", sets: "3 × 8" },
      { name: "Push Press", sets: "3 × 8" },
      { name: "Box Jumps", sets: "4 × 20" },
      { name: "Burpees", sets: "3 × 15" }
    ],
    masai: true
  },
  Saturday: {
    muscle: "Arms & Conditioning",
    exercises: [
      { name: "Close-grip Bench", sets: "3 × 10" },
      { name: "Preacher Curls", sets: "3 × 12" },
      { name: "Overhead Extension", sets: "3 × 12" },
      { name: "Jump Squats", sets: "3 × 20" },
      { name: "Jump Rope", sets: "3 × 2min" }
    ],
    masai: true
  },
  Sunday: {
    muscle: "Active Recovery",
    exercises: [
      { name: "Light Cardio", sets: "20 min" },
      { name: "Stretching", sets: "15 min" },
      { name: "Foam Rolling", sets: "10 min" },
      { name: "Yoga Flow", sets: "15 min" }
    ],
    masai: false
  }
};

const levelThresholds = [0, 50, 120, 200, 300, 420, 560, 720, 900, 1100];
const levelTitles = [
  "Beginner 🌱",
  "Consistent 💪",
  "Focused 🎯",
  "Committed 🔥",
  "Athlete 🏋️",
  "Disciplined 🧠",
  "Relentless ⚡",
  "Elite 🚀",
  "Master 🏆",
  "Legend 👑"
];

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let allData = [];
let todayData = null;
let weekDates = [];
let isLoading = false;
let previousLevel = 1;

/* ---------- LocalStorage helpers ---------- */

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load data:", e);
    return [];
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : defaultConfig;
  } catch (e) {
    return defaultConfig;
  }
}

/* ---------- Date / Week helpers ---------- */

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function getWeekDates() {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

function getWeekRange() {
  const dates = weekDates.map(d => new Date(d));
  const start = dates[0];
  const end = dates[6];

  const startStr = `${start.getDate()} ${start.toLocaleString('en', { month: 'short' })}`;
  const endStr = `${end.getDate()} ${end.toLocaleString('en', { month: 'short' })}`;

  return `${startStr} – ${endStr}`;
}

/* ---------- Data / XP calculations ---------- */

function calculateXPForDay(dayData) {
  const workoutOrPostureDone = dayData.workout_done ||
    (dayData.posture_hanging && dayData.posture_wall &&
      dayData.posture_cobra && dayData.posture_cat_cow &&
      dayData.posture_child);

  const meals = [
    dayData.meal_breakfast,
    dayData.meal_snack,
    dayData.meal_lunch,
    dayData.meal_preworkout,
    dayData.meal_postworkout,
    dayData.meal_dinner,
    dayData.meal_sleep
  ];
  const mealCount = meals.filter(Boolean).length;
  const mealsGood = mealCount >= 4;

  if (workoutOrPostureDone && mealsGood) {
    return 10;
  } else if (workoutOrPostureDone || mealsGood) {
    return 5;
  } else {
    return 0;
  }
}

function calculateTotalXP() {
  let totalXP = 0;
  allData.forEach(day => {
    if (day.xp_earned) totalXP += day.xp_earned;
  });
  return totalXP;
}

function calculateWeeklyXP() {
  const weekSet = new Set(weekDates);
  let weeklyXP = 0;
  for (const dayData of allData) {
    if (dayData.xp_earned && weekSet.has(dayData.date)) {
      weeklyXP += dayData.xp_earned;
    }
  }
  return weeklyXP;
}

function getCurrentLevel(totalXP) {
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= levelThresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

function getNextLevelXP(currentLevel) {
  if (currentLevel >= levelThresholds.length) return levelThresholds[levelThresholds.length - 1];
  return levelThresholds[currentLevel];
}

/* ---------- UI update functions ---------- */

function updateXPDisplay() {
  const totalXP = calculateTotalXP();
  const weeklyXP = calculateWeeklyXP();
  const currentLevel = getCurrentLevel(totalXP);
  const nextLevelXP = getNextLevelXP(currentLevel);

  const levelNumberEl = document.getElementById('level-number');
  levelNumberEl.textContent = currentLevel;

  if (currentLevel > previousLevel) {
    levelNumberEl.classList.add('level-up');
    setTimeout(() => levelNumberEl.classList.remove('level-up'), 600);

    const levelUpMsg = document.getElementById('level-up-message');
    levelUpMsg.textContent = `Level Up! Welcome to Level ${currentLevel} 🎉`;
    levelUpMsg.classList.add('show');
    setTimeout(() => levelUpMsg.classList.remove('show'), 4000);

    previousLevel = currentLevel;
  }

  document.getElementById('level-title').textContent = levelTitles[currentLevel - 1] || levelTitles[levelTitles.length - 1];
  document.getElementById('xp-counter').textContent = `${totalXP} XP`;

  if (currentLevel >= levelTitles.length) {
    document.getElementById('xp-label').textContent = 'Max Level Reached!';
    document.getElementById('xp-progress-fill').style.width = '100%';
  } else {
    const currentLevelXP = levelThresholds[currentLevel - 1];
    const xpIntoLevel = totalXP - currentLevelXP;
    const xpNeededForNext = nextLevelXP - currentLevelXP || 1;
    const progress = Math.max(0, Math.min(100, (xpIntoLevel / xpNeededForNext) * 100));

    document.getElementById('xp-label').textContent = `Next Level: ${nextLevelXP} XP`;
    document.getElementById('xp-progress-fill').style.width = `${progress}%`;
  }

  document.getElementById('weekly-xp').textContent = `+${weeklyXP} XP this week`;
}

function getDayStatus(dateStr) {
  const dayData = allData.find(d => d.date === dateStr);
  if (!dayData) {
    const today = getTodayDate();
    if (dateStr > today) return 'future';
    return 'missed';
  }

  const workoutOrPostureDone = dayData.workout_done ||
    (dayData.posture_hanging && dayData.posture_wall &&
      dayData.posture_cobra && dayData.posture_cat_cow &&
      dayData.posture_child);

  const meals = [
    dayData.meal_breakfast,
    dayData.meal_snack,
    dayData.meal_lunch,
    dayData.meal_preworkout,
    dayData.meal_postworkout,
    dayData.meal_dinner,
    dayData.meal_sleep
  ];
  const mealCount = meals.filter(Boolean).length;
  const mealsGood = mealCount >= 4;

  if (workoutOrPostureDone && mealsGood) return 'full';
  if (workoutOrPostureDone || mealsGood) return 'partial';
  return 'missed';
}

function updateWeeklyCalendar() {
  weekDates = getWeekDates();
  const today = getTodayDate();

  document.getElementById('week-info').textContent = getWeekRange();

  const weekRow = document.getElementById('week-row');
  weekRow.innerHTML = '';

  weekDates.forEach((dateStr, index) => {
    const status = getDayStatus(dateStr);
    const isToday = dateStr === today;

    const dayItem = document.createElement('div');
    dayItem.className = 'day-item';

    const dayLabel = document.createElement('div');
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayLabels[index];

    const dayDot = document.createElement('div');
    dayDot.className = `day-dot ${status}`;
    if (isToday) dayDot.classList.add('today');

    if (status === 'full') {
      dayDot.textContent = '✓';
    } else if (status === 'partial') {
      dayDot.innerHTML = '<div style="width: 50%; height: 100%; border-radius: 50% 0 0 50%; background: rgba(255,255,255,0.4); position: absolute; left: 0;"></div><span style="position: relative; z-index: 1;">~</span>';
    } else if (status === 'missed') {
      dayDot.textContent = '–';
    } else if (status === 'future') {
      dayDot.textContent = '';
    }

    dayItem.appendChild(dayLabel);
    dayItem.appendChild(dayDot);
    weekRow.appendChild(dayItem);
  });
}

function updateWorkoutUI() {
  const day = getDayOfWeek();
  const workout = workoutPlans[day] || workoutPlans.Monday;

  const dayBadge = document.getElementById('day-badge');
  if (dayBadge) dayBadge.textContent = day;

  const muscleGroup = document.getElementById('muscle-group');
  if (muscleGroup) muscleGroup.textContent = workout.muscle;

  const exerciseList = document.getElementById('exercise-list');
  exerciseList.innerHTML = '';
  workout.exercises.forEach(ex => {
    const li = document.createElement('li');
    li.className = 'exercise-item';
    li.innerHTML = `
      <span class="exercise-name">${ex.name}</span>
      <span class="exercise-sets">${ex.sets}</span>
    `;
    exerciseList.appendChild(li);
  });

  const masaiIndicator = document.getElementById('masai-indicator');
  if (workout.masai) {
    masaiIndicator.innerHTML = '<div class="masai-highlight">⚡ Jump Training Today!</div>';
  } else {
    masaiIndicator.innerHTML = '';
  }

  const workoutDone = todayData?.workout_done || false;
  const workoutCard = document.getElementById('workout-card');
  const workoutBtn = document.getElementById('workout-btn');

  if (workoutDone) {
    workoutCard.classList.add('completed');
    workoutBtn.textContent = 'Workout Completed 💪';
    workoutBtn.classList.add('completed');
  } else {
    workoutCard.classList.remove('completed');
    workoutBtn.textContent = 'Mark Workout Done';
    workoutBtn.classList.remove('completed');
  }
}

function updatePostureUI() {
  const exercises = ['hanging', 'wall', 'cobra', 'cat_cow', 'child'];
  let completed = 0;

  exercises.forEach(ex => {
    const id = `posture-${ex.replace('_', '-')}`;
    const element = document.getElementById(id);
    const isDone = todayData?.[`posture_${ex}`] || false;

    if (element) {
      if (isDone) {
        element.classList.add('active');
        completed++;
      } else {
        element.classList.remove('active');
      }
    }
  });

  const percentage = (completed / 5) * 100;
  const progEl = document.getElementById('posture-progress');
  if (progEl) progEl.style.width = `${percentage}%`;
  const textEl = document.getElementById('posture-text');
  if (textEl) textEl.textContent = `${Math.round(percentage)}% Complete`;
}

function updateNutritionUI() {
  const meals = ['breakfast', 'snack', 'lunch', 'preworkout', 'postworkout', 'dinner', 'sleep'];
  let completed = 0;

  meals.forEach(meal => {
    const card = document.getElementById(`meal-${meal}`);
    const isDone = todayData?.[`meal_${meal}`] || false;

    if (card) {
      const button = card.querySelector('.meal-toggle');
      const mealName = card.querySelector('.meal-name') ? card.querySelector('.meal-name').textContent.trim() : 'Meal';

      if (isDone) {
        card.classList.add('completed');
        completed++;
        if (button) {
          button.textContent = 'Undo';
          button.setAttribute('aria-pressed', 'true');
          button.setAttribute('aria-label', `Mark ${mealName} as incomplete`);
        }
      } else {
        card.classList.remove('completed');
        if (button) {
          button.textContent = 'Done';
          button.setAttribute('aria-pressed', 'false');
          button.setAttribute('aria-label', `Mark ${mealName} as complete`);
        }
      }
    }
  });

  const percentage = (completed / 7) * 100;
  const progEl = document.getElementById('nutrition-progress');
  if (progEl) progEl.style.width = `${percentage}%`;
  const textEl = document.getElementById('nutrition-text');
  if (textEl) textEl.textContent = `${Math.round(percentage)}% Complete`;
}

function updateScore() {
  let score = 0;
  if (todayData?.workout_done) score += 40;

  const postureExercises = ['hanging', 'wall', 'cobra', 'cat_cow', 'child'];
  const postureComplete = postureExercises.every(ex => todayData?.[`posture_${ex}`]);
  if (postureComplete) score += 30;

  const meals = ['breakfast', 'snack', 'lunch', 'preworkout', 'postworkout', 'dinner', 'sleep'];
  const mealsComplete = meals.every(meal => todayData?.[`meal_${meal}`]);
  if (mealsComplete) score += 30;

  const scoreEl = document.getElementById('score-number');
  if (scoreEl) scoreEl.textContent = score;

  const config = loadConfig() || defaultConfig;
  let motivation = config.motivation_low || defaultConfig.motivation_low;

  if (score >= 70) motivation = config.motivation_high || defaultConfig.motivation_high;
  else if (score >= 40) motivation = config.motivation_medium || defaultConfig.motivation_medium;

  const motEl = document.getElementById('motivation-text');
  if (motEl) motEl.textContent = motivation;
}

function updateSleepUI() {
  const sleepPlanned = todayData?.sleep_planned || false;
  const sleepCard = document.getElementById('sleep-card');
  const sleepBtn = document.getElementById('sleep-btn');

  if (sleepPlanned) {
    sleepCard.classList.add('sleep-planned');
    sleepBtn.textContent = 'Sleep Planned ✓';
    sleepBtn.classList.add('completed');
  } else {
    sleepCard.classList.remove('sleep-planned');
    sleepBtn.textContent = 'Sleep Planned';
    sleepBtn.classList.remove('completed');
  }
}

function updateAllUI() {
  updateXPDisplay();
  updateWeeklyCalendar();
  updateWorkoutUI();
  updatePostureUI();
  updateNutritionUI();
  updateScore();
  updateSleepUI();
}

/* ---------- CRUD-like helpers (local) ---------- */

function ensureTodayEntry() {
  const today = getTodayDate();
  let entry = allData.find(d => d.date === today);
  if (!entry) {
    entry = {
      date: today,
      workout_done: false,
      posture_hanging: false,
      posture_wall: false,
      posture_cobra: false,
      posture_cat_cow: false,
      posture_child: false,
      meal_breakfast: false,
      meal_snack: false,
      meal_lunch: false,
      meal_preworkout: false,
      meal_postworkout: false,
      meal_dinner: false,
      meal_sleep: false,
      sleep_planned: false,
      xp_earned: 0
    };
    allData.push(entry);
    saveData(allData);
  }
  return entry;
}

/* ---------- Toggle / Interaction functions ---------- */

async function recalculateXP() {
  let changed = false;
  for (const dayData of allData) {
    const calculatedXP = calculateXPForDay(dayData);
    if (dayData.xp_earned !== calculatedXP) {
      dayData.xp_earned = calculatedXP;
      changed = true;
    }
  }
  if (changed) saveData(allData);
  syncToday();
  updateAllUI();
}

function syncToday() {
  const today = getTodayDate();
  todayData = allData.find(d => d.date === today) || null;
}

function toggleWorkout() {
  if (isLoading) return;
  isLoading = true;

  const today = getTodayDate();
  let entry = allData.find(d => d.date === today);
  if (!entry) {
    entry = ensureTodayEntry();
  }

  entry.workout_done = !entry.workout_done;
  entry.xp_earned = calculateXPForDay(entry);

  saveData(allData);
  syncToday();
  recalculateXP();
  isLoading = false;
}

function togglePosture(exerciseField) {
  if (isLoading) return;
  isLoading = true;

  const today = getTodayDate();
  let entry = allData.find(d => d.date === today);
  if (!entry) entry = ensureTodayEntry();

  // exerciseField should be like 'hanging' or 'cat_cow'
  const key = `posture_${exerciseField}`;
  entry[key] = !entry[key];

  entry.xp_earned = calculateXPForDay(entry);

  saveData(allData);
  syncToday();
  recalculateXP();
  isLoading = false;
}

function toggleMeal(meal) {
  if (isLoading) return;
  isLoading = true;

  const today = getTodayDate();
  let entry = allData.find(d => d.date === today);
  if (!entry) entry = ensureTodayEntry();

  const key = `meal_${meal}`;
  entry[key] = !entry[key];

  entry.xp_earned = calculateXPForDay(entry);

  saveData(allData);
  syncToday();
  recalculateXP();
  isLoading = false;
}

function toggleSleep() {
  if (isLoading) return;
  isLoading = true;

  const today = getTodayDate();
  let entry = allData.find(d => d.date === today);
  if (!entry) entry = ensureTodayEntry();

  entry.sleep_planned = !entry.sleep_planned;

  saveData(allData);
  syncToday();
  updateAllUI();
  isLoading = false;
}

function toggleXPTooltip() {
  const tooltip = document.getElementById('xp-tooltip');
  if (tooltip) tooltip.classList.toggle('show');
}

/* ---------- Event wiring ---------- */

function wireEvents() {
  const workoutBtn = document.getElementById('workout-btn');
  if (workoutBtn) workoutBtn.addEventListener('click', toggleWorkout);

  const sleepBtn = document.getElementById('sleep-btn');
  if (sleepBtn) sleepBtn.addEventListener('click', toggleSleep);

  const levelNumber = document.getElementById('level-number');
  if (levelNumber) {
    levelNumber.addEventListener('click', toggleXPTooltip);
    levelNumber.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleXPTooltip();
      }
    });
  }

  ['hanging', 'wall', 'cobra', 'cat-cow', 'child'].forEach(ex => {
    const element = document.getElementById(`posture-${ex}`);
    const field = ex.replace('-', '_');
    if (element) {
      element.addEventListener('click', () => togglePosture(field));
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePosture(field);
        }
      });
    }
  });

  ['breakfast', 'snack', 'lunch', 'preworkout', 'postworkout', 'dinner', 'sleep'].forEach(meal => {
    const card = document.getElementById(`meal-${meal}`);
    if (card) {
      const button = card.querySelector('.meal-toggle');
      if (button) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleMeal(meal);
        });
      }
      // toggle when clicking the card itself (optional)
      card.addEventListener('click', (e) => {
        // ignore clicks coming from the button to avoid double toggles
        if (e.target && e.target.classList.contains('meal-toggle')) return;
        toggleMeal(meal);
      });
    }
  });
}

/* ---------- Init ---------- */

function init() {
  // load existing data
  allData = loadData();
  // ensure week and today
  weekDates = getWeekDates();

  // establish today's data reference
  syncToday();

  // set config values (dashboard title, subtitle)
  const config = loadConfig();
  document.getElementById('dashboard-title').textContent = config.dashboard_title || defaultConfig.dashboard_title;
  document.getElementById('subtitle').textContent = config.subtitle || defaultConfig.subtitle;

  // wire UI events
  wireEvents();

  // compute initial xp/levels
  const totalXP = calculateTotalXP();
  previousLevel = getCurrentLevel(totalXP);

  // final UI update
  updateAllUI();
}

// run
init();
