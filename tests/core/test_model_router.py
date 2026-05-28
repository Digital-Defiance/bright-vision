from bright_vision_core.model_router import (
    ModelRouterConfig,
    classify_prompt,
    estimate_message_tokens,
    estimate_prompt_tokens,
    should_escalate_fast_turn,
)


def test_classify_low_tokens_fast_keyword():
    router = ModelRouterConfig(
        enabled=True,
        fast_model="ollama_chat/small",
        heavy_model="ollama_chat/big",
    )
    d = classify_prompt(
        "Rename the button label to Save",
        message_tokens=500,
        router=router,
        heavy_model_name="ollama_chat/big",
    )
    assert d.tier == "fast"
    assert d.model_name == "ollama_chat/small"


def test_classify_architect_heavy():
    router = ModelRouterConfig(
        enabled=True,
        fast_model="ollama_chat/small",
        heavy_model="ollama_chat/big",
    )
    d = classify_prompt(
        "Refactor the race condition in the session pool",
        message_tokens=800,
        router=router,
        heavy_model_name="ollama_chat/big",
    )
    assert d.tier == "heavy"


def test_classify_high_message_tokens_heavy():
    router = ModelRouterConfig(
        enabled=True,
        fast_model="ollama_chat/small",
        heavy_model="ollama_chat/big",
        token_heavy_min=12_000,
    )
    d = classify_prompt(
        "fix typo",
        message_tokens=15_000,
        router=router,
        heavy_model_name="ollama_chat/big",
    )
    assert d.tier == "heavy"
    assert "msg_tokens>=" in d.reasons[0]


def test_files_in_chat_do_not_force_heavy():
    """Large context_tokens (files) with small message must not route heavy."""
    router = ModelRouterConfig(
        enabled=True,
        fast_model="ollama_chat/small",
        heavy_model="ollama_chat/big",
    )
    msg = "I'd like to add @ references like we have for /add with chips"
    message_tokens = estimate_message_tokens(msg)
    context_tokens = estimate_prompt_tokens(msg, files_in_chat=4)
    assert context_tokens > message_tokens
    assert message_tokens < router.token_fast_max
    d = classify_prompt(
        msg,
        message_tokens=message_tokens,
        context_tokens=context_tokens,
        router=router,
        heavy_model_name="ollama_chat/big",
    )
    assert d.tier == "fast"
    assert d.estimated_tokens == context_tokens


def test_code_task_middle_band_defaults_fast():
    router = ModelRouterConfig(
        enabled=True,
        fast_model="ollama_chat/small",
        heavy_model="ollama_chat/big",
    )
    d = classify_prompt(
        "implement the login form",
        message_tokens=800,
        router=router,
        heavy_model_name="ollama_chat/big",
    )
    assert d.tier == "fast"
    assert "default_fast" in d.reasons


def test_escalate_when_fast_no_edits():
    router = ModelRouterConfig(enabled=True, fast_model="a", heavy_model="b")
    decision = classify_prompt(
        "implement the login form",
        message_tokens=800,
        router=router,
        heavy_model_name="b",
        force_tier="fast",
    )
    assert should_escalate_fast_turn(
        decision,
        router=router,
        user_message="implement the login form",
        edited_files=[],
        assistant_text="ok",
    )


def test_estimate_tokens_with_files_capped():
    bare = estimate_prompt_tokens("hello")
    with_files = estimate_prompt_tokens("hello", files_in_chat=10)
    assert with_files > bare
    assert with_files <= bare + 2000
