import { useMemo, useState } from 'react';
import {
  Box, Stack, SimpleGrid, Text, HStack, VStack,
  Badge, Button, Skeleton, Alert, Select, createListCollection,
} from '@chakra-ui/react';
import { Activity, TrendingUp, UserPlus, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import KPICard from './KPICard';
import { useXumoBoardData, getCurrentWeekStart } from '../hooks/useXumoBoardData';
import { BOARD_CONFIGS } from '../utils/boardConfigs';

// ── CSV helpers ───────────────────────────────────────────────────────────────

const triggerDownload = (csvRows, filename) => {
  const bom  = '﻿';
  const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const buildWeekCSV = (properties, weekStart) => {
  const rows = ['"Week of","Property","Unit / Name","Event","Date"'];
  properties.forEach((p) => {
    const wl = p.weeklyLog?.[weekStart];
    if (!wl) return;
    wl.activations.forEach((item) => {
      const date = (item.updated_at || '').replace('T', ' ').slice(0, 16);
      rows.push(`"${weekStart}","${p.property}","${item.name}","Activated","${date}"`);
    });
    wl.signUps.forEach((item) => {
      const date = (item.created_at || '').replace('T', ' ').slice(0, 16);
      rows.push(`"${weekStart}","${p.property}","${item.name}","New Sign-up","${date}"`);
    });
  });
  return rows;
};

const buildAllWeeksCSV = (properties) => {
  const rows = ['"Week of","Property","Unit / Name","Event","Date"'];
  properties.forEach((p) => {
    Object.entries(p.weeklyLog || {})
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([week, wl]) => {
        wl.activations.forEach((item) => {
          const date = (item.updated_at || '').replace('T', ' ').slice(0, 16);
          rows.push(`"${week}","${p.property}","${item.name}","Activated","${date}"`);
        });
        wl.signUps.forEach((item) => {
          const date = (item.created_at || '').replace('T', ' ').slice(0, 16);
          rows.push(`"${week}","${p.property}","${item.name}","New Sign-up","${date}"`);
        });
      });
  });
  return rows;
};

const buildPropertySummaryCSV = (properties) => {
  const rows = ['"Property","New Sign-ups (Pending)","Total Activations","This Week Activations"'];
  const thisWeek = getCurrentWeekStart();
  properties.forEach((p) => {
    const thisWeekActs = p.weeklyLog?.[thisWeek]?.activations?.length || 0;
    rows.push(`"${p.property}","${p.totalSignUps}","${p.totalActivations}","${thisWeekActs}"`);
  });
  return rows;
};

// ── Week label helper ─────────────────────────────────────────────────────────

const formatWeekLabel = (weekStart) => {
  const d   = new Date(weekStart + 'T00:00:00');
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${d.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
};

// ── Property Card ─────────────────────────────────────────────────────────────

const PropertyCard = ({ data }) => {
  const thisWeek        = getCurrentWeekStart();
  const thisWeekActs    = data.weeklyLog?.[thisWeek]?.activations?.length || 0;
  const thisWeekSignups = data.weeklyLog?.[thisWeek]?.signUps?.length     || 0;

  const handleDownload = () => {
    const rows = ['"Property","Unit / Name","Event","Date"'];
    data.activationItems.forEach((item) => {
      const date = (item.updated_at || '').replace('T', ' ').slice(0, 16);
      rows.push(`"${data.property}","${item.name}","Activated","${date}"`);
    });
    data.signUpItems.forEach((item) => {
      const date = (item.created_at || '').replace('T', ' ').slice(0, 16);
      rows.push(`"${data.property}","${item.name}","New Sign-up","${date}"`);
    });
    const safe = data.property.replace(/[^a-z0-9]/gi, '-');
    triggerDownload(rows, `${safe}_All-Time.csv`);
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      borderTop="4px solid"
      borderTopColor="purple.400"
      p="5"
      boxShadow="sm"
      _hover={{ boxShadow: 'md' }}
      transition="box-shadow 0.2s"
    >
      <VStack align="start" gap="3">
        <HStack justify="space-between" w="full" align="start">
          <Text fontWeight="700" fontSize="sm" color="gray.800" lineClamp={2} flex="1">
            {data.property}
          </Text>
          {thisWeekActs > 0 && (
            <Badge colorPalette="green" size="sm" flexShrink={0}>+{thisWeekActs} this week</Badge>
          )}
        </HStack>

        <HStack gap="4" w="full">
          <VStack align="start" gap="0" flex="1">
            <Text fontSize="2xl" fontWeight="900" color="purple.600">
              {data.totalActivations}
            </Text>
            <Text fontSize="xs" color="gray.500">Activations</Text>
          </VStack>
          <VStack align="start" gap="0" flex="1">
            <Text fontSize="2xl" fontWeight="900" color="blue.600">
              {data.totalSignUps}
            </Text>
            <Text fontSize="xs" color="gray.500">Pending Sign-ups</Text>
          </VStack>
        </HStack>

        <Box w="full" pt="2" borderTop="1px solid" borderColor="gray.100">
          <HStack justify="space-between" flexWrap="wrap" gap="2">
            <VStack align="start" gap="0">
              {thisWeekActs > 0 && (
                <Text fontSize="xs" color="green.600">✅ {thisWeekActs} activated this week</Text>
              )}
              {thisWeekSignups > 0 && (
                <Text fontSize="xs" color="blue.600">📝 {thisWeekSignups} new sign-ups</Text>
              )}
              {thisWeekActs === 0 && thisWeekSignups === 0 && (
                <Text fontSize="xs" color="gray.400">No activity this week</Text>
              )}
            </VStack>
            <Button size="xs" variant="ghost" colorPalette="purple" onClick={handleDownload} title="Download all-time CSV">
              <Download size={12} />
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

// ── Weekly Run Log ────────────────────────────────────────────────────────────

const WeeklyRunLog = ({ properties }) => {
  const [filterProperty, setFilterProperty] = useState('all');
  const thisWeek = getCurrentWeekStart();

  const propOptions = useMemo(() =>
    createListCollection({
      items: [
        { label: 'All Properties', value: 'all' },
        ...properties
          .slice()
          .sort((a, b) => a.property.localeCompare(b.property))
          .map((p) => ({ label: p.property, value: p.property })),
      ],
    }),
  [properties]);

  const filteredProps = useMemo(() =>
    filterProperty === 'all'
      ? properties
      : properties.filter((p) => p.property === filterProperty),
  [properties, filterProperty]);

  const weeklyRows = useMemo(() => {
    const byWeek = {};
    filteredProps.forEach((p) => {
      Object.entries(p.weeklyLog || {}).forEach(([week, wl]) => {
        if (!byWeek[week]) byWeek[week] = { week, signUps: 0, activations: 0 };
        byWeek[week].signUps     += wl.signUps.length;
        byWeek[week].activations += wl.activations.length;
      });
    });
    const sorted = Object.values(byWeek).sort((a, b) => b.week.localeCompare(a.week));
    let running  = 0;
    const withTotals = [...sorted].reverse().map((row) => {
      running += row.activations;
      return { ...row, runningTotal: running };
    });
    return withTotals.reverse();
  }, [filteredProps]);

  const handleDownloadWeek = (week) => {
    const rows  = buildWeekCSV(filteredProps, week);
    const label = filterProperty === 'all' ? 'All-Properties' : filterProperty.replace(/[^a-z0-9]/gi, '-');
    triggerDownload(rows, `Weekly-Activations_${label}_${week}.csv`);
  };

  const handleDownloadAll = () => {
    const rows  = buildAllWeeksCSV(filteredProps);
    const label = filterProperty === 'all' ? 'All-Properties' : filterProperty.replace(/[^a-z0-9]/gi, '-');
    const today = new Date().toISOString().split('T')[0];
    triggerDownload(rows, `Weekly-Report_${label}_${today}.csv`);
  };

  return (
    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={{ base: '4', md: '6' }}>
      <HStack justify="space-between" mb="4" flexWrap="wrap" gap="3">
        <VStack align="start" gap="0">
          <Text fontWeight="700" fontSize="md" color="gray.900">Weekly Run Log</Text>
          <Text fontSize="sm" color="gray.500">Sign-ups and activations by week — download anytime</Text>
        </VStack>
        <HStack gap="2" flexWrap="wrap">
          <Select.Root
            collection={propOptions}
            value={[filterProperty]}
            onValueChange={(e) => setFilterProperty(e.value[0])}
            size="sm"
            width={{ base: 'full', sm: '210px' }}
          >
            <Select.Control>
              <Select.Trigger><Select.ValueText /></Select.Trigger>
            </Select.Control>
            <Select.Content>
              {propOptions.items.map((item) => (
                <Select.Item item={item} key={item.value}>{item.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Button size="sm" variant="outline" colorPalette="purple" onClick={handleDownloadAll}>
            <Download size={14} /> Download All
          </Button>
        </HStack>
      </HStack>

      <Box overflowX="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              {['Week', 'New Sign-ups', 'Activations', 'Running Total', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeklyRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  No activity recorded yet
                </td>
              </tr>
            ) : (
              weeklyRows.map((row, idx) => {
                const isCurrent = row.week === thisWeek;
                return (
                  <tr
                    key={row.week}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isCurrent ? '#faf5ff' : (idx % 2 === 0 ? 'white' : '#fafafa'),
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#334155', minWidth: '200px' }}>
                      <HStack gap="2">
                        <Text>{formatWeekLabel(row.week)}</Text>
                        {isCurrent && <Badge colorPalette="blue" size="sm">Current</Badge>}
                      </HStack>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      {row.signUps > 0 ? (
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
                          {row.signUps}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      {row.activations > 0 ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                          +{row.activations}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px', fontSize: '15px', fontWeight: '800', color: '#7c3aed' }}>
                      {row.runningTotal}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <Button size="xs" variant="outline" onClick={() => handleDownloadWeek(row.week)} title={`Download CSV for week of ${row.week}`}>
                        <Download size={12} /> CSV
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

// ── Activation Section ────────────────────────────────────────────────────────

const ActivationSection = () => {
  const { properties, loading, isRefreshing, error, loadedCount, totalCount, refetch } =
    useXumoBoardData(BOARD_CONFIGS);

  const thisWeek = getCurrentWeekStart();

  const kpis = useMemo(() => {
    const totalActivations    = properties.reduce((s, p) => s + p.totalActivations, 0);
    const totalSignUps        = properties.reduce((s, p) => s + p.totalSignUps, 0);
    const thisWeekActivations = properties.reduce(
      (s, p) => s + (p.weeklyLog?.[thisWeek]?.activations?.length || 0), 0
    );
    return { totalProperties: properties.length, totalSignUps, totalActivations, thisWeekActivations };
  }, [properties, thisWeek]);

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => a.property.localeCompare(b.property)),
    [properties]
  );

  const handleDownloadSummary = () => {
    const rows  = buildPropertySummaryCSV(sortedProperties);
    const today = new Date().toISOString().split('T')[0];
    triggerDownload(rows, `Property-Activation-Summary_${today}.csv`);
  };

  if (loading) {
    return (
      <Box py={{ base: '6', md: '10' }} px={{ base: '4', md: '8', lg: '10' }} maxW="1860px" mx="auto">
        <Stack gap="6">
          <HStack gap="3">
            <Activity size={28} color="#9333ea" />
            <Box>
              <Text fontSize="2xl" fontWeight="700" color="gray.900">Activation Tracking</Text>
              <Text fontSize="sm" color="gray.500">Loading boards… {loadedCount}/{totalCount}</Text>
            </Box>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} height="120px" borderRadius="xl" />)}
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4">
            {BOARD_CONFIGS.map((_, i) => <Skeleton key={i} height="160px" borderRadius="xl" />)}
          </SimpleGrid>
          <Skeleton height="420px" borderRadius="xl" />
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box py="10" px={{ base: '4', md: '8', lg: '10' }} maxW="1860px" mx="auto">
        <Alert.Root colorPalette="red">
          <Alert.Indicator />
          <Alert.Title>Error Loading Activation Data</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <Box py={{ base: '6', md: '10' }} px={{ base: '4', md: '8', lg: '10' }} maxW="1860px" mx="auto">
      <Stack gap={{ base: '5', md: '8' }}>

        <HStack justify="space-between" flexWrap="wrap" gap="3">
          <VStack align="start" gap="1">
            <HStack gap="2">
              <Activity size={24} color="#9333ea" />
              <Text fontSize="2xl" fontWeight="800" color="gray.900">Activation Tracking</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Device sign-ups and activations across {properties.length} properties
            </Text>
          </VStack>
          <HStack gap="2">
            <Button size="sm" variant="outline" onClick={handleDownloadSummary}>
              <Download size={14} /> Property Summary
            </Button>
            <Button size="sm" variant="outline" onClick={refetch} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4">
          <KPICard value={kpis.totalProperties} label="Properties" icon={<Activity size={32} />} color="purple" />
          <KPICard value={kpis.totalSignUps.toLocaleString()} label="Pending Sign-ups" icon={<UserPlus size={32} />} color="blue" />
          <KPICard value={kpis.totalActivations.toLocaleString()} label="Total Activations" icon={<CheckCircle2 size={32} />} color="green" />
          <KPICard value={kpis.thisWeekActivations.toLocaleString()} label="Activated This Week" icon={<TrendingUp size={32} />} color="orange" />
        </SimpleGrid>

        <Box>
          <Text fontWeight="700" fontSize="md" color="gray.700" mb="4">Activation by Property</Text>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4">
            {sortedProperties.map((p) => (
              <PropertyCard key={p.boardId} data={p} />
            ))}
          </SimpleGrid>
        </Box>

        <WeeklyRunLog properties={sortedProperties} />

      </Stack>
    </Box>
  );
};

export default ActivationSection;
