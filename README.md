# uniswap-fetch-prices-from-two-different-pools
A beginner's friendly script to fetch prices from two tokens on two different pools

Uniswap's documentation is very poorly explained and is not beginner's friendly, that is why I thought that this might help people

Also, Uniswap's documentation is in Typescript, here you have the plain Javascript version

If you want to create an Arbitrage Trading Bot, this is the first step

Arbitrage means buying and selling at the same time in two markets (in this case two Uniswap pools)

An opportunity to execute a trade emerges when the price of a token (the same token) is substantially different between pools

This is an example:
We have the following two pools on Uniswap for the pair WBTC / USDC (this is Wrapped Bitcoin vs. US dollar stablecoin)

You can check them both here:
https://info.uniswap.org/#/pools/0x99ac8ca7087fa4a2a1fb6357269965a2014abc35
https://info.uniswap.org/#/pools/0xcbfb0745b8489973bf7b334d54fdbd573df7ef3c

WBTC / USDC means that 1 WBTC has a price of, for example: 25,000 USDC

Because the same two tokens operate in two different and independent pools their prices are not identical

So if, for example, in one pool the price is 25,000 and in the other 25,250 you have an opportunity to do arbitrage, buy in the cheaper one and sell in the expensive one at the same time, that is what arbitrage does


By the way, for this first step you do not need any private information. This script is only about querying two pools that operate the same tokens and comparing their prices to find trading opportunities -- that's all

The javascript file is heavily commented so you understand all that is going on

I hope you find this useful!
