// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat')
const config = require('../src/config.json')

const tokens = (n) => {
  return hre.ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

async function main() {
  console.log(`Fetching accounts & network...\n`)

  let transaction
  const accounts = await hre.ethers.getSigners()
  const funder = accounts[0]
  const investor1 = accounts[1]
  const investor2 = accounts[2]
  const investor3 = accounts[3]
  const recipient = accounts[4]
  const investor4 = accounts[5]
  const investor5 = accounts[6]

  // Fetch network
  const { chainId } = await hre.ethers.provider.getNetwork()

  console.log(`Fetching govToken and transferring to accounts...\n`)

  // Fetch deployed govToken
  const govToken = await hre.ethers.getContractAt(
    'Token',
    config[chainId].govToken.address
  )
  console.log(`Token fetched: ${govToken.address}\n`)

  // Send tokens to investors - each one gets 20%
  transaction = await govToken
    .connect(funder)
    .transfer(investor1.address, tokens(200000))
  await transaction.wait()

  transaction = await govToken
    .connect(funder)
    .transfer(investor2.address, tokens(200000))
  await transaction.wait()

  transaction = await govToken
    .connect(funder)
    .transfer(investor3.address, tokens(200000))
  await transaction.wait()

  transaction = await govToken
    .connect(funder)
    .transfer(investor4.address, tokens(200000))
  await transaction.wait()

  transaction = await govToken
    .connect(funder)
    .transfer(investor5.address, tokens(200000))
  await transaction.wait()

  // Fetch deployed payToken
  const payToken = await hre.ethers.getContractAt(
    'Token',
    config[chainId].payToken.address
  )
  console.log(`Token fetched: ${payToken.address}\n`)
  console.log(`Transferring payToken to accounts...\n`)
  // Send tokens to investors - each one gets 10%

  transaction = await payToken
    .connect(funder)
    .transfer(investor1.address, tokens(10000))
  await transaction.wait()

  transaction = await payToken
    .connect(funder)
    .transfer(investor2.address, tokens(10000))
  await transaction.wait()

  transaction = await payToken
    .connect(funder)
    .transfer(investor3.address, tokens(10000))
  await transaction.wait()

  transaction = await payToken
    .connect(funder)
    .transfer(investor4.address, tokens(10000))
  await transaction.wait()

  transaction = await payToken
    .connect(funder)
    .transfer(investor5.address, tokens(10000))
  await transaction.wait()

  console.log(`Fetching DAO...\n`)

  // Fetch depolyed dao
  const dao = await hre.ethers.getContractAt('DAO', config[chainId].dao.address)
  console.log(`DAO fetched: ${dao.address}\n`)

  // Funder send ETH to DAO treasury
  transaction = await funder.sendTransaction({
    to: dao.address,
    value: ether(1000),
  })
  await transaction.wait()
  console.log(`Sent ETH to dao treasury...\n`)

  // Funder send FUSDC to DAO treasury
  transaction = await payToken
    .connect(funder)
    .transfer(dao.address, tokens(100000))
  await transaction.wait()
  console.log(`Sent payTokens to dao treasury...\n`)

  for (var i = 0; i < 3; i++) {
    // Create proposal
    console.log(`Creating Proposal ${i + 1}...\n`)
    transaction = await dao
      .connect(investor1)
      .createProposal(
        `Proposal ${i + 1}`,
        `${i + 1}${
          i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : 'th'
        } Proposal`,
        tokens(100),
        recipient.address
      )
    await transaction.wait()

    // upVote 1
    console.log(`Upvoting Proposal ${i + 1}...\n`)
    transaction = await dao.connect(investor1).upVote(i + 1)
    await transaction.wait()

    // upVote 2
    console.log(`Upvoting Proposal ${i + 1}...\n`)
    transaction = await dao.connect(investor2).upVote(i + 1)
    await transaction.wait()

    // upVote 3
    console.log(`Upvoting Proposal ${i + 1}...\n`)
    transaction = await dao.connect(investor3).upVote(i + 1)
    await transaction.wait()

    // downVote 1
    console.log(`Downvoting Proposal ${i + 1}...\n`)
    transaction = await dao.connect(investor4).downVote(i + 1)
    await transaction.wait()

    // Finalize
    console.log(`Finalizing Proposal ${i + 1}...\n`)
    transaction = await dao.connect(investor1).finalizeProposal(i + 1)
    await transaction.wait()

    console.log(`Create & Finalized Proposal ${i + 1}\n`)
  }

  console.log(`Creating one more proposal...\n`)

  // Create one more proposal
  transaction = await dao
    .connect(investor1)
    .createProposal(
      `Proposal 4`,
      '4th Proposal',
      tokens(100),
      recipient.address
    )
  await transaction.wait()

  // upVote 1
  transaction = await dao.connect(investor3).upVote(4)
  await transaction.wait()

  // upVote 2
  transaction = await dao.connect(investor2).upVote(4)
  await transaction.wait()

  // downVote 1
  transaction = await dao.connect(investor4).downVote(4)
  await transaction.wait()

  // downVote 2
  transaction = await dao.connect(investor5).downVote(4)
  await transaction.wait()

  console.log(`Finished\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
