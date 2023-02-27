import { logger, logger2 } from './fileD.mjs';

const logDate = (text) => {
  logger(`The date is: ${text}`);
  logger2(`The date2 is: ${text}`);
};

export { logDate };
