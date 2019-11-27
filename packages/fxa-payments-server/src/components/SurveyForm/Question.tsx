import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SurveyQuestion, SurveyQuestionOptions } from '../../store/types';

type QuestionProps = {
  question: SurveyQuestion;
};

export const Question = ({ question }: QuestionProps) => {
  console.log({ question });

  const handleChange = (
    val: string,
    id: number,
    questionId: number
  ): string => {
    console.log(
      'radio handle change: ' + val + ' id:' + id + ' questionId ' + questionId
    );
    setValue(val);
    if (question.type === 'TEXTBOX') {
      question.value = val;
    }
    question.options.map(option => {
      if (option.id == id) {
        option.selected = true;
      } else {
        option.selected = false;
      }
    });
    console.log('question ' + question);
    return val;
  };

  const [selectedValue, setValue] = useState('');

  const type = question!.type;
  if (type === 'RADIO') {
    return (
      <div className="questionParent">
        <p className="questionTitle">{question.title}</p>
        <div className="radioGroup">
          {question.options!.map(option => (
            <div key={String(option.id) + option.title} className="radioButton">
              <label htmlFor={String(option.id)}>{option.title}</label>
              <input
                type="radio"
                checked={option.value === selectedValue}
                value={option.value}
                onChange={e =>
                  handleChange(e.target.value, option.id, question.id)
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div className="questionParent">
        <p className="questionTitle">{question.title}</p>
        <textarea
          id={String(question.id)}
          name={question.shortname}
          value={selectedValue}
          onChange={e => handleChange(e.target.value, 0, question.id)}
        ></textarea>
      </div>
    );
  }
};

export default Question;
