from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # The public snapshot has no model settings: AI runs in teaching-demo mode only,
    # and any LLM_* / MIMO_* variables in the environment are ignored.
    app_env: str = "development"
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    trial_access_code: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


settings = Settings()
