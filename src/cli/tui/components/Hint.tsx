import React from 'react';
import { Box, Text } from 'ink';

export interface HintProps {
  text?: string;
  /** Whether to show the standard "navigate · select · back" hints */
  showNav?: boolean;
}

export const Hint: React.FC<HintProps> = ({ text, showNav = true }) => {
  const standard = showNav
    ? '↑↓ navigate · enter select · esc back · ctrl-c quit'
    : 'enter continue · ctrl-c quit';
  return (
    <Box marginTop={1}>
      <Text color="gray" dimColor>
        {text ?? standard}
      </Text>
    </Box>
  );
};
