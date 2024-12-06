import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

const shortenAddress = (value) => {
  const str = String(value) // Ensure the value is a string
  if (str.length <= 8) return str // If the string is short, no need to truncate
  return `${str.slice(0, 4)}...${str.slice(-4)}`
}

const Proposals = ({
  provider,
  dao,
  proposals,
  quorum,
  setIsLoading,
  account,
  payToken,
}) => {
  const [balances, setBalances] = useState({}) // State to hold recipient balances
  const [userVotes, setUserVotes] = useState({}) // To store user's vote status per proposal

  useEffect(() => {
    const fetchUserVotes = async () => {
      const votes = {}
      for (const proposal of proposals) {
        try {
          const hasUpVoted = await dao.getUpVote(account, proposal.id)
          const hasDownVoted = await dao.getDownVote(account, proposal.id)
          votes[proposal.id] = { upVoted: hasUpVoted, downVoted: hasDownVoted }
        } catch (error) {
          console.error(
            `Error fetching votes for proposal ${proposal.id}:`,
            error
          )
          votes[proposal.id] = { upVoted: false, downVoted: false }
        }
      }
      setUserVotes(votes)
    }

    if (proposals && account && dao) {
      fetchUserVotes()
    }
  }, [proposals, account, dao])

  useEffect(() => {
    // Fetch balances for each recipient
    const fetchBalances = async () => {
      const newBalances = {}
      for (const proposal of proposals) {
        const balance = await payToken.balanceOf(proposal.recipient)
        newBalances[proposal.recipient] = ethers.utils.formatEther(balance) // Format balance in Ether
      }
      setBalances(newBalances)
    }
    fetchBalances()
  }, [proposals, provider])

  const upVoteHandler = async (id) => {
    try {
      const signer = provider.getSigner()
      const transaction = await dao.connect(signer).upVote(id)
      await transaction.wait()
    } catch (error) {
      // Search through error message to see if it contains a revert reason

      // If it does, display the revert reason
      if (error.message.includes('reverted with reason string')) {
        // Get the first thing after reverted with reason string in between single quotes

        const reason = error.message.match(
          /reverted with reason string '(.*?)'/
        )[1]
        window.alert(`Transaction rejected with reason '${reason}'`)
      } else {
        window.alert('User rejected or transaction reverted')
      }
    }

    setIsLoading(true)
  }

  const downVoteHandler = async (id) => {
    try {
      const signer = provider.getSigner()
      const transaction = await dao.connect(signer).downVote(id)
      await transaction.wait()
    } catch (error) {
      // Search through error message to see if it contains a revert reason

      // If it does, display the revert reason
      if (error.message.includes('reverted with reason string')) {
        // Get the first thing after reverted with reason string in between single quotes

        const reason = error.message.match(
          /reverted with reason string '(.*?)'/
        )[1]
        window.alert(`Transaction rejected with reason '${reason}'`)
      } else {
        window.alert('User rejected or transaction reverted')
      }
    }

    setIsLoading(true)
  }

  const finalizeHandler = async (id) => {
    console.log('Finalizing proposal:', id.toString())
    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).finalizeProposal(id)
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Description</th>
          <th>Recipient/Balance</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Quorum {(quorum / 1e24) * 100}%</th>
          <th>Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
          <tr key={index}>
            <td>{proposal.id.toString()}</td>
            <td>{proposal.name}</td>
            <td>{proposal.description}</td>
            {/* display the recipients address shortened and their balance  */}
            <td>
              {shortenAddress(proposal.recipient)}
              <br />
              {balances[proposal.recipient]
                ? `${Number(balances[proposal.recipient]).toFixed(4)} FUSDC`
                : 'Loading...'}
            </td>
            <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} FUSDC</td>
            <td>
              {proposal.finalized && proposal.approved
                ? 'Approved'
                : proposal.finalized && !proposal.approved
                ? 'Rejected'
                : 'In Progress'}
            </td>
            <td>
              <div
                style={{
                  width: '100%',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  padding: '2px',
                  background: '#f5f5f5',
                }}
              >
                {/* UpVotes Bar */}
                Yes {(proposal.upVotes / 1e24) * 100}%
                <div
                  style={{
                    width: `${(proposal.upVotes / 1e24) * 100}%`,
                    height: '10px',
                    backgroundColor: 'green',
                  }}
                />
                No {(proposal.downVotes / 1e24) * 100}%{/* DownVotes Bar */}
                <div
                  style={{
                    width: `${(proposal.downVotes / 1e24) * 100}%`,
                    height: '10px',
                    backgroundColor: 'red',
                  }}
                />
              </div>
            </td>
            <td>
              {!proposal.finalized && userVotes[proposal.id] ? (
                userVotes[proposal.id].upVoted ? (
                  <span>Voted Yes</span>
                ) : userVotes[proposal.id].downVoted ? (
                  <span>Voted No</span>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      style={{ width: '100%' }}
                      onClick={() => upVoteHandler(proposal.id)}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="primary"
                      style={{ width: '100%', marginTop: '3px' }}
                      onClick={() => downVoteHandler(proposal.id)}
                    >
                      No
                    </Button>
                  </>
                )
              ) : null}
            </td>

            <td>
              {!proposal.finalized &&
                (ethers.BigNumber.from(proposal.upVotes).gt(
                  ethers.BigNumber.from(quorum)
                ) ||
                  ethers.BigNumber.from(proposal.downVotes).gt(
                    ethers.BigNumber.from(quorum)
                  )) && (
                  <Button
                    variant="primary"
                    style={{ width: '100%' }}
                    onClick={() => finalizeHandler(proposal.id)}
                  >
                    Finalize
                  </Button>
                )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default Proposals
