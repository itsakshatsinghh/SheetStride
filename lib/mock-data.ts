export const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/questions", label: "Questions" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" }
] as const;

export const dashboardData = {
  level: "LEVEL 3 CODER",
  solved: "124/450",
  progress: 27,
  stats: [
    { label: "RESOLVED", value: "124", subtext: "Questions Solved", tone: "primary" },
    { label: "CURRENT", value: "12 DAYS", subtext: "Current Streak", tone: "secondary" },
    { label: "ALL_TIME", value: "45 DAYS", subtext: "Longest Streak", tone: "tertiary" },
    { label: "MODULES", value: "8/15", subtext: "Topics Completed", tone: "primary" }
  ],
  difficulty: [
    { label: "EASY", solved: "72/150", value: 48, tone: "secondary" },
    { label: "MEDIUM", solved: "42/200", value: 21, tone: "tertiary" },
    { label: "HARD", solved: "10/100", value: 10, tone: "danger" }
  ],
  topics: [
    { name: "ARRAYS", value: 85 },
    { name: "STRINGS", value: 60 },
    { name: "LINKED_LISTS", value: 40 },
    { name: "TREES", value: 22 },
    { name: "GRAPHS", value: 15 },
    { name: "DYNAMIC_PROG", value: 5 }
  ],
  recentLogs: [
    { difficulty: "E", tone: "secondary", title: "Two Sum", time: "2 HOURS AGO", state: "success" },
    { difficulty: "E", tone: "secondary", title: "Binary Search", time: "5 HOURS AGO", state: "success" },
    { difficulty: "M", tone: "tertiary", title: "LRU Cache", time: "YESTERDAY", state: "success" },
    { difficulty: "H", tone: "danger", title: "Median of Sorted Arrays", time: "2 DAYS AGO", state: "error" }
  ]
};

export const questionSections = [
  {
    id: "01. ARRAYS",
    count: "12/24",
    tone: "secondary",
    type: "table" as const,
    rows: [
      { name: "3Sum", difficulty: "MEDIUM", topic: "ARRAYS", checked: false },
      { name: "Two Sum", difficulty: "EASY", topic: "ARRAYS", checked: true },
      { name: "Container With Most Water", difficulty: "MEDIUM", topic: "ARRAYS", checked: false }
    ]
  },
  {
    id: "06. DYNAMIC PROGRAMMING",
    count: "05/30",
    tone: "primary",
    type: "table" as const,
    rows: [
      { name: "Longest Increasing Subsequence", difficulty: "MEDIUM", topic: "DP", checked: false },
      { name: "Edit Distance", difficulty: "HARD", topic: "DP", checked: false }
    ]
  },
  {
    id: "04. TREES",
    count: "08/18",
    tone: "tertiary",
    type: "cards" as const,
    rows: [
      { name: "Maximum Depth of Binary Tree", difficulty: "EASY", topic: "TREES", checked: true },
      { name: "Binary Tree Maximum Path Sum", difficulty: "HARD", topic: "TREES", checked: false },
      { name: "Invert Binary Tree", difficulty: "MEDIUM", topic: "TREES", checked: false }
    ]
  },
  {
    id: "07. BACKTRACKING",
    count: "02/10",
    tone: "danger",
    type: "empty" as const,
    rows: []
  }
];

export const progressData = {
  completion: 74.8,
  delta: "+4.2%",
  solved: "342/450",
  streak: "14 DAYS",
  avgTime: "24.5m",
  ranking: "TOP 5%",
  insights: [
    { title: "STRONGEST_TOPIC", value: "Dynamic Programming", subvalue: "92% ACCURACY", tone: "secondary" },
    { title: "WEAKEST_TOPIC", value: "Graphs & DFS", subvalue: "34% ACCURACY", tone: "danger" },
    { title: "PEAK_ACTIVITY", value: "Wednesdays, 21:00", subvalue: "LATE NIGHT CODER", tone: "primary" }
  ],
  topicDistribution: [
    { label: "Arrays & Hashing", progress: 90, count: "45/50" },
    { label: "Two Pointers", progress: 65, count: "13/20" },
    { label: "Sliding Window", progress: 40, count: "8/20" },
    { label: "Binary Search", progress: 75, count: "15/20" }
  ],
  difficulty: [
    { label: "LEVEL: EASY", count: "124/150", value: 82.6, tone: "secondary" },
    { label: "LEVEL: MEDIUM", count: "180/250", value: 72, tone: "tertiary" },
    { label: "LEVEL: HARD", count: "38/50", value: 76, tone: "danger" }
  ]
};

export const profileData = {
  name: "AKSHAT",
  joined: "JOINED: OCTOBER 2023",
  totalSolved: "1,248",
  streak: "42 DAYS",
  favoriteTopic: "Dynamic Programming",
  favoriteTopicSolved: "324 SOLVED",
  tags: [
    { label: "#SYSTEM_ARCHITECT", tone: "secondary" },
    { label: "#TYPESCRIPT_GURU", tone: "primary" },
    { label: "#ALGO_CRUSHER", tone: "tertiary" }
  ],
  achievements: [
    {
      title: "FIRST QUESTION",
      text: "The terminal has recognized your presence. Initialization complete.",
      tone: "primary"
    },
    {
      title: "10 DAY STREAK",
      text: "Consistency is the key to mastering the algorithm. Machine mode enabled.",
      tone: "secondary"
    },
    {
      title: "50 SOLVED",
      text: "System capacity expanded. Fifty logic gates successfully navigated.",
      tone: "tertiary"
    }
  ],
  log: [
    { timestamp: "2023-10-24 14:22:10", event: "SOLVE", description: 'Resolved "Invert Binary Tree" in 14ms', status: "SUCCESS", tone: "secondary" },
    { timestamp: "2023-10-24 10:05:45", event: "MILESTONE", description: 'Unlocked Badge: "50 Questions Solved"', status: "RECORDED", tone: "tertiary" },
    { timestamp: "2023-10-23 23:59:58", event: "STREAK", description: "Maintained 42 Day Streak", status: "STABLE", tone: "primary" },
    { timestamp: "2023-10-23 18:12:30", event: "SOLVE", description: 'Resolved "House Robber II" in 21ms', status: "SUCCESS", tone: "secondary" }
  ]
};

export const settingsData = {
  appearance: [
    { label: "Dark Theme", hint: "OPTIMIZE FOR LOW LIGHT", enabled: true },
    { label: "Pixel Mode", hint: "ENABLE RETRO SHARPENING", enabled: false },
    { label: "Compact Layout", hint: "MAXIMIZE DATA DENSITY", enabled: true }
  ],
  notifications: [
    { label: "Daily Digest", hint: "EVERY MORNING AT 08:00", enabled: true },
    { label: "Weekly Progress", hint: "SUNDAY PERFORMANCE RECAP", enabled: false },
    { label: "Push Alerts", hint: "BROWSER SYSTEM PING", enabled: true }
  ],
  privacy: [
    { label: "Public Profile", hint: "VISIBLE TO THE ECOSYSTEM", enabled: false },
    { label: "Show Progress", hint: "BROADCAST ACHIEVEMENTS", enabled: true }
  ],
  storage: [
    { label: "CACHE SIZE", value: "128.4 MB", tone: "primary" },
    { label: "TOTAL ENTRIES", value: "14,204", tone: "secondary" },
    { label: "LAST SYNC", value: "02:45 AM", tone: "tertiary" },
    { label: "STATUS", value: "READY", tone: "text" }
  ]
};
