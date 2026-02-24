class Client {
  constructor() {
    this.apiBase = "/api";
  }

  async fetchQuestion() {
    try {
      const res = await fetch(`${this.apiBase}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to fetch question");
      return await res.json();
    } catch (err) {
      console.error("fetchQuestion() failed:", err);
      throw err;
    }
  }

  async sendGivenAnswer(testId, questionId, answer) {
    try {
      if (!testId || !questionId || !answer) {
        throw new Error("Missing parameters for sendGivenAnswer");
      }

      const res = await fetch(`${this.apiBase}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, questionId, answer }),
      });

      if (!res.ok) throw new Error("Failed to send answer");
      return await res.json();
    } catch (err) {
      console.error("sendGivenAnswer() failed:", err);
      throw err;
    }
  }

  async createTest(name) {
    try {
      if (!name) throw new Error("Missing test name");

      const res = await fetch(`${this.apiBase}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Failed to create test");
      return await res.json();
    } catch (err) {
      console.error("createTest() failed:", err);
      throw err;
    }
  }

  async calculateTestResults(id) {
    try {
      if (!id) throw new Error("Missing test ID");

      const res = await fetch(`${this.apiBase}/test/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to calculate test results");
      return await res.json();
    } catch (err) {
      console.error("calculateTestResults() failed:", err);
      throw err;
    }
  }

  async getUser() {
    try {
      const res = await fetch(`${this.apiBase}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    } catch (err) {
      console.error("getUser() failed:", err);
      throw err;
    }
  }
}

export default new Client();
export { Client };
