import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'FUSION Credit Market',
  projectId: 'a_random_string_is_fine_for_local_dev_123',
  chains: [sepolia],
  ssr: true,
});