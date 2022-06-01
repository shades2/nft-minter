import { NFTStorage, File } from 'nft.storage';
import { Client, NftId, PrivateKey, TokenId, TokenMintTransaction, TokenNftInfo, TokenNftInfoQuery, TransactionReceipt } from '@hashgraph/sdk';
import { StorageHelper } from './storage.helper';
import { fileTypeFromBuffer } from 'file-type';
import nfts from '../nft.json';
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
    
    if (this.environment == 'testnet') {
      this.client = Client.forTestnet();
    } else {
      this.client = Client.forMainnet();
      this.client.setMirrorNetwork("mainnet-public.mirrornode.hedera.com:443");
    }

    this.client.setOperator(this.operator.accountId, this.operator.privateKey);
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
      };
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