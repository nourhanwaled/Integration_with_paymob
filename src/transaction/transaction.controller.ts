import {
  Controller,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { UserService } from '../user/user.service';
import { Cron } from '@nestjs/schedule';
import { TransactionDTO } from './payment.dto';
import { Transaction } from './transaction.entity';
import { User } from '../user/user.entity';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
  ) {}

  @Post('pay/:userId')
  async payment(
    @Param('userId') userId: number,
    @Body() body: { amount: number; currency: string },
  ) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.transactionService.createTransaction(
      user,
      body.amount,
      body.currency,
    );
  }

  @Post('webhook')
  async handleTransactionWebhook(
    @Body() webhookData: TransactionDTO,
  ): Promise<Transaction | User> {
    return await this.transactionService.processTransactionWebhook(webhookData);
  }

  @Cron('0 0 0 * * *')
  async handleCron() {
    const userId = 1;
    const user = await this.userService.findOne(userId);
    if (!user) {
      console.log('User not found');
      return;
    }

    const renewResult = await this.transactionService.autoRenew(
      user,
      user.token,
      100,
      'EGP',
    );

    if (renewResult.success === 'false') {
      // Handle failed renewal logic
      console.log('Renewal failed');
    } else {
      // Handle successful renewal logic
      console.log('Renewal success');
    }

    return 'Task executed successfully';
  }
}
