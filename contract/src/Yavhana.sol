// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract YavhanaTipping is Ownable {
    uint256 public platformFeePercentage; // 1% = 100, 100% = 10000

    event Tip(
        address indexed tipper,
        address indexed creator,
        uint256 amount,
        uint256 platformFee
    );

    constructor(uint256 _platformFeePercentage) Ownable(msg.sender){
        require(_platformFeePercentage <= 10000, "Fee too high");
        platformFeePercentage = _platformFeePercentage;
    }

    function tipCreator(address creator) public payable {
        require(msg.value > 0, "Tip amount must be greater than zero");

        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 creatorAmount = msg.value - platformFee;

        (bool successCreator, ) = creator.call{value: creatorAmount}("");
        require(successCreator, "Creator transfer failed");

        (bool successPlatform, ) = payable(owner()).call{value: platformFee}("");
        require(successPlatform, "Platform fee transfer failed");

        emit Tip(msg.sender, creator, msg.value, platformFee);
    }

    function tipCreatorERC20(address creator, address tokenAddress, uint256 amount) public {
        IERC20 token = IERC20(tokenAddress);
        uint256 platformFee = (amount * platformFeePercentage) / 10000;
        uint256 creatorAmount = amount - platformFee;

        require(token.transferFrom(msg.sender, creator, creatorAmount), "Creator ERC20 transfer failed");
        require(token.transferFrom(msg.sender, owner(), platformFee), "Platform ERC20 fee transfer failed");

        emit Tip(msg.sender, creator, amount, platformFee);
    }

    function setPlatformFeePercentage(uint256 _platformFeePercentage) public onlyOwner {
        require(_platformFeePercentage <= 10000, "Fee too high");
        platformFeePercentage = _platformFeePercentage;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawERC20(address tokenAddress) public onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(owner(), token.balanceOf(address(this)));
    }
}

contract YavhanaContentRegistry {
    struct ContentMetadata {
        address creator;
        string title;
        string description;
        string ipfsHash;
    }

    mapping(uint256 => ContentMetadata) public contentMetadata;
    uint256 public contentIdCounter;

    event ContentRegistered(uint256 indexed contentId, address indexed creator);

    function registerContent(
        string memory title,
        string memory description,
        string memory ipfsHash
    ) public {
        contentMetadata[contentIdCounter] = ContentMetadata(
            msg.sender,
            title,
            description,
            ipfsHash
        );
        emit ContentRegistered(contentIdCounter, msg.sender);
        contentIdCounter++;
    }

    function getContentMetadata(uint256 contentId)
        public
        view
        returns (
            address creator,
            string memory title,
            string memory description,
            string memory ipfsHash
        )
    {
        ContentMetadata memory metadata = contentMetadata[contentId];
        return (metadata.creator, metadata.title, metadata.description, metadata.ipfsHash);
    }
}