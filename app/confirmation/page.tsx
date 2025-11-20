"use client";
import { PaymentUrl } from "@/components/payment-url";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  Ticket,
  CreditCard,
  Clock,
  MapPin,
  Eye,
  ArrowLeft,
  Share,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPaymentUrl, setShowPaymentUrl] = useState(false);
  const orderId = searchParams?.get("orderId");
  const paymentMethod = searchParams?.get("payment");
  const [isLoading, setLoading] = useState(false);
  const isCashPayment = paymentMethod === "cash";
  const [paymentUrl, setPaymentUrl] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_orders")
        .select(
          `
          *,
          items:event_order_items!event_order_items_order_id_fkey(*,
            ticket_types(*)
          ),
          transaction:event_transactions!event_transactions_order_id_fkey(*)
        `
        )
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        return;
      }

      setOrder(data);

      // Check if there's a payment URL to show
      if (
        data?.transaction?.[0]?.payment_url &&
        data?.status === "waiting_payment"
      ) {
        setPaymentUrl(data.transaction[0].payment_url);
        setShowPaymentUrl(true);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);
  useEffect(() => {
    if (
      order?.transaction[0]?.payment_url &&
      order?.status === "waiting_payment"
    ) {
      // Redirect to MercadoPago payment - DON'T clear cart yet
      setPaymentUrl(order.transaction[0].payment_url);
      setShowPaymentUrl(true);
    }
  }, [order]);
  // const isWaitingPayment =
  //   order?.status === "pending" || order?.status === "waiting_payment";
  const totalAmount = order?.total_amount || order?.total_price || 0;

  const shareOrder = async () => {
    if (navigator.share && order) {
      try {
        await navigator.share({
          title: "Mi pedido - KHEA TRAPICHEO",
          text: `Pedido ${order.qr_code} confirmado. ¡Listo para retirar!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }
  };

  const downloadQRCode = () => {
    if (order?.qr_code) {
      // Create a canvas element to render the QR code
      const canvas = document.createElement("canvas");
      const svg = document.querySelector(".qr-code-svg") as SVGElement;

      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();

        img.onload = () => {
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 256, 256);
            ctx.drawImage(img, 0, 0, 256, 256);

            // Download the canvas as PNG
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `qr-${order.qr_code}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            });
          }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-6">
          {/* Payment Icon */}
          <div className="mx-auto bg-green-900/30 text-green-400 rounded-full p-4 w-fit border border-green-800">
            <CreditCard className="h-8 w-8" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {order?.status === "pending"
                ? "Pending"
                : order?.status === "waiting_payment"
                  ? "Waiting Payment"
                  : "Delivered"}
            </h1>
            <p className="text-gray-400">
              <p className="text-gray-400">{order?.status == "waiting_payment" ? "Tu pedido está siendo procesado. El pago está pendiente de confirmación." : order?.status === 'pending' ? "Tu pedido fue validado correctamente. Mostrá este QR en el stand para retirar tu compra.”" : "Tu compra fue confirmada"}</p>
            </p>
          </div>

          {/* QR Code Section */}
          {order?.status === "pending" || order?.status === "delivered" && (
            <Card className="p-6 text-center space-y-4 mb-6 bg-black border-gray-900">
              <h2 className="text-lg font-semibold text-white">
                {isCashPayment ? "QR para retiro y pago" : "QR para retiro"}
              </h2>

              <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-900 rounded-xl flex items-center justify-center p-2">
                {order?.qr_code ? (
                  <QRCodeSVG
                    value={order?.qr_code}
                    size={192}
                    level="M"
                    className="qr-code-svg"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">Generando QR...</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Pedido #{order.qr_code}
                </p>
              </div>
            </Card>
          )}

          {/* Order Details */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-left">
            <h2 className="text-white font-medium mb-3">Order details</h2>

            {order?.items?.map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center mb-2"
              >
                <span className="text-gray-300 text-sm">
                  {item.amount || item.quantity}x{" "}
                  {item.ticket_types?.name ||
                    `Ticket #${item.ticket_type_id}`}
                </span>
                <span className="text-white font-medium">
                  ${(item.price_paid || 0).toLocaleString()}
                </span>
              </div>
            ))}

            <div className="border-t border-zinc-700 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total</span>
                <span className="text-white font-bold text-lg">
                  ${totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Withdrawal Instructions */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-left">
            <h2 className="text-white font-medium mb-3">
              Withdrawal instructions
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">Location:</span>
                  <span className="text-gray-300 ml-1">Main Stand</span>
                  <div className="text-gray-400 text-xs">Main Entrance</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">Hours:</span>
                  <span className="text-gray-300 ml-1">
                    7:00 PM - 11:59 PM
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">
                    Estimated wait time:
                  </span>
                  <span className="text-gray-300 ml-1">5-10 min</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0 text-xs">
                  📱
                </div>
                <div>
                  <span className="text-white font-medium">Important:</span>
                  <span className="text-gray-300 ml-1">
                    Have this QR ready on your phone.
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-xs mt-3">
              Need to change your pickup location? Contact us at the event.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {(order?.status === "delivered" || order?.status === "pending") && (
                <Button
                  onClick={shareOrder}
                  variant="outline"
                  className="w-full h-12 border-gray-900 bg-black hover:bg-gray-900 text-white"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Compartir pedido
                </Button>
              )}

            {order?.status === "pending" || order?.status === "delivered" && (
              <Button
                onClick={downloadQRCode}
                variant="outline"
                className="w-full h-12 border-gray-900 bg-black hover:bg-gray-900 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Guardar QR
              </Button>
            )}

            {order?.status === "waiting_payment" && (
              <Button
                onClick={() => {
                  if (order?.transaction?.[0]?.payment_url) {
                    setPaymentUrl(order.transaction[0].payment_url);
                    setShowPaymentUrl(true);
                  }
                }}
                className="w-full bg-transparent border border-zinc-700 text-white hover:bg-zinc-800"
              >
                <Eye className="mr-2 h-4 w-4" />
                Continue with payment
              </Button>
            )}

            <Link href="/cart">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue shopping
              </Button>
            </Link>
          </div>

          {/* Support */}
          <div className="text-center text-gray-400 text-xs">
            <p>Problems with your order?</p>
            <p>Contact us at the booth or via WhatsApp.</p>
          </div>
        </div>
      </div>

      <PaymentUrl
        paymentUrl={paymentUrl}
        isOpen={showPaymentUrl}
        onClose={() => {
          setShowPaymentUrl(false);
          setPaymentUrl("");
        }}
        onConfirm={() => {
          // Redirect to a pending payment page or tickets page
          // router.push('/tickets?status=pending')
        }}
      />
    </div>
  );
}
