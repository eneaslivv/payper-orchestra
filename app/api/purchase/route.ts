import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateQRCode } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, cartItems, paymentMethod, totalAmount, transferred_to_email } =
      body;

    // Validate required fields
    if (
      !userId ||
      !eventId ||
      !cartItems ||
      !paymentMethod ||
      !totalAmount ||
      !transferred_to_email
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate cart items
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { message: "Cart items must be a non-empty array" },
        { status: 400 }
      );
    } else if (paymentMethod === "card") {
      // Create a pending purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("event_orders")
        .insert([
          {
            user_id: userId,
            event_id: eventId,
            total_price: totalAmount,
            qr_code: generateQRCode(),
            payment_method: "card",
            status: "waiting_payment",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (purchaseError) {
        throw purchaseError;
      }

      //Get Cart items
      const cartItemsData = cartItems.map((item: any) => ({
        ticket_type_id: item.ticketTypeId,
        event_id: item.eventId,
        price_paid: item.price,
        amount: item.quantity,
        user_id: userId,
        transferred_to_email,
        status: 'waiting_payment'
      }));
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("event_order_items")
        .insert(
          cartItemsData.map((item: any) => ({
            ...item,
            order_id: purchase.id,
          }))
        )
        .select();
      if (orderItemsError) {
        throw orderItemsError;
      }
      return NextResponse.json({ data: purchase, status: 200, success: true });
    } else {
      return NextResponse.json(
        { message: "Invalid payment method" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in purchase POST:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
