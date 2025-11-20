"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Loader2,
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart, type PaymentMethod } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, formatDate, formatTime, formatPrice } from "@/lib/api";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    paymentMethod,
    setPaymentMethod,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTaxes,
    getTotalPrice,
    getTotalItems,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const [userBalance, setUserBalance] = useState<number>(0);

  // Fetch user balance when component mounts
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user) return;

      try {
        const { user: profile } = await apiClient.getUserProfile(user.id);
        setUserBalance(profile.balance || 0);
      } catch (error) {
        console.error("Error fetching user balance:", error);
      }
    };

    fetchUserBalance();
  }, [user]);

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please sign in to purchase tickets");
      router.push("/auth");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const totalAmount = getTotalPrice();
      const eventId = items[0]?.eventId;

      // Use the new unified purchase API
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          eventId,
          cartItems: items,
          paymentMethod,
          totalAmount,
          // Ticket Info params
          transferred_to_email: user?.email,
        }),
      });

      const result = await response.json();

      console.log("result: ", result);

      const order = result.data;

      if (!response.ok) {
        throw new Error(result.message || "Failed to process purchase");
      }
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          totalAmount,
          userId: user?.id,
          payer: {
            email: user?.email,
            name: user.user_metadata.name,
          },
        }),
      });

      const resData = await res.json();
      
      // ISSUE: You should redirect to payment URL, not confirmation
      if (resData.data?.paymentUrl) {
        window.location.href = resData.data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
      
      // Remove this immediate redirect:
      // router.push(`/confirmation?payment=cash&orderId=${order.id}`);
      toast.success(
        "Redirecting to payment! Complete your payment to get your tickets."
      );

      try {
        await fetch("/api/mails", {
          method: "POST",
          body: JSON.stringify({
            email: user?.email,
            type: "new_order",
            orderId: eventId,
            qrCode: order.qr_code,
            totalAmount: totalAmount,
            items: items.map((item) => ({
              name: item.ticketTypeName,
              quantity: item.quantity,
              price: item.price * item.quantity,
            })),
            firstName: user.user_metadata.name,
            orderUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/confirmation?orderId=${order.id}`,
          }),
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't block the order process if email fails
      }
    } catch (error: any) {
      toast.error("Failed to purchase tickets", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl p-4 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some tickets to get started!
            </p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Your Cart</h1>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Summary</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              <span>
                {getTotalItems()} {getTotalItems() === 1 ? "ticket" : "tickets"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="space-y-4">
                {/* Event Header */}
                <div className="flex gap-4">
                  {item.eventImage && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.eventImage}
                        alt={item.eventTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {item.eventTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{formatDate(item.eventDate)}</span>
                      {item.eventTime && (
                        <>
                          <span>•</span>
                          <span>{formatTime(item.eventTime)}</span>
                        </>
                      )}
                    </div>
                    {item.eventLocation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {item.eventLocation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-base">
                      {item.ticketTypeName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} each
                    </p>
                    {item.ticketTypeDescription && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.ticketTypeDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        <span className="text-sm">-</span>
                      </Button>
                      <span className="min-w-[2rem] text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <span className="text-sm">+</span>
                      </Button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right min-w-[4rem]">
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500 h-8 w-8"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Separator className="bg-zinc-800" />

          {/* Card Payment */}
          <div
            onClick={() => setPaymentMethod("card")}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === "card"
                ? "border-blue-600 bg-blue-900/20"
                : "border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Mercado Pago</p>
                <p className="text-sm text-gray-400">
                  Mercado Pago – Visa, Mastercard
                </p>
              </div>
              {paymentMethod === "card" && (
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Subtotal</p>
              <p>{formatPrice(getSubtotal())}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Taxes & Fees</p>
              <p>{formatPrice(getTaxes())}</p>
            </div>
            <Separator className="bg-zinc-800 my-2" />
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>{formatPrice(getTotalPrice())}</p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full bg-lime-400 text-black hover:bg-lime-500"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
