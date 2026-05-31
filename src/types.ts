export interface Message {
  id: string;
  text: string;
  image?: string;
  audio?: string;
  sender: string;
  recipient?: string;
  senderAvatar?: string;
  timestamp: number;
}
