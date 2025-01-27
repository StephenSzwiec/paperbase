import { hc } from "hono/cilent";
import { type ApiRoutes } from "@server/app";
import { queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import { type CreatePaper } from "@server/sharedTypes";

const client = hc<ApiRoutes>("/");

export const api = client.api;

async function getAllPapers = () => {
    const res = await api.papers.$get();
    if (!res.ok) { 
        throw new Error("Failed to fetch papers"); 
    } 
    const data = await res.json();
    return data;
}

export const getAllPapersQueryOptions = queryOptions({
    queryKey: ["get-all-papers"],
    queryFn: getAllPapers,
    staleTime: 1000 * 60 * 5, // 5 minutes
});

async function useGetPaper = (paperId: number) => {
    return useQuery({
        queryKey: ["paper", paperId],
        queryFn: async () => {
            const res = await api.papers[":id".$get({
                param: { id: paperId.toString() },
            });
            return await res.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

async function createPaper({ input } : { input: CreatePaper }) {
    const res = await api.papers.$post({ json: input });
    if (!res.ok) {
        throw new Error("Failed to create paper");
    }
    const newPaper = await res.json();
    return newPaper;
}

async function updatePaper = ( paperId: number, input: CreatePaper ) => {
    const res = await api.papers[":id"].$put({
        param: { id: paperId.toString() },
        json: input,
    });
    if (!res.ok) {
        throw new Error("Failed to update paper");
    }
    const updatedPaper = await res.json();
    return updatedPaper;
};

async function deletePaper = (paperId: number) => {
    const res = await api.papers[":id"].$delete({
        param: { id: paperId.toString() },
    });
    if (!res.ok) {
        throw new Error("Failed to delete paper");
    }
    return;
};
