const Testname = require("./testname");

class test {
  constructor() {
    this.testname = null;
    this._id = null;
    this.createdAT = null;
    this.name = null;
    this.answers = [];
  }

  getId() {
    return this._id;
  }

  setId(id) {
    this._id = id;
  }

  getUuid() {
    return this.uuid;
  }

  setUuid(uuid) {
    this.uuid = uuid;
  }

  getCreatedAt() {
    return this.createdAT;
  }

  setCreatedAt(createdAT) {
    this.createdAT = createdAT;
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }

  getAnswers() {
    return this.answers;
  }

  setAnswers(answers) {
    this.answers = answers;
  }

  setTestname(testname) {
    this.testname = testname;
  }

  getTestname() {
    return this.testname;
  }
}

module.exports = test;
