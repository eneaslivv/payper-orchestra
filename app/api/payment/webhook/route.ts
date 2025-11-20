import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PaymentWebhookData } from "@/lib/types";
// import { v4 as uuidv4 } from 'uuid';

// Common interface for payment data
interface PaymentResponse {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  payment_method_id: string;
  installments: number;
  date_created: string;
  date_approved: string | null;
  external_reference?: string;
}

// Common function to fetch payment data
async function fetchPaymentData(paymentId: string): Promise<PaymentResponse> {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Payment not found or API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Common function to transform payment data
function transformPaymentData(paymentData: PaymentResponse) {
  return {
    id: paymentData.id,
    status: paymentData.status,
    statusDetail: paymentData.status_detail,
    transactionAmount: Number(paymentData.transaction_amount),
    currencyId: paymentData.currency_id,
    paymentMethodId: paymentData.payment_method_id,
    installments: paymentData.installments,
    dateCreated: paymentData.date_created,
    dateApproved: paymentData.date_approved,
    paymentUrl: "", // Consider if this should be populated or removed
    externalId: paymentData.external_reference,
  };
}

export async function POST(request: NextRequest) {
  try {
    const data: PaymentWebhookData = await request.json();
    
    // Log webhook data for debugging
    console.log("Webhook received:", data);
    
    if ((data.action === "payment.updated" || data.action === "payment.created") && data.data.id) {
      const paymentData = await fetchPaymentData(data.data.id);
      const transformedData = transformPaymentData(paymentData);
      
      console.log("Payment status:", paymentData.status, "External ref:", transformedData.externalId);
      
      // Handle all possible payment statuses
      switch (paymentData.status) {
        case "approved":
          // Update all related tables atomically
          const { error: transactionError } = await supabase
            .from("event_transactions")
            .update({ status: "approved" })
            .eq("id", transformedData.externalId);
            
          const { error: orderError } = await supabase
            .from("event_orders")
            .update({ 
              status: "paid",
              payment_status: "paid" 
            })
            .eq("id", transformedData.externalId);
            
          const { error: itemsError } = await supabase
            .from("event_order_items")
            .update({ status: "paid" })
            .eq("order_id", transformedData.externalId);
            
          if (transactionError || orderError || itemsError) {
            console.error("Database update errors:", { transactionError, orderError, itemsError });
          }
          break;
          
        case "pending":
        case "in_process":
        case "authorized":
          await supabase
            .from("event_transactions")
            .update({ status: "pending" })
            .eq("id", transformedData.externalId);
            
          await supabase
            .from("event_orders")
            .update({ 
              status: "pending",
              payment_status: "pending" 
            })
            .eq("id", transformedData.externalId);
          await supabase
            .from("event_order_items")
            .update({ status: "pending" })
            .eq("order_id", transformedData.externalId);
          break;
          
        case "rejected":
        case "cancelled":
          await supabase
            .from("event_transactions")
            .update({ status: "rejected" })
            .eq("id", transformedData.externalId);
            
          await supabase
            .from("event_orders")
            .update({ 
              status: "cancelled",
              payment_status: "failed" 
            })
            .eq("id", transformedData.externalId);
          await supabase
            .from("event_order_items")
            .update({ status: "cancelled" })
            .eq("order_id", transformedData.externalId);
          break;
          
        case "refunded":
        case "charged_back":
          await supabase
            .from("event_transactions")
            .update({ status: "refunded" })
            .eq("id", transformedData.externalId);
            
          await supabase
            .from("event_orders")
            .update({ 
              status: "refunded",
              payment_status: "refunded" 
            })
            .eq("id", transformedData.externalId);
          await supabase
            .from("event_order_items")
            .update({ status: "refunded" })
            .eq("order_id", transformedData.externalId);
          break;
          
        default:
          console.warn(`Unhandled payment status: ${paymentData.status}`);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json(
        { message: "Payment ID is required" },
        { status: 400 }
      );
    }

    const paymentData = await fetchPaymentData(paymentId);
    const transformedData = transformPaymentData(paymentData);

    if (paymentData.status === "approved") {
      console.log("Payment approved", { paymentId: transformedData.id });
    }

    return NextResponse.json({ data: transformedData });
  } catch (err) {
    console.error("Payment fetch error:", err);
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}

