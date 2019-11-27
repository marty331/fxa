import React, {
  useEffect,
  useContext,
  useCallback,
  useState,
  useRef,
} from 'react';
import { connect } from 'react-redux';
import dayjs from 'dayjs';

import { AuthServerErrno } from '../../lib/errors';
import { AppContext } from '../../lib/AppContext';
import FlowEvent from '../../lib/flow-event';

import { actions, ActionFunctions } from '../../store/actions';
import { selectors, SelectorReturns } from '../../store/selectors';
import { sequences, SequenceFunctions } from '../../store/sequences';
import { State } from '../../store/state';
import {
  CustomerSubscription,
  Profile,
  Subscription,
  Plan,
} from '../../store/types';

import './index.scss';
import SubscriptionItem from './SubscriptionItem';
import ReactivateSubscriptionSuccessDialog from './Reactivate/SuccessDialog';

import AlertBar from '../../components/AlertBar';
import DialogMessage from '../../components/DialogMessage';
import FetchErrorDialogMessage from '../../components/FetchErrorDialogMessage';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import CloseIcon from '../../components/CloseIcon';

export type SubscriptionsProps = {
  profile: SelectorReturns['profile'];
  plans: SelectorReturns['plans'];
  customer: SelectorReturns['customer'];
  subscriptions: SelectorReturns['subscriptions'];
  cancelSubscriptionStatus: SelectorReturns['cancelSubscriptionStatus'];
  reactivateSubscriptionStatus: SelectorReturns['reactivateSubscriptionStatus'];
  updatePaymentStatus: SelectorReturns['updatePaymentStatus'];
  customerSubscriptions: SelectorReturns['customerSubscriptions'];
  cancelSubscription: SequenceFunctions['cancelSubscriptionAndRefresh'];
  resetCancelSubscription: ActionFunctions['resetCancelSubscription'];
  reactivateSubscription: ActionFunctions['reactivateSubscription'];
  fetchSubscriptionsRouteResources: SequenceFunctions['fetchSubscriptionsRouteResources'];
  resetReactivateSubscription: ActionFunctions['resetReactivateSubscription'];
  updatePayment: SequenceFunctions['updateSubscriptionPlanAndRefresh'];
  resetUpdatePayment: ActionFunctions['resetUpdatePayment'];
  manageSubscriptionsMounted: ActionFunctions['manageSubscriptionsMounted'];
  manageSubscriptionsEngaged: ActionFunctions['manageSubscriptionsEngaged'];
  cancelSubscriptionMounted: ActionFunctions['cancelSubscriptionMounted'];
  cancelSubscriptionEngaged: ActionFunctions['cancelSubscriptionEngaged'];
  updatePaymentMounted: ActionFunctions['updatePaymentMounted'];
  updatePaymentEngaged: ActionFunctions['updatePaymentEngaged'];
};

export const Subscriptions = ({
  profile,
  customer,
  plans,
  subscriptions,
  customerSubscriptions,
  fetchSubscriptionsRouteResources,
  cancelSubscription,
  cancelSubscriptionStatus,
  reactivateSubscription,
  reactivateSubscriptionStatus,
  resetReactivateSubscription,
  updatePayment,
  resetUpdatePayment,
  resetCancelSubscription,
  updatePaymentStatus,
  manageSubscriptionsMounted,
  manageSubscriptionsEngaged,
  cancelSubscriptionMounted,
  cancelSubscriptionEngaged,
  updatePaymentMounted,
  updatePaymentEngaged,
}: SubscriptionsProps) => {
  const { config, locationReload, navigateToUrl } = useContext(AppContext);

  // There is no way to do this with a React Hook. We need the
  // `navigationTiming.domComplete` value to calculate the "client" perf metric.
  // When `useEffect` is used, the `domComplete` value is always(?) null because
  // it fires too early. This is the reliable approach.
  window.onload = () =>
    FlowEvent.logPerformanceEvent('subscriptions', config.perfStartTime);

  const [showPaymentSuccessAlert, setShowPaymentSuccessAlert] = useState(true);
  const clearSuccessAlert = useCallback(
    () => setShowPaymentSuccessAlert(false),
    [setShowPaymentSuccessAlert]
  );

  const SUPPORT_FORM_URL = `${config.servers.content.url}/support`;

  const engaged = useRef(false);

  useEffect(() => {
    manageSubscriptionsMounted();
  }, [manageSubscriptionsMounted]);

  // Any button click is engagement
  const onAnyClick = useCallback(
    (evt: any) => {
      if (
        !engaged.current &&
        (evt.target.tagName === 'BUTTON' ||
          evt.target.parentNode.tagName === 'BUTTON')
      ) {
        manageSubscriptionsEngaged();
        engaged.current = true;
      }
    },
    [manageSubscriptionsEngaged, engaged]
  );

  // Fetch subscriptions and customer on initial render or auth change.
  useEffect(() => {
    fetchSubscriptionsRouteResources();
  }, [fetchSubscriptionsRouteResources]);

  const onSupportClick = useCallback(() => navigateToUrl(SUPPORT_FORM_URL), [
    navigateToUrl,
    SUPPORT_FORM_URL,
  ]);

  if (
    customer.loading ||
    subscriptions.loading ||
    profile.loading ||
    plans.loading
  ) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (!profile.result || profile.error !== null) {
    return (
      <FetchErrorDialogMessage
        testid="error-loading-profile"
        title="Problem loading profile"
        fetchState={profile}
        onDismiss={locationReload}
      />
    );
  }

  if (!plans.result || plans.error !== null) {
    return (
      <FetchErrorDialogMessage
        testid="error-loading-plans"
        title="Problem loading plans"
        fetchState={plans}
        onDismiss={locationReload}
      />
    );
  }

  if (!subscriptions.result || subscriptions.error !== null) {
    return (
      <FetchErrorDialogMessage
        testid="error-subscriptions-fetch"
        title="Problem loading subscriptions"
        fetchState={subscriptions}
        onDismiss={locationReload}
      />
    );
  }

  if (
    customer.error &&
    // Unknown customer just means the user hasn't subscribed to anything yet
    customer.error.errno !== AuthServerErrno.UNKNOWN_SUBSCRIPTION_CUSTOMER
  ) {
    return (
      <FetchErrorDialogMessage
        testid="error-loading-customer"
        title="Problem loading customer"
        fetchState={customer}
        onDismiss={locationReload}
      />
    );
  }

  // If the customer has no subscriptions, redirect to the settings page
  if (
    (customerSubscriptions && customerSubscriptions.length === 0) ||
    (customer.error &&
      customer.error.errno === AuthServerErrno.UNKNOWN_SUBSCRIPTION_CUSTOMER)
  ) {
    const SETTINGS_URL = `${config.servers.content.url}/settings`;
    navigateToUrl(SETTINGS_URL);
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <div className="subscription-management" onClick={onAnyClick}>
      {customerSubscriptions && cancelSubscriptionStatus.result !== null && (
        <CancellationDialogMessage
          {...{
            subscription: cancelSubscriptionStatus.result,
            customerSubscriptions,
            plans: plans.result,
            resetCancelSubscription,
            supportFormUrl: SUPPORT_FORM_URL,
          }}
        />
      )}

      {updatePaymentStatus.result && showPaymentSuccessAlert && (
        <AlertBar className="alert alertSuccess alertCenter">
          <span data-testid="success-billing-update" className="checked">
            Your billing information has been updated successfully
          </span>

          <span
            data-testid="clear-success-alert"
            className="close"
            aria-label="Close modal"
            onClick={clearSuccessAlert}
          >
            <CloseIcon className="close" />
          </span>
        </AlertBar>
      )}

      {updatePaymentStatus.loading && (
        <AlertBar className="alert alertPending">
          <span>Updating billing information...</span>
        </AlertBar>
      )}

      {reactivateSubscriptionStatus.error && (
        <DialogMessage
          className="dialog-error"
          onDismiss={resetReactivateSubscription}
        >
          <h4 data-testid="error-reactivation">
            Reactivating subscription failed
          </h4>
          <p>{reactivateSubscriptionStatus.error.message}</p>
        </DialogMessage>
      )}

      {reactivateSubscriptionStatus.result && (
        <ReactivateSubscriptionSuccessDialog
          plan={reactivateSubscriptionStatus.result.plan}
          onDismiss={resetReactivateSubscription}
        />
      )}

      {cancelSubscriptionStatus.error && (
        <DialogMessage
          className="dialog-error"
          onDismiss={resetCancelSubscription}
        >
          <h4 data-testid="error-cancellation">
            Cancelling subscription failed
          </h4>
          <p>{cancelSubscriptionStatus.error.message}</p>
        </DialogMessage>
      )}

      {profile.result && <ProfileBanner profile={profile.result} />}

      <div className="child-views" data-testid="subscription-management-loaded">
        <div className="settings-child-view support">
          <div className="settings-unit">
            <div className="settings-unit-stub">
              <header className="settings-unit-summary">
                <h2 className="settings-unit-title">Subscriptions</h2>
              </header>
              <button
                data-testid="contact-support-button"
                className="settings-button primary-button settings-unit-toggle"
                onClick={onSupportClick}
              >
                <span className="change-button">Contact Support</span>
              </button>
            </div>
          </div>

          {customer.result &&
            customerSubscriptions &&
            customerSubscriptions.map((customerSubscription, idx) => (
              <SubscriptionItem
                key={idx}
                {...{
                  customer: customer.result,
                  updatePayment,
                  resetUpdatePayment,
                  updatePaymentStatus,
                  cancelSubscription,
                  reactivateSubscription,
                  customerSubscription,
                  cancelSubscriptionMounted,
                  cancelSubscriptionEngaged,
                  cancelSubscriptionStatus,
                  updatePaymentMounted,
                  updatePaymentEngaged,
                  plan: planForId(customerSubscription.plan_id, plans.result),
                  subscription: subscriptionForId(
                    customerSubscription.subscription_id,
                    subscriptions.result
                  ),
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

const customerSubscriptionForId = (
  subscriptionId: string,
  customerSubscriptions: CustomerSubscription[]
): CustomerSubscription | null =>
  customerSubscriptions.filter(
    subscription => subscription.subscription_id === subscriptionId
  )[0];

const subscriptionForId = (
  subscriptionId: string,
  subscriptions: Subscription[]
): Subscription | null =>
  subscriptions.filter(
    subscription => subscription.subscriptionId === subscriptionId
  )[0];

const planForId = (planId: string, plans: Plan[]): Plan | null =>
  plans.filter(plan => plan.plan_id === planId)[0];

type CancellationDialogMessageProps = {
  subscription: Subscription;
  customerSubscriptions: CustomerSubscription[];
  plans: Plan[];
  resetCancelSubscription: SubscriptionsProps['resetCancelSubscription'];
  supportFormUrl: string;
};

const CancellationDialogMessage = ({
  subscription,
  customerSubscriptions,
  plans,
  resetCancelSubscription,
  supportFormUrl,
}: CancellationDialogMessageProps) => {
  const customerSubscription = customerSubscriptionForId(
    subscription.subscriptionId,
    customerSubscriptions
  ) as CustomerSubscription;
  const plan = planForId(customerSubscription.plan_id, plans) as Plan;

  // TODO: date formats will need i18n someday
  const periodEndDate = dayjs
    .unix(customerSubscription.current_period_end)
    .format('MMMM DD, YYYY');

  return (
    <DialogMessage onDismiss={resetCancelSubscription}>
      <h4 data-testid="cancellation-message-title">
        We're sorry to see you go
      </h4>
      <p>
        Your {plan.product_name} subscription has been cancelled.
        <br />
        You will still have access to {plan.product_name} until {periodEndDate}.
      </p>
      <p className="small">
        Have questions? Visit <a href={supportFormUrl}>Mozilla Support</a>.
      </p>
    </DialogMessage>
  );
};

type ProfileProps = {
  profile: Profile;
};

const ProfileBanner = ({
  profile: { email, avatar, displayName },
}: ProfileProps) => (
  <header id="fxa-settings-profile-header-wrapper">
    <div className="avatar-wrapper avatar-settings-view nohover">
      <img src={avatar} alt={displayName || email} className="profile-image" />
    </div>
    <div id="fxa-settings-profile-header">
      <h1 className="card-header">{displayName ? displayName : email}</h1>
      {displayName && <h2 className="card-subheader">{email}</h2>}
    </div>
  </header>
);

// TODO replace this with Redux hooks in component function body
// https://github.com/mozilla/fxa/issues/3020
export default connect(
  (state: State) => ({
    plans: selectors.plans(state),
    profile: selectors.profile(state),
    customer: selectors.customer(state),
    customerSubscriptions: selectors.customerSubscriptions(state),
    subscriptions: selectors.subscriptions(state),
    updatePaymentStatus: selectors.updatePaymentStatus(state),
    cancelSubscriptionStatus: selectors.cancelSubscriptionStatus(state),
    reactivateSubscriptionStatus: selectors.reactivateSubscriptionStatus(state),
    plansByProductId: selectors.plansByProductId(state),
  }),
  {
    fetchSubscriptionsRouteResources:
      sequences.fetchSubscriptionsRouteResources,
    updatePayment: sequences.updatePaymentAndRefresh,
    resetUpdatePayment: actions.resetUpdatePayment,
    cancelSubscription: sequences.cancelSubscriptionAndRefresh,
    resetCancelSubscription: actions.resetCancelSubscription,
    reactivateSubscription: sequences.reactivateSubscriptionAndRefresh,
    resetReactivateSubscription: actions.resetReactivateSubscription,
    manageSubscriptionsMounted: actions.manageSubscriptionsMounted,
    manageSubscriptionsEngaged: actions.manageSubscriptionsEngaged,
    cancelSubscriptionMounted: actions.cancelSubscriptionMounted,
    cancelSubscriptionEngaged: actions.cancelSubscriptionEngaged,
    updatePaymentMounted: actions.updatePaymentMounted,
    updatePaymentEngaged: actions.updatePaymentEngaged,
  }
)(Subscriptions);
