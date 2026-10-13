import crypto from 'crypto';
import { env } from '../config/env.js';
import { WhatsAppWebhookPayload, WhatsAppMessageItem } from '../validators/whatsappValidators.js';
import { sourceOrderService, IngestionResult } from '../services/sourceOrderService.js';
import { extractionService } from '../services/extractionService.js';
import { CreateSourceOrderInput } from '../validators/sourceOrderValidators.js';

export interface WhatsAppProcessingSummary {
  success: boolean;
  eventsProcessed: number;
  ordersIngested: Array<{
    wamid: string;
    sourceOrderId: number;
    isDuplicate: boolean;
    customerPhone: string;
    extractionStatus: string;
  }>;
  statusUpdatesProcessed: Array<{
    wamid: string;
    status: string;
    timestamp: string;
  }>;
  errors: string[];
}

export interface WhatsAppIntegrationHealth {
  channel: 'WHATSAPP';
  status: 'CONNECTED' | 'PARTIALLY_CONFIGURED' | 'CREDENTIALS_REQUIRED';
  provider: 'Meta WhatsApp Business Cloud API';
  apiVersion: 'v21.0';
  webhookPath: string;
  isVerifyTokenConfigured: boolean;
  isAppSecretConfigured: boolean;
  isPhoneNumberIdConfigured: boolean;
  signatureVerificationMode: 'STRICT_HMAC_SHA256' | 'DEV_ALLOW_UNSIGNED';
  metrics: {
    totalEventsReceived: number;
    totalOrdersIngested: number;
    totalDuplicateWebhooksSuppressed: number;
    totalStatusesProcessed: number;
    lastReceivedAt: string | null;
    lastError: string | null;
  };
}

export class WhatsAppAdapter {
  private metrics = {
    totalEventsReceived: 0,
    totalOrdersIngested: 0,
    totalDuplicateWebhooksSuppressed: 0,
    totalStatusesProcessed: 0,
    lastReceivedAt: null as string | null,
    lastError: null as string | null
  };

  /**
   * Verify HMAC-SHA256 signature from Meta Graph API (X-Hub-Signature-256 header)
   */
  verifySignature(rawBodyBuffer: Buffer | string | undefined, signatureHeader?: string): boolean {
    const appSecret = env.WHATSAPP_APP_SECRET;

    // If app secret is configured, enforce strict HMAC-SHA256 validation
    if (appSecret) {
      if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
        return false;
      }

      if (!rawBodyBuffer) {
        return false;
      }

      const receivedHex = signatureHeader.substring(7);
      const computedHex = crypto
        .createHmac('sha256', appSecret)
        .update(rawBodyBuffer)
        .digest('hex');

      try {
        const receivedBuf = Buffer.from(receivedHex, 'hex');
        const computedBuf = Buffer.from(computedHex, 'hex');

        if (receivedBuf.length !== computedBuf.length) {
          return false;
        }

        return crypto.timingSafeEqual(receivedBuf, computedBuf);
      } catch (_err) {
        return false;
      }
    }

    // In local development / sandbox without app secret, allow requests if explicitly in non-production
    if (env.NODE_ENV !== 'production') {
      return true;
    }

    // In production, app secret is mandatory
    return false;
  }

  /**
   * Verify Webhook Subscription Challenge from Meta (GET request)
   */
  verifyChallenge(query: Record<string, unknown>): { isValid: boolean; challenge?: string } {
    const mode = query['hub.mode'];
    const verifyToken = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && verifyToken === env.WHATSAPP_VERIFY_TOKEN && typeof challenge === 'string') {
      return { isValid: true, challenge };
    }

    return { isValid: false };
  }

  /**
   * Process Inbound WhatsApp Webhook Event
   * Translates incoming Meta message events into immutable source orders
   * and preserves raw evidence and provider metadata.
   */
  async processWebhookEvent(tenantId: number, payload: WhatsAppWebhookPayload): Promise<WhatsAppProcessingSummary> {
    this.metrics.totalEventsReceived++;
    this.metrics.lastReceivedAt = new Date().toISOString();

    const summary: WhatsAppProcessingSummary = {
      success: true,
      eventsProcessed: 0,
      ordersIngested: [],
      statusUpdatesProcessed: [],
      errors: []
    };

    try {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          const metadata = value.metadata || {};
          const contacts = value.contacts || [];

          // 1. Handle Inbound Messages
          if (value.messages && Array.isArray(value.messages)) {
            for (const message of value.messages) {
              try {
                const ingestResult = await this.processSingleMessage(tenantId, message, metadata, contacts, payload);
                if (ingestResult) {
                  summary.ordersIngested.push(ingestResult);
                  summary.eventsProcessed++;
                  if (ingestResult.isDuplicate) {
                    this.metrics.totalDuplicateWebhooksSuppressed++;
                  } else {
                    this.metrics.totalOrdersIngested++;
                  }
                }
              } catch (msgErr: any) {
                const errMsg = `Error processing WhatsApp message ${message.id}: ${msgErr.message}`;
                summary.errors.push(errMsg);
                this.metrics.lastError = errMsg;
              }
            }
          }

          // 2. Handle Message Status Receipts (sent, delivered, read, failed)
          if (value.statuses && Array.isArray(value.statuses)) {
            for (const statusItem of value.statuses) {
              summary.statusUpdatesProcessed.push({
                wamid: statusItem.id,
                status: statusItem.status,
                timestamp: new Date(parseInt(statusItem.timestamp, 10) * 1000).toISOString()
              });
              summary.eventsProcessed++;
              this.metrics.totalStatusesProcessed++;
            }
          }
        }
      }
    } catch (err: any) {
      summary.success = false;
      const errMsg = `Critical error in WhatsApp webhook processing: ${err.message}`;
      summary.errors.push(errMsg);
      this.metrics.lastError = errMsg;
    }

    return summary;
  }

  /**
   * Process a single incoming WhatsApp message
   */
  private async processSingleMessage(
    tenantId: number,
    message: WhatsAppMessageItem,
    metadata: { display_phone_number?: string; phone_number_id?: string },
    contacts: Array<{ profile?: { name?: string }; wa_id: string }>,
    rawPayload: WhatsAppWebhookPayload
  ): Promise<{
    wamid: string;
    sourceOrderId: number;
    isDuplicate: boolean;
    customerPhone: string;
    extractionStatus: string;
  } | null> {
    const wamid = message.id;
    const rawText = message.text?.body || '';

    // Normalize phone number to E.164 (+<country_code><number>)
    let rawPhone = message.from;
    if (!rawPhone.startsWith('+')) {
      rawPhone = `+${rawPhone}`;
    }

    // Resolve contact name if provided by Meta profile
    const matchedContact = contacts.find(c => c.wa_id === message.from);
    const profileName = matchedContact?.profile?.name || 'WhatsApp Customer';

    // Parse timestamp (seconds to milliseconds)
    const timestampMs = parseInt(message.timestamp, 10) * 1000;
    const sourceCreatedAt = !isNaN(timestampMs) 
      ? new Date(timestampMs).toISOString() 
      : new Date().toISOString();

    // Provider Metadata preserved verbatim
    const providerMetadata = {
      channel: 'WHATSAPP',
      provider: 'Meta WhatsApp Cloud API',
      wamid,
      senderWaId: message.from,
      displayPhoneNumber: metadata.display_phone_number,
      phoneNumberId: metadata.phone_number_id,
      messageType: message.type,
      rawTimestamp: message.timestamp,
      profileName
    };

    // 1. Multilingual Extraction using Gemini Service with safety fallback
    let extractedItems: Array<{
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      lineTotal: number;
      customizations?: string[];
    }> = [];

    let deliveryAddress: string | null = null;
    let customerName = profileName;
    let extractionStatus: 'SUCCESS' | 'NEEDS_REVIEW' | 'FAILED' = 'SUCCESS';

    if (rawText.trim().length > 0) {
      try {
        const extraction = await extractionService.extractFromText(
          rawText,
          'WHATSAPP',
          rawPhone,
          profileName,
          tenantId
        );

        deliveryAddress = extraction.delivery?.address || null;
        customerName = extraction.customer?.name || profileName;

        extractedItems = (extraction.items || []).map(itm => {
          const qty = itm.quantity && itm.quantity > 0 ? itm.quantity : 1;
          const price = itm.unitPrice || 0;
          return {
            name: itm.normalizedName || itm.rawName || 'Item',
            quantity: qty,
            unit: itm.unit || 'portion',
            unitPrice: price,
            lineTotal: itm.lineTotal !== undefined && itm.lineTotal !== null ? itm.lineTotal : qty * price,
            customizations: itm.customization ? [itm.customization] : undefined
          };
        });

        if (extractedItems.length === 0) {
          extractionStatus = 'NEEDS_REVIEW';
          // Fallback single line item holding raw text
          extractedItems.push({
            name: `Order Request: ${rawText.slice(0, 100)}`,
            quantity: 1,
            unit: 'portion',
            unitPrice: 0,
            lineTotal: 0
          });
        }
      } catch (_extractErr) {
        extractionStatus = 'NEEDS_REVIEW';
        extractedItems.push({
          name: `Unparsed Inbound Order: ${rawText.slice(0, 100)}`,
          quantity: 1,
          unit: 'portion',
          unitPrice: 0,
          lineTotal: 0
        });
      }
    } else {
      // Non-text message (e.g. image, audio, sticker)
      extractionStatus = 'NEEDS_REVIEW';
      extractedItems.push({
        name: `Inbound WhatsApp ${message.type.toUpperCase()} Attachment`,
        quantity: 1,
        unit: 'attachment',
        unitPrice: 0,
        lineTotal: 0
      });
    }

    const calculatedTotal = extractedItems.reduce((sum, itm) => sum + itm.lineTotal, 0);

    // 2. Build Ingestion DTO with provider event ID as idempotency key
    const orderInput: CreateSourceOrderInput = {
      channel: 'WHATSAPP',
      externalOrderId: wamid,
      idempotencyKey: `WA_${wamid}`,
      sourceCreatedAt,
      customer: {
        phone: rawPhone,
        name: customerName,
        address: deliveryAddress || undefined
      },
      deliveryAddress: deliveryAddress || undefined,
      currency: 'INR',
      reportedTotal: calculatedTotal,
      rawPayload: {
        rawMessage: message,
        rawWebhook: rawPayload,
        providerMetadata
      },
      items: extractedItems
    };

    // 3. Ingest into Source Orders Repository & Trigger Deterministic Reconciliation
    const result: IngestionResult = await sourceOrderService.ingestSourceOrder(tenantId, orderInput);

    return {
      wamid,
      sourceOrderId: result.sourceOrderId,
      isDuplicate: result.isDuplicate,
      customerPhone: rawPhone,
      extractionStatus
    };
  }

  /**
   * Return comprehensive integration telemetry & health report
   */
  getIntegrationHealth(): WhatsAppIntegrationHealth {
    const isVerifyTokenConfigured = Boolean(env.WHATSAPP_VERIFY_TOKEN);
    const isAppSecretConfigured = Boolean(env.WHATSAPP_APP_SECRET);
    const isPhoneNumberIdConfigured = Boolean(env.WHATSAPP_PHONE_NUMBER_ID);

    let status: WhatsAppIntegrationHealth['status'] = 'CREDENTIALS_REQUIRED';
    if (isVerifyTokenConfigured && isAppSecretConfigured && isPhoneNumberIdConfigured) {
      status = 'CONNECTED';
    } else if (isVerifyTokenConfigured) {
      status = 'PARTIALLY_CONFIGURED';
    }

    return {
      channel: 'WHATSAPP',
      status,
      provider: 'Meta WhatsApp Business Cloud API',
      apiVersion: 'v21.0',
      webhookPath: '/api/v1/webhooks/whatsapp',
      isVerifyTokenConfigured,
      isAppSecretConfigured,
      isPhoneNumberIdConfigured,
      signatureVerificationMode: isAppSecretConfigured ? 'STRICT_HMAC_SHA256' : 'DEV_ALLOW_UNSIGNED',
      metrics: { ...this.metrics }
    };
  }
}

export const whatsAppAdapter = new WhatsAppAdapter();
