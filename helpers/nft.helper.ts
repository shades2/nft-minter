import { NFTStorage, File } from 'nft.storage';
import { AccountId, Client, NftId, PrivateKey, TokenId, TokenMintTransaction, TokenNftInfo, TokenNftInfoQuery, TransactionReceipt } from '@hashgraph/sdk';
import { StorageHelper } from './storage.helper';
import { fileTypeFromBuffer } from 'file-type';
import nfts from '../nft.json';
import axios from 'axios';
import lodash from 'lodash';

require('dotenv').config();

export class NftHelper {
  // please signup on https://nft.storage/login/
  // and paste your private key here...
  private nftStorageToken: string = <string>process.env.NFT_STORAGE_KEY;
  
  // This shall be development OR production
  private environment = process.env.ENVIRONMENT;
  private operator = {
    accountId: <string>process.env.OPERATOR_ACCOUNT_ID,
    privateKey: <string>process.env.OPERATOR_PRIVATE_KEY
  };
  private nft = {
    token: <string>process.env.NFT_TOKEN_ID,
    supplyKey: <string>process.env.NFT_SUPPLY_KEY
  };

  private nftClient: NFTStorage;
  private client: Client;

  constructor() {
    this.nftClient = new NFTStorage({ token: this.nftStorageToken });

    switch(this.environment) {
      case 'mainnet':
        this.client = Client.forMainnet();
        this.client.setMirrorNetwork("mainnet-public.mirrornode.hedera.com:443");
        break;      
      case 'testnet':
        this.client = Client.forTestnet();
        break;
      case 'custom':
      default:
        const node = {[<string>process.env.CUSTOM_NODE]: new AccountId(Number(process.env.CUSTOM_ACCOUNT_ID))};
        this.client = Client.forNetwork(node).setMirrorNetwork(<string>process.env.CUSTOM_MIRROR);
        break;
    }

    this.client.setOperator(this.operator.accountId, this.operator.privateKey);
  }

  async verifyNfts() {
    return new Promise(async(resolve, reject) => {
      let divergents = [];

      for( let i = 0; i < nfts.length; i++) {
        let nft = nfts[i];

        const nftInfos = await new TokenNftInfoQuery()
        .setNftId(new NftId(TokenId.fromString(this.nft.token), i + 1))
        .execute(this.client);

        let metadata = Buffer.from(<any>nftInfos[0].metadata, 'base64').toString('ascii').replace('ipfs://', '');
        let content = await axios.get(`https://ipfs.io/ipfs/${metadata}`);

        // merging images field, cause they will always diverge...
        content.data.image = nft.image;

        if(!lodash.isEqual(content.data, nft)) {
          const diff = lodash.fromPairs(lodash.differenceWith(
            lodash.toPairs(content.data), 
            lodash.toPairs(nft), 
            lodash.isEqual)
          );

          divergents.push({
            serialNumber: nftInfos[0].nftId.serial.toString(),
            diff: diff
          });
        }
      }

      if(divergents.length) {
        reject(divergents);
      } else {
        resolve(true);
      }
    });
  }

  async mintNfts() {
    return new Promise(async(resolve, reject) => {
      for( let i = 0; i < nfts.length; i++) {
        let nft = nfts[i];

        try {
          let nftToken: any = await this.generateNft(nft);
          console.log(`minted token ${nftToken.serials[0].toString()}`);      
        } catch(error: any) {
          reject(new Error(`error while minting NFT number ${i} - ${nft.name}: ${error.message}`));
          break;
        }
      }

      resolve(true);
    });
  }

  async storeNftMetaData(
    name: string, 
    description: string, 
    creator: string,
    binaryImage: any, 
    imageName: string, 
    imageType: string,
    properties: any
  ): Promise<any> {
    return new Promise(async(resolve,reject) => {
      try {
        const imageFile = new File([ binaryImage ], imageName, { type: imageType })
        const metadata = await this.nftClient.store({
          name: name,
          description: description,
          creator: creator,
          image: imageFile,
          properties: properties          
        });

        resolve(metadata);
      } catch(error) {
        reject(error);
      }
    });
  }

  async generateNft(nft: any) {
    return new Promise(async (resolve, reject) => {
      try {
        // reading the NFT image and loading it into a buffer...
        let image = new StorageHelper(nft.image);
        let bufferImage = await image.readFile();

        // saving the metadata for the proxied nft...
        let metadata = await this.storeNftMetaData(
          nft.name,
          nft.description,
          nft.creator,
          bufferImage,
          `image.jpeg`,
          'image/jpeg',
          nft.properties
        );

        // minting the proxied nft...
        let nftToken = await this.mintNftToken(
          TokenId.fromString(this.nft.token),
          PrivateKey.fromString(this.nft.supplyKey),
          metadata.url
        );

        // finally, resolving the proxied nft token...
        resolve(nftToken);
      } catch (error) {
        reject(error);
      }
    });
  }

  async mintNftToken(
    tokenId: TokenId,
    supplyKey: PrivateKey,
    CID: string
  ): Promise<TransactionReceipt> {
    return new Promise(async(resolve, reject) => {
      try {
        const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(Buffer.from(CID))
        .freezeWith(this.client);

        const signTx = await transaction.sign(supplyKey);
        const txResponse = await signTx.execute(this.client);
        const receipt = await txResponse.getReceipt(this.client);
        resolve(receipt);        
      } catch(error) {
        reject(error);
      }
    });
  }

  async getNftInfo(
    tokenId: TokenId,
    serialNumber: number,
  ): Promise<TokenNftInfo[]> {
    return new Promise(async(resolve, reject) => {
      try {
        let nftId = new NftId(tokenId, serialNumber);
        let nftInfos = await new TokenNftInfoQuery()
        .setNftId(nftId)
        .execute(this.client);

        resolve(nftInfos);        
      } catch(error) {
        reject(error);
      }
    });
  }
   
}