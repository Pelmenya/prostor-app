export type TMessageAttachment = {
    path: string;
    filename: string;
    mimeType: string;
    size: number;
    thumbnailPath?: string;
    width?: number;
    height?: number;
    originalFilename?: string;
    uploadedAt?: string;
    duration?: number;
};
