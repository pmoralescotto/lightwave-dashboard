import { useState } from 'react';
import { Box, VStack, HStack, Text, Input, Button, IconButton, Separator } from '@chakra-ui/react';
import { X, Plus, Trash2, Edit2, Save, AlertCircle } from 'lucide-react';

const AdminPanel = ({ open, onClose, boardConfigs = [], onAddBoard, onUpdateBoard, onRemoveBoard, onSave }) => {
  const [newBoardId, setNewBoardId] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleAddBoard = () => {
    setValidationError('');
    if (!newBoardId.trim() || !newBoardName.trim()) {
      setValidationError('Board ID and Property Name are required');
      return;
    }
    if (boardConfigs.some((c) => c.id === newBoardId.trim())) {
      setValidationError('Board ID already exists');
      return;
    }
    onAddBoard({ id: newBoardId.trim(), name: newBoardName.trim() });
    setNewBoardId('');
    setNewBoardName('');
  };

  const handleSaveEdit = (boardId) => {
    if (!editName.trim()) { setValidationError('Property Name cannot be empty'); return; }
    onUpdateBoard(boardId, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
    setValidationError('');
  };

  const handleDelete = (boardId) => {
    if (window.confirm('Remove this property board?')) onRemoveBoard(boardId);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const result = await onSave();
    setSaving(false);
    if (result.success) alert('Board configurations saved successfully!');
    else alert(`Failed to save: ${result.error}`);
  };

  return (
    <>
      <Box position="fixed" top="0" left="0" right="0" bottom="0" bg="blackAlpha.600" zIndex="999" onClick={onClose} />
      <Box position="fixed" top="0" right="0" w={{ base: 'full', md: '520px' }} h="100vh" bg="white" boxShadow="2xl" zIndex="1000" overflowY="auto">
        <HStack p="4" borderBottom="1px solid" borderColor="gray.200" justify="space-between" position="sticky" top="0" bg="white" zIndex="10">
          <VStack align="start" gap="0">
            <Text fontWeight="700" fontSize="lg" color="gray.900">Manage Property Boards</Text>
            <Text fontSize="sm" color="gray.500">{boardConfigs.length} properties configured</Text>
          </VStack>
          <IconButton size="sm" variant="ghost" onClick={onClose} rounded="lg"><X size={18} /></IconButton>
        </HStack>

        <VStack p="4" gap="4" align="stretch">
          <Box p="4" bg="blue.50" borderRadius="xl" borderWidth="1px" borderColor="blue.200">
            <Text fontSize="sm" fontWeight="600" color="blue.700" mb="3">Add New Property Board</Text>
            <VStack gap="3" align="stretch">
              <Box>
                <Text fontSize="xs" color="gray.600" mb="1" fontWeight="500">Board ID *</Text>
                <Input size="sm" placeholder="e.g., 18381708169" value={newBoardId} onChange={(e) => setNewBoardId(e.target.value)} borderColor="blue.300" />
                <Text fontSize="xs" color="gray.500" mt="1">Find in board URL: monday.com/boards/<strong>[board-id]</strong></Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600" mb="1" fontWeight="500">Property Name *</Text>
                <Input size="sm" placeholder="e.g., 52 at Park" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} borderColor="blue.300" />
              </Box>
              {validationError && (
                <HStack gap="2" color="red.600" bg="red.50" p="2" borderRadius="md">
                  <AlertCircle size={14} />
                  <Text fontSize="xs">{validationError}</Text>
                </HStack>
              )}
              <Button size="sm" colorPalette="blue" onClick={handleAddBoard} w="full"><Plus size={14} /> Add Property Board</Button>
            </VStack>
          </Box>

          <Separator />

          <Box>
            <Text fontSize="sm" fontWeight="600" color="gray.700" mb="3">Current Property Boards</Text>
            <VStack gap="2" align="stretch">
              {boardConfigs.length === 0 ? (
                <Box p="4" textAlign="center" bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.500">No boards configured yet</Text>
                </Box>
              ) : (
                boardConfigs.map((config) => (
                  <Box key={config.id} p="3" bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                    {editingId === config.id ? (
                      <VStack gap="2" align="stretch">
                        <Input size="sm" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                        <HStack gap="2">
                          <Button size="xs" colorPalette="green" onClick={() => handleSaveEdit(config.id)} flex="1"><Save size={12} /> Save</Button>
                          <Button size="xs" variant="outline" onClick={() => { setEditingId(null); setEditName(''); }} flex="1">Cancel</Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <HStack justify="space-between">
                        <VStack align="start" gap="0" flex="1">
                          <Text fontWeight="600" fontSize="sm" color="gray.900">{config.name}</Text>
                          <Text fontSize="xs" color="gray.500" fontFamily="mono">ID: {config.id}</Text>
                        </VStack>
                        <HStack gap="1">
                          <IconButton size="xs" variant="ghost" colorPalette="blue" onClick={() => { setEditingId(config.id); setEditName(config.name); }}><Edit2 size={14} /></IconButton>
                          <IconButton size="xs" variant="ghost" colorPalette="red" onClick={() => handleDelete(config.id)}><Trash2 size={14} /></IconButton>
                        </HStack>
                      </HStack>
                    )}
                  </Box>
                ))
              )}
            </VStack>
          </Box>

          <Separator />

          <Box p="4" bg="green.50" borderRadius="xl" borderWidth="1px" borderColor="green.200">
            <Text fontSize="xs" color="green.700" mb="2">Changes are saved to browser storage and persist across sessions.</Text>
            <Button colorPalette="green" onClick={handleSaveAll} disabled={saving} w="full">
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </VStack>
      </Box>
    </>
  );
};

export default AdminPanel;
