//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can access this method");
        _;
    }

    modifier onlyBuyer(uint256 _nftId) {
        require(
            msg.sender == buyer[_nftId],
            "Only Buyer can access this method"
        );
        _;
    }
    modifier onlyInspector() {
        require(
            msg.sender == inspector,
            "Only Inspector can access this method"
        );
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionStatus;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    function list(
        uint256 _nftId,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftId);
        isListed[_nftId] = true;
        buyer[_nftId] = _buyer;
        purchasePrice[_nftId] = _purchasePrice;
        escrowAmount[_nftId] = _escrowAmount;
    }

    function depositEarnest(uint256 _nftId) public payable onlyBuyer(_nftId) {
        require(
            msg.value >= escrowAmount[_nftId],
            "Please enter amount greater than escrow amount"
        );
    }

    function updateInspectionStatus(
        uint256 _nftId,
        bool _passed
    ) public onlyInspector {
        inspectionStatus[_nftId] = _passed;
    }

    function approveSale(uint256 _nftId) public {
        approval[_nftId][msg.sender] = true;
    }

    // Finalize Sale
    // -> Require inspection status (add more items here, like appraisal)
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller

    function finalizeSale(uint256 _nftId) public {
        require(inspectionStatus[_nftId], "Inspection not clear");
        require(approval[_nftId][buyer[_nftId]], "Not approved by buyer");
        require(approval[_nftId][seller], "Not approved by seller");
        require(approval[_nftId][lender], "Not approved by lender");
        require(
            address(this).balance >= purchasePrice[_nftId],
            "Funds are insufficient"
        );

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftId], _nftId);

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success, "Transfer to seller failed");

        isListed[_nftId] = false;
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getLenderBalance() public view returns (uint256) {
        return lender.balance;
    }
}
