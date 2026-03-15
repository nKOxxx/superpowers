interface CEORviewOptions {
    feature: string;
    goal?: string;
    audience?: string;
    competition?: string;
    trust?: string;
    brand?: string;
    attention?: string;
    trustScore?: string;
}
export declare function ceoReviewCommand(options: CEORviewOptions): Promise<void>;
export {};
