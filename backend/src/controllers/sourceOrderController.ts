import { Request, Response, NextFunction } from 'express';
import { 
  createSourceOrderSchema, 
  extractOrderTextSchema, 
  listSourceOrdersQuerySchema 
} from '../validators/sourceOrderValidators.js';
import { sourceOrderService } from '../services/sourceOrderService.js';
import { extractionService } from '../services/extractionService.js';
import { csvImportService } from '../services/csvImportService.js';

export class SourceOrderController {
  /**
   * POST /api/v1/source-orders
   * Ingest a single source order with idempotency check.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createSourceOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid source order payload',
            details: parsed.error.format(),
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      const result = await sourceOrderService.ingestSourceOrder(req.tenant.id, parsed.data);
      const statusCode = result.isDuplicate ? 200 : 201;

      res.status(statusCode).json({
        success: true,
        isDuplicate: result.isDuplicate,
        sourceOrderId: result.sourceOrderId,
        order: result.order,
        message: result.message,
        requestId: req.headers['x-request-id']
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/source-orders/extract
   * Extract informal text order candidates without committing canonical state.
   */
  async extract(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = extractOrderTextSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid extraction input',
            details: parsed.error.format(),
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      try {
        const extracted = await extractionService.extractFromText(
          parsed.data.messageText,
          parsed.data.channel,
          parsed.data.customerPhone,
          parsed.data.knownCustomerName,
          req.tenant?.id || 1
        );

        res.status(200).json({
          success: true,
          extracted,
          requestId: req.headers['x-request-id']
        });
      } catch (extractErr: any) {
        // Security & Reliability Invariant: Preserve original source input if extraction fails
        res.status(422).json({
          error: {
            code: 'EXTRACTION_FAILED',
            message: extractErr.message || 'Failed to extract structured order from provided text',
            originalInput: {
              messageText: parsed.data.messageText,
              channel: parsed.data.channel,
              customerPhone: parsed.data.customerPhone,
              knownCustomerName: parsed.data.knownCustomerName
            },
            requestId: req.headers['x-request-id']
          }
        });
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/source-orders/import-csv
   * Batch ingest CSV records with row-by-row error reporting.
   */
  async importCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let csvContent = '';
      if (typeof req.body === 'string') {
        csvContent = req.body;
      } else if (req.body && typeof req.body.csvContent === 'string') {
        csvContent = req.body.csvContent;
      } else {
        res.status(400).json({
          error: {
            code: 'INVALID_CSV_BODY',
            message: 'Request body must contain raw CSV text or { csvContent: string } JSON.',
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      const summary = await csvImportService.processCsv(req.tenant.id, csvContent);
      res.status(200).json({
        success: true,
        summary,
        requestId: req.headers['x-request-id']
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/source-orders/:id
   * Fetch single source order by ID within tenant boundary.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Number(req.params.id);
      if (isNaN(orderId) || orderId <= 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_ID',
            message: 'Order ID must be a positive number.',
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      const order = await sourceOrderService.getSourceOrderById(req.tenant.id, orderId);
      if (!order) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Source order with ID ${orderId} not found in this tenant.`,
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        order,
        requestId: req.headers['x-request-id']
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/source-orders
   * List source orders with filtering and pagination.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listSourceOrdersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parsed.error.format(),
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      const result = await sourceOrderService.listSourceOrders(req.tenant.id, parsed.data);
      res.status(200).json({
        success: true,
        ...result,
        requestId: req.headers['x-request-id']
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sourceOrderController = new SourceOrderController();
