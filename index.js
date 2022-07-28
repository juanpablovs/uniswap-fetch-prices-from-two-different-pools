// IMPORTANT! things you have to do to make it work
// first make sure that you have node installed
// if you don't you can get it here: https://nodejs.org/

// download index.js (this file), gitignore and package.json (make sure they are both together in the same directory)
// now open the terminal and type "npm install", this will install the dependencies (explained below)
// to run the script type "node index.js"
// to stop the file type Control + C in windows or Command + C in Mac

// HERE ARE SOME PARAMETERS YOU CAN CHANGE SO YOU CAN MAKE TESTS
// this are the pool addresses, you need to have two of the same pair of tokens
// you can find more pools here: https://info.uniswap.org/#/pools
// the address is in the url of the pool, for example, this pool https://info.uniswap.org/#/pools/0x99ac8ca7087fa4a2a1fb6357269965a2014abc35 has this address 0x99ac8ca7087fa4a2a1fb6357269965a2014abc35
const poolAddresses = [
  '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
  '0xcbfb0745b8489973bf7b334d54fdbd573df7ef3c',
];

// frequency is how often you want to check, it's in miliseconds so 1 second = 1000, 2 = 2000, etc.
frequency = 1000;

// We need to specify in which chain are we going to be looking for the tokens, ethereum mainnet is number one, other testnets have different numbers, for example ropsten = 3, etc.
const chainId = 1;

// BELOW THIS LINE YOU HAVE AN EXPLANATION OF HOW THE CODE WORKS AND WHAT IT DOES, IF YOU WANT TO GO INTO THIS I SUGGEST YOU START READING AT THE BOTTOM
// --------------------------------

// To run this script we need three dependencies:
// 1. Ethers = a javascript library to interact with the Ethereum blockchain
// 2. Pool = is not really a Uniswap pool, but a container of the information that we want to access (if you are into databases it is similar to an ORM (Object Relational Model))
// 3. Token = to create instances of a token (remeber that there are two tokens per pool)

const { ethers } = require('ethers');
const { Pool } = require('@uniswap/v3-sdk');
const { Token } = require('@uniswap/sdk-core');

// Next we import the ABIs. An ABI is a json file that stores the properties and functions that we can call from a smart contract
// Note that the Uniswap ABI is imported directly
// myABI is our own ABI, since tokens follow standards we know which functions and events there will be in every token contract, so instead of adding one ABI every time that we need to check on a token, we can create our own with the functions that we will need regardless of the token
const {
  abi: IUniswapV3PoolABI,
} = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const myABI = [
  'function decimals() external view returns (uint256)',
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
];

// we use ethers to connect to a node through a provider, in this case we use cloudflare's free web 3 provider (you do not need to register or add any personal information to use this)
const provider = new ethers.providers.JsonRpcProvider(
  'https://cloudflare-eth.com/'
);


async function getPoolImmutables(poolContract) {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
    await Promise.all([
      poolContract.factory(),
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.maxLiquidityPerTick(),
    ]);

  const Immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  };

  return Immutables;
}

async function getPoolState(poolContract) {
  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const PoolState = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

async function getPrice(poolAddress) {
  // we instantiate a contract for this pool
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );

  const [immutables, state] = await Promise.all([
    // we get the data that we ned from this pool in 2 variables, immutables and poolstate
    getPoolImmutables(poolContract),
    getPoolState(poolContract),
  ]);

  // we now create a contract for the first token in this pool
  //data for token0
  const contract_token0 = new ethers.Contract(
    immutables.token0,
    myABI, // we use our ABI because we know it has the functions we need due to standardization of contracts
    provider
  );

  const [decimals_token0, name_token0, symbol_token0] = await Promise.all([
    contract_token0.decimals(),
    contract_token0.name(),
    contract_token0.symbol(),
  ]);

  const data_token0 = {
    // because the original code is in typescript we have to typecast this string to a number
    decimals_token0: Number(decimals_token0.toString()),
    name_token0,
    symbol_token0,
  };

  // we now repeat the same creation of a contract for the second token in this pool
  //data for token1
  const contract_token1 = new ethers.Contract(
    immutables.token1,
    myABI,
    provider
  );

  const [decimals_token1, name_token1, symbol_token1] = await Promise.all([
    contract_token1.decimals(),
    contract_token1.name(),
    contract_token1.symbol(),
  ]);

  const data_token1 = {
    // because the original code is in typescript we have to typecast this string to a number
    decimals_token1: Number(decimals_token1.toString()),
    name_token1,
    symbol_token1,
  };

  //instantiate tokens
  const Token0 = new Token(
    chainId,
    immutables.token0,
    data_token0.decimals_token0,
    data_token0.symbol_token0,
    data_token0.name_token0
  );

  const Token1 = new Token(
    chainId,
    immutables.token1,
    data_token1.decimals_token1,
    data_token1.symbol_token1,
    data_token1.name_token1
  );

  // with both tokens instantiated and the variables of the pool we can create an instance of the pool (the price is one property of the pool)
  //instantiate a pool with the prices at the given state (now)
  const pricePool = new Pool(
    Token0,
    Token1,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick
  );

  // we use the function "toSignificant" to return the price of token0 (the price of token1 is 1 because pricing is for 1 unit of WBTC = 25,000 USDC)
  return pricePool.token0Price.toSignificant(Token0.decimals);
}

// this function uses the functions above to get the prices and return the result
async function start(poolAddresses) {
  // we get the price of each pool by calling the function "getPrice" and passing one pool address
  const price0 = await getPrice(poolAddresses[0]);
  const price1 = await getPrice(poolAddresses[1]);

  const sideBuy = price0 <= price1 ? price0 : price1;
  const sideSell = price0 > price1 ? price0 : price1;

  const diffPricesNum = (sideSell - sideBuy).toFixed(2);
  const diffPricesPerc = ((sideSell / sideBuy - 1) * 100).toFixed(2);

  return `the price is ${diffPricesNum} and it's a ${diffPricesPerc}% of variation`;

}

// we use setInterval to execute the function "start" (with the 2 pools added at the top of this script) every number of seconds
setInterval(async () => {
  console.log(await start(poolAddresses));
}, frequency);
