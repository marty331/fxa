import React, { useCallback, useContext, useEffect } from 'react';
import Question from './Question';
import { SurveyQuestions } from '../../store/types';

type QuestionsProps = {
  questions: SurveyQuestions;
};

export const Questions = ({ questions }: QuestionsProps) => {
  useEffect(() => {
    const seeData = () => {
      questions!.surveyQuestions.map(sendQuestion =>
        console.log(sendQuestion.title)
      );
    };
    seeData();
  });

  return (
    <div className="surveyContainer">
      {questions!.surveyQuestions.map(sendQuestion => (
        <Question
          key={String(sendQuestion.id) + sendQuestion.shortname}
          question={sendQuestion}
        />
      ))}
    </div>
  );
};

export default Questions;
