const ethers = require('ethers');
const fs = require('fs')

/**
 * Represent an Alluo farm
 * @constructor
 * @param {string} asset - Which asset farm details to fetch
 * @param {string} chain - Which chain for the above asset
 * @throws 'Unsupported chain' if the a chain passed is not one of 'ethereum' or 'polygon'
 * @throws 'Unsupported asset' if the asset passed is not one of 'ETH', 'BTC' 'EUR' or 'USD'
 */
class alluoFarm {
    constructor(asset, chain){
        if(chain=='ethereum'){
            this.provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth')
            this.liquidityHandlerAddress = '0xc92b9C37a1BF006B8e854b2fa03FF957B2681502';
        } else if (chain=='polygon'){
            this.provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com')
            this.liquidityHandlerAddress = '0x31a3439Ac7E6Ea7e0C0E4b846F45700c6354f8c1';
        } else {
            throw 'Unsuported chain'
        }

        let supportedAssets = ['USD', 'ETH', 'EUR', 'BTC']
        if (!supportedAssets.includes(asset)){
            throw 'Unsupported asset'
        }

        this.asset = asset;
        this.chain = chain;
        this.provider, this.liquidityHandlerAddress;

        const abiLHRaw = fs.readFileSync('./abi_liquidityHandler.json')
        this.abiLH = JSON.parse(abiLHRaw)

        const abiIbRaw = fs.readFileSync('./abi_IbAlluo.json')
        this.abiIb = JSON.parse(abiIbRaw)

        const abiERC20Raw = fs.readFileSync('./abi_erc20.json')
        this.abiERC20 = JSON.parse(abiERC20Raw)
    }

    async getIbAlluoAddress(){
        let IbAlluoAddress = '0x0'

        const liquidityHandler = new ethers.Contract(this.liquidityHandlerAddress, this.abiLH, this.provider)

        let allAddresses= await liquidityHandler.getListOfIbAlluos();

        for (const element of allAddresses){
            const ibAlluo =  new ethers.Contract(element, this.abiIb, this.provider)
            const ibAlluoName = await ibAlluo.symbol()

            if(ibAlluoName.substring(7)==this.asset.substring(0,3)){
                IbAlluoAddress = element
            }
        }

        return IbAlluoAddress;
    }

    async getSupportedTokensName(IbAlluoAddress){
        const contractIb = new ethers.Contract(IbAlluoAddress, this.abiIb, this.provider)
        const supportedAddresses = await contractIb.getListSupportedTokens()
        let supportedTokensName = []
        for (const address of supportedAddresses){
            let constractERC20 = new ethers.Contract(address, this.abiERC20, this.provider)
            supportedTokensName.push(await constractERC20.symbol())
        }

        return supportedTokensName.toString()
    }

    async getIbAlluoData() {
        const IbAlluoAddress = await this.getIbAlluoAddress()
        const contract = new ethers.Contract(IbAlluoAddress, this.abiIb, this.provider)
        
        let poolName = await contract.name();
        let tokens = await this.getSupportedTokensName(IbAlluoAddress)
        let scAddress = IbAlluoAddress

        let apyBigNum = await contract.annualInterest();
        let baseApy = BigInt(apyBigNum).toString();
        let rewardAPY = BigInt(apyBigNum).toString();
        
        let rewardTokens = await this.getSupportedTokensName(IbAlluoAddress)

        let tvlBigNum = await contract.totalAssetSupply();
        let tvl = BigInt(tvlBigNum).toString();
        
        let chain = this.chain

        return {poolName, tokens, scAddress, baseApy, rewardAPY, rewardTokens, tvl, chain}
    }
}

async function main(){
    
    //Example of a non supported chain
    // let iBAlluoUSD_bsc = new alluoFarm('ETH', 'bsc')
    // let detailsUSD_bsc = await iBAlluoUSD_bsc.getIbAlluoData()
    // console.log("USD: %s", detailsUSD_bsc)

    //Example of a non supported asset
    // let iBAlluoUSD_bsc = new alluoFarm('BNB', 'ethereum')
    // let detailsUSD_bsc = await iBAlluoUSD_bsc.getIbAlluoData()
    // console.log("USD: %s", detailsUSD_bsc)

    //Class accepts the following pair of inputs 
    let iBAlluoUSD_poly = new alluoFarm('USD', 'polygon')
    let detailsUSD_poly = await iBAlluoUSD_poly.getIbAlluoData()
    console.log("USD Polygon: %s", detailsUSD_poly)

    let iBAlluoUSD_eth = new alluoFarm('USD', 'ethereum')
    let detailsUSD_eth = await iBAlluoUSD_eth.getIbAlluoData()
    console.log("USD Ethereum: %s", detailsUSD_eth)
    
    let iBAlluoEUR_poly = new alluoFarm('EUR', 'polygon')
    let detailsEUR_poly = await iBAlluoEUR_poly.getIbAlluoData()
    console.log("EUR Polygon: %s", detailsEUR_poly)

    let iBAlluoEUR_eth = new alluoFarm('EUR', 'ethereum')
    let detailsEUR_eth = await iBAlluoEUR_eth.getIbAlluoData()
    console.log("EUR Ethereum: %s", detailsEUR_eth)
    
    let iBAlluoBTC_poly = new alluoFarm('BTC', 'polygon')
    let detailsBTC_poly = await iBAlluoBTC_poly.getIbAlluoData()
    console.log("BTC Polygon: %s", detailsBTC_poly)

    let iBAlluoBTC_eth = new alluoFarm('BTC', 'ethereum')
    let detailsBTC_eth = await iBAlluoBTC_eth.getIbAlluoData()
    console.log("BTC Ethereum: %s", detailsBTC_eth)

    let iBAlluoETH_poly = new alluoFarm('ETH', 'polygon')
    let detailsETH_poly = await iBAlluoETH_poly.getIbAlluoData()
    console.log("ETH Polygon: %s", detailsETH_poly)

    let iBAlluoETH_eth = new alluoFarm('ETH', 'ethereum')
    let detailsETH_eth = await iBAlluoETH_eth.getIbAlluoData()
    console.log("ETH Ethereum: %s", detailsETH_eth)
}

main()