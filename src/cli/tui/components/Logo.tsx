import React from 'react';
import { Box, Text } from 'ink';

const LOGO_LINES = [
  '   ____            _            _     _____                    ',
  '  / ___|___  _ __ | |_ _____  _| |_  |  ___|__  _ __ __ _  ___ ',
  " | |   / _ \\| '_ \\| __/ _ \\ \\/ / __| | |_ / _ \\| '__/ _` |/ _ \\",
  ' | |__| (_) | | | | ||  __/>  <| |_  |  _| (_) | | | (_| |  __/',
  '  \\____\\___/|_| |_|\\__\\___/_/\\_\\\\__| |_|  \\___/|_|  \\__, |\\___|',
  '                                                    |___/      ',
];

export interface LogoProps {
  tagline?: string;
}

export const Logo: React.FC<LogoProps> = ({ tagline }) => {
  return (
    <Box flexDirection="column" alignItems="flex-start">
      {LOGO_LINES.map((line, idx) => (
        <Text key={idx} color="cyan">
          {line}
        </Text>
      ))}
      {tagline ? (
        <Box marginTop={1}>
          <Text color="gray">{tagline}</Text>
        </Box>
      ) : null}
    </Box>
  );
};
