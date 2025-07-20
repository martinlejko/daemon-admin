/**
 * 404 Not Found page
 */

import { chakra } from '@chakra-ui/react';
import { useEffect } from 'react';
import { FiAlertCircle, FiArrowLeft, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useUIStore } from '@/store';

const NotFound: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setPageTitle('Page Not Found');
    setBreadcrumbs([{ label: 'Page Not Found' }]);
  }, [setPageTitle, setBreadcrumbs]);

  return (
    <chakra.div bg="bg.subtle" minH="100vh" p="8">
      <chakra.div maxW="md" mt="20" mx="auto">
        <Card>
          <chakra.div py="12" textAlign="center">
            <chakra.div
              alignItems="center"
              bg="negative.subtle"
              borderRadius="full"
              display="flex"
              h="20"
              justifyContent="center"
              mb="6"
              mx="auto"
              w="20"
            >
              <FiAlertCircle color="var(--chakra-colors-negative)" size={40} />
            </chakra.div>

            <chakra.h1
              color="text"
              fontSize="6xl"
              fontWeight="bold"
              letterSpacing="tight"
              mb="2"
            >
              404
            </chakra.h1>

            <chakra.h2 color="text" fontSize="2xl" fontWeight="semibold" mb="4">
              Page Not Found
            </chakra.h2>

            <chakra.p color="text.subtle" fontSize="lg" mb="8">
              The page you're looking for doesn't exist or has been moved.
            </chakra.p>

            <chakra.div
              display="flex"
              flexWrap="wrap"
              gap="4"
              justifyContent="center"
            >
              <Button as={Link} leftIcon={<FiHome />} size="lg" to="/">
                Go Home
              </Button>

              <Button
                leftIcon={<FiArrowLeft />}
                onClick={() => window.history.back()}
                size="lg"
                variant="secondary"
              >
                Go Back
              </Button>
            </chakra.div>

            <chakra.div
              borderColor="border.subtle"
              borderTop="1px solid"
              mt="12"
              pt="8"
            >
              <chakra.p color="text.muted" fontSize="sm">
                If you believe this is an error, please contact your system
                administrator.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        </Card>
      </chakra.div>
    </chakra.div>
  );
};

export default NotFound;
