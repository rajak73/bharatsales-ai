import { Injectable, Logger } from '@nestjs/common';
import { Invoice } from '@bharatsales/shared-types';
import { IntegrationAdapter } from '../integrations-adapter.service';
import axios from 'axios';

@Injectable()
export class TallyAdapter implements IntegrationAdapter {
  private readonly logger = new Logger(TallyAdapter.name);

  async connect(config: any): Promise<boolean> {
    if (!process.env.TALLY_SERVER_URL) {
      this.logger.warn(`[TALLY-ADAPTER] TALLY_SERVER_URL is missing. Operating in mock mode.`);
    } else {
      this.logger.log(`[TALLY-ADAPTER] Initializing Tally XML adapter with URL: ${process.env.TALLY_SERVER_URL}`);
    }
    return true;
  }

  async syncData(payload: any): Promise<any> {
    if (payload.type === 'Invoice') {
      return this.exportInvoiceToTally(payload.invoice, payload.outletName);
    }
    return false;
  }

  async disconnect(): Promise<boolean> {
    return true;
  }

  async exportInvoiceToTally(invoice: Invoice, outletName: string): Promise<boolean> {
    try {
      this.logger.log(`[TALLY-ADAPTER] Exporting Invoice ${invoice.invoiceNumber} (Amt: ₹${invoice.totalAmount}) for ${outletName} to Tally ERP 9.`);
      
      const xmlPayload = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${new Date(invoice.createdAt).toISOString().split('T')[0].replace(/-/g, '')}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${invoice.invoiceNumber}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${outletName}</PARTYLEDGERNAME>
            <AMOUNT>${invoice.totalAmount}</AMOUNT>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
      `.trim();
      
      this.logger.debug(`[TALLY-ADAPTER] Generated XML Payload:\n${xmlPayload}`);

      if (process.env.TALLY_SERVER_URL) {
        await axios.post(process.env.TALLY_SERVER_URL, xmlPayload, {
          headers: { 'Content-Type': 'application/xml' }
        });
        this.logger.log(`[TALLY-ADAPTER] Invoice ${invoice.invoiceNumber} successfully synced to real Tally server.`);
      } else {
        // Fallback simulate network request if env not configured
        await new Promise(resolve => setTimeout(resolve, 800));
        this.logger.log(`[TALLY-ADAPTER] Invoice ${invoice.invoiceNumber} successfully synced (Mock Mode).`);
      }
      
      return true;
    } catch (error: any) {
      this.logger.error(`[TALLY-ADAPTER] Failed to export invoice ${invoice.invoiceNumber} to Tally. ${error.message}`);
      return false;
    }
  }
}
