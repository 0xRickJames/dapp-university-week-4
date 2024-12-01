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

  // Fetch network
  const { chainId } = await hre.ethers.provider.getNetwork()

  console.log(`Fetching token and transferring to accounts...\n`)

  // Fetch deployed token
  const token = await hre.ethers.getContractAt(
    'Token',
    config[chainId].token.address
  )
  console.log(`Token fetched: ${token.address}\n`)

  // Send tokens to investors - each one gets 20%
  transaction = await token
    .connect(funder)
    .transfer(investor1.address, tokens(200000))
  await transaction.wait()

  transaction = await token
    .connect(funder)
    .transfer(investor2.address, tokens(200000))
  await transaction.wait()

  transaction = await token
    .connect(funder)
    .transfer(investor3.address, tokens(200000))
  await transaction.wait()

  console.log(`Fetching DAO...\n`)

  // Fetch depolyed dao
  const dao = await hre.ethers.getContractAt('DAO', config[chainId].dao.address)
  console.log(`DAO fetched: ${dao.address}\n`)

  // Funder send Ether to DAO treasury
  transaction = await funder.sendTransaction({
    to: dao.address,
    value: tokens(1000),
  })
  await transaction.wait()
  console.log(`Sent funds to dao treasury...\n`)

  for (var i = 0; i < 3; i++) {
    // Create proposal
    transaction = await dao
      .connect(investor1)
      .createProposal(`Proposal ${i + 1}`, tokens(100), recipient.address)
    await transaction.wait()

    // Vote 1
    transaction = await dao.connect(investor1).vote(i + 1)
    await transaction.wait()

    // Vote 2
    transaction = await dao.connect(investor2).vote(i + 1)
    await transaction.wait()

    // Vote 3
    transaction = await dao.connect(investor3).vote(i + 1)
    await transaction.wait()

    // Finalize
    transaction = await dao.connect(investor1).finalizeProposal(i + 1)
    await transaction.wait()

    console.log(`Create & Finalized Proposal ${i + 1}\n`)
  }

  console.log(`Creating one more proposal...\n`)

  // Create one more proposal
  transaction = await dao
    .connect(investor1)
    .createProposal(`Proposal 4`, tokens(100), recipient.address)
  await transaction.wait()

  // Vote 1
  transaction = await dao.connect(investor3).vote(4)
  await transaction.wait()

  // Vote 2
  transaction = await dao.connect(investor2).vote(4)
  await transaction.wait()

  console.log(`Finished\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
