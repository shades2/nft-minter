# HSuite - NFT Minter
A simple tool json-based to mint your NFT collection on Hedera.

## Installation
If you use npm, you shall run:
```bash
$ npm install
```
instead, if you use yarn:
```bash
$ yarn
```

## Configuration
1 - Rename the file `env_example` into `.env`,and change the content accordingly.

```bash
ENVIRONMENT=testnet OR mainnet
NFT_STORAGE_KEY=your_nftstoragekey_here
OPERATOR_ACCOUNT_ID=your_operator_here
OPERATOR_PRIVATE_KEY=your_private_key_here
NFT_TOKEN_ID=your_nftokenid_here
NFT_SUPPLY_KEY=your_nftsupplykey_here
```

2 - modify the `nft.json` file, by filling the array with your NFT collection.
The format should be like this example:

```json
[
  {
    "name": "First NFT",
    "description": "the very first one",
    "creator": "HSuite",
    "image": "./images/logo_1.jpeg",
    // inside the properties field, you can add as much details as you want...
    "properties": {
      "power": 10,
      "skill": "killer"
    }
  },
  {
    "name": "Second NFT",
    "description": "the very second one",
    "creator": "HSuite",
    "image": "./images/logo_2.jpeg",
    // inside the properties field, you can add as much details as you want...
    "properties": {
      "power": 5,
      "skill": "hunter"
    }
  }
]
```

3 - Add your images into `images` folder, keep in mind the image's names must match the ones defined into the `nft.json` file.

## Minting
To mint your collection, be sure your operator has got enough HBAR to mint them all, then simply run:
```bash
$ [npm | yarn] run mint
```
After minting, you can also double check that every single NFT matches the content of the json file, by running:
```bash
$ [npm | yarn] run verify
```
This command will output the differences, if any, for a given NFT serial number.

Once minted, you can check your collection out using [Zion NFT Explorer](zionft.com)

### Enjoy your minting!