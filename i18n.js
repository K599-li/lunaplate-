const STORAGE_KEY = "lunaPlateLocale";
const SUPPORTED = ["en", "zh", "ru"];

function normalizeLocale(locale) {
  const value = String(locale || "").toLowerCase();
  if (SUPPORTED.includes(value)) return value;
  if (value.startsWith("zh")) return "zh";
  if (value.startsWith("ru")) return "ru";
  if (value.startsWith("en")) return "en";
  return "";
}

const messages = {
  en: {
    meta: { title: "LunaPlate" },
    lang: { en: "EN", zh: "中文", ru: "RU", choose: "Language" },
    brand: { tagline: "Nourish your cycle" },
    aria: {
      bestPick: "Best meal recommendation",
      nutrition: "Nutrition focus",
      mealFilters: "Meal filters",
      mealType: "Meal type",
      nav: "App navigation preview",
      checkIn: "Daily check-in",
      cyclePhase: "Cycle phase",
      cuisineStyle: "Cuisine style",
      reset: "Reset check-in",
      closeProfile: "Close profile",
    },
    nav: { today: "Home", insights: "Insights", health: "Health", meals: "Meals", plan: "Plan", profile: "Profile" },
    screen: {
      foodSubheading: "Today's meal plan for cycle support",
    },
    health: {
      searchPlaceholder: "Search recipes or ingredients...",
      prepTime: "Prep time:",
      coreIngredient: "Core ingredient:",
      ingredientPlaceholder: "Type ingredients to match...",
      recipeTitle: "Cycle-custom recipes",
    },
    status: {
      cyclePhase: "Cycle phase",
      setCycle: "Set your cycle details",
      phaseHint: "Meal ideas will adapt to your estimated phase, symptoms, preferences, and pantry.",
      day: "Day {day}",
      manual: "Manual",
    },
    today: {
      planTitle: "Today's plan",
      viewAll: "View all",
      warmCare: "Warm care",
      warmCareCopy: "Lower-abdomen warmth · 15 min",
      gentleMovement: "Gentle movement",
      gentleMovementCopy: "8 min breathing stretch",
      cycleMeal: "Cycle meal",
      cycleMealCopy: "Warm bowl · protein · hydration",
      nutritionEyebrow: "Daily nutrition overview",
      kcal: "kcal",
      kcalLeft: "650 kcal remaining today",
      protein: "Protein 72g",
      carbs: "Carbs 145g",
      fat: "Fat 52g",
      recipeTitle: "Cycle-custom meal",
      recipeName: "Nourishing oatmeal pancakes",
      recipeMeta: "15 min · steady energy",
    },
    insights: {
      subheading: "Understand your current cycle rhythm",
      currentCycle: "Current cycle: Day {day}",
      cycleTitle: "Cycle insights",
      energyTitle: "Energy and focus",
      energyCopy: "Use today for steady, comfortable tasks and keep meals simple.",
      socialTitle: "Body rhythm",
      socialCopy: "Your current phase can shape appetite, movement tolerance, and rest needs.",
      statusTitle: "Cycle status",
      habitTitle: "Habit consistency",
      habitCopy: "You kept a steady cycle-support routine this week.",
      stabilityTitle: "Cycle stability",
      stabilityValue: "Excellent",
      stabilityCopy: "Your phase transitions look more predictable.",
      movementTitle: "Restorative movement",
      movementValue: "12 h",
      movementCopy: "Low-intensity movement logged during the last month.",
      predictionTitle: "Three-month prediction",
      periodStart: "Period starts",
      ovulation: "Estimated ovulation",
      lifestyleEyebrow: "Nutrition focus",
      lifestyleTitle: "Meals that support hormonal rhythm",
    },
    best: {
      eyebrow: "Best for today",
      chooseCheckIn: "Choose your check-in",
      matchPlaceholder: "Your strongest meal match will appear here.",
      addGroceries: "Add groceries",
      min: "{n} min",
      analyzing: "Analyzing recipes",
      analyzingCopy: "LunaPlate is matching external recipes to your phase, symptoms, pantry, and preferences.",
      apiMatch: "API match",
      noMatch: "No match yet",
      noMatchCopy: "Try raising cook time or loosening one preference.",
      noExternal: "No external recipe",
      apiFailed: "The app is connected to an outside recipe API, but the request failed this time.",
      tryAgain: "Try again",
    },
    focus: {
      comfort: "Comfort",
      comfortCopy: "Warm, steady meals tend to feel better on demanding days.",
      balance: "Balance",
      balanceCopy: "Protein, fiber, and complex carbs help keep energy more even.",
      hydration: "Hydration",
      hydrationCopy: "Hydrating foods and simple drinks can support general comfort.",
    },
    toolbar: {
      all: "All",
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snack: "Snack",
      shuffle: "Shuffle",
    },
    results: {
      matched: "Matched meals",
      ideas: "{n} ideas",
      idea: "{n} idea",
      matchHint: "Add your check-in to improve the ranking.",
      loading: "Loading",
      fetching: "Fetching external recipes...",
      ranked: "Ranked from {details}.",
      symptomSignal: "{n} symptom signal",
      symptomSignals: "{n} symptom signals",
      pantryItem: "{n} pantry item",
      pantryItems: "{n} pantry items",
      apiUnavailable: "External API unavailable.",
    },
    empty: {
      findingTitle: "Finding meals",
      findingCopy: "Pulling recipes from TheMealDB and scoring them against your check-in.",
      apiErrorTitle: "Recipe API did not load",
      apiErrorCopy: "{message}. Check your internet connection or try again.",
      noMatchesTitle: "No API matches yet",
      noMatchesCopy: "Try raising cook time, changing pantry ingredients, or loosening one preference.",
    },
    grocery: {
      plan: "Plan",
      title: "Grocery list",
      clear: "Clear",
      empty: "Add groceries from a meal card.",
      close: "Close cart",
      customPlaceholder: "Add a custom ingredient...",
      addCustom: "Add",
      selected: "Selected",
      generate: "Generate list",
      generatedGroup: "Generated meal list",
      itemCount: "{n} items",
      asNeeded: "as needed",
    },
    safety: {
      eyebrow: "Care note",
      title: "Supportive, not diagnostic",
      body: "LunaPlate gives general wellness ideas. Severe pain, very heavy bleeding, dizziness, missed periods, pregnancy concerns, or a history of disordered eating deserve care from a qualified clinician.",
    },
    form: {
      cycle: "Cycle",
      reset: "Reset",
      lastPeriod: "First day of last period",
      cycleLength: "Average cycle length",
      manualPhase: "Or choose phase manually",
      auto: "Auto",
      howFeel: "How do you feel?",
      preferences: "Preferences",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      glutenFree: "Gluten-free",
      dairyFree: "Dairy-free",
      cuisineStyle: "Cuisine style",
      maxCook: "Max cook time",
      min: "{n} min",
      pantry: "Pantry ingredients",
      pantryPlaceholder: "spinach, rice, yogurt, lentils",
      ingredientsSteps: "Ingredients and steps",
      swap: "Swap",
    },
    cuisineStyles: {
      balanced: "Balanced",
      asian: "Asian",
      mediterranean: "Mediterranean",
      mexican: "Mexican",
    },
    phases: {
      menstrual: {
        title: "Menstrual phase",
        description: "Prioritize comforting meals with iron-rich foods, hydration, and gentle prep.",
        focus: [
          ["Iron support", "Pair iron-rich foods with vitamin C ingredients when you can."],
          ["Warm comfort", "Soups, bowls, and cooked greens can feel easier on low-energy days."],
          ["Hydration", "Water, tea, broths, and juicy produce can support general comfort."],
        ],
      },
      follicular: {
        title: "Follicular phase",
        description: "Lean into bright, energizing meals with protein, fiber, and colorful produce.",
        focus: [
          ["Steady energy", "Protein and complex carbs help meals last longer."],
          ["Fresh crunch", "This phase often pairs well with salads, bowls, and quick plates."],
          ["Prep friendly", "Batchable grains and proteins make the week easier."],
        ],
      },
      ovulation: {
        title: "Ovulation phase",
        description: "Choose balanced meals with antioxidants, healthy fats, and satisfying protein.",
        focus: [
          ["Antioxidants", "Berries, greens, citrus, and colorful vegetables bring useful variety."],
          ["Healthy fats", "Avocado, olive oil, nuts, seeds, and fish can make meals satisfying."],
          ["Balance", "Build plates with protein, produce, fat, and slow carbs."],
        ],
      },
      luteal: {
        title: "Luteal phase",
        description: "Aim for satisfying meals that steady blood sugar and make cravings easier to work with.",
        focus: [
          ["Craving aware", "Sweet or salty can fit better when paired with protein and fiber."],
          ["Magnesium", "Nuts, seeds, legumes, leafy greens, and dark chocolate are useful choices."],
          ["Steady meals", "Regular meals and snacks can help reduce energy dips."],
        ],
      },
    },
    symptoms: {
      cramps: "Cramps",
      fatigue: "Fatigue",
      bloating: "Bloating",
      cravings: "Cravings",
      low_mood: "Low mood",
      high_energy: "High energy",
    },
    tags: {
      iron: "iron",
      magnesium: "magnesium",
      comfort: "comfort",
      hydrating: "hydrating",
      protein: "protein",
      fiber: "fiber",
      fresh: "fresh",
      prep: "prep",
      antioxidants: "antioxidants",
      "healthy fat": "healthy fat",
      "craving-friendly": "craving-friendly",
      calcium: "calcium",
      vegetarian: "vegetarian",
      vegan: "vegan",
      "dairy-free": "dairy-free",
      "gluten-free": "gluten-free",
    },
    mealTypes: {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snack",
    },
    recipe: {
      apiTimeout: "Recipe API request timed out",
      followSource: "Follow the recipe method from the source.",
      summary: "LunaPlate matched this external {category} for {focus}. Recipe names and steps stay in the source language for accuracy.",
      categoryRecipe: "{category} recipe",
      recipe: "recipe",
      todaysPreferences: "today's preferences",
      bestReason: "API recipe ranked for your {phase}{symptoms}, with {tags} support.{pantry}",
      bestSymptoms: " and today's symptoms",
      pantryUses: " It also uses something from your pantry.",
      and: " and ",
    },
    movement: {
      heading: "Movement",
      subheading: "Gentle movement matched to your cycle",
      best: "Best for today",
      defaultTitle: "Cycle-aware gentle movement",
      defaultMeta: "{n} min · matched to your current phase",
      recent: "Recent movement time",
      countdown: "Practice countdown",
      loadingTitle: "Finding gentle movement",
      loadingSummary: "Matching movement guidance to your current cycle phase.",
      loadingStep: "Loading movement guidance...",
      unavailableTitle: "Movement guidance unavailable",
      unavailableStep: "Try refreshing once the local Python server is running.",
      unavailableNote: "Movement recommendations are provided by the Python backend.",
      focusTitle: "Movement focus",
      safetyTitle: "Safety boundary",
      defaultFocus: "Move slowly, breathe steadily, and keep the range comfortable.",
      defaultSafety: "Stop and rest if you feel clear abdominal pain, dizziness, or any sharp pain.",
      stepsEyebrow: "Movement steps",
      stepTitle: "Follow-along guide",
      refresh: "Refresh",
      more: "More recommendations",
      count: "{n} movements",
      note: "Filtered by the Python backend for your cycle phase and symptoms.",
      start: "Start {n} min practice",
      pause: "Pause {time}",
      resume: "Resume {time}",
      practicing: "Practicing {time}",
      completed: "Completed, start again",
      previous: "Previous movement",
      next: "Next movement",
      swipeHint: "Swipe to switch",
      sourceApi: "Female movement API",
      sourceVector: "LunaPlate vector guide",
      guide: {
        catCow: {
          title: "All-fours spine flow",
          breath: "Inhale to open the chest, exhale to gently round the back",
          cues: ["Wrists under shoulders", "Keep the range small", "Move with breath"],
          safety: "Reduce the range if wrists or lower back feel uncomfortable. Avoid collapsing the low back or holding your breath.",
        },
        childPose: {
          title: "Kneeling rest breath",
          breath: "Let the back soften slowly with each exhale",
          cues: ["Lower the forehead", "Relax neck and shoulders", "Stay for 6 breaths"],
          safety: "Place a towel under the knees if needed. Widen the knees if the abdomen feels compressed.",
        },
        neckRelease: {
          title: "Seated neck release",
          breath: "Keep the chin slightly tucked and relax the shoulders as you exhale",
          cues: ["Do not shrug", "Pause on both sides", "Avoid pulling"],
          safety: "Keep pressure light and stop if you feel tingling, sharp pain, or dizziness.",
        },
        hipRock: {
          title: "Supine gentle hip rock",
          breath: "Exhale as the knees slowly fall to one side",
          cues: ["Comfortable range", "Low back grounded", "Alternate sides"],
          safety: "Keep the range small if your lower back feels strained. Avoid forcing the knees down.",
        },
        twist: {
          title: "Gentle seated twist",
          breath: "Inhale to lengthen the spine, exhale to rotate softly",
          cues: ["Keep spine tall", "Rotate gently", "Switch sides"],
          safety: "Keep the twist easy and stop if the belly or back feels compressed.",
        },
        breath: {
          title: "Resting belly breath",
          breath: "Breathe into the lower ribs and let the exhale soften the body",
          cues: ["One hand on belly", "Slow exhale", "Relax the jaw"],
          safety: "Return to natural breathing if you feel lightheaded or tense.",
        },
        sideStretch: {
          title: "Side-body reach",
          breath: "Inhale to grow tall, exhale to reach gently to one side",
          cues: ["Anchor both hips", "Keep ribs soft", "Switch sides"],
          safety: "Avoid collapsing the waist or pulling through shoulder discomfort.",
        },
        forwardFold: {
          title: "Supported forward fold",
          breath: "Exhale and let the upper body soften over the legs",
          cues: ["Bend knees", "Support hands", "Keep neck heavy"],
          safety: "Rise slowly and skip the fold if you feel dizzy or have sharp back pain.",
        },
        butterfly: {
          title: "Butterfly hip opener",
          breath: "Let the knees relax outward while the breath stays calm",
          cues: ["Sit tall", "Feet together", "No bouncing"],
          safety: "Support the knees if hips feel strained and avoid forcing the stretch.",
        },
        legsWall: {
          title: "Legs-up-the-wall rest",
          breath: "Let the legs rest while the exhale slows down",
          cues: ["Hips supported", "Relax feet", "Stay easy"],
          safety: "Come down if you feel numbness, tingling, or pressure in the head.",
        },
        shoulderRolls: {
          title: "Slow shoulder rolls",
          breath: "Inhale as shoulders lift, exhale as they roll down and back",
          cues: ["Small circles", "Relax neck", "Move slowly"],
          safety: "Keep the range pain-free and avoid rolling into pinching sensations.",
        },
        mindfulWalk: {
          title: "Mindful easy walk",
          breath: "Match an easy pace with a steady natural breath",
          cues: ["Short steps", "Soft shoulders", "Notice comfort"],
          safety: "Slow down or stop if cramps, dizziness, or fatigue increases.",
        },
        default: {
          title: "Gentle low-intensity movement",
          breath: "Keep a natural breath and stop immediately if anything hurts",
          cues: ["Start slowly", "Stay comfortable", "Do not chase intensity"],
          safety: "Stop and rest if discomfort rises, breath feels strained, or pain feels sharp.",
        },
      },
    },
    care: {
      generating: "Generating",
      generatingTitle: "{phase} care plan",
      generatingAction: "Generating suggestions from your cycle and check-in...",
      sourceToday: "Today",
      sourceLLM: "LLM generated",
      sourceLocal: "Local rules",
      title: "Care plan",
      subheading: "Self-care suggestions for today",
      recipeEyebrow: "Care meal idea",
      noteEyebrow: "Care note",
      massageEyebrow: "Massage idea",
      defaultTitle: "Today's care plan",
      defaultRecipeTitle: "Gentle care meal",
      defaultRecipeCopy: "Build a gentle meal around your phase, feelings, and pantry.",
      defaultNote: "These ideas are general wellness support. Seek professional care for clear discomfort or concerning symptoms.",
      defaultMassage: "Choose gentle relaxation and do not chase intensity.",
      pantrySuffix: " You can prioritize pantry items you already have: {items}.",
      finalNote: "LunaPlate offers general care inspiration, not diagnosis. Severe pain, unusually heavy bleeding, dizziness, missed periods, or possible pregnancy should be discussed with a qualified clinician.",
      plans: {
        menstrual: {
          title: "Gentle menstrual care",
          actions: ["Use a warm compress on the lower abdomen or back for 15 minutes", "Choose warm drinks and hydrate in small amounts", "Keep movement to stretching, breathing, or slow walking", "Try to rest earlier tonight"],
          recipeTitle: "Red bean ginger date soup",
          recipeCopy: "A warm soup-style snack with beans and a little ginger or date. Swap for red bean millet porridge if ginger or dates do not suit you.",
          massage: "Gently relax the outer lower abdomen, sacrum, and Zusanli area for 30-60 seconds each, keeping pressure comfortable.",
        },
        follicular: {
          title: "Follicular recovery care",
          actions: ["Get a little outdoor light or an easy walk", "Add protein and high-fiber carbohydrates", "Do simple meal prep to reduce decisions later", "Reduce screen stimulation before bed"],
          recipeTitle: "Spinach egg rice bowl",
          recipeCopy: "Protein, leafy greens, and a staple grain support steady energy. Vegetarian swaps can use tofu or beans.",
          massage: "Relax neck, shoulders, thoracic spine, and calves to help the body return from lower energy.",
        },
        ovulation: {
          title: "Ovulation balance care",
          actions: ["Choose refreshing meals that still include protein", "Movement can be a little more active, but avoid sudden sprints", "Add colorful fruit and vegetables", "Protect sleep and avoid overfilling the day"],
          recipeTitle: "Avocado tomato protein bowl",
          recipeCopy: "Healthy fats, antioxidant produce, and protein make a balanced plate. Adapt it into a rice bowl or salad bowl.",
          massage: "Gently relax hips, back, neck, and shoulders while keeping the breath smooth.",
        },
        luteal: {
          title: "Luteal steadying care",
          actions: ["Add protein and complex carbs to meals", "Reduce high salt and excess caffeine", "Leave room for mood and appetite fluctuations", "Do 3 minutes of belly breathing before bed"],
          recipeTitle: "Chickpea sweet potato stew",
          recipeCopy: "Beans, roots, and gentle spices can support fullness during energy and appetite shifts.",
          massage: "Relax calves, lower back, neck, and shoulders. Add gentle trunk rotation if bloating is present.",
        },
      },
      symptomActions: {
        cramps: "When cramps are clear, prioritize warmth and small-range stretching instead of high-intensity abdominal work",
        fatigue: "When tired, make tasks smaller; 8-12 minutes of movement is enough",
        bloating: "For bloating, choose warm water, slow walking, gentle twists, and less salty food",
        cravings: "When craving sweet or salty foods, pair them with protein or nuts instead of eating only one snack",
        low_mood: "For low mood, try light exposure, walking, or 3 minutes of breathing",
        high_energy: "Even with higher energy, keep a warm-up and cool-down instead of jumping straight to high intensity",
      },
    },
  },
  zh: {
    meta: { title: "LunaPlate" },
    lang: { en: "EN", zh: "中文", ru: "RU", choose: "语言" },
    brand: { tagline: "滋养你的周期" },
    aria: {
      bestPick: "今日最佳餐食推荐",
      nutrition: "营养重点",
      mealFilters: "餐食筛选",
      mealType: "餐食类型",
      nav: "应用导航预览",
      checkIn: "每日打卡",
      cyclePhase: "周期阶段",
      cuisineStyle: "饮食风格",
      reset: "重置打卡",
      closeProfile: "关闭我的设置",
    },
    nav: { today: "今日", meals: "餐食", plan: "计划", profile: "我的" },
    screen: {
      foodSubheading: "今日周期餐食建议",
    },
    status: {
      cyclePhase: "周期阶段",
      setCycle: "设置你的周期信息",
      phaseHint: "餐食建议会根据预估阶段、症状、偏好和储藏食材调整。",
      day: "第 {day} 天",
      manual: "手动",
    },
    best: {
      eyebrow: "今日最佳",
      chooseCheckIn: "完成打卡",
      matchPlaceholder: "最匹配的餐食会显示在这里。",
      addGroceries: "加入购物清单",
      min: "{n} 分钟",
      analyzing: "正在分析食谱",
      analyzingCopy: "LunaPlate 正在根据你的阶段、症状、储藏食材和偏好匹配外部食谱。",
      apiMatch: "API 匹配",
      noMatch: "暂无匹配",
      noMatchCopy: "可尝试提高烹饪时间上限或放宽一项偏好。",
      noExternal: "暂无外部食谱",
      apiFailed: "应用已连接外部食谱 API，但本次请求失败。",
      tryAgain: "重试",
    },
    focus: {
      comfort: "舒适",
      comfortCopy: "温暖、稳定的食物在状态较差的日子往往更易接受。",
      balance: "平衡",
      balanceCopy: "蛋白质、纤维和复合碳水有助于能量更平稳。",
      hydration: "补水",
      hydrationCopy: "富含水分的食物和简单饮品有助于整体舒适感。",
    },
    toolbar: {
      all: "全部",
      breakfast: "早餐",
      lunch: "午餐",
      dinner: "晚餐",
      snack: "加餐",
      shuffle: "换一批",
    },
    results: {
      matched: "匹配餐食",
      ideas: "{n} 个建议",
      idea: "{n} 个建议",
      matchHint: "完成打卡可改善排序结果。",
      loading: "加载中",
      fetching: "正在获取外部食谱…",
      ranked: "根据 {details} 排序。",
      symptomSignal: "{n} 项症状信号",
      symptomSignals: "{n} 项症状信号",
      pantryItem: "{n} 项储藏食材",
      pantryItems: "{n} 项储藏食材",
      apiUnavailable: "外部 API 不可用。",
    },
    empty: {
      findingTitle: "正在寻找餐食",
      findingCopy: "从 TheMealDB 拉取食谱，并根据你的打卡进行评分。",
      apiErrorTitle: "食谱 API 加载失败",
      apiErrorCopy: "{message}。请检查网络连接后重试。",
      noMatchesTitle: "暂无 API 匹配",
      noMatchesCopy: "可尝试提高烹饪时间、更换储藏食材或放宽一项偏好。",
    },
    grocery: {
      plan: "计划",
      title: "购物清单",
      clear: "清空",
      empty: "从餐食卡片添加食材。",
    },
    safety: {
      eyebrow: "关怀提示",
      title: "支持性建议，非诊断",
      body: "LunaPlate 提供一般健康灵感。若出现剧烈疼痛、出血量很大、头晕、停经、怀孕相关担忧或有进食障碍史，请咨询专业医护人员。",
    },
    form: {
      cycle: "周期",
      reset: "重置",
      lastPeriod: "上次月经第一天",
      cycleLength: "平均周期长度（天）",
      manualPhase: "或手动选择阶段",
      auto: "自动",
      howFeel: "你感觉如何？",
      preferences: "饮食偏好",
      vegetarian: "素食",
      vegan: "纯素",
      glutenFree: "无麸质",
      dairyFree: "无乳制品",
      cuisineStyle: "饮食风格",
      maxCook: "最长烹饪时间",
      min: "{n} 分钟",
      pantry: "储藏食材",
      pantryPlaceholder: "菠菜、米饭、酸奶、扁豆",
      ingredientsSteps: "食材与步骤",
      swap: "换一道",
    },
    cuisineStyles: {
      balanced: "均衡",
      asian: "亚洲",
      mediterranean: "地中海",
      mexican: "墨西哥",
    },
    phases: {
      menstrual: {
        title: "月经期",
        description: "优先选择舒适、富含铁、易补水且准备简单的餐食。",
        focus: [
          ["补铁", "尽量将富含铁的食物与含维生素 C 的食材搭配。"],
          ["温热舒适", "汤、碗餐和熟蔬菜在低能量日往往更易接受。"],
          ["补水", "水、茶、高汤和多汁蔬果有助于整体舒适。"],
        ],
      },
      follicular: {
        title: "卵泡期",
        description: "适合明亮、有活力的餐食，注重蛋白质、纤维和多彩蔬果。",
        focus: [
          ["稳定能量", "蛋白质与复合碳水让饱腹感更持久。"],
          ["清爽口感", "此阶段常适合沙拉、碗餐和快手菜。"],
          ["便于备餐", "可分批准备的谷物和蛋白质让一周更轻松。"],
        ],
      },
      ovulation: {
        title: "排卵期",
        description: "选择均衡餐食，含抗氧化物、健康脂肪和足量蛋白质。",
        focus: [
          ["抗氧化", "浆果、绿叶菜、柑橘和多彩蔬菜带来丰富搭配。"],
          ["健康脂肪", "牛油果、橄榄油、坚果、种子和鱼类让餐食更满足。"],
          ["均衡", "搭配蛋白质、蔬果、脂肪和慢碳水。"],
        ],
      },
      luteal: {
        title: "黄体期",
        description: "选择令人满足的餐食，稳定血糖，更好应对食欲波动。",
        focus: [
          ["食欲友好", "甜咸口味与蛋白质、纤维搭配往往更合适。"],
          ["镁", "坚果、种子、豆类、绿叶菜和黑巧克力是实用选择。"],
          ["规律进餐", "规律正餐和加餐有助于减少能量骤降。"],
        ],
      },
    },
    symptoms: {
      cramps: "痛经",
      fatigue: "疲劳",
      bloating: "腹胀",
      cravings: "食欲波动",
      low_mood: "情绪低落",
      high_energy: "精力充沛",
    },
    tags: {
      iron: "铁",
      magnesium: "镁",
      comfort: "舒适",
      hydrating: "补水",
      protein: "蛋白质",
      fiber: "纤维",
      fresh: "清爽",
      prep: "易备",
      antioxidants: "抗氧化",
      "healthy fat": "健康脂肪",
      "craving-friendly": "解馋友好",
      calcium: "钙",
      vegetarian: "素食",
      vegan: "纯素",
      "dairy-free": "无乳",
      "gluten-free": "无麸质",
    },
    mealTypes: {
      breakfast: "早餐",
      lunch: "午餐",
      dinner: "晚餐",
      snack: "加餐",
    },
    recipe: {
      apiTimeout: "食谱 API 请求超时",
      followSource: "请按来源食谱的方法制作。",
      summary: "LunaPlate 根据你的周期和偏好，为这个外部{category}提取重点：{focus}。菜名和做法保留来源原文，避免误译。",
      categoryRecipe: "{category}食谱",
      recipe: "食谱",
      todaysPreferences: "今日偏好",
      bestReason: "根据你的{phase}{symptoms}，该 API 食谱在{tags}方面较匹配。{pantry}",
      bestSymptoms: "与今日症状",
      pantryUses: " 也使用了你储藏的食材。",
      and: "与",
    },
    movement: {
      heading: "运动",
      subheading: "匹配当前周期的温和运动",
      best: "今日最佳",
      defaultTitle: "周期友好的温和运动",
      defaultMeta: "{n} 分钟 · 按当前周期筛选",
      recent: "最近运动时间",
      countdown: "练习倒计时",
      loadingTitle: "正在寻找温和动作",
      loadingSummary: "正在根据当前周期匹配动作指导。",
      loadingStep: "正在加载动作指导...",
      unavailableTitle: "暂时无法获取动作指导",
      unavailableStep: "请确认本地 Python 服务运行后再刷新。",
      unavailableNote: "动作推荐由 Python 后端提供。",
      focusTitle: "动作重点",
      safetyTitle: "安全边界",
      defaultFocus: "动作慢一点，保持呼吸，范围保持舒适。",
      defaultSafety: "腹痛明显、头晕或任何刺痛出现时停止，改为休息。",
      stepsEyebrow: "动作步骤",
      stepTitle: "跟练说明",
      refresh: "换一批",
      more: "更多推荐",
      count: "{n} 个动作",
      note: "来自 Python 后端，按周期和症状筛选。",
      start: "开始 {n} 分钟练习",
      pause: "暂停 {time}",
      resume: "继续 {time}",
      practicing: "练习中 {time}",
      completed: "已完成，重新开始",
      previous: "上一个动作",
      next: "下一个动作",
      swipeHint: "左右滑动切换",
      sourceApi: "女性动作 API",
      sourceVector: "LunaPlate 矢量指导",
      guide: {
        catCow: {
          title: "四点支撑脊柱流动",
          breath: "吸气展开胸口，呼气轻轻拱背",
          cues: ["手腕在肩下", "动作小一点", "跟随呼吸"],
          safety: "手腕或腰背不适时缩小幅度，避免塌腰或憋气。",
        },
        childPose: {
          title: "跪姿放松呼吸",
          breath: "每次呼气让背部慢慢放松",
          cues: ["额头放低", "肩颈放松", "停留 6 次呼吸"],
          safety: "膝盖不适可垫毛巾；腹部被挤压时把膝盖打开一些。",
        },
        neckRelease: {
          title: "坐姿颈肩释放",
          breath: "保持下巴微收，呼气时放松肩膀",
          cues: ["不耸肩", "左右各停留", "不要拉扯"],
          safety: "力度保持很轻，出现麻木、刺痛或头晕时停止。",
        },
        hipRock: {
          title: "仰卧髋部轻摆",
          breath: "呼气时让膝盖慢慢向一侧落下",
          cues: ["幅度舒适", "腰背贴地", "左右交替"],
          safety: "腰背紧张时缩小幅度，不要强行把膝盖压下去。",
        },
        twist: {
          title: "坐姿轻柔扭转",
          breath: "吸气延展脊柱，呼气时轻轻转向一侧",
          cues: ["脊柱立直", "轻柔转动", "左右交替"],
          safety: "扭转保持轻松，腹部或背部被挤压时停止。",
        },
        breath: {
          title: "休息式腹式呼吸",
          breath: "把呼吸送到下肋，呼气时让身体慢慢放松",
          cues: ["一手放腹部", "慢慢呼气", "放松下颌"],
          safety: "出现头晕或紧张时回到自然呼吸。",
        },
        sideStretch: {
          title: "侧腰轻伸展",
          breath: "吸气向上延展，呼气时轻轻伸向一侧",
          cues: ["坐骨稳定", "肋骨放松", "左右交替"],
          safety: "不要塌腰，肩部不适时不要硬拉。",
        },
        forwardFold: {
          title: "支撑式前屈放松",
          breath: "呼气时让上半身慢慢向腿部放松",
          cues: ["膝盖微屈", "双手支撑", "颈部放松"],
          safety: "起身要慢；头晕或背部刺痛时跳过前屈。",
        },
        butterfly: {
          title: "蝴蝶式髋部打开",
          breath: "让膝盖自然向外放松，呼吸保持平稳",
          cues: ["坐直", "脚掌相对", "不要弹振"],
          safety: "髋部紧张时支撑膝盖，不要强行下压。",
        },
        legsWall: {
          title: "靠墙抬腿休息",
          breath: "让双腿被支撑，呼气慢慢放缓",
          cues: ["髋部支撑", "脚踝放松", "保持轻松"],
          safety: "出现麻木、刺痛或头部压力时放下双腿。",
        },
        shoulderRolls: {
          title: "缓慢肩部绕环",
          breath: "吸气提肩，呼气向后向下绕动",
          cues: ["小圈活动", "颈部放松", "慢慢移动"],
          safety: "范围保持无痛，避免转到夹挤感。",
        },
        mindfulWalk: {
          title: "正念轻松步行",
          breath: "用轻松步伐配合自然稳定的呼吸",
          cues: ["步幅小一点", "肩膀放松", "留意舒适感"],
          safety: "痛经、头晕或疲劳加重时放慢或停止。",
        },
        default: {
          title: "温和低强度动作",
          breath: "保持自然呼吸，任何疼痛都立即停止",
          cues: ["慢速开始", "范围舒适", "不追求强度"],
          safety: "不适加重、呼吸吃力或出现刺痛时停止休息。",
        },
      },
    },
    care: {
      generating: "生成中",
      generatingTitle: "{phase}养护计划",
      generatingAction: "正在根据你的周期和感受生成建议...",
      sourceToday: "今日建议",
      sourceLLM: "LLM 生成",
      sourceLocal: "本地规则生成",
      title: "养护计划",
      subheading: "今日自我养护建议",
      recipeEyebrow: "养护食谱推荐",
      noteEyebrow: "关怀提示",
      massageEyebrow: "按摩推荐",
      defaultTitle: "今日养护计划",
      defaultRecipeTitle: "温和养护餐",
      defaultRecipeCopy: "结合你的阶段、感受和食材做温和搭配。",
      defaultNote: "这些建议仅用于一般健康支持，明显不适请咨询专业医护人员。",
      defaultMassage: "选择轻柔放松，不追求强度。",
      pantrySuffix: " 可优先使用你已有的{items}。",
      finalNote: "LunaPlate 提供一般养护灵感，不用于诊断。若出现剧烈疼痛、异常大量出血、头晕、停经或疑似怀孕，请及时咨询专业医护人员。",
      plans: {
        menstrual: {
          title: "月经期温和养护",
          actions: ["热敷小腹或腰背 15 分钟", "选择温热饮品，少量多次补水", "把运动降到拉伸、呼吸或慢走", "今晚尽量提前休息"],
          recipeTitle: "红豆姜枣汤",
          recipeCopy: "温热汤品搭配豆类和少量姜枣，适合做成轻量加餐；如不适合姜或枣，可换成红豆小米粥。",
          massage: "适合轻揉下腹外侧、腰骶部和足三里附近，每处 30-60 秒，力度保持舒适。",
        },
        follicular: {
          title: "卵泡期恢复养护",
          actions: ["安排一点户外光照或轻快步行", "补充蛋白质和高纤维主食", "适合做简单备餐，降低后续几天决策负担", "睡前减少屏幕刺激"],
          recipeTitle: "菠菜鸡蛋米饭碗",
          recipeCopy: "蛋白质、绿叶菜和主食搭配，适合恢复精力；素食可用豆腐或豆类替换鸡蛋。",
          massage: "适合放松颈肩、胸椎和小腿，帮助身体从低能量状态慢慢回来。",
        },
        ovulation: {
          title: "排卵期平衡养护",
          actions: ["选择清爽但有蛋白质的正餐", "运动可以稍积极，但避免突然冲刺", "补充富含颜色的蔬果", "留意睡眠，避免日程排得太满"],
          recipeTitle: "牛油果番茄蛋白碗",
          recipeCopy: "用健康脂肪、抗氧化蔬果和蛋白质做平衡搭配；可按饮食风格换成米饭碗或沙拉碗。",
          massage: "适合轻柔放松髋部、背部和肩颈，保持呼吸顺畅。",
        },
        luteal: {
          title: "黄体期稳定养护",
          actions: ["正餐加入蛋白质和复合碳水", "减少高盐和过量咖啡因", "给情绪和食欲波动留一点缓冲", "睡前做 3 分钟腹式呼吸"],
          recipeTitle: "鹰嘴豆红薯炖菜",
          recipeCopy: "豆类、根茎类和温和香料能提升饱足感，适合应对能量波动和食欲变化。",
          massage: "适合按揉小腿、腰背和肩颈，腹胀时加轻柔躯干旋转。",
        },
      },
      symptomActions: {
        cramps: "痛经明显时优先热敷和低幅度伸展，不做腹部高强度训练",
        fatigue: "疲劳时把任务拆小，运动控制在 8-12 分钟也可以",
        bloating: "腹胀时选择温水、慢走和轻柔扭转，减少高盐食物",
        cravings: "想吃甜或咸时，搭配蛋白质或坚果，避免只吃单一零食",
        low_mood: "情绪低落时试试光照、散步或 3 分钟呼吸练习",
        high_energy: "精力较高也保留热身和收操，避免突然拉满强度",
      },
    },
  },
  ru: {
    meta: { title: "LunaPlate" },
    lang: { en: "EN", zh: "中文", ru: "RU", choose: "Язык" },
    brand: { tagline: "Питай свой цикл" },
    aria: {
      bestPick: "Лучшее блюдо на сегодня",
      nutrition: "Фокус питания",
      mealFilters: "Фильтры блюд",
      mealType: "Тип приёма пищи",
      nav: "Предпросмотр навигации",
      checkIn: "Ежедневный чек-ин",
      cyclePhase: "Фаза цикла",
      cuisineStyle: "Стиль кухни",
      reset: "Сбросить чек-ин",
      closeProfile: "Закрыть профиль",
    },
    nav: { today: "Сегодня", meals: "Блюда", plan: "План", profile: "Профиль" },
    screen: {
      foodSubheading: "План питания с учетом цикла на сегодня",
    },
    status: {
      cyclePhase: "Фаза цикла",
      setCycle: "Укажите данные цикла",
      phaseHint: "Идеи блюд подстраиваются под фазу, симптомы, предпочтения и запасы.",
      day: "День {day}",
      manual: "Вручную",
    },
    best: {
      eyebrow: "Лучшее на сегодня",
      chooseCheckIn: "Заполните чек-ин",
      matchPlaceholder: "Самое подходящее блюдо появится здесь.",
      addGroceries: "В список покупок",
      min: "{n} мин",
      analyzing: "Анализ рецептов",
      analyzingCopy: "LunaPlate подбирает внешние рецепты под фазу, симптомы, запасы и предпочтения.",
      apiMatch: "совпадение API",
      noMatch: "Пока нет совпадений",
      noMatchCopy: "Попробуйте увеличить время готовки или ослабить одно ограничение.",
      noExternal: "Нет внешнего рецепта",
      apiFailed: "Приложение подключено к внешнему API рецептов, но запрос не удался.",
      tryAgain: "Повторить",
    },
    focus: {
      comfort: "Комфорт",
      comfortCopy: "Тёплые сытные блюда часто легче переносятся в трудные дни.",
      balance: "Баланс",
      balanceCopy: "Белок, клетчатка и сложные углеводы помогают ровнее держать энергию.",
      hydration: "Гидратация",
      hydrationCopy: "Влажные продукты и простые напитки поддерживают общий комфорт.",
    },
    toolbar: {
      all: "Все",
      breakfast: "Завтрак",
      lunch: "Обед",
      dinner: "Ужин",
      snack: "Перекус",
      shuffle: "Перемешать",
    },
    results: {
      matched: "Подобранные блюда",
      ideas: "{n} идей",
      idea: "{n} идея",
      matchHint: "Заполните чек-ин, чтобы улучшить ранжирование.",
      loading: "Загрузка",
      fetching: "Загрузка внешних рецептов…",
      ranked: "Ранжировано по: {details}.",
      symptomSignal: "{n} сигнал симптома",
      symptomSignals: "{n} сигнала симптомов",
      pantryItem: "{n} продукт из запасов",
      pantryItems: "{n} продуктов из запасов",
      apiUnavailable: "Внешний API недоступен.",
    },
    empty: {
      findingTitle: "Ищем блюда",
      findingCopy: "Загружаем рецепты из TheMealDB и оцениваем их по вашему чек-ину.",
      apiErrorTitle: "API рецептов не загрузился",
      apiErrorCopy: "{message}. Проверьте интернет и попробуйте снова.",
      noMatchesTitle: "Пока нет совпадений API",
      noMatchesCopy: "Увеличьте время готовки, измените запасы или ослабьте одно ограничение.",
    },
    grocery: {
      plan: "План",
      title: "Список покупок",
      clear: "Очистить",
      empty: "Добавьте продукты с карточки блюда.",
    },
    safety: {
      eyebrow: "Забота",
      title: "Поддержка, не диагноз",
      body: "LunaPlate даёт общие идеи для самочувствия. Сильная боль, обильные кровотечения, головокружение, задержка цикла, беременность или расстройства пищевого поведения требуют помощи врача.",
    },
    form: {
      cycle: "Цикл",
      reset: "Сброс",
      lastPeriod: "Первый день последней менструации",
      cycleLength: "Средняя длина цикла (дней)",
      manualPhase: "Или выберите фазу вручную",
      auto: "Авто",
      howFeel: "Как вы себя чувствуете?",
      preferences: "Предпочтения",
      vegetarian: "Вегетарианство",
      vegan: "Веганство",
      glutenFree: "Без глютена",
      dairyFree: "Без молочного",
      cuisineStyle: "Стиль кухни",
      maxCook: "Макс. время готовки",
      min: "{n} мин",
      pantry: "Продукты в запасах",
      pantryPlaceholder: "шпинат, рис, йогурт, чечевица",
      ingredientsSteps: "Ингредиенты и шаги",
      swap: "Заменить",
    },
    cuisineStyles: {
      balanced: "Сбалансированный",
      asian: "Азиатский",
      mediterranean: "Средиземноморский",
      mexican: "Мексиканский",
    },
    phases: {
      menstrual: {
        title: "Менструальная фаза",
        description: "Удобные блюда с железом, гидратацией и простой готовкой.",
        focus: [
          ["Железо", "Сочетайте продукты с железом с витамином C, когда возможно."],
          ["Тепло и комфорт", "Супы, боулы и тушёная зелень легче в дни низкой энергии."],
          ["Гидратация", "Вода, чай, бульоны и сочные продукты поддерживают комфорт."],
        ],
      },
      follicular: {
        title: "Фолликулярная фаза",
        description: "Светлые бодрящие блюда с белком, клетчаткой и яркими овощами.",
        focus: [
          ["Ровная энергия", "Белок и сложные углеводы дольше насыщают."],
          ["Свежая хрустящая еда", "Часто подходят салаты, боулы и быстрые тарелки."],
          ["Удобная заготовка", "Крупы и белок партиями упрощают неделю."],
        ],
      },
      ovulation: {
        title: "Овуляция",
        description: "Сбалансированные блюда с антиоксидантами, полезными жирами и белком.",
        focus: [
          ["Антиоксиданты", "Ягоды, зелень, цитрусы и разноцветные овощи."],
          ["Полезные жиры", "Авокадо, оливковое масло, орехи, семена и рыба."],
          ["Баланс", "Белок, овощи, жиры и медленные углеводы на тарелке."],
        ],
      },
      luteal: {
        title: "Лютеиновая фаза",
        description: "Сытные блюда для стабильного сахара и мягкой работы с тягой к еде.",
        focus: [
          ["С учётом тяги", "Сладкое и солёное лучше с белком и клетчаткой."],
          ["Магний", "Орехи, семена, бобовые, зелень и тёмный шоколад."],
          ["Регулярность", "Регулярные приёмы пищи снижают провалы энергии."],
        ],
      },
    },
    symptoms: {
      cramps: "Спазмы",
      fatigue: "Усталость",
      bloating: "Вздутие",
      cravings: "Тяга к еде",
      low_mood: "Низкое настроение",
      high_energy: "Высокая энергия",
    },
    tags: {
      iron: "железо",
      magnesium: "магний",
      comfort: "комфорт",
      hydrating: "гидратация",
      protein: "белок",
      fiber: "клетчатка",
      fresh: "свежее",
      prep: "заготовка",
      antioxidants: "антиоксиданты",
      "healthy fat": "полезные жиры",
      "craving-friendly": "для тяги",
      calcium: "кальций",
      vegetarian: "вегетарианское",
      vegan: "веганское",
      "dairy-free": "без молочного",
      "gluten-free": "без глютена",
    },
    mealTypes: {
      breakfast: "завтрак",
      lunch: "обед",
      dinner: "ужин",
      snack: "перекус",
    },
    recipe: {
      apiTimeout: "Превышено время ожидания API рецептов",
      followSource: "Следуйте способу приготовления из источника.",
      summary: "LunaPlate подобрал этот внешний {category} по фокусу: {focus}. Название и шаги остаются на языке источника для точности.",
      categoryRecipe: "рецепт {category}",
      recipe: "рецепт",
      todaysPreferences: "сегодняшние предпочтения",
      bestReason: "Рецепт API подобран под {phase}{symptoms}, с акцентом на {tags}.{pantry}",
      bestSymptoms: " и сегодняшние симптомы",
      pantryUses: " Используется что-то из ваших запасов.",
      and: " и ",
    },
    movement: {
      heading: "Движение",
      subheading: "Мягкое движение под ваш цикл",
      best: "Лучшее на сегодня",
      defaultTitle: "Мягкое движение с учетом цикла",
      defaultMeta: "{n} мин · подобрано под текущую фазу",
      recent: "Недавняя активность",
      countdown: "Обратный отсчет практики",
      loadingTitle: "Подбираем мягкое движение",
      loadingSummary: "Подбираем рекомендации по движению под текущую фазу цикла.",
      loadingStep: "Загружаем подсказки по движению...",
      unavailableTitle: "Рекомендации по движению недоступны",
      unavailableStep: "Попробуйте обновить страницу, когда локальный Python-сервер запущен.",
      unavailableNote: "Рекомендации по движению предоставляет Python-бэкенд.",
      focusTitle: "Фокус движения",
      safetyTitle: "Граница безопасности",
      defaultFocus: "Двигайтесь медленно, дышите ровно и держите комфортную амплитуду.",
      defaultSafety: "Остановитесь и отдохните при заметной боли в животе, головокружении или резкой боли.",
      stepsEyebrow: "Шаги движения",
      stepTitle: "Инструкция для практики",
      refresh: "Обновить",
      more: "Еще рекомендации",
      count: "{n} движений",
      note: "Отфильтровано Python-бэкендом по фазе цикла и симптомам.",
      start: "Начать практику {n} мин",
      pause: "Пауза {time}",
      resume: "Продолжить {time}",
      practicing: "Практика {time}",
      completed: "Завершено, начать снова",
      previous: "Предыдущее движение",
      next: "Следующее движение",
      swipeHint: "Проведите, чтобы переключить",
      sourceApi: "API женского движения",
      sourceVector: "Векторная подсказка LunaPlate",
      guide: {
        catCow: {
          title: "Поток позвоночника на четвереньках",
          breath: "На вдохе раскройте грудь, на выдохе мягко округлите спину",
          cues: ["Запястья под плечами", "Малая амплитуда", "Двигайтесь с дыханием"],
          safety: "Если запястьям или пояснице некомфортно, уменьшите амплитуду. Не проваливайте поясницу и не задерживайте дыхание.",
        },
        childPose: {
          title: "Дыхание в позе отдыха",
          breath: "Позвольте спине мягко отпускать напряжение на каждом выдохе",
          cues: ["Опустите лоб", "Расслабьте шею и плечи", "Останьтесь на 6 дыханий"],
          safety: "При дискомфорте в коленях подложите полотенце. Если живот сдавлен, разведите колени шире.",
        },
        neckRelease: {
          title: "Расслабление шеи сидя",
          breath: "Слегка подтяните подбородок и расслабляйте плечи на выдохе",
          cues: ["Не поднимайте плечи", "Пауза на обе стороны", "Не тяните силой"],
          safety: "Давление должно быть легким; остановитесь при онемении, резкой боли или головокружении.",
        },
        hipRock: {
          title: "Мягкое покачивание бедер лежа",
          breath: "На выдохе медленно опускайте колени в сторону",
          cues: ["Комфортная амплитуда", "Поясница на опоре", "Чередуйте стороны"],
          safety: "Если поясница напрягается, уменьшите амплитуду. Не давите колени вниз силой.",
        },
        twist: {
          title: "Мягкий поворот сидя",
          breath: "На вдохе вытяните позвоночник, на выдохе мягко повернитесь",
          cues: ["Спина высокая", "Поворот мягкий", "Смените сторону"],
          safety: "Держите поворот легким и остановитесь, если живот или спина сдавлены.",
        },
        breath: {
          title: "Спокойное дыхание животом",
          breath: "Дышите в нижние ребра и расслабляйте тело на выдохе",
          cues: ["Рука на животе", "Медленный выдох", "Расслабьте челюсть"],
          safety: "Вернитесь к обычному дыханию, если кружится голова или растет напряжение.",
        },
        sideStretch: {
          title: "Мягкое вытяжение бока",
          breath: "На вдохе вытянитесь вверх, на выдохе мягко потянитесь в сторону",
          cues: ["Таз стабилен", "Ребра мягкие", "Смените сторону"],
          safety: "Не проваливайте талию и не тяните через дискомфорт в плече.",
        },
        forwardFold: {
          title: "Наклон вперед с опорой",
          breath: "На выдохе позвольте корпусу мягко опуститься к ногам",
          cues: ["Колени согнуты", "Руки на опоре", "Шея тяжелая"],
          safety: "Поднимайтесь медленно; пропустите наклон при головокружении или резкой боли в спине.",
        },
        butterfly: {
          title: "Бабочка для раскрытия бедер",
          breath: "Пусть колени расслабляются наружу, а дыхание остается ровным",
          cues: ["Сидите прямо", "Стопы вместе", "Не пружиньте"],
          safety: "Поддержите колени, если бедрам напряженно, и не давите на растяжку.",
        },
        legsWall: {
          title: "Отдых с ногами у стены",
          breath: "Пусть ноги отдыхают, а выдох постепенно замедляется",
          cues: ["Таз поддержан", "Стопы расслаблены", "Оставайтесь легко"],
          safety: "Опустите ноги при онемении, покалывании или давлении в голове.",
        },
        shoulderRolls: {
          title: "Медленные круги плечами",
          breath: "На вдохе поднимите плечи, на выдохе прокатите их вниз и назад",
          cues: ["Малые круги", "Шея расслаблена", "Двигайтесь медленно"],
          safety: "Держите амплитуду без боли и избегайте защемления.",
        },
        mindfulWalk: {
          title: "Легкая осознанная прогулка",
          breath: "Соедините спокойный темп с ровным естественным дыханием",
          cues: ["Короткие шаги", "Мягкие плечи", "Следите за комфортом"],
          safety: "Замедлитесь или остановитесь, если усиливаются спазмы, головокружение или усталость.",
        },
        default: {
          title: "Мягкое движение низкой интенсивности",
          breath: "Дышите естественно и сразу остановитесь, если что-то болит",
          cues: ["Начинайте медленно", "Оставайтесь в комфорте", "Не гонитесь за интенсивностью"],
          safety: "Остановитесь и отдохните, если дискомфорт растет, дыхание напрягается или боль становится резкой.",
        },
      },
    },
    care: {
      generating: "Генерация",
      generatingTitle: "План ухода: {phase}",
      generatingAction: "Генерируем рекомендации по вашему циклу и самочувствию...",
      sourceToday: "Сегодня",
      sourceLLM: "Сгенерировано LLM",
      sourceLocal: "Локальные правила",
      title: "План ухода",
      subheading: "Идеи самоподдержки на сегодня",
      recipeEyebrow: "Идея блюда для ухода",
      noteEyebrow: "Заметка по уходу",
      massageEyebrow: "Идея массажа",
      defaultTitle: "План ухода на сегодня",
      defaultRecipeTitle: "Мягкое поддерживающее блюдо",
      defaultRecipeCopy: "Соберите мягкий прием пищи с учетом фазы, самочувствия и запасов.",
      defaultNote: "Эти идеи - общая поддержка самочувствия. При явном дискомфорте или тревожных симптомах обратитесь к специалисту.",
      defaultMassage: "Выбирайте мягкое расслабление и не гонитесь за интенсивностью.",
      pantrySuffix: " Можно в первую очередь использовать то, что уже есть: {items}.",
      finalNote: "LunaPlate предлагает общие идеи ухода, а не диагноз. Сильную боль, необычно обильное кровотечение, головокружение, задержку цикла или возможную беременность стоит обсудить с квалифицированным специалистом.",
      plans: {
        menstrual: {
          title: "Мягкий уход в менструальную фазу",
          actions: ["Положите теплый компресс на низ живота или поясницу на 15 минут", "Выбирайте теплые напитки и пейте небольшими порциями", "Оставьте движение на уровне растяжки, дыхания или медленной ходьбы", "Постарайтесь лечь спать раньше сегодня"],
          recipeTitle: "Суп из красной фасоли с имбирем и финиками",
          recipeCopy: "Теплый суповый перекус с бобовыми и небольшим количеством имбиря или фиников. Если имбирь или финики не подходят, замените на кашу из красной фасоли и пшена.",
          massage: "Мягко расслабьте внешнюю часть низа живота, крестец и область Цзу-сань-ли по 30-60 секунд, сохраняя комфортное давление.",
        },
        follicular: {
          title: "Восстановительный уход в фолликулярную фазу",
          actions: ["Добавьте немного дневного света или легкую прогулку", "Добавьте белок и углеводы с клетчаткой", "Сделайте простую заготовку еды, чтобы снизить нагрузку решений", "Уменьшите стимуляцию экраном перед сном"],
          recipeTitle: "Рисовая миска со шпинатом и яйцом",
          recipeCopy: "Белок, листовая зелень и крупа поддерживают более ровную энергию. Для вегетарианской замены можно использовать тофу или бобовые.",
          massage: "Расслабьте шею, плечи, грудной отдел и икры, чтобы телу было легче выйти из низкой энергии.",
        },
        ovulation: {
          title: "Балансирующий уход в овуляцию",
          actions: ["Выбирайте освежающие блюда, но оставляйте в них белок", "Движение может быть немного активнее, но избегайте резких спринтов", "Добавьте разноцветные фрукты и овощи", "Берегите сон и не перегружайте день"],
          recipeTitle: "Миска с авокадо, томатом и белком",
          recipeCopy: "Полезные жиры, антиоксидантные овощи и белок создают сбалансированную тарелку. Можно адаптировать как рисовую миску или салат.",
          massage: "Мягко расслабьте бедра, спину, шею и плечи, сохраняя ровное дыхание.",
        },
        luteal: {
          title: "Стабилизирующий уход в лютеиновую фазу",
          actions: ["Добавьте к приемам пищи белок и сложные углеводы", "Сократите избыток соли и кофеина", "Оставьте запас для колебаний настроения и аппетита", "Сделайте 3 минуты дыхания животом перед сном"],
          recipeTitle: "Рагу из нута и батата",
          recipeCopy: "Бобовые, корнеплоды и мягкие специи помогают сытости при колебаниях энергии и аппетита.",
          massage: "Расслабьте икры, поясницу, шею и плечи. При вздутии добавьте мягкие повороты корпуса.",
        },
      },
      symptomActions: {
        cramps: "При выраженных спазмах в первую очередь выбирайте тепло и растяжку с малой амплитудой вместо интенсивной работы на пресс",
        fatigue: "При усталости делите задачи на меньшие шаги; 8-12 минут движения уже достаточно",
        bloating: "При вздутии выбирайте теплую воду, медленную ходьбу, мягкие повороты и меньше соленой еды",
        cravings: "При тяге к сладкому или соленому сочетайте это с белком или орехами, а не ешьте один перекус отдельно",
        low_mood: "При снижении настроения попробуйте свет, прогулку или 3 минуты дыхания",
        high_energy: "Даже при высокой энергии оставляйте разминку и заминку, не переходите сразу к высокой интенсивности",
      },
    },
  },
};

Object.assign(messages.zh, {
  today: {
    planTitle: "今日计划",
    viewAll: "查看全部",
    warmCare: "温暖养护",
    warmCareCopy: "小腹热敷 · 15 分钟",
    gentleMovement: "舒缓运动",
    gentleMovementCopy: "8 分钟呼吸伸展",
    cycleMeal: "周期餐食",
    cycleMealCopy: "温热碗餐 · 蛋白质 · 补水",
    nutritionEyebrow: "每日营养概览",
    kcal: "千卡",
    kcalLeft: "今日还可摄入 650 千卡",
    protein: "蛋白质 72g",
    carbs: "碳水 145g",
    fat: "脂肪 52g",
    recipeTitle: "周期定制食谱",
    recipeName: "滋养燕麦松饼",
    recipeMeta: "15 分钟 · 稳定能量",
  },
});

Object.assign(messages.ru, {
  today: {
    planTitle: "План на сегодня",
    viewAll: "Все",
    warmCare: "Теплый уход",
    warmCareCopy: "Тепло на низ живота · 15 мин",
    gentleMovement: "Мягкое движение",
    gentleMovementCopy: "8 мин дыхательной растяжки",
    cycleMeal: "Блюдо для цикла",
    cycleMealCopy: "Теплая миска · белок · гидратация",
    nutritionEyebrow: "Обзор питания за день",
    kcal: "ккал",
    kcalLeft: "Осталось 650 ккал на сегодня",
    protein: "Белок 72 г",
    carbs: "Углеводы 145 г",
    fat: "Жиры 52 г",
    recipeTitle: "Рецепт под цикл",
    recipeName: "Питательные овсяные панкейки",
    recipeMeta: "15 мин · ровная энергия",
  },
});

Object.assign(messages.zh.nav, {
  today: "主页",
  insights: "洞察",
  health: "健康",
});

Object.assign(messages.ru.nav, {
  today: "Главная",
  insights: "Обзор",
  health: "Здоровье",
});

Object.assign(messages.zh, {
  insights: {
    subheading: "了解你当前的周期节奏",
    currentCycle: "当前周期：第 {day} 天",
    cycleTitle: "周期洞察",
    energyTitle: "能量与专注",
    energyCopy: "今天适合稳定舒适的安排，餐食保持简单温和。",
    socialTitle: "身体节律",
    socialCopy: "当前阶段会影响食欲、运动耐受度和休息需求。",
    statusTitle: "周期状态",
    habitTitle: "习惯养成",
    habitCopy: "本周持续记录了支持周期的健康习惯。",
    stabilityTitle: "周期稳定性",
    stabilityValue: "极佳",
    stabilityCopy: "你的生理阶段切换变得更规律且可预测。",
    movementTitle: "舒缓运动",
    movementValue: "12 小时",
    movementCopy: "上个月累计的低强度修复性活动时长。",
    predictionTitle: "三个月预测",
    periodStart: "经期开始",
    ovulation: "预计排卵",
    lifestyleEyebrow: "营养重点",
    lifestyleTitle: "支持激素节律的餐食",
  },
});

Object.assign(messages.ru, {
  insights: {
    subheading: "Понимайте текущий ритм цикла",
    currentCycle: "Текущий цикл: день {day}",
    cycleTitle: "Обзор цикла",
    energyTitle: "Энергия и фокус",
    energyCopy: "Сегодня подойдут спокойные задачи и простая теплая еда.",
    socialTitle: "Ритм тела",
    socialCopy: "Текущая фаза может влиять на аппетит, движение и потребность в отдыхе.",
    statusTitle: "Состояние цикла",
    habitTitle: "Устойчивость привычек",
    habitCopy: "На этой неделе вы поддерживали стабильный ритм заботы.",
    stabilityTitle: "Стабильность цикла",
    stabilityValue: "Отлично",
    stabilityCopy: "Переходы между фазами выглядят более предсказуемыми.",
    movementTitle: "Восстановительное движение",
    movementValue: "12 ч",
    movementCopy: "Мягкая активность за последний месяц.",
    predictionTitle: "Прогноз на три месяца",
    periodStart: "Начало менструации",
    ovulation: "Ожидаемая овуляция",
    lifestyleEyebrow: "Фокус питания",
    lifestyleTitle: "Блюда для поддержки ритма цикла",
  },
});

Object.assign(messages.zh, {
  ...messages.zh,
  health: {
    searchPlaceholder: "搜索食谱或食材...",
    prepTime: "准备时间：",
    coreIngredient: "核心食材：",
    ingredientPlaceholder: "输入食材关键词...",
    recipeTitle: "周期定制食谱",
  },
});

Object.assign(messages.zh.grocery, {
  close: "关闭购物车",
  customPlaceholder: "添加自定义食材...",
  addCustom: "添加",
  selected: "已选食材",
  generate: "生成清单",
  generatedGroup: "周期餐食清单",
  itemCount: "{n} 件",
  asNeeded: "适量",
});

Object.assign(messages.ru, {
  ...messages.ru,
  health: {
    searchPlaceholder: "Поиск рецептов или ингредиентов...",
    prepTime: "Время:",
    coreIngredient: "Основной ингредиент:",
    ingredientPlaceholder: "Введите ингредиенты...",
    recipeTitle: "Рецепты под цикл",
  },
});

Object.assign(messages.ru.grocery, {
  close: "Закрыть корзину",
  customPlaceholder: "Добавить ингредиент...",
  addCustom: "Добавить",
  selected: "Выбрано",
  generate: "Сформировать список",
  generatedGroup: "Список для блюд",
  itemCount: "{n} шт.",
  asNeeded: "по вкусу",
});

Object.assign(messages.en, {
  week: {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  },
});

Object.assign(messages.en.movement, {
  todayRhythm: "Today's rhythm",
  rhythmCopy: "Your energy is rising. This is a good time for strength and power training.",
  activeGoal: "/ 60 minutes active time",
  caloriesBurned: "Calories burned",
  avgHeartRate: "Average heart rate",
  recordTitle: "Movement record",
  recordCopy: "Your body journey in this cycle",
  syncTitle: "Sync suggestions",
  syncCopy: "Work with your physiology, not against it.",
  cardio: "Efficient cardio",
  minutes35: "35 min",
  featureProgram: "Follicular high-intensity training",
  featureCopy: "Use the estrogen peak for metabolic training that builds lean muscle.",
  recovery: "Recovery",
  yogaProgram: "Hormone-soothing yoga",
  yogaMeta: "20 min \u00b7 low intensity",
  strength: "Strength",
  strengthProgram: "Power sculpt",
  strengthMeta: "45 min \u00b7 high intensity",
  startTraining: "Start training",
  scienceTitle: "Cycle science",
  scienceCopy: "During the follicular phase, your body can use carbohydrates more efficiently for energy. Today is a good day to challenge yourself.",
});

Object.assign(messages.zh, {
  week: {
    mon: "\u4e00",
    tue: "\u4e8c",
    wed: "\u4e09",
    thu: "\u56db",
    fri: "\u4e94",
    sat: "\u516d",
    sun: "\u65e5",
  },
});

Object.assign(messages.zh.movement, {
  todayRhythm: "\u4eca\u65e5\u5f8b\u52a8",
  rhythmCopy: "\u60a8\u7684\u80fd\u91cf\u6b63\u5904\u4e8e\u9ad8\u5cf0\u3002\u73b0\u5728\u662f\u8fdb\u884c\u529b\u91cf\u4e0e\u7206\u53d1\u529b\u8bad\u7ec3\u7684\u6700\u4f73\u65f6\u673a\u3002",
  activeGoal: "/ 60 \u5206\u949f\u6d3b\u8dc3\u65f6\u95f4",
  caloriesBurned: "\u6d88\u8017\u70ed\u91cf",
  avgHeartRate: "\u5e73\u5747\u5fc3\u7387",
  recordTitle: "\u8fd0\u52a8\u8bb0\u5f55",
  recordCopy: "\u672c\u5468\u671f\u7684\u8eab\u4f53\u65c5\u7a0b",
  syncTitle: "\u540c\u6b65\u5efa\u8bae",
  syncCopy: "\u987a\u5e94\u751f\u7406\u673a\u80fd\uff0c\u800c\u975e\u4e0e\u4e4b\u5bf9\u6297\u3002",
  cardio: "\u9ad8\u6548\u6709\u6c27",
  minutes35: "35 \u5206\u949f",
  featureProgram: "\u5375\u6ce1\u671f\u9ad8\u5f3a\u5ea6\u8bad\u7ec3",
  featureCopy: "\u5229\u7528\u96cc\u6fc0\u7d20\u6c34\u5e73\u9ad8\u5cf0\u671f\u8fdb\u884c\u4ee3\u8c22\u8c03\u8282\u8bad\u7ec3\uff0c\u65e8\u5728\u5851\u9020\u7cbe\u5b9e\u808c\u8089\u3002",
  recovery: "\u6062\u590d",
  yogaProgram: "\u8377\u5c14\u8499\u8212\u7f13\u745c\u4f3d",
  yogaMeta: "20 \u5206\u949f \u00b7 \u4f4e\u5f3a\u5ea6",
  strength: "\u529b\u91cf",
  strengthProgram: "\u5f3a\u529b\u5851\u5f62",
  strengthMeta: "45 \u5206\u949f \u00b7 \u9ad8\u5f3a\u5ea6",
  startTraining: "\u5f00\u59cb\u8bad\u7ec3",
  scienceTitle: "\u5468\u671f\u79d1\u666e",
  scienceCopy: "\u5728\u5375\u6ce1\u671f\uff0c\u60a8\u7684\u8eab\u4f53\u5229\u7528\u78b3\u6c34\u5316\u5408\u7269\u63d0\u4f9b\u80fd\u91cf\u7684\u6548\u7387\u66f4\u9ad8\u3002\u4eca\u5929\u662f\u6311\u6218\u81ea\u6211\u5427\uff0c\u60a8\u6709\u5145\u8db3\u7684\u80fd\u91cf\uff01",
});

Object.assign(messages.ru, {
  week: {
    mon: "\u041f\u043d",
    tue: "\u0412\u0442",
    wed: "\u0421\u0440",
    thu: "\u0427\u0442",
    fri: "\u041f\u0442",
    sat: "\u0421\u0431",
    sun: "\u0412\u0441",
  },
});

Object.assign(messages.ru.movement, {
  todayRhythm: "\u0420\u0438\u0442\u043c \u043d\u0430 \u0441\u0435\u0433\u043e\u0434\u043d\u044f",
  rhythmCopy: "\u042d\u043d\u0435\u0440\u0433\u0438\u044f \u0440\u0430\u0441\u0442\u0435\u0442. \u0421\u0435\u0439\u0447\u0430\u0441 \u0445\u043e\u0440\u043e\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f \u0434\u043b\u044f \u0441\u0438\u043b\u044b \u0438 \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u0438.",
  activeGoal: "/ 60 \u043c\u0438\u043d \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438",
  caloriesBurned: "\u0421\u043e\u0436\u0436\u0435\u043d\u043e",
  avgHeartRate: "\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u043f\u0443\u043b\u044c\u0441",
  recordTitle: "\u0416\u0443\u0440\u043d\u0430\u043b \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u044f",
  recordCopy: "\u041f\u0443\u0442\u044c \u0442\u0435\u043b\u0430 \u0432 \u044d\u0442\u043e\u043c \u0446\u0438\u043a\u043b\u0435",
  syncTitle: "\u0421\u0438\u043d\u0445\u0440\u043e-\u0441\u043e\u0432\u0435\u0442\u044b",
  syncCopy: "\u0414\u0432\u0438\u0433\u0430\u0439\u0442\u0435\u0441\u044c \u0432 \u0440\u0438\u0442\u043c\u0435 \u0442\u0435\u043b\u0430.",
  cardio: "\u041a\u0430\u0440\u0434\u0438\u043e",
  minutes35: "35 \u043c\u0438\u043d",
  featureProgram: "\u0418\u043d\u0442\u0435\u043d\u0441\u0438\u0432 \u0434\u043b\u044f \u0444\u043e\u043b\u043b\u0438\u043a\u0443\u043b\u044f\u0440\u043d\u043e\u0439 \u0444\u0430\u0437\u044b",
  featureCopy: "\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u043f\u0438\u043a \u044d\u0441\u0442\u0440\u043e\u0433\u0435\u043d\u0430 \u0434\u043b\u044f \u043c\u0435\u0442\u0430\u0431\u043e\u043b\u0438\u0447\u0435\u0441\u043a\u043e\u0439 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438.",
  recovery: "\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435",
  yogaProgram: "\u0419\u043e\u0433\u0430 \u0434\u043b\u044f \u0433\u043e\u0440\u043c\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u0440\u0438\u0442\u043c\u0430",
  yogaMeta: "20 \u043c\u0438\u043d \u00b7 \u043d\u0438\u0437\u043a\u0430\u044f \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432\u043d\u043e\u0441\u0442\u044c",
  strength: "\u0421\u0438\u043b\u0430",
  strengthProgram: "\u0421\u0438\u043b\u043e\u0432\u043e\u0439 \u0442\u043e\u043d\u0443\u0441",
  strengthMeta: "45 \u043c\u0438\u043d \u00b7 \u0432\u044b\u0441\u043e\u043a\u0430\u044f \u0438\u043d\u0442\u0435\u043d\u0441\u0438\u0432\u043d\u043e\u0441\u0442\u044c",
  startTraining: "\u041d\u0430\u0447\u0430\u0442\u044c",
  scienceTitle: "\u041d\u0430\u0443\u043a\u0430 \u0446\u0438\u043a\u043b\u0430",
  scienceCopy: "\u0412 \u0444\u043e\u043b\u043b\u0438\u043a\u0443\u043b\u044f\u0440\u043d\u043e\u0439 \u0444\u0430\u0437\u0435 \u0442\u0435\u043b\u043e \u044d\u0444\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u0435\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 \u0443\u0433\u043b\u0435\u0432\u043e\u0434\u044b \u0434\u043b\u044f \u044d\u043d\u0435\u0440\u0433\u0438\u0438. \u0421\u0435\u0433\u043e\u0434\u043d\u044f \u043c\u043e\u0436\u043d\u043e \u043c\u044f\u0433\u043a\u043e \u0443\u0441\u0438\u043b\u0438\u0442\u044c \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0443.",
});

Object.assign(messages.en.today, {
  heroTitle: "Let body and mind bloom softly through your cycle",
  heroCopy: "Today is a good moment to soothe your body and replenish natural energy.",
  warmCare: "Folate support",
  warmCareCopy: "09:00 \u2022 400mcg",
  gentleMovement: "15 min morning meditation",
  gentleMovementCopy: "Helps settle mood waves",
  cycleMeal: "Hydration",
  cycleMealCopy: "Goal 2000ml \u2022 now 800ml",
  recipeName: "Nourishing blueberry oat bowl",
  recipeMeta: "15 min \u2022 zinc-rich nutrition",
});

Object.assign(messages.zh.today, {
  heroTitle: "\u8ba9\u8eab\u5fc3\u5728\u5468\u671f\u4e2d\u6e29\u67d4\u7efd\u653e",
  heroCopy: "\u4eca\u5929\u662f\u8212\u7f13\u8eab\u5fc3\u7684\u597d\u65f6\u673a\uff0c\u8bb0\u5f97\u591a\u8865\u5145\u5929\u7136\u80fd\u91cf\u3002",
  warmCare: "\u8865\u5145\u53f6\u9178",
  warmCareCopy: "\u65e9\u4e0a 09:00 \u2022 400mcg",
  gentleMovement: "15\u5206\u949f\u6668\u95f4\u51a5\u60f3",
  gentleMovementCopy: "\u5e2e\u52a9\u5e73\u590d\u60c5\u7eea\u6ce2\u52a8",
  cycleMeal: "\u8865\u5145\u6c34\u5206",
  cycleMealCopy: "\u76ee\u6807 2000ml \u2022 \u5f53\u524d 800ml",
  recipeName: "\u8425\u517b\u84dd\u8393\u71d5\u9ea6\u7897",
  recipeMeta: "15 \u5206\u949f \u2022 \u9ad8\u950c\u8425\u517b",
});

Object.assign(messages.ru.today, {
  heroTitle: "\u041f\u0443\u0441\u0442\u044c \u0442\u0435\u043b\u043e \u0438 \u0443\u043c \u043c\u044f\u0433\u043a\u043e \u0440\u0430\u0441\u043a\u0440\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0432 \u0440\u0438\u0442\u043c\u0435 \u0446\u0438\u043a\u043b\u0430",
  heroCopy: "\u0421\u0435\u0433\u043e\u0434\u043d\u044f \u0445\u043e\u0440\u043e\u0448\u0438\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u0434\u043b\u044f \u043c\u044f\u0433\u043a\u043e\u0433\u043e \u0443\u0445\u043e\u0434\u0430 \u0438 \u043f\u043e\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f \u044d\u043d\u0435\u0440\u0433\u0438\u0438.",
  warmCare: "\u0424\u043e\u043b\u0438\u0435\u0432\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430",
  warmCareCopy: "09:00 \u2022 400mcg",
  gentleMovement: "15 \u043c\u0438\u043d \u0443\u0442\u0440\u0435\u043d\u043d\u0435\u0439 \u043c\u0435\u0434\u0438\u0442\u0430\u0446\u0438\u0438",
  gentleMovementCopy: "\u041f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0441\u043c\u044f\u0433\u0447\u0438\u0442\u044c \u043a\u043e\u043b\u0435\u0431\u0430\u043d\u0438\u044f \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u044f",
  cycleMeal: "\u0412\u043e\u0434\u0430",
  cycleMealCopy: "\u0426\u0435\u043b\u044c 2000ml \u2022 \u0441\u0435\u0439\u0447\u0430\u0441 800ml",
  recipeName: "\u041f\u0438\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u043e\u0432\u0441\u044f\u043d\u043a\u0430 \u0441 \u0447\u0435\u0440\u043d\u0438\u043a\u043e\u0439",
  recipeMeta: "15 \u043c\u0438\u043d \u2022 \u0431\u043e\u0433\u0430\u0442\u043e \u0446\u0438\u043d\u043a\u043e\u043c",
});

messages.en.todayPlan = {
  markDone: "Mark done",
  markUndone: "Mark not done",
  hydrationTitle: "Hydration",
  hydrationCopy: "Goal {goal}ml · now {current}ml · {percent}% · {cue}",
  phases: {
    menstrual: {
      supplementTitle: "Magnesium + iron support",
      supplementCopy: "09:00 · pair with a warm iron-rich meal",
      movementTitle: "8 min belly-softening breath",
      movementCopy: "Gentle breathing or slow cat-cow for comfort",
      hydrationCue: "warm sips work well today",
    },
    follicular: {
      supplementTitle: "Folate + B-vitamin support",
      supplementCopy: "09:00 · steady energy support for a rising phase",
      movementTitle: "15 min light strength flow",
      movementCopy: "Mobility plus easy strength while energy rises",
      hydrationCue: "add water before activity",
    },
    ovulation: {
      supplementTitle: "Antioxidant support",
      supplementCopy: "09:00 · vitamin C foods pair well with iron",
      movementTitle: "20 min energizing walk",
      movementCopy: "A brisk walk or upbeat yoga flow suits this phase",
      hydrationCue: "keep fluids steady",
    },
    luteal: {
      supplementTitle: "Magnesium + B6 support",
      supplementCopy: "09:00 · gentle support for cravings and tension",
      movementTitle: "12 min calming meditation",
      movementCopy: "Breath-led movement to downshift stress",
      hydrationCue: "small steady drinks help",
    },
  },
};

messages.zh.todayPlan = {
  markDone: "标记完成",
  markUndone: "取消完成",
  hydrationTitle: "补充水分",
  hydrationCopy: "目标 {goal}ml · 当前 {current}ml · {percent}% · {cue}",
  phases: {
    menstrual: {
      supplementTitle: "镁 + 铁支持",
      supplementCopy: "09:00 · 搭配温热、富含铁的餐食",
      movementTitle: "8 分钟小腹放松呼吸",
      movementCopy: "轻柔呼吸或慢节奏猫牛式，保持舒适",
      hydrationCue: "今天适合温水小口补充",
    },
    follicular: {
      supplementTitle: "叶酸 + B 族支持",
      supplementCopy: "09:00 · 支持能量逐渐回升",
      movementTitle: "15 分钟轻力量流动",
      movementCopy: "活动关节，加一点轻力量训练",
      hydrationCue: "运动前先补一点水",
    },
    ovulation: {
      supplementTitle: "抗氧化支持",
      supplementCopy: "09:00 · 维 C 食物可搭配铁来源",
      movementTitle: "20 分钟活力步行",
      movementCopy: "快走或明快瑜伽流，顺着高能量",
      hydrationCue: "保持水分稳定",
    },
    luteal: {
      supplementTitle: "镁 + B6 支持",
      supplementCopy: "09:00 · 温和支持紧绷和食欲波动",
      movementTitle: "12 分钟安定冥想",
      movementCopy: "以呼吸带动放松，帮助身体降速",
      hydrationCue: "少量多次更容易坚持",
    },
  },
};

messages.ru.todayPlan = {
  markDone: "Отметить",
  markUndone: "Снять отметку",
  hydrationTitle: "Вода",
  hydrationCopy: "Цель {goal}ml · сейчас {current}ml · {percent}% · {cue}",
  phases: {
    menstrual: {
      supplementTitle: "Магний + железо",
      supplementCopy: "09:00 · сочетайте с теплой пищей, богатой железом",
      movementTitle: "8 мин мягкого дыхания",
      movementCopy: "Спокойное дыхание или медленная cat-cow практика",
      hydrationCue: "теплые небольшие глотки",
    },
    follicular: {
      supplementTitle: "Фолат + витамины B",
      supplementCopy: "09:00 · поддержка растущей энергии",
      movementTitle: "15 мин легкой силы",
      movementCopy: "Мобилизация и мягкая силовая работа",
      hydrationCue: "пейте до активности",
    },
    ovulation: {
      supplementTitle: "Антиоксидантная поддержка",
      supplementCopy: "09:00 · витамин C хорошо сочетается с железом",
      movementTitle: "20 мин бодрой ходьбы",
      movementCopy: "Быстрая прогулка или энергичная йога",
      hydrationCue: "держите воду рядом",
    },
    luteal: {
      supplementTitle: "Магний + B6",
      supplementCopy: "09:00 · мягкая поддержка при напряжении",
      movementTitle: "12 мин спокойной медитации",
      movementCopy: "Дыхательное движение для снижения стресса",
      hydrationCue: "частые небольшие глотки",
    },
  },
};

Object.assign(messages.en.todayPlan, {
  hydrationCopy: "Goal {goal}ml \u00b7 now {current}ml \u00b7 {percent}% \u00b7 {cue}",
});
Object.assign(messages.en.todayPlan.phases.menstrual, {
  supplementCopy: "09:00 \u00b7 pair with a warm iron-rich meal",
});
Object.assign(messages.en.todayPlan.phases.follicular, {
  supplementCopy: "09:00 \u00b7 steady energy support for a rising phase",
});
Object.assign(messages.en.todayPlan.phases.ovulation, {
  supplementCopy: "09:00 \u00b7 vitamin C foods pair well with iron",
});
Object.assign(messages.en.todayPlan.phases.luteal, {
  supplementCopy: "09:00 \u00b7 gentle support for cravings and tension",
});

messages.zh.todayPlan = {
  markDone: "\u6807\u8bb0\u5b8c\u6210",
  markUndone: "\u53d6\u6d88\u5b8c\u6210",
  hydrationTitle: "\u8865\u5145\u6c34\u5206",
  hydrationCopy: "\u76ee\u6807 {goal}ml \u00b7 \u5f53\u524d {current}ml \u00b7 {percent}% \u00b7 {cue}",
  phases: {
    menstrual: {
      supplementTitle: "\u9541 + \u94c1\u652f\u6301",
      supplementCopy: "09:00 \u00b7 \u642d\u914d\u6e29\u70ed\u3001\u5bcc\u542b\u94c1\u7684\u9910\u98df",
      movementTitle: "8 \u5206\u949f\u5c0f\u8179\u653e\u677e\u547c\u5438",
      movementCopy: "\u8f7b\u67d4\u547c\u5438\u6216\u6162\u8282\u594f\u732b\u725b\u5f0f\uff0c\u4fdd\u6301\u8212\u9002",
      hydrationCue: "\u4eca\u5929\u9002\u5408\u6e29\u6c34\u5c0f\u53e3\u8865\u5145",
    },
    follicular: {
      supplementTitle: "\u53f6\u9178 + B \u65cf\u652f\u6301",
      supplementCopy: "09:00 \u00b7 \u652f\u6301\u80fd\u91cf\u9010\u6e10\u56de\u5347",
      movementTitle: "15 \u5206\u949f\u8f7b\u529b\u91cf\u6d41\u52a8",
      movementCopy: "\u6d3b\u52a8\u5173\u8282\uff0c\u52a0\u4e00\u70b9\u8f7b\u529b\u91cf\u8bad\u7ec3",
      hydrationCue: "\u8fd0\u52a8\u524d\u5148\u8865\u4e00\u70b9\u6c34",
    },
    ovulation: {
      supplementTitle: "\u6297\u6c27\u5316\u652f\u6301",
      supplementCopy: "09:00 \u00b7 \u7ef4 C \u98df\u7269\u53ef\u642d\u914d\u94c1\u6765\u6e90",
      movementTitle: "20 \u5206\u949f\u6d3b\u529b\u6b65\u884c",
      movementCopy: "\u5feb\u8d70\u6216\u660e\u5feb\u745c\u4f3d\u6d41\uff0c\u987a\u7740\u9ad8\u80fd\u91cf",
      hydrationCue: "\u4fdd\u6301\u6c34\u5206\u7a33\u5b9a",
    },
    luteal: {
      supplementTitle: "\u9541 + B6 \u652f\u6301",
      supplementCopy: "09:00 \u00b7 \u6e29\u548c\u652f\u6301\u7d27\u7ef7\u548c\u98df\u6b32\u6ce2\u52a8",
      movementTitle: "12 \u5206\u949f\u5b89\u5b9a\u51a5\u60f3",
      movementCopy: "\u4ee5\u547c\u5438\u5e26\u52a8\u653e\u677e\uff0c\u5e2e\u52a9\u8eab\u4f53\u964d\u901f",
      hydrationCue: "\u5c11\u91cf\u591a\u6b21\u66f4\u5bb9\u6613\u575a\u6301",
    },
  },
};

messages.ru.todayPlan = {
  markDone: "\u041e\u0442\u043c\u0435\u0442\u0438\u0442\u044c",
  markUndone: "\u0421\u043d\u044f\u0442\u044c \u043e\u0442\u043c\u0435\u0442\u043a\u0443",
  hydrationTitle: "\u0412\u043e\u0434\u0430",
  hydrationCopy: "\u0426\u0435\u043b\u044c {goal}ml \u00b7 \u0441\u0435\u0439\u0447\u0430\u0441 {current}ml \u00b7 {percent}% \u00b7 {cue}",
  phases: {
    menstrual: {
      supplementTitle: "\u041c\u0430\u0433\u043d\u0438\u0439 + \u0436\u0435\u043b\u0435\u0437\u043e",
      supplementCopy: "09:00 \u00b7 \u0441 \u0442\u0435\u043f\u043b\u043e\u0439 \u043f\u0438\u0449\u0435\u0439, \u0431\u043e\u0433\u0430\u0442\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u043e\u043c",
      movementTitle: "8 \u043c\u0438\u043d \u043c\u044f\u0433\u043a\u043e\u0433\u043e \u0434\u044b\u0445\u0430\u043d\u0438\u044f",
      movementCopy: "\u0421\u043f\u043e\u043a\u043e\u0439\u043d\u043e\u0435 \u0434\u044b\u0445\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u043c\u0435\u0434\u043b\u0435\u043d\u043d\u0430\u044f cat-cow \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0430",
      hydrationCue: "\u0442\u0435\u043f\u043b\u044b\u0435 \u043d\u0435\u0431\u043e\u043b\u044c\u0448\u0438\u0435 \u0433\u043b\u043e\u0442\u043a\u0438",
    },
    follicular: {
      supplementTitle: "\u0424\u043e\u043b\u0430\u0442 + \u0432\u0438\u0442\u0430\u043c\u0438\u043d\u044b B",
      supplementCopy: "09:00 \u00b7 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u0440\u0430\u0441\u0442\u0443\u0449\u0435\u0439 \u044d\u043d\u0435\u0440\u0433\u0438\u0438",
      movementTitle: "15 \u043c\u0438\u043d \u043b\u0435\u0433\u043a\u043e\u0439 \u0441\u0438\u043b\u044b",
      movementCopy: "\u041c\u043e\u0431\u0438\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u0438 \u043c\u044f\u0433\u043a\u0430\u044f \u0441\u0438\u043b\u043e\u0432\u0430\u044f \u0440\u0430\u0431\u043e\u0442\u0430",
      hydrationCue: "\u043f\u0435\u0439\u0442\u0435 \u0434\u043e \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438",
    },
    ovulation: {
      supplementTitle: "\u0410\u043d\u0442\u0438\u043e\u043a\u0441\u0438\u0434\u0430\u043d\u0442\u043d\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430",
      supplementCopy: "09:00 \u00b7 \u0432\u0438\u0442\u0430\u043c\u0438\u043d C \u0445\u043e\u0440\u043e\u0448\u043e \u0441\u043e\u0447\u0435\u0442\u0430\u0435\u0442\u0441\u044f \u0441 \u0436\u0435\u043b\u0435\u0437\u043e\u043c",
      movementTitle: "20 \u043c\u0438\u043d \u0431\u043e\u0434\u0440\u043e\u0439 \u0445\u043e\u0434\u044c\u0431\u044b",
      movementCopy: "\u0411\u044b\u0441\u0442\u0440\u0430\u044f \u043f\u0440\u043e\u0433\u0443\u043b\u043a\u0430 \u0438\u043b\u0438 \u044d\u043d\u0435\u0440\u0433\u0438\u0447\u043d\u0430\u044f \u0439\u043e\u0433\u0430",
      hydrationCue: "\u0434\u0435\u0440\u0436\u0438\u0442\u0435 \u0432\u043e\u0434\u0443 \u0440\u044f\u0434\u043e\u043c",
    },
    luteal: {
      supplementTitle: "\u041c\u0430\u0433\u043d\u0438\u0439 + B6",
      supplementCopy: "09:00 \u00b7 \u043c\u044f\u0433\u043a\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043f\u0440\u0438 \u043d\u0430\u043f\u0440\u044f\u0436\u0435\u043d\u0438\u0438",
      movementTitle: "12 \u043c\u0438\u043d \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u043e\u0439 \u043c\u0435\u0434\u0438\u0442\u0430\u0446\u0438\u0438",
      movementCopy: "\u0414\u044b\u0445\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0434\u043b\u044f \u0441\u043d\u0438\u0436\u0435\u043d\u0438\u044f \u0441\u0442\u0440\u0435\u0441\u0441\u0430",
      hydrationCue: "\u0447\u0430\u0441\u0442\u044b\u0435 \u043d\u0435\u0431\u043e\u043b\u044c\u0448\u0438\u0435 \u0433\u043b\u043e\u0442\u043a\u0438",
    },
  },
};

Object.assign(messages.en.health, {
  heroEyebrow: "",
  heroTitle: "Meals tuned to your rhythm",
  heroCopy: "Search by dish, ingredient, prep time, and phase support.",
});
Object.assign(messages.en.toolbar, { shuffle: "Refresh picks" });
Object.assign(messages.en.recipe, { kcal: "{n} kcal" });

Object.assign(messages.zh.health, {
  heroEyebrow: "",
  heroTitle: "\u6309\u4f60\u7684\u8282\u5f8b\u63a8\u8350\u9910\u98df",
  heroCopy: "\u6309\u83dc\u540d\u3001\u98df\u6750\u3001\u65f6\u95f4\u548c\u5468\u671f\u652f\u6301\u7b5b\u9009\u3002",
});
Object.assign(messages.zh.toolbar, { shuffle: "\u6362\u4e00\u6279" });
Object.assign(messages.zh.recipe, { kcal: "{n} \u5343\u5361" });

Object.assign(messages.ru.health, {
  heroEyebrow: "",
  heroTitle: "\u0415\u0434\u0430 \u0432 \u0440\u0438\u0442\u043c\u0435 \u0442\u0435\u043b\u0430",
  heroCopy: "\u0418\u0449\u0438\u0442\u0435 \u043f\u043e \u0431\u043b\u044e\u0434\u0443, \u0438\u043d\u0433\u0440\u0435\u0434\u0438\u0435\u043d\u0442\u0443, \u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u0438 \u0444\u0430\u0437\u0435.",
});
Object.assign(messages.ru.toolbar, { shuffle: "\u0415\u0449\u0435 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u044b" });
Object.assign(messages.ru.recipe, { kcal: "{n} \u043a\u043a\u0430\u043b" });

let currentLocale = "en";
const listeners = new Set();

function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function t(key, vars = {}) {
  let value = getNested(messages[currentLocale], key) ?? getNested(messages.en, key);
  if (value === undefined) return key;
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : `{${name}}`));
}

function getLocale() {
  return currentLocale;
}

function getPhaseCopy(phase) {
  return messages[currentLocale].phases[phase] || messages.en.phases[phase];
}

function translateTag(tag) {
  return messages[currentLocale].tags[tag] || messages.en.tags[tag] || tag;
}

function translateMealType(type) {
  return messages[currentLocale].mealTypes[type] || messages.en.mealTypes[type] || type;
}

function translateSymptom(id) {
  return messages[currentLocale].symptoms[id] || messages.en.symptoms[id] || id;
}

function applyStatic() {
  document.documentElement.lang = currentLocale === "zh" ? "zh-CN" : currentLocale;
  document.title = t("meta.title");

  document.querySelectorAll("[data-i18n]:not([data-i18n-skip])").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.dataset.i18nTitle));
  });

  document.querySelectorAll(".lang-switch button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLocale);
    button.setAttribute("aria-pressed", button.dataset.lang === currentLocale ? "true" : "false");
  });
}

function setLocale(locale) {
  const nextLocale = normalizeLocale(locale);
  if (!nextLocale || !SUPPORTED.includes(nextLocale)) return;
  currentLocale = nextLocale;
  try {
    localStorage.setItem(STORAGE_KEY, nextLocale);
  } catch {
    // file:// or private mode: UI still switches.
  }
  applyStatic();
  window.dispatchEvent(new CustomEvent("lunaplate:localechange", { detail: { locale: nextLocale } }));
  listeners.forEach((listener) => {
    try {
      listener(nextLocale);
    } catch (error) {
      console.error("LunaPlate locale listener failed:", error);
    }
  });
}

function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function initLocale() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = null;
  }
  currentLocale = normalizeLocale(saved) || normalizeLocale(navigator.language) || "en";
  applyStatic();
}

function bindLanguageControls() {
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest(".lang-switch [data-lang]");
      if (!button) return;
      event.preventDefault();
      setLocale(button.dataset.lang);
    },
    true,
  );
}

function whenReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

bindLanguageControls();
whenReady(initLocale);

window.I18n = {
  t,
  getLocale,
  setLocale,
  onLocaleChange,
  initLocale,
  getPhaseCopy,
  translateTag,
  translateMealType,
  translateSymptom,
  normalizeLocale,
  SUPPORTED,
};
