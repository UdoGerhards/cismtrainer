import Database from "@/scripts/database/mongo-database";

class Client {
  constructor() {
    this.payload = {};
    this.database = Database;
  }

  /*
    Get a random question from the mongodb
  */
  async fetchQuestion() {
    try {
      const data = await this.database.getQuestion();
      const question = data[0];

      const answers = await this.database.getAnswers(question.ID);
      question.answers = answers;

      return question;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  setGivenAnswer(answer) {
    this.userAnswer = answer;
  }

  async sendGivenAnswer() {
    if (typeof this.userAnswer === "undefined" || this.userAnswer === null) {
      return;
    }

    try {
      this.database.setGivenAnswer(this.answer);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async createTest(name) {
    try {
      return await this.database.createUserTest(name);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async calculateTestResults(id) {
    try {
      return await this.database.calculateTestResult(id);
    } catch (err) {
      console.log(err);

      throw err;
    }
  }
}

// Singleton
export default new Client();

// Also export the class for testing
export { Client };
