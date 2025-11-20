import * as React from "react";

interface SignupEmailTemplateProps {
  firstName?: string;
}

interface OrderEmailTemplateProps {
  firstName?: string;
  orderNumber: number;
  qrCode?: string;
  qrImageData?: string;
  totalAmount?: number;
  orderUrl?: string;
  items?: Array<{
    name: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
}

interface BalanceEmailTemplateProps {
  firstName?: string;
  balance: number;
}

interface ReminderEmailTemplateProps {
  firstName?: string;
}

export const SignupEmailTemplate: React.FC<
  Readonly<SignupEmailTemplateProps>
> = ({ firstName = "" }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Gracias por registrarte en Payper App. Ya puedes explorar nuestros menús
      exclusivos, realizar pedidos y disfrutar de una experiencia única en
      nuestros bares y eventos. ¡Bienvenido!
    </p>
  </div>
);

export const NewOrderEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber, qrCode, qrImageData, totalAmount, items, orderUrl }) => (
  
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1f2937', fontSize: '24px', marginBottom: '10px' }}>Pedido Generado- Pago pendient</h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Pedido #{orderNumber}</p>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Tu pedido fue generado correctamente, pero el pago aún no fue confirmado. Por favor, ingresá a la aplicación para completar el pago o verificar su estado.
        </p>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <a href={orderUrl} target="_blank" rel="noopener noreferrer">
          <button style={{ backgroundColor: '#1e40af', color: 'white', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
            Ver pedido
          </button> 
        </a>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#1f2937', fontSize: '18px', marginBottom: '15px' }}>Detalles del pedido</h2>

        {items && items.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#374151' }}>
                  {item.name} {item.size && `(${item.size})`} x{item.quantity}
                </span>
                <span style={{ color: '#1f2937', fontWeight: 'bold' }}>
                  ${item.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalAmount && (
          <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
              <span style={{ color: '#1f2937' }}>Total:</span>
              <span style={{ color: '#1f2937' }}>${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ color: '#92400e', fontSize: '16px', marginBottom: '8px' }}>⚠️ Importante</h3>
        <ul style={{ color: '#92400e', fontSize: '14px', margin: '0', paddingLeft: '20px' }}>
          <li>Llevá este email o el código QR para retirar tu pedido</li>
          <li>El código QR es único y no transferible</li>
          <li>Si tenés problemas, contactanos en el stand</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
        <p>Gracias por tu compra. ¡Esperamos verte pronto!</p>
      </div>
    </div>
);

export const OrderDeliveredEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Tu pedido #{orderNumber} ha sido entregado. Esperamos que lo disfrutes. Si
      tienes alguna duda, estamos para ayudarte.
    </p>
  </div>
);

export const OrderCancelledEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Lamentamos informarte que tu pedido #{orderNumber} ha sido cancelado. Si
      tienes preguntas, por favor contáctanos para asistirte.
    </p>
  </div>
);

export const OrderDelayedEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Queremos informarte que tu pedido #{orderNumber} está demorándose más de
      lo esperado. Estamos trabajando para que llegue pronto. Gracias por tu
      paciencia.
    </p>
  </div>
);

export const BalanceUpdatedEmailTemplate: React.FC<
  Readonly<BalanceEmailTemplateProps>
> = ({ firstName = "", balance }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Tu cuenta ha sido actualizada con un nuevo saldo de {balance}. Ahora
      puedes usarlo para realizar tus pedidos y disfrutar de nuestros servicios.
      ¡Gracias por confiar en nosotros!
    </p>
  </div>
);

export const ReminderEmailTemplate: React.FC<
  Readonly<ReminderEmailTemplateProps>
> = ({ firstName = "" }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Tu saldo actual es bajo. Recuerda recargar para seguir disfrutando de
      todos nuestros beneficios sin interrupciones.
    </p>
  </div>
);
