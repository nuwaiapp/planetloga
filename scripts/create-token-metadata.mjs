import anchor from '@coral-xyz/anchor';
const { AnchorProvider, Program, Wallet } = anchor;
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const PROGRAM_ID = new PublicKey('C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh');
const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const TOKEN_NAME = 'AI Money';
const TOKEN_SYMBOL = 'AIM';
const METADATA_URI = 'https://planetloga.vercel.app/aim-metadata.json';

const idl = JSON.parse(readFileSync('./contracts/target/idl/aim_token.json', 'utf8'));

function loadKeypair() {
  const raw = execSync('wsl bash -c "cat /home/dmrad/.config/solana/id.json"').toString().trim();
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const keypair = loadKeypair();
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(idl, provider);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  const [mintPda] = PublicKey.findProgramAddressSync([Buffer.from('aim-mint')], PROGRAM_ID);

  // Metaplex metadata PDA: seeds = ["metadata", metaplex_program_id, mint]
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METAPLEX_PROGRAM_ID.toBuffer(), mintPda.toBuffer()],
    METAPLEX_PROGRAM_ID,
  );

  console.log('Authority:   ', keypair.publicKey.toBase58());
  console.log('Config PDA:  ', configPda.toBase58());
  console.log('Mint PDA:    ', mintPda.toBase58());
  console.log('Metadata PDA:', metadataPda.toBase58());
  console.log('');
  console.log(`Name:   ${TOKEN_NAME}`);
  console.log(`Symbol: ${TOKEN_SYMBOL}`);
  console.log(`URI:    ${METADATA_URI}`);
  console.log('');

  console.log('Creating on-chain metadata...');
  const tx = await program.methods
    .createMetadata(TOKEN_NAME, TOKEN_SYMBOL, METADATA_URI)
    .accounts({
      config: configPda,
      mint: mintPda,
      metadata: metadataPda,
      authority: keypair.publicKey,
      systemProgram: PublicKey.default,
      metadataProgram: METAPLEX_PROGRAM_ID,
    })
    .rpc();

  console.log('TX:', tx);
  console.log('\nDone! Token metadata registered on-chain.');
  console.log(`Explorer: https://explorer.solana.com/address/${mintPda.toBase58()}?cluster=devnet`);
}

main().catch(console.error);
