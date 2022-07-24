import { query } from './_generated/server'

interface ElectionResults {
    election: string,
    firstPastThePostWinner: string | null,
    rankedChoiceWinner: string | null,
}

interface IntermediateChoice {
    candidate: string,
    voteCount: number,
    bottomCandidate: string,
}

function topChoice(preferences: string[][]): IntermediateChoice | null {
    let counts = new Map<string, number>();
    for (let preference of preferences) {
        let top = preference[0];
        counts.set(top, (counts.get(top) ?? 0) + 1);
    }
    let topResult = null;
    let topResultCount = 0;
    let bottomResult = null;
    let bottomResultCount = preferences.length+1;
    counts.forEach((count, candidate) => {
        if (count > topResultCount) {
            topResult = candidate;
            topResultCount = count;
        }
        if (count < bottomResultCount) {
            bottomResult = candidate;
            bottomResultCount = count;
        }
    });
    return topResult && bottomResult ? {
        candidate: topResult,
        voteCount: topResultCount,
        bottomCandidate: bottomResult,
    } : null;
}

function eliminate(preference: string[], candidate: string): string[] {
    return preference.filter(c => c !== candidate);
}

function rankedChoice(preferences: string[][]): string | null {
    while (true) {
        console.log(`doing a round of ranked choice`);
        for (let preference of preferences) {
            console.log(`preference is ${preference}`);
        }
        let top = topChoice(preferences);
        if (top === null) {
            return null;
        }
        if (top.voteCount > preferences.length / 2) {
            return top.candidate;
        }
        // Eliminate least popular candidate
        preferences = preferences.map(
            preference => eliminate(preference, top!.bottomCandidate)
        );
    }
}

export default query(async ({ db }, election: string): Promise<ElectionResults> => {
  const ballots = await db
    .table('ballots')
    .index('by_election').range((q) => q.eq('election', election))
    .collect();
  console.log(`Got all votes for ${election}`);
  // First in descending voteCounts order is the winner!
  let firstPastThePostWinner = await db.table('candidates')
    .index('popularity')
    .range(q => q.eq('election', election)).order('desc')
    .first();
    console.log(`first past the post winner is ${firstPastThePostWinner?.candidate}`);
  let rankedChoiceWinner = rankedChoice(ballots.map(ballot => ballot.candidates));
  return {
    election,
    firstPastThePostWinner: (firstPastThePostWinner === null ? null : firstPastThePostWinner.candidate),
    rankedChoiceWinner,
  };
})
