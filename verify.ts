import {NftHelper} from './helpers/nft.helper';

async function main() {
  let nftHelper = new NftHelper();
  return await nftHelper.verifyNfts();
}

main().then(() => {
  console.log("NFT Collection has been verified successfully!");
}).catch(divergents => {
  console.error(`There are ${divergents.length} NFTs which doesn't match the json file.`);
  console.error(divergents);
});