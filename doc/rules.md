# Rules

## The Game

2 – 4 person card game (Tiến lên / "Thirteen"), single standard 52-card deck, no jokers.

## Card Ranking

Rank order, low to high:

```
3 4 5 6 7 8 9 10 J Q K A 2
```

Suit order, low to high:

```
♠ < ♣ < ♦ < ♥
```

Every card is therefore **strictly comparable** to every other card: compare rank first, then suit. There are no ties between two distinct cards.

### Canonical encoding

Cards are integers `0–51`:

```
id   = rank * 4 + suit
rank = floor(id / 4)      0 = 3, 1 = 4, ... 11 = A, 12 = 2
suit = id % 4             0 = ♠, 1 = ♣, 2 = ♦, 3 = ♥
```

Consequence: `cardA` beats `cardB` as a single **iff `cardA > cardB` numerically**. `3♠ = 0` is the lowest card in the deck, `2♥ = 51` the highest. All comparison logic below reduces to integer comparison on this encoding.

## The Deal

Every player receives **13 cards**, regardless of player count. Undealt cards are set aside face-down and take no part in the game.

| Players | Dealt    | Out of play |
| ------- | -------- | ----------- |
| 2       | 26 total | 26          |
| 3       | 39 total | 13          |
| 4       | 52 total | 0           |

Because the deck is not exhausted at 2 or 3 players, **3♠ is not guaranteed to be in play**. See "Getting Started" for how the first lead is determined.

## Legal Combos

| Combo                | Definition                                                       | Notes                             |
| -------------------- | ---------------------------------------------------------------- | --------------------------------- |
| Single               | 1 card                                                           |                                   |
| Pair                 | 2 cards of equal rank                                            |                                   |
| Triple               | 3 cards of equal rank                                            |                                   |
| Straight             | ≥ 3 cards of consecutive rank                                    | no 2s; no wrap-around             |
| Four of a kind       | 4 cards of equal rank                                            | also a bomb                       |
| Consecutive pairs    | ≥ 3 pairs of consecutive rank                                    | no 2s; no wrap-around; also a bomb |

Constraints:

- **2s may never appear in a straight or in consecutive pairs.** The highest rank usable in either is `A`.
- **No wrap-around.** Sequences run strictly upward through the rank order `3 → A`. `K A 3` is not a straight; `Q K A 2` is not a straight (2s are excluded anyway).
- A set of selected cards has **at most one** valid interpretation as a combo, except that 4 cards of equal rank are always read as a four of a kind (they cannot be a straight or a pair).

## Beating a Play

A play beats the current pile only if **all** of the following hold:

1. It is the **same combo type** as the pile, **and**
2. It is the **same length** as the pile (straights: same number of cards; consecutive pairs: same number of pairs), **and**
3. It is **strictly higher** by the tiebreak rule for that type,

— **or** the bomb rules below apply: a legal **chop** on a pile of 2s, or a **stronger bomb answering a bomb**. These are the only ways to cross combo type or length.

### Comparison per combo type

| Combo             | Compare on                           | Tiebreak                                | Tiebreak reachable?                                     |
| ----------------- | ------------------------------------ | --------------------------------------- | ------------------------------------------------------- |
| Single            | rank                                 | suit                                    | yes — always                                            |
| Pair              | rank                                 | highest suit within the pair            | yes — e.g. `7♠7♣` vs `7♦7♥`                             |
| Triple            | rank                                 | n/a                                     | no — two triples of one rank need 6 cards                |
| Straight          | rank of highest card                 | suit of highest card                    | yes                                                     |
| Four of a kind    | rank                                 | n/a                                     | no — only one quad per rank exists                      |
| Consecutive pairs | rank of highest pair                 | highest suit within that top pair       | yes                                                     |

Equivalently, under the canonical encoding: compare the **maximum card id** in each play. This single rule correctly implements every row above, including all suit tiebreaks.

## Bombs

Four of a kind and consecutive pairs (≥ 3 pairs) are **bombs**. A bomb may be played in exactly three situations:

1. **Led normally** as its own combo, opening a round. It can then be answered only by another bomb, per the ladder below.
2. **To chop 2s.** A bomb may be played on a pile consisting of 2s, even though the combo type differs. Each pile of 2s has an **exact** matching chop — a bigger bomb is not a substitute for the right one:

   | Pile         | Legal chop                                 |
   | ------------ | ------------------------------------------ |
   | single 2     | four of a kind, **or** 3 consecutive pairs |
   | pair of 2s   | 4 consecutive pairs — nothing else         |
   | triple of 2s | 5 consecutive pairs — nothing else         |
   | four 2s      | n/a — instant win, game already over       |

   A 5-pair run does **not** chop a pair of 2s, and a four of a kind does **not** chop a pair of 2s. Each rung of run has exactly one job.

3. **To beat another bomb.** Bombs match by category — see below.

### Bomb vs bomb

A bomb on the pile can only be answered within its own category:

| Pile              | Can be beaten by                                                    |
| ----------------- | -------------------------------------------------------------------- |
| four of a kind    | a **higher** four of a kind, **or** any 3-pair run                  |
| 3 consecutive pairs | a **higher** 3-pair run only                                       |
| 4 consecutive pairs | a **higher** 4-pair run only                                       |
| 5 consecutive pairs | a **higher** 5-pair run only                                       |
| 6 consecutive pairs | n/a — instant win, never reaches the pile                          |

"Higher" means the normal comparison: maximum card id. A quad of `9`s beats a quad of `5`s; a 4-pair run of `6-7-8-9` beats a 4-pair run of `3-4-5-6`.

**Runs never cross length.** A 4-pair run cannot be played on a 3-pair run — it must be a higher 3-pair run. This mirrors straights, where length must always match.

The **one** cross-category exception is that a 3-pair run beats a four of a kind (but not the reverse). This matters because both can chop a single 2, so both can land on the pile: if someone chops a single `2` with a quad, a 3-pair run can still take it, but a 4-pair run cannot.

A bomb played **as a chop** can itself be answered by the rules above, so chop wars are possible — within category.

> **Note:** bombs cannot be played on non-2 piles of a differing type. A four of a kind may not be dropped on a straight or a triple.

## Instant Win

A hand is an instant win if, **as dealt**, it contains one of:

| Hand                        | Cards used | Strength   |
| --------------------------- | ---------- | ---------- |
| A straight from 3 through A | 12         | strongest  |
| 6 consecutive pairs         | 12         | middle     |
| Four 2s                     | 4          | weakest    |

Instant wins are checked **once, immediately after the deal, before the first lead**. A hand that only becomes one of these shapes later does not count (it cannot, since hands only shrink).

Resolution:

- The holder is placed **1st** and the game ends immediately.
- If two or more players hold instant-win hands, the **stronger** hand wins, ordered `straight 3–A > 6 consecutive pairs > four 2s`.
- If two players hold the **same** type of instant win, compare by highest card (maximum card id), as everywhere else. This is reachable: two players can each hold a 3–A straight, or each hold 6 consecutive pairs. Only one player can ever hold four 2s.
- All remaining players are placed **last** and each receive the last-place point value for the lobby size. No further placements are computed.

## Getting Started

**First game of a lobby:** the player holding the lowest card in play leads, and their opening play **must include that card**. With 4 players this is always `3♠`; with 2 or 3 players it is whichever card is lowest among those dealt.

**Every game after the first:** the winner (1st place) of the previous game leads, with no constraint on their opening play.

Turn order is **clockwise** by seat index.

## Turn Flow

Each player in turn either **plays** a combo that beats the pile, or **passes**.

- The **lead** of a round may not pass — leading is mandatory, and any legal combo is allowed (subject to the first-game lowest-card constraint).
- A pass removes the player from **the entire round**, not just one turn. They cannot re-enter until a new round begins.
- When all other players have passed, the round ends. The pile is cleared, all passes are reset, and the player who made the **last play** leads the new round.
  - If that player is **out** (has no cards left), the lead passes to the next clockwise player who still holds cards.

## Ending a Game

The first player to shed all their cards places **1st**. Play continues among the remaining players — the pile and round structure carry on uninterrupted — until only one player still holds cards; that player takes last place.

With 2 players the game ends as soon as one player is out.

## Point System

Points are awarded per game by placement, scaled to lobby size:

| Players | 1st | 2nd | 3rd | 4th |
| ------- | --- | --- | --- | --- |
| 4       | 4   | 3   | 2   | 1   |
| 3       | 3   | 2   | 1   | —   |
| 2       | 2   | 1   | —   | —   |

Points accumulate across every game played in the lobby. **There is no target score and no fixed game count** — the lobby plays as many games as the players want, and the running scoreboard is shown on the end screen after each game. A match ends only when players stop accepting a rematch or leave.

Ties in cumulative score are **not broken**; tied players are shown as sharing a position.

## Explicitly Not In These Rules

The following common Tiến lên variants are **not** implemented:

- Penalties for being caught holding 2s at game end (*thối 2*)
- Penalties for being caught holding an unbroken bomb at game end
- Instant-win hands other than the three listed (no "dragon" of 6 pairs + …, no three-triples, no six-low, etc.)
- Chopping across non-2 combo types
- Wrap-around straights
- Team play, betting, or per-card scoring
