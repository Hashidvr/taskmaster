import api from "./axios";

export async function fetchAllPages(endpoint) {
    let url = endpoint;
    let allResults = [];

    while (url) {
        const response = await api.get(url);

        allResults = [
            ...allResults,
            ...response.data.results,
        ];

        url = response.data.next;
    }

    return allResults;
}