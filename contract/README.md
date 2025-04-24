# Yavhana Smart Contracts

This repository contains the core Solidity smart contracts for the Yavhana platform, enabling creator tipping and content registration on the blockchain.

## Overview

The system consists of two main contracts:

1.  **`YavhanaTipping`**: Handles the financial interactions, allowing followers to tip creators using native currency (like ETH, BNB) or ERC20 tokens, while managing platform fees.
2.  **`YavhanaContentRegistry`**: Provides a mechanism for creators to register metadata about their content, linking it to their address and storing information like title, description, and an IPFS hash.

## Contracts

### 1. `YavhanaTipping.sol`

This contract facilitates direct tipping from followers to creators and manages the collection of platform fees.

**Features:**

* **Native Currency Tipping**: Users can send tips in the blockchain's native currency (e.g., ETH) directly to a creator's address using the `tipCreator` function.
* **ERC20 Token Tipping**: Users can tip creators with specified ERC20 tokens using the `tipCreatorERC20` function. This requires the tipper to have pre-approved the `YavhanaTipping` contract to spend the tokens on their behalf.
* **Platform Fee**: A configurable percentage of each tip is automatically deducted and sent to the contract owner (platform). The fee is set during deployment and can be updated by the owner.
* **Ownership**: Uses OpenZeppelin's `Ownable` contract. The owner can set the platform fee and withdraw accumulated fees.
* **Withdrawals**: The owner can withdraw accumulated native currency fees (`withdraw`) and ERC20 token fees (`withdrawERC20`) held by the contract.

**Events:**

* `Tip(address indexed tipper, address indexed creator, uint256 amount, uint256 platformFee)`: Emitted whenever a successful tip (native or ERC20) occurs.

**Key Functions:**

* `constructor(uint256 _platformFeePercentage)`: Deploys the contract, sets the initial owner (`msg.sender`), and the initial platform fee percentage. The fee is represented such that 1% = 100, and 100% = 10000.
* `tipCreator(address creator) payable`: Sends `msg.value` (native currency) as a tip. Calculates the platform fee, sends the remainder to the `creator`, and the fee to the `owner`. Requires `msg.value > 0`.
* `tipCreatorERC20(address creator, address tokenAddress, uint256 amount)`: Sends `amount` of the specified ERC20 `tokenAddress` as a tip. Requires the contract to have allowance from `msg.sender`. Calculates the fee, transfers the remainder to the `creator`, and the fee to the `owner`.
* `setPlatformFeePercentage(uint256 _platformFeePercentage) onlyOwner`: Allows the contract owner to update the platform fee percentage.
* `withdraw() onlyOwner`: Transfers the entire native currency balance of the contract to the owner.
* `withdrawERC20(address tokenAddress) onlyOwner`: Transfers the entire balance of the specified ERC20 token held by the contract to the owner.

**Platform Fee:**

The `platformFeePercentage` is an integer where `100` represents `1%`, `500` represents `5%`, and `10000` represents `100%`. The maximum allowed fee percentage is 10000.

---

### 2. `YavhanaContentRegistry.sol`

This contract acts as a simple registry for content metadata uploaded by creators.

**Features:**

* **Content Registration**: Creators can register metadata associated with their content, including a title, description, and an IPFS hash (or other content identifier).
* **Metadata Storage**: Stores content metadata linked to a unique `contentId`.
* **Creator Attribution**: Automatically links the registered content to the creator's address (`msg.sender`).
* **Public Retrieval**: Anyone can query the metadata for a given `contentId`.

**Events:**

* `ContentRegistered(uint256 indexed contentId, address indexed creator)`: Emitted when new content metadata is successfully registered.

**Key Functions:**

* `registerContent(string memory title, string memory description, string memory ipfsHash)`: Called by a creator (`msg.sender`) to register new content. Stores the provided metadata, assigns the next available `contentId`, and emits the `ContentRegistered` event.
* `getContentMetadata(uint256 contentId) view returns (...)`: Publicly accessible function to retrieve the creator address, title, description, and IPFS hash for a specific `contentId`.

## Prerequisites

* Solidity compiler version `^0.8.0`
* OpenZeppelin Contracts library (`contracts/token/ERC20/IERC20.sol`, `contracts/access/Ownable.sol`)

## Usage

1.  **Deployment**: Deploy both `YavhanaTipping` and `YavhanaContentRegistry` contracts. Ensure you provide the desired initial `platformFeePercentage` when deploying `YavhanaTipping`. The deployer of `YavhanaTipping` becomes the owner.
2.  **Content Registration**: Creators call `registerContent` on the `YavhanaContentRegistry` instance to log their content details.
3.  **Tipping**:
    * **Native Currency**: Users call `tipCreator(creatorAddress)` on the `YavhanaTipping` instance, sending the desired tip amount as `msg.value`.
    * **ERC20 Tokens**:
        * Users must first approve the `YavhanaTipping` contract address to spend the desired amount of the specific ERC20 token.
        * Users then call `tipCreatorERC20(creatorAddress, tokenAddress, amount)` on the `YavhanaTipping` instance.
4.  **Fee Management**: The owner of `YavhanaTipping` can adjust the fee using `setPlatformFeePercentage` and withdraw collected fees using `withdraw` and `withdrawERC20`.

## License

This project is licensed under the MIT License - see the SPDX license identifier at the top of the contract files.
