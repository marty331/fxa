import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Form,
  FieldGroup,
  Input,
  SubmitButton,
  Checkbox,
  OnValidateFunction,
} from '../fields';
import {
  State as ValidatorState,
  MiddlewareReducer as ValidatorMiddlewareReducer,
  useValidatorState,
} from '../../lib/validator';
import Questions from './Questions';
import { selectors, SelectorReturns } from '../../store/selectors';
import {
  SurveyQuestions,
  SurveyQuestion,
  SurveyQuestionOptions,
} from '../../store/types';

import './index.scss';

export type SurveyFormProps = {
  inProgress?: boolean;
  questions: SelectorReturns['surveyQuestions'];
  onCancel?: () => void;
  validatorInitialState?: ValidatorState;
  validatorMiddlewareReducer?: ValidatorMiddlewareReducer;
};

export const SurveyForm = ({
  inProgress = false,
  questions,
  onCancel,
  validatorInitialState,
  validatorMiddlewareReducer,
}: SurveyFormProps) => {
  // componentDidMount(){
  //
  //   axios.get(url)
  //   .then(res => this.setState({ questions: res.data['data']['pages'][0]['questions']}))
  // }

  useEffect(() => {}, [questions]);

  const sendAnswer = () => {
    // const answers = this.state.answers;
    // axios.put(sendUrl, { answers }, {
    //     headers: {
    //         'Content-Type': 'application/json; charset=utf-8',
    //     }
    // })
    // this.props.history.push('/product');
  };

  const questionCallback = (data: object) => {
    console.log('question callback {data}');
    // var answer_node = this.state.answers;
    // var in_answer = answer_node.find( answer_node => answer_node['questionId'] === data['questionId'] );
    // if (typeof in_answer !== 'undefined'){
    //   var objIndex = answer_node.findIndex((obj => obj.questionId === data['questionId']));
    //   answer_node[objIndex].value = data['value']
    //   this.setState({answers: answer_node}, () => console.log('answers: ', this.state));
    // } else {
    //   const answer_node = this.state.answers.concat(data);
    //   this.setState({answers: answer_node}, () => console.log('answers: ', this.state));
    // }
  };
  const validator = useValidatorState({
    initialState: validatorInitialState,
    middleware: validatorMiddlewareReducer,
  });

  const onChange = useCallback(() => {}, []);

  const onSubmit = useCallback(
    ev => {
      ev.preventDefault();
      if (!validator.allValid()) {
        return;
      }
      const { name, zip } = validator.getValues();
      console.log('name =' + name + ' zip =' + zip);
      sendAnswer();
    },
    [validator]
  );
  console.log('onmounted questions: ' + JSON.stringify(questions));
  return (
    <Form
      data-testid="surveyForm"
      validator={validator}
      onSubmit={onSubmit}
      className="survey"
      {...{ onChange }}
    >
      <p className="userMessage">
        Please take a moment to tell us about your experience.
      </p>
      <Questions
        {...{
          questions: surveyQuestions1,
        }}
      />
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
    </Form>
  );
};

export default SurveyForm;

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
