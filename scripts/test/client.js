import { Platform } from "react-native";

class Client {
  constructor() {
    this.baseProtocol = "http";
    this.baseIP = "127.0.0.1";

    if (Platform.OS === "android") {
      this.baseIP = "10.0.2.2";
    }

    if (Platform.OS === "ios") {
      this.baseIP = "localhost";
    }

    this.basePort = "8000";

    this.url = this.baseProtocol + "://" + this.baseIP + ":" + this.basePort;

    this.payload = {};
  }

  /*
    Get a random question from the mongodb
  */
  async fetchQuestion() {
    let url = this.url + "/question/";

    console.log(url);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Fehler beim Laden der Fragen");
    }

    const data = await response.json();
    return data;
  }

  /*
    Get a number of questions from the mongodb
  */
  async getNumberQuestions(ID) {
    let url = this.url + "/get/questions/" + ID;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Fehler beim Laden der Fragen");
    }

    const data = await response.json();
    return data;
  }

  setGivenAnswer(answer) {
    this.userAnswer = answer;
  }

  async sendGivenAnswer(test) {
    if (typeof this.userAnswer === "undefined" || this.userAnswer === null) {
      console.log("No Answer given");
      return;
    }

    let answer = this.userAnswer;

    try {
      const response = await fetch(this.url + "/answer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: "Demo test",
          answer: answer,
        }),
      });

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Fehler:", error);
    }

    this.userAnswer = undefined;
  }

  /*
  Usage: 
  const explanation = await client.explainAnswer(
    currentQuestion.text,
    currentQuestion.correctAnswer
  );

  console.log("Erklärung:", explanation);

  */
  async explainAnswer(question, answer) {
    try {
      const response = await fetch(this.url + "/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          answer: answer,
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Erklärung");
      }

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error("Explain Error:", error);
      return null;
    }
  }
}

// Singleton
export default new Client();
