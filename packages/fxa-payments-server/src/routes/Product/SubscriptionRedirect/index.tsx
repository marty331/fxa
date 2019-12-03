import React, { useEffect, useContext, useState } from 'react';
import { connect } from 'react-redux';
import { Plan } from '../../../store/types';
import { AppContext } from '../../../lib/AppContext';
import SurveyForm from '../../../components/SurveyForm';
import { selectors, SelectorReturns } from '../../../store/selectors';
import { metadataFromPlan } from '../../../store/utils';
import fpnImage from '../../../images/fpn';
import './index.scss';
import { apiFetchSurvey } from '../../../lib/apiClient';

import { ProductProps } from '../index';
import actions from '../../../store/actions';
import { State } from '../../../store/state';

const defaultProductRedirectURL = 'https://mozilla.org';

// const [surveyQuestions, setSurveys] = useState(surveyQuestions);

export type SubscriptionRedirectProps = {
  plan: Plan;
  surveyQuestions: SelectorReturns['surveyQuestions'];
};

export const SubscriptionRedirect = ({
  plan: { product_id, product_name },
  surveyQuestions,
}: SubscriptionRedirectProps) => {
  const {
    config: { productRedirectURLs, survey, stripe, servers },
    navigateToUrl,
  } = useContext(AppContext);

  const redirectUrl =
    productRedirectURLs[product_id] || defaultProductRedirectURL;
  console.log('survey: ' + JSON.stringify(survey));
  console.log('survey api: ' + process.env.SURVEY_API_TOKEN);
  console.log('stripe: ' + JSON.stringify(stripe));
  console.log('servers: ' + JSON.stringify(servers));
  console.log('surveyQuestions: ' + JSON.stringify(surveyQuestions));
  const surveys = apiFetchSurvey();
  console.log('surveys: ' + JSON.stringify(surveys));

  return (
    <div className="product-payment" data-testid="subscription-redirect">
      <div className="subscription-ready">
        <h2>Your subscription is ready</h2>
        <div className="formBreak"></div>
        <SurveyForm
          {...{
            questions: surveyQuestions,
          }}
        />

        <div className="formBreak breakBuffer"></div>
        <a href={redirectUrl}>No thanks, just take me to {product_name}.</a>
      </div>
    </div>
  );
};

export default connect(
  (state: State) => ({
    surveyQuestions: selectors.surveyQuestions(state),
  }),
  {
    fetchSurveyRouteResources: actions.fetchSurvey,
  }
)(SubscriptionRedirect);
