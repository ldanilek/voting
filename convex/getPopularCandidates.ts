import { query } from './_generated/server'

interface Candidate {
  candidate: string,
  firstChoiceCount: number,
}

export default query(async ({ db }, election: string): Promise<Candidate[]> => {
  const topChoices = await db
    .table('candidates').index('popularity')
    .range((q) => q.eq('election', election))
    .order('desc')
    .take(5);
  return topChoices;
})
