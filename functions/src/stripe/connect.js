/**
 * EasySeats - Stripe Connect Functions
 * Handles vendor onboarding to Stripe Connect
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getStripe } from '../utils/stripe.js';
import { getDocument, updateDocument } from '../utils/firestore.js';

/**
 * Create a Stripe Connect account for a vendor
 */
export const createConnectAccount = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;

    try {
        // Check if user is a vendor
        const user = await getDocument('users', userId);
        if (user?.role !== 'vendor' || !user?.vendorId) {
            throw new HttpsError('permission-denied', 'User is not a vendor');
        }

        // Check if vendor already has Stripe account
        const vendor = await getDocument('vendors', user.vendorId);
        if (vendor?.stripeAccountId) {
            return { accountId: vendor.stripeAccountId };
        }

        const stripe = getStripe();

        // Create Stripe Connect Express account
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'DE', // Default to Germany, could be configurable
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true }
            },
            business_type: 'individual',
            metadata: {
                vendorId: user.vendorId,
                userId: userId
            }
        });

        // Update vendor with Stripe account ID
        await updateDocument('vendors', user.vendorId, {
            stripeAccountId: account.id,
            stripeOnboarded: false
        });

        return { accountId: account.id };
    } catch (error) {
        console.error('Error creating Connect account:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Failed to create Stripe account');
    }
});

/**
 * Create account link for Stripe Connect onboarding
 */
export const createConnectAccountLink = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { returnUrl, refreshUrl } = request.data;

    try {
        const user = await getDocument('users', request.auth.uid);
        if (!user?.vendorId) {
            throw new HttpsError('permission-denied', 'User is not a vendor');
        }

        const vendor = await getDocument('vendors', user.vendorId);
        if (!vendor?.stripeAccountId) {
            throw new HttpsError('failed-precondition', 'Stripe account not created');
        }

        const stripe = getStripe();

        const accountLink = await stripe.accountLinks.create({
            account: vendor.stripeAccountId,
            refresh_url: refreshUrl || `${request.rawRequest.headers.origin}/pages/seller/payouts.html`,
            return_url: returnUrl || `${request.rawRequest.headers.origin}/pages/seller/payouts.html?onboarded=true`,
            type: 'account_onboarding'
        });

        return { url: accountLink.url };
    } catch (error) {
        console.error('Error creating account link:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Failed to create onboarding link');
    }
});
