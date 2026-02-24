import { DB_STRING } from "@/config";
import { Client } from "@/scripts/tst/client";
import { MongoClient, ObjectId } from "mongodb";

describe("Client – Integration Test (MongoDB Atlas, DB=cims)", () => {
  let clientInstance;
  let mongo;
  let db;

  let questionCol;
  let answerCol;
  let testCol;
  let testAnswerCol;

  let insertedQuestions = [];
  let insertedAnswers = [];
  let insertedTests = [];
  let insertedTestAnswers = [];

  beforeAll(async () => {
    mongo = new MongoClient(DB_STRING);
    await mongo.connect();

    db = mongo.db("cism_test");

    questionCol = db.collection("question");
    answerCol = db.collection("answer");
    testCol = db.collection("test");
    testAnswerCol = db.collection("test_answer");

    clientInstance = new Client();

    // WICHTIG: Client soll NICHT das Singleton-DB-Objekt nutzen
    clientInstance.database = {
      getQuestion: async () => {
        return await questionCol
          .aggregate([
            { $sample: { size: 1 } },
            {
              $lookup: {
                from: "answer",
                localField: "ID",
                foreignField: "question",
                as: "answers",
              },
            },
          ])
          .toArray();
      },

      getAnswers: async (id) => {
        return await answerCol.find({ question: id }).toArray();
      },

      createUserTest: async (name) => {
        const doc = {
          _id: new ObjectId(),
          name,
          createdAT: new Date(),
          correct: 0,
          wrong: 0,
        };
        await testCol.insertOne(doc);
        return { id: doc._id.toString(), ...doc };
      },

      calculateTestResult: async (id) => {
        const answers = await testAnswerCol.find({ test_id: id }).toArray();

        const correct = answers.filter((a) => a.correct).length;
        const wrong = answers.length - correct;

        return { correct, wrong };
      },

      setGivenAnswer: async (answer) => {
        // Dummy-Implementierung für Test
        return true;
      },
    };
  });

  beforeEach(async () => {
    // QUESTION
    const q = {
      _id: new ObjectId(),
      ID: 100,
      question: "Was ist 2+2?",
      correct: 4,
    };
    await questionCol.insertOne(q);
    insertedQuestions.push(q._id);

    // ANSWERS
    const answers = [
      { _id: new ObjectId(), question: 100, c: 4, text: "4" },
      { _id: new ObjectId(), question: 100, c: 3, text: "3" },
    ];
    await answerCol.insertMany(answers);
    insertedAnswers.push(...answers.map((a) => a._id));

    // TEST
    const t = {
      _id: new ObjectId(),
      name: "Test A",
      createdAT: new Date(),
      correct: 0,
      wrong: 0,
    };
    await testCol.insertOne(t);
    insertedTests.push(t._id);

    // TEST_ANSWER
    const ta = {
      _id: new ObjectId(),
      test_id: t._id.toString(),
      question_id: q._id.toString(),
      answer_id: answers[0]._id.toString(),
      correct: true,
      createdAT: new Date(),
    };
    await testAnswerCol.insertOne(ta);
    insertedTestAnswers.push(ta._id);
  });

  afterEach(async () => {
    await questionCol.deleteMany({ _id: { $in: insertedQuestions } });
    await answerCol.deleteMany({ _id: { $in: insertedAnswers } });
    await testCol.deleteMany({ _id: { $in: insertedTests } });
    await testAnswerCol.deleteMany({ _id: { $in: insertedTestAnswers } });

    insertedQuestions = [];
    insertedAnswers = [];
    insertedTests = [];
    insertedTestAnswers = [];
  });

  afterAll(async () => {
    await mongo.close();
  });

  // ---------------------------------------------------------
  // TESTS
  // ---------------------------------------------------------

  test("fetchQuestion() returns a question with answers", async () => {
    const q = await clientInstance.fetchQuestion();

    expect(q).toHaveProperty("question");
    expect(q).toHaveProperty("answers");
    expect(Array.isArray(q.answers)).toBe(true);
  });

  test("createTest() creates a new test entry", async () => {
    const result = await clientInstance.createTest("Mein Test");

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Mein Test");

    // Cleanup
    await testCol.deleteOne({ _id: new ObjectId(result.id) });
  });

  test("calculateTestResults() returns correct/wrong counts", async () => {
    const testId = insertedTests[0].toString();

    const result = await clientInstance.calculateTestResults(testId);

    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(0);
  });

  test("setGivenAnswer() stores answer and sendGivenAnswer() calls DB", async () => {
    clientInstance.setGivenAnswer("A");

    const spy = jest.spyOn(clientInstance.database, "setGivenAnswer");

    await clientInstance.sendGivenAnswer();

    expect(spy).toHaveBeenCalled();
  });
});
