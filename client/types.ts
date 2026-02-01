
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[];
  timestamp: number;
  reaction?: 'like' | 'dislike' | null;
  senderName?: string;
  senderUid?: string;
}

export interface StoryData {
  id: string;
  category: string;
  time: string;
  title: string;
  content: string;
  rating: string;
  tag: string;
  gradient?: string;
  imageType?: 'radar' | 'gradient' | 'icon';
  // thumbnail property is used for story cover images in Home and Detail views
  thumbnail?: string;
}

export type ChatType = 'ganacsi' | 'shukaansi' | 'waxbarasho' | 'waxbarasho_group' | 'waxbarasho_private' | 'team_zinson';
export type CallType = 'ganacsi' | 'shukaansi' | 'waxbarasho';
export type Language = 'so' | 'en' | 'ar';

export enum NavPage {
  HOME = 'home',
  CHAT_HUB = 'chat_hub',
  CHAT_DETAIL = 'chat_detail',
  CHANNEL = 'channel',
  CALL_HUB = 'call_hub',
  CALL_DETAIL = 'call_detail',
  VIDEO = 'video',
  CALL = 'call',
  SETTING = 'setting',
  PROFILE = 'profile',
  STORY = 'story',
  ADMIN = 'admin',
  TERMS = 'terms',
  PRIVACY = 'privacy',
  ABOUT = 'about',
  MONETIZATION = 'monetization',
  MONETIZATION_GUIDE = 'monetization_guide'
}

export type Theme = 'light' | 'dark';
