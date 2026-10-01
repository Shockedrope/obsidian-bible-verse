export interface Topic {
  name: string;
  /** Words (or phrases) in a user's query that signal this topic. */
  triggers: string[];
  /** Curated references, best first. */
  references: string[];
  /** Keyword sent to the ESV search so live results complement the curated list. */
  searchTerm: string;
}

export const TOPICS: Topic[] = [
  {
    name: "Anxiety",
    triggers: ["anxiety", "anxious", "worry", "worried", "worrying", "stress", "stressed"],
    references: ["Philippians 4:6-7", "1 Peter 5:7", "Matthew 6:25-34", "Isaiah 41:10"],
    searchTerm: "anxious",
  },
  {
    name: "Fear",
    triggers: ["fear", "afraid", "scared", "courage", "courageous", "brave"],
    references: ["Isaiah 41:10", "Joshua 1:9", "2 Timothy 1:7", "Psalm 56:3-4", "Psalm 27:1"],
    searchTerm: "fear not",
  },
  {
    name: "Forgiveness",
    triggers: ["forgive", "forgiven", "forgiveness", "forgiving", "pardon"],
    references: ["1 John 1:9", "Ephesians 4:32", "Colossians 3:13", "Psalm 103:12", "Matthew 6:14-15"],
    searchTerm: "forgive",
  },
  {
    name: "Hope",
    triggers: ["hope", "hopeful", "hopeless", "future", "despair"],
    references: ["Romans 15:13", "Jeremiah 29:11", "Lamentations 3:21-23", "Romans 8:24-25", "Hebrews 6:19"],
    searchTerm: "hope",
  },
  {
    name: "Love",
    triggers: ["love", "loving", "loved", "charity"],
    references: ["1 Corinthians 13:4-7", "John 3:16", "1 John 4:7-8", "Romans 8:38-39", "John 15:12-13"],
    searchTerm: "love",
  },
  {
    name: "Faith",
    triggers: ["faith", "believe", "belief", "believing", "doubt"],
    references: ["Hebrews 11:1", "Romans 10:17", "Ephesians 2:8-9", "Mark 9:23-24", "James 2:17"],
    searchTerm: "faith",
  },
  {
    name: "Trust",
    triggers: ["trust", "trusting", "depend", "rely", "surrender"],
    references: ["Proverbs 3:5-6", "Psalm 37:5", "Isaiah 26:3-4", "Jeremiah 17:7-8", "Psalm 56:3-4"],
    searchTerm: "trust",
  },
  {
    name: "Strength",
    triggers: ["strength", "strong", "weak", "weary", "weakness", "perseverance", "persevere", "endurance"],
    references: ["Isaiah 40:29-31", "Philippians 4:13", "Psalm 46:1", "2 Corinthians 12:9-10", "Nehemiah 8:10"],
    searchTerm: "strength",
  },
  {
    name: "Peace",
    triggers: ["peace", "peaceful", "calm", "stillness", "tranquility"],
    references: ["John 14:27", "Philippians 4:7", "Isaiah 26:3", "Colossians 3:15", "Romans 5:1"],
    searchTerm: "peace",
  },
  {
    name: "Wisdom",
    triggers: ["wisdom", "wise", "understanding", "discernment", "knowledge"],
    references: ["James 1:5", "Proverbs 9:10", "Proverbs 2:6", "Proverbs 4:7"],
    searchTerm: "wisdom",
  },
  {
    name: "Joy",
    triggers: ["joy", "joyful", "rejoice", "rejoicing", "happy", "happiness", "glad"],
    references: ["Nehemiah 8:10", "Psalm 16:11", "John 15:11", "Romans 15:13", "James 1:2-4"],
    searchTerm: "joy",
  },
  {
    name: "Grace",
    triggers: ["grace", "gracious", "unmerited", "undeserved"],
    references: ["Ephesians 2:8-9", "2 Corinthians 12:9", "Romans 3:23-24", "Hebrews 4:16", "Titus 2:11-12"],
    searchTerm: "grace",
  },
  {
    name: "Salvation",
    triggers: ["salvation", "saved", "save", "gospel", "eternal life", "redemption"],
    references: ["John 3:16", "Romans 10:9-10", "Ephesians 2:8-9", "Romans 6:23", "Acts 4:12"],
    searchTerm: "saved",
  },
  {
    name: "Prayer",
    triggers: ["prayer", "pray", "praying", "intercession"],
    references: ["Matthew 6:9-13", "Philippians 4:6", "1 Thessalonians 5:16-18", "James 5:16", "Matthew 7:7-8"],
    searchTerm: "pray",
  },
  {
    name: "Patience",
    triggers: ["patience", "patient", "waiting", "wait"],
    references: ["Psalm 27:14", "Isaiah 40:31", "James 5:7-8", "Romans 12:12", "Galatians 6:9"],
    searchTerm: "wait",
  },
  {
    name: "Comfort",
    triggers: ["comfort", "grief", "grieving", "sorrow", "mourning", "mourn", "sad", "loss", "lonely", "loneliness"],
    references: ["2 Corinthians 1:3-4", "Psalm 34:18", "Psalm 23:4", "Matthew 5:4", "Revelation 21:4"],
    searchTerm: "comfort",
  },
  {
    name: "Suffering",
    triggers: ["suffering", "trial", "trials", "hardship", "pain", "persecution", "difficult", "struggle"],
    references: ["Romans 5:3-5", "James 1:2-4", "Romans 8:18", "2 Corinthians 4:16-18", "1 Peter 4:12-13"],
    searchTerm: "suffering",
  },
  {
    name: "Guidance",
    triggers: ["guidance", "guide", "direction", "decision", "decisions", "will of god", "lost"],
    references: ["Proverbs 3:5-6", "Psalm 119:105", "Psalm 32:8", "Isaiah 30:21", "Psalm 37:23-24"],
    searchTerm: "guide",
  },
  {
    name: "Protection",
    triggers: ["protect", "protection", "safe", "safety", "refuge", "shelter", "shield"],
    references: ["Psalm 91:1-2", "Psalm 121:7-8", "Proverbs 18:10", "Psalm 46:1", "2 Thessalonians 3:3"],
    searchTerm: "refuge",
  },
  {
    name: "Humility",
    triggers: ["humble", "humility", "pride", "proud", "arrogance"],
    references: ["Philippians 2:3-4", "James 4:10", "1 Peter 5:5-6", "Proverbs 11:2", "Micah 6:8"],
    searchTerm: "humble",
  },
  {
    name: "Anger",
    triggers: ["anger", "angry", "wrath", "temper", "bitterness", "resentment"],
    references: ["Ephesians 4:26-27", "James 1:19-20", "Proverbs 15:1", "Proverbs 29:11", "Colossians 3:8"],
    searchTerm: "anger",
  },
  {
    name: "Gratitude",
    triggers: ["thankful", "thanks", "thanksgiving", "gratitude", "grateful", "praise"],
    references: ["1 Thessalonians 5:16-18", "Psalm 107:1", "Psalm 100:4-5", "Colossians 3:15-17", "Psalm 136:1"],
    searchTerm: "thanks",
  },
  {
    name: "Generosity",
    triggers: ["generous", "generosity", "giving", "give", "money", "wealth", "tithe", "tithing", "riches"],
    references: ["2 Corinthians 9:6-7", "Proverbs 11:25", "Luke 6:38", "Acts 20:35", "Matthew 6:19-21"],
    searchTerm: "generous",
  },
  {
    name: "Rest",
    triggers: ["rest", "sabbath", "burnout", "exhausted", "tired", "overwhelmed"],
    references: ["Matthew 11:28-30", "Psalm 23:1-3", "Exodus 33:14", "Psalm 62:1", "Hebrews 4:9-10"],
    searchTerm: "rest",
  },
  {
    name: "Temptation",
    triggers: ["temptation", "tempted", "tempt", "resist", "sin", "sinning", "lust"],
    references: ["1 Corinthians 10:13", "James 4:7", "Hebrews 4:15-16", "Matthew 26:41", "James 1:12-15"],
    searchTerm: "temptation",
  },
  {
    name: "Healing",
    triggers: ["heal", "healing", "healed", "sick", "sickness", "illness", "disease"],
    references: ["Psalm 147:3", "Jeremiah 17:14", "James 5:14-15", "Isaiah 53:5", "Psalm 103:2-3"],
    searchTerm: "heal",
  },
];

/**
 * Returns up to `max` topics ranked by how many of their triggers appear in the
 * query. `terms` are the normalized search words; `rawQuery` is used to catch
 * multi-word triggers like "eternal life".
 */
export function findTopics(terms: string[], rawQuery: string, max = 2): Topic[] {
  const lowered = rawQuery.toLowerCase();
  const scored: { topic: Topic; score: number }[] = [];

  for (const topic of TOPICS) {
    let score = 0;
    for (const trigger of topic.triggers) {
      if (trigger.indexOf(" ") >= 0) {
        if (lowered.indexOf(trigger) >= 0) score++;
      } else if (terms.indexOf(trigger) >= 0) {
        score++;
      }
    }
    if (score > 0) scored.push({ topic, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((s) => s.topic);
}
