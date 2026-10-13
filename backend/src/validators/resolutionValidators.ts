import { z } from 'zod';

export const approvedChangeSchema = z.object({
  fieldPath: z.string().trim().min(1, 'Field path is required'),
  value: z.number().positive('Approved quantity or value must be positive')
});

export const resolveCandidateSchema = z.object({
  decision: z.enum(['CONFIRMED_DUPLICATE', 'CONFIRMED_UPDATE', 'CONFIRMED_SEPARATE', 'KEEP_PENDING'], {
    errorMap: () => ({ message: 'Decision must be CONFIRMED_DUPLICATE, CONFIRMED_UPDATE, CONFIRMED_SEPARATE, or KEEP_PENDING' })
  }),
  canonicalOrderId: z.number().int().positive().optional(),
  approvedChanges: z.array(approvedChangeSchema).optional(),
  reason: z.string().trim().max(1000).optional(),
  expectedCandidateStatus: z.enum(['PENDING', 'IN_REVIEW', 'RESOLVED_UPDATE', 'RESOLVED_DUPLICATE', 'RESOLVED_SEPARATE']).default('PENDING'),
  expectedCanonicalVersion: z.number().int().positive().optional(),
  idempotencyKey: z.string().trim().min(1, 'Idempotency key is required').max(128)
}).superRefine((data, ctx) => {
  if (data.decision === 'CONFIRMED_UPDATE') {
    if (!data.reason || data.reason.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'A justified operational reason is required for CONFIRMED_UPDATE.'
      });
    }
    if (!data.approvedChanges || data.approvedChanges.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['approvedChanges'],
        message: 'Explicit approved changes are required for CONFIRMED_UPDATE.'
      });
    }
  }
});

export type ApprovedChange = z.infer<typeof approvedChangeSchema>;
export type ResolveCandidateInput = z.infer<typeof resolveCandidateSchema>;
