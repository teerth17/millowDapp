const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    );

    // Approve the Property
    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    // List the Property
    transaction = await escrow.connect(seller).list(1);
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Returns Nft address", async () => {
      const result = await escrow.nftAddress();
      assert.equal(result, realEstate.address);
    });

    it("Returns seller", async () => {
      const result = await escrow.seller();
      assert.equal(result, seller.address);
    });

    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      assert.equal(result, inspector.address);
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      assert.equal(result, lender.address);
    });
  });

  describe("Listing", () => {
    it("Update the ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
  });
});
