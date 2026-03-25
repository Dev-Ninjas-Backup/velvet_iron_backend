import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(private prisma: PrismaService) { }

    async handleRevenueCatWebhook(payload: any) {
        const { event } = payload;
        const {
            type,
            app_user_id,
            product_id,
            store,
            original_transaction_id,
            purchased_at_ms,
            expiration_at_ms,
            is_trial_period,
        } = event;

        this.logger.log(`Handling RevenueCat event: ${type} for user: ${app_user_id}`);

        // Find the user in our database. We assume app_user_id matches our User ID.
        // If not, we might need to look up by app_user_id field in Subscription model.

        let subscription = await this.prisma.client.subscription.findFirst({
            where: {
                OR: [
                    { userId: app_user_id },
                    { appUserId: app_user_id }
                ]
            },
        });

        const status = this.mapEventToStatus(type);
        const purchaseDate = purchased_at_ms ? new Date(purchased_at_ms) : null;
        const expirationDate = expiration_at_ms ? new Date(expiration_at_ms) : null;

        if (!subscription) {
            // Create new subscription if it doesn't exist
            // We first check if the user exists
            const user = await this.prisma.client.user.findUnique({
                where: { id: app_user_id },
            });

            if (!user) {
                this.logger.error(`User with ID ${app_user_id} not found for subscription event ${type}`);
                return;
            }

            subscription = await this.prisma.client.subscription.create({
                data: {
                    userId: user.id,
                    appUserId: app_user_id,
                    productId: product_id,
                    store: store,
                    isTrial: is_trial_period || false,
                    status: status,
                    originalTransactionId: original_transaction_id,
                    purchaseDate: purchaseDate,
                    expirationDate: expirationDate,
                },
            });
        } else {
            // Update existing subscription
            subscription = await this.prisma.client.subscription.update({
                where: { id: subscription.id },
                data: {
                    productId: product_id,
                    status: status,
                    isTrial: is_trial_period || false,
                    expirationDate: expirationDate,
                    purchaseDate: purchaseDate,
                    originalTransactionId: original_transaction_id,
                },
            });
        }

        // ------------Log the event----------------------
        await this.prisma.client.subscriptionEvent.create({
            data: {
                subscriptionId: subscription.id,
                eventType: type,
                payload: payload,
            },
        });

        return { success: true };
    }

    async getSubscriptionStatus(userId: string) {
        const subscription = await this.prisma.client.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            return { status: 'none', message: 'No subscription found' };
        }

        return subscription;
    }

    async getSubscriptionHistory(userId: string) {
        const subscription = await this.prisma.client.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            return [];
        }

        return this.prisma.client.subscriptionEvent.findMany({
            where: { subscriptionId: subscription.id },
            orderBy: { receivedAt: 'desc' },
        });
    }

    async updateSubscriptionManually(userId: string, data: any) {
        const subscription = await this.prisma.client.subscription.findUnique({
            where: { userId },
        });

        const isTrialBool = data.isTrial !== undefined ? (data.isTrial === 'true' || data.isTrial === true) : undefined;

        if (!subscription) {
            // Create if not exists for testing
            return this.prisma.client.subscription.create({
                data: {
                    userId,
                    appUserId: userId,
                    productId: data.productId || 'test_product',
                    store: 'manual',
                    status: data.status || 'active',
                    isTrial: isTrialBool ?? false,
                    expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
                },
            });
        }

        return this.prisma.client.subscription.update({
            where: { id: subscription.id },
            data: {
                productId: data.productId,
                status: data.status,
                isTrial: isTrialBool,
                expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
            },
        });
    }

    private mapEventToStatus(eventType: string): string {
        switch (eventType) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION':
            case 'NON_RENEWING_PURCHASE':
                return 'active';
            case 'CANCELLATION':
                return 'cancelled'; // User turned off auto-renew, but might still have access until expiration
            case 'EXPIRATION':
                return 'expired';
            case 'BILLING_ISSUE':
                return 'billing_issue';
            default:
                return 'unknown';
        }
    }
}
