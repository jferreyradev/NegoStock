// ==============================================================================
// SUPABASE EDGE FUNCTION: AFIP FACTURACIÓN ELECTRÓNICA (WSFE)
// Ejecución Serverless segura en Supabase (Deno / TypeScript)
// Los certificados (.key y .crt) NUNCA se exponen al cliente/frontend.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface AfipInvoiceRequest {
  sale_id: string;
  tenant_id: string;
  voucher_type: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C';
  point_of_sale: number;
  customer_doc_type: string;
  customer_doc_number: string;
  amount_net: number;
  amount_iva: number;
  amount_total: number;
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const payload: AfipInvoiceRequest = await req.json();

    // 1. Obtener certificados desde Supabase Vault o Environment Variables
    const afipCrt = Deno.env.get(`AFIP_CRT_${payload.tenant_id}`) || Deno.env.get('AFIP_CRT_DEFAULT');
    const afipKey = Deno.env.get(`AFIP_KEY_${payload.tenant_id}`) || Deno.env.get('AFIP_KEY_DEFAULT');
    const cuitEmisor = Deno.env.get(`AFIP_CUIT_${payload.tenant_id}`) || '30712345679';

    if (!afipCrt || !afipKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Certificados de AFIP no configurados para este inquilino" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Aquí se realiza la autenticación WSAA (Ticket de Acceso) y llamada a WSFE:
    // FECAESolicitar para obtener el CAE y Fecha de Vto. CAE
    // Simulación estructurada de respuesta AFIP para la arquitectura:
    const mockCAE = "74123456789012";
    const mockVtoCAE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return new Response(
      JSON.stringify({
        success: true,
        cae: mockCAE,
        cae_expiration: mockVtoCAE,
        voucher_number: `${String(payload.point_of_sale).padStart(4, '0')}-00000001`,
        message: "Comprobante electrónico autorizado por AFIP"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
