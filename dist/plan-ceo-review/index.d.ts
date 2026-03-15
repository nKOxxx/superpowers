interface CEOReviewOptions {
    feature: string;
    goal?: string;
    audience?: string;
    competition?: string;
    trust?: string;
}
export declare function ceoReviewCommand(options: CEOReviewOptions): Promise<void>;
export {};
