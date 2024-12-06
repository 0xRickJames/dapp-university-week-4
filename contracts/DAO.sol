// SPDX-License-Identifier: WTFPL
pragma solidity ^0.8.0;

import 'hardhat/console.sol';
import './Token.sol';

contract DAO {
    address owner;
    Token public govToken;
    uint256 public quorum;
    Token public payToken;

    struct Proposal {
        uint256 id;
        string name;
        string description;
        uint256 amount;
        address payable recipient;
        uint256 upVotes;
        uint256 downVotes;
        bool approved;
        bool finalized;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    event Propose(uint id, uint256 amount, address recipient, address creator);
    event UpVote(uint256 id, address investor);
    event DownVote(uint256 id, address investor);
    event Finalize(uint256 id, bool approved);

    constructor(Token _token, uint256 _quorum, Token _payToken) {
        owner = msg.sender;
        govToken = _token;
        quorum = _quorum;
        payToken = _payToken;
    }

    // Allow contract to receive ether
    receive() external payable {}

    modifier onlyInvestor() {
        require(
            Token(govToken).balanceOf(msg.sender) > 0,
            'must be token holder'
        );
        _;
    }

    // Name:

    function createProposal(
        string memory _name,
        string memory _description,
        uint256 _amount,
        address payable _recipient
    ) external onlyInvestor {
        // Make sure the msg.sender has enough payTokens
        require(
            payToken.balanceOf(msg.sender) >= _amount,
            'not enough payTokens'
        );

        // Make sure _recipient is a valid address
        require(_recipient != address(0), 'invalid recipient');
        // Make sure the _name is not empty
        require(bytes(_name).length > 0, 'invalid name');
        // Make sure the _description is not empty
        require(bytes(_description).length > 0, 'invalid description');

        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _description,
            _amount,
            _recipient,
            0,
            0,
            false,
            false
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    mapping(address => mapping(uint256 => bool)) upVotes;
    mapping(address => mapping(uint256 => bool)) downVotes;

    function getUpVote(
        address _voter,
        uint256 _proposalId
    ) external view returns (bool) {
        return upVotes[_voter][_proposalId];
    }

    function getDownVote(
        address _voter,
        uint256 _proposalId
    ) external view returns (bool) {
        return downVotes[_voter][_proposalId];
    }

    function upVote(uint256 _id) external onlyInvestor {
        // Fetch proposal frm mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let investors upVote twice
        require(!upVotes[msg.sender][_id], 'already upVoted');

        // Don't let investors upVote after downVoting
        require(!downVotes[msg.sender][_id], 'already downVoted');

        // update upVotes
        proposal.upVotes += govToken.balanceOf(msg.sender);

        // Track that user has upVoted
        upVotes[msg.sender][_id] = true;

        // Emit an event
        emit UpVote(_id, msg.sender);
    }

    function downVote(uint256 _id) external onlyInvestor {
        // Fetch proposal frm mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let investors downVote twice
        require(!downVotes[msg.sender][_id], 'already downVoted');

        // Don't let investors downVote after upVoting
        require(!upVotes[msg.sender][_id], 'already upVoted');

        // update downVotes
        proposal.downVotes += govToken.balanceOf(msg.sender);

        // Track that user has downVoted
        downVotes[msg.sender][_id] = true;

        // Emit an event
        emit DownVote(_id, msg.sender);
    }

    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, 'proposal already finalized');

        // Mark proposal as finalized
        proposal.finalized = true;

        // Check that proposal has enough upVotes or downVotes
        require(
            (proposal.upVotes >= quorum || proposal.downVotes >= quorum),
            'must reach quorum to finalize proposal'
        );

        // update approved if upVotes > downVotes
        proposal.approved = proposal.upVotes >= proposal.downVotes;

        // Check that the contract has enough payTokens to transfer
        require(
            payToken.balanceOf(address(this)) >= proposal.amount,
            'not enough payTokens in contract'
        );

        // Transfer the payTokens if proposal is approved
        if (proposal.approved) {
            uint256 beforeBalance = payToken.balanceOf(proposal.recipient);

            // Perform the transfer
            require(
                payToken.transfer(proposal.recipient, proposal.amount),
                'Transfer failed'
            );

            // Verify balance change
            uint256 afterBalance = payToken.balanceOf(proposal.recipient);
            require(
                afterBalance == beforeBalance + proposal.amount,
                'Incorrect token amount transferred'
            );
        }

        // Emite event
        emit Finalize(_id, proposal.upVotes >= quorum);
    }
}
