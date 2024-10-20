import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from '../user/user.entity';
import axios from 'axios';
import { TransactionDTO } from './payment.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private readonly userService: UserService,
  ) {}

  async createTransaction(user: User, amount: number, currency: string) {
    const authToken = await this.authenticate();
    const orderId = await this.createOrder(authToken, amount, currency);
    const paymentToken = await this.getPaymentToken(
      authToken,
      amount,
      currency,
      orderId,
      user,
      'newTransaction',
    );
    return this.generateIframeUrl(paymentToken);
  }

  private async authenticate(): Promise<string> {
    const apiKey =
      'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBd01UTTFOQ3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5MaVNKV2hKaWpuWlRxSlVjb3BpQV9XcDNIa20tR1pwdTZaSXd5VGUyQk51RThQS1h3TG53QXMzV3BxdTN5NThiMlBrc2J3d1VvRUZDQUpTSUM1c0tZQQ==';
    const { data } = await axios.post(
      'https://accept.paymob.com/api/auth/tokens',
      { api_key: apiKey },
    );
    return data.token;
  }

  private async createOrder(
    authToken: string,
    amount: number,
    currency: string,
  ): Promise<number> {
    const { data } = await axios.post(
      'https://accept.paymob.com/api/ecommerce/orders',
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amount * 100,
        currency,
        items: [],
      },
    );
    return data.id;
  }

  private async getPaymentToken(
    authToken: string,
    amount: number,
    currency: string,
    orderId: number,
    user: User,
    type: string,
  ): Promise<string> {
    const { data } = await axios.post(
      'https://accept.paymob.com/api/acceptance/payment_keys',
      {
        auth_token: authToken,
        amount_cents: amount * 100,
        currency,
        order_id: orderId,
        billing_data: {
          apartment: 'NA',
          email: user.email,
          floor: 'NA',
          first_name: user.name,
          last_name: 'NA',
          phone_number: 'NA',
          city: 'NA',
          country: 'EG',
          street: 'NA',
          building: 'NA',
          extra_description: type === 'newTransaction' ? '' : 'RENEW',
        },
        integration_id:
          type === 'newTransaction'
            ? '4857608'
            : process.env.RENEW_INTEGRATION_ID,
        extra: { user_id: user.id },
      },
    );

    return data.token;
  }

  private generateIframeUrl(token: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/875480?payment_token=${token}`;
  }

  async processTransactionWebhook(
    webhookData: TransactionDTO,
  ): Promise<Transaction | User> {
    const { obj } = webhookData;

    if (webhookData.type === 'TRANSACTION') {
      const email = obj?.order?.shipping_data?.email;
      const user = await this.userService.findByEmail(email);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const transaction = this.transactionRepository.create({
        amount: obj.amount_cents / 100,
        currency: obj.currency,
        status: obj.success ? 'Success' : 'Failed',
        user,
      });

      return await this.transactionRepository.save(transaction);
    } else if (webhookData.type === 'TOKEN') {
      const email = obj.email;
      const user = await this.userService.findByEmail(email);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.token = obj.token;
      return await this.userService.save(user);
    }
  }

  async autoRenew(
    user: User,
    clientToken: string,
    amount: number,
    currency: string,
  ) {
    const token = await this.authenticate();
    const orderId = await this.createOrder(token, amount, currency);
    const paymentToken = await this.getPaymentToken(
      token,
      amount,
      currency,
      orderId,
      user,
      'autoRenew',
    );
    return await this.payWithSavedCard(paymentToken, clientToken);
  }

  private async payWithSavedCard(payment_token: string, clientToken: string) {
    const { data } = await axios.post(
      'https://accept.paymob.com/api/acceptance/payments/pay',
      {
        source: { identifier: clientToken, subtype: 'TOKEN' },
        payment_token,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data;
  }
}
