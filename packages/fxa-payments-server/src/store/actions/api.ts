import {
  apiFetchProfile,
  apiFetchPlans,
  apiFetchSubscriptions,
  apiFetchToken,
  apiFetchCustomer,
  apiCreateSubscription,
  apiUpdateSubscriptionPlan,
  apiCancelSubscription,
  apiReactivateSubscription,
  apiUpdatePayment,
} from '../../lib/apiClient';

import { Plan } from '../types';

export default {
  fetchProfile: () =>
    ({ type: 'fetchProfile', payload: apiFetchProfile() } as const),
  fetchToken: () => ({ type: 'fetchToken', payload: apiFetchToken() } as const),
  fetchPlans: () => ({ type: 'fetchPlans', payload: apiFetchPlans() } as const),
  fetchSubscriptions: () =>
    ({ type: 'fetchSubscriptions', payload: apiFetchSubscriptions() } as const),
  fetchCustomer: () =>
    ({ type: 'fetchCustomer', payload: apiFetchCustomer() } as const),
  createSubscription: (paymentToken: string, plan: Plan, displayName: string) =>
    ({
      type: 'createSubscription',
      meta: { plan },
      payload: apiCreateSubscription({
        paymentToken,
        displayName,
        planId: plan.plan_id,
      }),
    } as const),
  updateSubscriptionPlan: (subscriptionId: string, plan: Plan) =>
    ({
      type: 'updateSubscriptionPlan',
      meta: { subscriptionId, plan },
      payload: apiUpdateSubscriptionPlan({
        subscriptionId,
        planId: plan.plan_id,
      }),
    } as const),
  cancelSubscription: (subscriptionId: string, plan: Plan) =>
    ({
      type: 'cancelSubscription',
      meta: { plan },
      payload: async () => {
        const result = await apiCancelSubscription(subscriptionId);
        // Cancellation response does not include subscriptionId, but we want it.
        return { ...result, subscriptionId };
      },
    } as const),
  reactivateSubscription: (subscriptionId: string, plan: Plan) =>
    ({
      type: 'reactivateSubscription',
      meta: { plan },
      payload: async () => {
        // Ignore the API result, because it's just `{}` on success.
        await apiReactivateSubscription(subscriptionId);
        return {
          subscriptionId,
          plan,
        };
      },
    } as const),
  updatePayment: (paymentToken: string, plan: Plan) =>
    ({
      type: 'updatePayment',
      meta: { plan },
      payload: apiUpdatePayment(paymentToken),
    } as const),
} as const;
