"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

const colors = {
  primary: "#FFB300",
  secondary: "#F5F5F5",
  backgroundLight: "#FFFFFF",
  backgroundDark: "#1E1E1E",
  textLight: "#222222",
  textDark: "#FFFFFF",
  textSecondary: "#777777",
  error: "#FF4500",
  success: "#4CAF50",
  brandAccent1: "#E9967A",
  brandAccent2: "#008080",
};

const tippingContractAddress = "YOUR_TIPPING_CONTRACT_ADDRESS";
const tippingContractABI = [
  "function tipCreator(address creator) payable",
  "function tipCreatorERC20(address creator, address tokenAddress, uint256 amount)",
  "function setPlatformFeePercentage(uint256 _platformFeePercentage)",
  "function withdraw()",
  "function withdrawERC20(address tokenAddress)",
  "function platformFeePercentage() view returns (uint256)",
];

const contentRegistryAddress = "YOUR_CONTENT_REGISTRY_ADDRESS";
const contentRegistryABI = [
  "function registerContent(string memory title, string memory description, string memory ipfsHash)",
  "function getContentMetadata(uint256 contentId) view returns (address creator, string memory title, string memory description, string memory ipfsHash)",
  "function contentIdCounter() view returns (uint256)",
];

const ipfs = create({ url: "YOUR_IPFS_NODE_URL" });

function App() {
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    connectWallet();
  }, []);

  async function connectWallet() {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      setSigner(signer);
    } else {
      alert("Please install MetaMask!");
    }
  }

  return (
    <Router>
      <div
        style={{
          backgroundColor: colors.backgroundLight,
          color: colors.textLight,
        }}
      >
        <NavBar signer={signer} />
        <Routes>
          <Route path="/" element={<Home signer={signer} />} />
          <Route path="/upload" element={<UploadContent signer={signer} />} />
          <Route
            path="/content/:id"
            element={<ContentPage signer={signer} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

function NavBar({ signer }) {
  return (
    <nav style={{ backgroundColor: colors.secondary, padding: "10px" }}>
      <Link to="/" style={{ margin: "0 10px", color: colors.textLight }}>
        Home
      </Link>
      <Link to="/upload" style={{ margin: "0 10px", color: colors.textLight }}>
        Upload
      </Link>
      {signer ? (
        <button style={{ float: "right" }}>
          Connected: {signer.getAddress().substring(0, 6)}...
        </button>
      ) : (
        <button onClick={() => connectWallet()} style={{ float: "right" }}>
          Connect Wallet
        </button>
      )}
    </nav>
  );
}

function Home({ signer }) {
  const [contentList, setContentList] = useState([]);
  const registryContract = signer
    ? new ethers.Contract(contentRegistryAddress, contentRegistryABI, signer)
    : null;

  useEffect(() => {
    if (registryContract) {
      fetchContentList();
    }
  }, [registryContract]);

  async function fetchContentList() {
    const counter = await registryContract.contentIdCounter();
    const list = [];
    for (let i = 0; i < counter; i++) {
      const metadata = await registryContract.getContentMetadata(i);
      list.push({ id: i, ...metadata });
    }
    setContentList(list);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Content List</h2>
      {contentList.map((content) => (
        <div
          key={content.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            margin: "10px 0",
          }}
        >
          <Link to={`/content/${content.id}`} style={{ color: colors.primary }}>
            {content.title}
          </Link>
        </div>
      ))}
    </div>
  );
}

function UploadContent({ signer }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const registryContract = signer
    ? new ethers.Contract(contentRegistryAddress, contentRegistryABI, signer)
    : null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !title || !description) return;
    try {
      const { cid } = await ipfs.add(file);
      const ipfsHash = cid.toString();
      await registryContract.registerContent(title, description, ipfsHash);
      alert("Content uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Upload failed!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Content</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ margin: "10px 0" }}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ margin: "10px 0" }}
      />
      <input
        type="file"
        onChange={handleFileChange}
        style={{ margin: "10px 0" }}
      />
      <button
        onClick={handleUpload}
        style={{ backgroundColor: colors.primary, color: "white" }}
      >
        Upload
      </button>
    </div>
  );
}

function ContentPage({ signer }) {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [tipAmount, setTipAmount] = useState("");
  const registryContract = signer
    ? new ethers.Contract(contentRegistryAddress, contentRegistryABI, signer)
    : null;
  const tippingContract = signer
    ? new ethers.Contract(tippingContractAddress, tippingContractABI, signer)
    : null;

  useEffect(() => {
    if (registryContract && id) {
      fetchContent();
    }
  }, [registryContract, id]);

  async function fetchContent() {
    const metadata = await registryContract.getContentMetadata(id);
    setContent(metadata);
  }

  const handleTip = async () => {
    if (!content || !tipAmount) return;
    try {
      await tippingContract.tipCreator(content.creator, {
        value: ethers.utils.parseEther(tipAmount),
      });
      alert("Tip sent!");
    } catch (error) {
      console.error(error);
      alert("Tip failed!");
    }
  };

  if (!content) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{content.title}</h2>
      <p>{content.description}</p>
      <video
        src={`https://YOUR_IPFS_GATEWAY/${content.ipfsHash}`}
        controls
        style={{ width: "100%", maxWidth: "600px" }}
      />
      <div>
        <input
          type="number"
          placeholder="Tip Amount (ETH)"
          value={tipAmount}
          onChange={(e) => setTipAmount(e.target.value)}
          style={{ margin: "10px 0" }}
        />
        <button
          onClick={handleTip}
          style={{ backgroundColor: colors.primary, color: "white" }}
        >
          Tip
        </button>
      </div>
    </div>
  );
}

export default App;
