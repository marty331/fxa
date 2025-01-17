import React, { useCallback, useContext, useEffect } from 'react';
import {
  injectStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCVCElement,
  Elements,
  ReactStripeElements,
} from 'react-stripe-elements';
import {
  Form,
  FieldGroup,
  Input,
  StripeElement,
  SubmitButton,
  Checkbox,
  OnValidateFunction,
} from '../fields';
import PaymentLegalBlurb from '../PaymentLegalBlurb';
import {
  State as ValidatorState,
  MiddlewareReducer as ValidatorMiddlewareReducer,
  useValidatorState,
} from '../../lib/validator';
import { useCallbackOnce } from '../../lib/hooks';
import { formatCurrencyInCents } from '../../lib/formats';
import { AppContext } from '../../lib/AppContext';

import './index.scss';
import { Plan } from '../../store/types';

// Define a minimal type for what we use from the Stripe API, which makes
// things easier to mock.
export type PaymentFormStripeProps = {
  createToken(
    options?: stripe.TokenOptions
  ): Promise<ReactStripeElements.PatchedTokenResponse>;
};

export type PaymentFormProps = {
  inProgress?: boolean;
  confirm?: boolean;
  plan?: Plan;
  onCancel?: () => void;
  onPayment: (tokenResponse: stripe.TokenResponse, name: string) => void;
  onPaymentError: (error: any) => void;
  validatorInitialState?: ValidatorState;
  validatorMiddlewareReducer?: ValidatorMiddlewareReducer;
  stripe?: PaymentFormStripeProps;
  onMounted: Function;
  onEngaged: Function;
  onChange: Function;
};

export const PaymentForm = ({
  inProgress = false,
  confirm = true,
  plan,
  onCancel,
  onPayment,
  onPaymentError,
  validatorInitialState,
  validatorMiddlewareReducer,
  stripe,
  onMounted,
  onEngaged,
  onChange: onChangeProp,
}: PaymentFormProps) => {
  const validator = useValidatorState({
    initialState: validatorInitialState,
    middleware: validatorMiddlewareReducer,
  });

  useEffect(() => {
    onMounted(plan);
  }, [onMounted, plan]);

  const engageOnce = useCallbackOnce(() => {
    onEngaged(plan);
  }, [onEngaged, plan]);

  const onChange = useCallback(() => {
    engageOnce();
    onChangeProp();
  }, [engageOnce, onChangeProp]);

  const onSubmit = useCallback(
    ev => {
      ev.preventDefault();
      if (!validator.allValid()) {
        return;
      }
      const { name, zip } = validator.getValues();
      if (stripe) {
        stripe
          .createToken({ name, address_zip: zip })
          .then((tokenResponse: stripe.TokenResponse) => {
            onPayment(tokenResponse, name);
          })
          .catch(err => {
            onPaymentError(err);
          });
      }
    },
    [validator, onPayment, onPaymentError, stripe]
  );

  const { matchMedia } = useContext(AppContext);
  const stripeElementStyles = mkStripeElementStyles(
    matchMedia(SMALL_DEVICE_RULE)
  );

  return (
    <Form
      data-testid="paymentForm"
      validator={validator}
      onSubmit={onSubmit}
      className="payment"
      {...{ onChange }}
    >
      <Input
        type="text"
        name="name"
        label="Name as it appears on your card"
        data-testid="name"
        placeholder="Full Name"
        required
        autoFocus
        spellCheck={false}
        onValidate={validateName}
      />

      <FieldGroup>
        <StripeElement
          component={CardNumberElement}
          name="creditCardNumber"
          label="Card number"
          style={stripeElementStyles}
          className="input-row input-row--xl"
          required
        />

        <StripeElement
          component={CardExpiryElement}
          name="expDate"
          label="Exp. date"
          style={stripeElementStyles}
          required
        />

        <StripeElement
          component={CardCVCElement}
          name="cvc"
          label="CVC"
          style={stripeElementStyles}
          required
        />

        <Input
          type="text"
          name="zip"
          label="ZIP code"
          maxLength={5}
          minLength={5}
          required
          data-testid="zip"
          placeholder="12345"
          onValidate={validateZip}
        />
      </FieldGroup>

      {confirm && plan && (
        <Checkbox data-testid="confirm" name="confirm" required>
          I authorize Mozilla, maker of Firefox products, to charge my payment
          method{' '}
          <strong>
            ${`${formatCurrencyInCents(plan.amount)} per ${plan.interval}`}
          </strong>
          , according to payment terms, until I cancel my subscription.
        </Checkbox>
      )}

      {onCancel ? (
        <div className="button-row">
          <button
            data-testid="cancel"
            className="settings-button cancel secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <SubmitButton
            data-testid="submit"
            className="settings-button primary-button"
            name="submit"
            disabled={inProgress}
          >
            {inProgress ? (
              <span data-testid="spinner-update" className="spinner">
                &nbsp;
              </span>
            ) : (
              <span>Update</span>
            )}
          </SubmitButton>
        </div>
      ) : (
        <div className="button-row">
          <SubmitButton
            data-testid="submit"
            name="submit"
            disabled={inProgress}
          >
            {inProgress ? (
              <span data-testid="spinner-submit" className="spinner">
                &nbsp;
              </span>
            ) : (
              <span>Submit</span>
            )}
          </SubmitButton>
        </div>
      )}

      <PaymentLegalBlurb />
    </Form>
  );
};

/* istanbul ignore next - skip testing react-stripe-elements plumbing */
const InjectedPaymentForm = injectStripe(PaymentForm);

/* istanbul ignore next - skip testing react-stripe-elements plumbing */
const WrappedPaymentForm = (props: PaymentFormProps) => (
  <Elements>
    <InjectedPaymentForm {...props} />
  </Elements>
);

export const SMALL_DEVICE_RULE = '(max-width: 520px)';
export const SMALL_DEVICE_LINE_HEIGHT = '40px';
export const DEFAULT_LINE_HEIGHT = '48px';

export function mkStripeElementStyles(useSmallDeviceStyles: boolean) {
  let lh = useSmallDeviceStyles
    ? SMALL_DEVICE_LINE_HEIGHT
    : DEFAULT_LINE_HEIGHT;
  // ref: https://stripe.com/docs/stripe-js/reference#the-elements-object
  return {
    base: {
      //TODO: Figure out what this really should be - I just copied it from computed styles because CSS can't apply through the iframe
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: lh,
    },
    invalid: {
      color: '#0c0c0d',
    },
  };
}

const validateName: OnValidateFunction = (value, focused) => {
  let valid = true;
  if (value !== null && !value) {
    valid = false;
  }
  return {
    value,
    valid,
    error: !valid && !focused ? 'Please enter your name' : null,
  };
};

const validateZip: OnValidateFunction = (value, focused) => {
  let valid = undefined;
  let error = null;
  value = ('' + value).substr(0, 5);
  if (!value) {
    valid = false;
    error = 'Zip code is required';
  } else if (value.length !== 5 && !focused) {
    valid = false;
    error = 'Zip code is too short';
  } else if (value.length == 5) {
    valid = true;
  }
  return {
    value,
    valid,
    error: !focused ? error : null,
  };
};

export default WrappedPaymentForm;
