import anchor from '@coral-xyz/anchor';
const { AnchorProvider, Program, Wallet, BN } = anchor;
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const PROGRAM_ID = new PublicKey('C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh');
const DECIMALS = 9;
const GENESIS_AIRDROP_AMOUNT = 50_000_000; // 5% of 1B

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
  const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from('treasury')], PROGRAM_ID);

  console.log('Config PDA:', configPda.toBase58());
  console.log('Mint PDA:  ', mintPda.toBase58());
  console.log('Treasury:  ', treasuryPda.toBase58());
  console.log('Authority: ', keypair.publicKey.toBase58());
  console.log('');

  // Step 1: Initialize
  try {
    console.log('Step 1/4: Initializing AIM token mint + config...');
    const tx1 = await program.methods
      .initialize(DECIMALS)
      .accounts({
        config: configPda,
        mint: mintPda,
        authority: keypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      })
      .rpc();
    console.log('  TX:', tx1);
  } catch (e) {
    if (e.message?.includes('already in use')) {
      console.log('  Already initialized, skipping.');
    } else {
      throw e;
    }
  }

  // Step 2: Initialize Treasury
  try {
    console.log('Step 2/4: Creating DAO treasury...');
    const tx2 = await program.methods
      .initializeTreasury()
      .accounts({
        config: configPda,
        mint: mintPda,
        treasury: treasuryPda,
        authority: keypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      })
      .rpc();
    console.log('  TX:', tx2);
  } catch (e) {
    if (e.message?.includes('already in use')) {
      console.log('  Already initialized, skipping.');
    } else {
      throw e;
    }
  }

  // Step 3: Create ATA for authority wallet
  const authorityAta = await getAssociatedTokenAddress(mintPda, keypair.publicKey);
  console.log('Step 3/4: Creating token account for authority...');
  try {
    const ataIx = createAssociatedTokenAccountInstruction(
      keypair.publicKey,
      authorityAta,
      keypair.publicKey,
      mintPda,
    );
    const tx = new Transaction().add(ataIx);
    const tx3 = await provider.sendAndConfirm(tx);
    console.log('  TX:', tx3);
  } catch (e) {
    if (e.message?.includes('already in use') || e.logs?.some(l => l.includes('already in use'))) {
      console.log('  Already exists, skipping.');
    } else {
      throw e;
    }
  }
  console.log('  ATA:', authorityAta.toBase58());

  // Step 4: Mint Genesis Airdrop (5% = 50M AIM)
  const rawAmount = new BN(GENESIS_AIRDROP_AMOUNT).mul(new BN(10 ** DECIMALS));
  console.log(`Step 4/4: Minting ${GENESIS_AIRDROP_AMOUNT.toLocaleString()} AIM (Genesis Airdrop)...`);
  const tx4 = await program.methods
    .mintTokens(rawAmount)
    .accounts({
      config: configPda,
      mint: mintPda,
      destination: authorityAta,
      authority: keypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log('  TX:', tx4);

  // Verify
  console.log('\n=== AIM Token Initialized ===');
  const configAccount = await program.account.tokenConfig.fetch(configPda);
  console.log('Max Supply:     ', configAccount.maxSupply.toString());
  console.log('Total Minted:   ', configAccount.totalMinted.toString());
  console.log('Total Burned:   ', configAccount.totalBurned.toString());
  console.log('Burn Rate:      ', configAccount.burnRateBps, 'bps');
  console.log('Treasury Rate:  ', configAccount.treasuryRateBps, 'bps');
  console.log('Decimals:       ', configAccount.decimals);

  const tokenBalance = await connection.getTokenAccountBalance(authorityAta);
  console.log('Authority Bal:  ', tokenBalance.value.uiAmountString, 'AIM');
}

main().catch(console.error);
