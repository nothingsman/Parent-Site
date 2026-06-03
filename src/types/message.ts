export interface ChatThread {
  id: string;
  parent: string;
  teacher: string;
  student: string;
  organization: string;
  branch: string;
  unread_count: number;
  last_read_at: string | null;
  latest_message: ChatMessage | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread: string;
  sender: string;
  sender_id: string;
  text: string;
  attachment: string | null;
  read_by_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ThreadMessage {
  sender: 'teacher' | 'parent';
  text: string;
  time: string;
  readAt?: string;
}

export interface MessageThread {
  dateGroup: string;
  messages: ThreadMessage[];
}

export interface MessageEntry {
  id: string;
  teacherName: string;
  teacherInitials: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  avatarColor?: string;
}

export interface MarkReadResponse {
  count: number;
}

export interface ResolveThreadResponse {
  thread: ChatThread | null;
  messages: ChatMessage[];
}

export interface CreateChatThreadRequest {
  parent: string;
  teacher: string;
  student: string;
}

export interface SendChatMessageRequest {
  text?: string;
  attachment?: string;
}

export interface MediaUploadInit {
  id: string;
  key: string;
  upload_id: string;
  expires_in: number;
}

export interface MultipartPartUrl {
  presigned_url: string;
  expires_in: number;
}

export interface MultipartUploadPart {
  part_number: number;
  etag: string;
}

export interface MultipartCompleteResponse {
  id: string;
  status: string;
  etag: string;
  size: number;
}

export interface MediaUploadAbortResponse {
  data: null;
  message: string | null;
}

export interface ChatAttachmentFile {
  id: string;
  file_name: string;
  content_type: string;
  size: number | null;
  download_url: string | null;
}

export interface DraftChatContact {
  key: string;
  teacherId: string;
  teacherName: string;
  teacherInitials: string;
  subjectName: string;
  gradeLabel: string;
  studentName: string;
  avatarBg: string;
  existingThreadId: string | null;
}

export interface UploadState {
  status: "idle" | "uploading" | "uploaded" | "error";
  file: File | null;
  mediaId: string | null;
  progressLabel: string | null;
  error: string | null;
}
