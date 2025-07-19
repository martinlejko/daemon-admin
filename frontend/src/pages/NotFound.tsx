/**
 * 404 Not Found page
 */

import { chakra } from '@chakra-ui/react';
import { useEffect } from 'react';
import { FiArrowLeft, FiHome, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/store';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';

const NotFound: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setPageTitle('Page Not Found');
    setBreadcrumbs([{ label: 'Page Not Found' }]);
  }, [setPageTitle, setBreadcrumbs]);

  return (
    <chakra.div p="8" bg="bg.subtle" minH="100vh">
      <chakra.div maxW="md" mx="auto" mt="20">
        <Card>
          <chakra.div textAlign="center" py="12">
            <chakra.div
              bg="negative.subtle"
              borderRadius="full"
              w="20"
              h="20"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb="6"
            >
              <FiAlertCircle size={40} color="var(--chakra-colors-negative)" />
            </chakra.div>
            
            <chakra.h1 
              fontSize="6xl" 
              fontWeight="bold" 
              color="text" 
              mb="2"
              letterSpacing="tight"
            >
              404
            </chakra.h1>
            
            <chakra.h2 fontSize="2xl" fontWeight="semibold" color="text" mb="4">
              Page Not Found
            </chakra.h2>
            
            <chakra.p color="text.subtle" mb="8" fontSize="lg">
              The page you're looking for doesn't exist or has been moved.
            </chakra.p>
            
            <chakra.div display="flex" gap="4" justifyContent="center" flexWrap="wrap">
              <Button 
                as={Link} 
                to="/" 
                leftIcon={<FiHome />}
                size="lg"
              >
                Go Home
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => window.history.back()}
                leftIcon={<FiArrowLeft />}
                size="lg"
              >
                Go Back
              </Button>
            </chakra.div>
            
            <chakra.div mt="12" pt="8" borderTop="1px solid" borderColor="border.subtle">
              <chakra.p color="text.muted" fontSize="sm">
                If you believe this is an error, please contact your system administrator.
              </chakra.p>
            </chakra.div>
          </chakra.div>
        </Card>
      </chakra.div>
    </chakra.div>
  );
};

export default NotFound;