// Mercado Pago webhook types
export interface PaymentWebhookData {
    id: string;
    action: string;
    apiVersion: string;
    application_id: string;
    date_created: string;
    live_mode: boolean;
    type: string;
    user_id: string;
    data: {
        id: string;
    };
}

export type MailType = "sign_up" | "new_order" | "order_delivered" | "order_cancelled" | "order_delayed" | "balance_updated" | "reminder"
