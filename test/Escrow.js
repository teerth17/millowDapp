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
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
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
    it("Update isListed status", async () => {
      const result = await escrow.isListed(1);
      expect(result).equal(true);
    });
    it("Update the ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
    it("Returns Buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });
    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    });
    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    });
  });

  describe("Deposits", () => {
    it("Updates Contract Balance", async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();
      const result = await escrow.getBalance();
      expect(result).to.be.equal(tokens(5));
    });
  });

  describe("Insepection", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();
    });
    it("Updates inspection status", async () => {
      const result = await escrow.inspectionStatus(1);
      expect(result).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    beforeEach(async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();
    });
    it("updates approvall status", async () => {
      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("Sale", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({
        to: escrow.address,
        value: tokens(5),
      });

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    it("updates Ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
    });

    it("Updates Balance of Contract", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
});
