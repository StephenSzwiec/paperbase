import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useForm, FieldApi } from '@tanstack/react-form'
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

function CreatePaper() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm({
    validatorAdapter: zodValidator,
    defaultValues: {
      paper_title: '',
      authors: '',
      year: 0,
      journal: '',
      volume: '',
      pdf: null as File | null,
    },
    onSubmit: async ({ values }) => {
      const existingPapers = await queryClient.ensureQueryData(
        getAllPapersQueryOptions
      );

      // Navigate to the papers list page
      navigate({ to: "/papers" });

      // Set loading state
      queryClient.setQueryData(loadingCreatePaperQueryOptions.queryKey, {
          paper_title: values.paper_title,
          authors: values.authors,
          year: values.year,
          journal: values.journal,
          volume: values.volume,
          pdf: values.pdf,
      });

      try {
        // Call the API to create the paper
        const newPaper = await createPaper({ values });

        // Update the query data with the new paper
        queryClient.setQueryData(getAllPapersQueryOptions.queryKey, {
          ...existingPapers,
          papers: [newPaper, ...existingPapers.papers],
        });

        // Show success toast
        toast('Paper created successfully', {
          description: `Successfully created paper: ${newPaper.id}`,
        })
      } catch (error) {
        // Show error toast
        toast('Error creating paper', {
          description: `Failed to create paper: ${error.message}`,
        })
      } finally {
        // Clear loading state
        queryClient.setQueryData(loadingCreatePaperQueryOptions.queryKey, {})
      }
    },
  })

  return (
    <div className="p-2">
      <h2>Create Paper</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="flex flex-col gap-y-4 max-w-xl m-auto"
          encType="multipart/form-data" // Important for file uploads
        >
          <form.Field
            name="paper_title"
            validators={{
              onChange: createPaperSchema.shape.paper_title,
            }}
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Title</Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                <Label htmlFor={field.name}>Authors</Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                <Label htmlFor={field.name}>Year</Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                <Label htmlFor={field.name}>Journal</Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                <Label htmlFor={field.name}>Volume</Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                <Label htmlFor={field.name}>PDF File</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="file"
                  accept="application/pdf"
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
    </div>
  )
}

