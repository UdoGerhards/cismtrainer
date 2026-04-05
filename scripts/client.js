import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import conf from "../log4js.json";
import Base from "./foundation/Base.js";

const TOKEN_KEY = "auth_token";

class Client extends Base {
  constructor() {
    super();

    this.apiBase = this.getApiBase();
    this.token = null;
    this.conf = conf;
  }

  /*
  ==========================================
  API BASE
  ==========================================
  */

  getApiBase() {
    if (Platform.OS === "web") {
      return "https://localhost/api";
    }

    const hostUri = Constants.expoConfig?.hostUri;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `https://${host}/api`;
    }

    if (Platform.OS === "android") {
      return "https://10.0.2.2/api";
    }

    return "https://localhost/api";
  }

  /*
  ==========================================
  STORAGE
  ==========================================
  */

  async getToken() {
    if (this.token) return this.token;

    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
      this.token = localStorage.getItem(TOKEN_KEY);
      return this.token;
    }

    this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    return this.token;
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

  async request(url, options = {}, customToken = null) {
    const token = customToken || (await this.getToken());

    const fullUrl = `${this.apiBase}${url}`;

    let res;

    try {
      res = await fetch(fullUrl, {
        ...options,
        headers: {
          ...(options.headers || {}),
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {
      console.log("FETCH ERROR:", e);
      throw e;
    }

    if (res.status === 401) {
      console.warn("⚠️ 401 → clearing token");
      await this.clearToken();

      const error = new Error("UNAUTHORIZED");
      error.status = 401;
      throw error;
    }

    if (!res.ok) {
      console.error("HTTP ERROR:", res.status);
      const error = new Error(`HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }

    return res.json();
  }

  /*
  ==========================================
  AUTH
  ==========================================
  */

  async login(email, password) {
    const data = await this.request("/user", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data?.requires2FA) {
      return data;
    }

    if (data?.token) {
      await this.setToken(data.token);
    }

    return data;
  }

  async verify2FA(tempToken, code) {
    const data = await this.request(
      "/2fa/verify",
      {
        method: "POST",
        body: JSON.stringify({ token: code }),
      },
      tempToken,
    );

    if (data?.token) {
      await this.setToken(data.token);
    }

    return data;
  }

  /*
  ==========================================
  CURRENT USER
  ==========================================
  */

  async me(token) {
    const data = await this.request("/me", { method: "GET" }, token);

    if (!data?.user) {
      throw new Error("Invalid /me response");
    }

    return {
      user: {
        id: data.user.id,
        firstname: data.user.firstname,
        lastname: data.user.lastname,
        role: data.user.role,
        twoFactor: {
          enabled: !!data.user.twoFactor?.enabled,
        },
        mustChangePassword: !!data.user.mustChangePassword,
      },
    };
  }

  /*
  ==========================================
  🔥 ADMIN USER MANAGEMENT (NEU)
  ==========================================
  */

  async createUser({ firstname, lastname, email, password, token }) {
    return this.request("/admin/user", {
      method: "POST",
      body: JSON.stringify({
        firstname,
        lastname,
        email,
        password,
        token, // 🔐 2FA Token
      }),
    });
  }

  async getAllUsers() {
    const res = await this.request("/list/all/users", {
      method: "GET",
    });

    return res?.users || [];
  }

  async deleteUser(userId, token) {
    return this.request("/delete/user", {
      method: "DELETE",
      body: JSON.stringify({
        userId,
        token, // 🔐 2FA Token
      }),
    });
  }

  /*
  ==========================================
  REST
  ==========================================
  */

  async fetchQuestion() {
    return this.request("/question", { method: "POST" });
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

  /**
   * Startet den KI-Batch-Prozess zur Korrektur und Domain-Zuordnung
   * @param {number} chunkSize - Anzahl der Fragen pro Batch
   * @param {string} token - 2FA/Admin Authenticator Token
   */
  async processCismBatch(chunkSize, token, offset = 0) {
    const data = await this.request("/normalize/questions", {
      method: "POST",
      body: JSON.stringify({
        chunkSize: parseInt(chunkSize),
        token,
        offset: offset, // <--- Neu hinzugefügt
      }),
    });

    return {
      successCount: data.okCount,
      errorCount: data.wrongCount,
      finished: data.finished,
    };
  }

  /*
  ==========================================
  QUESTIONS INFO
  ==========================================
  */

  async getQuestionCount() {
    const data = await this.request("/admin/questions/count", {
      method: "GET",
    });

    return data?.count || 0;
  }

  /**
   * Ruft alle Test-Objekte inklusive detaillierter Fragen und Antworten ab.
   * @param {string} token - Das Authentifizierungs-Token (Admin-Rechte erforderlich).
   * @param {string|null} userId - (Optional) ID des Users, um die Ergebnisse zu filtern.
   * @returns {Promise<Array>} Liste der detaillierten Test-Objekte.
   */
  // In scripts/client.js

  /**
   * Ruft Test-Details ab.
   * @param {boolean} showAll - Wenn true, werden alle Tests (Admin-Sicht) angefordert.
   */
  async fetchFullTestDetails(showAll = false) {
    // Wir hängen das Flag direkt an die URL an
    const url = `/admin/tests/full?showAll=${showAll}`;

    const data = await this.request(url, {
      method: "GET",
      // Header (Authorization) wird normalerweise automatisch von deiner request-Methode gesetzt
    });

    if (!data.success) {
      throw new Error(data.message || "Fehler beim Laden der Test-Details");
    }

    return {
      tests: data.data,
      count: data.count,
    };
  }

  /**
   * Löscht eine Liste von Tests anhand ihrer IDs.
   * @param {string[]} testIds - Array von Test-IDs als Strings.
   */
  async deleteTests(testIds) {
    const url = `/admin/tests/delete`;

    const data = await this.request(url, {
      method: "DELETE",
      body: JSON.stringify({ testIds }), // Verpackt das Array in ein Objekt für den Server-Body
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!data.success) {
      throw new Error(data.message || "Fehler beim Löschen der Tests");
    }

    return {
      success: true,
      deletedTests: data.deletedTests,
      deletedAnswers: data.deletedAnswers,
    };
  }
}

export default new Client();
