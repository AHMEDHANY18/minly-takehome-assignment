import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import logger from "./config/logger";
import { config } from "./config";

const PORT = config.port || 4000;

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  console.log(`Server running at http://localhost:${PORT}`);
});
