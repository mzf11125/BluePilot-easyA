import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Validation schemas for API requests
 */

// Agent request schema
export const agentRequestSchema = z.object({
  command: z.string().min(1),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().optional(),
  params: z.record(z.unknown()).optional(),
});

// Policy update schema
export const policyUpdateSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  maxSlippageBps: z.number().min(0).max(10000).optional(),
  maxTradeSize: z.string().optional(),
  cooldownSeconds: z.number().min(0).optional(),
  tokenAllowlist: z.array(z.string()).optional(),
});

// History query schema
export const historyQuerySchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Simulation request schema
export const simulateRequestSchema = z.object({
  command: z.string().min(1),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().optional(),
});

// Execute request schema
export const executeRequestSchema = z.object({
  command: z.string().min(1),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().optional(),
  privateKey: z.string().optional(), // For server-side signing (optional)
});

/**
 * Generic validation middleware factory
 */
export function validate<T extends z.ZodType>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Query parameter validation middleware
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      }
      next(error);
    }
  };
}
