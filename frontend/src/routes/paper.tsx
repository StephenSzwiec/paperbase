import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { createFileRoute } from "@tanstack/react-router";
import {
    getAllPapersQueryOptions,
    loadingCreatePaperQueryOptions,
    deletePaper,
} from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trash } from "lucide-react";

export const Route = createFileRoute("paper")({
    component: Papers,
});

function Papers() { 
    const { isPending, error, data } = useQuery(getAllPapersQueryOptions);
    const { data: loadingCreatePaper } = useQuery(loadingCreatePaperQueryOptions);
    if (error) return "An error has occurred: " + error.message;

    return (
        <div className="p-2 max-w-3xl m-auto"> 
            <Table>
                <TableCaption>Papers</TableCaption>
                <TableHeader>
                    <TableRow> 
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Authors</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Journal</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loadingCreatePaper?.paper && (
                        <TableRow> 
                            <TableCell className="font-medium">
                                <Skeleton className="h-4" />
                            </TableCell>
                            <TableCell>{loadingCreatePaper?.paper.title}</TableCell>
                            <TableCell>{loadingCreatePaper?.paper.authors}</TableCell>
                            <TableCell>{loadingCreatePaper?.paper.year}</TableCell>
                            <TableCell>{loadingCreatePaper?.paper.journal}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    )}
                    {isPending ? Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-medium">
                                <Skeleton className="h-4" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4" />
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    )) : data?.papers.map((paper) => (
                        <TableRow key={paper.id}>
                            <TableCell className="font-medium">{paper.id}</TableCell>
                            <TableCell>{paper.title}</TableCell>
                            <TableCell>{paper.authors}</TableCell>
                            <TableCell>{paper.year}</TableCell>
                            <TableCell>{paper.journal}</TableCell>
                            <TableCell>
                                <Button
                                    onClick={() => {
                                        // do nothing for now
                                    }}
                                    icon={<Trash />}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// function PaperDeleteButton({ id }: { id: number }) {
//



