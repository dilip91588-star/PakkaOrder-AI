import { sourceOrderRepository, SourceOrderWithItems } from '../repositories/sourceOrderRepository.js';
import { CreateSourceOrderInput } from '../validators/sourceOrderValidators.js';

export interface IngestionResult {
  isDuplicate: boolean;
  sourceOrderId: number;
  order: SourceOrderWithItems;
  message: string;
}

export class SourceOrderService {
  /**
   * Ingest a source order with strict idempotency and evidence preservation.
   */
  async ingestSourceOrder(tenantId: number, input: CreateSourceOrderInput): Promise<IngestionResult> {
    // 1. Idempotency Check
    const existing = await sourceOrderRepository.findByIdempotencyKey(tenantId, input.idempotencyKey);
    if (existing) {
      return {
        isDuplicate: true,
        sourceOrderId: existing.id,
        order: existing,
        message: 'Idempotent request: source order already ingested with this idempotency key.'
      };
    }

    // 2. Normalization & Totals Calculation
    const normalizedPhone = input.customer?.phone 
      ? input.customer.phone.replace(/[\s-]/g, '') 
      : null;

    const deliveryAddress = input.deliveryAddress || input.customer?.address || null;
    const normalizedAddress = deliveryAddress 
      ? deliveryAddress.trim().toLowerCase().replace(/\s+/g, ' ') 
      : null;

    const calculatedTotal = input.items.reduce(
      (sum, itm) => sum + (itm.lineTotal !== undefined ? itm.lineTotal : itm.quantity * itm.unitPrice),
      0
    );

    const reportedTotal = input.reportedTotal !== undefined ? input.reportedTotal : calculatedTotal;

    // 3. Raw Evidence Preservation
    const originalPayload: Record<string, unknown> = input.rawPayload || {
      channel: input.channel,
      sourceCreatedAt: input.sourceCreatedAt,
      customer: input.customer,
      items: input.items,
      reportedTotal,
      notes: input.notes
    };

    const normalizedPayload: Record<string, unknown> = {
      standardCurrency: input.currency || 'INR',
      normalizedPhone,
      normalizedAddress,
      itemCount: input.items.length,
      calculatedTotal
    };

    // 4. Persistence
    const sourceOrderId = await sourceOrderRepository.create({
      tenantId,
      channel: input.channel,
      externalOrderId: input.externalOrderId,
      idempotencyKey: input.idempotencyKey,
      sourceCreatedAt: input.sourceCreatedAt,
      customerName: input.customer?.name || null,
      customerPhone: input.customer?.phone || null,
      normalizedPhone,
      deliveryAddress,
      normalizedAddress,
      currency: input.currency || 'INR',
      reportedTotal,
      originalPayload,
      normalizedPayload,
      extractionStatus: 'SUCCESS',
      recordStatus: 'UNPROCESSED',
      items: input.items.map(itm => ({
        name: itm.name,
        quantity: itm.quantity,
        unit: itm.unit || 'portion',
        unitPrice: itm.unitPrice,
        lineTotal: itm.lineTotal !== undefined ? itm.lineTotal : itm.quantity * itm.unitPrice,
        customizations: itm.customizations
      }))
    });

    const createdOrder = await sourceOrderRepository.findById(tenantId, sourceOrderId);
    if (!createdOrder) {
      throw new Error(`Failed to load newly created source order with ID ${sourceOrderId}`);
    }

    // 5. Trigger candidate generation and conflict detection
    try {
      const { candidateGenerationService } = await import('./candidateGenerationService.js');
      await candidateGenerationService.processOrderForCandidates(tenantId, sourceOrderId);
    } catch (_candErr) {
      // Non-blocking for raw intake
    }

    return {
      isDuplicate: false,
      sourceOrderId,
      order: createdOrder,
      message: 'Source order created successfully.'
    };
  }

  /**
   * Get source order details by ID within tenant boundary.
   */
  async getSourceOrderById(tenantId: number, id: number): Promise<SourceOrderWithItems | null> {
    return sourceOrderRepository.findById(tenantId, id);
  }

  /**
   * List source orders with filtering and pagination.
   */
  async listSourceOrders(
    tenantId: number,
    query: { channel?: CreateSourceOrderInput['channel']; status?: any; search?: string; page: number; limit: number }
  ) {
    return sourceOrderRepository.list(
      tenantId,
      { channel: query.channel, status: query.status, search: query.search },
      { page: query.page, limit: query.limit }
    );
  }
}

export const sourceOrderService = new SourceOrderService();
