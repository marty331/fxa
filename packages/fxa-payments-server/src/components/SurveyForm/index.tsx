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
import { SurveyQuestions } from '../../store/types';
import Questions from './Questions';

import './index.scss';

export type SurveyFormProps = {
  inProgress?: boolean;
  questions: SurveyQuestions;
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
          questions: questions,
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
