import { z } from 'zod';
import { insertPlaybookSchema, insertStepSchema, insertUserSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const StepSchema = z.object({
  id: z.string(),
  playbookId: z.string(),
  stepNumber: z.number(),
  title: z.string(),
  description: z.string(),
  toolUsed: z.string(),
  promptText: z.string().nullable().optional(),
  expectedOutput: z.string(),
});

const PlaybookResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  category: z.string(),
  difficulty: z.string(),
  estimatedTime: z.string(),
  toolsUsed: z.array(z.string()),
  createdAt: z.union([z.string(), z.date()]).nullable(),
  authorName: z.string(),
  averageRating: z.number().nullable(),
  ratingCount: z.number(),
});

const PlaybookDetailResponseSchema = PlaybookResponseSchema.extend({
  steps: z.array(StepSchema),
});

const AuthUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  googleId: z.string().nullable().optional(),
  authProvider: z.string(),
});

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: AuthUserResponseSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: insertUserSchema,
      responses: {
        200: AuthUserResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    google: {
      method: 'GET' as const,
      path: '/api/auth/google' as const,
      responses: {
        302: z.void(),
      },
    },
    googleCallback: {
      method: 'GET' as const,
      path: '/api/auth/google/callback' as const,
      responses: {
        302: z.void(),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: AuthUserResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  playbooks: {
    list: {
      method: 'GET' as const,
      path: '/api/playbooks' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.string().optional(),
        sort: z.enum(['newest', 'highest_rated']).optional(),
      }).optional(),
      responses: {
        200: z.array(PlaybookResponseSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/playbooks/:slug' as const,
      responses: {
        200: PlaybookDetailResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/playbooks' as const,
      input: insertPlaybookSchema.extend({
        steps: z.array(insertStepSchema),
      }),
      responses: {
        201: PlaybookDetailResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/playbooks/:id' as const,
      input: insertPlaybookSchema.partial().extend({
        steps: z.array(insertStepSchema).optional(),
      }),
      responses: {
        200: PlaybookDetailResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/playbooks/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    rate: {
      method: 'POST' as const,
      path: '/api/playbooks/:id/rate' as const,
      input: z.object({ rating: z.number().min(1).max(5) }),
      responses: {
        200: z.object({ averageRating: z.number(), ratingCount: z.number() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type PlaybookResponse = z.infer<typeof PlaybookResponseSchema>;
export type PlaybookDetailResponse = z.infer<typeof PlaybookDetailResponseSchema>;
