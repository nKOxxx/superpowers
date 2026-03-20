import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import * as pixelmatch from 'pixelmatch';
import { ComparisonResult } from './types';

export class VisualComparer {
  async compare(baselinePath: string, currentPath: string): Promise<ComparisonResult> {
    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline image not found: ${baselinePath}`);
    }

    if (!fs.existsSync(currentPath)) {
      throw new Error(`Current image not found: ${currentPath}`);
    }

    // Read images
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentPath));

    // Check dimensions
    if (baseline.width !== current.width || baseline.height !== current.height) {
      return {
        matches: false,
        diffPercentage: 100,
        diffPath: undefined
      };
    }

    // Create diff image
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    // Compare
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
        includeAA: false
      }
    );

    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;
    const matches = diffPixels === 0;

    // Save diff image if there are differences
    let diffPath: string | undefined;
    if (!matches) {
      const diffDir = path.dirname(currentPath);
      const diffName = `diff-${path.basename(currentPath)}`;
      diffPath = path.join(diffDir, diffName);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }

    return {
      matches,
      diffPercentage,
      diffPath
    };
  }

  async updateBaseline(currentPath: string, baselinePath: string): Promise<void> {
    fs.copyFileSync(currentPath, baselinePath);
  }
}
