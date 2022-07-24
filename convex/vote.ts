import { mutation } from './_generated/server'

interface Ballot {
    voter: string;
    election: string;
    // in order of preference
    candidates: string[];
}

export default mutation(
  async ({ db, auth }, ballot: Ballot) => {
    // TODO: validate voter with auth
    db.insert('ballots', {
        voter: ballot.voter,
        election: ballot.election,
        candidates: ballot.candidates,
    });
    let first = 1;
    for (let candidate of ballot.candidates) {
        const candidateDoc = await db.table('candidates')
            .index('by_candidate')
            .range(q => q.eq('election', ballot.election).eq('candidate', candidate)).first();
        if (candidateDoc === null) {
            // cast the first vote
            db.insert('candidates', {
                election: ballot.election,
                candidate: candidate,
                firstChoiceCount: first,
            });
        } else {
            db.patch(candidateDoc._id, {
                firstChoiceCount: candidateDoc.firstChoiceCount+first,
            });
        }
        first = 0;
    }
    // Like console.log but relays log messages from the server to client.
    console.log(`Voted for ${ballot.candidates}`);
  }
)
