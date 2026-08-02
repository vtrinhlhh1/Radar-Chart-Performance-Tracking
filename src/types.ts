export type PaperSize = 'a4' | 'a5' | 'a3' | 'letter' | 'legal' | 'square';
export type PaperOrientation = 'portrait' | 'landscape';

export interface CircleConfig {
  count: number; // Amount of circles (e.g., 6)
  circleNames: string[]; // Names for each circle e.g. ["A1", "A2", "B1", "B2", "C1", "C2"]
  showCircleNames: boolean;
  circleNameFontSize: number;
}

export interface CriteriaGroup {
  id: string;
  name: string;
  showName: boolean;
  fontSize: number;
  rotation: number; // Custom rotation offset in degrees
  color: string;
  showShape?: boolean; // Enable/disable badge shape background on chart
}

export interface Criterion {
  id: string;
  groupId: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
}

// Student ID -> Criterion ID -> score number
export type PerformanceMap = Record<string, Record<string, number>>;

export interface MiniTabChartSettings {
  isFilled: boolean; // Filled vs pure line
  lineColor: string;
  fillOpacity: number;
  showPoints: boolean;
}

export interface MiniTab {
  id: string;
  name: string;
  circles: CircleConfig;
  groups: CriteriaGroup[];
  criteria: Criterion[];
  students: Student[];
  performances: PerformanceMap;
  chartSettings: MiniTabChartSettings;
}

export interface ClassTab {
  id: string;
  name: string;
  miniTabs: MiniTab[];
  activeMiniTabId: string;
  // Selected mini tab IDs for Overall summarization view
  selectedMiniTabIdsForOverall: string[];
}

export interface GradeTabGroup {
  id: string;
  name: string;
  tabs: ClassTab[];
  activeTabId: string;
  isOverallActive?: boolean; // If overall view for active tab is selected
}

export interface AppState {
  tabGroups: GradeTabGroup[];
  activeTabGroupId: string;
  // Google Drive connection info
  driveSyncedFileId?: string;
  lastSyncedAt?: string;
  isAutoSyncEnabled: boolean;
}

export interface GoogleDriveUser {
  email?: string;
  name?: string;
  picture?: string;
  accessToken?: string;
}
