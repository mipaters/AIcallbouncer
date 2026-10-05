/**
 * Centralized, safe access to environment configuration.
 * No secrets are ever logged or returned to the client — only booleans
 * indicating whether a given service is configured.
 */
export interface EnvConfig {
  azureOpenAIEndpoint?: string;
  azureOpenAIKey?: string;
  azureOpenAIDeployment?: string;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  azureStorageConnectionString?: string;
  twilioAuthToken?: string;
  publicBaseUrl?: string;
}

export function readEnv(): EnvConfig {
  return {
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    azureSpeechKey: process.env.AZURE_SPEECH_KEY,
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION,
    azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    publicBaseUrl: process.env.PUBLIC_BASE_URL,
  };
}

export function isAzureOpenAIConfigured(env: EnvConfig = readEnv()): boolean {
  return Boolean(env.azureOpenAIEndpoint && env.azureOpenAIKey && env.azureOpenAIDeployment);
}

export function isAzureSpeechConfigured(env: EnvConfig = readEnv()): boolean {
  return Boolean(env.azureSpeechKey && env.azureSpeechRegion);
}

export function isCallStorageConfigured(env: EnvConfig = readEnv()): boolean {
  return Boolean(env.azureStorageConnectionString);
}

export function isTwilioValidationConfigured(env: EnvConfig = readEnv()): boolean {
  return Boolean(env.twilioAuthToken && env.publicBaseUrl);
}
