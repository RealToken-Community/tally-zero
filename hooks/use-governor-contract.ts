import { ethers } from "ethers";
import { useEffect, useMemo, useRef, useState } from "react";
import { gnosis } from "wagmi/chains";

import { useFormattedProposals } from "@/hooks/use-formatted-proposals";
import { useDeploymentBlock } from "@hooks/use-deployment-block";
import { useParseProposals } from "@hooks/use-parse-proposals";
import { useSearchProposals } from "@hooks/use-search-proposals";

import { ContractParams, State } from "@/types/search";

import { getBlockRange, selectDAOByGovernorAddress } from "@/lib/dao";
import GovernorABI from "@data/OzGovernor_ABI.json";

export function useGovernorContract({
  values,
  state,
  setState,
}: {
  values: ContractParams;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  const [overallProgress, setOverallProgress] = useState(0);

  // Wagmi v3 n'exporte plus `useProvider`. Les hooks ci-dessous s'attendent à un
  // provider ethers, donc on construit un JsonRpcProvider via l'URL RPC de gnosis.
  const networkId = values.networkId ? Number(values.networkId) : undefined;
  const rpcUrl =
    (networkId === gnosis.id ? gnosis.rpcUrls.default.http[0] : undefined) ??
    gnosis.rpcUrls.default.http[0];
  const provider = useMemo(
    () => new ethers.providers.JsonRpcProvider(rpcUrl),
    [rpcUrl]
  );

  const dao = selectDAOByGovernorAddress(values.contractAddress);

  // Search for the Deployment block of Governor
  const { blockNumber, success, currentSearchBlock, deploymentProgress } =
    useDeploymentBlock(provider, values.contractAddress, values.fromBlock || 0);

  // When governor is found, create a contract instance and set it to state
  const governorContractRef = useRef(state.governor.contract);

  useEffect(() => {
    if (!governorContractRef.current && success && blockNumber) {
      const governorContract = new ethers.Contract(
        values.contractAddress?.toString() as string,
        GovernorABI,
        provider
      );

      governorContractRef.current = governorContract;

      setState((prevState) => ({
        ...prevState,
        system: {
          ...prevState.system,
          currentDeployBlock: currentSearchBlock
            ? currentSearchBlock
            : undefined,
        },
        governor: {
          ...prevState.governor,
          contract: governorContract,
          fromBlock: blockNumber,
          name: undefined,
        },
      }));
    }
  }, [
    provider,
    values.contractAddress,
    success,
    blockNumber,
    currentSearchBlock,
    state.governor.contract,
    values.state?.governor.contract,
    setState,
  ]);

  // Update the ref when state.governor.contract changes outside of this useEffect
  useEffect(() => {
    governorContractRef.current = state.governor.contract;
  }, [state.governor.contract]);

  // When governor contract is found, find Proposals
  const blockRange = getBlockRange(dao) as number;
  const { proposals, searchProgress } = useSearchProposals(
    provider,
    values.contractAddress,
    blockRange,
    values.fromBlock === 0 && state.governor.fromBlock != null
      ? state.governor.fromBlock
      : values.fromBlock ?? null,
    true
  );

  // When Proposals, parse them into a more readable format
  const parsedProposals = useParseProposals(
    provider,
    values.contractAddress,
    proposals,
    true
  );
  const formattedProposals = useFormattedProposals(
    parsedProposals,
    values.networkId?.toString() as string
  );

  useEffect(() => {
    // La recherche de propositions peut finir à 100 % pendant que la détection du bloc
    // de déploiement tourne encore (ex. fromBlock renseigné). Le mix 20/80 ne peut alors
    // jamais atteindre 100 tant que deployment < 100 → UI bloquée sur « Connecting… ».
    const combinedProgress =
      searchProgress >= 100
        ? 100
        : deploymentProgress * 0.2 + searchProgress * 0.8;
    console.log(
      `[useGovernorContract] Progress - Deployment: ${deploymentProgress.toFixed(0)}%, Search: ${searchProgress.toFixed(0)}%, Overall: ${combinedProgress.toFixed(0)}%`
    );
    console.log(
      `[useGovernorContract] Proposals count - raw: ${proposals.length}, parsed: ${parsedProposals.length}, formatted: ${formattedProposals.length}`
    );
    setOverallProgress(Math.min(100, Math.round(combinedProgress)));
  }, [
    deploymentProgress,
    searchProgress,
    proposals.length,
    parsedProposals.length,
    formattedProposals.length,
  ]);

  return {
    overallProgress,
    formattedProposals,
  };
}
