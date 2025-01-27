import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import {
  createPaper,
  getAllPapersQueryOptions,
  loadingCreatePaperQueryOptions,
} from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { createPaperSchema } from '@server/sharedTypes'

export const Route = createFileRoute('/create')({
  component: CreatePaper,
})

// papers: { id, title, authors, year, journal, volume, pdf(blob)}
function CreatePaper() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm({
    validatorAdapter: zodValidator,
    defaultValues: {
      paper_title: '',
      authors: '',
      year: '',
      journal: '',
      volume: '',
      pdf: null as File | null,
    },
    onSubmit: async ({ values }) => {
      const existingPapers = await queryClient.ensureQueryData(
        getAllPapersQueryOptions,
      )

      navigate({ to: '/papers' })

      //loading state
      queryClient.setQueryData(loadingCreatePaperQueryOptions.queryKey, {
        paper: {
          paper_title: values.paper_title,
          authors: values.authors,
          year: values.year,
          journal: values.journal,
          volume: values.volume,
          pdf: values.pdf,
        },
      })

      try {
        const formData = new FormData()
        formData.append('paper_title', values.paper_title)
        formData.append('authors', values.authors)
        formData.append('year', values.year)
        formData.append('journal', values.journal)
        formData.append('volume', values.volume)
        if (values.pdf) {
            formData.append('pdf', values.pdf)
        }
        const newPaper = await createPaper(formData)
        queryClient.setQueryData(getAllPapersQueryOptions.queryKey, {
          ...existingPapers,
          papers: [newPaper, ...existingPapers.papers],
        })
        toast('Paper created successfully', {
          description: `Successfully created paper: ${newPaper.id}`,
        })
      } catch (error) {
        toast('Error creating paper', {
          description: `Failed to create paper: ${error.message}`,
        })
      } finally {
        queryClient.setQueryData(loadingCreatePaperQueryOptions.queryKey, {})
      }
    },
  })

  return (
    <div className="p-2">
      <h2>Create Paper</h2>
      <form.Provider>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="flex flex-col gap-y-4 max-w-xl m-auto"
          encType="multipart/form-data" // for file uploads
        >
          <form.Field
            name="paper_title"
            validators={{
              onChange: createPaperSchema.shape.paper_title,
            }}
            children={(field) => (
              <div>
                <Label htmlFor={field.paper_title}>Title</Label>
                <Input
                  id={field.name}
                  title={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.touchedErrors ? (
                  <em>{field.state.meta.touchedErrors}</em>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="authors"
            validators={{
              onChange: createPaperSchema.shape.authors,
            }}
            children={(field) => (
              <div>
                <Label htmlFor={field.authors}>Authors</Label>
                <Input
                  id={field.name}
                  authors={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.touchedErrors ? (
                  <em>{field.state.meta.touchedErrors}</em>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="year"
            validators={{
              onChange: createPaperSchema.shape.year,
            }}
            children={(field) => (
              <div>
                <Label htmlFor={field.year}>Year</Label>
                <Input
                  id={field.name}
                  year={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.touchedErrors ? (
                  <em>{field.state.meta.touchedErrors}</em>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="journal"
            validators={{
              onChange: createPaperSchema.shape.journal,
            }}
            children={(field) => (
              <div>
                <Label htmlFor={field.journal}>Journal</Label>
                <Input
                  id={field.name}
                  journal={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.touchedErrors ? (
                  <em>{field.state.meta.touchedErrors}</em>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="volume"
            validators={{
              onChange: createPaperSchema.shape.volume,
            }}
            children={(field) => (
              <div>
                <Label htmlFor={field.volume}>Volume</Label>
                <Input
                  id={field.name}
                  volume={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.touchedErrors ? (
                  <em>{field.state.meta.touchedErrors}</em>
                ) : null}
              </div>
            )}
          />

         <form.Field
            name="pdf"
            validators={{
              onChange: createPaperSchema.shape.pdf,
            }}
            children={(field) => (
                <div>
                    <Label htmlFor={field.pdf}>PDF</Label>
                    <Input
                        id={field.name}
                        pdf={field.name}
                        type="file"
                        accept=".pdf application/pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            field.handleChange(file || null)
                        }}
                    />
                    {field.state.meta.touchedErrors ? (
                        <em>{field.state.meta.touchedErrors}</em>
                    ) : null}
                </div>
            )}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button className="mt-4" type="submit" disabled={!canSubmit}>
                {isSubmitting ? 'Creating...' : 'Create Paper'}
              </Button>
            )}
          />
        </form>
      </form.Provider>
    </div>
  );
}
