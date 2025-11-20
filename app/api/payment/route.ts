import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: Request) => {
    try {
        // Validate environment variables
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error("MercadoPago access token not configured");
        }
        
        if (!process.env.NEXT_PUBLIC_WEB_URL) {
            throw new Error("Web URL not configured");
        }
        
        const body = await req.json();

        const { totalAmount, userId, payer, orderId } = body;
        const { data: transaction, error } = await supabase.from("event_transactions").insert([
            {
                user_id: userId,
                amount: totalAmount,
                status: "pending",
                order_id: orderId || null
            }
        ])
            .select()
            .single();
        if (error) {
            console.error("Error creating transaction:", error);
            return NextResponse.json(
                {
                    message: "An unexpected error occurred",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        const preferenceData = {
            items: [{
                id: transaction.id,
                title: "Charge your balance",
                description: `Charge your balance with ${totalAmount} ARS`,
                quantity: 1,
                currency_id: 'ARS',
                unit_price: totalAmount,
            }],
            payer: {
                email: payer.email,
                name: payer.name || undefined,
            },
            external_reference: transaction.id,
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/success`,
                failure: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/failure`,
                pending: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/pending`,
            },
            // Remove auto_return as it's causing issues
            notification_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/payment/webhook`,
            statement_descriptor: 'Papel Restaurant'
        };

        console.log('preference data ------>', preferenceData);

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            },
            body: JSON.stringify(preferenceData)
        });

        const mpResponse = await response.json();
        const resData = {
            id: mpResponse.id,
            status: 'pending',
            statusDetail: 'pending_payment',
            transactionAmount: totalAmount,
            currencyId: 'ARS',
            paymentMethodId: '',
            installments: 1,
            dateCreated: new Date().toISOString(),
            paymentUrl: mpResponse.init_point || ''
            // paymentUrl: mpResponse.sandbox_init_point || '',
        };

        const { data: transactionUpdate, error: transactionError } = await supabase.from("event_transactions")
            .update({
                payment_url: mpResponse.init_point || '',
                // payment_url: mpResponse.sandbox_init_point || '',
                preference_id: mpResponse.id,
            })
            .eq("id", transaction.id);

        if (transactionError) {
            console.error("Error updating transaction:", transactionError);
            return NextResponse.json(
                {
                    message: "An unexpected error occurred",
                    error: transactionError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: resData, status: 200 });
    } catch (error: any) {
        console.error('Payment creation error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};


export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = req.nextUrl;
        const eventId = searchParams.get('eventId');

        const { data: transaction, error } = await supabase.from("event_transactions")
            .select("*")
            .eq("order_id", eventId)
            .single();
        if (error) {
            console.error("Error creating transaction:", error);
            return NextResponse.json(
                {
                    message: "An unexpected error occurred",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: transaction, status: 200 });
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};


