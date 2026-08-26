import {
  evaluateNegotiationTurn,
  initialNegotiationPatience,
} from '../src/engine/negotiation';

function turn(overrides: Partial<Parameters<typeof evaluateNegotiationTurn>[0]> = {}) {
  return evaluateNegotiationTurn({
    direction: 'buy',
    offerTl: 1000,
    thresholdTl: 1000,
    bargainingStyle: 'dengeli',
    karizmaScore: 50,
    patience: 3,
    previousOffers: [],
    roundsUsed: 0,
    maxRounds: 2,
    ...overrides,
  });
}

describe('deterministic customer negotiation turns', () => {
  it('accepts a reasonable buy offer', () => {
    expect(turn({ offerTl: 1000 }).kind).toBe('accept');
  });

  it('turns a slightly low offer into a real counter offer', () => {
    const outcome = turn({ offerTl: 950 });
    expect(outcome.kind).toBe('counter');
    if (outcome.kind === 'counter') expect(outcome.counterAmountTl).toBeGreaterThan(950);
  });

  it('warns and reduces patience for a poor offer', () => {
    const outcome = turn({ offerTl: 850 });
    expect(outcome).toMatchObject({ kind: 'warning', patienceAfter: 2 });
  });

  it('makes the customer leave when patience is exhausted', () => {
    expect(turn({ offerTl: 700, patience: 1 })).toMatchObject({ kind: 'leave', patienceAfter: 0 });
  });

  it('does not create a new chance from a near-identical repeat offer', () => {
    const outcome = turn({ offerTl: 950, previousOffers: [950] });
    expect(outcome).toMatchObject({ kind: 'warning', tone: 'repeat', patienceAfter: 2 });
  });

  it('keeps customer counter offers in the correct direction for buying', () => {
    const outcome = turn({ offerTl: 950 });
    expect(outcome.kind).toBe('counter');
    if (outcome.kind === 'counter') expect(outcome.counterAmountTl).toBeGreaterThan(950);
  });

  it('keeps customer counter offers in the correct direction for selling', () => {
    const outcome = turn({ direction: 'sell', offerTl: 1050 });
    expect(outcome.kind).toBe('counter');
    if (outcome.kind === 'counter') expect(outcome.counterAmountTl).toBeLessThan(1050);
  });

  it('keeps final-offer state and wording from regressing to open bargaining', () => {
    const outcome = turn({ offerTl: 950, roundsUsed: 1 });
    expect(outcome).toMatchObject({ kind: 'final', tone: 'final', reaction: 'Son fiyatım bu.' });
    expect(outcome.reaction).not.toMatch(/çıkarsanız|inerseniz|anlaşabiliriz/i);
  });

  it('lets an urgent customer reach a final price sooner', () => {
    expect(turn({ offerTl: 950, roundsUsed: 1, maxRounds: 3 }).kind).toBe('counter');
    expect(turn({ offerTl: 950, roundsUsed: 1, maxRounds: 3, urgency: 'Acil' }).kind).toBe('final');
  });

  it('gives charisma a controlled advantage on a borderline offer', () => {
    expect(turn({ offerTl: 925, karizmaScore: 50 }).kind).not.toBe('accept');
    expect(turn({ offerTl: 925, karizmaScore: 100 }).kind).toBe('accept');
  });

  it('does not let charisma accept an extremely poor offer', () => {
    expect(turn({ offerTl: 700, karizmaScore: 100 }).kind).not.toBe('accept');
  });

  it('uses the existing customer styles to vary patience and counter distance', () => {
    expect(initialNegotiationPatience('kolay')).toBeGreaterThan(initialNegotiationPatience('dengeli'));
    const easy = turn({ offerTl: 950, bargainingStyle: 'kolay' });
    const hard = turn({ offerTl: 950, bargainingStyle: 'sert' });
    expect(easy.kind).toBe('counter');
    expect(hard.kind).toBe('counter');
    if (easy.kind === 'counter' && hard.kind === 'counter') {
      expect(hard.counterAmountTl).toBeGreaterThan(easy.counterAmountTl);
    }
  });
});
