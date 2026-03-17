import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import conf from "../log4js.json";

const TOKEN_KEY = "auth_token";

class Client {
  constructor() {
    this.apiBase = "https://localhost/api";
    this.token = null;
    this.conf = conf;
  }

  /*
  ==========================================
  STORAGE
  ==========================================
  */

  async getToken() {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;

      return localStorage.getItem(TOKEN_KEY);
    }

    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  async setToken(token) {
    this.token = token;

    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  async clearToken() {
    this.token = null;

    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  /*
  ==========================================
  CORE REQUEST
  ==========================================
  */

  async request(url, options = {}) {
    const token = await this.getToken();

    console.log(`${this.apiBase}${url}`);

    const res = await fetch(`${this.apiBase}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      await this.clearToken();

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

    if (data?.token) {
      await this.setToken(data.token);
    }

    console.log(JSON.stringify(data));

    return data;
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

  async fetchQuestions(number) {
    return this.request("/questions", {
      method: "POST",
      body: JSON.stringify({ number }),
    });
  }

  setGivenAnswer(userId, testId, questionId, answerId, correct) {
    const instance = this;
    instance.userAnswer = {};
    instance.userAnswer = {
      userId,
      testId,
      questionId,
      answerId,
      correct,
    };
  }

  async sendGivenAnswer() {
    const instance = this;

    return instance.request("/test/answer", {
      method: "POST",
      body: JSON.stringify(instance.userAnswer),
    });
  }

  async createTest(userId, name) {
    return this.request("/test", {
      method: "POST",
      body: JSON.stringify({ userId, name }),
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
