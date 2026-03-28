import { Contract, ethers } from "ethers";
import { useEffect, useState } from "react";

import { Proposal, UseSearchProposals } from "@/types/proposal";
import OZGovernor_ABI from "@data/OzGovernor_ABI.json";
import { CLUSTER_SIZE } from "../lib/utils";

export const useSearchProposals: UseSearchProposals = (
  provider,
  contractAddress,
  blockRange,
  startingBlock,
  enabled
) => {
  const [searchProgress, setSearchProgress] = useState(0);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const cancelSearch = () => {
    setSearchProgress(0);
    setProposals([]);
  };

  useEffect(() => {
    // startingBlock peut être 0 (bloc valide) : ne pas utiliser !startingBlock
    if (!enabled || !provider || !contractAddress || startingBlock == null) {
      return;
    }

    const contract = new Contract(contractAddress, OZGovernor_ABI, provider);

    const fetchProposals = async () => {
      try {
        let proposals: Proposal[] = [];
        const currentBlock = await provider.getBlockNumber();
        const proposalCreatedFilter = contract.filters.ProposalCreated();
        const startBlock = Math.max(
          startingBlock - blockRange * CLUSTER_SIZE,
          0
        );

        // Créer des batches de requêtes pour réduire les appels RPC
        const ranges: Array<{ from: number; to: number }> = [];
        for (
          let fromBlock = startBlock;
          fromBlock <= currentBlock - blockRange;
          fromBlock += blockRange
        ) {
          const toBlock = Math.min(fromBlock + blockRange - 1, currentBlock);
          ranges.push({ from: fromBlock, to: toBlock });
        }

        // Traiter par lots de 10 requêtes simultanées max
        const CONCURRENT_QUERIES = 10;
        for (let i = 0; i < ranges.length; i += CONCURRENT_QUERIES) {
          const batchRanges = ranges.slice(i, i + CONCURRENT_QUERIES);

          const batchPromises = batchRanges.map(async ({ from, to }) => {
            try {
              return await contract.queryFilter(
                proposalCreatedFilter,
                from,
                to
              );
            } catch (error) {
              console.warn(`Error querying blocks ${from}-${to}:`, error);
              return [];
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const allEvents = batchResults.flat();

          console.log(
            `[useSearchProposals] Batch ${i / CONCURRENT_QUERIES + 1}/${Math.ceil(ranges.length / CONCURRENT_QUERIES)}: Found ${allEvents.length} events`
          );

          const newProposals = allEvents.map((event) => {
            const {
              proposalId,
              proposer,
              targets,
              values,
              signatures,
              calldatas,
              startBlock,
              endBlock,
              description,
            } = event.args as ethers.utils.Result;
            return {
              id: proposalId.toString(),
              contractAddress: contractAddress,
              proposer,
              targets,
              values: Array.isArray(values)
                ? values.map((value) => value.toString())
                : [],
              signatures,
              calldatas,
              startBlock: startBlock.toString(),
              endBlock: endBlock.toString(),
              description,
              state: 0,
            };
          });

          if (newProposals.length > 0) {
            proposals = [...proposals, ...newProposals];
          }

          setSearchProgress(((i + batchRanges.length) / ranges.length) * 100);
        }

        console.log(
          `[useSearchProposals] Search complete: Found ${proposals.length} proposals`
        );
        setProposals(proposals);
        setSearchProgress(100);
        return cancelSearch;
      } catch (error) {
        console.warn("Error fetching proposals:", error);
        setProposals([]);
        setSearchProgress(100);
      }
    };

    fetchProposals().catch((err) => {
      console.warn(err);
      setSearchProgress(100);
    });
  }, [provider, contractAddress, startingBlock, enabled, blockRange]);

  return { proposals, searchProgress };
};
