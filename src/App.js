import React, { useEffect, useState, useMemo } from "react";
import "./App.css";

var msg = new SpeechSynthesisUtterance();
var voices = window.speechSynthesis.getVoices();
msg.voice = voices[9]; // Note: some voices don't support altering params
msg.voiceURI = "native";
// msg.volume = 1; // 0 to 1
// msg.rate = 1; // 0.1 to 10
// msg.pitch = 2; //0 to 2
// msg.text = "Hello World";
msg.lang = "it-IT";

var recognition = new window.webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = ["it-IT", "Italia"];

// recognition.onstart = function() { ... }
// recognition.onresult = function(event) { ... }
// recognition.onerror = function(event) { ... }
// recognition.onend = function() { ... }

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

function parseResult(response) {
  const numbersFound = response.replace(/[^0-9 ]/).split(" ");
  console.log("numbersFound", numbersFound.toString());
  return numbersFound[numbersFound.length - 1];
}

const Calculus = ({ a, b, operator, result, response }) => {
  if (a && b) {
    return (
      <p>
        {a} {operator} {b} = {response ? result : "?"}
      </p>
    );
  }
  return null;
};

const Response = ({ response, result }) => {
  if (response) {
    return (
      <p>
        La tua risposta è <b>{response}</b>
      </p>
    );
  }
  return "";
};

function App({ min = 6, max = 9 }) {
  const [calculus, setCalculus] = useState(false);
  const [matrix, setMatrix] = useState([]);
  const [listening, setListening] = useState(false);
  const [response, setResponse] = useState();

  const [a, b, result] = useMemo(() => {
    if (matrix.length) {
      return matrix[matrix.length - 1];
    }
    return [];
  }, [matrix]);

  useEffect(() => {
    if (calculus) {
      setMatrix([...matrix, getCalculus(min, max)]);
    }
  }, [calculus]);

  useEffect(() => {
    if (a && b) {
      msg.text = `${a} x ${b}`;
      console.log(msg.text, result);

      msg.onend = function(event) {
        setTimeout(() => {
          setListening(true);
        });
      };

      speechSynthesis.speak(msg);
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
            setResponse(parseResult(event.results[i][0].transcript));
          } else {
            console.warn("Not implemented");
          }
        }
        setListening(false);
        setCalculus(false);
      };
    } else {
      recognition.stop();
    }
  }, [listening]);

  return (
    <div className="App">
      <header className="App-header">
        <Calculus
          a={a}
          b={b}
          operator="x"
          result={result}
          response={response}
        />

        <Response response={response} result={result} />

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
      </header>
    </div>
  );
}

export default App;
