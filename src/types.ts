import { createContext, Dispatch, SetStateAction } from 'react';

export type AppState = 'CHAOS' | 'FORMED';

// 指针坐标接口 (归一化 0-1)
export interface PointerCoords {
  x: number;
  y: number;
}

export interface TreeContextType {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;

  // --- 交互状态 ---
  pointer: PointerCoords | null;   // 指针位置
  setPointer: (coords: PointerCoords | null) => void;

  clickTrigger: number;            // 点击信号 (每次点击更新为当前时间戳)
  setClickTrigger: (time: number) => void;

  selectedPhotoUrl: string | null; // 当前选中的照片
  setSelectedPhotoUrl: (url: string | null) => void;

  // 新增：缩放偏移量 (双手手势控制)
  zoomOffset: number;
  setZoomOffset: Dispatch<SetStateAction<number>>;

  // 新增：认证状态和密钥管理
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  // 新增：信件状态
  isLetterOpen: boolean;
  setIsLetterOpen: (open: boolean) => void;
  letterContent: string;
  setLetterContent: (content: string) => void;
  
  secretKey: string;
  setSecretKey: (key: string) => void;

  // --- 升级：动态数据源 ---
  photos: { url: string; fileName?: string }[];
  setPhotos: (photos: { url: string; fileName?: string }[]) => void;
  isCreatorMode: boolean;
  setIsCreatorMode: (isCreator: boolean) => void;
  treeId: string | null;
  setTreeId: (id: string | null) => void;
}

export interface ParticleData {
  id: string;
  chaosPos: [number, number, number];
  treePos: [number, number, number];
  chaosRot: [number, number, number];
  treeRot: [number, number, number];
  scale: number;
  color: string;
  image?: string;
  year?: number; // 新增：照片年份
  month?: string;
  type: 'LEAF' | 'ORNAMENT' | 'PHOTO';
}

export const TreeContext = createContext<TreeContextType>({} as TreeContextType);
