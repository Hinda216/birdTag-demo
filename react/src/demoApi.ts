// src/demoApi.ts
export type DemoFile = {
  id: string;
  url: string;               
  tags: Record<string, number>; 
  createdAt: number;
  name?: string;            
};

const KEY = 'demo.files';


const getAll = (): DemoFile[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as DemoFile[]; }
  catch { return []; }
};
const setAll = (arr: DemoFile[]) => localStorage.setItem(KEY, JSON.stringify(arr));


const ensureSeed = (): DemoFile[] => {
  let arr = getAll();
  if (arr.length === 0) {
    arr = [
      { id:'s1', url:'https://picsum.photos/seed/bird-101/900/600', tags:{'wren':2}, createdAt:Date.now()-8e5, name:'seed_wren.jpg' },
      { id:'s2', url:'https://picsum.photos/seed/bird-102/900/600', tags:{'pigeon':3}, createdAt:Date.now()-6e5, name:'seed_pigeon.jpg' },
      { id:'s3', url:'https://picsum.photos/seed/bird-103/900/600', tags:{}, createdAt:Date.now()-4e5, name:'seed_empty.jpg' },
    ];
    setAll(arr);
  }
  return arr;
};

// ===== NOTIFICATIONS (demo) =====
const NOTI_KEY = 'demo.notifications'; // 本地订阅的物种数组：string[]

const getNoti = (): string[] => {
  try { return JSON.parse(localStorage.getItem(NOTI_KEY) || '[]'); }
  catch { return []; }
};
const setNoti = (arr: string[]) => localStorage.setItem(NOTI_KEY, JSON.stringify(arr));

export const demoApi = {
  
  listFiles: async (): Promise<DemoFile[]> => ensureSeed(),

  upload: async (payload: string, name = 'upload.jpg'): Promise<DemoFile> => {
    const arr = getAll();
    const item: DemoFile = { 
      id: `u${Date.now()}`, 
      url: payload, 
      tags: simulateDetection(name), 
      createdAt: Date.now(), 
      name 
    };
    setAll([item, ...arr]);
    return item;
  },

  
  addTag: async (fileId: string, species: string, delta = 1): Promise<DemoFile | undefined> => {
    const arr = ensureSeed();
    const i = arr.findIndex(f => f.id === fileId);
    if (i >= 0) {
      const s = species.toLowerCase().trim();
      arr[i].tags[s] = (arr[i].tags[s] || 0) + delta;
      setAll(arr);
      return arr[i];
    }
  },

  removeTag: async (fileId: string, species: string, delta = Infinity): Promise<DemoFile | undefined> => {
    const arr = ensureSeed();
    const i = arr.findIndex(f => f.id === fileId);
    if (i >= 0) {
      const s = species.toLowerCase().trim();
      const next = Math.max(0, (arr[i].tags[s] || 0) - (isFinite(delta) ? delta : (arr[i].tags[s] || 0)));
      if (next === 0) delete arr[i].tags[s]; else arr[i].tags[s] = next;
      setAll(arr);
      return arr[i];
    }
  },

  // 搜索：AND 语义，满足所有 {name, min} 条件
  searchBySpeciesAll: async (queries: { name: string; min?: number }[]): Promise<DemoFile[]> => {
    const arr = ensureSeed();
    const q = queries
      .map(q => ({ name: q.name.toLowerCase().trim(), min: Math.max(1, Number(q.min || 1)) }))
      .filter(q => q.name);
    if (q.length === 0) return [];
    return arr.filter(f => q.every(cond => (f.tags[cond.name] || 0) >= cond.min));
  },

  // 搜索：ANY 语义，只要命中任一物种即可
  searchBySpeciesAny: async (names: string[]): Promise<DemoFile[]> => {
    const arr = ensureSeed();
    const set = new Set(names.map(n => n.toLowerCase().trim()).filter(Boolean));
    if (set.size === 0) return [];
    return arr.filter(f => Object.keys(f.tags).some(k => set.has(k)));
  },

  // “URL→原图”或“缩略→原图”占位：这里就返回匹配 URL 的项
  findByUrl: async (partial: string): Promise<DemoFile[]> => {
    const arr = ensureSeed();
    const p = partial.trim();
    if (!p) return [];
    return arr.filter(f => f.url.includes(p));
  },

  // 相似搜索（占位）：先返回全部
  similarToFile: async (_base64: string): Promise<DemoFile[]> => {
    const arr = ensureSeed();
    return arr;
  },

  // 方便你在演示前“清库/重置种子”
  reset: () => localStorage.removeItem(KEY),

  notifications: {
    async get(): Promise<{ species: string[] }> {
      return { species: getNoti() };
    },
    async add(name: string): Promise<{ species: string[] }> {
      const n = name.trim().toLowerCase();
      if (!n) return { species: getNoti() };
      const cur = new Set(getNoti());
      cur.add(n);
      const out = Array.from(cur).sort();
      setNoti(out);
      return { species: out };
    },
    async remove(name: string): Promise<{ species: string[] }> {
      const n = name.trim().toLowerCase();
      const out = getNoti().filter(x => x !== n);
      setNoti(out);
      return { species: out };
    },
  },
};

const simulateDetection = (filename: string): Record<string, number> => {
  const species = ['honey_bee', 'butterfly', 'bumblebee', 'hoverfly'];
  const detected = species[Math.floor(Math.random() * species.length)];
  return { [detected]: Math.floor(Math.random() * 3) + 1 };
};
