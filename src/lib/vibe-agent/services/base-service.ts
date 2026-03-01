import { z } from 'zod';
import { adminLogger } from '@/utils/logger';

/**
 * BaseService Pattern (inspired by Cal.com)
 *
 * Provides a type-safe foundation for all services with Zod validation
 * for inputs and outputs.
 */
export abstract class BaseService<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny
> {
  protected abstract inputSchema: TInputSchema;
  protected abstract outputSchema: TOutputSchema;

  /**
   * Validates input, executes internal logic, and validates output.
   */
  public async execute(input: z.infer<TInputSchema>): Promise<z.infer<TOutputSchema>> {
    try {
      // 1. Validate Input
      const validatedInput = this.inputSchema.parse(input);

      // 2. Perform implementation
      const result = await this.implementation(validatedInput);

      // 3. Validate Output
      return this.outputSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        adminLogger.error(`[Service Validation Error] ${this.constructor.name}:`, error.errors);
      } else {
        adminLogger.error(`[Service Execution Error] ${this.constructor.name}:`, error);
      }
      throw error;
    }
  }

  /**
   * The actual business logic to be implemented by sub-classes.
   */
  protected abstract implementation(input: z.infer<TInputSchema>): Promise<z.infer<TOutputSchema>>;
}
