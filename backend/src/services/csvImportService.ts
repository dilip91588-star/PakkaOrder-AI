import { sourceOrderRepository } from '../repositories/sourceOrderRepository.js';
import { Channel } from '../types/index.js';

export interface CsvRowResult {
  rowNumber: number;
  status: 'SUCCESS' | 'FAILED' | 'DUPLICATE_SKIPPED';
  externalOrderId?: string;
  sourceOrderId?: number;
  error?: string;
}

export interface CsvImportSummary {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  results: CsvRowResult[];
}

export class CsvImportService {
  private readonly maxRows = 1000;
  private readonly maxPayloadBytes = 1024 * 1024; // 1 MB limit

  /**
   * Process raw CSV string, validate header columns, execute per-row validation,
   * and ingest valid rows into source_orders idempotently.
   */
  async processCsv(tenantId: number, csvContent: string): Promise<CsvImportSummary> {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('CSV content cannot be empty.');
    }

    if (Buffer.byteLength(csvContent, 'utf8') > this.maxPayloadBytes) {
      throw new Error(`CSV payload exceeds maximum size limit of 1MB.`);
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    if (lines.length - 1 > this.maxRows) {
      throw new Error(`CSV exceeds maximum limit of ${this.maxRows} rows.`);
    }

    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    // Verify required columns in header
    const requiredHeaders = ['channel', 'customer_phone', 'item_name', 'quantity', 'unit_price'];
    for (const req of requiredHeaders) {
      if (!headers.includes(req)) {
        throw new Error(`Missing required column '${req}' in CSV header.`);
      }
    }

    const results: CsvRowResult[] = [];
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1; // 1-indexed human row number
      const rowStr = lines[i];

      try {
        const values = this.parseCsvLine(rowStr);
        const rowMap: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowMap[h] = values[idx] || '';
        });

        // Validate Row
        const channelRaw = (rowMap['channel'] || 'MANUAL').toUpperCase();
        if (!['WHATSAPP', 'POS', 'ZOMATO', 'SWIGGY', 'MANUAL'].includes(channelRaw)) {
          throw new Error(`Invalid channel '${channelRaw}'. Must be WHATSAPP, POS, ZOMATO, SWIGGY, or MANUAL.`);
        }
        const channel = channelRaw as Channel;

        const customerPhone = rowMap['customer_phone']?.trim();
        if (!customerPhone) {
          throw new Error(`Missing customer_phone.`);
        }

        const itemName = rowMap['item_name']?.trim();
        if (!itemName) {
          throw new Error(`Missing item_name.`);
        }

        const quantity = Number(rowMap['quantity']);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity '${rowMap['quantity']}'. Must be a positive number.`);
        }

        const unitPrice = Number(rowMap['unit_price']);
        if (isNaN(unitPrice) || unitPrice < 0) {
          throw new Error(`Invalid unit_price '${rowMap['unit_price']}'. Must be non-negative.`);
        }

        const externalOrderId = rowMap['external_order_id']?.trim() || null;
        const customerName = rowMap['customer_name']?.trim() || 'Direct Customer';
        const deliveryAddress = rowMap['delivery_address']?.trim() || 'Indiranagar Counter';

        // Deterministic idempotency key for this CSV row
        const idempotencyKey = rowMap['idempotency_key']?.trim() || 
          `IDEM-CSV-${tenantId}-${externalOrderId || `R${rowNumber}-${customerPhone.slice(-4)}`}`;

        // Check if existing record already present
        const existing = await sourceOrderRepository.findByIdempotencyKey(tenantId, idempotencyKey);
        if (existing) {
          duplicateCount++;
          results.push({
            rowNumber,
            status: 'DUPLICATE_SKIPPED',
            externalOrderId: externalOrderId || undefined,
            sourceOrderId: existing.id,
            error: 'Duplicate idempotency key detected: record already ingested.'
          });
          continue;
        }

        const lineTotal = quantity * unitPrice;
        const sourceOrderId = await sourceOrderRepository.create({
          tenantId,
          channel,
          externalOrderId,
          idempotencyKey,
          sourceCreatedAt: new Date().toISOString(),
          customerName,
          customerPhone,
          normalizedPhone: customerPhone.replace(/[\s-]/g, ''),
          deliveryAddress,
          normalizedAddress: deliveryAddress.toLowerCase(),
          currency: 'INR',
          reportedTotal: lineTotal,
          originalPayload: {
            sourceType: 'CSV_IMPORT',
            rowNumber,
            rawRow: rowStr,
            parsedValues: rowMap
          },
          extractionStatus: 'SUCCESS',
          recordStatus: 'UNPROCESSED',
          items: [
            {
              name: itemName,
              quantity,
              unit: 'portion',
              unitPrice,
              lineTotal
            }
          ]
        });

        successCount++;
        results.push({
          rowNumber,
          status: 'SUCCESS',
          externalOrderId: externalOrderId || undefined,
          sourceOrderId
        });
      } catch (err) {
        failCount++;
        results.push({
          rowNumber,
          status: 'FAILED',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return {
      totalRows: lines.length - 1,
      successfulRows: successCount,
      failedRows: failCount,
      duplicateRows: duplicateCount,
      results
    };
  }

  private parseCsvLine(text: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));
    return values;
  }
}

export const csvImportService = new CsvImportService();
