import { useMemo, useState, useEffect } from 'react';
import {
  Box, Container, Stack, SimpleGrid, Alert, Select, createListCollection,
  Skeleton, Badge, Button, useDisclosure, Dialog, Portal, CloseButton,
  VStack, Text, Input, Field, Spinner,
} from '@chakra-ui/react';
import PageHeader from '@components/PageHeader';
import KPICard from '@components/KPICard';
import ChartCard from '@components/ChartCard';
import { Pie, Bar } from '@charts';
import TableComponent from '@components/Table';
import { Building2, TrendingUp, Home, AlertCircle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { useMultiBoardData } from './hooks/useMultiBoardData';
import { useAutoRefresh, useVisibilityRefresh } from './hooks/useAutoRefresh';
import { useBoardConfigs } from './hooks/useBoardConfigs';
import { useAdminAuth } from './hooks/useAdminAuth';
import { BUCKET_COLORS } from './utils/boardConfigs';
import Logo from './components/Logo';
import AdminPanel from './components/AdminPanel';

// Dashboard is publicly accessible — no login required for viewers.
// All Monday.com API calls are proxied through a secure Netlify function.
const App = () => {
  return <Dashboard />;
};

const Dashboard = () => {
  const { boardConfigs, loading: configsLoading, addBoard, updateBoard, removeBoard, saveBoardConfigs } = useBoardConfigs();
  const { items, loading, isRefreshing, error, loadedCount, totalCount, refetch } = useMultiBoardData(boardConfigs);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const { open: adminOpen, onOpen: onAdminOpen, onClose: onAdminClose } = useDisclosure();
  const { open: passwordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();

  const { isAuthenticated, setIsAuthenticated, verifyPassword, hasPassword, setPassword, loading: authLoading } = useAdminAuth();
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useAutoRefresh(refetch, 300000);
  useVisibilityRefresh(refetch);

  useEffect(() => { document.title = 'Lightwave ISP Dashboards'; }, []);

  const handleManageClick = () => {
    if (authLoading) return;
    if (!hasPassword) { setIsSettingPassword(true); onPasswordOpen(); return; }
    if (isAuthenticated) { onAdminOpen(); return; }
    setIsSettingPassword(false);
    setPasswordInput('');
    setPasswordError('');
    onPasswordOpen();
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    setIsVerifying(true);
    try {
      if (isSettingPassword) {
        const result = await setPassword(passwordInput);
        if (result.success) { setIsAuthenticated(true); onPasswordClose(); onAdminOpen(); }
        else setPasswordError(result.error || 'Failed to set password');
      } else {
        const isValid = await verifyPassword(passwordInput);
        if (isValid) { setIsAuthenticated(true); onPasswordClose(); onAdminOpen(); }
        else setPasswordError('Incorrect password');
      }
    } catch { setPasswordError('Authentication failed'); }
    finally { setIsVerifying(false); }
  };

  const handlePasswordClose = () => {
    setPasswordInput('');
    setPasswordError('');
    setIsSettingPassword(false);
    onPasswordClose();
  };

  const isPortfolioView = selectedProperty === 'all';

  const currentItems = useMemo(() => {
    if (isPortfolioView) return items;
    return items.filter((item) => item.property === selectedProperty);
  }, [items, selectedProperty, isPortfolioView]);

  const propertyOptions = useMemo(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.property] = (acc[item.property] || 0) + 1;
      return acc;
    }, {});
    return createListCollection({
      items: [
        { label: 'All Properties', value: 'all' },
        ...boardConfigs.map((config) => ({
          label: `${config.name} (${counts[config.name] || 0})`,
          value: config.name,
        })),
      ],
    });
  }, [items, boardConfigs]);

  const kpiMetrics = useMemo(() => {
    const totalUnits = currentItems.length;
    const activeCount = currentItems.filter((i) => i.statusBucket === 'Active').length;
    const nonActiveCount = currentItems.filter((i) => i.statusBucket === 'Non-Active').length;
    const activationRate = totalUnits > 0 ? ((activeCount / totalUnits) * 100).toFixed(1) : '0.0';
    return { totalProperties: isPortfolioView ? boardConfigs.length : 1, totalUnits, activeCount, nonActiveCount, activationRate };
  }, [currentItems, isPortfolioView, boardConfigs.length]);

  const bucketDistribution = useMemo(() => [
    { id: 'Active', label: 'Active', value: currentItems.filter((i) => i.statusBucket === 'Active').length },
    { id: 'Non-Active', label: 'Non-Active', value: currentItems.filter((i) => i.statusBucket === 'Non-Active').length },
  ], [currentItems]);

  const propertyComparison = useMemo(() => {
    if (!isPortfolioView) return [];
    const counts = items.reduce((acc, item) => {
      if (!acc[item.property]) acc[item.property] = { property: item.property, Active: 0, 'Non-Active': 0 };
      acc[item.property][item.statusBucket]++;
      return acc;
    }, {});
    return Object.values(counts).sort((a, b) => a.property.localeCompare(b.property));
  }, [items, isPortfolioView]);

  const propertySummary = useMemo(() => {
    if (!isPortfolioView) return [];
    return boardConfigs.map((config) => {
      const propertyItems = items.filter((item) => item.property === config.name);
      const totalUnits = propertyItems.length;
      const activeCount = propertyItems.filter((i) => i.statusBucket === 'Active').length;
      const nonActiveCount = propertyItems.filter((i) => i.statusBucket === 'Non-Active').length;
      const activationRate = totalUnits > 0 ? ((activeCount / totalUnits) * 100).toFixed(1) : '0.0';
      return { property: config.name, totalUnits, activeCount, nonActiveCount, activationRate: `${activationRate}%` };
    }).sort((a, b) => a.property.localeCompare(b.property));
  }, [items, isPortfolioView, boardConfigs]);

  const summaryTableStructure = [
    { key: 'property', label: 'Property', type: 'text', minWidth: '220px' },
    { key: 'totalUnits', label: 'Total Units', type: 'text', minWidth: '120px' },
    { key: 'activeCount', label: 'Active', type: 'text', minWidth: '100px' },
    { key: 'nonActiveCount', label: 'Non-Active', type: 'text', minWidth: '120px' },
    { key: 'activationRate', label: 'Activation Rate', type: 'text', minWidth: '140px' },
  ];

  const detailTableStructure = [
    { key: 'name', label: 'Unit / Name', type: 'text', minWidth: '200px' },
    { key: 'tenantName', label: 'Tenant Name', type: 'text', minWidth: '180px' },
    { key: 'property', label: 'Property', type: 'text', minWidth: '180px' },
    { key: 'statusBucket', label: 'Status Bucket', type: 'text', minWidth: '130px' },
    {
      key: 'signUpDate', label: 'Sign-up Date', type: 'date', minWidth: '140px',
      render: (item) => {
        if (!item.signUpDate) return item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
        if (item.signUpDate instanceof Date) return item.signUpDate.toLocaleDateString();
        return item.signUpDate;
      },
    },
  ];

  if (configsLoading || loading) {
    return (
      <Box bg="gray.50" minH="100vh" w="100%">
        <Container py="16" maxW="1860px">
          <Stack direction="column" gap="8">
            <PageHeader title="Ownership Internet Portfolio Dashboard" subtitle={`Loading boards... ${loadedCount}/${totalCount}`} />
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} gap="4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height="120px" borderRadius="xl" />)}
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4">
              <Skeleton height="400px" borderRadius="xl" />
              <Skeleton height="400px" borderRadius="xl" />
            </SimpleGrid>
            <Skeleton height="400px" borderRadius="xl" />
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="gray.50" minH="100vh" w="100%">
        <Container py="16" maxW="1860px">
          <Stack direction="column" gap="8">
            <PageHeader title="Ownership Internet Portfolio Dashboard" subtitle="" />
            <Alert.Root colorPalette="red">
              <Alert.Indicator /><Alert.Title>Error Loading Data</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" w="100%">
      <Container py="16" maxW="1860px">
        <Stack direction="column" gap="8">
          <Box mb="4"><Logo size="xl" /></Box>

          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="4">
            <PageHeader
              title="Ownership Internet Portfolio Dashboard"
              subtitle="Portfolio-wide view of internet activation performance across managed properties"
            />
            <Box display="flex" alignItems="center" gap="3" alignSelf="flex-end">
              {isRefreshing && <Badge colorPalette="blue" size="lg" px="3" py="1">Refreshing data...</Badge>}
              <Button variant="outline" onClick={handleManageClick} size="md" disabled={authLoading}>
                <Settings size={16} /> Manage Properties
              </Button>
              <Button variant="outline" onClick={refetch} disabled={isRefreshing} size="md">
                <RefreshCw size={16} /> Refresh Data
              </Button>
            </Box>
          </Box>

          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} gap="4">
            <KPICard value={kpiMetrics.totalProperties} label="Total Properties" icon={<Building2 size={32} />} />
            <KPICard value={kpiMetrics.totalUnits.toLocaleString()} label="Active Group Total" icon={<Home size={32} />} />
            <KPICard value={kpiMetrics.activeCount.toLocaleString()} label="Active" icon={<CheckCircle size={32} />} />
            <KPICard value={kpiMetrics.nonActiveCount.toLocaleString()} label="Non-Active" icon={<AlertCircle size={32} />} />
            <KPICard value={`${kpiMetrics.activationRate}%`} label="Activation Rate" icon={<TrendingUp size={32} />} />
          </SimpleGrid>

          <Box bg="white" p="4" borderRadius="xl" border="1px solid" borderColor="gray.200">
            <Select.Root
              collection={propertyOptions}
              value={[selectedProperty]}
              onValueChange={(e) => setSelectedProperty(e.value[0])}
              size="md"
              width="340px"
            >
              <Select.Label>Select Property</Select.Label>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="Choose property..." /></Select.Trigger>
              </Select.Control>
              <Select.Content>
                {propertyOptions.items.map((item) => (
                  <Select.Item item={item} key={item.value}>{item.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <SimpleGrid columns={{ base: 1, xl: isPortfolioView ? 2 : 1 }} gap="4">
            {isPortfolioView && (
              <ChartCard title="Property Comparison" subtitle="Active and Non-Active by property">
                <Bar
                  data={propertyComparison}
                  xField="property"
                  series={[{ key: 'active', yField: 'Active' }, { key: 'nonactive', yField: 'Non-Active' }]}
                  layout="vertical"
                  groupMode="grouped"
                  showLegend
                  colors={[BUCKET_COLORS['Active'], BUCKET_COLORS['Non-Active']]}
                />
              </ChartCard>
            )}
            <ChartCard
              title={isPortfolioView ? 'Portfolio Distribution' : `${selectedProperty} Status Distribution`}
              subtitle="Status bucket breakdown"
            >
              <Pie data={bucketDistribution} colors={[BUCKET_COLORS['Active'], BUCKET_COLORS['Non-Active']]} showLegend />
            </ChartCard>
          </SimpleGrid>

          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p="6">
            {isPortfolioView
              ? <TableComponent structure={summaryTableStructure} items={propertySummary} />
              : <TableComponent structure={detailTableStructure} items={currentItems} />}
          </Box>
        </Stack>
      </Container>

      {/* Password Modal */}
      <Dialog.Root open={passwordOpen} onOpenChange={(e) => (e.open ? onPasswordOpen() : handlePasswordClose())}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px">
              <Dialog.Header>
                <Dialog.Title>{isSettingPassword ? 'Set Admin Password' : 'Admin Authentication Required'}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap="4" align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    {isSettingPassword
                      ? 'Set a password to secure the property management panel. Minimum 6 characters.'
                      : 'Enter the admin password to access property board management.'}
                  </Text>
                  <Field.Root invalid={!!passwordError}>
                    <Field.Label>Password</Field.Label>
                    <Input
                      type="password"
                      placeholder={isSettingPassword ? 'Enter new password' : 'Enter password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                      autoFocus
                    />
                    {passwordError && <Field.ErrorText>{passwordError}</Field.ErrorText>}
                  </Field.Root>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={handlePasswordClose}>Cancel</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="blue" onClick={handlePasswordSubmit} disabled={isVerifying || !passwordInput}>
                  {isVerifying ? 'Verifying...' : isSettingPassword ? 'Set Password' : 'Submit'}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <AdminPanel
        open={adminOpen && isAuthenticated}
        onClose={onAdminClose}
        boardConfigs={boardConfigs}
        onAddBoard={addBoard}
        onUpdateBoard={updateBoard}
        onRemoveBoard={removeBoard}
        onSave={saveBoardConfigs}
      />
    </Box>
  );
};

export default App;
