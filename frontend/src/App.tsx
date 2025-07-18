import { Box, Button, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import viteLogo from '/vite.svg';
import reactLogo from './assets/react.svg';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Box p="8" textAlign="center">
      <VStack gap="6">
        <HStack gap="4">
          <a href="https://vite.dev" rel="noopener" target="_blank">
            <img
              alt="Vite logo"
              src={viteLogo}
              style={{ height: '6em', padding: '1.5em' }}
            />
          </a>
          <a href="https://react.dev" rel="noopener" target="_blank">
            <img
              alt="React logo"
              src={reactLogo}
              style={{ height: '6em', padding: '1.5em' }}
            />
          </a>
        </HStack>

        <Heading size="2xl">Vite + React + Chakra UI</Heading>

        <Box borderRadius="lg" borderWidth="1px" p="6">
          <Button
            colorScheme="blue"
            onClick={() => setCount((count) => count + 1)}
            size="lg"
          >
            count is {count}
          </Button>
          <Text mt="4">
            Edit <code>src/App.tsx</code> and save to test HMR
          </Text>
        </Box>

        <HStack gap="4">
          <Button variant="outline">Click me</Button>
          <Button colorScheme="teal">Click me too</Button>
        </HStack>

        <Text color="gray.500">
          Click on the Vite and React logos to learn more
        </Text>
      </VStack>
    </Box>
  );
}

export default App;
