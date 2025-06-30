import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Download,
    Upload,
    Trash2,
    Edit3,
    Save,
    X,
    RefreshCw,
    Database,
    Timer,
    AlertCircle,
    CheckCircle,
    Filter,
    Copy,
    Sun,
    Moon
} from 'lucide-react';

const ITEMS_PER_PAGE = 50;

function App() {
    const [storageData, setStorageData] = useState({ localStorage: {}, sessionStorage: {} });
    const [activeTab, setActiveTab] = useState('localStorage');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingKey, setEditingKey] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showNewItemForm, setShowNewItemForm] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        loadStorageData();

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleMessage = (message) => {
        if (message.type === 'STORAGE_DATA') {
            setStorageData(message.data);
            setCurrentUrl(message.data.url);
            setIsLoading(false);
        } else if (message.type === 'STORAGE_OPERATION_RESULT') {
            if (message.result.success) {
                showNotification('Operation completed successfully', 'success');
                loadStorageData();
            } else {
                showNotification(`Error: ${message.result.error}`, 'error');
            }
        }
    };

    const loadStorageData = async () => {
        setIsLoading(true);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { type: 'GET_STORAGE_DATA' });
        } catch (error) {
            showNotification('Failed to load storage data', 'error');
            setIsLoading(false);
        }
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const sendMessage = async (message) => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                showNotification('No active tab found', 'error');
                return;
            }

            console.log('Sending message to tab:', tab.id, message);
            await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.message.includes('Could not establish connection')) {
                showNotification('Content script not loaded. Please refresh the page and try again.', 'error');
            } else {
                showNotification(`Failed to communicate with page: ${error.message}`, 'error');
            }
        }
    };

    const currentStorageData = storageData[activeTab] || {};

    const filteredData = useMemo(() => {
        const entries = Object.entries(currentStorageData);
        if (!searchTerm) return entries;

        return entries.filter(([key, value]) =>
            key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [currentStorageData, searchTerm]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const handleEdit = (key, value) => {
        setEditingKey(key);
        setEditingValue(value);
    };

    const handleSave = async () => {
        await sendMessage({
            type: 'SET_STORAGE_ITEM',
            storageType: activeTab,
            key: editingKey,
            value: editingValue
        });
        setEditingKey(null);
        setEditingValue('');
    };

    const handleDelete = async (key) => {
        if (confirm(`Are you sure you want to delete "${key}"?`)) {
            await sendMessage({
                type: 'DELETE_STORAGE_ITEM',
                storageType: activeTab,
                key: key
            });
        }
    };

    const handleClear = async () => {
        if (confirm(`Are you sure you want to clear all ${activeTab} data?`)) {
            await sendMessage({
                type: 'CLEAR_STORAGE',
                storageType: activeTab
            });
        }
    };

    const handleAddNew = async () => {
        if (!newKey.trim()) {
            showNotification('Key cannot be empty', 'error');
            return;
        }

        await sendMessage({
            type: 'SET_STORAGE_ITEM',
            storageType: activeTab,
            key: newKey,
            value: newValue
        });

        setNewKey('');
        setNewValue('');
        setShowNewItemForm(false);
    };

    const handleExport = () => {
        const dataToExport = searchTerm ?
            Object.fromEntries(filteredData) :
            currentStorageData;

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)],
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await sendMessage({
                    type: 'IMPORT_STORAGE',
                    storageType: activeTab,
                    data: data
                });
                showNotification('Data imported successfully', 'success');
            } catch (error) {
                showNotification('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const formatValue = (value) => {
        if (typeof value === 'string' && value.length > 100) {
            return value.substring(0, 100) + '...';
        }
        return value;
    };

    const getStorageSize = (data) => {
        const size = JSON.stringify(data).length;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleCopy = (value) => {
        navigator.clipboard.writeText(value)
            .then(() => showNotification('Value copied to clipboard', 'success'))
            .catch(() => showNotification('Failed to copy', 'error'));
    };

    const toggleExpand = (key) => {
        setExpandedRows(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleDarkMode = () => setDarkMode((prev) => !prev);

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Storage Manager Pro🔗</h1>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Toggle dark mode"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={loadStorageData}
                            disabled={isLoading}
                            className="p-2 text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {currentUrl && (
                    <div className="text-sm mb-4 truncate px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded" title={currentUrl}>
                        📍 {currentUrl}
                    </div>
                )}



                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {['localStorage', 'sessionStorage'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setCurrentPage(1);
                                setSearchTerm('');
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
        ${activeTab === tab
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}
      `}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                {tab === 'localStorage' ? (
                                    <Database className="w-4 h-4" />
                                ) : (
                                    <Timer className="w-4 h-4" />
                                )}
                                <span>{tab}</span>
                                <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full">
                                    {Object.keys(storageData[tab] || {}).length}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search keys or values..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowNewItemForm(true)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                        Add New
                    </button>

                    <button
                        onClick={handleExport}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-1"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <label className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer flex items-center space-x-1">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>

                    <button
                        onClick={handleClear}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-1"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All</span>
                    </button>

                    <div className="ml-auto text-sm text-gray-600 dark:text-gray-300 flex items-center space-x-4">
                        <span>Size: {getStorageSize(currentStorageData)}</span>
                        <span>Items: {filteredData.length}</span>
                    </div>
                </div>
            </div>

            {/* New Item Form */}
            {showNewItemForm && (
                <div className="bg-blue-50 dark:bg-gray-900 border-b border-blue-200 dark:border-blue-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-blue-900 dark:text-blue-200">Add New Item</h3>
                        <button
                            onClick={() => setShowNewItemForm(false)}
                            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Key"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="px-3 py-2 border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                        <input
                            type="text"
                            placeholder="Value"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="px-3 py-2 border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                        Add Item
                    </button>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div className={`p-3 ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    notification.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                        'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    } border-b flex items-center space-x-2`}>
                    {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm">{notification.message}</span>
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                ) : paginatedData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <Database className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p>No storage items found</p>
                            {searchTerm && <p className="text-sm">Try adjusting your search</p>}
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-auto scrollbar-thin">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Key
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedData.map(([key, value]) => (
                                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono break-all max-w-xs">
                                            {key}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-200">
                                            {editingKey === key ? (
                                                <div className="flex items-center space-x-2">
                                                    <textarea
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                        rows="3"
                                                    />
                                                    <div className="flex flex-col space-y-1">
                                                        <button
                                                            onClick={handleSave}
                                                            className="p-1 text-green-600 hover:text-green-800"
                                                            title="Save"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingKey(null)}
                                                            className="p-1 text-gray-600 hover:text-gray-800"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-mono break-all max-w-md">
                                                    {typeof value === 'string' && value.length > 100 ? (
                                                        <>
                                                            {expandedRows[key] ? value : value.substring(0, 100) + '...'}
                                                            <button
                                                                onClick={() => toggleExpand(key)}
                                                                className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                                                            >
                                                                {expandedRows[key] ? 'Show less' : 'Show more'}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        value
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex space-x-1">
                                                {editingKey !== key && (
                                                    <>
                                                        <button
                                                            onClick={() => handleCopy(value)}
                                                            className="p-1 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-100"
                                                            title="Copy Value"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(key, value)}
                                                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(key)}
                                                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-200">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} results
                    </div>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 border rounded text-sm ${currentPage === pageNum
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;