import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import conf from "../log4js.json";
import Base from "./foundation/Base.js";

const TOKEN_KEY = "auth_token";

class Client extends Base {
  constructor() {
    super();
    const instance = this;

    instance.apiBase = instance.getApiBase();
    instance.token = null;
    instance.conf = conf;

    console.log("API BASE:", instance.apiBase);
  }

  /*
  ==========================================
  API BASE
  ==========================================
  */

  getApiBase() {
    if (Platform.OS === "web") {
      return "http://localhost/api";
    }

    const hostUri = Constants.expoConfig?.hostUri;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}/api`;
    }

    if (Platform.OS === "android") {
      return "http://10.0.2.2/api";
    }

    return "http://localhost/api";
  }

  init() {}

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

    const fullUrl = `${this.apiBase}${url}`;
    console.log("REQUEST:", fullUrl);

    let res;

    try {
      res = await fetch(fullUrl, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
    } catch (e) {
      console.log("FETCH ERROR:", e);
      throw e;
    }

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

  // 🔐 Login (mTLS oder Mobile)
  async login(email, password) {
    try {
      const body = email && password ? { email, password } : {};

      const data = await this.request("/user", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data?.token) {
        await this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.log("LOGIN ERROR FULL:", error?.message, error);
      throw error;
    }
  }

  // 🔐 Token validieren (angepasst an dein Backend)
  async me(token) {
    try {
      const res = await fetch(`${this.apiBase}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      return {
        user: {
          id: data.user.id,
          firstname: data.user.firstname,
          lastname: data.user.lastname,
        },
      };
    } catch (err) {
      console.log("ME ERROR:", err);
      throw err;
    }
  }

  async fetchUserByEmail(email) {
    return this.request("/user/by/email", {
      method: "POST",
      body: JSON.stringify({ email }),
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
    this.userAnswer = {
      userId,
      testId,
      questionId,
      answerId,
      correct,
    };
  }

  async sendGivenAnswer() {
    return this.request("/test/answer", {
      method: "POST",
      body: JSON.stringify(this.userAnswer),
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

  async getTestById(id) {
    return this.request("/test/with/answers", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  async getTestEvaluation(id) {
    return this.request("/test/evaluation", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  async getPerformance(id) {
    const performanceList = await this.request("/test/performance", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    const overAll = {
      list: performanceList,
      total: {
        questions: 0,
        correct: 0,
        wrong: 0,
        percentage: 0,
        ratio: 0,
      },
    };

    performanceList.forEach((testResult) => {
      overAll.total.questions += testResult.totalQuestions;
      overAll.total.correct += testResult.correct;
      overAll.total.wrong += testResult.wrong;
    });

    if (overAll.list.length > 0 && overAll.total.wrong > 0) {
      overAll.total.ratio = Number(
        (overAll.total.correct / overAll.total.wrong).toFixed(2),
      );
      overAll.total.percentage = overAll.total.ratio * 100;
    }

    return overAll;
  }

  async getExplanation(questionId) {
    return this.request("/explain", {
      method: "POST",
      body: JSON.stringify({ questionId }),
    });
  }
}

export default new Client();
