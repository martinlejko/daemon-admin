/**
 * Log Display component - enhanced log viewer with better UX
 */
import { chakra } from '@chakra-ui/react';
import { useState } from 'react';
import { FiCopy, FiDownload, FiFileText, FiMaximize2 } from 'react-icons/fi';
import Button from '@/components/ui/Button';

interface LogDisplayProps {
  logs: string;
  linesReturned: number;
  timestamp: string;
  isLoading?: boolean;
}

const LogDisplay: React.FC<LogDisplayProps> = ({
  logs,
  linesReturned,
  timestamp,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs);
      // You might want to add a notification here
    } catch (error) {
      console.error('Failed to copy logs:', error);
    }
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-logs-${new Date(timestamp).toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatLogLine = (line: string, index: number) => {
    // Basic log line formatting - can be enhanced further
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    // Detect log level colors
    let color = 'text';
    if (
      trimmedLine.toLowerCase().includes('error') ||
      trimmedLine.toLowerCase().includes('err')
    ) {
      color = 'red.500';
    } else if (trimmedLine.toLowerCase().includes('warn')) {
      color = 'orange.500';
    } else if (trimmedLine.toLowerCase().includes('info')) {
      color = 'blue.500';
    } else if (trimmedLine.toLowerCase().includes('debug')) {
      color = 'gray.500';
    }

    return (
      <chakra.div
        borderLeft={
          color !== 'text'
            ? `2px solid var(--chakra-colors-${color})`
            : undefined
        }
        color={color}
        key={index}
        pl={color !== 'text' ? '3' : '0'}
        py="1"
      >
        {trimmedLine}
      </chakra.div>
    );
  };

  const logLines = logs.split('\n');

  return (
    <chakra.div>
      {/* Header */}
      <chakra.div
        alignItems="center"
        display="flex"
        gap="3"
        justifyContent="space-between"
        mb="3"
      >
        <chakra.div>
          <chakra.p color="text" fontSize="sm" fontWeight="medium">
            {linesReturned} lines returned
          </chakra.p>
          <chakra.p color="text.subtle" fontSize="xs">
            Retrieved at {new Date(timestamp).toLocaleString()}
          </chakra.p>
        </chakra.div>

        <chakra.div display="flex" gap="2">
          <Button
            leftIcon={<FiCopy />}
            onClick={handleCopyLogs}
            size="sm"
            variant="ghost"
          >
            Copy
          </Button>
          <Button
            leftIcon={<FiDownload />}
            onClick={handleDownloadLogs}
            size="sm"
            variant="ghost"
          >
            Download
          </Button>
          <Button
            leftIcon={<FiMaximize2 />}
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            variant="ghost"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </chakra.div>
      </chakra.div>

      {/* Log Content */}
      <chakra.div
        bg="gray.900"
        border="1px solid"
        borderColor="border"
        borderRadius="lg"
        color="gray.100"
        maxH={isExpanded ? 'none' : '500px'}
        overflow="auto"
        p="4"
        position="relative"
      >
        {isLoading ? (
          <chakra.div
            alignItems="center"
            display="flex"
            justifyContent="center"
            minH="200px"
          >
            <chakra.div
              animation="spin 1s linear infinite"
              border="2px solid"
              borderColor="gray.600"
              borderRadius="50%"
              borderTopColor="accent"
              h="6"
              w="6"
            />
          </chakra.div>
        ) : (
          <chakra.div fontFamily="mono" fontSize="sm" lineHeight="relaxed">
            {logLines.length > 0 ? (
              logLines
                .map((line, index) => formatLogLine(line, index))
                .filter(Boolean)
            ) : (
              <chakra.div
                alignItems="center"
                color="gray.500"
                display="flex"
                flexDirection="column"
                gap="2"
                justifyContent="center"
                minH="200px"
              >
                <FiFileText size={32} />
                <chakra.p>No log entries found</chakra.p>
                <chakra.p fontSize="xs">
                  Try adjusting your filters or check if the service is
                  generating logs
                </chakra.p>
              </chakra.div>
            )}
          </chakra.div>
        )}

        {/* Line count indicator */}
        {!isLoading && logLines.length > 0 && (
          <chakra.div
            bg="gray.800"
            borderRadius="md"
            bottom="4"
            color="gray.400"
            fontSize="xs"
            position="absolute"
            px="2"
            py="1"
            right="4"
          >
            {logLines.filter((line) => line.trim()).length} lines
          </chakra.div>
        )}
      </chakra.div>

      {/* Log Statistics */}
      {!isLoading && logLines.length > 0 && (
        <chakra.div
          bg="bg.muted"
          borderRadius="md"
          display="flex"
          gap="6"
          mt="3"
          p="3"
        >
          <chakra.div>
            <chakra.span color="text.subtle" fontSize="xs">
              Total lines:
            </chakra.span>
            <chakra.span color="text" fontSize="sm" fontWeight="medium" ml="1">
              {logLines.filter((line) => line.trim()).length}
            </chakra.span>
          </chakra.div>
          <chakra.div>
            <chakra.span color="text.subtle" fontSize="xs">
              Errors:
            </chakra.span>
            <chakra.span
              color="red.500"
              fontSize="sm"
              fontWeight="medium"
              ml="1"
            >
              {
                logLines.filter(
                  (line) =>
                    line.toLowerCase().includes('error') ||
                    line.toLowerCase().includes('err')
                ).length
              }
            </chakra.span>
          </chakra.div>
          <chakra.div>
            <chakra.span color="text.subtle" fontSize="xs">
              Warnings:
            </chakra.span>
            <chakra.span
              color="orange.500"
              fontSize="sm"
              fontWeight="medium"
              ml="1"
            >
              {
                logLines.filter((line) => line.toLowerCase().includes('warn'))
                  .length
              }
            </chakra.span>
          </chakra.div>
        </chakra.div>
      )}
    </chakra.div>
  );
};

export default LogDisplay;
