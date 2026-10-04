import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseExplanation } from '../src/schemas/explain-response.schema';

describe('parseExplanation', () => {
  const base = {
    mainIdea: 'The gist.',
    explanation: 'The body.',
    simpleEnglish: null,
    banglaExplanation: null,
    vocabulary: [],
    sentenceBreakdown: [],
  };

  it('strips the schema null placeholders so presence alone is meaningful', () => {
    const parsed = parseExplanation(JSON.stringify(base), 'simple_english');
    assert.ok(parsed);
    assert.equal('simpleEnglish' in parsed, false);
    assert.equal('banglaExplanation' in parsed, false);
    assert.equal('sentenceBreakdown' in parsed, false);
    assert.deepEqual(parsed.vocabulary, []);
    assert.equal(parsed.mode, 'simple_english');
    assert.equal(parsed.action, 'explain_text');
  });

  it('drops vocabulary entries missing a term or meaning', () => {
    const parsed = parseExplanation(
      JSON.stringify({
        ...base,
        vocabulary: [
          {
            term: 'reluctant',
            simpleMeaning: 'unwilling',
            banglaMeaning: null,
            contextualMeaning: null,
          },
          {
            term: '',
            simpleMeaning: 'orphan',
            banglaMeaning: null,
            contextualMeaning: null,
          },
          {
            term: 'lone',
            simpleMeaning: '  ',
            banglaMeaning: null,
            contextualMeaning: null,
          },
        ],
      }),
      'vocabulary',
    );
    assert.equal(parsed?.vocabulary.length, 1);
    assert.equal(parsed?.vocabulary[0]?.term, 'reluctant');
    assert.equal('banglaMeaning' in (parsed?.vocabulary[0] ?? {}), false);
  });

  it('returns null when the model omits a required field', () => {
    assert.equal(
      parseExplanation(JSON.stringify({ ...base, mainIdea: '' }), 'bangla'),
      null,
    );
    assert.equal(
      parseExplanation(JSON.stringify({ ...base, explanation: '   ' }), 'bangla'),
      null,
    );
  });

  it('returns null for output that is not JSON at all', () => {
    assert.equal(parseExplanation('I cannot help with that.', 'bangla'), null);
    assert.equal(parseExplanation('[1,2,3]', 'bangla'), null);
  });

  it('keeps sentence breakdown items only when usable', () => {
    const parsed = parseExplanation(
      JSON.stringify({
        ...base,
        sentenceBreakdown: [
          { original: 'A.', simpleExplanation: 'Means A.', banglaExplanation: 'ক।' },
          { original: '', simpleExplanation: 'orphan', banglaExplanation: null },
        ],
      }),
      'sentence_by_sentence',
    );
    assert.equal(parsed?.sentenceBreakdown?.length, 1);
    assert.equal(parsed?.sentenceBreakdown?.[0]?.banglaExplanation, 'ক।');
  });
});
