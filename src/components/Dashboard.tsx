'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FUSION_ADDRESSES, MOCK_USDC_ABI, LENDING_POOL_ABI, CREDIT_PASSPORT_ABI } from '../contracts/abi';

export function Dashboard() {
  const { address: userAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [marketActionLoading, setMarketActionLoading] = useState(false);
  const [amount, setAmount] = useState('40');
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: FUSION_ADDRESSES.MOCK_USDC,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: loanData, refetch: refetchLoan } = useReadContract({
    address: FUSION_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI,
    functionName: 'activeLoans',
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: profileData, refetch: refetchProfile } = useReadContract({
    address: FUSION_ADDRESSES.CREDIT_PASSPORT,
    abi: CREDIT_PASSPORT_ABI,
    functionName: 'getProfile',
    args: userAddress ? [userAddress] : undefined,
  });

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
      refetchLoan();
      refetchProfile();
      setPendingTxHash(undefined);
    }
  }, [isConfirmed, refetchBalance, refetchLoan, refetchProfile]);

  const loan = loanData as unknown as any[];
  const isActive = loan ? Boolean(loan[4]) : false;
  const totalDue = loan ? (loan[3] as bigint) : BigInt(0);
  
  const profile = profileData as unknown as any[];
  const isInitialized = profile ? Boolean(profile[5]) : false;

  const usdcBalance = balance ? formatUnits(balance as bigint, 18) : '0.00';
  const realDebt = isActive ? formatUnits(totalDue, 18) : '0.00';

  const handleFaucet = async () => {
    try {
      setMarketActionLoading(true);
      const hash = await writeContractAsync({
        address: FUSION_ADDRESSES.MOCK_USDC,
        abi: MOCK_USDC_ABI,
        functionName: 'faucet',
        gas: BigInt(500000),
      });
      setPendingTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketActionLoading(false);
    }
  };

  const handleInitializePassport = async () => {
    try {
      setMarketActionLoading(true);
      const hash = await writeContractAsync({
        address: FUSION_ADDRESSES.CREDIT_PASSPORT,
        abi: CREDIT_PASSPORT_ABI,
        functionName: 'initializeMyProfile',
        gas: BigInt(500000),
      });
      setPendingTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketActionLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      setMarketActionLoading(true);
      const hash = await writeContractAsync({
        address: FUSION_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [parseUnits(amount, 18)],
        gas: BigInt(500000),
      });
      setPendingTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setMarketActionLoading(true);
      const approvalAmount = isActive ? totalDue : parseUnits('1000', 18);
      
      const hash = await writeContractAsync({
        address: FUSION_ADDRESSES.MOCK_USDC,
        abi: MOCK_USDC_ABI,
        functionName: 'approve',
        args: [FUSION_ADDRESSES.LENDING_POOL, approvalAmount],
      });
      setPendingTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketActionLoading(false);
    }
  };

  const handleRepay = async () => {
    try {
      setMarketActionLoading(true);
      const hash = await writeContractAsync({
        address: FUSION_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        gas: BigInt(500000),
      });
      setPendingTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketActionLoading(false);
    }
  };

  const handleAuthorizePool = async () => {
    try {
      setMarketActionLoading(true);
      const hash = await writeContractAsync({
        address: FUSION_ADDRESSES.CREDIT_PASSPORT,
        abi: CREDIT_PASSPORT_ABI,
        functionName: 'setAuthorizedProtocol',
        args: [FUSION_ADDRESSES.LENDING_POOL, true],
      });
      setPendingTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketActionLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center text-center">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="w-full text-white pb-20">
      <div className="flex justify-between items-start mb-6 border-b border-slate-700/50 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white">PROTOCOL DASHBOARD</h3>
          <p className="text-xs text-blue-400 mt-1">Live Sepolia Data</p>
        </div>
        <div className="flex gap-3">
          <div className="text-right bg-red-950/40 px-4 py-2 rounded-lg border border-red-900/50 h-fit">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Active Debt</p>
            <p className="text-lg font-mono font-bold text-red-400">{Number(realDebt).toFixed(2)} fUSD</p>
          </div>
          <div className="text-right bg-black/40 px-4 py-2 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Wallet Balance</p>
              <p className="text-lg font-mono font-bold text-cyan-400">{Number(usdcBalance).toFixed(2)} fUSD</p>
            </div>
            <button 
              onClick={handleFaucet} 
              disabled={marketActionLoading || !!pendingTxHash}
              className="mt-2 w-full px-2 py-1 text-[10px] uppercase tracking-wider bg-cyan-900/50 text-cyan-400 border border-cyan-700 rounded hover:bg-cyan-800 transition-colors disabled:opacity-50"
            >
              Get Test fUSD
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {pendingTxHash && (
          <div className="bg-blue-900/40 border border-blue-500/50 p-3 rounded-lg text-sm text-blue-300 text-center animate-pulse">
            Waiting for Sepolia to mine transaction... Do not click anything.
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
          <div>
            <p className="text-sm font-bold text-cyan-300">Identity Status</p>
            <p className="text-xs text-gray-400">
              {isInitialized
                ? 'Passport initialized. You are eligible to borrow.'
                : 'Passport not initialized. Click to register your wallet on-chain.'}
            </p>
          </div>
          <button
            onClick={handleInitializePassport}
            disabled={marketActionLoading || isInitialized || !!pendingTxHash}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              isInitialized
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 cursor-default'
                : 'bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50'
            }`}
          >
            {isInitialized ? 'Passport Active' : 'Initialize Passport'}
          </button>
        </div>
        
        <div className="p-5 bg-black/40 border border-slate-700/50 rounded-xl mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="font-bold text-white">Credit Market</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              disabled={isActive} 
              className="w-full sm:w-24 bg-black/60 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400 text-center disabled:opacity-50" 
            />
            <div className="flex flex-1 gap-2">
              <button 
                onClick={handleBorrow} 
                disabled={marketActionLoading || isActive || !isInitialized || !!pendingTxHash} 
                className="flex-1 py-2 px-2 text-sm bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                BORROW
              </button>
              <button 
                onClick={handleApprove} 
                disabled={marketActionLoading || !!pendingTxHash} 
                className="flex-1 py-2 px-2 text-sm bg-blue-600/30 border border-blue-500 text-blue-300 font-bold rounded-lg hover:bg-blue-600/50 transition-colors disabled:opacity-50"
              >
                1. Approve
              </button>
              <button 
                onClick={handleRepay} 
                disabled={marketActionLoading || !isActive || !!pendingTxHash} 
                className="flex-1 py-2 px-2 text-sm bg-transparent border border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                2. Repay
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-red-900/30 text-center">
        <button onClick={handleAuthorizePool} disabled={!!pendingTxHash} className="text-xs bg-red-950/50 text-red-400 border border-red-900 px-4 py-2 rounded">
          Admin: Authorize Pool on Passport
        </button>
      </div>
    </div>
  );
}