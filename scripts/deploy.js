// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat')

async function main() {
  const GOV_NAME = 'Dapp University'
  const GOV_SYMBOL = 'DAPP'
  const GOV_MAX_SUPPLY = '1000000'

  const PAY_NAME = 'Fake USDC'
  const PAY_SYMBOL = 'FUSDC'
  const PAY_MAX_SUPPLY = '1000000'

  // Deploy Gov Token
  const GovToken = await hre.ethers.getContractFactory('Token')
  let govToken = await GovToken.deploy(GOV_NAME, GOV_SYMBOL, GOV_MAX_SUPPLY)

  await govToken.deployed()
  console.log(`${GOV_SYMBOL} Token deployed to: ${govToken.address}\n`)

  // Deploy Pay Token
  const PayToken = await hre.ethers.getContractFactory('Token')
  let payToken = await PayToken.deploy(PAY_NAME, PAY_SYMBOL, PAY_MAX_SUPPLY)

  await payToken.deployed()
  console.log(`${PAY_SYMBOL} Token deployed to: ${payToken.address}\n`)

  // Deploy DAO
  const DAO = await hre.ethers.getContractFactory('DAO')
  const dao = await DAO.deploy(
    govToken.address,
    '500000000000000000000001',
    payToken.address
  )
  await dao.deployed()

  console.log(`DAO deployed to: ${dao.address}\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
