import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreatePlaybook } from "@/hooks/use-playbooks";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, GripVertical, ChevronRight } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { useSeo } from "@/hooks/use-seo";

const stepSchema = z.object({
  stepNumber: z.number(),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description needs more detail"),
  toolUsed: z.string().min(1, "Tool is required"),
  promptText: z.string().optional(),
  expectedOutput: z.string().min(5, "Expected output is required"),
});

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  shortDescription: z.string().min(20, "Provide a better description"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  estimatedTime: z.string().min(1, "Estimated time is required"),
  toolsUsed: z.string().min(1, "At least one tool is required"), // comma separated in UI
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePlaybook() {
  useSeo({
    title: "Create Playbook | PlaybookAI",
    description: "Create and publish your own AI workflow playbook.",
    canonicalPath: "/create",
    noindex: true,
  });

  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { mutateAsync: createPlaybook, isPending } = useCreatePlaybook();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      category: "",
      difficulty: "",
      estimatedTime: "",
      toolsUsed: "",
      steps: [{ stepNumber: 1, title: "", description: "", toolUsed: "", promptText: "", expectedOutput: "" }]
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps"
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      const payload = {
        ...data,
        toolsUsed: data.toolsUsed.split(',').map(t => t.trim()).filter(Boolean),
        steps: data.steps.map((s, i) => ({ ...s, stepNumber: i + 1 }))
      };
      
      const res = await createPlaybook(payload);
      setLocation(`/playbook/${res.slug}`);
    } catch (e) {
      // Handled by mutation toast
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Plus className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sign in to Create</h2>
        <p className="text-muted-foreground mb-6 max-w-md">You need an account to create and publish playbooks for the community.</p>
        <Button onClick={() => setAuthModalOpen(true)} size="lg" className="rounded-full">Log In or Sign Up</Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in-slide">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Create Playbook</h1>
        <p className="text-lg text-muted-foreground">Document your AI workflow and share it with the world.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        {/* Basic Info Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-6">
            <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-base">Playbook Title</Label>
              <Input 
                {...form.register("title")} 
                placeholder="e.g. Complete Blog Post Generation Pipeline" 
                className="h-12 text-lg"
                onChange={(e) => {
                  form.setValue("title", e.target.value);
                  if (!form.formState.dirtyFields.slug) {
                    form.setValue("slug", generateSlug(e.target.value));
                  }
                }}
              />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input {...form.register("slug")} placeholder="e.g. blog-post-pipeline" className="bg-secondary/30" />
              {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Estimated Time</Label>
              <Input {...form.register("estimatedTime")} placeholder="e.g. 15 minutes" />
              {form.formState.errors.estimatedTime && <p className="text-sm text-destructive">{form.formState.errors.estimatedTime.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Short Description</Label>
              <Textarea 
                {...form.register("shortDescription")} 
                placeholder="Briefly describe what this workflow achieves..." 
                className="resize-none h-24"
              />
              {form.formState.errors.shortDescription && <p className="text-sm text-destructive">{form.formState.errors.shortDescription.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select onValueChange={(v) => form.setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Writing">Writing</SelectItem>
                  <SelectItem value="Coding">Coding</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select onValueChange={(v) => form.setValue("difficulty", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.difficulty && <p className="text-sm text-destructive">{form.formState.errors.difficulty.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Tools Used (comma separated)</Label>
              <Input {...form.register("toolsUsed")} placeholder="e.g. ChatGPT, Midjourney, Notion" />
              <p className="text-xs text-muted-foreground">Separate multiple tools with commas.</p>
              {form.formState.errors.toolsUsed && <p className="text-sm text-destructive">{form.formState.errors.toolsUsed.message}</p>}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <h2 className="text-xl font-semibold">Execution Steps</h2>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ stepNumber: fields.length + 1, title: "", description: "", toolUsed: "", expectedOutput: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Step
            </Button>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="relative overflow-visible border-border/60 shadow-sm transition-all hover:border-primary/20">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-sm text-xs font-bold text-muted-foreground z-10 cursor-ns-resize">
                  {index + 1}
                </div>
                
                <CardContent className="p-6 pt-8">
                  <div className="absolute top-4 right-4 flex gap-2">
                    {index > 0 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(index, index - 1)}>
                        <ChevronRight className="w-4 h-4 -rotate-90" />
                      </Button>
                    )}
                    {index < fields.length - 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(index, index + 1)}>
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Step Title</Label>
                      <Input {...form.register(`steps.${index}.title` as const)} placeholder="e.g. Generate Outline" />
                      {form.formState.errors.steps?.[index]?.title && <p className="text-sm text-destructive">{form.formState.errors.steps[index]?.title?.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Tool Used</Label>
                      <Input {...form.register(`steps.${index}.toolUsed` as const)} placeholder="e.g. ChatGPT (GPT-4)" />
                      {form.formState.errors.steps?.[index]?.toolUsed && <p className="text-sm text-destructive">{form.formState.errors.steps[index]?.toolUsed?.message}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Instructions / Description</Label>
                      <Textarea {...form.register(`steps.${index}.description` as const)} placeholder="What exactly should the user do?" className="h-20" />
                      {form.formState.errors.steps?.[index]?.description && <p className="text-sm text-destructive">{form.formState.errors.steps[index]?.description?.message}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Exact Prompt (Optional)</Label>
                      <Textarea {...form.register(`steps.${index}.promptText` as const)} placeholder="Paste the exact prompt string here..." className="font-mono text-sm h-32 bg-secondary/30" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Expected Output</Label>
                      <Input {...form.register(`steps.${index}.expectedOutput` as const)} placeholder="e.g. A 5-point bulleted list of topics" />
                      {form.formState.errors.steps?.[index]?.expectedOutput && <p className="text-sm text-destructive">{form.formState.errors.steps[index]?.expectedOutput?.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {form.formState.errors.steps?.root && <p className="text-sm text-destructive font-medium mt-2">{form.formState.errors.steps.root.message}</p>}
        </section>

        <div className="pt-6 border-t border-border flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => setLocation('/explore')}>Cancel</Button>
          <Button type="submit" size="lg" className="rounded-full px-8 shadow-md" disabled={isPending}>
            {isPending ? "Publishing..." : "Publish Playbook"}
          </Button>
        </div>
      </form>
    </div>
  );
}
