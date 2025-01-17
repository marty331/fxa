import React from 'react';
import {
  render,
  cleanup,
  act,
  fireEvent,
  RenderResult,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import nock from 'nock';
import waitForExpect from 'wait-for-expect';

import { getErrorMessage, PAYMENT_ERROR_2 } from '../../lib/errors';
import {
  STRIPE_FIELDS,
  PLAN_ID,
  PRODUCT_NAME,
  PRODUCT_ID,
  PRODUCT_REDIRECT_URLS,
  MOCK_PLANS,
  MOCK_PROFILE,
  MOCK_ACTIVE_SUBSCRIPTIONS,
  MOCK_ACTIVE_SUBSCRIPTIONS_AFTER_SUBSCRIPTION,
  MOCK_CUSTOMER,
  MOCK_CUSTOMER_AFTER_SUBSCRIPTION,
  expectNockScopesDone,
  defaultAppContextValue,
  MockApp,
  setupMockConfig,
  mockConfig,
  mockServerUrl,
  mockOptionsResponses,
  mockStripeElementOnChangeFns,
  elementChangeResponse,
  VALID_CREATE_TOKEN_RESPONSE,
} from '../../lib/test-utils';

import FlowEvent from '../../lib/flow-event';
jest.mock('../../lib/flow-event');

import { SignInLayout } from '../../components/AppLayout';
import Product from './index';
import { SMALL_DEVICE_RULE } from '../../components/PaymentForm';
import { ProductMetadata } from '../../store/types';

describe('routes/Product', () => {
  let authServer = '';
  let profileServer = '';

  beforeEach(() => {
    setupMockConfig({
      ...mockConfig,
      productRedirectURLs: PRODUCT_REDIRECT_URLS,
    });
    authServer = mockServerUrl('auth');
    mockOptionsResponses(authServer);
    profileServer = mockServerUrl('profile');
    mockOptionsResponses(profileServer);
  });

  afterEach(() => {
    nock.cleanAll();
    return cleanup();
  });

  const Subject = ({
    productId = PRODUCT_ID,
    planId,
    accountActivated,
    matchMedia = jest.fn(() => false),
    navigateToUrl = jest.fn(),
    createToken = jest.fn().mockResolvedValue(VALID_CREATE_TOKEN_RESPONSE),
  }: {
    productId?: string;
    planId?: string;
    matchMedia?: (query: string) => boolean;
    navigateToUrl?: (url: string) => void;
    accountActivated?: string;
    createToken?: jest.Mock<any, any>;
  }) => {
    const props = {
      match: {
        params: {
          productId,
        },
      },
      createSubscriptionMounted: () => {},
      createSubscriptionEngaged: () => {},
    };
    const mockStripe = {
      createToken,
    };
    const appContextValue = {
      ...defaultAppContextValue(),
      matchMedia,
      navigateToUrl: navigateToUrl || jest.fn(),
      queryParams: {
        plan: planId,
        activated: accountActivated,
      },
    };
    return (
      <MockApp {...{ mockStripe, appContextValue }}>
        <SignInLayout>
          <Product {...props} />
        </SignInLayout>
      </MockApp>
    );
  };

  // To exercise the default icon fallback, delete webIconURL from the first plan.
  const varyPlansForDefaultIcon = (useDefaultIcon: boolean = false) =>
    !useDefaultIcon
      ? MOCK_PLANS
      : [
          {
            ...MOCK_PLANS[0],
            product_metadata: {
              ...MOCK_PLANS[0].product_metadata,
              webIconURL: null,
            },
          },
          ...MOCK_PLANS.slice(1),
        ];

  const initApiMocks = (
    displayName?: string,
    useDefaultIcon: boolean = false
  ) => [
    nock(profileServer)
      .get('/v1/profile')
      .reply(200, { ...MOCK_PROFILE, displayName }),
    nock(authServer)
      .get('/v1/oauth/subscriptions/plans')
      .reply(200, varyPlansForDefaultIcon(useDefaultIcon)),
    nock(authServer)
      .get('/v1/oauth/subscriptions/active')
      .reply(200, MOCK_ACTIVE_SUBSCRIPTIONS),
    nock(authServer)
      .get('/v1/oauth/subscriptions/customer')
      .reply(200, MOCK_CUSTOMER),
  ];

  const initSubscribedApiMocks = (useDefaultIcon: boolean = false) => [
    nock(profileServer)
      .get('/v1/profile')
      .reply(200, MOCK_PROFILE),
    nock(authServer)
      .get('/v1/oauth/subscriptions/plans')
      .reply(200, varyPlansForDefaultIcon(useDefaultIcon)),
    nock(authServer)
      .get('/v1/oauth/subscriptions/active')
      .reply(200, MOCK_ACTIVE_SUBSCRIPTIONS_AFTER_SUBSCRIPTION),
    nock(authServer)
      .get('/v1/oauth/subscriptions/customer')
      .reply(200, MOCK_CUSTOMER_AFTER_SUBSCRIPTION),
  ];

  const withExistingAccount = (useDisplayName?: boolean) => async () => {
    const displayName = useDisplayName ? 'Foo Barson' : undefined;
    const apiMocks = initApiMocks(displayName);
    const { findByText, queryByText, queryByTestId } = render(<Subject />);
    if (window.onload) {
      dispatchEvent(new Event('load'));
    }
    await findByText("Let's set up your subscription");
    expect(
      queryByText(`${PRODUCT_NAME} for $5.00 per month`)
    ).toBeInTheDocument();
    expect(queryByTestId('account-activated')).not.toBeInTheDocument();
    expect(queryByTestId('profile-email')).toBeInTheDocument();
    if (displayName) {
      expect(queryByTestId('profile-display-name')).toBeInTheDocument();
    }
    expectNockScopesDone(apiMocks);

    expect(FlowEvent.logPerformanceEvent).toBeCalledWith('product', 9001);
  };

  it('renders with valid product ID', withExistingAccount(false));

  it('renders with product ID and display name', withExistingAccount(true));

  const withActivationBanner = (useDisplayName?: boolean) => async () => {
    const displayName = useDisplayName ? 'Foo Barson' : undefined;
    const apiMocks = initApiMocks(displayName);
    const { findByText, queryByText, queryByTestId } = render(
      <Subject planId={PLAN_ID} accountActivated="true" />
    );
    await findByText("Let's set up your subscription");
    expect(
      queryByText(`${PRODUCT_NAME} for $5.00 per month`)
    ).toBeInTheDocument();
    expect(queryByTestId('account-activated')).toBeInTheDocument();
    if (displayName) {
      expect(queryByTestId('activated-display-name')).toBeInTheDocument();
      expect(queryByTestId('activated-email')).not.toBeInTheDocument();
    } else {
      expect(queryByTestId('activated-display-name')).not.toBeInTheDocument();
      expect(queryByTestId('activated-email')).toBeInTheDocument();
    }
    expectNockScopesDone(apiMocks);
  };

  it(
    'renders with ?plan={PLAN_ID}&accountActivated given in query string',
    withActivationBanner(false)
  );
  it(
    'renders with display name and ?plan={PLAN_ID}&accountActivated given in query string',
    withActivationBanner(true)
  );

  it('displays an error with invalid product ID', async () => {
    const apiMocks = initApiMocks();
    const { findByTestId } = render(<Subject productId="bad_product" />);
    await findByTestId('no-such-plan-error');
    expectNockScopesDone(apiMocks);
  });

  it('displays an error on failure to load profile', async () => {
    const apiMocks = [
      nock(profileServer)
        .get('/v1/profile')
        .reply(400, MOCK_PROFILE),
      nock(authServer)
        .get('/v1/oauth/subscriptions/plans')
        .reply(200, MOCK_PLANS),
      nock(authServer)
        .get('/v1/oauth/subscriptions/active')
        .reply(200, MOCK_ACTIVE_SUBSCRIPTIONS),
      nock(authServer)
        .get('/v1/oauth/subscriptions/customer')
        .reply(200, MOCK_CUSTOMER),
    ];
    const { findByTestId } = render(<Subject />);
    await findByTestId('error-loading-profile');
  });

  it('displays an error on failure to load plans', async () => {
    const apiMocks = [
      nock(profileServer)
        .get('/v1/profile')
        .reply(200, MOCK_PROFILE),
      nock(authServer)
        .get('/v1/oauth/subscriptions/plans')
        .reply(400, MOCK_PLANS),
      nock(authServer)
        .get('/v1/oauth/subscriptions/active')
        .reply(200, MOCK_ACTIVE_SUBSCRIPTIONS),
      nock(authServer)
        .get('/v1/oauth/subscriptions/customer')
        .reply(200, MOCK_CUSTOMER),
    ];
    const { findByTestId } = render(<Subject />);
    await findByTestId('error-loading-plans');
  });

  it('displays an error on failure to load customer', async () => {
    const apiMocks = [
      nock(profileServer)
        .get('/v1/profile')
        .reply(200, MOCK_PROFILE),
      nock(authServer)
        .get('/v1/oauth/subscriptions/plans')
        .reply(200, MOCK_PLANS),
      nock(authServer)
        .get('/v1/oauth/subscriptions/active')
        .reply(200, MOCK_ACTIVE_SUBSCRIPTIONS),
      nock(authServer)
        .get('/v1/oauth/subscriptions/customer')
        .reply(400, MOCK_CUSTOMER),
    ];
    const { findByTestId } = render(<Subject />);
    await findByTestId('error-loading-customer');
  });

  async function commonSubmitSetup(
    createToken: jest.Mock<any, any>,
    useDefaultIcon: boolean = false
  ) {
    const apiMocks = [
      ...initApiMocks(undefined, useDefaultIcon),
      nock(authServer)
        .post('/v1/oauth/subscriptions/active')
        .reply(200, {}),
      nock(authServer)
        .get('/v1/oauth/subscriptions/active')
        .reply(200, MOCK_ACTIVE_SUBSCRIPTIONS_AFTER_SUBSCRIPTION),
      nock(authServer)
        .get('/v1/oauth/subscriptions/customer')
        .reply(200, MOCK_CUSTOMER_AFTER_SUBSCRIPTION),
    ];

    const navigateToUrl = jest.fn();
    const matchMedia = jest.fn(() => false);
    const renderResult = render(
      <Subject {...{ matchMedia, navigateToUrl, createToken }} />
    );
    const { getByTestId, findByText } = renderResult;

    await findByText("Let's set up your subscription");

    act(() => {
      for (const testid of STRIPE_FIELDS) {
        mockStripeElementOnChangeFns[testid](
          elementChangeResponse({ complete: true, value: 'test' })
        );
      }
    });
    fireEvent.change(getByTestId('name'), { target: { value: 'Foo Barson' } });
    fireEvent.blur(getByTestId('name'));
    fireEvent.change(getByTestId('zip'), { target: { value: '90210' } });
    fireEvent.blur(getByTestId('zip'));
    fireEvent.click(getByTestId('confirm'));

    return { ...renderResult, matchMedia, navigateToUrl, apiMocks };
  }

  const expectProductImage = ({
    getByAltText,
    useDefaultIcon = false,
  }: {
    getByAltText: RenderResult['getByAltText'];
    useDefaultIcon?: boolean;
  }) => {
    const productMetadata = MOCK_PLANS[0].product_metadata as ProductMetadata;
    const productImg = getByAltText(PRODUCT_NAME);
    const imgSrc = productImg.getAttribute('src');
    if (useDefaultIcon) {
      // Default icon will be inlined, but let's just look for the data:image prefix
      expect(imgSrc).toMatch(/^data:image/);
    } else {
      expect(imgSrc).toEqual(productMetadata.webIconURL);
    }
  };

  const withProductImageTests = (useDefaultIcon = false) => () => {
    it('handles a successful payment submission as expected', async () => {
      const createToken = jest
        .fn()
        .mockResolvedValue(VALID_CREATE_TOKEN_RESPONSE);
      const {
        getByAltText,
        getByTestId,
        findByText,
        queryByText,
        matchMedia,
        navigateToUrl,
        apiMocks,
      } = await commonSubmitSetup(createToken, useDefaultIcon);

      fireEvent.click(getByTestId('submit'));

      await findByText('Your subscription is ready');
      expectProductImage({ getByAltText, useDefaultIcon });
      expect(matchMedia).toBeCalledWith(SMALL_DEVICE_RULE);
      expect(createToken).toBeCalled();
      expect(queryByText('Firefox Tanooki Suit')).toBeInTheDocument();
      expect(
        queryByText("Click here if you're not automatically redirected")
      ).toBeInTheDocument();
      expect(navigateToUrl).toBeCalledWith('https://example.com/product');
      expectNockScopesDone(apiMocks);
    });

    it('redirects to product page if user is already subscribed', async () => {
      const apiMocks = initSubscribedApiMocks(useDefaultIcon);

      const navigateToUrl = jest.fn();
      const matchMedia = jest.fn(() => false);
      const createToken = jest
        .fn()
        .mockResolvedValue(VALID_CREATE_TOKEN_RESPONSE);

      const { findByText, queryByText, getByAltText } = render(
        <Subject {...{ matchMedia, navigateToUrl, createToken }} />
      );

      await findByText('Your subscription is ready');
      expectProductImage({ getByAltText, useDefaultIcon });
      expect(createToken).not.toBeCalled();
      expect(queryByText('Firefox Tanooki Suit')).toBeInTheDocument();
      expect(
        queryByText("Click here if you're not automatically redirected")
      ).toBeInTheDocument();
      expect(navigateToUrl).toBeCalledWith('https://example.com/product');
      expectNockScopesDone(apiMocks);
    });
  };

  describe('with product icon defined', withProductImageTests(false));

  describe('with default product icon', withProductImageTests(true));

  it('displays an error if payment submission somehow silently fails', async () => {
    const createToken = jest.fn().mockResolvedValue({});
    const {
      getByTestId,
      findByTestId,
      queryByTestId,
    } = await commonSubmitSetup(createToken);
    fireEvent.click(getByTestId('submit'));
    await findByTestId('error-payment-submission');
  });

  it('displays an error on failure to submit payment', async () => {
    const createToken = jest.fn().mockRejectedValue({
      type: 'call_issuer',
    });
    const { getByTestId, findByTestId, queryByText } = await commonSubmitSetup(
      createToken
    );
    fireEvent.click(getByTestId('submit'));
    await findByTestId('error-payment-submission');
    expect(queryByText(PAYMENT_ERROR_2)).toBeInTheDocument();
  });

  async function commonCreateSubscriptionFailSetup(
    code: string,
    message: string
  ) {
    const apiMocks = [
      ...initApiMocks(),
      nock(authServer)
        .post('/v1/oauth/subscriptions/active')
        .reply(400, {
          code,
          message,
        }),
    ];
    const renderResult = render(<Subject />);
    const { getByTestId, findByText } = renderResult;

    await findByText("Let's set up your subscription");
    act(() => {
      for (const testid of STRIPE_FIELDS) {
        mockStripeElementOnChangeFns[testid](
          elementChangeResponse({ complete: true, value: 'test' })
        );
      }
    });
    fireEvent.change(getByTestId('name'), { target: { value: 'Foo Barson' } });
    fireEvent.blur(getByTestId('name'));
    fireEvent.change(getByTestId('zip'), { target: { value: '90210' } });
    fireEvent.blur(getByTestId('zip'));
    fireEvent.click(getByTestId('confirm'));

    return renderResult;
  }

  it('displays error based on `card_error` during subscription creation if card declines', async () => {
    const message = getErrorMessage('card_error');
    const {
      getByTestId,
      queryByText,
      findByTestId,
    } = await commonCreateSubscriptionFailSetup('card_declined', message);
    fireEvent.click(getByTestId('submit'));

    await findByTestId('error-card-rejected');
    expect(queryByText(message)).toBeInTheDocument();

    // hide on form change
    fireEvent.change(getByTestId('zip'), { target: { value: '12345' } });
    await waitForExpect(() =>
      expect(queryByText(message)).not.toBeInTheDocument()
    );
  });

  it('displays error based on `card_error` during subscription creation if card CVC is incorrect', async () => {
    const message = getErrorMessage('card_error');
    const {
      getByTestId,
      queryByText,
      findByTestId,
    } = await commonCreateSubscriptionFailSetup('incorrect_cvc', message);
    fireEvent.click(getByTestId('submit'));

    await findByTestId('error-card-rejected');
    expect(queryByText(message)).toBeInTheDocument();

    // hide on form change
    fireEvent.change(getByTestId('zip'), { target: { value: '12345' } });
    await waitForExpect(() =>
      expect(queryByText(message)).not.toBeInTheDocument()
    );
  });

  it('displays an error if subscription creation fails for some other reason', async () => {
    const message = 'We done goofed';
    const {
      getByTestId,
      queryByText,
      findByTestId,
    } = await commonCreateSubscriptionFailSetup('api_error', message);
    fireEvent.click(getByTestId('submit'));
    await findByTestId('error-subscription-failed');
    expect(queryByText(message)).toBeInTheDocument();
  });

  it('offers upgrade if user is already subscribed to another plan in the same product set', async () => {
    const apiMocks = initSubscribedApiMocks();
    const { findByTestId } = render(
      <Subject
        {...{
          planId: 'plan_upgrade',
          productId: 'prod_upgrade',
        }}
      />
    );
    await findByTestId('subscription-upgrade');
    expectNockScopesDone(apiMocks);
  });
});
