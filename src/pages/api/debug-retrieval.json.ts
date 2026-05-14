import type { APIRoute } from 'astro';
import { corpus } from '../../lib/qa-loader';
import { buildIndex, retrieve } from '../../lib/retrieval';

export const prerender = false;

const SAMPLE_QUERIES = [
  "What is TakeShape's agent architecture?",
  'Why did you leave Newsweek?',
  'What languages do you use most?',
  'Tell me about your kids',
  "What's your hot take on TypeScript?",
  'How did Fair Tread end?',
  "What's the worst day you've had as a CTO?",
  'What did you do at Pfizer?',
  'Are you any good at hiring?',
  'What music do you listen to?'
];

const index = buildIndex(corpus);

export const GET: APIRoute = () => {
  const results = SAMPLE_QUERIES.map((query) => ({
    query,
    results: retrieve(index, query, 5).map((r) => ({
      id: r.entry.id,
      category: r.entry.category,
      score: Number(r.score.toFixed(3)),
      question: r.entry.question
    }))
  }));

  return new Response(
    JSON.stringify(
      {
        corpusSize: corpus.length,
        byCategory: corpus.reduce(
          (acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        samples: results
      },
      null,
      2
    ),
    { headers: { 'content-type': 'application/json' } }
  );
};
