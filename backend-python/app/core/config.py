from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    PORT: int = 5000
    MONGODB_URI: str = "mongodb://127.0.0.1:27017/teamsync"
    JWT_SECRET: str = "teamsync_fallback_secret"
    JWT_EXPIRES_IN: int = 7  # days
    APP_ENV: str = "development"


settings = Settings()
