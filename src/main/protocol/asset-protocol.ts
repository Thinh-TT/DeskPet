import { protocol } from 'electron';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export function registerAssetScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'pet-asset',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        bypassCSP: true
      }
    }
  ]);
}

export function setupAssetProtocol(charactersDir: string): void {
  protocol.handle('pet-asset', async (request) => {
    try {
      // Expected format: pet-asset://<packId>/<relPath>
      const url = new URL(request.url);
      const packId = url.host;
      const relativePath = decodeURIComponent(url.pathname.replace(/^\//, ''));
      const fullPath = resolve(join(charactersDir, packId, relativePath));

      const normalizedFull = fullPath.toLowerCase();
      const normalizedBase = resolve(charactersDir).toLowerCase();

      // Ensure within characters directory for security
      if (!normalizedFull.startsWith(normalizedBase)) {
        console.error(`[AssetProtocol] Access Denied: ${fullPath} not in ${charactersDir}`);
        return new Response('Access Denied', {
          status: 403,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      const buffer = await fs.readFile(fullPath);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    } catch (err) {
      console.error(`[AssetProtocol] Error fetching asset for ${request.url}:`, err);
      return new Response('Not Found', {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  });
}
