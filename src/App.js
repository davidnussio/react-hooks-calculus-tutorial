// @ts-check

import React, { useEffect, useState, useCallback } from "react";
import classNames from "classnames";
import "./App.css";

// msg.volume = 1; // 0 to 1
// msg.rate = 1; // 0.1 to 10
// msg.pitch = 2; //0 to 2
// msg.text = "Hello World";

function getSpeechMessage(text, callback = () => {}) {
  const voices = window.speechSynthesis.getVoices();
  const msg = new SpeechSynthesisUtterance();
  msg.voice = voices[9];
  msg.voiceURI = "native";
  msg.lang = "it-IT";
  msg.text = text;
  msg.onend = callback;
  return msg;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //Il max è incluso e il min è incluso
}

function getCalculus(min, max, operator) {
  const a = getRandomIntInclusive(min, max);
  const b = getRandomIntInclusive(min, max);
  if (operator === "x") {
    return [a, b, a * b];
  } else if (operator === "+") {
    return [a, b, a + b];
  }
}

function getCorrectMotivationMessage() {
  const messages = ["Bravo!", "Ok!", "Continua così", "Perfetto"];
  return messages[getRandomIntInclusive(0, messages.length - 1)];
}

function parseResponse(response) {
  if (response === null) {
    return "＿";
  }
  const numbersFound = response.replace(/[^0-9 ]/).split(" ");
  return parseInt(numbersFound[numbersFound.length - 1], 10);
}

function useResultHistory() {
  const KEY = "__history_results_storage__";
  const storage = window.localStorage;

  const [history, setHistory] = useState(
    JSON.parse(window.localStorage.getItem(KEY)) || []
  );

  const updateHistory = useCallback(
    nextHistoryItem => {
      if (nextHistoryItem) {
        const updatedHistory = [...history, nextHistoryItem];
        console.log("History", history, nextHistoryItem, updatedHistory);
        setHistory(updatedHistory);
        storage.setItem(KEY, JSON.stringify(updatedHistory));
      }
    },
    [history]
  );

  return [history, save => updateHistory(save)];
}

const Calculus = ({ a, b, operator, result, response }) => {
  if (a !== undefined && b !== undefined) {
    return (
      <p>
        {a} {operator} {b} = {response ? result : "?"}
      </p>
    );
  }
  return <p>&nbsp;</p>;
};

const Response = ({ isCorrectAnswer, response, result }) => {
  const classes = classNames({
    correct: isCorrectAnswer,
    error: !isCorrectAnswer
  });
  if (response) {
    return (
      <p>
        La tua risposta è <b>{response}</b>.<br />
        {isCorrectAnswer ? (
          <i className={classes}>Bravo, la risposta è corretta!</i>
        ) : (
          <i className={classes}>
            La risposta è sbagliata, il risultato era <b>{result}</b>!
          </i>
        )}
      </p>
    );
  }
  return <p>&nbsp;</p>;
};

const History = ({ history }) => {
  return (
    <table>
      <tbody>
        {history.map(
          ([a, b, operator, response, speechRecognition, result], i) => {
            const isCorrectAnswer = response === result;
            return (
              <tr key={i} className="App-history-wrapper">
                <td>{a}</td>
                <td>{operator}</td>
                <td>{b}</td>
                <td>=</td>
                <td>{response === "NaN" ? speechRecognition : response}</td>

                {isCorrectAnswer ? (
                  <td>
                    <span className="correct">✔</span>
                  </td>
                ) : (
                  <>
                    <td>
                      <span className="error">✘</span>
                    </td>
                    <td>
                      <b>({result})</b>
                    </td>
                  </>
                )}
              </tr>
            );
          }
        )}
      </tbody>
    </table>
  );
};

function useSpeechRecognition(listening = false) {
  const [speechResponse, setSpeechResponse] = useState(undefined);
  const [recognition] = useState(() => {
    const instance = new window.webkitSpeechRecognition();
    instance.continuous = false;
    instance.interimResults = false;
    instance.lang = ["it-IT", "Italia"];
    return instance;
  });

  recognition.onstart = function() {
    console.log("# recognition → onstart");
  };

  recognition.onresult = function(event) {
    console.log("# recognition → onresult");
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        setSpeechResponse(event.results[i][0].transcript);
      } else {
        console.warn("Not implemented");
      }
    }
  };
  recognition.onerror = function() {
    console.log("# recognition → onerror");
    setSpeechResponse(null); //"＿");
  };
  recognition.onend = function() {
    console.log("# recognition → onend");
    setSpeechResponse(prevState => prevState);
  };

  useEffect(() => {
    if (listening === true && recognition) {
      recognition.start();
    } else {
      recognition.stop();
    }
  }, [listening]);

  return speechResponse;
}

function App({ min = 0, max = 10, operator = "x" }) {
  const [calculus, setCalculus] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [response, setResponse] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);

  const [a, b, result] = calculus;

  const [history, saveHistory] = useResultHistory();

  const speechRecognition = useSpeechRecognition(listening);

  useEffect(() => {
    if (speechRecognition !== undefined) {
      const userResult = parseResponse(speechRecognition);
      saveHistory([a, b, operator, userResult, speechRecognition, result]);
      setResponse(userResult);
      setIsCorrectAnswer(result === userResult);
      setListening(false);
    }
  }, [speechRecognition]);

  useEffect(() => {
    if (speaking && Number.isNaN(a) === false && Number.isNaN(b) === false) {
      const msg = getSpeechMessage(`${a} x ${b}`, event => {
        setSpeaking(false);
        setListening(true);
      });
      window.speechSynthesis.speak(msg);
    }
  }, [speaking]);

  useEffect(() => {
    if (isCorrectAnswer) {
      const msg = getSpeechMessage(getCorrectMotivationMessage());
      speechSynthesis.speak(msg);
    }
  }, [isCorrectAnswer]);

  useCallback(() => {
    setIsCorrectAnswer(null);
    setResponse(null);
    setCalculus(getCalculus(min, max, operator));
    setSpeaking(true);
  }, [min, max, operator]);

  return (
    <div className="App">
      <div className="App-header">
        <div className="App-results">
          <History history={history} />
        </div>
        <div className="App-main">
          <Calculus
            a={a}
            b={b}
            operator={operator}
            result={result}
            response={response}
          />

          <Response
            isCorrectAnswer={isCorrectAnswer}
            response={response}
            result={result}
          />

          <p>
            <button
              className="App-button"
              disabled={speaking || listening}
              onClick={e => {
                setIsCorrectAnswer(null);
                setResponse(null);
                setCalculus(getCalculus(min, max, operator));
                setSpeaking(true);
              }}
            >
              Avanti...
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
