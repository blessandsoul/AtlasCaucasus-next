import type { LocationSearchResult } from "../types/search.types";

export const useSearchLocations = (query: string, limit: number) => {
    // Mock implementation returning empty array or static data
    return {
        data: [] as LocationSearchResult[],
        isLoading: false
    }
}
