import type { AiTemplateDefinition } from "../../ai.types.js";
import { loadPrompt } from "../base.js";
import config from "./config.js";

const definition: AiTemplateDefinition = {
  ...config,
  systemPrompt: loadPrompt(import.meta.url),
};

export default definition;
