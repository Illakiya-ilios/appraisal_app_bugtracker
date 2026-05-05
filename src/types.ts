export type BugStatus = 'pending' | 'in-progress' | 'completed';

export interface BugReport {
  id: string;
  role?: string;
  title: string;
  description: string;
  status: BugStatus;
  fileData?: string; // base64
  fileName?: string;
  fileType?: string;
  createdAt: number;
  reporterEmail: string;
  reporterName: string;
}
