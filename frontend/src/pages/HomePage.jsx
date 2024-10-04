import React from 'react'
import Navbar from '../components/Navbar'
import TokenPriceList from '../components/TokenPriceList'
import WalletDetails from '../components/WalletDetails'
const HomePage = () => {
  return (
    <>
      <Navbar />
      <WalletDetails />
      <TokenPriceList />
    </>
  )
}

export default HomePage