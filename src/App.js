import React, { useEffect, useState, useMemo } from "react";
import classNames from "classnames";
import "./App.css";

// msg.volume = 1; // 0 to 1
// msg.rate = 1; // 0.1 to 10
// msg.pitch = 2; //0 to 2
// msg.text = "Hello World";

var recognition = new window.webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = ["it-IT", "Italia"];

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

function getCalculus(min, max) {
  const a = getRandomIntInclusive(min, max);
  const b = getRandomIntInclusive(min, max);
  return [a, b, a * b];
}

function parseResponse(response) {
  const numbersFound = response.replace(/[^0-9 ]/).split(" ");
  return parseInt(numbersFound[numbersFound.length - 1], 10);
}

function getCorrectMotivationMessage() {
  const messages = ["Bravo!", "Ok!", "Continua così", "Perfetto"];
  return messages[getRandomIntInclusive(0, messages.length - 1)];
}

const Calculus = ({ a, b, operator, result, response }) => {
  if (a && b) {
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
            La risposta è sbagliata <b>{result}</b>!
          </i>
        )}
      </p>
    );
  }
  return <p>&nbsp;</p>;
};

const History = ({ history }) => {
  return (
    <ul>
      {history.map(([a, b, operator, response, result], i) => {
        const isCorrectAnswer = response === result;
        return (
          <li key={i}>
            {a} {operator} {b} = {response}{" "}
            {isCorrectAnswer ? (
              <span className="correct">✔</span>
            ) : (
              <>
                <span className="error">✘</span> <b>({result})</b>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};

function App({ min = 6, max = 9, operator = "x" }) {
  const [calculus, setCalculus] = useState(false);
  const [matrix, setMatrix] = useState([]);
  const [listening, setListening] = useState(false);
  const [response, setResponse] = useState();
  const [history, setHistory] = useState([]);

  const [a, b, result] = useMemo(() => {
    if (matrix.length) {
      return matrix[matrix.length - 1];
    }
    return [];
  }, [matrix]);

  // console.log(
  //   "listening",
  //   listening,
  //   "→ ",
  //   a,
  //   operator,
  //   b,
  //   "=",
  //   result,
  //   " → ",
  //   response
  // );

  const isCorrectAnswer = useMemo(() => {
    if (result && response) {
      return result === response;
    }
    return undefined;
  }, [result, response]);

  useEffect(() => {
    if (calculus) {
      setMatrix([...matrix, getCalculus(min, max)]);
    }
  }, [calculus]);

  useEffect(() => {
    if (a && b) {
      const msg = getSpeechMessage(`${a} x ${b}`, event => {
        setListening(true);
      });
      window.speechSynthesis.speak(msg);
    }
  }, [a, b]);

  useEffect(() => {
    if (listening === undefined) {
      return;
    }
    if (listening === true && recognition) {
      recognition.start();
      recognition.onresult = function(event) {
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const speechResponse = parseResponse(
              event.results[i][0].transcript
            );
            setResponse(speechResponse);
            setHistory([...history, [a, b, operator, speechResponse, result]]);
          } else {
            console.warn("Not implemented");
          }
        }
      };
      recognition.onerror = function() {
        setResponse("＿");
        setHistory([...history, [a, b, operator, "＿", result]]);
      };
      recognition.onend = function() {
        console.log("recognition end");
        setListening(false);
        setCalculus(false);
      };
    } else {
      recognition.stop();
    }
  }, [listening]);

  useEffect(() => {
    if (isCorrectAnswer) {
      const msg = getSpeechMessage(getCorrectMotivationMessage());
      speechSynthesis.speak(msg);
    }
  }, [isCorrectAnswer]);

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
              disabled={calculus}
              onClick={e => {
                setResponse();
                setCalculus(true);
              }}
            >
              Via!
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;