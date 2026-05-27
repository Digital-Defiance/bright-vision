"""Agent mode (/agent) with Vision headless args — no AttributeError on verbose."""

from __future__ import annotations

import pytest

pytest.importorskip("cecli.coders", reason="Cecli not on PYTHONPATH — run: source activate.sh")

from cecli.coders import Coder
from cecli.coders.agent_coder import AgentCoder
from cecli.commands import Commands, SwitchCoderSignal
from cecli.io import InputOutput
from cecli.models import Model

from bright_vision_core.headless_args import default_headless_args


@pytest.fixture
def headless_io():
    return InputOutput(pretty=False, fancy_input=False, yes=True)


@pytest.fixture
def headless_args():
    return default_headless_args(yes=True)


@pytest.fixture
def base_model():
    return Model("gpt-3.5-turbo")


@pytest.mark.asyncio
async def test_agent_coder_initialize_mcp_tools_with_headless_args(
    headless_io, headless_args, base_model
):
    base = await Coder.create(base_model, None, headless_io, args=headless_args)
    agent = await Coder.create(
        io=headless_io,
        from_coder=base,
        edit_format="agent",
        summarize_from_coder=False,
        num_cache_warming_pings=0,
        coder_commit_hashes=base.coder_commit_hashes,
        args=headless_args,
        done_messages=[],
        cur_messages=[],
    )
    assert isinstance(agent, AgentCoder)
    await agent.initialize_mcp_tools()


@pytest.mark.asyncio
async def test_agent_command_with_prompt_and_headless_args(
    headless_io, headless_args, base_model, monkeypatch
):
    """Same path as /agent <prompt> in chat: temp AgentCoder + generate (mocked)."""
    base = await Coder.create(base_model, None, headless_io, args=headless_args)
    commands = Commands(headless_io, base)
    seen_prompts: list[str] = []

    original_create = Coder.create

    async def create_wrapper(*args, **kwargs):
        new_coder = await original_create(*args, **kwargs)

        async def fake_generate(user_message=None, **kwargs):
            if user_message:
                seen_prompts.append(user_message)

        new_coder.generate = fake_generate  # type: ignore[method-assign]
        return new_coder

    monkeypatch.setattr(Coder, "create", create_wrapper)

    with pytest.raises(SwitchCoderSignal):
        await commands.execute("agent", "list top-level files")

    assert seen_prompts == ["list top-level files"]


@pytest.mark.asyncio
async def test_agent_command_empty_args_raises_switch_to_agent_mode(
    headless_io, headless_args, base_model
):
    base = await Coder.create(base_model, None, headless_io, args=headless_args)
    commands = Commands(headless_io, base)

    with pytest.raises(SwitchCoderSignal) as exc_info:
        await commands.execute("agent", "")

    assert exc_info.value.kwargs.get("edit_format") == "agent"
