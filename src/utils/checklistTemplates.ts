import type { ChecklistCategory, Importance } from '../types/enums';

export interface ChecklistTemplate {
  title: string;
  category: ChecklistCategory;
  importance: Importance;
}

/** 行前檢查表內建範本（一鍵套用，可再增減） */
export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  { title: '確認護照效期（6 個月以上）', category: 'document', importance: 'high' },
  { title: '確認是否需要簽證', category: 'document', importance: 'high' },
  { title: '台灣駕照日文譯本', category: 'document', importance: 'medium' },
  { title: '購買旅遊保險', category: 'document', importance: 'high' },
  { title: '網卡 / SIM / eSIM', category: 'transport', importance: 'medium' },
  { title: '轉接頭 / 充電器', category: 'packing', importance: 'medium' },
  { title: '常備藥（感冒、腸胃、暈車）', category: 'packing', importance: 'medium' },
];
