export class TransactionDTO {
  type: 'TRANSACTION';
  'obj': {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    profile_id: number;
    token: string;
    email: string;
    order: {
      id: number;
      created_at: string;
      merchant: {
        id: number;
        created_at: string;
        phones: string[];
        company_emails: string[];
        company_name: string;
        state: string;
        country: string;
      };
      shipping_data: {
        email: string;
      };
      amount_cents: number;
      currency: string;
      merchant_order_id: null;
      wallet_notification: null;
      paid_amount_cents: number;
      notify_user_with_email: boolean;
      items: any[];
      order_url: string;
      payment_method: string;
      api_source: string;
      data: {};
    };
    transaction_processed_callback_responses: any;
    currency: string;
    api_source: string;
    installment: null;
    discount_details: any[];
    is_void: boolean;
    is_refund: boolean;
    is_hidden: boolean;
    payment_key_claims: {
      exp: number;
      extra: {};
      pmk_ip: string;
      user_id: number;
      currency: string;
      order_id: number;
      amount_cents: number;
      billing_data: {
        city: string;
        email: string;
        floor: string;
        state: string;
        street: string;
        country: string;
        building: string;
        apartment: string;
        last_name: string;
        first_name: string;
        postal_code: string;
        phone_number: string;
        extra_description: string;
      };
      integration_id: number;
      lock_order_when_paid: boolean;
      subscription_plan_id: string;
      single_payment_attempt: boolean;
    };
    error_occured: boolean;
    is_live: boolean;
    other_endpoint_reference: null;
    refunded_amount_cents: number;
    source_id: number;
    merchant_staff_tag: null;
    updated_at: string;
    owner: number;
  };
}
