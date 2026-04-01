import log4js from "log4js";
import log4js_extend from "log4js-extend";
import Base from "../foundation/Base.js";

import logConfig from "../logConfig.json";

/**
 * Created by udogerhards on 27.12.18.
 */
class LogManager extends Base {
  constructor() {
    super();

    let instance = this;
    instance.configFile = null;
    instance.categories = null;
    instance.logger = log4js.getLogger("default");
  }

  /**
   * Initializes the logging system
   *
   * @param configFile
   * @returns {string}
   * @private
   */
  init() {
    let instance = this;
    let logger = instance.logger;

    logger.info("Initializing LogManager ...");

    log4js.configure(logConfig);

    log4js_extend(log4js, {
      format: "@name(@file:@line:@column)",
    });

    logger.trace("LogManager initialized ...");

    super.init(this);
  }

  getLogger(logInstance) {
    let instance = this;
    let logger = instance.logger;

    const category =
      typeof logInstance == "object"
        ? logInstance.constructor.name
        : logInstance;

    if (!category) {
      logger.trace(
        "Requested logging category is not availables ... using category 'default' ...",
      );
      category = "default";
    }

    logger.info("Returning logger for category '" + category + "' ... ");

    return log4js.getLogger(category);
  }
}

const Singleton = new LogManager();
Singleton.init();

export default Singleton;
