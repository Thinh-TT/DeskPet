export interface AppConfig {
  debug: boolean;
  activeCharacterId: string;
}

export const defaultConfig: AppConfig = {
  debug: process.env.NODE_ENV === 'development',
  activeCharacterId: 'odette'
};
