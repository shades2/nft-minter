import {NftHelper} from './helpers/nft.helper';

async function main() {
  let nftHelper = new NftHelper();
  await nftHelper.mintNfts();
}

main().then(() => {
  console.log("NFT Collection has been minted successfully!");
}).catch(error => {
  console.error(error.message);
});