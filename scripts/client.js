import fetch from "node-fetch";

class Client {
  constructor() {
    this.apiBase = "https://localhost/api";
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  getAuthHeaders() {
    if (!this.token) return {};

    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  async request(url, options = {}) {
    const res = await fetch(`${this.apiBase}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
      agent: this.httpsAgent,
    });

    if (res.status === 401) {
      this.clearToken();
      const error = new Error("UNAUTHORIZED");
      error.status = 401;
      throw error;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  }

  /*
  ==========================================
  AUTH
  ==========================================
  */

  async login() {
    const data = await this.request("/user", {
      method: "POST",
    });

    this.setToken(data.token);

    return data.user;
  }

  async checkAuth() {
    return this.request("/auth", {
      method: "GET",
    });
  }

  /*
  ==========================================
  API CALLS
  ==========================================
  */

  async fetchQuestion() {
    return this.request("/question", {
      method: "POST",
    });
  }

  async sendGivenAnswer(testId, questionId, answer) {
    return this.request("/test/answer", {
      method: "POST",
      body: JSON.stringify({ testId, questionId, answer }),
    });
  }

  async createTest(name) {
    return this.request("/test", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async calculateTestResults(id) {
    return this.request("/test/result", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }
}

export default new Client();
