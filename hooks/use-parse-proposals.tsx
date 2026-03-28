import { ethers } from "ethers";
import { useEffect, useState } from "react";

import OzGovernor_ABI from "@data/OzGovernor_ABI.json";

import { Proposal } from "@/types/proposal";
import { Address } from "@/types/search";

// Multicall optimisé pour réduire drastiquement les appels RPC
const MULTICALL_BATCH_SIZE = 100; // Plus gros batch
const MAX_CONCURRENT_BATCHES = 3; // Limiter la concurrence

export function useParseProposals(
  provider: ethers.providers.Provider,
  contractAddress: Address | undefined,
  proposals: Proposal[],
  enabled: boolean
): Proposal[] {
  const [parsedProposals, setParsedProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    if (!enabled || !contractAddress || proposals.length === 0) {
      // Si pas de propositions, reset l'état
      if (proposals.length === 0) {
        setParsedProposals([]);
      }
      return;
    }

    console.log(`[useParseProposals] Parsing ${proposals.length} proposals...`);

    const parseProposals = async () => {
      const governorContract = new ethers.Contract(
        contractAddress,
        OzGovernor_ABI,
        provider
      );

      const parsedResults: Proposal[] = [];

      // Créer les batches
      const batches: Proposal[][] = [];
      for (let i = 0; i < proposals.length; i += MULTICALL_BATCH_SIZE) {
        batches.push(proposals.slice(i, i + MULTICALL_BATCH_SIZE));
      }

      // Traiter les batches avec limite de concurrence
      for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
        const currentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);

        const batchPromises = currentBatches.map(async (batch) => {
          try {
            // Utiliser multicall pour tout le batch en une seule requête
            const statePromises = batch.map((proposal) =>
              governorContract.state(proposal.id).catch(() => null)
            );

            const states = await Promise.all(statePromises);

            return batch
              .map((proposal, index) => {
                if (states[index] !== null) {
                  return {
                    ...proposal,
                    state: states[index],
                  };
                }
                return null;
              })
              .filter(Boolean) as Proposal[];
          } catch (error) {
            console.error("Batch error:", error);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        parsedResults.push(...batchResults.flat());
      }

      console.log(
        `[useParseProposals] Parsed ${parsedResults.length} proposals`
      );
      setParsedProposals(parsedResults);
    };

    parseProposals().catch((error) => {
      console.error("[useParseProposals] Error:", error);
    });
  }, [proposals, provider, contractAddress, enabled]);

  return parsedProposals;
}
