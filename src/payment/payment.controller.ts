import { Controller, Post, Body, Headers, UnauthorizedException, Logger, Get, Patch, Param, UseInterceptors } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ValidUser, ValidAdmin } from '../common/decorators/validate.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(
        private readonly paymentService: PaymentService,
        private readonly configService: ConfigService,
    ) { }

    @Post('webhooks/revenuecat')
    @ApiOperation({ summary: 'Handle RevenueCat Webhooks' })
    async handleWebhook(
        @Body() payload: any,
        @Headers('authorization') authHeader: string,
    ) {
        const webhookSecret = this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET');

        // If a secret is configured, verify it
        if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
            this.logger.warn('Unauthorized RevenueCat webhook attempt');
            throw new UnauthorizedException('Invalid authorization header');
        }

        return this.paymentService.handleRevenueCatWebhook(payload);
    }

    @Get('subscription')
    @ValidUser()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user subscription status' })
    @ApiResponse({ status: 200, description: 'Returns subscription details' })
    async getSubscription(@GetUser('id') userId: string) {
        return this.paymentService.getSubscriptionStatus(userId);
    }

    @Get('history')
    @ValidUser()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user subscription history' })
    @ApiResponse({ status: 200, description: 'Returns list of subscription events' })
    async getHistory(@GetUser('id') userId: string) {
        return this.paymentService.getSubscriptionHistory(userId);
    }

    @Patch('subscription')
    @ValidAdmin()
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(AnyFilesInterceptor())
    @ApiOperation({ summary: 'Update my subscription status manually (Test only)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['active', 'cancelled', 'expired', 'billing_issue'],
                    example: 'active'
                },
                productId: {
                    type: 'string',
                    enum: ['premium_monthly', 'premium_yearly'],
                    example: 'premium_monthly'
                },
                isTrial: {
                    type: 'string',
                    enum: ['true', 'false'],
                    example: 'false'
                },
                expirationDate: { type: 'string', format: 'date-time' },
            }
        }
    })
    async updateSubscription(
        @GetUser('id') userId: string,
        @Body() data: any
    ) {
        return this.paymentService.updateSubscriptionManually(userId, data);
    }
}
