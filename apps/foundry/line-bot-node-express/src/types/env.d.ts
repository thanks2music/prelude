declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string
    LINE_ACCESS_TOKEN: string
    LINE_CHANNEL_SECRET: string
  }
}
