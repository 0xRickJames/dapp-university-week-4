const Info = ({ account, accountBalance }) => {
  return (
    <div className="my-3 text-center">
      <p>
        <strong>Account: </strong> {account}
      </p>
      <p>
        <strong>ETH Balance:</strong> {accountBalance}
      </p>
    </div>
  )
}

export default Info