import React,{useState,useEffect} from 'react'
import { useAuth0 } from "@auth0/auth0-react";


const Navbar = () => {
  const { user, isAuthenticated,loginWithPopup,logout} = useAuth0();
  const [walletAddress, setWalletAddress] = useState("");
  const handleConnectWallet = () => {
    if(typeof window !== "undefined" && typeof window.ethereum !== "undefined"){
      window.ethereum.request({ method: 'eth_requestAccounts' })
      .then((accounts) => {
        setWalletAddress(accounts[0])
      })
      .catch((error) => {
        console.error(error)
      })
    }
    else{
      alert('Please install MetaMask!')
    }
  }
  useEffect(() => {
    if(typeof window !== "undefined" && typeof window.ethereum !== "undefined"){
      window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => {
        setWalletAddress(accounts[0])
      })
      .catch((error) => {
        console.error(error)
      })
    }
  }, [])
  return (
    <nav className="bg-white shadow">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex">
        <div className="grid">
          <a className="text-4xl p-2 font-semibold text-gray-900 no-underline" href="/">TokenTrackr</a>
        </div>
        <div className="ml-6 grid-cols-2 p-3">
          <a href="/" className="text-gray-900 hover:bg-gray-100 no-underline px-3 py-2 rounded-md text-sm font-medium">Home</a>
          <a href="/compare" className="text-gray-900 hover:bg-gray-100 no-underline px-3 py-2 rounded-md text-sm font-medium">Compare</a>
        </div>
      </div>
      <div className="flex items-center">
        <form className="flex space-x-2" role="search">
          <button
            className="walletconnectbutton bg-green-500 text-white hover:bg-green-600 rounded-md px-4 py-2"
            type='button'
            onClick={handleConnectWallet}
          >
            {typeof walletAddress !== "undefined" ? 'Connected: ' + walletAddress.slice(0,8) + '...' : 'Connect Wallet'}
          </button>
          {isAuthenticated ? (
            <>
            {user.name && <span className="text-gray-900 text-sm font-semibold my-auto">{user.name}</span>}
            <button 
          className="bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-2"
          type='button'
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Logout
          </button>
            </>)
            : (<button
              className="bg-green-500 text-white hover:bg-green-600 rounded-md px-4 py-2"
              type='button'
              onClick={() => loginWithPopup()}
            >
              Login
            </button>)}
            {isAuthenticated && user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                className="w-8 h-8 rounded-full ml-2"
              />
            )}
        </form>
      </div>
    </div>
  </div>
</nav>


  )
}

export default Navbar