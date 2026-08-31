import os


class Settings:
    frontend_origin: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
    supabase_url: str | None = os.environ.get("SUPABASE_URL")
    supabase_key: str | None = os.environ.get("SUPABASE_KEY")


settings = Settings()
