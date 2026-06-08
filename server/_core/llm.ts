import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file";
  file: {
    file_id: string; // OpenAI Files API file_id
  };
};

// Manus Forge / Gemini multimodal file URL content
export type FileUrlContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent | FileUrlContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent | FileUrlContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent | FileUrlContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

export const useAnthropic = () =>
  ENV.aiProvider === "anthropic" &&
  !!ENV.anthropicApiKey &&
  ENV.anthropicApiKey.trim().length > 0;

export const useDirectOpenAI = () =>
  !useAnthropic() && !!ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0;

// True for providers that accept arbitrary file URLs (Manus Forge / Gemini).
// False for OpenAI and Anthropic — those need image_url (data URL) or Files API.
export const providerSupportsFileUrl = () =>
  !useAnthropic() && !useDirectOpenAI();

const resolveApiUrl = () => {
  if (useDirectOpenAI()) {
    return "https://api.openai.com/v1/chat/completions";
  }
  return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
};

const resolveApiKey = () => {
  if (useDirectOpenAI()) {
    return ENV.openaiApiKey;
  }
  return ENV.forgeApiKey;
};

const resolveModel = () => {
  if (useDirectOpenAI()) {
    return "gpt-4o-mini";
  }
  return "gemini-2.5-flash";
};

const assertApiKey = () => {
  if (useAnthropic()) return;
  if (!resolveApiKey()) {
    throw new Error("No API key configured (OPENAI_API_KEY or BUILT_IN_FORGE_API_KEY or ANTHROPIC_API_KEY)");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  if (useAnthropic()) {
    return invokeAnthropic(params);
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const isDirectOpenAI = useDirectOpenAI();
  const payload: Record<string, unknown> = {
    model: resolveModel(),
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  if (isDirectOpenAI) {
    payload.max_tokens = 16384;
  } else {
    payload.max_tokens = 32768;
    payload.thinking = {
      "budget_tokens": 128
    };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolveApiKey()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * Upload a file to OpenAI Files API and return the file_id
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file
 * @param mimeType - The MIME type of the file
 * @returns The file_id from OpenAI
 */
export async function uploadFileToOpenAI(
  fileBuffer: Buffer | Uint8Array | string,
  fileName: string,
  mimeType: string
): Promise<string> {
  assertApiKey();

  // Only OpenAI direct API supports Files API
  if (!useDirectOpenAI()) {
    throw new Error("File upload is only supported when using OpenAI directly");
  }

  const formData = new FormData();
  
  // Convert buffer to Blob
  let blob: Blob;
  if (typeof fileBuffer === "string") {
    // Assume it's base64
    const binaryString = Buffer.from(fileBuffer, "base64").toString("binary");
    blob = new Blob([binaryString], { type: mimeType });
  } else if (Buffer.isBuffer(fileBuffer)) {
    blob = new Blob([(fileBuffer.buffer as ArrayBuffer).slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.length)], { type: mimeType });
  } else {
    blob = new Blob([fileBuffer as unknown as ArrayBuffer], { type: mimeType });
  }

  formData.append("file", blob, fileName);
  formData.append("purpose", "assistants");

  const response = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resolveApiKey()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `File upload failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as { id: string };
  return result.id;
}

// ============================================================================
// ANTHROPIC ADAPTER
// ----------------------------------------------------------------------------
// Activated when AI_PROVIDER=anthropic and ANTHROPIC_API_KEY (or CLAUDE_API_KEY)
// is set. Maps the OpenAI-style InvokeParams onto the Anthropic Messages API
// and returns an OpenAI-compatible InvokeResult so the rest of the codebase
// doesn't need to know which provider answered.
//
// Key translations:
//   - role "system" → top-level `system` string (Anthropic does not accept
//     system in the messages array).
//   - response_format: json_schema → emulated via tool_use: a single tool is
//     declared with the requested JSON schema, tool_choice forces the model
//     to call it, and the tool args are returned as the assistant `content`
//     string (so JSON.parse on the caller side keeps working).
//   - response_format: json_object → instruct via system suffix to return
//     only JSON (Anthropic has no native JSON mode equivalent).
//   - image_url / file_url multimodal parts → image blocks (base64 only;
//     OpenAI-style HTTP image URLs are passed through but won't work on
//     Anthropic unless they are data URLs).
// ============================================================================

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicImageBlock = {
  type: "image";
  source:
    | { type: "base64"; media_type: string; data: string }
    | { type: "url"; url: string };
};
type AnthropicToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type AnthropicBlock = AnthropicTextBlock | AnthropicImageBlock | AnthropicToolUseBlock;

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicBlock[];
};

const dataUrlToImageBlock = (url: string): AnthropicImageBlock | null => {
  // data:<mime>;base64,<payload>
  const match = /^data:([^;,]+)(?:;base64)?,(.+)$/i.exec(url);
  if (!match) return null;
  const mediaType = match[1] || "image/png";
  const data = match[2] || "";
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  };
};

const partToAnthropicBlock = (part: MessageContent): AnthropicBlock | null => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  if (part.type === "image_url") {
    const url = part.image_url.url;
    if (url.startsWith("data:")) {
      return dataUrlToImageBlock(url);
    }
    return { type: "image", source: { type: "url", url } };
  }
  if (part.type === "file_url") {
    // Anthropic Messages API does not accept arbitrary file URLs in the same
    // shape Manus Forge / Gemini does. Drop with a warning so the caller can
    // detect the empty payload via downstream "no fields extracted" logs.
    console.warn("[llm.anthropic] file_url content part not supported by Anthropic Messages API — skipped");
    return null;
  }
  if (part.type === "file") {
    console.warn("[llm.anthropic] file (OpenAI Files API) content part not supported by Anthropic Messages API — skipped");
    return null;
  }
  return null;
};

const splitSystemAndMessages = (
  messages: Message[]
): { system: string; conversation: AnthropicMessage[] } => {
  const systemParts: string[] = [];
  const conversation: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      const text = ensureArray(msg.content)
        .map(p => (typeof p === "string" ? p : p.type === "text" ? p.text : ""))
        .filter(Boolean)
        .join("\n");
      if (text) systemParts.push(text);
      continue;
    }

    if (msg.role !== "user" && msg.role !== "assistant") {
      // tool/function roles are not used by this codebase's invokeLLM callers
      // beyond what the OpenAI/Forge paths handle. Skip safely.
      continue;
    }

    const blocks = ensureArray(msg.content)
      .map(partToAnthropicBlock)
      .filter((b): b is AnthropicBlock => b !== null);

    if (blocks.length === 0) continue;

    // Collapse to plain string when there's a single text block (smaller payload).
    if (blocks.length === 1 && blocks[0].type === "text") {
      conversation.push({ role: msg.role, content: blocks[0].text });
    } else {
      conversation.push({ role: msg.role, content: blocks });
    }
  }

  return { system: systemParts.join("\n\n"), conversation };
};

type AnthropicResponse = {
  id: string;
  model: string;
  stop_reason: string | null;
  content: AnthropicBlock[];
  usage?: { input_tokens: number; output_tokens: number };
};

async function invokeAnthropic(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    maxTokens,
    max_tokens,
  } = params;

  const { system, conversation } = splitSystemAndMessages(messages);

  const normalizedFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  const body: Record<string, unknown> = {
    model: ENV.anthropicModel,
    max_tokens: maxTokens ?? max_tokens ?? 8192,
    messages: conversation,
  };
  if (system) body.system = system;

  let extractFn: (resp: AnthropicResponse) => string = (resp) => {
    // Default: concatenate all text blocks.
    return resp.content
      .filter((b): b is AnthropicTextBlock => b.type === "text")
      .map(b => b.text)
      .join("\n");
  };

  if (normalizedFormat?.type === "json_schema") {
    const schemaName = normalizedFormat.json_schema.name || "structured_output";
    body.tools = [
      {
        name: schemaName,
        description:
          "Return the structured response. ONLY call this tool, with all fields filled per the schema. Never reply with plain text.",
        input_schema: normalizedFormat.json_schema.schema,
      },
    ];
    body.tool_choice = { type: "tool", name: schemaName };
    extractFn = (resp) => {
      const toolUse = resp.content.find(
        (b): b is AnthropicToolUseBlock => b.type === "tool_use"
      );
      if (toolUse) return JSON.stringify(toolUse.input ?? {});
      // Fallback: collect any text blocks (model may have refused tool_use)
      return resp.content
        .filter((b): b is AnthropicTextBlock => b.type === "text")
        .map(b => b.text)
        .join("\n");
    };
  } else if (normalizedFormat?.type === "json_object") {
    body.system = `${system ? system + "\n\n" : ""}You MUST respond with a single valid JSON object and no other text.`;
  }

  const url = `${ENV.anthropicApiUrl.replace(/\/$/, "")}/v1/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": ENV.anthropicVersion,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  const content = extractFn(data);

  return {
    id: data.id,
    created: Math.floor(Date.now() / 1000),
    model: data.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: data.stop_reason ?? null,
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  };
}
