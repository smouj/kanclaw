from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

app = FastAPI(title="KanClaw Companion API")
FRONTEND_BASE_URL = "http://127.0.0.1:3000"


@app.get("/health")
async def health():
    return {"status": "ok"}


async def stream_proxy(method: str, path: str, request: Request) -> AsyncIterator[bytes]:
    url = f"{FRONTEND_BASE_URL}/api/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(method, url, content=body, headers=headers) as upstream:
            async for chunk in upstream.aiter_bytes():
                yield chunk


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_api(path: str, request: Request):
    url = f"{FRONTEND_BASE_URL}/api/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    if path == "events":
        return StreamingResponse(
            stream_proxy(request.method, path, request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        )

    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    async with httpx.AsyncClient(timeout=60.0) as client:
      try:
        upstream = await client.request(request.method, url, content=body, headers=headers)
      except httpx.HTTPError as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)

    response_headers = {
        key: value
        for key, value in upstream.headers.items()
        if key.lower() in {"content-type", "cache-control"}
    }
    return Response(content=upstream.content, status_code=upstream.status_code, headers=response_headers)
