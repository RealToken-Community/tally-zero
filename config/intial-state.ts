import { State } from "@/types/search";

export const initialState: State = {
  system: {
    currentDeployBlock: 0,
  },
  governor: {
    address: undefined,
    contract: null,
    fromBlock: null,
    name: undefined,
  },
  token: {
    address: undefined,
    contract: null,
    fromBlock: null,
  },
  proposals: [],
};

export enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

export enum ProposalOptimismState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}
