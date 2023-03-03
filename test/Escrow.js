const { expect ,assert} = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    // let buyer, seller, inspector, lender
    // let realEstate, escrow
    it("saves the address", async () => {
        const RealEstate = await ethers.getContractFactory("RealEstate");
        realEstate = await RealEstate.deploy()

        console.log(realEstate.address)

    })
})
