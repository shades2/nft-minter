import {NftHelper} from './helpers/nft.helper';

async function main() {
  let nftHelper = new NftHelper();
  nftHelper.mintNfts();
}

try {
  main();
} catch(error) {
  console.error(error);
}