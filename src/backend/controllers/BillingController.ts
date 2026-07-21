import { Request, Response, NextFunction } from 'express';
import { getBillingData, saveBillingData } from '../utils/serverHelpers.js';

export class BillingController {
static async getBilling(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const billing = await getBillingData(tenantId);
  res.json(billing);
  }

static async checkout(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const { planId } = req.body;
  
  const billing = await getBillingData(tenantId);

  // Update billing record
  billing.plan = planId;
  billing.invoiceStatus = 'Paid';

  // Calculate price and add dynamic invoice
  let amount = 0;
  let desc = "";
  if (planId === "monthly") {
    amount = 49;
    desc = "Standard Monthly Plan - Subscription Update";
  } else if (planId === "annual") {
    amount = 399;
    desc = "Annual Pro Plan - Subscription Upgrade";
  } else if (planId === "enterprise") {
    amount = 2499;
    desc = "Enterprise Custom Plan - Subscription Upgrade";
  } else {
    amount = 99;
    desc = `${planId} Plan Subscription Upgrade`;
  }

  const newInvoice = {
    id: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    description: desc,
    amount: amount,
    status: 'Paid' as const
  };

  if (!billing.invoices) billing.invoices = [];
  billing.invoices.unshift(newInvoice);

  // Clear pending renewals on successful upgrade
  billing.pendingRenewals = [];
  
  await saveBillingData(tenantId, billing);
  
  // Simulate payment delay
  setTimeout(() => {
    res.json({ success: true, message: 'Payment successful', billing });
  }, 1500);
  }

static async updateCard(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const { cardholder, number, expiry, cvc } = req.body;

  if (!cardholder || !number || !expiry || !cvc) {
    return res.status(400).json({ success: false, message: "All card details are required" });
  }

  try {
    const billing = await getBillingData(tenantId);
    
    // Determine card brand
    let brand = 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) {
      brand = 'Mastercard';
    } else if (number.startsWith('3')) {
      brand = 'Amex';
    }

    const last4 = number.replace(/\s+/g, '').slice(-4) || '4242';
    const parts = expiry.split('/');
    const expMonth = parts[0] ? parts[0].trim() : '12';
    const expYear = parts[1] ? `20${parts[1].trim()}` : '2030';

    billing.creditCard = {
      brand,
      last4,
      expMonth,
      expYear,
      cardholder: cardholder.trim()
    };

    await saveBillingData(tenantId, billing);
    res.json({ success: true, message: "Payment method updated successfully", billing });
  } catch (error: any) {
    console.error("Error updating credit card:", error);
    res.status(500).json({ success: false, message: "Failed to update payment details" });
  }
  }


}
