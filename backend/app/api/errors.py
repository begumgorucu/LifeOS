"""Standard error response shape + handlers.

Per CLAUDE.md §7.5 every error must be returned as:
    {"error": {"code": "...", "message": "..."}}
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class APIError(Exception):
    """Domain-level error with a stable error code consumers can branch on."""

    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _envelope(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


async def _api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=_envelope(exc.code, exc.message))


async def _http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    # Map default FastAPI/Starlette HTTPException into our envelope.
    code_map = {
        status.HTTP_404_NOT_FOUND: "NOT_FOUND",
        status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
        status.HTTP_403_FORBIDDEN: "FORBIDDEN",
        status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(status_code=exc.status_code, content=_envelope(code, message))


async def _validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    # Surface the first validation problem in our envelope; full details under
    # `error.details` so clients can show field-level errors when desired.
    first = exc.errors()[0] if exc.errors() else {"msg": "Validation failed."}
    message = first.get("msg", "Validation failed.")
    payload = _envelope("VALIDATION_ERROR", message)
    payload["error"]["details"] = exc.errors()
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(APIError, _api_error_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
