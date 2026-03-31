export type AiProvider =
  | "baidu"      // 百度文心
  | "aliyun"     // 阿里通义千问
  | "doubao"     // 字节豆包（火山引擎）
  | "custom";    // 自定义（任意 OpenAI 兼容接口）

export interface AiProviderInfo {
  id: AiProvider;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  needsSecretKey?: boolean; // 百度需要 API Key + Secret Key
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: "baidu",
    name: "百度文心",
    baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
    defaultModel: "ernie-4.0-8k",
    models: ["ernie-4.0-8k", "ernie-3.5-8k", "ernie-speed-128k"],
    needsSecretKey: true,
  },
  {
    id: "aliyun",
    name: "阿里通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    models: ["qwen-max", "qwen-plus", "qwen-turbo"],
  },
  {
    id: "doubao",
    name: "字节豆包",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "",
    models: [],
  },
  {
    id: "custom",
    name: "自定义接口",
    baseUrl: "",
    defaultModel: "",
    models: [],
  },
];

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  secretKey?: string;   // 百度专用
  accessToken?: string; // 百度专用
  baseUrl: string;
  model: string;
}
