const PORT = Number(process.env['PORT'] ?? 3001);

async function main() {
  // Fastify setup will go here
  console.log(`PlanetLoga API starting on port ${PORT}...`);
}

main().catch(console.error);
