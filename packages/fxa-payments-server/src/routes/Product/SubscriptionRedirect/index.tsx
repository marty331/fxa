import React, { useEffect, useContext, useState } from 'react';
import {
  Plan,
  SurveyQuestions,
  SurveyQuestion,
  SurveyQuestionOptions,
} from '../../../store/types';
import { AppContext } from '../../../lib/AppContext';
import SurveyForm from '../../../components/SurveyForm';
import { selectors, SelectorReturns } from '../../../store/selectors';
import fpnImage from '../../../images/fpn';
import './index.scss';
import { apiFetchSurvey } from '../../../lib/apiClient';

import { ProductProps } from '../index';

const defaultProductRedirectURL = 'https://mozilla.org';

const surveyquestionoptions1: SurveyQuestionOptions = {
  id: 1,
  title: 'A little',
  value: '1',
  selected: false,
};
const surveyquestionoptions2: SurveyQuestionOptions = {
  id: 2,
  title: 'Some',
  value: '2',
  selected: false,
};
const surveyquestionoptions3: SurveyQuestionOptions = {
  id: 3,
  title: 'OK',
  value: '3',
  selected: false,
};
const surveyquestionoptions4: SurveyQuestionOptions = {
  id: 4,
  title: 'It was good',
  value: '4',
  selected: false,
};
const surveyquestionoptions5: SurveyQuestionOptions = {
  id: 5,
  title: 'Loved it!',
  value: '5',
  selected: false,
};

const surveyquestion: SurveyQuestion = {
  id: 1,
  base_type: 'Question',
  type: 'RADIO',
  title: 'Do you like Firefox',
  shortname: 'like',
  value: '',
  options: [
    surveyquestionoptions1,
    surveyquestionoptions2,
    surveyquestionoptions3,
    surveyquestionoptions4,
    surveyquestionoptions5,
  ],
};

const surveyquestion2: SurveyQuestion = {
  id: 2,
  base_type: 'Question',
  type: 'RADIO',
  title: 'Do you like Running',
  shortname: 'run',
  value: '',
  options: [
    surveyquestionoptions1,
    surveyquestionoptions2,
    surveyquestionoptions3,
    surveyquestionoptions4,
    surveyquestionoptions5,
  ],
};
const surveyquestion3: SurveyQuestion = {
  id: 3,
  base_type: 'Question',
  type: 'TEXTBOX',
  title: 'Please provide your feedback.',
  shortname: 'feedback',
  value: '',
  options: [],
};

const surveyQuestions1: SurveyQuestions = {
  surveyQuestions: [surveyquestion, surveyquestion2, surveyquestion3],
};

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
    config: { productRedirectURLs },
    navigateToUrl,
  } = useContext(AppContext);

  const redirectUrl =
    productRedirectURLs[product_id] || defaultProductRedirectURL;

  console.log('survey questions: ' + surveyQuestions);

  return (
    <div className="product-payment" data-testid="subscription-redirect">
      <div className="subscription-ready">
        <img alt="Firefox Private Network" src={fpnImage} />
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

export default SubscriptionRedirect;
