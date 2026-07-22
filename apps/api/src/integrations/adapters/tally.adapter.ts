import { Injectable, Logger } from '@nestjs/common';
import { Invoice } from '@bharatsales/shared-types';

@Injectable()
export class TallyAdapter {
  private readonly logger = new Logger(TallyAdapter.name);

  async exportInvoiceToTally(invoice: Invoice, outletName: string): Promise<boolean> {
    try {
      this.logger.log(`[TALLY-SIM] Exporting Invoice ${invoice.invoiceNumber} (Amt: ₹${invoice.totalAmount}) for ${outletName} to Tally ERP 9.`);
      
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
      
      this.logger.debug(`[TALLY-SIM] Generated XML Payload:\n${xmlPayload}`);

      // Simulate network request to Tally XML Server
      await new Promise(resolve => setTimeout(resolve, 800));
      
      this.logger.log(`[TALLY-SIM] Invoice ${invoice.invoiceNumber} successfully synced to Tally.`);
      return true;
    } catch (error) {
      this.logger.error(`[TALLY-SIM] Failed to export invoice ${invoice.invoiceNumber} to Tally`, error);
      return false;
    }
  }
}
