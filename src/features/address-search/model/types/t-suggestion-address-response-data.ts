import type { TSuggestion } from './t-suggestion';

export type TSuggestionAddressResponseData = {
    query: string;
    requestProcessTime: number;
    suggestions: TSuggestion[];
};
