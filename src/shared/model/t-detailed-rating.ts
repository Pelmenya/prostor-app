export type TCriterionAvg = {
    key: string;
    avg: number;
    count: number;
};

export type TCategoryAvg = {
    key: string;
    avg: number;
    count: number;
    criteria: TCriterionAvg[];
};

export type TReviewItem = {
    id: string;
    author: {
        id: number;
        first_name: string;
        last_name?: string;
        photo_url?: string;
    };
    avg: number;
    comment: string | null;
    reply: string | null;
    repliedBy: { id: number; first_name: string; role?: string } | null;
    repliedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type TDetailedRating = {
    overall: number;
    totalFeedbacks: number;
    categories: TCategoryAvg[];
    reviews: TReviewItem[];
};
