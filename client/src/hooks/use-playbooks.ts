import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type PlaybookListResponse = z.infer<typeof api.playbooks.list.responses[200]>;
type PlaybookDetailResponse = z.infer<typeof api.playbooks.get.responses[200]>;
type CreatePlaybookInput = z.infer<typeof api.playbooks.create.input>;
type UpdatePlaybookInput = z.infer<typeof api.playbooks.update.input>;

export function usePlaybooks(params?: { search?: string; category?: string; difficulty?: string; sort?: 'newest' | 'highest_rated' }) {
  return useQuery<PlaybookListResponse>({
    queryKey: [api.playbooks.list.path, params],
    queryFn: async () => {
      const urlParams = new URLSearchParams();
      if (params?.search) urlParams.append('search', params.search);
      if (params?.category) urlParams.append('category', params.category);
      if (params?.difficulty) urlParams.append('difficulty', params.difficulty);
      if (params?.sort) urlParams.append('sort', params.sort);
      
      const res = await fetch(`${api.playbooks.list.path}?${urlParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch playbooks");
      return api.playbooks.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlaybook(slug: string) {
  return useQuery<PlaybookDetailResponse>({
    queryKey: [api.playbooks.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.playbooks.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) throw new Error("Playbook not found");
      if (!res.ok) throw new Error("Failed to fetch playbook");
      return api.playbooks.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

export function useCreatePlaybook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CreatePlaybookInput) => {
      const res = await fetch(api.playbooks.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create playbook");
      }
      return api.playbooks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.playbooks.list.path] });
      toast({ title: "Success!", description: "Playbook created successfully." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });
}

export function useUpdatePlaybook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdatePlaybookInput }) => {
      const url = buildUrl(api.playbooks.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update playbook");
      return api.playbooks.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.playbooks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.playbooks.get.path, data.slug] });
      toast({ title: "Success!", description: "Playbook updated." });
    },
  });
}

export function useDeletePlaybook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.playbooks.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete playbook");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.playbooks.list.path] });
      toast({ title: "Deleted", description: "Playbook removed." });
    },
  });
}

export function useRatePlaybook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, rating, slug }: { id: string, rating: number, slug: string }) => {
      const url = buildUrl(api.playbooks.rate.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      return api.playbooks.rate.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.playbooks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.playbooks.get.path, variables.slug] });
      toast({ title: "Rated!", description: "Your feedback has been saved." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Rating failed", description: error.message });
    }
  });
}
