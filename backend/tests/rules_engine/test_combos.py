import json
from pathlib import Path

import pytest

from app.rules_engine.cards import parse_card
from app.rules_engine.combos import ComboType, beats, parse_combo

FIXTURE_PATH = Path(__file__).resolve().parents[3] / "fixtures" / "combo-cases.json"
FIXTURE = json.loads(FIXTURE_PATH.read_text())


@pytest.mark.parametrize(
    "case", FIXTURE["parseCombo"]["accept"], ids=lambda c: " ".join(c["cards"])
)
def test_parse_combo_accepts(case: dict) -> None:
    cards = [parse_card(c) for c in case["cards"]]
    combo = parse_combo(cards)

    assert combo is not None
    assert combo.type == ComboType(case["type"])
    assert combo.length == case["length"]
    assert combo.high == parse_card(case["high"])
    assert combo.is_bomb == case.get("isBomb", False)


@pytest.mark.parametrize(
    "case", FIXTURE["parseCombo"]["reject"], ids=lambda c: " ".join(c["cards"])
)
def test_parse_combo_rejects(case: dict) -> None:
    cards = [parse_card(c) for c in case["cards"]]
    assert parse_combo(cards) is None


@pytest.mark.parametrize(
    "case",
    FIXTURE["beats"],
    ids=lambda c: f"{' '.join(c['pile'])} vs {' '.join(c['candidate'])}",
)
def test_beats(case: dict) -> None:
    pile = parse_combo([parse_card(c) for c in case["pile"]])
    candidate = parse_combo([parse_card(c) for c in case["candidate"]])

    assert pile is not None
    assert candidate is not None
    assert beats(candidate, pile) == case["result"]
