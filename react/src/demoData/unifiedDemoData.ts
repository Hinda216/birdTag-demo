// src/demoData/unifiedDemoData.ts - 升级版本地数据库
// 完整的本地传粉者监测数据库系统

export type DemoTagKey =
  | "honey_bee"
  | "butterfly"
  | "bumblebee"
  | "wasp" 
  | "hoverfly"
  | "beetle"
  | "moth"
  | "ant"
  | "fly"
  | "bee"
  | "mining_bee"
  | "leafcutter_bee";

export interface DemoFileItem {
  id: string;
  url: string;
  name: string;
  type: "image" | "video" | "audio";
  sizeKB: number;
  uploadedAt: string;
  tags: Partial<Record<DemoTagKey, number>>;
  species: DemoTagKey[];
  autoTags: Partial<Record<DemoTagKey, number>>; // AI检测的标签
  manualTags: Partial<Record<DemoTagKey, number>>; // 用户手动标签
  confidence?: number; // AI检测置信度
  location?: string; // 拍摄地点
  behavior?: string; // 行为描述
  isUploaded?: boolean; // 是否为用户上传
}

// 本地图片路径生成器
const localImagePath = (category: string, filename: string) => 
  `/images/pollinators/${category}/${filename}`;

// 预设的高质量传粉者数据库
const pollinatorDatabase: DemoFileItem[] = [
  // 蜜蜂 (Honey Bee) - 主要传粉者
  {
    id: "hb-001",
    url: "/dev/image/apis_mellifera_foraging_01.jpg",
    name: "apis_mellifera_foraging_01.jpg",
    type: "image",
    sizeKB: 324,
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: { honey_bee: 1, bee: 1 },
    species: ["honey_bee", "bee"],
    autoTags: { honey_bee: 3 },
    manualTags: { bee: 1 },
    confidence: 0.94,
    location: "Strawberry farm greenhouse",
    behavior: "Foraging on strawberry flowers",
    isUploaded: false
  },
  {
    id: "hb-002", 
    url: "/dev/image/apis_mellifera_pollination_02.jpg",
    name: "apis_mellifera_pollination_02.jpg",
    type: "image",
    sizeKB: 298,
    uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    tags: { honey_bee: 2, bee: 2 },
    species: ["honey_bee", "bee"],
    autoTags: { honey_bee: 2, bee: 2 },
    manualTags: {},
    confidence: 0.91,
    location: "Commercial pollination site",
    behavior: "Active pollination behavior",
    isUploaded: false
  },

  // 蝴蝶 (Butterfly) - 重要传粉者
  {
    id: "bf-001",
    url: "/dev/image/monarch_nectar_feeding_01.jpg",
    name: "monarch_nectar_feeding_01.jpg", 
    type: "image",
    sizeKB: 287,
    uploadedAt: new Date(Date.now() - 259200000).toISOString(),
    tags: { butterfly: 2 },
    species: ["butterfly"],
    autoTags: { butterfly: 2 },
    manualTags: {},
    confidence: 0.89,
    location: "Native flower meadow",
    behavior: "Nectar feeding on wildflowers",
    isUploaded: false
  },
  {
    id: "bf-002",
    url: "/dev/image/swallowtail_flower_visit_02.jpg",
    name: "swallowtail_flower_visit_02.jpg",
    type: "image",
    sizeKB: 312,
    uploadedAt: new Date(Date.now() - 345600000).toISOString(),
    tags: { butterfly: 1 },
    species: ["butterfly"],
    autoTags: { butterfly: 1 },
    manualTags: {},
    confidence: 0.87,
    location: "Urban pollinator garden",
    behavior: "Extended flower visitation",
    isUploaded: false
  },

  // 熊蜂 (Bumblebee) - 高效传粉者
  {
    id: "bb-001",
    url: "/dev/image/bombus_pollination_event_01.jpg",
    name: "bombus_pollination_event_01.jpg",
    type: "image", 
    sizeKB: 331,
    uploadedAt: new Date(Date.now() - 432000000).toISOString(),
    tags: { bumblebee: 1, bee: 1 },
    species: ["bumblebee", "bee"],
    autoTags: { bumblebee: 1 },
    manualTags: { bee: 1 },
    confidence: 0.96,
    location: "Organic farm field",
    behavior: "Buzz pollination technique",
    isUploaded: false
  },
  {
    id: "bb-002",
    url: "/dev/image/bombus_foraging_behavior_02.jpg",
    name: "bombus_foraging_behavior_02.jpg",
    type: "image",
    sizeKB: 289,
    uploadedAt: new Date(Date.now() - 518400000).toISOString(),
    tags: { bumblebee: 2, bee: 1 },
    species: ["bumblebee", "bee"],
    autoTags: { bumblebee: 2, bee: 1 },
    manualTags: {},
    confidence: 0.93,
    location: "Greenhouse tomato crop",
    behavior: "Systematic foraging pattern",
    isUploaded: false
  },

  // 食蚜蝇 (Hoverfly) - 专业传粉者
  {
    id: "hf-001",
    url: "/dev/image/syrphid_flower_visit_01.jpg",
    name: "syrphid_flower_visit_01.jpg",
    type: "image",
    sizeKB: 267,
    uploadedAt: new Date(Date.now() - 604800000).toISOString(),
    tags: { hoverfly: 2, fly: 1 },
    species: ["hoverfly", "fly"],
    autoTags: { hoverfly: 2 },
    manualTags: { fly: 1 },
    confidence: 0.84,
    location: "Wildflower corridor",
    behavior: "Hovering and flower probing",
    isUploaded: false
  },
  {
    id: "hf-002",
    url: "/dev/image/episyrphus_pollination_02.jpg", 
    name: "episyrphus_pollination_02.jpg",
    type: "image",
    sizeKB: 254,
    uploadedAt: new Date(Date.now() - 691200000).toISOString(),
    tags: { hoverfly: 1, fly: 1 },
    species: ["hoverfly", "fly"],
    autoTags: { hoverfly: 1, fly: 1 },
    manualTags: {},
    confidence: 0.88,
    location: "Agricultural edge habitat",
    behavior: "Pollen collection behavior",
    isUploaded: false
  },

  // 胡蜂 (Wasp) - 次要传粉者
  {
    id: "wp-001",
    url: "/dev/image/vespula_foraging_01.jpg",
    name: "vespula_foraging_01.jpg", 
    type: "image",
    sizeKB: 278,
    uploadedAt: new Date(Date.now() - 777600000).toISOString(),
    tags: { wasp: 1 },
    species: ["wasp"],
    autoTags: { wasp: 1 },
    manualTags: {},
    confidence: 0.82,
    location: "Mixed flower border",
    behavior: "Opportunistic nectar feeding",
    isUploaded: false
  },

  // 甲虫 (Beetle) - 古老的传粉者
  {
    id: "bt-001",
    url: "/dev/image/scarab_pollen_feeding_01.jpg",
    name: "scarab_pollen_feeding_01.jpg",
    type: "image",
    sizeKB: 245,
    uploadedAt: new Date(Date.now() - 864000000).toISOString(),
    tags: { beetle: 1 },
    species: ["beetle"],
    autoTags: { beetle: 1 },
    manualTags: {},
    confidence: 0.93,
    location: "Native plant restoration site",
    behavior: "Pollen and nectar consumption",
    isUploaded: false
  },

];

// 可变数据存储（支持用户上传和操作）
let liveDatabase: DemoFileItem[] = [...pollinatorDatabase];

// ===== 核心API函数 =====

function getAllFiles(): DemoFileItem[] {
  return [...liveDatabase].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

// 智能物种检测模拟（基于文件名）
function simulateSpeciesDetection(filename: string): {
  tags: Partial<Record<DemoTagKey, number>>;
  confidence: number;
} {
  const name = filename.toLowerCase();
  const detected: Partial<Record<DemoTagKey, number>> = {};
  let confidence = 0.75;

  // 基于文件名的智能检测
  const detectionPatterns = {
    honey_bee: /honey.?bee|apis|mellifera/i,
    butterfly: /butterfly|monarch|swallowtail|lepidoptera/i,
    bumblebee: /bumblebee|bumble|bombus/i,
    hoverfly: /hover.?fly|syrphid|episyrphus/i,
    wasp: /wasp|vespula|polistes/i,
    beetle: /beetle|scarab|longhorn/i,
    bee: /\bbee\b|pollinator/i
  };

  // 检测主要物种
  Object.entries(detectionPatterns).forEach(([species, pattern]) => {
    if (pattern.test(name)) {
      detected[species as DemoTagKey] = Math.floor(Math.random() * 3) + 1;
      confidence += 0.1;
    }
  });

  // 如果没有检测到特定物种，随机分配一个常见传粉者
  if (Object.keys(detected).length === 0) {
    const commonSpecies: DemoTagKey[] = ['honey_bee', 'butterfly', 'hoverfly'];
    const randomSpecies = commonSpecies[Math.floor(Math.random() * commonSpecies.length)];
    detected[randomSpecies] = 1;
    confidence = 0.65; // 较低置信度
  }

  return { 
    tags: detected, 
    confidence: Math.min(0.98, confidence) 
  };
}

async function uploadFile(file: File, displayName?: string): Promise<DemoFileItem> {
  const blobUrl = URL.createObjectURL(file);
  const name = displayName || file.name || `pollinator_upload_${Date.now()}.jpg`;
  
  // 智能物种检测
  const detection = simulateSpeciesDetection(name);
  const species = Object.keys(detection.tags) as DemoTagKey[];

  const newItem: DemoFileItem = {
    id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: blobUrl,
    name,
    type: "image", // 实际项目中从file.type推断
    sizeKB: Math.round(file.size / 1024),
    uploadedAt: new Date().toISOString(),
    tags: detection.tags,
    species,
    autoTags: detection.tags,
    manualTags: {},
    confidence: detection.confidence,
    location: "User upload - location unknown",
    behavior: "Unknown behavior - requires manual annotation",
    isUploaded: true
  };

  // 添加到实时数据库
  liveDatabase = [newItem, ...liveDatabase];
  
  // 保存到localStorage以保持状态
  saveToStorage();
  
  return newItem;
}

// 搜索功能
async function searchFiles(
  searchType: "url" | "file" | "tags" | "species",
  queries: any[]
): Promise<Array<{ url: string; metadata?: any }>> {
  
  if (searchType === "url") {
    return liveDatabase.map(f => ({ url: f.url, metadata: f }));
  }
  
  if (searchType === "file") {
    // 模拟"相似文件"搜索 - 返回相关传粉者
    const similar = liveDatabase
      .filter(f => !f.isUploaded) // 排除用户上传的文件
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    return similar.map(f => ({ url: f.url, metadata: f }));
  }

  // tags/species搜索由前端处理
  return liveDatabase.map(f => ({ url: f.url, metadata: f }));
}

// 标签管理
function addTag(fileId: string, species: DemoTagKey, count: number): DemoFileItem | null {
  const fileIndex = liveDatabase.findIndex(f => f.id === fileId);
  if (fileIndex === -1) return null;

  const file = liveDatabase[fileIndex];
  const normalizedSpecies = species.toLowerCase().trim() as DemoTagKey;
  
  // 更新标签
  file.tags[normalizedSpecies] = (file.tags[normalizedSpecies] || 0) + count;
  file.manualTags[normalizedSpecies] = (file.manualTags[normalizedSpecies] || 0) + count;
  
  // 更新物种列表
  if (!file.species.includes(normalizedSpecies)) {
    file.species.push(normalizedSpecies);
  }

  saveToStorage();
  return { ...file };
}

function removeTag(fileId: string, species: DemoTagKey, count?: number): DemoFileItem | null {
  const fileIndex = liveDatabase.findIndex(f => f.id === fileId);
  if (fileIndex === -1) return null;

  const file = liveDatabase[fileIndex];
  const normalizedSpecies = species.toLowerCase().trim() as DemoTagKey;
  const removeCount = count || file.tags[normalizedSpecies] || 0;
  
  // 更新标签
  const newCount = Math.max(0, (file.tags[normalizedSpecies] || 0) - removeCount);
  const newManualCount = Math.max(0, (file.manualTags[normalizedSpecies] || 0) - removeCount);
  
  if (newCount === 0) {
    delete file.tags[normalizedSpecies];
    file.species = file.species.filter(s => s !== normalizedSpecies);
  } else {
    file.tags[normalizedSpecies] = newCount;
  }

  if (newManualCount === 0) {
    delete file.manualTags[normalizedSpecies];
  } else {
    file.manualTags[normalizedSpecies] = newManualCount;
  }

  saveToStorage();
  return { ...file };
}

// 批量操作
function bulkTagOperation(
  fileIds: string[], 
  tags: Partial<Record<DemoTagKey, number>>, 
  operation: 'add' | 'remove'
): void {
  fileIds.forEach(fileId => {
    Object.entries(tags).forEach(([species, count]) => {
      if (operation === 'add') {
        addTag(fileId, species as DemoTagKey, count);
      } else {
        removeTag(fileId, species as DemoTagKey, count);
      }
    });
  });
}

// 数据持久化
function saveToStorage(): void {
  try {
    const uploadedFiles = liveDatabase.filter(f => f.isUploaded);
    localStorage.setItem('pollinator_uploads', JSON.stringify(uploadedFiles));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

function loadFromStorage(): void {
  try {
    const uploaded = JSON.parse(localStorage.getItem('pollinator_uploads') || '[]');
    liveDatabase = [...pollinatorDatabase, ...uploaded];
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    liveDatabase = [...pollinatorDatabase];
  }
}

// 批量删除
function removeByUrls(urls: string[]): number {
  const urlSet = new Set(urls);
  const before = liveDatabase.length;
  liveDatabase = liveDatabase.filter(f => !urlSet.has(f.url));
  saveToStorage();
  return before - liveDatabase.length;
}

// 通过URL获取文件详情
function getFileByUrl(url: string): DemoFileItem | undefined {
  return liveDatabase.find(f => f.url === url);
}

// 重置到初始状态
function resetDatabase(): void {
  liveDatabase = [...pollinatorDatabase];
  localStorage.removeItem('pollinator_uploads');
}

// 初始化：加载已保存的数据
loadFromStorage();

// 导出API
export const unifiedDemoAPI = {
  getAllFiles,
  searchFiles,
  uploadFile,
  addTag,
  removeTag,
  bulkTagOperation,
  removeByUrls,
  deleteByUrls: removeByUrls, // 别名
  getFileByUrl,
  resetDatabase,
  
  // 额外的辅助函数
  getPollinatorStats: () => {
    const stats: Record<string, number> = {};
    liveDatabase.forEach(file => {
      Object.keys(file.tags).forEach(species => {
        stats[species] = (stats[species] || 0) + 1;
      });
    });
    return stats;
  },
  
  getUploadedFiles: () => liveDatabase.filter(f => f.isUploaded),
  getDatabaseFiles: () => liveDatabase.filter(f => !f.isUploaded)
};

export type UnifiedDemoAPI = typeof unifiedDemoAPI;