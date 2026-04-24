"""Pydantic models for websocket inbound validation."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


AllowedAction = Literal[
    "wake",
    "language_selected",
    "conversation_started",
    "user_message",
    "toggle_mic",
    "mic_start",
    "mic_stop",
    "mic_cancel",
    "menu_select",
    "back",
    "reset_session",
]


class WsInboundMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: AllowedAction | None = None
    event: AllowedAction | None = None
    text: str | None = Field(default=None, max_length=2000)
    language: str | None = Field(default=None, max_length=64)
    localIntent: dict[str, Any] | None = None
    id: str | None = Field(default=None, max_length=128)
    languageCode: str | None = Field(default=None, max_length=32)

    def resolved_action(self) -> AllowedAction | None:
        return self.action or self.event

