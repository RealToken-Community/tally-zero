![hero](/public/og.png)

<p align="center">
	<h1 align="center"><b>TallyZero</b></h1>
<p align="center">
    Decentralized Voting Made Simple
    <br />
    <br />
    <a href="https://tally-zero-preview.vercel.app/">Website</a>
    ·
    <a href="https://github.com/withtally/tally-zero/issues">Issues</a>
  </p>
</p>

# What is TallyZero

> A robust, open-source platform for onchain voting, Tally Zero ensures accessibility and transparency, leveraging React and IPFS for true decentralization.

# App Architecture

- Yarn
- React
- TypeScript
- Nextjs
- TailwindCSS

### Hosting

- Fleek (IPFS Hosting, deployment, build)
- Github (Codebase, issues, PRs, actions)

### Services

- Github Actions (CI/CD)
- Ethers (Fetching proposals)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=withtally/tally-zero&type=Date)](https://star-history.com/#withtally/tally-zero&Date)

# Essential Guidelines

The project's pages are located in the `/app` directory, with components organized as follows:

- `container`: Components related to the interface
- `form`: All forms are housed here
- `navigation`: Components associated with the layout
- `section`: Components for the marketing page
- `table`: Self explanatory
- `ui`: Components from [Shadcn UI](https://ui.shadcn.com/)

The `/config` folder is crucial for maintenance purposes:

- `chains.ts`: Contains all chains for Web3 connection
- `data.ts`: Lists the chains supported by Tally Zero (refer to the image). You can add as many as required.

![Supported Chains](/public/readme/chain.png)

Lastly, the `/data` folder contains the ABI for TallyZero.
