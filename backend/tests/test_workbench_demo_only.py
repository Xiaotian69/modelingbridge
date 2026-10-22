import asyncio.proactor_events
import asyncio.selector_events
import os
import re
import socket
import unittest
import urllib.request
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

APP_DIR = Path(__file__).resolve().parents[1] / "app"
PROBLEM = {"problem_text": "某校园共享单车需要预测各站点需求并制定调度方案。", "provider": "deepseek"}


_real_connect = socket.socket.connect
_real_connect_ex = socket.socket.connect_ex
LOOPBACK = {"127.0.0.1", "::1", "localhost"}


def _check(address):
    host = address[0] if isinstance(address, tuple) else address
    if host not in LOOPBACK:
        raise AssertionError(f"the public snapshot must not contact {host}")


def _loopback_connect(sock, address):
    _check(address)
    return _real_connect(sock, address)


def _loopback_connect_ex(sock, address):
    _check(address)
    return _real_connect_ex(sock, address)


def _guard_loop(cls):
    real = cls.sock_connect

    async def sock_connect(loop, sock, address):
        _check(address)
        return await real(loop, sock, address)

    return mock.patch.object(cls, "sock_connect", sock_connect)


PROXY_VARS = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy")


def network_guards():
    """Allow loopback only, for plain sockets and asyncio loops; ignore env and system proxies."""
    no_proxy_env = {name: "" for name in PROXY_VARS}
    return [
        mock.patch.dict(os.environ, no_proxy_env),
        mock.patch.object(urllib.request, "getproxies", lambda: {}),
        mock.patch.object(socket.socket, "connect", _loopback_connect),
        mock.patch.object(socket.socket, "connect_ex", _loopback_connect_ex),
        _guard_loop(asyncio.proactor_events.BaseProactorEventLoop),
        _guard_loop(asyncio.selector_events.BaseSelectorEventLoop),
    ]


class WorkbenchDemoOnlyTest(unittest.TestCase):
    """The V3.0 public snapshot never calls a paid model, even with keys configured."""

    def setUp(self):
        keys = {"LLM_API_KEY": "sk-test-not-used", "MIMO_API_KEY": "test-not-used", "LLM_PROVIDER": "deepseek"}
        patchers = [mock.patch.dict(os.environ, keys), *network_guards()]
        # If key settings ever come back, arm them too, so this test keeps guarding the snapshot.
        for field in ("llm_api_key", "mimo_api_key"):
            if hasattr(settings, field):
                patchers.append(mock.patch.object(settings, field, "sk-test-not-used"))
        for patcher in patchers:
            patcher.start()
            self.addCleanup(patcher.stop)
        self.client = TestClient(app)

    def test_analyze_problem_returns_demo(self):
        r = self.client.post("/api/analyze-problem", json=PROBLEM)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["mode"], "demo")
        self.assertEqual(body["provider"], "demo")
        self.assertIn("真实 AI 服务不包含在 V3.0 公开快照中", body["type_reason"])

    def test_contest_plan_returns_demo(self):
        r = self.client.post("/api/contest-plan", json={"provider": "deepseek"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["mode"], "demo")

    def test_providers_never_report_a_live_model(self):
        r = self.client.get("/api/llm-providers")
        self.assertEqual(r.status_code, 200)
        providers = r.json()
        self.assertTrue(providers)
        for item in providers:
            self.assertFalse(item["enabled"])
            self.assertNotRegex(item["model"].lower(), r"deepseek|mimo|gpt")

    def test_backend_has_no_model_call_code(self):
        pattern = re.compile(r"httpx|chat/completions|api_key|Authorization", re.IGNORECASE)
        offenders = [
            str(path.relative_to(APP_DIR))
            for path in APP_DIR.rglob("*.py")
            if pattern.search(path.read_text(encoding="utf-8"))
        ]
        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
