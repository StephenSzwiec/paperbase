import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { 
    createPaper, 
    getAllPapersQueryOptions,
    loadingCreatePaperQueryOptions,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-form-validator";
import { createPaeprSchema } from "@server/sharedTypes";

export const Route = createFileRoute("create")({
    component: CreatePaper, 
});

function CreatePaper() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const form = useForm({
        validator: zodValidator(createPaeprSchema),
        defaultValues: {
            title: "",
            author: "",


    });

