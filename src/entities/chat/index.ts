// model
export { EChatType } from './model/e-chat-type';
export { EChatStatus } from './model/e-chat-status';
export { EMessageType } from './model/e-message-type';
export type { TChatParticipant } from './model/t-chat-participant';
export type { TMessageAttachment } from './model/t-message-attachment';
export type { TMessage, TChat, TChatWithUnread, TGetMessagesResponse } from './model/t-chat';

// api
export {
    chatKeys,
    useGetChatByOrderId,
    useGetUserActiveChats,
    useGetUnreadCount,
    useCreateMessage,
    useMarkMessagesAsRead,
    useUploadChatFile,
} from './api/chat.api';

// lib
export { formatMessageDate } from './lib/format-message-date';
export { getStorageUrl } from './lib/get-storage-url';
export { validateFileSizes } from './lib/validate-file-size';
export { useChatMessages } from './lib/hooks/use-chat-messages';
export { useMarkAsRead } from './lib/hooks/use-mark-as-read';

// ui
export { MessageBubble } from './ui/message-bubble/message-bubble';
export { MessageInput } from './ui/message-input/message-input';
export { ImageAttachment } from './ui/image-attachment/image-attachment';
export { FileAttachment } from './ui/file-attachment/file-attachment';
export { FileUploadButton } from './ui/file-upload-button/file-upload-button';
export { UploadPreview } from './ui/upload-preview/upload-preview';
export type { TUploadFile } from './ui/upload-preview/upload-preview-item';
export { ImageLightbox } from './ui/image-lightbox/image-lightbox';
