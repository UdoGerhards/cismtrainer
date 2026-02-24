export const DB_STRING =
  "mongodb+srv://udogerhards:oQ9cvFIvVVWsXMS7@cimsexams.zcovvz2.mongodb.net/?appName=cimsexams";

const isJest = () => {
  return process.env.JEST_WORKER_ID !== undefined;
};

export const DB_NAME = isJest() ? "cism_test" : "cism";
