import { z } from "zod";
import { isAgentId } from "@/core/coach/conversation";
import type { CoachMessage } from "@/services/coachMessages";
import { CoachBubble } from "./CoachBubble";
import { ProposalCard } from "./ProposalCard";

const storedProposal = z.object({ changes: z.array(z.object({ label: z.string(), reason: z.string() })) });
const statuses = ["pending", "applied", "dismissed"] as const;

/** A saved coach message as a bubble, with its proposal when it has one. */
export function StoredMessage({ message }: { message: CoachMessage }) {
  const proposal = storedProposal.safeParse(message.proposal);
  const status = statuses.find((item) => item === message.proposal_status);
  const agent = message.role === "user" ? null : isAgentId(message.agent) ? message.agent : "head";

  return (
    <CoachBubble
      agent={agent}
      footer={
        proposal.success && status && proposal.data.changes.length > 0 ? (
          <ProposalCard messageId={message.id} changes={proposal.data.changes} status={status} />
        ) : null
      }
    >
      {message.content}
    </CoachBubble>
  );
}
