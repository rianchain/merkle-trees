const { expect } = require("chai");
const keccak256 = require("keccak256");
const { merkleTree, default: MerkleTree } = require("merkletreejs");

function encodeLeaf(address, spots) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint64"],
        [address, spots]
    )
}

describe("Merkle Trees", function () {
    it("Should be able to verify if address is in whitelist or not", async function () {
        const testAddress = await ethers.getSigners();

        const list = [
            encodeLeaf(testAddress[0].address, 2),
            encodeLeaf(testAddress[1].address, 2),
            encodeLeaf(testAddress[2].address, 2),
            encodeLeaf(testAddress[3].address, 2),
            encodeLeaf(testAddress[4].address, 2),
            encodeLeaf(testAddress[5].address, 2),
        ];

        const merkleTree = new MerkleTree(list, keccak256, {
            hashLeaves: true,
            sortPairs: true,
            sortLeaves: true,
        });


        const root = merkleTree.getHexRoot();

        const whitelist = await ethers.getContractFactory("Whitelist");
        const Whitelist = await whitelist.deploy(root);
        await Whitelist.waitForDeployment();

        for (let i = 0; i < 6; i++) {
            const leaf = keccak256(list[i]);
            const proof = merkleTree.getHexProof(leaf);

            const connectedWhitelist = await Whitelist.connect(testAddress[i]);

            const verified = await connectedWhitelist.checkInWhitelist(proof, 2);
            expect(verified).to.equal(true);
        }

        const verifiedInvalid = await Whitelist.checkInWhitelist([], 2);
        expect(verifiedInvalid).to.equal(false);
    })
})