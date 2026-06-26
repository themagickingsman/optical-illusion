import { PathController } from './PathController';

export function resolveAssetUrl(url: string): string {
  return PathController.resolve(url);
}
