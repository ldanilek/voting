import { defineSchema, defineTable, s } from "convex/schema";

export default defineSchema({
// source of truth for all ballots and candidates
  ballots: defineTable({
    voter: s.string(),
    election: s.string(),
    candidates: s.array(s.string()),
  }).index("by_election", ["election"]),
  // derived data for each candidate
  candidates: defineTable({
    election: s.string(),
    candidate: s.string(),
    firstChoiceCount: s.number(),
  })
  .index("popularity", ["election", "firstChoiceCount"])
  .index("by_candidate", ["election", "candidate"]),
});
