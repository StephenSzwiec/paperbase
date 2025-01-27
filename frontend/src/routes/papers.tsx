import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import {
  getAllPapersQueryOptions,
  loadingCreatePaperQueryOptions,
  deletePaper,
} from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/papers')({
  component: Papers,
})

function Papers() {
  const { isPending, error, data } = useQuery(getAllPapersQueryOptions)
  const { data: loadingCreatePaper } = useQuery(loadingCreatePaperQueryOptions)
  const queryClient = useQueryClient()

  if (error) return 'An error has occurred: ' + error.message

  return (
    <div className="p-2 max-w-3xl m-auto">
      <Table>
        <TableCaption>Papers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>paper_title</TableHead>
            <TableHead>Authors</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingCreatePaper?.paper && (
            <TableRow>
              <TableCell className="font-medium">
                <Skeleton className="h-4" />
              </TableCell>
              <TableCell>{loadingCreatePaper?.paper.paper_title}</TableCell>
              <TableCell>{loadingCreatePaper?.paper.authors}</TableCell>
              <TableCell>{loadingCreatePaper?.paper.year}</TableCell>
              <TableCell>{loadingCreatePaper?.paper.journal}</TableCell>
              <TableCell>{loadingCreatePaper?.paper.volume}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          )}
          {isPending
            ? Array(6)
                .fill(0)
                .map((_, i) => (
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
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
            : data?.papers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell className="font-medium">{paper.id}</TableCell>
                  <TableCell>{paper.paper_title}</TableCell>
                  <TableCell>{paper.authors}</TableCell>
                  <TableCell>{paper.year}</TableCell>
                  <TableCell>{paper.journal}</TableCell>
                  <TableCell>{paper.volume}</TableCell>
                  <TableCell>
                    <PaperEditButton id={paper.id} />
                    <PaperDeleteButton id={paper.id} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PaperEditButton({ id }) {
  return (
    <Button
      className="mr-2"
      onClick={() => {
        toast('Edit not implemented yet')
      }}
    >
      Edit
    </Button>
  )
}

function PaperDeleteButton({ id }: { id: number }) {
    const queryClient = useQueryClient()
    const mutation = useMutation({
        mutationFn: deletePaper,
        onError: () => { 
            toast("Error", {
                description: `Failed to delete paper with id ${id}`
            });
        },
        onSuccess: () => {
            toast("Paper Deleted", {
                description: `Paper with id ${id} has been deleted`
            });
            queryClient.setQueryData(
                getAllPapersQueryOptions.queryKey,
                (existingPapers) => ({
                    ...existingPapers,
                    papers: existingPapers!.papers.filter((paper) => paper.id !== id),
                })
            );
        },
    });

    return (
        <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id })}
            variant="outline"
            size="icon"
        >
            {mutation.isPending ? "..." : <Trash className="h-4 w-4" />}
        </Button>
    );
}
